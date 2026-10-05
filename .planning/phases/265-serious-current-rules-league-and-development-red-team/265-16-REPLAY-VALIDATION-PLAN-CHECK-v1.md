# Plan 16 replay-validation supplement — plan check

**Status:** passed  
**Scope checked:** `265-16-REPLAY-VALIDATION-PLAN-v1.md` only  
**Disposition:** The supplement is an adequately bounded source-only repair; it does not reopen the failed v5 baseline envelope or authorize empirical work.

## Findings

No critical gaps found against the requested scope.

## Goal-backward checks

- **Full-frame parse and bounded retention:** Task 1 retains the existing bounded inflate buffer, validates payload length/hash and newline/frame-count contract before parsing, then scans and parses each frame individually without full decoded text, split-line arrays, accumulated parsed frames, or a returned array. It retains the existing canonical `parse` helper and explicitly tests late-frame failures.
- **Acceptance and resource compatibility:** The plan calls for differential acceptance/error-code tests against the unchanged decoder, preserving metadata/root/compressed-byte checks, the 4× transient guard, synchronous gunzip and its existing `maxOutputLength`, inflated length/hash checks, terminal newline/count rules, and UTF-8 decode/re-encode replacement semantics. Small synthetic fixtures exercise exact/over limits and corruption without large payloads. The empty payload/zero-frame case is explicitly preserved.
- **Strict v5-only reader selection:** Task 2 requires full allocation admission and confirmation of the admitted v5 mode before using the validator, limited to the two exact prospective v5 discriminants. All other/default and legacy paths retain the decoder call. Actual `verifyLeanEvidence` fixtures exercise the selected and unselected branches, malformed final frames, and unchanged evidence output/root; admission and validator are not stubbed.
- **No authority or empirical expansion:** The supplement explicitly preserves `execution_authorized: false`, empty `requirements_completed`, failed-envelope closure, 24 prior charges, and the carried cumulative cap formula. It prohibits real replay payloads, old/full readers, helper generation, Matches, retries, and new authorization. Synthetic source proof grants no empirical credit.
- **Task/file/scope limits:** Two serial TDD tasks own exactly the two allowed source/test files. Separately named reports do not add numbered plans. No empirical claim or performance/RSS guarantee is made; the plan expressly disclaims native feasibility and full-baseline completion.

## Structured issues

```yaml
issues: []
```

The source-level contract is sufficiently specified for bounded execution and independent review. This check establishes plan adequacy only; it is not evidence that the implementation, tests, or any empirical baseline succeeded.
