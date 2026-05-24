# Phase 91: Generated Strategy Artifact Manifest - Plan

**Status:** Ready for execution  
**Mode:** Standard  
**Research:** Captured in `091-CONTEXT.md`

## Goal

Generate committed Strategy Artifact manifests from TypeScript-owned Starter, Advanced, and Workshop template sources for TypeScript and Go consumers.

## Tasks

1. Add a generation script.
   - Read canonical TypeScript registry/template data.
   - Emit manifest JSON using Phase 90 artifact schemas.
   - Include source, hashes, bytes, validation, runtime metadata, public metadata, lineage, source visibility, and fork eligibility.

2. Commit generated manifest output.
   - Store under a stable artifact/data path consumable by TypeScript and Go.
   - Include schema version and generated checksum metadata.

3. Add stale-output and privacy tests.
   - Fail when regenerated output differs from committed output.
   - Assert owner-private account source is absent.
   - Assert built-in Starter/Advanced/template entries are public/forkable only by explicit classification.

4. Add Go read-only manifest parsing tests.
   - Parse the generated JSON as data.
   - Do not execute source or import TypeScript.

## Verification

- Run manifest generation and stale check.
- Run spec/runtime validation for generated entries.
- Run Go tests for manifest parsing.

## Exit Criteria

- Manifest generation is reproducible.
- Go can parse artifact data without execution.
- Manifest drift and privacy classification are covered by tests.
