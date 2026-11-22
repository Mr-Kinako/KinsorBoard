// src/widgets/bottom-bar/ui/BottomBar.tsx

import React from "react";
import styles from "./BottomBar.module.scss";

interface BottomBarProps {
  objectsCount: number;
  hasUnsavedChanges: boolean;
  onClearBoard: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  objectsCount,
  hasUnsavedChanges,
  onClearBoard,
}) => {
  const saveStatusLabel = hasUnsavedChanges ? "Unsaved" : "No changes";

  return (
    <footer className={styles.bottomBar} aria-label="Board status bar">
      <div className={styles.group}>
        <span className={styles.metric} title="Save status">
          Save: <strong>{saveStatusLabel}</strong>
        </span>

        <span className={styles.divider} />

        <span className={styles.metric} title="Objects on board">
          Objects: <strong>{objectsCount}</strong>
        </span>
      </div>

      <div className={styles.group}>
        {/* TODO: Кнопка сброса зума (отдельно от панорамирования) */}

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
