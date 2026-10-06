# Plan 265-16 Host-Stage v7 Research

**Research date:** 2026-10-06  
**Scope:** Additive source-only research for the approved prospective host-stage repair and bounded continuation; not empirical admission or Phase 265 completion.  
**Confidence:** HIGH for repository seams and approval; MEDIUM for the proposed v7 implementation shape.

## User Constraints

### Locked decisions

- Approval is prospective only. Historical proposals, consumed artifacts, v1-v6 schemas/routes/policies/bytes and failures remain unchanged.
- New allocations only use the cumulative 57,600,000 ms envelope (16 hours), carrying the exact predecessor accounting, all 28 charged Matches, surviving files, and every later task cost; 15,000,000,000 bytes and 300 Matches remain unchanged. Historical peak disk/RSS remain unknown.
- Preserve guest 1000 ms, host 5000 ms, trusted startup 2500 ms, cancellation <=100 ms, Match 600000 ms, next-Match reserve 1860000 ms, 4x inflate guard, full audits, and all gameplay/runtime/resource/privacy/accounting/lineage bounds.
- Implement and independently review/fix/validate/source-verify trusted host-stage finite diagnostics before empirical preparation. Strategy-controlled labels/messages/stacks are not provenance; expose no raw private source, objective, memory, runtime I/O, stdio, exception or stack.
- After all source and capacity gates, exactly one distinct fresh private diagnostic is allowed; only after its complete acceptance, at most one distinct fresh 36-cell baseline. A failure/refusal ends the envelope; no automatic extra attempt.
- Each route requires independently reviewed fixed source and actual MAIN-authored data/helper, a new immutable allocation committed before its unique MAIN entry, a fresh checked empty 0700 store, and fresh passing same-process capacity before charge/provider dispatch. Hold source and HEAD fixed through terminal and one appropriate unique check. No result/head means terminal-only verification, never fabricated reader input.
- No retry/resume/replacement/refund/reinterpretation/recredit. Phase 265/LEAG-01–09 remain incomplete; no formation, holdout opening, public, counted or production authority.

These constraints are copied from the approved [host-stage approval](NEW265-16-HOST-STAGE-APPROVAL-20261006.md) and controlling phase context. [VERIFIED: repository]

### Discretion and deferred ideas

No discretion is granted to widen or reinterpret the diagnostic, budgets, game rules, privacy, or downstream authority. The deferred formation/holdout and later-rules work remain out of scope. [VERIFIED: repository]

## Summary

The retained v6 baseline facts are finite and do not establish cause: 3 charged, 2 finite successful terminals, third charge without terminal, no result, no stop prefix; initiating cause unknown. The route charges in `run-v1-38-lean-correction.ts` before awaiting `runLeanBaselineMatch`; subsequent retention/replay publication precedes observation publication. The Match wrapper catches some run failures, but prelude and post-run/compact/semantic work has other rejection paths. The child terminal classifier intentionally reports unknown stage for both unmatched errors and recognized error codes; a Strategy-controlled error string cannot safely distinguish host stage. [VERIFIED: repository; see `.planning/debug/v6-baseline-third-charge.md` and source references below]

**Primary recommendation:** Add a separately rooted v7 route with a small, fixed host-owned stage enum and stage-transition custody spanning charge → input/prelude → Match composition → result projection → compact validation → replay retention/encoding/publication → terminal append → observation/result/stop publication. Capture the current stage from trusted host control flow, not exception text. On failure, publish only a bounded enum/category receipt and existing safe terminal metadata. Keep cause `unknown` unless a trusted boundary observation proves only the stage where failure surfaced; never upgrade that to a specific root cause.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Assign host-stage provenance | Private CLI child / host orchestration | Match wrapper | Stage ownership exists in trusted host control flow around charge and dispatch, not in Strategy output. |
| Match invocation and bounded result projection | Match composition layer | Private CLI child | The Match wrapper is the narrow point for composition/run outcomes; the caller owns prelude and post-run work. |
| Replay/compact retention and terminal evidence | Private persistence/ledger layer | Private CLI child | This layer validates compact records, encodes/publishes retained replay, then appends terminal evidence. |
| Admit v7 authority and preserved predecessor | Allocation/policy authority | Retained reader | Schemas, roots, route paths, caps and predecessor accounting must be reconstructed and joined before execution or acceptance. |
| Enforce privacy and protocol | Child IPC/retained readers | Parent terminalizer | Exact finite wire schema must reject arbitrary child strings and preserve bounded failure distinctions. |

## Standard Stack

### Core

| Component | Version | Purpose | Why standard |
|---|---|---|---|
| Existing TypeScript/Node CLI and Vitest fixture | Repository-pinned | Implement private route state, strict schemas, and synthetic regressions. | These are the existing Plan 16 execution and test seams; no external package is needed. [VERIFIED: repository] |

No new packages are recommended or required. The task is source/configuration-only and must not add runtime dependencies. [VERIFIED: repository]

### Alternatives Considered

| Instead of | Could use | Tradeoff |
|---|---|---|
| New v7-only schemas/routes and stage receipt | Mutate v6 receipt or reinterpret historical v6 evidence | Rejected: violates immutability and cannot recover discarded provenance. |
| Host-authored enum transitions | Parse error message, stack, Strategy label, or exception name | Rejected: untrusted/ambiguous and may leak private content. |
| One stage for all child failures | Distinct narrow phases plus `unknown` fallback | Rejected: would retain the exact observability gap. |

## Architecture Patterns

### Current charged-to-terminal path

```text
parent validates source/identity/capacity
  -> durable charge
  -> runLeanBaselineMatch (prelude + Match wrapper/composition + projection)
  -> retainLeanMatch (compact validation + optional replay encode/write + terminal append)
  -> publish observation
  -> checkpoint / stop / verify / publish result
  -> parent observes exit and publishes bounded child terminal
```

The `runLeanBaselineMatch` try/catch does not cover every prelude or post-run operation; `retainLeanMatch` can reject before terminal append. Therefore the critical boundary is to preserve a host-authored stage immediately before each stage's fallible work and bind it to allocation/charge/slot roots. It may additionally record a finite transition sequence/root in the ledger so later retained verification can authenticate chronology. [VERIFIED: repository: `scripts/run-v1-38-lean-correction.ts:648-660`; `scripts/lib/v1-38-lean-baseline-match.ts:161-183`; `packages/strategy-lab/src/league/lean-experiment.ts:1352-1360`]

### Recommended v7 failure evidence

Use a discriminated, versioned finite receipt with fields limited to route/allocation/charge/slot roots, an allowlisted stage enum, a safe failure class enum (for example expected guard, host exception, publication failure, or stage-not-observed), and bounded parent-observed exit/cleanup facts already permitted by policy. Exact keys, root recomputation, strict stage-transition order and maximum counts are required. Unknown or missing transition evidence remains `stage: "unknown"`, with cause unknown. Do not retain arbitrary `Error`, message, name, code, stack, path, stderr or Strategy-supplied field. [VERIFIED: current trust boundary; proposed schema is MEDIUM confidence]

Stage labels should distinguish at least: `charged`, `prelude`, `match_compose`, `match_run`, `result_projection`, `compact_validate`, `replay_encode`, `replay_publish`, `terminal_append`, `observation_publish`, `result_publish`, and `unknown`. Keep this enum narrow and versioned; map a caught error to the last trusted host-set stage only. Add an explicit rule that a stage receipt locates the observation boundary, not necessarily the originating defect. [ASSUMED: enum granularity recommendation]

### Finite predecessor authentication

The new v7 predecessor must authenticate exact v6 baseline allocation, terminal, ledger, time and result-root custody plus the established charge count of 28, using finite metadata/roots only. Preserve the existing carried elapsed upper bound and 16-hour origin from the approval: `41,943,494 ms` prior carry at current turn start `1791290048578`; the v6 baseline time ledger had `41,342,676 ms` at effective close `1791252224672`, and only the independently bounded idle interval is excluded. Require exactly one open current interval and forbid caller-created gaps/overlapping discounts. Do not invoke the v6 empirical reader, rescan full empirical payloads, infer the missing terminal, or fabricate a stop/result. [VERIFIED: approval and v6 decision; approval root `sha256:91dfc7cd1030174003a77e9e05a1c8681224ab7a02119495c8e7b77df70a28f4`]

New v7 calendar/path/policy/approval roots and checked supplement roots must be disjoint from v6. Strict consumers should accept exactly one open current accounting interval and its expected close; old v6 consumers must reject v7 artifacts. Preserve all v6 and prior bytes/behavior unchanged. [VERIFIED: approval; consistent with current route architecture]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Trusting a failure origin | Free-form message/name/stack parser | Host-maintained finite stage transitions and allowlisted receipt | Arbitrary exception text is not authenticated provenance and can expose private data. |
| Evidence accounting | Recompute historical payloads or assume missing terminal/result | Exact authenticated roots and finite v6 allocation/terminal/ledger/time metadata | The prior evidence is consumed; no old reader or reinterpretation is authorized. |
| Version isolation | Shared mutable policy/path/schema used by v6 and v7 | Additive v7 discriminants, constants, paths, policy and strict dispatch | Keeps historical bytes and authority stable and blocks downgrade/aliasing. |

## Common Pitfalls

1. **Treating stage as cause.** A host stage only identifies where an exception surfaced. Retain initiating cause as unknown unless independently proven.
2. **Trusting Strategy-originated error fields.** Strategy labels, text, stack, names and codes cannot set host provenance. Convert to safe generic category at a trusted host catch.
3. **Instrumenting only the Match catch.** Prelude and retention/terminal publication are outside the wrapper; transition updates must cover each fallible section after durable charge.
4. **Publishing a receipt after the terminal gap without custody.** Bind stage transitions/receipt to the same allocation, slot and charge, and verify order against ledger charge/terminal roots.
5. **Accidental legacy acceptance.** Update every strict consumer and test v1-v6 rejection/unchanged fixtures; do not rely on default-version fallthrough.
6. **Historical overread.** Predecessor verification is finite metadata/root authentication, never a full historical reader, replay decode, raw payload scan, or invented terminal.
7. **Accounting discontinuity.** Use the exact approval time arithmetic and one open interval; count all current-turn work and exclude only the explicitly bounded idle gap.
8. **Overclaiming empirical value.** Passing synthetic source tests establishes route behavior only; no root cause, Match success, league completion, freeze or phase credit follows.

## Smallest Recommended Source Closure

The v7 manifest should include every modified producer and consumer below; this is a minimum review map, not a claim each file must change:

- `scripts/run-v1-38-lean-correction.ts` — v7 identity, stage scope, request/approval/supplement roots, source manifest, finite admission/receipt publication and child dispatch.
- `scripts/lib/v1-38-lean-child-cli-terminal.ts` — versioned receipt schema/allowlist and bounded child IPC; preserve legacy v1-v6 classifier behavior.
- `scripts/lib/v1-38-lean-baseline-match.ts` — explicit trusted composition/run boundary evidence, without Strategy text.
- `packages/strategy-lab/src/league/lean-experiment.ts` — v7 allocation/mode/path/policy/cap reconstruction, predecessor roots and ledger stage records.
- `scripts/run-v1-38-lean-baseline.ts` — parent-side receipt validation and terminalization/parent summary binding.
- `scripts/lib/v1-38-lean-correction-retained.ts` — exact inventory, schema joins, stage chronology, no-result terminal-only path, and v7 one-time reader closure.
- `scripts/lib/v1-38-lean-experiment-authority.ts`, `scripts/lib/v1-38-lean-baseline-source.ts`, `scripts/lib/v1-38-lean-startup-supervisor.mjs` — update only if their strict unions or root propagation require v7 identity; prove unchanged if not.
- New v7 policy/approval/supplement artifact(s), shell CLI route mapping, and dedicated synthetic test fixture; keep v6 fixture/policy immutable.

Existing seam evidence: mode/schema/path constants and unions are in `lean-experiment.ts` (including `leanCorrectionRoutePaths`, `leanSupervisorAllocationMode`, `leanWritablePaths`, allocation constructors/admission, and `verifyLeanEvidence`). Current v6 source manifest is assembled in `run-v1-38-lean-correction.ts` and pins many cross-layer files. Retained route identity, inventory, reader close, diagnostic-check charge count and source publisher joins are explicit in `lean-correction-retained.ts`. All strict consumers and shell command dispatch need a v7 positive path and v1-v6 negative/compatibility evidence. [VERIFIED: repository]

## Validation Architecture

### Test framework

| Property | Value |
|---|---|
| Framework | Existing Vitest 4.x repository dependency; use installed lockfile version, do not install/update packages. [VERIFIED: `package.json`] |
| Focused command | `node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-host-stage-v7.test.ts --maxWorkers=1` (exact new filename to be chosen consistently) |
| Compatibility command | Same runner with v7 and v6 fixtures; include legacy v1-v5 strict refusal/unchanged behavior controls. |

### Required synthetic cases

| Behavior | Test |
|---|---|
| Correct stage surfaced | Inject synthetic host throws independently at prelude, composition/run, projection, compact validation, replay encoding/publication, terminal append, observation and result publication; assert only the trusted stage enum and no raw error fields. |
| Spoof resistance | Strategy-controlled message/name/stack/code claiming every host stage cannot alter stage, code class, or receipt; malformed and extra IPC keys reject. |
| Failed/missing stage write | Transition publication failure or absent stage record stays unknown/non-accepting; does not fabricate terminal/result or turn child failure into success. |
| Charge chronology | 0/1 successful terminals then charged third nonterminal fixture stays 3 charges / 2 terminals; no stop/result is synthesized. Stage record identifies boundary only. |
| Strict chain | Mismatched allocation/slot/charge roots, out-of-order/duplicate transitions, illegal stage skips, unknown enum values, and excessive records reject. |
| Version fences | v1-v6 fixtures and paths remain byte-/behavior-compatible; old readers reject v7 and v7 readers reject old-schema substitutions. |
| Predecessor | Exact finite v6 roots + 28 charges + elapsed carry pass without historical data-reader invocation; wrong roots/count/time, extra open interval, gap, overlap, or invented result fail. |
| Privacy | Serialized receipt/terminal/public summary contains only roots, finite enums and approved bounded counters; no Strategy source, objective/memory, runtime I/O, exception output or stack. |
| Accounting | All current task time counts from `1791290048578`; exact 16h/15GB/300 charge, unchanged guest/host/startup/Match and next-Match reserve edges; no extra attempt auto-dispatch. |

No new package is required. No native/runtime/Docker/Match/helper/provider or historical empirical payload operation belongs in this source-only validation. [VERIFIED: approval/scope]

## Security Domain

| ASVS category | Applies | Control |
|---|---|---|
| V2 Authentication | Yes | Only exact reviewed approval/supplement roots and MAIN-authored one-use route authority grant v7. |
| V3 Session Management | Yes | Bind unique parent/child lifecycle, allocation, charge, stage sequence and terminal closure; fail closed on disconnect/cleanup uncertainty. |
| V4 Access Control | Yes | Private offline only; no public/counting/production/holdout authority; no bypass via legacy CLI or schema fallback. |
| V5 Input Validation | Yes | Exact-key schemas and enums at request, child IPC, ledger, retained-reader and predecessor boundaries. |
| V6 Cryptography | Yes | Reuse repository canonical root/hash conventions; no custom crypto. |

Threats: malicious Strategy spoofing host stage, malformed child IPC, stale/cross-version artifact substitution, partial receipt/terminal writes, and privacy leakage through exception serialization. Mitigate with host-authored state transitions, exact versioned schemas/root joins, finite bounded wire data, and synthetic adversarial tests. [VERIFIED: repository boundary; controls recommended]

## Environment Availability

No external runtime dependencies are in scope. Use existing local source/test toolchain only; native tools, Docker, Match execution, providers and empirical readers are explicitly excluded. [VERIFIED: approval/scope]

## Open Questions

1. Should stage transitions be appended as small ledger events or committed in a separate immutable stage receipt? Prefer append-only ledger records if the existing ledger validator can strictly reconstruct sequence without changing v1-v6 interpretation; otherwise use a v7-only bounded receipt joined by charge root.
2. Which host stage labels are the minimum useful partition? The proposed enum intentionally distinguishes composition, compact/replay retention, terminal and result publication; independent review should remove labels that cannot be set reliably at an exact host boundary.
3. The v6 historical initiating cause remains unknown even if v7 accurately localizes a future failure; do not state otherwise.

## Sources

### Primary (HIGH confidence)

- `NEW265-16-HOST-STAGE-APPROVAL-20261006.md` — approved envelope, limits, gates and no-retry terms.
- `NEW265-16-REPLAY-V6-CONTINUATION-DECISION-v1.md` — finite predecessor time carry, baseline status and proposed bound now approved prospectively.
- `.planning/debug/v6-baseline-third-charge.md` — bounded source diagnosis and exact known/unknown boundary.
- `scripts/run-v1-38-lean-correction.ts:648-660, 711-715` — charge, Match call, retention and child classifier sequence.
- `scripts/lib/v1-38-lean-baseline-match.ts:161-183` — Match error conversion and uncovered surrounding stages.
- `scripts/lib/v1-38-lean-child-cli-terminal.ts:67-102` — current finite allowlist, unknown-stage behavior and bounded IPC.
- `packages/strategy-lab/src/league/lean-experiment.ts:1352-1370` — compact validation, replay encode/publication and terminal append.
- `scripts/run-v1-38-lean-baseline.ts:308-365` — parent terminalization and safe reason reporting.
- `scripts/lib/v1-38-lean-correction-retained.ts` and `scripts/lib/v1-38-lean-experiment-authority.ts` — strict retained and authority joins.
- `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-REPLAY-V6-PLAN-v1.md` — v6 additive wiring and immutable predecessor pattern (reference only; v7 must use the new approval/supplement).
- `AGENTS.md`, `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/research/SUMMARY.md`, `265-CONTEXT.md` — project boundaries and phase constraints.

## Metadata

**Confidence breakdown:** repository seams HIGH; approval/accounting bounds HIGH; proposed stage granularity MEDIUM pending independent review.  
**Valid until:** 2026-10-13 (short validity because the active Plan 16 source frontier and accounting clock are fast-moving).
