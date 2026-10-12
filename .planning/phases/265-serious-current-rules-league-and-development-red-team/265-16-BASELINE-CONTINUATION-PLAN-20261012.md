---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16
type: execute
supplement: baseline-continuation-20261012
wave: 1
depends_on: [265-15]
autonomous: true
requirements: [LEAG-01, LEAG-02, LEAG-03, LEAG-04, LEAG-05, LEAG-07]
requirements_completed: []
files_modified:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/lib/v1-38-lean-baseline-continuation.ts
  - scripts/lib/v1-38-lean-baseline-continuation.test.ts
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/lib/v1-38-lean-baseline-authority.test.ts
  - scripts/lib/v1-38-lean-baseline-match.ts
  - scripts/lib/v1-38-lean-baseline-match.test.ts
  - scripts/run-v1-38-lean-baseline.ts
  - scripts/lib/v1-38-lean-baseline-pipeline.ts
  - scripts/lib/v1-38-lean-baseline-source.ts
  - scripts/lib/v1-38-lean-baseline-pipeline.test.ts
  - scripts/lib/v1-38-lean-baseline-retained.ts
  - scripts/lib/v1-38-lean-baseline-retained.test.ts
  - scripts/run-v1-38-lean-baseline.test.ts
  - scripts/lib/v1-38-lean-container-match-session.ts
---

# Plan 265-16 supplement: fresh current-rules baseline continuation

Status: prospective, requires independent plan check; no execution evidence. Generic planner fallback, not a new numbered plan, typed GSD dispatch, workstream, diagnostic, or runtime. Supplements `265-16-PLAN.md` under `265-16-BASELINE-CONTINUATION-APPROVAL-20261012.md`, its RESEARCH, the active `LEAN-REMAINING-PLAN-20261003.md`, and latest STATE. This author owns only this file; source ownership below is for subsequent execution. Other authors' edits must be preserved.

## Objective, requirements and fixed decisions

Complete the original Plan 16 exploratory goal: genuinely cold current training, one measured response attempt, complete small matrices/probes/repeats, independently verified evidence and qualified Phase 266 input. A terminal honest partial is acceptable evidence, not goal completion. No earlier incomplete outcomes, selected sources, fitness, learned corpus or reuse grant enters this baseline.

Requirements: LEAG-01/02/03/04/05/07 remain pending until their actual small-scope evidence verifies; LEAG-06 remains `deferred_original_diversity_gate`; LEAG-08 remains `deferred_original_robust_finalist_gate`; LEAG-09 is `superseded_by_fixed_single_automated_round`. No original full-league credit. Missing formation metrics remain missing; baseline completion is neither formation acceptance nor Phase 266 freeze.

| Binding | Exact prospective value |
|---|---|
| Window | 2026-10-12 00:08:08–08:08:08 UTC; anchor 1791763688000, deadline 1791792488000 ms |
| Continuous time | carry 415746903 ms; cumulative ceiling 444546903 ms; current elapsed = carry + real time since anchor, conservatively reconciled with monotonic intervals |
| Charges | Carry all 43; exactly 36 newly scheduled cells, cumulative 79 only if all execute; ceiling 300 grants no extra cells |
| Storage/RAM | 15,000,000,000 B total; 12,000,000,000 retained; 2,000,000,000 scratch/buffers; 1,000,000,000 terminal reserve; RAM 3,000,000,000 B |
| Runtime | guest 1000 / startup 2500 / host receipt 5000 / Match 600000 ms; all other existing runtime, invocation, source, memory and semantic bounds unchanged |
| Closure | 1,860,000 ms reserved for cleanup, terminal publication and ordinary retained verification |
| Cold work | Two initial mechanisms, one 128-node response attempt; allocated channel vector 64+64+64+128=320; beam 4 and existing lexical/search-space rules |
| Schedule | 0–7 initial training; 8–11 initial matrix; 12–19 response training; 20–27 response pairings; 28–31 probe; 32–35 exact repeats; four separately enumerated holdout reservations remain unopened |

Every research, planning, source, gate, wait, idle, preparation, execution and reader interval counts. No old ceiling, failure, byte, charge, schema, reader outcome or consumed allocation changes. Model/human/external candidate authoring remains zero. Common nonlearned opponent construction keeps its separately declared maximum 64 nodes once/zero Matches, charged to shared time; replay review remains at most ten minutes for this arm. Smoke's canonical identity and four side/initiative conditions stay fixed; no extra self-play, validation Matches, replacements or post-outcome tier selection.

## Source findings and smallest additive route

Inspected concrete seams:

- `createLeanCurrentBaselineAllocation`, `admitLeanAllocation`, `leanCapsForAllocation`, `leanWritablePaths`, `chargeLeanSlot`, `currentLeanElapsedMs` in `packages/strategy-lab/src/league/lean-experiment.ts`: reuse ledger machinery through a distinct authenticated allocation discriminator; do not copy the old nine-charge predecessor.
- `executeLeanCurrentPipeline` in `scripts/lib/v1-38-lean-baseline-pipeline.ts` already sequences all 36 cells, freezes opponents before entrants and produces legal observations. Its fresh path omits `trainLeanResponse`'s receipt callback and stops on `weak_preserved`; add an explicit prospective export with unchanged old defaults. Do not call correction/reuse pipelines.
- `runLeanBaselineMatch` / private `composeLeanNativeMatch` already share canonical scenario, supervision, metrics, replay and capped legal-input capture. `issueLeanBaselineRuntimeAuthority` lacks the new carry/V8 path; `claimLeanStartupAuthorityV8` already guards ordered factory→planner→session claims. Add a distinct issuer and guard map, preserving existing grant ABI and native implementation.
- `runLeanBoundedParent` already owns fork/release/monitor/terminal cleanup; reuse it. `readLeanPrivateMatchGitV3` in the existing session owner lacks package-source metadata access; add one exact-path continuation metadata export there. No new process launcher, sandbox, engine or runtime.
- `auditLeanCurrentBaselineRetained` hardcodes nine charges/3305606 ms and legacy schemas. Add a distinct ordinary reader with shared pure reconstruction helpers; never manufacture an accepted old check. `analyseLeanResponseAdmission` remains unchanged and false where strongest-pure fresh self-comparison is unsupported.

## Tasks and ownership

Four serial tasks, dependencies A→B→C→D. There is no useful disjoint parallel execution here: B consumes A's admitted allocation; C consumes B's fresh-source issuer; D must verify C's final persistence/schema. Each task owns at most four source/test paths, **15 unique source/test paths total**. Existing shared-file edits are additive and prospective-only. No other source allowance is implicit.

### A — Strict allocation, bounded 43-charge custody and resource admission

Files (3):

1. `packages/strategy-lab/src/league/lean-experiment.ts`
2. `scripts/lib/v1-38-lean-baseline-continuation.ts` (new)
3. `scripts/lib/v1-38-lean-baseline-continuation.test.ts` (new)

Exports: `LeanBaselineContinuationAllocation`, `createLeanBaselineContinuationAllocation`, `validateLeanBaselineContinuationAllocation` in the ledger module; `authenticateLeanBaselineContinuationCarry`, `assertLeanBaselineContinuationFrontier`, `LEAN_BASELINE_CONTINUATION_PATHS` in the new helper. New discriminator `lean-baseline-continuation-allocation-v1`; no reuse/accepted-diagnostic fields. Add only exact-discriminator branches for admission, writable paths, caps, memory and continuous time. Retain existing slot/root/ledger APIs; do not impersonate a correction version or broaden old predecessor validators.

Bind custody to the canonical `.planning/artifacts/v1.38-phase-265-private-match-allocation-v3.json`, its identical store allocation at `.strategy-lab/lean-private-matches-v3/<allocation-root-hex>/allocation.json`, its committed blob and sole direct parent `sourceHead`. Join that allocation's eight canonical store files: allocation, entry, ledger, pair-0, debit-0, terminal-0, replay-0 and result. Require cumulative 43, exactly ordinal 0, exact debit→pair→terminal→result roots and source/commit joins. The latest STATE's `0de65621` result / `d781a925` terminal and raw `4cd7de06` / `ca88dfa3` are identification hints, NEVER accepted short hashes. Extract full roots/digests from those exact bounded canonical records and freeze them in the checked carry before allocation; no caller-selected predecessor or directory search.

Bind the bounded predecessor chain to `LEAN_PRIVATE_MATCH_CARRY_V3` and its exact source anchors: allocation `sha256:8ddf0092116ac00397e500ddf897ee14f2038256e7e064f97053859c7cb47f6a`, result `sha256:b7a87f9a24a6b3918b45e5c424ce345fba4fafea15f502e73b81331258d67ac8`, commit `30d61b7df02f594f4fda226bffcaeb101cae64dc`, failed reader `sha256:ba61aeb6128c3db230738157d70cfdd261b3d77de7dd87005a04275a7acedec0`; also bind its prior carry/probe/cost roots through existing pure validators and exact bounded custody records. These anchors cover the 42-charge predecessor; the canonical V3 debit supplies charge 43. Keep the failed and qualified private V3 reader outcomes as immutable cost-only custody, never accepted-check authority. Use bounded metadata/streaming hashes, not historical Match/Chronicle decoding or retained-reader reruns. Do not invoke recursive historical materialization through an old authenticator or reconstruct historical source trees/streams.

Inventory surviving canonical/source/planning/private/scratch files and directory blocks with exact identities, no symlink/hardlink aliases, duplicate debits or deletion to fit. Historical peaks stay `unknown`. Snapshot full source/planning manifest, request, checked gates and survivor root; reject omitted survivors or altered prefixes. Cache only authenticated immutable identity inside this process; live prefix/resource checks remain fresh.

RED→GREEN command: `pnpm exec vitest run scripts/lib/v1-38-lean-baseline-continuation.test.ts`.

Acceptance: fixtures reject 42/44 carry, old or forged roots, non-direct-parent commit, qualified-as-accepted reader, uncounted files, time rollback, replayed capacity, missing holdout reservations and 37th cell. Test pre/post-authentication deadline crossing and all resource frontiers without provider/Match work. Ledger test proves 43+n charges, continuous carry (no idle gaps/refunds), immutable old caps and unique consumed admission after failure.

### B — Fresh-source V8 issuer and shared composer

Files (4):

1. `scripts/lib/v1-38-lean-experiment-authority.ts`
2. `scripts/lib/v1-38-lean-baseline-authority.test.ts`
3. `scripts/lib/v1-38-lean-baseline-match.ts`
4. `scripts/lib/v1-38-lean-baseline-match.test.ts`

Exports: `issueLeanBaselineContinuationRuntimeAuthority` and `runLeanBaselineContinuationMatch`. Authenticate the exact admitted allocation, active debit, immutable pair and ledger byte prefix, both freshly published source snapshots, factory validation, source/executable/runtime/tuple/image/harness roots, seat and ownership. Only sources from this cold procedure/current implementation are eligible. Issue the existing opaque V8 grant into existing issuance maps; register a separate continuation construction guard consulted by `claimLeanStartupAuthorityV8`. Validate before and after costly source authentication/compilation; guard each factory/planner/session claim and never refund a spent seat.

Extend the existing composer through a private authenticated continuation branch, retaining the ordinary baseline's `observedRole`, at most 16 brain and 16 strategy inputs per training cell, actual outcomes/decision roots/metrics/replay, canonical board bounds and all four conditions. Reuse `createFactorySupervisedRuntime` and unchanged native V8 supervisor/session/harness. No fixed two-source private V3 admission, diagnostic requirement or new runtime backend. Cleanup and classified failures use existing host ownership.

RED→GREEN command: `pnpm exec vitest run scripts/lib/v1-38-lean-baseline-authority.test.ts scripts/lib/v1-38-lean-baseline-match.test.ts`.

Acceptance: spoofed serialized handles, reused seats, cross-charge/source/pair/request bindings, missing observations, unavailable memory and deadline crossed during authentication fail before construction. Factory→planner→session guard-order tests use inert seams, verify no provider after rejection, and retain charge/cleanup on exceptions. Existing legacy V3 and correction tests preserve old results/defaults. Training observations come only from verified legal-input evidence; canonical starting Soldiers/terrain remain in bounds.

### C — Fresh pipeline, entry and bounded persistence

Files (4):

1. `scripts/run-v1-38-lean-baseline.ts`
2. `scripts/lib/v1-38-lean-baseline-pipeline.ts`
3. `scripts/lib/v1-38-lean-baseline-source.ts`
4. `scripts/lib/v1-38-lean-baseline-pipeline.test.ts`

Exports: `prepareLeanBaselineContinuation`, `runLeanBaselineContinuation`, `runLeanBaselineContinuationChild`, `leanBaselineContinuationSourceManifest` (entry); `executeLeanBaselineContinuationPipeline` (pipeline); `publishLeanBaselineContinuationSource` (publication). Parser adds exact `prepare-continuation`, `run-continuation`, `verify-continuation` modes with `--request`; hidden `child-continuation` retains one-use parent release. Existing CLI and pipeline defaults stay unchanged. Reuse `runLeanBoundedParent`, passing the real continuation reserve and before-release guard; no alternate launcher or source/path override flag.

New pipeline export takes only A's authenticated allocation and fresh dispatch. Reuse shared cold implementation: two initial mechanisms, fresh corpus/proposals, immutable opponent/probe before output, initial selection before matrix, one fresh response trained on scheduled eight rows. Always retain actual `response-node-receipts.json` via the existing callback. Add `work-accounting.json`: allocated vector remains 320; receipt-derived actual visited counts and unused opportunities are separate fields. Require response allocations sum 128, actualNodes≤allocation per receipt, sum actualNodes=`actualAssignmentNodes`, unused=128−actual; eight receipt roots are not 128 expansions. Preserve old training manifest semantics, no padding search or raised cap. Other channels' realized work must be backed by retained inputs/teacher receipts/examples, not inferred from allocation.

Only this new branch allows legal `weak_preserved`/scientifically unaccepted response through all eight already scheduled pairings. Invalid, clone, privacy/legal/runtime/system or cleanup failure terminates honestly and enumerates unattempted slots. Preserve initial two-candidate analysis separately from the complete three-source diagnostic graph. Keep `analyseLeanResponseAdmission` unchanged: unsupported strongest-pure self-comparator means `admitted:false`, no floor substitution/extra self-play/threshold change. Ineligible response cannot become the selected pure. Complete four probes and four exact repeats; repeat seed mapping remains `leanBaselineMatchSeed`. Shared planner probe is explicitly not independent strength evidence.

Publication joins allocation/sourceHead/current held HEAD/source/cold/role/snapshot roots without weakening old source-publication schema guards. Guard and size-check before serialization/writes and after expensive work. Retain deterministic proposals, selections, full bounded legal observations, response receipts/work, matrices/distributions, source publications, all charged terminals, failures, explicit unused slots and resources. Compact result references private artifacts. Missing evacuation/reserve/push-cause/entropy/formation classifiers stay unfilled and `formationComparison:inconclusive`.

RED→GREEN command: `pnpm exec vitest run scripts/lib/v1-38-lean-baseline-pipeline.test.ts`.

Acceptance: inert 36-cell dispatch proves exact order/conditions/denominators, cold-only inputs, legal weak response completes scheduled evaluation, invalid/clone/system fault stops without replacement, real receipt underuse is preserved, repeat mismatch refuses completion and all four holdouts stay reserved. Old fresh/reuse tests retain their old rejection behavior. Tests exercise low-score and positive-score responses while positive admission remains unsupported.

### D — Ordinary reader, narrow metadata allowance, complete route gates

Files (4):

1. `scripts/lib/v1-38-lean-baseline-retained.ts`
2. `scripts/lib/v1-38-lean-baseline-retained.test.ts`
3. `scripts/run-v1-38-lean-baseline.test.ts`
4. `scripts/lib/v1-38-lean-container-match-session.ts`

Exports: `auditLeanBaselineContinuationRetained`, `verifyLeanBaselineContinuationRetained` (reader), `readLeanBaselineContinuationGit` (existing metadata/process owner). The metadata API accepts only fixed continuation allocation/request/gate/source/planning manifest paths, exact HEAD/direct-parent/committed-blob operations and bounded outputs/timeouts; no arbitrary program/shell/ref/path, new spawn site or widening of V1/V2/V3 predicates. Add package-source paths only through the exact new manifest. Source allowance changes in A/C/D are limited to these 15 owned paths, their actual transitive existing dependencies and the exact planning inputs; no directory-wide exemption. Keep all old source allowlists immutable.

Reader is a new ordinary same-window admission, independent of source author and ROOT run operator. It reconstructs actual allocation/commit/held HEAD/request/manifest, 43+n carry, every pair/prefix/debit/terminal/observation/publication, corpus/proposals/selections, actual receipt work and 4+8 matrix cells, solver distributions, probe and four semantic repeats. Factor pure legacy reconstruction helpers only if legacy admission stays exact. Do not feed 43 into the old nine-charge reader or relabel the private V3 check. Missing/duplicate/conflicting cells, mutated pinned planning bytes, forged work counts, failed cleanup or missing source evidence yield `gaps_found`; genuine partial results retain every unused slot. Reader does not dispatch runtime/provider/Strategy/Match, create sources or open holdout.

RED→GREEN command: `pnpm exec vitest run scripts/lib/v1-38-lean-baseline-retained.test.ts scripts/run-v1-38-lean-baseline.test.ts`.

Acceptance: negative fixtures tamper each root edge, remove receipts, claim 320 actual work from grants, insert a 37th cell, promote unaccepted response, mutate STATE after terminal, replay reader admission, oversize metadata/replay, and cross deadline mid-read. One-use retained admission is consumed on failure; no second ordinary reader. Test metadata exact argv/path bounds and IPC-free loader selection without launching an empirical process. Require closed runtime/reader ownership before source hold release.

## Artifacts, limits and evidence resources

Exact new route paths (no creation by this planning task):

- Request: `.strategy-lab/lean-baseline-continuation-request-20261012-v1.json`.
- Allocation: `.planning/artifacts/v1.38-lean-baseline-continuation-allocation-20261012-v1.json`.
- Store: `.strategy-lab/lean-baseline-continuation-20261012-v1`; scratch: the same path plus `-tmp`. Real owner-only 0700 directories, fresh/exclusive; regular single-link 0600 records, committed allocation 0644.
- Store files: `allocation.json`, `carry.json`, `source-manifest.json`, `ledger.ndjson`, existing time/entry/child-terminal filenames, `pair-<0..35>.json`, `observation-<0..35>.json`, existing source/publication/replay filenames, pipeline artifacts listed in C, `result.json`, `retained-check.json`. Holdout reservations live in allocation/result, no holdout materialization.
- One planning gate record: `265-16-BASELINE-CONTINUATION-GATES-20261012.md` in this phase directory, separate identified plan-check, source-review/fix, ROOT validation and distinct source-verification sections. Record actual local CLI thread/session identities where typed dispatch is unavailable; no fabricated /root roles, signature or external custody prerequisite. Finish and pin it before allocation/entry. No per-edge proof carriers.
- After terminal **and** unique check/hold release, update the existing `265-LEAN-BASELINE-RESULT.md` and `265-16-SUMMARY.md` with exact roots, dispositions and original-goal qualification. No planning progress edits during hold.

Prospective metadata limits: request 64 KiB; allocation 256 KiB (shared parent committed-blob bound); carry/source manifest each 4 MiB; ≤4096 inventory rows and ≤1024 pinned manifest rows; pair/publication/entry each 16 KiB; source text 64 KiB and source snapshot 256 KiB; each legal observation/training/receipt/proposal artifact ≤8 MiB; result/check each ≤4 MiB; ledger ≤4 MiB. Existing tighter per-artifact limits win. Stream hashing/copying in ≤64 KiB chunks; never load entire historical inventory content. Replay retains existing 256,000,000-byte maximum, compressed/uncompressed checks and preselected/failure policy; account serialization/decompression buffers before allocation. One cell at a time; release heavy decoded material between cells. These are denial limits, not promises of admission or new storage allowances. Oversize means terminal refusal, never truncation/padding/ignored evidence.

## Admission, timeline and execution gates

1. Dependency: approval+research+this checked supplement; original Plan 15 frozen reduced-tier evidence and metadata custody remain prerequisites. No fresh diagnostic is needed. Independent generic plan checker then one bounded implementation/review-fix cycle, ROOT tests/types/privacy boundaries, and a distinct source verifier. Do not prepare on fixture success or a qualified old reader.
2. Target **source-gate-ready 01:20 UTC**. At maximum durations 36×600000+1860000=23,460,000 ms (6h31m), so **01:37:08 UTC minus measured remaining offline/admission/publication overhead is the latest full-schedule entry**. Existing frozen conservative pilot forecast is also checked; the stronger applicable admission bound wins. A single 111-second private Match is not a schedule forecast. Do not recalculate tier from comparative outcomes. If whole-schedule admission fails, stop `feasibility_not_established` without charging; do not use the isolated-next-Match frontier 07:27:08 as whole-run permission.
3. Before and after carry/source/request/commit authentication, before release, before each charge, before both issuances and at each factory/planner/session claim: bind current HEAD, all pinned source **and planning** files, request/allocation roots and exact ledger prefix; require same-process fresh free disk/available memory/RSS/arrayBuffers, process liveness, cumulative charges/time and scratch/physical retained usage. Initially reserve all 36 maximum Match durations plus closure and bounded offline overhead; thereafter reserve all unattempted scheduled durations plus remaining overhead/closure. Never discount future slots using observed speed. Maintain a per-charge minimum of next600000+1860000 ms as well. Repeat guards after expensive authentication; failed seats/charges remain spent.
4. Count parent+child+native buffers/heaps/serialization reserves within 3GB; free space must cover the remaining approved envelope, not merely the next file. Reconcile survivor blocks without double counting. Recheck after publication and terminalization. Actual observation uncertainty, unknown available capacity or host loss denies admission. No competing heavy workload during run/check.
5. Prepare one fresh allocation/store only after all gates close; commit exact allocation with held implementation as direct parent before unique ROOT entry. Reauthenticate at real admission. Separate executable implementation root from the raw planning-prefix root: GATES may name the former, and the allocation binds both. Bind the allocation commit/root separately, avoiding allocation/gate self-hashing cycles. Freeze every source/test/planning file and HEAD until terminal and unique retained check close; no STATE/GATES/PLAN/source edits, new planning files or commit during hold. The retained check writes only its predeclared private store output during this hold.
6. Unique ROOT run; one independent ordinary reader after terminal, **inside the same window**, with fresh resources and remaining closure budget. Pin source/test/planning files through that reader, including this supplement and approval/research. Failed reader remains failed; no retrospective clock override or automatic correction route. After authenticated closure release hold, then report. Reader/output author must be distinct from source author and run operator; plan/source review and distinct verification identities are recorded in GATES, not fabricated by ROOT.

IPC-free CLI launch means `node --import tsx`, avoiding the `tsx` CLI IPC listener. The existing authenticated parent-child IPC release and native transport remain unchanged. From repo root, after 0700 scratch setup and gates, use this exact shell preamble once per permitted command:

```sh
umask 077
ulimit -c 0
unset NODE_OPTIONS NODE_COMPILE_CACHE NODE_REDIRECT_WARNINGS NODE_V8_COVERAGE
export TSX_DISABLE_CACHE=1 NODE_DISABLE_COMPILE_CACHE=1
export TMPDIR="$PWD/.strategy-lab/lean-baseline-continuation-20261012-v1-tmp"
node --max-old-space-size=768 --import tsx scripts/run-v1-38-lean-baseline.ts prepare-continuation --request .strategy-lab/lean-baseline-continuation-request-20261012-v1.json
# Commit and independently authenticate the exact allocation before the next command.
node --max-old-space-size=768 --import tsx scripts/run-v1-38-lean-baseline.ts run-continuation --request .strategy-lab/lean-baseline-continuation-request-20261012-v1.json
# Only after terminal, by the distinct ordinary reader, within the same window:
node --max-old-space-size=768 --import tsx scripts/run-v1-38-lean-baseline.ts verify-continuation --request .strategy-lab/lean-baseline-continuation-request-20261012-v1.json
```

## Review validation, coverage and must_haves

Each task starts with failing focused inert tests, implements the smallest seam, then reruns its command. Final focused suite is the six task test files plus unchanged `packages/strategy-lab/src/league/lean-training.test.ts`, `scripts/lib/v1-38-lean-baseline-analysis.test.ts` and `scripts/lib/v1-38-lean-baseline-source.test.ts`. No empirical Match test or expanded ceremony. ROOT also runs:

```sh
./node_modules/.bin/tsc -b packages/strategy-lab/tsconfig.json packages/runtime-js/tsconfig.json --pretty false
./node_modules/.bin/tsc --ignoreConfig --noEmit --types node --strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes --skipLibCheck --target ES2022 --module NodeNext --moduleResolution NodeNext --pretty false scripts/run-v1-38-lean-baseline.ts scripts/lib/v1-38-lean-baseline-continuation.ts scripts/lib/v1-38-lean-baseline-pipeline.ts scripts/lib/v1-38-lean-baseline-retained.ts scripts/lib/v1-38-lean-experiment-authority.ts scripts/lib/v1-38-lean-baseline-match.ts scripts/lib/v1-38-lean-baseline-source.ts scripts/lib/v1-38-lean-container-match-session.ts packages/strategy-lab/src/league/lean-experiment.ts
pnpm boundary:imports
pnpm public-discovery:check
git diff --check
```

The prior seven-path strict command had13 inherited diagnostics; that is historical evidence, not an assumed count for this different scope. Before edits record this actual strict command's complete diagnostic identities/locations and exit status in GATES (omit only the not-yet-created helper in the before command); compare unchanged-code diagnostics after edits with explicit line-shift mapping and allow zero NEW diagnostics. A differing pre-existing count must be reconciled against actual evidence, not silently relabelled13 or waived. Configured build excludes some scripts and cannot replace this strict gate. Include owned test paths in final strict validation with their separately captured pre-edit identities where needed. No new import/runtime/public boundary allowance merely to make a scanner pass. Distinct source verifier checks final exact diff, gates, old defaults,15-path ownership and executable route; all review/validation processes must be closed before admission.

| Coverage / must_haves | Files/tasks and key_links | Acceptance/claim boundary |
|---|---|---|
| D-22/23/25/28; cost, identity and bounded capacity | A allocation→43-charge carry→ledger; D existing host metadata→committed source | Exact continuous carry, whole-schedule admission, immutable consumed bytes, resources measured not asserted |
| D-24; LEAG-01/02/03 | B source→factory→V8 claims; C corpus→proposals→8 initial cells→4 matrix | Two real cold mechanisms, canonical legal inputs; no inherited learned sources |
| LEAG-04/05; one response | C eight response-training cells→receipts→eight fixed pairings→analysis | 128 allocated opportunities / actual visits / unused separate; legal weak findings retained, invalid/clone/system stops; admitted false when unsupported |
| LEAG-07; D-26/27 | C initial/final snapshots→pure eligible portfolio→four probes/four repeats; D reconstruction | 12 distinct-pair matrix cells; training/probe/repeats excluded from main denominator; no robust pure claim |
| Evidence integrity and original Plan16 output | D reader→actual result→post-hold existing result/SUMMARY→Phase266 dependency | Complete verified baseline or honest partial; no freeze/formation/holdout/public/counting/production authority |

must_haves: exact 36-cell schedule and four untouched reservations; immutable fresh source publications and legal observations; actual training/work receipts; complete compatible solver inputs or explicit unsupported result; all attempts/charges/failures/unused slots; cleanup and source/HEAD hold through unique ordinary verification; missing metrics unfilled; retained reader distinguishes scientific rejection from process failure. key_links above must be tested at both accepted and denied boundaries, not only shape-checked.

| Threat | Required mitigation / review test |
|---|---|
| Spoofed private V3 success or historical cost reset | A exact canonical custody/direct-parent/root joins; old failed and qualified outcomes stay cost-only |
| TOCTOU/source drift or spent-seat reuse | A/B/C pre/post authentication, each claim guard, one-use handles and full source/planning/HEAD hold |
| Resource exhaustion/late start/evidence explosion | Whole-schedule forecast, per-charge reserve, bounded streams/artifacts, live RAM/disk, denial on uncertainty; closure reserve protected |
| Scientific overclaim or hidden-state leak | C/D actual receipts, legal-input provenance, unaccepted response eligibility false, no invented comparator/metrics/independence or old certification |
| Replay/reader tampering, runtime failure scored as loss | D complete joins/semantic repeats and failure classification; retain partial/unused, no rerun/refund |
| Scope creep through metadata or source allowance | D fixed path/argv API in existing host owner; no engine/runtime/sandbox/launcher/package changes |

Terminal stops: invalid/clone candidate, system/runtime/legal/privacy failure, missing/conflicting evidence, solver incompatibility, repeat mismatch, changed held file/HEAD/request, missing process ownership, exhausted frontier/cap, unsafe capacity or failed reader. Preserve failure and unused slots. Legal scientifically weak evidence alone is not a process stop. No formation, holdout opening, new diagnostic, extra Match, threshold change or automatic retry follows any stop.

After actual successful retained verification, qualify Plan16 against every active criterion and report measured weaknesses, unsupported response admission, missing telemetry and remaining budget. Only then may Phase266 plan its own current-baseline freeze/absence checks; original LEAG-06/08 and formation acceptance stay non-green. Partial/inconclusive terminal accounting is useful but must not be called completed baseline.

Planning author closure: read-only source inspection and this apply_patch only; no tests, runtime, Match, preparation, reader, commit, agents or installation performed. `commands_closed: true` for this planning turn; no background process was started. Future implementation/gate/run commands above are instructions, not claimed results.

## Prospective v2 repair after refused v1 preparation (2026-10-12)

The ONE v1 preparation24138 closed1/detailswithheld before allocation/store creation; its request and empty0700scratch remain untouched. Generic terminal-only check87283 closed INCOMPLETE because its read-only sandbox denied process inspection; ROOT separately observed closed tool session, absent allocation/store, empty scratch, clean pinned diff and no matching live entry/reader. No actual run/head/ordinary reader exists; no empirical credit. Both owners closed, source hold released for this prospective repair; the incomplete check is not relabelled.

Bounded read-only source diagnosis31991 stopped committed-source authentication after93rows; 70190 identified the next committed fixture `packages/golden/src/fixtures/v1-37-conformance-traces/v1.37-observation-trace-v4/traces.bundle.json`,14706663bytes, above the unchanged4194304byte metadata-output ceiling. This establishes a source authentication incompatibility, not a recovered original error message. Do not omit that fixture, enlarge the bound, materialize its committed blob, or rerun old prepare.

Two serial source-repair tasks, still within the original15paths: (1) change ONLY the prospective path constants in `packages/strategy-lab/src/league/lean-experiment.ts` from20261012-v1 to20261012-v2; old request/scratch and reviewed source commits remain history. Schema-v1 structure and every policy/budget unchanged. (2) four files only: `scripts/lib/v1-38-lean-baseline-continuation.ts`, its test, `scripts/lib/v1-38-lean-container-match-session.ts`, `scripts/run-v1-38-lean-baseline.ts`. Add guarded descriptor-checked64KiB-chunk authentication for large committed pinned source: compare streamed current rawSHA256 with the manifest and streamed Git blob SHA1(identity header+bytes) with bounded128byte `git rev-parse <exact40hex>:<exactpinnedpath>` output. This uses existing Git metadata execution site, not a new launcher; reject arbitrary refs/paths/secret/preimage, uncertain reads, changed descriptors, invalid OID, oversize output and any mismatch. Preserve every pinned file and old metadata predicates. No buffer/scope/fixture exemption or runtime/rules change. Use this bounded helper at BOTH prepare and open-context committed-source joins. Tests cover >4MiB source without large Git output, mismatched OID/rawroot and changed file/ref rejection. Source-only fixtures, no actual old prepare/custody/reader/provider.

Independent checked-plan review BEFORE edits; source execution→independent code re-review→ROOT affected tests/strict comparisons/boundary→distinct source verification. Then update the single GATES/STATE, commit/push fixed source; fresh v2 request/scratch/allocation/direct-child commit and unique ROOT entry only if full maximum schedule still fits BEFORE01:27:08UTC with600000ms offline allowance. All v1 artifacts/failed outcomes remain immutable; no retry/reuse/refund/recredit. No late entry or timebox extension follows from this repair. If frontier is missed, complete safe source work and report an honest new work-time checkpoint; do not reset the00:08:08 anchor or08:08:08 deadline.

TaskA corrections completed without scope/budget expansion: exact0600 legacy private snapshot read; two exact already-debited historical debug identities in authenticatedCostPaths only. Old bytes and general source/debug restrictions unchanged. Independent reviews, ROOT15tests/exact8/13 inherited diagnostics and distinct final verifier closed over8d618bfd; first full bounded read-only43-charge cost authentication passes. These are source/cost checks, not a run or completed baseline.

01:27:08 was missed. No late entry. The earlier unapproved30minute proposal is superseded/insufficient. Pending genuine human choice: fresh eight-hour remaining-baseline window from next explicit approval, same36cells+4unopened reservations/15GB/300/allotherbounds. If approved, keep every prior time/cost: newCarry=415746903+(newAnchor-1791763688000), newCap=newCarry+28800000, newDeadline=newAnchor+28800000; maximum schedule plusclosure/offline unchanged. Only numeric prospective window/carry fields and their affected tests/docs may change within the existing owned paths, with independent narrow review, ROOT validation and distinct source verification before fresh source commit/request/preparation. No new numbered plan or repeated route literal, no old artifact mutation/refund/reuse. This proposal is NOT approved/applied by this document; actual old bounds remain enforced. Complete baseline/evidence and dependency-order freeze/formation work still require real future execution.
