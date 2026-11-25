// src/entities/board/lib/engine/renderer.ts

import type {
  BoardConfig,
  BoardObject,
  SelectionArea,
} from "../../model/types";
import type { ViewportCamera } from "./camera";
import { getBoardWorldBounds, getObjectBounds } from "./geometry";

export interface MinimapTransform {
  offsetX: number;
  offsetY: number;
  drawWidth: number;
  drawHeight: number;
  scale: number;
}

export class BoardRenderer {
  private ctx: CanvasRenderingContext2D;
  private imageCache = new Map<string, HTMLImageElement>();
  private onImageLoaded?: () => void;

  constructor(ctx: CanvasRenderingContext2D, onImageLoaded?: () => void) {
    this.ctx = ctx;
    this.onImageLoaded = onImageLoaded;
  }

  public render(
    width: number,
    height: number,
    camera: ViewportCamera,
    config: BoardConfig,
    objects: readonly BoardObject[],
    draftObject: BoardObject | null,
    selectedObjectId: string | null,
    selectionArea: SelectionArea | null = null,
  ): void {
    this.ctx.save();
    this.ctx.fillStyle = "#131318";
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.translate(camera.pan.x, camera.pan.y);
    this.ctx.scale(camera.scale, camera.scale);

    this.drawGridAndChunks(config, camera.scale);

    for (const obj of objects) {
      this.drawObject(obj);
      if (obj.id === selectedObjectId) {
        this.drawSelectionOutline(obj, camera.scale);
      }
    }

    if (draftObject) this.drawObject(draftObject);
    if (selectionArea) this.drawSelectionArea(selectionArea, camera.scale);

    this.ctx.restore();
  }

  private drawSelectionArea(area: SelectionArea, scale: number): void {
    this.ctx.save();
    this.ctx.fillStyle = "rgba(109, 97, 156, 0.14)";
    this.ctx.strokeStyle = "#a8a2d0";
    this.ctx.lineWidth = 1.5 / scale;
    this.ctx.setLineDash([5 / scale, 4 / scale]);
    this.ctx.fillRect(area.x, area.y, area.width, area.height);
    this.ctx.strokeRect(area.x, area.y, area.width, area.height);
    this.ctx.restore();
  }

  private getCachedImage(src: string): HTMLImageElement | null {
    const existing = this.imageCache.get(src);
    if (existing) {
      return existing.complete && existing.naturalWidth > 0 ? existing : null;
    }

    const img = new Image();

    img.onload = () => {
      this.onImageLoaded?.();
    };
    img.src = src;

    this.imageCache.set(src, img);
    return null;
  }

  public renderMinimap(
    minimapCtx: CanvasRenderingContext2D,
    mapWidth: number,
    mapHeight: number,
    mainCanvasWidth: number,
    mainCanvasHeight: number,
    camera: ViewportCamera,
    config: BoardConfig,
    objects: readonly BoardObject[],
  ): MinimapTransform {
    const world = getBoardWorldBounds(config);
    const pad = 8;
    const availW = Math.max(1, mapWidth - pad * 2);
    const availH = Math.max(1, mapHeight - pad * 2);
    const mapScale = Math.min(availW / world.width, availH / world.height);

    const drawWidth = world.width * mapScale;
    const drawHeight = world.height * mapScale;
    const offsetX = (mapWidth - drawWidth) / 2;
    const offsetY = (mapHeight - drawHeight) / 2;

    minimapCtx.save();
    minimapCtx.clearRect(0, 0, mapWidth, mapHeight);
    minimapCtx.fillStyle = "#16161c";
    minimapCtx.fillRect(0, 0, mapWidth, mapHeight);

    minimapCtx.fillStyle = "#1b1b22";
    minimapCtx.fillRect(offsetX, offsetY, drawWidth, drawHeight);

    const rows = Math.ceil(config.totalChunks / config.gridCols);
    const chunkW = config.chunkSize * mapScale;
    const chunkH = config.chunkSize * mapScale;

    minimapCtx.strokeStyle = "rgba(142, 142, 158, 0.16)";
    minimapCtx.lineWidth = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < config.gridCols; c++) {
        minimapCtx.strokeRect(
          offsetX + c * chunkW,
          offsetY + r * chunkH,
          chunkW,
          chunkH,
        );
      }
    }

    for (const obj of objects) {
      const bounds = getObjectBounds(obj, minimapCtx);
      const ox = offsetX + bounds.x * mapScale;
      const oy = offsetY + bounds.y * mapScale;
      const ow = Math.max(2, bounds.width * mapScale);
      const oh = Math.max(2, bounds.height * mapScale);

      minimapCtx.fillStyle = obj.strokeColor;
      minimapCtx.globalAlpha = 0.75;
      minimapCtx.fillRect(ox, oy, ow, oh);
    }
    minimapCtx.globalAlpha = 1;

    if (mainCanvasWidth > 0 && mainCanvasHeight > 0) {
      const vpWorldX = -camera.pan.x / camera.scale;
      const vpWorldY = -camera.pan.y / camera.scale;
      const vpWorldW = mainCanvasWidth / camera.scale;
      const vpWorldH = mainCanvasHeight / camera.scale;

      const vx = offsetX + vpWorldX * mapScale;
      const vy = offsetY + vpWorldY * mapScale;
      const vw = vpWorldW * mapScale;
      const vh = vpWorldH * mapScale;

      minimapCtx.fillStyle = "rgba(109, 97, 156, 0.14)";
      minimapCtx.strokeStyle = "#7d70b0";
      minimapCtx.lineWidth = 1.5;
      minimapCtx.fillRect(vx, vy, vw, vh);
      minimapCtx.strokeRect(vx, vy, vw, vh);
    }

    minimapCtx.restore();

    return { offsetX, offsetY, drawWidth, drawHeight, scale: mapScale };
  }

  private drawSelectionOutline(obj: BoardObject, scale: number): void {
    const b = getObjectBounds(obj, this.ctx);
    const pad = 6 / scale;

    this.ctx.save();
    this.ctx.strokeStyle = "#6d619c";
    this.ctx.lineWidth = 1.5 / scale;
    this.ctx.setLineDash([4 / scale, 4 / scale]);
    this.ctx.strokeRect(
      b.x - pad,
      b.y - pad,
      b.width + pad * 2,
      b.height + pad * 2,
    );
    this.ctx.restore();
  }

  private drawObject(obj: BoardObject): void {
    this.ctx.save();
    this.ctx.strokeStyle = obj.strokeColor;
    this.ctx.fillStyle = obj.strokeColor;
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
      case "text":
        this.ctx.font = `${obj.fontSize}px Inter, sans-serif`;
        this.ctx.fillText(obj.content, obj.x, obj.y);
        break;
      case "image": {
        const img = this.getCachedImage(obj.src);
        if (img) {
          this.ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
        } else {
          this.ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        }
        break;
      }
    }

    this.ctx.restore();
  }

  private drawGridAndChunks(config: BoardConfig, scale: number): void {
    const { chunkSize, gridCols, totalChunks } = config;
    const rows = Math.ceil(totalChunks / gridCols);

    this.ctx.fillStyle = "#16161c";
    this.ctx.fillRect(0, 0, gridCols * chunkSize, rows * chunkSize);
    this.ctx.lineWidth = 1 / scale;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const x = c * chunkSize;
        const y = r * chunkSize;

        this.ctx.strokeStyle = "#2a2a35";
        this.ctx.strokeRect(x, y, chunkSize, chunkSize);

        this.ctx.fillStyle = "#5c5c6b";
        this.ctx.font = "12px Inter, sans-serif";
        this.ctx.fillText(`[${c}, ${r}]`, x + 16, y + 24);

        this.drawSubGrid(x, y, chunkSize, scale);
      }
    }
  }

  private drawSubGrid(
    startX: number,
    startY: number,
    size: number,
    scale: number,
  ): void {
    const step = 40;
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.025)";
    this.ctx.lineWidth = 1 / scale;

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
