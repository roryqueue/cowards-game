# Phase 23: Disputes and Competition Governance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19
**Phase:** 23-Disputes and Competition Governance
**Mode:** Abbreviated per user request after Phase 21.

## Recommended Decisions Accepted

- Users can flag MatchSet results with dispute notes.
- Flags create under-review state but do not immediately change standings.
- Admin review is minimal and result-focused.
- Admin can mark MatchSets invalid or non-competitive for standings.
- Evidence remains visible; standings exclude invalid/non-competitive MatchSets.
- Every decision writes immutable audit events.
- Public pages expose only public counted status and explanation.
- Admin actions require server-side authorization.

## Alternatives Not Pursued

- Broad admin platform.
- Automatic invalidation.
- Deleting invalid evidence.
- Public exposure of admin-only/private details.
- Ad hoc standings mutation.

## Deferred Ideas

- Automated abuse detection.
- Full support/moderation tooling.
- Organizations/roles beyond minimal admin authorization.
