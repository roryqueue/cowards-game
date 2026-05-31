# Phase 212 Plan: Discovery Read Requirements and Boundary Design

## Tasks

1. Define separate public discovery DTOs for home, watch, competition index/detail, and signed-in entry.
2. Add schema tests proving the DTOs validate independently and remain leak-safe.
3. Add a web discovery service boundary that composes existing public-safe reads without changing execution DTOs.
4. Preserve an explicit `not-match-execution-app-v1` boundary marker.

## Verification

- Spec tests for public discovery DTOs.
- Web tests for discovery service empty/entry states.
- Boundary monitor for import and contract drift.
