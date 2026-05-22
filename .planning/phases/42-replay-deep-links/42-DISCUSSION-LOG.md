# Phase 42: Replay Deep Links - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 42-Replay Deep Links
**Areas discussed:** Moment Selection Rules, URL Shape and Replay Startup, Fallback Behavior, Owner Debug Separation

---

## Moment Selection Rules

| Option | Description | Selected |
| --- | --- | --- |
| First meaningful occurrence | Earliest public sequence satisfying the moment rule. |  |
| Most consequential occurrence | Pick moment most associated with outcome change/material swing. |  |
| Type-specific deterministic rule | Each moment type has a deterministic selection rule. | ✓ |

**User's choice:** Type-specific deterministic rules.
**Notes:** Balances usefulness with deterministic explainability.

| Option | Description | Selected |
| --- | --- | --- |
| Conservative detection | Emit derived moments only when public projection clearly supports them. | ✓ |
| Best-effort detection | Emit likely moments from ambiguous public patterns. |  |
| Only raw event moments in v1.6 | Defer derived moments. |  |

**User's choice:** Conservative detection.
**Notes:** Missing derived moments are not errors.

---

## URL Shape and Replay Startup

| Option | Description | Selected |
| --- | --- | --- |
| Query params | `/matches/[matchId]/replay?moment=BACKSTAB&sequence=42`. | ✓ |
| Fragment/hash | `/matches/[matchId]/replay#moment=BACKSTAB&sequence=42`. |  |
| Path segment | `/matches/[matchId]/replay/moments/BACKSTAB/42`. |  |

**User's choice:** Query params.
**Notes:** Allows replay page to initialize correctly on load/reload.

| Option | Description | Selected |
| --- | --- | --- |
| Initial sequence set before playback | Open focused at target sequence, no autoplay. | ✓ |
| Auto-play from shortly before target | Start before target and play into it. |  |
| Jump to target but keep playback state | Preserve current playback if already playing. |  |

**User's choice:** Initial sequence set before playback.
**Notes:** Study-oriented, no surprise autoplay.

---

## Fallback Behavior

| Option | Description | Selected |
| --- | --- | --- |
| Open Match start with fallback notice | Public replay opens at start and explains target unavailable. | ✓ |
| Open nearest available sequence | Jump as close as possible to requested target. |  |
| Show replay unavailable page | Treat missing target as failure. |  |

**User's choice:** Open Match start with visible fallback notice.
**Notes:** Safe reason categories only.

| Option | Description | Selected |
| --- | --- | --- |
| Omit absent moment types | No link when no representative moment exists. |  |
| Show unavailable placeholder in details | Detail surfaces can show not found; heatmap omits. | ✓ |
| Always show all moment types | Every view lists all six moment types. |  |

**User's choice:** Show unavailable placeholders only in detail surfaces where useful.
**Notes:** Missing moment is not a system failure.

---

## Owner Debug Separation

| Option | Description | Selected |
| --- | --- | --- |
| Stay public unless owner toggles debug | Public link opens public targeted moment; owner can switch modes. | ✓ |
| Automatically open owner debug when authorized | Owner sees private debug immediately. |  |
| Prompt owner to choose on load | Interrupt with public/debug choice. |  |

**User's choice:** Stay public unless owner explicitly toggles debug.
**Notes:** Public link semantics remain reproducible and owner debug remains server-authorized.

## the agent's Discretion

- Auto-lock choices clearly implied by deterministic public projections, privacy, strict fallback semantics, and owner-debug authorization boundaries.

## Deferred Ideas

None.
