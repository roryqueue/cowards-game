---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
supplement: post-v15-checkpoint-repair-v1
type: execute
wave: 13
depends_on: [265-15]
autonomous: true
execution_owner: source_only_ROOT_scheduled
requirements: [LEAG-01, LEAG-02, LEAG-03, LEAG-04, LEAG-05, LEAG-07]
files_modified:
  - scripts/run-v1-38-lean-correction.ts
  - scripts/run-v1-38-lean-baseline.ts
  - scripts/lib/v1-38-lean-checkpoint-observation-v15.ts
  - scripts/run-v1-38-lean-checkpoint-observation-v15.test.ts
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/lib/v1-38-lean-resource-window-v15.ts
  - scripts/run-v1-38-lean-resource-window-v15.test.ts
must_haves:
  truths:
    - Each selected v15 child checkpoint takes a fresh invocation-local observation and applies every existing guard to that coherent observation; no observation survives the synchronous call.
    - Live parent checks, current and maximum child RSS, projected bytes, free disk, available memory, physical no-refund identity checks, allocation admission, ledger admission and cumulative elapsed checks remain enforced.
    - Legacy/default paths, guest/runtime/game rules, parent sampler and post-append ledger validation are unchanged.
    - Actual v15-2 remains refused with 37 cumulative charges and its operator-error hold-refusal preserved; no later route is activated by source identity changes.
    - Fresh independent review, ROOT validation and independent source verification grant source-only credit, not measured speedup, identified initiating cause or admission.
  artifacts:
    - path: scripts/lib/v1-38-lean-checkpoint-observation-v15.ts
      provides: synchronous one-checkpoint observer and validation composition without durable observation caching
    - path: scripts/run-v1-38-lean-checkpoint-observation-v15.test.ts
      provides: portable inert counting, changing-observation, admission and cap parity tests
  key_links:
    - from: runLeanCorrectionChildBody checkpoint
      to: assessLeanPrefixCapacity and assertLeanCorrectionResources
      via: one freshly sampled coherent v15 observation and identical additional-byte projection
    - from: finite report inventory
      to: cumulativeLeanPhysicalBytes
      via: explicitly named new reports with existing identity/growth/no-refund accounting
    - from: leanResourceWindowDocumentsV15 review
      to: strict source-review consumer
      via: exact new SOURCE-REVIEW-v3 path and unchanged source/commit/actor joins
---

<objective>
Remove source-proven redundant observations within a single selected v15 child checkpoint inside EXISTING Phase265 Plan16, per D-01/D-02/D-05/D-22/D-25/D-27/D-28. This is a resource-neutral source repair, not a new numbered plan, a deadline cure, a failure attribution or a route authorization. Preserve the original Plan16 and resource-window supplement bytes.
</objective>
<execution_context>
@/Users/roryquinlan/.codex/gsd-core/workflows/execute-plan.md
@/Users/roryquinlan/.codex/gsd-core/templates/summary.md
</execution_context>
<context>
@AGENTS.md
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/debug/v15-diagnostic-system-failure.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-CONTEXT.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-PLAN.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V14-RESOURCE-WINDOW-PLAN-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V14-RESOURCE-WINDOW-SOURCE-REVIEW-v2.md
</context>

## Fixed evidence and budget

Functional base7250223f67620ccc274a3a2fc80d099718ea58ea; source root sha256:2d499dc06ae7a95b12c11c4d96a0ce8f0033e20fcaaf8a484b5279c86215059e/950; closed held HEAD790f5fe2621ced7fed6753caf635c01f75d75041. Current hold is RELEASED. ROOT73583 closed0, ordinary58084 closed1/refused, current1/cumulative37, system_failure/SUPERVISOR_FAILURE/606926ms/139invocations. Initiating throw UNKNOWN. Duplicate carry publication7008 was refused and its hold-refusal remains immutable, non-authorizing history. Neither completed hold nor pair closure implies acceptance. No old reader/authenticator is rerun.

All work, idle, planning, tests, review and cleanup charge the original continuous clock. Absolute stop2026-10-09T18:38:33Z; cap223171903ms; reserve1860000ms; original anchor1791455941097 plus FULL108000000ms floor. RAM3000000000 separately from scratch2000000000, retained12000000000, total15000000000, terminal1000000000; maximum300Matches; Match600000/guest1000/host5000/startup2500; oldspace768MiB and sampling250ms unchanged. No reset/refund/recredit/deletion or empirical performance/admission promise.

Discovery level0: existing TypeScript/Vitest/host observation patterns, no dependencies or installs. Source seams: correction checkpoint1540–1555; baseline assertLeanBaselinePrefixCapacity243–250; experiment assessLeanPrefixCapacity113–120; package checkpointLeanResources1751 onward. The actual Match helper invokes checkpoint before AND after native.invoke. Keep both calls. Existing package resource event publication re-observes and validates after append; do not reuse a pre-write ledger observation across that mutation.

<tasks>
<task type="auto" tdd="true">
<name>Task1: Compose fresh v15 observations once per child checkpoint</name>
<files>scripts/lib/v1-38-lean-checkpoint-observation-v15.ts, scripts/run-v1-38-lean-checkpoint-observation-v15.test.ts, scripts/run-v1-38-lean-correction.ts, scripts/run-v1-38-lean-baseline.ts</files>
<behavior>
RED: actual selected checkpoint composition invokes physical/time/parent-RSS/statfs observation once each, ledger admission once, available-memory and disk observation once; separate checkpoint calls invoke all again. A changing second call catches elapsed/reserve crossing, RSS/free-disk/memory deterioration, survivor growth/shrink/disappearance and ledger/allocation drift. On-disk allocation alteration during observation refuses at the post-observation identity/admission boundary as well as alteration before entry. These distinct identity reads are not deduplicated. Capture operands passed to the actual called prefix/correction/disk guards and assert every field equals the fresh observation plus exact projected bytes, not merely equal final decisions. Missing parent/IPC, malformed numeric observations and observation exceptions refuse. additionalBytes=0 and nonzero use identical projection in both aggregate-memory and scratch/total-disk guards. Existing guard predicates retain exact boundary and +1 behavior. Legacy call path retains its old observer behavior.
</behavior>
<action>
Per D-01/D-02/D-05/D-22/D-28 create a synchronous trusted-host composition helper with injected observation operations for inert tests, not a CLI or caller-supplied cached observation API. Each real selected checkpoint authenticates its allocation, asserts live parent ownership, freshly reads current/max child RSS and one parent RSS, one statfs, one current elapsed, one cumulative physical measurement, one admitted ledger state, one available-memory and one disk observation. Normalize only using existing strict safe-integer rules. Keep before/after parent assertions around observation and guards. Use the same measured operands for existing assessLeanPrefixCapacity, assertLeanCorrectionResources and independent scratch/retained/total-disk guards, preserving reserve arithmetic, charged count, live available-memory floor and additionalBytes projection. highWater remains monotone in the existing child closure; never use it instead of new observations. Pass actual allocation to both guard families. baseline may expose a narrowly named pure observed-prefix adapter that still calls assessLeanPrefixCapacity; its existing default observer and legacy callers remain unchanged. correction must select this composition only after authenticated v15 policy lookup and retain the old branch for all other modes. Do not remove guard predicates, source/HEAD/request dispatch holds, Match checkpoints, parent sampling, charge-time capacity, compaction/retention callbacks, package append/readLeanLedger validation or publication observations. No module/WeakMap/durable cache, memoized filesystem result, cross-callback token or asynchronous suspension inside a checkpoint. Test the exported actual composition selected by correction, not a disconnected model. If a necessary seam cannot safely be shared without crossing mutation, keep that observation fresh and record its count explicitly; safety parity has priority over a target count. Record separate RED/GREEN receipts and selected-call-chain table in the new source summary. No production timing or original-cause inference.
</action>
<verify><automated>node_modules/.bin/vitest run scripts/run-v1-38-lean-checkpoint-observation-v15.test.ts --testTimeout 30000</automated></verify>
<done>Fresh per-call composition is selected by real v15 correction checkpoints; counting/drift/cap/admission tests pass after recorded RED; allocation bytes are independently authenticated before and after observation without a cached ledger read crossing callbacks; every old guard remains reachable, and default/legacy behavior is unchanged.</done>
</task>

<task type="auto" tdd="true">
<name>Task2: Bind fresh source review and debit finite repair reports without granting a route</name>
<files>packages/strategy-lab/src/league/lean-experiment.ts, scripts/lib/v1-38-lean-resource-window-v15.ts, scripts/run-v1-38-lean-resource-window-v15.test.ts</files>
<behavior>
RED: exact fresh SOURCE-REVIEW-v3 is selected for new source; immutable v2 remains in the physical inventory and does not certify changed source. Every finite repair report grows measured debit; charged shrink/disappearance refuses. Source identity change alone still cannot authorize v15-3..5. Missing/forged immediate-prefix custody and missing own accepted diagnostic/FINAL still refuse. v15-2's refused result and hold-refusal never become accepted evidence.
</behavior>
<action>
Per D-01/D-02/D-05/D-22/D-25/D-27 change only the fresh selected source-review filename to265-16-POST-V14-RESOURCE-WINDOW-SOURCE-REVIEW-v3.md, preserving exact strict consumer semantics and immutable v1/v2. Extend existing finite physical report list with the exact seven new POST-V15-CHECKPOINT-REPAIR filenames listed below and SOURCE-REVIEW-v3; do not widen directory scans, wildcard/version selectors or exclude physical charges. Apply the existing narrowly enumerated cyclic source-output exclusion pattern only to new generated report outputs; include this repair plan as non-cyclic source. Preserve old selected audit/reader behavior and current v15 later-distinction refusal. Add portable selector/inventory growth/shrink/missing-source/custody refusal tests. Do not alter authenticateLeanResourceWindowPriorPairV15 to turn ended/refused v15-2 into closed accepted or merely remove the later route check. Summary explicitly separates completed overhead source repair from the independently checked historical-cost-only prospective contract still needed for v15-3. No helper, setup, continuation, attestation, authorization, allocation, prepare, provider, Match, audit or actual route is generated by either source task.
</action>
<verify><automated>node_modules/.bin/vitest run scripts/run-v1-38-lean-resource-window-v15.test.ts packages/strategy-lab/src/league/lean-resource-window-v15.test.ts --testTimeout 30000</automated></verify>
<done>New source requires its own exact independent v3 review; all named new outputs are debited, old outputs survive, and v15-3..5 remain deliberately fail-closed.</done>
</task>
</tasks>

## Serial ownership and exact outputs

ROOT finite scheduling amendment before execution: add exact POST-V15-CHECKPOINT-REPAIR-PLAN-CHECK-v2.md alongside immutable v1. Task2's named repair inventory therefore contains eight reports, not seven. No other version or glob is authorized. Independent v2 withdraws the mistaken v1 file-ownership finding; the selector file was already declared. All implementation, authority and budget predicates remain unchanged.

Task1 then Task2; same files must not be edited concurrently. ROOT owns dispatch and integration. Independent reviewer/ROOT validator/independent verifier own their reports, not the source executor. No STATE/ROADMAP/source commits by this planner. Executor follows ROOT's isolated source-commit protocol and releases its commands/providers/worktree holds at actual closure; never touches unrelated recovery sentinels.

Finite new phase-local reports (prefix265-16-POST-V15-CHECKPOINT-REPAIR-): PLAN-v1.md; PLAN-CHECK-v1.md; SOURCE-SUMMARY-v1.md; REVIEW-FIX-v1.md; SOURCE-REVIEW-v1.md; VALIDATION-v1.md; SOURCE-VERIFICATION-v1.md. Additionally exact265-16-POST-V14-RESOURCE-WINDOW-SOURCE-REVIEW-v3.md is the real strict consumer report. SOURCE-REVIEW-v1 is the checkpoint-scope review receipt; v3 must independently review the full selected changed source and carry actual current source/commit/actor fields, not copy v2 identity or declare clean prospectively. Any additional necessary fix/re-review version first receives a ROOT-scheduled exact inventory addition; no mutable report overwrite.

<verification>
Distinct source review inspects complete selected call chain from correction child through Match pre/post callbacks, prefix/correction/disk guards and resource-event publication. ROOT separately runs both focused commands, configured package typecheck, sh -n scripts/run-v1-38-lean-correction.sh and git diff --check; derive fresh finite manifest and exercise actual strict review consumer without old readers. Independent verifier checks fresh-call counts/drift, all guard reachability, allocation+ledger admission, projected memory/disk independence, unchanged parent sampler and append validation, finite report debit and fail-closed authority. Record exact command exit/status and close sessions; each focused command aims under60seconds. Inherited strict-six/private-fixture-four/monitor-five limitations remain NOTPASS unless independently resolved, not relabeled. No actual native timing, positive full accepted custody, runtime recovery or 36-cell fit is established by inert tests.
</verification>

## Prospective contract frontier remains gated, not human-only

Standing same-scope approval does not authenticate a successor by changed source identity. Before any v15-3 ROOT route, separately plan and independently check an exact prospective distinction tied to this real repaired call chain, fresh source and review, archived v15-2 finite RAW pins and full37-charge cost prefix. Its archived accepted=false/refused closure, ordinary58084 and the extra hold-refusal are non-authorizing historical cost facts, never a hold authenticator or accepted audit. A dedicated prospective custody contract must honestly account for an ended/refused prefix without changing old bytes/semantics. Missing new schema/producer/consumer joins are dependency/missing-contract constraints, not a demand for new human resource choices. No such contract is implemented or authorized by this supplement. It must close source review/ROOT validation/independent verification, then actual distinct DATA/HELPER reviews, fresh meaningful repair attestation, new committed immutable allocation, empty owned0700 store and SAMEPROCESS capacity gate before unique ROOT entry. Only that route's own accepted diagnostic+actual FINAL could permit its conditional baseline. v15-4/5 require their own concrete checked distinction and full immediate prefix, never a generic source diff. If time/reserve or custody is insufficient, report no-entry/inconclusive and close; no retry/refund or new-resource investigation request.

Finite host-failure attribution is excluded from this bounded overhead repair: the initiating throw remains UNKNOWN. A safe producer-wired finite attribution change would be a separate checked source contract; source counters must not fabricate old failure cause.

<threat_model>
## Trust boundaries and STRIDE
| ID | Category | Boundary/component | Severity | Disposition | Mitigation |
|---|---|---|---|---|---|
| T-265-CP1 | Tampering | observation to guard | high | mitigate | Synchronous call-local fresh observer; allocation/ledger admission; exact predicates and drift fixtures. |
| T-265-CP2 | Denial of service | resource projection | high | mitigate | Both live parent assertions, current/max RSS, additional-byte projection and independent disk/time/reserve guards; sampler unchanged. |
| T-265-CP3 | Repudiation | history to successor | high | mitigate | Preserve37charges/refusal/operator error, no retrocredit; all later authority checks unchanged. |
| T-265-CP4 | Elevation of privilege | source fix to ROOT entry | high | mitigate | No executor empirical authority; prospective contract and actual gates remain required. |
| T-265-CP5 | Information disclosure | diagnostics/report | high | mitigate | Inert private metadata only; no source/memory/objective payloads or sealed/formation material. |
| T-265-SC | Supply-chain tampering | dependencies | low | accept | No installs or new dependencies. |
</threat_model>

## Multi-source coverage audit: supplement, not phase certification

| Source | Item | Coverage | Status |
|---|---|---|---|
| GOAL | Current-rules empirical league/evidence goal | Existing265-16 unchanged; Task1/2 narrow resource prerequisite | COVERED, not achieved |
| REQ | LEAG-01/02/03/04/05/07 | Existing265-16 scientific outputs preserved; both tasks preserve guard/custody prerequisites | COVERED, no new completion credit |
| REQ | LEAG-06/08 deferred certification;09 superseded zero-channel round | Existing approved dispositions unchanged | COVERED |
| RESEARCH | Diagnosed duplicated checkpoint observations/unmeasured durations | Task1 fresh coherent observations and actual counting/drift tests | COVERED |
| RESEARCH | Attribution loss/unknown original throw | Evidence and explicit unknown/excluded attribution boundary | COVERED |
| RESEARCH | All limits/history/gates/no old reader | Both tasks and verification/prospective frontier | COVERED |
| CONTEXT | D-01/02/05/22/25/27/28 | Both task actions reference and enforce immutable fail-closed charged resource/privacy boundaries | COVERED |
| CONTEXT | D-03/04/06–21/23/24/26 | Existing265-16 unchanged; no matrix/solver/training/portfolio/freeze/seal/rule changes; deferred ideas not implemented | COVERED by existing plan |

<success_criteria>Measured redundant observation count is reduced within a single fresh selected checkpoint with guard/admission parity proven by inert tests and independent gates. Source-only outcome and unknown cause/performance are explicit. No successor route, accepted evidence, baseline/LEAG/phase/freeze/formation/holdout/public/counting/production credit follows.</success_criteria>
<output>Create only the named fresh source-summary/review/fix/validation/verification reports under ROOT scheduling; all existing reports and consumed bytes stay immutable. Close all actual commands and release source-only holds before returning. No experimental route or new numbered plan.</output>
