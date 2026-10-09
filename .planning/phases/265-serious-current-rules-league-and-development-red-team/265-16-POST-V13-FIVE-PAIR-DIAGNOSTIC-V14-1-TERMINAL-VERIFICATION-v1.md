---
phase: 265-serious-current-rules-league-and-development-red-team
verified: 2026-10-09T01:13:35Z
status: pending_root_authentication
route: diagnostic
attempt_ordinal: 1
ordinary_verification_exit: 0
ordinary_verification_session: 73017
ordinary_verification_status: retained_valid
accepted: true
current_charged: 1
cumulative_charged: 36
cleanup_complete: true
terminal_authentication: wrong_path_expected_refusal
terminal_authentication_error: LEAN_CORRECTION_RETAINED_CUSTODY
source_root: sha256:6d986074c9b18530ee212984df21c135511f4a7fb8799be30e9d6552e80ba6a7
head: 0f596f46702bca9a54cd7bd80456b3f4ad0c55d4
allocation_root: sha256:8d2e0a4cc27e2ad56d0a3e595873a9139d9deb72c9d231b252c37c1481eb3814
request_root: sha256:2f74dc73415c2621a51f2d2566b1f03a6023046eb62492d3aa12ed29be75e2cf
result_root: sha256:c1897185521c2b98ded19d1f8a034708fa26383edd8041744f5b56e1cd086c2f
check_root: sha256:9c8a0663f003384697216538f97d87eae33c72e6764923ceba3fd6c07f7f1085
closure_root: sha256:ad65294c86b603c4509884f772c44674de8f84e93cbaa0f9ca9c6c49851c6469
carry_root: sha256:96074cbe62f06bec0ca0bd11a4327135106e0344885f02349e91acbdd17b0044
hold_root: sha256:877773d1989e29e6b9e581bcdae7fa73f7ed3b28918aef8df087766857933ebd
---

# Post-v13 five-pair diagnostic v14-1 terminal verification

**Verified:** 2026-10-09T01:13:35Z  
**Outcome:** One unique ordinary retained verifier ran to completion. Its stdout reported `retained_valid`, `accepted: true`, one current charge, 36 cumulative charges, and completed cleanup. This is a limited exploratory diagnostic result only.

## Actual command and closure

Ran exactly once:

```sh
sh scripts/run-v1-38-lean-correction.sh verify-supervisor-diagnostic-v14-1 --request .strategy-lab/lean-correction-supervisor-diagnostic-request-20261008-v14-1.json
```

The tool session was 73017; it closed with exit code 0 after approximately 67 seconds. The saved ordinary check reports reader interval `correction-supervisor-diagnostic-v8-verifier`, start `1791508334994`, observed `1791508355085`, and scratch high-water `1168826368` bytes. The saved closure records `closedElapsedMs: 160414221` and `readerCloseMs: 1791508355318`.

An additional v14 terminal-only authenticator was mistakenly invoked against this route. It exited 1 with `LEAN_CORRECTION_RETAINED_CUSTODY`; no retry or second ordinary reader was run. Static source review confirms this was the wrong path: the terminal-only verifier explicitly requires both `result.json` and the accepted check to be absent, which is the refusal/absence case, whereas this actual route has a result and accepted check. That refusal is expected and is not evidence of a custody defect. The correct route authenticates the ordinary terminal carry and accepted join; ROOT is performing that one correct authentication separately. Until that result is available, this report is pending authentication, not `gaps_found` and not a new human checkpoint.

## Safe custody and outcome

- Actual source and held HEAD remained `6d986074c9b18530ee212984df21c135511f4a7fb8799be30e9d6552e80ba6a7` / `0f596f46702bca9a54cd7bd80456b3f4ad0c55d4`.
- Allocation, request, result, saved check, closure, carry, and hold roots are recorded in frontmatter. No private Strategy material or runtime payload is reproduced here.
- The actual result is `limited_exploratory`; origin and initiating native cause remain unknown. The retained result explicitly grants no robust-pure claim; `complete`, `phaseComplete`, freeze admission, holdout opening, formation materialization, public, counted, and production authority are all false.
- The diagnostic ordinary reader did close as accepted (`finalReaderClose: true` in the saved pair closure). This is the actual diagnostic reader-close/accepted-check evidence, not the separate conditional-baseline FINAL. No baseline route was run.
- Current charge is 1; cumulative charge is 36. No refund, recredit, acceptance upgrade, FINAL, or Phase 265 league credit is inferred.
- Cleanup is reported complete by the ordinary verifier. The actual entry's reported parent/child are absent, and after process close no matching entry/verifier process remained. Source and HEAD are unchanged and remain held pending escalation.
- The ordinary verifier session and the failed authentication process both closed. No source, STATE, allocation, canonical result, or historical record was changed; only this allowlisted report was added.

## Authentication disposition

Source inspection confirms the extra terminal-only authenticator's guard at `scripts/lib/v1-38-lean-correction-retained.ts` rejects when either `result.json` or the accepted check exists. The actual ordinary route has both, so its refusal was a verifier-selection error, not a route finding. The ordinary check's acceptance and cleanup fields remain as recorded above; independent accepted-join/carry authentication is pending ROOT's separate action. No second ordinary verifier, source edit, canonical evidence mutation, or product/resource decision was made here.

The approved resource envelope remains unchanged: 165,600,000 ms, FULL 108,000,000 ms plus all wall time, 15 GB/300 Matches, 2 GB scratch, and the 31-minute reserve through the existing deadline. Current-rules freeze, formation, unopened holdout, public/counting/production, and Phase 265 completion remain unclaimed.

---

_Independent retained verification report; no source diagnosis, fix, or commit._

## Transparent correction (2026-10-09)

The initial disposition incorrectly treated the terminal-only authenticator refusal as a real custody gap and described the diagnostic reader close as absence of a FINAL. Both statements are corrected above: terminal-only is for result-absent refusal paths; this accepted diagnostic route has an accepted ordinary reader close, while a conditional-baseline FINAL is a distinct later artifact. Preserve the original mistaken invocation and exit code as an audit fact, but do not interpret it as a route failure. The report remains pending ROOT's one correct accepted-join/carry authentication.
