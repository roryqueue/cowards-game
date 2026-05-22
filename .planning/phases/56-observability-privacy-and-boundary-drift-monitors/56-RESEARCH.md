---
phase: 56
slug: observability-privacy-and-boundary-drift-monitors
status: research
created: 2026-05-22
---

# Phase 56 Research — Drift Monitors

## Existing Inputs

- `pnpm contract:check` regenerates the OpenAPI artifact in check mode and fails on stale contract output.
- `pnpm contract:lint` runs Redocly against the generated service artifact.
- `pnpm boundary:imports` fails strict migrated route/page import violations and reports broad web app direct persistence/runtime debt.
- `pnpm go:parity` regenerates fixture expectations in check mode and runs Go backend tests.
- `pnpm sandbox:evaluate:check` fails when the sandbox evaluation artifact drifts.
- `pnpm topology:check` validates local topology diagnostics, fixtures, service health, adapter metadata, and optional live smoke behavior.

## Gaps

- There is no one command that says "the v1.8 boundary monitors passed."
- Broad web app boundary debt is report-only, so new direct persistence/runtime imports could hide among existing output.
- Public privacy checks exist in several places but are not tied together across service examples, Go fixtures, topology diagnostics, and OpenAPI artifacts.
- Runtime product semantics and executable adapter metadata can drift independently.
- Go route manifest metadata can drift from canonical TypeScript service route metadata even when fixture hashes still match.

## Decision

Implement `pnpm boundary:monitors` as a composed local check:

1. Run existing stale-output, import-boundary, Go parity, sandbox, and topology commands.
2. Run a new `scripts/check-boundary-monitors.ts` script for cross-checks that are cheap and specific to v1.8.
3. Treat known broad web boundary debt as a baseline. Unknown new report-only offenses fail; removed baseline offenses are allowed.
4. Keep the monitor local and lightweight. No production observability stack, deployment orchestrator, or backend ownership rewrite is introduced.
