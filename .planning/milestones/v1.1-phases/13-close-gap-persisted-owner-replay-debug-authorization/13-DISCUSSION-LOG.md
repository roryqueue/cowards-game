# Phase 13: Close Gap: Persisted Owner Replay Debug Authorization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-18
**Phase:** 13-close-gap-persisted-owner-replay-debug-authorization
**Areas discussed:** Owner Trust Source, Persisted Replay Debug UX, Failure-Mode E2E Proof, Verification Artifact Closure, Compatibility Alias Cleanup

---

## Owner Trust Source

| Option | Description | Selected |
| --- | --- | --- |
| Dev identity by player id | In development/test, trust `ownerPlayerId` only if it matches a Match participant. Simple and current-app-friendly, but explicitly not production auth. | |
| Workshop-linked owner links | Workshop Match results generate replay links with the relevant owner player id, and the server verifies that id is a participant before enabling owner debug. | |
| Test-support token only | Enable owner debug for persisted replays only through a test/dev-only signed or opaque token. Stronger boundary, heavier UX. | |
| Agent discretion | Let the planner pick the smallest safe version consistent with the current app. | ✓ |

**User's choice:** Agent discretion
**Notes:** Locked constraint: query parameters may request owner debug but must not establish trust by themselves.

---

## Persisted Replay Debug UX

| Option | Description | Selected |
| --- | --- | --- |
| Query opt-in only | Keep `?ownerDebug=1&ownerPlayerId=...` as the activation path; server verifies owner id before returning owner data. | |
| Workshop owner replay links | Workshop result links include the owner-debug query for the current player when a replay exists. | ✓ |
| Replay-page owner selector | Add a dev-only selector/toggle on the replay page for bottom/top owner views. Convenient locally, but more UI surface. | |
| Agent discretion | Let the planner choose the smallest complete UX path. | |

**User's choice:** Workshop owner replay links
**Notes:** This makes the closure a real user path instead of a hidden test hook. Public replay URLs still stay public by default elsewhere.

---

## Failure-Mode E2E Proof

| Option | Description | Selected |
| --- | --- | --- |
| Service-backed Workshop failure sample | Use a failure-mode sample in Workshop, submit/run it through the real worker path, open the persisted replay owner link, and assert an owner inactivity explanation appears. | |
| Lower-level persisted Match fixture | Seed or create a persisted runtime-failure Chronicle directly, then verify the owner replay route/UI. | |
| Both if cheap | Plan service-backed Workshop proof as must-have and allow lower-level persisted fixture tests as supporting coverage. | ✓ |
| Agent discretion | Let the planner choose best risk/effort balance. | |

**User's choice:** Both if cheap
**Notes:** Service-backed Workshop proof is the main target; lower-level persisted fixture coverage is acceptable to keep the gate stable and isolate behavior.

---

## Verification Artifact Closure

| Option | Description | Selected |
| --- | --- | --- |
| Generate formal verification files | Add `*-VERIFICATION.md` artifacts for phases 8-13 so the milestone audit contract is satisfied exactly. | ✓ |
| Accept VALIDATION as verification | Document that v1.1 uses `*-VALIDATION.md` as the formal verification artifact and update audit wording. | |
| Hybrid | Generate Phase 13 `13-VERIFICATION.md`, and add a milestone-level note accepting Phase 8-12 `*-VALIDATION.md` as equivalent evidence. | |
| Agent discretion | Let the planner choose the least noisy artifact closure. | |

**User's choice:** Generate formal verification files
**Notes:** Phase 13 should satisfy the audit contract exactly by generating `*-VERIFICATION.md` files.

---

## Compatibility Alias Cleanup

| Option | Description | Selected |
| --- | --- | --- |
| Document only | Keep aliases for now, but document them as compatibility surfaces with no current UI consumer. | ✓ |
| Remove aliases | Delete orphaned aliases if tests prove no consumers need them. | |
| Defer explicitly | Leave this out of Phase 13 and record as tech debt/backlog. | |
| Agent discretion | Let the planner decide after code inspection. | |

**User's choice:** Document only
**Notes:** Phase 13 should not remove aliases; it should document their status.

---

## the agent's Discretion

- Owner trust source implementation details, as long as query parameters do not establish trust and server-side verification gates persisted owner debug data.
- Exact helper names, DTO shape, and test split between service-backed E2E and lower-level persisted tests.

## Deferred Ideas

- Production-grade authentication and session ownership.
- Removing orphaned Workshop compatibility aliases.
- Competitive surfaces such as ranked ladders, tournaments, and public doctrine pages.
