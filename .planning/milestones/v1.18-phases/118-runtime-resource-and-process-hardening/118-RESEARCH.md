# Phase 118 Research

## Key Findings

- Python subprocess launch already used empty environment and no shell by option, but did not centralize or test isolated-mode arguments.
- Timeout and malformed IPC were classified, but stdio cap outcomes needed deterministic taxonomy coverage.
- Python `-I` is practical for local Python 3.9 isolated mode; safe-path `-P` is not portable enough to require for the v1.18 baseline.
- Container/gVisor evidence remains readiness evidence and cannot be called production sandbox certification.

