// src/shared/ui/shortcuts-hud/ShortcutsHud.tsx

import React from "react";
import styles from "./ShortcutsHud.module.scss";

export interface ShortcutHintItem {
  keyLabel: string;
  actionLabel: string;
}

export interface ShortcutsHudProps {
  items: readonly ShortcutHintItem[];
  className?: string;
}

export const ShortcutsHud: React.FC<ShortcutsHudProps> = ({
  items,
  className,
}) => {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const rootClassName = className ? `${styles.hud} ${className}` : styles.hud;

  return (
    <aside
      className={rootClassName}
      aria-label="Keyboard and mouse shortcuts"
    >
      {items.map((item, index) => (
        <span
          key={`${item.keyLabel}-${item.actionLabel}-${index}`}
          className={styles.item}
        >
          <b className={styles.key}>{item.keyLabel}:</b>
          <code className={styles.action}>{item.actionLabel}</code>
          {index < items.length - 1 && (
            <span className={styles.separator} aria-hidden="true">
              ;
            </span>
          )}
        </span>
      ))}
    </aside>
  );
};
