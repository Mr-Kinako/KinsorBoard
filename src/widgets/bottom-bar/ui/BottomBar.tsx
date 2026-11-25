// src/widgets/bottom-bar/ui/BottomBar.tsx

import React from "react";
import styles from "./BottomBar.module.scss";

interface BottomBarProps {
  zoomPercent: number;
  objectsCount: number;
  hasUnsavedChanges: boolean;
  onResetZoom: () => void;
  onClearBoard: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  zoomPercent,
  objectsCount,
  hasUnsavedChanges,
  onResetZoom,
  onClearBoard,
}) => {
  const saveStatusLabel = hasUnsavedChanges ? "Unsaved" : "Saved";

  return (
    <footer className={styles.bottomBar} aria-label="Board status bar">
      <div className={styles.group}>
        <span className={styles.metric} title="Save status">
          Save:{" "}
          <strong
            className={styles.saveStatus ? styles.unsaved : undefined}
          >
            {saveStatusLabel}
          </strong>
        </span>

        <span className={styles.divider} />

        <span className={styles.metric} title="Objects on board">
          Objects: <strong>{objectsCount}</strong>
        </span>
      </div>

      <div className={styles.group}>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={onResetZoom}
          disabled={zoomPercent === 100}
          title="Reset zoom to 100%"
        >
          {zoomPercent}%
        </button>

        {/* TODO: Кнопка изменения сетки */}

        {/* TODO: Кнопка изменения макета UI */}

        <button
          type="button"
          className={`${styles.actionBtn} ${styles.dangerBtn}`}
          onClick={onClearBoard}
          disabled={objectsCount === 0}
          title="Clear all objects"
        >
          Clear
        </button>
      </div>
    </footer>
  );
};
