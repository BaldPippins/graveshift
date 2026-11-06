---
title: Админский rate limit за Caddy и trustProxy в Fastify
date: 2026-11-06
category: security-issues
module: server/transport
problem_type: security_issue
component: authentication
symptoms:
  - Неверные попытки одного пользователя блокируют вход всем администраторам за прокси.
root_cause: config_error
resolution_type: config_change
severity: medium
framework_version: Fastify 5.12.8
retire_when: Изменится поведение числового trustProxy в используемой версии Fastify; проверить его исходный код и тесты.
tags: [fastify, caddy, reverse-proxy, rate-limit, admin]
---

# Админский rate limit за Caddy и trustProxy в Fastify

## Problem

Ограничение неверных попыток входа использует `request.ip`. За Caddy без доверенного прокси
Fastify видит общий адрес Caddy, поэтому один источник может временно заблокировать всех админов.

## Symptoms

- Запросы разных посетителей попадают в общий счётчик неуспешных попыток.
- После исчерпания лимита правильный ключ другого администратора получает ответ `429`.

## What Didn't Work

`trustProxy: 1` выглядел как ограничение доверия одним переходом, но в установленном Fastify
5.12.8 числовой вариант намеренно не доверяет прокси. Проверка через `app.inject` с адресом
прокси и разными `X-Forwarded-For` возвращала один и тот же адрес соединения.

## Solution

В Compose включён `GRAVESHIFT_TRUST_PROXY=1`, а сервер при этой настройке передаёт Fastify
список `loopback, linklocal, uniquelocal`. Без настройки заголовкам прокси не доверяют.
Caddy по умолчанию игнорирует клиентские `X-Forwarded-*` и формирует собственные значения.
Игровой порт в Compose не опубликован: доверять внутренним адресам безопасно только при
контролируемом доступе к внутренней сети и через доверенный прокси.

## Why This Works

Fastify определяет адрес посетителя из заголовка только при доверии непосредственному прокси.
Явные диапазоны позволяют различить посетителей за Caddy; публичное прямое соединение не может
подменить адрес через заголовок. Числовое значение не применяет это поведение в проверенной версии.

## Prevention

- Проверяйте итоговую конфигурацию сервера, а не только отдельный роут: тест
  `packages/server/src/transport/createHttpServer.test.ts` проверяет разные адреса за прокси.
- Проверяйте, что публичное прямое соединение не обходит лимит подменой заголовка:
  `packages/server/src/transport/registerAdminRoutes.test.ts`.
- При обновлении Fastify повторно проверяйте поведение `trustProxy` и ограничения сетевого доступа.

## Related Issues

- `docs/deploy.md` — граница доверия прокси и настройки админ-панели.
