// src/pages/board/model/shortcuts.ts

import type { CanvasTool } from "@/entities/board";
import type { ShortcutHintItem } from "@/shared/ui/shortcuts-hud/ShortcutsHud";

export const TOOL_SHORTCUT_MAP: Record<string, CanvasTool> = {
  v: "select",
  s: "selection-area",
  r: "rectangle",
  o: "circle",
  l: "line",
  p: "pen",
  t: "text",
  i: "image",
  e: "eraser",
};

export const BOARD_SHORTCUT_HINTS: readonly ShortcutHintItem[] = [
  { keyLabel: "v", actionLabel: "Select" },
  { keyLabel: "r", actionLabel: "Rectangle" },
  { keyLabel: "p", actionLabel: "Pen" },
  { keyLabel: "t", actionLabel: "Text" },
  { keyLabel: "e", actionLabel: "Erase" },
  { keyLabel: "Ctrl+Z", actionLabel: "Undo" },
  { keyLabel: "Ctrl+Shift+Z", actionLabel: "Redo" },
  { keyLabel: "MouseWheel", actionLabel: "Zoom" },
  { keyLabel: "LBM+Space", actionLabel: "Moving canvas" },
];
