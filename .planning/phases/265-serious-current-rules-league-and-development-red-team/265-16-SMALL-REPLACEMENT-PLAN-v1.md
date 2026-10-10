---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16-supplement-v1"
type: execute
wave: 13
depends_on: [265-16]
files_modified:
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/lib/v1-38-lean-experiment-authority.test.ts
  - scripts/lib/v1-38-factory-supervised-runtime.ts
  - scripts/lib/v1-38-factory-supervised-runtime.test.ts
  - scripts/lib/v1-38-planner-supervised-runtime.ts
  - scripts/lib/v1-38-planner-supervised-runtime.test.ts
  - scripts/lib/v1-38-lean-container-match-session.ts
  - scripts/lib/v1-38-lean-container-match-session.test.ts
  - scripts/run-v1-38-lean-private-probe.ts
  - scripts/run-v1-38-lean-private-probe.test.ts
  - .planning/artifacts/v1.38-phase-265-private-probe-allocation-v1.json
  - .planning/artifacts/v1.38-phase-265-private-probe-allocation-v2.json # only if the single correction is authorized
  - .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-SMALL-REPLACEMENT-SOURCE-REVIEW-v1.md
  - .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-SMALL-REPLACEMENT-VALIDATION-v1.md
  - .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-SMALL-REPLACEMENT-SOURCE-VERIFICATION-v1.md
  - .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-SMALL-REPLACEMENT-SUMMARY-v1.md
  - .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-SMALL-REPLACEMENT-RESULT-v1.md
  - .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-SMALL-REPLACEMENT-RETAINED-VERIFICATION-v1.md
upstream_requirements_pending: [LEAG-01, LEAG-02, LEAG-03, LEAG-04, LEAG-05, LEAG-06, LEAG-07, LEAG-08, LEAG-09]
requirements: []
user_setup: []
autonomous: true
must_haves:
  truths:
    - "A separate opaque probe capability authorizes only one durably debited, schema-valid, source/image/limits-bound invocation at each frozen ordinal; issuer reopens committed canonical allocation and retained debit bytes rather than trusting caller roots, while existing Match authority and issuers remain unchanged."
    - "The bounded run admits exactly four non-Match probes, zero Matches, and at most one independently reviewed correction retry of only the failed case; LEAG-01–09 remain pending."
    - "Host receipts encode actual boundary phases and allowlisted codes only; confirmed guest timeout, system/transport failure, and uncertain evidence remain distinct."
    - "A read-only independent verifier recomputes committed allocation, source/HEAD, count, cleanup, time, disk, RAM, and privacy; its report is external to the verified store."
  artifacts:
    - "Separate LeanPrivateProbeRuntimeAuthority/WeakMap claims and tests at factory, planner, and session boundaries."
    - "Standalone runner/test and exactly six named v1 evidence notes; no additional helper, reader module, Match, or numbered plan."
    - "One compact canonical allocation committed at the exact artifact path, one exact-schema private allocation store per root, and an external read-only verification report."
  key_links:
    - "Probe authority -> factory -> planner -> session claim order, all under explicit privateProbeAuthority propagation and current isolated provider."
    - "executionOwnerId -> legacy session matchId transport slot only; source shows this slot is compared, safety-checked, and returned, never used to construct game Match/kernel context."
    - "Verifier reads store only; external report binds result root without changing the verified store or creating a hash cycle."
---

<objective>
Establish bounded private runner feasibility and finite failure attribution through the existing isolated runtime, without Match semantics or league credit.

Purpose: Replace the overlarge failed proof-carrier approach with the approved four-probe diagnostic while preserving the existing authority, resource ceilings, historical failed family, and all downstream requirements as pending.
Output: A tested no-Match host capability path, four-case/zero-Match runner, six exact evidence notes, and one ordinary read-only retained-store verifier.
</objective>

<context>
Read `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, current `.planning/STATE.md` top, `.planning/research/SUMMARY.md`, Phase 265 CONTEXT, existing 265-16 plan, full 265-16 approval20261010 and research-v1, `.planning/debug/v15-5-missing-attribution.md`, and `265-16-POST-V14-RESOURCE-WINDOW-diagnostic-v15-5-PAIR-CLOSURE-v1.json` plus its terminal-verification note. Preserve the immutable failed five-pair root `6e271d34`, its raw evidence, all 40 old charges/survivors, and the continuous 285590903ms carried window (all prior charges included); do not rematerialize history. Use the already approved aggregate cost snapshot, not a new historical scan.

Fixed bounds: new cap 292790903ms; source-edit frontier 2026-10-10 13:27:52 UTC; no new operation after the 13:17:52 UTC entry cutoff unless it can finish with the complete 31-minute reserve before hard stop 13:58:52 UTC. Keep 3GB/15GB, guest 1000ms, host 5000ms, startup 2500ms, Match ceiling 600000ms, rules/runtime/privacy unchanged. Source and HEAD stay fixed from entry through terminal and one independent verification. At most 32 non-Match probes and 2 Matches were global ceilings; this approved supplement freezes exactly four probes and zero Matches. One independently reviewed correction cycle may retry only the one failed case in a fresh root/store; no ordinal revival. If all four are accepted, optional Match allowance remains unused; do not treat this diagnostic as baseline/freeze or league coverage.

Source-grounded no-Match seam: keep `LeanRuntimeAuthority`, its seat-bearing binding, old issuer functions, and old claim predicates unchanged. Add separate opaque `LeanPrivateProbeRuntimeAuthority`, separate module-owned WeakMap records, neutral `LeanPrivateProbeRuntimeBinding`, and ordered one-use factory/planner/session claims. The sole canonical allocation source is `.planning/artifacts/v1.38-phase-265-private-probe-allocation-v1.json` in a commit whose parent is the fixed `sourceHead` inside that exact-key allocation; record resulting `allocationCommit` only in private `entry.json`, avoiding a commit self-cycle. Store a byte-identical allocation copy in the fresh private store. The issuer-side admission function obtains a nonserializable handle only after opening the owned mode-0700 store and allocation with `O_NOFOLLOW`, checking regular file/owner/mode-0600/single-link, exact canonical bytes/keys/root, bounded `git show <allocationCommit>:<exact-allocation-path>` equality, fixed `sourceHead`, and a fresh same-process capacity receipt. It then opens the append-only ledger with no-follow/regular/owned/mode/single-link checks, verifies canonical prior rows and next ordinal, appends the exact debit, fsyncs, reopens allocation and ledger, authenticates byte joins and debit byte offset/digest, and only then issues the capability. The capability binds these reopened byte digests and debit offset; no caller-supplied root/count/charge assertion is authority. Any mismatch, symlink, partial write, duplicate/reordered ordinal, changed file, absent commit, or capacity uncertainty is terminal and cannot issue. A single correction uses exactly `.planning/artifacts/v1.38-phase-265-private-probe-allocation-v2.json` and a fresh store. Propagate optional `privateProbeAuthority` and exact binding through `createFactorySupervisedRuntime` -> `createPlannerSupervisedRuntime` -> `createLeanContainerMatchSession`; fail closed if both private-probe and old Match authority are supplied or if testing transport/streamFactory/observer overrides are supplied. At the session boundary, map neutral `executionOwnerId` into the existing `matchId` transport slot only: the inspected session uses that slot for equality, safe-identity validation, and returning the transport session property; it is not converted to Match state, kernel context, pair, charge, or seat. Preserve the normal real isolated container/provider, schemas, admission, and capacity checks. No host execution, Node vm, alternate executor, or schema/sandbox/capacity bypass.
</context>

<source_audit>
| Source | Item | Disposition |
|---|---|---|
| GOAL | Phase 265 empirical current-rules game and defensible portfolio | NOT COVERED; this is runner feasibility/failure attribution only. |
| REQ | LEAG-01 through LEAG-09 | All PENDING; no requirement IDs are claimed by this supplement. |
| RESEARCH | Existing isolated runtime/provider/schemas; current issuers require Match/pair/seat | Covered by distinct probe capability and explicit propagation; old Match authority remains unchanged. |
| RESEARCH | Host boundary attribution, bounded private accounting, retained verification | Covered by allowlisted host receipts, compact records, and read-only independent verifier. |
| CONTEXT | Approved scope, privacy, fixed ceilings, immutable failure family, no rule changes | Covered by four probes, zero Matches, one correction retry maximum, immutable sources, and pending dependencies. |
| Deferred ideas | Formation materialization, profiles, product certification, rules experiments | Excluded. |
</source_audit>

<tasks>

<task type="auto" tdd="true">
<name>Task 1: Define the separate opaque private-probe authority and ordered claims</name>
<files>scripts/lib/v1-38-lean-experiment-authority.ts, scripts/lib/v1-38-lean-experiment-authority.test.ts</files>
<read_first>Read the existing authority module and its tests once, focusing on `LeanRuntimeAuthority`, `ProspectiveLeagueProviderBinding`, the three existing issuer functions, `claimLeanRuntimeAuthority`, WeakMap ownership, exact-root validation, and current admitted defaults. Also inspect the signatures of `createFactorySupervisedRuntime`, `createPlannerSupervisedRuntime`, and `createLeanContainerMatchSession` to name their existing boundary arguments. Do not change old Match types, issuers, defaults, or predicates.</read_first>
<behavior>
- Tests prove only the module-owned admission opener can mint the ephemeral WeakMap handle, and only after real no-follow descriptor opens, owner/mode/link/regular-file checks, exact canonical allocation bytes/root, equality to bounded `git show <allocationCommit>:<exactpath>`, fixed source HEAD, and a fresh same-process capacity receipt.
- A charge appends one exact canonical next-ordinal debit row to `ledger.ndjson`, fsyncs it, then reopens allocation and ledger and verifies the byte-join/chain before capability issuance; capability binds authenticated allocation digest, debit digest and byte offset, case/ordinal and invocation roots.
- Tests reject missing/extra fields; caller-fabricated roots; uncommitted or byte-different allocation; symlink, wrong owner/mode/link count, non-regular file; missing capacity receipt; partial write; changed/truncated ledger; absent, duplicated, reordered or replayed ordinal; and any mismatch in source, executable, request/input/schema, image, tuple, limits or cost snapshot.
- Serialization/copy, Match-shaped charge, non-probe role, duplicate claim and cross-allocation reuse reject; old Match issuer tests/defaults remain unchanged.
- Factory, planner, session claims are accepted exactly once and in order; skipped, duplicated, reordered, or cross-allocation claims reject.
- Existing Match authority tests/defaults continue to pass unchanged.
</behavior>
<action>In the existing authority module define exact-key `LeanPrivateProbeAllocationV1`, ledger/debit row schemas, `LeanPrivateProbeInvocationV1`, neutral binding, and opaque capability; preserve all old Match types, issuers, defaults and predicates. Add module-owned admission-handle and capability WeakMaps plus exact exports `openLeanPrivateProbeAdmissionV1`, `recordAndIssueLeanPrivateProbeRuntimeAuthorityV1`, and `claimLeanPrivateProbeRuntimeAuthority`. The opener is the only way to mint the admission handle: it opens the owned mode-0700 store and compact allocation copy with descriptor-based `O_NOFOLLOW`; verifies owned directory, regular owned files, mode 0600, single link, exact canonical JSON bytes/keys/root; reads the exact committed allocation with bounded `git show <allocationCommit>:.planning/artifacts/v1.38-phase-265-private-probe-allocation-v1.json`; and requires byte equality plus fixed sourceHead. The allocation schema holds allocation version, sourceHead, zero Match count, exact four-case table/root, source/executable/image/tuple/limits/cost-snapshot roots and ceilings; it contains no allocationCommit field. Opener requires a fresh same-process capacity receipt that this module issued and tracks by WeakMap, not a caller-constructed object. The sole `recordAndIssue...` entry point opens `ledger.ndjson` append-only/no-follow; validates ownership/mode/link/regular file and canonical prior chain; requires exactly the next ordinal; appends one exact row joining allocation digest and ordinal/case/request/input/source roots; fsyncs; then reopens allocation and ledger, recomputes canonical chain and byte offsets/digests, and issues only if the debit is intact. Bind the capability WeakMap record to reopened allocation digest, debit digest/offset, invocation roots and allocation identity; enforce ordered one-use claims. Any I/O error, partial write, mismatch, replay or uncertain capacity consumes/invalidates the handle and fails closed. Provide no issuer API from caller-provided allocation/debit objects or asserted roots.</action>
<verify><automated>pnpm exec vitest run scripts/lib/v1-38-lean-experiment-authority.test.ts</automated></verify>
<acceptance_criteria>Admission handle and capability are minted only from authenticated committed allocation bytes and a durable, fsynced, reopened next-ordinal debit; tests cover byte tampering, malformed file identity/permissions, commit mismatch, capacity receipt, partial/duplicate/reordered debit, and caller-fabricated roots. Capability binds actual debit digest/offset. Existing Match issuer/default behavior is unchanged.</acceptance_criteria>
<done>The probe capability authorizes only the exact single charged probe contract and cannot be used as Match authority.</done>
</task>

<task type="auto" tdd="true">
<name>Task 2: Propagate probe-only authority through the existing isolated factory, planner, and session</name>
<files>scripts/lib/v1-38-factory-supervised-runtime.ts, scripts/lib/v1-38-factory-supervised-runtime.test.ts, scripts/lib/v1-38-planner-supervised-runtime.ts, scripts/lib/v1-38-planner-supervised-runtime.test.ts, scripts/lib/v1-38-lean-container-match-session.ts, scripts/lib/v1-38-lean-container-match-session.test.ts</files>
<read_first>Read the exact factory, planner, and session constructors and their focused tests once. Trace the real factory provider constructor and `invoke/verify/close`; trace planner's current authority binding and session construction; trace every use of session `matchId` and confirm it is only equality validation, safe-identity validation, and returned opaque session property—not Match/kernel state. Read current capacity, image, source admission and schema checks. Do not use another execution path.</read_first>
<behavior>
- Each boundary accepts a private probe authority only alongside its exact matching private binding, checks/consumes its stage claim before proceeding, and propagates it to the next boundary.
- Old `leanExperimentAuthority` path is unchanged; mixed authority modes, `createRuntime` property presence (including undefined or accessor), missing/mismatched probe binding, session overrides, testing transport, observer injection, invalid image, or exhausted capacity reject before claims/construction/dispatch.
- Session uses `executionOwnerId` only in the existing opaque transport `matchId` slot; tests prove no Match/kernel context, seat, pair, or Match charge is made.
- A valid probe still reaches the real isolated provider and v1.19 schema boundary; factory/planner/session claims cannot be bypassed or reused.
</behavior>
<action>Extend the three option contracts with optional `privateProbeAuthority` and exact binding without changing normal defaults or the old Match branch. At the start of `createFactorySupervisedRuntime`, before destructuring/accessing overrides, use property-presence detection (`Reflect.has(options, "createRuntime")`) and reject if present, including undefined/accessor/inherited presence; also reject `prospectiveLifetime` and mixed old/probe authority before claim or construction. The accepted probe branch must use only the existing real factory/planner/session constructors. In planner validate source/admission/revision/image/tuple/limits and claim `planner`, then propagate. In session validate closeout, no testing transport/streamFactory/observer injection, exact source/image/tuple/limits/owner, and claim `session` before real isolated session creation. Set only transport `matchId = executionOwnerId`; never use it for game state. Add positive retained-allocation-to-real-provider tests and negative committed-byte mismatch, changed debit, missing/reordered ordinal, createRuntime undefined/accessor presence, mixed-mode and every override injection. Preserve guest/host/startup/Match ceilings, all schemas, ordinary defaults and old claim ordering.</action>
<verify><automated>pnpm exec vitest run scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/lib/v1-38-lean-container-match-session.test.ts</automated></verify>
<acceptance_criteria>Valid committed allocation/debit bytes traverse all three ordered claims into the real isolated provider. Factory rejects any `createRuntime` property presence before claims/construction, with explicit undefined and accessor tests; mixed authority and all testing/transport/observer overrides reject. Existing Match path/defaults and all fixed limits remain unchanged.</acceptance_criteria>
<done>Probe permission is accepted end-to-end only through ordered factory/planner/session claims, without a fabricated game Match or a new executor.</done>
</task>

<task type="auto" tdd="true">
<name>Task 3: Implement the four-probe runner, bounded records, independent verifier, and gated closeout</name>
<files>scripts/run-v1-38-lean-private-probe.ts, scripts/run-v1-38-lean-private-probe.test.ts, .planning/artifacts/v1.38-phase-265-private-probe-allocation-v1.json, .planning/artifacts/v1.38-phase-265-private-probe-allocation-v2.json only if one correction is authorized, .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-SMALL-REPLACEMENT-SOURCE-REVIEW-v1.md, .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-SMALL-REPLACEMENT-VALIDATION-v1.md, .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-SMALL-REPLACEMENT-SOURCE-VERIFICATION-v1.md, .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-SMALL-REPLACEMENT-SUMMARY-v1.md, .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-SMALL-REPLACEMENT-RESULT-v1.md, .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-SMALL-REPLACEMENT-RETAINED-VERIFICATION-v1.md, .strategy-lab/lean-private-probe-v1/<full-allocation-root-hex>/request.json, .strategy-lab/lean-private-probe-v1/<full-allocation-root-hex>/allocation.json, .strategy-lab/lean-private-probe-v1/<full-allocation-root-hex>/ledger.ndjson, .strategy-lab/lean-private-probe-v1/<full-allocation-root-hex>/entry.json, .strategy-lab/lean-private-probe-v1/<full-allocation-root-hex>/probe-00.json, .strategy-lab/lean-private-probe-v1/<full-allocation-root-hex>/probe-01.json, .strategy-lab/lean-private-probe-v1/<full-allocation-root-hex>/probe-02.json, .strategy-lab/lean-private-probe-v1/<full-allocation-root-hex>/probe-03.json, .strategy-lab/lean-private-probe-v1/<full-allocation-root-hex>/terminal.json, .strategy-lab/lean-private-probe-v1/<full-allocation-root-hex>/result.json</files>
<read_first>Read the approval20261010, research-v1, Plan 16 source/cost snapshot, authority/factory/planner/session diffs and tests, current `LeanBaselineSource` validation/admission, v1.19 request schemas, and debug diagnosis. Do not rematerialize historical survivor files. Inspect current host call-boundary diagnostics only; do not run Match or reader before gates pass.</read_first>
<behavior>
- Frozen cases: two identical legal `selectActivations` calls and two identical legal `soldierBrain` calls. Inputs are built from canonical starting positions and public legal observation fields, parsed by current schemas, with no hidden Match state; exactly zero Match calls.
- Debit is durable before each actual invocation; each attempted case is charged and terminalized. First failure stops later calls. At most one independently reviewed correction retries only that failed case using a new root/store; old root remains immutable.
- Receipts use allowlisted host boundary phase/reason codes, roots and bounded measurements only. Only explicit schema-tagged guest timeout is `strategy_timeout`; explicit transport/system evidence is `system_failure`; ambiguous/contradictory evidence is `unknown`.
- `--verify` runs in a distinct process and is read-only: recomputes allocation, fixed HEAD/source, request/cases, count, cleanup, continuous time, RAM/disk and privacy; rejects tampering, extra paths/bytes, missing rows or incomplete cleanup. It does not write into the store.
</behavior>
<action>Create only the standalone runner/test in source. Before entry, write exact-key canonical allocation JSON to `.planning/artifacts/v1.38-phase-265-private-probe-allocation-v1.json`; it contains `schemaVersion`, fixed `sourceHead` (the pre-allocation parent commit), zero `matchCount`, exactly four case descriptors and case-table root, admitted source/executable/image/tuple/runtime-limits roots, immutable cost-snapshot root, fixed resource ceilings, and an allocation root computed from the canonical rootless object. It contains no allocationCommit or self-referential hash. Commit this one allocation artifact as the child commit; capture resulting HEAD as `allocationCommit` in private `entry.json`, then leave source HEAD fixed. In a fresh empty mode-0700 private store, write byte-identical allocation copy mode 0600. The issuer admission function verifies committed bytes with bounded `git show <allocationCommit>:<exact-path>` and checks them against store bytes and fixed `sourceHead`; it mints the capacity-bound private handle only after same-process capacity is rechecked. For each case call the module's sole charge-and-issue API; it opens/validates `ledger.ndjson`, writes one exact canonical next-ordinal debit row using append-only no-follow descriptor, fsyncs, reopens and authenticates the allocation/ledger byte joins, then issues an authority bound to debit digest and byte offset. No invocation can start before this returns. Record one append-only row per attempted ordinal; a partial write or any mismatch stops and prevents dispatch. Source/HEAD, allocationCommit and allocation bytes are fixed through terminal and independent verification. If one correction is authorized, write/commit the exact same schema at `.planning/artifacts/v1.38-phase-265-private-probe-allocation-v2.json`, using its own sourceHead/allocationCommit and fresh distinct root/store; no third allocation.

Export `createLeanPrivateProbeScheduleV1`, `runLeanPrivateProbeV1`, and `verifyLeanPrivateProbeResultV1`. Use existing source admission and `createFactorySupervisedRuntime`; call the current provider's real `invoke`, `verify`, and `close` boundary exactly once per charged ordinal. Admit no source edits after 13:27:52Z; check same-process RAM/disk/time capacity before allocation, entry, and every charge. At actual call boundaries write fixed enums and sanitized roots only; never retain source, request/input/output payload, memory, objective, stdio, or error text. Pin failed-five-pair root `6e271d34`, raw digest, prior 40 charges, continuous elapsed time and survivors via the one existing aggregate cost snapshot; no historical rewrite. The private store contains exactly `request.json`, `allocation.json`, append-only `ledger.ndjson`, `entry.json`, attempted `probe-00.json`–`probe-03.json`, `terminal.json`, and `result.json`; omit probe files for unattempted cases and reject all extra files. The read-only verifier writes nothing in this directory. After it exits, write `265-16-SMALL-REPLACEMENT-RETAINED-VERIFICATION-v1.md` externally; this report binds the already-computed result root and never changes it. Create exactly the six named v1 notes and the single canonical allocation (plus v2 only for the one correction); no other docs/helpers/carriers. Do not dispatch a Match. Before allocation, require distinct source review, focused tests, validation and source verification; any failure/ambiguity stops before allocation and is recorded as `gaps_found` or `feasibility_not_established`. Complete terminal cleanup and independent verification by 13:58:52Z with 31-minute reserve; if no safe window remains, stop before entry. Record only runner feasibility/failure attribution, never baseline/freeze, league success, historical physical cause, or phase completion.</action>
<verify><automated>pnpm exec vitest run scripts/run-v1-38-lean-private-probe.test.ts scripts/lib/v1-38-lean-experiment-authority.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/lib/v1-38-lean-container-match-session.test.ts; pnpm exec tsc -b; pnpm exec tsc --ignoreConfig --noEmit --types node --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes --skipLibCheck --pretty false scripts/lib/v1-38-lean-experiment-authority.ts scripts/lib/v1-38-lean-experiment-authority.test.ts scripts/lib/v1-38-factory-supervised-runtime.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-planner-supervised-runtime.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/lib/v1-38-lean-container-match-session.ts scripts/lib/v1-38-lean-container-match-session.test.ts scripts/run-v1-38-lean-private-probe.ts scripts/run-v1-38-lean-private-probe.test.ts</automated>Run each command separately and preserve its own exit/status. The explicit-file strict command covers scripts, unlike the root project reference check. Capture the strict baseline on the eight existing files before edits and compare the final ten-file diagnostic set. Any new diagnostic blocks admission. Byte-identical inherited diagnostics remain explicitly NOTPASS and unwaived, not silently called a green global check; the source-scoped gate can pass only after independent review establishes no new diagnostics and no new errors in the added files. Record baseline/final diagnostics and this limited disposition in the already enumerated validation note; no extra permanent report.</verify>
<acceptance_criteria>Runner creates one exact canonical committed allocation at the named path (v2 only for the single authorized correction), and issuer verifies committed/store byte identity, file identity, fixed sourceHead, same-process capacity receipt, and durable fsynced debit digest/offset before each invocation. Factory's forbidden constructor override cannot bypass this capability. Four probes/zero Matches/one correction maximum, read-only verifier, six notes and exact store inventory hold; failure/cutoff preserves prior evidence and yields honest non-success.</acceptance_criteria>
<done>Only after source gates pass, one fresh root may enter the existing isolated runtime; a distinct read-only verifier recomputes the retained result. No LEAG requirement or baseline/freeze claim is credited.</done>
</task>

</tasks>

<physical_inventory>
## Exact implementation and output inventory

Only the ten source/test paths in frontmatter plus the one exact canonical allocation artifact and six named notes are produced; v2 allocation artifact is permitted only for the single authorized correction. The initial canonical allocation is `.planning/artifacts/v1.38-phase-265-private-probe-allocation-v1.json`; its root hashes the canonical exact-key rootless object, including fixed pre-allocation `sourceHead`, and deliberately excludes `allocationCommit`. Commit this artifact as a child of `sourceHead`; record resulting `allocationCommit` in private `entry.json`. Issuer and verifier bind both commits and require committed allocation bytes, store copy, and fixed source tree to agree; thus no future-HEAD or self-hash cycle exists. If correction is authorized, use exactly `.planning/artifacts/v1.38-phase-265-private-probe-allocation-v2.json` with its own `sourceHead` and `allocationCommit`; no third allocation. For each allocation root, the only private-store paths are `.strategy-lab/lean-private-probe-v1/<full-allocation-root-hex>/request.json`, `allocation.json`, `ledger.ndjson`, `entry.json`, zero to four attempted `probe-NN.json` receipts, `terminal.json`, and `result.json`. The external retained-verification report is the sixth named phase note—not a store child. Each correction receives a fresh full-root path and leaves the prior root immutable. Mode 0700 directory, mode 0600 files; verifier rejects any unlisted entry. Result root excludes its own bytes; external notes bind only prior output roots, avoiding self-hash cycles. No STATE/ROADMAP/REQUIREMENTS changes, helper files, reader modules, sidecars, histories, or source-embedded proof carriers.

The one referenced immutable cost snapshot pins failed five-pair root `6e271d34`, raw digest, 40 prior charges, continuous wall, and survivor aggregate; do not expand it per invocation. Every new write/time/measurement is charged to the continuous 292790903ms/3GB/15GB budget; runtime ceilings remain guest 1000ms, host 5000ms, startup 2500ms, Match 600000ms.
</physical_inventory>

<verification>
- Task 1 authority tests; Task 2 factory/planner/session tests; Task 3 runner tests and configured project TypeScript build pass. The explicit-file strict check covers all ten scripts, with independently confirmed zero new diagnostics; inherited diagnostics remain unwaived NOTPASS and are recorded separately.
- Distinct source review, scoped validation, and source verification pass before allocation/entry.
- Ordinary `--verify` runs independently, reads only, recomputes exact roots/counts/cleanup/time/disk/RAM/privacy, and has no mutation path. The separately named external note records its result.
- Any unsupported capability, source ambiguity, incomplete lifecycle, capacity failure, or cutoff blocks runtime entry or ends as `gaps_found`/`feasibility_not_established`/`unknown`; never infer success.
- All LEAG-01–09 remain pending. The existing current-baseline/freeze-before-formation dependency remains blocked for separately admitted baseline work.
</verification>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|---|---|
| Host -> isolated runtime | Admitted hostile source receives only schema-valid public legal observations through the existing container boundary. |
| Allocation/debit -> issuer | Exact-schema roots and one-use debit are reopened before private capability issuance. |
| Provider event -> receipt | Only enumerated phases/codes, roots, and bounded measurements cross; raw payloads/errors remain excluded. |
| Retained store -> verifier | Independent process reads all entries and recomputes joins; it cannot write to the verified store. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|---|---|---|---|---|---|
| T-265-16-SR-01 | Elevation of Privilege | Probe capability | high | mitigate | Separate WeakMap authority binds allocation, debit, ordinal, source, request/input, image, tuple and limits; ordered one-use claims; old Match issuers unchanged. |
| T-265-16-SR-02 | Tampering | Allocation/store | high | mitigate | Commit exact schedule before entry; fresh private root; independently recompute roots/counts and reject extra or changed entries. |
| T-265-16-SR-03 | Information Disclosure | Receipts | high | mitigate | Allowlisted phase/code and bounded roots only; raw source/input/output/memory/objective/error/stdio excluded. |
| T-265-16-SR-04 | Denial of Service | Runtime lifecycle | high | mitigate | Existing isolation and capacity limits; serial four-case cap; debit before invocation; cleanup and unknown-on-ambiguity. |
| T-265-16-SR-SC | Tampering | Package supply chain | low | accept | No package installs or dependency changes. |
</threat_model>

<success_criteria>
The exact four-probe/zero-Match runner can be safely authorized through the current isolated runtime and independently verified read-only, or ends honestly before entry as infeasible. The old failed family and all 40 charges/survivors remain immutable. No league, baseline, freeze, formation, holdout, public, counted, production, or phase-completion claim follows.
</success_criteria>

<output>
Revise existing Plan 265-16 supplement only. Do not add a numbered phase/plan or modify roadmap, state, requirements, source, tests, or runtime during planning. Execution outputs are restricted to the ten exact source/test files, one canonical v1 allocation (v2 only for the one authorized correction), six named v1 notes, and private store inventory above.
</output>
