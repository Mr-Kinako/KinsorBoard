// src/widgets/topbar/ui/Topbar.tsx

import React, { useState } from "react";
import { APP_NAME, APP_VERSION } from "@/shared/info";
import {
  LuSave,
  LuPen,
  LuUndo2,
  LuRedo2,
  LuArrowUpFromLine,
  LuSettings,
} from "react-icons/lu";
import styles from "./Topbar.module.scss";
import icon from "../../../../public/kitty-icon.png";

const DEFAULT_TITLE: string = "Untitled Board";

export const Topbar: React.FC = () => {
  const [boardTitle, setBoardTitle] = useState<string>("Untitled Board");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const hasIcon: string | null = icon;

  const commitTitle = () => {
    const trimmed = boardTitle.trim();
    setBoardTitle(trimmed || DEFAULT_TITLE);
    setIsEditing(false);
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.brand}>
        <div className={styles.logoIcon}>
          {hasIcon ? (
            <img src={hasIcon} alt="Logo" className={styles.logo} />
          ) : (
            <span className={styles.logoPlaceholder}>K</span>
          )}
        </div>
        <a
          href="https://github.com/Mr-Kinako/KinsorBoard"
          className={styles.brandName}
          target="_blank"
          rel="noopener noreferrer"
          title="В данный момент ведёт на GitHub"
        >
          {APP_NAME}
        </a>
        <span className={styles.version}>v{APP_VERSION}</span>
      </div>

      <div className={styles.titleSection}>
        {isEditing ? (
          <div className={styles.inputWrapper}>
            <span className={styles.inputSizer} aria-hidden="true">
              {boardTitle || DEFAULT_TITLE}
            </span>

            <input
              type="text"
              className={styles.titleInput}
              value={boardTitle}
              autoFocus
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => setBoardTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") {
                  commitTitle();
                }
              }}
            />
          </div>
        ) : (
          <div
            className={`${styles.titleDisplay} ${styles.disabled}`}
            onClick={() => setIsEditing(false)}
            title="Click to rename"
          >
            <span className={`${styles.titleText} ${styles.disabled}`}>{boardTitle}</span>
            <span className={styles.editIcon}>
              <LuPen />
            </span>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <div className={styles.group}>
          <button
            className={styles.iconBtn}
            title="Undo (Ctrl+Z)"
            disabled
          >
            <LuUndo2 />
          </button>
          <button
            className={styles.iconBtn}
            title="Redo (Ctrl+Y)"
            disabled
          >
            <LuRedo2 />
          </button>
        </div>

        <div className={styles.divider} />

        <button
          className={styles.actionBtn}
          onClick={() => console.log("Save board")}
          disabled
        >
          <span className={styles.actionIcon}>
            <LuSave />
          </span>
          Save
        </button>

        <button
          className={styles.actionBtnPrimary}
          onClick={() => console.log("Export board")}
          disabled
        >
          <span className={styles.actionIcon}>
            <LuArrowUpFromLine />
          </span>
          Export
        </button>

        <button
          className={styles.iconBtn}
          title="Settings"
          disabled
        >
          <LuSettings />
        </button>
      </div>
    </header>
  );
};
