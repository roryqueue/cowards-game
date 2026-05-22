---
phase: 54
slug: non-js-strategy-product-semantics
status: research
created: 2026-05-22
---

# Phase 54 Research — Non-JS Strategy Product Semantics

## Findings

- The registry in `@cowards/spec` already has the right canonical location for language id/version, adapter id/version, readiness, supported languages, limits, package policy, enabled status, and counted eligibility.
- Existing JS/TS validation reports only know source-shape issues. They do not yet expose runtime semantic issue codes such as unsupported language, unsupported package metadata, ABI mismatch, incompatible adapter, or non-counted eligibility.
- Counted exhibition and ladder paths already fail closed for non-counted adapters, but their reason strings are adapter-id oriented and duplicated.
- Account and public Strategy pages already have runtime metadata available but display raw ids. Exhibition selection filters only `valid`, so experimental valid revisions would either appear selectable or be rejected later unless the client receives eligibility metadata.
- Workshop should continue to default to TypeScript; Phase 54 should not add a language picker.

## Implementation Direction

- Add a spec-level semantic descriptor for runtime metadata so every layer can ask the same questions: language label, adapter label, readiness label, experimental status, package policy, docs/examples hooks, warnings, and counted eligibility.
- Add stable validation/product issue codes and public messages for unsupported language, unsupported package metadata, incompatible adapter, ABI mismatch, source size, memory limit, timeout, forbidden capability, and non-counted eligibility.
- Have JS/TS source validation accept optional runtime metadata and include runtime semantic issues only when a caller intentionally supplies non-default runtime metadata.
- Reuse the spec counted-eligibility helper in competition and ladder gates.
- Include runtime semantics in account revision summaries, then display compact labels and disable non-counted revisions in exhibition selection.

## Risks

- Over-explaining experimental languages in the UI could look like support parity. Keep copy compact and label-like.
- Adding runtime semantic validation must not invalidate existing JS/TS source reports.
- Eligibility checks must not leak private runtime diagnostics.
