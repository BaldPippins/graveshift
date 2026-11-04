# Журнал изменений

Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), версии —
[SemVer](https://semver.org/lang/ru/). Как выпускаются релизы — [docs/releases.md](docs/releases.md).

## [Unreleased]

### Добавлено

- Журнал изменений, автоматический релиз при мерже в `master` (версия, тег, GitHub Release),
  `pnpm coverage` и бейджи в README: CI, тесты, покрытие, версия, стек.
- Лицензия MIT.

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

[Unreleased]: https://github.com/BaldPippins/graveshift/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/BaldPippins/graveshift/releases/tag/v0.1.0
