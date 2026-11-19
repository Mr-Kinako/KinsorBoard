// src/entities/board/lib/BoardEngine.ts

import type {
  BoardConfig,
  BoardObject,
  CanvasTool,
  ChunkPreset,
  Point,
} from "../model/types";
import { ViewportCamera } from "./camera";
import {
  clampPointToBoard,
  hitTestObject,
  isObjectValid,
  isPointInsideBoard,
  translateObject,
} from "./geometry";
import { BoardRenderer } from "./renderer";
import {
  createDraftObject,
  createTextObject,
  updateDraftObject,
} from "./tools";

export class BoardEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private camera = new ViewportCamera();
  private renderer: BoardRenderer;

  private activeTool: CanvasTool = "select";
  private isSpacePressed = false;
  private isPanning = false;
  private isDrawing = false;
  private isDraggingObject = false;

  private lastScreenPos: Point | null = null;
  private drawStartWorld: Point = { x: 0, y: 0 };
  private lastDragWorld: Point = { x: 0, y: 0 };

  private objects: BoardObject[] = [];
  private draftObject: BoardObject | null = null;
  private selectedObjectId: string | null = null;

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

  public getConfig(): BoardConfig {
    return { ...this.config };
  }

  public setTool(tool: CanvasTool): void {
    this.activeTool = tool;
    this.resetInteractionState();
    if (tool !== "select") this.selectedObjectId = null;
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
    this.draftObject = createDraftObject(this.activeTool, worldPos);
    this.render();
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (e.buttons === 0) {
      if (this.isPanning || this.isDrawing || this.isDraggingObject) {
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
    );
  };
}
