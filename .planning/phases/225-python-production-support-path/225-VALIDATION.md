# Phase 225 Validation: Python Production Support Path

## Requirement Coverage

- **PY-01 provider-owned validation:** Covered by runtime-service `/validate-strategy`, `@cowards/runtime-python` validation host, AST/compile checks, forbidden capability rejection, source limits, and public-safe diagnostics.
- **PY-02 runtime boundary:** Covered by runtime-service broker execution tests and unchanged Python host isolation configuration.
- **PY-03 counted eligibility gates:** Covered by spec eligibility tests, persistence ladder/competition tests, Go backend tests, runtime-service validation tests, and HMAC-backed provider-provenance verification.
- **PY-04 product/public surfaces:** Covered by Workshop, runtime-label, evidence-copy, result-view-model, Strategy card, exhibition, and learn surface updates.
- **PY-05 signed-in proof preparation:** Current code paths are ready for Phase 232 signed-in proof. This phase did not run the final four-language browser proof because Rust/Zig remain evidence-gated until Phases 226-227.

## Validation Notes

- Python support remains constrained to self-contained source with no package ecosystem.
- The existing adapter id remains for compatibility; the provider and supported-language registries now determine counted eligibility.
- Python account save validation is provider-owned through runtime-service, not a Go string scanner.
- Counted Python entry requires HMAC-backed provider-validation provenance for the same source hash and source byte count, fails closed without configured provider secret, and requires historical beta revisions to be re-saved through the provider path before counted entry.
- Python Workshop submissions require runtime-service provider validation before persistence.
- Local builders cannot mint Python `providerValidation`; runtime-service validation is the provenance authority, and Workshop recomputes submitted source hash/bytes before save.
- Bundled Python starter samples execute through the Python provider runtime, including helper-function samples.
- Historical non-counted MatchSet governance is preserved in result display.
- Rust/Zig remain non-counted exhibition beta and continue to use WASI Preview 1 stdin/stdout JSON.
