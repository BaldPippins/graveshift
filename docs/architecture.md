# Архитектура

## Пакеты и слои

```
shared   ←  server
   ↑
client
```

### `packages/shared` — платформенно-независимое ядро (нет DOM, Node, three, ws)

| Модуль     | Что внутри                                                                                |
| ---------- | ----------------------------------------------------------------------------------------- |
| `core`     | Vec2-математика, `SeededRandom`, `TypedEventBus`, `RingBuffer`, `BinaryMinHeap`, `IdPool` |
| `config`   | Данные механики: герои, враги, оружие, апгрейды, волны, пикапы, тик-рейт                  |
| `model`    | Доменные перечисления и DTO: фазы матча, состояния жизни, лодаут, статистика              |
| `rules`    | Чистые правила, общие для клиента и сервера: движение, магазин, формулы волн              |
| `world`    | Тайловая карта, парсер ASCII-карт, коллизии круг-сетка, DDA-рейкаст                       |
| `protocol` | Сообщения клиент↔сервер, игровые события, бинарный кодек, квантование                     |

### `packages/server` — чистая архитектура

| Слой              | Ответственность                                                          | Может зависеть от     |
| ----------------- | ------------------------------------------------------------------------ | --------------------- |
| `domain/`         | Симуляция матча: сущности, системы, AI, боты, волны, магазин, статистика | `shared`              |
| `application/`    | Сессии, комнаты, раннер матча; порты `ClientChannel`, `TickScheduler`…   | `domain`, `shared`    |
| `infrastructure/` | Реализации портов: логгер, планировщик тиков, конфиг                     | `application` (порты) |
| `transport/`      | Fastify, `@fastify/websocket`, раздача статики                           | `application`         |
| `main.ts`         | Composition root — единственное место, где всё собирается                | всё                   |

Домен не знает про сокеты и таймеры: `Match.step()` — чистый шаг симуляции, его можно гонять в тестах
тысячи раз (см. `Match.test.ts`).

### `packages/client`

| Слой       | Ответственность                                                                    |
| ---------- | ---------------------------------------------------------------------------------- |
| `assets`   | Манифест моделей Kenney, загрузка GLTF, нормализация масштаба, клонирование        |
| `content`  | Данные представления: модели, цвета, иконки (без текста)                           |
| `i18n`     | Словари `ru`/`en` с общим типом `Messages`, определение языка                      |
| `net`      | WebSocket-клиент, шина входящих сообщений                                          |
| `input`    | Клавиатура/мышь, виртуальные стики, агрегатор ввода                                |
| `game`     | Часы сервера, буфер снапшотов, интерполяция, предсказание, клиентская шина событий |
| `meta`     | Хранилище, настройки, счётчики и ачивки на событиях                                |
| `audio`    | Web Audio: движок с громкостью и троттлингом, звуки на клиентских событиях         |
| `render`   | three.js: сцена, карта (инстансинг), риги персонажей, эффекты, камера              |
| `ui`       | Preact-экраны и HUD; читает состояние через сигналы                                |
| `app`      | Оркестрация: `AppController`, `GameSession`, `UiState`, презентеры                 |
| `main.tsx` | Composition root                                                                   |

Правила зависимостей: `game`, `net`, `input`, `meta`, `audio` не знают про `render`, `ui`, three и Preact;
`render` не знает про `ui` и `net`. Связывает всё слой `app`.

## Поток кадра на клиенте

```
WebSocket → NetClient → AppController ─┬→ GameSession.onSnapshot → ClientMatch (буфер, реконсиляция)
                                       └→ UiState (сигналы) → Preact
FrameLoop → AppController.frame
   ├ ClientMatch.update: семплинг ввода 30 Гц → PlayerInput → сервер; предсказание; выпуск событий
   ├ buildHud (15 Гц) → UiState.hud
   └ WorldRenderer.render(WorldFrame): синхронизация видов, эффекты, камера
```

## Поток тика на сервере (30 Гц)

```
BotControlSystem → PlayerControlSystem → WeaponSystem → EnemyBrainSystem → PlayerVitalsSystem
→ PickupSystem → PumpkinPatchSystem → WaveDirector → PositionHistory.record → buildSnapshot → encode один раз → broadcast
```

Все изменения мира публикуются как `GameEvent` в `MatchEventBus`. Подписчики: `EventOutbox`
(события уходят в снапшот), `MatchStatsTracker` (итоговая статистика).

## Система событий и ачивки

Одна и та же типизированная шина (`TypedEventBus`) используется на сервере и клиенте. На клиенте
`ClientEventBus` получает серверные `GameEvent` + клиентские (`match-started`, `match-finished`,
`achievement-unlocked`). Ачивки устроены в два уровня:

1. **Правила счётчиков** (`meta/counters/rules`) подписываются на события и меняют `CounterStore`
   (`EventCounterRule`, `MultiKillRule`, `FlawlessWaveRule`, `ArsenalRule`, `MatchSummaryRule`).
2. **`AchievementTracker`** слушает изменения счётчиков и открывает ачивки по порогу, публикуя
   `achievement-unlocked` обратно в шину (тосты, экран итогов).

Тот же `CounterStore` питает экран «Статистика» — нет дублирования подсчётов.

## Тела и урон

`Body` (`id`, `position`, `radius`) реализуют `PlayerEntity`, `EnemyEntity`, `MerchantEntity`.
Хитскан и история позиций работают с `Body`; урон уходит в сервис по виду попадания
(`HitKind`): `EnemyDamageService`, `PlayerLifecycle`, `MerchantService`.

## Где что менять

| Задача                    | Файлы                                                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Новый враг                | `shared/config/enemies.ts`, `client/content/enemyContent.ts`, модель в манифесте                                                   |
| Новое оружие              | `shared/config/weapons.ts`, `client/content/weaponContent.ts`, тексты в локалях                                                    |
| Новая ачивка              | `meta/achievements/AchievementId.ts`, `achievementCatalog.ts`, `content/achievementContent.ts`, при необходимости правило счётчика |
| Новая карта               | `shared/world/maps/*.ts`, `mapCatalog.ts` (тест связности проверит)                                                                |
| Новое сообщение протокола | `ClientMessage.ts`/`ServerMessage.ts`, кодек в `codecs/`, `protocolVersion`++                                                      |
