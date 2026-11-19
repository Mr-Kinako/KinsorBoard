// src/entities/board/lib/tools.ts

import type { BoardObject, CanvasTool, Point } from "../model/types";

export type DrawableTool = Exclude<
  CanvasTool,
  "select" | "selection-area" | "text" | "image" | "eraser"
>;

const DEFAULT_STROKE = "#a8a2d0";
const DEFAULT_STROKE_WIDTH = 2;
const DEFAULT_FONT_SIZE = 16;

export function createDraftObject(
  tool: DrawableTool,
  pos: Point,
  strokeColor: string = DEFAULT_STROKE,
): BoardObject {
  const base = {
    id: crypto.randomUUID(),
    strokeColor,
    strokeWidth: DEFAULT_STROKE_WIDTH,
  };

  switch (tool) {
    case "rectangle":
      return {
        ...base,
        type: "rectangle",
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
      };
    case "circle":
      return {
        ...base,
        type: "circle",
        x: pos.x,
        y: pos.y,
        radiusX: 0,
        radiusY: 0,
      };
    case "line":
      return { ...base, type: "line", start: { ...pos }, end: { ...pos } };
    case "pen":
      return { ...base, type: "pen", points: [{ ...pos }] };
  }
}

export function updateDraftObject(
  draft: BoardObject,
  start: Point,
  current: Point,
): void {
  switch (draft.type) {
    case "rectangle":
      draft.x = Math.min(start.x, current.x);
      draft.y = Math.min(start.y, current.y);
      draft.width = Math.abs(current.x - start.x);
      draft.height = Math.abs(current.y - start.y);
      break;
    case "circle": {
      const minX = Math.min(start.x, current.x);
      const minY = Math.min(start.y, current.y);
      const radiusX = Math.abs(current.x - start.x) / 2;
      const radiusY = Math.abs(current.y - start.y) / 2;
      draft.x = minX + radiusX;
      draft.y = minY + radiusY;
      draft.radiusX = radiusX;
      draft.radiusY = radiusY;
      break;
    }
    case "line":
      draft.end = { ...current };
      break;
    case "pen":
      draft.points.push({ ...current });
      break;
  }
}

export function createTextObject(
  pos: Point,
  content: string,
  strokeColor: string = DEFAULT_STROKE,
): BoardObject {
  return {
    id: crypto.randomUUID(),
    type: "text",
    x: pos.x,
    y: pos.y,
    content: content.trim(),
    fontSize: DEFAULT_FONT_SIZE,
    strokeColor,
    strokeWidth: 1,
  };
}

export function createImageObject(
  pos: Point,
  src: string,
  width: number,
  height: number,
  strokeColor: string = DEFAULT_STROKE,
): BoardObject {
  return {
    id: crypto.randomUUID(),
    type: "image",
    x: pos.x,
    y: pos.y,
    width,
    height,
    src,
    strokeColor,
    strokeWidth: 1,
  };
}
