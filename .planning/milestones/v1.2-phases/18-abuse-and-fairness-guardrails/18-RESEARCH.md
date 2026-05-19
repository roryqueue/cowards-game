# Phase 18: Abuse and Fairness Guardrails - Research

**Date:** 2026-05-19
**Status:** Complete

## Findings

- Runtime-js and worker layers already distinguish Strategy-side violations from system failures.
- Persistence already tracks job attempts and `failed_system`/`degraded` states.
- Public result DTOs are new privacy surfaces and need explicit golden leak tests beyond replay privacy tests.

## Implementation Direction

1. Add per-user rate-limit checks for exhibition creation.
2. Add active duplicate guard by creator, preset, and normalized revision-id set.
3. Add public penalty categories and scoring support for Strategy failures.
4. Add strict valid-result checks.
5. Add golden leak tests for public result DTOs.

