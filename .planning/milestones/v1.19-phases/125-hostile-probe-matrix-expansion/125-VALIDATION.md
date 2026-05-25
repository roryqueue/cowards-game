---
phase: 125
status: passed
nyquist_compliant: true
---

# Phase 125 Validation

| Requirement | Status | Evidence |
|---|---|---|
| Unified matrix | COVERED | `SandboxProbeTaxonomy` included in every probe result. |
| Required hostile families | COVERED | Guardrail checks filesystem, network, process, import/package, dynamic execution, env, output, memory, timeout, crash, IPC, redaction, and invalid output. |
| Bounded execution | COVERED | Existing timeouts/resource caps retained. |
| Public diagnostics redacted | COVERED | `assertSandboxEvaluationPublicSafe` still runs on generated report. |

Commands run:
- `pnpm --filter @cowards/runtime-js test`
- `pnpm sandbox:evaluate:check`

