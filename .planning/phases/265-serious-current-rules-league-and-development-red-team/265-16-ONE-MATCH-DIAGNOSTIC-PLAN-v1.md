---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16
type: execute
supplement: one-match-finite-diagnostic-v1
wave: 1
depends_on: []
autonomous: true
requirements: [LEAG-01, LEAG-02, LEAG-03, LEAG-04, LEAG-05, LEAG-07]
requirements_completed: []
files_modified:
  - scripts/run-v1-38-lean-private-matches.ts
  - scripts/run-v1-38-lean-private-matches.test.ts
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/lib/v1-38-lean-experiment-authority.test.ts
  - scripts/lib/v1-38-lean-baseline-match.ts
  - scripts/lib/v1-38-lean-baseline-match.test.ts
  - scripts/lib/v1-38-lean-container-match-session.ts
must_haves:
  truths:
    - One fresh allocation-v2 authorizes at most one private current-rules Match, zero standalone probes and zero retries.
    - Actual authenticated finite failure code survives missing origin; unavailable causal stage is explicitly unknown.
    - Old consumed two-Match allocation/result/reader, authority counts and expired window remain unchanged.
    - Independent source gates precede preparation, immutable allocation commit, unique ROOT entry and one retained reader.
  artifacts:
    - path: scripts/run-v1-38-lean-private-matches.ts
      provides: Explicit allocation-v2 producer and connected read-only diagnostic verifier
    - path: scripts/lib/v1-38-lean-experiment-authority.ts
      provides: Separate one-use v2 admission, debit, resource and seat authority
  key_links:
    - from: authenticated actual failed runtime accounting evidence
      to: v2 finite diagnostic and terminal/result roots
      via: shared canonical composer return, exact failed-row joins and producer projection
    - from: committed allocation-v2 and fresh same-process capacity
      to: one durable debit and two ordered opaque startup seat grants
      via: separate v2 authority without legacy context substitution
---

# Existing Plan 16 supplement: one fresh private Match diagnostic

<objective>
Repair finite error capture and observe exactly one approved fresh private current-rules Match, or stop honestly before dispatch. This supplements existing Plan16, not a new numbered plan/phase/workstream. Preserve D-01–D-06, D-10, D-22, D-25, D-27 and D-28; D-26 baseline-before-formation remains unsatisfied. No native cause is diagnosed by the old failure and no native/runtime repair is authorized.
</objective>

<execution_context>
@/Users/roryquinlan/.codex/gsd-core/workflows/execute-plan.md
@/Users/roryquinlan/.codex/gsd-core/templates/summary.md
</execution_context>
<context>
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-ONE-MATCH-DIAGNOSTIC-APPROVAL-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-ONE-MATCH-DIAGNOSTIC-RESEARCH-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-TWO-MATCH-PLAN-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-TWO-MATCH-FAILURE-DIAGNOSIS-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-CONTEXT.md
@scripts/run-v1-38-lean-private-matches.ts
@scripts/lib/v1-38-lean-experiment-authority.ts
@scripts/lib/v1-38-lean-baseline-match.ts
@scripts/lib/v1-38-lean-container-match-session.ts
</context>

## Binding scope and time

Approved anchor1791727783000 /2026-10-11T14:09:43UTC; hardstop1791733183000 /15:39:43UTC; continuous carry379841903ms; cumulative cap385241903ms. ALL research/planning/source/review/fix/tests/preparation/commit/wait/run/verification/closure costs count. Reserve1860000ms plus Match600000ms makes latest entry14:58:43UTC. Source-gate closure14:45UTC is a planning TARGET, not a new binding expiry; missing required gates or inadequate remaining full reserve prohibits dispatch. Never widen deadlines or remove gates to meet a target.

Exactly ONE fresh private full current-rules Match: tactical-0 bottom versus cold-opponent top, canonical Smoke, absolute bottom initiative, frozen original two-Match seed and the same two source snapshots from `.strategy-lab/lean-correction-supervisor-baseline-20261006-v6`. No source generation, selection, training, response search, second game, retry or standalone probe. Canonical new artifact `.planning/artifacts/v1.38-phase-265-private-match-allocation-v2.json`; fresh `.strategy-lab/lean-private-matches-v2/<full-allocation-root-without-sha256-prefix>` store. The old allocation72badb26/result2bd0e8ba, all old retained bytes and unique reader remain immutable and closed.

Unchanged guest1000/startup2500/host5000/Match600000ms, RAM3000000000B, scratch2000000000B, retained12000000000B, total15000000000B, cumulative300Matches. Carry41 prior charges, older aggregate29970432B, probe65536B, old route360448 allocatedB, and actual bounded prefix/new-store physical costs without refunds or historical materialization. Authenticate exact old canonical allocation/result/entry/debit/terminal joins and existing retained-verification identity with bounded metadata reads only; never invoke the old reader again. Do not double-count carried components already included by authenticated aggregate accounting, and do not subtract them without proof. Historical peaks remain unknown.

## Narrow schema and integration contract

ROOT already captured the strict owned baseline in ONE-MATCH-DIAGNOSTIC-VALIDATION-v1 (closed14:17:34UTC, exit2,13 inherited diagnostics). References below to capturing the baseline are satisfied by that existing record; do not rerun the baseline.

Diagnostic exact keys are schemaVersion=`lean-private-match-diagnostic-v2`, availability, originAvailability, stage, reason, code, identity, invocationRoot, requestId, inputRoot, method, ordinal; maximum4096UTF8bytes. Both availability fields use available/unavailable. Stage uses exactly stream_exchange/outer_frame/inner_response/executor/system_failure/unknown; reason uses existing LeanPrivateFailureOrigin finite reason whitelist plus unknown; code uses SUBPROCESS_SYSTEM_FAILURE_CODES plus UNKNOWN. Available evidence requires nonnull exact projected identity/join fields and exactly one charged system_failure accounting row. No evidence requires all join fields null, UNKNOWN code, unknown stage/reason and both availability fields unavailable. Available evidence without origin keeps actual code/all joins, with originAvailability unavailable and stage/reason unknown. Existing derived composer diagnostic maps origin.stage into reason, not original origin.reason: implement a V2-only narrow projection from authenticated getFactoryPrivateDiagnostic when needed, leaving existing derived diagnostic and V1 semantics unchanged.

Existing composer already returns `diagnostic`; producer omits it and native `systemFailure.code`. Repair that return-to-producer seam first. No edit to `run-v1-38-lean-experiment.ts`, factory/planner/runtime packages or legacy observer is planned: only if direct source evidence establishes necessity may ROOT request a scoped ownership/checker amendment before any extra path edit.

The v2 failure evidence has exact versioned keys and bounded diagnostic. Separate `availability` of authenticated failed evidence from `originAvailability`: missing private origin must NOT erase a verified actual finite code. For actual failed evidence, retain allowlisted `SUBPROCESS_SYSTEM_FAILURE_CODES` code plus exact projected identity, invocationRoot, bounded requestId, inputRoot, method and provider-local ordinal. If authenticated origin exists, retain its finite existing stage/reason after its identity joins; otherwise stage/reason are unknown and originAvailability unavailable while actual code and failed-row identity survive. If no actual authenticated failed evidence exists, availability unavailable, code UNKNOWN, stage/reason unknown and nullable identity/join fields null. Never manufacture an initiating physical cause from compact SUPERVISOR_FAILURE/CLEANUP_STOP. Successful evidence remains unchanged except explicit v2 envelope/version.

Select exactly one actual charged failed accounting row using the existing provider verification and identity-preserving private accessor; multiple ambiguous matches or changed identity fail closed. Bind diagnostic into evidence body, terminal body/raw root and result terminal anchors before discarding private objects. Retained reader exact-checks schema/version/finite whitelists, provider/source/debit/runtime identity and unique failed-row joins; recomputes diagnostic/terminal/result commitments. Re-rooted evidence cannot bypass stale result anchors. No exception text, source, objectives, memory, runtime input/output, stdout/stderr or arbitrary strings. Existing compact-board row schema, bounds/start/continuity/outcome/accounting checks and caps remain; this is not full Chronicle reconstruction or engine-semantic proof.

<tasks>
<task type="auto" tdd="true">
<name>Task 1: Add separate allocation-v2 authority and bounded immutable carry</name>
<files>scripts/lib/v1-38-lean-experiment-authority.ts, scripts/lib/v1-38-lean-experiment-authority.test.ts, scripts/lib/v1-38-lean-container-match-session.ts</files>
<behavior>
- Legacy V1 allocation/window/count/context/issuer and zero-Match probe behavior remain byte/behavior compatible; neither route's handles grant the other route.
- Genuine v2 capacity/debit/context grants exactly two one-use ordered seat authorities for ordinal0 only; copied, forged, stale, cross-process, cross-version and repeated grants refuse before provider creation.
- Wrong carry roots/bytes/41-charge count, canonical path/store/sourceHead/Git lineage, insufficient reserve and prefix substitution refuse.
</behavior>
<action>Before editing, capture the strict owned baseline described below once. Add explicit v2 allocation/window/resource/capacity/admission/debit/context/issuer/checkpoint/close variants inside the existing authority owner; use separate opaque WeakMap route state and exact schema discrimination, never retag a v2 allocation as v1 or widen v1 predicates/constants. Bind one ordinal0 slot with tactical-0 bottom/cold-opponent top, original frozen seed/Smoke and exact admitted source roots. Canonical allocation-v2 carries new approved window and authenticated historical41 charges and bounded physical costs specified above. Reuse bounded safe-fd/fsync/canonical primitives; authenticate old spent evidence without recreating a journal or executing a historical reader. Capacity must be fresh SAME-PROCESS, one-use, binding allocation/store/current resource observation and full31-minute reserve plus remaining600000ms; record durable debit before either provider. Reuse existing ordered factory→planner→session startupV8 grant machinery only through newly authenticated v2 issuance. In container Git owner add a separate bounded v2 metadata export or explicit versioned route with exact artifact/owned-source whitelist; preserve V1/probe Git entry behavior,1500ms timeout/per-call caps/16MiB aggregate prefix bounds, safe paths, committed-byte checks and no dynamic process bypass. Add inert connected authority/Git fixtures for real issuance/claims/debit and all refusals; no canonical allocation/preparation/runtime. Per D-01/D-02/D-04/D-05/D-10/D-22/D-28 never refund, reopen or widen a consumed authority.</action>
<verify><automated>./node_modules/.bin/vitest run scripts/lib/v1-38-lean-experiment-authority.test.ts scripts/lib/v1-38-lean-baseline-authority.test.ts</automated></verify>
<done>Separate v2 opaque authority/carry/Git contracts pass connected inert tests; all legacy constants and spent-route meanings remain unchanged.</done>
</task>

<task type="auto" tdd="true">
<name>Task 2: Preserve actual finite failure code through composer, producer and retained reader</name>
<files>scripts/run-v1-38-lean-private-matches.ts, scripts/run-v1-38-lean-private-matches.test.ts, scripts/lib/v1-38-lean-baseline-match.ts, scripts/lib/v1-38-lean-baseline-match.test.ts</files>
<behavior>
- Actual composer→producer→terminal/result→actual reader fixture preserves authenticated native code when origin is absent; absent evidence remains UNKNOWN honestly.
- Available origin joins the same provider/invocation/request/input/method/ordinal; duplicate failed-row candidates or tampered joins/versions/codes/extra keys refuse.
- Modified diagnostic with recomputed inner roots but stale terminal/result anchors refuses; complete reader is read-only and private sentinels never persist.
- V2 entry has one slot, durable debit before existing canonical composition, no fallback/retry; V1 parser/default/reader remains unchanged.
</behavior>
<action>Wire explicit metadata/prepare/entry/verify v2 mode with no default or import-time execution, preserving old parser/default behavior. Extend shared composer input through the new opaque context/issuer rather than caller callbacks, fabricated legacy ledger or arbitrary scenario. Keep exact current source/compiler/native admission/provider identity, MATCH_KERNEL, close/register/unregister/finally, startupV8 and runtime limits. Capture actual failed evidence after its trusted provider verification and derive finite private diagnostic with existing accessor while provider identity is available; pass narrow authenticated projection beside existing composer diagnostic. Preserve actual native code independently of origin availability as specified above; do not opt into unrelated legacy observers or host-attribution frameworks. Add versioned strict evidence/terminal/result failure schema and unique failed-row verifier in runner, producer projection before private disposal, exact root/version/identity checks and allowlisted output only. Reuse existing finite failure-terminal path, board evidence contract and bounded safe store reader; keep successful outcome requirements and failure classification unchanged. V2 inventory is allocation.json, entry.json, ledger.ndjson, pair-0.json, debit-0.json, terminal-0.json, optional replay-0.ndjson and result.json only, with0700store/0600regular singlelink files; no ordinal1, appended retry or extra artifacts. Actual source fixtures must exercise composer return through the real producer and real retained reader, not just a hand-authored diagnostic validator. Add missing/unknown origin, actual-code-without-origin, unavailable evidence, wrong identity/method/ordinal/request/input/invocation/debit/source, invalid code/schema/version/extra-key, duplicate failed row and commitment tamper/privacy fixtures; preserve existing compact-board tamper cases. Per D-02/D-03/D-04/D-06/D-25/D-27/D-28 retain unknown cause, truthful failure and unchanged rules/runtime/privacy boundaries.</action>
<verify><automated>./node_modules/.bin/vitest run scripts/run-v1-38-lean-private-matches.test.ts scripts/lib/v1-38-lean-baseline-match.test.ts scripts/run-v1-38-lean-private-probe.test.ts</automated></verify>
<done>Real producer-to-reader connected inert tests preserve actual finite code without origin and reject all joined/anchored/schema/privacy tampering; one-slot v2 wiring is separate from immutable legacy route.</done>
</task>

<task type="auto">
<name>Task 3: Close independent source gates then one unique ROOT route and retained reader, or stop</name>
<files>.planning/artifacts/v1.38-phase-265-private-match-allocation-v2.json, .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-ONE-MATCH-DIAGNOSTIC-SUMMARY-v1.md, .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-ONE-MATCH-DIAGNOSTIC-RETAINED-VERIFICATION-v1.md</files>
<action>Source author closes commands and releases ownership; obtain independent review, scoped fixes, independent re-review as necessary, ROOT validation and DISTINCT source verification before any metadata/preparation/committed allocation/root entry. Gates require zero new owned diagnostics/contract/privacy blockers; report the13 inherited strict diagnostics by exact identity/location, never all-green from equal counts. No heavy competing work. After gates close and enough binding time remains, ROOT invokes v2 metadata to freeze exact existing candidate/opponent roots without compiler or Strategy execution; one prepare validates them and creates the fresh canonical allocation/store. Commit immutable allocation as direct child of fixed sourceHead before unique ROOT entry; authenticate committed blob/parent, empty fresh ledger and fd ownership. ROOT entry freshly passes SAME-PROCESS capacity before one durable debit and dispatch; no standalone probe, retry, second Match or fallback path. Hold source+HEAD fixed through terminal/cleanup and ONE unique appropriate actual v2 retained-verifier invocation by independent owner, with no old reader invocation. Record allocation/entry/debit/terminal/result/diagnostic roots, versions, raw anchors, exact inventory/allocated costs, current attempt0or1, unused0or1 and cumulative41or42 charges, runtime/resource/elapsed/cleanup observations, unknown historical peaks, reader count/exit/status and honest limits. Failure remains failure even when retained verification accepts its integrity; missing evidence/gates/reserve or hardstop produce gaps_found/feasibility_not_established and no dispatch/retry. Close all commands/owners and release hold. Per D-01/D-02/D-05/D-22/D-26/D-27/D-28 no LEAG/fullbaseline/fullChronicle/freeze/formation/holdout/public/counting/production/Phase265/milestone completion follows.</action>
<verify><automated>./node_modules/.bin/vitest run scripts/run-v1-38-lean-private-matches.test.ts scripts/lib/v1-38-lean-experiment-authority.test.ts scripts/lib/v1-38-lean-baseline-match.test.ts</automated></verify>
<done>Independent source gates precede either one source-bound one-charge route with one actual retained reader or honest safe nonexecution; old artifacts remain untouched and all ownership is released.</done>
</task>
</tasks>

<threat_model>
| Boundary | Description |
|---|---|
| Canonical allocation/Git/history→HOST | Substitution or stale-route reuse can widen authorization |
| Hostile Strategy→supervised runtime | Execution must remain inside existing native sandbox |
| Private provider evidence→retained reader | Diagnostic injection, forged joins or private text can corrupt conclusions |

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|---|---|---|---|---|---|
| T-265-OM-01 | Tampering | v2 authority/history/Git | high | mitigate | Separate exact-version opaque handles, bounded authentic carry, canonical committed lineage and immutable v1 |
| T-265-OM-02 | Elevation | seat issuance/runtime | high | mitigate | Durable one debit before two single-use ordered native grants; no caller issuer or V1 substitution |
| T-265-OM-03 | Denial | resource/window | high | mitigate | Fresh same-process reserve admission, unchanged caps, bounded writes/cleanup and no retries |
| T-265-OM-04 | Information | diagnostics/notes | high | mitigate | Exact finite code/stage/reason whitelist and hash identity joins; no raw private payload |
| T-265-OM-05 | Repudiation | failure evidence | medium | mitigate | Actual producer→reader tests, unique failed-row joins and terminal/result raw commitment anchors |
</threat_model>

<verification>
Run focused tasks' tests serially with installed binaries only, targeted commands under60seconds and bounded polling; no package installs/full-suite repetition. Configured types: `./node_modules/.bin/tsc -b packages/runtime-js/tsconfig.json --pretty false`. Boundary scan: `./node_modules/.bin/tsx scripts/check-v1-38-factory-boundaries.ts`; do not widen its allowlist. Strict owned baseline BEFORE edits and final AFTER review/fixes use the SAME command: `./node_modules/.bin/tsc --ignoreConfig --noEmit --types node --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes --skipLibCheck --pretty false scripts/run-v1-38-lean-private-matches.ts scripts/run-v1-38-lean-private-matches.test.ts scripts/lib/v1-38-lean-experiment-authority.ts scripts/lib/v1-38-lean-experiment-authority.test.ts scripts/lib/v1-38-lean-baseline-match.ts scripts/lib/v1-38-lean-baseline-match.test.ts scripts/lib/v1-38-lean-container-match-session.ts`. Compare normalized diagnostic file/code/message identities and mapped locations, disclose13 inherited diagnostics, reject any new owned diagnostic even if total count matches. Source verification is distinct from empirical retained verification. No canonical command executes in source-only tests; inert fixture provider/kernel doubles never start runtime. Discovery uses current established source seams and no new external dependency.
</verification>

## Scoped multi-source coverage audit

| Source | Item | Coverage/disposition |
|---|---|---|
| GOAL | Approved one-Match finite diagnostic subgoal | Tasks1–3 cover; entire265goal and original Plan16 remain incomplete |
| REQ | LEAG-01,02,03,04,05,07 | Immutable/safe/source/runtime/accounting prerequisites addressed; no requirement completion claimed |
| REQ | LEAG-06,08,09 | Original portfolio/strength/finalist gates remain unchanged outside this diagnostic approval |
| RESEARCH | Missing composer diagnostic/code, strict finite unknown/schema/identity/privacy | Task2 covers; actual authenticated code survives absent origin, correcting research's overly broad unavailable coupling |
| RESEARCH | Separate v2 carry/admission/Git/source/root seams | Task1 covers with seven existing source paths; legacy experiment/runtime edits need demonstrated necessity and checked amendment |
| RESEARCH | Gate sequence/time/single entry/reader/no cause inference | Task3 and binding section cover;14:45 target is not binding expiry |
| CONTEXT | D-01–06,10,22,25,27,28 | Explicit cited actions preserve immutable safety/accounting/rules/privacy and closed routes |
| CONTEXT | D-07–09,11–21,23–24,26 | Existing league scientific/freeze scope unchanged and unfulfilled, not reduced by this separately approved diagnostic |
| APPROVAL | Fresh90minutes/carry379841903/cap385241903/one Match/zero probes/all caps | Binding section and all three tasks cover; latest entry14:58:43UTC/hardstop15:39:43UTC |

<success_criteria>Checked source gates and honest diagnostic behavior close; either one fresh bounded Match/one reader or no-dispatch stop is recorded. Nothing reopens consumed authority, attributes unknown cause or grants phase/freeze/completion credit.</success_criteria>
<output>Create safe ONE-MATCH-DIAGNOSTIC-SUMMARY-v1 and the unique independent retained-verification note only if that actual reader runs. Planner owns this candidate file only and does not commit, edit source, prepare, run tests/runtime or change historical/planning state.</output>
