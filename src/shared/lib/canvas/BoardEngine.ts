// src/shared/lib/canvas/BoardEngine.ts

import type { BoardObject, CanvasTool, Point } from "@/entities/board";
import type { BoardConfig } from "./types";

export class BoardEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Camera
  private scale: number = 1;
  private pan: Point = { x: 0, y: 0 };

  // Instruments and State
  private activeTool: CanvasTool = "select";
  private isPanning: boolean = false;
  private isDrawing: boolean = false;
  private startPan: Point = { x: 0, y: 0 };
  private drawStartWorld: Point = { x: 0, y: 0 };

  // Board objects
  private objects: BoardObject[] = [];
  private draftObject: BoardObject | null = null;

  // Default drawing style
  private readonly defaultStroke = "#a8a2d0";
  private readonly defaultStrokeWidth = 2;

  // Config for board
  private config: BoardConfig = {
    chunkSize: 600, // Размер одного чанка в мировых координатах
    totalChunks: 200,
    gridCols: 14, // Примерно под 200 чанков (сетка ~14x14)
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Failed to get 2D context from canvas");
    this.ctx = context;

    this.initListeners();
    this.resize();
  }

  public setTool(tool: CanvasTool): void {
    this.activeTool = tool;
    this.isDrawing = false;
    this.draftObject = null;
    this.updateCursor();
    this.render();
  }

  public setConfig(totalChunks: 100 | 200 | 400): void {
    this.config.totalChunks = totalChunks;
    this.config.gridCols = Math.ceil(Math.sqrt(totalChunks));
    this.render();
  }

  public getScalePercent(): number {
    return Math.round(this.scale * 100);
  }

  public getObjectsCount(): number {
    return this.objects.length;
  }

  private updateCursor(): void {
    if (this.isPanning) {
      this.canvas.style.cursor = "grabbing";
      return;
    }
    switch (this.activeTool) {
      case "select":
        this.canvas.style.cursor = "default";
        break;
      case "eraser":
        this.canvas.style.cursor = "cell";
        break;
      default:
        this.canvas.style.cursor = "crosshair";
        break;
    }
  }

  public screenToWorld(clientX: number, clientY: number): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - this.pan.x) / this.scale,
      y: (clientY - rect.top - this.pan.y) / this.scale,
    };
  }

  private initListeners() {
    window.addEventListener("resize", this.resize);
    window.addEventListener("mouseup", this.onMouseUp);

    this.canvas.addEventListener("mousedown", this.onMouseDown);
    this.canvas.addEventListener("mousemove", this.onMouseMove);

    this.canvas.addEventListener("contextmenu", this.onContextMenu);
    this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
  }

  public destroy() {
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("mouseup", this.onMouseUp);

    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    this.canvas.removeEventListener("mousemove", this.onMouseMove);

    this.canvas.removeEventListener("contextmenu", this.onContextMenu);
    this.canvas.removeEventListener("wheel", this.onWheel);
  }

  private onContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
  };

  private resize = () => {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;
    this.render();
  };

  private onMouseDown = (e: MouseEvent) => {
    if (e.button === 1 || e.button === 2) {
      this.isPanning = true;
      this.startPan = {
        x: e.clientX - this.pan.x,
        y: e.clientY - this.pan.y,
      };
      this.updateCursor();
      return;
    }

    if (e.button !== 0) return;

    const worldPos = this.screenToWorld(e.clientX, e.clientY);

    if (this.activeTool === "eraser") {
      this.isDrawing = true;
      this.eraseAt(worldPos);
      return;
    }

    if (this.activeTool === "select" || this.activeTool === "text") {
      return;
    }

    this.isDrawing = true;
    this.drawStartWorld = worldPos;
    const id = crypto.randomUUID();

    switch (this.activeTool) {
      case "rectangle":
        this.draftObject = {
          id,
          type: "rectangle",
          x: worldPos.x,
          y: worldPos.y,
          width: 0,
          height: 0,
          strokeColor: this.defaultStroke,
          strokeWidth: this.defaultStrokeWidth,
        };
        break;
      case "circle":
        this.draftObject = {
          id,
          type: "circle",
          x: worldPos.x,
          y: worldPos.y,
          radiusX: 0,
          radiusY: 0,
          strokeColor: this.defaultStroke,
          strokeWidth: this.defaultStrokeWidth,
        };
        break;
      case "line":
        this.draftObject = {
          id,
          type: "line",
          start: { ...worldPos },
          end: { ...worldPos },
          strokeColor: this.defaultStroke,
          strokeWidth: this.defaultStrokeWidth,
        };
        break;
      case "pen":
        this.draftObject = {
          id,
          type: "pen",
          points: [{ ...worldPos }],
          strokeColor: this.defaultStroke,
          strokeWidth: this.defaultStrokeWidth,
        };
        break;
    }

    this.render();
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isPanning) {
      this.pan.x = e.clientX - this.startPan.x;
      this.pan.y = e.clientY - this.startPan.y;
      this.render();
    }

    if (!this.isDrawing) return;

    const currentWorld = this.screenToWorld(e.clientX, e.clientY);

    if (this.activeTool === "eraser") {
      this.eraseAt(currentWorld);
      return;
    }

    if (!this.draftObject) return;

    switch (this.draftObject.type) {
      case "rectangle": {
        this.draftObject.x = Math.min(this.drawStartWorld.x, currentWorld.x);
        this.draftObject.y = Math.min(this.drawStartWorld.y, currentWorld.y);
        this.draftObject.width = Math.abs(
          currentWorld.x - this.drawStartWorld.x,
        );
        this.draftObject.height = Math.abs(
          currentWorld.y - this.drawStartWorld.y,
        );
        break;
      }
      case "circle": {
        const minX = Math.min(this.drawStartWorld.x, currentWorld.x);
        const minY = Math.min(this.drawStartWorld.y, currentWorld.y);
        const radiusX = Math.abs(currentWorld.x - this.drawStartWorld.x) / 2;
        const radiusY = Math.abs(currentWorld.y - this.drawStartWorld.y) / 2;
        this.draftObject.x = minX + radiusX;
        this.draftObject.y = minY + radiusY;
        this.draftObject.radiusX = radiusX;
        this.draftObject.radiusY = radiusY;
        break;
      }
      case "line": {
        this.draftObject.end = { ...currentWorld };
        break;
      }
      case "pen": {
        this.draftObject.points.push({ ...currentWorld });
        break;
      }
    }

    this.render();
  };

  private onMouseUp = () => {
    if (this.isPanning) {
      this.isPanning = false;
      this.updateCursor();
      return;
    }

    if (!this.isDrawing) return;
    this.isDrawing = false;

    if (this.draftObject) {
      if (this.isObjectValid(this.draftObject)) {
        this.objects.push(this.draftObject);
      }
      this.draftObject = null;
      this.render();
    }
  };

  private isObjectValid(obj: BoardObject): boolean {
    switch (obj.type) {
      case "rectangle":
        return obj.width > 2 && obj.height > 2;
      case "circle":
        return obj.radiusX > 2 && obj.radiusY > 2;
      case "line":
        return Math.hypot(obj.end.x - obj.start.x, obj.end.y - obj.start.y) > 2;
      case "pen":
        return obj.points.length > 1;
    }
  }

  private eraseAt(point: Point): void {
    const threshold = 10 / this.scale;
    const prevLength = this.objects.length;

    this.objects = this.objects.filter(
      (obj) => !this.hitTest(obj, point, threshold),
    );

    if (this.objects.length !== prevLength) {
      this.render();
    }
  }

  private hitTest(obj: BoardObject, p: Point, pad: number): boolean {
    switch (obj.type) {
      case "rectangle":
        return (
          p.x >= obj.x - pad &&
          p.x <= obj.x + obj.width + pad &&
          p.y >= obj.y - pad &&
          p.y <= obj.y + obj.height + pad
        );
      case "circle":
        return (
          p.x >= obj.x - obj.radiusX - pad &&
          p.x <= obj.x + obj.radiusX + pad &&
          p.y >= obj.y - obj.radiusY - pad &&
          p.y <= obj.y + obj.radiusY + pad
        );
      case "line": {
        const minX = Math.min(obj.start.x, obj.end.x) - pad;
        const maxX = Math.max(obj.start.x, obj.end.x) + pad;
        const minY = Math.min(obj.start.y, obj.end.y) - pad;
        const maxY = Math.max(obj.start.y, obj.end.y) + pad;
        return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
      }
      case "pen":
        return obj.points.some(
          (pt) => Math.hypot(pt.x - p.x, pt.y - p.y) <= pad,
        );
    }
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();

    const zoomFactor = 1.1;
    const oldScale = this.scale;

    this.scale =
      e.deltaY < 0 ? this.scale * zoomFactor : this.scale / zoomFactor;
    this.scale = Math.max(0.1, Math.min(5, this.scale));

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    this.pan.x = mouseX - (mouseX - this.pan.x) * (this.scale / oldScale);
    this.pan.y = mouseY - (mouseY - this.pan.y) * (this.scale / oldScale);

    this.render();
  };

  public render = (): void => {
    const { width, height } = this.canvas;

    this.ctx.save();
    this.ctx.fillStyle = "#131318";
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.translate(this.pan.x, this.pan.y);
    this.ctx.scale(this.scale, this.scale);

    this.drawGridAndChunks();

    for (const obj of this.objects) {
      this.drawObject(obj);
    }

    if (this.draftObject) {
      this.drawObject(this.draftObject);
    }

    this.ctx.restore();
  };

  private drawObject(obj: BoardObject): void {
    this.ctx.save();
    this.ctx.strokeStyle = obj.strokeColor;
    this.ctx.lineWidth = obj.strokeWidth;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    switch (obj.type) {
      case "rectangle":
        this.ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        break;
      case "circle":
        this.ctx.beginPath();
        this.ctx.ellipse(
          obj.x,
          obj.y,
          obj.radiusX,
          obj.radiusY,
          0,
          0,
          Math.PI * 2,
        );
        this.ctx.stroke();
        break;
      case "line":
        this.ctx.beginPath();
        this.ctx.moveTo(obj.start.x, obj.start.y);
        this.ctx.lineTo(obj.end.x, obj.end.y);
        this.ctx.stroke();
        break;
      case "pen":
        if (obj.points.length < 2) break;
        this.ctx.beginPath();
        this.ctx.moveTo(obj.points[0].x, obj.points[0].y);
        for (let i = 1; i < obj.points.length; i++) {
          this.ctx.lineTo(obj.points[i].x, obj.points[i].y);
        }
        this.ctx.stroke();
        break;
    }

    this.ctx.restore();
  }

  private drawGridAndChunks(): void {
    const { chunkSize, gridCols } = this.config;
    const rows = Math.ceil(this.config.totalChunks / gridCols);

    const totalWidth = gridCols * chunkSize;
    const totalHeight = rows * chunkSize;

    this.ctx.fillStyle = "#16161c";
    this.ctx.fillRect(0, 0, totalWidth, totalHeight);

    this.ctx.lineWidth = 1 / this.scale;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const x = c * chunkSize;
        const y = r * chunkSize;

        this.ctx.strokeStyle = "#2a2a35";
        this.ctx.strokeRect(x, y, chunkSize, chunkSize);

        this.ctx.fillStyle = "#5c5c6b";
        this.ctx.font = "12px Inter, sans-serif";
        this.ctx.fillText(`[${c}, ${r}]`, x + 16, y + 24);

        this.drawSubGrid(x, y, chunkSize);
      }
    }
  }

  private drawSubGrid(startX: number, startY: number, size: number): void {
    const step = 40;
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.025)";
    this.ctx.lineWidth = 1 / this.scale;

    this.ctx.beginPath();
    for (let x = startX + step; x < startX + size; x += step) {
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, startY + size);
    }
    for (let y = startY + step; y < startY + size; y += step) {
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(startX + size, y);
    }
    this.ctx.stroke();
  }
}
