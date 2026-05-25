---
phase: 126
status: passed
nyquist_compliant: true
---

# Phase 126 Validation

| Requirement | Status | Evidence |
|---|---|---|
| Default subprocess evidence | COVERED | Worker-thread and host subprocess candidates pass in default artifact. |
| Container strict lane | COVERED | Existing `pnpm sandbox:evaluate:container` remains required-fail when unavailable/skipped. |
| Runsc strict lane | COVERED | `pnpm sandbox:evaluate:runsc` fails loudly without `runsc` or without an executable runsc probe adapter. |
| Honest candidate comparison | COVERED | v1.19 Markdown includes proves/does-not-prove columns. |

Commands run:
- `pnpm sandbox:evaluate`
- `pnpm sandbox:evaluate:check`
- `pnpm sandbox:evaluate:runsc` expected failure until runsc probes run under a real adapter.
