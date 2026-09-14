# EVAL-REVIEW — Phase 264: Immutable Factory, Independent Oracles, and Quarantined Intake

**Audit Date:** 2026-09-13  
**AI-SPEC Present:** Yes  
**Overall Score:** 70/100  
**Verdict:** NEEDS WORK

This is a source/mechanics audit, not a production certification. It does not promote synthetic fixtures, injected supervision, or the six-case mechanics corpus into provider, model, human, candidate, or independence evidence. Plan05 is source-complete at `f7395d8a` with zero remaining workload-closure gaps. Plan07's exact provider/model bundle, authorized decision facts (the human/external channel may remain explicitly unused), and fresh finite allocation are absent, so genuine empirical readiness remains blocked.

## Dimension Coverage

| Dimension | Status | Measurement | Finding |
|-----------|--------|-------------|---------|
| Immutable provenance and provider identity | PARTIAL | Code + blocked real-input path | Factory packet/proposal/validation/candidate roots, exact provider/model/version/settings commitments, source/request/response roots, lineage, native lane, and content-addressed publication are implemented. Frozen-model admission blocks missing or drifted identities as charged outcomes, and focused tests cover root tampering, structural clones, unavailable provider, and identity drift. The planned real-input proof is not available: no Plan07 provider bundle has been supplied, so fixture identity cannot count as actual provider provenance. |
| Legal-information-only supervised execution | COVERED | Code | Tactical and teacher leaves use canonical legal inputs; teacher-only counterfactuals are projected away. Admission authorizes hostile bytes only for the existing supervised bridge, and the selected runtime adapter binds source, lane, ABI, image, attempt, and budget identities. The recursive boundary monitor passed 30 tests and reported 1,271 files with zero violations. No generated source was executed in this audit, by design. |
| Charged three-way disposition | COVERED | Code | Append-only start-before-work charging and terminal ledger validation retain accepted, player-violation, system-failure, invalid, rejected, duplicate, legal-but-weak, retried, and unresolved dispositions. Supervision maps player failure and system failure separately and marks system failure as not gameplay. Focused ledger, intake, supervision-artifact, and runner tests exercise retention and cleanup paths. |
| Independence, clone, and correlation | PARTIAL | Code + development fixtures | Six rederived roots, dependency/authorship/failure receipts, unresolved quarantine, and a static package/boundary audit exist. The six-category comparison corpus derives paired projections and agreement signals, while the separate 16-fixture reference index covers the broader admission/privacy/clone/intake contract. Thresholds remain `null`, every receipt is `unresolved`, and no three-channel real evidence or frozen cutoffs exist. It therefore cannot make an independence claim. |
| Quarantined intake and disclosure | COVERED | Code | Frozen intake protocol, explicit participant/reviewer identifiers, roots-only reviewer projection, prohibited-field rejection, conflict/review disposition handling, pre-validation charging, duplicate/retry/budget accounting, and common hostile-source admission are implemented and tested. No real participant is claimed or required for this channel implementation; any Plan07 decision may explicitly mark the human/external lane unused. |
| Bounded offline resource accounting | PARTIAL | Code + blocked real-input path | Frozen model bundles require input/output tokens, token limit, elapsed time, resource root, attempt/budget roots, and lineage. Factory starts bind resource-accounting roots before work, and retained supervision artifacts preserve bounded ordered records and runtime accounting. The accounting mechanics are exercised locally, but no live model bundle or fresh finite allocation exists from which to verify an actual producer attempt. |

**Coverage Score:** 3/6 (50%)

## Infrastructure Audit

| Component | Status | Finding |
|-----------|--------|---------|
| Eval tooling (Vitest 4.1.6 + TypeScript/Zod) | Installed / Configured | Existing lockfile-pinned Vitest and TypeScript are installed and called by the focused Phase264 tests. Final source-only verification at `f7395d8a` covers 20 files/156 tests in 53.02s, four private-package builds, standalone four-script types, and 16 additional pure regressions; no hosted eval package is required by the AI-SPEC. |
| Reference dataset | Present | `264-EVAL-REFERENCE.md` maps the specified 16 development fixtures (4/4/3/3/2) to existing executable test branches and expected receipt/disposition evidence. The separate six-case comparison corpus remains mechanics-only and is not substituted for this index. |
| CI/CD integration | Present | `.github/workflows/ci.yml` now has one named five-minute source-only Phase264 step after the existing install. It runs the exact 19 pure/injected test files and recursive boundary monitor, with no empirical prepare/run, service, credential, or new dependency. The YAML is source-reviewed; remote CI passage is not claimed. |
| Online guardrails | Implemented | Provenance admission, execution-boundary enforcement, and clone/intake quarantine are implemented as fail-closed code paths. Boundary, admission, model identity, intake, and ledger tests cover the denial paths. This is private offline infrastructure, not a production traffic deployment. |
| Tracing (private content-addressed JSON traces) | Configured | The selected design intentionally has no Langfuse/LangSmith/Phoenix/Promptfoo integration. Supervision receipts, ordered execution/transition/accounting/trace artifacts, and roots-only reports wrap the actual injected/supervised runtime seam; no live provider trace exists because no provider was authorized. |

**Infrastructure Score:** 100/100

## Critical Gaps

- **BLOCKER — Genuine empirical readiness is not authorized.** Plan07 has not supplied the exact provider/model/version/settings bundle, an authorized decision for the human/external lane (which may explicitly be unused), or a fresh finite allocation. No provider, human, external, candidate, Match, or independence evidence may be counted; synthetic fixtures remain mechanics-only.
- **WARNING — Independence calibration is unresolved.** Numeric clone/correlation thresholds are not frozen, the six-category comparison corpus is intentionally mechanics-only, and all six-dimensional receipts remain quarantined.

## Remediation Plan

### Must fix for complete Phase264 evaluation readiness:

1. Obtain and retain the exact Plan07 provider/model bundle, authorized intake decision, and fresh finite allocation. Prepare only from those content-addressed roots; otherwise keep the explicit blocked report.
2. If the Plan07 decision is authorized, run only the fresh bounded calibration path through Plan08. Preserve every terminal disposition and keep real evidence distinct from mechanics fixtures; if the human/external lane is unused, retain that explicit unavailable-channel decision.
3. Freeze numeric clone/correlation thresholds only from the authorized development evidence, or retain the explicit blocked/unresolved readiness report.

### Should fix soon:

- Retain borderline and unavailable cases as `unresolved` when thresholds are frozen after authorized development calibration.
- Add a roots-only readiness report that makes the code-mechanics score and genuine-channel readiness status impossible to conflate.

### Nice to have:

- Keep the 16-fixture index synchronized when future mechanics cases are added; do not duplicate fixture payloads or expose source, memory, objective, host, or provider secrets.
- Add a lightweight CI artifact summary for counts of terminal dispositions, unresolved receipts, and missing resource fields.

## Files Found

- `.planning/phases/264-immutable-factory-independent-oracles-and-quarantined-intake/264-AI-SPEC.md` — six dimensions, 16-fixture dataset specification, guardrails, private tracing and monitoring design.
- `.planning/phases/264-immutable-factory-independent-oracles-and-quarantined-intake/264-01-SUMMARY.md`, `264-02-SUMMARY.md`, `264-03-SUMMARY.md`, `264-04-SUMMARY.md`, `264-06-SUMMARY.md` — completed factory, tactical, teacher, frozen-model, and intake mechanics with explicit non-empirical boundaries.
- `packages/strategy-lab/src/factory/{contracts,identity,ledger,repository,admission,fingerprint,calibration,calibration-corpus,intake-protocol,intake,supervision-artifacts}.ts` and focused tests — immutable roots, charged ledger, six fingerprints, corpus projections, intake, and private trace storage.
- `packages/strategy-oracle-tactical/src/*`, `packages/strategy-oracle-teacher/src/*`, `packages/strategy-oracle-model/src/*` — separate strategic leaves and data-only packet emitters.
- `scripts/ingest-v1-38-factory-packet.ts`, `scripts/prepare-v1-38-factory-calibration.ts`, `scripts/run-v1-38-factory-calibration.ts`, `scripts/lib/v1-38-factory-supervised-runtime.ts` — private integration path and selected supervisor adapter.
- `scripts/check-v1-38-factory-boundaries.ts` and `.test.ts` — recursive static boundary monitor (30 tests; current run scanned 1,271 files with zero violations).
- `.github/workflows/ci.yml`, `package.json`, `packages/strategy-lab/package.json` — inspected for eval/CI wiring; `.github/workflows/ci.yml` now contains the named Phase264 source/eval gate.
- `.planning/phases/264-immutable-factory-independent-oracles-and-quarantined-intake/264-VALIDATION.md`, `264-CORPUS-REVIEW.md`, `264-FACTORY-INTEGRATION-FINAL-REVIEW.md`, `264-WORKLOAD-CLOSURE-REVIEW.md` — final source/mechanics verification, including zero remaining Plan05 workload-closure gaps and the explicit Plan07/08 readiness block.
- `.planning/phases/264-immutable-factory-independent-oracles-and-quarantined-intake/264-EVAL-REFERENCE.md` — exact 16-fixture executable mapping and source-only limits.
- No Langfuse, LangSmith, Arize Phoenix, Braintrust, RAGAS, or Promptfoo integration; private content-addressed tracing is the intentional AI-SPEC design.
