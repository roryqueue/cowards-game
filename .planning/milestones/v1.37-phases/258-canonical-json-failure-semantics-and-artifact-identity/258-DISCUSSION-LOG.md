# Phase 258: Canonical JSON, Failure Semantics, and Artifact Identity - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.

**Date:** 2026-07-12
**Phase:** 258-canonical-json-failure-semantics-and-artifact-identity
**Areas discussed:** Canonical JSON profile, runtime budget contract, failure ownership taxonomy, source/artifact identity chain

## Canonical JSON profile

| Decision | Options considered | Selected |
|----------|--------------------|----------|
| Duplicate keys | Reject raw; last wins; first wins | Reject raw |
| Numbers | Binary64/safe integers; integers only; host-native | Binary64/safe integers |
| Unicode/order | Exact scalars/UTF-8 order; NFC; host order | Exact scalars/UTF-8 order |
| Limits | Base plus field caps; universal; adapter-specific | Base plus field caps |

## Runtime budget contract

| Decision | Options considered | Selected |
|----------|--------------------|----------|
| Dimensions | Canonical vector; wall only; language-specific | Canonical vector |
| Scope | Per invocation plus Match; invocation only; Match only | Per invocation plus Match |
| Exhaustion | Cause-sensitive; always player; always system | Cause-sensitive |
| Preflight | Separate budgets; same budget; unbounded | Separate budgets |

## Failure ownership taxonomy

| Decision | Options considered | Selected |
|----------|--------------------|----------|
| Exceptions | Origin-based; all player; all system | Origin-based |
| Malformed output | Adapter envelope/Strategy payload split; all player; all system | Ownership split |
| Invalid memory | Discard proposal; apply valid memory; reset memory | Discard proposal |
| Retry | System only/same state; both; neither | System only/same state |

## Source/artifact identity chain

| Decision | Options considered | Selected |
|----------|--------------------|----------|
| Source identity | Original plus derivative; normalized primary; text string | Original plus derivative |
| Hashes | Domain-separated; plain digest; manifest only | Domain-separated |
| Toolchain identity | Resolved behavior identity; version only; lockfile only | Resolved behavior identity |
| Manifest | Closed graph/attestation; schema only; checksum only | Closed graph/attestation |

**User's choice:** Selected the recommended option for every Phase 258 question.

## the agent's Discretion

- Exact limit values, budget values, internal names, and module layout after research and adversarial calibration.

## Deferred Ideas

None.
