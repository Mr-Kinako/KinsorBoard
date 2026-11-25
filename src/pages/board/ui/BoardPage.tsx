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
import { BottomBar } from "@/widgets/bottom-bar";
import { ShortcutsHud } from "@/shared/ui/shortcuts-hud/ShortcutsHud";
import { BOARD_SHORTCUT_HINTS, TOOL_SHORTCUT_MAP } from "../model/shortcuts";
import styles from "./BoardPage.module.scss";

export const BoardPage: React.FC = () => {
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [activeTool, setActiveTool] = useState<CanvasTool>("select");
  const [activeColor, setActiveColor] = useState<string>("#a8a2d0");
  const [totalChunks, setTotalChunks] = useState<ChunkPreset>(100);
  const [engineInstance, setEngineInstance] = useState<BoardEngine | null>(
    null,
  );
  const [objectsCount, setObjectsCount] = useState<number>(0);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<BoardEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new BoardEngine(canvasRef.current);
    engineRef.current = engine;
    setEngineInstance(engine);

    const syncBoardState = engine.subscribe(() => {
      if (!engine) return;

      setZoomPercent(engine.getScalePercent());
      setObjectsCount(engine.getObjectsCount());
      setCanUndo(engine.canUndo());
      setCanRedo(engine.canRedo());
      setHasUnsavedChanges(engine.getHasUnsavedChanges());
    });

    return () => {
      syncBoardState();
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
      console.log("KEY:", {
        key: e.key,
        code: e.code,
        target: (e.target as HTMLElement)?.tagName,
        ctrl: e.ctrlKey,
        meta: e.metaKey,
        shift: e.shiftKey,
        alt: e.altKey,
        defaultPrevented: e.defaultPrevented,
      });

      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        return;
      }

      if (e.altKey) return;

      if ((e.ctrlKey || e.metaKey) && e.code.toLowerCase() === "keyz") {
        e.preventDefault();

        if (e.shiftKey) {
          engineRef.current?.redo();
        } else {
          engineRef.current?.undo();
        }
      }

      const tool = TOOL_SHORTCUT_MAP[e.code.toLowerCase()];
      if (tool) {
        setActiveTool(tool);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className={styles.boardContainer}>
      <Topbar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={() => engineRef.current?.undo()}
        onRedo={() => engineRef.current?.redo()}
        onSave={() => {
          void engineRef.current?.saveBoard();
        }}
        onExport={() => {
          void engineRef.current?.exportBoard();
        }}
      />
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

      <ShortcutsHud items={BOARD_SHORTCUT_HINTS} />

      <BottomBar
        zoomPercent={zoomPercent}
        objectsCount={objectsCount}
        hasUnsavedChanges={hasUnsavedChanges}
        onClearBoard={() => engineRef.current?.clearBoard()}
        onResetZoom={() => engineRef.current?.resetZoom()}
      />
    </div>
  );
};
