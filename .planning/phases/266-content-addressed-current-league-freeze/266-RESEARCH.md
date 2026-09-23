# Phase 266: Content-Addressed Current-League Freeze — Research

**Researched:** 2026-09-23  
**Domain:** Offline, private, content-addressed evidence freeze and one-way formation gate  
**Confidence:** HIGH for existing code and locked contracts; LOW for unavailable Phase 265 empirical inputs

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

## Implementation Decisions

### Carry-forward integrity charter
- **D-01:** The freeze is content-addressed and immutable. No mutable `latest`, branch name, timestamp, directory order, or human declaration may identify the authoritative current league.
- **D-02:** Missing, stale, contaminated, incomplete, conflicting, unresolvable, or identity-mismatched evidence fails closed. Every attempt, retry, failure, rejection, and unused allocation remains charged evidence.
- **D-03:** A process-valid empirical disappointment, including `no robust pure finalist found`, may be frozen honestly. Any process, provenance, completeness, custody, contamination, reproducibility, kernel, runtime, or information-boundary failure prevents a valid root and blocks Phase 267.
- **D-04:** The root cannot authorize a production rule, runtime, arena, counted-policy, registration, persistence, replay, standings, or public change.

### Manifest-of-hashed-leaves
- **D-05:** Emit one schema-versioned manifest-of-hashed-leaves whose root binds the exact admitted v1.37 authority; Phase 262 contract; runner, factory, oracle, solver, and analysis identities; current source bytes/hashes and lineage; every candidate and attempt disposition; populations and snapshots; complete payoff matrices; solver outputs and iteration curves; meta-distributions and response graphs; thresholds and gates; task, retry, and compute ledgers; red-team evidence; pure portfolio; finalist disposition; preliminary feasibility evidence; holdout commitment; and bounded claim interpretation.
- **D-06:** Every leaf has an explicit schema/type, canonical byte encoding, privacy class, authoritative storage root/object identity, length/hash, and resolvability status. Private objects remain private; safe projections disclose commitments and approved aggregates only.
- **D-07:** The root binds the exact Git source/dirty declaration, lockfile, selected semantic tuple, `MATCH_KERNEL`, runtime/toolchain identities, arena semantic catalog, side/initiative condition policy, budgets, and analysis versions used to produce it.
- **D-08:** Any mutation creates a new branch/root and invalidates all descendants of the former root. Validation never rewrites, refreshes, or silently repairs a leaf.
- **D-09:** Every later current-edge, inward, or bracket branch must include the exact Phase 266 root as a parent dependency; a descendant cannot substitute an equivalent-looking current baseline.

### Executable pre-formation absence proof
- **D-10:** Before root publication, an executable inventory scans the repository tree, generated outputs, artifact stores, task and lineage ledgers, cache namespaces, prompt/model bundles, trace/replay stores, and configured private storage roots and proves the absence of current-edge experiment, inward, and bracket namespaces, cold-root branches, manifests, initial states, candidates, scores, prompts, caches, traces, replays, and results.
- **D-11:** The absence checker must reject seeded canaries for every forbidden artifact class and naming/identity path. A text grep alone is not sufficient, and policy/contract text describing future profiles must not be mistaken for executable materialization.
- **D-12:** Freeze publication is an atomic gate: the complete manifest, all required leaves, the absence receipt, and root validation appear together, or no valid root exists.

### Preliminary finalist and holdout gate
- **D-13:** Each frozen current finalist must pass preliminary legal-information, deterministic-repeat, source/memory/objective/output, runtime-profile, replay-review, and compatibility evidence before appearing on the eligible pre-formation list.
- **D-14:** Freeze the ordinary-promotion design as an exact source-hash allowlist. Only listed pre-formation current finalist hashes may later be re-admitted through canonical Strategy Revision validation; no formation-control candidate can inherit eligibility.
- **D-15:** If the eligible list is empty, preserve that fact without fabricating promotion readiness. Phase 269 may later emit `no_certifiable_current_finalist`.
- **D-16:** Bind only the original holdout commitment and custody receipt; the holdout preimage remains inaccessible and unopened. Any access/query evidence before the authorized one-batch evaluation is a blocking failure.

### the agent's Discretion
- Manifest file layout, Merkle/tree fan-out, content chunking, and command decomposition are flexible only if repository canonical encoding/identity primitives are reused and every required leaf remains typed, resolvable, and independently verifiable.
- Private storage implementation and filenames may follow established v1.37 patterns; they cannot weaken custody, retention, privacy, or offline reproduction.
- Stable error-code names are flexible. Root membership, the absence inventory, gate ordering, and failure dispositions are not.

### Deferred Ideas (OUT OF SCOPE)
- All three formation profiles and their cold-root branches remain absent until this root verifies.
- Common holdout opening belongs to Phase 269.
- Ordinary product certification belongs to Phase 269 and accepts only exact allowlisted pre-formation current hashes.
- Rule, runtime, arena, product, and public changes remain outside v1.38.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|---|---|---|
| FRZE-01 | One content-addressed current-league root freezes exact sources, lineage, population, matrices, meta-distributions, graphs, thresholds, budgets, task and compute ledgers, red-team attempts, finalist decisions, holdout commitment, and claim interpretation; every descendant profile root binds it, and any mutation creates a new branch and invalidates the old descendants rather than refreshing a mutable `latest`. | Typed leaf inventory, byte rehash, source/tuple join, atomic publication, descendant gate. [VERIFIED: `REQUIREMENTS.md`] |
| FRZE-02 | No formation-experiment current-edge, inward-rank, or bracket namespace, cold-root branch, manifest, initial state, candidate, score, trace, cache, prompt, replay, or profile result exists before the valid current-league freeze root. | Multi-root typed inventory, canary matrix, pre-publication receipt. [VERIFIED: `REQUIREMENTS.md`] |
| FRZE-03 | Current finalists pass legal-information, deterministic-repeat, source/memory/objective/output, runtime-profile, replay-review, and preliminary compatibility proof, and the exact-source-hash ordinary-promotion design is frozen while the common sealed holdout remains unopened. | Per-finalist evidence graph, exact allowlist, read-only seal state/commitment verification. [VERIFIED: `REQUIREMENTS.md`] |
| FRZE-04 | A process-valid current metagame failure may be frozen, reported honestly, and proceed to the formation study under the original contract, but an integrity, provenance, incompleteness, contamination, or reproducibility failure blocks formation materialization. | Separate process and empirical dispositions with synthetic positive/negative fixtures. [VERIFIED: `REQUIREMENTS.md`] |
</phase_requirements>

## Summary

Phase 266 should be a read-only verifier plus a one-time offline publisher over **completed, independently verified Phase 265 evidence**, not a new league runner. The source already has canonical JSON admission, domain-separated lab roots, typed league identities, content-addressed private artifacts, data-only reopening, and v1.37 write/check/privacy precedents. Reuse those primitives, but make the freeze a new typed manifest whose root is recomputed from complete referenced bytes and whose validator never repairs missing leaves. [VERIFIED: `packages/spec/src/canonical-json-encode.ts`, `packages/strategy-lab/src/contracts.ts`, `packages/strategy-lab/src/league/{identity,repository}.ts`, `scripts/evaluate-v1-37-prearchive-proof.ts`]

The empirical inputs are **not available** at research time: `STATE.md` says Phase 265 Plan 07 Task 3 is pending, its verification is `gaps_found` with 0/5 empirical truths, and neither the planned run-result nor Plan 07 summary file exists. Therefore no population, matrix, outcome, eligible finalist, actual commitment receipt, or freeze root may be inferred from prospective allocation or source-only tests. [VERIFIED: `.planning/STATE.md` 2026-09-22 continuity, `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-VERIFICATION.md`, file existence checks 2026-09-23]

**Primary recommendation:** Plan a fail-closed `assemble → independently verify → atomically publish` freeze that can run only after Phase 265 closes. The design joins the source-only seal precursor to a separately derived league-evidence-set root, then hashes their bridge as one leaf of the final manifest; actual empirical and custody inputs remain execution gates. [VERIFIED: `266-CONTEXT.md` D-01–D-16; `scripts/lib/v1-38-local-seal.ts:125-136,506-568`]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| League evidence reopening, leaf validation, root calculation | Offline private research CLI | Private artifact store | Existing league repository and reopener are private/offline; production services must not consume raw evidence. [VERIFIED: `league/repository.ts`, `league/report.ts`, `266-CONTEXT.md` D-04–D-06] |
| Pre-formation absence inventory and gate | Offline private research CLI | Repository/configured private roots | Source import graph alone excludes private data stores; both must be scanned. [VERIFIED: `scripts/check-v1-38-lab-boundaries.ts`, `266-CONTEXT.md` D-10–D-11] |
| Unopened seal commitment verification | Offline operator-local seal boundary | Restricted out-of-repository store | Seal code owns commitment and hash-chained state/ledger; freeze must never read preimage or invoke opening. [VERIFIED: `scripts/lib/v1-38-local-seal.ts`, `262-CONTEXT.md` D-19R/D-20R] |
| Later formation authorization | Future Phase 267 offline lab entry point | Freeze validator | Exact root parent check belongs at materialization entry, not a mutable flag or production service. [VERIFIED: `266-CONTEXT.md` D-09; `ROADMAP.md` Phase 267] |
| Safe summary projection | Offline publisher | Public artifact only if explicitly approved | Existing privacy scanner rejects private fields and markers; no raw leaf goes public. [VERIFIED: `packages/spec/src/public-output-privacy.ts`, `266-CONTEXT.md` D-06] |

## Project Constraints (from AGENTS.md)

- Read `.planning/PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, `research/SUMMARY.md`, and canonical specs before implementation. [VERIFIED: `AGENTS.md`]
- Preserve pure deterministic serializable side-effect-free engine; no game rules in React; no time/randomness/filesystem/network/database inside engine. [VERIFIED: `AGENTS.md`]
- Strategy source is hostile: never execute it in web/API or use Node `vm` as a boundary; validate runtime boundaries with schemas. [VERIFIED: `AGENTS.md`]
- Preserve canonical terminology, immutable submitted Strategy Revisions, and no Strategy source, memory, or objective payload in public replay. [VERIFIED: `AGENTS.md`]
- Match/replay changes require deterministic reconstruction, integrity, board realism, and browser plausibility checks; runtime changes require invalid-output, timeout, forbidden-capability, and limits tests; distinguish strategy from system failure. Phase 266 should avoid those behavioral changes. [VERIFIED: `AGENTS.md`]
- Keep updated planning docs committed in the normal GSD handoff. [VERIFIED: `AGENTS.md`]
- Preserve the roadmap's ordered foundation → engine → replay → sandbox → orchestration → workshop → viewer build sequence; use discuss/plan/execute GSD stages rather than bypassing their gates. [VERIFIED: `AGENTS.md`]

## Standard Stack

| Component | Version/status | Prescribed use | Provenance |
|---|---|---|---|
| Node.js `node:crypto`, `node:fs`, `node:path` | Node 24.15.0 installed | SHA-256/hash verification, exact-byte filesystem inventory, durable atomic publication. | [VERIFIED: local `node --version`; `league/repository.ts`; `scripts/lib/v1-38-local-seal.ts`] [CITED: https://nodejs.org/download/release/v24.16.0/docs/api/crypto.html] |
| `@cowards/spec` canonical JSON/identity/privacy | Repository source | Canonical byte admission, domain framing, safe projection. | [VERIFIED: `packages/spec/src/canonical-json-encode.ts`, `canonical-identity-domains.ts`, `public-output-privacy.ts`] |
| `@cowards/strategy-lab` league contracts/repository | Repository source | Reopen/validate private current league without issuing work. | [VERIFIED: `packages/strategy-lab/src/league/{contracts,identity,repository,report}.ts`] |
| TypeScript / Vitest / tsx | 6.0.3 / 4.1.6 / 4.22.0 in lockfile/local | Typed CLI and focused injected tests. | [VERIFIED: `pnpm-lock.yaml`, local `tsc --version`, `vitest --version`] |
| pnpm / Git | 11.1.2 / 2.50.1 locally | Existing build/test runner and exact source object identity. | [VERIFIED: local version commands; `package.json`] |

**Installation:** None. This is a code/config/evidence phase over existing dependencies; do not add packages or run a technology spike. Package-legitimacy and postinstall gates are not triggered unless the plan changes to install something, which would need a separate review. [VERIFIED: `ROADMAP.md` Phase 266 research flag; existing `package.json`/`pnpm-lock.yaml`]

## Architecture Patterns

### System Architecture Diagram

```text
completed/verified Phase 265 head + Phase 262/v1.37 authority + unopened seal receipt
       │ exact identity, byte and completeness checks
       ▼
read-only evidence resolver ──missing/conflict/process-invalid──► BLOCK (no valid root)
       │ process-valid (including empirical non-pass)
       ▼
typed hashed leaves + per-finalist preliminary receipts + exact source allowlist
       │                         │
       │                  absence inventory of all configured scopes
       │                         └─ forbidden artifact/unknown scope ──► BLOCK
       ▼
canonical manifest + absence receipt + source/seal precursor join
       │ rederive every object, validate safe projection
       ▼
atomic immutable publication of one final root
       │ exact root as mandatory parent, only after verification
       ▼
Phase 267 lab materialization gate (not implemented by Phase 266)
```

This is an offline research-service boundary, not a web/API/Go/game-engine data path. [VERIFIED: `ROADMAP.md` Phases 266–267; `266-CONTEXT.md` D-04/D-09/D-12]

### Recommended Project Structure

```text
packages/strategy-lab/src/league/freeze.ts          # typed manifest, leaf/domain validation, pure gate decisions
packages/strategy-lab/src/league/freeze.test.ts     # synthetic graph and disposition tests
scripts/lib/v1-38-current-freeze-inventory.ts       # repository + configured private-root absence scan
scripts/lib/v1-38-current-freeze-publication.ts     # restricted durable writer and data-only checker
scripts/freeze-v1-38-current-league.ts               # explicit --write / --check offline modes
scripts/*.test.ts                                    # canaries, mutation, seal/atomic fault tests
```

Names are implementation recommendations, not existing files. Keep the pure typed decision logic in the private lab package and filesystem/seal operations in offline scripts; the engine and product packages need no changes. [VERIFIED: existing separation in `packages/strategy-lab/src/league`, `scripts/run-v1-38-serious-league.ts`, `scripts/check-v1-38-lab-boundaries.ts`; `AGENTS.md`]

### Pattern 1: Typed leaf closure, not a directory snapshot

Use a schema-versioned leaf index keyed by stable semantic role plus explicit multiplicity/order. Each leaf declares `type`, `schemaVersion`, `canonicalEncoding`, `privacyClass`, authoritative store/object identity, byte length, raw-byte hash, and resolvability. Reopen the source object under bounded limits, hash its exact bytes, parse/re-encode where a canonical JSON schema is declared, re-derive the declared league root, and compare all linked parent roots. Include empty collections explicitly so omission is not silently treated as zero. [VERIFIED: `266-CONTEXT.md` D-05–D-07; `league/identity.ts:64`, `league/repository.ts:110-157`, `league/report.ts`]

Leaf groups must cover: v1.37/Phase 262 authority; exact source/dirty/lockfile/toolchain/kernel/runtime/arenas/condition policy; Phase 263 runner, Phase 264 factory/oracles, Phase 265 solver/analysis; complete candidates and source bytes/lineage; all allocations, starts, attempts, failures/retries/rejections/unused slots; each population, matrix cell/snapshot, solver output, rounds/curves/distributions/graphs; red-team attempts, budgets, compute receipts; portfolio/finalist disposition; per-finalist preliminary proof; original seal commitment/custody and bounded claim interpretation. No report projection substitutes for source evidence. [VERIFIED: `266-CONTEXT.md` D-02/D-05/D-07/D-13–D-16; `265-VERIFICATION.md`]

### Pattern 2: Separate process validity from empirical outcome

Represent `processStatus` as a hard gate independent of `currentLeagueOutcome`. A fully accounted, reproducible run whose precommitted threshold fails—or yields `no_robust_pure_finalist_found`—may be a valid frozen outcome, with an empty promotion allowlist if appropriate. An unresolved start, missing matrix cell, stale identity, contamination, system failure in an accepted cell, or incomplete replay/custody graph is `process_invalid`, not an empirical loss. Do not transform charged failure records into accepted game results. [VERIFIED: `266-CONTEXT.md` D-02/D-03/D-15; `league/contracts.ts:57-58,172`, `league/selection.ts:239`, `league/repository.ts`]

### Pattern 3: Non-circular seal join (required design resolution)

The existing seal's `currentLeagueFreezeRoot` is derived **only** from clean checkout `sourceCommit`, `sourceTree`, and `freezeCarrierIdentity`, before a full league manifest exists; the commitment record also includes it. It is therefore a precommitted checkout/carrier identity, not sufficient as the final Phase 266 manifest-of-leaves root. The resolved acyclic order is: independently validate the original commitment and committed-state ledger; derive a league-evidence-set root over complete non-bridge leaves; derive a versioned bridge over original precursor/commitment/ledger, that evidence-set root, actual source/dirty declaration and matched semantic tuple; then include the bridge as a typed leaf in the final manifest and derive its root. Neither the original commitment nor the bridge contains the final root. Recompute original precursor from its recorded source commit/tree, authenticate those Git objects and ancestry to the final source, and match the seal request's semantic/kernel/runtime tuple; mismatch blocks. The identity of an actual committed unopened receipt remains an execution-time input, not something the checked-in mechanics artifact proves. [VERIFIED: `scripts/lib/v1-38-local-seal.ts:125-136,506-568`, `.planning/artifacts/v1.38-local-seal-protocol-v2.json`, `266-CONTEXT.md` D-05/D-16]

The existing `verifyV138LocalSealReceipt` appends a ledger event, including on a mismatch path; it is **not** a read-only Phase 266 precondition. A new strictly read-only receipt/state/ledger inspection must establish unopened custody without calling that API or any opening/consumption method. [VERIFIED: `scripts/lib/v1-38-local-seal.ts:755-769`; `266-PATTERNS.md`]

### Pattern 3a: Per-finalist preliminary receipt, not product certification

For each actual Phase 265 finalist, require a typed source-hash-bound receipt with explicit legal-information, deterministic-repeat, source-size, memory/objective/output, declared runtime lane/profile, replay-review, and compatibility subresults plus exact evidence roots. The eligible list is the subset passing **all** preliminary gates; its exact source hashes and ordinary Strategy Revision re-admission design become leaves. An actual no-finalist outcome or all-failed preliminary proof yields an explicitly empty allowlist; none of this performs Phase 269 canonical product certification. [VERIFIED: `266-CONTEXT.md` D-13–D-15; `REQUIREMENTS.md` FRZE-03/CERT-01]

### Pattern 4: Atomic, one-way publication

Use a staging/private store and an exclusive immutable final-root publication after all leaf, seal, absence, and projection checks. Repeated `--check` is read-only; `--write` refuses overwrite with different bytes. Preflight is read-only and non-authorizing without an expected root; its roots-only report is committed into the prepublication source epoch. A distinct read-only raw-evidence/reviewer route at that epoch derives the typed leaf root without using the candidate manifest, publisher response or safe receipt, then records it as a no-replace private reviewer expectation. Write/check and later Phase 267 handoff require that independently supplied expected `--freeze-root` and reviewer record; the publisher rederives the complete root and rejects an alternate internally valid branch. Publication must not rely on a mutable pointer or silently replace an earlier root. The absence inventory and final root use the committed prepublication epoch under an exclusive observation window; safe receipt, private reviewer record and private freeze objects are exact named phase-owned output deltas, separately schema/byte/privacy/forbidden-class validated rather than folded back into the baseline. Check reconstructs the epoch plus only that validated delta and rejects unrelated change; Phase 267 rechecks the historical exact root before construction. [VERIFIED: `266-CONTEXT.md` D-01/D-08/D-09/D-12; `league/repository.ts` durable exclusive-link pattern; `scripts/evaluate-v1-37-prearchive-proof.ts` write/check precedent]

### Anti-Patterns to Avoid

- `latest`/HEAD/directory naming as authority, or checksum-only leaf references with no resolvable object and schema. [VERIFIED: `266-CONTEXT.md` D-01/D-06]
- A grep-only absence proof: current boundary scanner deliberately excludes `.planning` and `.strategy-lab` data, so a separate data inventory is necessary. [VERIFIED: `scripts/check-v1-38-lab-boundaries.ts:15-75`; `266-CONTEXT.md` D-10/D-11]
- Treating source-only fixtures, Plan 265 prospective allocation, or a selected response as an empirical result. [VERIFIED: `265-07-PLAN.md`; `265-VERIFICATION.md`]
- Calling `armV138LocalSealOpening`, `consumeV138LocalSealOpening`, or a holdout query in this phase. [VERIFIED: `scripts/lib/v1-38-local-seal.ts:642-693`; `266-CONTEXT.md` D-16]
- Hashing JSON via ad hoc `JSON.stringify` where manifest canonical bytes/identity domains are required. [VERIFIED: `packages/spec/src/canonical-json-encode.ts`; `266-CONTEXT.md` discretion]

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---|---|---|---|
| Canonical JSON and domain-separated roots | New serializer or unframed concatenation | `@cowards/spec` canonical admission/identity and `labRoot` | Existing exact failure semantics and domain tags. [VERIFIED: codebase files above] |
| League graph and stored bytes | Reparse filenames as semantic authority | Typed league schemas, `validateLeagueRoot`, private repository/reopen APIs | Already binds roots and records unresolved charges. [VERIFIED: `league/{contracts,identity,repository}.ts`] |
| Private/public filtering | New regex-only sanitizer | `assertPublicOutputLeakSafe` plus exact safe projection schema | Recursive forbidden fields/markers already defined. [VERIFIED: `public-output-privacy.ts`] |
| Hostile Strategy execution | Freeze-time diagnostic Match runner | Phase 265 retained and independently verified evidence | This phase has no Strategy/provider/Match execution authority. [VERIFIED: `266-CONTEXT.md`; task boundary] |
| Seal signing/custody | Ad hoc signer or replacement holdout | Existing operator-local commitment and append-only ledger; explicit bridge | Current assurance is `single_operator_local_seal_v1`, not independent custody. [VERIFIED: `262-CONTEXT.md` D-19R/D-20R; `v1-38-local-seal.ts`] |

## Common Pitfalls

1. **Premature freeze:** Plan 265 Task 3 and 0/5 empirical verification remain open. Gate on actual Phase 265 completion, immutable run/result head, and independent verification; otherwise emit no root. [VERIFIED: `.planning/STATE.md`, `265-VERIFICATION.md`, absent run-result/summary]
   The CLI's `verifyRetainedSeriousLeague` reopens the graph but currently reports `empiricalRequirementsComplete: false` even for a `run-complete` head; that read-only check alone is not a Phase 265 completion assertion. Require the separate empirical closure/verification evidence. [VERIFIED: `scripts/run-v1-38-serious-league.ts:1089-1101`; `266-PATTERNS.md`]
2. **Seal/root identity cycle:** The precursor named `currentLeagueFreezeRoot` is source-only. The ordered evidence-set → bridge → final-manifest derivation keeps it distinct from the final league root without rewriting the original commitment. [VERIFIED: `v1-38-local-seal.ts:125-136,506-568`]
3. **False absence from partial or caller-selected scan:** Repo import checks omit evidence stores and cannot cover configured private roots. Derive mandatory scopes independently from fixed repository/.planning roots, Phase 265 allocation/run journal/head, factory producer config, actual seal-store config and typed path-bearing retained evidence; `--inputs` only locates paths and must reconcile by canonical realpath and role. The allocation binds `outputDirectories.league` and `outputDirectories.responseFactory`; the journal/head retain `factoryDirectory`/`responseFactoryDirectory`; authoring config retains `stateDirectory`/`disclosedDirectory`/`promptRoot`/`contextRoot`. Omitted outside-repository configured roots, extra/unknown/inaccessible/symlink roots, or changed scope block. Seed each artifact class and alternate naming/identity path as a canary, and preserve future-profile policy prose as allowed text. Scan holdout metadata only, never preimage bytes. [VERIFIED: `265-07-PLAN.md` run contract; typed Phase 265 source fields; `check-v1-38-lab-boundaries.ts`; `266-CONTEXT.md` D-10/D-11]
4. **TOCTOU at publication:** A separate scan followed by an unlocked write can admit a formation artifact in between. Plan a locked/exclusive snapshot or repeatable sealed inventory check, and make Phase 267 re-verify exact root/absence receipt before first materialization. [VERIFIED: `266-CONTEXT.md` D-09/D-12; source publication patterns]
5. **Selective charge/report retention:** Reopening can derive an unresolved start as process-invalid without repairing it; omitted retries/failed red team or unused allocation would make a falsely tidy manifest. Reconcile all allocation slots and ledger events, including unused. [VERIFIED: `league/repository.ts`, `266-CONTEXT.md` D-02/D-05]
6. **Overclaiming finalist readiness:** Preliminary proof is not Phase 269 ordinary certification; an empty allowlist is valid and does not imply product authorization. [VERIFIED: `266-CONTEXT.md` D-13–D-15; `REQUIREMENTS.md` CERT-01]
7. **Private leak through leaf metadata or error text:** Even object paths and diagnostics can disclose restricted evidence. Keep public projection opaque/root-only and run recursive privacy scans on values and error payloads. [VERIFIED: `public-output-privacy.ts`, `.planning/artifacts/v1.37-restricted-evidence-policy.md`]
8. **Historical status mistaken for current gate:** `266-CONTEXT.md` has a July header saying ADMIT-03 was pending, whereas current `REQUIREMENTS.md` records ADMIT-03 satisfied and `STATE.md` places work in Phase 265. Use current authenticated lifecycle evidence; Phase 265 closure remains the relevant prerequisite. [VERIFIED: `266-CONTEXT.md`, `REQUIREMENTS.md` ADMIT-03, `STATE.md`]

## Code Examples

Existing identity derivation to reuse (not a proposed new implementation): [VERIFIED: `packages/strategy-lab/src/contracts.ts:12-16`]

```ts
export const labRoot = (domain: string, value: unknown): LabRoot => {
  const admitted = admitCanonicalJsonValue(["cowards:strategy-lab:v1", domain, value], { profile: "canonical-manifest" })
  if (!admitted.ok) throw new TypeError("LAB_CANONICAL_VALUE")
  return `sha256:${createHash("sha256").update(admitted.canonicalBytes).digest("hex")}`
}
```

Existing read-only reopener explicitly returns `issued: false` and reports unterminated starts as process-invalid; new freeze code should consume, not mutate, that evidence. [VERIFIED: `packages/strategy-lab/src/league/repository.ts:129-181`]

```ts
const terminal = persisted ?? deriveUnterminatedStart(start)
return freezeLabValue({ start, terminal, terminalProvenance:
  persisted ? "persisted" as const : "derived_unterminated_start" as const })
```

## State of the Art / Existing Precedent

| Existing approach | Phase 266 implication | Provenance |
|---|---|---|
| v1.37 deterministic JSON/Markdown `--write`/`--check`, restricted evidence policy, source/authority handoff | Reuse check semantics, private object/safe attestation split, exact predecessor joins. | [VERIFIED: `scripts/evaluate-v1-37-prearchive-proof.ts`, `.planning/artifacts/v1.37-restricted-evidence-policy.md`, `scripts/generate-v1-37-strategy-foundation-handoff.ts`] |
| Phase 265 private league repository and rooted graph reopener | Prefer typed, bounded reopening of retained evidence over a second interpretation of filenames. | [VERIFIED: `league/{repository,report}.ts`, `scripts/run-v1-38-serious-league.ts`] |
| Phase 262 local seal protocol v2 (mechanics) | Distinguish mechanical protocol proof from an actual current commitment/custody receipt; verify the latter when available. | [VERIFIED: `.planning/artifacts/v1.38-local-seal-protocol-v2.json` (`realHoldoutMaterialPresent:false`), `scripts/lib/v1-38-local-seal.ts`] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| — | No unverified package or external-custody claim is recommended. The acyclic bridge, independent root expectation and scope derivation are specified design contracts; actual Phase 265 outputs, unopened commitment and independently expected root remain unresolved execution inputs, not assumed facts. | Architecture/Execution Gates | Prevents a false release gate. |

## Resolved Design Contracts and Execution-Time Gates

**Design resolved for planning, not empirically satisfied:**

1. **Unchanged prospective allocation bound by a later run:** `.planning/artifacts/v1.38-phase-265-allocation-v2.json` is the approved immutable prospective allocation, not a run-produced successor. `prepare-prospective` admits and prints it; `run` stores that allocation in `run-start` and creates a head with `allocationRoot`; `verify-retained` reopens that graph. Freeze must authenticate the exact v2 `allocation.root` against the admitted root of the embedded run-start allocation, actual retained head and run-result allocation roots, plus separate independent empirical-completion verification. Reject the older allocation path, altered v2, absent run, or any mismatch. Graph inspection alone is not the empirical-completion verdict. [VERIFIED: `scripts/run-v1-38-serious-league.ts` `prepareProspectiveSeriousLeague`, `runSeriousLeague`, `verifyRetainedSeriousLeague`, `seriousLeagueMain`; `265-07-PLAN.md` Task 3]
2. **Acyclic seal bridge:** Derive non-bridge league evidence root, then original-precursor/commitment/ledger/source-tuple bridge, then final manifest root. The old `currentLeagueFreezeRoot` is never renamed, rewritten, or expected to equal final root. [VERIFIED: `v1-38-local-seal.ts:125-136,506-568`; `266-CONTEXT.md` D-01/D-05/D-16]
3. **Independent scope authority:** Fixed repository/.planning paths plus authenticated allocation `outputDirectories.league`/`outputDirectories.responseFactory`, run journal/head `factoryDirectory`/`responseFactoryDirectory`, authoring `stateDirectory`/`disclosedDirectory`/`promptRoot`/`contextRoot`, other typed path-bearing retained evidence, factory producer config and actual seal-store config define mandatory scan roles. A caller's `--inputs` descriptor only locates these; canonical realpath/role/owner/object identity reconciliation rejects missing, extra, unknown, inaccessible, symlinked or aliased roots, including outside-repository omissions. Re-derive under publication lock. Holdout preimage remains unread. [VERIFIED: typed Phase 265 source fields; `266-CONTEXT.md` D-10/D-11]
4. **Independent final-root expectation and epoch:** Read-only preflight requires no expected root and grants no authority. Commit its roots-only report first to fix an exact prepublication Git/source/dirty-declaration/absence epoch (pre-existing user changes remain untouched and are bound by the declaration). A distinct raw-evidence reviewer route derives the complete typed root at that epoch without accepting candidate freeze manifest, publisher response or safe receipt as the expectation, and persists one no-replace private reviewer record. `--write`, `--check`, and later Phase 267 parent validation require `--freeze-root` plus that record and independently rederive the root; alternate valid branch B cannot substitute for expected A. The report is inside the baseline epoch; exact private reviewer/freezer objects and safe receipt are separately validated post-epoch output deltas. Read-only check reconstructs baseline plus only those deltas and rejects unrelated file/store mutation. [VERIFIED: `266-CONTEXT.md` D-01/D-08/D-09/D-12]
5. **Absence receipt assurance:** No established Phase 266 signing identity was found. The receipt is content-addressed and independently checkable; do not label the content hash a signature or create an ad hoc signer. An authenticated established signer may be bound only if it is genuinely available and separately verified at execution. [VERIFIED: `266-CONTEXT.md` Specific Ideas/D-10–D-12; `262-CONTEXT.md` signing-identity discretion]
6. **Historical producer source versus freezer source:** `leagueCurrentSourceIdentity()` calls `factoryAssessmentImplementationManifest()`, which recursively inventories source files. Adding Phase 266 production scripts changes the current result even when the actual Phase 265 run bytes did not change. Reconstruct the Phase 265 producer implementation/source roots from its frozen exact source inventory or read-only detached source checkout at the recorded producer commit, and separately bind the Phase 266 freezer commit/tree/dirty/source root. Do not call current-checkout `leagueCurrentSourceIdentity()` as a historical producer verifier. Test that post-run Phase 266 source additions preserve exact historical verification but change the distinct freezer source root. [VERIFIED: `scripts/run-v1-38-serious-league.ts:241-244`; `scripts/v1-38-factory-implementation.ts:11-17`; `scripts/check-v1-38-lab-boundaries.ts:44-63`]

**Still blocking at execution, not supplied by source-only research:**

1. **Actual empirical head:** Phase 265 Plan 07 Task 3 must produce a complete retained process-valid head bound to the unchanged approved prospective allocation root, and separate independent verification closing LEAG-01–09. None is established here; prospective allocation alone or injected fixtures are not substitutes. [VERIFIED: `.planning/STATE.md`, `265-VERIFICATION.md`]
2. **Actual unopened seal:** The operator-configured restricted store must contain the original committed commitment and read-only pre-open ledger receipt. The checked-in protocol v2 is mechanical and says `realHoldoutMaterialPresent:false`; only execution-time inspection can establish the real receipt. [VERIFIED: `.planning/artifacts/v1.38-local-seal-protocol-v2.json`; `v1-38-local-seal.ts`]
3. **Finalist and root inputs:** The actual finalist set, source hashes, preliminary proofs, independently expected final root, and all mandatory private path identities depend on completed Phase 265 evidence and custody. Empty eligible list is allowed but must be explicit; absent or mismatched roots block. [VERIFIED: `266-CONTEXT.md` D-13–D-16; `REQUIREMENTS.md` FRZE-03/CERT-01]

## Environment Availability

| Dependency | Required by | Available | Version / status | Fallback |
|---|---|---|---|---|
| Node.js | Offline manifest/inventory CLI | ✓ | 24.15.0 | None needed. [VERIFIED: local probe] |
| pnpm | Existing tests/CLI | ✓ | 11.1.2 | None needed. [VERIFIED: local probe] |
| Git | Exact commit/tree/dirty identity | ✓ | 2.50.1 Apple Git | None; identity failure blocks. [VERIFIED: local probe] |
| TypeScript, Vitest, tsx | Source/tests | ✓ | 6.0.3, 4.1.6, 4.22.0 | Existing lockfile. [VERIFIED: local probes/lockfile] |
| Phase 265 empirical result and verified retained graph | All freeze leaves | ✗ currently unproduced | Plan 07 Task 3 pending; older private store evidence is not a substitute | No synthetic fallback. [VERIFIED: `STATE.md`, `265-VERIFICATION.md`] |
| Actual out-of-repo holdout store and commitment | FRZE-03 seal join | Unverified intentionally | Operator-configured restricted root not probed during research | No substitute commitment. [VERIFIED: `v1-38-local-seal.ts`; `266-CONTEXT.md` D-16] |

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Framework | Vitest 4.1.6, TypeScript 6.0.3 [VERIFIED: local/lockfile] |
| Config | Existing workspace Vitest infrastructure; `packages/strategy-lab/package.json` has `vitest run --maxWorkers=1`. [VERIFIED: codebase] |
| Quick run | `pnpm exec vitest run --maxWorkers=1 packages/strategy-lab/src/league/freeze.test.ts scripts/freeze-v1-38-current-league.test.ts` (new files; Wave 0) |
| Full phase gate | Focused freeze/inventory/seal tests, `pnpm exec tsc -b packages/strategy-lab/tsconfig.json --pretty false`, strict script compilation via `pnpm exec tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --types node --skipLibCheck scripts/lib/v1-38-current-freeze-inventory.ts scripts/lib/v1-38-current-freeze-publication.ts scripts/derive-v1-38-current-freeze-expected-root.ts scripts/freeze-v1-38-current-league.ts`, `pnpm exec tsx scripts/check-v1-38-lab-boundaries.ts`, and `pnpm exec tsx scripts/check-v1-38-serious-league-boundaries.ts`; read-only real non-authorizing preflight, separate reviewer expected-root record at committed epoch, then `--check --freeze-root <recorded root> --expected-record <private record>` only after Phase 265 completion. [VERIFIED: existing command paths] |

### Phase Requirements → Test Map

| Req | Behavior | Test type | Automated command / fixture | Exists? |
|---|---|---|---|---|
| FRZE-01 | Complete typed leaf closure, byte mutations, stale/missing/conflicting identity, exact descendant parent | unit/integration | New `freeze.test.ts` plus offline `--check` on retained data | ❌ Wave 0 |
| FRZE-02 | All storage scopes and forbidden artifact classes; seeded canaries; prose control | unit/integration | New `v1-38-current-freeze-inventory.test.ts` | ❌ Wave 0 |
| FRZE-03 | Per-finalist preliminary evidence, exact source allowlist, committed unopened seal state | unit/integration | New freeze/seal-bridge tests with fake restricted store; real store read-only check after Phase 265 | ❌ Wave 0 |
| FRZE-04 | Process-valid empirical non-pass freezes; process/integrity/contamination failure blocks | unit/integration | New matrix of disposition fixtures in `freeze.test.ts` | ❌ Wave 0 |

### Sampling and Wave 0

- Per task: focused new tests and typecheck. Per wave: existing league identity/repository/report/selection and boundary suites plus new tests. Phase gate: complete source gate, real read-only closure check, independent review, and unchanged production/canonical hashes. [VERIFIED: `AGENTS.md`, `265-07-PLAN.md` test precedent]
- Wave 0 creates only synthetic/injected freeze and inventory fixtures; they never count as Phase 265 empirical proof or authorize materialization. [VERIFIED: `265-07-PLAN.md`, `265-VERIFICATION.md`]
- Fault injection must cover missing/unreadable private root, changed raw byte, changed canonical JSON, duplicate/conflicting leaf, unresolvable root, stale tuple/source, omission of failed/unused charge, partial atomic publication, concurrent materialization attempt, premature seal event, and every forbidden artifact-class canary. [VERIFIED: `266-CONTEXT.md` D-02/D-10–D-12/D-16]

## Security Domain

Security enforcement is enabled (no `security_enforcement:false` in `.planning/config.json`). Use ASVS **5.0.0** category names; the older template's V2/V3/V4/V5/V6 numbering refers to ASVS 4, not current ASVS 5. [VERIFIED: `.planning/config.json`] [CITED: https://owasp.org/projects/asvs] [CITED: https://cornucopia.owasp.org/taxonomy/asvs-5.0]

| ASVS 5 category | Applies | Phase control |
|---|---|---|
| 02 Validation and Business Logic | Yes | Exact schema/canonical-byte and process-vs-empirical gates. [VERIFIED: `league/contracts.ts`; `266-CONTEXT.md`] |
| 05 File Handling | Yes | Bounded regular-file/no-symlink private root reads; no skipped paths. [VERIFIED: `league/repository.ts`; `v1-38-local-seal.ts`] |
| 06 Authentication / 07 Session Management | No new web identity/session surface | Preserve existing operator role; no new login/session system. [VERIFIED: Phase 266 offline boundary] |
| 08 Authorization | Yes | Root validation alone grants only later lab materialization; deny product/public authority. [VERIFIED: `266-CONTEXT.md` D-04/D-09] |
| 11 Cryptography | Yes | Existing SHA-256 domain roots and original HMAC seal commitment; no custom primitive. [VERIFIED: `canonical-identity-domains.ts`, `v1-38-local-seal.ts`] |
| 14 Data Protection / 16 Security Logging and Error Handling | Yes | Restricted object class, safe projection, access/attempt ledger, no raw path/secret leakage. [VERIFIED: `public-output-privacy.ts`, `v1-38-local-seal.ts`] |

| Threat | STRIDE | Mitigation |
|---|---|---|
| Substitute same-labeled leaf, source or descendant baseline | Tampering | Rehash exact bytes, rederive typed roots, reject mismatch; exact parent root. [VERIFIED: `266-CONTEXT.md` D-01/D-06/D-09] |
| Omit failure/unused allocation or privately materialize formation early | Repudiation/Tampering | Closed charged-ledger reconciliation and multi-root absence canaries. [VERIFIED: `266-CONTEXT.md` D-02/D-10/D-11] |
| Leak Strategy source, memory, holdout data or host path in safe receipt | Information disclosure | Minimal projection plus recursive privacy scan; no preimage query. [VERIFIED: `public-output-privacy.ts`, `266-CONTEXT.md` D-06/D-16] |
| Race inventory and publication, or reuse stale success | Elevation of privilege | Atomic exclusive gate and re-verify exact root at Phase 267. [VERIFIED: `266-CONTEXT.md` D-08/D-09/D-12] |

## Sources

### Primary (HIGH confidence)

- `266-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `265-07-PLAN.md`, `265-VERIFICATION.md` — locked boundary and current empirical dependency.
- `packages/spec/src/{canonical-json-encode,canonical-identity-domains,public-output-privacy}.ts` — canonical byte/identity/privacy primitives.
- `packages/strategy-lab/src/{contracts,league/identity,league/contracts,league/repository,league/report,league/selection}.ts` — private typed league graph and no-finalist behavior.
- `scripts/lib/v1-38-local-seal.ts`, `.planning/artifacts/v1.38-local-seal-protocol-v2.json` — precursor identity, original commitment mechanics, and assurance limit.
- `scripts/check-v1-38-lab-boundaries.ts`, `scripts/check-v1-38-serious-league-boundaries.ts`, `scripts/evaluate-v1-37-prearchive-proof.ts` — source boundaries and publication precedent.

### Official documentation (MEDIUM from websearch classifier)

- [Node.js v24 crypto documentation](https://nodejs.org/download/release/v24.16.0/docs/api/crypto.html) — `createHash`/digest API; locally installed Node is 24.15.0.
- [OWASP ASVS project](https://owasp.org/projects/asvs) and [ASVS 5 category taxonomy](https://cornucopia.owasp.org/taxonomy/asvs-5.0) — current version/category names, not a certification claim.

## Metadata

**Confidence breakdown:** Standard stack HIGH (installed/local source); architecture HIGH for existing seams and locked requirements, MEDIUM for recommended final bridge until reviewed; pitfalls HIGH for code-observed identity and missing-data hazards; empirical input LOW/unknown because Phase 265 is unfinished.  
**Research date:** 2026-09-23. **Valid until:** Phase 265 closure or any seal/freeze source change; revalidate before planning execution.
