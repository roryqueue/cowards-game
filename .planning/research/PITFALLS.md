# Pitfalls Research: v1.7 Runtime and Backend Boundary Stabilization

**Date:** 2026-05-22
**Milestone:** v1.7 Runtime and Backend Boundary Stabilization

## Boundary Pitfalls

### Contract Drift

If TypeScript, Go, OpenAPI, and runtime adapters each define their own DTOs, parity will decay immediately.

Prevention:

- Keep `@cowards/spec` authoritative in v1.7.
- Use generated fixtures and schema validation as the cross-language handshake.
- Require every Go/Python spike output to round-trip through the same golden JSON.

### Accidental Rewrite

Service-boundary work can become a backend migration in disguise.

Prevention:

- Limit Go to read-only endpoints.
- Keep orchestration, job claiming, Strategy execution, and writes in the existing TypeScript stack.
- Track "not moved yet" explicitly in requirements and roadmap.

### Runtime ABI That Leaks JS Assumptions

The current subprocess IPC is useful but not fully language-neutral.

Prevention:

- Avoid JS-specific terms in ABI fields where language-neutral vocabulary works.
- Model source/package metadata separately from raw source.
- Define capability restrictions and failure taxonomy outside `runtime-js`.

### Privacy Regression Across New DTOs

Boundary expansion creates new places for Strategy source, memories, objectives, raw Awareness Grid, stack traces, and owner debug data to leak.

Prevention:

- Make privacy redaction a golden fixture category.
- Keep leak assertions in `@cowards/spec`.
- Require public DTO schemas for replay, MatchSets, analytics, exports, ladders, profiles, and public Strategy cards.

### False Confidence From One Runtime Spike

A Python or Go spike can prove ABI shape but not production sandbox safety.

Prevention:

- Mark the second runtime experimental.
- Keep JS/TS as the only fully enabled runtime.
- Preserve hostile runtime tests and do not weaken the existing worker/subprocess distinction.

### JSON Canonicalization Surprises

Go, Node, and Python can all emit semantically equivalent JSON with different string formatting, ordering, escaping, or trailing newlines.

Prevention:

- Compare parsed canonical data for most fixtures.
- Use explicit normalized hashes only where hash contracts require them.
- Avoid raw byte comparisons unless the test owns serialization settings.

Primary source note: Go `encoding/json.Encoder.Encode` adds a trailing newline, and JSON escaping behavior has safety defaults. Source: https://pkg.go.dev/encoding/json

### Shell and Environment Hazards

Runtime spikes that invoke shell commands, inherit environment, or use ambiguous executable lookup undermine the security model.

Prevention:

- No shell invocation for runtime subprocesses.
- Empty/minimal environment.
- Fully qualified executable path or controlled runtime launcher.
- stdout/stderr caps and timeout behavior preserved.

Primary source note: Python subprocess docs warn about `shell=True`, recommend fully qualified executable paths for reliability, and state subprocess does not implicitly choose a shell. Source: https://docs.python.org/3/library/subprocess.html

## Phase Placement Guidance

- Service boundary contract should come before Go backend spike.
- Runtime ABI should come before adapter registry and non-JS spike.
- Golden parity should come before relying on cross-language behavior.
- Adapter registry should come before compatibility-sensitive MatchSet/analytics changes.
- Spikes should remain late enough to consume contracts but early enough to expose contract gaps before milestone close.
