---
phase: 63
slug: milestone-verification-and-regression-gate
status: context
created: 2026-05-22
---

# Phase 63 Context — Milestone Verification and Regression Gate

## Goal

Prove v1.9 is releasable by running the ownership-split verification set across service contracts, import boundaries, Go parity, runtime guardrails, topology, package tests, typecheck, and browser replay privacy smoke tests.

## Decisions

- Treat Phase 63 as the v1.9 release gate, not as a new ownership expansion.
- Verify the chosen service-backed web read/user move without adding Go route ownership, Go writes, production sandbox promotion, or counted non-JS play.
- Include `pnpm boundary:monitors` because it composes contract generation/lint, strict import enforcement, Go parity, sandbox evaluation, topology, privacy monitors, runtime isolation guardrails, and non-JS guardrails.
- Include `pnpm test`, `pnpm typecheck`, and `pnpm e2e:smoke` to cover package-level regression and browser replay behavior.
- Fix only verification drift discovered by the gate; do not broaden product scope.

## Out of Scope

- New service route migrations.
- Go read-model route expansion or any Go mutation/write ownership.
- Production runtime sandbox promotion.
- Counted non-JS play.
- Replay model/schema changes beyond correcting stale test expectations.
- Workshop source/save/submit/test execution migration.
