---
phase: 62
slug: experimental-non-js-runtime-guardrails
status: context
created: 2026-05-22
---

# Phase 62 Context — Experimental Non-JS Runtime Guardrails

## Goal

Make non-JS promotion criteria explicit while keeping Python and other non-JS runtimes experimental, non-counted, and fail-closed for counted MatchSets, ladders, and gauntlets.

## Decisions

- Add a spec-owned non-JS runtime support policy.
- Add spec-owned non-JS promotion criteria covering deterministic semantics, sandboxing, package policy, Workshop UX/docs, compatibility, counted eligibility, replay/export privacy, rollback, and deprecation.
- Keep Python `enabledForNormalPlay: false`, `countedResultsAllowed: false`, readiness `experimental`, and isolation promotion state `evidence-only`.
- Allow existing user-facing runtime labels to say "Experimental" and "Not counted".
- Do not add a public language picker or imply Python support parity.
- Extend boundary monitors to fail on accidental non-JS counted eligibility or unsupported promotion.

## Out of Scope

- Counted Python or other non-JS MatchSets, ladders, gauntlets, analytics comparisons, or standings.
- Public language picker or package ecosystem.
- Python package installation or dependency support.
- Production hostile-code sandbox promotion.
- Web/API Strategy execution.
- Backend ownership changes.
