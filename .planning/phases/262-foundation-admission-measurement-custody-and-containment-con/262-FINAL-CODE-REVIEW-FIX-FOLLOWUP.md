---
phase: 262-foundation-admission-measurement-custody-and-containment-con
fixed_at: 2026-08-31T21:33:00-04:00
review_base: 664a098e
status: fixed
---

# Phase 262 Final Code Review Fix Follow-up

The post-hardening `--check-later-head` regression is fixed. Historical Plan 127 review bytes are now reconstructed from the review publication commit's sole parent, not from the newest later commit that touched the checker. The publication commit, its three published files, the Plan 128 five-path publication, the exhausted `0/540` branch, and all false authority fields remain immutable.

Verification:

- RED: `3fa0b50a`
- GREEN: `2df81dbf`
- Plan 127 focused suite: 19/19 passed
- Exact later-head command: `verified:true`, branch `gaps`, Phase 263 planning/execution false, all authority false
- TypeScript and diff checks passed

No live experiment, producer, preflight, calibration, Match, private-evidence, carrier publication, or Phase 263 operation was run.
