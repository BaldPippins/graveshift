# Архитектура (обязательно)

- `shared` не импортирует Node, DOM, three, ws, fastify, preact.
- Сервер: `domain` ← `application` ← `infrastructure`/`transport`. Домен не знает про сокеты,
  таймеры и Fastify; взаимодействие наружу — через порты в `application/ports`.
- Клиент: `game`, `net`, `input`, `meta`, `audio` не импортируют `render`, `ui`, three, preact.
  `render` не импортирует `ui` и `net`. Склейка — только в `app` и `main.tsx`.
- Зависимости создаются в composition root и передаются через конструктор. Синглтонов нет.
- Сервер авторитарен: клиент шлёт намерения, проверки правил — в общих функциях `shared/rules`.
- Изменения мира на сервере — через `MatchEventBus` (`GameEvent`); новые подписчики не трогают системы.
- Механика — `shared/config`, тексты/модели/цвета — `client/content`.
- Изменил протокол — обнови кодек, тест round-trip и подними `NETWORK.protocolVersion`.
- Новая логика симуляции — покрыть тестом в домене (`Match.step()` детерминирован с seed).
