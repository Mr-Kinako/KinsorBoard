// src/entities/board/lib/BoardEngine.ts

import type {
  BoardConfig,
  BoardObject,
  CanvasTool,
  ChunkPreset,
  Point,
  SelectionArea,
} from "../model/types";
import {
  createImageObject,
} from "./engine/tools";

import { EngineSubscriptions } from "./engine/subscriptions";
import { BoardHistory } from "./engine/history";
import {
  clampPointToBoard,
  getBoardWorldBounds,
} from "./engine/geometry";
import { BoardRenderer } from "./engine/renderer";
import { BoardInputController } from "./engine/input";
import { BoardViewport } from "./engine/viewport";

const MAX_IMAGE_SIDE = 420;

export class BoardEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private subscriptions = new EngineSubscriptions();
  private viewport = new BoardViewport();
  private renderer: BoardRenderer;
  private input: BoardInputController;
  private history = new BoardHistory();

  private activeTool: CanvasTool = "select";
  private strokeColor = "#a8a2d0";

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

    this.input = new BoardInputController({
      canvas: this.canvas,
      ctx: this.ctx,
      camera: this.viewport.camera,
      getConfig: () => this.config,
      getActiveTool: () => this.activeTool,
      getStrokeColor: () => this.strokeColor,
      getObjects: () => this.objects,
      setObjects: (next) => {
        this.objects = next;
      },
      getDraftObject: () => this.draftObject,
      setDraftObject: (next) => {
        this.draftObject = next;
      },
      getSelectedObjectId: () => this.selectedObjectId,
      setSelectedObjectId: (id) => {
        this.selectedObjectId = id;
      },
      getSelectionArea: () => this.selectionArea,
      setSelectionArea: (area) => {
        this.selectionArea = area;
      },
      recordHistory: (snapshot) => {
        this.history.record(snapshot ?? this.objects);
      },
      beginDragHistory: () => {
        this.history.beginDrag(this.objects);
      },
      commitDragHistory: () => {
        this.history.commitDrag(this.objects);
      },
      cancelDragHistory: () => {
        this.history.cancelDrag();
      },
      render: this.render,
    });
    this.input.init();
    this.input.resize();
  }

  public subscribe(listener: () => void): () => void {
    return this.subscriptions.subscribe(listener);
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

    const centerWorld = this.viewport.camera.screenToWorld(
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

    this.history.record(this.objects);
    this.objects.push(imageObj);
    this.selectedObjectId = imageObj.id;
    this.activeTool = "select";
    this.input.updateCursor();
    this.render();
  }

  public zoomIn(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.viewport.zoomIn(rect.width, rect.height);
    this.render();
  }

  public zoomOut(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.viewport.zoomOut(rect.width, rect.height);
    this.render();
  }

  public resetView(): void {
    this.viewport.resetView();
    this.render();
  }

  public resetZoom(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.viewport.resetZoom(rect.width, rect.height);
    this.render();
  }

  public focusWorldPoint(worldPoint: Point): void {
    this.viewport.camera.centerOnWorld(worldPoint, this.canvas.width, this.canvas.height);
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
      this.viewport.camera,
      this.config,
      this.objects,
    );
  }

  public getConfig(): BoardConfig {
    return { ...this.config };
  }

  public setTool(tool: CanvasTool): void {
    this.activeTool = tool;
    this.input.resetInteractionState();
    if (tool !== "select") {
      this.selectedObjectId = null;
      this.selectionArea = null;
    }
    this.input.updateCursor();
    this.render();
  }

  public setConfig(totalChunks: ChunkPreset): void {
    this.config.totalChunks = totalChunks;
    this.config.gridCols = Math.ceil(Math.sqrt(totalChunks));
    this.render();
  }

  public getScalePercent(): number {
    return this.viewport.getScalePercent();
  }

  public getObjectsCount(): number {
    return this.objects.length;
  }

  public canUndo(): boolean {
    return this.history.canUndo();
  }

  public canRedo(): boolean {
    return this.history.canRedo();
  }

  public undo(): void {
    const previous = this.history.undo(this.objects);
    if (!previous) return;

    this.objects = previous;
    this.draftObject = null;
    this.selectedObjectId = null;
    this.selectionArea = null;
    this.render();
  }

  public redo(): void {
    const next = this.history.redo(this.objects);
    if (!next) return;

    this.objects = next;
    this.draftObject = null;
    this.selectedObjectId = null;
    this.selectionArea = null;
    this.render();
  }

  public clearBoard(): void {
    if (this.objects.length === 0) return;
    this.history.record(this.objects);
    this.objects = [];
    this.draftObject = null;
    this.selectedObjectId = null;
    this.selectionArea = null;

    this.render();
  }

  public destroy(): void {
    this.input.destroy();
    this.subscriptions.clear();
  }

  public render = (): void => {
    this.renderer.render(
      this.canvas.width,
      this.canvas.height,
      this.viewport.camera,
      this.config,
      this.objects,
      this.draftObject,
      this.selectedObjectId,
      this.selectionArea,
    );

    this.subscriptions.notify();
  };
}
