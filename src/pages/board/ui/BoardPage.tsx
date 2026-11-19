import React, { useEffect, useRef, useState } from 'react';
import { BoardEngine } from '@/shared/lib/canvas/BoardEngine';
import { Topbar } from "@/widgets/topbar";
import styles from './BoardPage.module.scss';

export const BoardPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<BoardEngine | null>(null);
  const [zoomPercent, setZoomPercent] = useState<number>(100);

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

  return (
    <div className={styles.boardContainer}>
      <Topbar />

      <canvas ref={canvasRef} className={styles.canvas} />

      <div className={styles.hud}>
        <span>🔍 {zoomPercent}%</span>
        <span>|</span>
        <span>Grid: 200 Chunks</span>
      </div>
    </div>
  );
};
