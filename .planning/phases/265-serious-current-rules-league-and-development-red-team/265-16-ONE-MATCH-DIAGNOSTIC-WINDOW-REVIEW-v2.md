---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-11T17:17:13Z
depth: standard
source_base: 8162a5dd
source_commit: 7f3e6c935ed910d0471f7a70d462b3f984dcad92
files_reviewed: 3
files_reviewed_list:
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/lib/v1-38-lean-experiment-authority.test.ts
  - scripts/run-v1-38-lean-private-matches.test.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Independent narrow window amendment review v2

## Narrative Findings (AI reviewer)

No blocker or warning found in the exact three-source-file amendment delta `8162a5dd..7f3e6c935ed910d0471f7a70d462b3f984dcad92`, checked against APPROVAL-v2 and the current STATE checkpoint. This is a narrow amendment review, not a new broad source review or empirical admission. Earlier SOURCE-REVIEW-v1/v2/v3 remain unchanged.

Production change is limited to four numbers in oneMatchWindow: anchor1791738781000, deadline1791742381000, carry390839903, cap394439903. Reserve1860000 and schemaVersion lean-private-match-window-v2 are unchanged. The root continues to be derived from the complete new window body; no old consumed V1 window is changed.

Independent arithmetic: newanchor−prioranchor =10998000ms; priorcarry379841903+10998000=390839903ms. Thus all intervening wall time remains carried without reset/refund. Deadline−anchor and cap−carry both equal3600000ms. Deadline−1860000reserve−600000Match =1791739921000ms, 2026-10-11T17:32:01Z; hard stop is2026-10-11T18:13:01Z. These match the fresh approved window exactly.

Test changes update only the V2 expected window, V2 branch's mocked clock and runner fixture's wallAtMs/cumulativeElapsedMs/mock clock to those same values. V1 clock values, all cases/assertions, genuine own-version/cross-version authority checks, terminal publication/close-refusal regressions, finite code/origin/joins/privacy/tamper checks and reader predicates are unchanged. Historical41 charges and all cost/runtime/resource limits are unchanged. No schema, route, policy, engine, runtime or source semantics were amended.

ROOT reports canonical V2 allocation/store absence checked before amendment. This reviewer did not repeat artifact/history reads or promote that reported check to an independently rerun check. The accompanying WINDOW-SUMMARY is outside this three-source-file review; no test/verification credit is inferred from it.

## Release and limits

Only this new report was written. No source/test edits, tests, type/source gates, metadata, preparation, entry, runtime/provider/Strategy/Match, actual reader, history scans, commits or pushes occurred. Author-reported44/44 and diff0 remain author evidence, not independent executions. All read commands are closed; narrow review ownership/source hold released to ROOT. ROOT affected checks and distinct narrow source verification remain required before metadata/preparation/admission under the existing same-scope consent; this report creates no repeat-human-literal checkpoint. Latest entry17:32:01UTC/hardstop18:13:01UTC remain binding. No LEAG/baseline/full-Chronicle/freeze/Phase/milestone completion is claimed.
