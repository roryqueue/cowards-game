# Requirements: Coward's Game v1.2 Competitive Alpha

**Defined:** 2026-05-19
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## v1.2 Requirements

Requirements for Competitive Alpha. Each maps to roadmap phases.

### Competitive Ownership

- [ ] **OWN-01**: User can create an account with username, password, display name, and handle.
- [ ] **OWN-02**: User can sign in, maintain a session across browser refresh, and sign out.
- [ ] **OWN-03**: User identity is stable and attached to submitted Strategy Revisions.
- [ ] **OWN-04**: User can submit Strategy Revisions only through session-backed authorization.
- [ ] **OWN-05**: User can enter only Strategy Revisions they own into competitive MatchSets.
- [ ] **OWN-06**: Owner-only Strategy source and replay debug data require server-side ownership checks.
- [ ] **OWN-07**: Persisted competitive flows no longer rely on `player:workshop-local` as the owner identity.

### MatchSet Competition Model

- [ ] **COMP-01**: Developer can define competition presets for unranked exhibition and seeded MatchSet play.
- [ ] **COMP-02**: Developer can represent entrants, seats, Strategy Revision snapshots, Match composition, scoring policy, tie-breakers, visibility, and publication policy as explicit MatchSet contracts.
- [ ] **COMP-03**: MatchSet entry stores immutable Strategy Revision snapshots with revision identifiers, content hashes, runtime compatibility, and owner references without copying private source into public results.
- [ ] **COMP-04**: MatchSet execution uses locked Strategy Revision snapshots even if an owner submits a newer revision afterward.
- [ ] **COMP-05**: MatchSet contracts define stale revision behavior for deleted, superseded, incompatible, or owner-withdrawn revisions.
- [ ] **COMP-06**: Scoring policy deterministically handles wins, losses, draws, STONE, FALLEN, runtime strategy failures, and no-result Matches.
- [ ] **COMP-07**: Tie-breakers are deterministic, visible in result breakdowns, and independent of wall-clock time or database row order.
- [ ] **COMP-08**: Result publication rules distinguish public replay evidence from private Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, and runtime internals.

### Exhibition Queue

- [ ] **EXH-01**: User can submit an owned immutable Strategy Revision into a small public unranked exhibition MatchSet.
- [ ] **EXH-02**: Developer can seed a competitive MatchSet from selected owned or fixture Strategy Revisions.
- [ ] **EXH-03**: Exhibition queue creates valid MatchSets only when preset entrant count, compatibility, ownership, and visibility rules are satisfied.
- [ ] **EXH-04**: User can inspect competitive submission status from accepted through queued, running, complete, degraded, or failed.
- [ ] **EXH-05**: User can enter multiple owned Strategy Revisions into the same exhibition MatchSet to test them against each other.
- [ ] **EXH-06**: Exhibition queue rejects exact duplicate snapshots or incompatible entries with clear messages before execution begins.

### Results and Replay Evidence

- [ ] **RES-01**: Public MatchSet result page shows preset, entrants, status, standings, scores, and publication metadata.
- [ ] **RES-02**: Public MatchSet result page shows scoring breakdowns, penalties, degraded Matches, failed Matches, and tie-breaker explanations.
- [ ] **RES-03**: Public MatchSet result page links each completed Match to replay evidence generated from the persisted Chronicle.
- [ ] **RES-04**: Public replay evidence includes provenance for MatchSet id, Match id, preset id, scoring policy version, engine version, Chronicle hash, and Strategy Revision snapshot identifiers.
- [ ] **RES-05**: Public result and replay pages do not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid details, owner debug, or private runtime internals by default.
- [ ] **RES-06**: Authorized owners can still inspect their private Strategy source and owner debug data through server-side checks without changing public result output.

### Abuse and Fairness Guardrails

- [ ] **FAIR-01**: Competitive submission endpoints enforce basic per-user rate limits and return clear retry guidance.
- [ ] **FAIR-02**: Competitive submission policy detects exact duplicate Strategy Revision snapshots by preset and active MatchSet window while allowing multiple distinct Strategy Revisions from the same owner in alpha exhibition play.
- [ ] **FAIR-03**: Runtime strategy failures receive deterministic competitive penalties without converting system failures into player losses.
- [ ] **FAIR-04**: Sandbox, worker, and orchestration failures are classified as strategy failure, system failure, degraded result, or invalid result before publication.
- [ ] **FAIR-05**: Valid competitive result criteria require compatible presets, immutable entrants, complete scoring evidence, public replay-safe projections, and no unresolved system failures.
- [ ] **FAIR-06**: Developer can run tests proving duplicate prevention, rate limits, failure penalties, result validity checks, and public privacy gates.

## Future Requirements

Deferred to a later milestone.

### Ranked Competition

- **RANK-01**: User can enter Strategy Revisions into ranked ladders with durable ratings.
- **RANK-02**: User can participate in scheduled tournaments with bracket or round-robin formats.
- **RANK-03**: User can inspect historical ladder movement and rating explanations.
- **RANK-04**: Real competitive formats can enforce one Strategy entry per user when rankings, prizes, or durable competitive standing are introduced.

### Production Accounts

- **ACCT-01**: User can verify email ownership.
- **ACCT-02**: User can reset a forgotten password.
- **ACCT-03**: User can use OAuth or passkey sign-in.
- **ACCT-04**: Admin can moderate abusive accounts, handles, and competitive submissions.

### Runtime and Arena Expansion

- **RUNTIME-01**: Developer can run production-grade container, microVM, or WASM/WASI sandboxing for hostile Strategy code.
- **ARENA-01**: User can compete on custom or generated Arena Variants after replay compatibility and preset policy are stable.

## Out of Scope

Explicitly excluded from v1.2. Documented to prevent scope creep.

| Feature | Reason |
| --- | --- |
| Ranked ladders and durable ratings | v1.2 proves scoring, replay evidence, failure policy, and privacy on unranked exhibition surfaces before ratings become durable. |
| Public tournaments | Tournament operations depend on stable competition policy, moderation, scheduling, and abuse controls beyond this alpha. |
| Email verification, password reset, OAuth, passkeys, and account recovery | Competitive Alpha needs stable session ownership, not a full account lifecycle. |
| Enterprise roles or organizations | Single-user ownership is enough for Strategy ownership and competitive entry. |
| Strategy marketplace or public doctrine pages | Publishing Strategy identities and profiles raises privacy, abuse, and IP concerns outside this milestone. |
| One Strategy per user in a competition | v1.2 intentionally allows one user to self-play multiple owned Strategy Revisions; stricter entry limits belong with ranked or more formal competition. |
| Production-grade runtime sandbox replacement | v1.2 keeps the hardened runtime boundary and failure taxonomy; stronger isolation remains future runtime work. |
| Custom or randomized maps | New arenas would expand compatibility and fairness complexity while competition policy is still being proven. |
| Live human input or live model inference during Matches | Violates deterministic autonomous Match play. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
| --- | --- | --- |
| OWN-01 | Phase 14 | Pending |
| OWN-02 | Phase 14 | Pending |
| OWN-03 | Phase 14 | Pending |
| OWN-04 | Phase 14 | Pending |
| OWN-05 | Phase 14 | Pending |
| OWN-06 | Phase 14 | Pending |
| OWN-07 | Phase 14 | Pending |
| COMP-01 | Phase 15 | Pending |
| COMP-02 | Phase 15 | Pending |
| COMP-03 | Phase 15 | Pending |
| COMP-04 | Phase 15 | Pending |
| COMP-05 | Phase 15 | Pending |
| COMP-06 | Phase 15 | Pending |
| COMP-07 | Phase 15 | Pending |
| COMP-08 | Phase 15 | Pending |
| EXH-01 | Phase 16 | Pending |
| EXH-02 | Phase 16 | Pending |
| EXH-03 | Phase 16 | Pending |
| EXH-04 | Phase 16 | Pending |
| EXH-05 | Phase 16 | Pending |
| EXH-06 | Phase 16 | Pending |
| RES-01 | Phase 17 | Pending |
| RES-02 | Phase 17 | Pending |
| RES-03 | Phase 17 | Pending |
| RES-04 | Phase 17 | Pending |
| RES-05 | Phase 17 | Pending |
| RES-06 | Phase 17 | Pending |
| FAIR-01 | Phase 18 | Pending |
| FAIR-02 | Phase 18 | Pending |
| FAIR-03 | Phase 18 | Pending |
| FAIR-04 | Phase 18 | Pending |
| FAIR-05 | Phase 18 | Pending |
| FAIR-06 | Phase 18 | Pending |

**Coverage:**
- v1.2 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0

---
*Requirements defined: 2026-05-19*
*Last updated: 2026-05-19 after v1.2 milestone definition*
