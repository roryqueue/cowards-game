# Phase 37: Demo and Regression Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 37-Demo and Regression Verification
**Areas discussed:** Automated Regression Gates, Browser Verification, Documentation and Demo Report

---

## Automated Regression Gates

| Question | Option | Selected |
| --- | --- | --- |
| Privacy tests | Public DTO/page tests fail on private field exposure | ✓ |
| Privacy tests | Manual browser privacy review only | |
| Privacy tests | Rely on existing public DTOs | |
| Determinism tests | Identical gauntlet profile expansion/order/hash/projection/summary | ✓ |
| Determinism tests | Profile hash only | |
| Determinism tests | Manual evidence diff only | |
| Runtime isolation | Routes create jobs but never execute Strategy code in web/API | ✓ |
| Runtime isolation | Worker-only smoke test | |
| Runtime isolation | Manual code review only | |
| Blockers | Privacy, determinism, runtime isolation, and rule-version failures block completion | ✓ |
| Blockers | Record as caveats | |

**User's choice:** Applied recommended defaults from milestone requirements and project non-negotiables.
**Notes:** This phase should be a hard gate for trust regressions.

---

## Browser Verification

| Question | Option | Selected |
| --- | --- | --- |
| Coverage | Advanced Library, Strategy cards, MatchSets, tournament, profiles, replays | ✓ |
| Coverage | Tournament and replays only | |
| Coverage | Smoke test only | |
| Data state | Real completed v1.5 demo data | ✓ |
| Data state | Empty/scaffold states acceptable | |
| Link checks | Cross-link and privacy spot checks | ✓ |
| Link checks | Visual screenshots only | |
| Output | Local links and concise observations in verification summary | ✓ |
| Output | Screenshots only | |

**User's choice:** Applied recommended defaults.
**Notes:** Browser verification should prove the milestone works as a player-facing demo, not just as backend artifacts.

---

## Documentation and Demo Report

| Question | Option | Selected |
| --- | --- | --- |
| Docs timing | Required before milestone completion | ✓ |
| Docs timing | Defer to archive step | |
| Docs scope | Workshop tools, Advanced Library, evidence vocabulary, regeneration, links, framing | ✓ |
| Docs scope | README only | |
| Docs scope | Local report only | |
| Local report role | Canonical human-facing summary | ✓ |
| Local report role | Supplemental appendix | |
| Failure routing | Route stale links/evidence/docs/demo issues to owning phase and rerun | ✓ |
| Failure routing | Fix opportunistically in Phase 37 | |

**User's choice:** Applied recommended defaults.
**Notes:** The final phase should leave the milestone legible to a future reviewer.

---

## the agent's Discretion

- Exact test commands and browser viewport coverage.
- Exact verification summary filename and documentation update locations.
- Exact number of representative links beyond the required coverage.

## Deferred Ideas

None. This is the closing verification phase.
