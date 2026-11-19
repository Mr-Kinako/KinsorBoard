// src/pages/board/ui/BoardPage.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  BoardEngine,
  type CanvasTool,
  type ChunkPreset,
} from "@/entities/board";
import { Topbar } from "@/widgets/topbar";
import { Toolbar } from "@/widgets/toolbar";
import { CanvasSizePanel } from "@/widgets/canvas-size";
import { Navigator } from "@/widgets/navigator";
import styles from "./BoardPage.module.scss";

const SHORTCUT_MAP: Record<string, CanvasTool> = {
  v: "select",
  s: "selection-area",
  r: "rectangle",
  o: "circle",
  l: "line",
  p: "pen",
  t: "text",
  i: "image",
  e: "eraser",
};

export const BoardPage: React.FC = () => {
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [activeTool, setActiveTool] = useState<CanvasTool>("select");
  const [activeColor, setActiveColor] = useState<string>("#a8a2d0");
  const [totalChunks, setTotalChunks] = useState<ChunkPreset>(100);
  const [engineInstance, setEngineInstance] = useState<BoardEngine | null>(
    null,
  );
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<BoardEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new BoardEngine(canvasRef.current);
    engineRef.current = engine;
    setEngineInstance(engine);

    const unsubscribe = engine.subscribe(() => {
      setZoomPercent(engine.getScalePercent());
    });

    return () => {
      unsubscribe();
      engine.destroy();
      engineRef.current = null;
      setEngineInstance(null);
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setTool(activeTool);
  }, [activeTool]);

  useEffect(() => {
    engineRef.current?.setStrokeColor(activeColor);
  }, [activeColor]);

  useEffect(() => {
    engineRef.current?.setConfig(totalChunks);
  }, [totalChunks]);

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
      <Toolbar
        activeTool={activeTool}
        activeColor={activeColor}
        onSelectTool={setActiveTool}
        onSelectColor={setActiveColor}
        onPickImageFile={(file) => {
          void engineRef.current?.addImageFromFile(file);
        }}
      />

      <canvas ref={canvasRef} className={styles.canvas} />

      <CanvasSizePanel
        totalChunks={totalChunks}
        onSelectChunks={setTotalChunks}
      />

      <Navigator engine={engineInstance} zoomPercent={zoomPercent} />

      <div className={styles.hud}>
        <span>🔍 {zoomPercent}%</span>
        <span>|</span>
        <span>Grid: {totalChunks} Chunks</span>
      </div>
    </div>
  );
};
