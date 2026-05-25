# Phase 115 Research: Python Starter Strategy and Replay Proof

**Date:** 2026-05-25
**Status:** Complete

## Findings

- Workshop templates/samples are the most direct place to expose a Python starter without creating a marketing page.
- Existing Workshop test MatchSets can run a local revision against cautious/reckless JS/TS opponents and produce replayable evidence.
- Replay/public pages already render MatchSet and replay evidence; runtime labels may need to be surfaced in summaries.
- Board realism is covered by existing replay smoke patterns and topology checks.

## Risks

- A no-op Python starter would prove plumbing but look unrealistic.
- A tuned Python starter could imply competitive readiness.
- Public replay labels must not expose source or private runtime diagnostics.

## Recommended Tests

- Workshop static snapshot includes Python starter/template with experimental labels.
- E2E/page smoke validates Python edit -> validate -> submit -> non-counted MatchSet -> replay.
- Replay privacy and board-bounds tests cover the proof result.

