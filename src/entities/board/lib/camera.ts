// src/entities/board/lib/camera.ts

import type { Point } from "../model/types";

export class ViewportCamera {
  public scale = 1;
  public pan: Point = { x: 0, y: 0 };

  private readonly minScale = 0.1;
  private readonly maxScale = 5;
  private readonly zoomFactor = 1.1;
  private readonly stepFactor = 1.25;

  public screenToWorld(clientX: number, clientY: number, rect: DOMRect): Point {
    return {
      x: (clientX - rect.left - this.pan.x) / this.scale,
      y: (clientY - rect.top - this.pan.y) / this.scale,
    };
  }

  public zoomAt(
    deltaY: number,
    clientX: number,
    clientY: number,
    rect: DOMRect,
  ): void {
    const factor = deltaY < 0 ? this.zoomFactor : 1 / this.zoomFactor;
    this.zoomByFactorAt(factor, clientX - rect.left, clientY - rect.top);
  }

  public zoomByStep(direction: "in" | "out", center: Point): void {
    const factor = direction === "in" ? this.stepFactor : 1 / this.stepFactor;
    this.zoomByFactorAt(factor, center.x, center.y);
  }

  public centerOnWorld(
    worldPoint: Point,
    viewportWidth: number,
    viewportHeight: number,
  ): void {
    this.pan.x = viewportWidth / 2 - worldPoint.x * this.scale;
    this.pan.y = viewportHeight / 2 - worldPoint.y * this.scale;
  }

  public resetView(): void {
    this.scale = 1;
    this.pan = { x: 0, y: 0 };
  }

  public resetZoom(viewportWidth: number, viewportHeight: number): void {
    const oldScale = this.scale;
    this.scale = 1;

    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;

    this.pan.x = centerX - (centerX - this.pan.x) * (this.scale / oldScale);
    this.pan.y = centerY - (centerY - this.pan.y) * (this.scale / oldScale);
  }

  public getScalePercent(): number {
    return Math.round(this.scale * 100);
  }

  private zoomByFactorAt(
    factor: number,
    originX: number,
    originY: number,
  ): void {
    const oldScale = this.scale;
    const nextScale = this.scale * factor;
    this.scale = Math.max(this.minScale, Math.min(this.maxScale, nextScale));

    this.pan.x = originX - (originX - this.pan.x) * (this.scale / oldScale);
    this.pan.y = originY - (originY - this.pan.y) * (this.scale / oldScale);
  }
}
