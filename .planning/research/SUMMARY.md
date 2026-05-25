# Project Research Summary

**Project:** Coward's Game
**Milestone:** v1.18 Runtime Isolation and Multi-Language Exhibition Beta
**Domain:** Runtime isolation hardening, Python non-counted exhibition beta, signed-in multi-language exhibition proof, broker topology and privacy monitors
**Researched:** 2026-05-25
**Confidence:** High for repo-local baseline and phase structure; medium for final isolation claims until v1.18 hostile probes and local live proof are implemented.

## Executive Summary

v1.18 should strengthen the runtime isolation boundary without overclaiming production sandbox certification. The recommended path is to treat v1.17 as the floor, harden Python subprocess behavior, collect container/gVisor-style readiness evidence, replace heuristic Python validation with real AST/compile validation where practical, and prove the user-facing value through a signed-in non-counted exhibition beta flow.

The user-facing proof should be strict: local account, JS/TS Strategy Revision, Python Strategy Revision, non-counted exhibition MatchSet, Go -> Runtime Broker -> isolated runtime execution, and replay evidence with public-safe outputs. Python may promote from experimental proof to non-counted exhibition beta only if these gates pass; ranked/counted eligibility, arbitrary package installs, and production sandbox certification remain out of scope.

## Stack Findings

- Preserve the v1.17 topology: web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> isolated runtime implementation(s).
- Keep Go as orchestration, persistence-facing backend, Match lifecycle, scoring, and public evidence owner.
- Keep hostile Strategy execution inside runtime implementation boundaries reached only through schema-validated ABI envelopes.
- Python interpreter flags such as isolated mode and safe path behavior are useful hardening knobs, but not sufficient as a standalone hostile-code sandbox.
- Node child process timeout/output controls and Docker/gVisor-style container controls can provide readiness evidence, but v1.18 should avoid production sandbox claims unless evidence genuinely supports them.

## Feature Findings

- Table stakes are baseline/threat model, process/resource hardening, real Python validation, immutable account-owned non-counted Python revisions, signed-in exhibition proof, monitor/probe/privacy gates, and final promotion decision.
- The signed-in exhibition flow closes the main v1.17 residual gap: browser-authenticated non-counted exhibition submission was deferred.
- "Non-counted exhibition beta" is the right product label because it communicates user-facing availability without implying ranked/counted support.

## Architecture Findings

- Runtime selection should remain exact-match and fail-closed through the Runtime Broker registry and runtime ABI metadata.
- Validation and execution import surfaces must remain separated so validation paths do not pull runtime execution adapters into Next/web evaluation.
- Topology and boundary monitors should extend existing scripts rather than introduce a separate governance system.
- Replay/public evidence remains a public projection concern and must not expose source, StrategyMemory, SoldierMemory, objectives, stderr, stack, host paths, package paths, tokens, DB DSNs, or private runtime internals.

## Watch Out For

- Do not execute Python or JS/TS Strategy code in web/API/Go.
- Do not let Python own backend routes, persistence, job lifecycle, Match completion, scoring, public evidence, or fallback behavior.
- Do not allow JS/TS regressions while hardening Python.
- Do not turn container/gVisor evidence into a production sandbox claim prematurely.
- Do not permit arbitrary PyPI/package installs.
- Do not accept stopped runtime service or stopped Python runtime behavior that silently falls back.

## Recommended Phase Structure

1. Phase 117: Isolation Baseline and Threat Model.
2. Phase 118: Runtime Resource and Process Hardening.
3. Phase 119: Python Validation and Public-Safe Diagnostics.
4. Phase 120: Exhibition Beta Revision and Eligibility Model.
5. Phase 121: Signed-In Multi-Language Exhibition Proof.
6. Phase 122: Topology, Monitors, Hostile Probes, and Privacy Gate.
7. Phase 123: Final Evidence, Promotion Decision, and Archive Gate.

## Sources Consulted

- Repo-local planning archive through v1.17, especially `.planning/milestones/v1.17-*` and `.planning/artifacts/v1.17-*`.
- Repo-local runtime/spec code: `packages/runtime-python`, `apps/runtime-service`, `apps/go-backend/runtime_service_client.go`, `scripts/check-boundary-monitors.ts`, and `scripts/check-local-topology.ts`.
- Python command-line documentation for isolated mode and safe path behavior: https://docs.python.org/3.9/using/cmdline.html
- Node child process documentation for process lifecycle, timeout, and stdio behavior: https://nodejs.org/api/child_process.html
- Docker run documentation for read-only filesystems, capabilities, security options, memory, PID, and network controls: https://docs.docker.com/reference/cli/docker/container/run
- gVisor overview for container sandbox candidate framing: https://gvisor.dev/docs/

---
*Research summary written: 2026-05-25*
