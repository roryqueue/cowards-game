---
status: source_diagnosis_closed
trigger: v10-1 baseline stopped at the resource guard before first Match charge
created: 2026-10-07
updated: 2026-10-07
goal: find_root_cause_only
---

## Symptoms

Expected: the independently reviewed conditional baseline passes unchanged resource admission and begins its 36 private cells. Actual: unique MAIN43305 exited1/detailswithheld after child SIGKILL, parent reason resource_threshold, no result and zero ledger records/charges. Exactly one independent terminal-only verifier exited0, acceptedfalse/authorizingfalse/entry_terminal_only; initiatingCauseunknown. The held source and HEAD remained fixed until this closure. No ordinary baseline reader was eligible or invoked.

## Current Focus

hypothesis: v10-1 baseline admission repeats full accepted-diagnostic authentication through both request and predecessor checks; this is a credible avoidable memory-pressure path, but the initiating cause is unproven.
test: bounded static tracing of the v10-1 parent/child request/predecessor/accepted-check/FINAL call graph; no empirical reproduction or heavy historical scans.
expecting: identify source-level duplicate work without asserting native allocation or kill causality.
next_action: if later authorized, redesign admission to perform one full diagnostic authentication and thread an ephemeral, source-bound validated receipt through the existing full audits; retain all custody, lineage, freshness, and cap checks.

## Evidence

- Actual allocation ede8c186/raw50d2b5d2/source26c1befe/HEADd93811c2; unique entry43305 closed. Child terminal child_failed, signalSIGKILL, exitnull, upper179238ms; parent and child processes closed. All32 prior charges carry; zero additional retained charges. No new route is authorized by the terminal outcome.
- Retained reason root07516765 says resource_threshold; failure receipt absent and initiatingCauseunknown. It does not distinguish memory from elapsed threshold or locate an allocation/throw point.
- Terminal records parentRSS562851840B and childmaximumobservedRSS609271808B. Combined with unchanged512000000B external reserve and335544320B guard yields2019667968B, above unchanged2,000,000,000B scratch cap. This is a consistent memory explanation, not a simultaneous failure-time receipt or peak attribution.
- Elapsed is well below93,600,000ms cumulative deadline at the retained terminal. Original diagnostic accepted check23564b5d and actualFINAL91213587 remain immutable and are not new empirical authority.

## Eliminated / Unknown

- No evidence of a charged Match, gameplay failure or public/counting/production operation in this baseline.
- Do not infer exact initiating allocation, native peak, OS fault, guest timeout, or failure-time resource vector from the terminal maxima.
- Do not reproduce, retry, refill a result, mutate consumed authority/allocation/check/ledger or count synthetic evidence as empirical success.
- Static call graph confirms the baseline path is duplication-heavy: `readLeanRemainingRequestV9` authenticates the accepted diagnostic check and retry closure, then calls predecessor inspection; `inspectLeanTwentySixPredecessorV10` authenticates that same check and closure again. The later baseline terminal-carry and prepared-predecessor validators also authenticate them, where reached.
- Each `authenticateLeanSupervisorDiagnosticCheck("v10-1")` is not a cheap root comparison: it reopens ledger/time/evidence, request, result/reuse, pair/observation, source and replay artifacts, then runs `auditLeanCorrectionRetained`. Its request lineage path re-enters predecessor inspection. Accepted closure derivation calls the accepted-check authenticator again. This establishes repeated materializing/full-audit work in source, not its measured memory cost or whether it caused SIGKILL.
- No existing bounded single-assessment cache/receipt was found for these checks. The WeakMap purpose in retained code is narrowly scoped to permit recursive accepted lineage and is deleted on return; it is not a reusable full-audit result. Cold-reuse validation likewise reconstructs/authenticates retained artifacts and has no evident memoization in the inspected implementation.
- Smallest defensible repair direction (not applied): preserve every full audit but compute the accepted check/closure once per admission boundary and pass an ephemeral validated receipt to the nested consumers, binding it to current source/HEAD, request bytes, role/route, and custody roots; do not persist/share across calls without an explicit invalidation and byte-custody design. This is a direction for review, not a proven fix or authorization to change code.

## Resolution

root_cause: repeated accepted-check and closure authentication is confirmed in the v10-1 baseline source call graph and is a plausible admission-memory contributor; exact initiating cause remains unknown
fix: none
verification: bounded static source tracing only; independent terminal-only verification closed; no empirical reproduction or causal allocation measurement
