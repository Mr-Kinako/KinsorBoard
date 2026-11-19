# Kinsorboard

**Version:** `0.1.0-alpha`

<details>
  <summary>
    Примечание о версионировании
  </summary>

  Номер сборки (build metadata) отброшен, чтобы не менять миллион раз. В целом достаточно и текущего варианта для README.
</details>
<br>

**Status:** Active Development (MVP Phase)

Легковесный, быстрый и масштабируемый интерактивный whiteboard для заметок, схем и рисования.

---

## 🎯 Концепция и цель MVP

Создать производительную рабочую доску без лишнего оверхеда с заделом на кроссплатформенность (Web -> Electron / Desktop / Mobile) и будущий мультиплеер.

### Ключевые фичи MVP:
- **Гибридный рендеринг:** UI-оболочка на React, холст на нативном HTML5 Canvas (`CanvasRenderingContext2D`) с изолированным движком на чистом TypeScript.
- **Чанковая система координат:** Вместо хаотичной бесконечности холст разбивается на дискретные сетки-чанки. Статичные шаблоны на старте:
  - `100 Chunks` (~1K × 1K)
  - `200 Chunks` (~2K × 2K)
  - `400 Chunks` (~4K × 4K)
- **Базовый инструментарий (Left Toolbar):** Select (выделение, перетаскивание, удаление по `Delete`/`Backspace`), Rectangle, Ellipse, Line, Pen (Freehand), Text, Eraser и горячие клавиши (`V`, `R`, `O`, `L`, `P`, `T`, `E`).
- **Навигация и управление камерой:**
  - Зум к курсору колесом мыши (`10% – 500%`) и панорамирование (`СКМ` или `Space + ЛКМ`).
  - *Topbar:* Бренд, редактируемое название доски, заготовки под Undo/Redo, Save, Export и Settings.
  - *Right Panels (в планах):* Переключатель размера холста (`Canvas Size`: 100 / 200 / 400 чанков) и миникарта (`Navigator`).
  - *Bottom Bar (в планах):* Статус, управление масштабом и счётчик объектов.
- **Визуальный стиль:** Тёмная тема (Dark Mode) со спокойными, приглушёнными фиолетово-лавандовыми акцентами (референс лежит в `public/ref.png`).

---

## 🛠 Технологический стек

### Frontend (Текущий этап)
- **Core:** React 19 + TypeScript (`strict: true`, запрет на `any`)
- **Build Tool:** Vite (с автоматической инъекцией SCSS-переменных)
- **Styling:** SCSS Modules + дизайн-токены в `shared/styles/_variables.scss`
- **Routing:** `react-router` (с учётом будущей совместимости с Electron)
- **Canvas Engine:** Декомпозированный доменный движок (`BoardEngine`, `ViewportCamera`, `BoardRenderer`, `geometry`, `tools`), изолированный от жизненного цикла React
- **Code Quality & Architecture:** ESLint + Prettier + EditorConfig + **Steiger** (контроль границ FSD)

### Future Scope (Масштабирование)
- **Desktop / Mobile:** Портирование через Electron (Windows / Linux) и адаптация под Android.
- **Backend (Мультиплеер):** Высокопроизводительный WebSocket-сервер на **Rust** (Axum + Tokio) для синхронизации курсоров и объектов в реальном времени.

---

## 🏗 Архитектура проекта

Проект строится по **Feature-Sliced Design (FSD)** с автоматической проверкой границ слоёв через `steiger`:

- `src/app/` — инициализация приложения, роутинг, глобальные стили (`global.scss`) и лейауты (`AppLayout`).
- `src/pages/` — страницы приложения (`pages/board`).
- `src/widgets/` — самостоятельные композиционные блоки UI (`topbar`, `toolbar`).
- `src/entities/` — бизнес-сущности и доменная логика (`entities/board`: движок холста, камера, рендерер, геометрия, модели объектов и инструментов).
- `src/shared/` — базовые переиспользуемые ресурсы (`shared/styles/_variables.scss`, утилиты и UI-компоненты).

Подробное дерево директорий и назначение файлов вынесено в [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md).

---

## 📝 Правила разработки и Git

Все соглашения по архитектуре, FSD-импортам, целевым реэкспортам, SemVer и формату коммитов зафиксированы в [`CONTRIBUTING.md`](./CONTRIBUTING.md).

Краткая сводка:
1. **Версионирование:** SemVer (`MAJOR.MINOR.PATCH-PRERELEASE`, текущая ветка разработки — `0.1.0-alpha.x`).
2. **Коммиты:** Строго по стандарту **Conventional Commits** на английском языке в повелительном наклонении (`feat`, `fix`, `refactor`, `docs`, `style`, `chore`).
3. **Проверки перед коммитом:** Обязательный прогон `npm run checks` (`prettier`, `steiger`, `eslint`).

## Ориентировочный пример UI

![ref](/public/ref.png)
