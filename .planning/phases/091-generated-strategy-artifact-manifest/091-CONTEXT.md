# Phase 91: Generated Strategy Artifact Manifest - Context

**Gathered:** 2026-05-23  
**Milestone:** v1.14 Generic Strategy Artifact and Runtime Boundary Contract  
**Status:** Context gathered; ready for planning

## Phase Boundary

Phase 91 turns canonical TypeScript-owned Starter, Advanced, and Workshop template sources into generated, committed Strategy Artifact manifests that TypeScript and Go can consume as data.

This phase should not move Strategy execution into Go/web/API, promote Go fork routes by itself, or make owner-private account source public. It should create parity-safe generated artifacts and drift checks that Phase 94 can use for Go fork parity.

## Approved Decisions

### D-01 Canonical Generation Sources

Generate the manifest from canonical TypeScript-owned source registries and template/static snapshot sources:

- `packages/persistence/src/starter-strategies.ts`
- `packages/persistence/src/advanced-strategies.ts`
- Workshop template/static snapshot sources from the persistence/workshop layer

TypeScript remains the generation oracle for these source libraries in v1.14.

### D-02 Committed JSON Data

Emit committed JSON artifact manifests as data for TypeScript and Go consumers.

Go must load manifests as data only. It must not import TypeScript modules, execute Strategy source, invoke Node `vm`, or infer source metadata from runtime execution.

### D-03 Manifest Entry Shape

Manifest entries must include:

- Artifact ID and kind.
- Source and source visibility.
- Source hash and source byte count.
- Validation report and validation status.
- Runtime metadata.
- Engine compatibility.
- Names, labels, notes, descriptions, tags, and versions where applicable.
- Advanced archetype and benchmark metadata where applicable.
- Generic lineage plus Starter/Advanced-compatible lineage.
- Fork eligibility.

### D-04 Drift Gates

Add stale-output and checksum gates, patterned after existing Go fixture manifest checks, so registry/template drift fails loudly.

The manifest should be reproducible from canonical TypeScript inputs. Tests or scripts should fail if committed output differs from regenerated output.

### D-05 Source Classification

Only built-in Starter, Advanced, and template source may be classified as public/forkable in generated manifests.

Owner-private account source must not enter the generated built-in manifest and must not be accidentally reclassified as public.

### D-06 TypeScript Oracle, Go Consumer

Use TypeScript as the generation oracle and Go as a manifest consumer. Parity tests should compare:

- Artifact IDs.
- Source hashes.
- Source bytes.
- Validation status/report shape.
- Runtime metadata.
- Lineage.
- Public metadata.

## Canonical References

- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/phases/090-generic-strategy-artifact-contract/090-CONTEXT.md`
- `packages/persistence/src/starter-strategies.ts`
- `packages/persistence/src/advanced-strategies.ts`
- `packages/persistence/src/workshop.ts`
- `packages/runtime-js/src/revision.ts`
- `packages/runtime-js/src/validation.ts`
- `packages/spec/src/schemas.ts`
- `scripts/generate-go-parity-fixtures.ts`
- `apps/go-backend/main.go`
- `apps/go-backend/main_test.go`
- `apps/go-backend/testdata/service-fixtures/fixture-manifest.json`
- `apps/go-backend/fixture_checksums_gen.go`
- `apps/go-backend/live_backend.go`

## Codebase Context

Current inputs:

- Starter definitions already include ID, name, version, description, tags, doctrine notes, expected behavior, memory use, source, validation, source hash, and source bytes.
- Advanced definitions add primary archetype and benchmark Starter ID.
- Workshop template summaries expose template ID, label, source, and validation.

Existing generation/check patterns:

- Go service fixtures are generated from TypeScript with a fixture checksum manifest.
- Go tests validate route manifest drift and fixture checksum drift.
- Boundary monitors already know that Starter/Advanced fork routes are deferred because Go lacks a generated library source manifest.

Design pressure:

- Phase 94 needs Go to fork Starter/Advanced Strategies with parity while never executing Strategy code.
- Generated manifests must be complete enough for Go to preserve lineage and DTO behavior without duplicating TypeScript registry logic.

## Planning Notes

Planning should cover:

- Manifest file locations and schema versioning.
- Generation command and package script integration.
- TypeScript fixture tests for schema-valid manifest entries.
- Go manifest loader and tests that parse data without execution.
- Stale-output test strategy.
- Checksum or content-hash policy.
- Privacy tests proving owner-private source is absent.
- Boundary monitor updates that detect manifest drift or unsafe Go/runtime creep.

## Deferred To Later Phases

- Phase 92 owns runtime ABI schemas and failure taxonomy.
- Phase 93 owns runtime adapter conformance.
- Phase 94 owns Go artifact loading in live fork routes and TypeScript-oracle parity.
- Phase 95 owns final promotion gate evidence and privacy/topology checks.
