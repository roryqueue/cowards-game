# Feature Research: v1.17 Python Strategy Runtime Pilot

**Project:** Coward's Game
**Milestone:** v1.17 Python Strategy Runtime Pilot and Broker Contract Hardening
**Researched:** 2026-05-24

## Table Stakes

### Broker Contract

- Runtime registry lists supported implementations and their exact authority.
- Runtime service validates request and response envelopes consistently for JS/TS and Python.
- Unknown runtime target, ABI drift, stale registry, or unavailable implementation fails closed.
- Runtime service health identifies itself as runtime-only, not backend authority.

### Artifact Metadata

- Strategy Revisions and Strategy Artifacts carry language id/version, runtime target, adapter version, source format, package policy, compile metadata, validation status, artifact hash, and eligibility flags.
- Public summaries show only source-safe language/runtime labels.
- Compatibility keys include language/runtime/package/compile dimensions.

### Python Validation

- Workshop can validate and submit Python source in an explicitly experimental path.
- Validation catches syntax/compile errors, missing required functions, forbidden capabilities/imports, unsupported package metadata, and source limits.
- Diagnostics are public-safe and do not echo private source, stack, stderr, host paths, env, tokens, DB DSNs, package paths, or private runtime internals.

### Python Execution

- Python execution happens only behind the runtime ABI and runtime service/broker boundary.
- Python supports the canonical Strategy methods needed for full Match execution.
- Timeouts, crashes, malformed IPC, invalid output, oversized payloads, stderr/stack, and forbidden capability behavior map to the existing failure taxonomy.
- Python runtime has no DB, route, job lifecycle, Match completion, Chronicle persistence, MatchSet scoring, or public evidence authority.

### Non-Counted Proof

- Python can be run in a non-counted Workshop or exhibition-style MatchSet.
- Result and replay surfaces label Python as experimental and non-counted.
- Ranked/ladder/counted gates continue to reject Python.
- Replay board realism checks prove visible Soldiers and terrain are in bounds.

## Differentiators

- A real Python Starter Strategy gives the milestone a user-facing proof instead of only contract work.
- Runtime registry drift monitors make the future broker contract auditable.
- Non-counted MatchSet evidence proves end-to-end flow while preserving competitive integrity.

## Anti-Features

- Python should not appear as a normal public counted language.
- Python should not silently fall back to JS/TS execution.
- Python should not create a new backend or worker ownership path.
- Python should not install packages or access filesystem/network/shell capabilities.
- Python validation should not execute Strategy logic in web/API/Go.
