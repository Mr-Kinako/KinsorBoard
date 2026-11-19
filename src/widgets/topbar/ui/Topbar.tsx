// src/widgets/topbar/ui/Topbar.tsx

import React, { useState } from 'react';
import styles from './Topbar.module.scss';
import icon from "../../../../public/kitty-icon.png";

export const Topbar: React.FC = () => {
  const [boardTitle, setBoardTitle] = useState<string>('Untitled Board');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const hasIcon: string | null = icon;

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
        <span className={styles.brandName}>Kinsorboard</span>
        <span className={styles.version}>v0.1.0-alpha.9</span>
      </div>

      <div className={styles.titleSection}>
        {isEditing ? (
          <input
            type="text"
            className={styles.titleInput}
            value={boardTitle}
            autoFocus
            onChange={(e) => setBoardTitle(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
          />
        ) : (
          <div className={styles.titleDisplay} onClick={() => setIsEditing(true)} title="Click to rename">
            <span className={styles.titleText}>{boardTitle}</span>
            <span className={styles.editIcon}>✏️</span>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <div className={styles.group}>
          <button className={styles.iconBtn} title="Undo (Ctrl+Z)">↩️</button>
          <button className={styles.iconBtn} title="Redo (Ctrl+Y)">↪️</button>
        </div>

        <div className={styles.divider} />

        <button className={styles.actionBtn} onClick={() => console.log('Save board')}>
          💾 Save
        </button>

        <button className={styles.actionBtnPrimary} onClick={() => console.log('Export board')}>
          📤 Export
        </button>

        <button className={styles.iconBtn} title="Settings">⚙️</button>
      </div>
    </header>
  );
};
