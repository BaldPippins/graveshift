# Graveshift

Кооперативный браузерный шутер: ночная смена на кладбище. 1–4 игрока (и до трёх ботов-напарников),
10 волн нежити, торговец с лавкой, френдлифаер, ачивки и статистика. Работает на ПК и телефонах,
интерфейс на русском и английском.

Стек: TypeScript 6, pnpm workspaces, Node + Fastify + WebSocket (сервер), Vite + three.js + Preact
(клиент). Ассеты — [Kenney](https://kenney.nl) (CC0).

## Требования

- Node.js ≥ 24 — сервер запускается прямо из `.ts` (type stripping), без сборки.
- pnpm 10 (`corepack enable` подтянет версию из `packageManager`).

## Быстрый старт

```bash
pnpm install
pnpm dev
```

- Клиент: http://localhost:5173 (Vite, проксирует `/ws` и `/api` на сервер).
- Сервер: http://localhost:8686, здоровье — `GET /api/health`.
- С телефона в той же сети: `http://<ip-компьютера>:5173`.

## Команды

| Команда                                                      | Что делает                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| `pnpm dev`                                                   | сервер (с автоперезапуском) + клиент с HMR                   |
| `pnpm check`                                                 | typecheck + eslint + prettier --check + vitest — перед PR    |
| `pnpm test`                                                  | только тесты (Vitest, все пакеты)                            |
| `pnpm lint:fix` / `pnpm format`                              | автоисправления линтера и форматирование                     |
| `pnpm build && pnpm start`                                   | прод: собрать клиент, сервер раздаёт его и WebSocket на 8686 |
| `pnpm --filter @graveshift/server smoke --bots 2`            | e2e: боты играют полный матч по настоящему протоколу         |
| `pnpm --filter @graveshift/server smoke --bots 2 --join КОД` | боты заходят в вашу комнату                                  |

Флаги смоук-ботов: `--bots N`, `--join КОД`, `--url ws://…/ws`, `--timeout СЕКУНДЫ`.

## Переменные окружения

| Переменная                          | По умолчанию           | Где                                            |
| ----------------------------------- | ---------------------- | ---------------------------------------------- |
| `PORT` или `GRAVESHIFT_SERVER_PORT` | `8686`                 | порт сервера; Vite-прокси читает второе        |
| `HOST`                              | `0.0.0.0`              | адрес сервера                                  |
| `NODE_ENV=production`               | —                      | сервер раздаёт собранный клиент (`pnpm start`) |
| `GRAVESHIFT_CLIENT_DIST`            | `packages/client/dist` | откуда раздавать клиент в проде                |
| `GRAVESHIFT_DRAIN_SECONDS`          | `0`                    | сколько ждать конца матчей после `SIGTERM`     |
| `GRAVESHIFT_VERSION`                | `dev`                  | версия в `/api/health` (в образе — SHA)        |

## Структура

```
packages/
  shared/   общая логика: конфиг баланса, правила, мир и коллизии, бинарный протокол
  server/   Fastify + ws: сессии, комнаты, авторитарная симуляция матча, боты, смоук-тесты
  client/   Vite + three.js + Preact: сеть, предсказание, рендер, UI, i18n, ачивки
docs/       архитектура, неткод, стандарты TypeScript, геймдизайн, деплой
deploy/     compose, Caddy и скрипты blue-green деплоя на сервер
.github/    CI: проверка, сборка образа, скан Trivy, деплой, откат
tools/      локальные правила ESLint
```

Подробнее о каждом пакете — в его `README.md`.

## Деплой

Push в `master` → CI проверяет код, собирает Docker-образ, сканирует его Trivy, публикует в GHCR
и выкатывает на сервер без простоя: идущие матчи доигрываются на старом релизе.
Настройка и устройство — [docs/deploy.md](docs/deploy.md).

## Документация

[Архитектура](docs/architecture.md) · [Неткод](docs/netcode.md) ·
[Стандарты TypeScript](docs/typescript.md) · [Геймдизайн](docs/gameplay.md) ·
[Деплой](docs/deploy.md)

## Лицензии ассетов

Модели Kenney лежат в `packages/client/public/assets/kenney/*` вместе с их `License.txt` (CC0).
