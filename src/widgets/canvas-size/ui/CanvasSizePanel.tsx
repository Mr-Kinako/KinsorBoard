// src/widgets/canvas-size/ui/CanvasSizePanel.tsx

import React from "react";
import type { ChunkPreset } from "@/entities/board";
import styles from "./CanvasSizePanel.module.scss";

interface CanvasSizePanelProps {
  totalChunks: ChunkPreset;
  onSelectChunks: (chunks: ChunkPreset) => void;
}

interface PresetOption {
  chunks: ChunkPreset;
  label: string;
}

const PRESETS: PresetOption[] = [
  { chunks: 100, label: "~1K" },
  { chunks: 200, label: "~2K" },
  { chunks: 400, label: "~4K" },
];

export const CanvasSizePanel: React.FC<CanvasSizePanelProps> = ({
  totalChunks,
  onSelectChunks,
}) => {
  const cols = Math.ceil(Math.sqrt(totalChunks));
  const rows = Math.ceil(totalChunks / cols);

  return (
    <section className={styles.panel} aria-label="Canvas size settings">
      <div className={styles.header}>
        <span className={styles.title}>Canvas Size</span>
        <span className={styles.meta}>
          {cols}×{rows} chunks
        </span>
      </div>

      <div className={styles.presets}>
        {PRESETS.map((preset) => {
          const isActive = totalChunks === preset.chunks;
          return (
            <button
              key={preset.chunks}
              type="button"
              className={`${styles.presetBtn} ${isActive ? styles.active : ""}`}
              onClick={() => onSelectChunks(preset.chunks)}
              aria-pressed={isActive}
            >
              <span className={styles.chunksValue}>{preset.chunks}</span>
              <span className={styles.approxSize}>{preset.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
