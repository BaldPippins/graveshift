#!/usr/bin/env bash
set -Eeuo pipefail

readonly ROOT=/opt/graveshift
readonly STATE="$ROOT/state"
readonly HEALTH_TIMEOUT_SECONDS=120
readonly CUTOVER_TIMEOUT_SECONDS=10
readonly DRAIN_TIMEOUT_SECONDS=960

log() {
  printf '[deploy] %s\n' "$*" >&2
}

fail() {
  log "error: $*"
  exit 1
}

env_value() {
  sed -n "s/^$1=//p" "$ROOT/.env" | tail -n 1
}

set_env_value() {
  local key=$1 value=$2 next
  next=$(mktemp "$ROOT/.env.XXXXXX")
  grep -v "^$key=" "$ROOT/.env" >"$next" || true
  printf '%s=%s\n' "$key" "$value" >>"$next"
  chmod 600 "$next"
  mv "$next" "$ROOT/.env"
}

compose() {
  docker compose --project-directory "$ROOT" "$@"
}

validate_image() {
  local image=$1 repository
  repository=$(env_value IMAGE_REPOSITORY)
  [[ -n "$repository" ]] || fail "IMAGE_REPOSITORY is not set in $ROOT/.env"
  [[ "$image" =~ ^${repository//./\\.}@sha256:[a-f0-9]{64}$ ]] ||
    fail "image must be $repository@sha256:<digest>"
}

pull_with_config() {
  local image=$1 token=$2 config=$3
  if [[ -n "$token" ]]; then
    printf '%s' "$token" |
      DOCKER_CONFIG="$config" docker login ghcr.io -u deploy --password-stdin >/dev/null 2>&1 ||
      return 1
  fi
  DOCKER_CONFIG="$config" docker pull --quiet "$image" >/dev/null
}

pull_image() {
  local image=$1 token config status=0
  IFS= read -r token || true
  config=$(mktemp -d)
  pull_with_config "$image" "$token" "$config" || status=$?
  rm -rf "$config"
  ((status == 0)) || fail "could not pull $image"
}

active_slot() {
  cat "$STATE/active" 2>/dev/null || echo none
}

other_slot() {
  [[ "$1" == blue ]] && echo green || echo blue
}

container_of() {
  compose ps --all --quiet "$1"
}

wait_healthy() {
  local slot=$1 container status deadline
  deadline=$((SECONDS + HEALTH_TIMEOUT_SECONDS))
  container=$(container_of "$slot")
  while ((SECONDS < deadline)); do
    status=$(docker inspect --format '{{.State.Health.Status}}' "$container" 2>/dev/null || echo missing)
    [[ "$status" == healthy ]] && return 0
    [[ "$status" == missing || "$status" == unhealthy ]] && break
    sleep 2
  done
  docker logs --tail 50 "$container" >&2 || true
  return 1
}

cancel_drain() {
  local slot=$1 pidfile="$STATE/drain-$1.pid"
  if [[ -f "$pidfile" ]]; then
    kill "$(cat "$pidfile")" 2>/dev/null || true
    rm -f "$pidfile"
  fi
}

start_drain() {
  local slot=$1
  [[ -n "$(compose ps --quiet "$slot")" ]] || return 0
  log "draining $slot for up to ${DRAIN_TIMEOUT_SECONDS}s"
  setsid nohup docker compose --project-directory "$ROOT" stop --timeout "$DRAIN_TIMEOUT_SECONDS" "$slot" \
    >"$STATE/drain-$slot.log" 2>&1 </dev/null &
  echo $! >"$STATE/drain-$slot.pid"
}

prune_images() {
  local repository
  repository=$(env_value IMAGE_REPOSITORY)
  docker image ls "$repository" --format '{{.ID}}' |
    tail -n +6 | xargs -r docker image rm >/dev/null 2>&1 || true
}

main() {
  local image=${1:-} active target
  [[ $# -eq 1 ]] || fail "usage: deploy.sh <image@sha256:digest>"
  validate_image "$image"
  mkdir -p "$STATE"
  exec 9>"$STATE/deploy.lock"
  flock --timeout 600 9 || fail "another deploy is still running"

  log "pulling $image"
  pull_image "$image"

  active=$(active_slot)
  target=$(other_slot "$active")
  log "active: $active, deploying to: $target"

  cancel_drain "$target"
  set_env_value "${target^^}_IMAGE" "$image"
  compose up --detach --wait caddy
  compose up --detach --no-deps --force-recreate --timeout "$CUTOVER_TIMEOUT_SECONDS" "$target"

  if ! wait_healthy "$target"; then
    compose stop --timeout "$CUTOVER_TIMEOUT_SECONDS" "$target" >/dev/null || true
    fail "$target did not become healthy, $active keeps serving"
  fi

  echo "$target" >"$STATE/active"
  log "$target is live"
  [[ "$active" == none ]] || start_drain "$active"
  prune_images
}

main "$@"
