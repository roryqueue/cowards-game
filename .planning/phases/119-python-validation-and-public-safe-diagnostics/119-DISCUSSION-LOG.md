# Phase 119: Python Validation and Public-Safe Diagnostics - Discussion Log

**Gathered:** 2026-05-25
**Source:** Materialized from approved v1.18 Plan Mode discussion.

## Decisions Captured

### Validation Mechanism
- Selected real Python AST/compile validation where practical.
- Validation must never execute Strategy behavior.
- Package policy remains self-contained source only.

### Diagnostics
- Diagnostics must be public-safe, normalized, and free of source echoes, raw traceback, stderr, stack, host/package paths, environment, tokens, DB DSNs, and private runtime internals.
- Validation and execution imports must remain separate.

## Deferred Ideas

- Production-sandbox validation.
- Auto-fixing Python source.
- Package dependency support.
