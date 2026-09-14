---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
reviewed: 2026-09-14T13:41:00-04:00
initial_reviewed: 2026-09-14T13:35:00-04:00
source_commit: f9f0cd63adeabc9c29ac3defbb259b4c3a318ab0
depth: deep
reviewer_role: reused-existing-gsd-code-reviewer-not-fresh-typed-reviewer
files_reviewed: 7
files_reviewed_list:
  - packages/strategy-oracle-model/src/bundle.ts
  - packages/strategy-oracle-model/src/model.test.ts
  - scripts/author-v1-38-factory-model-source.ts
  - scripts/author-v1-38-factory-model-source.test.ts
  - scripts/v1-38-factory-app-server-transport.ts
  - scripts/v1-38-factory-app-server-transport.test.ts
  - scripts/v1-38-factory-execution-evidence.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Phase 264 Task04 Repair Source Review

**Initially reviewed commit:** `f36609196740ad28f967363915ac121fdc99172d`

**Intermediate recheck commit:** `d3ecafff9f72d4b41f36f71e2b9e4346c2d55735`

**Final recheck commit:** `f9f0cd63adeabc9c29ac3defbb259b4c3a318ab0`

## Summary

RUN01 correctly rejects an unadvertised model after `initialize`/`model/list` and before `thread/start` or a charged turn. RUN02 retains raw JSONL, parsed usage when available, elapsed time, a system-failure terminal, and no bundle after a charged transport failure. The corrected retained Task04 outcome byte root was independently confirmed as `sha256:86afd06a8e66f8d54dbee6f2484e67d7573435e0869f000e6f9aaef5097281a6`; it reports `reportedThreadModel: null` and unavailable effective negotiation evidence.

The d3ec recheck resolved CR-01 for a failed notification that names the admitted turn, including first-terminal retention in transport and direct model/evidence decoder regressions. The final f9f0 recheck resolves CR-02: any `turn/failed` or `error` notification now permanently poisons the one-shot transport and both retained-evidence decoders, regardless of its stated turn ID.

Focused pure tests passed: 4 files, 35 tests. No empirical call, guest, Match, generated-source execution, or provider interaction was performed.

## Resolved Critical Finding

### CR-01: Contradictory failed-turn transcripts can still admit as successful evidence — resolved at `d3ecafff`

**Files:** `packages/strategy-oracle-model/src/bundle.ts:109-164`; `scripts/v1-38-factory-execution-evidence.ts:84-97`

**Issue:** Both retained-transcript decoders reject `model/rerouted`, but neither rejects `turn/failed` or `error` for the admitted turn. A raw JSONL sequence with a valid thread start, a `turn/failed` event, then a later matching `turn/completed` event, one source message, and valid usage passes the completion/source/usage checks. `decodeFrozenModelRawResponse` can therefore admit a V2 bundle, and `verifyFactoryAuthoringRecords` can reopen the same contradictory transcript as successful execution evidence.

This conflicts with the fail-closed retained-evidence boundary: a recorded failed turn must not become a successful model source simply because a later contradictory completion is appended.

**Resolution:** `bundle.ts` and `execution-evidence.ts` now reject a `turn/failed`/`error` for the admitted turn, and transport preserves the first terminal and forbids that turn permanently. The new model, evidence, and fake-transport regressions cover a failed admitted turn followed by a completion.

## Resolved Critical Finding

### CR-02: Mismatched failure/error notifications remain accepted in a one-turn run — resolved at `f9f0cd63`

**Files:** `scripts/v1-38-factory-app-server-transport.ts:89-100`; `packages/strategy-oracle-model/src/bundle.ts:156-164`; `scripts/v1-38-factory-execution-evidence.ts:91-95`

**Issue:** The patched checks reject a `turn/failed` or `error` only when its `turnId` equals the admitted turn. In this isolated transport there is only one turn. A raw stream containing `error` or `turn/failed` with `params.turnId: "other"`, followed by a valid completion for the admitted turn, is therefore accepted: transport marks only `other` forbidden, and both retained-evidence decoders ignore the mismatch. That lets an inconsistent protocol trace reach a valid bundle/evidence record.

**Resolution:** The one-shot transport now sets a permanent `protocolTurnFailure` for every `turn/failed` or `error`, and both decoders reject every such notification. Regressions use `other-turn` to verify that a mismatched ID cannot be ignored. The final narrow review has zero unresolved RUN01/RUN02 source findings.

## Review Notes

The protocol raw-buffer has no separately enforced byte cap. That is not reported as a new defect here because the supplied Task04 bounds did not establish a raw-capture-size policy; this review does not infer one.

---

_Final recheck: 2026-09-14T13:41:00-04:00; initial review13:35._
_Reviewer: reused existing gsd-code-reviewer role (not a fresh typed reviewer)_
_Depth: deep_
