# Phase 256: Counted Safety and Canonical Authority - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase stops unproved runtime lanes from producing new counted evidence, establishes the atomic compatibility tuple and authority registry, defines non-mutating historical evidence classification and correction, and fixes the public/operator evidence split. It does not implement the transition kernel, four-language conformance corpus, or later Strategy/Set changes.

</domain>

<decisions>
## Implementation Decisions

### Counted-lane quarantine
- **D-01:** Every current runtime lane begins quarantined and must be freshly recertified for its exact active identity; no TypeScript or other transitional exception exists.
- **D-02:** Eligibility has two independent floors: missing current containment evidence disables execution entirely, while current containment without current conformance permits exhibition-only execution.
- **D-03:** Counted eligibility is derived automatically from a complete passing evidence bundle for the exact active identity. Operators may disable a lane but cannot override missing evidence or force promotion.
- **D-04:** Evidence is rechecked at scheduling and execution boundaries. Work rejected before claim does not run; an in-flight identity/evidence mismatch aborts as a system failure with no gameplay mutation or player penalty and requires a fresh run after recertification.

### Compatibility-tuple rollout
- **D-05:** New Match and evidence records persist both a canonical tuple ID/hash and the expanded rules, engine, runtime ABI, Chronicle, arena-catalog, and Set-policy component versions; the expansion must hash to the identifier.
- **D-06:** Legacy tuple resolution is read-only and may use only authoritative persisted fields plus immutable release manifests. Never backfill or rewrite the original record; ambiguous records remain explicitly unresolved and cannot support counted recomputation.
- **D-07:** New counted work accepts exact immutable certified tuples only. Wildcards, compatible ranges, component-by-component acceptance, and `latest` aliases are forbidden.
- **D-08:** Mint a new semantic tuple when any of the six behavior contracts changes. Implementation, runtime, toolchain, adapter, artifact, policy, or corpus identity changes invalidate executable evidence for the existing tuple but do not mint a new semantic tuple unless behavior changes.

### Historical-result treatment
- **D-09:** Preserve each historical outcome and its original counted meaning. Classify containment/conformance evidence independently as historical, legacy, incomplete, or unresolved.
- **D-10:** Invalidation or standings exclusion requires reproducible evidence that execution, failure classification, eligibility, identity, or persisted evidence was wrong or materially unreliable for an exact Match or deterministic cohort. Failure to meet a newer documentation or evidence standard is not sufficient.
- **D-11:** Cohort corrections are append-only governance actions containing the exact deterministic predicate and supporting evidence. Operators preview the affected Matches before applying an immutable classification/invalidation event and deterministic standings recomputation.
- **D-12:** Rollback uses a compensating governance event with reason and evidence, followed by recomputation. Never delete the original action, rewrite original Match evidence, or directly repair standings values.

### Evidence visibility
- **D-13:** Public/default lane projections show counted, exhibition-only, or disabled status; a stable plain-language reason category; semantic tuple ID; non-sensitive evidence version/hash; and freshness date.
- **D-14:** Authorized operator interfaces show exact identities, gate results, failure categories, remediation, cohort impact, and IDs/links for restricted proof storage. They still exclude Strategy source, artifact bytes, memories, credentials, host paths, and sensitive exploit details.
- **D-15:** Persist stable canonical reason codes and derive separate calm public explanations and precise operator remediation from them. Never expose internal runtime errors as the public vocabulary.
- **D-16:** Historical Match surfaces show the original rules/Chronicle profile and original counted status. A legacy/unresolved evidence note may be shown when useful; a prominent warning appears only when a concrete governance finding affects the result.

### the agent's Discretion
- Exact naming of typed reason codes, evidence records, registry APIs, and operator presentation is left to research and planning, provided it preserves the locked public/private split and semantics above.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Active milestone authority
- `.planning/PROJECT.md` — v1.37 goal, hard boundaries, and preserved runtime/privacy posture.
- `.planning/REQUIREMENTS.md` — SAFE-01 through SAFE-04 and AUTH-01 through AUTH-05.
- `.planning/ROADMAP.md` — Phase 256 boundary, dependencies, and success criteria.
- `.planning/STATE.md` — Active milestone state and durable decisions.
- `.planning/research/SUMMARY.md` — Research conclusions on quarantine, atomic tuples, historical routing, and evidence identity.

### Audit and proposal source material
- `.planning/research/v2.0-core-rules-enforcement-runtime-and-metagame-audit.md` — Confirmed containment, language-parity, authority, and historical-evidence risks.
- `.planning/artifacts/v2.0-core-rules-audit/README.md` — Persisted audit snapshot and reproduction commands.
- `.planning/milestone-proposals/v2.0-rules-integrity-and-metagame-renewal/PROPOSAL.md` — Safety recommendation used selectively; experimental rules are not active.
- `.planning/milestone-proposals/v2.0-rules-integrity-and-metagame-renewal/REQUIREMENTS.md` — Draft SAFE/AUTH source requirements, not wholesale active scope.

### Historical rules and architecture
- `CowardsGameSpec_Full_Consolidated_v1.md` — Original v1 rules authority; currently has a user-owned uncommitted edit and must not be overwritten casually.
- `CowardsGameSpec_CycleInterleaved_v1.4.md` — Immutable Cycle-interleaved v1.4 semantics.
- `CowardsGame_Technical_Architecture_Spec_v1.4.md` — Historical runtime, engine, Chronicle, and ownership architecture.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/spec/src/runtime.ts`: Existing supported-language registry, containment evidence classes, provider metadata, compatibility keys, counted eligibility, and public labels should be converged rather than replaced.
- `packages/spec/src/match-execution-contract.ts`: Existing execution eligibility and public evidence contracts provide the service-facing seam for the quarantine and tuple projection.
- `apps/go-backend/main_test.go`: Existing Go runtime-semantics and stale-provider-proof tests are a baseline for cross-owner fail-closed behavior.
- `apps/runtime-service/src/server.ts`: Existing provider validation and language tagging are the runtime-service enforcement seam.

### Established Patterns
- Spec-owned typed contracts with Go/persistence parity tests are the established cross-service authority pattern.
- Counted competition already distinguishes counted, non-counted, degraded, disputed, invalid, and invalidated evidence; Phase 256 must extend this without rewriting original Matches.
- Public projections already use safe labels rather than raw diagnostics; new evidence details must follow the same privacy boundary.

### Integration Points
- Scheduling and entry gates in persistence and Go must consume the canonical eligibility decision.
- Runtime-service must revalidate exact identity/evidence at execution time.
- Standings/governance recomputation must consume append-only classification actions.
- Public result/replay/runtime surfaces consume only the safe projection, while operator routes consume the structured restricted inventory.

</code_context>

<specifics>
## Specific Ideas

- Treat containment and conformance as separate certificates with distinct consequences: no containment means no execution; containment without conformance means exhibition only.
- Keep semantic compatibility identity separate from executable evidence identity so rebuilds invalidate proof without fabricating a rules-version change.
- Make historical correction auditable through deterministic cohort predicates and compensating events.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 256-counted-safety-and-canonical-authority*
*Context gathered: 2026-07-12*
