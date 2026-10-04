---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-04T19:29:34Z
status: clean
scope: static_one_shot_main_composition_only
author_agent: /root
reviewer_agent: /root/review_265_correction_diagnostic_data
independently_reviewed: true
helper_root: sha256:39be76f02b9104961d001afce286359e7ea299a65f89519bc37dd2d213c6872e
source_root: sha256:5a9cb582e21abc6927fcbc28d2481851c1563f188c15be955f166af57732703e
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
empirical_execution: not_started
---

# Static MAIN-entry composition review

No BLOCKER or WARNING in the exact 35-line owner-only 0600 single-link `main-entry.ts` helper with the raw root above. Read statically only; it was not imported or executed. Existing reviewed source has no delta from `18ff084c42cc82ca782690dc1f7b78a249b4c1f3`.

Imports resolve from fixed private TMP to the existing reviewed correction, parent, ledger and contract APIs. The composition takes the exact real preparation-close wall/monotonic observation as the new run-associated upper-bound start, without altering that receipt or any closed journal row. Preparation custody is checked against semantic root/schema/route/mode, actual allocation and closed journal; predecessor inspection authenticates the preparation carrier/closure. Starting the new run clock at the preparation close captures the whole subsequent administrative/review/commit/push/startup gap and does not overlap the already closed preparation or authoring intervals.

`beforeRelease` passes the actual closed cumulative time plus the run carrier through the existing reserve-aware admission check before fork and again before release. The same carrier supplies actual entry wall/monotonic bindings, so child same-process elapsed/capacity checks include that gap. Existing parent supervision closes the entry, and `closeLeanCorrectionAdmission` imports only the remaining run-finalization tail, preserving failure custody and avoiding double debit. Failed pre-entry composition still attempts durable admission closure rather than manufacturing a result.

Before parent dispatch, helper bytes must match the owner-only canonical independent clean receipt, with distinct exact author/reviewer identities. `process.argv[1]` selects the reviewed `scripts/run-v1-38-lean-correction.ts` for the parent's fork; the child mode remains exactly `child-diagnostic`, not the helper. Existing committed-allocation, unique unused store/entry, source/request/HEAD, IPC release, parent observation, prefix capacity and charge-before-provider checks remain active. The child's existing `allocationFor` additionally checks candidate/request arrays against the authenticated request. The opt-in one-cell route, limits, reserve values, old evidence and conditional-baseline denial remain unchanged.

This equivalence is conditioned on MAIN's stated checked shell launch: reset dangerous Node variables, caches disabled, umask077/core0, fixed TMP and `node --max-old-space-size=768 --import tsx` in the exact repository. Do not use evaluation/input-type flags for this actual forked launch. Preserve these exact helper/receipt bytes alongside source and HEAD throughout actual terminal and the unique appropriate retained check; the helper is private reviewed composition, not silently added to or substituted for the immutable source manifest.

Only static review/report and publication of the exact five-key canonical `main-entry-review.json` receipt are performed by this reviewer. No helper execution, run carrier, entry, historical/new empirical reader, retained/cold authentication, preparation, provider, Docker, Strategy or Match is invoked. Clean is a composition-review disposition, not actual capacity, execution success, diagnosis, phase/freeze/LEAG/formation/holdout/public/counting/production credit. All actual future costs remain carried under unchanged caps.
