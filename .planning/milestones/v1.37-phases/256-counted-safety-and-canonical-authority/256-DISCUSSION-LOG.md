# Phase 256: Counted Safety and Canonical Authority - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-12
**Phase:** 256-counted-safety-and-canonical-authority
**Areas discussed:** Counted-lane quarantine, compatibility-tuple rollout, historical-result treatment, evidence visibility

---

## Counted-lane quarantine

| Decision | Options considered | Selected |
|----------|--------------------|----------|
| Initial posture | Quarantine every lane; assess individually; temporary TypeScript exception | Quarantine every lane |
| Exhibition boundary | Two-level containment/conformance gate; all exhibition; disable all | Two-level gate |
| Promotion | Evidence-derived plus kill switch; manual promotion; release-wide promotion | Evidence-derived plus kill switch |
| Stale in flight | Recheck and abort safely; honor scheduling snapshot; finish non-counted | Recheck and abort safely |

**User's choice:** Selected the recommended default-deny option for all four questions.
**Notes:** Operators may disable but cannot bypass evidence. In-flight staleness is a system failure with no gameplay mutation or player penalty.

---

## Compatibility-tuple rollout

| Decision | Options considered | Selected |
|----------|--------------------|----------|
| Representation | ID/hash plus expansion; expansion only; opaque ID | ID/hash plus expansion |
| Legacy routing | Non-mutating resolver; database backfill; one blanket v1.4 tuple | Non-mutating resolver |
| Registry acceptance | Exact tuples; component ranges; current plus aliases | Exact tuples |
| Version trigger | Semantic change; any byte change; milestone release only | Semantic change |

**User's choice:** Selected the recommended exact and non-mutating model throughout.
**Notes:** Executable identity changes stale evidence independently of semantic tuple versioning.

---

## Historical-result treatment

| Decision | Options considered | Selected |
|----------|--------------------|----------|
| Default | Preserve result/classify evidence; under review; retroactively non-counted | Preserve result/classify evidence |
| Invalidation threshold | Concrete impact; any failed modern gate; operator judgment | Concrete impact |
| Cohort correction | Append-only predicate action; row migration; Season reset | Append-only predicate action |
| Rollback | Compensating event; delete action; direct standings repair | Compensating event |

**User's choice:** Selected the recommended evidence-preserving, append-only policy throughout.
**Notes:** New standards do not retroactively rewrite historical truth; concrete reproducible integrity findings can change derived treatment.

---

## Evidence visibility

| Decision | Options considered | Selected |
|----------|--------------------|----------|
| Public lane view | Safe status plus identity; status only; full reports | Safe status plus identity |
| Operator view | Structured inventory; public-only; raw proof in UI/API | Structured inventory |
| Reason model | Typed categories with split copy; messages only; internal errors | Typed categories with split copy |
| Historical display | Original semantics with conditional note; universal warning; hide differences | Original semantics with conditional note |

**User's choice:** Selected the recommended privacy-safe layered evidence model throughout.
**Notes:** Raw sensitive proof remains outside normal interfaces even for authorized operators.

## the agent's Discretion

- Naming and presentation details within the locked typed-contract and privacy boundaries.

## Deferred Ideas

None.
