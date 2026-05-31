# Phase 220 Verification

Status: Passed.

- `PLAYWRIGHT_TEST=1 pnpm e2e --project=desktop --project=mobile -- v1-31-public-site-spine.spec.ts`
- Playwright screenshots:
  - `/tmp/cowards-v131-visual/home-desktop.png`
  - `/tmp/cowards-v131-visual/watch-mobile.png`
  - `/tmp/cowards-v131-visual/competition-desktop.png`
- The in-app browser bridge was unavailable in this session, so visual QA used Playwright screenshots against the same local app.

Notes:
- Anonymous public journey covers `/`, `/watch`, MatchSet result, entry sign-in gate, `/learn`, `/workshop`, and `/account`.
- Signed-in dashboard behavior is covered by `apps/web/lib/public-discovery-service.test.ts`, including eligible saved revisions without source exposure.
- Public rendered-page privacy markers and unsafe href checks are covered in the v1.31 Playwright spec.
