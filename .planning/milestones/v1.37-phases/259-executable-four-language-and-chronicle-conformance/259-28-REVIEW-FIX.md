---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "28"
fixed_at: 2026-07-16T21:23:55Z
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 259 Plan 28: Code Review Fix Report

Both actionable bootstrap findings were fixed.

## Fixed Issues

### CR-01: Descriptor path checks followed symbolic links

The bootstrap now opens the exact descriptor with `O_NOFOLLOW`, validates owner, mode, regular-file type, size, device, inode, and byte count on the same open handle, and repeats that operation inside the serializable transaction.

### CR-02: The generation head permitted manual rollback or skips

Migration 0024 now installs a database trigger requiring every head update to advance by exactly one. Rollback and skipped-generation tests fail at the database boundary.

## Verification

- Focused PostgreSQL and CLI suites: 46/46
- Symlink, writable-file, rollback, and skipped-generation regressions: passed
- Persistence typecheck and focused formatting: passed
- Protected baseline: exact

Fix commit: `a9b3939`.
