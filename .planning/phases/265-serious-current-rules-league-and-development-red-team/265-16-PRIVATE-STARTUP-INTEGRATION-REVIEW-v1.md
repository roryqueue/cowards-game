---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16
supplement: private-startup-integration-v1
reviewed: 2026-10-11T20:06:41Z
depth: standard
source_base: ccb2dcb1
source_head: c0e6821a
files_reviewed: 7
files_reviewed_list:
  - scripts/lib/v1-38-lean-baseline-match.test.ts
  - scripts/lib/v1-38-lean-baseline-match.ts
  - scripts/lib/v1-38-lean-container-match-session.ts
  - scripts/lib/v1-38-lean-experiment-authority.test.ts
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/run-v1-38-lean-private-matches.test.ts
  - scripts/run-v1-38-lean-private-matches.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 265 Plan 16: Private Startup Integration Code Review

## Summary

Independent, focused standard review of the seven-path delta ccb2dcb1..c0e6821a and its directly called admission, native-construction, serialization and retained-validation seams. Approval, research, checked plan, source summary, AGENTS.md and current top STATE establish the scope. No project-local skill index was found. The code-review skill was used to require concrete source evidence and severity classification; historical memory informed proportional scope only, not current authority.

One BLOCKER: the initial provider-creation frontier is checked at issuance entry but is not attached to the V3 construction capability. Slow authentication or delayed use can therefore start a provider after the approved cutoff. Source admission must remain closed until scoped repair, re-review, ROOT validation and distinct source verification.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: BLOCKER — V3 construction grants remain usable after the initial-entry frontier

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-experiment-authority.ts:1026-1029`

**Affected seams:** `scripts/lib/v1-38-lean-experiment-authority.ts:664-679,359-363`; `scripts/lib/v1-38-lean-baseline-match.ts:167-176`; unchanged caller `scripts/lib/v1-38-factory-supervised-runtime.ts:91-112`.

**Issue:** `issueLeanPrivateMatchRuntimeAuthorityV3` samples `Date.now()` before calling `issuePrivateMatchSeat`. The latter performs three bounded Git subprocess calls, file/source authentication and compilation before minting the capability. None of those operations rechecks the V3 frontier. The returned capability then uses the shared `claimLeanStartupAuthorityV8` path, which checks identity and one-use layer order but has no V3 expiry or current admission/debit-state condition. Native factory construction compiles again before its factory claim; planner/session claims also accept the same timeless capability. Thus issuance begun just before 20:25:02 UTC can complete after the cutoff and still dispatch. More directly, a genuinely minted unused capability can be held until 20:25:02.001 and its factory→planner→session construction claims remain valid. The existing test checks issuance *begun* after the frontier, not late completion or delayed construction claims.

This violates the approved cutoff for initial provider creation/admission and its requirement for the complete remaining Match plus closure reserve. It is not about later Activation calls within an already admitted Match: those should retain their unchanged lifetime/checkpoint behavior.

**Fix:** Store a V3-only, nonserializable initial-construction guard in the private issued-state associated with each V3 capability. Recheck the approved clock/window and active own debit after expensive issuance authentication and at the existing factory/planner/session construction claims, before native creation. Leave V1/V2 issued states and the V8 grant shape unchanged; do not add the initial frontier to later invocations. A private guard closure or separate WeakMap in the owned authority module can avoid editing unrelated runtime files. Add inert regressions that advance the mocked clock during issuance authentication and between genuine minting and each construction claim; each late path must refuse without provider creation, while claims at the frontier and later Activation behavior remain compatible.

**Minimal repair ownership/API:** No additional production source path is necessary. The already-owned `scripts/lib/v1-38-lean-experiment-authority.ts` can hold `WeakMap<object, () => void>` for V3 construction guards only. After expensive `issuePrivateMatchSeat` succeeds, `issueLeanPrivateMatchRuntimeAuthorityV3` rechecks the window and registers an opaque guard that validates the current V3 admission/debit and unchanged initial frontier. Inside `claimLeanStartupAuthorityV8`, invoke the guard when present before adding that layer to `state.claims`; preserve the existing one-use ordered claims and leave absence of a guard as the old V1/V2 behavior. The actual existing construction call sites are factory `scripts/lib/v1-38-factory-supervised-runtime.ts:106`, planner `scripts/lib/v1-38-planner-supervised-runtime.ts:132` and session `scripts/lib/v1-38-lean-container-match-session.ts:526`; all already delegate to the owned claim function and need not be edited. Tests fit the already-owned authority test path and, for connected no-dispatch evidence, baseline-match test path. Failed/late post-auth issuance must not return a usable capability; any consumed seat remains spent. A checked narrow amendment should authorize the shared-claim V3-only guard, not broaden old route acceptance, change V8 payloads or forbid later Activation calls.

## Review coverage and limitations

Inspected own V3 opaque maps/context/capacity consumption, charge43 and historical42 carry, pinned historical bytes versus fresh prefix, explicit issuer version dispatch, exact Git predicates, genuine current observer/native verification, one-shot full-preimage producer, finite receipt-v2/privacy whitelist, independent retained commitment joins, terminal/result anchors, failure-finalization envelope and exclusive publication handling. Connected test bodies use the real composer and producer before secure fixture persistence and actual V3 fixture reader; mocked native/authority seams are not treated as live evidence. Existing V1/V2 wrappers retain own-version guards; no old reader was invoked.

The retained request-preimage recomputation limitation is expressly qualified and is not a defect or demand for external certification. Actual held source/HEAD and independently recorded terminal/result byte anchors remain required for empirical provenance; self-consistent roots alone are not certified. No source tests, final ROOT gates, actual metadata/preparation/allocation/capacity/native/provider/Strategy/probe/Match or consumed empirical reader were executed by this reviewer. Author-reported test passes and exactly13 inherited strict diagnostics are context, not independently rerun proof or a globally green type claim.

Only this report was written; source, old artifacts and tracking remain untouched. No commit or push. All reviewer commands are closed and source/command ownership is released to ROOT for scoped fix disposition. Guest1000/startup2500/host5000/Match600000ms, RAM3GB/scratch2GB/retained12GB/total15GB/cap300 and all historical charges/reserves remain unchanged. No empirical, LEAG, baseline, fullChronicle, phase, freeze, formation, holdout, public, counted or production credit is granted.
