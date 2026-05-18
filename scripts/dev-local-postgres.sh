#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PGDATA="${COWARDS_PGDATA:-/tmp/cowards-game-postgres-data}"
PGLOG="${COWARDS_PGLOG:-/tmp/cowards-game-postgres.log}"
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER_APP="${PGUSER_APP:-cowards}"
PGPASSWORD_APP="${PGPASSWORD_APP:-cowards}"
PGDATABASE_APP="${PGDATABASE_APP:-cowards_game}"
DATABASE_URL="${DATABASE_URL:-postgresql://${PGUSER_APP}:${PGPASSWORD_APP}@${PGHOST}:${PGPORT}/${PGDATABASE_APP}}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

wait_for_postgres() {
  for _ in $(seq 1 40); do
    if pg_isready -h "$PGHOST" -p "$PGPORT" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.25
  done

  echo "Postgres did not become ready on ${PGHOST}:${PGPORT}." >&2
  if [ -f "$PGLOG" ]; then
    tail -n 40 "$PGLOG" >&2
  fi
  exit 1
}

start_postgres() {
  require_command initdb
  require_command pg_ctl
  require_command pg_isready

  if pg_isready -h "$PGHOST" -p "$PGPORT" >/dev/null 2>&1; then
    echo "Postgres already running on ${PGHOST}:${PGPORT}."
    return 0
  fi

  if [ ! -d "$PGDATA" ]; then
    echo "Initializing local Postgres data directory at ${PGDATA}."
    initdb -D "$PGDATA" >/tmp/cowards-game-initdb.log
  fi

  echo "Starting local Postgres on ${PGHOST}:${PGPORT}."
  pg_ctl -D "$PGDATA" -o "-p ${PGPORT}" -l "$PGLOG" start
  wait_for_postgres
}

ensure_database() {
  require_command psql
  require_command rg

  if ! psql -h "$PGHOST" -p "$PGPORT" -d postgres -tc "select 1 from pg_roles where rolname='${PGUSER_APP}'" | rg -q 1; then
    psql -h "$PGHOST" -p "$PGPORT" -d postgres -c "create role ${PGUSER_APP} login password '${PGPASSWORD_APP}'"
  fi

  if ! psql -h "$PGHOST" -p "$PGPORT" -d postgres -tc "select 1 from pg_database where datname='${PGDATABASE_APP}'" | rg -q 1; then
    psql -h "$PGHOST" -p "$PGPORT" -d postgres -c "create database ${PGDATABASE_APP} owner ${PGUSER_APP}"
  fi
}

migrate_database() {
  echo "Running database migrations."
  DATABASE_URL="$DATABASE_URL" pnpm exec tsx -e "
    import { createDatabasePool } from './packages/persistence/src/db.ts';
    import { migrate } from './packages/persistence/src/migrations.ts';
    void (async () => {
      const pool = createDatabasePool();
      try {
        const result = await migrate(pool);
        console.log(JSON.stringify(result));
      } finally {
        await pool.end();
      }
    })();
  "
}

main() {
  if [ "${1:-}" = "--" ]; then
    shift
  fi

  cd "$ROOT_DIR"
  require_command pnpm
  start_postgres
  ensure_database
  migrate_database

  if [ "${1:-}" = "--setup-only" ]; then
    echo "Local database is ready at ${DATABASE_URL}."
    return 0
  fi

  echo "Starting Coward's Game web app and worker."
  echo "Web: http://localhost:3000"

  DATABASE_URL="$DATABASE_URL" pnpm --filter @cowards/web dev &
  web_pid=$!
  DATABASE_URL="$DATABASE_URL" pnpm --filter @cowards/worker dev &
  worker_pid=$!

  cleanup() {
    kill "$web_pid" "$worker_pid" >/dev/null 2>&1 || true
    wait "$web_pid" "$worker_pid" >/dev/null 2>&1 || true
  }
  trap cleanup INT TERM EXIT

  wait "$web_pid" "$worker_pid"
}

main "$@"
