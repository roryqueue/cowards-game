---
phase: 258-canonical-json-failure-semantics-and-artifact-identity
plan: "09"
reviewed_at: 2026-07-14
status: passed
open_findings: 0
review_scope:
  - Exact original-versus-normalized source identity from web and Go through PostgreSQL
  - Python v1.17 raw ABI, budget boundary, and exclusive failure ownership
  - Migration immutability and upgrade safety for already-applied 0018 installations
  - Public Go readiness and source/artifact identity admission boundaries
---

# Phase 258 Plan 09 Code Review

## Outcome

**PASSED — zero actionable findings remain after independent adversarial rereview.**

The review covered every Plan 09 source and persistence boundary plus the necessary shared spec, repository, and Go compatibility seams changed to keep the end-to-end identity path coherent. All findings were reproduced by a focused failing test before the corresponding fix, then rechecked against the complete Plan-focused suite.

## Review Scope

- Exact JavaScript string and UTF-8 byte preservation through the Workshop/API route, competitive server action, Go backend, repository, and PostgreSQL row.
- Separate domain-framed original and normalized source identities, normalization policy, line-ending facts, final-newline fact, artifact binding, and immutable persistence.
- Python candidate request authentication, source/artifact/runtime/toolchain binding, raw canonical payload admission, bounded serialization, and one exclusive success/player/system result.
- Python wall-budget ownership from module initialization through canonical response-envelope completion, including uncatchable host supervision and a separate infrastructure startup watchdog.
- Migration 0018 release-byte stability and an additive 0019 upgrade for deployments where 0018 was already applied.
- Go canonical-engine compatibility and privacy-safe public readiness output.

## Findings Closed

1. **Legacy source and migration immutability**
   - The initial migration allowed legacy source mutation and later edits risked changing an already-released migration.
   - Migration 0018 was restored byte-for-byte to its first released form. Migration 0019 now hardens both legacy and v2 source immutability, exact v2 key/kind/count constraints, normalized bytes, and final-newline consistency without fabricating a backfill.

2. **Python serialization and exception ownership**
   - Guest serialization faults, top-level execution faults, and malformed host-result envelopes could be mislabeled or accepted too broadly.
   - Method exceptions remain player-owned `THROWN_EXCEPTION`; invalid result serialization remains player-owned `INVALID_OUTPUT`; malformed or mixed host envelopes, adapter faults, and transport ambiguity remain redacted system failures.

3. **Bounded Python output and host transport**
   - The first helper could construct unbounded output or hit the host pipe limit before the canonical output budget classified the result.
   - The package-free Python writer now stops at N+1 bytes, reports `OVERSIZED_OUTPUT`, preserves canonical numeric spelling, and transfers only a bounded exact envelope. The near-cap regression proves output larger than the old pipe capacity is classified by the signed budget rather than as a transport crash.

4. **Catchable or incomplete wall deadlines**
   - Signal-based timeout could be caught by guest code, and early revisions placed serialization, envelope construction, or module initialization outside the signed wall.
   - The host now forks a child, starts the monotonic signed deadline immediately before the go signal, requires complete envelope EOF before the deadline, and uses host-owned `SIGKILL` plus reap on overrun. Module initialization, method resolution/invocation, bounded serialization, base64 encoding, envelope construction, transfer, and close are all observed inside the signed wall. Python process startup remains outside it under a distinct 30-second system watchdog.

5. **Lossy source decoding and artifact admission**
   - Replacement decoding or trusting caller-supplied derived identity fields could authorize bytes other than the signed source.
   - UTF-8 decode is fatal, round-trip bytes must be exact, and artifact/source identity is recomputed at repository admission from the exact source. Derived v2 identity fields supplied by callers must match that canonical record before SQL.

6. **Retryability and public-boundary drift**
   - Some wrong-binding or ambiguous-attribution results had inconsistent retryability, and Go exposed internal readiness categories.
   - Deterministic binding and attribution failures are non-retryable; host, runtime, transport, and adapter failures remain retryable. Public Go output now uses stable sanitized categories and never exposes raw readiness state or internal evidence reasons.

7. **Canonical engine compatibility drift**
   - The selected Go backend carried an obsolete engine-kernel identity after the canonical tuple advanced.
   - It now binds `engine-kernel-v1.37-candidate-1`, and the named compatibility test proves exact agreement with the canonical engine.

## Final Independent Rereview

A fresh reviewer, working after commit `90de75f`, reported **zero actionable findings**. The reviewer independently verified:

- `@cowards/runtime-python`: **38/38** tests passed.
- Persistence migration and account revision suites: **22/22** tests passed, including the 0019 applied-0018 upgrade.
- Runtime-Python and persistence typechecks passed.
- Focused lint and Python bytecode compilation passed.
- Named Go compatibility, public-readiness privacy, and live PostgreSQL source-identity tests passed.
- **299,838** randomized finite binary64 values produced zero Python-versus-TypeScript canonical numeric spelling mismatches.
- Repository identity recomputation, exact UTF-8 admission, retryability classification, and the fork-supervised deadline all matched the frozen contract.

## Review Verdict

No open correctness, security, privacy, compatibility, or maintainability finding remains in Plan 258-09. The Python and source-identity successor work remains additive and inactive; valid current v1.4 gameplay and immutable historical evidence are unchanged.
