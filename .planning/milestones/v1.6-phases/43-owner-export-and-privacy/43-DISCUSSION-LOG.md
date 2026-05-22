# Phase 43: Owner Export and Privacy - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 43-Owner Export and Privacy
**Areas discussed:** Export Scope, Authorization Model, CSV Safety, Export UI Framing

---

## Export Scope

| Option | Description | Selected |
| --- | --- | --- |
| Complete owner-safe summary | Full safe JSON with profile/run/provenance/matchup/evidence/reference layers. | ✓ |
| Compact summary only | Smaller JSON with profile/run, aggregate, matchup, evidence, links. |  |
| Compact and detailed modes | User chooses export depth. |  |

**User's choice:** Complete owner-safe JSON summary.
**Notes:** Summary-oriented, no raw private runtime/replay artifacts.

| Option | Description | Selected |
| --- | --- | --- |
| Matchup records CSV only | One row per Strategy-opponent matchup record. | ✓ |
| Matchup CSV + Match-level CSV | Add one row per Match as second CSV. |  |
| Multiple normalized CSVs | Profiles, runs, MatchSets, Matches, replay references, etc. |  |

**User's choice:** Matchup records CSV only.
**Notes:** JSON carries richer structure; Match-level CSV deferred.

---

## Authorization Model

| Option | Description | Selected |
| --- | --- | --- |
| Local Workshop export only in local/dev | `user:local` can export in demo/dev; production-like flows require authenticated owner. | ✓ |
| Anyone can export `user:local` profiles | Treat local profiles as public local data. |  |
| No `user:local` export | Only authenticated account profiles export. |  |

**User's choice:** Local Workshop export only in local/dev mode.
**Notes:** Prevents `user:local` as production anonymous export loophole.

| Option | Description | Selected |
| --- | --- | --- |
| Ordinary authenticated owner endpoints | Server checks owner/session/local-dev and returns JSON/CSV directly. | ✓ |
| Signed time-limited export URLs | Generate short-lived download URLs. |  |
| Pre-generated stored files | Generate and store export files. |  |

**User's choice:** Ordinary authenticated owner endpoints.
**Notes:** No stored export files or signed URL system in v1.6.

---

## CSV Safety

| Option | Description | Selected |
| --- | --- | --- |
| Neutralize formula-leading text | Transform user-controlled text starting with dangerous spreadsheet prefixes. | ✓ |
| Escape according to CSV only | Standards-pure CSV quoting without formula neutralization. |  |
| Omit user-controlled text fields | Avoid labels/notes in CSV. |  |

**User's choice:** Neutralize formula-leading user-controlled text.
**Notes:** JSON preserves original safe text; CSV may transform spreadsheet-dangerous display text.

---

## Export UI Framing

| Option | Description | Selected |
| --- | --- | --- |
| Compact inline privacy note | Short note near export buttons explaining summary-only exclusions. | ✓ |
| Modal confirmation every export | Confirm contents/privacy on every export. |  |
| Documentation only | Explain privacy only in docs. |  |

**User's choice:** Compact inline privacy note.
**Notes:** No repeated modal in v1.6.

| Option | Description | Selected |
| --- | --- | --- |
| Profile run summary and Evidence Explorer | Export controls where users study owned evidence. | ✓ |
| Only profile settings/history | Export from management screens only. |  |
| Every heatmap/explorer surface | Export buttons everywhere. |  |

**User's choice:** Saved profile run summary and Evidence Explorer.
**Notes:** Avoid noisy repeated controls.

## the agent's Discretion

- Auto-lock choices clearly implied by owner-safe summary exports, privacy boundaries, server-side authorization, CSV safety, and non-durable evidence framing.

## Deferred Ideas

- Match-level CSV exports.
- Signed/time-limited links.
- Stored/generated export files.
