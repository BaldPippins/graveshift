# Graveshift

[![CI](https://github.com/BaldPippins/graveshift/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/BaldPippins/graveshift/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2FBaldPippins%2Fgraveshift%2Fbadges%2Ftests.json)](https://github.com/BaldPippins/graveshift/actions/workflows/badges.yml)
[![Coverage](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2FBaldPippins%2Fgraveshift%2Fbadges%2Fcoverage.json)](https://github.com/BaldPippins/graveshift/actions/workflows/badges.yml)
[![Release](https://img.shields.io/github/v/release/BaldPippins/graveshift?sort=semver)](CHANGELOG.md)
[![License](https://img.shields.io/github/license/BaldPippins/graveshift)](LICENSE)
[![Node](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FBaldPippins%2Fgraveshift%2Fmaster%2Fpackage.json&query=%24.engines.node&label=node&logo=nodedotjs&color=5FA04E)](https://nodejs.org)
[![pnpm](https://img.shields.io/github/package-json/packageManager/BaldPippins/graveshift?label=pnpm&logo=pnpm&color=F69220)](https://pnpm.io)
[![TypeScript](https://img.shields.io/github/package-json/dependency-version/BaldPippins/graveshift/dev/typescript?logo=typescript&color=3178C6)](https://www.typescriptlang.org)

Кооперативный браузерный шутер: ночная смена на кладбище. 1–4 игрока (и до трёх ботов-напарников),
10, 15 или 20 волн нежити, стволы и оружие ближнего боя с яростью, прыжки через надгробия, торговец
с лавкой (его можно убить и оживить), настраиваемый френдлифаер, ачивки и статистика. Работает на ПК и телефонах,
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
| `pnpm coverage`                                              | тесты с покрытием (`@vitest/coverage-v8`)                    |
| `pnpm lint:fix` / `pnpm format`                              | автоисправления линтера и форматирование                     |
| `pnpm build && pnpm start`                                   | прод: собрать клиент, сервер раздаёт его и WebSocket на 8686 |
| `pnpm --filter @graveshift/server smoke --bots 2`            | e2e: боты играют полный матч по настоящему протоколу         |
| `pnpm --filter @graveshift/server smoke --bots 2 --join КОД` | боты заходят в вашу комнату                                  |
| `pnpm demo:bots`                                             | окно браузера со сменой, которую играют боты                 |

Флаги смоук-ботов: `--bots N`, `--join КОД`, `--url ws://…/ws`, `--timeout СЕКУНДЫ`.

### Смена из ботов в браузере

При запущенном `pnpm dev` команда `pnpm demo:bots` открывает окно браузера, создаёт смену
с ботами-напарниками и жмёт «Готов» — дальше остаётся смотреть. Ваш герой стоит в смене
зрителем, боты воюют, поднимают его и закупаются у торговца. Закройте окно, чтобы остановить.

```bash
pnpm demo:bots
pnpm demo:bots --bots 2 --waves 15 --url http://localhost:5173/
```

Браузер — Chromium из Playwright, а если его нет — установленный Chrome. Поставить Chromium:
`pnpm exec playwright install chromium`.

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
.github/    CI: проверка, сборка образа, скан Trivy, деплой, откат, релизы, бейджи
tools/      локальные правила ESLint
```

Подробнее о каждом пакете — в его `README.md`.

## Деплой

Push в `master` → CI проверяет код, собирает Docker-образ, сканирует его Trivy, публикует в GHCR
и выкатывает на сервер без простоя: идущие матчи доигрываются на старом релизе.
Настройка и устройство — [docs/deploy.md](docs/deploy.md).

## Релизы

Мерж PR в `master` поднимает версию, переносит «Unreleased» в новый раздел, ставит тег и
публикует GitHub Release. История — [CHANGELOG.md](CHANGELOG.md), правила — [docs/releases.md](docs/releases.md).

## Документация

[Архитектура](docs/architecture.md) · [Неткод](docs/netcode.md) ·
[Стандарты TypeScript](docs/typescript.md) · [Геймдизайн](docs/gameplay.md) ·
[Деплой](docs/deploy.md) · [Релизы](docs/releases.md) · [Журнал изменений](CHANGELOG.md)

## Лицензии

Код — [MIT](LICENSE).

Модели и звуки Kenney лежат в `packages/client/public/assets/kenney/*` вместе с их `License.txt`
(CC0). Свои модели — в `packages/client/public/assets/graveshift/`: нетопырь `bat.glb`
(`node packages/client/scripts/models/buildBatModel.ts`) и капкан `bear-trap-open.glb` /
`bear-trap-closed.glb` (`node packages/client/scripts/models/buildBearTrapModels.ts`).

Портреты врагов в бестиарии («Как играть» → «Бестиарий») не хранятся картинками: после загрузки
ассетов `render/portraits` один раз рендерит каждого врага из его игровой модели. Новому врагу
отдельный портрет не нужен.
