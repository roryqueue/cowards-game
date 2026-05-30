# Phase 167 Code Review

## Scope

- scripts/evaluate-v1-24-runtime-abuse-lab.ts
- scripts/check-boundary-monitors.ts
- package.json
- apps/web/e2e/v1-18-exhibition-proof.spec.ts
- apps/web/e2e/v1-23-multi-compiler-exhibition-proof.spec.ts
- v1.24 generated artifacts

## Findings

Resolved. Review found that early evidence overclaimed no-fallback readiness, monitor checks were too loose, Markdown privacy scanning was incomplete, and WASM compile failure paths could abort instead of producing non-proof evidence.

## Fixes Applied

- Unavailable-lane no-fallback checks now record explicit non-proof/readiness-only status instead of pass.
- Boundary monitor requires the exact v1.24 probe IDs, statuses, layers, and failure classes.
- Boundary monitor reads and privacy-checks v1.24 Markdown artifacts.
- WASM compile and revision construction are guarded so unavailable toolchains produce classified non-proof evidence.
- Live regression proof is recorded separately from local readiness evidence.

## Residual Risk

Stopped-runtime live drills remain a future stronger-claim gap and are not used for production sandbox certification.
