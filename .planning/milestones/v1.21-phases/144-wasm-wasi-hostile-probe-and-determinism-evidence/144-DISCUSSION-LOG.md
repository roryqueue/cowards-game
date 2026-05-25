# Phase 144: WASM/WASI Hostile Probe and Determinism Evidence - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 144-WASM/WASI Hostile Probe and Determinism Evidence
**Areas discussed:** Probe scope, no-fallback behavior, privacy redaction, promotion language, carry-forward policy

---

## Probe Scope

| Option | Description | Selected |
| --- | --- | --- |
| Full bounded hostile set | Cover capabilities, determinism, resources, malformed ABI, output caps, invalid actions, and schema failures. | yes |
| Minimal smoke probes | Only prove a valid Rust module runs. | |
| Production stress suite | Run broad stress testing beyond local-safe bounds. | |

**User's choice:** Full bounded hostile set.
**Notes:** Bounded and repeatable, not unbounded stress.

---

## No-Fallback Behavior

| Option | Description | Selected |
| --- | --- | --- |
| Fail loudly | Missing toolchain/runtime/artifact/profile/metadata produces explicit failure and no substitute execution. | yes |
| Best-effort fallback | Try another runtime or source path if WASM fails. | |
| Silent skip | Omit unavailable paths from evidence. | |

**User's choice:** Fail loudly.
**Notes:** Especially important for Zig unavailable behavior.

---

## Privacy Redaction

| Option | Description | Selected |
| --- | --- | --- |
| Public-safe summaries | Redact source, memories, objectives, stderr, stacks, paths, env, tokens, DB DSNs, and runtime internals. | yes |
| Raw diagnostics | Show raw compiler/runtime output. | |
| Developer-only public leaks | Allow internal fields in evidence panels. | |

**User's choice:** Public-safe summaries.
**Notes:** Public proof artifacts must be safe to inspect.

---

## Promotion Language

| Option | Description | Selected |
| --- | --- | --- |
| Candidate/readiness only | Evidence may support alpha/beta but not production sandbox certification. | yes |
| Production certified | Treat local probe pass as production sandbox proof. | |
| Counted eligibility | Promote Rust/WASM into ranked/counted paths. | |

**User's choice:** Candidate/readiness only.
**Notes:** Conservative promotion language is a hard gate.

---

## Carry-Forward Policy

| Option | Description | Selected |
| --- | --- | --- |
| Carry similar decisions forward | Later proof/audit decisions inherit fail-loud and redaction stance. | yes |
| Re-ask | Reopen equivalent safety decisions. | |

**User's choice:** Carry similar decisions forward.
**Notes:** Applies directly to Phases 145-147.

## the agent's Discretion

Exact probe harness structure may follow existing monitor/probe conventions.

## Deferred Ideas

- Production abuse testing.
- Cloud sandbox certification.
- Counted-play promotion criteria.
