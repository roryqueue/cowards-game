# Phase 17: Result Pages and Replay Evidence - Research

**Date:** 2026-05-19
**Status:** Complete

## Findings

- Replay pages already enforce public vs owner projection boundaries.
- Workshop status UI already displays MatchSet scoring and replay links, but not a public result evidence surface.
- Result pages should be built from a projected DTO rather than raw database rows to preserve privacy guarantees.

## Implementation Direction

1. Add public MatchSet result DTO/service.
2. Render standings first, evidence ledger below.
3. Include compact provenance and replay links.
4. Add owner-only links/actions only when server-authorized.
5. Add privacy leak tests for public result DTOs.

