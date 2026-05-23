# Phase 68 Research: Boundary Enforcement and Promotion Guardrails

## Findings

- `scripts/check-service-boundary-imports.ts` now strict-gates the migrated account revision GET route, Evidence Explorer page, and Workshop analytics read boundary.
- `scripts/check-boundary-monitors.ts` baselines 30 known broad web offenses, down from the v1.10 starting baseline of 34.
- Boundary monitors still compose OpenAPI public route checks, public service examples, Go fixtures, web import drift, runtime adapter metadata, runtime isolation readiness, non-JS guardrails, Go parity, and topology diagnostics.
- Topology reports runtime isolation as `evidence_only_not_promoted` and Go as read-only fixture-backed routes.

## Decision

Treat Phase 68 as a verification/enforcement phase with no new code movement. The existing code changes from Phases 65-67 already promoted the selected boundaries; this phase records the guardrail evidence and confirms no accidental promotion happened.

