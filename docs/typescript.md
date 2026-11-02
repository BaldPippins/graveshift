# Стандарты TypeScript

Версии: TypeScript 6.0 (7.x пока не поддерживается typescript-eslint), Node ≥ 24, ESLint 10 flat config,
typescript-eslint `strictTypeChecked` + `stylisticTypeChecked`, Prettier, Vitest.

## Компилятор (`tsconfig.base.json`)

- `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`,
  `noImplicitReturns`, `noPropertyAccessFromIndexSignature`, `useUnknownInCatchVariables`.
- `verbatimModuleSyntax` — типы импортируются только через `import type`.
- `erasableSyntaxOnly` — запрещены `enum`, `namespace`, parameter properties. Сервер запускается
  Node напрямую из `.ts` (type stripping) без сборки.
- `allowImportingTsExtensions` + `rewriteRelativeImportExtensions` — относительные импорты с `.ts`.
- `types` задаются явно в каждом пакете (TS 6 больше не подтягивает все `@types`).

## Правила кода

| Правило                                   | Как соблюдать                                                                |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| Нет комментариев                          | Имена, типы, маленькие функции. Проверяет `local/no-comments`.               |
| Нет инлайн-типов `{ a: string }`          | Именованный `interface`. Проверяет `no-restricted-syntax: TSTypeLiteral`.    |
| Один класс на файл, нет `class` выражений | `max-classes-per-file`, `no-restricted-syntax: ClassExpression`.             |
| `interface`, не `type` для объектов       | `consistent-type-definitions`. `type` — для объединений и отображений.       |
| Перечисления                              | `const Kind = { A: 0 } as const; type Kind = ValueOf<typeof Kind>`           |
| Явные типы на границах модулей            | `explicit-module-boundary-types`.                                            |
| Исчерпывающие switch                      | `switch-exhaustiveness-check` + `assertNever` в `default` для объединений.   |
| Нет default export                        | `import-x/no-default-export` (кроме конфигов инструментов).                  |
| Нет циклов импортов                       | `import-x/no-cycle`.                                                         |
| Нет `any`, небезопасных операций          | `strictTypeChecked`; внешние данные — `unknown` + type guard.                |
| `readonly` по умолчанию                   | `readonly` поля интерфейсов, `prefer-readonly` для приватных полей.          |
| Приватность                               | `private` без `_`-префикса; `public` не пишем.                               |
| Никаких нестрогих сравнений               | `eqeqeq`, `curly: all`.                                                      |
| Безопасный доступ по индексу              | `noUncheckedIndexedAccess`: обрабатывай `undefined` явно, не через `!`.      |
| Нет optional chaining                     | `no-restricted-syntax: ChainExpression`; null — проверкой или Null-объектом. |
| Ширина строки 100                         | Prettier `printWidth` + `max-len`; длинный текст — конкатенацией.            |
| Нет текста в коде                         | Строки интерфейса — в `client/src/i18n`, типизированы `Messages`.            |

## Архитектурные практики

- **Composition root** — зависимости создаются только в `main.ts(x)` и передаются через конструктор.
- **Порты и адаптеры** — домен/приложение зависят от интерфейсов (`ClientChannel`, `TickScheduler`,
  `Logger`, `KeyValueStore`), реализации живут во внешних слоях.
- **Чистые функции для правил** — всё, что нужно и клиенту, и серверу (движение, цены, валидация
  покупок), лежит в `shared/rules` и тестируется отдельно.
- **Данные ≠ представление** — числа баланса в `shared/config`, тексты и модели в `client/content`.
- **Валидация на границе** — входящие байты, `localStorage`, ввод пользователя проверяются
  (`BinaryReader.oneOf`, guards в `meta/storage`, `sanitizeNickname`).
- **Детерминизм** — `SeededRandom` вместо `Math.random` в симуляции.
- **Без аллокаций в горячих циклах** — переиспользуемые `Vec2`, пулы трассеров/частиц, ring buffer.

## Тесты

- Vitest-проекты на каждый пакет (`vitest.config.ts` в корне собирает их).
- Тестируются: кодек (round-trip и мусорные данные), рейкаст/коллизии, связность карт, правила
  магазина, flow field, планировщик волн, арсенал, матч целиком, ачивки на шине, предсказание.
- E2E: `pnpm --filter @graveshift/server smoke` — боты играют настоящий матч через WebSocket.
