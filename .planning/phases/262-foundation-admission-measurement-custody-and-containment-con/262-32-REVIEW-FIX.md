---
phase: 262
plan: 32
status: complete
---

# Phase 262 Plan 32 Review Fix

## Finding

The frozen manifest used Vitest list full names containing ` > `, while runtime `testNamePattern` matching used concatenated suite/test text. The literal anchored selector therefore selected zero runtime tests.

## Fix

Commit `4a908aac65871b7d090e0a43240436260811b40d` makes each suite separator accept either representation while retaining the exact anchored alternatives and the exact ordered 52-name manifest. Detached A5/A6 inventories match, and the A6 selector runs exactly 52 tests.
