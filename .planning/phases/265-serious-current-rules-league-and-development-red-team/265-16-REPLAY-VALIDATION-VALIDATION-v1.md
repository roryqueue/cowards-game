---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
supplement: replay-validation-source-only
validation_type: source_only_two_task_coverage_audit
source_review: 838d21fcd15c6a53ce280d406af546eb3a10a658
source_root: sha256:6372438dbf0fe8257cc9b6fd84cab89eb0878e31a7040079ccdddee3d4dff222
fixture_root: sha256:f4e10b8186f6103c4d5a4542d7d25529102fa88757b78681879ccf28fd8a5382
requirements_completed: []
requirementsComplete: false
empirical_credit: false
phase_complete: false
execution_authorized: false
---

# Plan 16 replay-validation supplement — validation audit

**Disposition:** Both supplemental source tasks are covered by the dedicated synthetic behavioral tests and the clean independent source review. This is a source-only coverage update, not validation of the full Phase 265 plan or any empirical requirement.

## Audited task coverage

| Task | Required behavior | Evidence and status |
|---|---|---|
| 1 — differential replay contract | Every retained frame is canonically parsed, including late frames; admission, integrity, UTF-8 replacement semantics, finite failures, newline/count behavior, inflate limit and 4× transient-guard call remain decoder-equivalent. | The source summary records the dedicated contract run and full file at 70 passed, 0 failed, 0 skipped. It documents small synthetic rehashed corruption fixtures, parser-visit instrumentation and byte pins. The independent review inspected the validator and confirmed the bounded buffered-inflate/parse-and-discard behavior against the unchanged decoder. **Covered by prior synthetic evidence; not rerun in this audit.** |
| 2 — evidence-reader selection | Only fully admitted prospective v5 diagnostic/baseline allocations use validation without returning frames; default and legacy v0–v4 paths keep the decoder. Evidence output/root, selected replay checks and malformed-final-frame rejection remain intact. | The source summary records actual `verifyLeanEvidence` wiring fixtures with real synthetic allocation admission, replay parsing, gzip and hashing, and distinguishes v5 from legacy/default behavior. The independent review traced admission before replay access and confirmed the narrow two-discriminator branch and unchanged evidence construction. **Covered by prior synthetic evidence; not rerun in this audit.** |

## Verification boundary

No command or test suite was run for this audit. The 70/70 result above is attributed to the separately named source summary and independently reviewed record, both bound to the source and fixture roots in this report; it is not a new execution result. No old artifact, private/empirical replay payload, ordinary/historical/full-manifest reader, provider, Strategy, Match, native Worker, Docker path, or helper/runtime suite was read or executed. No implementation or fixture change was made.

The validator still retains the full bounded synchronous inflate buffer. Frame-at-a-time parsing avoids retaining full decoded text, split lines or parsed frames; this is not streaming decompression and does not establish lower RSS, an RSS ceiling, native feasibility, or baseline feasibility. The dedicated fixture is independently hash-bound above and remains outside the unchanged manifest additions; the implementation source remains included in the manifest, so future source identity changes naturally.

Caps, policy/approval/supplement roots, consumed history and the failed/closed empirical route remain unchanged. This supplement does not authorize a retry, a Match, or any new allocation. LEAG-01–09 remain uncredited; `requirements_completed` stays empty and `requirementsComplete: false`. Whole-phase Nyquist status remains partial/false.

## Files and commands

No files other than this supplemental validation report were created or modified by this audit. No automated command is newly claimed or required here; the source summary records the prior dedicated command:

```sh
node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-replay-validation-v5.test.ts --maxWorkers=1
```

The report is not a commit or a whole-phase validation signoff.
