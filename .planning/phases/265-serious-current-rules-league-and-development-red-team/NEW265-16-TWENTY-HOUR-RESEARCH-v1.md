# Plan 16 — Prospective 20-hour binding research

**Researched:** 2026-10-06  
**Scope:** Static source/authority/carry review for the approved prospective timebox amendment only.  
**Confidence:** HIGH (approval text and local production consumers inspected; no experiment or runtime was executed).

## Decision and recommendation

The direct approval in `NEW265-16-TWENTY-HOUR-APPROVAL-20261006.md` authorizes new prospective accounting/authority/allocation bindings up to 72,000,000 cumulative milliseconds. It does not mutate the earlier approval, retry plan, policy, consumed artifacts, or v8 57,600,000-ms envelope. At approval, all three ordinal v8 request/allocation/store/prepare-start/run-start destinations were absent and no ordinal had been consumed. [VERIFIED: approval artifact; source verification; `lean-experiment.ts` route definitions]

Implement this as one additive **v8 prospective timebox-extension binding**, not a new ladder of route implementations and not an edit-in-place of the old v8 policy/carry. Preserve ordinals and route isolation; add a separately rooted budget-extension identity/version to the new setup witness, request, execution authorization, allocation, admitted-cap commitment, and source manifest. Only allocations authenticating that extension receive a new 72,000,000-ms elapsed cap. The prior v8 binding remains 57,600,000 ms and its exact policy/carry meanings remain unchanged. Keep startup at v7 and all non-time ceilings unchanged. [VERIFIED: current exact-key v8 consumers in `lean-experiment.ts`, `run-v1-38-lean-correction.ts`, `v1-38-lean-correction-retained.ts`; recommendation]

At the approved boundary, carry is **56,000,917 ms**, with continuous prospective accounting from **1,791,326,194,166 ms**:

```text
elapsed(now) = 56,000,917 + max(0, now - 1,791,326,194,166)
```

This leaves 15,999,083 ms at approval before any work in the current task is charged; it is not a promise that the baseline fits. Exclude only the explicitly proven 20,091,542-ms inter-turn human idle interval. All current-task research, planning, implementation, review, setup, execution, cleanup, verification, and replay time counts. Preserve the 1,860,000-ms next-Match reserve. [VERIFIED: approval artifact]

## Consumer map and smallest safe source seam

| Concern | Current owner / behavior | Required additive binding |
|---|---|---|
| Caps and allocation admission | `packages/strategy-lab/src/league/lean-experiment.ts`: `LEAN_RETRY_V8_POLICY`/`LEAN_RETRY_V8_CARRY` are fixed to old roots/carry; `createLeanRetryAllocationV8` and `admitLeanAllocation` exact-key-check v8 data; `leanCapsForAllocation` currently maps retry modes to 57.6M `LEAN_REPLAY_V7_CAPS`. | Add a new prospective budget policy/root and 72M cap selected only when the allocation's exact new extension binding validates. Preserve old constants and let a legacy/no-extension binding continue to mean 57.6M. Bind new 56,000,917 carry and current start in that policy/setup/allocation path; keep 29 charges. |
| Request, setup, authorization, source identity | `scripts/run-v1-38-lean-correction.ts`: v8 request reader pins old decision/plan bytes; setup witness validator pins old start/prior/time-root/decision; source-manifest root commits old approval, plan, and policy; execution authorization repeats old roots. | Add exact new approval and amended-plan roots, setup witness fields/root, budget-extension root/version, and request/authorization checks. Setup must use the approved start/carry and validate the approved source (`codex-task-event-custody`); do not rewrite or accept a fabricated runtime terminal. |
| Time accounting / closure | `scripts/lib/v1-38-lean-correction-retained.ts`: generic retained verification uses `leanCapsForAllocation`; the v8 pre-entry closure additionally has a dedicated `leanCapsForAllocationModeV8()` hard-coded to 57.6M. | Route both generic and dedicated v8 cap gates through authenticated allocation budget selection. Ensure the *new* carry floor and reserve checks apply at predecessor inspection, preparation/entry, terminal, reader, and closure; old v8 stays under its old cap. |
| Baseline source and selected authority | `scripts/lib/v1-38-lean-baseline-source.ts` publishes a v8 binding; `scripts/lib/v1-38-lean-baseline-retained.ts` requires same-ordinal accepted diagnostic check + FINAL close; `scripts/lib/v1-38-lean-experiment-authority.ts` issues capabilities after allocation admission. | Include extension identity in publication/authority roots and keep the existing accepted-check/final-close join exactly mandatory. Do not relax or re-use the consumed predecessor reader. |
| Empirical boundary | `scripts/run-v1-38-lean-correction.ts`, baseline runner, allocation/setup path, retained readers and exact source inventory are independently gated. | No setup/allocation/entry/reader before new MAIN-authored request/helper review, immutable allocation commit, fresh empty 0700 store, same-process capacity, and final source/HEAD gates. |

The source inventory and connected v8 tests must be regenerated after the amendment. The old source verification (7/7 scoped truths, exact 901-entry manifest, fixed old root) does not validate the amended source identity; it remains a predecessor record, not transferable approval. [VERIFIED: `NEW265-16-RETRY-ENVELOPE-SOURCE-VERIFICATION-v1.md`; `NEW265-16-RETRY-ENVELOPE-PLAN-v1.md`]

## Preservation and tests required

Keep invariant: 15,000,000,000 bytes retained/future-write total, 300 cumulative Matches, 29 historical charged Matches, guest 1,000 ms, host 5,000 ms, startup 2,500 ms, Match 600,000 ms, and the 1,860,000-ms next-Match reserve. Historical peak disk/RSS remains unknown. Do not reset/refund/retrocredit time or charges. The v7 startup broker remains v7; v1-v7 route, cap, schemas, behavior, and consumed bytes remain unchanged. Preserve three distinct fresh private diagnostic ordinals and at most one conditional fresh 36-cell baseline, authorized only by a newly accepted diagnostic's actual retained check and final closure. A failed diagnostic spends only itself; stop at three unaccepted diagnostics, baseline failure, insufficient remaining time/capacity, or a new human-only decision. [VERIFIED: approval artifact and retry-envelope plan]

Focused connected regressions should cover:

1. Old v8 policy/allocation still selects 57.6M and cannot acquire the extension implicitly; new extension allocations select exactly 72M. Reject missing, malformed, mismatched, or cross-root extension bindings.
2. Exact carry/start values and boundary accounting: now before start contributes zero added elapsed; approval start yields 56,000,917; 72M is admitted only within the cap; time never drops through setup, gaps, readers, closure, or carry-forward. Keep the 1.86M reserve in capacity/preflight decisions.
3. Every production owner—not detached predicates—uses the selected authenticated cap: allocation admission, correction runner/preflight, `currentLeanElapsedMs`, retained correction and closure, source publication, baseline constructor/reader, and runtime authority issuer.
4. Preserve ordinal isolation, all three closure classes, and the v8 accepted-check + FINAL-close baseline join; no new allowance can authorize a baseline without that join.
5. v1-v7 regression and exact old artifact roots/manifest identities remain byte-for-byte unchanged; the amended source gets a fresh complete manifest and its own independent review, validation, and source verification.

Likely focused existing entrypoints: `scripts/run-v1-38-lean-host-stage-v8.test.ts`, `scripts/run-v1-38-lean-correction.test.ts`, `scripts/run-v1-38-lean-correction-bytes.test.ts`, `scripts/lib/v1-38-lean-correction-retained.test.ts`, `scripts/lib/v1-38-lean-baseline-retained.test.ts`, baseline-source and authority tests, plus v7 regression and boundary/privacy suites named by Plan 16. Tests are recommendations from source inventory; none were run for this research. [VERIFIED: plan/test paths and source inventory]

## Project Constraints (from AGENTS.md)

- Keep engine logic pure, deterministic, serializable, and side-effect free; this amendment belongs only to the private trusted coordinator/lab path.
- Do not run Strategy code in web/API or use Node `vm` as an untrusted-code boundary; preserve schema validation at each runtime boundary.
- Preserve canonical game terminology and immutable submitted Strategy Revisions; public replay does not expose Strategy source, memory, or objective payloads.
- Do not make unrelated rule, runtime, product, public, counted, freeze, formation, or holdout changes.
- Planning docs are committed when updated by the owning workflow; this research task itself performs no commit.

## Scope boundary / current facts

`STATE.md` still presents the earlier 16-hour frontier as blocked, while the direct, later-dated approval artifact records “yes, approved” for the 20-hour prospective amendment. Treat the approved artifact as the current authority for this narrow research; do not edit STATE here. No empirical execution, Strategy execution, Match creation, private-payload inspection, capacity probe, setup, allocation, or reader was performed. No packages are needed. [VERIFIED: approval artifact, STATE.md; activity scope]

## Sources

- `.planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-TWENTY-HOUR-APPROVAL-20261006.md` — authorized values, carry/start formula, idle exclusion, reserve, unchanged ceilings and stop conditions.
- `.planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-RETRY-ENVELOPE-PLAN-v1.md` — ordinal/closure/baseline requirements and empirical gates.
- `.planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-RETRY-ENVELOPE-SOURCE-VERIFICATION-v1.md` — predecessor source closure and explicit non-empirical scope.
- `packages/strategy-lab/src/league/lean-experiment.ts`; `scripts/run-v1-38-lean-correction.ts`; `scripts/lib/v1-38-lean-correction-retained.ts`; `scripts/lib/v1-38-lean-baseline-source.ts`; `scripts/lib/v1-38-lean-baseline-retained.ts`; `scripts/lib/v1-38-lean-experiment-authority.ts` — current production consumers.

**Research date:** 2026-10-06  
**Validity:** Until the approved amendment or production source identity changes.
