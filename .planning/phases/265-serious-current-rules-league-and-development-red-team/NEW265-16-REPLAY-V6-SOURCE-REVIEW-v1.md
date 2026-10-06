---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
reviewed: 2026-10-06T01:09:34Z
depth: standard
diff_base: 3044e7ff
source_commit: b992a2bcbb8deb4cdc22a77f257fb4ea344214c9
author_agent: replay-v6-source-executor
reviewer_agent: review_265_replay_v6
independently_reviewed: true
files_reviewed: 9
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/run-v1-38-lean-correction.ts
  - scripts/run-v1-38-lean-correction.sh
  - scripts/lib/v1-38-lean-container-match-session.ts
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/lib/v1-38-lean-baseline-match.ts
  - scripts/lib/v1-38-lean-baseline-source.ts
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/run-v1-38-lean-replay-validation-v6.test.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
execution_authorized: source_only
empirical_credit: false
phase_complete: false
---

# Plan 265-16: v6 source review

## Narrative Findings (AI reviewer)

### CR-01 — BLOCKER: setup segments can erase current-turn work

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-correction.ts:494-508`

**Issue:** `validateLeanReplaySetupWitnessV6` permits up to 100 segments and requires only chronological non-overlap, the approved first start, and a self-consistent hash. It does not authenticate excluded gaps as bounded inter-turn human idle. `leanReplayCarryElapsedV6` then sums only the segment durations, omitting every gap. This defeats the approval's requirement that every current-turn research, implementation, test, review, administrative, run and check millisecond count from `1791247033529` over the `36,151,532`-ms carry.

For a concrete static counterexample, let `S = 1791247033529`, retain every required fixed witness field, recompute its ordinary `labRoot`, and set:

```typescript
segments: [
  { startMs: S, closeMs: S },
  { startMs: S + 3_600_000, closeMs: null },
]
```

At `accountingAtMs = S + 3_600_000`, all predicates at lines 497–507 succeed, but line 508 returns `36,151,532`, not `39,751,532`. Larger gaps can erase the entire remaining allowance. A hash proves those bytes are internally consistent, not that an hour was authorized idle.

The defect reaches real admission: request admission compares `setupAccountingRoot` with this validator's witness root at line 288; `inspectLeanReplayPredecessorV6` consumes the undercounted value at line 541; preparation uses that predecessor at lines 609–611. The allocation's fixed minimum carry does not restore omitted current-turn work. Independent request-data review is a separate gate, not a runtime predicate authenticating gaps. The new fixture at `scripts/run-v1-38-lean-replay-validation-v6.test.ts:286-295` tests only one open segment and fixed-field mutations, so its successful assertion does not cover this case.

**Fix:** For this approved uninterrupted current turn, require exactly one segment `{ startMs: LEAN_REPLAY_V6_CARRY.startedAtMs, closeMs: null }` and compute `priorElapsedMs + accountingAtMs - startedAtMs`. Reject any additional segment or closed first segment. If later turns genuinely need idle exclusion, add a separately authenticated finite custody mechanism for each exact excluded gap before allowing it; do not accept caller-selected gap timestamps. Add negative synthetic regressions for the counterexample, near-cap gap erasure and unapproved extra segments, plus an exact-boundary positive case. Preserve v1–v5 code paths and constants.

## Scope and boundaries

Static review of the additive v6 diff and its relevant existing admission, capability, publication, retained-reader and accounting seams, against the approved plan and PLAN-CHECK-v2. No fallow structural substrate was supplied. AGENTS.md was read; no project-local `.codex/skills` or `.agents/skills` inventory was present. The code-review skill shaped severity, source-only review and concrete remediation; no automated review helper was invoked.

The reviewed selector explicitly admits exact v6/v5 allocations before enabling validation-only replay parsing. The finite v5 predecessor branch checks its named allocation/raw/time/terminal/empty-ledger roots and does not require a stopped ledger. Publication producers and authority/retained readback pass route/allocation/source/HEAD/snapshot identity. The v6 broker builder changes origin schema and request-prefix labels over the v5 builder; the sealed startup harness is not changed by this diff. These observations do not cure CR-01 and are not a blanket correctness or native-feasibility certification.

No source edits, test invocation, empirical helper, provider, Strategy, Match, allocation preparation, historical/empirical reader or payload/gzip inspection occurred in this review. Shell commands were used only for static file/git inspection. The implementation's reported 148 synthetic passes were not rerun and are not native proof. Fixed guest 1,000/host 5,000/startup 2,500/Match 600,000-ms limits, 4× inflate guard and complete audits must remain unchanged during the bounded fix. Full-buffer inflation remains; no RSS feasibility or 36-Match fit is established.

**Gate outcome:** source review has a blocker. Apply the bounded source fix, then validate fixed source, then independently verify it before any new data/helper/allocation/entry. This report grants no execution authority, Phase 265 completion, LEAG credit, freeze, formation, holdout, public, counted or production authority.
