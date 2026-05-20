# Phase 20: Trial Ladder Season Model - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19
**Phase:** 20-Trial Ladder Season Model
**Areas discussed:** Season Lifecycle Shape, Entry Locking and Withdrawal, Stale Revision Policy, Public Season Contract, Operator Controls

---

## Season Lifecycle Shape

| Option | Description | Selected |
| --- | --- | --- |
| Full explicit lifecycle | draft/pending, open, scheduling, active, completed, archived. | ✓ |
| Simple lifecycle | open, active, completed, archived. |  |
| Entry-focused lifecycle | not-open, accepting-entries, locked, results-posted, archived. |  |
| Flexible beta states | Broad states plus metadata. |  |

**User's choice:** Full explicit lifecycle with warmer player-facing labels.
**Notes:** Preparing, Open for entries, Scheduling matches, Matches running, Complete, Archived.

| Option | Description | Selected |
| --- | --- | --- |
| Developer/admin only | Operator-controlled transitions. | ✓ |
| Mostly automated | Time windows or jobs move seasons. |  |
| Hybrid manual plus optional scheduled transitions | Windows with manual override. |  |
| System-only hidden transitions | App moves states based on entries/MatchSets. |  |

**User's choice:** Developer/admin controlled in v1.3.
**Notes:** Data model should leave room for scheduled windows later.

| Option | Description | Selected |
| --- | --- | --- |
| Optional schedule metadata | Store optional timestamps without driving transitions. | ✓ |
| Required schedule windows | Every season has open/close dates. |  |
| No season dates beyond created/updated | Simpler but vague. |  |
| Human-readable schedule text only | Flexible but weak for future scheduling. |  |

**User's choice:** Optional schedule metadata.
**Notes:** open/close/scheduled-at/completed-at timestamps are display/future automation data.

| Option | Description | Selected |
| --- | --- | --- |
| Stay open with visible minimum | No scheduling until enough entries. | ✓ |
| Allow small partial season | Run tiny seasons. |  |
| Auto-close as failed/cancelled | Harsh. |  |
| Convert to exhibition MatchSet | Blurs ladder/exhibition. |  |

**User's choice:** Stay open with visible minimum.
**Notes:** No eligible pod, no ladder scheduling.

---

## Entry Locking and Withdrawal

| Option | Description | Selected |
| --- | --- | --- |
| Locked on accepted entry | Snapshot fixed immediately. | ✓ |
| Locked when scheduling starts | More flexible. |  |
| Locked when first MatchSet is generated | Race-prone. |  |
| Locked only per MatchSet | Not aligned with one active revision. |  |

**User's choice:** Locked on accepted entry.
**Notes:** Entry should feel like a deliberate submission.

| Option | Description | Selected |
| --- | --- | --- |
| Withdraw future scheduling only | Preserve scheduled/completed evidence. | ✓ |
| No withdrawal in v1.3 | Strict. |  |
| Full withdrawal before scheduling | More forgiving. |  |
| Admin-mediated withdrawal only | Heavy. |  |

**User's choice:** Withdraw future scheduling only.
**Notes:** Safety valve, not history rewrite.

| Option | Description | Selected |
| --- | --- | --- |
| Visible but neutral | Public, non-punitive status. | ✓ |
| Hidden from public season page | Cleaner but confusing. |  |
| Admin-only | Less transparent. |  |
| Prominent status | Clear but punitive. |  |

**User's choice:** Visible but neutral.
**Notes:** Existing MatchSets may still reference entrant.

| Option | Description | Selected |
| --- | --- | --- |
| No re-entry this season | Withdrawal final. | ✓ |
| Re-enter same snapshot only | More flexible. |  |
| Admin reinstatement only | Safety valve. |  |
| Cooldown re-entry | Too close to replacement complexity. |  |

**User's choice:** No re-entry this season.
**Notes:** User can enter future seasons.

---

## Stale Revision Policy

| Option | Description | Selected |
| --- | --- | --- |
| No effect this season | Keep locked snapshot. | ✓ |
| Mark as superseded but still active | More transparent/noisy. |  |
| Withdraw automatically | Too punitive. |  |
| Allow replacement before scheduling | Conflicts with replacement policy. |  |

**User's choice:** Newer revisions have no effect this season.
**Notes:** New revisions are for exhibitions or future seasons.

| Option | Description | Selected |
| --- | --- | --- |
| Entry snapshot remains, public source stays hidden | Preserve evidence. | ✓ |
| Withdraw from future scheduling | Could be abused. |  |
| Invalidate entry | Too harsh. |  |
| Admin review required | Heavy for normal hide/delete. |  |

**User's choice:** Deleting/hiding does not remove locked snapshot.
**Notes:** Explicit withdrawal is separate.

| Option | Description | Selected |
| --- | --- | --- |
| Block future scheduling, preserve existing evidence | Compatibility-aware. | ✓ |
| Continue using old compatibility forever | Reproducible but unsafe. |  |
| Invalidate the entry entirely | Destructive. |  |
| Force user to submit replacement | Conflicts with replacement policy. |  |

**User's choice:** Compatibility changes block future scheduling but preserve existing evidence.
**Notes:** Existing evidence counted/non-counted by result validity.

| Option | Description | Selected |
| --- | --- | --- |
| Model status, defer judgment to governance | Statuses here, workflow later. | ✓ |
| Auto-invalidate entry and all results | Too much policy. |  |
| Withdraw future scheduling only | Possibly too weak. |  |
| Admin-only hidden flag | Not transparent enough. |  |

**User's choice:** Model policy-invalid/abusive states, defer judgment to Phase 23.
**Notes:** Need statuses like suspended/invalidated.

---

## Public Season Contract

| Option | Description | Selected |
| --- | --- | --- |
| Rules and entries | State, rules, policies, counts, entries. | ✓ |
| Rules only | Cleaner but less transparent. |  |
| Entries only after scheduling | Avoids scouting but opaque. |  |
| Full pre-season lobby | Too broad. |  |

**User's choice:** Public season page shows rules and entries before scheduling.
**Notes:** No source or private runtime/debug data.

| Option | Description | Selected |
| --- | --- | --- |
| Handle + Strategy card metadata | Handle, name, tags, revision hash, status. | ✓ |
| Handle only | Less meaningful. |  |
| Anonymous until scheduling | Weakens public loop. |  |
| Full public Strategy profile preview | Belongs to Phase 22. |  |

**User's choice:** Handle plus Strategy metadata.
**Notes:** Rich cards wait until Phase 22.

| Option | Description | Selected |
| --- | --- | --- |
| Explicit season copy | Say standings reset and are not permanent ratings. | ✓ |
| Implied through season naming | Too subtle. |  |
| Tooltip/help text only | Easy to miss. |  |
| No explanation | Risky assumption. |  |

**User's choice:** Explicit resettable-not-permanent copy.
**Notes:** Plain copy, not just naming/tooltips.

| Option | Description | Selected |
| --- | --- | --- |
| Yes, public counts only | Total entries and minimum threshold. | ✓ |
| Yes, with full entry list | More than needed. |  |
| No counts | Users do not know why scheduling waits. |  |
| Admin-only counts | Bad for trust. |  |

**User's choice:** Public entry counts and minimum scheduling threshold.
**Notes:** No private/debug details.

---

## Operator Controls

| Option | Description | Selected |
| --- | --- | --- |
| Lifecycle controls only | Create/edit/open/scheduling/active/complete/archive. |  |
| Lifecycle plus entry status controls | Add suspend/restore style entry states. | ✓ |
| Lifecycle plus scheduling trigger | Belongs to Phase 21. |  |
| Broad beta admin controls | Too wide. |  |

**User's choice:** Lifecycle plus narrow entry status controls.
**Notes:** No dispute or broad admin workflow in Phase 20.

| Option | Description | Selected |
| --- | --- | --- |
| Minimal audit events | Actor, timestamp, target, before/after, reason. | ✓ |
| No audit until Phase 23 | Weak trust trail. |  |
| Full audit log UI now | Belongs to Phase 23. |  |
| Database-only timestamps | Insufficient. |  |

**User's choice:** Minimal audit events.
**Notes:** Phase 23 can build richer UI.

| Option | Description | Selected |
| --- | --- | --- |
| Required for status changes | Short reason for nontrivial changes. | ✓ |
| Optional reason field | Less friction. |  |
| Preset reasons only | Too rigid. |  |
| Preset + freeform | More UI/model work. |  |

**User's choice:** Required short freeform reason for nontrivial changes.
**Notes:** Presets can wait.

| Option | Description | Selected |
| --- | --- | --- |
| No result invalidation or dispute review | Phase 23. | ✓ |
| No entry deletion | Preserve evidence. | ✓ |
| No force replacement | Preserve replacement policy. | ✓ |
| All of the above | Clean trustable model. | ✓ |

**User's choice:** All of the above.
**Notes:** Operators cannot rewrite evidence or swap revisions.

## the agent's Discretion

- Choose enum names preserving locked semantics.
- Choose exact minimal operator UI/API.
- Decide which status changes require reasons, with public lifecycle and entry status changes requiring them.

## Deferred Ideas

- Automatic time-window transitions.
- Scheduling trigger and MatchSet generation.
- Result invalidation and dispute review.
- Rich public Strategy cards/profiles.
- Preset operator reasons.
