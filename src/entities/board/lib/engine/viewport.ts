// src/entities/board/lib/engine/viewport.ts

import type { BoardConfig, BoardObject, Point } from "../../model/types";
import { ViewportCamera } from "./camera";
import { clampPointToBoard } from "./geometry";
import type { BoardRenderer } from "./renderer";

export class BoardViewport {
  public readonly camera = new ViewportCamera();

  public zoomIn(viewportWidth: number, viewportHeight: number): void {
    this.camera.zoomByStep("in", {
      x: viewportWidth / 2,
      y: viewportHeight / 2,
    });
  }

  public zoomOut(viewportWidth: number, viewportHeight: number): void {
    this.camera.zoomByStep("out", {
      x: viewportWidth / 2,
      y: viewportHeight / 2,
    });
  }

  public resetView(): void {
    this.camera.resetView();
  }

  public resetZoom(viewportWidth: number, viewportHeight: number): void {
    this.camera.resetZoom(viewportWidth, viewportHeight);
  }

  public focusWorldPoint(
    worldPoint: Point,
    config: BoardConfig,
    viewportWidth: number,
    viewportHeight: number,
  ): void {
    const bounded = clampPointToBoard(worldPoint, config);
    this.camera.centerOnWorld(bounded, viewportWidth, viewportHeight);
  }

  public getScalePercent(): number {
    return this.camera.getScalePercent();
  }

  public renderMinimap(
    renderer: BoardRenderer,
    minimapCtx: CanvasRenderingContext2D,
    mapWidth: number,
    mapHeight: number,
    canvasWidth: number,
    canvasHeight: number,
    config: BoardConfig,
    objects: BoardObject[],
  ) {
    return renderer.renderMinimap(
      minimapCtx,
      mapWidth,
      mapHeight,
      canvasWidth,
      canvasHeight,
      this.camera,
      config,
      objects,
    );
  }
}
