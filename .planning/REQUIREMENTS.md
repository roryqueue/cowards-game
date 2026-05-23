# Requirements: Coward's Game

**Defined:** 2026-05-23
**Milestone:** v1.14 Generic Strategy Artifact and Runtime Boundary Contract
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## v1 Requirements

### Baseline And Scope

- [ ] **BASE-01**: Developer can inspect a v1.14 baseline covering v1.13 Go-owned routes, blocked fork routes, runtime/worker ownership, broad web report-only offenses, privacy gates, replay realism gates, and topology evidence.
- [ ] **BASE-02**: Developer can inspect explicit v1.14 non-goals for Go Strategy execution, web/API Strategy execution, Node `vm` security boundary use, counted non-JS play, production sandbox promotion, Go migrations, full replay projection, owner-debug replay migration, Workshop runtime ownership, and job claiming/completion migration.
- [ ] **BASE-03**: Developer can inspect a v1.14 ownership manifest separating live Go routes, fixture parity routes, TypeScript oracle/reference behavior, worker-owned runtime surfaces, deferred surfaces, and selected promotion candidates.
- [ ] **BASE-04**: Developer can verify current Starter/Advanced fork deferral and Go account-save lineage gaps are recorded with concrete code references and parity risks.
- [ ] **BASE-05**: Developer can verify current runtime ABI drift, adapter ID mapping drift, limit drift, failure taxonomy drift, and public/private diagnostic risks are recorded before implementation.
- [ ] **BASE-06**: Developer can verify current public-output privacy deny lists and replay board realism checks are inventoried before new gates are added.

### Strategy Artifact Contract

- [ ] **ART-01**: Developer can use spec-owned Strategy Artifact types and schemas that cover user revisions, server-native templates, Starter entries, Advanced entries, and future language variants.
- [ ] **ART-02**: Developer can represent artifact kind, source visibility, fork eligibility, source hash, source bytes, source format, validation status/report, runtime metadata, language metadata, package metadata, engine compatibility, and behavior-significant compatibility in the artifact contract.
- [ ] **ART-03**: Developer can represent generic lineage/derived-from metadata without losing compatibility with existing Starter and Advanced lineage fields.
- [ ] **ART-04**: Developer can mark immutable Match/MatchSet eligibility snapshots from artifact/revision data, including validation status, counted runtime eligibility, source hash, runtime compatibility, and locked-at semantics.
- [ ] **ART-05**: Developer can validate artifact schemas with golden valid/invalid fixtures for template, Starter, Advanced, account revision, and future-language examples.
- [ ] **ART-06**: Developer can verify public artifact summaries are source-safe by default while owner-private and built-in forkable source access remain explicitly classified.
- [ ] **ART-07**: Developer can verify StrategyRevision remains backward-compatible while new artifact metadata is introduced.

### Artifact Manifest

- [ ] **MAN-01**: Developer can generate a Strategy artifact manifest from TypeScript-owned Starter, Advanced, and Workshop template/source registries.
- [ ] **MAN-02**: Developer can verify generated manifest entries include source, source hash, source bytes, validation report/status, runtime metadata, engine compatibility, tags, notes, names, version, archetype/level metadata, lineage metadata, and fork eligibility.
- [ ] **MAN-03**: Developer can run a stale-output/checksum gate that fails when TypeScript source registries and generated manifests diverge.
- [ ] **MAN-04**: Developer can verify generated manifests distinguish built-in public/forkable source from owner-private account source and never classify owner-private source as public.
- [ ] **MAN-05**: Developer can verify TypeScript and Go manifest consumers agree on artifact IDs, hashes, bytes, validation status, runtime metadata, lineage, and public metadata.
- [ ] **MAN-06**: Developer can verify manifests do not require Go to import TypeScript modules or execute Strategy source.

### Runtime ABI

- [ ] **ABI-01**: Developer can inspect `strategy-runtime-abi-v1.14` as the strict public ABI between deterministic server/native orchestration and hostile Strategy runtime code.
- [ ] **ABI-02**: Developer can validate method-specific request and response envelopes for `selectActivations` and `soldierBrain`, including `StrategyInput`, `StrategyResult`, `SoldierBrainInput`, and `SoldierBrainResult` schemas.
- [ ] **ABI-03**: Developer can verify ABI request validation enforces source hash, source bytes, source byte limits, runtime metadata, adapter id/version, language id/version, package mode, required capabilities, effective limits, and behavior-significant compatibility.
- [ ] **ABI-04**: Developer can verify ABI response validation enforces output schema, output byte caps, StrategyMemory limits, SoldierMemory limits, objective payload limits, and JSON-only values.
- [ ] **ABI-05**: Developer can verify `SOURCE_TOO_LARGE` and other preflight validation failures are classified consistently rather than being confused with runtime violations.
- [ ] **ABI-06**: Developer can verify runtime violations and system failures use one spec-owned taxonomy with public messages and private diagnostics separated.
- [ ] **ABI-07**: Developer can verify adapter ID mapping is first-class and versioned rather than hidden in monitor-only bridge code.
- [ ] **ABI-08**: Developer can verify ABI fixtures cover JS/TS counted runtime, experimental Python/non-JS metadata, invalid language/adapter/package combinations, timeout, oversized output, malformed IPC, and redacted diagnostics.

### Runtime Adapter Conformance

- [ ] **RUNC-01**: Developer can verify worker-thread, subprocess, and container-subprocess JS adapters either execute through v1.14 envelopes or use one explicit conformance bridge with tests.
- [ ] **RUNC-02**: Developer can verify effective timeout, stdout/stderr/source/memory/objective limits align across spec defaults, runtime-js guards, adapter metadata, worker config, sandbox probes, and boundary monitors.
- [ ] **RUNC-03**: Developer can verify runtime violations complete Match/Chronicle behavior consistently while system failures remain retryable or classified as system failure without becoming player losses.
- [ ] **RUNC-04**: Developer can run hostile/determinism probes for time, randomness, filesystem, network, environment, shell, dynamic code, stdout/stderr caps, memory limits, source limits, objective payloads, and malformed outputs.
- [ ] **RUNC-05**: Developer can verify executable runtime APIs remain absent from web/API and Go backend packages.
- [ ] **RUNC-06**: Developer can verify container and non-JS runtimes remain evidence-only/non-counted unless a later milestone explicitly promotes them.

### Go Artifact Consumption

- [ ] **GOART-01**: Developer can load generated Strategy artifact manifests in Go without importing TypeScript modules or executing Strategy source.
- [ ] **GOART-02**: User can fork Starter Strategies through Go-owned routes with TypeScript-oracle parity for source, source hash, source bytes, validation status/report shape, tags, label, notes, lineage, strategy ID, revision ID, runtime metadata, and account list DTO behavior.
- [ ] **GOART-03**: User can fork Advanced Strategies through Go-owned routes with TypeScript-oracle parity for source, source hash, source bytes, validation status/report shape, tags, label, notes, archetype, lineage, strategy ID, revision ID, runtime metadata, and account list DTO behavior.
- [ ] **GOART-04**: User can save an account revision through Go with Starter/Advanced/template lineage preserved when submitted source hash and selected artifact metadata match a manifest entry.
- [ ] **GOART-05**: Developer can verify Go artifact/fork routes fail closed for missing manifest, stale manifest, invalid artifact ID, invalid source/hash, invalid validation metadata, unauthorized session, duplicate/storage failure, schema failure, privacy failure, and topology failure without silent TypeScript fallback.
- [ ] **GOART-06**: Developer can verify Go artifact/fork routes never execute Strategy code, use Node `vm`, claim jobs, run Matches, build Chronicles, or classify runtime failures.
- [ ] **GOART-07**: Developer can verify route ownership manifests, web selection flags, topology checks, and rollback drills promote Starter/Advanced fork routes only after manifest parity passes.

### Privacy, Realism, And Promotion Gate

- [ ] **GATE-01**: Developer can use one spec-owned public forbidden-field contract across service guards, Go tests, replay projection tests, analytics guards, topology checks, OpenAPI public artifacts, boundary monitors, and browser-visible public replay text.
- [ ] **GATE-02**: Developer can verify public/service/Go/topology/monitor outputs omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, and private runtime internals by default.
- [ ] **GATE-03**: Developer can verify owner-private source retrieval remains the only source-returning exception, requires authenticated ownership, and uses private/no-store behavior.
- [ ] **GATE-04**: Developer can run a repeatable live web-through-Go topology command that creates a Go-owned exhibition, runs the TypeScript worker, fetches replay metadata, and records privacy-safe evidence.
- [ ] **GATE-05**: Developer can verify board realism for Go-created or replay/match creation changes: declared bounds are valid, canonical arenas contain starting positions, terrain and visible Soldiers stay within bounds, and browser replay canvas is nonblank and not clipped.
- [ ] **GATE-06**: Developer can verify boundary monitors fail on ABI drift, artifact manifest drift, adapter metadata drift, privacy deny-list drift, unexpected Go/web Strategy execution, unsafe fallback, or runtime ownership creep.
- [ ] **GATE-07**: Developer can verify `strict_offenses=0` and broad web report-only offenses do not increase above 29 unless explicitly rebaselined.
- [ ] **GATE-08**: Developer can inspect a final v1.14 promotion decision for artifact manifest, ABI conformance, Go fork routes, privacy gates, replay realism evidence, and remaining deferred runtime/backend surfaces.

## Future Requirements

### Runtime Promotion

- **RTP-01**: Developer can promote a production hostile-code isolation boundary only after live container or stronger production-equivalent evidence passes resource, filesystem, network, image provenance, redacted diagnostics, no-fallback, and rollback gates.
- **RTP-02**: User can submit counted non-JS Strategy Revisions only after sandbox, package, Workshop UX, documentation, compatibility, privacy, and rollback criteria are satisfied.

### Backend Ownership

- **GOBE-01**: Go can own job claiming/completion, Match execution, Chronicle generation, scoring completion, or runtime failure classification only after a separate orchestration/runtime ownership milestone proves deterministic and privacy-safe parity.
- **GOBE-02**: Go can own database migrations/schema after migration ownership, rollback, compatibility, and local topology contracts are explicitly planned.

### Replay And Workshop

- **RPLY-01**: Go can own full replay projection or owner-debug replay only after public/private Chronicle projection parity and owner authorization semantics are proven.
- **WORK-01**: Go can own Workshop validation, test launch, analytics rerun, profile save, export, or runtime flows only after artifact/runtime contracts and worker boundaries are stable.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Executing Strategy code in web/API or Go backend | Violates hostile-code isolation and deterministic boundary constraints. |
| Treating Node `vm`, worker threads, or host subprocesses as production hostile-code security boundaries | Existing evidence labels these as prototype or evidence-only boundaries. |
| Production sandbox promotion | v1.14 defines contracts and conformance; promotion requires a later milestone with stronger live evidence. |
| Counted non-JS play or public language picker | Would imply support parity before runtime/product/sandbox criteria are satisfied. |
| Go job claiming/completion, Match execution, Chronicle generation, scoring completion, or runtime failure classification | v1.14 keeps TypeScript worker/runtime ownership explicit. |
| Go-owned migrations/schema ownership | Separate operational risk and rollback surface. |
| Full replay projection or owner-debug replay migration to Go | v1.14 only strengthens replay/public-output safety gates. |
| Workshop test/runtime/rerun/export ownership migration | These remain TypeScript-owned until artifact/runtime contracts are proven. |
| Durable ratings, official public tournaments, custom arenas, or monetization | Not part of the artifact/runtime boundary goal. |

## Traceability

| Requirement | Phase | Status |
| --- | --- | --- |
| BASE-01 | Phase 89 | Pending |
| BASE-02 | Phase 89 | Pending |
| BASE-03 | Phase 89 | Pending |
| BASE-04 | Phase 89 | Pending |
| BASE-05 | Phase 89 | Pending |
| BASE-06 | Phase 89 | Pending |
| ART-01 | Phase 90 | Pending |
| ART-02 | Phase 90 | Pending |
| ART-03 | Phase 90 | Pending |
| ART-04 | Phase 90 | Pending |
| ART-05 | Phase 90 | Pending |
| ART-06 | Phase 90 | Pending |
| ART-07 | Phase 90 | Pending |
| MAN-01 | Phase 91 | Pending |
| MAN-02 | Phase 91 | Pending |
| MAN-03 | Phase 91 | Pending |
| MAN-04 | Phase 91 | Pending |
| MAN-05 | Phase 91 | Pending |
| MAN-06 | Phase 91 | Pending |
| ABI-01 | Phase 92 | Pending |
| ABI-02 | Phase 92 | Pending |
| ABI-03 | Phase 92 | Pending |
| ABI-04 | Phase 92 | Pending |
| ABI-05 | Phase 92 | Pending |
| ABI-06 | Phase 92 | Pending |
| ABI-07 | Phase 92 | Pending |
| ABI-08 | Phase 92 | Pending |
| RUNC-01 | Phase 93 | Pending |
| RUNC-02 | Phase 93 | Pending |
| RUNC-03 | Phase 93 | Pending |
| RUNC-04 | Phase 93 | Pending |
| RUNC-05 | Phase 93 | Pending |
| RUNC-06 | Phase 93 | Pending |
| GOART-01 | Phase 94 | Pending |
| GOART-02 | Phase 94 | Pending |
| GOART-03 | Phase 94 | Pending |
| GOART-04 | Phase 94 | Pending |
| GOART-05 | Phase 94 | Pending |
| GOART-06 | Phase 94 | Pending |
| GOART-07 | Phase 94 | Pending |
| GATE-01 | Phase 95 | Pending |
| GATE-02 | Phase 95 | Pending |
| GATE-03 | Phase 95 | Pending |
| GATE-04 | Phase 95 | Pending |
| GATE-05 | Phase 95 | Pending |
| GATE-06 | Phase 95 | Pending |
| GATE-07 | Phase 95 | Pending |
| GATE-08 | Phase 95 | Pending |

**Coverage:**
- v1 requirements: 48 total
- Mapped to phases: 48
- Unmapped: 0

---
*Requirements defined: 2026-05-23*
*Last updated: 2026-05-23 after v1.14 milestone initialization*
