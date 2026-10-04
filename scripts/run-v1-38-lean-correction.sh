#!/bin/sh
set -eu
umask 077
ulimit -c 0
unset NODE_OPTIONS NODE_COMPILE_CACHE NODE_REDIRECT_WARNINGS NODE_V8_COVERAGE
export TSX_DISABLE_CACHE=1 NODE_DISABLE_COMPILE_CACHE=1
case "${1:-}" in
  prepare-diagnostic|run-diagnostic|verify-diagnostic) LEAN_CORRECTION_TEMP="$(pwd -P)/.strategy-lab/lean-correction-diagnostic-20261004-v1-tmp" ;;
  prepare-baseline|run-baseline|verify-baseline) LEAN_CORRECTION_TEMP="$(pwd -P)/.strategy-lab/lean-correction-baseline-20261004-v1-tmp" ;;
  *) exit 1 ;;
esac
[ -d .strategy-lab ] && [ ! -L .strategy-lab ] && [ ! -L "$LEAN_CORRECTION_TEMP" ] || exit 1
mkdir -p -m 700 "$LEAN_CORRECTION_TEMP"
export TMPDIR="$LEAN_CORRECTION_TEMP"
exec node --max-old-space-size=768 --import tsx scripts/run-v1-38-lean-correction.ts "$@"
