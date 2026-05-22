# Phase 44: Demo, Docs, Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 44-Demo, Docs, Verification
**Areas discussed:** Demo Scenario Shape, Browser Verification Scope, Audit Emphasis, Docs and Regeneration

---

## Demo Scenario Shape

| Option | Description | Selected |
| --- | --- | --- |
| One focused Strategy vs Starter + Advanced gauntlets | Narrow narrative around one Strategy. |  |
| Multiple Strategies vs Starter + Advanced profiles | 2-3 Strategies showing rows and varied weaknesses. | ✓ |
| Full Advanced + Starter matrix | Broadest field; heavy and tournament-like. |  |

**User's choice:** Multiple Strategies vs Starter + Advanced profiles.
**Notes:** Better exercises heatmaps, comparisons, explorer, and export without becoming a full tournament.

| Option | Description | Selected |
| --- | --- | --- |
| Controlled synthetic/demo examples | Include fixture/demo degraded/system/replay-unavailable states. | ✓ |
| Only naturally occurring states | Edge states covered by tests if absent. |  |
| Force real failures | Generate states through failing Strategy/runtime behavior. |  |

**User's choice:** Controlled synthetic/demo examples.
**Notes:** Clearly labeled fixture/demo evidence for UI/privacy/status verification.

---

## Browser Verification Scope

| Option | Description | Selected |
| --- | --- | --- |
| Acceptance path plus representative edge states | E2E demo path plus targeted state checks. | ✓ |
| Full combinatorial browser matrix | Every state/filter/export across desktop/mobile. |  |
| Smoke-only browser path | One happy path. |  |

**User's choice:** Acceptance path plus representative edge states.
**Notes:** Includes desktop/mobile heatmap, explorer, replay focus/fallback, export controls, and degraded/system/replay-unavailable states.

---

## Audit Emphasis

| Option | Description | Selected |
| --- | --- | --- |
| Four-section milestone audit | Requirement coverage, privacy, runtime isolation, deterministic evidence/UX. | ✓ |
| Requirement-by-requirement only | Checklist only. |  |
| Narrative demo report only | Human story without audit structure. |  |

**User's choice:** Four-section milestone audit.
**Notes:** Cross-cutting privacy/runtime concerns get explicit sections.

---

## Docs and Regeneration

| Option | Description | Selected |
| --- | --- | --- |
| Milestone phase artifact plus README links | Detailed docs under phase/milestone artifacts with concise README notes. | ✓ |
| Main README-centric | Put most instructions in README. |  |
| Only planning artifacts | Keep everything under `.planning`. |  |

**User's choice:** Milestone phase artifact plus README links.
**Notes:** Rich planning evidence without bloating top-level onboarding.

## the agent's Discretion

- Auto-lock standard privacy, runtime isolation, deterministic evidence, browser verification, and non-durable demo framing expectations.

## Deferred Ideas

None.
