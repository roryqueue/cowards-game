---
phase: 55
plan: 01
slug: cross-process-local-deployment-harness
status: complete
completed: 2026-05-22
---

# Phase 55-01 Summary — Cross-Process Local Deployment Harness

## Delivered

- Added `pnpm topology:check` as a repeatable local boundary topology diagnostic.
- Added `scripts/check-local-topology.ts` with static checks for root commands, Go route manifests, committed Go fixtures, TypeScript service health, worker/runtime adapter metadata, optional web health smoke, optional Go read-only smoke, owner analytics auth-gate behavior, and diagnostic privacy.
- Added focused tests for option parsing, environment URL behavior, static topology, required live failures, URL secret redaction, and owner analytics auth status enforcement.
- Preserved process ownership: the harness names and checks boundaries but does not spawn web, worker, TypeScript service, Go service, or Strategy execution.

## Requirements Covered

- TOPO-01: `pnpm topology:check` gives a repeatable topology command.
- TOPO-02: Checks report component layers, route/sample paths, contract version, fixture readiness, and runtime adapter metadata.
- TOPO-03: Smoke checks cover web health, TypeScript service health, Go health, Go public MatchSet summary, Go replay metadata, owner analytics auth-gate behavior, and runtime adapter diagnostics.
- TOPO-04: `--require-web` and `--require-go` make unavailable live boundaries fail loudly.
- TOPO-05: Diagnostics run through DTO leak checks plus URL/token redaction.
- TOPO-06: Command output lists setup commands, ports, environment variable shape, fixture loading, smoke paths, and failure diagnostics.

## Validation

- `pnpm topology:check`
- `pnpm exec vitest run scripts/check-local-topology.test.ts`
- `pnpm typecheck`
- `pnpm exec prettier --check package.json scripts/check-local-topology.ts scripts/check-local-topology.test.ts .planning/phases/55-cross-process-local-deployment-harness/55-01-PLAN.md .planning/phases/55-cross-process-local-deployment-harness/55-CONTEXT.md .planning/phases/55-cross-process-local-deployment-harness/55-RESEARCH.md .planning/phases/55-cross-process-local-deployment-harness/55-VALIDATION.md`

## Surprise

Fixture public copy intentionally mentions omitted private categories like `StrategyMemory` in notes. The final privacy check relies on canonical forbidden DTO field names for payload safety and uses marker redaction for diagnostics, so it does not treat explanatory public prose as a leak.
