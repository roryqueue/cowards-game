# Phase 234: TypeScript Artifact Provenance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 234-typescript-artifact-provenance
**Areas discussed:** Artifact form, Provider proof, Execution and failure semantics, Evidence/privacy

---

## Artifact Form

| Option | Description | Selected |
|--------|-------------|----------|
| Canonical transpiled JS artifact | Build a deterministic executable JavaScript artifact from TypeScript and treat it as the validated artifact. | Yes |
| WASM migration | Move TypeScript to a new WASM-backed runtime. | |
| Source-only proof | Keep TypeScript source/transpile behavior and only add labels. | |

**User's choice:** Approved recommended option.
**Notes:** This phase is provenance parity, not sandbox migration.

---

## Provider Proof

| Option | Description | Selected |
|--------|-------------|----------|
| Bind source and artifact evidence | Provider proof includes provider id, contract version, source hash/bytes, artifact hash/bytes, compiler/options metadata, and runtime compatibility key. | Yes |
| Bind source only | Keep proof weaker and omit artifact binding. | |
| Ad hoc metadata | Add proof details in unversioned metadata. | |

**User's choice:** Approved recommended option.
**Notes:** Prefer versioned proof/schema changes when proof shape changes.

---

## Execution and Failure Semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Execute validated artifact | Match and MatchSet execution use the validated artifact path. | Yes |
| Re-transpile source at execution | Keep mutable source transpilation at runtime. | |
| Fallback on artifact error | Fall back to source or another runtime when artifact validation fails. | |

**User's choice:** Approved recommended option.
**Notes:** Missing, stale, mismatched, unverifiable, oversized, or incompatible artifacts fail closed.

---

## Evidence and Privacy

| Option | Description | Selected |
|--------|-------------|----------|
| Artifact-proven public cue | Public evidence may say artifact-proven while omitting source/artifact bytes and private runtime details. | Yes |
| Full proof material public | Expose artifact bytes or source to support trust. | |
| No public cue | Keep artifact provenance private only. | |

**User's choice:** Approved recommended option.
**Notes:** Public output remains source-free and artifact-byte-free by default.

## the agent's Discretion

- Choose exact artifact storage and metadata shape during planning, provided it is deterministic, versioned as needed, fail-closed, and public-safe.

## Deferred Ideas

- TypeScript WASM migration.
- TypeScript package ecosystem expansion.
- Production sandbox certification.
