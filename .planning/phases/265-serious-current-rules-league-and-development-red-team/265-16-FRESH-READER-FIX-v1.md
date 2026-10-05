---
phase: 265
plan: 16
scope: source_only_review_fix
status: fixed_pending_independent_review
finding: CR-01
source_commit: 31e0e379f53664a00a6464a08c75bf83983aecc6
source_root: sha256:cf9096c68ff0954ed83334f635cf8ac944d4d4bf0b4af3b602f93ebe65ff9bca
author_agent: /root/execute_265_fresh_reader_v4
empirical_admission: false
---

# Plan 265-16 Fresh Reader Source Fix v1

CR-01 is fixed in the real accepted diagnostic-check authenticator: v4 requires thirteen cumulative charges (twelve carried plus one current); v2 and v3 retain their exact twelve-charge requirement. Every version still requires exactly one current charge, a stopped ledger, its own allocation, and the complete retained audit and closed reader joins.

## RED / GREEN evidence

- RED `e3f617c3`: the real `authenticateLeanSupervisorDiagnosticCheck` regression failed only v4 with `LEAN_CORRECTION_RETAINED_ACCEPTED_CHARGE`; v2/v3 passed.
- GREEN `31e0e379`: the same three versioned cases pass. Each also rejects the other cumulative total and every cross-version dispatch. Existing full-report tampering and reader-closure checks remain in these cases.
- Command: `LEAN_COLD_REUSE_FIXTURE_DIR=/nonexistent-source-only pnpm exec vitest run scripts/lib/v1-38-lean-correction-retained.test.ts -t 'authenticates only rooted full reports'`.
- GREEN result: three passed, forty-four excluded by the focused test filter; 6.10 seconds. `git diff --check` passed.

All fixtures are synthetic. The unchanged sealed cold-proof seam and file custody are mocked; the actual authenticator, allocation-version selectors, charge gate, complete pure retained audit, and reader joins execute. No historical private evidence, ordinary empirical reader, saved-data diagnostic, provider, or Match was read or invoked. This establishes the source regression, not empirical admission or Phase completion.

## Review custody correction

`265-16-FRESH-READER-SOURCE-REVIEW-v1.md` names the old comparator commit `a064a324e6402d42c7f35dfbf4a79566e99fb046` as its `source_commit`. Its blocker report is preserved unchanged. Any clean successor review must independently bind the current source fix commit above and recompute the current v4 manifest above; the old commit must not be reused as the fixed-source identity.

## Boundaries and self-check

Only `scripts/lib/v1-38-lean-correction-retained.ts`, its focused synthetic tests, and this report changed in this fix. No runtime/engine/resource bound, selector default, historical artifact, canonical result reservation, allocation, ledger, or STATE changed. The repaired exact Buffer comparator is untouched. Source hold and all empirical operations remain MAIN-owned, pending independent clean review.

Self-check passed: RED and GREEN commits exist; the focused actual-consumer regression passes; the v4 source manifest was recomputed after the GREEN commit using the source-only manifest function. No source stubs or new trust-boundary surface were introduced.
