# Phase 199: Live Signed-In Compatibility Proof Without Execution-Internal UI Coupling - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 199-Live Signed-In Compatibility Proof Without Execution-Internal UI Coupling
**Areas discussed:** Live Proof Scope, Monitor Strictness, Proof Artifact Language

---

## Live Proof Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Open result/replay compatibility only | Reuse the existing signed-in proof lane enough to create/open result and replay pages, scan privacy, and verify UI consumes frozen/public DTOs. Do not broaden execution scenarios. | ✓ |
| Full v1.23 multi-compiler rerun | Strong but expensive; may turn this UX milestone back toward runtime proof. | |
| Fixture proof only, no live proof | Faster, but contradicts the milestone's live compatibility requirement. | |

**User's choice:** Open result/replay compatibility only.
**Notes:** Live proof should show compatibility, not drag execution ownership into v1.27.

---

## Monitor Strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Hard-block UI coupling and privacy regressions | Fail on result/replay imports from runtime-service internals, Go orchestration internals, persistence internals, private debug payloads, contract version drift, fixture fallback drift, owner/test leakage, and private markers. | ✓ |
| Warn on coupling, fail on privacy only | Lower churn, but weaker than the milestone goal. | |
| Keep v1.25 monitors unchanged | Fastest, but misses new workbench surfaces. | |

**User's choice:** Hard-block UI coupling and privacy regressions.
**Notes:** This is the phase that keeps all previous UX work honest.

---

## Proof Artifact Language

| Option | Description | Selected |
|--------|-------------|----------|
| Compatibility/non-claim language | "Opened live result/replay pages through frozen/public DTOs; no runtime promotion, sandbox certification, ABI migration, or execution-internal UI dependency claimed." | ✓ |
| Readiness language | Stronger wording like "ready for live use"; too broad for this phase. | |
| Minimal command log | Safe but not explanatory enough for future audits. | |

**User's choice:** Compatibility/non-claim language.
**Notes:** Keeps proof useful without turning it into a runtime milestone.

---

## the agent's Discretion

- The agent may decide whether to adapt an existing signed-in proof spec or add a slimmer v1.27 compatibility proof.

## Deferred Ideas

None.
