# Phase 252 Research

## Current Drift

- The spec/persistence enum lacks `degraded_system_failure`, `disputed`, and `invalidated` even though the v1.36 policy vocabulary includes them.
- Go trusts every stored non-pending state, including `counted`, before rechecking evidence; TypeScript treats only exclusion states as overrides.
- TypeScript public ladder reads call `refreshMatchSetStatus`, mutating lifecycle during a GET; Go also refreshes in its read path.
- Standing rows have tie-break data but no counted/excluded counts, evidence availability, or stable result/replay links.
- Result metadata is untyped and can disagree with the standings-derived state.

## Direction

- Put a pure classifier and public-copy table in `@cowards/spec`.
- Expand storage constraints additively in migration `0010` while preserving public-safe reason categories.
- Build a pure Season recompute input/output contract and persistence reader that supplies one Season only.
- Remove GET-time lifecycle refresh; workers/orchestration own stored execution state.
- Implement the same matrix in Go and add parity table tests.

## Risks

- Governance precedence must be stable before Phase 253 writes new states.
- Existing fixtures may rely on stored `counted` without complete evidence and must be corrected rather than grandfathered.
- Public result DTO changes require OpenAPI/fixture regeneration and can expose hidden schema drift.
