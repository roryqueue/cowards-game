---
phase: 265
plan: 16
status: fixed_pending_independent_re_review
author_agent: /root
empirical_executed: false
---

# Narrow early-run closure repair

Review-v2 found that a spent v8 run scope refusal could close without attaching its existing prepared ledger. MAIN added an actual CLI regression: the original source failed with `LEAN_CORRECTION_ADMISSION_CUSTODY`; the repaired source attaches the authenticated existing ledger before the scope guard, without weakening that guard or fabricating child custody. Legacy ordering remains unchanged.

Final v8 source-only suite: 18/18 passed. Strategy-lab strict package types and diff check passed. No native execution, preparation, allocation, empirical reader or Match occurred. The complete 900-entry inventory was refreshed; ordinal-1 source root is `sha256:2afd93b1f7388da9c89258c499d96c8fd4e411f499215b2b6403d91a4ba277c8`.

Independent re-review, validation and source verification remain required before MAIN may author a fresh prospective request. All consumed evidence and frozen limits remain unchanged.
