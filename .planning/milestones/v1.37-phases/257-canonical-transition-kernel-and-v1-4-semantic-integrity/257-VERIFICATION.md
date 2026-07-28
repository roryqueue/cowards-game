---
phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
status: passed
verified: 2026-07-13T21:57:12-04:00
verified_source_commit: a2b80be0d3e7cb5ac572f8795a8d8dfde9c1e1ee
requirements: 11/11
decisions: 16/16
scenarios: 14/14
open_gaps: 0
---

# Phase 257 Verification

## Result

**PASS.** Independent black-box verification found no Phase 257 gap. All eleven
`KERN` requirements, decisions `D-01` through `D-16`, the exact current tuple,
the one-transition-owner boundary, historical preservation, public privacy,
PostgreSQL completion behavior, Go admission/completion, and the responsive
result/replay experience passed against source commit `a2b80be`.

This result preserves the documented scope boundary: the browser proof is backed
by the committed, schema-admitted v1.16 service-contract receipt. It is not a live
Go + runtime-service + PostgreSQL + Redis topology proof. That integrated live
topology remains owned by Phase 261 and is not presented as a Phase 257 gap.

## Acceptance scenarios

| # | Scenario | Fresh evidence | Result |
|---:|---|---|---|
| 1 | Deterministic final evaluator accepts the exact committed proof and synchronized JSON/Markdown/browser inputs | `pnpm v1.37:kernel-integrity:check`, run before and after the aggregate chain | PASS |
| 2 | Evaluator, integrity-boundary, and executable-inventory mutations fail closed | 3 Vitest files, 77/77 tests | PASS |
| 3 | Persisted current audit reproduces the approved seven observations exactly | no-Advance last Soldier, Cycle-end Backstab, excess malformed order, deep-validation deferral, overlapping-arena rejection, legacy-boundary deferral, successful-push history | PASS |
| 4 | Historical v1.36 proof remains read-only and exact | 8 artifacts validated against 11 archived sources | PASS |
| 5 | Current tuple, event coverage, inactive candidate provenance, and receipt authority remain current | tuple `sha256:922a6857fdbc8354b744d6e766bff216f3fee85b5ed381355cb427f5a616b3ae`; authority and event generators in check mode | PASS |
| 6 | One transition owner and no stale executable activation route remain | current executable-reference inventory: 0 exact references and 11 non-executable mentions; integrity mutation suite passed | PASS |
| 7 | Current creation, persistence, worker-retirement, and privacy boundaries remain closed | integrity inventory: 308 files, 5 creation calls, 9 direct SQL writers, 4 quarantined legacy worker consumers; retirement findings 0 | PASS |
| 8 | Public discovery and result/replay contract remain privacy-safe and consistent | discovery check passed; replay/result trust passed across 11 result fixtures and 7 replay states | PASS |
| 9 | Desktop result, APIs, and replay share one canonical receipt | fresh root Playwright, one worker | PASS |
| 10 | Tablet result, APIs, and replay share one canonical receipt without clipping | fresh root Playwright, one worker | PASS |
| 11 | Mobile result, APIs, and replay share one canonical receipt without clipping | fresh root Playwright, one worker | PASS |
| 12 | PostgreSQL persistence admits exact evidence and rejects/rolls back semantic drift | 19 files, 213/213 tests with `--testTimeout=15000` | PASS |
| 13 | Full Go suite validates strict response admission, receipt-bound completion, zero-mutation rejection, and idempotence against PostgreSQL | full DSN-backed `go test ./... -count=1` | PASS |
| 14 | The complete serialized default boundary chain remains green without changing protected inputs | `pnpm boundary:monitors`; final pure evaluator check; protected-hash comparison | PASS |

## User-visible result and replay consistency

Fresh Playwright executed the same scenario in the root configuration on desktop,
tablet, and mobile: **3/3 passed in 53.5 seconds** with one worker and a fresh
Next.js server.

The result page, result API, replay metadata API, Replay link, replay page, board,
timeline, and terminal projection agreed on:

- Match `match:runtime-service:golden`.
- Chronicle `sha256:e6122e9111f64940929216db472648e7489a953af05bfbd6c0fdd91a9139b3f5`.
- Arena `arena-empty-12x12`, 31 events, 12 snapshots, and exactly one terminal
  `MATCH_ENDED` event.
- A Draw outcome, 16 in-bounds starting Soldiers, no terrain, and the intentional
  empty contracted terminal board.
- Responsive viewport containment, nonblank start-board rendering, exact terminal
  selection, and no owner-debug control in the public replay.

Recursive API and document scans rejected private runtime/source/artifact/memory,
receipt, authority, diagnostic, host-path, credential, and security markers.

## Structural and proof evidence

- `pnpm exec tsx .planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts`
  reproduced the exact committed seven-probe result.
- `pnpm v1.36:historical-proof:check` passed with 8 artifacts and 11 sources.
- Current integrity-authority and event-coverage artifacts passed their pure checks.
- The executable reference inventory reported no executable stale reference.
- The v1.37 integrity checker completed over 308 inventoried files.
- The aggregate boundary chain passed contract/OpenAPI checks, service-import
  boundaries (`strict_offenses=0`, 19 known report-only findings), TypeScript
  inventory, Go parity, runtime/sandbox/WASM checks, replay intelligence, public
  discovery, historical evidence, current authority, worker retirement, current
  integrity, the Phase 257 evaluator, and the final boundary checker.

## Database and Go evidence

Local PostgreSQL was confirmed current through migration
`0017_runtime_semantic_receipts.sql` before database verification.

- Persistence: 19 files, **213/213** tests passed using the established 15-second
  integration timeout.
- Go backend: the full DSN-backed package suite passed with `-count=1`.
- Focused semantic completion evidence included forbidden Chronicle-field rejection,
  lowercase receipt enforcement and retry, exact idempotence, post-write rollback,
  receipt drift rejection, and zero-mutation snapshots.

## Preservation proof

The verification run preserved the user's protected working copy and generated
Next.js declaration exactly:

| File | Pre/post SHA256 | Binary diff SHA256 | Result |
|---|---|---|---|
| `.planning/config.json` | `a9502647c42da6e83564e56e35833a66d2daad6704f2ac2a2d98cf12cc953f7b` | `1372d196c86ee3907fcac07a7075b06814f2eaedf328314a31641713c71e6765` | preserved |
| `CowardsGameSpec_Full_Consolidated_v1.md` | `01b0a95c79e2ba5e8a089abe7106856e7f081bb10193d5ab8e86171f6ee0fa46` | `ae29a7dbf894437668f880f7775904eeb580b0e82c99a91cba0dbf9e611bcd2d` | preserved |
| `apps/web/next-env.d.ts` | `2bdf4de86f5ca3f9fee29b0430911f0a5e36b2e3c161ba0e2ba3326737721aad` | n/a | preserved after the known Next.js semicolon regeneration was restored |

No source file or proof artifact changed during verification. This report is the
only file added by the verification pass.

## Explicit limitations

The following remain intentional non-proofs and do not block Phase 257:

- Phase 258 canonical JSON completion.
- Phase 259 four-language conformance.
- Phase 261 live integrated service topology and release proof.
- Optional Cycle-start Backstab simplification.
- Optional post-Advance `HOLD`/`END_ACTIVATION` simplification.

The default topology checker accurately reported live runtime-service, web, and Go
smokes as optional/skipped without supplied URLs. Fresh browser verification proved
the service-contract-backed user experience only; no live-topology claim is made.

## Final verdict

**PASS — 14/14 acceptance scenarios, 11/11 requirements, 16/16 decisions, zero
open gaps.**
