---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "115"
research_type: additive_supplement_v3_selector_recovery
status: complete
decision: plan115_source_only_adapter_then_plan116_independent_review_then_revised_plan109
researched: 2026-08-29
---

# Phase 262 Plan 115: Minimal Additive Recovery for Missing Supplement-v3 Selectors

## Research Question

What is the smallest safe recovery for revised Plan 109 now that its three planned supplement-v3 commands do not exist, while preserving the exact reviewed live-v10 source, the authoritative Plan-114 v2 trio, the final clean Plan-114 source/review closure, the unchanged B3 pair, and every zero-capacity/no-effect boundary?

## Decision

**Add one source-only supplement-v3 publisher/checker adapter in Plan 115, independently review its exact committed closure in Plan 116, and then revise Plan 109 to publish the one supplement through that exact reviewed adapter.**

```text
immutable Plan-113 live-v10 source (ba1f8ddb / reviewed root 8929dd2d)
                              +
authoritative Plan-114 v2 trio (34bc94ec / literal zero / 6 of 6)
                              +
final clean Plan-114 reviewer source and review (1314e24b -> 92415ea0)
                              |
                              v
Plan 115: additive supplement-v3 publisher/checker adapter + tests
  - independently authenticates the exact upstream closure
  - derives the already specified supplement-v3 body and root
  - exposes source-only, exclusive-write, and committed-check selectors
  - exercises writes only in disposable worktrees
  - creates no canonical supplement or live effect
                              |
                              v
Plan 116: independent exact-source review of committed Plan-115 adapter
  - rederives upstream custody and supplement semantics independently
  - executes actual source/write/commit/check modes in disposable worktrees
  - publishes one literal-zero-or-blocked payload / REVIEW / carrier
                              |
                              v
revised Plan 109: invoke only the exact reviewed Plan-115 adapter
  - exclusive-create supplement-v3
  - commit exactly that one path
  - authenticate exact committed bytes and unchanged pair
  - invoke no readiness, producer, or live selector
```

This is additive and non-circular. It does not edit the reviewed live-v10 or Plan-114 reviewer, does not treat Plan-114 as the publisher of its own downstream evidence, and does not let unreviewed new executable code create canonical custody evidence.

## Exact Verified Gap

The current `262-109-PLAN.md` requires:

```text
scripts/check-v1-38-plan-262-114-live-v10-custody-v1.ts --write-supplement-v3
scripts/check-v1-38-plan-262-114-live-v10-custody-v1.ts --check-supplement-v3
scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts --check-supplement-v3
```

None exists.

| Source | Actual CLI surface | Supplement result |
|---|---|---|
| Plan-114 reviewer | `--write-review`, `--check-review`, `--check-observations` | It has an internal supplement renderer only; no write/check selector is exported or dispatched. |
| live-v10 | `--check-source-only`, `--check-prospective-custody`, `--check-post-run-custody`, `--check-reviewed-live-ready`, `--run-reviewed-bounded-live-envelope` | It has no supplement-only selector. Its future-custody implementation resolves historical Plan-114 v1 paths, not the authoritative v2 publication. |

Therefore Plan 109 cannot execute as written. The failure is a missing executable publication boundary, not a defect in the already published Plan-114 v2 evidence and not permission to add commands to reviewed historical files. [VERIFIED]

No supplement currently exists:

- supplement-v1: absent;
- supplement-v2: absent;
- supplement-v3: absent.

The pair remains sealed inactive and unconsumed. No readiness, producer, live, or downstream artifact is introduced by this research. [VERIFIED]

## Immutable Upstream Closure

Plan 115 and every successor must preserve these bytes and meanings:

### Plan-113/live-v10 subject

| Identity | Exact value |
|---|---|
| Reviewed source commit | `ba1f8ddb4d701762d5d443f41edcbb691bb0eda5` |
| Source tree / parent | `0a35c771e145b9feee43d696dbb1b6ae10c42b9c` / `e0215b7738ab44bdd4a8f536cc53ee71008989f9` |
| Reviewed closure root | `sha256:8929dd2d2d8c9c72c293a7b9e41e722ef274a1296160e877685ce0956969b852` |
| Authoritative v2 reviewed-local context root | `sha256:9e69dca582dd49f119cde283491173d0c3fd7c5aca40dfaf95e53c99dec5ee0c` |

### Authoritative Plan-114 v2 publication

| Identity | Exact value |
|---|---|
| Publication commit | `34bc94ec4e348f71e6055a091d60a505cffc0d79` |
| Payload root | `sha256:d4ca10f333598968c0f9b9d7729d5193c981f501a8284cdd5626f2f2b5a518ac` |
| Review root | `sha256:f802ac51d79702f1163fd8d5151b2b7384e2d43de1d97f15ddd74f39538a79ee` |
| Carrier root | `sha256:8ddd2dc65d0601f8c6d027e225c16e8ea81574f197f877dd4f3c1830f5563c26` |
| Verdict | zero findings, 6/6 actual non-live modes, `plan109Eligible:true` |
| Authority | `authorizesExecution:false`, fresh charged/accepted `0/0`, downstream denied |

The v1 trio at `ab539ab2b3706981aaeb053b3fafce6b46532b40` remains immutable superseded history. Once v2 exists, partial, absent, symlinked, executable, byte-drifted, or semantically blocked v2 must fail closed and may never fall back to v1. [VERIFIED]

### Final clean Plan-114 reviewer closure

| Identity | Exact value |
|---|---|
| Final reviewed source commit | `1314e24b43f9469e0f6d425c007d88ca2fca9716` |
| Tree / parent | `95cc3b5b78bcf0317f0dba1e3aeeb979c48de89a` / `0c0a52e947c1693652446fedf1e8b0fb6ab69068` |
| Reviewer source blob | `392eff05bc1935a2bb056dd9a2915a5d114f2afd` (`100644`) |
| Reviewer test blob | `b6ed1ba67a4251d36eb5ef1c004a8638bd4f515f` (`100644`) |
| Final clean review commit | `92415ea08ccddd2c8fae3c8fc922078d14c589c9` |
| Final clean review blob / SHA-256 | `a60bb69c235a393b9300311cb43514a00f315ea0` / `sha256:e200f87639b8680603315c2317327390af8389328a9e388ed37eeac09642c201` |

No later commit through current HEAD rewrites either reviewed Plan-114 source file. The clean review records zero findings after deterministic subject rejection was separated from process-integrity failure. [VERIFIED]

### Pair and historical authority

The adapter must also preserve and authenticate:

- corrected Plan-108 publication `2639ff3b42e2a238919a3104c9fa8c785c69b93d` and roots `1e012ddc...` / `d5678937...` / `1588f5ab...`;
- Plan-112 v1 publication `29d4cf5c...` as superseded history;
- truthful blocked Plan-112 v2 publication `5b5ec601...` with all three finding codes;
- B3 pair commit `8080ff66a0880db25db227d23e7e7a0884a79b56`;
- seal root `sha256:ec1cb108c8fcdd710090e72ccec32ed58574a06d8970a2b44b1bb6f7ec3ea752`;
- envelope root `sha256:f6a92d5ddfc6b10fe5a0600927e0427b112bf0b49f2d03d895a229642456904a`;
- protected-history root `sha256:77e0e71f62ec4abd997f1df2c1fc9bf1db7b95247404f78b558a634cdc1ec57d`;
- Plan-93 stop `de42f5e7...`, sealed-inactive status, and every zero counter;
- supplement-v1/v2 absence and all producer/downstream destination absence before publication.

## Plan 115: Source-only Supplement-v3 Adapter

### Files

- `scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.ts`
- `scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.test.ts`

No artifact, review, roadmap, state, seal, envelope, or historical source file belongs in Plan 115.

### Closed responsibilities

The new adapter should own exactly three CLI selectors:

1. `--check-source-only` — independently authenticate the complete immutable upstream closure and require supplement-v1/v2/v3 plus producer/downstream destinations absent.
2. `--write-supplement-v3` — after the same authentication, derive exact canonical supplement bytes and exclusive-create only the supplement-v3 path with `wx`, regular `0644` semantics, containment, parent-directory no-symlink checks, and no overwrite path.
3. `--check-supplement-v3` — require the supplement's unique exact one-path add commit, `100644` mode, raw blob/current no-follow equality, canonical JSON, no later rewrite, exact independent rerender, unchanged pair/zero counters, supplement-v1/v2 absence, and producer/downstream absence.

There is no production, readiness, live, generic-output, caller-supplied renderer, or injected publisher selector. Exported test helpers may accept a repository root, but the CLI root is fixed from `import.meta.url`; no injection reaches a live effect because this adapter has none. [PRESCRIPTIVE]

Plan 115 tests may execute `--write-supplement-v3` only inside owner-controlled disposable linked worktrees or isolated repositories. The canonical Plan-115 execution runs source-only checks and focused tests, never its write selector against the shared checkout. [PRESCRIPTIVE]

### Supplement semantics remain unchanged

The adapter must preserve the existing domain and schema:

- root domain: `v138-successor-source-seal-v13-executable-custody-supplement-v3`;
- `schemaVersion:"v1.38-successor-source-seal-v13-executable-custody-supplement-v3"`;
- `supersessionScope:"executable_source_custody_only"`;
- authoritative Plan-114 v2 publication commit and exact v2 payload/review/carrier roots;
- reviewed Plan-113 source commit, reviewed closure root, and v2 reviewed-local context root;
- exact corrected Plan-108 and Plan-112 v1/v2 publication commits;
- exact pair, seal, envelope, protected-history roots, and the unchanged zero-counter object;
- `createsEnvelope:false`, `createsCapacity:false`, `resetsCounters:false`, and `authorizesExecution:false`;
- `phase263PlanningAuthorized:false`, `candidateSearchAuthorized:false`, `formationMaterializationAuthorized:false`, `holdoutOpeningAuthorized:false`, `publicAuthorized:false`, `productAuthorized:false`, `productionAuthorized:false`, and `downstreamAuthority:"denied"`.

Do not add Plan-115/116 identities to the supplement body. Their custody belongs to the independent eligibility review and the Plan-109 execution record, not to a schema change. Do not add capacity, route, attempt, authorization, readiness, or live fields. [PRESCRIPTIVE]

### Independent implementation boundary

The adapter may reuse low-level canonical JSON and isolated raw-Git primitives, but it must not import Plan-114 or live-v10 verdict, acceptance, renderer, supplement-root, or future-custody functions. It independently authenticates fixed upstream publications and derives the fixed supplement body. This avoids turning a reviewer-internal prospective value into self-authorization. [PRESCRIPTIVE]

### TDD requirements

- RED: prove all three planned Plan-109 selectors are missing and the authoritative v2 trio cannot be published by either current CLI.
- GREEN: derive the one exact supplement in memory, write it only in a disposable checkout, commit exactly one path, and authenticate it repeatedly.
- Mutate every supplement field, root, counter, false authority, upstream path/mode/blob/current byte/history relation, Plan-114 version/eligibility/finding, Plan-114 clean source/review byte, supplement mode/symlink/add scope/rewrite, pair byte, and forbidden destination.
- Prove v2 is authoritative and no v1 fallback occurs.
- Prove failed preconditions and partial writes leave the canonical supplement absent.
- Prove no readiness, producer, journal, terminal, reproduction, adjudication, or downstream selector is reachable.

Plan 115 ends with a committed source/test closure and no canonical supplement. It grants only Plan-116 review eligibility.

## Plan 116: Independent Review of Exact Plan-115 Source

### Files

- `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.ts`
- `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.test.ts`
- `.planning/artifacts/v1.38-plan-262-116-supplement-v3-adapter-review-payload-v1.json`
- `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-116-REVIEW.md`
- `.planning/artifacts/v1.38-plan-262-116-supplement-v3-adapter-review-carrier-v1.json`

The reviewer must independently derive the exact committed Plan-115 source commit/tree/parent, modes/blobs/current bytes, recursive imports, installed/toolchain/native inputs, and reviewed/local closure. It must independently authenticate the full upstream closure listed above and independently derive supplement-v3 semantics without importing Plan-115 acceptance decisions. [PRESCRIPTIVE]

In disposable worktrees, execute the actual Plan-115 source-only selector, exclusive writer, exact one-path commit, committed checker, repeat checker, and representative blocked/fail-closed mutations. Never invoke live-v10 readiness or production. Record actual completed modes, zero producer calls, zero fresh counters, and exact forbidden absence. [PRESCRIPTIVE]

Findings are sorted and rooted. Observable source/custody/supplement drift produces deterministic blocked evidence; process-integrity failure publishes nothing. Literal zero alone may atomically publish the non-recursive payload/REVIEW/carrier trio and make only revised Plan 109 eligible. After its dedicated three-path commit, read-only authentication must prove exact scope, `100644` modes, raw blobs/current no-follow bytes, ancestry, no rewrite, exact rerender, and Plan-109-only eligibility. [PRESCRIPTIVE]

Plan 116 publishes no supplement and grants no execution or downstream authority.

## Revised Plan 109

The current `262-109-PLAN.md` must not execute. Revise it to depend on Plan 116 and to modify only:

`.planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v3.json`

Required sequence:

1. Authenticate the exact committed literal-zero Plan-116 review trio and exact Plan-115 source closure.
2. Run only the reviewed Plan-115 adapter's `--write-supplement-v3` selector.
3. Verify exactly one new canonical path, canonical bytes, ordinary `0644` working mode, supplement-v1/v2 absence, unchanged B3 pair, exact zero counters, and all producer/downstream destinations absent.
4. Commit exactly the supplement-v3 path as its own one-file publication commit.
5. Run only the same adapter's `--check-supplement-v3` selector plus the existing v7 sealed-pair read-only checker.
6. Record the supplement root, publication commit/blob/mode, unchanged pair roots/blobs/modes, exact false fields, and zero-effect proof in `262-109-SUMMARY.md`.

Remove every nonexistent Plan-114/live-v10 supplement command from Plan 109 verification. Do not invoke `--check-reviewed-live-ready` or `--run-reviewed-bounded-live-envelope` in Plan 109. Publication is inert custody only. [PRESCRIPTIVE]

Plan-109 completion must not be described as live-v10 readiness. The current live-v10 future-custody path still resolves Plan-114 v1 values, whereas supplement-v3 must bind authoritative v2. Plan 110 therefore remains dependency-denied until its own plan is explicitly audited or revised for the authoritative v2/supplement-v3 join. This research does not authorize or design a live-owner bypass. [VERIFIED boundary / PRESCRIPTIVE stop]

## Dependency and Wave Revision

| Wave | Plan | Responsibility | Dependency |
|---|---|---|---|
| 99 | 262-115 | Add source-only supplement-v3 publisher/checker adapter | final clean Plan-114 closure and authoritative v2 trio |
| 100 | 262-116 | Independently review exact committed Plan-115 source | exact Plan-115 source commit |
| 101 | 262-109 revised | Publish/check exactly one supplement-v3 through reviewed adapter | literal-zero committed Plan-116 trio |
| 102+ | 262-110 and later | Remain denied pending explicit authoritative-v2 live-gate audit/revision | committed supplement-v3 is necessary but not sufficient |

ROADMAP and STATE should be revised during planning, not by this research-only task.

## Validation Architecture

### Plan 115

```text
focused adapter tests
adapter --check-source-only
TypeScript
git diff --check
canonical supplement-v1/v2/v3 absence
producer/downstream absence
```

### Plan 116

```text
independent reviewer mutation tests
actual disposable source/write/commit/check/recheck modes
literal-zero-or-blocked review writer
dedicated three-path review commit
read-only committed review authentication
TypeScript
git diff --check
canonical supplement and live/downstream absence
```

### Revised Plan 109

```text
Plan-116 committed review checker
Plan-115 adapter --write-supplement-v3
dedicated one-path supplement commit
Plan-115 adapter --check-supplement-v3
v7 --check-sealed-inactive-envelope
TypeScript
git diff --check
producer/downstream absence
```

No command before a separately reviewed live-owner plan may invoke readiness or production.

## Threat Model

| Threat | Severity | Required mitigation |
|---|---|---|
| Missing selectors tempt ad hoc JSON construction in Plan 109 | critical | One committed adapter owns exact derivation/write/check; Plan 109 invokes only its reviewed selectors. |
| Plan-114 publishes its own downstream eligibility object | critical | Separate Plan-115 publisher and separate Plan-116 review; Plan-114 remains immutable input only. |
| v1 fallback overrides authoritative v2 | critical | Git-history version selection; any published-v2 defect fails closed and never falls back. |
| New adapter trusts author-produced renderer or verdict | critical | Plan 116 independently derives source/upstream/supplement semantics and executes actual modes. |
| Supplement silently changes envelope or capacity | critical | Preserve exact v3 schema/domain and exhaustive false creation/reset/authority fields; authenticate unchanged pair before and after publication. |
| Partial or unsafe canonical write | critical | Exclusive one-file write, containment/no-symlink checks, dedicated commit, raw Git/no-follow current-byte authentication. |
| Review success is mislabeled live readiness | critical | Plan 109 stops at inert publication; Plan 110 remains denied pending its own v2 join audit/revision. |
| Test path reaches live producer | critical | Adapter has no live import/selector; Plan 115/116 forbid readiness and production execution. |

## Rejected Alternatives

### Add supplement selectors to Plan-114 reviewer

Rejected. The reviewer has a final clean reviewed closure and authoritative immutable v2 publication. Editing it would create a new unreviewed publisher inside the evidence producer and invalidate its no-rewrite boundary.

### Add `--check-supplement-v3` to live-v10

Rejected. live-v10 is the reviewed effect-capable subject. Editing it requires another executable-custody review and still leaves the authoritative-v2 path problem. A publication-only adapter is smaller and cannot invoke live work.

### Let Plan 109 construct JSON directly

Rejected. The plan would introduce unreviewed executable semantics at the canonical publication boundary and its verification would be self-authored and circular.

### Import the Plan-114 internal renderer

Rejected. It is not exported, its original responsibility is review evidence, and using its own prospective output as downstream validity would collapse reviewer and publisher independence.

### Bind Plan-114 v1 because live-v10 already accepts it

Rejected. V2 is authoritative, the final clean review explicitly preserves it, and any v1 fallback recreates the stale-evidence defect already fixed in Plan 114.

### Change supplement-v3 schema to include Plan-115/116 custody

Rejected. The missing-selector defect does not require new capacity or semantics. Adapter/review custody belongs to the Plan-116 eligibility trio and Plan-109 summary, not the inert supplement body.

### Treat committed supplement-v3 as sufficient live authority

Rejected. The supplement explicitly has `authorizesExecution:false`; standing operator authority and a separately correct reviewed readiness gate remain distinct requirements.

## Non-Authority

This research writes only this document. It creates no source, test, review trio, supplement, seal, envelope, capacity, reset, authorization literal, readiness result, journal, receipt, terminal, reproduction, disposition, correction, activation, lifecycle, live effect, or downstream authority. It grants no Plan-115 implementation credit, Plan-116 review result, Plan-109 eligibility, Plan-110 readiness, ADMIT-03 credit, candidate search, Phase-263 work, formation, holdout, public, product, production, counted play, gameplay change, archive, or tag authority.

Until Plans 115 and 116 are planned, implemented, and independently closed, revised Plan 109 remains ineligible and the canonical supplement-v3 remains absent.

## Repository Sources

- `262-109-PLAN.md` — references the three nonexistent selectors and must be revised.
- `scripts/check-v1-38-plan-262-114-live-v10-custody-v1.ts` — authoritative-v2 authentication, final independent reviewer logic, internal supplement renderer, and actual CLI surface.
- `scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts` — immutable live-v10 CLI surface and historical-v1 future-custody behavior.
- `262-114-SUMMARY.md`, `262-114-REVIEW-FIX.md`, and `262-114-FINAL-CLEAN-REVIEW.md` — exact v2 publication, correction history, final clean closure, and non-authority.
- Plan-114 v2 payload/REVIEW/carrier — exact literal-zero semantic input for the future adapter.
- `262-113-RESEARCH.md` and `262-113-SUMMARY.md` — path-stable/local split, supplement-v3 semantics, and exact reviewed live-v10 subject.
- `262-CONTEXT.md` D-23R through D-32R — unchanged finite envelope, standing authority limits, no third envelope/reset, and downstream denial.

No external documentation or dependency research is required; the selector gap and all recovery inputs are repository-local.
