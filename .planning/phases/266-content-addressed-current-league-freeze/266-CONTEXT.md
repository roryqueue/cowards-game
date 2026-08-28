# Phase 266: Content-Addressed Current-League Freeze - Context

**Gathered:** 2026-07-27
**Status:** Discussion complete; planning and execution denied pending Phase 262 ADMIT-03

<domain>
## Phase Boundary

This phase converts the completed current-rules league into one immutable, verifiable freeze root. The root binds the full current-rules process and result, proves that no formation artifact existed before it, freezes preliminary current-finalist feasibility and the exact-source promotion design, and becomes the only gate that may unlock formation materialization. It does not create a formation namespace or open the common sealed holdout.

</domain>

<decisions>
## Implementation Decisions

### Carry-forward integrity charter
- **D-01:** The freeze is content-addressed and immutable. No mutable `latest`, branch name, timestamp, directory order, or human declaration may identify the authoritative current league.
- **D-02:** Missing, stale, contaminated, incomplete, conflicting, unresolvable, or identity-mismatched evidence fails closed. Every attempt, retry, failure, rejection, and unused allocation remains charged evidence.
- **D-03:** A process-valid empirical disappointment, including `no robust pure finalist found`, may be frozen honestly. Any process, provenance, completeness, custody, contamination, reproducibility, kernel, runtime, or information-boundary failure prevents a valid root and blocks Phase 267.
- **D-04:** The root cannot authorize a production rule, runtime, arena, counted-policy, registration, persistence, replay, standings, or public change.

### Manifest-of-hashed-leaves
- **D-05:** Emit one schema-versioned manifest-of-hashed-leaves whose root binds the exact admitted v1.37 authority; Phase 262 contract; runner, factory, oracle, solver, and analysis identities; current source bytes/hashes and lineage; every candidate and attempt disposition; populations and snapshots; complete payoff matrices; solver outputs and iteration curves; meta-distributions and response graphs; thresholds and gates; task, retry, and compute ledgers; red-team evidence; pure portfolio; finalist disposition; preliminary feasibility evidence; holdout commitment; and bounded claim interpretation.
- **D-06:** Every leaf has an explicit schema/type, canonical byte encoding, privacy class, authoritative storage root/object identity, length/hash, and resolvability status. Private objects remain private; safe projections disclose commitments and approved aggregates only.
- **D-07:** The root binds the exact Git source/dirty declaration, lockfile, selected semantic tuple, `MATCH_KERNEL`, runtime/toolchain identities, arena semantic catalog, side/initiative condition policy, budgets, and analysis versions used to produce it.
- **D-08:** Any mutation creates a new branch/root and invalidates all descendants of the former root. Validation never rewrites, refreshes, or silently repairs a leaf.
- **D-09:** Every later current-edge, inward, or bracket branch must include the exact Phase 266 root as a parent dependency; a descendant cannot substitute an equivalent-looking current baseline.

### Executable pre-formation absence proof
- **D-10:** Before root publication, an executable inventory scans the repository tree, generated outputs, artifact stores, task and lineage ledgers, cache namespaces, prompt/model bundles, trace/replay stores, and configured private storage roots and proves the absence of current-edge experiment, inward, and bracket namespaces, cold-root branches, manifests, initial states, candidates, scores, prompts, caches, traces, replays, and results.
- **D-11:** The absence checker must reject seeded canaries for every forbidden artifact class and naming/identity path. A text grep alone is not sufficient, and policy/contract text describing future profiles must not be mistaken for executable materialization.
- **D-12:** Freeze publication is an atomic gate: the complete manifest, all required leaves, the absence receipt, and root validation appear together, or no valid root exists.

### Preliminary finalist and holdout gate
- **D-13:** Each frozen current finalist must pass preliminary legal-information, deterministic-repeat, source/memory/objective/output, runtime-profile, replay-review, and compatibility evidence before appearing on the eligible pre-formation list.
- **D-14:** Freeze the ordinary-promotion design as an exact source-hash allowlist. Only listed pre-formation current finalist hashes may later be re-admitted through canonical Strategy Revision validation; no formation-control candidate can inherit eligibility.
- **D-15:** If the eligible list is empty, preserve that fact without fabricating promotion readiness. Phase 269 may later emit `no_certifiable_current_finalist`.
- **D-16:** Bind only the original holdout commitment and custody receipt; the holdout preimage remains inaccessible and unopened. Any access/query evidence before the authorized one-batch evaluation is a blocking failure.

### the agent's Discretion
- Manifest file layout, Merkle/tree fan-out, content chunking, and command decomposition are flexible only if repository canonical encoding/identity primitives are reused and every required leaf remains typed, resolvable, and independently verifiable.
- Private storage implementation and filenames may follow established v1.37 patterns; they cannot weaken custody, retention, privacy, or offline reproduction.
- Stable error-code names are flexible. Root membership, the absence inventory, gate ordering, and failure dispositions are not.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone authority and phase inputs
- `.planning/PROJECT.md` — v1.38 sequencing, current-only promotion, privacy, and honest-failure boundaries.
- `.planning/REQUIREMENTS.md` — FRZE-01 through FRZE-04 plus SEAL-01, CERT-01, and CLOSE evidence constraints.
- `.planning/ROADMAP.md` — Phase 266 one-way gate and success criteria.
- `.planning/milestone-proposals/v1.38-competitive-strategy-factory-and-adversarial-league/ACTIVATION-PROMPT.md` — binding requirement to freeze the serious current league before alternate profiles.
- `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-CONTEXT.md` — frozen contract, custody, evidence, and non-materialization rules.
- `.planning/phases/263-legal-planner-and-deterministic-runner-feasibility/263-CONTEXT.md` — task identity, deterministic runner, kernel, and reduction decisions.
- `.planning/phases/264-immutable-factory-independent-oracles-and-quarantined-intake/264-CONTEXT.md` — candidate, lineage, attempt, independence, and hostile-intake evidence.
- `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-CONTEXT.md` — complete matrix, solver, response-loop, red-team, portfolio, and finalist outputs to freeze.

### Research and freeze precedent
- `.planning/research/SUMMARY.md` — Phase 5 freeze rationale, valid-result rule, identity requirements, and no-new-technology guidance.
- `.planning/research/competitive-strategy-factory-and-adversarial-league.md` — immutable league outputs and freeze-before-holdout protocol.
- `.planning/artifacts/v1.37-strategy-evaluation-foundation.md` — admitted predecessor handoff and selected authority.
- `.planning/artifacts/v1.37-restricted-evidence-policy.md` — existing private/public evidence and retention precedent.
- `.planning/artifacts/v1.37-prearchive-proof.md` — deterministic root/report precedent.
- `.planning/milestones/v1.37-phases/258-canonical-json-failure-semantics-and-artifact-identity/258-CONTEXT.md` — canonical bytes, identity closure, and failure ownership decisions.
- `.planning/milestones/v1.37-phases/261-integrated-service-proof-drift-guards-and-release/261-CONTEXT.md` — content-addressed proof, privacy, and reproducible manifest precedent.
- `.planning/milestones/v1.37-MILESTONE-AUDIT.md` — predecessor audit state that the admitted authority joins.

### Canonical specifications
- `CowardsGameSpec_Full_Consolidated_v1.md` — unchanged rules and canonical Strategy/Match semantics.
- `CowardsGameSpec_CycleInterleaved_v1.4.md` — unchanged Cycle-interleaved scheduler semantics.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — engine purity and hostile execution boundaries.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/spec/src/canonical-json-encode.ts`: canonical manifest encoding with explicit failure semantics.
- `packages/spec/src/canonical-identity-domains.ts`: domain-separated content identity primitives.
- `scripts/lib/v1-37-integrated-proof-manifest.ts`: typed predecessor proof-manifest construction and checking pattern.
- `scripts/evaluate-v1-37-prearchive-proof.ts`: immutable prearchive root and deterministic write/check precedent.
- `scripts/generate-v1-37-strategy-foundation-handoff.ts`: exact authority, arena, Set-policy, conformance, and proof-root joining.
- `packages/spec/src/public-output-privacy.ts`: recursive forbidden key/value and marker scanning for safe projections.

### Established Patterns
- v1.37 uses deterministic JSON/Markdown pairs with independent `--write` and `--check` behavior; checks reject stale or hand-edited artifacts.
- Existing proof manifests separate safe committed summaries from restricted content-addressed evidence.
- Repository evidence joins exact semantic, runtime, artifact, source, and toolchain identities rather than trusting labels.

### Integration Points
- Phase 265 provides all league leaves; Phase 262 provides the contract and holdout commitment.
- Phase 267 must verify this exact root before any formation constructor or namespace can run.
- Phase 268 branch roots and Phase 269 sealed/certification artifacts must retain the root as an immutable ancestor.
- Phase 270's prearchive manifest and audit consume the Phase 266 root without rewriting it.

</code_context>

<specifics>
## Specific Ideas

- Use one manifest-of-hashed-leaves rather than a directory snapshot whose meaning depends on filenames.
- Treat verified pre-formation absence as a first-class signed receipt with canary-tested detection.
- Freeze `no robust pure finalist found` with the same rigor as a successful finalist outcome.

</specifics>

<deferred>
## Deferred Ideas

- All three formation profiles and their cold-root branches remain absent until this root verifies.
- Common holdout opening belongs to Phase 269.
- Ordinary product certification belongs to Phase 269 and accepts only exact allowlisted pre-formation current hashes.
- Rule, runtime, arena, product, and public changes remain outside v1.38.

</deferred>

---

*Phase: 266-content-addressed-current-league-freeze*
*Context gathered: 2026-07-27*
