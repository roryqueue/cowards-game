# Phase 238: Workshop Checker Path Inventory and Public Contract - Summary

**Completed:** 2026-06-01
**Requirements:** CHECKINV-01, CHECKINV-02, CHECKINV-03, CHECKINV-04
**Status:** Complete

## Delivered

- Inventory of current Workshop Validate source, Workshop submit/save, account save, competition/trial ladder entry, and runtime-service/provider validation paths for TypeScript, Python, Rust, and Zig.
- Full Workshop checker public contract for Phase 239+ implementation, including statuses, diagnostic categories, provider metadata, artifact/provenance state, availability states, cache identity, privacy exclusions, and ownership/non-claim language.
- Four-language parity matrix comparing Validate source, Workshop submit/save, account save, and entry behavior with `fix now`, `defer`, and `no change` calls.
- Phase verification documenting requirement coverage, boundary preservation, privacy scan results, and residual implementation risks.

## Key Findings

- Python Validate source currently uses local Workshop validation, while submit/save uses runtime-service provider validation.
- Rust/Zig Validate source can call runtime-service, but runtime-service unavailable, toolchain unavailable, and compile failures are not first-class checker states.
- TypeScript is the practical Workshop checker baseline, but Go account save and selected Go exhibition eligibility do not currently require TypeScript provider proof while persistence ladder/competition gates do.
- Current checker output is still just `StrategyRevisionValidationReport`; it lacks the shared v1.34 checker envelope needed for provider-grade parity and ergonomic UX.
- TinyGo remains absent from production Workshop language surfaces.

## Artifacts

- `.planning/artifacts/v1.34-workshop-checker-inventory.md`
- `.planning/artifacts/v1.34-workshop-checker-contract.md`
- `.planning/artifacts/v1.34-workshop-checker-parity-matrix.md`
- `.planning/phases/238-workshop-checker-path-inventory-and-public-contract/238-VERIFICATION.md`

## Next

Phase 239 should implement the `fix now` items from the parity matrix, starting with a unified `/api/workshop/validate` checker envelope and Python provider-grade Validate source parity.
