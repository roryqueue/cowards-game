---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "111"
research_type: additive_live_v9_custody_recovery
status: complete
decision: feasible_two_gate_recovery
researched: 2026-08-28
---

# Phase 262 Plan 111: Minimal Additive Live-v9 Custody Recovery Research

## Research Question

What is the smallest additive topology that closes `F-262-108-R2-01` and `F-262-108-R2-02`, preserves live-v8 plus every v8/v9 review byte as immutable history, and leaves one reviewed supplement publication followed by one sole live owner?

## Decision

**Use two additive source gates before revised Plans 109 and 110:**

```text
immutable Plan-93 pre-start stop + unchanged B3 pair
                         |
immutable live-v8 + v8/v9 Plan-108 review history
                         |
                         v
Plan 111: closed live-v9 adapter
  - pins exact corrected Plan-108 publication commit and roots
  - independently rederives its exhaustive semantics
  - defines future Plan-112 review and supplement-v2 contracts
  - has no canonical artifact or effect
                         |
                         v
Plan 112: independent review of exact committed live-v9 closure
  - independently repeats Plan-108 semantic derivation
  - reviews every live-v9 executed dependency
  - exercises the exact corrected review + prospective supplement-v2
  - publishes a non-recursive payload / REVIEW / carrier
                         |
                         v
revised Plan 109: publish exactly one canonical supplement-v2
                         |
                         v
revised Plan 110: sole live invocation through live-v9
                         |
                         v
revised Plan 94 -> revised Plan 95 -> Plan 106
```

One additive adapter plan is insufficient: its exact committed executable closure would still be unreviewed. More than two new source gates is unnecessary if Plan 112 owns an independent semantic implementation and external carrier, and the supplement is published only afterward.

## Verified Current State

- Pair commit B3 remains `8080ff66a0880db25db227d23e7e7a0884a79b56`.
- Seal root remains `sha256:ec1cb108c8fcdd710090e72ccec32ed58574a06d8970a2b44b1bb6f7ec3ea752`.
- Envelope root remains `sha256:f6a92d5ddfc6b10fe5a0600927e0427b112bf0b49f2d03d895a229642456904a`, `sealed_inactive`, at exact zero counters.
- Plan 93 remains one immutable incomplete pre-start command attempt with no live effect or envelope consumption.
- live-v8 authenticates only payload-v8, original `262-108-REVIEW.md`, carrier-v1, and supplement-v1. It cannot consume the corrected v9/v2 branch.
- Corrected Plan-108 publication commit is `2639ff3b42e2a238919a3104c9fa8c785c69b93d`, with exact roots:
  - payload: `sha256:1e012ddcac45a9b201c8d12c58b14ac532302c87516f17aafa220a5899f3afc2`
  - empty finding inventory: `sha256:7b6a3ae54d5a7e31703e70a2c5ce6e54252aab64334216acfd20f48d0f39a47b`
  - review: `sha256:d5678937bd87eb53c6df418a5c26fe2be4c3ae95f96d131fe9b086ae7c9316db`
  - carrier: `sha256:1588f5abd35b8c21f33fefe3d492d44c52f69421ada43e63229df2115d1848e5`
  - reviewed Plan-107 closure: `sha256:33de433c8a2ff60fbf53e8a0b525bec4c3f7c8d295cfd89b079cec017246c33f`
- `262-108-REVIEW-FIX-REVIEW.md` blocks Plan 109 because arbitrary self-consistent corrected trios are accepted and the corrected chain is disconnected from live-v8.
- The canonical supplement and all v3 live destinations remain absent. Therefore no migration, rollback, counter repair, or capacity recovery is required.

## Immutable History Boundary

The recovery must not modify, replace, delete, or reinterpret:

- `scripts/run-v1-38-bounded-retry-envelope-v3-live-v8.ts` and its tests;
- the original payload-v8, `262-108-REVIEW.md`, and carrier-v1;
- the corrected payload-v9, `262-108-REVIEW-FIX.md`, and carrier-v2;
- either Plan-108 code review or fix re-review;
- seal-v13, retry-envelope:v3, Plan-93 stop, protected Plans 90/91/96-105, or the historical producer;
- any prior charged or terminal route history.

The absent supplement-v1 path must remain absent. It is now a fail-closed sentinel preventing live-v8 from becoming accidentally eligible. The only canonical supplement created by the recovery is a new versioned supplement-v2.

## Plan 111: Closed Additive Live-v9 Adapter

### Proposed files

- `scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.ts`
- `scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.test.ts`

### Required pre-effect chain

live-v9 must close over real disk authenticators and the existing `runV138V3ProductionLive`; no exported production function may accept gate or producer replacement dependencies.

Before any effect it must:

1. Authenticate exact Plan-93 stop bytes, semantics, commit, and no-rewrite history.
2. Authenticate exact B3 seal/envelope blobs, roots, frozen policy, `single_operator_local_seal_v1`, `sealed_inactive`, and zero counters.
3. Independently authenticate the complete protected Plans 90/91/96-105 inventory from raw Git bytes, modes, ancestry, current bytes, and no successor rewrite.
4. Pin corrected Plan-108 publication commit `2639ff3b42e2a238919a3104c9fa8c785c69b93d`; never scan for a merely self-consistent replacement.
5. Require that commit to add exactly the three corrected paths at `100644`, bind their exact blobs/current bytes/no-rewrite state, and reject dirty or substituted working entries.
6. Independently rederive exhaustive payload-v9, REVIEW-FIX, and carrier-v2 semantics:
   - exact schemas and key sets;
   - Plan-107 commit/tree/parent and five checkout paths;
   - full, recursive, protected-history, payload, finding, review, and carrier roots;
   - literal zero findings, `4/4` modes, one producer-incapable observation, no live invocation, zero charges/accepted cells;
   - `plan109Eligible:true` only from those exact predicates;
   - false execution and exhaustive downstream authority.
7. Authenticate a future Plan-112 literal-zero review trio that binds the exact committed live-v9 executable closure.
8. Authenticate supplement-v2, which joins the unchanged pair/stop, exact corrected Plan-108 trio, exact live-v9 closure, and exact Plan-112 review trio without creating an envelope, capacity, reset, or execution authority.
9. Require the supplement-v1 and all live/downstream destinations absent before the sole production call.
10. Authenticate the same live-v9 executable closure and protected history after every producer outcome in a `finally`-equivalent path. Preserve a lone producer error unchanged and surface simultaneous producer/custody errors together.

### Test seam

The only exported synthetic seam may accept already materialized custody values and return `producerWouldInvoke:true`; it must be structurally incapable of receiving or calling a producer. Production exports and CLI modes close directly over real authenticators.

### Source-closure scope

The reviewed execution closure must contain the model, native custody helper, native owner-lock source, historical v3 producer, live-v9 adapter, and every recursively imported executable dependency. live-v8 is historical context, not the invoked owner.

## Plan 112: Independent Semantic and Executable Review

Plan 112 is a separate plan/reviewer context, not a second task inside Plan 111. It publishes no supplement and invokes no live effect.

### Proposed files

- `scripts/check-v1-38-plan-262-112-live-v9-custody-v1.ts`
- `scripts/check-v1-38-plan-262-112-live-v9-custody-v1.test.ts`
- `.planning/artifacts/v1.38-plan-262-112-live-v9-custody-review-payload-v1.json`
- `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-112-REVIEW.md`
- `.planning/artifacts/v1.38-plan-262-112-live-v9-custody-review-carrier-v1.json`

### Independence requirements

- Locally implement Plan-108 v9 semantic derivation, pair semantics, protected history, and every domain-separated root. Do not call live-v9 acceptance functions to decide validity.
- Pin the exact Plan-111 source commit/tree/parent and derive raw modes/blobs, recursive imports, installed/native/toolchain closure, portable root, and full execution root independently.
- Run a disposable mutation matrix covering semantic substitution, publication-commit substitution, dirty/mode/rewrite drift, omitted recursive dependency, protected-history drift, pair/counter/authority drift, supplement substitution, generic bypass attempts, producer rejection, post-check drift, and forbidden effects.
- Exercise the actual live-v9 source-only check, prospective supplement-v2 derive/publish/check, and producer-incapable synthetic adapter branch using the same corrected Plan-108 and Plan-112 values that the real adapter will consume. No v8/v1 compatibility bundle may stand in for them.
- Separate observation from publication. Findings render a deterministic blocked trio; process-integrity failures that make publication untrustworthy stop without normalizing evidence.
- Use the non-recursive pattern: semantic payload root excludes only its own root; REVIEW contains semantic claims; external carrier binds exact payload/REVIEW bytes and modes without claiming its own blob. The later supplement binds the carrier root, so no fixed point exists.

## Revised Plan 109: One Supplement-v2

The current `262-109-PLAN.md` is stale and must not execute. Revise it to depend on Plan 112 and to publish only:

`.planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v2.json`

The supplement must bind:

- unchanged B3 pair blobs, roots, policy, identities, status, and zero counters;
- immutable Plan-93 stop and zero-consumption facts;
- exact corrected Plan-108 publication commit plus payload-v9/REVIEW-FIX/carrier-v2 roots;
- exact Plan-111 live-v9 source commit/tree/parent/path manifest/full closure;
- exact Plan-112 payload/REVIEW/carrier roots and literal-zero verdict;
- `supersessionScope:"executable_source_custody_only"`;
- `createsEnvelope:false`, `createsCapacity:false`, `resetsCounters:false`, `authorizesExecution:false`, and exhaustive false downstream authority.

Plan 109 must compare independently derived supplement bytes from Plan 112 with live-v9's prospective schema in a disposable repository before exclusive canonical publication. The supplement is committed once, checked from raw Git custody, and never rewritten.

## Revised Plan 110: Sole Live-v9 Owner

The current `262-110-PLAN.md` is stale and must not execute. Revise it to:

- depend on the corrected Plan 109 supplement-v2;
- invoke only `run-v1-38-bounded-retry-envelope-v3-live-v9.ts --run-reviewed-bounded-live-envelope` once;
- require live-v8 readiness to remain false because supplement-v1 is absent;
- preserve the existing v3 journal/private/terminal destinations and existing producer as the sole effect owner;
- retain all frozen three-route/twelve-observation/four-hour/backoff/calibration/reproduction bounds;
- perform live-v9 post-run custody checking after success or rejection;
- create no reproduction-v17, disposition, correction, activation, readiness, lifecycle, third envelope, capacity, reset, or downstream authority.

Revised Plan 94 must later bind the Plan-108 corrected trio, Plan-111 source, Plan-112 review, Plan-109 supplement-v2, and Plan-110 owner evidence without trusting the producer's verdict.

## Dependency and Wave Revision

| Order | Plan | Responsibility | Dependency |
|---|---|---|---|
| 1 | 262-111 | Additive closed live-v9 source and tests | blocked Plan-108 re-review plus immutable prior chain |
| 2 | 262-112 | Independent semantic/executable review of live-v9 | exact committed Plan-111 source |
| 3 | 262-109 revised | Publish/check the one supplement-v2 | literal-zero Plan-112 trio |
| 4 | 262-110 revised | Sole live-v9 invocation | committed supplement-v2 plus standing operator authority |
| 5 | 262-94 revised | Independent terminal adjudication | Plan-110 terminal evidence |
| 6 | 262-95 revised | Stage-1 readiness/verification | Plan-94 verdict |
| 7 | 262-106 | Stage-2 lifecycle owner | Plan-95 readiness |

Plan numbers need not imply execution order; dependencies and waves must. ROADMAP/STATE should be revised during planning, not by this research-only task.

## Validation Architecture

### Per-task gates

- Plan 111 TDD: generic-bypass rejection, exact corrected-trio semantic mutations, prospective Plan-112/supplement gates, producer rejection plus post-custody drift, and no canonical effects.
- Plan 112 TDD: independently fail each semantic field and mutation boundary; prove blocked publication and all actual disposable modes.
- Plan 109: exclusive supplement-v2 publication, raw committed custody, exact rerender, unchanged canonical hashes, and all live destinations absent.
- Plan 110: pre-effect v9 readiness, one live dispatch only, bounded terminalization, post-effect closure, and Plan-94-only next authority.

### Phase gate before any live dispatch

Run serially: live-v9 focused suite, Plan-112 reviewer suite, v7 pair checker, corrected Plan-108 exact semantic checker, Plan-112 committed review checker, supplement-v2 checker, TypeScript, whitespace validation, and forbidden-destination absence. No verification command before Plan 110 may invoke the production mode.

## Threat Model

| Threat | Severity | Required mitigation |
|---|---|---|
| Arbitrary self-consistent corrected trio | critical | Pin `2639ff3b...` and exhaustively rederive semantics; never scan for a substitute publication. |
| Corrected review disconnected from live owner | critical | Pass the exact v9/Plan-112/supplement-v2 values through live-v9's producer-incapable branch and real pre-effect gate. |
| New adapter left unreviewed | critical | Separate Plan 112 review of the exact committed Plan-111 closure. |
| Recursive review fixed point | critical | Semantic payload + human REVIEW + external carrier, followed later by supplement-v2. |
| Generic production bypass | critical | No gate/producer dependency injection; producer-incapable value-only test seam. |
| Old live-v8 accidentally activated | critical | Keep supplement-v1 absent and assert live-v8 remains ineligible. |
| Pair/capacity/counter rewrite | critical | Exact B3 raw custody and false creation/reset fields; no seal/envelope edit. |
| Exceptional producer path skips custody | high | `finally`-equivalent post-check with primary error preservation. |

## Rejected Alternatives

### Patch live-v8

Rejected. It would rewrite reviewed executable history and invalidate prior closure claims.

### Treat corrected v9 as enough and publish supplement-v2 now

Rejected. The existing adapter cannot consume it, and the current checker accepts arbitrary self-consistent semantics.

### Publish supplement-v1 from the old v8 trio and separately check v9

Rejected. This recreates the disconnected compatibility bridge identified by `F-262-108-R2-02`; the supplement would not bind the evidence authorizing it.

### Put live-v9 and its independent review in one plan

Rejected. The reviewer must inspect an already committed immutable source closure from a separate execution context.

### Create another envelope or reset counters

Rejected. D-28R through D-31R allow no third envelope, capacity expansion, or reset. The current envelope remains unconsumed.

## Non-Authority

This research creates no Plan-109 eligibility, supplement, live invocation, route, capacity, counter reset, candidate, formation, holdout, public, product, production, counted-play, gameplay-change, archive, tag, or Phase-263 authority. It changes no source, review history, canonical pair, or runtime artifact.

## Sources

- `262-108-REVIEW-FIX-REVIEW.md` — exact R2 blockers and required fixes.
- `scripts/run-v1-38-bounded-retry-envelope-v3-live-v8.ts` — immutable v8 path/schema and producer boundary.
- `scripts/check-v1-38-plan-262-108-live-controller-custody-v9.ts` — corrected semantic derivation, current substitution gap, and compatibility bridge.
- `262-107-RESEARCH.md` — original same-envelope recovery constraints and non-recursive review architecture.
- `262-109-PLAN.md` and `262-110-PLAN.md` — stale supplement-v1/live-v8 ownership that must be revised after new gates.
- `262-CONTEXT.md` D-01/D-02 and D-23R through D-32R — immutable evidence, standing bounded authority, no third envelope/reset, reduced assurance, and downstream denial.

No external dependency or web research is required; this is a repository-local custody topology decision.
