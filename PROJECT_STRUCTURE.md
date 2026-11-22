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
│   │   └── {page1}/                  # N-Страница для сборки/компоновки компонентов
│   │       ├── {ui}/
│   │       │   ├── {Page1}.tsx           # Рендер различных React-компонентов
│   │       │   └── {Page1}.module.scss   # Стили для общего вида всех компонентов на данной N-Странице
│   │       └── index.ts                    # Публичный API слайса pages
│   │
│   ├── widgets/                    # Слой самостоятельных UI-виджетов
│   │   └── {widget1}/                # N-Виджет комплексной работы
│   │       ├── {ui}/
│   │       │   ├── {Widget1}.tsx             # Рендер React-компонента виджета
│   │       │   └── {Widget1}.module.scss     # Стили для этого компонента виджета
│   │       └── index.ts                    # Публичный API слайса widgets
│   │
│   ├── entities/                   # Слой бизнес-сущностей
│   │   └── {entity1}/                  # N-Доменная сущность какого-то типа работы
│   │       ├── [lib]/
│   │       │   └── {file_name}.ts                # Файл для работы с чем-то конкретным данной бизнес-сущности
│   │       ├── {model}/
│   │       │   └── types.ts                # Определённые типы характерны данной бизнес-сущности
│   │       └── index.ts                    # Публичный API слайса entities
│   │
│   ├── shared/                     # Слой переиспользуемых модулей
│   │   ├── lib/
│   │   │   └── index.ts            # Резерв под доменно-независимые утилиты
│   │   ├── styles/
│   │   │   ├── _variables.scss     # Цветовая палитра, отступы, радиусы, z-index токены и другие переменные
│   │   │   └── index.ts            # Точка входа для общих стилей (shared)
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
├── eslint.config.js                # Конфигурация ESLint
├── index.html                      # HTML-шаблон приложения
├── LICENSE                         # Лицензия проекта
├── package.json                    # Зависимости и npm-скрипты
├── README.md                       # Обзор проекта, концепция MVP и стек
├── steiger.config.ts               # Конфигурация FSD-линтера Steiger
├── tsconfig.json                   # Базовый конфиг TypeScript
├── tsconfig.app.json               # Конфиг TypeScript для исходного кода приложения
├── tsconfig.node.json              # Конфиг TypeScript для окружения сборки (Vite)
└── vite.config.ts                  # Конфигурация Vite (алиасы, SCSS additionalData)

```
