# Структура проекта Kinsorboard

> Актуальная карта директорий и файлов репозитория с описанием ответственности каждого модуля по **Feature-Sliced Design (FSD)**.

````bash
KinsorBoard/
├── public/                         # Статические ассеты (иконки, референс UI ref.png)
├── src/
│   ├── app/                        # Слой инициализации приложения
│   │   ├── layouts/
│   │   │   └── AppLayout.tsx       # Базовый корневой лейаут с <Outlet/>
│   │   ├── styles/
│   │   │   └── global.scss         # Глобальные сбросы и базовые стили документа
│   │   ├── App.tsx                 # Конфигурация маршрутов (react-router)
│   │   └── index.ts                # Публичный API слоя app (Application)
│   │
│   ├── pages/                      # Слой страниц
│   │   └── board/                  # Страница рабочей доски
│   │       ├── ui/
│   │       │   ├── BoardPage.tsx           # Интеграция <canvas>, Topbar, Toolbar и HUD
│   │       │   └── BoardPage.module.scss   # Стили контейнера холста и индикатора зума
│   │       └── index.ts                    # Публичный API слайса pages/board
│   │
│   ├── widgets/                    # Слой самостоятельных UI-виджетов
│   │   ├── toolbar/                # Левая панель инструментов рисования
│   │   │   ├── ui/
│   │   │   │   ├── Toolbar.tsx             # Кнопки инструментов и подсказки хоткеев
│   │   │   │   └── Toolbar.module.scss     # Стили вертикальной панели
│   │   │   └── index.ts                    # Публичный API слайса widgets/toolbar
│   │   │
│   │   └── topbar/                 # Верхняя шапка доски
│   │       ├── ui/
│   │       │   ├── Topbar.tsx              # Логотип, редактируемое имя доски, кнопки действий
│   │       │   └── Topbar.module.scss      # Стили шапки
│   │       └── index.ts                    # Публичный API слайса widgets/topbar
│   │
│   ├── entities/                   # Слой бизнес-сущностей
│   │   └── board/                  # Доменная сущность интерактивной доски
│   │       ├── lib/
│   │       │   ├── BoardEngine.ts          # Оркестратор событий ввода, состояния и рендера
│   │       │   ├── camera.ts               # ViewportCamera: масштаб, сдвиг и screenToWorld
│   │       │   ├── geometry.ts             # BoundingBox, hitTest, перемещение и валидация фигур
│   │       │   ├── renderer.ts             # BoardRenderer: отрисовка чанков, фигур и выделения
│   │       │   └── tools.ts                # Создание и обновление черновиков фигур и текста
│   │       ├── model/
│   │       │   └── types.ts                # Контракты фигур, инструментов, чанков и координат
│   │       └── index.ts                    # Публичный API (BoardEngine, CanvasTool)
│   │
│   ├── shared/                     # Слой переиспользуемых модулей
│   │   ├── lib/
│   │   │   └── index.ts            # Резерв под доменно-независимые утилиты
│   │   ├── styles/
│   │   │   ├── _variables.scss     # Цветовая палитра, отступы, радиусы и z-index токены
│   │   │   └── index.ts            # Точка входа стилей shared
│   │   ├── ui/                     # Резерв под базовые UI-примитивы
│   │   └── info.ts                 # Служебные метаданные приложения
│   │
│   ├── main.tsx                    # Точка входа React-приложения
│   └── vite-env.d.ts               # Декларации типов Vite
│
├── .editorconfig                   # Единые настройки отступов и кодировки для IDE
├── .gitignore                      # Исключения Git
├── .prettierignore                 # Исключения форматирования Prettier
├── .prettierrc                     # Конфигурация Prettier
├── CONTRIBUTING.md                 # Правила архитектуры, FSD, SemVer и Conventional Commits
├── PROJECT_STRUCTURE.md            # Текущий файл со структурой проекта
├── eslint.config.js                # Конфигурация ESLint (flat config)
├── index.html                      # HTML-шаблон приложения
├── LICENSE                         # Лицензия проекта
├── package.json                    # Зависимости и npm-скрипты (checks, build, format)
├── README.md                       # Обзор проекта, концепция MVP и стек
├── steiger.config.ts               # Конфигурация FSD-линтера Steiger
├── tsconfig.json                   # Базовый конфиг TypeScript
├── tsconfig.app.json               # Конфиг TypeScript для исходного кода приложения
├── tsconfig.node.json              # Конфиг TypeScript для окружения сборки (Vite)
└── vite.config.ts                  # Конфигурация Vite (алиасы, SCSS additionalData)

```
