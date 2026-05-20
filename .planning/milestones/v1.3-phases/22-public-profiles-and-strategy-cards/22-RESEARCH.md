# Phase 22 Research: Public Profiles and Strategy Cards

## Findings

- v1.2 public result DTO leak checks should be reused and extended for profiles/cards.
- Public Strategy identity should show lineage, record, tags, hash, runtime, and replay/result links, but not source or private memory.
- Owner source/debug affordances should stay in account and Workshop paths.

## Decision

Add public profile/card DTO builders and routes backed by privacy-safe projections.

