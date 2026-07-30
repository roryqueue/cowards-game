# Phase 262 Plan 15: Successor Source Seal and Effective-Available-Memory Admission - Research

**Researched:** 2026-07-30  
**Domain:** Immutable Git source custody and fail-closed macOS host-headroom admission  
**Confidence:** MEDIUM — the repository contracts are directly verified; the macOS recommendation is grounded in Apple, XNU, Node.js, libuv, and Git primary sources, but no live measurement command was permitted during research.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

## Implementation Decisions

### Milestone-wide integrity charter
- **D-01:** Evidence is immutable and content-addressed. There is no mutable `latest`; a changed input, policy, implementation, or result creates a new branch with a new root.
- **D-02:** Missing, stale, incompatible, contaminated, incomplete, mismatched, or non-reproducible evidence fails closed. Process/integrity failure is distinct from a process-valid empirical failure and blocks authoritative progress.
- **D-03:** The exact selected canonical `MATCH_KERNEL` remains the only transition authority, and hostile Strategy source remains behind the supervised runtime-service / Runtime Broker boundary. No copied rules, alternate scheduler, or Strategy execution in the coordinator, web, API, or Go is permitted.
- **D-04:** Lab evidence remains private and unreachable from production registration, persistence, scheduling, Chronicle, replay, standings, and public/default surfaces. Only exact eligible pre-formation current-league source hashes may later enter ordinary certification.
- **D-05:** Every attempt, retry, rejection, invalid output, duplicate, failure, system failure, and unused allocation remains charged and visible in its proper evidence ledger; accepted evidence cannot omit inconvenient work.
- **D-06:** Cycle-cap, MOVE/reversal, Backstab geometry/timing, scan timing, arena, runtime, product/public, and combined-rule changes remain unavailable in v1.38.

### Exact predecessor admission
- **D-07:** Authoritative v1.38 work begins only after a machine-checked join resolves the v1.37 audit, exact archive commit, annotated `v1.37` tag, independent post-tag result, and exact selected semantic/runtime authority tuple. Copied labels are not authority.
- **D-08:** The immutable v1.37 archive commit remains the release authority. Later non-semantic corrections are recorded as separate lineage and may inform current correctness checks, but they do not move, recreate, or silently reinterpret the tag or archived evidence.
- **D-09:** Any failed join, stale certificate, incompatible identity, semantic drift, or unexplained reproduction mismatch emits an explicit stop disposition back to the integrity foundation. Phase 262 must not normalize or repair the predecessor inside v1.38.
- **D-10:** Reproduce the persisted current-rules matrix's declared shape and expected results through the selected canonical kernel and supervised execution path. The audit script's `new Function` loader is historical reproduction material, not an execution mechanism to reuse. Starter and Advanced Strategies remain smoke, regression, and throughput fixtures only.

### Frozen measurement and budget contract
- **D-11:** Before inspecting candidate output, freeze one immutable contract for the primary estimand—separately adapted formation-specific metagames under the fixed factory—and the bracket/current, inward/current, and bracket/inward contrasts. Fixed-policy transfer is explicitly secondary screening.
- **D-12:** The contract fixes complete cells, scoring, draw value, both sides, both entrant-level initiative states, semantically distinct design arenas, all splits and opponent fields, matched root-seed blocks, stopping and response admission, finalist eligibility/cardinality, portfolio selection, robust-pure selection, and permitted claims.
- **D-13:** Freeze a multi-resource opportunity vector rather than a single fungible compute scalar: attempted candidates, accepted response slots and unfilled-slot disposition, response rounds, search/teacher/distillation work, Matches, model attempts/tokens, human effort/submissions, replay review, cache policy, retries, hardware class, runtime, source, objective, memory, and output limits.
- **D-14:** Contained profile-neutral calibration spikes may refine structural work units, denominators, retry/burn rules, and starting numeric gates before search. Direct Strategy work must be distinguished from provider, orchestration, and infrastructure overhead. Candidate outcomes may not influence calibration.
- **D-15:** The activation prompt's 64 KB hard source cap, preferred under-48 KB target, below-5 ms p99 starting target, population/core/finalist counts, response thresholds, probe threshold, red-team threshold, and Advanced-library regression threshold are calibration inputs. Any replacement value and its exact denominator must be justified and frozen before candidate output is inspected.
- **D-16:** Zero accepted runtime violations, system failures, legal-information violations, private-data leaks, missing cells, duplicate/conflicting results, or unproved identity joins is a hard evidence condition. System-failed work remains charged but can never be converted into gameplay or an accepted cell.
- **D-17:** Metric code, canonicalization, normalization, denominators, replication treatment, materiality thresholds, hard versus compensating gates, classifier fixtures, response/finalist rules, and report language are hashed with the contract. A composite result cannot override a mandatory integrity or rejection gate.
- **D-18:** Reports maintain separate fields for `process_status`, current-rules outcome, formation rejection/pass, and holdout contamination. A valid empirical failure is publishable evidence; threshold softening, selective failure omission, or stronger-than-oracle-relative claims are not.

### Holdout custody and pre-formation containment
- **D-19:** A separately permissioned custodian and private store control the holdout preimages and commitment material. The iterative experiment coordinator receives only a profile-agnostic commitment before opening and one bounded safe receipt after the authorized batch.
- **D-20:** Holdout lineage must prove that source data, training data, prompts, caches, opponent construction, and schedule construction contain no profile-conditioned or current-trained input. Custody records the named role, authorized opening actor, access/query ledger, storage identity, safe projection, contamination response, retention, and retirement.
- **D-21:** Premature access, unauthorized query, commitment mismatch, uncertain evaluator state, or disclosure outside the frozen safe projection is contamination, not a diagnostic opportunity. It follows the precommitted invalidation/reporting path and cannot be repaired with a replacement or second holdout.
- **D-22:** Precommit the literal current-edge, full-inward, and edge-anchored-bracket coordinates, unchanged inward facings, equal-compute dimensions, telemetry, causal classifiers, and hard rejection logic now. Only profile-agnostic schemas, metric code, and synthetic positive/negative/mirrored/obfuscated fixtures may exist before the valid Phase 266 current-league freeze.

### the agent's Discretion
- Exact schema, module, command, storage, and typed-reason names are left to research and planning within the locked evidence and privacy boundaries.
- Exact budget values, materiality thresholds, classifier cutoffs, commitment primitive, encrypted-storage mechanism, and retention sampling are chosen only after the required contained Phase 262 spikes, then frozen before candidate output is inspected.
- A managed signing identity may be used if one already exists; Phase 262 must not create an ad hoc signing trust system to simulate custody.

### Deferred Ideas (OUT OF SCOPE)
- Planner and deterministic runner implementation belongs to Phase 263.
- Candidate factory, independent oracles, and quarantined intake belong to Phase 264.
- League execution and current-league freeze belong to Phases 265–266.
- Executable formation materialization, equal retraining, sealed opening, decision, certification, and release closure belong to Phases 267–270.
- Cap, MOVE, Backstab, scan-timing, arena, runtime, product, and combined-rule experiments require separately approved later work.
</user_constraints>

## Summary

The successor should replace only the observation behind the frozen `minHostFreeMemoryBasisPoints: 2_500` gate. The current implementation samples `os.freemem()` and divides it by `os.totalmem()`. On Darwin, Node's free-memory path reaches libuv's `uv_get_free_memory()`, whose Darwin implementation returns only Mach `free_count * page_size`; that is immediate free memory, not an effective-availability measure. [VERIFIED: codebase] [CITED: https://nodejs.org/docs/latest-v24.x/api/os.html#osfreemem] [CITED: https://github.com/libuv/libuv/blob/1157b320b2a66214d31a9db2ea44611f64d68ff6/src/unix/darwin.c]

Use `/usr/bin/memory_pressure -Q` as the sole replacement observation source and name the metric `darwin-memorystatus-effective-available-basis-points-v1`. Apple's tool reads the kernel `memorystatus_get_level()` result, and XNU computes that result as integer `(available_pages * 100) / total_pages`. The tool therefore exposes a kernel-owned, floor-quantized whole percentage rather than requiring this project to invent a `vm_stat` aggregation. Convert the parsed percentage to basis points with `percentage * 100`; admit at `>= 2_500` and refuse below it. Do not estimate missing fractional percentage points. [CITED: https://github.com/apple-oss-distributions/system_cmds/blob/408bba7453608006b89772db185defbac8fe2fd0/memory_pressure/memory_pressure.c] [CITED: https://github.com/apple-oss-distributions/xnu/blob/f6217f891ac0bb64f3d375211650a4c1ff8ca1ea/osfmk/vm/vm_pageout.c]

Implement and review the provider, strict parser, receipt schemas, authorization parser, source-seal verifier, and injected tests first. Commit that source state as immutable commit **A**. Only then may the human authorization bind A and permit exactly one independently recorded successor seal, one preflight, one eight-attempt/four-shard calibration set, and—only after an admitted calibration—one fresh 540-cell reproduction. Commit the seal separately as **B**, without trying to hash B into its own content. Any seal, tool-identity, parser, observation, lineage, authorization, or accounting failure is terminal and must produce zero accepted cells. [VERIFIED: codebase]

**Primary recommendation:** Freeze the Apple memorystatus whole-percent interface, strict C-locale parser, full tool/source identity, two-commit source seal, and exact single-use authorization before any live observation or writer is invoked.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Effective-available-memory observation | OS / host adapter | Experiment coordinator | The operating system owns the memorystatus calculation; the coordinator only invokes and validates the observation. [CITED: https://github.com/apple-oss-distributions/xnu/blob/f6217f891ac0bb64f3d375211650a4c1ff8ca1ea/osfmk/vm/vm_pageout.c] |
| Exact output parsing and metric derivation | Evidence / contract library | — | Parsing, range checks, and domain-separated identity must be pure and independently testable. [VERIFIED: codebase] |
| 25% admission decision | Matrix scheduler | Evidence / contract library | The scheduler enforces the already frozen inclusive 2,500-basis-point gate; the provider must not choose policy. [VERIFIED: codebase] |
| Source-state seal | Git evidence custody | Evidence / contract library | Git commits and blobs identify immutable source bytes; the verifier checks them before observation. [CITED: https://git-scm.com/docs/git-cat-file] |
| Single-use authority and attempt charging | Experiment coordinator | Evidence ledger | The coordinator owns cardinality and terminal expiry; the ledger proves every allocated identity remains charged. [VERIFIED: codebase] |
| Match execution | Supervised runtime service | Canonical engine | This plan changes neither transition authority nor hostile Strategy execution. [VERIFIED: AGENTS.md] |
| Formation materialization | No tier in Phase 262 | — | Executable formation material remains absent. [VERIFIED: 262-CONTEXT.md] |

## Phase Requirements

| ID | Description | Research Support |
|---|---|---|
| ADMIT-03 | Researchers can reproduce the persisted current-rules audit matrix before candidate search and can use Starter and Advanced Strategies only as smoke, regression, and throughput fixtures rather than balance evidence. | The new headroom provider removes the known macOS observation mismatch while retaining frozen cardinality, resource, failure, and zero-or-540 rules. [VERIFIED: .planning/REQUIREMENTS.md] |
| ADMIT-01 | Maintainers can begin authoritative v1.38 Strategy evaluation only when the v1.37 audit, archive commit, annotated tag, and independent post-tag checker all resolve and pass. | The successor seal binds the existing predecessor aggregate, reviewed source commit, and historical receipt roots instead of replacing them. [VERIFIED: .planning/REQUIREMENTS.md] |
| ADMIT-02 | Every v1.38 research root resolves and records the exact selected rules, engine, runtime ABI, Chronicle, arena-catalog, Set-policy, canonical-JSON, provider, runtime, and conformance identities instead of trusting copied labels. | The plan changes admission observation only; matrix cells, expected outcomes, kernel, runtime service, and reduction stay unchanged. [VERIFIED: .planning/REQUIREMENTS.md] |
| ADMIT-04 | A missing, stale, incompatible, or semantically drifting predecessor authority stops authoritative v1.38 work and returns the defect to the integrity foundation without repairing, normalizing, or changing canonical behavior inside this milestone. | Strict tool identity, parser, source-seal, authorization, and receipt checks create explicit terminal refusal paths. [VERIFIED: .planning/REQUIREMENTS.md] |

## Project Constraints (from AGENTS.md)

- Keep engine logic pure, deterministic, serializable, and side-effect free. [VERIFIED: AGENTS.md]
- Do not put game rules in React components or execute user Strategy code in the web/API process. [VERIFIED: AGENTS.md]
- Do not use `Math.random`, `Date.now`, system time, filesystem, network, or database access inside engine logic. [VERIFIED: AGENTS.md]
- Do not use Node `vm` as a security boundary; treat Strategy code as hostile and schema-validate runtime boundaries. [VERIFIED: AGENTS.md]
- Preserve canonical terminology and immutable submitted Strategy Revisions. [VERIFIED: AGENTS.md]
- Public replay output must exclude Strategy source, StrategyMemory, SoldierMemory, and objective payloads by default. [VERIFIED: AGENTS.md]
- Runtime tests must cover invalid outputs, timeout behavior, forbidden capabilities, memory/source limits, schema validation, and the strategy-failure/system-failure distinction. [VERIFIED: AGENTS.md]
- Replay or Match creation changes require board-realism checks; this successor changes neither replay nor Match creation. [VERIFIED: AGENTS.md]
- Keep planning docs committed when updated; this research agent was explicitly instructed not to commit this file. [VERIFIED: AGENTS.md]

## Verified Existing Baseline

At research time the worktree was clean and `HEAD` was full commit `7542ca3505988ae684243ec9f97e510c9c057612`, the verification refresh following review and validation documentation. This is an observation for planning, not the future seal target; implementation will create a new reviewed source commit. [VERIFIED: git]

The frozen parallel policy is unchanged: concurrency 4, at most 4 attempts per shard, 2,097,152 KiB child RSS, 4,194,304 KiB aggregate child RSS, 2,500 basis points minimum host headroom, 600,000 ms per shard, 5,400,000 ms total, 250 ms sampling, 2,000 ms graceful termination, 2,000 ms forced termination, and no reuse of partial accepted evidence. Calibration remains exactly eight allocated attempts across four shards, and authoritative publication remains atomic zero-or-540. [VERIFIED: codebase]

Plans 262-12 and 262-13 used `node:os` free/total memory for their preflight and stopped below the unchanged 25% threshold; their single-use authorities expired with every allocated calibration identity still charged and zero accepted evidence. Those receipts remain immutable historical evidence, not inputs to reuse or edit. [VERIFIED: phase artifacts]

The source currently imports `freemem` and `totalmem`, samples them in the real process sampler, and builds v3/v4 preflight receipts from the same values. Tests lock the old ratio semantics with `4_000/1_000 -> 2_500` admitted and `4_001/1_000 -> 2_499` refused. The successor must introduce new schema/metric identities rather than reinterpret these old receipts. [VERIFIED: codebase]

## Standard Stack

### Core

| Component | Version / Identity | Purpose | Why Standard |
|---|---|---|---|
| `/usr/bin/memory_pressure` | Host binary SHA-256 captured after authorization; semantic reference pinned to Apple `system_cmds` commit `408bba7453608006b89772db185defbac8fe2fd0` | Obtain the kernel memorystatus whole-percentage observation | It exposes Apple's existing kernel-owned availability level without a project-owned page-counter formula. [CITED: https://github.com/apple-oss-distributions/system_cmds/blob/408bba7453608006b89772db185defbac8fe2fd0/memory_pressure/memory_pressure.c] |
| Node.js standard library | Repository runtime; observed `v24.15.0` during the environment audit | Spawn the absolute command, hash bytes, validate inputs, and integrate the provider | No external dependency is required; existing Phase 262 code is TypeScript/Node. [VERIFIED: codebase] |
| Git object database | Repository Git | Bind commit, tree, and exact blob bytes | `git cat-file` supports exact object inspection without relying on mutable working-tree files. [CITED: https://git-scm.com/docs/git-cat-file] |
| Existing canonical JSON / SHA-256 helpers | Repository source | Domain-separated receipt, policy, authorization, and seal roots | Reuses the project's established evidence identity pattern. [VERIFIED: codebase] |
| Vitest | `4.1.6` declared | Injected parser, mutation, lineage, and scheduler tests | Existing focused test infrastructure already owns the Phase 262 contract suite. [VERIFIED: package.json] |

### Supporting

| Component | Purpose | When to Use |
|---|---|---|
| `/usr/bin/sw_vers` and `/usr/bin/uname` | Capture macOS product/build and Darwin kernel release identity | Only in the authorized writer path; absence or parse failure fails closed. [VERIFIED: local macOS manual pages and paths] |
| Node `crypto` SHA-256 | Bind tool bytes, raw stdout, source blobs, canonical records, and aggregate roots | Every immutable evidence boundary. [VERIFIED: codebase] |
| Existing `ps`-based child RSS sampler | Retain child and aggregate RSS enforcement | Continue unchanged; only the host-headroom observation changes. [VERIFIED: codebase] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|---|---|---|
| `memory_pressure -Q` | `os.freemem()/os.totalmem()` | Rejected: Darwin returns immediately free pages, reproducing the observed false-low admission problem. [CITED: https://github.com/libuv/libuv/blob/1157b320b2a66214d31a9db2ea44611f64d68ff6/src/unix/darwin.c] |
| `memory_pressure -Q` | Parse `vm_stat` | Rejected: `vm_stat` exposes counters, so the project would have to define and version its own free/inactive/speculative/purgeable/compressed aggregation. [CITED: https://developer.apple.com/library/archive/documentation/Performance/Conceptual/ManagingMemory/Articles/AboutMemory.html] |
| `memory_pressure -Q` | Native `host_statistics64` adapter | Rejected: it exposes raw counters and adds a native ABI/build surface without yielding the kernel's canonical memorystatus scalar. [CITED: https://developer.apple.com/documentation/kernel/host_statistics64] |
| `memory_pressure -Q` | `process.availableMemory()` or libuv `uv_get_available_memory()` | Rejected for this successor: it would select a different userspace API and semantic formula, while the authorized gap is specifically the macOS host observation and all other rules must remain frozen. [CITED: https://docs.libuv.org/en/v1.x/misc.html] |

**Installation:** none. No external package is needed or authorized.

## Package Legitimacy Audit

No external package is installed by this plan, so the package-legitimacy gate is not applicable. [VERIFIED: recommended stack]

## Exact Observation Contract

### Metric definition

Use these immutable identities:

```text
metricId: darwin-memorystatus-effective-available-basis-points-v1
providerId: apple-memory-pressure-q-v1
parserId: apple-memory-pressure-q-c-locale-parser-v1
thresholdBasisPoints: 2500
comparison: observedBasisPoints >= thresholdBasisPoints
```

The provider observes Apple's integer percentage and derives `observedBasisPoints = percentage * 100`. Because XNU performs integer division before `memory_pressure` prints the result, the value is conservative by less than 100 basis points. The successor must preserve that quantization and must not infer a fraction from page counters or other tools. [CITED: https://github.com/apple-oss-distributions/xnu/blob/f6217f891ac0bb64f3d375211650a4c1ff8ca1ea/osfmk/vm/vm_pageout.c]

### Invocation

```typescript
const command = "/usr/bin/memory_pressure"
const args = ["-Q"] as const
const env = { LC_ALL: "C", LANG: "C", PATH: "/usr/bin:/bin:/usr/sbin:/sbin" }
```

Invoke without a shell, with stdin ignored, bounded stdout/stderr buffers, and a fixed provider timeout. Preserve the existing 250 ms scheduler sampling interval, but make a single shared host observation per scheduler tick rather than one observation per active shard. The preflight performs exactly one observation. [VERIFIED: codebase] [CITED: https://github.com/apple-oss-distributions/system_cmds/blob/408bba7453608006b89772db185defbac8fe2fd0/memory_pressure/memory_pressure.c]

The provider timeout and maximum output size are new safety bounds, not resource-policy changes. Freeze `200 ms` and `4_096 bytes` in the metric contract before sealing so an observation cannot outlive the existing 250 ms sampling interval; a timeout does not create a retry. Never overlap observations—an unfinished observation at the next tick is measurement unavailability. [RECOMMENDED]

### Strict parser

Accept exactly this UTF-8 stdout shape with an exact final LF:

```regex
^The system has ([1-9][0-9]*) \(([1-9][0-9]*) pages with a page size of ([1-9][0-9]*)\)\.\nSystem-wide memory free percentage: (100|[1-9]?[0-9])%\n$
```

Also require:

- exit code `0`, signal `null`, and empty stderr;
- no NUL or invalid UTF-8;
- output length at most 4,096 bytes;
- positive safe integers for total bytes, page count, and page size;
- `pageCount === floor(totalBytes / pageSize)`;
- percentage in `[0, 100]`;
- `observedBasisPoints === percentage * 100`;
- exact absolute executable path and the tool identity bound by the successor seal.

Apple's source emits the two matched lines in quiet mode, calls `memorystatus_get_level`, and returns without pressure allocation when neither level, purge, nor wait mode is selected. [CITED: https://github.com/apple-oss-distributions/system_cmds/blob/408bba7453608006b89772db185defbac8fe2fd0/memory_pressure/memory_pressure.c]

Do not accept CRLF, missing/extra lines, extra whitespace, decimal or signed percentages, localized text, stderr warnings, a nonzero exit, or a substituted executable. All such cases map to a typed `resource_measurement_unavailable` process failure and a terminal fail-closed outcome. [RECOMMENDED]

### Receipt fields

Every preflight and scheduler sample should bind:

- metric/provider/parser identifiers and roots;
- absolute executable, exact argv, environment policy, timeout, and output cap;
- executable SHA-256 and file identity recorded by the seal;
- macOS product/build and Darwin kernel identities;
- raw stdout SHA-256, byte length, parsed total bytes/pages/page size, parsed percentage, and derived basis points;
- observation ordinal and scheduler tick identity;
- frozen resource-policy root, authorization root, predecessor aggregate root, and source-seal root;
- disposition or termination cause.

The receipt need not publish raw stdout if privacy policy prefers the digest plus parsed public fields, but the private authoritative evidence must retain the exact bytes required for deterministic re-verification. [RECOMMENDED]

## Independent Successor Source Seal

### Two-commit construction

1. Implement all provider, parser, schema, authorization, seal-verification, scheduler, writer, and test changes. Run only injected/non-measuring tests. Review the diff. Commit this exact source state as **A**. [RECOMMENDED]
2. Present full A commit/tree IDs, the exact authorization literal, metric contract root, frozen-policy root, and proposed sealed path inventory to the independent authorizer. The repository cannot invent an independent approval. [RECOMMENDED]
3. After exact authorization, create one canonical successor-seal record that refers backward to A. Commit only that record and its authorized planning receipt as **B**. The record binds A but does not attempt to include B's own commit or blob ID. [CITED: https://git-scm.com/docs/git-commit-tree]
4. Before any observation, verify B is a descendant of A, the seal path did not exist at A, A's exact blobs still match the execution checkout, protected predecessor artifacts are byte-identical, and no forbidden artifact or executable formation exists. [RECOMMENDED]

This construction avoids self-reference: the seal content can deterministically hash everything it asserts, while Git B independently commits those seal bytes. A later summary may cite B's commit/blob ID, but changing the seal bytes necessarily creates a different B and root. [CITED: https://git-scm.com/docs/git-hash-object]

### Required seal payload

| Group | Fields |
|---|---|
| Seal identity | schema, domain, seal ordinal `1`, canonicalization ID, `sealRoot` |
| Source state | full A commit OID, tree OID, parent OIDs, reviewed-base OID, exact allowed path diff |
| Critical blobs | path, A blob OID, byte length, independent SHA-256 for admission library, matrix reproduction library, focused test, relevant package/config/lock files |
| Review custody | exact Review, Review-Fix, Verification, Validation, and predecessor plan-summary blob/content roots |
| Historical evidence | ordered paths and exact Git blob/SHA-256 roots for expectation, admission, execution-context, preflight, calibration, diagnostic, and reproduction receipts already present |
| Frozen contract | full unchanged policy vector and root, calibration identity set/root, 540-cell denominator, zero-or-540 publication rule |
| Replacement metric | metric/provider/parser IDs and roots, exact command contract, 200 ms provider timeout, 4,096-byte output bound, pinned semantic source references |
| Host tool identity | SHA-256 of `/usr/bin/memory_pressure`, file mode/uid/gid, and recorded macOS/Darwin identity |
| Authorization | exact literal hash, authorization root, named approving actor/reference, cardinalities, single-use flag, terminal expiry rule |
| Containment | explicit executable-formation-absent inventory and root |

The checker must read source bytes from `git cat-file blob <A>:<path>`, require full object IDs and correct object types, recompute both Git blob identity and independent SHA-256, and compare canonical records exactly. It must not verify the source seal against mutable working-tree bytes alone. [CITED: https://git-scm.com/docs/git-cat-file]

Reject short/ambiguous OIDs, ref or tag substitution, missing/extra paths, reordered exact arrays, changed source blobs, dirty tracked critical files, staged critical changes, forbidden untracked artifacts, predecessor artifact mutation, mixed roots, a seal created before A, a second seal, or a supplied/persisted branch mismatch. [RECOMMENDED]

## Exact Single-Use Authorization

The planning checkpoint should show the authorizer the final full A OID and require this exact literal, with the OID inserted before approval:

```text
Authorize Phase 262 Plan 262-15 for exactly one independently committed successor-source seal over reviewed source commit <FULL_A_OID>, exactly one effective-available-memory headroom-preflight:v5, exactly one calibration:v5 eight-attempt/four-shard set, and—only if calibration:v5 is admitted—at most one fresh reproduction:v6 540-cell run, using darwin-memorystatus-effective-available-basis-points-v1 at the unchanged inclusive 2,500-basis-point threshold and every other unchanged frozen policy, resource, lineage, accounting, runtime, semantic, privacy, and formation-absence bound. This authorization is single-use and expires at the first terminal Plan 262-15 outcome.
```

Do not accept earlier Plan 262-12/13 wording, a placeholder OID, a short OID, Unicode-normalized variants, extra whitespace, or an equivalent paraphrase. The authorization root should bind the literal bytes, full A OID, exact cardinalities, metric contract root, frozen policy root, predecessor aggregate root, seal schema, and terminal expiry rule. [RECOMMENDED]

State transitions are:

```text
UNAUTHORIZED
  -> exact authorization accepted
AUTHORIZED_UNSEALED
  -> exactly one valid B seal committed and verified
SEALED_UNUSED
  -> exactly one preflight observation
PREFLIGHT_COMPLETE
  -> exactly one declared eight-identity calibration set
CALIBRATION_TERMINAL
  -> if and only if admitted: at most one fresh 540-cell reproduction
TERMINAL_EXPIRED
```

Any invalid seal or preflight is terminal. A preflight refusal still creates the one calibration receipt with all eight declared identities charged as `unfilled_resource_preflight_refusal`, launches zero calibration children, accepts zero cells, and expires the authorization. Any measurement-unavailable event during calibration terminates the set, charges every declared identity, accepts zero evidence, and forbids reproduction. A 540 run is authorized only when calibration is process-valid and admitted; any failure during it produces zero accepted authoritative cells. [VERIFIED: existing accounting pattern] [RECOMMENDED: successor versioning]

## Architecture Patterns

### System Architecture Diagram

```text
Reviewed implementation commit A
        |
        v
Exact human authorization ----> canonical authorization root
        |                                  |
        +------------------------+---------+
                                 v
                    independent successor seal B
                                 |
                    [Git/source/predecessor/
                     tool/formation checks]
                          pass / \ fail
                              /   \----> terminal expired, zero accepted
                             v
             one /usr/bin/memory_pressure -Q preflight
                       admit / \ refuse-or-invalid
                            /   \----> charge 8 unfilled, terminal
                           v
          one 8-attempt / 4-shard calibration declaration
                      admitted / \ failure/refusal
                              /   \----> all 8 charged, terminal
                             v
             one optional fresh 540-cell reproduction
                         complete / \ any failure
                                 /   \----> zero accepted, terminal
                                v
                    atomic authoritative receipt
```

### Recommended Project Structure

Keep the established files and add narrow modules only if the current large reproduction library becomes harder to audit:

```text
scripts/
├── lib/
│   ├── v1-38-foundation-admission.ts
│   ├── v1-38-current-matrix-reproduction.ts
│   ├── v1-38-darwin-headroom.ts          # pure parser + injected provider boundary
│   └── v1-38-successor-source-seal.ts    # canonical seal + Git verifier
└── evaluate-v1-38-foundation-contract.test.ts
```

No module belongs under engine, web, API, or runtime-service code. [VERIFIED: AGENTS.md]

### Component Responsibilities

| Component | Responsibility | Must Not Do |
|---|---|---|
| Pure Darwin parser | Validate exact bytes and derive whole-percent basis points | Spawn processes, select threshold, retry, or write artifacts |
| Injected host provider | Execute the one exact absolute command under bounded options | Interpret failure as zero, substitute tools, or retry |
| Shared resource sampler | Join one host fact per tick with unchanged child/aggregate RSS facts | Probe once per shard or weaken any frozen RSS/time bound |
| Preflight/calibration/reproduction builders | Construct canonical proposed receipts and complete charged ledgers | Read ambient mutable evidence or publish partial accepted cells |
| Successor-seal verifier | Resolve exact A/tree/blob/protected-artifact/tool roots | Trust labels, short refs, `HEAD`, or working-tree files alone |
| Authorized writers | Exclusively create the one permitted artifact at an exact path | Overwrite, append, infer authorization, or run from tests |
| Supervised runtime service | Execute hostile Strategy revisions through the existing boundary | Accept observation or custody responsibilities |

### Pattern 1: Pure parser behind an injected process boundary

**What:** Separate `parseMemoryPressureQ(bytes)` from `observeDarwinHeadroom(executor)`.  
**When to use:** All tests and all receipt builders; tests inject bytes and process outcomes and never spawn the live tool.

```typescript
type CommandResult = {
  readonly stdout: Uint8Array
  readonly stderr: Uint8Array
  readonly exitCode: number | null
  readonly signal: NodeJS.Signals | null
}

type ParseResult =
  | { readonly ok: true; readonly value: ParsedHeadroom }
  | { readonly ok: false; readonly reason: "resource_measurement_unavailable" }

export function parseMemoryPressureQ(result: CommandResult): ParseResult {
  // Exact byte/UTF-8/regex/integer/page-count checks.
  // observedBasisPoints = percentage * 100.
}

export async function observeDarwinHeadroom(
  execute: (request: ExactCommandRequest) => Promise<CommandResult>,
): Promise<ParseResult> {
  return parseMemoryPressureQ(await execute(MEMORY_PRESSURE_Q_REQUEST))
}
```

Source basis: Apple `memory_pressure` output and XNU percentage calculation. [CITED: https://github.com/apple-oss-distributions/system_cmds/blob/408bba7453608006b89772db185defbac8fe2fd0/memory_pressure/memory_pressure.c]

### Pattern 2: Shared observation per scheduler tick

**What:** Invoke the provider once for a tick, then combine that result with the unchanged `ps` child/aggregate RSS sample for all active shards.  
**When to use:** Calibration and 540 reproduction resource monitoring.

This keeps every shard under one contemporaneous host-headroom fact and avoids multiplying command invocation count by concurrency. The tick record must identify every shard to which the shared observation applied. [RECOMMENDED]

### Pattern 3: Historical schemas remain immutable

**What:** Add preflight v5, calibration v5, execution-context successor, and reproduction v6 types; never change how v3/v4 or reproduction v4/v5 records parse or hash.  
**When to use:** Every receipt and verifier touched by this successor.

Old receipts describe the old `os.freemem` observation and remain valid historical stopped outcomes. A new metric requires new schema/domain identities. [VERIFIED: codebase]

### Pattern 4: Proposed record, then authorized writer

**What:** Pure builders return proposed canonical objects; explicit writer commands require the exact authorization and refuse an existing destination.  
**When to use:** Seal, preflight, calibration, and authoritative reproduction artifacts.

Checker commands remain read-only. Writer commands must use exclusive creation, canonical serialization, exact path allowlists, and immediate read-back verification. [VERIFIED: established codebase pattern]

### Anti-Patterns to Avoid

- **Reinterpreting old receipts:** Never relabel v3/v4 free-memory evidence as effective-available memory. Create new identities. [VERIFIED: D-01]
- **Combining multiple memory tools:** Do not choose the maximum of `freemem`, `vm_stat`, and `memory_pressure`; that would be an unregistered policy change. [RECOMMENDED]
- **Recovering fractional precision:** Do not estimate 25.xx% from the printed integer or alternate counters. [CITED: https://github.com/apple-oss-distributions/xnu/blob/f6217f891ac0bb64f3d375211650a4c1ff8ca1ea/osfmk/vm/vm_pageout.c]
- **Shell pipelines or localized parsing:** Do not invoke `sh -c`, `grep`, or `awk`; spawn the absolute executable and parse exact bytes. [RECOMMENDED]
- **Per-shard host probes:** Do not spawn four independent host observations per tick. [RECOMMENDED]
- **Retrying a failed probe:** A timeout, parse failure, or nonzero exit is evidence failure, not permission for another observation. [VERIFIED: D-05]
- **Self-sealing artifact:** Do not put B's own blob/commit ID inside the seal stored in B. [CITED: https://git-scm.com/docs/git-commit-tree]
- **Sealing mutable names:** Do not bind `HEAD`, `main`, or `latest`; bind full commit/tree/blob IDs. [VERIFIED: D-01]
- **Executor-asserted independence:** Code cannot manufacture a separate approving actor or authorization. [VERIFIED: D-19 pattern]
- **Continuing after partial accepted work:** Calibration or reproduction process failure cannot retain accepted gameplay cells. [VERIFIED: D-16]

## Runtime State Inventory

This successor is a measurement-schema migration, so runtime state was audited even though no historical record is rewritten.

| Category | Items Found | Action Required |
|---|---|---|
| Stored data | Historical v3/v4 preflight, calibration, execution-context, diagnostic, and reproduction JSON artifacts contain old host-total/free identities. [VERIFIED: repository artifact and source search] | **No data migration.** Preserve exact bytes and roots; add v5/v6 successor records with new metric/schema identities. |
| Live service config | None — Phase 262 execution is repository CLI/private lab logic; no external UI/database configuration was found for this sampler or authorization. [VERIFIED: repository search and architecture docs] | None. Recheck immediately before A if a new service integration appears. |
| OS-registered state | None — no launchd, systemd, PM2, scheduled-task, or daemon registration for the Phase 262 matrix runner was found. [VERIFIED: repository search] | None. The absolute system tool is observed, not registered or modified. |
| Secrets/env vars | No renamed secret or environment key exists. The successor adds fixed `LC_ALL=C`, `LANG=C`, and a minimal `PATH` to the spawned tool contract. [VERIFIED: repository search] | Code edit only; do not read ambient locale/path into canonical semantics. |
| Build artifacts / installed packages | No package rename or new package. Existing transpilation/test caches are non-authoritative and are not inputs to roots. [VERIFIED: package files and repository structure] | No migration or reinstall. Seal source/config/lock blobs, not caches. |

**Canonical answer:** after every repository file is updated, the only old-string/old-schema state is immutable historical evidence that must remain unchanged; no mutable runtime registration needs migration.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| macOS effective memory | A weighted `vm_stat` counter formula | Kernel memorystatus percentage through `memory_pressure -Q` | Apple/XNU already owns the availability computation. [CITED: https://github.com/apple-oss-distributions/xnu/blob/f6217f891ac0bb64f3d375211650a4c1ff8ca1ea/osfmk/vm/vm_pageout.c] |
| Git source identity | Directory hashing or `git diff` labels | Full commit/tree/blob IDs plus raw-byte SHA-256 | Git object semantics bind immutable contents and relationships. [CITED: https://git-scm.com/docs/git-cat-file] |
| Canonical evidence | Ad hoc JSON stringify/order rules | Existing canonical JSON and domain-separated roots | The repository already establishes these primitives. [VERIFIED: codebase] |
| Strategy isolation | A local evaluator or Node `vm` | Existing supervised runtime-service boundary | Strategy source is hostile and cannot enter coordinator/web/API execution. [VERIFIED: AGENTS.md] |
| Retry recovery | Automatic probe or cell retry | Terminal typed disposition with complete charging | Retries are part of the frozen opportunity budget and require explicit authority. [VERIFIED: D-05] |
| Signing trust | A new ad hoc key | Existing managed signing identity, if one exists; otherwise exact human authorization plus Git/content custody | The context explicitly forbids simulated custody trust. [VERIFIED: 262-CONTEXT.md] |

**Key insight:** The safe replacement is smaller than a “better memory estimator”: adopt one Apple-owned scalar and bind its exact semantics, bytes, host identity, parser, and one-time use.

## Common Pitfalls

### Pitfall 1: Treating “free” and “available” as synonyms

**What goes wrong:** A healthy macOS host fails admission because reclaimable memory is not counted.  
**Why it happens:** Node/libuv's Darwin free-memory implementation uses Mach `free_count`. [CITED: https://github.com/libuv/libuv/blob/1157b320b2a66214d31a9db2ea44611f64d68ff6/src/unix/darwin.c]  
**How to avoid:** Replace only the observation with memorystatus whole percentage.  
**Warning signs:** `memory_pressure` and `os.freemem()/totalmem()` disagree materially while no child RSS limit is crossed.

### Pitfall 2: Silent threshold drift through quantization

**What goes wrong:** A parser treats 25% as an approximation and invents `2,499` or `2,550` basis points.  
**Why it happens:** The CLI exposes whole percent after kernel integer division. [CITED: https://github.com/apple-oss-distributions/xnu/blob/f6217f891ac0bb64f3d375211650a4c1ff8ca1ea/osfmk/vm/vm_pageout.c]  
**How to avoid:** Freeze `bp = integerPercent * 100`; test 24/25/26 exactly.  
**Warning signs:** Receipt basis points are not multiples of 100.

### Pitfall 3: Parser permissiveness becomes policy permissiveness

**What goes wrong:** Localized, altered, partial, or warning-bearing output is accepted as authoritative.  
**Why it happens:** Line-oriented regexes often ignore extra bytes or stderr.  
**How to avoid:** Match the complete byte shape, exact final LF, exit/signal/stderr, bounds, and page relation.  
**Warning signs:** Tests accept CRLF, trailing text, `25.0%`, or nonempty stderr.

### Pitfall 4: Probe cost distorts the calibration

**What goes wrong:** Four tool processes are spawned every 250 ms, inflating overhead and creating divergent per-shard observations.  
**Why it happens:** The host metric is placed inside a per-child sampler.  
**How to avoid:** One shared host observation per scheduler tick; charge its elapsed time as infrastructure overhead.  
**Warning signs:** Probe count grows with concurrent shard count.

### Pitfall 5: A source seal that omits the checker

**What goes wrong:** Measurement code is sealed but the verifier or parser can change afterward.  
**Why it happens:** The critical-path inventory is hand-selected too narrowly.  
**How to avoid:** Seal provider, parser, receipt builders/checkers, authorization parser, writer routing, tests, and relevant config/lock files.  
**Warning signs:** A later commit can change accepted evidence without invalidating the seal.

### Pitfall 6: “Independent” seal is only a self-assertion

**What goes wrong:** The same execution path creates its own authority and calls it independent.  
**Why it happens:** Actor identity is confused with content hashing.  
**How to avoid:** Require the human checkpoint to bind full A and record an independent approving reference; prefer a separate B commit after approval.  
**Warning signs:** The authorization root can be constructed without user-supplied exact bytes.

### Pitfall 7: Reusing terminal predecessor authority

**What goes wrong:** A v3/v4 receipt or Plan 262-12/13 authorization is treated as permission for the new probe.  
**Why it happens:** The threshold and attempt counts look identical.  
**How to avoid:** Use new metric, schema, authorization, and artifact identities; retain old records only in lineage.  
**Warning signs:** New receipts cite an old authorization root.

## Code Examples

Verified and recommended patterns for the planner to reference:

### Exact Git blob retrieval

```bash
git cat-file -t '<FULL_A_OID>:scripts/lib/v1-38-current-matrix-reproduction.ts'
git cat-file blob '<FULL_A_OID>:scripts/lib/v1-38-current-matrix-reproduction.ts'
```

The implementation should invoke Git without a shell and hash returned bytes directly. The shell form above illustrates official object syntax only. [CITED: https://git-scm.com/docs/git-cat-file]

### Inclusive quantized threshold

```typescript
const observedBasisPoints = parsed.percentage * 100
const disposition =
  observedBasisPoints >= V138_PARALLEL_RESOURCE_POLICY.minHostFreeMemoryBasisPoints
    ? "preflight_admitted"
    : "preflight_refused"
```

This keeps the existing inclusive threshold and accepts only multiples of 100 basis points from the new provider. [VERIFIED: codebase policy] [CITED: https://github.com/apple-oss-distributions/xnu/blob/f6217f891ac0bb64f3d375211650a4c1ff8ca1ea/osfmk/vm/vm_pageout.c]

### Fail-closed provider result

```typescript
const observation = parseMemoryPressureQ(commandResult)
if (!observation.ok) {
  return {
    status: "process_failure",
    reason: "resource_measurement_unavailable",
    acceptedCellCount: 0,
  } as const
}
```

The concrete code should use the repository's existing schema/result conventions and complete charged-ledger builder rather than this abbreviated illustration. [VERIFIED: codebase pattern]

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Framework | Vitest `4.1.6` [VERIFIED: package.json] |
| Config file | `vitest.config.ts` [VERIFIED: codebase] |
| Focused safe run | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts` |
| Type check | `pnpm typecheck` |
| Full safe suite | `pnpm exec turbo test --concurrency=1` |

All automated validation before authorization must use injected command results and temporary Git fixtures. It must not invoke `/usr/bin/memory_pressure -Q`, any preflight/calibration/reproduction writer, or any Match execution command. [RECOMMENDED]

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| ADMIT-03 | Exact Apple output parses to integer percentage and basis points | unit/mutation | focused Vitest file, `darwin headroom parser` selector | ❌ Wave 0 |
| ADMIT-03 | 25% admits; 24% refuses; 26% admits | unit | focused Vitest file, `headroom preflight v5` selector | ❌ Wave 0 |
| ADMIT-03 | One host observation is shared across four active shards per tick | scheduler unit | focused Vitest file, `shared host sampler` selector | ❌ Wave 0 |
| ADMIT-03 | Measurement unavailability terminates and charges all declared identities | integration with injected executor | focused Vitest file, `calibration v5 accounting` selector | ❌ Wave 0 |
| ADMIT-03 | Admitted calibration alone enables one zero-or-540 reproduction | branch/integration | focused Vitest file, `authoritative v6 branches` selector | ❌ Wave 0 |
| ADMIT-01/04 | Seal binds full A/tree/blobs, exact historical roots, tool identity, and formation absence | Git-fixture mutation | focused Vitest file, `successor source seal` selector | ❌ Wave 0 |
| ADMIT-04 | Exact literal/full A/single-use/terminal expiry are enforced | unit/mutation | focused Vitest file, `retry authorization v5` selector | ❌ Wave 0 |
| ADMIT-02 | Kernel/runtime/matrix expectation and policy roots remain unchanged | regression | existing focused Vitest file | ✅ |

### Required Mutation Matrix

Parser mutations:

- percentage `24`, `25`, `26`, `0`, `100`, and invalid `101`;
- decimal, sign, surrounding spaces, CRLF, missing final LF, duplicate line, extra line, localized text, invalid UTF-8, and NUL;
- zero/unsafe total, page count, or page size; mismatched `floor(total/pageSize)`;
- nonzero exit, signal, stderr, timeout, oversize output, missing binary, substituted binary hash.

Seal/authorization mutations:

- every sealed path missing, extra, moved, reordered, byte-mutated, or sourced from another commit;
- short OID, tag/ref text, wrong object type, altered A parent/tree, dirty/staged critical source;
- old protected artifact changed by one byte;
- executable formation artifact introduced;
- exact literal altered by one byte, old literal reused, A placeholder or mismatch, second seal/preflight/calibration/reproduction;
- supplied/persisted roots mixed or reordered.

Accounting mutations:

- refusal before child launch charges all eight as unfilled;
- failure after partial launches still charges all eight and accepts zero;
- timeout/parse/tool identity failure during a 540 run accepts zero of 540;
- partial evidence is never reusable;
- observation count is one per tick, not one per shard;
- every basis-point sample is a multiple of 100 and the minimum observed value governs termination.

### Sampling Rate

- **Per task commit:** focused safe Vitest file plus `pnpm typecheck`.
- **Per wave merge:** serialized full safe suite.
- **Pre-authorization gate:** all safe tests green, review clean, exact A committed, proposed seal/authorization roots shown.
- **Authorized live gate:** one seal, one preflight, one calibration declaration, and conditional one reproduction only; no automated test invokes these writers.
- **Phase gate:** exact receipt checker green, protected artifacts unchanged, experimental formation absent, and zero-or-540 disposition explicit.

### Wave 0 Gaps

- [ ] Pure `memory_pressure -Q` parser and injected executor boundary.
- [ ] Provider identity and host identity schemas.
- [ ] Preflight v5, calibration v5, and reproduction v6 immutable schemas/builders/checkers.
- [ ] Successor-source-seal schema, Git object verifier, and mutation fixtures.
- [ ] Exact authorization parser/state machine/cardinality tests.
- [ ] Shared per-tick host observation integration.
- [ ] Explicit safe-test guard proving live provider and writer functions were never called.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | no for end users; yes operationally | Exact external authorization bytes and named approving reference gate the one-time run. [RECOMMENDED] |
| V3 Session Management | no | No interactive session is introduced. |
| V4 Access Control | yes operationally | Writer commands require exact authorization and exclusive artifact destinations; checkers are read-only. [VERIFIED: established pattern] |
| V5 Input Validation | yes | Exact byte parser, integer/range/relation checks, schema validation, full Git OIDs, and strict cardinalities. [RECOMMENDED] |
| V6 Cryptography | yes | Existing SHA-256 and canonical domain-separated roots; do not invent cryptography. [VERIFIED: codebase] |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Executable/path substitution | Spoofing/Tampering | Absolute path, no shell, binary SHA-256, host identity, exact argv/env, seal verification |
| Output injection/localization | Tampering | C locale, bounded exact-byte parser, empty stderr, full-shape match |
| Authorization replay | Spoofing/Elevation | Full A-bound exact literal, distinct root, cardinality counters, first-terminal expiry |
| Seal equivocation | Tampering/Repudiation | Full commit/tree/blob IDs, raw SHA-256, exact ordered inventory, independent B commit |
| Partial-result salvage | Tampering | Atomic zero-or-540 acceptance and complete charged ledger |
| Strategy escape | Elevation/Information disclosure | No runtime boundary changes; retain supervised runtime service and public privacy rules |
| Formation leakage | Information disclosure | Pre-run absence inventory and exact sealed root |
| Probe denial/failure | Denial of service | Bounded timeout/output and terminal fail-closed disposition; no retry |

## Environment Availability

The following audit checked paths and versions without invoking the measurement command or any artifact writer. [VERIFIED: local environment]

| Dependency | Required By | Available | Version / Identity | Fallback |
|---|---|---|---|---|
| `/usr/bin/memory_pressure` | Effective headroom provider | ✓ path present | Not executed during research; hash/build captured only in authorized seal path | None; fail closed |
| Git | Source seal/verifier | ✓ | Repository operational at full OID `7542ca…` | None |
| Node.js | TypeScript provider/coordinator | ✓ | `v24.15.0` | None |
| pnpm | Safe tests/typecheck | ✓ | Available | None |
| `/usr/bin/sw_vers` | Host OS receipt identity | ✓ path present | Not executed during research | None; fail closed |
| `/usr/bin/uname` | Darwin receipt identity | ✓ path present | Not executed during research | None; fail closed |
| Vitest | Focused injected validation | ✓ | `4.1.6` declared | None |

**Missing dependencies with no fallback:** none discovered by path/config inspection. A missing or incompatible live tool at the authorized preflight is nevertheless a terminal measurement-unavailable outcome, not permission to substitute another provider.

## Implementation Sequence

1. Add the pure parser/provider types and injected executor; freeze metric, parser, command, timeout, and output-cap constants. [RECOMMENDED]
2. Replace host total/free fields only in new v5/v6 schemas and scheduler samples; retain historical v3/v4 parsing unchanged. [RECOMMENDED]
3. Integrate one shared provider observation per 250 ms tick while leaving `ps` child/aggregate RSS enforcement untouched. [RECOMMENDED]
4. Add successor source-seal builder/verifier and exact Git object/path/root inventory. [RECOMMENDED]
5. Add full-A-bound single-use authorization parser and state machine. [RECOMMENDED]
6. Add all injected parser, seal, authorization, branch, accounting, and formation-absence mutations. Run safe tests and typecheck only. [RECOMMENDED]
7. Obtain code review, create immutable source commit A, and rerun safe verification against A. [RECOMMENDED]
8. Stop at a human checkpoint showing full A and the exact authorization literal. [RECOMMENDED]
9. Once authorized, create/commit exactly one independent seal B and verify it before observation. [RECOMMENDED]
10. Run exactly one preflight; create exactly one eight-identity calibration receipt even if refused; only an admitted calibration may enable one fresh 540-cell run. [RECOMMENDED]
11. Verify the terminal evidence, zero-or-540 result, complete charging, protected-artifact byte identity, and formation absence. [RECOMMENDED]

## State of the Art

| Old Approach | Current Recommendation | Impact |
|---|---|---|
| `os.freemem()/os.totalmem()` on Darwin | XNU memorystatus percentage via `memory_pressure -Q` | Replaces immediate-free observation with the kernel's effective-availability level. [CITED: https://github.com/libuv/libuv/blob/1157b320b2a66214d31a9db2ea44611f64d68ff6/src/unix/darwin.c] [CITED: https://github.com/apple-oss-distributions/xnu/blob/f6217f891ac0bb64f3d375211650a4c1ff8ca1ea/osfmk/vm/vm_pageout.c] |
| Ratio with 1-basis-point precision | Kernel whole percent converted to 100-bp increments | Threshold stays 2,500 bp, but observations are intentionally floor-quantized. [CITED: https://github.com/apple-oss-distributions/xnu/blob/f6217f891ac0bb64f3d375211650a4c1ff8ca1ea/osfmk/vm/vm_pageout.c] |
| Inline current source hashes in a mutable execution context | Reviewed source commit A plus backward-pointing seal B | Prevents source drift and self-referential attestation. [CITED: https://git-scm.com/docs/git-commit-tree] |
| Prior terminal Plan 262-12/13 authorizations | New full-A-bound exact single-use authority | Prevents replay across metric/schema/source changes. [VERIFIED: phase artifacts] |

**Deprecated for new authoritative evidence:** the `node:os` host total/free observation and its preflight v3/v4 schemas. They remain supported only for historical verification. [RECOMMENDED]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| — | None. Recommendations are explicit design choices; repository facts were inspected directly and platform semantics were cited to primary source. | — | — |

## Open Questions

1. **Who supplies the independent approving reference and, preferably, authors seal commit B?**
   - What we know: the context permits an existing managed signing identity but forbids inventing an ad hoc trust system. [VERIFIED: 262-CONTEXT.md]
   - What's unclear: the repository does not name a managed signer for this successor.
   - Recommendation: require the human authorization checkpoint to name the approving actor/reference; prefer a distinct B commit author if operationally available, but do not block on a new signing system.

2. **Should raw `memory_pressure` stdout be retained privately or only its digest plus parsed fields?**
   - What we know: deterministic re-verification is strongest with exact raw bytes, and the output contains only host memory size/page facts and percentage. [CITED: https://github.com/apple-oss-distributions/system_cmds/blob/408bba7453608006b89772db185defbac8fe2fd0/memory_pressure/memory_pressure.c]
   - What's unclear: the milestone's private artifact retention policy may prefer minimizing raw host diagnostics.
   - Recommendation: retain raw bytes in private authoritative custody and expose only digest/parsed fields in bounded summaries.

## Sources

### Primary repository evidence (HIGH confidence)

- `AGENTS.md` — engine/runtime/privacy/testing boundaries.
- `.planning/phases/262-.../262-CONTEXT.md` — locked decisions and deferred scope.
- `262-09` through `262-14` plans/summaries — frozen resource policy and terminal attempt lineage.
- `262-REVIEW.md`, `262-REVIEW-FIX.md`, `262-VALIDATION.md`, and `262-VERIFICATION.md` — reviewed state and remaining source-seal/headroom gap.
- `scripts/lib/v1-38-foundation-admission.ts` — admission and canonical evidence primitives.
- `scripts/lib/v1-38-current-matrix-reproduction.ts` — current policy, sampler, preflight, authorization, and accounting behavior.
- `scripts/evaluate-v1-38-foundation-contract.test.ts` — existing mutation and branch coverage.

### Primary platform documentation (MEDIUM confidence per research seam)

- [Apple `memory_pressure.c`, pinned system_cmds commit](https://github.com/apple-oss-distributions/system_cmds/blob/408bba7453608006b89772db185defbac8fe2fd0/memory_pressure/memory_pressure.c) — exact `-Q` behavior, output, and `memorystatus_get_level` call.
- [Apple XNU `vm_pageout.c`, pinned XNU commit](https://github.com/apple-oss-distributions/xnu/blob/f6217f891ac0bb64f3d375211650a4c1ff8ca1ea/osfmk/vm/vm_pageout.c) — available/total page percentage calculation.
- [Apple XNU `vm_page.h`, pinned XNU commit](https://github.com/apple-oss-distributions/xnu/blob/f6217f891ac0bb64f3d375211650a4c1ff8ca1ea/osfmk/vm/vm_page.h) — current available non-compressed page definition.
- [Node.js `os.freemem`](https://nodejs.org/docs/latest-v24.x/api/os.html#osfreemem) — documented free-memory semantics.
- [libuv Darwin implementation, pinned v1.x commit](https://github.com/libuv/libuv/blob/1157b320b2a66214d31a9db2ea44611f64d68ff6/src/unix/darwin.c) — `uv_get_free_memory` and `uv_get_available_memory` implementation distinction.
- [libuv miscellaneous APIs](https://docs.libuv.org/en/v1.x/misc.html) — public memory API contracts.
- [Apple `host_statistics64`](https://developer.apple.com/documentation/kernel/host_statistics64) — raw host statistics interface.
- [Git `cat-file`](https://git-scm.com/docs/git-cat-file), [hash-object](https://git-scm.com/docs/git-hash-object), and [commit-tree](https://git-scm.com/docs/git-commit-tree) — object bytes, object identities, and commit/tree/parent semantics.

### Research provenance

- Research-plan cache keys: `6784e2aee4f9db36175c6b7573e52abf6a76127b75234a4c3039c61648d71926`, `c21637f50711662b2ba8aa8066df07d93a3a3ef053208327a16138e4a55fe63f`, `05ed2eacfdf5eea3605715124cc67ab5db444a4d4c1021ba8920635f40393367`, `256769dae82f8d95e22ea46acbf06773381867a120c1b29153beb9114a5d81d3`, and `8ecfeb1999e19690fd932a013a84464eb8b3092acbe1530637f0a9226276b2f6`.
- The seam classified verified web research and the Context7 route as MEDIUM. Context7 was unavailable in this runtime, so the Node claim was cross-checked against official Node.js and libuv sources and cached as a web-backed docs digest.
- No measurement command and no artifact writer was run during this research.

## Metadata

**Confidence breakdown:**

- Standard stack: MEDIUM — codebase versions are direct; macOS semantics use pinned Apple/XNU/Node/libuv primary source.
- Architecture: HIGH — derived from inspected Phase 262 code, immutable evidence patterns, and locked project boundaries.
- Parser and invocation: MEDIUM — exact output is verified from Apple source, but the live host command was intentionally not executed.
- Source seal: HIGH — uses inspected repository conventions and official Git object semantics.
- Pitfalls and validation: HIGH — map directly to prior stopped attempts and the current mutation-heavy test architecture.

**Research date:** 2026-07-30  
**Valid until:** 2026-08-29 for the pinned implementation plan; re-research if the macOS host, Node runtime, tool binary, source commit, or frozen policy changes.
