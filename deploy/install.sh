#!/usr/bin/env bash
set -Eeuo pipefail

readonly SOURCE=$(cd "$(dirname "$0")" && pwd)
readonly ROOT=/opt/graveshift
readonly DEPLOY_USER=deploy
readonly SUDOERS=/etc/sudoers.d/graveshift-deploy

log() {
  printf '[install] %s\n' "$*" >&2
}

require_root() {
  [[ $EUID -eq 0 ]] || { log "run as root"; exit 1; }
}

ensure_deploy_user() {
  id "$DEPLOY_USER" >/dev/null 2>&1 ||
    useradd --system --create-home --shell /bin/bash "$DEPLOY_USER"
  passwd --lock "$DEPLOY_USER" >/dev/null
}

install_authorized_key() {
  [[ -n "${DEPLOY_PUBLIC_KEY:-}" ]] || { log "DEPLOY_PUBLIC_KEY not given, keeping current key"; return; }
  local ssh_dir="/home/$DEPLOY_USER/.ssh"
  install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$ssh_dir"
  printf 'restrict,command="%s/bin/ssh-gate.sh" %s\n' "$ROOT" "$DEPLOY_PUBLIC_KEY" >"$ssh_dir/authorized_keys"
  chown "$DEPLOY_USER:$DEPLOY_USER" "$ssh_dir/authorized_keys"
  chmod 600 "$ssh_dir/authorized_keys"
}

install_files() {
  install -d -m 755 -o root -g root "$ROOT" "$ROOT/bin"
  install -d -m 700 -o root -g root "$ROOT/state"
  install -m 644 -o root -g root "$SOURCE/compose.yaml" "$SOURCE/Caddyfile" "$ROOT/"
  install -m 755 -o root -g root "$SOURCE/bin/deploy.sh" "$SOURCE/bin/ssh-gate.sh" "$ROOT/bin/"
}

set_env_default() {
  local key=$1 value=$2 next
  [[ -n "$value" ]] || return 0
  next=$(mktemp "$ROOT/.env.XXXXXX")
  grep -v "^$key=" "$ROOT/.env" >"$next" || true
  printf '%s=%s\n' "$key" "$value" >>"$next"
  mv "$next" "$ROOT/.env"
}

install_env() {
  touch "$ROOT/.env"
  chmod 600 "$ROOT/.env"
  set_env_default GRAVESHIFT_DOMAIN "${GRAVESHIFT_DOMAIN:-}"
  set_env_default IMAGE_REPOSITORY "${IMAGE_REPOSITORY:-}"
  set_env_default GRAVESHIFT_ADMIN_KEY "${GRAVESHIFT_ADMIN_KEY:-}"
  chown root:root "$ROOT/.env"
  chmod 600 "$ROOT/.env"
  for key in GRAVESHIFT_DOMAIN IMAGE_REPOSITORY; do
    grep -q "^$key=." "$ROOT/.env" || { log "$key is missing in $ROOT/.env"; exit 1; }
  done
}

install_sudoers() {
  local next
  next=$(mktemp)
  printf '%s ALL=(root) NOPASSWD: %s/bin/deploy.sh\n' "$DEPLOY_USER" "$ROOT" >"$next"
  visudo --check --file "$next" >/dev/null
  install -m 440 -o root -g root "$next" "$SUDOERS"
  rm -f "$next"
}

reload_proxy() {
  docker compose --project-directory "$ROOT" up --detach --wait caddy
  docker compose --project-directory "$ROOT" exec caddy caddy reload --config /etc/caddy/Caddyfile >/dev/null
}

main() {
  require_root
  ensure_deploy_user
  install_authorized_key
  install_files
  install_env
  install_sudoers
  reload_proxy
  log "done: $ROOT"
}

main "$@"
