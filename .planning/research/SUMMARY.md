# Project Research Summary

**Project:** Coward's Game
**Milestone:** v1.17 Python Strategy Runtime Pilot and Broker Contract Hardening
**Domain:** Runtime Broker contract, experimental Python Strategy runtime, immutable Strategy artifacts, non-counted MatchSet proof, topology and privacy hardening
**Researched:** 2026-05-24
**Confidence:** High for repo-local baseline and required boundary shape; medium for final Python runtime mechanics until Phase 113 validates hostile-code and runtime failure behavior in code.

## Executive Summary

v1.17 should make Python a real experimental end-to-end Strategy language without weakening the v1.16 backend-retirement boundary. The safest path is broker first: define a concrete Strategy Execution Service / Runtime Broker registry contract, harden Strategy artifact metadata, add Python validation, then execute Python only behind the same runtime ABI envelope family that JS/TS uses today.

The repo already contains `packages/runtime-python`, but it is a method-level spike rather than a full Match runtime-service path. It should be hardened and routed through the runtime service registry, not promoted directly. Python must remain non-counted and non-ranked, with a Workshop or exhibition-style proof point plus replay evidence.

## Stack Findings

- Keep Next.js, Go, PostgreSQL, TypeScript spec/contracts, and the existing runtime service.
- Add no new backend, queue, persistence owner, package manager, production sandbox, service mesh, or cloud deployment layer.
- Promote broker metadata and runtime registry artifacts in `@cowards/spec` before routing Python.
- Use existing Python subprocess code only as a starting point; treat subprocess and interpreter flags as defense-in-depth, not sandbox promotion.
- Python official documentation supports separate parse/compile validation and subprocess timeout handling; Python security guidance also points to isolated/safe-path modes such as `-I`, `-P`, and `PYTHONSAFEPATH`, which are hardening knobs rather than a full untrusted-code boundary.

## Feature Findings

- Table stakes are runtime registry, language/runtime artifact metadata, Python parse/compile/package validation, Python execution through the broker ABI, non-counted Go orchestration, Workshop Starter proof, replay evidence, and strict monitors.
- A Python Starter Strategy is the right proof point because it exercises authoring, validation, immutable artifact creation, runtime execution, MatchSet status, public labels, and replay projection without claiming ranked readiness.
- Python eligibility must remain non-counted by default, and counted/ranked paths must fail closed.

## Architecture Findings

- v1.17 target topology is `web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> isolated runtime implementation`.
- The broker may initially live inside the current runtime service process, but the interface should be concrete enough to front or replace current implementation later.
- Runtime implementation selection should be data-driven by registry metadata and schema-validated runtime metadata, not hard-coded to JS/TS.
- Go remains orchestration owner; runtime service remains execution owner; public replay/evidence remains a Go/public projection concern.

## Watch Out For

- Do not execute Python in Go or web/API.
- Do not let Python become a backend, persistence owner, route owner, job owner, Match completion owner, Chronicle persistence owner, scoring owner, or public evidence owner.
- Do not allow silent fallback to JS/TS, TypeScript backend, or Go execution.
- Do not expose source, StrategyMemory, SoldierMemory, objectives, owner debug, raw Awareness Grid, stderr, stack, host paths, package paths, tokens, DB DSNs, or private runtime internals in public outputs.
- Do not promote Python to counted/ranked play or production sandbox status.

## Recommended Phase Structure

1. Phase 110: Broker Registry Baseline and Contract Hardening.
2. Phase 111: Strategy Artifact Language Metadata and Eligibility.
3. Phase 112: Python Submission Validation and Diagnostics.
4. Phase 113: Python Runtime Execution Behind Broker ABI.
5. Phase 114: Go Orchestration and Non-Counted Eligibility.
6. Phase 115: Python Starter Strategy and Replay Proof.
7. Phase 116: Topology, Monitors, Privacy, and Promotion Gate.

## Sources Consulted

- Repo-local planning archive through v1.16, especially `.planning/milestones/v1.16-*` and `.planning/artifacts/v1.16-*`.
- Repo-local runtime/spec code: `packages/spec/src/runtime.ts`, `packages/spec/src/runtime-execution-service.ts`, `apps/runtime-service/src/execute-match.ts`, `packages/runtime-python`, and `apps/go-backend/runtime_service_client.go`.
- Python official docs for `ast`, `py_compile`, `subprocess`, and security considerations.

---
*Research summary written: 2026-05-24*
