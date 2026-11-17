// src/shared/lib/canvas/types.ts

export interface Point {
  x: number;
  y: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export type ChunkPreset = 100 | 200 | 400;

export interface BoardConfig {
  chunkSize: number;
  totalChunks: ChunkPreset;
  gridCols: number;
}
