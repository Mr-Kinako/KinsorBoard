// src/entities/board/lib/geometry.ts

import type { BoardObject, BoundingBox, Point } from "../model/types";

export function translateObject(
  obj: BoardObject,
  dx: number,
  dy: number,
): void {
  switch (obj.type) {
    case "rectangle":
    case "circle":
    case "text":
      obj.x += dx;
      obj.y += dy;
      break;
    case "line":
      obj.start.x += dx;
      obj.start.y += dy;
      obj.end.x += dx;
      obj.end.y += dy;
      break;
    case "pen":
      for (const pt of obj.points) {
        pt.x += dx;
        pt.y += dy;
      }
      break;
  }
}

export function getObjectBounds(
  obj: BoardObject,
  ctx: CanvasRenderingContext2D,
): BoundingBox {
  switch (obj.type) {
    case "rectangle":
      return { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
    case "circle":
      return {
        x: obj.x - obj.radiusX,
        y: obj.y - obj.radiusY,
        width: obj.radiusX * 2,
        height: obj.radiusY * 2,
      };
    case "line": {
      const minX = Math.min(obj.start.x, obj.end.x);
      const minY = Math.min(obj.start.y, obj.end.y);
      return {
        x: minX,
        y: minY,
        width: Math.abs(obj.end.x - obj.start.x),
        height: Math.abs(obj.end.y - obj.start.y),
      };
    }
    case "pen": {
      const xs = obj.points.map((p) => p.x);
      const ys = obj.points.map((p) => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      return {
        x: minX,
        y: minY,
        width: Math.max(...xs) - minX,
        height: Math.max(...ys) - minY,
      };
    }
    case "text": {
      ctx.font = `${obj.fontSize}px Inter, sans-serif`;
      const metrics = ctx.measureText(obj.content);
      return {
        x: obj.x,
        y: obj.y - obj.fontSize,
        width: metrics.width,
        height: obj.fontSize * 1.2,
      };
    }
  }
}

export function hitTestObject(
  obj: BoardObject,
  point: Point,
  pad: number,
  ctx: CanvasRenderingContext2D,
): boolean {
  if (obj.type === "pen") {
    return obj.points.some(
      (pt) => Math.hypot(pt.x - point.x, pt.y - point.y) <= pad,
    );
  }
  const b = getObjectBounds(obj, ctx);
  return (
    point.x >= b.x - pad &&
    point.x <= b.x + b.width + pad &&
    point.y >= b.y - pad &&
    point.y <= b.y + b.height + pad
  );
}

export function isObjectValid(obj: BoardObject): boolean {
  switch (obj.type) {
    case "rectangle":
      return obj.width > 2 && obj.height > 2;
    case "circle":
      return obj.radiusX > 2 && obj.radiusY > 2;
    case "line":
      return Math.hypot(obj.end.x - obj.start.x, obj.end.y - obj.start.y) > 2;
    case "pen":
      return obj.points.length > 1;
    case "text":
      return obj.content.trim().length > 0;
  }
}
