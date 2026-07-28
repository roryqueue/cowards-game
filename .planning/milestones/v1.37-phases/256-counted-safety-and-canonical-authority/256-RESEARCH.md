# Phase 256: Counted Safety and Canonical Authority - Research

**Researched:** 2026-07-12
**Domain:** Fail-closed runtime evidence, atomic compatibility identity, immutable historical classification, and privacy-safe evidence projection
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Counted-lane quarantine
- **D-01:** Every current runtime lane begins quarantined and must be freshly recertified for its exact active identity; no TypeScript or other transitional exception exists.
- **D-02:** Eligibility has two independent floors: missing current containment evidence disables execution entirely, while current containment without current conformance permits exhibition-only execution.
- **D-03:** Counted eligibility is derived automatically from a complete passing evidence bundle for the exact active identity. Operators may disable a lane but cannot override missing evidence or force promotion.
- **D-04:** Evidence is rechecked at scheduling and execution boundaries. Work rejected before claim does not run; an in-flight identity/evidence mismatch aborts as a system failure with no gameplay mutation or player penalty and requires a fresh run after recertification.

### Compatibility-tuple rollout
- **D-05:** New Match and evidence records persist both a canonical tuple ID/hash and the expanded rules, engine, runtime ABI, Chronicle, arena-catalog, and Set-policy component versions; the expansion must hash to the identifier.
- **D-06:** Legacy tuple resolution is read-only and may use only authoritative persisted fields plus immutable release manifests. Never backfill or rewrite the original record; ambiguous records remain explicitly unresolved and cannot support counted recomputation.
- **D-07:** New counted work accepts exact immutable certified tuples only. Wildcards, compatible ranges, component-by-component acceptance, and `latest` aliases are forbidden.
- **D-08:** Mint a new semantic tuple when any of the six behavior contracts changes. Implementation, runtime, toolchain, adapter, artifact, policy, or corpus identity changes invalidate executable evidence for the existing tuple but do not mint a new semantic tuple unless behavior changes.

### Historical-result treatment
- **D-09:** Preserve each historical outcome and its original counted meaning. Classify containment/conformance evidence independently as historical, legacy, incomplete, or unresolved.
- **D-10:** Invalidation or standings exclusion requires reproducible evidence that execution, failure classification, eligibility, identity, or persisted evidence was wrong or materially unreliable for an exact Match or deterministic cohort. Failure to meet a newer documentation or evidence standard is not sufficient.
- **D-11:** Cohort corrections are append-only governance actions containing the exact deterministic predicate and supporting evidence. Operators preview the affected Matches before applying an immutable classification/invalidation event and deterministic standings recomputation.
- **D-12:** Rollback uses a compensating governance event with reason and evidence, followed by recomputation. Never delete the original action, rewrite original Match evidence, or directly repair standings values.

### Evidence visibility
- **D-13:** Public/default lane projections show counted, exhibition-only, or disabled status; a stable plain-language reason category; semantic tuple ID; non-sensitive evidence version/hash; and freshness date.
- **D-14:** Authorized operator interfaces show exact identities, gate results, failure categories, remediation, cohort impact, and IDs/links for restricted proof storage. They still exclude Strategy source, artifact bytes, memories, credentials, host paths, and sensitive exploit details.
- **D-15:** Persist stable canonical reason codes and derive separate calm public explanations and precise operator remediation from them. Never expose internal runtime errors as the public vocabulary.
- **D-16:** Historical Match surfaces show the original rules/Chronicle profile and original counted status. A legacy/unresolved evidence note may be shown when useful; a prominent warning appears only when a concrete governance finding affects the result.

### the agent's Discretion
- Exact naming of typed reason codes, evidence records, registry APIs, and operator presentation is left to research and planning, provided it preserves the locked public/private split and semantics above.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

## Summary

Phase 256 should add a spec-owned authority/evidence contract, persist exact semantic tuples and immutable certificates, and make all consumers call one eligibility evaluator. The current registry cannot support this: it promotes lanes from static booleans such as `countedResultsAllowed`, and current provider proof binds revision/artifact metadata but not containment, conformance, toolchain, corpus, active policy, or a six-component tuple. [VERIFIED: `packages/spec/src/runtime.ts`; `apps/go-backend/provider_readiness.go`; `packages/persistence/src/ladder.ts`]

Every current lane must therefore start non-counted. A lane with no new exact containment certificate is disabled; a lane with containment but no exact conformance certificate is exhibition-only. Phase 259 may later create the complete conformance evidence needed for counted promotion. Phase 256 must not grandfather the current TypeScript worker-thread lane or infer certification from the v1.32/v1.36 gate names. [VERIFIED: `256-CONTEXT.md` D-01 through D-04; audit F-13 and F-15]

No new package is justified. Use the existing TypeScript/Zod/Vitest/PostgreSQL/Go/runtime-service stack and platform SHA-256 implementations. The primary implementation risk is accidentally treating semantic tuple identity and executable evidence identity as the same thing: tuple changes follow behavior-contract changes, while rebuild/runtime/toolchain/corpus drift invalidates certificates without fabricating a rules change. [VERIFIED: `.planning/research/SUMMARY.md`; `256-CONTEXT.md` D-08]

**Primary recommendation:** Build one immutable registry-and-projection spine in `@cowards/spec`, generate/hash exact tuple manifests with fixed-field domain-separated bytes, persist append-only evidence/governance events, and require scheduling plus runtime-service to re-evaluate the exact active identity.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|---|---|---|
| SAFE-01 | Count only exact current containment and conformance evidence across provider/runtime/toolchain/adapter/policy/corpus/artifact/tuple identity. | Exact `ExecutableLaneIdentity`, two certificate types, evidence-derived evaluator. |
| SAFE-02 | Missing, stale, mismatched, downgraded, or unverifiable evidence is non-counted before scheduling or execution. | Scheduling snapshot plus runtime-service pre/post invocation recheck. |
| SAFE-03 | Inventory/classify/invalidate/recompute without rewriting original Match evidence. | Read-only legacy resolver and append-only cohort governance events. |
| SAFE-04 | Public/default output is privacy-safe. | Separate public and restricted operator projections from stable reason codes. |
| AUTH-01 | One canonical owner for each rules/evidence decision. | Spec-owned authority register with package/symbol ownership. |
| AUTH-02 | Every new Match/evidence record carries one six-component tuple. | Persist tuple ID and expanded tuple with a DB equality/check path. |
| AUTH-03 | All consumers reject missing, unknown, mixed, or uncertified tuples atomically. | Exact registry lookup; never validate members independently. |
| AUTH-04 | v1.4 evidence remains immutable and uses original semantics. | Immutable release manifests and read-only resolution with unresolved state. |
| AUTH-05 | Boundary monitors detect duplicate authorities and stale execution routes. | Generated owner manifest plus structural monitor and explicit Phase-257 debt sentinels. |
</phase_requirements>

## Current-HEAD Audit Revalidation

The committed reproduction was run at `8e301b2dca407fcceb2b2b02bfe8eba61b02c063` with `pnpm exec tsx .planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts`. Production source under spec/engine/replay/persistence/runtime-service/Go/web/scripts has no diff from audited tag `38f4a83`; intervening commits are planning/research documents. [VERIFIED: executed command; `git diff 38f4a83..8e301b2 -- packages apps scripts package.json`]

| Probe | Current HEAD result | Phase owner |
|---|---|---|
| Last Soldier stoned by no-Advance cleanup | `status=STONE`, `outcome=null`, `matchEndedEvents=0` | 257 |
| Actor stoned by Cycle-end Backstab | `status=STONE`, `slotEnded=false`, `terminalReason=null` | 257 |
| Valid order followed by malformed excess order | `validOrdersRetained=0`, `violationEvents=1` | 257 |
| 3,000-deep memory below byte cap | `threw:RangeError` | 258 |
| Terrain overlaps canonical start | `overlappingArenaAccepted=true` | 257 |
| Historical Backstab boundary in active schema | `legacyBoundaryAccepted=true` | 259 |
| Successful push pusher history | `RIGHT` | Preserved v1.4 fixture in 257 |

All seven still reproduce exactly. Phase 256 should persist this HEAD/result snapshot as acceptance evidence, not change expected outputs. Later phases must make each defect pass or retain an explicitly approved compatibility ruling. [VERIFIED: executed reproduction output]

## Project Constraints (from AGENTS.md)

- Keep engine logic pure, deterministic, serializable, and side-effect free.
- Do not put rules in React or execute Strategy code in web/API/Go.
- Treat Strategy code as hostile; schema-validate every runtime boundary; never use Node `vm` as a security boundary.
- Keep revisions immutable and public replay/default output free of source, StrategyMemory, SoldierMemory, and objectives.
- Runtime tests must distinguish player failure from system failure; Match/replay changes require deterministic, integrity, and board-realism coverage. [VERIFIED: `AGENTS.md`]

## Architectural Responsibility Map

| Capability | Primary owner | Consumers | Required shape |
|---|---|---|---|
| Authority and semantic tuple registry | `@cowards/spec` | engine, replay, persistence, runtime-service, Go, web | Generated immutable manifest; exact lookup only. |
| Tuple minting/hash verification | release generator + Node/Go platform crypto | persistence/runtime-service/Go | Domain-separated, fixed field order, UTF-8, SHA-256. |
| Lane identity and eligibility policy | `@cowards/spec` | persistence, Go, runtime-service, web | Pure evaluator returning status/reason/evidence refs. |
| Scheduling/claim enforcement | Go normal orchestrator; persistence parity | runtime-service | Store eligibility snapshot, reject before claim. |
| Execution enforcement | runtime-service | Go completion | Revalidate before invocation and before returning success. |
| Historical resolution | persistence/read model | Go/public projections | Read-only joins plus immutable release manifests; unresolved is explicit. |
| Governance classification/recompute | append-only persistence events + Go/persistence recomputation | public/operator views | Preview predicate, immutable event, deterministic projection, compensating rollback. |
| Public rendering | web | players | Contract-derived safe projection only; no eligibility logic. |
| Transition semantics | `@cowards/engine` | replay/runtime-service | Registered now; duplicate-loop removal remains Phase 257. |
| Chronicle semantics | `@cowards/replay` | runtime-service/persistence | Registered now; semantic validator work remains Phase 259. |
| Arena catalog | `@cowards/map-configs` canonical manifest | all products | Registered now; duplicate consumer migration remains Phase 260. |
| Set policy | `@cowards/spec` | persistence/Go | Exact version in tuple; fairness repair remains Phase 260. |

## Current Code Seams

| Seam | Current behavior/gap | Phase-256 action |
|---|---|---|
| `packages/spec/src/runtime.ts` | Static lane/provider/adapter registries can say counted while `isolationPromotionState` remains `evidence-only`. | Add exact evidence schemas, reason codes, evaluator, and derive old product semantics from it. |
| `packages/spec/src/versions.ts` | Six legacy strings do not represent the approved tuple and have no atomic ID. | Keep historical constant; add a separate semantic tuple registry. |
| `packages/spec/src/competition-entry-eligibility.ts` | Coarse entry categories are privacy-safe but provider validation is accepted as readiness. | Extend categories with disabled/exhibition/stale identity reasons; project from the evaluator. |
| `packages/persistence/src/ladder.ts` | Scheduling checks provider/source proof and two-field engine compatibility, not containment/conformance. | Require exact tuple and current evidence bundle at entry and schedule. |
| `apps/go-backend/provider_readiness.go` | Duplicates runtime metadata rules and returns counted after provider proof. | Consume generated registry data; fail closed on missing exact certificates. |
| `apps/go-backend/orchestrator.go` and `runtime_service_client.go` | Request validation checks registered runtime metadata, not evidence identity. | Carry immutable lane identity/evidence refs and tuple; reject before claim and request. |
| `apps/runtime-service/src/server.ts` / `execute-match.ts` | Provider execution is selected from registry labels; no current certificate recheck. | Validate exact bundle at request acceptance and just before success response. |
| SQL `matches`, `chronicles`, `match_sets`, `competition_entrants` | Versions are scattered or absent; old rows cannot support an unambiguous tuple. | Add nullable-for-history tuple ID/expansion to existing tables and NOT NULL enforcement for new writes in code; never backfill guesses. |
| `packages/persistence/src/governance.ts` | Audit rows are append-only, but current state columns are directly updated. | Add immutable classification/cohort events and derive effective classification; rollback is compensating event. |
| `packages/spec/src/public-output-privacy.ts` | Strong generic denylist exists. | Reuse it, add Phase-256 forbidden evidence/security fields, scan fixtures/proofs. |
| `scripts/check-boundary-monitors.ts` | Large established structural gate. | Add generated authority/evidence checks and synthetic duplicate fixtures. |

## Recommended Contract Design

### 1. Separate semantic and executable identity

Define `CanonicalCompatibilityTuple` with exactly `rules`, `engine`, `runtimeAbi`, `chronicle`, `arenaCatalog`, and `setPolicy`. Define `ExecutableLaneIdentity` separately with provider, language, runtime, toolchain, adapter, policy, corpus, artifact, implementation/build, and `tupleId` identities. Certificates key the entire executable identity. [VERIFIED: D-05 through D-08]

Hash tuple bytes as a fixed-order domain-separated record, not ad hoc `JSON.stringify`, for example `cowards.compatibility-tuple.v1\0rules=<len>:<utf8>...`. A release generator computes SHA-256 using `node:crypto`; Go verifies with `crypto/sha256`. Commit both ID and expansion in an immutable manifest. This avoids inventing canonical JSON before Phase 258 and prevents property-order drift. [VERIFIED: existing platform crypto use in `packages/replay/src/hash.ts` and Go completion/fixture code]

### 2. Derive eligibility from two certificates

Use immutable `ContainmentCertificate` and `ConformanceCertificate` records containing certificate version, exact identity, evidence hash, issued/fresh-until timestamps, gate results, and revocation/supersession status. The pure evaluator returns:

| Condition | Effective status |
|---|---|
| operator kill switch or missing/invalid containment | `disabled` |
| current containment but missing/invalid conformance | `exhibition_only` |
| current exact passing containment + conformance | `counted` |

Operators may append a disable/re-enable intent, but re-enable only removes the operator block; it cannot manufacture certificates. Avoid an `approve=true` field anywhere in the counted path. [VERIFIED: D-02 and D-03]

### 3. Check twice and preserve atomic failure

At scheduling, persist the evaluated identity, tuple, certificate IDs/hashes, registry generation, and decision. At execution, reload the active registry/certificates and compare the entire identity before invoking a provider. Recheck the registry generation and evidence hashes before accepting success. A mismatch returns a typed system failure; no Match completion, Chronicle, gameplay result, memory, or standings write occurs. [VERIFIED: D-04; current Go completion is already transaction-oriented in `apps/go-backend/completion.go`]

### 4. Treat historical data as immutable input

Create immutable release manifests describing only combinations actually shipped. Resolve legacy rows from persisted Chronicle reproducibility, Strategy Revision engine/runtime fields, arena version, and MatchSet policy. Return `resolved_historical`, `legacy_incomplete`, or `unresolved`; never update the original row. An unresolved row remains readable under its original visible rules/Chronicle labels but cannot be counted in a new recomputation. [VERIFIED: D-06, D-09]

### 5. Make correction an event projection

Store a deterministic cohort predicate AST/version, preview hash/count/sample IDs, evidence references, action, reason, actor, and creation time in an append-only event. The application re-evaluates the predicate in the same transaction and rejects preview drift. Effective classification folds events in sequence. Rollback appends a compensating event referencing the original, then recomputes standings from canonical MatchSet evidence plus effective classifications. [VERIFIED: existing `competition_audit_events` append-only trigger; `packages/persistence/src/standings-recompute.ts` pure recomputation]

### 6. Generate public and operator views from reason codes

Recommended stable codes include `OPERATOR_DISABLED`, `CONTAINMENT_MISSING`, `CONTAINMENT_STALE`, `CONFORMANCE_MISSING`, `CONFORMANCE_STALE`, `IDENTITY_MISMATCH`, `TUPLE_UNKNOWN`, `TUPLE_UNCERTIFIED`, and `EVIDENCE_UNVERIFIABLE`. Public output includes only status, calm category copy, tuple ID, safe certificate version/hash, and freshness date. Restricted output may add exact identities, per-gate results, remediation, cohort impact, and restricted evidence IDs, but never bytes, source, memories, objectives, credentials, host paths, raw diagnostics, or exploit detail. [VERIFIED: D-13 through D-16; `public-output-privacy.ts`]

## Runtime State Inventory

| Category | Items found | Required action |
|---|---|---|
| Stored data | PostgreSQL stores scattered runtime/engine compatibility on revisions/entrants and Chronicle versions/artifacts; Matches have no tuple. | Add new columns/tables/migration; preserve old bytes; use read-only legacy resolution. |
| Live service config | Runtime-service URL, provider secret, private artifact token, backend ownership flags, runtime adapter selection, and test DB URL are env-configured. | Bind only non-secret config identity into certificates; never persist/output secret values. |
| OS-registered state | No Coward's Game launchd registration or live host process was found. | None. Recheck in release proof. |
| Secrets/env vars | `COWARDS_PROVIDER_VALIDATION_SECRET`, internal/private artifact tokens, DB/Redis URLs, owner tokens. | Key names remain stable; certificate hashes must not include or reveal secret values. |
| Build/generated artifacts | `dist/`, `tsbuildinfo`, OpenAPI, Go parity fixtures, runtime evidence and proof artifacts exist. | Regenerate through existing scripts; bind relevant build/artifact hashes; do not treat stale generated files as proof. |

[VERIFIED: migrations 0001/0003/0004/0010/0011; repo env-name scan; process/launchd/container probes]

## Standard Stack

| Tool | Current version/evidence | Use |
|---|---|---|
| TypeScript / Zod / Vitest | TypeScript `^6.0.3`, Zod `^4.4.3`, Vitest `^4.1.6` | Canonical contracts, pure evaluation, tests. |
| Node / pnpm | Node `26.0.0`, pnpm `11.1.2` | Generators and SHA-256 manifest creation. |
| Go | `1.26.3` | Normal scheduling/execution enforcement and SHA-256 verification. |
| PostgreSQL | client `16.14`; local `postgres:18` container healthy | Immutable evidence/governance persistence and transaction proof. |
| Docker / Redis | Docker `29.4.0`; local Redis 8 container healthy | Existing service-backed test topology. |
| Python / Rust / Zig / Wasmtime | Python `3.9.6`, Rust `1.95.0`, Zig `0.16.0`, Wasmtime `45.0.0` | Identity capture and later recertification. |

[VERIFIED: local version probes; `package.json`]

## Package Legitimacy Audit

Not applicable. Phase 256 should add no external packages; it uses existing dependencies and platform cryptography.

## Don't Hand-Roll

| Problem | Do not build | Use instead |
|---|---|---|
| Cryptographic hash | Custom hash or browser-specific stringify hash | Node `crypto`, Go `crypto/sha256`, committed generated manifest. |
| Public redaction | Per-route field deletion | `assertPublicOutputLeakSafe` plus typed public DTOs. |
| Standings repair | Direct points updates | Existing pure recomputation fed by effective event projection. |
| Immutability | Application convention only | DB append-only triggers/constraints plus code tests. |
| Tuple compatibility | Six independent `if supported` checks | One exact tuple registry lookup. |
| Promotion | Operator checkbox or registry label | Pure evidence-derived evaluator. |

## Common Pitfalls

1. **Grandfathered counted lanes:** existing labels and signed-in proof are not new containment/conformance certificates. Start all lanes quarantined.
2. **Semantic/executable identity collapse:** toolchain rebuild invalidates evidence, not necessarily the semantic tuple.
3. **Partial tuple acceptance:** individually known component versions can still be an uncertified combination.
4. **Legacy backfill:** inferred values rewrite history and create false certainty; unresolved is a valid result.
5. **Mutable “current status” as authority:** store immutable events/certificates and derive the status.
6. **TOCTOU at execution:** a scheduling check alone cannot catch revoked or changed evidence before/during invocation.
7. **Public hash overexposure:** hashes are safe only when they do not identify restricted bytes or provide restricted storage paths.
8. **AUTH-05 scope confusion:** Phase 256 should install the owner manifest/monitor and explicitly fingerprint the known duplicate Match-loop and stale contiguous-Activation debts; Phase 257 removes those exceptions. Do not falsely report them absent now.
9. **Changing v1.4 while “clarifying”:** Phase 256 changes eligibility/evidence only; no Match state, Action, event order, outcome, or Strategy observation changes are allowed.

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Unit/contract | Vitest 4.1.6 and Go test |
| Persistence | Existing PostgreSQL migrations/integration harness |
| Structural | Existing `scripts/check-boundary-monitors.ts` pattern plus a focused v1.37 evaluator |
| Quick run | `pnpm --filter @cowards/spec exec vitest run src/integrity-authority.test.ts src/runtime-evidence.test.ts` |
| Full phase gate | spec + persistence + runtime-service focused tests, `go test ./...`, migration test, boundary evaluator, privacy scan, reproduction snapshot |

### Requirements to Test Map

| Req | Automated proof | Planned file/command |
|---|---|---|
| SAFE-01 | Exact identity matrix; no certificate component may be omitted or wildcarded. | `packages/spec/src/runtime-evidence.test.ts` |
| SAFE-02 | Missing/stale/mismatch/revoked/kill-switch cases at schedule and execution. | spec test, Go provider/orchestrator tests, runtime-service test |
| SAFE-03 | Legacy resolution, deterministic cohort preview, append-only action, compensation, recomputation. | persistence migration/governance/standings tests |
| SAFE-04 | Public/operator fixture scans and forbidden nested-key/marker cases. | spec privacy test + focused boundary evaluator |
| AUTH-01 | Every authority domain has exactly one registered owner/symbol. | generated manifest test |
| AUTH-02 | Tuple expansion hashes to ID and persists on all new Match/evidence writes. | spec hash vectors + TS/Go cross-language vectors + DB integration |
| AUTH-03 | Missing/unknown/mixed/uncertified tuples fail every consumer. | spec, runtime-service, Go, persistence tests |
| AUTH-04 | v1.4 fixture bytes unchanged; resolved/incomplete/unresolved dispatch never mutates rows. | historical resolver + DB before/after hash test |
| AUTH-05 | Synthetic duplicate scheduler/UI rule/adapter classification/arena authority/stale entry point fails monitor. | `scripts/check-v1-37-integrity-boundaries.test.ts` |

### Sampling Rate

- **Per task commit:** affected focused Vitest/Go tests plus tuple hash vectors.
- **Per wave merge:** spec, persistence, runtime-service, and Go suites plus focused boundary evaluator.
- **Phase gate:** all above; migration integration; public/operator privacy scan; current-HEAD audit snapshot; `pnpm boundary:monitors` where generated artifacts are current.

### Wave 0 Gaps

- [ ] `packages/spec/src/integrity-authority.test.ts` — owner/tuple registry and hash vectors.
- [ ] `packages/spec/src/runtime-evidence.test.ts` — exact certificates, status derivation, public projection.
- [ ] `packages/persistence/src/integrity-evidence.test.ts` — append-only storage, legacy resolution, cohort/compensation.
- [ ] `apps/runtime-service/src/counted-safety.test.ts` — execution-time and in-flight mismatch.
- [ ] `apps/go-backend/integrity_evidence_test.go` — schedule/claim/execute parity and cross-language hash vectors.
- [ ] `scripts/check-v1-37-integrity-boundaries.test.ts` — authority/duplicate/privacy monitor fixtures.

## Security Domain

| ASVS category | Applies | Control |
|---|---|---|
| V2 Authentication | operator routes only | Existing authenticated/admin server checks. |
| V3 Session management | operator routes only | Existing server-owned sessions; no identity via client parameter. |
| V4 Access control | yes | Public DTO and restricted operator DTO are separate; evidence links require authorization. |
| V5 Validation | yes | Zod/Go/DB validation of exact tuple/certificate/event shapes; reject unknown/mixed data. |
| V6 Cryptography | yes | Platform SHA-256; HMAC remains for provider proof; no secret material in public identity. |
| V7 Error handling | yes | Stable reason codes and redacted public copy; raw runtime errors remain restricted. |
| V12 Files/resources | yes | Evidence storage uses IDs/hashes, never public host paths or artifact bytes. |

Threats to test include forged certificate/replay, stale evidence replay, mixed tuple tampering, operator over-promotion, TOCTOU revocation, cohort predicate drift, compensation misuse, and public proof leakage.

## Assumptions Log

No unverified external claims are required. Recommendations are derived from locked decisions and the current repository. The exact type/file names remain planner discretion.

## Open Questions

No user decision is required before planning. The planner should choose concrete names and plan boundaries while preserving the locked status semantics. If implementation discovers that eligibility enforcement changes valid gameplay/evidence semantics rather than only whether work may execute/count, stop for compatibility approval.

## Sources

### Primary (HIGH confidence)

- `256-CONTEXT.md`, active `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`.
- Core-rules audit, reproduction script/README, and current-HEAD execution output.
- `packages/spec/src/runtime.ts`, `versions.ts`, competition entry/counting/governance/privacy contracts.
- Persistence migrations, ladder/governance/standings code, Go readiness/orchestrator/runtime client, runtime-service server/execution code.
- v1.4 rules and technical architecture; project `AGENTS.md`.

## Metadata

**Confidence breakdown:** Stack HIGH; architecture HIGH; migration seams HIGH; final plan sizing MEDIUM.
**Valid until:** implementation changes these Phase-256 seams or the active tuple decisions change.
