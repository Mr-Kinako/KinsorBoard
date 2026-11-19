// src/widgets/navigator/ui/Navigator.tsx

import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaMap } from "react-icons/fa6";
import { FaPlus, FaMinus } from "react-icons/fa";
import { RiResetLeftLine } from "react-icons/ri";
import type { BoardEngine } from "@/entities/board";
import type { MinimapTransform } from "@/entities/board";
import styles from "./Navigator.module.scss";

interface NavigatorProps {
  engine: BoardEngine | null;
  zoomPercent: number;
}

export const Navigator: React.FC<NavigatorProps> = ({
  engine,
  zoomPercent,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const transformRef = useRef<MinimapTransform | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !engine) return;

    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    transformRef.current = engine.renderMinimap(ctx, width, height);
  }, [engine]);

  useEffect(() => {
    redraw();
    if (!engine) return;
    return engine.subscribe(redraw);
  }, [engine, redraw]);

  const jumpToClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      const tr = transformRef.current;
      if (!canvas || !tr || !engine) return;

      const rect = canvas.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;

      const worldX = (localX - tr.offsetX) / tr.scale;
      const worldY = (localY - tr.offsetY) / tr.scale;

      engine.focusWorldPoint({ x: worldX, y: worldY });
    },
    [engine],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    jumpToClientPoint(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    jumpToClientPoint(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  };

  return (
    <section className={styles.navigator} aria-label="Board navigator">
      <div className={styles.header}>
        <span className={styles.headerIcon}>
          <FaMap />
        </span>
        <span className={styles.title}>Navigator</span>
      </div>

      <div className={styles.mapBox}>
        <canvas
          ref={canvasRef}
          className={styles.mapCanvas}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => setIsDragging(false)}
        />
      </div>

      <div className={styles.controls}>
        <div className={styles.zoomGroup}>
          <button
            type="button"
            className={styles.controlBtn}
            onClick={() => engine?.zoomOut()}
            title="Zoom out"
            aria-label="Zoom out"
          >
            <FaMinus />
          </button>
          <span className={styles.zoomLabel}>{zoomPercent}%</span>
          <button
            type="button"
            className={styles.controlBtn}
            onClick={() => engine?.zoomIn()}
            title="Zoom in"
            aria-label="Zoom in"
          >
            <FaPlus />
          </button>
        </div>

        <button
          type="button"
          className={styles.controlBtn}
          onClick={() => engine?.resetView()}
          title="Reset view"
          aria-label="Reset view"
        >
          <RiResetLeftLine />
        </button>
      </div>
    </section>
  );
};
