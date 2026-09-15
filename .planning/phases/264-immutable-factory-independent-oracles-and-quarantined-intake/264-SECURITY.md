---
phase: 264
name: immutable factory, independent oracles, and quarantined intake
slug: immutable-factory-independent-oracles-and-quarantined-intake
status: verified
created: 2026-09-14
asvs_level: 1
block_on: high
threats_open: 0
source_commit: 33b1bdc646cf5e929fe2bbd2b1a7d7bad5db5f75
implementation_root: sha256:c6417231bcff712918627e973d79354b2e6e518b0c088eb396c02f24736b5d38
---

## SECURED

**Phase:** 264 — Immutable Factory, Independent Oracles, and Quarantined Intake  
**Threats Closed:** 23/23 unique threat IDs  
**ASVS Level:** 1 (the phase has no explicit ASVS/block configuration; documented defaults are used)

This is a mitigation-presence audit, not a production certification and not an empirical independence result. The corrected data-only assessment was not executed during this audit; its fail-closed source/root bindings are verified in code.

### Threat Verification

| Threat ID | Category | Severity | Disposition | Evidence |
|---|---|---|---|---|
| T-264-01 | Tampering | high | mitigate | `packages/strategy-lab/src/factory/contracts.ts:18-22,96-109`; `identity.ts:9-20`; `repository.ts:59-77` — canonical bounded schemas, domain-separated roots, immutable artifact/ledger reads |
| T-264-02 | Elevation | high | mitigate | `packages/strategy-lab/src/factory/admission.ts:36-74,207-251` — source is bytes-only at admission; only issued accepted supervision receipts can finalize candidates |
| T-264-03 | Repudiation | medium | mitigate | `packages/strategy-lab/src/factory/ledger.ts:21-40`; `repository.ts:61-77` — root-bound start/terminal pairing and inventory validation |
| T-264-04 | Tampering | high | mitigate | `packages/strategy-oracle-tactical/src/emit.ts:37-74,99-124`; `selector.ts:20-35` — owned controller closure, denied capabilities, source-manifest roots |
| T-264-05 | Information disclosure | high | mitigate | `packages/strategy-oracle-tactical/src/emit.ts:40-56,132-166`; `selector.ts:12-20` — legal-input boundary and closure capability denial |
| T-264-06 | Information disclosure | high | mitigate | `packages/strategy-oracle-teacher/src/teacher.ts:203-348`; `distill.ts:54-120` — canonical-kernel search and sanitized legal student features |
| T-264-07 | Tampering | high | mitigate | `packages/strategy-oracle-teacher/src/teacher.ts:10,147,203-244` — transitions are resumed through `MATCH_KERNEL`, with no copied resolver |
| T-264-08 | Spoofing | high | mitigate | `packages/strategy-oracle-model/src/bundle.ts:74-79,184-224`; `emit.ts:35-60,121-146` — exact provider/request/response roots and unavailable serving snapshot |
| T-264-09 | Elevation | high | mitigate | `packages/strategy-oracle-model/src/bundle.ts:228-233`; `emit.ts:124-146` — canonical data admission and packet conversion have no provider/network/source-execution path |
| T-264-10 | Tampering | high | mitigate | `packages/strategy-lab/src/factory/fingerprint.ts:68-109,121-148`; `calibration.ts:163-200` — rooted dimensions, complete-cell/pair checks, unresolved decision path |
| T-264-11 | Elevation | high | mitigate | `scripts/check-v1-38-factory-boundaries.ts:142-149,192-221` — AST capability/graph monitor rejects hostile private execution and public-to-private reachability |
| T-264-12 | Information disclosure | high | mitigate | `packages/strategy-lab/src/factory/intake-protocol.ts:1-120` — strict roots-only reviewer projection and prohibited-class rejection |
| T-264-13 | Repudiation | high | mitigate | `packages/strategy-lab/src/factory/intake.ts:1-180`; `intake-protocol.ts:60-120` — charge-first, protocol-scoped retries/budgets, root-bound terminal retention |
| T-264-14 | Spoofing | high | mitigate | `packages/strategy-oracle-model/src/bundle.ts:96-180,204-224`; `scripts/v1-38-factory-execution-evidence.ts:87-145` — requested/reported identity, usage, settings, and client binding |
| T-264-15 | Information disclosure | high | mitigate | `scripts/v1-38-factory-execution-evidence.ts:87-145`; `packages/strategy-oracle-model/src/bundle.ts:204-224` — disclosed packet/capture isolation and private raw-record linkage |
| T-264-16 | Tampering | high | mitigate | `scripts/v1-38-factory-execution-evidence.ts:116-143`; `scripts/assess-v1-38-factory-independence.ts:137-160` — allocation, ordinal, request, source, receipt, and workload roots are checked |
| T-264-17 | Elevation | critical | mitigate | `scripts/v1-38-factory-execution-evidence.ts:94-143`; `scripts/check-v1-38-factory-boundaries.ts:199-221` — read-only disclosed authoring and runtime boundary checks; no emitted-source execution lane |
| T-264-18 | Tampering | high | mitigate | `scripts/assess-v1-38-factory-independence.ts:137-168`; `calibration.ts:143-157,163-167` — actual retained roots, 24 pair/48 publication completeness, and per-slot completeness guards |
| T-264-19 | Repudiation | high | mitigate | `scripts/assess-v1-38-factory-independence.ts:171-201`; `packages/strategy-lab/src/factory/numeric-calibration.ts` — frozen controls/threshold roots and charge-first retained evidence |
| T-264-20 | Information disclosure | high | mitigate | `scripts/assess-v1-38-factory-independence.ts:198-201`; `scripts/v1-38-factory-observation-equality.ts:4-13` — assessment stores private aggregate roots/counts/scores; comparison is direct map equality |
| T-264-21 | Spoofing | critical | mitigate | `scripts/assess-v1-38-factory-independence.ts:174-201,205-218`; `scripts/check-v1-38-factory-boundaries.ts:159-221` — three-channel/control comparison, implementation-root equality, monitor, and read-only retained verification are enforced |
| T-264-22 | Elevation | critical | mitigate | `scripts/assess-v1-38-factory-independence.ts:198-218`; `packages/strategy-lab/src/factory/admission.ts:36-74` — assessor emits data-only private evidence and candidate execution remains supervised |
| T-264-SC | Tampering | high/low* | accept | No package-install code path is present in the phase; accepted-risk entry below covers the repeated Plan 01–08 declaration. |

\* `T-264-SC` is declared `high` in Plans 01–06 and `low` in Plans 07–08; it remains an explicitly accepted, unused action in every declaration.

### Accepted Risks Log

| Threat ID | Accepted risk and basis |
|---|---|
| T-264-SC | Package installation is intentionally out of scope. The phase added four private workspace importer entries to `pnpm-lock.yaml`; existing external resolutions and snapshots were unchanged, and no package-install operation or dependency fetch occurred. This is accepted as declared by Plans 01–08, not treated as a mitigation or as evidence of empirical readiness. |

### Unregistered Flags

None. Plans 01–07 contain no `## Threat Flags` entries; the supplied Phase 264 outcome/review materials introduce no additional unmapped flag.

### Assessment-status boundary

The implementation contains a fail-closed corrected-reader path: `scripts/v1-38-factory-assessment-correction.ts:29-79` permits only the reviewed reader-file diff and binds the historical failure/current review; `scripts/assess-v1-38-factory-independence.ts:205-218` reopens retained results without execution. This closes the declared security control, but does not assert that the currently running corrected assessment has passed or that oracle independence is established.

SECURITY.md: `.planning/phases/264-immutable-factory-independent-oracles-and-quarantined-intake/264-SECURITY.md`

### Audit Trail and Signoff

- Audit result: 23 declared unique threats closed; 0 blocking or non-blocking open threats.
- Reviewed source: `33b1bdc646cf5e929fe2bbd2b1a7d7bad5db5f75` (`sha256:c6417231bcff712918627e973d79354b2e6e518b0c088eb396c02f24736b5d38`).
- Signoff: security mitigation verification complete; empirical independence/readiness remains explicitly unclaimed pending the corrected data-only assessment.
