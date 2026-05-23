# v1.14 Feature Research

**Milestone:** Generic Strategy Artifact and Runtime Boundary Contract
**Date:** 2026-05-23

## Strategy Artifacts

**Table stakes:**
- Generic artifact kinds for account revisions, templates, Starter entries, Advanced entries, and future language examples.
- Source hash, source bytes, validation report/status, runtime metadata, engine compatibility, source visibility, fork eligibility, public metadata, lineage, and immutable eligibility fields.
- Backward compatibility with current StrategyRevision shape and Starter/Advanced lineage.

**Differentiators:**
- Artifact manifest usable by both TypeScript and Go.
- Built-in source classified differently from owner-private source.
- Future language/runtime metadata represented without promoting counted non-JS play.

## Generated Manifests

**Table stakes:**
- Generate manifests from TypeScript-owned Starter, Advanced, and Workshop template sources.
- Include validation reports and source hashes from canonical TypeScript validation.
- Fail stale-output/checksum drift.
- Go consumes data without importing TypeScript modules or executing source.

**Differentiators:**
- Manifest parity covers Go forks and lineage-preserving account saves.
- Manifest privacy checks prevent owner-private source classification mistakes.

## Runtime ABI

**Table stakes:**
- `strategy-runtime-abi-v1.14` with method-specific request/response envelopes.
- Enforce source hash/bytes/limits, runtime metadata, adapter/language versions, package mode, capabilities, and output/memory/objective limits.
- Separate preflight validation, runtime violations, system failures, public messages, and private diagnostics.

**Differentiators:**
- Existing JS adapters conform through one bridge or envelope path.
- Adapter ID mapping becomes versioned and first-class.
- Hostile/determinism probes are tied to ABI conformance evidence.

## Go Fork Parity

**Table stakes:**
- Starter and Advanced fork routes use generated artifacts.
- Go forks preserve source, hash, validation, tags, label, notes, lineage, runtime metadata, strategy ID, revision ID, and account list DTO parity.
- Go lineage-preserving account saves use selected artifact metadata only when source hash matches.

**Differentiators:**
- Route ownership can move from blocked to promoted only after topology/no-fallback/rollback evidence passes.

## Privacy And Replay Realism

**Table stakes:**
- One forbidden public-field contract.
- Owner-private source route remains the only source-returning exception.
- Live web-through-Go evidence creates and executes an exhibition, fetches replay metadata, and verifies board realism.

**Differentiators:**
- Browser canvas nonblank/non-clipped proof becomes repeatable evidence, not milestone-only notes.
