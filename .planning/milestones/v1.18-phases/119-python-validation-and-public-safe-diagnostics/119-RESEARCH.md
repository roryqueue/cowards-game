# Phase 119 Research

## Key Findings

- v1.17 Python validation used heuristic TypeScript-side checks.
- A separate Python validation host can parse and compile source without calling `select_activations`, `soldier_brain`, or other Strategy behavior.
- Diagnostics must identify safe categories, locations, and remediation without echoing source, traceback, host paths, stderr, package paths, tokens, or private runtime internals.

