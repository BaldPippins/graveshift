# @graveshift/server

Авторитарный игровой сервер: Fastify + `@fastify/websocket`, симуляция 30 тиков в секунду.
Запускается Node напрямую из TypeScript, без сборки.

```bash
pnpm --filter @graveshift/server dev     # с автоперезапуском при правках src и shared
pnpm --filter @graveshift/server start   # прод: раздаёт packages/client/dist
pnpm --filter @graveshift/server smoke --bots 2
```

## Слои

| Папка             | Ответственность                                                         |
| ----------------- | ----------------------------------------------------------------------- |
| `domain/`         | матч: сущности, системы, AI, боты, волны, торговец, хитскан, статистика |
| `application/`    | сессии и возврат после обрыва, комнаты, раннер матча, порты             |
| `infrastructure/` | конфиг из окружения, логгер, планировщик тиков, дренаж при `SIGTERM`    |
| `transport/`      | HTTP (`/api/health`, статика) и WebSocket                               |
| `main.ts`         | composition root                                                        |
| `scripts/smoke/`  | боты, играющие матч через настоящий протокол                            |

Порт по умолчанию — `8686` (`PORT`/`GRAVESHIFT_SERVER_PORT`).

`SIGTERM` переводит сервер в дренаж: `/api/health` отвечает `503 draining`, игроки вне комнат
отключаются, процесс ждёт закрытия комнат до `GRAVESHIFT_DRAIN_SECONDS` (по умолчанию 0) и
выходит. `SIGINT` закрывает сразу. Зачем — в [docs/deploy.md](../../docs/deploy.md). Детали — в
[docs/architecture.md](../../docs/architecture.md) и [docs/netcode.md](../../docs/netcode.md).
