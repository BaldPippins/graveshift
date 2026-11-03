#!/usr/bin/env bash
set -Eeuo pipefail

readonly HERE=$(cd "$(dirname "$0")" && pwd)
readonly FORWARDED=(DEPLOY_PUBLIC_KEY GRAVESHIFT_DOMAIN IMAGE_REPOSITORY)

if [[ $# -ne 1 ]]; then
  printf 'usage: %s <ssh-target>\n' "$0" >&2
  exit 64
fi

assignments=()
for name in "${FORWARDED[@]}"; do
  [[ -n "${!name:-}" ]] && assignments+=("$name=$(printf '%q' "${!name}")")
done

tar -C "$HERE" -cz compose.yaml Caddyfile install.sh bin |
  ssh "$1" "set -e; bundle=\$(mktemp -d); trap 'rm -rf \$bundle' EXIT; tar -xz -C \$bundle; \
    sudo --non-interactive env ${assignments[*]} bash \$bundle/install.sh"
