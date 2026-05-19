# Phase 16: Exhibition Queue and Entry - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19
**Phase:** 16-Exhibition Queue and Entry
**Areas discussed:** Entry creation mode, mixed ownership entries, lock timing, preflight validation, duplicate rule, status visibility, developer seeding path

---

## Entry Creation Mode

| Option | Description | Selected |
| --- | --- | --- |
| Manual create exhibition flow | Signed-in user selects preset and owned revisions, then creates a MatchSet. | ✓ |
| Open queue auto-matching | Users submit one revision and the system batches entrants. | |
| Developer seed only | Test-support/dev route only. | |
| You decide | Planner chooses smallest satisfying flow. | |

**User's choice:** Manual create exhibition flow, modified to 2-8 owned revisions.
**Notes:** This directly supports self-play/testing.

---

## Mixed Ownership Entries

| Option | Description | Selected |
| --- | --- | --- |
| Owner-only in v1.2 | Creator can enter only their own revisions. | ✓ |
| Owner plus fixture opponents | Mix owned revisions with seeded fixtures. | |
| Multi-user selected entries | Include other users' public revisions. | |
| You decide | Planner chooses least risky policy. | |

**User's choice:** Owner-only in v1.2.
**Notes:** Avoids public discovery, consent, and invite policy.

---

## Lock Timing

| Option | Description | Selected |
| --- | --- | --- |
| Lock on create | Snapshots lock immediately and jobs enqueue. | ✓ |
| Draft then submit | User reviews draft list before submit. | |
| Scheduled lock window | Entries stay open until a window closes. | |
| You decide | Planner chooses simplest lock behavior. | |

**User's choice:** Lock on create.
**Notes:** Clear, deterministic, and dispute-resistant.

---

## Preflight Validation

| Option | Description | Selected |
| --- | --- | --- |
| Strict preflight list | Block unless ownership, validity, compatibility, distinctness, and preset rules pass. | ✓ |
| Allow create, mark invalid entries failed | More forgiving but noisy. | |
| Minimal validation, rely on worker failures | Bad for trust. | |
| You decide | Planner chooses validation details. | |

**User's choice:** Strict preflight list.
**Notes:** Knowable invalidity should be caught before creation.

---

## Duplicate Rule

| Option | Description | Selected |
| --- | --- | --- |
| Distinct revision id required | Same revision id cannot appear twice; identical source hash across separate revisions allowed. | ✓ |
| Distinct source hash required | Blocks identical content across separate revisions. | |
| Allow duplicates with warning | Flexible but creates odd scoring. | |
| You decide | Planner picks duplicate semantics. | |

**User's choice:** Distinct revision id required.
**Notes:** Separate revisions with same source hash are allowed for alpha.

---

## Status Visibility

| Option | Description | Selected |
| --- | --- | --- |
| MatchSet status page with poll-to-refresh | Page shows accepted, queued, running, complete, degraded, failed. | ✓ |
| Inline Workshop status only | Simpler but weaker handoff. | |
| Live SSE/WebSocket updates | Too much infrastructure for v1.2. | |
| You decide | Planner chooses simplest status UX. | |

**User's choice:** MatchSet status page with polling.
**Notes:** Bridges naturally into Phase 17 result pages.

---

## Developer Seeding Path

| Option | Description | Selected |
| --- | --- | --- |
| Test-support/dev API only | Deterministic seeded MatchSets for tests and diagnostics, no public UI. | ✓ |
| Hidden admin/dev screen | Manual demos but admin-like UI. | |
| CLI script only | Good for automation, weaker browser E2E. | |
| You decide | Planner chooses from existing patterns. | |

**User's choice:** Test-support/dev API only.
**Notes:** Avoids admin product surface.

## the agent's Discretion

- Exact route names and page placement.
- Polling interval and status DTO shape.
- Form layout details.

## Deferred Ideas

- Open auto-matching queue.
- Multi-user competitions with public revision discovery.
- Fixture opponents in public UI.
- Draft/scheduled competitions.
