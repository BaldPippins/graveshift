# Журнал изменений

Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), версии —
[SemVer](https://semver.org/lang/ru/). Как выпускаются релизы — [docs/releases.md](docs/releases.md).

## [Unreleased]

## [0.2.1] - 2026-11-11

### Изменено

- Bots buy and wield their strongest weapons ([#21](https://github.com/BaldPippins/graveshift/pull/21))

## [0.2.0] - 2026-11-11

### Добавлено

- feat: add level editor and map management ([#16](https://github.com/BaldPippins/graveshift/pull/16))

### Изменено

- Bump caddy from 2-alpine to 2-alpine in /deploy ([#17](https://github.com/BaldPippins/graveshift/pull/17))
- Bump the actions group with 2 updates ([#18](https://github.com/BaldPippins/graveshift/pull/18))
- Bump the production group with 3 updates ([#19](https://github.com/BaldPippins/graveshift/pull/19))
- Bump the development group with 6 updates ([#20](https://github.com/BaldPippins/graveshift/pull/20))

## [0.1.4] - 2026-11-06

### Изменено

- Scenery polish, lighter frames and bots that rearm traps ([#14](https://github.com/BaldPippins/graveshift/pull/14))

## [0.1.3] - 2026-11-06

### Изменено

- Bump fastify from 5.12.7 to 5.12.8 in the production group ([#13](https://github.com/BaldPippins/graveshift/pull/13))
- docs: require keeping project documentation current ([#15](https://github.com/BaldPippins/graveshift/pull/15))

## [0.1.2] - 2026-11-05

### Изменено

- refactor(client): simplify UI components and controls ([#12](https://github.com/BaldPippins/graveshift/pull/12))

## [0.1.1] - 2026-11-05

### Добавлено

- Журнал изменений и автоматический релиз при мерже в `master`: версия, тег, GitHub Release
  ([#10](https://github.com/BaldPippins/graveshift/pull/10)).
- `pnpm coverage` и бейджи в README: CI, тесты, покрытие, версия, лицензия, стек
  ([#10](https://github.com/BaldPippins/graveshift/pull/10)).
- Лицензия AGPL-3.0 с обязательным указанием авторства ([#10](https://github.com/BaldPippins/graveshift/pull/10)).

## [0.1.0] - 2026-11-04

Первая версия: прототип и всё, что влито в `master` до появления журнала.

### Добавлено

- Кооп-шутер на 1–4 игрока с ботами-напарниками: авторитарный сервер, предсказание и
  интерполяция, волны нежити, торговец с лавкой, ачивки и статистика, ПК и телефоны, русский и
  английский. Docker-образ, CI со сканом Trivy и blue-green деплой без обрыва матчей.
- Настройка «Камера за прицелом», пинги людей в панели команды и в таблице, монеты всей команды в
  панели, итоговый рейтинг по очкам матча с колонками очков, боссов и смертей
  ([#1](https://github.com/BaldPippins/graveshift/pull/1)).
- Настройки матча в лобби: 10, 15 или 20 волн и огонь по своим; новые составы 15-й и 20-й волн
  ([#2](https://github.com/BaldPippins/graveshift/pull/2)).
- Ближний бой (лопата, меч, копьё, топор, молот) с прокачкой в лавке, ярость за 10 убийств вблизи,
  прыжки через гробы и надгробия, оживление торговца за монеты, каталог оружия, пять новых ачивок
  ([#3](https://github.com/BaldPippins/graveshift/pull/3)).
- Индикатор перезарядки ([#4](https://github.com/BaldPippins/graveshift/pull/4)).
- Звук на ассетах Kenney с громкостью в настройках, летающий нетопырь со своей моделью,
  `pnpm demo:bots`; боты прыгают, собирают монеты и оживляют торговца
  ([#5](https://github.com/BaldPippins/graveshift/pull/5)).
- Живая таблица счёта во время матча: убийства, смерти, подъёмы, очки и место
  ([#6](https://github.com/BaldPippins/graveshift/pull/6)).
- Иконка игры во вкладке и ссылка на GitHub BaldPippins в меню
  ([#7](https://github.com/BaldPippins/graveshift/pull/7)).
- Ломаемые надгробия, ёлки и фонари, которые встают обратно через 2–3 волны; ловушки (пороховая
  бочка и капкан) за монеты; торговец убегает, когда его бьют; прицел-курсор и подсветка
  прокачанного оружия ([#11](https://github.com/BaldPippins/graveshift/pull/11)).

### Изменено

- Лавка и «Как играть» разбиты на вкладки и влезают на ПК и телефоне; у апгрейдов превью
  «сейчас → после»; лучи выстрелов и враги переведены на стратегии и фабрики
  ([#5](https://github.com/BaldPippins/graveshift/pull/5)).
- Одинаковые очки дают одинаковое место; во время открытой таблицы можно играть
  ([#6](https://github.com/BaldPippins/graveshift/pull/6)).
- Таблица счёта стала шире ([#7](https://github.com/BaldPippins/graveshift/pull/7)).
- Иконка GitHub вынесена в SVG-файл ([#8](https://github.com/BaldPippins/graveshift/pull/8)).

### Исправлено

- Мёртвый торговец больше не оставляет непроходимую клетку; боты перестали дёргаться
  ([#1](https://github.com/BaldPippins/graveshift/pull/1)).
- На телефоне не теряется перезарядка, свайпы и прокрутка во встроенных браузерах заблокированы
  ([#3](https://github.com/BaldPippins/graveshift/pull/3)).
- Выравнивание ползунка громкости ([#6](https://github.com/BaldPippins/graveshift/pull/6)).
- Таблица результатов влезает на широких экранах
  ([#9](https://github.com/BaldPippins/graveshift/pull/9)).

[Unreleased]: https://github.com/BaldPippins/graveshift/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/BaldPippins/graveshift/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/BaldPippins/graveshift/compare/v0.1.4...v0.2.0
[0.1.4]: https://github.com/BaldPippins/graveshift/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/BaldPippins/graveshift/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/BaldPippins/graveshift/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/BaldPippins/graveshift/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/BaldPippins/graveshift/releases/tag/v0.1.0
