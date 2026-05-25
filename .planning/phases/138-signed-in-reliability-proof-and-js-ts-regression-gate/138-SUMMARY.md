---
phase: 138
status: complete
requirements:
  - PROOF-01
  - PROOF-02
  - PROOF-03
  - PROOF-04
  - PROOF-05
  - PROOF-06
  - PROOF-07
files_modified:
  - apps/web/e2e/v1-20-reliability-proof.spec.ts
  - apps/go-backend/orchestrator.go
  - apps/go-backend/orchestrator_test.go
  - scripts/check-boundary-monitors.ts
  - .planning/artifacts/v1.20-signed-in-reliability-proof.json
  - .planning/artifacts/v1.20-signed-in-reliability-proof.md
---

# Phase 138 Summary

## Completed

- Added a gated v1.20 signed-in Playwright proof covering three bounded cycles.
- Each cycle creates a fresh local account, one JS/TS Strategy Revision, and two Python Strategy Revisions.
- Each cycle creates one mixed JS/TS-vs-Python and one Python-vs-Python non-counted exhibition MatchSet.
- The proof executes through the live Go backend and runtime service, opens MatchSet result and replay pages, checks evidence panels, scans public pages for private markers, and records observed public statuses and timings.
- Added machine-readable and human-readable proof artifacts:
  - `.planning/artifacts/v1.20-signed-in-reliability-proof.json`
  - `.planning/artifacts/v1.20-signed-in-reliability-proof.md`
- Fixed the Go job lease budget so runtime-service execution can validly complete under the documented 90s runtime-service HTTP budget.
- Extended boundary monitors to require the proof artifact, complete observed MatchSets, candidate evidence, conservative promotion decision, private marker scan, JS/TS regression flags, and Go lease-budget source/test coverage.

## Evidence

- Final signed-in proof passed in 5.1 minutes.
- The proof produced three cycles, six MatchSets, eighteen worker iterations, and all observed MatchSets/Matches complete.
- Runtime service adapter evidence was `container-subprocess`.
- Python remains non-counted exhibition beta only.
- Runtime isolation remains readiness evidence only; no production sandbox certification is claimed.

## Surprise

The most important finding was not a UI issue: Python-vs-Python reliability was being hurt by Go's 30s job lease, not by the deterministic per-Strategy caps. Aligning the lease with the runtime-service budget removed the degraded proof result without changing Strategy execution caps or moving ownership out of Go.
