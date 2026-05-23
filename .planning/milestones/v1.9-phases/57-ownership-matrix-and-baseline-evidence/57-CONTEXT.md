---
phase: 57
slug: ownership-matrix-and-baseline-evidence
status: context
created: 2026-05-22
---

# Phase 57 Context — Ownership Matrix and Baseline Evidence

## Goal

Freeze the v1.9 ownership split and capture the starting boundary evidence before migrating additional web read/user surfaces behind `@cowards/service`.

## Decisions

- v1.9's production ownership move is service-backed web reads, not Go route expansion, production runtime promotion, or counted non-JS play.
- The active service migration sequence is public player profile, owner account reads, then public ladder season read.
- Go read-model expansion is future scope unless a later milestone selects a specific service-owned public DTO, generated parity fixtures, GET-only routing, topology checks, and rollback behavior.
- Runtime isolation in v1.9 is readiness criteria and guardrail evidence only. No adapter becomes the counted Match default.
- Python and other non-JS runtimes remain experimental and fail-closed for counted MatchSets, ladders, and gauntlets.

## Non-Negotiables

- Keep engine logic pure, deterministic, serializable, and side-effect free.
- Do not put game rules in React components, web route handlers, service DTO mappers, or Go handlers.
- Do not execute Strategy code in the web/API process.
- Do not use Node `vm` as a security boundary for hostile Strategy code.
- Public replay, service, Go, topology, monitor, analytics, export, and runtime outputs omit private Strategy/runtime data by default.

## Phase Output

- `.planning/artifacts/v1.9-ownership-boundary-matrix.md`
- `.planning/artifacts/v1.9-baseline-boundary-evidence.md`
- Phase validation proving baseline checks pass and the artifacts satisfy OWN-01 through OWN-04.
