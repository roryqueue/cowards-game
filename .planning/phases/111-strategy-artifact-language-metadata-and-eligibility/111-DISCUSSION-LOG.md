# Phase 111: Strategy Artifact Language Metadata and Eligibility - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 111-Strategy Artifact Language Metadata and Eligibility
**Areas discussed:** Artifact model, hashing/compatibility, eligibility/public labels

---

## Artifact Model

| Option | Description | Selected |
| --- | --- | --- |
| Extend existing artifact model | Add Python-capable fields to shared StrategyRevision/StrategyArtifact structures. | yes |
| Python-only artifact model | Add a parallel artifact family for Python. | |
| Metadata only in runtime service | Avoid persistence/spec changes and infer at runtime. | |

**User's choice:** Extend existing artifact model.
**Notes:** This keeps the Strategy Revision contract language-neutral.

---

## Hashing And Compatibility

| Option | Description | Selected |
| --- | --- | --- |
| Behavior metadata included | Include language/runtime/package/compile/validation metadata in artifact hash and compatibility key. | yes |
| Source-only hash | Hash only submitted source bytes. | |
| Runtime-only comparison | Defer compatibility to runtime selection. | |

**User's choice:** Behavior metadata included.
**Notes:** Prevents unsafe JS/TS and Python collisions or compatibility claims.

---

## Eligibility And Public Labels

| Option | Description | Selected |
| --- | --- | --- |
| Safe visible labels | Expose language/experimental/non-counted labels without private runtime details. | yes |
| Hide language in public output | Avoid showing Python status in summaries/replay. | |
| Promote Python to normal counted labels | Treat Python like JS/TS for eligibility. | |

**User's choice:** Safe visible labels.
**Notes:** Python remains experimental and non-counted while users can understand what ran.

---

## the agent's Discretion

- The agent may choose exact DTO names and schema helpers.
- Similar metadata decisions should follow the shared-contract approach unless a future phase explicitly promotes a language.
