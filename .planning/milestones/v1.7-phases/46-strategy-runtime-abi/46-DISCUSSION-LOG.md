# Phase 46: Strategy Runtime ABI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 46-Strategy Runtime ABI
**Areas discussed:** ABI Envelope Shape, Source And Package Metadata, Version Negotiation And Compatibility, Failure Taxonomy

---

## ABI Envelope Shape

| Option | Description | Selected |
| --- | --- | --- |
| Full envelope around existing game inputs | Envelope carries ABI version, method, language, adapter, source/package metadata, limits, compatibility, and input payload. | ✓ |
| Minimal envelope, mostly current subprocess IPC | Keep current `{ source, methodName, input }` shape and add metadata later. | |
| Separate endpoint per method and runtime | Separate request/response schemas for each method/runtime. | |

**User's choice:** Full envelope around existing game inputs.
**Notes:** Existing canonical game inputs stay inside the envelope.

| Option | Description | Selected |
| --- | --- | --- |
| One discriminated envelope | Single envelope keyed by method name. | |
| Separate method envelopes | Separate top-level schemas with shared common fields. | |
| Both, with common base plus aliases | Canonical discriminated union plus method-specific aliases/schemas. | ✓ |

**User's choice:** Both, with common base plus aliases.
**Notes:** One wire protocol, friendly implementation surfaces.

---

## Source And Package Metadata

| Option | Description | Selected |
| --- | --- | --- |
| Raw source only | Include language id/version and raw source only. | |
| Source plus package metadata schema, packages disabled by policy | Define package metadata fields now, but require package execution disabled in v1.7 unless experimental. | ✓ |
| Full dependency metadata and install flow | Define package metadata and implement dependency installation/resolution now. | |

**User's choice:** Source plus package metadata schema, packages disabled by policy.
**Notes:** Future-proofing without expanding runtime power in v1.7.

| Option | Description | Selected |
| --- | --- | --- |
| Mandatory minimal provenance | Require language, source hash/bytes, entrypoint, package mode, adapter, ABI, and compatibility versions. | ✓ |
| Everything mandatory | Require dependency list and lockfile/manifest hashes even with no packages. | |
| Mostly optional metadata | Require only source/language and let host supply most metadata. | |

**User's choice:** Mandatory minimal provenance.
**Notes:** Package fields become required only when packages exist.

---

## Version Negotiation And Compatibility

| Option | Description | Selected |
| --- | --- | --- |
| Fail closed on exact ABI/adapter/language compatibility mismatch | Reject execution for any behavior-significant mismatch. | |
| Allow declared compatibility ranges | Accept if host falls inside declared ranges. | |
| Fail closed for runtime behavior, allow display-only mismatch tolerance | Reject behavior-significant mismatch, tolerate descriptive metadata changes. | ✓ |

**User's choice:** Fail closed for runtime behavior, allow display-only mismatch tolerance.
**Notes:** Deterministic fairness without pointless incompatibility from display metadata.

| Option | Description | Selected |
| --- | --- | --- |
| No ranges yet | Exact behavior-significant versions only. | ✓ |
| Schema supports ranges, policy forbids them initially | Include unused range shape in schema. | |
| Allow narrow patch ranges immediately | Accept patch-level ranges for adapter/language versions. | |

**User's choice:** No ranges yet.
**Notes:** Ranges wait for golden parity evidence.

---

## Failure Taxonomy

| Option | Description | Selected |
| --- | --- | --- |
| Preserve and formalize the split | Separate runtime violation and system failure envelopes. | ✓ |
| Unify all failures under one error envelope | One failure shape with category field. | |
| Treat all subprocess abnormal exits as Strategy violations | Punish abnormal runtime exits as Strategy failure. | |

**User's choice:** Preserve and formalize the split.
**Notes:** Matches fairness, scoring, and existing worker/runtime behavior.

| Option | Description | Selected |
| --- | --- | --- |
| Public-safe summary plus private diagnostics | Failure envelopes include public code/message and optional private diagnostics. | ✓ |
| Only public-safe fields in ABI | Diagnostics stay entirely host-local. | |
| Diagnostics in ABI, redacted downstream | ABI carries detailed diagnostics and downstream projection must redact. | |

**User's choice:** Public-safe summary plus private diagnostics.
**Notes:** Debugging remains possible without weakening public projection.

## the agent's Discretion

- Exact schema/type names.
- Whether current JS subprocess IPC is adapted in Phase 46 or validated/documented against the ABI first.

## Deferred Ideas

- Compatibility ranges.
- Package dependency installation/resolution.
- Production multi-language support.
- Production-grade hostile-code sandbox replacement.
