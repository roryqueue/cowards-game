---
phase: 247
status: complete
date: 2026-06-15
---

# Phase 247 Research

## Findings

- Current package policy was enforced in several places but lacked one versioned source of truth.
- Spec validation already rejects declared package metadata and required capabilities for counted play.
- Go readiness and entry gates already reject package mode other than `none`, but public runtime semantics could still label malformed package metadata as "No packages".
- JavaScript/TypeScript, Python, Rust, and Zig validators deny host imports, package imports, dynamic imports, package installation, and native/package capabilities.
- Existing v1.35 inventory required Phase 247 to prove no package ecosystem, rich-package, host import, package-path, or diagnostics leakage drift.

## Decision

Create a spec-owned package policy contract, make Go package labels fail-loud, and add a deterministic proof monitor. Do not enable any package lane.
