# Phase 204 Context: Live Failure-Drill Harness

**Milestone:** v1.28 Match Execution Operations, Recovery, and Incident Drills
**Phase:** 204
**Status:** Context captured
**Date:** 2026-05-30

## Decisions

- Add a repeatable v1.28 operations proof command before broad live signed-in proof.
- Use the script to validate source markers, drill catalog coverage, frozen contract fixtures, private-marker scans, commands, and non-claims.
- Keep the harness local and deterministic; later phases can add deeper stale lease/interrupted MatchSet and browser signed-in proof.
- Do not add production runtime-service failure-injection hooks.

## Constraints

- The proof command writes artifacts and fails loudly when required markers or contract fixtures drift.
- The proof remains behind `match-execution-app-v1`.
- Public pages remain existing fixture/result/replay pages; no public operations UI is added.
