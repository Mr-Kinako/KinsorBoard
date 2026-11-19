// src/entities/board/model/types.ts

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectionArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ChunkPreset = 100 | 200 | 400;

export interface BoardConfig {
  chunkSize: number;
  totalChunks: ChunkPreset;
  gridCols: number;
}

export type CanvasTool =
  | "select"
  | "selection-area"
  | "rectangle"
  | "circle"
  | "line"
  | "pen"
  | "text"
  | "image"
  | "eraser";

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

export interface TextObject extends BaseBoardObject {
  type: "text";
  x: number;
  y: number;
  content: string;
  fontSize: number;
}

export interface ImageObject extends BaseBoardObject {
  type: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
}

export type BoardObject =
  RectObject | CircleObject | LineObject | PenObject | TextObject | ImageObject;
