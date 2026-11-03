#!/usr/bin/env bash
set -Eeuo pipefail

read -r -a request <<<"${SSH_ORIGINAL_COMMAND:-}"

if [[ ${#request[@]} -ne 2 || "${request[0]}" != deploy ]]; then
  printf 'usage: deploy <image@sha256:digest>\n' >&2
  exit 64
fi

exec sudo --non-interactive /opt/graveshift/bin/deploy.sh "${request[1]}"
