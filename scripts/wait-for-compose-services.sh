#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
POSTGRES_CONTAINER="${COWARDS_POSTGRES_CONTAINER:-cowards-postgres}"
REDIS_CONTAINER="${COWARDS_REDIS_CONTAINER:-cowards-redis}"
TIMEOUT_SECONDS="${COWARDS_COMPOSE_HEALTH_TIMEOUT:-90}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[service startup] Missing required command: $1" >&2
    exit 1
  fi
}

health_status() {
  docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$1" 2>/dev/null || true
}

wait_for_container() {
  local container="$1"
  local start
  start="$(date +%s)"

  while true; do
    local status
    status="$(health_status "$container")"
    if [ "$status" = "healthy" ] || [ "$status" = "running" ]; then
      echo "[service startup] ${container} is ${status}."
      return 0
    fi

    if [ "$status" = "unhealthy" ]; then
      echo "[service startup] ${container} is unhealthy." >&2
      docker logs --tail 40 "$container" >&2 || true
      exit 1
    fi

    local now
    now="$(date +%s)"
    if [ $((now - start)) -ge "$TIMEOUT_SECONDS" ]; then
      echo "[service startup] Timed out waiting for ${container}; last status: ${status:-missing}." >&2
      docker compose ps >&2 || true
      docker logs --tail 40 "$container" >&2 || true
      exit 1
    fi

    sleep 1
  done
}

main() {
  cd "$ROOT_DIR"
  require_command docker

  echo "[service startup] Starting Docker Compose services: postgres redis"
  docker compose up -d postgres redis
  wait_for_container "$POSTGRES_CONTAINER"
  wait_for_container "$REDIS_CONTAINER"
}

main "$@"
