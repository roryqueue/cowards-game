---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "117"
research_type: additive_authoritative_v2_v4_readiness_consumer_correction
status: complete
decision: plan117_closed_live_v11_then_plan118_independent_review_then_revised_plan110
researched: 2026-08-30
---

# Phase 262 Plan 117: Minimal Additive Authoritative-v2/v4 Readiness-Consumer Correction

## Research Question

What is the smallest safe correction after the clean inert supplement-v3 publication when historical live-v10 still hardcodes superseded Plan-114 v1, while preserving live-v10, Plans 114-116, the supplement publication, the unchanged sealed pair, the historical producer, and every frozen no-capacity/no-authority boundary?

## Decision

**Add one closed `live-v11` owner in Plan 117, independently review its exact committed executable closure in Plan 118, and then revise Plan 110 to invoke only that reviewed successor exactly once.**

```text
immutable live-v10 / Plan-114 v1 and v2 history
                         +
authoritative Plan-116 v4 review (f03f0e05 / zero findings / 9 of 9)
                         +
exact inert supplement-v3 (a1e693a2 / root 3a653c44)
                         +
unchanged sealed B3 pair and zero counters
                         |
                         v
Plan 117: additive closed live-v11 + tests
  - authenticates authoritative Plan-114 v2 and Plan-116 v4
  - consumes the exact committed supplement-v3 and unchanged pair
  - defines only a future Plan-118 review join
  - invokes no readiness or live effect
                         |
                         v
Plan 118: independent exact-source executable review
  - rederives the full Plan-117 closure without importing acceptance decisions
  - runs producer-incapable CLI and value modes only in disposable worktrees
  - publishes one literal-zero-or-blocked payload / REVIEW / carrier
                         |
                         v
revised Plan 110: sole live owner invocation
  - read-only live-v11 readiness preflight
  - exactly one live-v11 production selector invocation
  - unchanged historical producer owns every effect and terminal outcome
```

This is additive. It does not edit or reinterpret reviewed history, does not manufacture a new authorization literal, and does not create a second effect producer.

## Exact Verified Gap

Current live-v10 cannot consume the authoritative chain now present on disk. Its immutable path table resolves:

- `.planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-payload-v1.json`;
- `262-114-REVIEW.md`;
- `.planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-carrier-v1.json`.

`authenticateFutureCustody` locates that v1 three-add publication, derives the v1 prospective contract, and compares committed supplement-v3 against that obsolete contract. The later authoritative Plan-114 v2 publication, the stable Plan-116 v4 review, and the exact Plan-109 supplement publication are outside its executable gate. Therefore current `--check-reviewed-live-ready` and `--run-reviewed-bounded-live-envelope` remain unauthorized and must not be invoked. [VERIFIED]

The mismatch is not a defect in any immutable publication:

- Plan-114 v1 is preserved superseded history;
- Plan-114 v2 is the authoritative literal-zero live-v10 review;
- Plan-116 v1-v3 are preserved superseded/ineligible review history;
- Plan-116 v4 is the authoritative stable adapter review;
- supplement-v3 is the exact clean inert publication derived from those upstream semantics.

Editing live-v10 or either historical reviewer would invalidate their reviewed source identities. Treating Plan-116 v4 as direct execution authorization would also exceed its explicit `authorizesExecution:false` and Plan-109-only eligibility. [VERIFIED]

## Why a Readiness-Only Adapter Is Insufficient

A shim that merely returns `ready` and then calls live-v10 does not close the effect boundary. Live-v10 would still execute its own obsolete v1 `authenticateFutureCustody` immediately before the producer and fail. Removing or bypassing that internal check would create an unreviewed route to `runV138V3ProductionLive`, while modifying live-v10 would rewrite reviewed history.

The minimal safe unit is therefore a new closed owner that contains both the corrected pre/post custody join and the at-most-once call to the unchanged producer. It can reuse low-level canonical JSON, Git, path-stable custody, post-run validation, and producer-outcome primitives, but it must not delegate its authority decision to live-v10 or import Plan-115/116 acceptance verdicts. [PRESCRIPTIVE]

## Immutable Authoritative Inputs

### Live-v10 and Plan-114 history

| Identity | Exact value |
|---|---|
| live-v10 reviewed source commit | `ba1f8ddb4d701762d5d443f41edcbb691bb0eda5` |
| live-v10 reviewed closure root | `sha256:8929dd2d2d8c9c72c293a7b9e41e722ef274a1296160e877685ce0956969b852` |
| Plan-114 v1 publication | immutable superseded three-add history |
| authoritative Plan-114 v2 publication | `34bc94ec4e348f71e6055a091d60a505cffc0d79` |
| Plan-114 v2 payload root | `sha256:d4ca10f333598968c0f9b9d7729d5193c981f501a8284cdd5626f2f2b5a518ac` |
| Plan-114 v2 review root | `sha256:f802ac51d79702f1163fd8d5151b2b7384e2d43de1d97f15ddd74f39538a79ee` |
| Plan-114 v2 carrier root | `sha256:8ddd2dc65d0601f8c6d027e225c16e8ea81574f197f877dd4f3c1830f5563c26` |
| final corrected Plan-114 source | `1314e24b43f9469e0f6d425c007d88ca2fca9716` |
| final clean Plan-114 review | `92415ea08ccddd2c8fae3c8fc922078d14c589c9` |

Plan-114 v2 records zero findings, 6/6 actual non-live modes, `plan109Eligible:true`, `authorizesExecution:false`, fresh charged/accepted `0/0`, and denied downstream authority. Live-v11 must authenticate both v1 and v2 as exact history, require v2 as authoritative, and never fall back to v1. [VERIFIED / PRESCRIPTIVE]

### Plan-115/116 custody and stable v4

| Identity | Exact value |
|---|---|
| Plan-115 exact source commit | `bb1d639ac4ba92c9a23ecd0356bc5c139ed4ea48` |
| Plan-115 adapter/test/native blobs | `de32acd9a664a1efde3390827b59121231e384ee` / `2fa32f8c69a5515f4d1e0e31b9c93a23c9c3a21f` / `a733b6ce9239d02e522a78ad83930037e644a4d0` |
| Plan-116 v4 corrected source commit | `9713e513a3fb572adf14b0458b1c610d2fdcd16a` |
| Plan-116 v4 publication commit | `f03f0e05539a1591b91000fc9d35b8381a082ec2` |
| Plan-116 v4 regression commit | `65b05d236fcceb8761385640ef093198572c8029` |
| reviewed closure root | `sha256:56c56ea16b52996c1e63a048c7215f7f9fabe12b790f12e9fa63c4fffb556857` |
| observation root | `sha256:933f1b4607dabc6981c69eaa27c43f1b0f55718320b4c48766e3e20818c497eb` |
| disposable execution root | `sha256:65ea2ff5ca63fec76197020ac0eee11f1af4965f8df950105221d5d9933325a6` |
| payload / review / carrier roots | `sha256:251b01b973f1abde239089e6e49dc6c38c74803a273fa6f104a6cdda156de1d7` / `sha256:d238645459920ba74d9e8265f5b0c0609e636f86d027a2e7f473058f746aedf3` / `sha256:3d665d7f562b575a9b2ffdeafbe1458922e2687bd75b32027b39cb67c0a7632b` |

V4 alone is authoritative: zero findings, 9/9 actual modes, exact subject custody, exact supplement root, no readiness/live/producer invocation, all counters zero, and downstream denied. V1-v3 remain immutable and ineligible. Live-v11 must authenticate the complete version history and v4's current raw-Git/current-byte/no-rewrite custody; it must not reinterpret `plan109Eligible:true` as live authority. [VERIFIED / PRESCRIPTIVE]

### Exact supplement-v3 publication

| Identity | Exact value |
|---|---|
| publication commit | `a1e693a2ae528ba06597d3262041d6f947ecbeca` |
| Git mode / blob | `100644` / `f5953ea37f8648fa85790f97f536d92f94f999e7` |
| file SHA-256 | `sha256:16c8cd800340047222ecd8a958c40c5be6997c4281ec15b00a182fb3cc5e819b` |
| supplement root | `sha256:3a653c44db658a89250d4b90d9a3bb086c99ac3fc04ebf8c7107bc66fd4f8e4b` |

The publication adds exactly one path, current bytes equal the raw Git blob through current HEAD, and the clean Plan-109 review found no issue. Its fixed body binds authoritative Plan-114 v2, live-v10's reviewed source/closure, the unchanged pair, and the exact zero-counter/false-authority state. Plan-115/116 identities intentionally remain external eligibility custody and must not be inserted into or supersede the supplement body. Supplement-v1/v2 remain absent. [VERIFIED]

### Unchanged pair, stop, and effect boundary

- pair commit: `8080ff66a0880db25db227d23e7e7a0884a79b56`;
- seal root: `sha256:ec1cb108c8fcdd710090e72ccec32ed58574a06d8970a2b44b1bb6f7ec3ea752`;
- envelope root: `sha256:f6a92d5ddfc6b10fe5a0600927e0427b112bf0b49f2d03d895a229642456904a`;
- protected-history root: `sha256:77e0e71f62ec4abd997f1df2c1fc9bf1db7b95247404f78b558a634cdc1ec57d`;
- Plan-93 remains the immutable incomplete pre-start stop;
- all five counters remain exactly zero before the sole live call;
- journal, lock, private receipts, terminal, reproduction-v17, disposition, correction, activation, readiness, and lifecycle outputs remain absent before Plan 110.

No Plan 117 or 118 action may create an envelope, capacity, counter reset, route identity, attempt identity, authorization literal, producer output, or downstream artifact. [PRESCRIPTIVE]

## Plan 117: Additive Closed Live-v11

### Files

- `scripts/run-v1-38-bounded-retry-envelope-v3-live-v11.ts`
- `scripts/run-v1-38-bounded-retry-envelope-v3-live-v11.test.ts`

No artifact, review, supplement, envelope, producer output, roadmap, state, or historical source file belongs in Plan 117.

### Closed responsibilities

Live-v11 should expose the same narrow five-mode shape as live-v10:

1. `--check-source-only`;
2. `--check-prospective-custody`;
3. `--check-post-run-custody`;
4. `--check-reviewed-live-ready`;
5. `--run-reviewed-bounded-live-envelope`.

The first three are producer-incapable. The last two are inspectable but must never be invoked during Plan 117 or Plan 118. The CLI root is fixed from `import.meta.url`; test injection may select a repository root and output sink only. There is no injected producer, readiness verdict, renderer, generic command, output path, or bypass. [PRESCRIPTIVE]

`--check-source-only` must independently authenticate immutable live-v10/Plans 114-116 history, exact authoritative v2/v4 publications, the exact one-file supplement-v3 publication, the unchanged pair/stop/protected history, zero counters, supplement-v1/v2 absence, and pre-effect destination absence.

`--check-prospective-custody` must derive the future Plan-118 candidate review contract in memory without writing it. `--check-post-run-custody` must require the exact candidate/canonical Plan-118 trio and validate either no-effect state or the historical producer's bounded outcome. `--check-reviewed-live-ready` is a read-only canonical preflight that additionally requires exact committed literal-zero Plan-118 evidence and standing operator authority; it mints no new literal.

`--run-reviewed-bounded-live-envelope` must:

- run that same corrected readiness authentication immediately before effects;
- call only the unchanged `runV138V3ProductionLive(repoRoot, ...)` at most once;
- leave the historical producer as sole owner of the existing journal/private/terminal and conditional reproduction-v17 destinations;
- repeat authoritative v2/v4, supplement, pair, local closure, and post-run custody checks in a finally-equivalent path;
- preserve producer and custody errors without masking either;
- reuse the existing bounded non-pass/success and reproduction-v17 semantic validators;
- publish no admission verdict, Route-11, lifecycle, new envelope, capacity, reset, route/attempt identity, literal, or downstream authority.

The readiness predicate is exact Plan-118 literal zero plus exact source/custody semantics, not Plan-116's Plan-109 eligibility bit. Standing D-23R/D-28R operator authorization remains external and unchanged. [PRESCRIPTIVE]

### Independent implementation boundary

Live-v11 may reuse low-level primitives and the unchanged producer, but it must independently authenticate fixed v2/v4/supplement values. It must not import:

- Plan-114, Plan-115, or Plan-116 verdict/eligibility decisions;
- live-v10's obsolete `authenticateFutureCustody`;
- a reviewer-owned acceptance result or supplement renderer;
- any caller-supplied production callback.

It may reuse live-v10's already reviewed value-level post-run and reproduction checks only where their semantics are independent of the obsolete v1 path table. Any such import becomes part of Plan-117's recursive reviewed closure. [PRESCRIPTIVE]

### TDD and verification boundary

- RED reproduces the current live-v10 v1/v2 mismatch against exact committed supplement-v3 without invoking readiness or production.
- GREEN makes producer-incapable live-v11 source/prospective/post-no-effect modes consume v2/v4/supplement-v3 successfully in disposable worktrees.
- Mutations cover version fallback, every root/commit/blob/mode/current byte/no-rewrite relation, v4 findings/mode count/eligibility scope, supplement fields and false authorities, pair/stop/history/counters, recursive dependencies/toolchain/native inputs, candidate Plan-118 trio, and forbidden destinations.
- Tests prove readiness and production selectors are unreachable through every producer-incapable selector and that producer call count remains zero.
- Historical live-v10, Plans 114-116, Plan-109 supplement bytes, pair bytes, and all effect destinations remain unchanged.

Plan 117 ends with a committed source/test closure and source-only verification. It grants only Plan-118 review eligibility.

## Plan 118: Independent Executable Review of Exact Plan-117 Source

### Files

- `scripts/check-v1-38-plan-262-118-live-v11-custody-v1.ts`
- `scripts/check-v1-38-plan-262-118-live-v11-custody-v1.test.ts`
- `.planning/artifacts/v1.38-plan-262-118-live-v11-custody-review-payload-v1.json`
- `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-118-REVIEW.md`
- `.planning/artifacts/v1.38-plan-262-118-live-v11-custody-review-carrier-v1.json`

The reviewer must independently derive the exact committed Plan-117 source commit/tree/parent, source/test modes/blobs/current bytes, recursive imports, package/toolchain/native inputs, reviewed portable closure, and current local execution closure. It must independently authenticate authoritative Plan-114 v2, all Plan-116 versions with v4 alone authoritative, exact supplement-v3 publication, unchanged pair/stop/history/counters, and no-effect/no-authority semantics. It must not import live-v11 acceptance decisions. [PRESCRIPTIVE]

In owner-controlled disposable linked worktrees, the reviewer should commit a candidate Plan-118 trio and execute six actual modes:

1. live-v11 source-only;
2. live-v11 prospective custody;
3. live-v11 post-run custody with no effect;
4. complete bounded non-pass value validation;
5. matched bounded success value validation;
6. exact reproduction-v17 root/schema/privacy/authority/journal join validation.

The readiness and production selectors must be source-inspected and mutation-tested but never invoked. Candidate fixtures must be producer-incapable and may exist only inside disposable worktrees. No canonical journal, private receipt, terminal, or reproduction file may be created. [PRESCRIPTIVE]

Findings are sorted and rooted. Observable source/custody/semantic rejection produces deterministic blocked evidence; unclassified process-integrity failure publishes nothing. Literal zero across all completed modes alone may publish one exact non-recursive payload/REVIEW/carrier trio with `plan110Eligible:true`, `authorizesExecution:false`, zero calls/counters, `liveInvoked:false`, and downstream denial. Blocked evidence sets eligibility false. [PRESCRIPTIVE]

After its dedicated exact-three-add `100644` commit, a read-only checker must rederive the trio, authenticate raw Git blobs/current no-follow bytes, ancestry, no rewrite, source separation, and all actual modes from a clean later HEAD. Historical v1-v4 review files and supplement-v3 remain immutable.

Plan 118 grants only revised Plan-110 eligibility. It does not authorize execution by itself and must not publish another supplement.

## Revised Plan 110: Sole Live Owner

Current `262-110-PLAN.md` must remain blocked until Plan 117 and a literal-zero Plan 118 publication are complete and cleanly reviewed. Then revise it to depend on Plan 118 and replace every Plan-114/live-v10 command with exact live-v11 custody.

Required sequence:

1. Authenticate the exact committed Plan-118 trio and Plan-117 source closure through the independent Plan-118 checker.
2. Run the unchanged v7 sealed-pair read-only checker.
3. Invoke live-v11 `--check-reviewed-live-ready` once as the final no-effect preflight.
4. Invoke live-v11 `--run-reviewed-bounded-live-envelope` exactly once. Do not invoke live-v10.
5. Run live-v11 `--check-post-run-custody` read-only and record the terminal/journal/reproduction result.

Plan 110 remains the sole live execution owner. Plan 117/118 create no effects, and live-v11 is only the reviewed wrapper: the unchanged historical producer remains the sole effect implementation. Exact 540 success atomically publishes the already specified unauthoritative reproduction-v17 plus terminal; every non-pass leaves reproduction-v17 absent. Plan 94 remains the sole adjudicator and Route-11 owner. [PRESCRIPTIVE]

No new envelope, capacity, reset, route identity, attempt identity, authorization literal, disposition, Route-11, readiness/lifecycle publication, public/product/production authority, archive, or tag is added. The supplement remains v3; there is no supplement-v4. [PRESCRIPTIVE]

## Dependency and Wave Revision

| Wave | Plan | Responsibility | Dependency |
|---|---|---|---|
| 102 | 262-117 | Add closed authoritative-v2/v4 live-v11 owner; no effect | clean Plan-109 supplement-v3 publication |
| 103 | 262-118 | Independently review exact committed Plan-117 closure | exact Plan-117 source commit |
| 104 | 262-110 revised | Invoke only reviewed live-v11 exactly once | literal-zero committed Plan-118 trio plus standing authority |
| 105 | 262-94 revised | Independently adjudicate terminal/reproduction evidence | Plan-110 terminal evidence |
| 106 | 262-95 revised | Stage-1 readiness and verification | Plan-94 verdict |
| 107 | 262-106 | Stage-2 lifecycle finalization | Plan-95 readiness |

ROADMAP, STATE, and Plan 110 should be revised during planning, not by this research-only task.

## Threat Model

| Threat | Severity | Required containment |
|---|---|---|
| Readiness shim bypasses live-v10's internal gate | critical | Use a closed live-v11 owner with corrected pre/post authentication around the sole producer call. |
| Plan-114 v1 fallback | critical | Authenticate v1 as history, require exact v2 as authoritative, fail closed on absent/partial/drifted v2. |
| Plan-116 v4 treated as execution authority | critical | Treat it only as exact supplement publication custody; require independent Plan-118 literal-zero review for Plan-110 eligibility. |
| Reviewer self-authorization | critical | Plan 118 independently rederives source and semantics and never imports live-v11 decisions. |
| Disposable review crosses the live boundary | critical | Never invoke readiness/production; use producer-incapable CLI and value modes only. |
| Duplicate or injected producer call | critical | One closed export, no producer injection, static single call site, at-most-once runtime proof. |
| Source changes between preflight and outcome | critical | Recompute local closure and authoritative custody in a finally-equivalent post path. |
| Supplement schema inflation | high | Consume exact supplement-v3 bytes; publish no successor supplement and add no capacity/literal fields. |
| Pair or counter reinterpretation | critical | Require exact B3 pair, sealed-inactive pre-state, zero counters, and existing producer accounting. |
| Producer outcome grants admission | critical | Preserve exhaustive false authority; Plan 94 alone adjudicates and owns Route-11. |
| Private receipt disclosure | critical | Preserve existing owner-only no-follow storage and public-safe evidence boundaries. |

## Validation Architecture

### Plan 117

```text
focused live-v11 tests
live-v11 --check-source-only
disposable prospective/post-no-effect checks only
TypeScript
git diff --check
historical source/publication byte equality
canonical producer/downstream absence
```

### Plan 118

```text
independent reviewer mutation tests
six completed producer-incapable disposable modes
literal-zero-or-blocked review rendering
dedicated exact-three-path publication commit
read-only committed review authentication from later HEAD
TypeScript
git diff --check
readiness/live invocation count zero
canonical producer/downstream absence
```

### Revised Plan 110

```text
Plan-118 committed review authentication
v7 unchanged-pair check
live-v11 --check-reviewed-live-ready
exactly one live-v11 --run-reviewed-bounded-live-envelope
live-v11 --check-post-run-custody
terminal/journal/reproduction bounded accounting proof
Plan-94/downstream absence
```

## Rejected Alternatives

### Edit live-v10 to point at v2/v4

Rejected. It rewrites an independently reviewed historical executable and invalidates Plan-114 custody.

### Add only a readiness adapter before calling live-v10

Rejected. Live-v10 immediately repeats its obsolete v1 check; bypassing it disconnects reviewed readiness from the effect call.

### Call the historical producer directly from revised Plan 110

Rejected. That creates an unreviewed effect boundary without a closed, independently reviewed owner.

### Treat Plan-116 v4 as sufficient live review

Rejected. It reviewed the source-only supplement publisher and explicitly grants only Plan-109 eligibility with execution false.

### Publish supplement-v4 or a new authorization literal

Rejected. The exact supplement-v3 is clean and semantically correct. The defect is only its executable consumer; standing authority already exists.

### Let Plan 118 invoke readiness or production in a disposable checkout

Rejected. A review must never cross the live boundary. Producer-incapable CLI and value modes provide the required evidence.

## Non-Authority Statement

This research writes no executable, review trio, supplement, producer output, envelope, capacity, reset, route/attempt identity, authorization literal, disposition, Route-11, readiness, lifecycle, downstream artifact, archive, or tag. It does not invoke live-v10 or any readiness/production selector. ADMIT-03 remains blocked at fresh `0/540`; Plan 110 and every later plan remain denied until the Plan-117/118 correction is planned, implemented, independently reviewed, and incorporated into a revised Plan 110.

## Sources Inspected

- `scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts` — obsolete Plan-114 v1 path table, internal future-custody join, sole producer call, pre/post closure, and CLI surface.
- `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.ts` — authoritative v4 schema, source-separated custody, actual mode contract, and no-effect boundary.
- `.planning/artifacts/v1.38-plan-262-116-supplement-v3-adapter-review-payload-v4.json` — exact v4 subject, roots, 9/9 observations, zero findings, and Plan-109-only eligibility.
- `.planning/artifacts/v1.38-plan-262-116-supplement-v3-adapter-review-carrier-v4.json` — exact non-recursive v4 carrier and false execution authority.
- `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-116-FINAL-CLEAN-REVIEW.md` — clean later-HEAD v4 authentication and immutable v1-v3 history.
- `.planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v3.json` — fixed inert supplement body and root.
- `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-109-CODE-REVIEW.md` — clean one-file publication custody and exhaustive absence proof.
- `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-113-RESEARCH.md` — prior closed-owner/reviewer separation and producer-incapable mode architecture.
- `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-110-PLAN.md` — current explicit dispatch block, sole-owner contract, frozen effects, and Plan-94 separation.
- `AGENTS.md`, `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md` — deterministic/runtime/security constraints and current lifecycle status.
