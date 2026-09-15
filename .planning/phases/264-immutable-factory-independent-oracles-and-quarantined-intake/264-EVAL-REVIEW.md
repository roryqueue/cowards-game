# EVAL-REVIEW — Phase 264: Immutable Factory, Independent Oracles, and Quarantined Intake

**Audit Date:** 2026-09-14
**AI-SPEC Present:** Yes
**Audited implementation:** `68b01431db6110575ded60d4bfe2ca5611441dcb` (`sha256:6a6094089e6714def26c427f60dfc0fae15e534cc685ad7a76dc883c4911b97c`)
**Overall Score:** 100/100
**Verdict:** PRIVATE DEVELOPMENT EVALUATION COVERAGE PASSED

The planned evaluation strategy is implemented and its retained development assessment affirmed and reopened exactly. This is not a production deployment, competitive-strength, or model-regeneration claim. The phase remains private development evidence with a fixed-opponent, one-Phase, arena/side-confounded design. The numerical score measures planned evaluation coverage, not Strategy performance or scientific confidence.

## Dimension Coverage

| Dimension | Status | Measurement | Finding |
|-----------|--------|-------------|---------|
| Immutable provenance and provider identity | COVERED | Code + actual frozen attempt | Canonical source, request/response, requested/reported provider/model, settings, usage, lineage, native lane and correction roots are retained. The valid cumulative attempt 3 used 9,027 tokens; unavailable internal serving snapshot is explicitly permitted by the approved amendment. Drift/unavailable identities remain charged blocks. |
| Legal-information-only supervised execution | COVERED | Code + 48 retained workloads + boundary monitor | Tactical, teacher and model paths use the canonical supervised bridge and legal-input projections. Teacher counterfactuals are projected away. The 1,296-file boundary inspection found zero violations; all 48 workloads completed with no player or system failures. |
| Charged three-way disposition | COVERED | Code + retained ledgers | Charge-first starts, terminal retention, retry/duplicate/invalid/rejected/weak/unresolved handling, and distinct player-violation/system-failure semantics are implemented. Historical authoring failures remain charged; workload terminals are retained as `unresolved` rather than invented results. |
| Independence, clone, and correlation | COVERED | Code + retained source-backed corpus/workloads + aggregate assessment | The corrected retained assessment is `affirmed` with no reasons: all six dimensions informative; three positive controls correlated; latent divergence distinct; both named borderline controls unresolved; all three base edges distinct; zero strategic-sharing violations; 48/48 cells and 24/24 pairs complete. Threshold root: `sha256:f6098c9e14ed868e162a9374557e518678996b619f3f8912fb8723113328fa72`; assessment artifact root: `sha256:25913b26fa81fa15177774fbdcf9c0d1ef244ad13910bc664bfde4ea8c2e43f8`. The near-borderline mean is 0.675525 versus ceiling 0.670749 (0.004776 above); this is a fragility note, not an uncertainty interval. |
| Quarantined intake and disclosure | COVERED | Code + focused tests | Frozen participant/reviewer protocol, roots-only projection, prohibited-field rejection, conflict/review dispositions, charge-first accounting, and common supervised admission are implemented. Human/external intake is explicitly unused/zero under the approved revision; no participation claim is made. |
| Bounded offline resource accounting | COVERED | Code + actual authoring/workload artifacts | Provider input/output tokens, elapsed authoring time, reserved prior charges, attempt/budget roots, invocation limits, workload ceilings, and retained execution/accounting artifacts are present. Cumulative accounting is 68,794 tokens including prior known and reserved charges; no unplanned retry or allocation was created. |

**Coverage Score:** 6/6 (100%)

## Infrastructure Audit

| Component | Status | Finding |
|-----------|--------|---------|
| Eval tooling (Vitest 4.1.6, TypeScript/Zod) | Installed / Configured | The pinned tools are installed and called by the focused Phase264 suites. Latest correction verification reports 31/31 focused tests; builds, strict checks and boundary checks also pass. |
| Reference dataset | Present | `264-EVAL-REFERENCE.md` defines all 16 specified development fixtures (4/4/3/3/2) with executable test branches. The source-backed 12-slot/48-cell calibration corpus is additional evidence, not a replacement for the fixture index. |
| CI/CD integration | Present | `.github/workflows/ci.yml` contains the named five-minute “Private factory source and evaluation checks (no experimental runs)” step covering factory, oracle, intake, runner, retention and boundary tests. It intentionally does not claim remote CI passage or run fresh experiments. |
| Online guardrails | Implemented | Provenance admission, direct-execution/provider-call denial, legal-information boundary enforcement, charged failure handling, and clone/intake quarantine are fail-closed code paths with denial tests. |
| Tracing (private content-addressed JSON) | Configured | Private ordered execution, transition, accounting, supervision and roots-only assessment artifacts wrap the actual supervised seam. No hosted tracing service is required or configured by the AI-SPEC. |

**Infrastructure Score:** 100/100

## Critical Gaps

No MISSING or PARTIAL dimension and no unimplemented guardrail was found. Main completed the read-only final reopen with the identical affirmative assessment identity, threshold, unchanged48-entry ledger and zero extra Matches.

## Remediation Plan

### Required before competitive or downstream use:

1. Completed: read-only v2 root reopen against the unchanged48-workload ledger. Authoring, teacher search, workloads, Matches and allocation were not rerun.
2. Preserve the explicit limitation: the 48 workloads use one fixed opponent, one Phase, and two geometry/side blocks with arena/side confounding. The affirmed result supports the independence/calibration rubric only; it does not support a competitive-strength claim.

### Should fix soon:

- Preserve the 16-fixture index, two historical assessor failures, source-token correction review, and v2 aggregate roots together.

### Nice to have:

- Add a CI artifact summary for terminal dispositions, unresolved receipts, missing resource fields, and threshold/assessment status without exposing private content.

## Files Found

- `.planning/phases/264-immutable-factory-independent-oracles-and-quarantined-intake/264-AI-SPEC.md` — six rubrics, 16-fixture specification, guardrails, monitoring and private-trace design.
- `.planning/phases/264-immutable-factory-independent-oracles-and-quarantined-intake/264-01-SUMMARY.md` through `264-07-SUMMARY.md`, all PLAN files, `264-FRESH-CALIBRATION-OUTCOME.md`, `264-ASSESSMENT-CORRECTION-REVIEW.md`, `264-SOURCE-TOKEN-DOMAIN-REVIEW.md`, and `264-SECURITY.md` — implementation, actual-run and correction evidence.
- `packages/strategy-lab/src/factory/{contracts,identity,ledger,repository,admission,fingerprint,calibration,calibration-corpus,intake-protocol,intake,supervision-artifacts}.ts` — immutable roots, fingerprints, calibration, intake and private traces.
- `packages/strategy-oracle-tactical/src/*`, `packages/strategy-oracle-teacher/src/*`, `packages/strategy-oracle-model/src/*` — independent leaves and frozen model bundle admission.
- `scripts/author-v1-38-factory-model-source.ts`, `scripts/prepare-v1-38-factory-calibration.ts`, `scripts/run-v1-38-factory-calibration.ts`, `scripts/assess-v1-38-factory-independence.ts`, and `scripts/lib/v1-38-factory-supervised-runtime.ts` — actual authoring, preparation, supervised execution and assessment paths.
- `scripts/check-v1-38-factory-boundaries.ts` and tests — recursive static boundary monitor.
- `.github/workflows/ci.yml` and `264-EVAL-REFERENCE.md` — CI wiring and exact 16-fixture index.
