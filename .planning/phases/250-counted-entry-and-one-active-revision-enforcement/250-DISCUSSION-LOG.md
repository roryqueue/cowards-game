# Phase 250: Counted Entry and One-Active-Revision Enforcement - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-06-16
**Phase:** 250-Counted Entry and One-Active-Revision Enforcement
**Areas discussed:** Scope, Counted Entry Policy, One Active Revision, Exhibition Separation

---

## Scope

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| How much of the Phase 250 eligibility matrix should be covered now? | Full matrix | Cover stale artifacts, provider proof, unsupported providers, TinyGo, provenance, runtime readiness, ownership, mutable drafts, package mode, one-active-entry, and exhibition separation. | yes |
| How much of the Phase 250 eligibility matrix should be covered now? | Narrow counted entry only | Focus only on happy path plus provider proof rejection. | |
| How much of the Phase 250 eligibility matrix should be covered now? | Planning-only first | Record categories now and implement later. | |
| Should Phase 250 create new runtime/sandbox claims? | No, consume v1.35 evidence | Use current provider-proof/runtime/provenance/package/engine compatibility signals only. | yes |
| Should Phase 250 create new runtime/sandbox claims? | Broaden runtime readiness | Add stronger production-readiness claims while touching entry. | |
| Should Phase 250 create new runtime/sandbox claims? | Defer readiness entirely | Only enforce account ownership and active entries. | |

**User's choice:** `1`.
**Interpretation:** Full Phase 250 scope with strict counted-entry enforcement and no new runtime/sandbox/package claims.

---

## Counted Entry Policy

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| What should counted trial entry require? | Strict v1.35-backed eligibility | Immutable account-owned valid revision; provider proof; matching provenance/artifact; supported lane; ABI/runtime compatibility; package mode `none`; no required capabilities; engine compatibility. | yes |
| What should counted trial entry require? | Runtime semantics only | Trust existing `countedPlayEligible` label from account revision projection. | |
| What should counted trial entry require? | Admin override allowed | Permit operator override for exceptional entries. | |
| How should TinyGo behave? | Hidden and rejected | TinyGo remains unsupported for counted competition with a public-safe unsupported-provider category. | yes |
| How should TinyGo behave? | Non-counted only | Permit TinyGo entry but automatically mark non-counted. | |
| How should TinyGo behave? | Future flag | Leave behavior to future runtime phase. | |
| How detailed should rejection responses be? | Stable public categories and remediation | Coarse categories suitable for UI/API, no private internals. | yes |
| How detailed should rejection responses be? | Current messages | Keep ad hoc thrown strings. | |
| How detailed should rejection responses be? | Diagnostic-rich | Return provider/runtime details to signed-in owner. | |

**User's choice:** `1`.
**Interpretation:** Strict v1.35-backed counted entry with hidden TinyGo rejection and public-safe category/remediation responses.

---

## One Active Revision

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| How strict should one-active-revision be? | One owner entry per Season | A Player can have one active counted Strategy Revision entry per counted Season. | yes |
| How strict should one-active-revision be? | One revision id only | Keep unique Season/revision but allow multiple revisions by same Player. | |
| How strict should one-active-revision be? | UI-only hint | Warn in UI but let persistence accept duplicates. | |
| Should mid-season replacement be allowed after withdrawal? | No replacement loophole | Withdrawn or invalidated entries remain historical Season evidence; replacement waits for a future Season or exhibition path. | yes |
| Should mid-season replacement be allowed after withdrawal? | Active-only replacement | A withdrawn entry frees the Player to enter another revision. | |
| Should mid-season replacement be allowed after withdrawal? | Admin-controlled replacement | Allow replacement only via governance. | |
| Where should enforcement live? | Persistence plus database invariant | Persistence returns clean categories; database backs the invariant. | yes |
| Where should enforcement live? | Persistence only | Easier migration, weaker guard. | |
| Where should enforcement live? | Database only | Strong invariant, worse user-facing errors. | |

**User's choice:** `1`.
**Interpretation:** Enforce one owner entry per Season in persistence and database, and block mid-season replacement even after withdrawal/invalidated historical entries.

---

## Exhibition Separation

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| What should happen to same-user/self-play/multi-revision exhibition flows? | Preserve as non-counted/isolated | Keep them explicitly labeled and prevent standings impact. | yes |
| What should happen to same-user/self-play/multi-revision exhibition flows? | Restrict now too | Apply counted rules to exhibitions. | |
| What should happen to same-user/self-play/multi-revision exhibition flows? | Defer entirely | Leave exhibition copy and behavior untouched. | |
| Where should counted entry truth live? | Persistence/spec-owned eligibility | UI renders categories and copy, but does not own truth. | yes |
| Where should counted entry truth live? | UI runtime labels | Use dashboard labels as the gate. | |
| Where should counted entry truth live? | API route only | Keep the deeper persistence layer broad. | |

**User's choice:** `1`.
**Interpretation:** Preserve exhibition flexibility while ensuring exhibition results cannot affect counted trial standings, and keep counted entry truth below the UI.

---

## the agent's Discretion

- Exact helper names, category names, route response shape, migration details, and test grouping.
- Whether shared public categories belong in spec or persistence, as long as public copy stays stable and private internals remain excluded.

## Deferred Ideas

- Season lifecycle, standings recomputation, governance/dispute flows, broad public UX, and full service-backed proof are later phases.
