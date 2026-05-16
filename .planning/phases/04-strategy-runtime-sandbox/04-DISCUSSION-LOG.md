# Phase 4: Strategy Runtime Sandbox - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-16
**Phase:** 04-Strategy Runtime Sandbox
**Areas discussed:** Sandbox Boundary, Strategy Revision Artifact, Failure Semantics, Authoring Contract

---

## Sandbox Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Replaceable worker sandbox, strict contract checks | Worker-only runtime adapter with source scanning, schema validation, timeout enforcement, globals/capability blocking, and clean `StrategyRuntime` mapping. | ✓ |
| Subprocess-shaped isolation now | Separate executable/process boundary and message-passing shape from the start. | |
| Validation-only runtime shell | Validate/wrap revisions and stub execution paths. | |

**User's choice:** Replaceable worker sandbox with strict contract checks.
**Notes:** Must remain honest about prototype isolation and future replacement.

| Option | Description | Selected |
|--------|-------------|----------|
| `packages/runtime-js` owns sandbox execution; `apps/worker` is the only allowed caller | Runtime package implements validation/execution; boundary rules keep callers constrained. | |
| `apps/worker` owns execution; `packages/runtime-js` only owns validation/helpers | Strong worker-only signal but harder to test/reuse. | |
| Split entrypoints inside `packages/runtime-js` | Safe validation APIs generally; executable runtime APIs behind a worker-only entrypoint. | ✓ |

**User's choice:** Split entrypoints inside `packages/runtime-js`.
**Notes:** Example entrypoint: `@cowards/runtime-js/worker`.

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit prototype boundary | Tests prove blocked capabilities, timeouts, schema limits, and import boundaries, while docs state this is not production-grade hostile-code isolation. | ✓ |
| Production-intent boundary | Treat worker runtime as the real v1 security model. | |
| Minimal wording | Describe blocks without naming the prototype limitation. | |

**User's choice:** Explicit prototype boundary.
**Notes:** Avoid overclaiming JS-level blocking strength.

| Option | Description | Selected |
|--------|-------------|----------|
| Static reject plus runtime guard | Reject obvious forbidden patterns up front and guard execution globals/capabilities too. | ✓ |
| Runtime guard only | Validate shape/size first, catch forbidden behavior only when executed. | |
| Strict parser allowlist | Parse source and allow only a narrow JS subset now. | |

**User's choice:** Static reject plus runtime guard.
**Notes:** Strict parser allowlist is deferred.

---

## Strategy Revision Artifact

| Option | Description | Selected |
|--------|-------------|----------|
| Versioned in-memory artifact builder | Validation returns a frozen/readonly revision artifact with deterministic identity and metadata. | ✓ |
| Local registry abstraction | Add storage-like API now, backed by memory or files. | |
| Spec-only contract, runtime validates raw source | Add types/schemas but keep runtime calls source-string based. | |

**User's choice:** Versioned in-memory artifact builder.
**Notes:** Durable storage remains Phase 5.

| Option | Description | Selected |
|--------|-------------|----------|
| `packages/spec` owns types and schemas; `runtime-js` owns builder/validation | Shared contract without persistence/UI importing runtime internals. | ✓ |
| `packages/runtime-js` owns the full contract | Keeps runtime-specific details local. | |
| Split minimal spec type plus runtime-specific extended type | More flexible but likely premature. | |

**User's choice:** `packages/spec` owns StrategyRevision types/schemas.
**Notes:** Follows existing package-boundary decisions.

| Option | Description | Selected |
|--------|-------------|----------|
| Store raw source plus source hash | Executable snapshot with public projection stripping source. | ✓ |
| Store source hash only | Requires source storage elsewhere before execution. | |
| Store normalized/wrapped source only | Better execution artifact, worse editing/debug history. | |

**User's choice:** Store raw source plus source hash.
**Notes:** Privacy is handled by projection and later persistence access control.

| Option | Description | Selected |
|--------|-------------|----------|
| Content-derived ID | Derive revision ID from deterministic content/version inputs. | ✓ |
| Caller-provided ID only | Runtime builder requires the caller to pass an ID. | |
| Generated random ID | Product-like but introduces nondeterminism. | |

**User's choice:** Content-derived ID.
**Notes:** Database IDs can be added later without changing reproducibility identity.

| Option | Description | Selected |
|--------|-------------|----------|
| Structured validation report | `valid`, errors, warnings, byte size, forbidden patterns, compatibility, and hash metadata. | ✓ |
| Boolean plus message | Enough for basic tests but thin for UX. | |
| Throw on invalid | Simple internally but poor for UX. | |

**User's choice:** Structured validation report.
**Notes:** Gives Phase 6 Workshop useful validation bones.

---

## Failure Semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Forfeit that round's activation selections | Runtime violation, no valid orders, StrategyMemory unchanged. | ✓ |
| Fall back to previous valid activation plan | More forgiving but stateful. | |
| Immediate match loss after selection failure | Strong deterrent but too punitive for MVP. | |

**User's choice:** Forfeit that round's activation selections.
**Notes:** Aligns with current engine behavior.

| Option | Description | Selected |
|--------|-------------|----------|
| Interrupt Activation, then normal no-advance cleanup | Runtime violation ends Activation; stoning depends on whether the Soldier Advanced. | ✓ |
| Always no-op the Cycle and continue | More forgiving but noisy/exploitable. | |
| Immediate Soldier becomes STONE regardless of prior Advance | Clear penalty but conflicts with no-advance semantics. | |

**User's choice:** Interrupt Activation, then normal no-advance cleanup.
**Notes:** Preserves Phase 2 engine decision.

| Option | Description | Selected |
|--------|-------------|----------|
| Same gameplay result, distinct violation type | One engine penalty path, exact `RuntimeViolationType` recorded. | ✓ |
| Forbidden capability is harsher | More deterrent, more policy-heavy. | |
| Timeouts are softer | Nuanced but harder to reason about. | |

**User's choice:** Same gameplay result, distinct violation type.
**Notes:** Later policy can tighten using recorded categories.

| Option | Description | Selected |
|--------|-------------|----------|
| Reject entire output atomically | Invalid/oversized result applies no memory update. | ✓ |
| Apply valid fields only | Salvages data but creates partial semantics. | |
| Apply memory, reject action/order | Allows invalid output to mutate future behavior. | |

**User's choice:** Reject entire output atomically.
**Notes:** Runtime output is all-or-nothing.

| Option | Description | Selected |
|--------|-------------|----------|
| Public marker, owner-only raw details | Public type/context, private raw messages/details/snippets. | ✓ |
| Public full error detail | Easier observers, leaks internals. | |
| Owner-only event only | Private but public replay loses explanation. | |

**User's choice:** Public marker, owner-only raw details.
**Notes:** Matches Phase 3 privacy boundary.

---

## Authoring Contract

| Option | Description | Selected |
|--------|-------------|----------|
| Default object with two methods | `export default { selectActivations, soldierBrain }`. | ✓ |
| Named exports | `export function selectActivations` and `export function soldierBrain`. | |
| Factory function | `createStrategy()` returns methods and private closure state. | |

**User's choice:** Default object with two methods.
**Notes:** Approachable for Phase 6 templates.

| Option | Description | Selected |
|--------|-------------|----------|
| Transpile TypeScript, do not full typecheck user strategy source | Accept TS syntax where practical and rely on schemas/runtime validation. | ✓ |
| Full typecheck against strategy API types | Stronger feedback, heavier compiler/editor integration. | |
| JavaScript only in Phase 4 | Simplest but underdelivers on JS/TS requirement. | |

**User's choice:** Transpile TypeScript, do not full typecheck.
**Notes:** Full editor-grade typechecking belongs later.

| Option | Description | Selected |
|--------|-------------|----------|
| No imports in Phase 4 | Self-contained strategy source. | ✓ |
| Curated imports from `@cowards/spec` only | Better ergonomics, more runtime import surface. | |
| Relative imports bundled into the revision | Product-friendly later, much larger scope. | |

**User's choice:** No imports in Phase 4.
**Notes:** Keeps sandboxing, hashing, and replay reproducibility clean.

| Option | Description | Selected |
|--------|-------------|----------|
| No helper injection yet | Only canonical inputs and outputs; templates can inline helpers. | ✓ |
| Deterministic helper object injected into methods | Useful later, expands API surface. | |
| Global helper object | Convenient but undisciplined global surface. | |

**User's choice:** No helper injection yet.
**Notes:** Helper injection can be added if doctrine examples prove the need.

| Option | Description | Selected |
|--------|-------------|----------|
| Synchronous only | Methods return values directly. | ✓ |
| Async allowed but awaited with timeout | More flexible, more nondeterministic surface. | |
| Accept either, normalize internally | Convenient but harder to explain. | |

**User's choice:** Synchronous only.
**Notes:** Matches current engine interface.

## the agent's Discretion

No areas were delegated to the agent without a user choice.

## Deferred Ideas

- Durable revision persistence and database IDs — Phase 5.
- Match job orchestration and system failure retry policy — Phase 5.
- Monaco typechecking, templates, validation UX, and helper ergonomics — Phase 6.
- Stronger production hostile-code isolation behind the same runtime boundary — future hardening.
- Strict parser allowlist or exhaustive strategy grammar — post-core-loop hardening.
