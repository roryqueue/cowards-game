---
phase: 59
slug: owner-account-read-service-slice
status: context
created: 2026-05-22
---

# Phase 59 Context — Owner Account Read Service Slice

## Goal

Move account session snapshot and account Strategy Revision list reads behind service-owned DTOs while keeping mutations, source retrieval, submissions, and Strategy execution in their existing boundaries.

## Decisions

- Add owner-read service methods that derive identity from the session token, not caller-supplied user ids.
- Add a dedicated account read boundary under `apps/web/lib/account-service-*` rather than mixing owner reads into the public read helper.
- Migrate account page, auth session route, exhibition entry read setup, and the `GET` behavior of the account revisions route.
- Do not add the mixed account revisions route to strict import enforcement because its `POST` mutation intentionally remains on the existing competitive path.
- Add strict import enforcement for account page, auth session route, exhibition page, and the account read boundary closure.

## Out of Scope

- Account revision `POST`.
- Starter and Advanced fork routes.
- Owner source retrieval.
- Sign-in, sign-up, and sign-out mutations.
- Exhibition creation.
- Workshop save, validate, test, source, analytics rerun, and export flows.
- Go, runtime, Match orchestration, jobs, migrations, or engine changes.
