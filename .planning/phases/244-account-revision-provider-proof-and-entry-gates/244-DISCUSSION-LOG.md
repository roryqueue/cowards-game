# Phase 244: Account Revision Provider-Proof and Entry Gates - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-14
**Phase:** 244-Account Revision Provider-Proof and Entry Gates
**Areas discussed:** Account-save proof behavior, non-execution draft semantics, entry gate parity, public-safe diagnostics

---

## Account-Save Proof Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Require provider proof for execution-ready saves | TypeScript joins Python/Rust/Zig in runtime-service/provider validation whenever readiness is claimed. | ✓ |
| Keep TypeScript local save but downgrade later | Save TypeScript locally, then rely on entry gates to catch missing proof. | |
| Defer TypeScript parity | Leave TypeScript drift unresolved until a later proof phase. | |

**User's choice:** `[auto] Require provider proof for execution-ready saves`
**Notes:** Recommended because Phase 243 identified `v135-account-save-go-typescript-proof` as fix-now and Phase 244 success criteria require provider proof for TypeScript account save.

---

## Non-Execution Draft Semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Allow only explicit non-execution drafts | Draft storage is allowed only when clearly non-ready and never entry-eligible. | ✓ |
| Fail every invalid/unavailable save | Simpler policy, but may remove owner-visible invalid/draft evidence currently useful in Workshop/account flows. | |
| Save invalid states without new labels | Keeps behavior loose and risks misleading readiness claims. | |

**User's choice:** `[auto] Allow only explicit non-execution drafts`
**Notes:** Recommended because the milestone intent allows explicit non-execution draft storage but forbids misleading readiness or eligibility claims.

---

## Entry Gate Parity

| Option | Description | Selected |
|--------|-------------|----------|
| Converge Go with persistence proof checks | Use the stricter persistence competition/ladder semantics as the reference for Go exhibition and entry parity. | ✓ |
| Keep Go exhibition looser for TypeScript | Preserves current behavior but leaves the known provider-proof drift open. | |
| Split counted and non-counted into unrelated models | Increases drift risk and weakens monitorability. | |

**User's choice:** `[auto] Converge Go with persistence proof checks`
**Notes:** Recommended because persistence already requires TypeScript/Python/Rust/Zig provider validation for counted entry, while Go currently lets TypeScript through on runtime metadata alone.

---

## Public-Safe Diagnostics

| Option | Description | Selected |
|--------|-------------|----------|
| Normalize to public-safe readiness categories | Return stable categories for invalid proof, unavailable service, incompatible runtime, package policy, unsupported provider, and hidden TinyGo without private details. | ✓ |
| Expose provider/runtime details for debugging | Useful for developers but violates v1.35 public/default privacy boundaries. | |
| Keep generic validation failed errors only | Safer but too opaque for the desired account/entry readiness cleanup. | |

**User's choice:** `[auto] Normalize to public-safe readiness categories`
**Notes:** Recommended because Phase 244 must distinguish readiness states without exposing raw diagnostics, source, artifact bytes, host paths, env values, package paths, tokens, DB details, provider signing material, or private runtime internals.

---

## the agent's Discretion

- Exact helper names, DTO field names, and test grouping are left to the planner.
- The planner should prefer existing provider proof helpers, runtime registry semantics, and boundary monitor patterns.

## Deferred Ideas

- Owner-debug/private replay authorization and Workshop alias fate remain Phase 245.
- Sandbox-readiness and certification labels remain Phase 246.
- Package/dependency ecosystem policy remains Phase 247.
- Final service-backed proof and expanded privacy scans remain Phase 248.
