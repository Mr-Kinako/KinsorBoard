// src/entities/board/lib/engine/input.ts

import type {
  BoardConfig,
  BoardObject,
  CanvasTool,
  Point,
  SelectionArea,
} from "../../model/types";
import type { ViewportCamera } from "./camera";
import {
  clampPointToBoard,
  getObjectBounds,
  hitTestObject,
  isObjectValid,
  isPointInsideBoard,
  translateObject,
} from "./geometry";
import {
  createDraftObject,
  createTextObject,
  type DrawableTool,
  updateDraftObject,
} from "./tools";

export interface BoardInputHost {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  camera: ViewportCamera;
  getConfig: () => BoardConfig;
  getActiveTool: () => CanvasTool;
  getStrokeColor: () => string;
  getObjects: () => BoardObject[];
  setObjects: (next: BoardObject[]) => void;
  getDraftObject: () => BoardObject | null;
  setDraftObject: (next: BoardObject | null) => void;
  getSelectedObjectId: () => string | null;
  setSelectedObjectId: (id: string | null) => void;
  getSelectionArea: () => SelectionArea | null;
  setSelectionArea: (area: SelectionArea | null) => void;
  recordHistory: (snapshot?: BoardObject[]) => void;
  beginDragHistory: () => void;
  commitDragHistory: () => void;
  cancelDragHistory: () => void;
  render: () => void;
}

export class BoardInputController {
  private host: BoardInputHost;

  private isSpacePressed = false;
  private isPanning = false;
  private isDrawing = false;
  private isDraggingObject = false;
  private isSelectingArea = false;

  private lastScreenPos: Point | null = null;
  private drawStartWorld: Point = { x: 0, y: 0 };
  private lastDragWorld: Point = { x: 0, y: 0 };

  constructor(host: BoardInputHost) {
    this.host = host;
  }

  public init(): void {
    window.addEventListener("resize", this.resize);
    window.addEventListener("blur", this.onWindowBlur);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);

    const { canvas } = this.host;
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.resetInteractionState);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
    canvas.addEventListener("contextmenu", this.onContextMenu);
  }

  public destroy(): void {
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("blur", this.onWindowBlur);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);

    const { canvas } = this.host;
    canvas.removeEventListener("pointerdown", this.onPointerDown);
    canvas.removeEventListener("pointermove", this.onPointerMove);
    canvas.removeEventListener("pointerup", this.onPointerUp);
    canvas.removeEventListener("pointercancel", this.resetInteractionState);
    canvas.removeEventListener("wheel", this.onWheel);
    canvas.removeEventListener("contextmenu", this.onContextMenu);
  }

  public resetInteractionState = (): void => {
    this.isPanning = false;
    this.isDrawing = false;
    this.isDraggingObject = false;
    this.isSelectingArea = false;
    this.lastScreenPos = null;
    this.host.setDraftObject(null);
    this.host.cancelDragHistory();
    this.updateCursor();
  };

  public updateCursor(): void {
    const { canvas } = this.host;
    if (this.isPanning || this.isDraggingObject) {
      canvas.style.cursor = "grabbing";
      return;
    }
    if (this.isSpacePressed) {
      canvas.style.cursor = "grab";
      return;
    }
    const cursorMap: Partial<Record<CanvasTool, string>> = {
      select: "default",
      eraser: "cell",
      text: "text",
    };
    canvas.style.cursor = cursorMap[this.host.getActiveTool()] ?? "crosshair";
  }

  public resize = (): void => {
    const { canvas } = this.host;
    const parent = canvas.parentElement;
    if (!parent) return;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    this.host.render();
  };

  private getWorldPoint(clientX: number, clientY: number): Point {
    return this.host.camera.screenToWorld(
      clientX,
      clientY,
      this.host.canvas.getBoundingClientRect(),
    );
  }

  private onWindowBlur = (): void => {
    this.isSpacePressed = false;
    this.resetInteractionState();
  };

  private onContextMenu = (e: MouseEvent): void => e.preventDefault();

  private onKeyDown = (e: KeyboardEvent): void => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
      e.preventDefault();
      return;
    }

    if (e.code === "Space" && !e.repeat) {
      e.preventDefault();
      this.isSpacePressed = true;
      this.updateCursor();
      return;
    }

    const selectedId = this.host.getSelectedObjectId();
    if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
      this.host.recordHistory();
      this.host.setObjects(
        this.host.getObjects().filter((obj) => obj.id !== selectedId),
      );
      this.host.setSelectedObjectId(null);
      this.host.render();
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (e.code === "Space") {
      this.isSpacePressed = false;
      this.isPanning = false;
      this.lastScreenPos = null;
      this.updateCursor();
    }
  };

  private onPointerDown = (e: PointerEvent): void => {
    const isMiddleClick = e.button === 1;
    const isSpaceDrag = e.button === 0 && this.isSpacePressed;
    const { canvas } = this.host;

    if (isMiddleClick || isSpaceDrag) {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      this.isPanning = true;
      this.lastScreenPos = { x: e.clientX, y: e.clientY };
      this.updateCursor();
      return;
    }

    if (e.button !== 0) return;

    const worldPos = this.getWorldPoint(e.clientX, e.clientY);
    const activeTool = this.host.getActiveTool();
    const config = this.host.getConfig();

    if (activeTool === "select") {
      const hit = this.findTopObjectAt(worldPos);
      this.host.setSelectedObjectId(hit ? hit.id : null);
      if (hit) {
        canvas.setPointerCapture(e.pointerId);
        this.host.beginDragHistory();
        this.isDraggingObject = true;
        this.lastDragWorld = worldPos;
        this.updateCursor();
      }
      this.host.render();
      return;
    }

    if (activeTool === "selection-area") {
      if (!isPointInsideBoard(worldPos, config)) return;
      canvas.setPointerCapture(e.pointerId);
      this.isSelectingArea = true;
      this.drawStartWorld = worldPos;
      this.host.setSelectionArea({
        x: worldPos.x,
        y: worldPos.y,
        width: 0,
        height: 0,
      });
      this.host.render();
      return;
    }

    if (activeTool === "image") return;

    if (activeTool === "text") {
      if (!isPointInsideBoard(worldPos, config)) return;
      const content = window.prompt("Enter text:");
      if (content?.trim()) {
        this.host.recordHistory();
        this.host.setObjects([
          ...this.host.getObjects(),
          createTextObject(worldPos, content),
        ]);
        this.host.render();
      }
      return;
    }

    if (activeTool === "eraser") {
      this.isDrawing = true;
      this.eraseAt(worldPos);
      return;
    }

    if (!isPointInsideBoard(worldPos, config)) return;

    canvas.setPointerCapture(e.pointerId);
    this.isDrawing = true;
    this.drawStartWorld = worldPos;
    this.host.setDraftObject(
      createDraftObject(
        activeTool as DrawableTool,
        worldPos,
        this.host.getStrokeColor(),
      ),
    );
    this.host.render();
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (e.buttons === 0) {
      if (
        this.isPanning ||
        this.isDrawing ||
        this.isDraggingObject ||
        this.isSelectingArea
      ) {
        this.resetInteractionState();
        this.host.render();
      }
      return;
    }

    if (this.isPanning) {
      if (this.lastScreenPos) {
        this.host.camera.pan.x += e.clientX - this.lastScreenPos.x;
        this.host.camera.pan.y += e.clientY - this.lastScreenPos.y;
      }
      this.lastScreenPos = { x: e.clientX, y: e.clientY };
      this.host.render();
      return;
    }

    const currentWorld = this.getWorldPoint(e.clientX, e.clientY);
    const config = this.host.getConfig();
    const selectedId = this.host.getSelectedObjectId();

    if (this.isDraggingObject && selectedId) {
      const target = this.host
        .getObjects()
        .find((obj) => obj.id === selectedId);
      if (target) {
        translateObject(
          target,
          currentWorld.x - this.lastDragWorld.x,
          currentWorld.y - this.lastDragWorld.y,
          config,
          this.host.ctx,
        );
        this.lastDragWorld = currentWorld;
        this.host.render();
      }
      return;
    }

    if (this.isSelectingArea) {
      const bounded = clampPointToBoard(currentWorld, config);
      this.host.setSelectionArea({
        x: Math.min(this.drawStartWorld.x, bounded.x),
        y: Math.min(this.drawStartWorld.y, bounded.y),
        width: Math.abs(bounded.x - this.drawStartWorld.x),
        height: Math.abs(bounded.y - this.drawStartWorld.y),
      });
      this.host.render();
      return;
    }

    if (!this.isDrawing) return;

    if (this.host.getActiveTool() === "eraser") {
      this.eraseAt(currentWorld);
      return;
    }

    const draft = this.host.getDraftObject();
    if (!draft) return;

    const boundedWorld = clampPointToBoard(currentWorld, config);
    updateDraftObject(draft, this.drawStartWorld, boundedWorld);
    this.host.render();
  };

  private onPointerUp = (e: PointerEvent): void => {
    const { canvas } = this.host;
    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }

    if (this.isPanning) {
      this.isPanning = false;
      this.lastScreenPos = null;
      this.updateCursor();
      return;
    }

    if (this.isDraggingObject) {
      this.host.commitDragHistory();
      this.isDraggingObject = false;
      this.updateCursor();
      return;
    }

    if (this.isSelectingArea) {
      this.isSelectingArea = false;
      const area = this.host.getSelectionArea();
      if (area) {
        const hit = this.findFirstObjectInArea(area);
        this.host.setSelectedObjectId(hit ? hit.id : null);
      }
      this.updateCursor();
      this.host.render();
      return;
    }

    if (!this.isDrawing) return;
    this.isDrawing = false;

    const draft = this.host.getDraftObject();
    if (draft) {
      if (isObjectValid(draft)) {
        this.host.recordHistory();
        this.host.setObjects([...this.host.getObjects(), draft]);
      }
      this.host.setDraftObject(null);
      this.host.render();
    }
  };

  private findFirstObjectInArea(area: SelectionArea): BoardObject | null {
    const objects = this.host.getObjects();
    for (let i = objects.length - 1; i >= 0; i--) {
      const b = getObjectBounds(objects[i], this.host.ctx);
      const overlaps =
        b.x + b.width >= area.x &&
        b.x <= area.x + area.width &&
        b.y + b.height >= area.y &&
        b.y <= area.y + area.height;
      if (overlaps) return objects[i];
    }
    return null;
  }

  private findTopObjectAt(point: Point): BoardObject | null {
    const pad = 8 / this.host.camera.scale;
    const objects = this.host.getObjects();
    for (let i = objects.length - 1; i >= 0; i--) {
      if (hitTestObject(objects[i], point, pad, this.host.ctx)) {
        return objects[i];
      }
    }
    return null;
  }

  private eraseAt(point: Point): void {
    const threshold = 10 / this.host.camera.scale;
    const prevObjects = this.host.getObjects();
    let nextSelectedId = this.host.getSelectedObjectId();

    const nextObjects = prevObjects.filter((obj) => {
      const hit = hitTestObject(obj, point, threshold, this.host.ctx);
      if (hit && obj.id === nextSelectedId) {
        nextSelectedId = null;
      }
      return !hit;
    });

    if (nextObjects.length !== prevObjects.length) {
      this.host.recordHistory(prevObjects);
      this.host.setSelectedObjectId(nextSelectedId);
      this.host.setObjects(nextObjects);
      this.host.render();
    }
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this.host.camera.zoomAt(
      e.deltaY,
      e.clientX,
      e.clientY,
      this.host.canvas.getBoundingClientRect(),
    );
    this.host.render();
  };
}
