# Phase 89: Boundary Baseline and Scope Lock - Plan

**Status:** Ready for execution  
**Mode:** Standard  
**Research:** Captured in `089-CONTEXT.md`

## Goal

Produce the v1.14 baseline evidence bundle before implementation changes: machine-readable ownership/boundary facts, human-readable summary, and explicit non-goal enforcement ownership.

## Tasks

1. Create `.planning/artifacts/v1.14-boundary-baseline.json`.
   - Include live Go routes, fixture/parity routes, TypeScript oracle/reference surfaces, worker-owned runtime surfaces, deferred surfaces, and selected v1.14 promotion candidates.
   - Record the approved drift inventory and `strict_offenses=0`, `report_only_offenses=29` baseline.

2. Create `.planning/artifacts/v1.14-boundary-baseline.md`.
   - Explain the ownership categories, runtime non-goals, privacy gates, topology gaps, replay realism gaps, and downstream phase ownership.
   - Reference the v1.13 route ownership manifest, topology artifact, and promotion decision.

3. Add monitor awareness where practical.
   - Ensure the baseline names existing monitor commands and later phases that own new checks.
   - Do not broaden implementation scope into artifact, ABI, or Go fork work.

## Verification

- Inspect the JSON for valid syntax and expected category coverage.
- Run `pnpm boundary:check` if available; otherwise run the underlying boundary monitor script.
- Confirm no source/runtime private payloads are included in planning artifacts.

## Exit Criteria

- Baseline JSON and Markdown exist and are referenced by later plans.
- Non-goals have explicit enforcement or downstream ownership.
- Work is committed with a phase summary and validation note.
