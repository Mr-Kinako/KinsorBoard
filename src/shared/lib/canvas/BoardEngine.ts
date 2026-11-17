import type { BoardConfig, Point } from './types';

export class BoardEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Параметры камеры (трансформации холста)
  private scale: number = 1;
  private pan: Point = { x: 0, y: 0 };

  // Состояние взаимодействия
  private isPanning: boolean = false;
  private startPan: Point = { x: 0, y: 0 };

  // Конфигурация чанков
  private config: BoardConfig = {
    chunkSize: 600, // Размер одного чанка в мировых координатах
    totalChunks: 200,
    gridCols: 14,   // Примерно под 200 чанков (сетка ~14x14)
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to get 2D context from canvas');
    this.ctx = context;

    this.initListeners();
    this.resize();
  }

  public setConfig(totalChunks: 100 | 200 | 400) {
    this.config.totalChunks = totalChunks;
    this.config.gridCols = Math.ceil(Math.sqrt(totalChunks));
    this.render();
  }

  private initListeners() {
    window.addEventListener('resize', this.resize);

    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mouseup', this.onMouseUp);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
  }

  public destroy() {
    window.removeEventListener('resize', this.resize);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
  }

  private resize = () => {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;
    this.render();
  };

  private onMouseDown = (e: MouseEvent) => {
    // Средняя кнопка мыши или зажатый пробел / инструмент Hand (пока по клику средней кнопки или ПКМ)
    if (e.button === 1 || e.button === 2) {
      this.isPanning = true;
      this.startPan = { x: e.clientX - this.pan.x, y: e.clientY - this.pan.y };
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isPanning) return;
    this.pan.x = e.clientX - this.startPan.x;
    this.pan.y = e.clientY - this.startPan.y;
    this.render();
  };

  private onMouseUp = () => {
    this.isPanning = false;
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();

    const zoomFactor = 1.1;
    const oldScale = this.scale;

    if (e.deltaY < 0) {
      this.scale *= zoomFactor;
    } else {
      this.scale /= zoomFactor;
    }

    // Ограничения зума (от 10% до 500%)
    this.scale = Math.max(0.1, Math.min(5, this.scale));

    // Зум относительно позиции курсора мыши
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    this.pan.x = mouseX - (mouseX - this.pan.x) * (this.scale / oldScale);
    this.pan.y = mouseY - (mouseY - this.pan.y) * (this.scale / oldScale);

    this.render();
  };

  public render = () => {
    const { width, height } = this.canvas;

    // Очистка экрана
    this.ctx.save();
    this.ctx.fillStyle = '#131318'; // Цвет фона $bg-canvas из темы
    this.ctx.fillRect(0, 0, width, height);

    // Применяем трансформации камеры (Pan & Zoom)
    this.ctx.translate(this.pan.x, this.pan.y);
    this.ctx.scale(this.scale, this.scale);

    this.drawGridAndChunks();

    this.ctx.restore();
  };

  private drawGridAndChunks() {
    const { chunkSize, gridCols } = this.config;
    const rows = Math.ceil(this.config.totalChunks / gridCols);

    const totalWidth = gridCols * chunkSize;
    const totalHeight = rows * chunkSize;

    // 1. Отрисовка фона области чанков
    this.ctx.fillStyle = '#16161c';
    this.ctx.fillRect(0, 0, totalWidth, totalHeight);

    // 2. Отрисовка сетки чанков и их координат [x, y]
    this.ctx.lineWidth = 1 / this.scale; // Толщина линий не жирнеет при зуме

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const x = c * chunkSize;
        const y = r * chunkSize;

        // Границы чанка
        this.ctx.strokeStyle = '#2a2a35';
        this.ctx.strokeRect(x, y, chunkSize, chunkSize);

        // Метка чанка (например, [0, 0], [1, 0])
        this.ctx.fillStyle = '#5c5c6b';
        this.ctx.font = '12px Inter, sans-serif';
        this.ctx.fillText(`[${c}, ${r}]`, x + 16, y + 24);

        // Мелкая вспомогательная сетка внутри чанка
        this.drawSubGrid(x, y, chunkSize);
      }
    }
  }

  private drawSubGrid(startX: number, startY: number, size: number) {
    const step = 40; // Шаг мелкой сетки
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    this.ctx.lineWidth = 1 / this.scale;

    this.ctx.beginPath();
    for (let x = startX + step; x < startX + size; x += step) {
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, startY + size);
    }
    for (let y = startY + step; y < startY + size; y += step) {
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(startX + size, y);
    }
    this.ctx.stroke();
  }

  public getScalePercent(): number {
    return Math.round(this.scale * 100);
  }
}
