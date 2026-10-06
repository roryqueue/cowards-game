#!/bin/sh
set -eu
umask 077
ulimit -c 0
unset NODE_OPTIONS NODE_COMPILE_CACHE NODE_REDIRECT_WARNINGS NODE_V8_COVERAGE
export TSX_DISABLE_CACHE=1 NODE_DISABLE_COMPILE_CACHE=1
case "${1:-}" in
  prepare-supervisor-diagnostic-v7|run-supervisor-diagnostic-v7|verify-supervisor-diagnostic-v7) LEAN_CORRECTION_TEMP="$(pwd -P)/.strategy-lab/lean-correction-supervisor-diagnostic-20261006-v7-tmp" ;;
  prepare-supervisor-baseline-v7|run-supervisor-baseline-v7|verify-supervisor-baseline-v7) LEAN_CORRECTION_TEMP="$(pwd -P)/.strategy-lab/lean-correction-supervisor-baseline-20261006-v7-tmp" ;;
  prepare-supervisor-diagnostic-v6|run-supervisor-diagnostic-v6|verify-supervisor-diagnostic-v6) LEAN_CORRECTION_TEMP="$(pwd -P)/.strategy-lab/lean-correction-supervisor-diagnostic-20261006-v6-tmp" ;;
  prepare-supervisor-baseline-v6|run-supervisor-baseline-v6|verify-supervisor-baseline-v6) LEAN_CORRECTION_TEMP="$(pwd -P)/.strategy-lab/lean-correction-supervisor-baseline-20261006-v6-tmp" ;;
  prepare-diagnostic|run-diagnostic|verify-diagnostic) LEAN_CORRECTION_TEMP="$(pwd -P)/.strategy-lab/lean-correction-diagnostic-20261004-v1-tmp" ;;
  prepare-baseline|run-baseline|verify-baseline) LEAN_CORRECTION_TEMP="$(pwd -P)/.strategy-lab/lean-correction-baseline-20261004-v1-tmp" ;;
  prepare-supervisor-diagnostic-v4|run-supervisor-diagnostic-v4|verify-supervisor-diagnostic-v4) LEAN_CORRECTION_TEMP="$(pwd -P)/.strategy-lab/lean-correction-supervisor-diagnostic-20261005-v4-tmp" ;;
  prepare-supervisor-baseline-v4|run-supervisor-baseline-v4|verify-supervisor-baseline-v4) LEAN_CORRECTION_TEMP="$(pwd -P)/.strategy-lab/lean-correction-supervisor-baseline-20261005-v4-tmp" ;;
  *) exit 1 ;;
esac
[ -d .strategy-lab ] && [ ! -L .strategy-lab ] && [ ! -L "$LEAN_CORRECTION_TEMP" ] || exit 1
mkdir -p -m 700 "$LEAN_CORRECTION_TEMP"
export TMPDIR="$LEAN_CORRECTION_TEMP"
exec node --max-old-space-size=768 --import tsx scripts/run-v1-38-lean-correction.ts "$@"
