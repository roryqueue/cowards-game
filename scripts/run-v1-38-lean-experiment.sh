#!/bin/sh
# Pre-Node boundary for the prospective private pilot. Invoke from the repo
# root; the TypeScript route checks this inherited scope again after loading.
set -eu
umask 077
ulimit -c 0
unset NODE_OPTIONS NODE_COMPILE_CACHE NODE_REDIRECT_WARNINGS NODE_V8_COVERAGE
export TSX_DISABLE_CACHE=1 NODE_DISABLE_COMPILE_CACHE=1
if [ ! -d .strategy-lab ] || [ -L .strategy-lab ]; then
  echo 'LEAN_PILOT_WRITABLE_SCOPE' >&2
  exit 1
fi
LEAN_PILOT_TEMP="$(pwd -P)/.strategy-lab/lean-experiment-20261003-v3-tmp"
if [ -L "$LEAN_PILOT_TEMP" ]; then
  echo 'LEAN_PILOT_WRITABLE_SCOPE' >&2
  exit 1
fi
mkdir -p -m 700 "$LEAN_PILOT_TEMP"
export TMPDIR="$LEAN_PILOT_TEMP"
if [ "${1:-}" = '--probe-launch-scope' ]; then
  [ "${LEAN_LAUNCH_PROBE:-}" = 1 ] || exit 1
  printf 'cache=%s compile=%s node_options=%s compile_cache=%s warnings=%s coverage=%s core=%s tmp=%s\n' \
    "$TSX_DISABLE_CACHE" "$NODE_DISABLE_COMPILE_CACHE" "${NODE_OPTIONS-unset}" \
    "${NODE_COMPILE_CACHE-unset}" "${NODE_REDIRECT_WARNINGS-unset}" \
    "${NODE_V8_COVERAGE-unset}" "$(ulimit -c)" "$TMPDIR"
  exit 0
fi
unset LEAN_LAUNCH_PROBE
exec node --max-old-space-size=768 --import tsx scripts/run-v1-38-lean-experiment.ts "$@"
