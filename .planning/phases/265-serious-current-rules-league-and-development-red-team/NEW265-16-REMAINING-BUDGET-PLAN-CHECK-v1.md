# NEW265-16 remaining-budget supplement — plan check

**Verdict:** ISSUES FOUND — do not begin the source supplement or route stage until the blockers below are resolved.

**Scope checked:** `NEW265-16-REMAINING-BUDGET-RESEARCH-PLAN-v1.md` against the 2026-10-07 approved envelope, `NEW265-16-REMAINING-BUDGET-RESEARCH-v1.md`, the current top-level Phase 265 state, and the named static consumers. This was source/document inspection only; no tests, preparation, route, old reader, or private-payload read was performed.

## Blockers

1. **[BLOCKER — approval contradiction] A failed fresh diagnostic is made terminal for the whole envelope.** The approval allows an individually failed/refused route to remain spent while another distinct approved diagnostic proceeds. The plan correctly says this in its authority and route-stage sections, but its final stop clause says “Failure/refusal ... ends this envelope.” That would suppress the second/third distinct diagnostics contrary to the approved decision.

   **Fix:** Remove failure/refusal as an envelope-wide stop. Stop only on diagnostic exhaustion, inadequate reserve/capacity, the single baseline outcome, or a genuinely new human product/rules/resource decision. Keep each failed route immutable and non-reusable.

2. **[BLOCKER — custody/inventory coverage] The exact predecessor custody paths and byte debits are not fully specified in the supplement’s exact source inventory.** The plan binds the v8-2 request/failure/raw marker/source/HEAD identifiers and requires a complete predecessor debit, but the listed exact-path set does not identify the consumed v8-2 source-wrapper/review path and data-review path that must be carried as finite custody. A generic statement to pin the inventory does not let the new validator authenticate those exact records and their full allocated-byte debit.

   **Fix:** Add the exact prior request/review/source-wrapper/data-review identities and their full allocated-byte debits to the bounded predecessor custody/inventory. Keep this a finite exact-path exception; do not broaden the legacy path allowlist or rerun any old reader.

3. **[BLOCKER — route binding/source closure] Exact per-route v9 review and data-review identities, and non-circular source-root construction, are not prescribed.** The implementation boundary says the source manifest includes review and data-review artifacts, while those newly authored artifacts may themselves bind the source root. It also does not assign exact fresh review/data-review path identities for v9-1/2/3, leaving strict consumers without a determinate identity to validate and risking the same path/debit mismatch on later routes.

   **Fix:** In the checked plan, define exact, distinct future v9 review/data-review identities per route and specify a non-circular functional source closure. Separate that closure from any exact physical-survivor/custody allowlist and its byte accounting. Carry each route’s exact request/review refs and full debit forward before deriving any schedule-only view. The binding must propagate through every strict consumer, including the baseline retained join and shell/CLI routing, without changing v8 readers or accepted FINAL semantics.

## Checks that align

- The approved 64,594,435 ms task-start carry, unchanged 72,000,000 ms / 15 GB / 300-Match ceilings, 30 historical charges, 1,860,000 ms reserve, and inclusion of all current-task costs are represented consistently.
- The three-diagnostic / one-conditional-baseline ceiling, fresh unique destinations, committed allocation before entry, fresh real `0700` store, same-process capacity gate, source+HEAD hold, and new accepted-check plus actual FINAL baseline join are covered.
- The v8-2 preparation terminal is treated as finite failed-preparation custody, not accepted evidence; the plan prohibits fabricated results, ordinary old-reader replay, and legacy v8 reinterpretation.
- The named static consumers confirm the need for v9 mode preservation across the shared allocator/runner, correction shell/CLI, retained reader, and baseline retained join. The plan names those consumers and calls for inert tests; no runtime behavior was exercised here.

## Structured issues

```yaml
issues:
  - plan: "NEW265-16-REMAINING-BUDGET-RESEARCH-PLAN-v1.md"
    dimension: "context_compliance"
    severity: "blocker"
    description: "Final stop clause says any failure/refusal ends the envelope, contradicting approval that individual failed routes do not end authority for later distinct diagnostics."
    fix_hint: "Stop only at approved exhaustion, reserve/capacity failure, the one baseline outcome, or a genuinely new human decision; preserve failed routes as spent."
  - plan: "NEW265-16-REMAINING-BUDGET-RESEARCH-PLAN-v1.md"
    dimension: "custody_inventory"
    severity: "blocker"
    description: "Exact source inventory omits the consumed v8-2 source-wrapper/review and data-review custody paths and their full allocated-byte debits."
    fix_hint: "Add the exact prior custody identities and complete byte debits to the bounded exact-path inventory without widening legacy allowlists or replaying readers."
  - plan: "NEW265-16-REMAINING-BUDGET-RESEARCH-PLAN-v1.md"
    dimension: "key_links_planned"
    severity: "blocker"
    description: "The plan lacks exact per-route v9 review/data-review identities and a non-circular distinction between functional source closure and physical-survivor custody accounting."
    fix_hint: "Specify exact distinct v9 review/data-review identities and non-circular source-root binding; keep exact survivor path/byte accounting separate and propagate binding through every strict consumer."
```
