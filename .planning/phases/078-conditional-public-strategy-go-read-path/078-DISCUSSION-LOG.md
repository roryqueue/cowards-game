# Phase 78: Conditional Public Strategy Go Read Path - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 78-Conditional Public Strategy Go Read Path
**Areas discussed:** Live Data Threshold, No-Go Branch Behavior, Parity Cases, Page Behavior Surface

---

## Live Data Threshold

| Option | Description | Selected |
|--------|-------------|----------|
| Real/production-equivalent Go read required | Require a narrow live read provider or production-equivalent persistent data path before claiming promotion. | ✓ |
| Fixture-backed Go is enough | Allow existing fixtures to count as production routing evidence. | |
| Shadow-only evidence is enough | Allow shadow comparison without Go serving the request to count as promotion evidence. | |
| Adjust | Modify the recommendation. | |

**User's choice:** 1
**Notes:** User confirmed real or production-equivalent Go reads are required for promotion.

---

## No-Go Branch Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Disabled path + blocker artifact | Keep TypeScript default active, leave Go disabled, and record missing evidence/blockers. | ✓ |
| Blocker artifact only | Record blockers without preserving or implementing disabled switch behavior. | |
| Shadow comparison harness only | Create evidence-only shadow comparison but no explicit blocker artifact. | |
| Adjust | Modify the recommendation. | |

**User's choice:** 1
**Notes:** User confirmed disabled Go ownership plus blocker artifact when live criteria fail.

---

## Parity Cases

| Option | Description | Selected |
|--------|-------------|----------|
| Full parity case set | Require success, missing, malformed, unavailable, href, schema, privacy, errors, ordering, runtime metadata, and no-extra-fields parity. | ✓ |
| Success/missing/privacy only | Require only a reduced core parity set. | |
| Planner chooses minimal set | Let planning decide the parity scope. | |
| Adjust | Modify the recommendation. | |

**User's choice:** 1
**Notes:** User confirmed the full parity set as a hard prerequisite.

---

## Page Behavior Surface

| Option | Description | Selected |
|--------|-------------|----------|
| Unchanged page; generic failures only | Keep TypeScript/default page behavior unchanged, render Go success/not-found the same, and keep operational status out of the page. | ✓ |
| Show route owner/debug banner | Expose backend ownership/debug information on the public Strategy page. | |
| Always fall back visually to not found | Treat Go operational failures as not-found. | |
| Adjust | Modify the recommendation. | |

**User's choice:** 1
**Notes:** User confirmed unchanged visible page behavior and generic public-safe failure handling.

## the agent's Discretion

- Planner may decide whether the feasible implementation path is a narrow Go DB-backed provider or a no-go blocker artifact.

## Deferred Ideas

None.
