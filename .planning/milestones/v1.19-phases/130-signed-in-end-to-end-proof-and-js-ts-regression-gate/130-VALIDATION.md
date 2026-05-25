---
phase: 130
status: passed-live
nyquist_compliant: true
---

# Phase 130 Validation

| Requirement | Status | Evidence |
|---|---|---|
| Signed-in account | COVERED | Proof created local account `v119-mplcarjr`. |
| One JS/TS revision | COVERED | Proof saved a JS/TS revision. |
| Two Python revisions | COVERED | Proof saved two Python revisions. |
| Mixed and Python-only exhibitions | COVERED | Mixed MatchSet `_JTOe4q1029KVGVggWhSSg` and Python-only MatchSet `h7g6X6EjzIkHhAJKGQmSMg` completed. |
| Runtime Broker path | COVERED | Proof ran Go internal jobs through runtime-service and registered runtime implementations. |
| Result/replay evidence | COVERED | Proof asserted both evidence panels and leak scans. |
| JS/TS regression | COVERED | Runtime-js and web focused tests passed. |

Live command passed:
- `RUN_V1_19_PROOF=1 PLAYWRIGHT_TEST=1 COWARDS_GO_BACKEND_URL=http://127.0.0.1:8087 COWARDS_GO_BACKEND_INTERNAL_TOKEN=v119-proof-token pnpm e2e v1-19-exhibition-proof.spec.ts --project=desktop --workers=1`
