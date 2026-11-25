// src/entities/board/lib/engine/storage.ts

import type { BoardConfig, BoardObject } from "../../model/types";

const STORAGE_KEY = "kinsorboard:board-state:v1";

export interface SavedBoardSnapshot {
  version: number;
  savedAt: string;
  config: BoardConfig;
  objects: BoardObject[];
}

export class BoardStorage {
  public save(config: BoardConfig, objects: BoardObject[]): boolean {
    try {
      const payload: SavedBoardSnapshot = {
        version: 1,
        savedAt: new Date().toISOString(),
        config,
        objects,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }

  public load(): SavedBoardSnapshot | null {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as Partial<SavedBoardSnapshot>;
      if (!parsed || !Array.isArray(parsed.objects) || !parsed.config) {
        return null;
      }

      return {
        version: typeof parsed.version === "number" ? parsed.version : 1,
        savedAt:
          typeof parsed.savedAt === "string"
            ? parsed.savedAt
            : new Date().toISOString(),
        config: parsed.config,
        objects: parsed.objects,
      };
    } catch {
      return null;
    }
  }

  public clear(): void {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Игнорируем ошибки доступа к storage
    }
  }
}
