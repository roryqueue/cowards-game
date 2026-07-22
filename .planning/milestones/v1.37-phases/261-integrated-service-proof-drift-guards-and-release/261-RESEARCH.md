# Phase 261: Integrated Service Proof, Drift Guards, and Release — Research

**Researched:** 2026-07-19  
**HEAD revalidated:** `b77cb1d`  
**Domain:** Production-shaped integration proof, deterministic evidence rollups, release drift guards, milestone audit/archive/tag, and Strategy-foundation handoff  
**Confidence:** HIGH for repository architecture, proof seams, scenario coverage, release ordering, and the resolved Phase-261 restricted-evidence retention policy.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Phase Boundary

This phase proves the complete v1.37 trust chain through real service, persistence, runtime, browser, rollback, privacy, and boundary paths; generates deterministic safe evidence; performs the final authority/compatibility audit; archives the milestone; tags the archive commit; and emits the immutable handoff for serious Strategy development. It does not add new gameplay or Strategy capabilities.

### Locked Decisions

#### Service-backed proof topology
- **D-01:** Final proof uses a complete local production-shaped topology: real PostgreSQL, Go orchestration/persistence owner, runtime-service, actual TypeScript/Python/Rust/Zig adapters and pinned toolchains, canonical engine/Chronicle/replay, generated contracts, and selected web/browser surfaces. No mocked service boundary satisfies final proof.
- **D-02:** Execute the same content-addressed runtime/toolchain artifacts and containment policy intended for counted deployment. If a deployable environment cannot be reproduced and attested, that lane remains non-counted.
- **D-03:** The service manifest is a requirement-traced positive/negative matrix covering successful execution for every lane; player/system failures; stale/mixed identity; Chronicle rejection/reconstruction; four-condition Sets; persistence/recompute; retry/idempotency; rollback; historical replay; and public privacy.
- **D-04:** Live browser proof covers representative desktop and mobile public lane labels, historical evidence status, complete/degraded Set results, standings, replay reconstruction, rendered privacy, default network privacy, and board realism. Existing operator UI may be tested; otherwise operator behavior may remain API/integration proof.

#### Proof artifacts and privacy
- **D-05:** Commit deterministic public-safe canonical JSON and Markdown rollups containing requirement mappings, status, safe IDs/hashes, commands, limitations, and restricted evidence references. Raw logs, full diffs, artifact bytes, and sensitive diagnostics stay in restricted content-addressed storage.
- **D-06:** Provide deterministic write/check commands. Write derives rollups from signed evidence manifests; check independently validates inputs and fails on stale or edited artifacts. Volatile timestamps and host paths are not canonical comparison fields.
- **D-07:** Build public artifacts from explicit safe schemas, then recursively scan for actual source/artifact bytes, StrategyMemory, SoldierMemory, objectives, credentials, host paths, environment values, raw diagnostics, private markers, and restricted IDs. Policy text may still name forbidden categories.
- **D-08:** Retain restricted evidence through certificate validity plus a documented post-expiry audit/dispute window with access logging. Permanent safe rollups retain hashes/attestations after policy deletion.

#### Release blockers and rollback drills
- **D-09:** All four languages must pass functional ABI/full-trace conformance. A lane that fails deployable containment may remain supported but non-counted; the limitation must be explicit and no surface may overclaim it.
- **D-10:** A persisted audit reproduction blocks release unless an explicit prior compatibility ruling approves that exact semantic delta and identifies affected state/events/observations with updated requirements, fixtures, and tuple versions. Generic waivers are forbidden.
- **D-11:** Execute the full rollback matrix: lane kill switch and evidence staleness during scheduling/execution; transaction failure during Chronicle/Match completion; idempotent retry; cohort invalidation plus compensating reversal; standings recomputation; service/runtime version rollback; and mixed-tuple rejection throughout.
- **D-12:** No failing required proof may be manually overridden. Fix and rerun, or revise/descope the requirement through an explicit GSD approval flow before release. Infrastructure unavailability delays proof and never becomes a pass.

#### Final audit, archive, and handoff
- **D-13:** The milestone audit maps all 56 requirements to phase verification and proof artifacts and demonstrates one transition owner, exact tuple/evidence closure, zero unapproved semantic deltas, historical compatibility, truthful lane status, privacy scans, rollback drills, limitations, and reproducible commands/hashes.
- **D-14:** Create annotated tag `v1.37` on the archive commit. The tag message records the certified semantic tuple ID, prearchive machine-proof hash, audit artifact, handoff hash, and readiness hash. Sign only when an existing managed signing identity is available; otherwise use an annotated unsigned tag.
- **D-15:** Produce public-safe versioned JSON/Markdown Strategy-evaluation foundation handoff manifests containing the certified tuple, Strategy ABI/budgets, active arena catalog and geometry hashes, four-condition Set policy, corpus/certificate IDs, lane counted status, known limitations, and canonical commands.
- **D-16:** Serious-Strategy milestone initialization is blocked until all 56 requirements pass, final audit has no override, proof/handoff manifests validate, planning artifacts are archived, `v1.37` tags the archive commit, and the tag resolves to the audited proof/tuple identities. The next milestone still requires its own explicit approval gate.

### the agent's Discretion

- Exact proof-script decomposition, artifact filenames, restricted storage provider, audit/dispute retention duration, and representative browser routes/viewports are flexible within the locked topology and privacy constraints.

### Deferred Ideas (OUT OF SCOPE)

- Serious competitive Strategy implementation begins only in the next explicitly approved milestone after this gate passes.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|---|---|---|
| PROOF-01 | Every persisted core-rules audit reproduction passes or has an explicitly approved compatibility ruling retained with the regression suite. | Run the permanent reproduction directly, compare its exact seven observations to the retained Phase-257 result/rulings, and make a mismatch a non-overridable release failure. |
| PROOF-02 | Engine, spec, replay, runtime-service, and TypeScript/Python/Rust/Zig conformance suites pass with deterministic repeated results. | Reuse the three existing v1.37 aggregate proofs, but independently rerun the suites and all twelve current real lane executions under the selected production-shaped topology. |
| PROOF-03 | Service-backed proof covers success, player violation, system failure, no-mutation failure behavior, Chronicle validation, reconstruction, and replay. | Add one live manifest-driven proof that crosses Go -> runtime-service -> actual provider -> canonical kernel/Chronicle/replay and records only signed restricted receipts plus safe scenario results. |
| PROOF-04 | Service-backed proof covers explicit Set side/initiative fairness, persistence, standings/governance recomputation, idempotency, retry, rollback, and immutable historical evidence. | Drive the exact four-condition policy through real PostgreSQL and Go lifecycle APIs, execute the D-11 rollback matrix, and retain v1.4/v1.17/v1.36 evidence through explicit historical dispatch. |
| PROOF-05 | Privacy scans cover APIs, public/default views, logs, fixtures, generated contracts, and proof artifacts for source, artifacts, memories, objectives, diagnostics, host data, credentials, and security internals. | Build committed artifacts from closed safe schemas; scan raw public responses before reduction, generated outputs after rendering, and restricted-reference shapes recursively. |
| PROOF-06 | Boundary monitors detect duplicate transition ownership, mixed tuples, adapter-owned gameplay classification, stale evidence identity, unsupported event vocabulary, duplicate arena authority, unfair scheduling, unproved counted lanes, and private-output leakage. | Extend the existing v1.37 integrity monitor and root serialized monitor hub with one release-specific mutation-tested assertion per named regression class. |
| PROOF-07 | The final milestone audit demonstrates one transition authority, complete requirements traceability, passing drift guards, and no unapproved gameplay change. | Generate an exact 56-row trace matrix from REQUIREMENTS, phase verifications, and proof artifacts; require zero missing, duplicate, pending, overridden, or semantically unapproved rows. |
| PROOF-08 | v1.37 is archived and tagged before the serious competitive Strategy milestone begins. | Use an audit-first archive commit, then create and independently inspect annotated tag `v1.37`; the post-tag checker must join the peeled archive commit, tuple ID, proof hash, audit path, and handoff hash without self-reference. |

The eight requirements are the only Phase-261 implementation scope. Gameplay, Strategy behavior, new official geometry, new ABI semantics, and serious Strategy development remain excluded. [VERIFIED: `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, and `261-CONTEXT.md`]
</phase_requirements>

## Summary

Phase 261 is an integration-and-release proof phase, not another rules phase. The repository already has one selected `runtime-v1.19` authority, one `cowards-rules-v1.4` gameplay version, four current language certificates backed by twelve real runs, explicit four-condition Set authority, semantic Chronicle/replay validation, PostgreSQL/Go lifecycle tests, deterministic proof generators, and a 44-assertion default boundary chain. The remaining gap is that these pieces have not yet been exercised together through one new production-shaped live topology and bound into one 56-requirement release artifact. [VERIFIED: `.planning/STATE.md`, `260-VERIFICATION.md`, `v1.37-truthful-inputs-set-fairness-proof.json`, and current package scripts]

The primary recommendation is to add manifest-driven service, rollback/history, and browser collectors that own their full lifecycles and restricted capture; add a pure prearchive evaluator that consumes the signed manifests plus the 48 previously passed requirements and current Phase-261 executable evidence; then close with a release-ready audit, Strategy-foundation handoff, readiness artifact, archive commit, annotated tag, and post-tag identity checker. Keep collection, deterministic rollup validation, prearchive 55-passed/one-ready-pending evaluation, and Git archive/tag validation as distinct trust steps so no artifact has to hash or prove itself. [VERIFIED basis: D-01 through D-16 and the repository's v1.36/v1.37 proof patterns]

No external package or framework is needed. Existing Node standard-library hashing/filesystem/process primitives, Zod, Vitest, Playwright, Go `testing`, PostgreSQL, Docker, and the current four language toolchains cover the phase. [VERIFIED: root and package manifests plus local environment probes]

## Project Constraints (from AGENTS.md)

- Keep the engine pure, deterministic, serializable, and side-effect free.
- Do not put game rules in React components.
- Do not execute user Strategy code in the web/API process.
- Do not use `Math.random`, `Date.now`, system time, filesystem, network, or database access inside engine logic.
- Do not use Node `vm` as a security boundary for untrusted code.
- Treat Strategy code as hostile and validate every runtime boundary with schemas.
- Preserve canonical terminology: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle.
- Strategy Revisions are immutable once submitted for Match or MatchSet play.
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default.
- Engine work needs focused and invariant/property-style tests; replay work needs deterministic reconstruction and integrity tests; runtime work needs invalid-output, timeout, capability, limit, and schema tests; worker tests must distinguish player/Strategy failure from system failure; E2E must cover edit through replay.
- Replay/Match creation changes must retain in-bounds board realism and a plausible full canonical start in a real browser.

These directives constrain proof code as strongly as feature code: the proof must observe production owners, not reproduce their logic in a test harness. [VERIFIED: repository `AGENTS.md`]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Topology orchestration and evidence capture | Tooling / release runner | OS / restricted storage | A root runner starts and health-checks real components, captures process receipts, and never becomes product authority. |
| MatchSet scheduling, job lifecycle, persistence, recomputation, rollback | Go API/backend | PostgreSQL | Go is the selected normal orchestration owner; PostgreSQL supplies transactional state and immutable evidence constraints. |
| Strategy execution in four languages | Runtime-service/provider boundary | Pinned toolchains/containers | Hostile Strategy code remains outside web/API/Go and uses the current content-addressed lane identities and containment policy. |
| Match transition and failure consequence | Engine | Runtime-service transport | Only the canonical kernel mutates gameplay; transports return typed runtime outcomes and never invent penalties. |
| Chronicle validation and replay reconstruction | Replay package | Engine/spec | Replay validates exact-version transition evidence and reconstructs from canonical recorded transitions. |
| Public result, standings, lane label, and replay rendering | Browser/client and web server | Go public APIs | Web renders typed public projections; it does not derive rules, fairness, evidence eligibility, or gameplay classifications. |
| Proof artifact safety | Spec safe schemas | Release evaluator | Closed public DTO constructors and recursive scanners reduce signed restricted manifests to canonical safe JSON/Markdown. |
| Requirement traceability and audit | Release evaluator / planning artifacts | Phase verifications | The evaluator proves the machine join; the milestone audit explains it without manufacturing new evidence. |
| Archive and tag | Git / GSD milestone workflow | Post-tag checker | Git owns commit/tag identity; the checker verifies the join after the archive commit and annotated tag exist. |
| Strategy-evaluation handoff | Generated release artifact | Next milestone planning | It transports certified facts and limitations only; it authorizes no Strategy implementation by itself. |

[VERIFIED: current package ownership, `AGENTS.md`, Phase-256 through Phase-260 verifications, and D-01 through D-16]

## Implementation Inventory

### Existing authoritative inputs to consume

| Existing asset | Proven capability | Phase-261 use |
|---|---|---|
| `.planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts` | Direct executable seven-observation rules audit | Run fresh for PROOF-01; compare exact output to approved Phase-257 result/rulings. |
| `scripts/evaluate-v1-37-kernel-integrity.ts` + JSON/Markdown | Kernel, audit, history, replay/browser, and structural integrity proof | Hash and independently check as one lower-level input; do not restate its claims manually. |
| `scripts/evaluate-v1-37-executable-conformance.ts` + JSON/Markdown | Four-language corpus/full-trace certificate proof | Recheck identity and rerun real lanes in the live topology for PROOF-02/03. |
| `scripts/evaluate-v1-37-truthful-inputs-set-fairness.ts` + JSON/Markdown | Current runtime-v1.19, observations, arenas, four-condition Set policy, activation/recovery, privacy | Use as the immediate Phase-260 closure input and exact selected-authority source. |
| `scripts/check-v1-37-integrity-boundaries.ts` | Current tuple/kernel/runtime/Chronicle/arena/Set/privacy ownership checks | Extend with release-specific checks or call from a thin release checker; do not build a competing scanner. |
| `scripts/check-boundary-monitors.ts` and root `boundary:monitors` | Serialized umbrella gate, currently 44 assertions | Add Phase-261 release checks to the non-recursive default chain and mutation-test them. |
| `packages/spec/src/public-output-privacy.ts` | Recursive forbidden-field and marker rejection | Reuse for every public rollup, API capture, browser network response, generated handoff, and audit projection. |
| `apps/web/e2e/v1-36-competition-service-proof.spec.ts` | Live signed-in Go/runtime-service/PostgreSQL/public browser proof pattern | Reuse process/API/cleanup/polling patterns, but create a v1.37 proof with current tuple and all four lanes. |
| `apps/web/e2e/v1-37-rules-integrity-proof.spec.ts` | Desktop/tablet/mobile fixture-backed result/replay privacy and board realism | Retain as deterministic fixture coverage; it explicitly says it is not live-service proof and cannot satisfy D-01. |
| `apps/web/e2e/v1-37-runtime-source-identity-proof.spec.ts` | Browser -> Go -> PostgreSQL source-byte identity proof | Reuse strict external dependency behavior and privacy-preserving request checks. |
| `apps/go-backend/*_test.go` | DB-backed creation, claim, completion, status, retry, rollback, source identity, authority races | Select exact integration cases into the service manifest; strict Phase-261 runs must set the DSN so they cannot skip. |
| `packages/persistence/src/{matchset-service,matchset-status,scoring,complete-match,chronicle-store,semantic-authority-selection-head}.test.ts` | Four-condition creation/counting, completion rollback, Chronicle admission, recompute, selection head | Reuse as focused/DB evidence and drive corresponding behavior through live Go APIs. |
| `packages/replay/src/{record,validate,reconstruct,historical-v1-4}.test.ts` | Version-strict recording/validation/reconstruction and immutable history | Supply deterministic and mutation evidence for Chronicle/replay portions of the matrix. |
| `scripts/capture-v1-37-protected-baseline.ts` | Exact bytes/modes/staged and unstaged diff protection | Run before and after proof, audit, archive, and tag preparation; never clean or modify the two protected user-owned paths. |
| `.planning/phases/256.../256-VERIFICATION.md` through `260-VERIFICATION.md` | Passed evidence for all 48 pre-Phase-261 requirements | Inputs to the exact 56-row final traceability evaluator. |
| `.planning/milestones/v1.36-MILESTONE-AUDIT.md`, tag `v1.36`, and archive commit `38f4a83` | Prior audit/archive/annotated-tag precedent | Reuse archive shape and Git checks, with stronger tuple/proof/handoff tag metadata. |

All rows are present at research HEAD. The focused v1.37 evaluator suite passed 82/82, `pnpm v1.37:phase260-proof:check` passed, and the permanent audit reproduction returned the repaired exact lifecycle/depth/arena observations on 2026-07-19. [VERIFIED: repository inspection and commands executed during research]

### New Phase-261 seams to add

| Recommended seam | Responsibility | Must not own |
|---|---|---|
| `scripts/run-v1-37-integrated-service-proof.ts` | Start/preflight/stop the complete local topology, execute the closed scenario manifest, write signed restricted receipts and safe live-proof JSON/Markdown. | Gameplay logic, public classification, tuple selection, certificate promotion, or archive mutation. |
| `scripts/lib/v1-37-restricted-evidence-store.ts` | Create-exclusive content-addressed writes outside Git, digest verification, safe opaque refs, retention metadata, and append-only access records. | Public projection, secret generation, certificate validity, or silent deletion. |
| `apps/web/e2e/v1-37-integrated-service-proof.spec.ts` | Desktop/mobile live public UI and network assertions against proof-created current data. | In-process fixture substitution or operator-policy derivation. |
| `scripts/check-v1-37-release-boundaries.ts` | Release-specific mutation-tested checks for every PROOF-06 regression class plus handoff/public-proof leaks. | A second copy of the broad boundary hub. |
| `scripts/evaluate-v1-37-prearchive-proof.ts` | Deterministically join signed live manifests, lower proofs, 48 prior passes, seven current executable passes, limitations, and the outer PROOF-08 operation into canonical 55-passed/one-ready-pending JSON/Markdown. | Starting services, rewriting failed inputs, waivers, 56-passed prearchive claims, or tag creation. |
| `scripts/generate-v1-37-strategy-foundation-handoff.ts` | Project exact certified tuple/ABI/budgets/arena/Set/corpus/certificate/lane/limitation facts into versioned safe JSON/Markdown. | New Strategy rules, heuristics, benchmarks, or milestone approval. |
| `scripts/check-v1-37-release-tag.ts` | After archive/tag, verify annotated tag type, peeled commit, exact message fields, proof/handoff hashes, audit path, and archive contents. | Tag creation or proof regeneration. |

[VERIFIED basis: repository proof generator/test patterns and locked Phase-261 decisions; filenames are discretionary recommendations]

## Standard Stack

No dependency addition is warranted. Use the current stack and lockfile; do not add a storage SDK, test runner, JSON canonicalizer, crypto package, archive tool, or Git wrapper. [VERIFIED: repository manifests and existing proof implementations]

| Layer | Current version/source | Phase-261 role |
|---|---|---|
| Node.js | local `v26.0.0` | Root orchestration, canonical safe artifact generation, hashing, process control, restricted store. |
| pnpm | manifest/local `11.1.2` | Stable command surface and workspace gates. |
| TypeScript | root manifest `^6.0.3` | Typed closed manifests, evaluators, boundary checks. |
| Vitest | root manifest/local `4.1.6` | Unit, mutation, evaluator, integration, and DB tests. |
| Playwright | root manifest/local `1.60.0` | Desktop 1440x900 and mobile 390x844 live proof plus network privacy. |
| Zod | spec manifest `^4.4.3` | Existing trusted shape validation after bounded/raw admission. |
| Go | module minimum 1.25; local `1.26.3` | Normal API/orchestration/persistence owner and DB-backed integration tests. |
| PostgreSQL | Compose image `postgres:18`; local client `16.14` | Real persistence, transactions, recomputation, rollback, append-only evidence. |
| Redis | Compose image `redis:8` | Production-shaped service dependency where current topology requires it. |
| Docker | client/server `29.4.0` | Reproduce pinned containment/runtime artifacts and Compose services. |
| Python | local `3.9.6` | Exact current Python lane toolchain input. |
| Rust | local `rustc 1.95.0` | Exact current Rust lane build/toolchain input. |
| Zig | local `0.16.0` | Exact current Zig lane build/toolchain input. |
| Wasmtime | local `45.0.0` | Current Rust/Zig WASI execution host. |
| Git | local `2.50.1` | Archive commit, annotated tag, blob/tree/tag inspection. |

The versions above are environment observations, not permission to replace the content-addressed identities already bound into current certificates. The runner must compare the actual runtime/toolchain/artifact/containment digests to installed authority before treating any lane as counted. [VERIFIED: local probes, manifests, D-02, and existing conformance artifacts]

### Package Legitimacy Audit

Not applicable. No package installation is recommended, so no registry or postinstall legitimacy gate is required. [VERIFIED: recommended architecture uses only existing dependencies and platform tools]

## Architecture Patterns

### System flow

```text
service collector
  -> exact environment + clean input/protected-path preflight
  -> PostgreSQL/Redis + selected Go + selected runtime-service
  -> exact current TypeScript/Python/Rust/Zig providers/toolchains
  -> live scenario manifest
       -> Go scheduling/job/completion/recompute/rollback
       -> runtime-service typed success/player/system results
       -> canonical kernel -> Chronicle validation -> reconstruction
       -> PostgreSQL immutable evidence + standings
  -> signed restricted receipts + restricted browser proof-data handoff
rollback/history collector (after service collector releases shared database)
  -> audit reproduction + rollback/recompute/retry/history receipts
browser collector (after rollback/history collector)
  -> start/health/private handoff/Playwright/restricted store/owned teardown
  -> desktop/mobile public APIs/pages + live network/document/board scans
  -> signed restricted browser receipt
  -> closed safe projection + recursive concrete leak scan
  -> deterministic live-proof JSON/Markdown
  -> pure prearchive evaluator: 48 prior + 7 current passed + PROOF-08 ready/pending
  -> release-ready audit + Strategy handoff + readiness
  -> GSD archive commit -> annotated tag
  -> post-tag checker joins commit/tag/tuple/proof/audit/handoff
```

No arrow grants the runner semantic authority. It invokes and verifies production owners, and it fails closed when any owner, identity, service, receipt, or restricted evidence reference is absent. [VERIFIED basis: D-01 through D-12 and current ownership boundaries]

### Pattern 1: Closed scenario manifest, not ad hoc test prose

Define an exact ordered scenario inventory whose IDs, requirement IDs, decision IDs, topology participants, expected public status, restricted evidence classes, and failure/no-mutation checks are all schema-validated. The runner must reject an extra, missing, duplicate, skipped, or unavailable required row. Each row emits a signed restricted receipt and a small safe result containing only scenario ID, pass/fail, safe identity hashes, command ID, limitation code, and opaque restricted digest. [VERIFIED basis: D-03, existing Phase-258/259 exact-manifest patterns]

The mandatory matrix should contain at least these groups:

| Group | Required live behaviors |
|---|---|
| Four-lane positive | TypeScript, Python, Rust, and Zig each execute through the selected service/provider boundary with exact current certificate and tuple; complete Chronicle validates and reconstructs. |
| Typed failures | One attributable player violation and representative timeout/crash/unavailable/transport/malformed/stale system failures; assert system failure causes no gameplay, memory, result, or standings mutation. |
| Identity drift | Stale certificate, changed artifact/toolchain/containment identity, mixed tuple, stale authority during schedule, and stale authority during execution all fail closed at the expected boundary. |
| Chronicle/replay | Valid current Chronicle, semantic mutation rejection, reconstruction equality, exact historical v1.4/v1.17 replay, and unknown/mixed version rejection. |
| Set/persistence | Exactly four side-by-initiative conditions, atomic persistence, order-independent completion, complete/degraded status, and no partial counting. |
| Retry/rollback | Idempotent same-condition retry, transaction failure before Chronicle/Match completion, lane kill switch, cohort invalidation, compensating reversal, standings recomputation, runtime/service rollback, and mixed-state rejection. |
| Public/browser | Truthful lane counted/non-counted labels, historical status, complete/degraded results, standings, replay, desktop/mobile board realism, rendered privacy, and every default document/API network response scanned before reduction. |

[VERIFIED basis: D-03, D-04, D-09 through D-12, PROOF-03 through PROOF-06]

### Pattern 2: Restricted evidence first, public projection second

Capture raw stdout/stderr, full diffs, private runtime receipts, artifact bytes, and sensitive diagnostics only into a workspace-external store selected by `COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT`. Address each immutable object as SHA-256 bytes, create it with exclusive/atomic semantics, verify on read, and append an access event containing an opaque actor class, action, digest, and time to a separate restricted log. Never serialize the root path, environment values, credentials, raw object, or restricted internal ID into committed artifacts. [VERIFIED basis: D-05 through D-08 and existing public privacy policy]

Use a public reference shaped like:

```ts
type PublicRestrictedEvidenceRef = Readonly<{
  schemaVersion: "v1.37-restricted-evidence-ref-v1"
  sha256: `sha256:${string}`
  class: "command-receipt" | "service-trace" | "rollback-trace" | "privacy-scan"
  attestationSha256: `sha256:${string}`
  retentionClass: "certificate-plus-audit-window"
}>
```

The release-time strict check requires each restricted object and attestation to be present and hash-valid. The permanent safe-artifact check continues to validate the signed attestation and public digest after policy deletion, without pretending the deleted preimage is still available. [VERIFIED basis: D-05, D-06, D-08]

Phase 261 selects retention through the latest bound certificate validity plus 90 calendar days, recorded in one versioned policy artifact; deletion must be an explicit logged operation after the deadline. This is the resolved discretionary release policy for this milestone, not an open research assumption and not a gameplay rule. [RESOLVED: Phase-261 planning policy]

### Pattern 3: Deterministic write/check split

`--write` may execute the live topology and produce new signed restricted manifests, then derive canonical safe artifacts. `--check` must be read-only: validate exact schemas, signatures/hashes, requirement/decision set equality, current input digests, canonical JSON formatting, byte-exact Markdown rendering, protected paths, and stale evidence. Volatile wall time, process IDs, temp paths, host paths, and durations may exist only in restricted evidence; they are excluded from canonical public comparison. [VERIFIED basis: D-05/D-06 and existing v1.36/v1.37 evaluator patterns]

Do not let `--check` rewrite, normalize, refresh, or tolerate the artifact it checks. A separate strict mode should additionally require live evidence freshness and restricted-object presence for release, while the long-lived public check remains valid after retention deletion. [VERIFIED basis: D-06/D-08/D-12]

### Pattern 4: Exact 56-row audit join

Parse the canonical 56 requirement IDs from `.planning/REQUIREMENTS.md`, require exact one-to-one coverage, and join each row to its owning phase verification, concrete proof evidence IDs, commands, and artifact hashes. Reject pending boxes, duplicate IDs, missing phase verification, non-passed evidence, an override field, or an evidence row that cites only prose. The Markdown audit is rendered from this machine artifact rather than curated independently. [VERIFIED: requirement count observed as 56; D-13]

### Pattern 5: Non-circular release identity

The prearchive proof closes PROOF-01 through PROOF-07 and records exactly 48 prior passes plus seven current executable passes; PROOF-08 is represented only as `ready_pending`. The release-ready audit, handoff, and readiness artifact are committed before archive and contain no future Git identity. The archive operation then creates one commit containing that truthful state. Only after the commit exists is `v1.37` created as an annotated tag whose message records tuple ID, prearchive-proof hash, audit path, handoff hash, and readiness hash. A post-tag checker reads the actual tag object and peeled commit and supplies the immutable PROOF-08 closure. No archived file predicts its own tag or claims 56 passed before this external join. [VERIFIED basis: D-14/D-16, Git object identity, v1.36 archive/tag precedent, and existing historical tag checker]

### Pattern 6: Immutable Strategy-foundation handoff

Generate the handoff from current machine authorities, not from narrative summaries. Its JSON/Markdown pair should contain exactly:

- selected semantic authority key and complete tuple ID/members;
- Strategy ABI, canonical JSON, budget/capability, runtime-service, and receipt versions;
- active arena catalog version plus active arena IDs and semantic geometry hashes;
- exact four-condition Set policy and entrant coverage invariants;
- corpus/trace versions and roots;
- per-language lane/provider/toolchain/artifact/containment/certificate safe IDs, counted status, and freshness classification;
- public-safe limitations and deferred experiments;
- canonical proof/check commands and prearchive proof/release-ready audit hashes.

It must not include source/artifact bytes, private hashes whose identifiers are themselves restricted, raw performance data, tactical recommendations, or any authorization to start the next milestone. [VERIFIED basis: D-15/D-16 and current Phase-260 proof structure]

## Requirement and Decision Coverage

| Decision | Required proof owner | Release assertion |
|---|---|---|
| D-01 | Integrated topology runner | All required real components health-check and every service boundary is non-mocked. |
| D-02 | Topology manifest + lane receipts | Actual artifact/toolchain/containment digests equal installed current authority. |
| D-03 | Scenario manifest | Exact positive/negative inventory is complete with no skip/extra/duplicate row. |
| D-04 | Live Playwright proof | Desktop/mobile labels, statuses, standings, replay, privacy, and realism pass. |
| D-05 | Restricted store + safe projector | Committed artifacts contain only closed safe fields and opaque content digests. |
| D-06 | Evaluator write/check tests | Check is read-only, detects edits/staleness, and canonical render is byte-exact. |
| D-07 | Privacy scanner | Concrete secret/source/artifact/memory/objective/path/env/diagnostic mutations fail recursively while policy prose passes. |
| D-08 | Retention policy + access log tests | Release requires retained evidence; post-expiry safe attestations remain checkable. |
| D-09 | Four-lane matrix | Functional conformance required for all; counted status is independently truthful about containment. |
| D-10 | Audit reproduction gate | Exact reproduction or exact pre-approved ruling only; generic waiver shape impossible. |
| D-11 | Rollback matrix | Every listed failure/compensation/recompute/version rollback path executes against real PostgreSQL/services. |
| D-12 | Final evaluator | No override field or manual pass state exists; infrastructure failure is incomplete/failed. |
| D-13 | 56-row audit generator | Exact coverage, one authority, tuple closure, compatibility, privacy, drift, limitations. |
| D-14 | Git tag checker | Annotated `v1.37` peels to archive commit and message has exact identity fields; sign only if managed identity exists. |
| D-15 | Handoff generator | Exact required safe fields are generated from machine authorities and byte-checked. |
| D-16 | Release gate checker | Requirements/proof/handoff/audit/archive/tag all pass before any next-milestone activation. |

Every locked decision has a concrete owning proof and fail-closed assertion. [VERIFIED basis: D-01 through D-16]

## Validation Architecture

Nyquist validation is enabled. Phase planning must create the missing Phase-261 test/proof assets before their consumers and preserve a fast unit/evaluator loop separate from the long live topology gate. [VERIFIED: read-only `.planning/config.json` has `workflow.nyquist_validation: true`]

### Test Framework

| Property | Value |
|---|---|
| Frameworks | Vitest 4.1.6, Playwright 1.60.0, Go `testing`, real PostgreSQL integration, real TypeScript/Python/Rust/Zig lane runners |
| Config | root `vitest.config.ts`, root `playwright.config.ts`, package scripts, `apps/go-backend/go.mod`, `compose.yaml` |
| Quick run | `pnpm exec vitest run --maxWorkers=1 --no-file-parallelism scripts/evaluate-v1-37-prearchive-proof.test.ts scripts/check-v1-37-release-boundaries.test.ts scripts/generate-v1-37-strategy-foundation-handoff.test.ts scripts/check-v1-37-release-tag.test.ts` |
| Current lower-proof smoke | `pnpm exec vitest run --maxWorkers=1 --no-file-parallelism scripts/evaluate-v1-37-truthful-inputs-set-fairness.test.ts scripts/evaluate-v1-37-kernel-integrity.test.ts scripts/evaluate-v1-37-executable-conformance.test.ts scripts/check-v1-37-integrity-boundaries.test.ts` |
| Full deterministic suite | `pnpm test:fast && pnpm e2e:smoke && pnpm e2e:visual && pnpm boundary:monitors` |
| Full release gate | `COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF=1 pnpm v1.37:prearchive-proof:check && pnpm exec tsx scripts/check-v1-37-release-tag.ts` with the first command before archive and the second only after the annotated tag exists |

[VERIFIED: existing framework configuration and command patterns; new package script names are prescriptive Phase-261 seams]

### Phase Requirements -> Test Map

| Req | Behavior | Test type | Automated target | Exists? |
|---|---|---|---|---|
| PROOF-01 | Exact audit reproduction/ruling | executable compatibility | `pnpm exec tsx .planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts` plus final evaluator mutation tests | Partial: reproduction exists; final join is Wave 0 |
| PROOF-02 | Repeated deterministic packages and four real lanes | conformance/integration | existing `v1.37:*proof:check` commands plus strict integrated runner | Partial: lower proofs exist; live repetition is Wave 0 |
| PROOF-03 | Live success/failure/no-mutation/Chronicle/replay | service E2E/DB | `pnpm v1.37:integrated-service-proof:write` | Wave 0 |
| PROOF-04 | Live Set/persistence/recompute/retry/rollback/history | service E2E/DB | same runner plus focused Go/PostgreSQL rollback suite | Wave 0, with many existing fixtures/tests |
| PROOF-05 | API/view/log/fixture/contract/proof privacy | security/unit/E2E | `pnpm v1.37:release-boundaries:check` plus browser network scan | Wave 0, reusing existing privacy seam |
| PROOF-06 | Named drift monitor mutations | structural/mutation | `pnpm exec vitest run scripts/check-v1-37-release-boundaries.test.ts scripts/check-boundary-monitors.test.ts` | Wave 0 |
| PROOF-07 | Exact 56-row traceability and release-ready audit | evaluator/integration | `COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF=1 pnpm v1.37:prearchive-proof:check && pnpm v1.37:milestone-audit:check` | Wave 0 |
| PROOF-08 | Archive/tag/handoff gate | Git integration | `pnpm v1.37:strategy-foundation:check && pnpm exec tsx scripts/check-v1-37-release-tag.ts` | Wave 0 |

### Wave 0 Gaps

- [ ] Closed service scenario manifest and parser with requirement/decision set-equality tests.
- [ ] Restricted evidence store tests for create-exclusive writes, digest mismatch, path/symlink rejection, safe refs, access logging, retention, and post-delete attestation checks.
- [ ] Live current-v1.19 Go/runtime-service/four-lane collector plus a dedicated browser topology/Playwright/store/teardown collector with strict missing-environment failure.
- [ ] Real PostgreSQL rollback fault fixtures for every D-11 row, including service/runtime downgrade and mixed-tuple rejection.
- [ ] Release privacy schema and concrete preimage mutation corpus across API, HTML, logs, fixtures, generated contracts, proof, and handoff.
- [ ] Release boundary checker with one mutation fixture per PROOF-06 regression class.
- [ ] Exact 56-row prearchive evaluator with 55 passed plus PROOF-08 ready/pending, release-ready audit, and canonical JSON/Markdown golden tests.
- [ ] Strategy-foundation handoff generator/checker and field/limitation/privacy mutation tests.
- [ ] Git fixture tests for annotated tag, peeled commit, exact message metadata, wrong/lightweight/moved/signed-or-unsigned cases, and archive membership.
- [ ] Phase-261 `VALIDATION.md` mapping every plan task to one fast command and the final long gate.

### Sampling Rate

- **Per task commit:** Run the task-local evaluator/mutation test and any generated-artifact `--check`; target under 120 seconds.
- **Per service/DB wave:** Run affected package tests with explicit DSNs plus exact Go tests with `-count=1`; no configured database test may skip.
- **Per live-proof wave:** Run the closed service scenario subset through the real topology and validate restricted receipts/public projections.
- **Before phase verification:** Run all lower proofs, all three collector checks, browser desktop/mobile live network proof plus fixture complement, strict boundary monitors, full quality gates, protected baseline, prearchive evaluator, release-ready audit, handoff, and readiness checks. Run the post-tag checker only after archive/tag, never as a prearchive prerequisite.

[VERIFIED basis: Phase-260 validation precedent and Phase-261 release scope]

## Exact Command Model

### Current deterministic baseline (exists now)

```bash
pnpm exec vitest run --maxWorkers=1 --no-file-parallelism \
  scripts/evaluate-v1-37-truthful-inputs-set-fairness.test.ts \
  scripts/evaluate-v1-37-kernel-integrity.test.ts \
  scripts/evaluate-v1-37-executable-conformance.test.ts \
  scripts/check-v1-37-integrity-boundaries.test.ts
pnpm v1.37:kernel-integrity:check
pnpm v1.37:executable-conformance:check
pnpm v1.37:phase260-proof:check
pnpm exec tsx .planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts
pnpm exec tsx scripts/capture-v1-37-protected-baseline.ts --check
```

These commands exist and the focused 82-test subset, Phase-260 proof check, and audit reproduction passed during research. [VERIFIED: current package scripts and 2026-07-19 execution]

### Production-shaped live proof target

Expose one stable command that performs start/preflight/migrate/run/check/teardown without printing secrets or requiring users to paste them into the command line:

```bash
COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT="$COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT" \
  pnpm v1.37:integrated-service-proof:write
COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT="$COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT" \
  COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF=1 \
  pnpm v1.37:integrated-service-proof:check
```

The service collector should call `pnpm services:up`, migrate the proof database, launch selected Go/runtime-service, execute the exact four providers, store signed receipts and a restricted browser proof-data descriptor, then tear down only its owned processes/resources. After the serialized rollback/history collector releases the shared database, a dedicated browser collector resolves that private descriptor through its safe handoff ref, owns start/health/web/Playwright/store/teardown, emits a signed network/document/board receipt, and exposes only its safe restricted ref. Secrets and proof identifiers remain inherited or restricted values and never enter command receipts or public artifacts. [VERIFIED basis: D-01/D-02/D-04/D-05 and existing service startup/runtime config]

### Focused DB/service commands

```bash
DATABASE_URL="$DATABASE_URL" \
  pnpm --filter @cowards/persistence test

cd apps/go-backend
COWARDS_GO_BACKEND_TEST_DATABASE_URL="$COWARDS_GO_BACKEND_TEST_DATABASE_URL" \
  PATH=/usr/local/go/bin:$PATH \
  go test ./... -count=1
```

The Phase-261 runner must fail before executing tests if either DSN is absent; ordinary historical test skips are not acceptable release proof. [VERIFIED: existing Go/persistence test behavior and D-12]

### Browser proof target

```bash
RUN_V1_37_INTEGRATED_SERVICE_PROOF=1 \
PLAYWRIGHT_TEST=1 \
COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF=1 \
pnpm exec playwright test \
  --project=desktop \
  --project=mobile \
  --workers=1 \
  v1-37-integrated-service-proof.spec.ts
```

Use the existing 1440x900 desktop and 390x844 mobile projects. Cover live public MatchSet result, Season standings, replay, and lane status routes; retain the existing fixture-based v1.37 realism test as complementary deterministic coverage, never as a substitute. [VERIFIED: `playwright.config.ts`, v1.36 live proof, and v1.37 fixture proof]

### Release checks before archive

```bash
pnpm v1.37:release-boundaries:source-check
pnpm contract:check
pnpm contract:lint
pnpm go:parity
pnpm v1.37:integrated-service-proof:write
pnpm v1.37:integrated-service-proof:check
pnpm v1.37:rollback-proof:write
pnpm v1.37:rollback-proof:check
pnpm v1.37:browser-proof:write
pnpm v1.37:browser-proof:check
pnpm v1.37:integrated-proof:write
pnpm v1.37:integrated-proof:check
pnpm v1.37:prearchive-proof:write
pnpm v1.37:prearchive-proof:check
pnpm v1.37:milestone-audit:write
pnpm v1.37:milestone-audit:check
pnpm test:fast
pnpm e2e:smoke
pnpm e2e:visual
pnpm v1.37:strategy-foundation:write
pnpm v1.37:strategy-foundation:check
pnpm v1.37:release-readiness:write
pnpm v1.37:release-readiness:check
COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF=1 pnpm v1.37:release-boundaries:check
COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF=1 pnpm boundary:monitors
pnpm exec tsx scripts/capture-v1-37-protected-baseline.ts --check
```

Source/fixture tests precede every collector. The three live `:write` collectors run in the shown serialized order; every `:check` is read-only and fails missing/stale evidence. Aggregate/proof/audit/handoff/readiness writes only consume previously checked inputs. Strict release mode becomes the final default boundary gate only after all required artifacts exist. [VERIFIED basis: D-06/D-12 and existing evaluator patterns]

### Audit, archive, annotated tag, and post-tag join

The GSD milestone completion workflow should archive the truthful `release-ready` audit containing 56/56 traceability, 55 passed rows, and PROOF-08 ready/pending. After the archive commit exists and protected-path checks still pass, create one annotated tag and run the independent checker; that actual tag/post-check supplies PROOF-08 closure. Local inspection found no configured managed signing key and no `tag.gpgSign`; therefore the current workstation should use an unsigned annotated tag unless a managed identity is deliberately configured before release. [VERIFIED: local Git configuration probe, Git object ordering, and D-14]

```bash
git tag -a v1.37 -m "v1.37 Rules Integrity and Strategy Evaluation Foundations

semantic-tuple: <exact tuple ID from v1.37 prearchive proof>
prearchive-proof: <sha256 of canonical v1.37 prearchive proof JSON>
audit: .planning/milestones/v1.37-MILESTONE-AUDIT.md
strategy-handoff: <sha256 of canonical v1.37 Strategy-foundation handoff JSON>
release-readiness: <sha256 of canonical v1.37 release-readiness JSON>"

pnpm exec tsx scripts/check-v1-37-release-tag.ts
git cat-file -t v1.37
git rev-parse 'v1.37^{}'
git status --short
```

The checker, not a human copy/paste comparison, must validate that the placeholders were replaced by exact machine values and that `v1.37^{}` equals the archive commit. Do not push a tag as part of this phase unless separately authorized; local annotated tag creation is the locked milestone operation. [VERIFIED basis: D-14/D-16 and v1.36 tag-check precedent]

## Security Domain

Security enforcement applies because hostile Strategy programs, signed runtime evidence, internal service tokens, public APIs, browser output, restricted proof data, and release identities all cross trust boundaries. [VERIFIED: `AGENTS.md`, runtime-service config, Go internal route authentication, and D-05 through D-12]

### Applicable ASVS Categories

| ASVS category | Applies | Required control |
|---|---|---|
| V2 Authentication | Yes | Existing account/session and internal-token mechanisms; proof never invents bypass credentials. |
| V3 Session Management | Yes | Live signed-in browser proof uses normal session cookies; public/default scans exclude sessions/tokens. |
| V4 Access Control | Yes | Public, owner, internal, operator, and restricted evidence remain structurally separate; operator behavior may use authenticated API proof. |
| V5 Validation/Sanitization/Encoding | Yes | Closed Zod/Go schemas, canonical JSON admission, exact manifest keys, bounded payloads, recursive privacy scans. |
| V6 Cryptography | Yes | Reuse existing SHA-256, HMAC/Ed25519, signed evidence authorities, and Git object identities; no custom crypto. |
| V7 Error/Logging | Yes | Public failures are coarse; raw diagnostics/logs go only to restricted storage with access records. |
| V9 Communications | Yes | Loopback local services, explicit health checks/tokens, exact runtime response authentication, no secret in artifacts. |
| V10 Malicious Code | Yes | Strategy execution remains only behind selected runtime/provider containment with no web/API/Go execution or fallback. |
| V12 Files/Resources | Yes | Restricted root/path containment, no symlink following, atomic create-exclusive objects, size limits, digest verification. |
| V13 API/Web Services | Yes | Go/runtime/public endpoints use exact request/response contracts, default network privacy scans, and typed failure semantics. |

### Threat and mitigation map

| Threat | STRIDE | Required mitigation |
|---|---|---|
| Mocked or fixture service is mislabeled final proof | Spoofing | Manifest records real process/image/toolchain identities and health/receipt joins; fixture test is explicitly separate. |
| Proof input/artifact edited after collection | Tampering | Canonical hashes, signatures, input inventory, byte-exact render check, current HEAD/tree binding. |
| Raw evidence leaks via proof/audit/handoff | Information disclosure | Restricted-first storage, closed safe projection, concrete preimage scans, recursive forbidden keys/markers. |
| Symlink/path traversal escapes restricted root | Tampering/disclosure | Canonical root, relative digest-derived paths only, `lstat`, no symlink following, create-exclusive mode. |
| Infrastructure outage is recorded as pass | Spoofing | Strict required mode; missing component/evidence yields incomplete/failed and blocks audit/tag. |
| Lane status overclaims containment | Spoofing | Separate functional conformance from counted containment; UI/API/handoff use installed current evaluator result only. |
| Runtime failure becomes player penalty | Tampering | Exact three-way outcome, no-mutation before/after hashes, retryability, persistence rollback checks. |
| Audit waiver bypasses failed reproduction | Repudiation/tampering | No generic override field; exact prior compatibility ruling schema only; D-12 blocks manual pass. |
| Tag moves or points to unaudited commit | Tampering/repudiation | Annotated tag object, peeled commit, exact message metadata, archive membership, and post-tag checker. |
| Deleted restricted evidence makes permanent safe rollup unverifiable | Repudiation | Retain signed attestation/digests and deletion/access records; distinguish preimage availability from attestation validity. |

[VERIFIED basis: repository security architecture and locked Phase-261 decisions]

## Don't Hand-Roll

- Do not write another rules loop, Chronicle interpreter, Set fairness derivation, standings classifier, runtime evidence evaluator, or lane promotion rule in the runner.
- Do not make Playwright create proof-only shortcuts that bypass Go, runtime-service, PostgreSQL, provider adapters, or normal public projections.
- Do not create a second broad privacy scanner; build a release-safe schema and reuse `assertPublicOutputLeakSafe`, adding concrete preimage scans for values the generic marker list cannot know.
- Do not invent new canonical JSON, signature, certificate, hash framing, receipt, or semantic tuple formats.
- Do not store restricted evidence in Git, test snapshots, Playwright attachments intended for commit, temp paths serialized into rollups, or Markdown comments.
- Do not use environment availability, a compiler version string, adapter metadata, a named gate, or an old certificate as proof of current counted deployability.
- Do not use a lightweight tag, pre-archive tag, signed tag without a managed key, or a tag message that omits tuple/proof/audit/handoff identity.
- Do not include the prearchive proof's own hash, archive commit, tag identity, or PROOF-08 pass inside the prearchive proof; verify those outer identities after commit/tag.
- Do not let archive automation touch `.planning/config.json` or `CowardsGameSpec_Full_Consolidated_v1.md`; both are protected user-owned dirty paths at research HEAD.

[VERIFIED: repository non-negotiables, protected baseline, proof patterns, and D-01 through D-16]

## Common Pitfalls

1. **Calling the existing v1.37 browser proof “service-backed.”** Its source explicitly labels it “service-contract-backed fixture proof (not live-service proof).” Keep it for deterministic realism/privacy and add a new live proof. [VERIFIED: `apps/web/e2e/v1-37-rules-integrity-proof.spec.ts`]
2. **Reusing the v1.36 live artifact as current proof.** It proves the earlier competition topology and TypeScript flow, not selected runtime-v1.19, four current lanes, new observations, arena catalog, or four-condition policy. Reuse the harness pattern, not its evidence. [VERIFIED: v1.36 proof source and Phase-260 authority]
3. **A green Go suite silently skipped PostgreSQL tests.** Many existing Go tests call `t.Skip` when `COWARDS_GO_BACKEND_TEST_DATABASE_URL` is absent. Strict Phase-261 preflight must require it and the final manifest must record DB-backed case execution. [VERIFIED: Go test source scan]
4. **Functional four-language parity is confused with counted containment.** D-09 permits a functionally supported lane to remain explicitly non-counted when deployable containment fails. Surfaces and handoff must preserve both facts separately. [VERIFIED: D-02/D-09]
5. **Canonical output contains a volatile timestamp or local path.** Existing older proofs include `generatedAt`; Phase 261 must exclude volatile time/path from canonical comparison and keep it restricted or noncanonical. [VERIFIED: D-06 and prior proof schema inspection]
6. **Keyword privacy scans reject honest policy prose or miss concrete secrets.** Apply structural safe schemas first, then distinguish allowed category names from actual private values and recursively scan captured payloads before reduction. [VERIFIED: D-07 and current public privacy utility]
7. **Rollback tests stop at database rollback.** D-11 also requires kill-switch/staleness at schedule and execution, idempotent retry, cohort compensation, standings recompute, service/runtime rollback, and mixed-tuple rejection throughout. [VERIFIED: D-11]
8. **Final audit is a prose checklist.** Generate exact machine traceability first and render the audit from it; phase summaries alone are not proof. [VERIFIED: D-13 and prior verifier practice]
9. **Archive/tag identity becomes circular.** Prearchive proof and audit cannot know the future tag object/archive commit or claim PROOF-08 without self-reference. Commit a 55-passed/one-ready-pending proof, release-ready audit, handoff, and readiness; archive; create the tag; then let the external post-tag checker close PROOF-08. [VERIFIED basis: Git object model and existing v1.36 historical checker]
10. **Restricted retention is confused with permanent public retention.** Raw evidence may be deleted only after certificate plus audit window; safe hashes/attestations remain permanent and must indicate that the preimage was policy-deleted. [VERIFIED: D-08]
11. **The runner cleans a dirty worktree to obtain provenance.** The repository already has a protected baseline precisely so legitimate user changes can remain. Compare exact bytes and staged/unstaged diffs; never reset, restore, stash, or include those paths. [VERIFIED: `capture-v1-37-protected-baseline.ts` and current git status]
12. **Tag creation is treated as publish authorization.** The phase requires a local annotated tag; pushing it changes external state and needs separate authorization. [VERIFIED: scoped release requirement and repository-local precedent]

## Environment Availability

| Dependency | Required by | Available | Observed version/state | Fallback |
|---|---|---:|---|---|
| Node/pnpm | all TypeScript tooling | Yes | Node 26.0.0, pnpm 11.1.2 | None needed |
| Docker daemon | containment and Compose | Yes | server 29.4.0 | None for strict D-02 proof |
| PostgreSQL/Redis containers | live topology | Images declared | `postgres:18`, `redis:8`; not running during probe | `pnpm services:up`; absence remains blocking until started |
| Go | selected backend | Yes | 1.26.3 | None |
| Python | Python lane | Yes | 3.9.6 | No substitution; mismatch fails identity |
| Rust/Cargo | Rust lane | Yes | 1.95.0 | No substitution; mismatch fails identity |
| Zig | Zig lane | Yes | 0.16.0 | No substitution; mismatch fails identity |
| Wasmtime | Rust/Zig host | Yes | 45.0.0 | No substitution; use exact bound binary/settings |
| Playwright Chromium | browser proof | CLI available | Playwright 1.60.0 | Missing browser binary blocks live browser proof |
| Git signing identity | optional signed tag | No managed identity configured | no `user.signingkey`, `tag.gpgSign`, or GPG binary observed | Annotated unsigned tag, as D-14 permits |
| Restricted evidence root | raw proof retention | Not yet configured | must be supplied outside repository | Missing root blocks strict live proof |

Environment availability is sufficient to plan and implement the phase. Strict proof remains blocked until Compose services and a restricted evidence root are active; D-12 forbids recording those absences as a pass. [VERIFIED: local commands and D-12]

## Policy Resolution Log

| # | Selected Phase-261 policy | Status | Change control |
|---|---|---|---|
| P1 | Retain restricted evidence through the latest bound certificate validity plus 90 calendar days. | RESOLVED | A later milestone may version a different window prospectively; v1.37 evidence keeps this recorded policy. |

All other implementation recommendations derive from locked decisions, current repository contracts, or commands executed during research. [VERIFIED: source inventory]

## Resolved Policies and Stop Conditions

No planning-blocking architecture or policy question remains. Phase 261 selects the post-expiry retention duration as 90 calendar days and records it in the versioned policy artifact before live evidence collection. [RESOLVED]

Stop and require explicit approval if any proof-driven repair would change valid v1.4 Match state, Action legality, event order, outcome, terminal timing/reason, Strategy observation beyond the approved v1.19 contract, official geometry, Set semantics, or historical interpretation. Do not update expected evidence to make a new behavior pass. [VERIFIED: milestone boundary, D-10/D-12, and durable compatibility decisions]

Stop release without creating `v1.37` if any required service is unavailable, any real lane cannot complete functional conformance, any counted lane cannot reproduce its exact containment identity, any audit observation lacks an exact prior ruling, any privacy scan fails, any requirement row is missing/duplicate or pending outside the single expected prearchive PROOF-08 operation, any protected path changes, or any prearchive proof/handoff/readiness/tag check fails. [VERIFIED: D-01 through D-16]

## Sources

### Primary planning authority

- `.planning/phases/261-integrated-service-proof-drift-guards-and-release/261-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/PROJECT.md`
- `.planning/research/SUMMARY.md`
- `.planning/phases/256-counted-safety-and-canonical-authority/256-VERIFICATION.md`
- `.planning/phases/257-canonical-transition-kernel-and-v1-4-semantic-integrity/257-VERIFICATION.md`
- `.planning/phases/258-canonical-json-failure-semantics-and-artifact-identity/258-VERIFICATION.md`
- `.planning/phases/259-executable-four-language-and-chronicle-conformance/259-VERIFICATION.md`
- `.planning/phases/260-truthful-strategy-inputs-arena-authority-and-set-fairness/260-{RESEARCH,VALIDATION,VERIFICATION}.md`
- `AGENTS.md`

### Primary implementation/proof sources

- `scripts/evaluate-v1-37-{kernel-integrity,executable-conformance,truthful-inputs-set-fairness}.ts`
- `scripts/check-v1-37-integrity-boundaries.ts`
- `scripts/check-boundary-monitors.ts`
- `scripts/capture-v1-37-protected-baseline.ts`
- `scripts/check-v1-36-historical-proof.ts`
- `.planning/artifacts/v2.0-core-rules-audit/{README.md,reproduce-core-rule-gaps.ts}`
- `.planning/artifacts/v1.37-{kernel-integrity-proof,executable-conformance-proof,truthful-inputs-set-fairness-proof}.{json,md}`
- `packages/spec/src/{public-output-privacy,current-semantic-authority-source,current-semantic-authority-generated}.ts`
- `packages/replay/src/{record,validate,reconstruct,historical-v1-4}.test.ts`
- `packages/persistence/src/{matchset-service,matchset-status,scoring,complete-match,chronicle-store,semantic-authority-selection-head}.test.ts`
- `apps/go-backend` lifecycle, completion, scoring, source-identity, authority, and PostgreSQL tests
- `apps/runtime-service/src/{runtime-config,index,server,execute-match-v1-19}.ts`
- `apps/web/e2e/v1-36-competition-service-proof.spec.ts`
- `apps/web/e2e/v1-37-rules-integrity-proof.spec.ts`
- `apps/web/e2e/v1-37-runtime-source-identity-proof.spec.ts`
- `playwright.config.ts`, `compose.yaml`, `package.json`, workspace package manifests, `apps/go-backend/go.mod`
- `.planning/milestones/v1.36-MILESTONE-AUDIT.md` and annotated tag `v1.36`

## Research Metadata

- **Research mode:** repository-primary architecture and validation research
- **External lookup:** none; current code, proof artifacts, Git objects, and executable checks were sufficient
- **Knowledge graph:** absent; direct source inventory used
- **Discussion log:** read only as audit trail and not used to override `261-CONTEXT.md`
- **New dependencies recommended:** none
- **Fresh checks:** 82/82 focused evaluator tests passed; Phase-260 proof check passed; permanent audit reproduction passed
- **Protected paths:** `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` remained untouched
- **Planning readiness:** ready; the discretionary retention duration is resolved as certificate validity plus 90 calendar days and is assigned to the versioned policy task

---
*Phase: 261-integrated-service-proof-drift-guards-and-release*  
*Research completed: 2026-07-19*
