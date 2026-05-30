# Phase 197: Public-Safe Evidence Details, Privacy Copy, and Owner/Test-Only Gating - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 197-Public-Safe Evidence Details, Privacy Copy, and Owner/Test-Only Gating
**Areas discussed:** Privacy Copy Placement, Denylist Scope, Owner/Test Gate Standard

---

## Privacy Copy Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Evidence section footers plus provenance details | Put concise privacy cues near evidence panels and fuller exclusions/provenance in details sections. | ✓ |
| One global privacy banner | Visible, but heavy and repetitive. | |
| Only provenance details | Cleanest UI, but too easy to miss. | |

**User's choice:** Evidence section footers plus provenance details.
**Notes:** Keeps privacy tied to the evidence users are inspecting without turning pages into warnings.

---

## Denylist Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Full public-output denylist across rendered pages and artifacts | Scan result pages, replay pages, fixture catalog, screenshots/proof text where possible, fixture JSON, schema artifacts, and Markdown evidence. | ✓ |
| Rendered pages only | Directly tests user output, but may miss fixture/artifact leaks. | |
| Existing monitor scope only | Lowest risk of churn, but may not cover new workbench surfaces. | |

**User's choice:** Full public-output denylist across rendered pages and artifacts.
**Notes:** v1.27 adds new surfaces and proof artifacts, so the denylist should follow them.

---

## Owner/Test Gate Standard

| Option | Description | Selected |
|--------|-------------|----------|
| Dual gate: environment plus authority | Test/local feature flag where relevant, plus server-side owner/test authorization for owner data. No query-param-only gates. | ✓ |
| Environment gate only | Enough for fixture catalog, not enough for owner private replay/debug data. | |
| Server authority only | Good for owner data, but does not address fixture/test-only routes. | |

**User's choice:** Dual gate: environment plus authority.
**Notes:** Fixtures need non-production gates; owner debug needs identity/authorization too.

---

## the agent's Discretion

- The agent may choose exact privacy copy text and scan implementation details.

## Deferred Ideas

None.
