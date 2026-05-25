# Phase 132: v1.20 Baseline, Candidate Decision, and Budget Contract - Research

**Status:** Complete
**Date:** 2026-05-25

## Findings

- `scripts/evaluate-runtime-sandbox.ts` is the existing artifact writer/checker for runtime isolation evidence.
- `packages/runtime-js/src/sandbox-evaluation.ts` owns the candidate taxonomy, probe execution, readiness lanes, no-fallback drills, guardrails, and public-safety checks.
- Current evaluator and readiness artifacts are v1.19-named, while active v1.20 requirements need v1.20-specific artifact names and schema versions.
- Docker/runc is locally available and the `node:24-alpine` image is present; `runsc` is not available as a host runtime.
- The existing container adapter already requests the required hardening controls: no network, read-only root, tmpfs scratch, memory/CPU/PID limits, dropped capabilities, no-new-privileges, no shell, and JSON IPC.
- Go runtime-service HTTP timeout already exists as an outer budget knob through `COWARDS_RUNTIME_SERVICE_HTTP_TIMEOUT_MS`; v1.20 should document budget layers before changing behavior.

## Planning Implications

- Phase 132 should update evidence versioning and artifact names before later phases add candidate/probe/proof details.
- The evaluator should auto-run Docker evidence only when Docker and the configured image are present; strict container commands still fail loudly.
- `runsc` evidence must stay a host preflight failure, not a network download or Docker-in-Docker shortcut.
- Budget evidence should be artifact-backed and conservative: preserve per-Strategy caps, tune only outer budgets after measurements justify it.
