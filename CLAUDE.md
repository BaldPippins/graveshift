# Graveshift — правила проекта

Кооперативный top-down шутер в браузере: ночная смена на кладбище, 1–4 игрока, 10, 15 или 20 волн
нежити, стволы и ближний бой, прыжки.
Монорепо pnpm: `packages/shared` (общая логика и протокол), `packages/server` (Node + Fastify + ws),
`packages/client` (Vite + three.js + Preact).

Перед работой прочитай:

- [docs/architecture.md](docs/architecture.md) — слои, потоки данных, где что лежит.
- [docs/netcode.md](docs/netcode.md) — авторитарный сервер, предсказание, интерполяция, лаг-компенсация.
- [docs/typescript.md](docs/typescript.md) — стандарты TypeScript, которые проверяет линтер.
- [docs/gameplay.md](docs/gameplay.md) — механики, баланс, ачивки, как добавлять контент.
- [docs/deploy.md](docs/deploy.md) — образ, CI, blue-green деплой с дренажом матчей.
- `.claude/rules/*.md` — короткие обязательные правила по областям.
- `docs/solutions/` — база решений по категориям с YAML-полями `module`, `tags`,
  `problem_type`; полезна при реализации, отладке и принятии решений в описанных областях.

При планировании изменений в проекте используй навык `graphify`: проверь наличие
`graphify-out/graph.json` и запроси граф по теме плана перед исследованием кода.
Если графа нет, построй его по инструкциям навыка. Сверяй вывод графа с актуальными
исходными файлами; если граф недоступен или устарел, сообщи об этом и проверь код напрямую.

## Команды

```bash
pnpm install
pnpm dev                       # сервер :8686 + клиент :5173 (Vite проксирует /ws)
pnpm check                     # typecheck + eslint + prettier --check + vitest
pnpm build && pnpm start       # прод: сервер раздаёт packages/client/dist
pnpm --filter @graveshift/server smoke --bots 3      # e2e-матч ботами по реальному протоколу
pnpm --filter @graveshift/server smoke --bots 2 --join ABCD   # боты заходят в вашу комнату
docker build -t graveshift:local .                           # прод-образ (см. docs/deploy.md)
```

## Жёсткие правила

1. **Никаких комментариев в коде.** Линтер (`local/no-comments`) падает на любом комментарии.
   Намерение выражается именами, типами и декомпозицией.
2. **Никаких инлайн-типов и инлайн-классов.** Только именованные `interface`; один класс на файл.
3. **Никаких `enum`/`namespace`/parameter properties** — код запускается Node без сборки (type stripping).
   Перечисления: `const X = {...} as const` + `type X = ValueOf<typeof X>`.
4. **Сервер авторитарен.** Клиент шлёт только намерения (ввод, покупка, пауза). Любая проверка правил —
   в `shared/rules`, сервер и клиент вызывают одну и ту же функцию.
5. **Данные отдельно от представления.** Механика — `shared/config`, тексты/модели/цвета — `client/content`.
   Перед добавлением цвета проверь `packages/client/src/content/palette.ts`: используй подходящий цвет
   из `PALETTE` или добавь новый туда, а не задавай его напрямую в CSS или компонентах.
6. **Зависимости только вниз по слоям** (см. architecture.md). Границы проверяет `no-restricted-imports`.
7. **Без optional chaining (`?.`).** null обрабатывается явно: проверка, ранний `return`, не-null тип
   или Null-объект. Запрещено линтером.
8. **Строка не длиннее 100 символов** (Prettier + `max-len`). Длинный текст — конкатенация строк.
9. **Никакого текста в коде.** Всё, что видит игрок, — в `client/src/i18n/locales/ru.ts` и `en.ts`
   (общий тип `Messages`); числа баланса подставляются из конфига, не пишутся словами.
10. После изменений: `pnpm check` должен быть зелёным. Изменил протокол — подними
    `NETWORK.protocolVersion`.
