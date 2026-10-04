#!/bin/sh
# Prospective private current-baseline boundary. Invoke from the repository root.
set -eu
umask 077
ulimit -c 0
unset NODE_OPTIONS NODE_COMPILE_CACHE NODE_REDIRECT_WARNINGS NODE_V8_COVERAGE
export TSX_DISABLE_CACHE=1 NODE_DISABLE_COMPILE_CACHE=1
if [ ! -d .strategy-lab ] || [ -L .strategy-lab ]; then
  echo 'LEAN_BASELINE_WRITABLE_SCOPE' >&2
  exit 1
fi
LEAN_BASELINE_TEMP="$(pwd -P)/.strategy-lab/lean-baseline-20261004-v1-tmp"
if [ -L "$LEAN_BASELINE_TEMP" ]; then
  echo 'LEAN_BASELINE_WRITABLE_SCOPE' >&2
  exit 1
fi
mkdir -p -m 700 "$LEAN_BASELINE_TEMP"
export TMPDIR="$LEAN_BASELINE_TEMP"
if [ "${1:-}" = '--probe-launch-scope' ]; then
  [ "${LEAN_BASELINE_LAUNCH_PROBE:-}" = 1 ] || exit 1
  printf 'cache=%s compile=%s node_options=%s compile_cache=%s warnings=%s coverage=%s core=%s tmp=%s\n' \
    "$TSX_DISABLE_CACHE" "$NODE_DISABLE_COMPILE_CACHE" "${NODE_OPTIONS-unset}" \
    "${NODE_COMPILE_CACHE-unset}" "${NODE_REDIRECT_WARNINGS-unset}" \
    "${NODE_V8_COVERAGE-unset}" "$(ulimit -c)" "$TMPDIR"
  exit 0
fi
unset LEAN_BASELINE_LAUNCH_PROBE
# Heap setting is a prospective bound, not an RSS or physical-memory claim.
exec node --max-old-space-size=768 --import tsx scripts/run-v1-38-lean-baseline.ts "$@"
