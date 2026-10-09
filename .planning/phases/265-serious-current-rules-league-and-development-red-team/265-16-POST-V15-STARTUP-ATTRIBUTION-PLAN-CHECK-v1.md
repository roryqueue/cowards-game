# Plan check: post-v15 startup attribution supplement

**Status:** `issues_found`  
**Plan:** `265-16-POST-V15-STARTUP-ATTRIBUTION-PLAN-v1.md`  
**Review scope:** Source-only plan review. No code, tests, runtime, provider, Strategy, Match, Docker, reader, publisher, or history scan was run.

## Result

The supplement preserves the stated runtime/resource caps, charged-failure semantics, privacy boundary, and unknown historical physical cause. Its goal is not yet executable as written: the chosen origin version already exists, the ordinal-5 authority route and its source closure are delegated to a future ROOT inventory rather than frozen in this plan, and the plan's no-control-repair fallback does not explicitly keep ordinal 5 dormant. Do not execute this draft or treat its “Checked” status as a passed review.

## Coverage summary

| Review area | Result | Evidence |
|---|---|---|
| Historical v15-4 attribution remains unknown; no consumed evidence is reopened | Covered | Plan objective and locked contract; consistent with `debug/v15-4-evidence-check.md` |
| Same-bounds runtime/resource limits and 39 cost-only charges | Covered | Plan lines 11–20 preserve startup 2500 ms, host 5000 ms, guest 1000 ms, Match 600000 ms, cumulative cap 250530903 ms, stop/cutoffs, ALL-wall, reserve, RAM/disk/Match caps and charges |
| Old V2/V3/V4 policies and V4/V6/V10 plus boundary 2/6/8 inventories | Stated as immutable | Plan lines 18, 38, 50; the source-level tests must still bind the exact existing bytes/paths |
| Route selection and strict ordinal-5 authority | Not fully planned | Task 3 defers the exact authority/request/archive paths to a ROOT inventory that is not present |
| Independent plan gate | Not passed | Draft says “Checked” before this review; this review finds blockers |

## Blockers

1. **[version_contract] BLOCKER — `startup_origin_v6` collides with an already implemented V6 schema and broker selector.** The draft freezes the successor as `startup_origin_v6` (plan lines 17, 27), but `scripts/lib/v1-38-lean-container-match-session.ts` already defines `LeanStartupOriginV6`, `validateLeanStartupOriginV6`, and `buildLeanContainerBrokerSourceV6`; session construction selects V5/V6/V7. Reusing V6 cannot simultaneously preserve the existing V6 schema/behavior and add the six new fields. The implementation could overwrite or ambiguously route an existing origin contract. **Fix:** choose a genuinely unused, exact version across the functional schema, broker, authority, policy and tests (the current source already uses V7); enumerate compatibility guarantees for existing V5/V6/V7 paths and make the new selector strictly opt-in.

2. **[exact_source_closure] BLOCKER — The authority/selector path is not owned or frozen, so the plan cannot ensure V5 remains the default and only exact host-issued ordinal-5 authority selects the successor.** Task 1 owns the supervisor/session files, but Task 3 names no files: it says ROOT will name them in Task 2's “frozen finite inventory.” Task 2 itself allows “additional” consumers/tests named by ROOT later. This is circular/post-hoc scope definition, not a finite implementation closure. In the current call chain, startup authority is issued/claimed in `scripts/lib/v1-38-lean-experiment-authority.ts`, selected by `leanStartupAuthorityDescriptorV5` in `scripts/lib/v1-38-planner-supervised-runtime.ts`, passed through `scripts/lib/v1-38-factory-supervised-runtime.ts`, and reaches broker selection in `scripts/lib/v1-38-lean-container-match-session.ts`; mode/policy/request/path selection also lives in `packages/strategy-lab/src/league/lean-experiment.ts` and the experiment/correction entrypoints. These authority and selector seams, their exact tests, and source-manifest/debit effects are not frozen as Task 3 owned files. **Fix:** add a pre-edit, explicit path/symbol closure covering authority issuance and claim, planner/factory propagation, mode/policy/request/archive selection, every strict producer/consumer/retained validator, source-manifest inputs, and exact tests; prohibit runtime discovery or ROOT additions after freeze. Require negative tests proving absent/forged/wrong-ordinal/default/legacy authority cannot select the new broker or policy.

3. **[custody_inventory] BLOCKER — The actual V7 review/custody inputs and physical inventory are not included in the checked plan.** The contract requires exact actual source-author, reviewer, ordered semantic-closure, failed-base `158012ab`, Git/source joins, ROOT terminal-report roots/raws, and mode-0600 custody (plan lines 18–20, 40, 50). But it neither names the actual review/attestation/DATA/HELPER/request/root inputs nor supplies the frozen path/alias/symlink and retained-output byte inventory; it asks ROOT to enumerate those later. This leaves execution without a reproducible identity contract and cannot prove the old inventories remain byte-identical or account for new physical bytes. **Fix:** freeze the exact current terminal-report and actual V7 metadata paths/roots/raw IDs, ordered reviewer/source-author joins, all changed/source/review/generated/retained paths, physical byte debits and alias handling in the plan before execution; tests must compare those exact inherited inventories and reject unlisted paths. Do not rerun the reader/history audit to obtain them.

4. **[control_repair_gate] BLOCKER — The plan does not make an actual same-bounds control repair a necessary condition for any fresh route.** Objective says “Repair” the lifecycle-observation blind spot, but the fallback at plan line 60 permits preserving blocking behavior and reporting that control repair is unjustified. Task 3 requires “concrete repair review” only in the earlier general contract and its activation checklist does not say that a successful same-bounds repair test is mandatory; it otherwise describes attribution/schema/authority joins. That permits telemetry-only work to appear complete and risks treating attribution as recovery, contrary to the UNKNOWN physical cause and current stop boundary. **Fix:** require an inert, same-bounds control test demonstrating the intended pre-GO classification/wakeup improvement while READY atomics remain authoritative, fresh-worker isolation is preserved, and absolute deadlines/accounting are unchanged. If the pinned runtime offers no safe primitive or the test fails, permit attribution-only source work if desired, but explicitly fail the control-repair gate and keep ordinal 5 dormant with no fresh route authority.

## Warnings

1. **[review_status] WARNING — Draft claims the gate has already passed.** The heading currently says `Status: Checked source-plan supplement`, although this document is the independent plan check and returns blockers. **Fix:** change the draft status to `Draft — awaiting independent plan check`; only mark it checked after a subsequent clean gate.

2. **[verification_caps] WARNING — Test/command limits are constraints, not yet fully executable assertions.** The draft states each case is at most 5000 ms and each command is capped at 60 seconds/768 MiB, but the verification entries do not provide a concrete invocation/enforcement for the per-case timeout and memory cap, and the consumer selector list is deferred to the unfrozen ROOT inventory. **Fix:** freeze the exact selectors and capped command form, including a 5000-ms per-test limit, and record RED-before-implementation then GREEN results without adopting the research's 30000-ms timeout. Keep every command within 60 seconds and 768 MiB.

## Structured issues

```yaml
issues:
  - plan: "265-16-POST-V15-STARTUP-ATTRIBUTION-PLAN-v1"
    dimension: "version_contract"
    severity: "blocker"
    description: "The proposed startup_origin_v6 version is already implemented as LeanStartupOriginV6/buildLeanContainerBrokerSourceV6; adding a different shape under that version collides with existing behavior."
    fix_hint: "Choose an unused explicit successor version and preserve/test all existing V5/V6/V7 schemas, policies, defaults and selectors."
  - plan: "265-16-POST-V15-STARTUP-ATTRIBUTION-PLAN-v1"
    dimension: "exact_source_closure"
    severity: "blocker"
    description: "Task 3 has no exact owned path list and Tasks 2/3 defer source/test closure to a later ROOT inventory, leaving host authority, planner/factory propagation, and policy/route selection outside a frozen implementation contract."
    fix_hint: "Freeze exact authority/selector/request/archive/source-manifest/producer/consumer/retention paths and tests before edits; cover the full authority call chain and fail-closed opt-in."
  - plan: "265-16-POST-V15-STARTUP-ATTRIBUTION-PLAN-v1"
    dimension: "custody_inventory"
    severity: "blocker"
    description: "Actual V7 review/custody roots and the physical path/alias/symlink/retained-byte inventory required by the plan are not enumerated in this plan."
    fix_hint: "Include exact terminal-report and V7 metadata/root inputs, ordered source/reviewer joins, and finite physical debit inventory without reopening history."
  - plan: "265-16-POST-V15-STARTUP-ATTRIBUTION-PLAN-v1"
    dimension: "control_repair_gate"
    severity: "blocker"
    description: "Attribution-only fallback can leave the blind spot unrepaired, but the plan does not make demonstrated same-bounds control improvement an explicit necessary gate for ordinal-5 route authority."
    fix_hint: "Require an inert same-bounds control-repair proof; if unavailable, report attribution-only and explicitly keep ordinal 5 dormant with no route authority."
  - plan: "265-16-POST-V15-STARTUP-ATTRIBUTION-PLAN-v1"
    dimension: "review_status"
    severity: "warning"
    description: "Draft declares itself checked before this independent plan gate; the current gate result is issues_found."
    fix_hint: "Mark the draft pending review, and only mark checked after a later clean plan check."
  - plan: "265-16-POST-V15-STARTUP-ATTRIBUTION-PLAN-v1"
    dimension: "verification_caps"
    severity: "warning"
    description: "RED/GREEN intent is present, but exact timeout/memory-cap command enforcement and the finite selector list remain unspecified or deferred."
    fix_hint: "Specify runnable capped commands and per-test 5000-ms enforcement, preserving 60-second/768-MiB command caps and RED evidence."
```

## Recommendation

Return to the planner for revision. Preserve all existing bounds and the UNKNOWN historical cause. No plan-check pass, implementation, or route authority is granted by this report.
