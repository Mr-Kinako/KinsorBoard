// src/entities/board/lib/engine/subscriptions.ts

type Listener = () => void;

export class EngineSubscriptions {
  private listeners = new Set<Listener>();

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}
