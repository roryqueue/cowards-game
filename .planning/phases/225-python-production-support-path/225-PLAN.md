# Phase 225 Plan: Python Production Support Path

## Objective

Promote Python from non-counted exhibition beta to counted provider support while keeping Strategy execution behind runtime-service / Runtime Broker / Python provider boundaries and avoiding broad sandbox-certification claims.

## Tasks

1. Promote Python in the shared language and adapter registries.
   - Mark Python counted eligible and enabled for normal play.
   - Keep package policy `none` and deterministic restrictions explicit.
   - Retain the existing Python adapter id for compatibility, with registry/provider semantics as the source of truth.

2. Remove Python non-counted validation drift.
   - Remove `NON_COUNTED_RUNTIME` warnings from Python validation.
   - Keep AST/compile validation, forbidden capability rejection, source limits, timeout, stdout/stderr caps, and public-safe diagnostics.

3. Update backend and persistence eligibility gates.
   - Allow Python counted entry only with exact Python provider metadata, HMAC-backed provider-validation proof, package mode `none`, and no required capabilities.
   - Keep Rust/Zig non-counted evidence-gated.
   - Update Workshop templates, samples, tags, ladder, and competition tests.

4. Update active product and public evidence surfaces.
   - Show Python as counted eligible through shared runtime semantics.
   - Remove Python beta copy from current Workshop, Account/Strategy, exhibition, MatchSet, result, evidence, and learn surfaces.
   - Update match execution runtime evidence so Python is counted and only Rust/Zig remain non-counted beta.

5. Review and verify.
   - Run code review and fix findings.
   - Run spec, runtime-python, runtime-service, persistence, web, and Go verification.

## Non-Goals

- Do not execute Strategy code in web/API/Go.
- Do not add Python packages or dependency resolution.
- Do not claim general Python sandbox certification.
- Do not promote Rust or Zig in this phase.
- Do not migrate Rust/Zig away from WASI Preview 1 stdin/stdout JSON.

## Verification

- `pnpm --filter @cowards/spec typecheck`
- `pnpm --filter @cowards/spec test`
- `pnpm --filter @cowards/runtime-python typecheck`
- `pnpm --filter @cowards/runtime-python test`
- `pnpm --filter @cowards/runtime-service typecheck`
- `pnpm --filter @cowards/runtime-service test -- execute-match server`
- `pnpm --filter @cowards/persistence typecheck`
- `pnpm --filter @cowards/persistence test -- workshop ladder competition`
- `pnpm --filter @cowards/web typecheck`
- `pnpm --filter @cowards/web test -- workshop/server runtime-labels evidence-copy result-view-model`
- `PATH=/usr/local/go/bin:$PATH go test ./...` from `apps/go-backend`
