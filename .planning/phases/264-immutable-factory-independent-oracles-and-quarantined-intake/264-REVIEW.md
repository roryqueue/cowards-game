---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
reviewed: 2026-09-14T13:38:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - packages/strategy-oracle-model/src/bundle.ts
  - packages/strategy-oracle-model/src/model.test.ts
  - packages/strategy-oracle-model/src/emit.ts
  - scripts/ingest-v1-38-factory-packet.ts
  - scripts/ingest-v1-38-factory-packet.test.ts
  - scripts/author-v1-38-factory-model-source.ts
  - scripts/author-v1-38-factory-model-source.test.ts
  - scripts/prepare-v1-38-factory-calibration.ts
  - scripts/prepare-v1-38-factory-calibration.test.ts
findings:
  critical: 4
  warning: 0
  info: 0
  total: 4
status: issues_found
source_commit: 51743784
review_head: 8a5584d7
scope: Plan264-07_only
---

# Phase 264: Code Review Report

**Reviewed:** 2026-09-14T13:38:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Focused tests pass, but that only exercises declared data shapes. The fresh-route implementation still treats isolation, author-attempt accounting/capture, and the 48-cell allocation as unconnected declarations. Its successor model schema also permits invented version metadata and hashes request/response records without retaining or rederiving them. Those gaps violate the approved pre-output gate; this review makes no empirical claim.

## Critical Issues

### CR-01: BLOCKER — The ready author command does not enforce disclosed-packet-only isolation

**File:** `scripts/author-v1-38-factory-model-source.ts:42-46`

**Issue:** `buildFactoryAuthorCommand()` accepts caller-supplied documentation booleans as proof of isolation, then returns an ordinary `codex exec` invocation. Its nominal `cwd` is only a returned string, not a process setting; `packetRoot` is neither passed as stdin nor named in `argv`; and no command/configuration disables read, shell, network, or repository access. A later caller that treats `status: "ready"` as authorization launches a CLI process capable of seeing its normal environment and current repository, so the disclosed-packet-only boundary is not enforced.

**Fix:** Replace the boolean assertion with a capability probe and an executable launch plan that creates a fresh disclosed-packet directory, writes/passes only the admitted packet there, sets the real child cwd and sanitized environment, and uses verified CLI options/configuration that disable reads and all non-authoring tools. Fail closed when those capabilities cannot be demonstrated; add a test that the packet is actually delivered and prohibited paths/tools cannot be requested.

### CR-02: BLOCKER — No immutable author-attempt lifecycle or model-result capture exists

**File:** `scripts/author-v1-38-factory-model-source.ts:8-55`

**Issue:** The file creates one static allocation root and a stand-alone usage predicate, but it has no durable attempt record/start lock, first-start 30-minute window, ordinal/retry handling, total-budget accumulation, terminal charge journal, actual CLI JSON parsing, or request/response/source capture. `--help` is its sole CLI behavior (line 55). Consequently A-01..A-04, the 50k/200k ceilings, missing-usage terminal stop, and D-17 capture cannot be enforced before a real authoring process consumes resources; a caller can repeatedly invoke the returned command with no retained charge or provenance.

**Fix:** Add a private, content-addressed authoring-attempt ledger rooted in the frozen allocation. Before launch, atomically allocate/lock an ordinal and window; after every outcome persist the exact request/context, raw response, requested/reported identities, client settings, actual usage, emitted source, and terminal disposition. Compute per-attempt and total accounting from those retained records and prohibit any replacement/next launch after a missing, over-limit, or system-failure terminal result.

### CR-03: BLOCKER — The actual calibration preparer accepts an arbitrary small manifest instead of the frozen 48-cell allocation

**File:** `scripts/prepare-v1-38-factory-calibration.ts:21-29,55-99`

**Issue:** `createFreshFactoryCalibrationCells()` correctly declares 48 cells, but `prepareFactoryCalibration()` never calls it or binds its roots. It instead trusts an externally supplied authorization with any positive `maxAttempts` and any non-empty workload list, then only rejects a list longer than that arbitrary maximum (lines 85-90). The test intentionally authorizes one tactical workload with `prepare-seed` and a 64-invocation cap (test lines 34-45), proving the real preparation path can issue a manifest unrelated to the specified 12 slots, both arenas/sides/initiatives, fixed seed, 48 workloads, and frozen authoring allocation.

**Fix:** Require the exact `FactoryAuthoringAllocation` root and derive all 48 workload artifacts from `createFreshFactoryCalibrationCells()` plus the prescribed slot recipes. Validate a one-to-one, root-equal 48-cell set (including arena, side, initiative, seed, phase, and 256/120000 limits) before publishing the authorization/manifest; reject any supplemental, omitted, or substituted workload.

### CR-04: BLOCKER — Successor provenance permits fabricated model-version metadata and cannot prove its request/response records

**File:** `packages/strategy-oracle-model/src/bundle.ts:30-55,74-82,89-99`

**Issue:** V2 still inherits the mandatory free-form `provider.modelVersion` field. The only V2 anti-fabrication check is `identity.modelVersion !== client.version` (line 97), so any arbitrary string such as `"server-build-42"` is admitted despite `servingSnapshot.availability: "unavailable"`. Separately, `requestRecordRoot` and `responseRecordRoot` are accepted merely because they equal pre-supplied roots; the bundle contains no request bytes/record or raw response record from which those roots can be rederived. The ingestion reload only re-admits this same unverified structure. Thus a purported exact serving identity or request/response provenance can be invented while still passing schema validation.

**Fix:** Define a V2-only provider/provenance shape that represents the serving revision as explicit `unavailable` (rather than a generic `modelVersion`), while retaining only declared requested/reported IDs and client metadata. Include canonical immutable request/context and raw response record values (or load them from a verified private artifact store) and rederive every corresponding root, byte length, source, and usage linkage during admission and reload. Add negative tests for an invented model version and for altered/missing request or raw-response records.

---

_Reviewed: 2026-09-14T13:38:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
