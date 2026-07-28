# Phase 261: Integrated Service Proof, Drift Guards, and Release - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase proves the complete v1.37 trust chain through real service, persistence, runtime, browser, rollback, privacy, and boundary paths; generates deterministic safe evidence; performs the final authority/compatibility audit; archives the milestone; tags the archive commit; and emits the immutable handoff for serious Strategy development. It does not add new gameplay or Strategy capabilities.

</domain>

<decisions>
## Implementation Decisions

### Service-backed proof topology
- **D-01:** Final proof uses a complete local production-shaped topology: real PostgreSQL, Go orchestration/persistence owner, runtime-service, actual TypeScript/Python/Rust/Zig adapters and pinned toolchains, canonical engine/Chronicle/replay, generated contracts, and selected web/browser surfaces. No mocked service boundary satisfies final proof.
- **D-02:** Execute the same content-addressed runtime/toolchain artifacts and containment policy intended for counted deployment. If a deployable environment cannot be reproduced and attested, that lane remains non-counted.
- **D-03:** The service manifest is a requirement-traced positive/negative matrix covering successful execution for every lane; player/system failures; stale/mixed identity; Chronicle rejection/reconstruction; four-condition Sets; persistence/recompute; retry/idempotency; rollback; historical replay; and public privacy.
- **D-04:** Live browser proof covers representative desktop and mobile public lane labels, historical evidence status, complete/degraded Set results, standings, replay reconstruction, rendered privacy, default network privacy, and board realism. Existing operator UI may be tested; otherwise operator behavior may remain API/integration proof.

### Proof artifacts and privacy
- **D-05:** Commit deterministic public-safe canonical JSON and Markdown rollups containing requirement mappings, status, safe IDs/hashes, commands, limitations, and restricted evidence references. Raw logs, full diffs, artifact bytes, and sensitive diagnostics stay in restricted content-addressed storage.
- **D-06:** Provide deterministic write/check commands. Write derives rollups from signed evidence manifests; check independently validates inputs and fails on stale or edited artifacts. Volatile timestamps and host paths are not canonical comparison fields.
- **D-07:** Build public artifacts from explicit safe schemas, then recursively scan for actual source/artifact bytes, StrategyMemory, SoldierMemory, objectives, credentials, host paths, environment values, raw diagnostics, private markers, and restricted IDs. Policy text may still name forbidden categories.
- **D-08:** Retain restricted evidence through certificate validity plus a documented post-expiry audit/dispute window with access logging. Permanent safe rollups retain hashes/attestations after policy deletion.

### Release blockers and rollback drills
- **D-09:** All four languages must pass functional ABI/full-trace conformance. A lane that fails deployable containment may remain supported but non-counted; the limitation must be explicit and no surface may overclaim it.
- **D-10:** A persisted audit reproduction blocks release unless an explicit prior compatibility ruling approves that exact semantic delta and identifies affected state/events/observations with updated requirements, fixtures, and tuple versions. Generic waivers are forbidden.
- **D-11:** Execute the full rollback matrix: lane kill switch and evidence staleness during scheduling/execution; transaction failure during Chronicle/Match completion; idempotent retry; cohort invalidation plus compensating reversal; standings recomputation; service/runtime version rollback; and mixed-tuple rejection throughout.
- **D-12:** No failing required proof may be manually overridden. Fix and rerun, or revise/descope the requirement through an explicit GSD approval flow before release. Infrastructure unavailability delays proof and never becomes a pass.

### Final audit, archive, and handoff
- **D-13:** The milestone audit maps all 56 requirements to phase verification and proof artifacts and demonstrates one transition owner, exact tuple/evidence closure, zero unapproved semantic deltas, historical compatibility, truthful lane status, privacy scans, rollback drills, limitations, and reproducible commands/hashes.
- **D-14:** Create annotated tag `v1.37` on the archive commit. The tag message records the certified semantic tuple ID, final proof hash, and audit artifact. Sign only when an existing managed signing identity is available; otherwise use an annotated unsigned tag.
- **D-15:** Produce public-safe versioned JSON/Markdown Strategy-evaluation foundation handoff manifests containing the certified tuple, Strategy ABI/budgets, active arena catalog and geometry hashes, four-condition Set policy, corpus/certificate IDs, lane counted status, known limitations, and canonical commands.
- **D-16:** Serious-Strategy milestone initialization is blocked until all 56 requirements pass, final audit has no override, proof/handoff manifests validate, planning artifacts are archived, `v1.37` tags the archive commit, and the tag resolves to the audited proof/tuple identities. The next milestone still requires its own explicit approval gate.

### the agent's Discretion
- Exact proof-script decomposition, artifact filenames, restricted storage provider, audit/dispute retention duration, and representative browser routes/viewports are flexible within the locked topology and privacy constraints.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone authority and phase decisions
- `.planning/PROJECT.md` — Definition of done, privacy, runtime, and no-gameplay-change boundaries.
- `.planning/REQUIREMENTS.md` — PROOF-01 through PROOF-08 and complete 56-requirement traceability.
- `.planning/ROADMAP.md` — Phase 261 success criteria and archive/tag requirement.
- `.planning/phases/256-counted-safety-and-canonical-authority/256-CONTEXT.md` — Eligibility, exact tuple, historical correction, and public/operator evidence split.
- `.planning/phases/257-canonical-transition-kernel-and-v1-4-semantic-integrity/257-CONTEXT.md` — One transition authority and compatibility rulings.
- `.planning/phases/258-canonical-json-failure-semantics-and-artifact-identity/258-CONTEXT.md` — JSON, budgets, failures, and closed evidence identity.
- `.planning/phases/259-executable-four-language-and-chronicle-conformance/259-CONTEXT.md` — Corpus, certification, full-trace, Chronicle, and freshness decisions.
- `.planning/phases/260-truthful-strategy-inputs-arena-authority-and-set-fairness/260-CONTEXT.md` — ABI observations, arena catalog, and four-condition Sets.

### Audit baseline and precedent
- `.planning/research/SUMMARY.md` — Final integrated proof and drift-guard recommendations.
- `.planning/artifacts/v2.0-core-rules-audit/README.md` — Persisted reproductions that must pass or have exact approved rulings.
- `.planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts` — Permanent reproduction executable.
- `.planning/milestones/v1.36-MILESTONE-AUDIT.md` — Prior service-backed, privacy, boundary-monitor, archive, and tag precedent.
- `.planning/research/competitive-strategy-factory-and-adversarial-league.md` — Downstream consumer requirements; not active Strategy implementation scope.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/evaluate-v1-35-final-proof.ts` and v1.36 proof scripts: Existing deterministic JSON/Markdown write/check and requirement-evidence rollup patterns.
- `scripts/check-boundary-monitors.ts`: Existing strict import, ownership, privacy, runtime, Go-parity, and generated-artifact guard chain to extend.
- `packages/spec/src/public-output-privacy.ts`: Existing public leak-safety assertion seam.
- `apps/go-backend` service-backed PostgreSQL tests: Existing normal lifecycle, recompute, completion, replay, and privacy proof harness.
- `apps/web/e2e/v1-36-competition-service-proof.spec.ts`: Existing live competition/result/replay browser proof pattern.

### Established Patterns
- Proof artifacts have generated JSON/Markdown pairs with strict `--write`/`--check` modes.
- Go owns normal backend lifecycle; TypeScript backend paths remain parity/rollback/test only.
- Previous milestone completion includes verification, audit, archive commit, and annotated version tag.

### Integration Points
- Root `pnpm boundary:monitors` becomes the umbrella structural gate for new tuple/kernel/runtime/arena/Set/privacy monitors.
- Final service runner orchestrates exact runtime images/toolchains, Go, runtime-service, PostgreSQL, web, and browser proof.
- Audit consumes per-phase verification plus the deterministic final rollup rather than restating unsupported claims.
- Archive/tag workflow embeds proof, tuple, and handoff identities before the next milestone starts.

</code_context>

<specifics>
## Specific Ideas

- Separate functional four-language support from counted containment promotion so a truthful non-counted lane does not block the integrity foundation.
- Make the safe rollup permanently verifiable even after restricted raw evidence reaches retention expiry.
- Treat tag metadata as the cryptographic join among source, archive, semantic tuple, proof, and Strategy handoff.

</specifics>

<deferred>
## Deferred Ideas

- Serious competitive Strategy implementation begins only in the next explicitly approved milestone after this gate passes.

</deferred>

---

*Phase: 261-integrated-service-proof-drift-guards-and-release*
*Context gathered: 2026-07-12*
