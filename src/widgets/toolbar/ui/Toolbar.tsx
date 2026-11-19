// src/widgets/toolbar/ui/Toolbar.tsx

import React from "react";
import type { CanvasTool } from "@/entities/board/model/types";
import styles from "./Toolbar.module.scss";

interface ToolbarProps {
  activeTool: CanvasTool;
  onSelectTool: (tool: CanvasTool) => void;
}

interface ToolItem {
  id: CanvasTool;
  label: string;
  shortcut: string;
  icon: string;
}

const TOOLS: ToolItem[] = [
  { id: "select", label: "Select", shortcut: "V", icon: "↖" },
  { id: "rectangle", label: "Rectangle", shortcut: "R", icon: "□" },
  { id: "circle", label: "Ellipse", shortcut: "O", icon: "○" },
  { id: "line", label: "Line", shortcut: "L", icon: "/" },
  { id: "pen", label: "Pen", shortcut: "P", icon: "✎" },
  { id: "text", label: "Text", shortcut: "T", icon: "T" },
  { id: "eraser", label: "Eraser", shortcut: "E", icon: "⌫" },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onSelectTool,
}) => {
  return (
    <aside className={styles.toolbar} aria-label="Canvas tools">
      <div className={styles.group}>
        {TOOLS.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              className={`${styles.toolBtn} ${isActive ? styles.active : ""}`}
              onClick={() => onSelectTool(tool.id)}
              title={`${tool.label} (${tool.shortcut})`}
              aria-pressed={isActive}
            >
              <span className={styles.icon}>{tool.icon}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <button
          type="button"
          className={styles.toolBtn}
          title="Grid & Chunks (заготовка)"
          onClick={() => console.log("Toggle grid/chunks options")}
        >
          <span className={styles.icon}>⊞</span>
        </button>
      </div>
    </aside>
  );
};
