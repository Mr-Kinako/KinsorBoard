// src/entities/board/lib/BoardEngine.ts

import type {
  BoardConfig,
  BoardObject,
  CanvasTool,
  ChunkPreset,
  Point,
  SelectionArea,
} from "../model/types";
import { ViewportCamera } from "./camera";
import {
  clampPointToBoard,
  getBoardWorldBounds,
  getObjectBounds,
  hitTestObject,
  isObjectValid,
  isPointInsideBoard,
  translateObject,
} from "./geometry";
import { BoardRenderer } from "./renderer";
import {
  createDraftObject,
  createImageObject,
  createTextObject,
  type DrawableTool,
  updateDraftObject,
} from "./tools";

const MAX_IMAGE_SIDE = 420;

export class BoardEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private camera = new ViewportCamera();
  private renderer: BoardRenderer;
  private listeners = new Set<() => void>();

  private activeTool: CanvasTool = "select";
  private strokeColor = "#a8a2d0";
  private isSpacePressed = false;
  private isPanning = false;
  private isDrawing = false;
  private isDraggingObject = false;
  private isSelectingArea = false;

  private lastScreenPos: Point | null = null;
  private drawStartWorld: Point = { x: 0, y: 0 };
  private lastDragWorld: Point = { x: 0, y: 0 };

  private objects: BoardObject[] = [];
  private draftObject: BoardObject | null = null;
  private selectedObjectId: string | null = null;
  private selectionArea: SelectionArea | null = null;

  private config: BoardConfig = {
    chunkSize: 600,
    totalChunks: 200,
    gridCols: 14,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Failed to get 2D context from canvas");
    this.ctx = context;
    this.renderer = new BoardRenderer(context);

    this.initListeners();
    this.resize();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public setStrokeColor(color: string): void {
    this.strokeColor = color;
  }

  public async addImageFromFile(file: File): Promise<void> {
    if (!file.type.startsWith("image/")) return;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Invalid file reader result"));
        }
      };
      reader.onerror = () =>
        reject(reader.error ?? new Error("File read failed"));
      reader.readAsDataURL(file);
    });

    const dimensions = await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const ratio = Math.min(
            1,
            MAX_IMAGE_SIDE / Math.max(img.naturalWidth, img.naturalHeight),
          );
          resolve({
            width: Math.max(24, Math.round(img.naturalWidth * ratio)),
            height: Math.max(24, Math.round(img.naturalHeight * ratio)),
          });
        };
        img.onerror = () => reject(new Error("Failed to decode image"));
        img.src = dataUrl;
      },
    );

    const centerWorld = this.camera.screenToWorld(
      this.canvas.width / 2,
      this.canvas.height / 2,
      this.canvas.getBoundingClientRect(),
    );
    const worldBounds = getBoardWorldBounds(this.config);
    const clampedPos = clampPointToBoard(
      {
        x: centerWorld.x - dimensions.width / 2,
        y: centerWorld.y - dimensions.height / 2,
      },
      this.config,
    );

    const safeX = Math.max(
      0,
      Math.min(worldBounds.width - dimensions.width, clampedPos.x),
    );
    const safeY = Math.max(
      0,
      Math.min(worldBounds.height - dimensions.height, clampedPos.y),
    );

    const imageObj = createImageObject(
      { x: safeX, y: safeY },
      dataUrl,
      dimensions.width,
      dimensions.height,
      this.strokeColor,
    );

    this.objects.push(imageObj);
    this.selectedObjectId = imageObj.id;
    this.activeTool = "select";
    this.updateCursor();
    this.render();
  }

  public zoomIn(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.camera.zoomByStep("in", { x: rect.width / 2, y: rect.height / 2 });
    this.render();
  }

  public zoomOut(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.camera.zoomByStep("out", { x: rect.width / 2, y: rect.height / 2 });
    this.render();
  }

  public resetView(): void {
    this.camera.resetView();
    this.render();
  }

  public focusWorldPoint(worldPoint: Point): void {
    const bounded = clampPointToBoard(worldPoint, this.config);
    this.camera.centerOnWorld(bounded, this.canvas.width, this.canvas.height);
    this.render();
  }

  public renderMinimap(
    minimapCtx: CanvasRenderingContext2D,
    mapWidth: number,
    mapHeight: number,
  ) {
    return this.renderer.renderMinimap(
      minimapCtx,
      mapWidth,
      mapHeight,
      this.canvas.width,
      this.canvas.height,
      this.camera,
      this.config,
      this.objects,
    );
  }

  public getConfig(): BoardConfig {
    return { ...this.config };
  }

  public setTool(tool: CanvasTool): void {
    this.activeTool = tool;
    this.resetInteractionState();
    if (tool !== "select") {
      this.selectedObjectId = null;
      this.selectionArea = null;
    }
    this.updateCursor();
    this.render();
  }

  public setConfig(totalChunks: ChunkPreset): void {
    this.config.totalChunks = totalChunks;
    this.config.gridCols = Math.ceil(Math.sqrt(totalChunks));
    this.render();
  }

  public getScalePercent(): number {
    return this.camera.getScalePercent();
  }

  public getObjectsCount(): number {
    return this.objects.length;
  }

  private resetInteractionState = (): void => {
    this.isPanning = false;
    this.isDrawing = false;
    this.isDraggingObject = false;
    this.isSelectingArea = false;
    this.lastScreenPos = null;
    this.draftObject = null;
    this.updateCursor();
  };

  private updateCursor(): void {
    if (this.isPanning || this.isDraggingObject) {
      this.canvas.style.cursor = "grabbing";
      return;
    }
    if (this.isSpacePressed) {
      this.canvas.style.cursor = "grab";
      return;
    }
    const cursorMap: Partial<Record<CanvasTool, string>> = {
      select: "default",
      eraser: "cell",
      text: "text",
    };
    this.canvas.style.cursor = cursorMap[this.activeTool] ?? "crosshair";
  }

  private getWorldPoint(clientX: number, clientY: number): Point {
    return this.camera.screenToWorld(
      clientX,
      clientY,
      this.canvas.getBoundingClientRect(),
    );
  }

  private initListeners(): void {
    window.addEventListener("resize", this.resize);
    window.addEventListener("blur", this.onWindowBlur);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);

    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.resetInteractionState);
    this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    this.canvas.addEventListener("contextmenu", this.onContextMenu);
  }

  public destroy(): void {
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("blur", this.onWindowBlur);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);

    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener(
      "pointercancel",
      this.resetInteractionState,
    );
    this.canvas.removeEventListener("wheel", this.onWheel);
    this.canvas.removeEventListener("contextmenu", this.onContextMenu);
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

    if (
      (e.key === "Delete" || e.key === "Backspace") &&
      this.selectedObjectId
    ) {
      this.objects = this.objects.filter(
        (obj) => obj.id !== this.selectedObjectId,
      );
      this.selectedObjectId = null;
      this.render();
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

  private resize = (): void => {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;
    this.render();
  };

  private onPointerDown = (e: PointerEvent): void => {
    const isMiddleClick = e.button === 1;
    const isSpaceDrag = e.button === 0 && this.isSpacePressed;

    if (isMiddleClick || isSpaceDrag) {
      e.preventDefault();
      this.canvas.setPointerCapture(e.pointerId);
      this.isPanning = true;
      this.lastScreenPos = { x: e.clientX, y: e.clientY };
      this.updateCursor();
      return;
    }

    if (e.button !== 0) return;

    const worldPos = this.getWorldPoint(e.clientX, e.clientY);

    if (this.activeTool === "select") {
      const hit = this.findTopObjectAt(worldPos);
      this.selectedObjectId = hit ? hit.id : null;
      if (hit) {
        this.canvas.setPointerCapture(e.pointerId);
        this.isDraggingObject = true;
        this.lastDragWorld = worldPos;
        this.updateCursor();
      }
      this.render();
      return;
    }

    if (this.activeTool === "selection-area") {
      if (!isPointInsideBoard(worldPos, this.config)) return;
      this.canvas.setPointerCapture(e.pointerId);
      this.isSelectingArea = true;
      this.drawStartWorld = worldPos;
      this.selectionArea = {
        x: worldPos.x,
        y: worldPos.y,
        width: 0,
        height: 0,
      };
      this.render();
      return;
    }

    if (this.activeTool === "image") return;

    if (this.activeTool === "text") {
      if (!isPointInsideBoard(worldPos, this.config)) return;
      const content = window.prompt("Enter text:");

      if (content?.trim()) {
        this.objects.push(createTextObject(worldPos, content));
        this.render();
      }
      return;
    }

    if (this.activeTool === "eraser") {
      this.isDrawing = true;
      this.eraseAt(worldPos);
      return;
    }

    if (!isPointInsideBoard(worldPos, this.config)) return;

    this.canvas.setPointerCapture(e.pointerId);
    this.isDrawing = true;
    this.drawStartWorld = worldPos;
    this.draftObject = createDraftObject(
      this.activeTool as DrawableTool,
      worldPos,
      this.strokeColor,
    );
    this.render();
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
        this.render();
      }
      return;
    }

    if (this.isPanning) {
      if (this.lastScreenPos) {
        this.camera.pan.x += e.clientX - this.lastScreenPos.x;
        this.camera.pan.y += e.clientY - this.lastScreenPos.y;
      }
      this.lastScreenPos = { x: e.clientX, y: e.clientY };
      this.render();
      return;
    }

    const currentWorld = this.getWorldPoint(e.clientX, e.clientY);

    if (this.isDraggingObject && this.selectedObjectId) {
      const target = this.objects.find(
        (obj) => obj.id === this.selectedObjectId,
      );
      if (target) {
        translateObject(
          target,
          currentWorld.x - this.lastDragWorld.x,
          currentWorld.y - this.lastDragWorld.y,
          this.config,
          this.ctx,
        );
        this.lastDragWorld = currentWorld;
        this.render();
      }
      return;
    }

    if (this.isSelectingArea) {
      const bounded = clampPointToBoard(currentWorld, this.config);
      this.selectionArea = {
        x: Math.min(this.drawStartWorld.x, bounded.x),
        y: Math.min(this.drawStartWorld.y, bounded.y),
        width: Math.abs(bounded.x - this.drawStartWorld.x),
        height: Math.abs(bounded.y - this.drawStartWorld.y),
      };
      this.render();
      return;
    }

    if (!this.isDrawing) return;

    if (this.activeTool === "eraser") {
      this.eraseAt(currentWorld);
      return;
    }

    if (!this.draftObject) return;

    const boundedWorld = clampPointToBoard(currentWorld, this.config);

    updateDraftObject(this.draftObject, this.drawStartWorld, boundedWorld);
    this.render();
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (this.canvas.hasPointerCapture(e.pointerId)) {
      this.canvas.releasePointerCapture(e.pointerId);
    }

    if (this.isPanning) {
      this.isPanning = false;
      this.lastScreenPos = null;
      this.updateCursor();
      return;
    }

    if (this.isDraggingObject) {
      this.isDraggingObject = false;
      this.updateCursor();
      return;
    }

    if (this.isSelectingArea) {
      this.isSelectingArea = false;
      if (this.selectionArea) {
        const hit = this.findFirstObjectInArea(this.selectionArea);
        this.selectedObjectId = hit ? hit.id : null;
      }
      this.updateCursor();
      this.render();
      return;
    }

    if (!this.isDrawing) return;
    this.isDrawing = false;

    if (this.draftObject) {
      if (isObjectValid(this.draftObject)) {
        this.objects.push(this.draftObject);
      }
      this.draftObject = null;
      this.render();
    }
  };

  private findFirstObjectInArea(area: SelectionArea): BoardObject | null {
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const b = getObjectBounds(this.objects[i], this.ctx);
      const overlaps =
        b.x + b.width >= area.x &&
        b.x <= area.x + area.width &&
        b.y + b.height >= area.y &&
        b.y <= area.y + area.height;
      if (overlaps) return this.objects[i];
    }
    return null;
  }

  private findTopObjectAt(point: Point): BoardObject | null {
    const pad = 8 / this.camera.scale;
    for (let i = this.objects.length - 1; i >= 0; i--) {
      if (hitTestObject(this.objects[i], point, pad, this.ctx)) {
        return this.objects[i];
      }
    }
    return null;
  }

  private eraseAt(point: Point): void {
    const threshold = 10 / this.camera.scale;
    const prevLength = this.objects.length;
    this.objects = this.objects.filter((obj) => {
      const hit = hitTestObject(obj, point, threshold, this.ctx);
      if (hit && obj.id === this.selectedObjectId) this.selectedObjectId = null;
      return !hit;
    });
    if (this.objects.length !== prevLength) this.render();
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this.camera.zoomAt(
      e.deltaY,
      e.clientX,
      e.clientY,
      this.canvas.getBoundingClientRect(),
    );
    this.render();
  };

  public render = (): void => {
    this.renderer.render(
      this.canvas.width,
      this.canvas.height,
      this.camera,
      this.config,
      this.objects,
      this.draftObject,
      this.selectedObjectId,
      this.selectionArea,
    );

    this.notify();
  };
}
