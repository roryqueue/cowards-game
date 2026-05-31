# Phase 235: Python Artifact Provenance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 235-python-artifact-provenance
**Areas discussed:** Artifact form, Provider proof, Runtime policy, Claims/evidence

---

## Artifact Form

| Option | Description | Selected |
|--------|-------------|----------|
| Provider-sealed normalized source bundle | Bundle normalized Python source with AST/compile validation evidence and interpreter metadata. | Yes |
| Primary `.pyc` artifact | Use bytecode as the default artifact form. | |
| Source-only proof | Keep Python source-backed and only add labels. | |

**User's choice:** Approved recommended option.
**Notes:** `.pyc` may be considered only if planning proves a deterministic hash-based path.

---

## Provider Proof

| Option | Description | Selected |
|--------|-------------|----------|
| Bind source and artifact evidence | Include source hash/bytes, artifact hash/bytes, interpreter/version metadata, provider id, contract version, validation policy, and compatibility metadata. | Yes |
| Bind source only | Keep proof weaker and omit artifact evidence. | |
| Treat artifact as isolation proof | Let artifact proof imply stronger sandbox claims. | |

**User's choice:** Approved recommended option.
**Notes:** Carry forward TypeScript-style proof binding, with Python-specific metadata.

---

## Runtime Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve constrained provider policy | No packages, imports, filesystem, network, clock/random, eval/exec, dynamic execution, or host process capability. | Yes |
| Expand package/import support | Use artifact work to enable a richer Python ecosystem. | |
| Fallback on artifact error | Fall back to source or another runtime when artifact validation fails. | |

**User's choice:** Approved recommended option.
**Notes:** Artifact failures fail closed.

---

## Claims and Evidence

| Option | Description | Selected |
|--------|-------------|----------|
| Provenance-only claim | Public/docs evidence says artifact-proven but not WASM-isolated or sandbox-certified. | Yes |
| Strong sandbox claim | Present provenance as equivalent to WASM isolation. | |
| Private-only evidence | Avoid public language-status explanation. | |

**User's choice:** Approved recommended option.
**Notes:** Public output remains source-free and artifact-byte-free by default.

## the agent's Discretion

- Choose exact normalized bundle and validation evidence format during planning.

## Deferred Ideas

- Python package ecosystem expansion.
- Python WASM migration.
- Production sandbox certification.
