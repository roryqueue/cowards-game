# Phase 137 UI Spec

**Status:** Ready for implementation
**Date:** 2026-05-25

## Surface

Enhance the existing MatchSet and replay evidence panels. Do not add a new page, modal, or diagnostic drawer.

## Content

- MatchSet evidence panel rows: status, retry policy, timeout budget, runtime evidence, candidate lane, proof limits, entrants, privacy.
- Replay evidence panel rows: status, timeout budget, candidate lane, runtime evidence, privacy.
- Status wording covers queued/running/slow, complete, degraded, failed, strategy-failed, system-failed, blocked, and pending outcomes where the public DTO can distinguish them.

## Copy Rules

- Explain retry/no-retry as product behavior: Strategy failures are terminal evidence; retryable system failures are Go-owned job behavior while attempts remain.
- Keep candidate wording honest: Docker/container is readiness evidence, not production sandbox certification.
- Use public-safe categories only. Do not show Strategy source, private memory, objective payloads, env values, raw streams, stderr, stack traces, tokens, DB details, host path values, package paths, or private runtime internals.

## Layout

- Use the existing compact definition-list style.
- Keep text short enough for mobile wrapping.
- Use existing chips and panel styles.
