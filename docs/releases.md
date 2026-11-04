# Релизы

Версии — [SemVer](https://semver.org/lang/ru/), история — [CHANGELOG.md](../CHANGELOG.md).
Одна версия на весь монорепо: корневой `package.json` и `packages/*/package.json` всегда совпадают.

## Как выходит релиз

1. В PR опишите изменение в `[Unreleased]` по группам «Добавлено», «Изменено», «Исправлено» со
   ссылкой на PR.
2. Перед ревью выполните `pnpm release <major|minor|patch>`: версия поднимется во всех
   `package.json`, а `[Unreleased]` переедет в `## [X.Y.Z] - дата`.
3. Джоб `Version` (`.github/workflows/version.yml`) проверяет, что версия поднята так, как велят
   метки и заголовок PR, и что для неё есть раздел в CHANGELOG. Ошибка называет нужную команду.
4. После мержа `.github/workflows/release.yml` ставит тег `vX.Y.Z` на мерж-коммит и публикует
   GitHub Release с текстом раздела.

Секреты не нужны: в `master` CI ничего не пушит, тег и релиз создаёт встроенный `GITHUB_TOKEN`.
Поэтому нет и петель. Деплой (`ci.yml`, [deploy.md](deploy.md)) не меняется.

## Тип подъёма

| Условие                                                    | Подъём      |
| ---------------------------------------------------------- | ----------- |
| метка `release:skip`                                       | без релиза  |
| метка `release:major` / `minor` / `patch`                  | как в метке |
| заголовок `feat: …` / `feat(…): …` или метка `enhancement` | minor       |
| всё остальное                                              | patch       |

Метки важнее заголовка. `1.0.0` и дальше мажорные версии — только меткой `release:major`.
PR Dependabot помечаются `release:skip`: обновления зависимостей уходят в следующий релиз.

## Гонки

- `master` требует ветку, актуальную относительно базы, поэтому два PR не выпустят одну версию:
  второй после мержа первого получит конфликт в `package.json` и повторит `pnpm release`.
- Если запуск релиза пропал, следующий выпустит и пропущенную версию (по `package.json` до мержа).
- Чтобы PR без версии нельзя было влить, добавьте `Version` в обязательные проверки `master`.

## Бейджи

`.github/workflows/badges.yml` на каждый push в `master` запускает `pnpm coverage`
(`@vitest/coverage-v8`) и кладёт `coverage.json` и `tests.json` в формате
[shields.io endpoint](https://shields.io/badges/endpoint-badge) в ветку `badges` (один коммит,
перезаписывается). README берёт их оттуда через `raw.githubusercontent.com`.

Локально: `pnpm coverage` печатает сводку покрытия.
