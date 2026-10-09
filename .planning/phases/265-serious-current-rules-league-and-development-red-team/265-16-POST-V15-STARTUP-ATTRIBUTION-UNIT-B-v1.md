# Phase 265 Plan 16 — Startup Attribution Execution Unit B

Status: executable companion to `265-16-POST-V15-STARTUP-ATTRIBUTION-PLAN-v3.md`; not a numbered phase plan. Execute only after Unit A's RED/GREEN work is complete in the same isolated checkout. The master is authoritative for frozen contracts, paths, evidence pins, budgets, commands, privacy limits, and stop rules. This unit adds no authority and has no separate summary.

## Scope and sequencing

The actual source author `/root/execute_265_startup_attribution` owns both units in one checkout. This unit owns only the following ten paths, preserving the master's ordered 21-path integration/source-review closure:

12. `scripts/lib/v1-38-planner-supervised-runtime.ts`
13. `scripts/lib/v1-38-planner-supervised-runtime.test.ts`
14. `scripts/lib/v1-38-factory-supervised-runtime.ts`
15. `scripts/lib/v1-38-factory-supervised-runtime.test.ts`
16. `scripts/lib/v1-38-lean-baseline-match.ts`
17. `scripts/lib/v1-38-lean-baseline-match.test.ts`
18. `scripts/run-v1-38-lean-correction.ts`
19. `scripts/run-v1-38-lean-correction.test.ts`
20. `scripts/lib/v1-38-lean-correction-retained.ts`
21. `scripts/lib/v1-38-lean-correction-retained.test.ts`

No unlisted file may be changed. If implementation or proof requires another path or proof version, stop and request a small checked inventory revision; do not overwrite prior proof. Unit A is a hard dependency. Until all Unit B tests and the master integration/source-review gates pass, the new origin remains undispatchable, grants remain unusable, and no entry or authority is created.

## Tasks

### Task B1 — Propagate only the opt-in supervisor descriptor

Files: paths 12–15 above.

TDD: add failing tests first for opt-in descriptor propagation through planner and factory supervised-runtime routing, then implement the narrow wiring. Preserve existing descriptors, defaults, old V5/V6/V7 functions, and dispatch behavior byte-for-byte or behavior-for-behavior. The separate startup descriptor version 8 and origin `v1.38-lean-startup-origin-v8` are not allocation mode names; preserve existing allocation modes `v1.38-lean-correction-supervisor-diagnostic-v15-5` and its baseline counterpart. No Strategy execution may occur before GO.

Verify with the master's capped test command 4. Every focused case must finish within 5,000 ms; the command remains hard-capped at 60 seconds and 768 MiB. A failed control test is recorded NOTPASS with its first failure reason; a bounded source-only fix may rerun that same case without recrediting evidence.

### Task B2 — Enforce exact request-root and invocation joins

Files: paths 16–19 above.

TDD: add failing tests first for the exact host-issued request-root prefix, observer/invocation joins, origin binding, and cell selector binding; then implement only the joins required by the master contract. Reuse only the separate opt-in authority for prospective ordinal 5. Telemetry, request content, or a descriptor alone must never activate the allocation. Preserve guest deadline, cleanup, system-failure classification, and old 2/3/4 policies.

Verify with the master's capped test command 5. Do not call Match, provider, Docker, readers, or publishers. Apply the same focused-case and command caps and NOTPASS accounting from the master.

### Task B3 — Strictly validate retained evidence without expanding trust

Files: paths 20–21 above.

TDD: add failing tests first for the exact finite retained-evidence schema, mandatory source joins, rejection of unknown fields/paths, and no glob/exemption behavior; then implement the validator and retention changes only within these files. The six generated proof outputs remain separately debited and excluded from the exact 21-path semantic review closure as specified in the master. Do not inspect private payloads, raw stderr/stdout, or error text.

Verify with the master's capped test command 6. After this task, run the master's complete ordered 21-path source-review/fix, source-privacy, typecheck, and verification gates. The actual independent reviewer authors and publishes the selected v7 review; ROOT only default-consumes it. Do not invent future review roots or treat this unit as authority.

## Completion boundary

This unit's source work is complete only when its three TDD tasks pass within the frozen caps, no unlisted files changed, and executor-applicable type/source gates pass. After both A and B source tasks and those executor gates, write the single `STARTUP-ATTRIBUTION-SUMMARY-v1` as a handoff; it must label independent review, validation, and source verification pending and non-authorizing. Do not produce a Unit B summary. All master gates must still pass before ROOT may consider any route; if any entry, actual run, review, join, or resource gate is absent, preserve dormant state and stop honestly.
