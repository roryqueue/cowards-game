---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "57"
type: execute
wave: 47
depends_on: [262-56]
files_modified:
  - .planning/artifacts/v1.38-plan-262-57-route-start-v1.json
  - .planning/artifacts/v1.38-current-matrix-headroom-preflight-v11.json
  - .planning/artifacts/v1.38-current-matrix-calibration-v11.json
  - .planning/artifacts/v1.38-current-matrix-reproduction-v12.json
  - .planning/artifacts/v1.38-plan-262-57-calibration-consumption-v1.json
  - .planning/artifacts/v1.38-plan-262-57-reproduction-consumption-v1.json
  - .planning/artifacts/v1.38-plan-262-57-pre-start-obstruction-v1.json
  - .planning/artifacts/v1.38-plan-262-57-terminal-v1.json
autonomous: false
requirements: [ADMIT-01, ADMIT-02, ADMIT-03, ADMIT-04, MEAS-10, SEAL-01]
must_haves:
  truths:
    - "Only the main orchestrator may consume exact checked A9/B9 authorization-v9/seal-v9 after proving clean ownership, zero active helpers/executors, fresh authority bytes, and absence of every route-ordinal-7 live destination."
    - "The route performs exactly one 200 ms headroom preflight against the inclusive 2,500-basis-point threshold, then at most one 8-attempt/4-shard calibration, then conditionally at most one 540-cell reproduction."
    - "Any obstruction detected before durable route start writes one distinct exclusive pre-start obstruction disposition outside the canonical terminal path and leaves the terminal absent."
    - "One exclusive atomic route-start receipt durably binds the complete context:v11 plus preflight-consumption identity before any observation; there is no two-file partial-start state, and every later reached stage writes its marker before its effect and maps to exactly one checked terminal branch."
    - "Literal ADMIT-03 pass requires reproduction_passed with exactly 540 freshly charged and 540 accepted unique cells plus zero system, legality, privacy, duplicate, conflict, missing-cell, cleanup, identity, or formation-absence violations."
    - "Every terminal permanently expires authority with no retry, repair, resume, or partial evidence reuse; a non-pass remains honest process evidence and grants no downstream authority."
  artifacts:
    - path: .planning/artifacts/v1.38-plan-262-57-terminal-v1.json
      provides: "Single immutable terminal for the one authorized route-7 execution"
    - path: .planning/artifacts/v1.38-plan-262-57-route-start-v1.json
      provides: "Single atomic durable route-start receipt binding execution context:v11 and preflight consumption before observation"
    - path: .planning/artifacts/v1.38-current-matrix-reproduction-v12.json
      provides: "Conditional complete 540-cell current-rules reproduction evidence; absent unless calibration admits"
    - path: .planning/artifacts/v1.38-plan-262-57-pre-start-obstruction-v1.json
      provides: "Conditional non-terminal disposition for an initial exclusive-destination obstruction before route start"
  key_links:
    - from: .planning/artifacts/v1.38-successor-source-seal-v9.json
      to: .planning/artifacts/v1.38-plan-262-57-route-start-v1.json
      via: "Exact A9/B9 authority-v9 custody, main-only ownership, fresh-destination check, and one atomic publication binding context:v11 plus preflight consumption"
      pattern: "routeOrdinal"
    - from: "initial route-7 destination inventory"
      to: .planning/artifacts/v1.38-plan-262-57-pre-start-obstruction-v1.json
      via: "Exclusive non-overwriting pre-start disposition when any context/receipt/marker/terminal destination is already occupied, aliased, symlinked, or colliding"
      pattern: "pre_start_destination_obstructed"
    - from: .planning/artifacts/v1.38-current-matrix-calibration-v11.json
      to: .planning/artifacts/v1.38-current-matrix-reproduction-v12.json
      via: "Only exact admitted 8/8/4 calibration may launch one 540-cell reproduction"
      pattern: "reproductionAdmitted"
    - from: .planning/artifacts/v1.38-current-matrix-reproduction-v12.json
      to: .planning/artifacts/v1.38-plan-262-57-terminal-v1.json
      via: "Exact branch-specific terminal evidence and permanent authority expiry"
      pattern: "reproduction_passed"
  prohibitions:
    - statement: "Do not execute from a helper/subagent/worktree, with active executors, from a dirty or non-main context, or without exact A9/B9 and fresh destination checks."
      status: locked
    - statement: "Do not read, create, or affirmatively consume obsolete authorization/seal v7 or v8 future paths; route ordinal remains 7 while authority/seal schema and paths are v9."
      status: locked
    - statement: "Do not run a second preflight, calibration, reproduction, or route; do not retry or reuse partial receipts after any terminal or interruption."
      status: locked
    - statement: "Do not change thresholds, counts, timing, kernel/runtime/predicate/gameplay/privacy/formation policy, open the holdout, or perform candidate/product/UI/schema work."
      status: locked
---

<objective>
Consume exact A9/B9 authorization-v9 authority once from the main orchestrator, execute unchanged route ordinal 7 with v11/v12 artifacts, and seal one truthful permanent terminal.

Purpose: Produce literal ADMIT-03 evidence only through the unchanged supervised current-rules route while accounting for every stopped/failure branch.
Output: Either one pre-start obstruction disposition with no terminal, or context, stage markers/receipts, conditional v12 reproduction, one checked Plan-262-57 terminal after durable start, and a public-safe summary.
</objective>

<execution_context>
@/Users/roryquinlan/.codex/gsd-core/workflows/execute-plan.md
@/Users/roryquinlan/.codex/gsd-core/templates/summary.md
</execution_context>

<context>
@AGENTS.md
@.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-CONTEXT.md
@.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-53-RESEARCH.md
@.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-53-SUMMARY.md
@.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-54-SUMMARY.md
@.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-62-SUMMARY.md
@.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-56-SUMMARY.md
@.planning/artifacts/v1.38-plan-262-56-authorization-v9.json
@.planning/artifacts/v1.38-successor-source-seal-v9.json
@scripts/lib/v1-38-current-matrix-reproduction.ts
@scripts/lib/v1-38-successor-source-seal.ts
</context>

<tasks>

<task type="checkpoint:human-action" gate="blocking-human">
  <name>Task 1: Confirm exact A9/B9 and exclusive main-orchestrator ownership</name>
  <read_first>
    - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-56-SUMMARY.md
    - .planning/artifacts/v1.38-plan-262-56-authorization-v9.json
    - .planning/artifacts/v1.38-successor-source-seal-v9.json
    - .planning/artifacts/v1.38-plan-262-62-source-completeness-review-v3.json
    - .planning/artifacts/v1.38-plan-262-47-pre-execution-source-failure-v1.json
    - scripts/lib/v1-38-successor-source-seal.ts
    - scripts/lib/v1-38-current-matrix-reproduction.ts
  </read_first>
  <files>.planning/artifacts/v1.38-plan-262-56-authorization-v9.json, .planning/artifacts/v1.38-successor-source-seal-v9.json, .planning/artifacts/v1.38-plan-262-57-pre-start-obstruction-v1.json</files>
  <action>Run v9 custody and source-completeness checks before any route write. Require exact zero-finding A9, direct-child/two-path B9, working/blob equality, the fresh authorization-v9 literal, objective review-v3 root/bytes, false identity/custody claims, A7 and older protected history, source-failure disposition, all forty historical charges and prior authorization bytes, exact v3 local-seal/policy/lineage/gameplay/runtime/privacy/formation roots, both obsolete v7 future paths absent, and an exact inventory of the route-ordinal-7 atomic route-start, every later receipt/consumption marker, and terminal destination. Immediately before Task 2 prove repository root, clean dependency-complete main, main-orchestrator ownership, no active helper/subagent/executor, and no disposable worktree/process from prior proof. Preserve route ordinal 7 and execution context/preflight/calibration v11 plus reproduction v12. If every route destination is fresh, leave the distinct pre-start disposition absent, print the exact operator consumption phrase `consume-route-ordinal-7-once sourceA9=&lt;FULL_A9_OID&gt; sourceB9=&lt;FULL_B9_OID&gt;`, and block. This is a non-auto-bypassable human action: ignore `workflow.auto_advance`, yolo/default approvals, the former `approved-main-only-once` phrase, generic approval, and synthesized agent text. Continue only when the operator returns that exact phrase with the checker-derived full OIDs byte-for-byte in this checkpoint context; Task 2 must validate it again immediately before the first irreversible write. If any route destination is occupied, aliased, symlinked, or colliding, do not present the phrase, touch/overwrite it, or write the canonical terminal; exclusively publish the pre-start obstruction disposition with bounded evidence, run its checker, create the bounded summary, and stop. If that disposition path is also unavailable, stop with every existing byte preserved, no summary, no unsupported expiry claim, no observation/effect/downstream authority, and a mandatory new corrective inspection plan.</action>
  <verify><automated>pnpm exec tsx scripts/lib/v1-38-successor-source-seal.ts --check-plan-262-56-authorization-v9 --authorization .planning/artifacts/v1.38-plan-262-56-authorization-v9.json --seal .planning/artifacts/v1.38-successor-source-seal-v9.json &amp;&amp; test ! -e .planning/artifacts/v1.38-plan-262-56-authorization-v7.json &amp;&amp; test ! -e .planning/artifacts/v1.38-successor-source-seal-v7.json &amp;&amp; test ! -e .planning/artifacts/v1.38-plan-262-56-authorization-v8.json &amp;&amp; test ! -e .planning/artifacts/v1.38-successor-source-seal-v8.json &amp;&amp; pnpm exec tsx scripts/lib/v1-38-current-matrix-reproduction.ts --resolve-plan-262-57-pre-start-v1 &amp;&amp; if test -f .planning/artifacts/v1.38-plan-262-57-pre-start-obstruction-v1.json; then pnpm exec tsx scripts/lib/v1-38-current-matrix-reproduction.ts --check-plan-262-57-pre-start-obstruction-v1; else pnpm exec tsx scripts/lib/v1-38-current-matrix-reproduction.ts --check-plan-262-57-pre-execution-readiness-v1; fi</automated></verify>
  <how-to-verify>
    1. Confirm the checker reports exact A9/B9, review-v3-aware authorization-v9, zero findings, clean main ownership, zero active helpers/executors, and the complete route-start/receipt/marker/terminal destination set absent.
    2. Confirm no live observation, child execution, or artifact write occurred during the check.
    3. Return only `consume-route-ordinal-7-once sourceA9=<FULL_A9_OID> sourceB9=<FULL_B9_OID>` with the exact checker-derived OIDs; any interruption requires rerunning the entire read-only gate and regenerating the phrase.
  </how-to-verify>
  <resume-signal>Operator must return the exact checker-rendered consumption phrase with full A9/B9 OIDs; no other phrase or auto-advance signal resumes this checkpoint.</resume-signal>
  <acceptance_criteria>
    - Exact A9/B9 custody and authorization-v9 bytes are fresh and checked immediately before the first write.
    - Main is clean, current executor ownership is exclusive, and all helpers are terminal.
    - The operator consumption phrase is exact, current-context-only, checker-derived, and independently revalidated immediately before Task 2's first write.
    - The clean branch has every route-7 destination absent and no pre-start disposition; an obstructed branch has exactly one checked pre-start disposition, preserves the obstructing bytes, and has no route terminal.
  </acceptance_criteria>
  <done>The sole fresh route is either immediately ready for one main-only consumption or wholly unstarted and blocked.</done>
</task>

<task type="auto">
  <name>Task 2: Execute the one conditional v11/v12 route and seal its terminal</name>
  <read_first>
    - .planning/artifacts/v1.38-plan-262-56-authorization-v9.json
    - .planning/artifacts/v1.38-successor-source-seal-v9.json
    - scripts/lib/v1-38-current-matrix-reproduction.ts
    - scripts/lib/v1-38-current-matrix-child-protocol.ts
    - .planning/artifacts/v1.38-pre-search-policy-root.json
    - .planning/artifacts/v1.38-local-seal-independent-verification-v3.json
  </read_first>
  <files>.planning/artifacts/v1.38-plan-262-57-route-start-v1.json, .planning/artifacts/v1.38-current-matrix-headroom-preflight-v11.json, .planning/artifacts/v1.38-current-matrix-calibration-v11.json, .planning/artifacts/v1.38-current-matrix-reproduction-v12.json, .planning/artifacts/v1.38-plan-262-57-calibration-consumption-v1.json, .planning/artifacts/v1.38-plan-262-57-reproduction-consumption-v1.json, .planning/artifacts/v1.38-plan-262-57-pre-start-obstruction-v1.json, .planning/artifacts/v1.38-plan-262-57-terminal-v1.json</files>
  <action>Proceed only from Task 1's clean branch with the pre-start disposition absent. Recheck zero helpers/executors, exact A9/B9 authorization-v9 custody, obsolete-v7 absence, and every route-ordinal-7 destination absence, then build one closed route-start object that binds the complete context:v11 identity and the preflight-consumption identity. Write and fsync validated canonical bytes to an owner-only no-follow temporary sibling, publish with one atomic no-replace operation to the exclusive canonical route-start destination, fsync the parent directory, remove any unpublished temporary sibling, and read back/check the canonical receipt. Only successful publication and read-back validation of this single receipt defines `routeStarted:true`; there is no separate context or preflight-marker write and therefore no visible partial-start state. Before any observation, require the checked route-start receipt, then invoke exactly one 200 ms headroom observation and apply the inclusive 2,500-basis-point threshold. Only an admitted preflight may publish the calibration marker and invoke one allocation of exactly eight charged attempts across four inventory-owned shards using the supervised runtime path and protocol-v2. Require exact launched/terminal accounting, bounded projection, sibling cancellation, buffer zeroing, and process-group cleanup. Only exact admitted 8/8/4 may publish the reproduction marker and invoke at most one reproduction:v12 with exactly 540 freshly charged unique cells. After durable route start, terminalize exactly once for consumed-stage interruption, pre-observation failure, preflight unavailable/refused, calibration stopped, reproduction stopped, or literal reproduction pass. A route-start collision/failure before successful publication invokes the same exclusive pre-start-obstruction writer and checker from Task 1, never the terminal. If that obstruction path is itself unavailable, preserve every byte and stop without observation, terminal, summary, retry, overwrite, or unsupported claim of recorded expiry; require a separately planned inspection before any authority decision. A pass requires 540/540 plus every predicate/runtime/kernel/semantic/gameplay/privacy/cleanup/formation-absence check; otherwise accepted evidence stays fail-closed. Run the read-only terminal checker, expire authority permanently in every durably started branch, never retry, and create a summary only after the applicable obstruction or terminal checker passes.</action>
  <verify><automated>pnpm exec tsx scripts/lib/v1-38-current-matrix-reproduction.ts --check-plan-262-57-terminal-v1 --authorization .planning/artifacts/v1.38-plan-262-56-authorization-v9.json --seal .planning/artifacts/v1.38-successor-source-seal-v9.json --route-start .planning/artifacts/v1.38-plan-262-57-route-start-v1.json --preflight .planning/artifacts/v1.38-current-matrix-headroom-preflight-v11.json --calibration .planning/artifacts/v1.38-current-matrix-calibration-v11.json --reproduction .planning/artifacts/v1.38-current-matrix-reproduction-v12.json --terminal .planning/artifacts/v1.38-plan-262-57-terminal-v1.json &amp;&amp; pnpm turbo typecheck --concurrency=1 &amp;&amp; git diff --check</automated></verify>
  <acceptance_criteria>
    - A clean, durably started route has exactly one terminal matching its reached marker/receipt branch; a pre-start obstruction has the distinct checked disposition and no terminal.
    - Every reached allocation is charged and every launched child is terminal/cleanup-complete; raw/private output is absent.
    - Reproduction exists only after exact admitted 8/8/4 calibration and contains exactly 540 charged cells; ADMIT-03 pass requires exactly 540 accepted.
    - Authority is expired and no retry, repair, resume, or partial reuse path remains.
  </acceptance_criteria>
  <done>One immutable terminal truthfully records either literal 540/540 ADMIT-03 success or a permanent non-pass with complete accounting.</done>
</task>

</tasks>

## Artifacts this phase produces

- One atomic `v1.38-plan-262-57-route-start-v1.json` binding context:v11 and preflight consumption, plus later stage consumption markers and reached v11 preflight/calibration receipts
- Conditional `v1.38-current-matrix-reproduction-v12.json`
- Conditional `v1.38-plan-262-57-pre-start-obstruction-v1.json` only when an initial route destination is obstructed, with no terminal
- Exactly one `v1.38-plan-262-57-terminal-v1.json` only after durable route start
- `262-57-SUMMARY.md` only after the applicable pre-start-disposition or started-route terminal checker passes

<source_coverage_audit>
SOURCE | ID | Feature/Requirement | Plan | Status | Notes
GOAL | — | Exact authoritative admission under frozen contract | 262-57 | COVERED | One main-only route and terminal.
REQ | ADMIT-01/02 | Exact predecessor/selected tuple | 262-57 | COVERED | Rechecked in context and terminal.
REQ | ADMIT-03 | Fresh persisted current-matrix reproduction | 262-57 | COVERED | Exact conditional 540/540 latch.
REQ | ADMIT-04 | Stop on any incompatibility | 262-57 | COVERED | Exhaustive terminal branches and no retry.
REQ | MEAS-10/SEAL-01 | Frozen profile-neutral/local-seal roots | 262-57 | COVERED | Prerequisite only, no holdout/formation work.
RESEARCH | Main-only one-shot route with 2500 bp, 200 ms, 8/4, conditional 540 | 262-57 | COVERED | Tasks 1-2.
CONTEXT | D-01..D-22, D-19R/D-20R | Immutable, charged, supervised, private, unchanged-rule execution | 262-57 | COVERED | Every stage and terminal binds constraints.
</source_coverage_audit>

<threat_model>
## Trust Boundaries
| Boundary | Description |
|---|---|
| main orchestrator -> one-shot authority | Only exact clean exclusive ownership may consume B9 while route ordinal remains 7. |
| host observation/runtime children -> receipts | Untrusted live outputs must be bounded, charged, privacy-projected, and cleaned. |
| atomic route start and later stage markers -> effects | One checked route-start receipt precedes observation; later durable consumption markers precede their irreversible execution. |
| initial destination inventory -> pre-start disposition | Obstruction is recorded outside the terminal path without starting the route or overwriting evidence. |
| durably started route evidence -> terminal/ADMIT-03 | Exactly one terminal decides literal pass or permanent non-pass only after context plus preflight consumption are durable. |

## STRIDE Threat Register
| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|---|---|---|---|---|---|
| T-262-57-01 | Spoofing | A9/B9/main ownership/operator consumption | high | mitigate | Immediate full custody/readiness check, review-v3-aware authority validation, zero-helper gate, and non-auto-bypassable exact consumption phrase with full checker-derived A9/B9 OIDs. |
| T-262-57-02 | Tampering | route-start/obstruction/markers/receipts/terminal | high | mitigate | Single atomic no-follow route-start receipt, separate exclusive pre-start disposition, no overwrite, root joins, branch-specific checkers, and explicit no-claim stop if even the disposition path is obstructed. |
| T-262-57-03 | Repudiation | charges and interrupted work | high | mitigate | Marker-before-effect and complete charged terminal accounting. |
| T-262-57-04 | Information Disclosure | runtime/RSS/private output | high | mitigate | Protocol-v2 bounded projection, raw zeroing, privacy tests. |
| T-262-57-05 | Denial of Service | child/process lifecycle | high | mitigate | Frozen 200 ms/8/4 bounds, cancellation, process cleanup, no retry. |
| T-262-57-06 | Elevation of Privilege | ADMIT-03/downstream latch | high | mitigate | Exact 540/540 plus all noncompensating predicates; downstream remains false here. |
| T-262-57-SC | Tampering | package supply chain | low | accept | No install or dependency change occurs. |

ASVS L1, block on high: every high-severity mitigation must pass before terminal verification; any non-pass yields permanent fail-closed terminal evidence rather than retry.
</threat_model>

<verification>
- Exact A9/B9 and clean main-only ownership pass immediately; live-destination absence gates unchanged route ordinal 7 execution, while any initial obstruction routes only to the separate checked pre-start disposition.
- The applicable checker proves either a pre-start obstruction with 0/0 and terminal absence, or one atomic route-start receipt before observation plus later marker ordering, frozen preflight/calibration/reproduction cardinality, complete charges, cleanup, privacy, terminal branch, expiry, and no retry. If both start and disposition publication are impossible, execution stops without summary or unsupported evidence claim.
- No gameplay/runtime/privacy/formation/policy/package/schema/UI change occurs.
</verification>

<success_criteria>
- An initial obstruction produces one non-terminal pre-start disposition and no overwrite; otherwise exactly one authorized route is durably consumed and terminalized.
- The frozen 200 ms, inclusive 2,500 bp, 8/4, and conditional 540 policy is unchanged.
- Literal ADMIT-03 passes only on checked fresh reproduction_passed 540/540.
- Every non-pass is permanent, exactly accounted (0/0 before start or all reached work charged after start), and non-authorizing.
</success_criteria>

<output>Create `262-57-SUMMARY.md` only after either the read-only pre-start-obstruction checker or the read-only started-route terminal checker passes. Record bounded roots/counts/disposition/no-retry; omit raw/private output.</output>
