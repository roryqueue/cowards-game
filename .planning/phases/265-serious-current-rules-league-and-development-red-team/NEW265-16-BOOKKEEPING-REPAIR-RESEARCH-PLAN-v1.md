---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16
supplement: source_only_authenticated_cap_reuse
status: proposed_source_repair
autonomous: true
requirements: [LEAG-03, LEAG-05]
---

# Bounded bookkeeping repair — research and checked-plan input

## Research

The unique conditional v8-1 baseline failed before any charge. Independent ENTRY-terminal-only verification is closed; source/HEAD hold released. The diagnosis localizes the parent kill to aggregate RSS/scratch, not elapsed: the time helper throws before returning any elapsed at/above the cap; a thrown sampling path would record resource_sampling_exception, which is absent. Exact triggering operands and cause of RSS growth are not retained. No baseline success, guest timeout, or disk failure is inferred.

Static source proves unnecessary repeated full allocation reconstruction in the parent250ms sampler: `leanBoundedParentTimeBudget` -> `currentLeanElapsedMs`/`leanCapsForAllocation` -> `admitLeanAllocation` -> v8 allocation schedule construction/hash/deep freeze. The already-admitted ledger allocation is an immutable deeply frozen object returned by full admission. Reusing its validated cap by that exact object identity removes repeated work without weakening admission or changing resource policy. This is a proven overhead reduction, NOT a proven empirical memory fix.

## Task — narrow source-only repair

Own `packages/strategy-lab/src/league/lean-experiment.ts` and focused inert tests (existing v8 test file or new narrow file). Add an internal WeakMap/identity cache only for exact deeply frozen v8 allocation objects returned by successful full `admitLeanAllocation`. Register the freshly reconstructed expected object only AFTER all exact-key/root/equality checks pass. Never cache caller-supplied values merely because they are frozen or carry a root; never key by root string. `leanCapsForAllocation` may return the cached cap only for that actual object identity. Fresh/mutable/shallow-frozen/cloned objects still undergo full validation; other versions keep existing behavior. No engine/public/runtime/authority/resource change, no source holding across failed route, no new request/allocation/Match/reader.

Use RED-first tests: exact admitted v8 object repeated cap reads no longer rebuild/hash allocations; cap/extension parity remains20h versus legacy16h, all resource values unchanged; counterfeit or cloned/mutable data cannot poison/reuse cache; deep immutability remains proven. Preserve full admission and every live charge/source/retained boundary. If the object is not actually deeply frozen, fail this design rather than caching unsafe references. Avoid global cache leaks with weak references.

Verification: focused inert tests plus affected existing cap/parent regression tests, configured lab project types, diff/shell/boundary check as applicable; independent review/fix, source validation and narrow source verification. No native/Worker/provider/Strategy/Match dispatch, no historical ordinary reader or massive history scan. Existing904-entry source inventory/reviews remain historical; do not overwrite them or relabel this source as diagnostic-accepted. New exact source inventory is needed only after a separately approved fresh prospective execution route; source repair grants none.

## Stops and unchanged bounds

Do not add numbered plans/version-route ladders or a new resource-decision schema. Same20h cumulative/15GB/300, every current repair/review cost counts. Historical30charges and all failed/successful route bytes remain immutable. The approved conditional baseline was spent by failure; no fresh baseline or diagnostic without a prospective human amendment. Phase265/freeze/formation/holdout/public/counting/production remain gated. No claim that cap reuse cures observed memory pressure; report source efficiency separately from empirical feasibility.

## Review correction CR-01

Independent REVIEW-v1 reproduced a genuine invalid premise: recursive Object.freeze is necessary but insufficient when a nested array index is an accessor backed by a changing closure. Canonical array admission currently reads indices directly. Preserve that historical behavior; do not broaden this repair into a canonical serializer change.

Cache eligibility must therefore additionally require a recursively frozen normal data-property-only tree, with no getter/setter and no Proxy (exclude via Node's trusted types.isProxy before reflection), no exotic prototypes/objects or other mutable closure values. Inspect descriptors rather than reading accessor values. Only register the exact successfully admitted output when it satisfies this stricter predicate. Unsafe admitted outputs remain uncached, so all cap reads retain full admission and detect subsequent metadata changes. RED getter/proxy regressions precede the correction; repeat independent review as REVIEW-v2 and all applicable source gates. Original REVIEW-v1 remains issues_found history, not overwritten.
