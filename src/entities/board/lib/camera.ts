// src/entities/board/lib/camera.ts

import type { Point } from '../model/types';

export class ViewportCamera {
  public scale = 1;
  public pan: Point = { x: 0, y: 0 };

  private readonly minScale = 0.1;
  private readonly maxScale = 5;
  private readonly zoomFactor = 1.1;

  public screenToWorld(clientX: number, clientY: number, rect: DOMRect): Point {
    return {
      x: (clientX - rect.left - this.pan.x) / this.scale,
      y: (clientY - rect.top - this.pan.y) / this.scale,
    };
  }

  public zoomAt(deltaY: number, clientX: number, clientY: number, rect: DOMRect): void {
    const oldScale = this.scale;
    const nextScale =
      deltaY < 0 ? this.scale * this.zoomFactor : this.scale / this.zoomFactor;

    this.scale = Math.max(this.minScale, Math.min(this.maxScale, nextScale));

    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    this.pan.x = mouseX - (mouseX - this.pan.x) * (this.scale / oldScale);
    this.pan.y = mouseY - (mouseY - this.pan.y) * (this.scale / oldScale);
  }

  public getScalePercent(): number {
    return Math.round(this.scale * 100);
  }
}
