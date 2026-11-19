// src/widgets/toolbar/ui/Toolbar.tsx

import React, { useState, useRef, useEffect } from "react";
import type { CanvasTool } from "@/entities/board";
import styles from "./Toolbar.module.scss";

interface ToolbarProps {
  activeTool: CanvasTool;
  activeColor: string;
  onSelectTool: (tool: CanvasTool) => void;
  onSelectColor: (color: string) => void;
  onPickImageFile: (file: File) => void;
}

interface ToolItem {
  id: CanvasTool;
  label: string;
  shortcut: string;
  icon: string;
}

const TOOLS: ToolItem[] = [
  { id: "select", label: "Select", shortcut: "V", icon: "↖" },
  { id: "selection-area", label: "Selection Area", shortcut: "S", icon: "⬚" },
  { id: "rectangle", label: "Rectangle", shortcut: "R", icon: "□" },
  { id: "circle", label: "Ellipse", shortcut: "O", icon: "○" },
  { id: "line", label: "Line", shortcut: "L", icon: "/" },
  { id: "pen", label: "Pen", shortcut: "P", icon: "✎" },
  { id: "text", label: "Text", shortcut: "T", icon: "T" },
  { id: "image", label: "Image", shortcut: "I", icon: "🖼" },
  { id: "eraser", label: "Eraser", shortcut: "E", icon: "⌫" },
];

const COLOR_PRESETS: string[] = [
  "#a8a2d0",
  "#e2e2ea",
  "#7d70b0",
  "#4e9a76",
  "#c97a7e",
  "#c4a35a",
];

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  activeColor,
  onSelectTool,
  onSelectColor,
  onPickImageFile,
}) => {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isPaletteOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsPaletteOpen(false);
      }
    };

    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [isPaletteOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPickImageFile(file);
    }
    e.target.value = "";
  };

  return (
    <aside ref={rootRef} className={styles.toolbar} aria-label="Canvas tools">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={handleFileChange}
      />

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

      <div className={styles.paletteAnchor}>
        <button
          type="button"
          className={`${styles.toolBtn} ${isPaletteOpen ? styles.active : ""}`}
          onClick={() => setIsPaletteOpen((prev) => !prev)}
          title="Color Palette"
          aria-expanded={isPaletteOpen}
        >
          <span
            className={styles.colorSwatch}
            style={{ backgroundColor: activeColor }}
          />
        </button>

        {isPaletteOpen && (
          <div
            className={styles.palettePopover}
            role="group"
            aria-label="Color presets"
          >
            {COLOR_PRESETS.map((hex) => {
              const selected = activeColor.toLowerCase() === hex.toLowerCase();
              return (
                <button
                  key={hex}
                  type="button"
                  className={`${styles.swatchBtn} ${selected ? styles.swatchActive : ""}`}
                  style={{ backgroundColor: hex }}
                  onClick={() => {
                    onSelectColor(hex);
                    setIsPaletteOpen(false);
                  }}
                  title={hex}
                  aria-label={`Select color ${hex}`}
                />
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
