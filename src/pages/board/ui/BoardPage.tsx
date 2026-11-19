// src/pages/board/ui/BoardPage.tsx

import React, { useEffect, useRef, useState } from "react";
import { BoardEngine } from "@/entities/board";
import type { CanvasTool } from "@/entities/board";
import { Topbar } from "@/widgets/topbar";
import { Toolbar } from "@/widgets/toolbar";
import styles from "./BoardPage.module.scss";

const SHORTCUT_MAP: Record<string, CanvasTool> = {
  v: "select",
  r: "rectangle",
  o: "circle",
  l: "line",
  p: "pen",
  t: "text",
  e: "eraser",
};

export const BoardPage: React.FC = () => {
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [activeTool, setActiveTool] = useState<CanvasTool>("select");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<BoardEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new BoardEngine(canvasRef.current);
    engineRef.current = engine;

    const interval = setInterval(() => {
      if (engineRef.current) {
        setZoomPercent(engineRef.current.getScalePercent());
      }
    }, 100);

    return () => {
      clearInterval(interval);
      engine.destroy();
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setTool(activeTool);
  }, [activeTool]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const tool = SHORTCUT_MAP[e.key.toLowerCase()];
      if (tool) {
        setActiveTool(tool);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className={styles.boardContainer}>
      <Topbar />
      <Toolbar activeTool={activeTool} onSelectTool={setActiveTool} />

      <canvas ref={canvasRef} className={styles.canvas} />

      <div className={styles.hud}>
        <span>🔍 {zoomPercent}%</span>
        <span>|</span>
        <span>Grid: 200 Chunks</span>
      </div>
    </div>
  );
};
