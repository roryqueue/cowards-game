---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
supplement: replay-validation-source-only
type: execute
wave: 12
depends_on: ["265-15"]
files_modified:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/run-v1-38-lean-replay-validation-v5.test.ts
autonomous: true
requirements: [LEAG-01, LEAG-02, LEAG-03, LEAG-04, LEAG-05, LEAG-06, LEAG-07, LEAG-08, LEAG-09]
requirements_completed: []
scope: prospective_v5_replay_validation_source_only
execution_authorized: false
empirical_credit: false
phase_complete: false
must_haves:
  truths:
    - Every retained replay frame is canonically parsed and every existing replay integrity check remains enforced.
    - Only strictly admitted prospective v5 diagnostic/baseline allocations select validation without a returned frame array.
    - Default and legacy decoder paths, evidence roots, sealed policy roots and all resource bounds remain unchanged.
    - Synthetic proof cannot authorize another Match, retry, historical reader or downstream phase.
  artifacts:
    - path: packages/strategy-lab/src/league/lean-experiment.ts
      provides: bounded synchronous validation-only replay seam and strict v5 evidence-reader selection
      exports: [validateLeanReplay]
    - path: scripts/run-v1-38-lean-replay-validation-v5.test.ts
      provides: synthetic differential integrity, boundedness and actual evidence-reader branch tests
  key_links:
    - from: verifyLeanEvidence
      to: admitLeanAllocation
      via: full exact v5 allocation admission before selecting validation-only behavior
    - from: verifyLeanEvidence
      to: validateLeanReplay
      via: every selected retained replay on strictly admitted prospective v5 only
    - from: validateLeanReplay
      to: existing parse helper
      via: one newline-delimited frame at a time with decoder-equivalent UTF-8 handling
---

# Existing Plan 16 supplement: validation without retaining decoded frames

<objective>
Remove unnecessary replay materialization from the prospective v5 evidence-validation path without changing the replay acceptance contract or skipping any full audit, per D-01, D-02, D-25 and D-28. This is a source-only repair to existing Plan 16, not a new numbered plan or empirical continuation.
Purpose: verifyLeanEvidence currently discards the full parsed array returned by decodeLeanReplay; it needs integrity validation, not retained decoded frames.
Output: one additive private validator, one narrow v5 branch, one dedicated synthetic fixture file, followed by independent code-review → fixes → validation → source verification. No actual replay or empirical route is exercised.
</objective>

## Authority, caps and terminal stop

The latest active STATE records the v5 baseline envelope consumed and failed before its first recorded current charge: child_failed / SIGKILL / resource_threshold,96096ms; unique terminal-only verification closed with gaps_found. Its result/check are absent. All old bytes, authority, results, allocations, journals and readers remain immutable. Never retry/resume the old route or invoke its ordinary reader. The accepted diagnostic remains immutable; this source repair does not re-open it.

Carry every subsequent source/test/review/fix/validation/admin cost conservatively from **33812347 + max(0, now − 1791242322180) ms**, subject to existing authenticated monotonic/wall uncertainty rules, below the same **43200000ms / 12h**, **15000000000B**, **300-Match** cumulative envelope with **24 already-spent Matches** and every surviving-file debit. The value9387653ms was remaining at that historical close, not a fresh balance. No resets, refunds, recredits, new time allocation or invented peak/resource sample. Existing retained12GB/scratch2GB/terminal1GB partitions,512000000B external reserve,320MiB parent buffer,256000000B replay ceiling,4× declared-inflate transient guard, guest1000/absolute host5000/Match600000/startup2500/cancel≤100 stay fixed.

At most **two serial source tasks**, **two source/test files**, and separately named supplemental reports. No new dependencies, policy/root/schema widening, request/carrier/allocation/helper generation, real replay payload, historical/full-manifest reader, native Worker/Docker/provider/Strategy/Match, cold regeneration, runtime experiment or holdout access. Stop at source findings or exhausted current cumulative cap; report gaps without scope expansion. Source pass does not guarantee lower RSS, native feasibility or complete36-Match baseline. **Any future Match requires new bounded human approval**, fresh reviewed source/data and separately admitted capacity/entry custody; no such authority is granted here. Phase265/LEAG/freeze/formation/public/counted/production remain uncredited and holdout unopened.

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
@.planning/research/SUMMARY.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-CONTEXT.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-RESEARCH.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-PLAN.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-STARTUP-RESOURCE-DIAGNOSIS-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-STARTUP-BASELINE-TERMINAL-VERIFICATION-v1.md
@CowardsGameSpec_Full_Consolidated_v1.md
@CowardsGame_Technical_Architecture_Spec_V1.md
@packages/strategy-lab/src/league/lean-experiment.ts
</context>

## Research rationale and extracted interface

Local source discovery is Level0: existing Node gzip/hash primitives, canonical parser and private lab patterns; no library choice or package install. Diagnosis traces two parent and one child full accepted-diagnostic audits before first charge; keep all three audits and their cadence. The alternative admission-cache recommendation in the diagnosis is **not** selected by this supplement. No memoization or snapshot/cache redesign is in scope.

Relevant source: lean-experiment.ts:845–888 defines256MB ceiling, assertTransient and decodeLeanReplay; :1336–1348 verifies selected replay integrity then discards decoded frames. correction-retained.ts:293–319 authenticates the full diagnostic and returns compact roots only. Diagnosis proves redundant allocation-heavy work, not the historical allocating peak or initiating cause. One full parent audit plus one full child audit could still exceed scratch; this narrower repair offers no empirical feasibility conclusion.

Existing interfaces remain: LeanReplayContainer with exact schemaVersion/privacy/codec/compressedRoot/uncompressedRoot/compressedBytes/uncompressedBytes/frames/root; decodeLeanReplay(container,bytes,maximumBytes=REPLAY_MAX):unknown[]; parse(bytes):unknown using require-canonical admission; verifyLeanEvidence(ledger) with unchanged records/output/root; admitLeanAllocation(value) and leanSupervisorAllocationMode(admitted). New private export: validateLeanReplay(container:LeanReplayContainer,bytes:Uint8Array,maximumBytes=REPLAY_MAX):void. Successful return conveys no authority, receipt, replay projection, decoded output or reusable admission cache.

Dependency: Task1 creates validator plus synthetic contract proof; Task2 consumes it and adds actual v5/default/legacy evidence-reader proof. Shared source/fixture ownership forces serial execution; no concurrent related work. The validator retains compressed input and the existing bounded full inflate Buffer; it does **not** claim streaming decompression or a single-frame total RSS bound. Only text/parsing is frame-at-a-time.

<tasks>
<task type="auto" tdd="true">
<name>Task1: Differential synthetic replay contract and validation-only implementation</name>
<files>packages/strategy-lab/src/league/lean-experiment.ts, scripts/run-v1-38-lean-replay-validation-v5.test.ts</files>
<read_first>Existing decoder, parse/leanBytesRoot/exactLabKeys/root/natural/assertTransient and encodeLeanReplay in lean-experiment.ts; canonical JSON byte-admission contract. Capture original decoder and fixed-cap/policy initializer bytes before editing for immutable compatibility assertions.</read_first>
<behavior>Valid synthetic containers yield decoder values and validator undefined with identical admission. Mutations reject extra/missing keys, wrong schema/privacy/codec, invalid roots/natural counts, root mismatch, compressed hash/length, inflate limit/error, uncompressed hash/length, trailing-newline/count errors and malformed canonical frames at first/middle/last line. Empty inflated payload with frames0 succeeds; a newline-only empty frame or internal blank line fails. Canonical primitives, arrays/objects, escaped newlines and multibyte UTF-8 succeed identically; malformed/truncated UTF-8 follows existing replacement-round-trip semantics, not a newly stricter raw-byte parser. Truncated/corrupt gzip fails. Tests use small explicit maximumBytes for exact-bound/one-byte-over/inflate-bomb cases and declared-above-global-ceiling cases, not huge payloads.</behavior>
<action>
Per D-01, D-02 and D-25, first create dedicated describe suites contract and wiring. Write failing contract tests before production edits, then implement only validateLeanReplay adjacent to the unchanged decoder. Build every fixture in memory from trusted synthetic canonical bytes/gzip; recompute envelope hashes/root for payload mutations so late malformed lines genuinely reach parsing rather than merely failing a checksum. Use the unchanged decoder as a differential acceptance/error-code oracle; do not revise oracle expectations to accommodate the new path.

Copy the decoder's exact metadata/root/compressed-byte validation order and finite failures. Preserve assertTransient(container.uncompressedBytes * 4) before the same synchronous gunzip, its existing maxOutputLength expression and catch behavior; preserve inflated length/hash checks before frame parsing. Scan the inflate Buffer for byte0x0a boundaries, validate terminal newline and exact frame count before parsing, including zero-byte/zero-frame acceptance. Avoid a boundary-offset array: count newline delimiters in one bounded scan and parse in a second scan. For each line only, apply the existing UTF-8 decoding/re-encoding semantics and call existing parse; discard its result immediately before advancing. A per-line string/Buffer/parsed value is permitted; full-payload UTF-8 text, split-line collection, accumulated parsed frames, callbacks retaining frames and returned parsed arrays are not. Keep canonical parser depth/size/number/key checks intact; do not bypass them with JSON.parse. Do not alter decodeLeanReplay, encoder, schema, hashes, format, maximum defaults or caps. Preserve fail codes for every differential case. Return void only after every frame has been parsed.

Keep tests deny-by-default for child-process spawn/fork/exec variants and Worker creation; allow actual Node gzip and crypto only on small synthetic bytes. Any filesystem interception must allow only dedicated synthetic temporary0700 ledger paths and named source bytes needed for structural assertions; never fall back to private artifact or historical paths. Restore all process-memory/resource mocks; their low synthetic values prove guard arithmetic only, not available memory. Instrument the real guarded call seam to assert unchanged4× request and gunzip maxOutputLength before inflate. Include a region-scoped AST assertion that the new validator does not retain full decoded text/line/frame collections; legacy decoder legitimately retains its array elsewhere.
</action>
<verify><automated>node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-replay-validation-v5.test.ts -t contract --maxWorkers=1</automated></verify>
<done>Contract fixtures demonstrate decoder-equivalent validation including every late frame; original decoder bytes and every resource/policy initializer remain unchanged. No real payload, Strategy or empirical helper is read or executed.</done>
</task>

<task type="auto" tdd="true">
<name>Task2: Strict prospective v5 evidence wiring and independent source closure</name>
<files>packages/strategy-lab/src/league/lean-experiment.ts, scripts/run-v1-38-lean-replay-validation-v5.test.ts</files>
<read_first>verifyLeanEvidence/readLeanLedger, admitLeanAllocation and exact diagnostic/baseline v5 schema discriminants; diagnosis precharge graph and latest STATE. Existing synthetic allocation-constructor pattern may be consulted as source only, not imported as a test/helper runner.</read_first>
<behavior>Actual verifyLeanEvidence on synthetic strictly admitted diagnostic-v5 and baseline-v5 ledgers validates all selected replays without materializing decoder arrays, preserving identical evidence records/root. Default/legacy v1–v4 retain exact decoder path, behavior and return shape. Forged v5 schema, mismatched approval/supplement/policy/root/caps or unsupported version cannot select validation-only behavior. One malformed final frame in an otherwise fully rehashed replay fails the real evidence reader, with no returned evidence. Success sampling/failure replay requirements, missing replay refusal and charged-failure/unused-slot semantics remain unchanged.</behavior>
<action>
Write failing wiring fixtures first. Per D-01, D-02, D-05, D-22, D-25, D-27 and D-28, narrowly branch the selected-replay call in verifyLeanEvidence: only the two exact prospective v5 allocation schema discriminants may attempt full admitLeanAllocation authentication and confirm admitted leanSupervisorAllocationMode equals v5 before using validateLeanReplay. Every other existing/default allocation retains its original decoder call; unknown/forged input never enables the new path. Add no caller Boolean, environment switch, weakened allocation interpretation or public option. Preserve output schema, records, status, events, sample/failure coverage, evidence root and full-audit callers/cadence; no status-only or summary-only trust.

Exercise the actual exported verifyLeanEvidence with small in-memory/synthetic temporary ledger files and real replay/hash/canonical admission. Do not stub the validator, allocation admission or evidence reader itself. Record per-line parser visitation or equivalent mutation proof to ensure every frame is checked; prove the branch structurally and behaviorally, not by export presence. Byte-pin the original decoder and fixed LEAN_CAPS/LEAN_SUPERVISOR_V5_CAPS/approval/supplement/startup-policy initializer regions captured before editing. Do not modify sealed STARTUP-PLAN, approval, supplement or policy roots, old journals/checks/results, scripts/lib audit code, source-manifest logic or production packages. Source identity must naturally change when new code is later measured; no old carrier/source root becomes valid for modified code.

After the focused source tests, hand the exact diff to independent code review; fix in-scope findings only within these two owned files and rerun affected fixtures. Then independent validation and source-goal verification must bind final source identity, test selection/pass/fail/skips, compatibility pins, actual branch flow and unchanged caps/history. Record separately named REPLAY-VALIDATION source summary/review/fix/validation/source-verification reports without editing historical reports or Phase265 completion. Verify no leakage/public graph/import/runtime/engine change. This private validator does not create or alter rendered board/Match state; browser/board realism or native proof would exceed this source-only scope. If review requires unrelated source/cap/authority expansion, stop and return the precise blocker for direction. Do not author any empirical request, allocation or executable continuation helper.
</action>
<verify><automated>node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-replay-validation-v5.test.ts --maxWorkers=1</automated><human-check>Independent source reviewer and verifier inspect the exact diff and synthetic branch evidence; this is not a human empirical approval checkpoint.</human-check></verify>
<done>Independent review has no unresolved in-scope findings; validation/source verification prove all four source truths. No historical decoder/policy/cap change or replay/full-audit omission occurred. requirements_completed stays empty; no empirical or downstream permission is asserted.</done>
</task>
</tasks>

<threat_model>
## Trust Boundaries

Private compressed evidence → bounded inflate/canonical frame parser; untrusted allocation labels → strictly admitted v5 branch; source proof → human-controlled empirical authority.

## STRIDE Threat Register

|Threat ID|Category|Component|Severity|Disposition|Mitigation Plan|
|---|---|---|---|---|---|
|T-265-RV-01|Tampering|Replay container and frame body|high|mitigate|Exact keys/roots/lengths/counts and existing canonical parser; fully rehashed late-frame corruption fixtures|
|T-265-RV-02|Denial of service|Inflate and transient allocation|high|mitigate|Unchanged256MB ceiling/maxOutputLength/4× transient guard; no full text, line collection or parsed array; synthetic small-limit boundary tests|
|T-265-RV-03|Spoofing / elevation of privilege|v5 selection and proof claims|high|mitigate|Full v5 allocation admission; malformed-version/policy/cap rejection; source proof grants no empirical authority|
|T-265-RV-04|Repudiation|Evidence/charge/history custody|high|mitigate|Same evidence output/root/audit cadence, unchanged consumed bytes/readers,24 spent charges and conservative cumulative costs|
|T-265-RV-05|Information disclosure|Private replay/test diagnostics|high|mitigate|Synthetic-only data, deny native/historical IO, no parsed-frame output/public projection/raw private logging|
|T-265-SC|Tampering|Package supply chain|low|accept|No installation or dependency change; existing Node primitives/workspace parser only|
</threat_model>

## Four-source coverage audit — supplemental scope, not full-phase completion

|Source|IDs / item|Coverage and disposition|
|---|---|---|
|GOAL|Active bounded current-rules empirical game / honest complete accounting|Tasks1–2 preserve the integrity-reader prerequisite only; original Plan16 still owns incomplete empirical baseline/response/freeze obligations. No empirical goal marked complete.|
|REQ|LEAG-01,02|Task2 preserves exact replay/terminal/coverage integrity; matrices remain incomplete and unchecked.|
|REQ|LEAG-03,04,05,07|Task2 preserves evidence-root inputs without changing solver/response/report/pure semantics; original Plan16 owns those obligations, no empirical credit.|
|REQ|LEAG-06,08|Task2/report scope retains explicitly deferred original scale/diversity/robust certification, non-green.|
|REQ|LEAG-09|Task2 preserves charged failures; active single automated round remains superseded and empirically incomplete, not rerun here.|
|RESEARCH|Private lab responsibility map, exact bounded keys/roots, canonical parser, three-way failures|Tasks1–2 implement/preserve those constraints in the private lab, with unchanged runtime/engine boundaries.|
|RESEARCH|Diagnosis: discarded decoded array; repeated audits; unknown peak/cause/feasibility|Task1 addresses only discarded materialization; Task2 preserves repeated full audits. Attribution/performance uncertainty remains explicit. Admission-cache alternative excluded by authorized supplemental scope.|
|CONTEXT|D-01,02,05,22,25,27,28|Tasks1–2 explicitly implement unchanged identity/integrity/charge/cap/replay/no-retry/private boundaries; prospective12h overlay overrides original8h only for admitted v5.|
|CONTEXT|D-03,04,06,23,24,26|Task2 preserves existing kernel/runtime/rules/schedule/cold/freeze ordering by changing none of those owners; no formation or hostile execution here.|
|CONTEXT|D-07,08,09,10,11,12,13,14,15,16,19,20,21|Task2 preserves their existing owners and source/empirical gates; no solver/matrix/search/report implementation is removed or reassigned by this supplement.|
|CONTEXT|D-17,18 and Deferred Ideas|Approved lean deferrals remain unchanged; no deferred diversity/certification/formation/product work is introduced.|

<verification>
Planner performs document/schema/structure checking only; no implementation/tests/commit/empirical helper. Later executor runs only the new dedicated synthetic fixture selectors above (target under60s each; split contract/wiring selectors if needed, never broaden to native/historical suites). Independently review→fix→validate→source-verify exact final source. Affected package typecheck may use the existing local tsc build for packages/strategy-lab after checking for no empirical hooks; disclose inherited unrelated diagnostics separately, never claim a broad script/native suite passed. Verify immutable decoder/policy/cap bytes, all full audits still present, every frame parsed and unchanged evidence roots for equal synthetic inputs. Gate scripts/reports must not silently create another source or empirical plan. No performance benchmark, actual RSS claim, real replay reopen or ordinary retained-reader command is allowed.
</verification>

<success_criteria>
Two-file prospective source change and synthetic proof preserve the full decoder contract and every selected-replay audit while avoiding unnecessary retained frame-array/full-text materialization on strictly admitted v5 only. Independent source gates pass or report honest gaps. All old artifacts/readers/caps and sealed STARTUP authority remain unchanged. LEAG/Phase265/empirical/freeze/formation/holdout/public/counting/production completion and execution_authorized remain false.
</success_criteria>

<output>
Write separately named 265-16-REPLAY-VALIDATION-SOURCE-SUMMARY-v1.md, -SOURCE-REVIEW-v1.md, -SOURCE-FIX-v1.md if needed, -VALIDATION-v1.md and -SOURCE-VERIFICATION-v1.md in this phase directory. Do not overwrite historical reports or change the numbered plan count/ROADMAP/STATE requirements to passed. Report exact source-only disposition and cumulative cap boundary to MAIN; future empirical authority requires a separate new bounded human decision.
</output>
