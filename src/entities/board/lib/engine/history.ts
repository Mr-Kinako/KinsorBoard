// src/entities/board/lib/engine/history.ts

import type { BoardObject } from "../../model/types";

export class BoardHistory {
  private undoStack: BoardObject[][] = [];
  private redoStack: BoardObject[][] = [];
  private dragSnapshot: BoardObject[] | null = null;

  private cloneObjects(source: BoardObject[]): BoardObject[] {
    return source.map((obj) => structuredClone(obj));
  }

  public record(currentObjects: BoardObject[]): void {
    this.undoStack.push(this.cloneObjects(currentObjects));
    this.redoStack = [];
  }

  public beginDrag(currentObjects: BoardObject[]): void {
    this.dragSnapshot = this.cloneObjects(currentObjects);
  }

  public getUndoCount(): number {
    return this.undoStack.length;
  }

  public commitDrag(currentObjects: BoardObject[]): void {
    if (!this.dragSnapshot) return;

    const hasChanged =
      JSON.stringify(this.dragSnapshot) !== JSON.stringify(currentObjects);

    if (hasChanged) {
      this.undoStack.push(this.dragSnapshot);
      this.redoStack = [];
    }

    this.dragSnapshot = null;
  }

  public cancelDrag(): void {
    this.dragSnapshot = null;
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public undo(currentObjects: BoardObject[]): BoardObject[] | null {
    const previous = this.undoStack.pop();
    if (!previous) return null;

    this.redoStack.push(this.cloneObjects(currentObjects));
    return previous;
  }

  public redo(currentObjects: BoardObject[]): BoardObject[] | null {
    const next = this.redoStack.pop();
    if (!next) return null;

    this.undoStack.push(this.cloneObjects(currentObjects));
    return next;
  }
}
