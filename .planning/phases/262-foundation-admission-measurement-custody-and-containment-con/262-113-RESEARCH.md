---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "113"
research_type: additive_live_v10_path_stable_custody_recovery
status: complete
decision: plan113_live_v10_then_plan114_independent_review
researched: 2026-08-28
---

# Phase 262 Plan 113: Minimal Additive Recovery from the Blocked Plan-112 v2 Review

## Research Question

What is the smallest safe correction for the three Plan-112 v2 `MODE_*` findings while preserving live-v9, the Plan-112 v1 and v2 review trios, the historical producer, the unchanged sealed pair, and every no-effect/no-authority boundary?

## Decision

**Add one path-stable closed owner in Plan 113, then independently review its exact committed closure in Plan 114. Rewire Plan 109 onward to one newly versioned supplement-v3 and live-v10.**

```text
immutable live-v9 source + immutable Plan-112 v1 zero trio
                         + immutable Plan-112 v2 blocked trio
                                      |
                                      v
Plan 113: additive path-stable custody helper + closed live-v10
  - preserves the old environment-bound roots as history
  - adds a repo-relative portable native-source root
  - consumes only a later Plan-114 review and supplement-v3
  - invokes no live effect
                                      |
                                      v
Plan 114: independent exact live-v10 executable review
  - derives raw/recursive/toolchain/path-stable custody independently
  - executes disposable source/prospective/post/value modes
  - publishes one literal-zero-or-blocked payload / REVIEW / carrier
                                      |
                                      v
revised Plan 109: publish exactly one supplement-v3
                                      |
                                      v
revised Plan 110: sole live-v10 invocation of the unchanged producer
                                      |
                                      v
revised Plan 94 -> revised Plan 95 -> Plan 106
```

No smaller review-only correction is safe because live-v9 cannot bind or consume the corrected review evidence.

## Exact Observed Failure

The corrected Plan-112 v2 reviewer truthfully executed six observations. Three value-level observations passed:

- complete bounded non-pass;
- matched bounded success;
- exact reproduction-v17 root/schema/privacy/authority/journal join.

Three CLI observations failed with the same code:

- `MODE_SOURCE_ONLY_FAILED`;
- `MODE_PROSPECTIVE_CUSTODY_FAILED`;
- `MODE_POST_NO_EFFECT_FAILED`;
- shared detail: `V138_LIVE_V9_CORRECTED_PAYLOAD_SEMANTICS_INVALID`.

The blocked v2 evidence is exact and must remain immutable:

| Identity | Exact value |
|---|---|
| Source under review | `a301a06df0e4a3c038cf630f3485f8fb3a879c42` |
| v2 publication commit | `5b5ec60154bb82a3cfa3b25a03f8a2379010c829` |
| Observation root | `sha256:746aab2e55ec529c38fd52a0de4baf7a1b7eb80c6feb3ba1ea4e2494805a09e8` |
| Finding root | `sha256:7bd0de8028c1960d01c14bd44feb897e7b6b79b26474ea866d02c0575e3394a7` |
| Payload root | `sha256:558d329e537dc4673dcaf216ce68faf651dfbbf1ce19536d54cacc3d76b9e194` |
| Review root | `sha256:8aca84cbb80b000dd5cdeb1735367dd7cc51eb858a0ce2960c4ac33e849dc0e9` |
| Carrier root | `sha256:06417e5f8b44a28e88bd20e746fa2319235250d687190ab1fa7a49f485d3a355` |
| Result | `3/6`, blocked, Plan 109 ineligible |

No supplement or live artifact exists; fresh charged/accepted remain `0/540`.

## Root Cause

The three failures are one execution-location identity defect, not three corrected-payload defects.

The native custody helper computes `nativeSourcesRoot` from pairs containing absolute source paths:

```text
[absolute transactionSource path, source hash]
[absolute ownerLockSource path, source hash]
```

That root is included in `executionClosureRoot`. Plan-108 payload-v9 records the root derived in the canonical checkout. Plan-112 v2 correctly uses a detached linked worktree so it can commit prospective review/supplement bytes and execute post-custody without touching the real checkout. The native source bytes are identical there, but their absolute prefixes differ.

The measured comparison isolates the defect:

| Closure component | Canonical checkout | Linked worktree | Result |
|---|---|---|---|
| Git object root | `sha256:6e1fb2a4558098597941f0d8b97f250a6c3817f70f6369734244cc2781fe2d78` | same | stable |
| Installed closure root | `sha256:72760c27bb3a70f57fcebe45abae59f6d592310ef32f4bc23e442fe8b25ec31b` | same | stable |
| Native sources root | `sha256:de43db7fa3d47de7dd1b5ffb148ae9cecceab044bdb61f704051e2930f4f5523` | `sha256:25720a8fe8e5116f4451536079bf38a4c0123e9f763e9f17cbd4d879404ccc60` | path-sensitive |
| Plan-107 execution closure | `sha256:33de433c8a2ff60fbf53e8a0b525bec4c3f7c8d295cfd89b079cec017246c33f` | `sha256:f19d17a1f890a49887c9a044b0588a39f27b522b65385e88d337322afe5f2f24` | changes only downstream of native root |

The same source-only CLI passes in the canonical checkout with an isolated temporary `HOME`. Therefore ambient home/configuration is not the cause. The live-v9 semantic gate does what its frozen source says; its source says an absolute-path-bound closure is exact. That definition is incompatible with the separately required disposable-worktree review.

## Why the Smaller Real-Checkout Review Is Unsafe

Two failing modes can be rerun read-only in the real checkout:

- `--check-source-only` performs no write or effect and passes there;
- `--check-prospective-custody` derives supplement bytes in memory and is also pre-effect.

The third cannot be completed before Plan 109 in the real checkout. `--check-post-run-custody` requires supplement-v2 to exist at an exact committed add commit. Running it before supplement publication is circular; making a temporary main-checkout commit would mutate the shared checkout and custody history. A linked worktree is the correct isolation mechanism, but that is exactly where the absolute native path changes.

A staged review-only Plan 113 is also disconnected from the executable gate. live-v9 hardcodes the Plan-112 v1 paths, roots, renderer, and prospective supplement-v2 schema. It cannot consume a new v3 corrective trio. Allowing Plan 109 to depend on a v3 review while live-v9 authenticates only v1 would repeat `F-262-108-R2-02`: reviewed evidence exists in planning, but the effect-capable owner does not bind it.

Deferring the post-run CLI until after an inert supplement is published does not repair that disconnect. The supplement would still bind the superseded v1 zero claim rather than the corrective executed review. Therefore the smaller option is rejected.

## Immutable Boundary

Plan 113 and every successor must preserve without edit, deletion, replacement, or reinterpretation:

- `scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.ts` and its tests;
- Plan-111 commit `a301a06d...` and execution root `sha256:14ff01fb063083db596828b769cf7ccb5d25492994e78d9625b362c58e4ecf4b`;
- Plan-112 v1 source/tests and its payload/REVIEW/carrier at publication `29d4cf5c...`;
- Plan-112 v2 source/tests and its blocked payload/REVIEW-FIX/carrier at publication `5b5ec601`;
- corrected Plan-108 and every earlier review byte;
- the historical v3 producer, pair B3, seal/envelope roots, frozen policy, Plan-93 stop, protected history, and zero counters;
- supplement-v1 and supplement-v2 absence;
- all journal/private/terminal/reproduction/disposition/correction/activation/readiness/lifecycle absence.

The v1 zero trio is superseded evidence, not deleted evidence. The v2 blocked trio is a truthful observation, not a failed test to erase.

## Plan 113: Additive Path-Stable Closed Live-v10

### Files

- `scripts/lib/v1-38-bounded-retry-v3-path-stable-custody-v1.ts`
- `scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts`
- `scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.test.ts`

### Custody correction

The new helper must not modify the historical native helper. It should derive two explicit, non-aliased identities:

1. **Path-stable reviewed closure** — raw committed modes/blobs and byte hashes labeled only by canonical repository-relative paths; recursive TypeScript imports; installed package bytes; Node/pnpm bytes; Git executable/hardened-argument bytes; and native C sources labeled by fixed repo-relative paths. No absolute checkout path, temporary owner path, worktree administrative path, device, or inode may enter this root.
2. **Local execution closure** — the path-stable root plus the existing same-operator local Git object/device/inode and native owner-lock facts needed by `single_operator_local_seal_v1`. It remains a local assurance value and is not mislabeled portable.

The linked-worktree review must reproduce the path-stable root exactly. The canonical readiness/production gate must additionally reproduce the local execution root before and after the producer call. Pathname-launch replacement resistance remains explicitly unclaimed.

### Closed owner

live-v10 must:

- independently authenticate exact corrected Plan-108, immutable Plan-111/live-v9 history, both Plan-112 publications and the v2 blocked result;
- use the new path-stable closure for reviewable source identity rather than reinterpreting the old full root;
- define exact future Plan-114 payload/REVIEW/carrier and supplement-v3 schemas;
- consume only literal-zero committed Plan-114 evidence and committed supplement-v3;
- keep supplement-v1/v2 absent as fail-closed sentinels;
- expose source-only, prospective-custody, post-run-custody, reviewed-readiness, and sole production selectors with no generic/injectable production bypass;
- preserve the existing producer as the only live effect owner and call it at most once;
- preserve live-v9's exact non-pass/success topology and independent reproduction-v17 byte/root/privacy/authority/journal validation;
- perform local closure and post-effect custody checks in a finally-equivalent path with producer/custody error preservation;
- create no seal, envelope, capacity, reset, literal, supplement, review trio, or live artifact in Plan 113.

### TDD gates

- RED must reproduce the canonical-versus-linked-worktree native root mismatch.
- GREEN must make the new path-stable root identical across those two locations while mutations to relative path, mode, blob, bytes, recursive imports, installed inputs, native sources, Git executable, or hardened arguments fail.
- Disposable actual modes must use a candidate Plan-114 trio plus supplement-v3 committed only inside the linked worktree.
- Tests must prove live-v9 and both Plan-112 publications remain byte-identical and that no live selector is invoked.

Plan 113 ends after its source/test commit and source-only verification. It publishes no review or supplement and grants only Plan-114 eligibility.

## Plan 114: Independent Executable Review of Exact Plan-113 Source

Plan 114 must be a separate plan and context after the final Plan-113 source commit exists.

### Files

- `scripts/check-v1-38-plan-262-114-live-v10-custody-v1.ts`
- `scripts/check-v1-38-plan-262-114-live-v10-custody-v1.test.ts`
- `.planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-payload-v1.json`
- `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-114-REVIEW.md`
- `.planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-carrier-v1.json`

### Required observations

The reviewer must not import live-v10 acceptance decisions. It must independently derive:

- exact Plan-113 commit/tree/parent and raw source modes/blobs;
- recursive import, installed/toolchain, path-stable native-source, reviewed closure, and local execution roots;
- corrected Plan-108, Plan-111, Plan-112 v1/v2 history, pair, Plan-93, protected-history, zero-counter, privacy, and exhaustive false-authority semantics;
- exact prospective Plan-114 trio and supplement-v3 bytes.

In a detached linked worktree sharing the canonical object store, it must commit a disposable candidate trio and supplement-v3, then execute the actual live-v10 source-only, prospective-custody, post-no-effect, non-pass, success, and exact-reproduction modes. The readiness and production selectors must be source-inspected and mutation-tested but never invoked. All pass counts come from completed executions.

Findings must be sorted/rooted and deterministically render blocked evidence; process-integrity failure must publish nothing. Literal zero alone may publish the canonical non-recursive payload/REVIEW/carrier trio and make only revised Plan 109 eligible. After the dedicated three-path commit, a read-only checker must prove exact diff, `100644` modes, raw blobs/current bytes, ancestry, no rewrite, exact rerender, and absence of supplement/live effects.

## Revised Plan 109 and Successor Wiring

The current Plans 109 and 110 are stale and must not execute.

| Wave | Plan | Revised responsibility | Dependency |
|---|---|---|---|
| 97 | 262-113 | Add path-stable custody helper and closed live-v10; no effect | blocked Plan-112 v2 plus immutable prior chain |
| 98 | 262-114 | Independently review exact committed Plan-113 source and publish one v1 trio | exact Plan-113 source commit |
| 99 | 262-109 revised | Publish/check exactly one supplement-v3 | literal-zero committed Plan-114 trio |
| 100 | 262-110 revised | Invoke only live-v10 once | committed supplement-v3 plus standing authority |
| 101 | 262-94 revised | Independently adjudicate terminal/reproduction evidence | Plan-110 terminal evidence |
| 102 | 262-95 revised | Stage-1 readiness and verification | Plan-94 verdict |
| 103 | 262-106 | Stage-2 lifecycle finalization | Plan-95 readiness |

Revised Plan 109 must publish only:

`.planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v3.json`

Supplement-v3 binds the unchanged pair/stop/protected history/zero counters, exact corrected Plan-108 roots, immutable live-v9 and Plan-112 v1/v2 history, exact Plan-113 path-stable and local roots, and exact Plan-114 publication commit plus trio roots. It must declare `supersessionScope:"executable_source_custody_only"`, `createsEnvelope:false`, `createsCapacity:false`, `resetsCounters:false`, `authorizesExecution:false`, and exhaustive downstream denial. Supplement-v1/v2 remain absent. The supplement is inert; only the already standing operator authorization plus the exact reviewed live-v10 readiness gate permits Plan 110.

Revised Plan 110 invokes only:

`scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts --run-reviewed-bounded-live-envelope`

exactly once. The historical producer retains exclusive ownership of the existing v3 journal/private/terminal and conditional reproduction-v17 destinations. No new envelope, capacity, counter reset, route identity, attempt identity, or authorization literal is created. Plan 94 remains the only adjudicator and Route-11 owner.

## Threat Model

| Threat | Severity | Required mitigation |
|---|---|---|
| Absolute checkout path changes reviewed semantics | critical | Repo-relative native source labels in a new path-stable root; canonical/local root kept separate. |
| Corrective review disconnected from executable gate | critical | live-v10 and supplement-v3 must bind the exact Plan-114 publication and trio roots. |
| Old zero trio overrides truthful blocked v2 history | critical | Bind both publications with explicit supersession order; v2 blocked remains authoritative for live-v9. |
| Reviewer normalizes observed findings | critical | Deterministic blocked trio; integrity failures publish nothing; literal zero only. |
| Disposable verification crosses live boundary | critical | Never invoke readiness/production; use producer-incapable/value modes and absent canonical effects. |
| Path-stable root weakens local assurance | high | Production additionally authenticates a distinct local execution root before and after the call. |
| New supplement creates capacity or authority | critical | New version only, exact one-file publication, executable-custody-only scope, all authority false. |

## Rejected Alternatives

### Rerun all three CLI modes in the main checkout

Rejected. Source-only and prospective are safe there, but post-run custody requires an already committed supplement. Creating one before Plan 109 is circular and mutates canonical history.

### Accept five pre-supplement modes and defer post-run CLI to Plan 109

Rejected as a complete recovery. It can be a useful Plan-109 gate, but live-v9 still cannot bind a new corrective review and would consume the superseded v1 evidence.

### Publish supplement-v2 over a new review without changing the owner

Rejected. live-v9's exact supplement-v2 schema hardcodes Plan-112 v1 semantics; changing the bytes would fail, leaving the new review disconnected.

### Patch the historical native helper or live-v9

Rejected. Both are inside previously reviewed execution closures. Rewriting them invalidates immutable history and no-rewrite claims.

### Change only the Plan-112 v2 reviewer from worktree to clone

Rejected. A clone changes the Git object root/inode as well as native absolute paths, so it does not reproduce the local execution closure and cannot exercise committed post-custody safely.

### Create another envelope or reset counters

Rejected. The defect concerns executable custody only. The current envelope is sealed inactive and unconsumed; D-31R prohibits a third envelope, reset, expansion, or reuse.

## Non-Authority

This research changes no source, evidence, plan dependency, or runtime state. It grants no Plan-113 implementation credit, Plan-114 review result, Plan-109 eligibility, supplement, live invocation, route, capacity, reset, candidate, formation, holdout, public, product, production, counted-play, gameplay-change, archive, tag, or Phase-263 authority. Until the recommended chain is planned, implemented, and independently reviewed, Plan 112 remains blocked and every successor remains ineligible.

## Repository Sources

- `262-112-CODE-REVIEW.md` and `262-112-CODE-REVIEW-FIXES.md` — original review defects and truthful v2 correction result.
- `262-112-REVIEW-FIX.md`, payload-v2, and carrier-v2 — exact blocked observation and roots.
- `scripts/check-v1-38-plan-262-112-live-v9-custody-v2.ts` — linked-worktree mode execution and deterministic blocked renderer.
- `scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.ts` — corrected payload gate, frozen Plan-112 v1/supplement-v2 contract, and closed producer boundary.
- `scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts` — absolute-path-bearing native source root.
- `262-CONTEXT.md` D-23R through D-32R — standing authority, unchanged finite envelope, reduced assurance, and no third envelope/reset/downstream authority.

No external documentation or dependency research is required; the defect and recovery boundary are repository-local.
