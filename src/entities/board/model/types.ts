// src/entities/board/model/tool.ts

export type CanvasTool =
  "select" | "rectangle" | "circle" | "line" | "pen" | "text" | "eraser";

export interface Point {
  x: number;
  y: number;
}

interface BaseBoardObject {
  id: string;
  strokeColor: string;
  strokeWidth: number;
}

export interface RectObject extends BaseBoardObject {
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleObject extends BaseBoardObject {
  type: "circle";
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
}

export interface LineObject extends BaseBoardObject {
  type: "line";
  start: Point;
  end: Point;
}

export interface PenObject extends BaseBoardObject {
  type: "pen";
  points: Point[];
}

export type BoardObject = RectObject | CircleObject | LineObject | PenObject;
