# Phase 238: Workshop Checker Path Inventory and Public Contract - Plan

**Created:** 2026-06-01
**Status:** Ready for execution
**Requirements:** CHECKINV-01, CHECKINV-02, CHECKINV-03, CHECKINV-04

## Goal

Inventory the current Workshop Validate source, submit, save, and entry validation paths for TypeScript, Python, Rust, and Zig, then define a shared public-safe Workshop checker contract that preserves runtime-service/provider ownership and prepares Phase 239 implementation.

## Deliverables

1. `.planning/artifacts/v1.34-workshop-checker-inventory.md`
   - Frontend Workshop Validate source path.
   - Workshop submit/save path.
   - Account save path where distinct.
   - Competition/trial ladder entry path.
   - Runtime-service/provider path.
   - Per-language semantic gaps and boundary notes.

2. `.planning/artifacts/v1.34-workshop-checker-contract.md`
   - Shared checker response contract.
   - Status model and diagnostic categories.
   - Language/provider/artifact/provenance fields.
   - Runtime-service/toolchain availability states.
   - Cache identity fields.
   - Privacy exclusions and public-safe normalization rules.

3. `.planning/artifacts/v1.34-workshop-checker-parity-matrix.md`
   - Matrix comparing Validate source, Workshop submit/save, account save, and entry for TypeScript, Python, Rust, and Zig.
   - Each gap marked `fix now`, `defer`, or `no change`.
   - TypeScript recorded as the practical baseline.

4. Phase closeout updates:
   - Mark CHECKINV requirements complete in `.planning/REQUIREMENTS.md`.
   - Update `.planning/STATE.md`.
   - Write `238-SUMMARY.md` and `238-VERIFICATION.md`.

## Tasks

### 1. Inventory Code Paths

- Map `apps/web/app/workshop/workshop-client.tsx` and `workshop-client-state.ts`.
- Map `/api/workshop/validate`, `/api/workshop/revisions`, and account save routes.
- Map Go `createStrategyRevision`, provider validation matching, and runtime-service client behavior.
- Map competition/trial ladder entry gates that consume saved revisions.
- Map runtime-service `/validate-strategy` and language provider validators.

**Acceptance:** Inventory names concrete files/functions and distinguishes frontend, app/API, Go/API, runtime-service, provider/toolchain, artifact/provenance, cache, and diagnostic boundaries.

### 2. Produce Full Checker Contract

- Define contract envelope fields and status values.
- Define diagnostic categories by language and shared categories.
- Define severity/actionability, provider metadata, artifact/provenance state, availability state, and cache identity fields.
- Define privacy exclusions and public-safe diagnostic normalization.
- State ownership boundaries and non-claims.

**Acceptance:** Contract can be handed to Phase 239 without rediscovering response shape or privacy stance.

### 3. Build Parity Matrix

- Compare Validate source, Workshop submit/save, account save, and entry per language.
- Mark semantic gaps with `fix now`, `defer`, or `no change`.
- Tie each gap to v1.34 requirements and hard boundaries.

**Acceptance:** Matrix includes TypeScript, Python, Rust, and Zig; it explains why Python/Rust/Zig gaps should be fixed in later phases.

### 4. Verify Phase 238

- Check artifacts for required sections and requirement coverage.
- Scan artifacts for forbidden privacy strings and obvious raw diagnostic examples.
- Confirm no code execution ownership change was made.
- Update planning state and requirement traceability.

**Acceptance:** `238-VERIFICATION.md` records success criteria and any residual risks or local limitations.

## Threat Model

- **Private diagnostic leakage:** Inventory/contract artifacts might normalize raw diagnostics poorly or include examples with source, host paths, env values, package paths, artifact bytes, tokens, DB details, or private runtime internals. Mitigation: use normalized category names and privacy scan the artifacts.
- **Boundary creep:** Checker contract could imply web/API/Go executes Strategy code or compilers. Mitigation: explicitly state runtime-service/provider ownership and no execution in web/API/Go.
- **Overclaiming sandbox posture:** Contract could imply TypeScript/Python provenance is WASM isolation or production sandbox certification. Mitigation: include non-claims in contract and parity matrix.
- **TinyGo leakage:** Inventory could accidentally treat TinyGo as production language. Mitigation: contract limits production checker language ids to TypeScript, Python, Rust, and Zig.

## Verification Commands

```bash
rg -n "CHECKINV|Validate source|provider|runtime-service|privacy|fix now|defer|no change" .planning/artifacts/v1.34-workshop-checker-*.md
rg -n "StrategyMemory|SoldierMemory|objective payload|raw diagnostic|/Users/|process.env|DATABASE_URL|artifact bytes|bytesBase64|token" .planning/artifacts/v1.34-workshop-checker-*.md
git diff -- .planning/REQUIREMENTS.md .planning/STATE.md .planning/artifacts/v1.34-workshop-checker-*.md .planning/phases/238-workshop-checker-path-inventory-and-public-contract
```

## Completion Criteria

- CHECKINV-01..CHECKINV-04 are satisfied.
- The three Phase 238 artifacts exist and are internally consistent.
- `238-SUMMARY.md` and `238-VERIFICATION.md` are written.
- No production code behavior is changed in this phase.
