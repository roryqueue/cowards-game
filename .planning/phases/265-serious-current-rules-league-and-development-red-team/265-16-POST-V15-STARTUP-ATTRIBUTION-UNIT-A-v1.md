# Plan 265-16 startup attribution — execution unit A

**Status:** Draft; executable only after a clean independent check of master v3 and both units. This is not a new numbered plan or authority. The master at `265-16-POST-V15-STARTUP-ATTRIBUTION-PLAN-v3.md` is normative for shared contracts, ten pins, test commands, budgets, privacy and all gates; do not copy or modify those shared definitions here.

## Scope and dependency

Unit A is the first 11 ordered source/test paths in the master. Use only those paths. Same actual author `/root/execute_265_startup_attribution` implements A then B in one isolated checkout with atomic RED/GREEN commits. No source review closure, grant use, route/entry authority or scope closure is produced by A. V8 remains undispatchable after A.

| Order | Exact path | Ownership |
|---:|---|---|
| 1 | `scripts/lib/v1-38-lean-startup-supervisor-v8.mjs` (new) | Async lifecycle-aware control |
| 2 | `scripts/lib/v1-38-lean-startup-supervisor-v8.d.mts` (new) | New supervisor type contract |
| 3 | `scripts/lib/v1-38-lean-container-match-session.ts` | Strict V8 origin/broker integration; keep V5/V6/V7 behavior unchanged |
| 4 | `scripts/lib/v1-38-lean-container-match-session.test.ts` | Inert early error/exit, READY authority, fixed deadlines, schema/privacy tests |
| 5 | `packages/strategy-lab/src/league/lean-experiment.ts` | Distinct ordinal-5 allocation/policy shape |
| 6 | `packages/strategy-lab/src/league/lean-experiment.test.ts` | Policy roots, no caller grant, legacy and mode defaults |
| 7 | `scripts/lib/v1-38-lean-resource-window-v15.ts` | New mode-5 cost-only archive and own STARTUP prefix |
| 8 | `packages/strategy-lab/src/league/lean-resource-window-v15.test.ts` | Exact pin/archive joins and old-array byte preservation |
| 9 | `scripts/run-v1-38-lean-resource-window-v15.test.ts` | Route selector defaults and refusal fixtures |
| 10 | `scripts/lib/v1-38-lean-experiment-authority.ts` | WeakMap private grant issuance, exact ordinal binding |
| 11 | `scripts/lib/v1-38-lean-baseline-authority.test.ts` | Single-use grant and forged/default refusal |

## Tasks — serial, RED then GREEN

### A1: V8 worker control and finite producer

Implement master contract on paths 1–4. Resolve the actual production worker Node image/version before selecting the async primitive. Prove early pre-GO worker error and exit become a host lifecycle failure before the unchanged 2500-ms startup deadline and before forced termination, without allowing callbacks to grant READY. Keep absolute 2500/5000/1000/100/600000-ms deadlines, start before construction, fresh workers, no guest work before GO, exact 4096-byte origin limit, and all failure/cleanup semantics. Preserve V5/V6/V7 supervisors/defaults/selectors. Test telemetry separately from control repair.

Use master verification command 1. Record the first failed control-proof reason as NOTPASS; one bounded source-only correction may rerun the same case without any empirical refund/recredit. If still failing or runtime support is unavailable, stop A source work honestly and keep ordinal 5 dormant.

### A2: Distinct mode-5 policy/archive

Implement master contract on paths 5–9. Name the policy exactly `LEAN_RESOURCE_WINDOW_V15_STARTUP_ATTRIBUTION_POLICY`; keep allocation modes `v1.38-lean-correction-supervisor-diagnostic-v15-5` and `v1.38-lean-correction-supervisor-baseline-v15-5` distinct from descriptor/schema v8. Use only the ten exact master pins, verifying no-follow, regular-file, mode-0600, single-link, raw/body roots, canonical joins and cost-only failed_result. Add only the new STARTUP `6/6/12` prefix without modifying old original 4/6/10 or boundary 2/6/8 arrays. Keep default V7, 600000-ms Match cap and 4096-byte legacy origin cap. Do not expose a selectable route from A.

Use master verification command 2. Any inventory drift or extra path is a blocker; do not refresh old pins.

### A3: Host-only dormant grant issuance

Implement master contract on paths 10–11. Issue only an unforgeable, nonserializable, single-use private grant for prospective ordinal 5; reject caller JSON, wrong ordinal, default/legacy modes, stale source and mismatched roots. The grant has no route effect while B is incomplete: no invocation entry, provider, Match, allocation, or authority claim.

Use master verification command 3. Any missing gate leaves the grant unclaimed and ordinal 5 dormant.

## A completion gate

Require all A tests GREEN, actual worker runtime feasibility demonstrated, old selectors/defaults and arrays unchanged, typecheck/source checks within master caps, and no new scoped strict-host diagnostics. Keep the 11 inherited strict-host diagnostics disclosed as NOTPASS. Record A's exact changed paths and bytes in the master's finite physical ledger. Do not write a unit summary or claim the 21-path source review is complete. Only then may the same author proceed to Unit B.
