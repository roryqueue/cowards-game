# Phase 257: Canonical Transition Kernel and v1.4 Semantic Integrity - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-12
**Phase:** 257-canonical-transition-kernel-and-v1-4-semantic-integrity
**Areas discussed:** Kernel transition contract, semantic-validation behavior, exact compatibility rulings, API and event cleanup

---

## Kernel transition contract

| Decision | Options considered | Selected |
|----------|--------------------|----------|
| Step size | One transition; one Activation; one Match | One transition |
| Record | Typed envelope plus hashes; state snapshots; events only | Typed envelope plus hashes |
| Runtime | Yield/resume; direct injected call; precompute outputs | Yield/resume |
| Public API | One engine driver; two shared-step drivers; Chronicle-first | One engine driver |

**User's choice:** Recommended pure state-machine and single-driver model throughout.

## Semantic-validation behavior

| Decision | Options considered | Selected |
|----------|--------------------|----------|
| Boundaries | Every transition; outer boundaries only; debug only | Every transition |
| Classification | Ownership-based; runtime-adjacent is player; generic | Ownership-based |
| Failed artifact | No canonical partial evidence; prefix; attempted states | No canonical partial evidence |
| Error set | Deterministic bounded; first only; unbounded | Deterministic bounded |

**User's choice:** Recommended fail-closed semantic-validation model throughout.

## Exact compatibility rulings

| Decision | Options considered | Selected |
|----------|--------------------|----------|
| Excess orders | Cap then validate; validate then cap; scan for valid quota | Cap then validate |
| Backstab reason | `BACKSTABBED`; generic inactive; Action-derived | `BACKSTABBED` |
| No-Advance ordering | Status/closure/outcome; outcome first; omit closure | Status/closure/outcome |
| Existing ambiguities | Preserve bundle; review individually | Preserve bundle |

**User's choice:** Recommended literal rulings and preservation bundle.

## API and event cleanup

| Decision | Options considered | Selected |
|----------|--------------------|----------|
| `resolveActivation` | Remove; deprecate; test-only | Remove |
| `PUSH_ATTEMPTED` | Remove current; start emitting; reserve | Remove current |
| Contract version | New tuple component; documentation only; schema only | New tuple component |
| Guards | Ownership/import/export/event bundle; individual review | Guard bundle |

**User's choice:** Recommended hard cleanup and structural enforcement.

## the agent's Discretion

- Internal naming and module structure within the locked pure-kernel, typed-validation design.

## Deferred Ideas

- Cycle-start Backstab removal and explicit post-Advance hold remain optional future decisions behind proof gates.
