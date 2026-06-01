# Phase 235 Research: Python Artifact Provenance

## Findings

- Python validation already enforced no imports, no packages, no filesystem/network/clock/random, and host execution through the constrained subprocess provider.
- Provider proof previously bound only source hash and source bytes.
- Python execution used `revision.source` directly, so artifact provenance needed to bind the executable source bundle without claiming WASM isolation.

## Decision

Use a normalized Python source-bundle artifact as provenance evidence. It records hash, bytes, source binding, interpreter metadata, validation policy, and a public `provenance-only` claim.
