// src/entities/board/lib/BoardEngine.ts

import type {
  BoardConfig,
  BoardObject,
  CanvasTool,
  ChunkPreset,
  Point,
} from '../model/types';
import { ViewportCamera } from './camera';
import { hitTestObject, isObjectValid, translateObject } from './geometry';
import { BoardRenderer } from './renderer';

export class BoardEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private camera = new ViewportCamera();
  private renderer: BoardRenderer;

  private activeTool: CanvasTool = 'select';
  private isPanning = false;
  private isDrawing = false;
  private isDraggingObject = false;

  private startPan: Point = { x: 0, y: 0 };
  private drawStartWorld: Point = { x: 0, y: 0 };
  private lastDragWorld: Point = { x: 0, y: 0 };

  private objects: BoardObject[] = [];
  private draftObject: BoardObject | null = null;
  private selectedObjectId: string | null = null;

  private readonly defaultStroke = '#a8a2d0';
  private readonly defaultStrokeWidth = 2;
  private readonly defaultFontSize = 16;

  private config: BoardConfig = {
    chunkSize: 600,
    totalChunks: 200,
    gridCols: 14,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to get 2D context from canvas');
    this.ctx = context;
    this.renderer = new BoardRenderer(context);

    this.initListeners();
    this.resize();
  }

  public setTool(tool: CanvasTool): void {
    this.activeTool = tool;
    this.resetInteractionState();
    if (tool !== 'select') {
      this.selectedObjectId = null;
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
    this.draftObject = null;
    this.updateCursor();
  };

  private updateCursor(): void {
    if (this.isPanning || this.isDraggingObject) {
      this.canvas.style.cursor = 'grabbing';
      return;
    }
    switch (this.activeTool) {
      case 'select':
        this.canvas.style.cursor = 'default';
        break;
      case 'eraser':
        this.canvas.style.cursor = 'cell';
        break;
      case 'text':
        this.canvas.style.cursor = 'text';
        break;
      default:
        this.canvas.style.cursor = 'crosshair';
    }
  }

  private getWorldPoint(clientX: number, clientY: number): Point {
    return this.camera.screenToWorld(
      clientX,
      clientY,
      this.canvas.getBoundingClientRect(),
    );
  }

  private initListeners(): void {
    window.addEventListener('resize', this.resize);
    window.addEventListener('blur', this.resetInteractionState);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('keydown', this.onKeyDown);
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
    this.canvas.addEventListener('contextmenu', this.onContextMenu);
  }

  public destroy(): void {
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('blur', this.resetInteractionState);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('keydown', this.onKeyDown);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('wheel', this.onWheel);
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
  }

  private onContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      return;
    }

    if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedObjectId) {
      this.objects = this.objects.filter((obj) => obj.id !== this.selectedObjectId);
      this.selectedObjectId = null;
      this.render();
    }
  };

  private resize = (): void => {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;
    this.render();
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button === 1 || e.button === 2) {
      e.preventDefault();
      this.isPanning = true;
      this.startPan = {
        x: e.clientX - this.camera.pan.x,
        y: e.clientY - this.camera.pan.y,
      };
      this.updateCursor();
      return;
    }

    if (e.button !== 0) return;

    const worldPos = this.getWorldPoint(e.clientX, e.clientY);

    if (this.activeTool === 'select') {
      const hit = this.findTopObjectAt(worldPos);
      this.selectedObjectId = hit ? hit.id : null;
      if (hit) {
        this.isDraggingObject = true;
        this.lastDragWorld = worldPos;
        this.updateCursor();
      }
      this.render();
      return;
    }

    if (this.activeTool === 'text') {
      const content = window.prompt('Enter text:');
      if (content && content.trim().length > 0) {
        this.objects.push({
          id: crypto.randomUUID(),
          type: 'text',
          x: worldPos.x,
          y: worldPos.y,
          content: content.trim(),
          fontSize: this.defaultFontSize,
          strokeColor: this.defaultStroke,
          strokeWidth: 1,
        });
        this.render();
      }
      return;
    }

    if (this.activeTool === 'eraser') {
      this.isDrawing = true;
      this.eraseAt(worldPos);
      return;
    }

    this.isDrawing = true;
    this.drawStartWorld = worldPos;
    this.draftObject = this.createDraftObject(this.activeTool, worldPos);
    this.render();
  };

  private createDraftObject(
    tool: Exclude<CanvasTool, 'select' | 'text' | 'eraser'>,
    pos: Point,
  ): BoardObject {
    const id = crypto.randomUUID();
    const base = {
      id,
      strokeColor: this.defaultStroke,
      strokeWidth: this.defaultStrokeWidth,
    };

    switch (tool) {
      case 'rectangle':
        return { ...base, type: 'rectangle', x: pos.x, y: pos.y, width: 0, height: 0 };
      case 'circle':
        return { ...base, type: 'circle', x: pos.x, y: pos.y, radiusX: 0, radiusY: 0 };
      case 'line':
        return { ...base, type: 'line', start: { ...pos }, end: { ...pos } };
      case 'pen':
        return { ...base, type: 'pen', points: [{ ...pos }] };
    }
  }

  private onMouseMove = (e: MouseEvent): void => {
    // Защита от залипания при потере события mouseup
    if ((this.isPanning || this.isDrawing || this.isDraggingObject) && e.buttons === 0) {
      this.resetInteractionState();
      this.render();
      return;
    }

    if (this.isPanning) {
      this.camera.pan.x = e.clientX - this.startPan.x;
      this.camera.pan.y = e.clientY - this.startPan.y;
      this.render();
      return;
    }

    const currentWorld = this.getWorldPoint(e.clientX, e.clientY);

    if (this.isDraggingObject && this.selectedObjectId) {
      const dx = currentWorld.x - this.lastDragWorld.x;
      const dy = currentWorld.y - this.lastDragWorld.y;
      const target = this.objects.find((obj) => obj.id === this.selectedObjectId);
      if (target) {
        translateObject(target, dx, dy);
        this.lastDragWorld = currentWorld;
        this.render();
      }
      return;
    }

    if (!this.isDrawing) return;

    if (this.activeTool === 'eraser') {
      this.eraseAt(currentWorld);
      return;
    }

    if (!this.draftObject) return;
    this.updateDraftObject(this.draftObject, currentWorld);
    this.render();
  };

  private updateDraftObject(draft: BoardObject, currentWorld: Point): void {
    switch (draft.type) {
      case 'rectangle':
        draft.x = Math.min(this.drawStartWorld.x, currentWorld.x);
        draft.y = Math.min(this.drawStartWorld.y, currentWorld.y);
        draft.width = Math.abs(currentWorld.x - this.drawStartWorld.x);
        draft.height = Math.abs(currentWorld.y - this.drawStartWorld.y);
        break;
      case 'circle': {
        const minX = Math.min(this.drawStartWorld.x, currentWorld.x);
        const minY = Math.min(this.drawStartWorld.y, currentWorld.y);
        const radiusX = Math.abs(currentWorld.x - this.drawStartWorld.x) / 2;
        const radiusY = Math.abs(currentWorld.y - this.drawStartWorld.y) / 2;
        draft.x = minX + radiusX;
        draft.y = minY + radiusY;
        draft.radiusX = radiusX;
        draft.radiusY = radiusY;
        break;
      }
      case 'line':
        draft.end = { ...currentWorld };
        break;
      case 'pen':
        draft.points.push({ ...currentWorld });
        break;
    }
  }

  private onMouseUp = (e: MouseEvent): void => {
    if (this.isPanning && (e.button === 1 || e.button === 2)) {
      this.isPanning = false;
      this.updateCursor();
      return;
    }

    if (e.button !== 0) return;

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
      if (hit && obj.id === this.selectedObjectId) {
        this.selectedObjectId = null;
      }
      return !hit;
    });

    if (this.objects.length !== prevLength) {
      this.render();
    }
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
