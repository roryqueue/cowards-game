# Phase 270: Independent Verification and Release Closure - Context

**Gathered:** 2026-07-27
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase independently reproduces and adversarially audits the complete v1.38 evidence graph, preserves its public and private evidence under an explicit retention manifest, produces a truthful non-circular pre-tag audit, archives the exact release tree, creates annotated tag `v1.38`, and closes the outer release operations through a distinct read-only post-tag attestation. It reports process, current-rules, and formation outcomes separately. It does not change gameplay or public product behavior, reinterpret empirical gates, repair failed evidence, promote an experimental profile, or let any tagged file predict its own Git identities.

</domain>

<decisions>
## Implementation Decisions

### Carry-forward trust charter
- **D-01:** Every release input, reproduction result, audit row, retention entry, manifest, report, archive check, and attestation is immutable and content-addressed. There is no mutable `latest`; any changed byte creates a different root and must be reverified.
- **D-02:** Missing, stale, contaminated, incomplete, mismatched, unresolvable, or unreproducible evidence fails closed. A process-valid current-rules failure, bracket rejection, or bracket empirical pass is reportable; process or integrity failure blocks successful audit, archive, and tag closure.
- **D-03:** The final proof must still show one exact canonical `MATCH_KERNEL`, unchanged canonical rules/product behavior, hostile Strategy execution only behind the supervised runtime boundary, private lab unreachability, complete failure accounting, and exact current-only promotion.
- **D-04:** No cap, MOVE/reversal, Backstab geometry/timing, scan-timing, arena, runtime, or combined-rule experiment enters the release. No report claims exact exploitability, Nash equilibrium, optimality, permanent balance, a solved game, or authority to ship a rule change.

### Independent reproduction and adversarial review
- **D-05:** Name a verifier who did not produce the evaluated root. Independence is an evidence field, not an informal assertion; the verifier identity, role, input roots, tool identities, host/platform identity, invocation, and output root are bound in the verification receipt.
- **D-06:** The verifier works from a clean detached checkout at the exact candidate release commit, with independently identified tools and host. The ordinary working tree, producer caches, mutable branch tips, and producer-owned output directories are not verification inputs.
- **D-07:** The clean-checkout reproducer verifies all required non-secret artifacts, deterministic roots, task/matrix coverage, worker/shard/restart invariance, tamper detection, bounded safe projections, and exact artifact resolvability without requiring private holdout preimages.
- **D-08:** Where private evidence must be inspected, access occurs through separately authorized immutable references and append-only access evidence; private bytes are not copied into Git or public output. The verifier independently recomputes permitted roots and gate decisions rather than trusting producer labels.
- **D-09:** Verification requires zero unexplained mismatch and adversarially reviews oracle independence, candidate legality, information boundaries, equal compute, freeze order, one-open use, production unreachability, privacy, claims, rollback, retention, omitted failures, and conclusions.
- **D-10:** Artifact-wide key/value scans, claim lint, strict schemas, import/deployment monitors, mutation tests, and positive bypass probes must detect every seeded private leak, overclaim, experimental product path, threshold override, omitted failure, stale identity, and retention defect. Any unresolved blocking finding forces `gaps_found`.

### Evidence retention and retirement
- **D-11:** The retention manifest names each evidence class, public/private status, full-versus-compact posture, authoritative storage root, object digest and resolvability proof, retention period, access evidence, and explicit retirement procedure.
- **D-12:** Decision-critical private v1.38 evidence is retained until the later rules decision that consumes or declines the formation packet is archived, and never for less than the existing restricted-evidence floor. The effective retirement date is the later of those two conditions; if no later rules decision is archived, the decision-critical private evidence remains retained.
- **D-13:** The existing floor is certificate validity plus 90 calendar days for certificate-bound evidence and at least the corresponding 90-day restricted-evidence audit window for decision-critical evidence without a later certificate deadline. A shorter v1.38 policy is forbidden.
- **D-14:** Privacy-safe commitments, root manifests, decision status, audit results, and attestations remain permanent even after an eligible private-preimage retirement. Retirement is an explicit authorized operation with digest verification and append-only authorization/completion evidence, never TTL disappearance or silent deletion.

### Non-circular prearchive truth
- **D-15:** One prearchive root binds the exact current Git commit and dirty-state declaration, lockfile, toolchain/host/platform identities, semantic tuple, schemas, algorithms, budgets, splits, candidates, opponents, conditions, task/shard roots, custody receipts, audit inputs, expected archive set, expected tag name/message schema, post-tag checker identity, and verified pre-tag absence.
- **D-16:** The prearchive root, readiness artifact, and canonical audit do not predict the future archive commit, tag object, peeled target, or external attestation identity.
- **D-17:** The immutable pre-tag audit maps all 94 requirements exactly once with no missing, duplicate, partial, or orphaned coverage; cross-references requirement traceability, phase verification, and completion summaries; records zero silent overrides and no canonical gameplay/public-behavior change; and separates `process_status`, `current_rules_outcome`, and `formation_outcome`.
- **D-18:** The pre-tag audit leaves exactly CLOSE-07, CLOSE-08, and CLOSE-09 `ready_pending`. It cannot mark archive, tag, or post-tag closure complete before those external objects exist.

### Archive, annotated tag, and external closure
- **D-19:** The complete roadmap, requirements, byte-identical canonical pre-tag audit, phase artifacts, public-safe report, private-root commitments, decision or rejection packet, and verification instructions are archived in one exact release commit. The release checker proves actual blob membership and digests from that commit.
- **D-20:** Only after every non-outer requirement passes does a read-only pre-tag checker validate the actual archive commit and absence of `v1.38`. A failed check blocks tag creation rather than being waived.
- **D-21:** Create annotated tag `v1.38` at that exact archive commit. Its message binds the semantic tuple, final evidence root, current-only certification root or literal `no_certifiable_current_finalist`, decision report, archived audit path/digest, and readiness digest.
- **D-22:** Sign the tag only when an existing managed signing identity is available and independently identifiable. Do not infer a signing identity from Git user configuration, generate an ad hoc identity, or weaken closure when signing is unavailable; an annotated unsigned tag is the approved fallback.
- **D-23:** A distinct read-only independent post-tag checker resolves the actual annotated tag object and peeled archive commit, verifies message bindings, archived roots, byte-identical audit, clean tagged-tree reproducer, and protected boundaries, then emits a distinctly named content-addressed external attestation.
- **D-24:** The post-tag attestation closes CLOSE-07 through CLOSE-09 from actual external identities without rewriting, shadowing, or superseding files in the tagged tree. Any tag, archive, evidence, report, audit, or attestation mismatch fails closure.
- **D-25:** The final report keeps `process_status`, `current_rules_outcome`, and `formation_outcome` as separate axes and states limitations plainly. Empirical pass or rejection never becomes a production authorization.

### the agent's Discretion
Only after the synthetic root-manifest/archive/tag/post-tag rehearsal passes, the agent may choose exact script and schema names, strict manifest decomposition, clean-checkout command packaging, independent host/tool identity encoding, private-object index layout, safe report rendering, and external-attestation filename. These choices may not change the retention rule, verifier independence, 94-row audit truth, three `ready_pending` outer operations, archive membership, annotated-tag bindings, signing policy, read-only post-tag semantics, or three-axis final report.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone contract and phase authority
- `.planning/PROJECT.md` — v1.38 definition, proof expectations, privacy boundary, and bounded claims.
- `.planning/REQUIREMENTS.md` — CLOSE-01 through CLOSE-10 and all 94 traceability rows.
- `.planning/ROADMAP.md` — Phase 270 success criteria and non-circular release sequence.
- `.planning/milestone-proposals/v1.38-competitive-strategy-factory-and-adversarial-league/ACTIVATION-PROMPT.md` — binding verification, audit, archive, tag, non-shipping, and no-threshold-softening contract.

### Research and completed phase decisions
- `.planning/research/SUMMARY.md` — release architecture, risk reconciliation, and archive-mechanics research flags.
- `.planning/research/ARCHITECTURE.md` — final root graph, independent reproduction, privacy, rollback, and artifact boundaries.
- `.planning/research/STACK.md` — content-addressed store, exact identity matrix, clean-checkout verification, and safe projection rules.
- `.planning/research/PITFALLS.md` — circular archive/tag proof, leakage, omission, mutable evidence, and overclaim failure modes.
- `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-CONTEXT.md` — admitted tuple, custody, claims, and global failure contract.
- `.planning/phases/266-content-addressed-current-league-freeze/266-CONTEXT.md` — pre-formation current root and exact promotion eligibility.
- `.planning/phases/267-post-freeze-formation-boundary-and-production-unreachability/267-CONTEXT.md` — lab-only boundary and production-denial evidence.
- `.planning/phases/268-equal-compute-retraining-and-branch-freezes/268-CONTEXT.md` — equal-compute audit and the three branch roots.
- `.planning/phases/269-sealed-evaluation-causal-decision-and-current-only-certifica/269-CONTEXT.md` — one-open receipt, causal result, decision packet, and current certification root.

### Release and retention precedents
- `.planning/milestones/v1.37-phases/261-integrated-service-proof-drift-guards-and-release/261-CONTEXT.md` — service proof, safe/restricted evidence, no-override rule, archive, tag, and handoff precedent.
- `.planning/milestones/v1.37-phases/261-integrated-service-proof-drift-guards-and-release/261-RESEARCH.md` — non-circular prearchive, actual annotated-tag join, and retention rationale.
- `.planning/artifacts/v1.37-restricted-evidence-policy.json` — executable certificate-validity-plus-90-days floor, append-only access classes, and explicit deletion contract.
- `.planning/artifacts/v1.37-restricted-evidence-policy.md` — human-readable existing retention and permanent-attestation posture.
- `.planning/artifacts/v1.37-post-tag-ui-integration-correction.md` — current evidence that later non-semantic corrections remain separate from the released tag identity.
- `scripts/evaluate-v1-37-prearchive-proof.ts` — truthful passed-plus-`ready_pending` prearchive precedent.
- `scripts/check-v1-37-release-tag.ts` — read-only archive-membership, annotated-tag, peeled-target, message-binding, and signing-policy precedent.
- `scripts/lib/v1-37-restricted-evidence-store.ts` — create-exclusive restricted evidence, safe refs, digest verification, access evidence, and explicit retirement.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/evaluate-v1-37-prearchive-proof.ts`: deterministic proof generation/checking that deliberately leaves the outer release operation pending.
- `scripts/check-v1-37-release-tag.ts`: separate pre-tag archive and post-tag modes that inspect actual Git blobs, annotated object type, peeled target, message bindings, and managed-signing posture.
- `scripts/lib/v1-37-restricted-evidence-store.ts`: content-addressed private objects, immutable attestations, safe references, no-follow verification, append-only access records, and explicit deletion.
- `scripts/check-v1-37-release-boundaries.ts`: strict release-boundary and stale/tampered artifact checks to extend for v1.38 evidence classes.
- `packages/spec/src/public-output-privacy.ts`: recursive public leak-safety scanner for reports, audit projections, and attestations.
- `packages/spec/src/canonical-json.ts` and `packages/spec/src/canonical-identity-domains.ts`: byte-stable manifests and domain-separated release roots.

### Established Patterns
- Generated canonical JSON/Markdown pairs have deterministic `--write` and read-only `--check` modes.
- The prearchive artifact is truthful about pending outer Git operations; the actual archive and tag are checked afterward.
- Annotated tag closure binds an existing archive commit and message fields; signing is conditional on an existing managed identity.
- Restricted evidence remains outside Git while permanent safe digests/attestations survive eligible retirement.

### Integration Points
- Phase-270 root assembly consumes every phase verification, Phase-269 decision/certification roots, the requirements table, and the expected archive file set.
- The independent verifier executes from a detached checkout plus declared immutable external evidence roots.
- The archive checker reads blobs from the actual commit; the post-tag checker reads the actual annotated ref and tagged tree without worktree mutation.
- The external attestation is a new out-of-tree closure object and cannot rewrite the tagged canonical audit.

</code_context>

<specifics>
## Specific Ideas

- Retain decision-critical private evidence until the later rules decision is archived and never shorter than the established 90-day restricted-evidence floor; keep safe commitments permanently.
- Preserve the exact causal order: truthful pre-tag audit, archive commit, read-only archive check, annotated tag, read-only external post-tag attestation.
- Make the verifier's independence, clean checkout, tools, host, inputs, and outputs machine-verifiable rather than descriptive prose.
- Keep process, current-rules, and formation outcomes separate so an empirical result cannot conceal a process failure or imply shipping authority.

</specifics>

<deferred>
## Deferred Ideas

- A later rules milestone may consume or decline the bracket decision packet and may thereby satisfy the decision-linked portion of the private-evidence retention condition.
- Production formation adoption, cap, MOVE/reversal, Backstab, scan-timing, arena, and combined-rule experiments remain separately approved future work.
- Any post-tag non-semantic correction must receive its own explicit correction evidence without moving or rewriting `v1.38`.

</deferred>

---

*Phase: 270-independent-verification-and-release-closure*
*Context gathered: 2026-07-27*
