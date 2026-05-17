# Phase 6: Strategy Workshop UX - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-17
**Phase:** 6-Strategy Workshop UX
**Areas discussed:** Editor Workflow and Templates, Validation UX, Revision Submission and History, Workshop Test Matches, Local Identity and Persistence Assumptions

---

## Editor Workflow and Templates

| Option | Description | Selected |
|--------|-------------|----------|
| Single focused workbench | One primary screen with Monaco on the left, templates/revisions/validation/test controls around it. Fastest path and best for Phase 6 MVP. | ✓ |
| Tabbed Workshop | Separate tabs for Draft, Validate, Revisions, and Test Match. Cleaner mental model, but slightly more UI plumbing. | |
| Guided doctrine builder plus code editor | Users pick intent/options first, then edit generated code. Friendlier, but larger than Phase 6 needs. | |
| Code-first power user surface | Monaco dominates; templates are just starter files and everything else is compact. Good for early technical iteration. | |

**User's choice:** 1  
**Notes:** User accepted the recommended single focused workbench.

---

## Validation UX

| Option | Description | Selected |
|--------|-------------|----------|
| Live debounced validation plus manual validate button | The editor validates shortly after edits pause, with a button for explicit recheck. Balanced immediate feedback without twitchy UI. | ✓ |
| Manual validation only | User clicks Validate to run checks. Simpler and calmer, but easier to forget before submitting. | |
| Submit-gated validation | Validation mostly appears when the user tries to submit a revision. Minimal UI, weaker as an authoring aid. | |
| Strict validation dashboard | Full panel with categorized errors, compatibility versions, source hash, byte count, and forbidden pattern details always visible. | |

**User's choice:** 1  
**Notes:** Validation panel should show actionable errors first and advanced details in a compact secondary section.

---

## Revision Submission and History

| Option | Description | Selected |
|--------|-------------|----------|
| Submit valid draft as a new immutable revision with optional label/notes | Invalid drafts cannot submit. History shows label, created time, validity, source hash, byte count, and whether it has been used in a match. | ✓ |
| Auto-submit every valid draft snapshot | Convenient, but can flood history and make chosen revisions harder to reason about. | |
| Named releases only | User must name every revision and explicitly mark it as a release. Cleaner history, more ceremony. | |
| Draft plus compare-focused history | History emphasizes diffing current draft against previous revisions. Useful, but likely more than this phase needs. | |

**User's choice:** 1  
**Notes:** User accepted optional label/notes and immutable submitted revision history.

---

## Workshop Test Matches

| Option | Description | Selected |
|--------|-------------|----------|
| Quick test against bundled sample opponents | Pick current/selected revision, sample opponent, arena, and preset. UI shows queued/running/complete plus scoring summary when available. | ✓ |
| Test revision against another revision from history | Useful for regression testing own doctrines, but needs stronger revision picker. | |
| One-click smoke test only | Fastest MVP: selected revision vs default sample opponent on smoke preset. | |
| Full local matrix builder | Let users construct arbitrary revision/arena/seed matrices. Powerful, but belongs after the first Workshop loop. | |

**User's choice:** 1  
**Notes:** Future room remains for testing against another own revision.

---

## Local Identity and Persistence Assumptions

| Option | Description | Selected |
|--------|-------------|----------|
| Single local player, single active strategy, real persisted revisions | Keep identity simple as Local Player; focus on authoring, validation, revision history, and tests. | ✓ |
| Single local player, multiple named strategies | Adds a strategy list/sidebar so users can manage several doctrines. Useful, but expands scope. | |
| Lightweight profile setup | User chooses a display name before using Workshop. Nice polish, but not essential until multiplayer/community features. | |
| Database-backed strategy management now | Build fuller CRUD for users/strategies/revisions. Future-proof, heavier than this phase's loop. | |

**User's choice:** 1  
**Notes:** Real revision persistence should still be used so future phases can build naturally.

## the agent's Discretion

- Exact layout details, component boundaries, API route names, labels, and template wording.
- Initial number of bundled templates, provided they validate and demonstrate different doctrine styles.

## Deferred Ideas

- Full replay viewer and timeline/board inspection belong to Phase 7.
- Strict exhaustive Strategy grammar belongs after the Workshop and replay loops exist.
- Full local matrix builder, multiple named strategies, profile setup, broader strategy CRUD, and diff-heavy revision comparison are deferred.
