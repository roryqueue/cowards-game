---
phase: 242
slug: four-language-checker-proof-privacy-and-audit
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-14
---

# Phase 242 Validation Strategy

## Test Infrastructure

| Property | Value |
| --- | --- |
| Framework | Vitest, TypeScript, service-backed proof script |
| Config file | package-local Vitest defaults |
| Quick run command | `pnpm exec vitest run scripts/evaluate-v1-34-workshop-checker.test.ts --reporter=dot` |
| Full suite command | `pnpm --filter @cowards/web test -- app/api/workshop/validate app/api/workshop/revisions workshop-client` |
| Estimated runtime | ~30 seconds |

## Per-Task Verification Map

| Requirement | Behavior | Automated Command | Evidence | Status |
| --- | --- | --- | --- | --- |
| CHECKTEST-01 | Focused route/UI/contract tests | `pnpm --filter @cowards/web test -- app/api/workshop/validate app/api/workshop/revisions workshop-client` | 181 web tests pass | green |
| CHECKTEST-02 | Privacy scans | `pnpm exec vitest run scripts/evaluate-v1-34-workshop-checker.test.ts --reporter=dot` | proof privacy scan passes | green |
| CHECKTEST-03 | Service-backed four-language proof | `pnpm v1.34:workshop-checker` | proof artifact generated | green |
| CHECKTEST-04 | Boundary monitors | `pnpm exec vitest run scripts/check-boundary-monitors.test.ts --reporter=dot` | 13 monitor tests pass | green |
| CHECKTEST-05 | Final records | planning artifacts in Phases 239-242 | summaries, UAT, verification, proof | green |

## Manual-Only Verifications

Browser visual inspection is run after local dev server startup and recorded in final response. All checker behavior has automated coverage.

## Validation Sign-Off

- Service-backed proof covers all four production checker paths.
- Privacy scanner and boundary monitors pass.
- Approval: approved 2026-06-14.
