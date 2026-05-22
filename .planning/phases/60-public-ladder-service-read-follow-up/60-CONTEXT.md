---
phase: 60
slug: public-ladder-service-read-follow-up
status: context
created: 2026-05-22
---

# Phase 60 Context — Public Ladder Service Read Follow-Up

## Goal

Move the selected public ladder season page read behind `@cowards/service` while keeping Go expansion, ladder writes, Match orchestration, jobs, migrations, persistence writes, and Strategy execution out of scope.

## Decisions

- Select the public ladder season read as the only active v1.9 follow-up read boundary after public player profile and owner account reads.
- Add a public ladder page service envelope to the canonical service contract and regenerate the public OpenAPI artifact.
- Preserve the existing public ladder DTO behavior from persistence, including standings, entries, MatchSet links, counted-state explanations, no-permanent-ratings policy, `seasonSeed`, and public entrant owner ids already exposed by current public DTOs.
- Keep Go parity routes unchanged at four read-only routes; no public ladder route is added to Go in Phase 60.
- Remove only the old public ladder read from `competitiveServer`; ladder entry, schedule, status, withdraw, governance, auth, and other mutation paths remain in the existing web ownership boundary.
- Add the ladder page to strict service-boundary import enforcement and reduce broad web report-only debt.

## Out of Scope

- Go route expansion or Go parity fixtures for the public ladder season.
- Ladder entry, schedule, status, withdraw, admin, or governance mutations.
- Auth/session mutation.
- Match orchestration, job claiming, migrations, persistence writes, or Strategy execution.
- Runtime isolation promotion or non-JS counted-play promotion.
- Rule, engine, Chronicle, scoring, replay, or deterministic runtime behavior changes.
