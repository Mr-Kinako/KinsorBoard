// src/entities/board/lib/renderer.ts

import type { BoardConfig, BoardObject } from "../model/types";
import type { ViewportCamera } from "./camera";
import { getObjectBounds } from "./geometry";

export class BoardRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public render(
    width: number,
    height: number,
    camera: ViewportCamera,
    config: BoardConfig,
    objects: readonly BoardObject[],
    draftObject: BoardObject | null,
    selectedObjectId: string | null,
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

    if (draftObject) {
      this.drawObject(draftObject);
    }

    this.ctx.restore();
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
