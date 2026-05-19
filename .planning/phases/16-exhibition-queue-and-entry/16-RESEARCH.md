# Phase 16: Exhibition Queue and Entry - Research

**Date:** 2026-05-19
**Status:** Complete

## Findings

- Workshop UI already has revision lists, preset selection, launch test controls, status summaries, and replay links.
- A manual create-exhibition flow can reuse current MatchSet creation concepts without introducing open queue scheduling.
- Strict preflight should happen before MatchSet creation because ownership, revision validity, compatibility, and duplicate revision ids are knowable.

## Implementation Direction

1. Add account revision list/source APIs.
2. Add manual exhibition create API for 2-8 owned revisions.
3. Add status/result page handoff with polling.
4. Keep seeded developer MatchSets behind test-support/dev API.

