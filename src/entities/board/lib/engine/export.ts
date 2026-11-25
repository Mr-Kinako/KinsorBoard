// src/entities/board/lib/engine/export.ts

export function exportCanvasAsPng(
  canvas: HTMLCanvasElement,
  fileName = "kinsorboard.png",
): boolean {
  try {
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = fileName;
    link.click();
    return true;
  } catch {
    return false;
  }
}
