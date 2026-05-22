# Phase 39: Saved Gauntlet Profiles - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 39-Saved Gauntlet Profiles
**Areas discussed:** Profile Save Shape, Rerun Behavior, Comparison Experience, Failure and Status Semantics

---

## Profile Save Shape

| Option | Description | Selected |
| --- | --- | --- |
| Name/notes editable; test-defining fields immutable | Users can rename and annotate; changed deterministic inputs require a new profile. | ✓ |
| Editable draft, immutable run snapshot | Profile can be edited freely; each run stores a snapshot. |  |
| Versioned profile revisions | Editing deterministic inputs creates a new profile revision. |  |
| You decide | The agent chooses based on deterministic evidence model. |  |

**User's choice:** Name/notes editable; test-defining fields immutable.
**Notes:** Aligns saved profiles with strict compatibility from Phase 38.

| Option | Description | Selected |
| --- | --- | --- |
| Immutable opponent revision ids plus display snapshots | Store exact revision ids plus labels, hashes, tier, lineage, and tags. | ✓ |
| Only opponent revision ids | Resolve labels/tags from current data when displayed. |  |
| Full opponent public card snapshot | Store richer public card snapshots. |  |
| You decide | The agent chooses snapshot depth. |  |

**User's choice:** Immutable opponent revision ids plus display snapshots.
**Notes:** Candidate revisions follow the same pattern. Snapshot metadata is interpretive, not compatibility input.

| Option | Description | Selected |
| --- | --- | --- |
| Save from current gauntlet selection | User saves selected candidates/opponents/preset/profile name before running. |  |
| Save from completed ad hoc run | User saves exact inputs after a useful run. |  |
| Support both save-before-run and save-from-run | Both paths create the same immutable profile contract. | ✓ |
| You decide | The agent chooses creation flow. |  |

**User's choice:** Support both save-before-run and save-from-run.
**Notes:** Save-from-run preserves original run inputs, not current UI selections.

| Option | Description | Selected |
| --- | --- | --- |
| Account-owned only | Saved profiles require a signed-in account. |  |
| Account-owned plus local Workshop owner | Profiles can belong to accounts or `user:local`. | ✓ |
| Local-only for v1.6 | Profiles only support the local Workshop user. |  |
| You decide | The agent chooses ownership model. |  |

**User's choice:** Account-owned plus local Workshop owner.
**Notes:** Export authorization must work for both.

---

## Rerun Behavior

| Option | Description | Selected |
| --- | --- | --- |
| New immutable profile run | Every rerun creates a new run under the same profile. | ✓ |
| Replace latest run | Rerun overwrites current run summary. |  |
| Duplicate profile plus run | Every rerun clones the profile. |  |
| You decide | The agent chooses run model. |  |

**User's choice:** New immutable profile run. User also allowed auto-locking obvious immutability/history decisions for the rest of v1.6.
**Notes:** Runs are append-only history.

| Option | Description | Selected |
| --- | --- | --- |
| Block before creating a run | Preflight blockers prevent run/job creation. | ✓ |
| Create a failed run record | Store blocked attempts as failed runs. |  |
| Allow partial rerun | Run valid cells and mark invalid cells non-counted. |  |
| You decide | The agent chooses blocker behavior. |  |

**User's choice:** Block before creating a run.
**Notes:** No partial reruns.

| Option | Description | Selected |
| --- | --- | --- |
| Prevent duplicate active runs | One queued/running run per profile. | ✓ |
| Allow queued duplicate runs | Multiple reruns may queue. |  |
| Explicit confirmation | Warn but allow another run. |  |
| You decide | The agent chooses concurrency behavior. |  |

**User's choice:** Prevent duplicate active runs.
**Notes:** Enforced service-side.

| Option | Description | Selected |
| --- | --- | --- |
| One run owns one or more MatchSets | Run summary aggregates owned MatchSets. | ✓ |
| One run equals exactly one MatchSet | Simpler but limiting. |  |
| One run owns individual Matches directly | Bypasses MatchSet infrastructure. |  |

**User's choice:** One run owns one or more MatchSets.
**Notes:** Existing MatchSet/job infrastructure remains the execution path.

| Option | Description | Selected |
| --- | --- | --- |
| Profile schema version is part of compatibility | Schema-affecting changes make old/new runs incompatible unless migrated. | ✓ |
| Only game/runtime versions matter | Analytics schema changes do not affect comparison. |  |
| Best-effort migration | Try to migrate old metadata automatically. |  |

**User's choice:** Profile schema version is part of run compatibility.
**Notes:** Matches strict deterministic compatibility.

---

## Comparison Experience

| Option | Description | Selected |
| --- | --- | --- |
| Latest completed run default | Compare two most recent compatible completed runs, with manual selectors. | ✓ |
| Manual selection only | User always picks baseline/current. |  |
| Pin a baseline run | User marks one baseline per profile. |  |
| You decide | The agent chooses comparison selection. |  |

**User's choice:** Latest completed run default.
**Notes:** Manual selectors still support history.

| Option | Description | Selected |
| --- | --- | --- |
| Profile-run summary deltas only | Compare aggregate run metrics in Phase 39. | ✓ |
| Per-opponent deltas | Include opponent-level W-L-D/points/failures. |  |
| Full matchup matrix deltas | Include cell-level Strategy-opponent-side deltas. |  |

**User's choice:** Profile-run summary deltas only.
**Notes:** Heatmap/explorer details belong to Phases 40-41.

| Option | Description | Selected |
| --- | --- | --- |
| Structured mismatch checklist | Show typed mismatch rows and no delta. | ✓ |
| Short blocked banner | Compact incompatible message. |  |
| Compare with warnings | Show delta despite incompatibility. |  |

**User's choice:** Structured mismatch checklist.
**Notes:** No override path.

| Option | Description | Selected |
| --- | --- | --- |
| Run annotations only | Immutable generated labels plus optional owner notes. | ✓ |
| Generated run labels only | Timestamp/status only. |  |
| Rename runs freely | User can rename runs like profiles. |  |

**User's choice:** Run annotations only.
**Notes:** Run notes do not affect compatibility.

---

## Failure and Status Semantics

| Option | Description | Selected |
| --- | --- | --- |
| Separate profile status and run status | Profiles are definitions; runs are executions. | ✓ |
| Profile mirrors latest run status | Profile status follows latest run. |  |
| Run status only | Profiles have no lifecycle status. |  |

**User's choice:** Separate profile status and run status.
**Notes:** Archived profiles keep history.

| Option | Description | Selected |
| --- | --- | --- |
| Lifecycle + evidence terminal statuses | Single richer status vocabulary. |  |
| Lifecycle status plus flags | Core lifecycle plus evidence flags/rollups. | ✓ |
| Mirror MatchSet statuses only | Use existing MatchSet status vocabulary. |  |

**User's choice:** Lifecycle status plus flags.
**Notes:** Avoids one overloaded enum.

| Option | Description | Selected |
| --- | --- | --- |
| Strategy failure counts as Strategy evidence | Strategy and system failures remain separate. | ✓ |
| Both are failure evidence but visually separate | Both affect reliability but not attribution as sharply. |  |
| Neither counts in Phase 39 comparison | Show failures only in details. |  |

**User's choice:** Strategy failure counts as Strategy evidence.
**Notes:** User confirmed future similar taxonomy decisions can be auto-locked.

| Option | Description | Selected |
| --- | --- | --- |
| Replay-unavailable is an evidence flag | Run may complete with replay-unavailable counts. | ✓ |
| Replay-unavailable makes run degraded | Missing replay degrades whole run. |  |
| Replay-unavailable only per-Match detail | Do not surface at run level. |  |

**User's choice:** Replay-unavailable is an evidence flag.
**Notes:** It affects replay-backed confidence, not Strategy failure.

| Option | Description | Selected |
| --- | --- | --- |
| Archive only in v1.6 | Hide profiles from default lists while preserving history. | ✓ |
| Archive and hard delete | Allow permanent deletion. |  |
| No archive/delete in Phase 39 | Keep all profiles visible forever. |  |

**User's choice:** Archive only in v1.6.
**Notes:** Preserves evidence history and export references.

## the agent's Discretion

- Auto-lock future v1.6 decisions that clearly follow from immutability, deterministic history, privacy, strict compatibility, existing failure taxonomy, and runtime isolation.

## Deferred Ideas

None.
