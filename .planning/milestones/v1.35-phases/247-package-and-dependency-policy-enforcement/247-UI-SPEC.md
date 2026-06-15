---
phase: 247
status: complete
ui_required: yes
date: 2026-06-15
---

# Phase 247 UI Spec

## Label Contract

- Current supported lanes: "No packages" when runtime package mode is `none`.
- Malformed/declared package metadata: "Package metadata unsupported".
- Future package requirements may be developer-facing, but they must not look like current product support.

## Public Behavior

Public/default output must not expose package paths, host paths, env values, tokens, DB details, raw diagnostics, raw compiler/runtime output, source, artifact bytes, or private runtime internals.

## Verification

Public discovery and Workshop tests continue to use package-safe labels. The package proof artifact scans for private package markers and positive overclaims.
