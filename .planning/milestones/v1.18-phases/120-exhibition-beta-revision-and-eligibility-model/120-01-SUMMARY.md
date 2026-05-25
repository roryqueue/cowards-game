# Phase 120 Summary

## Completed

- Workshop account saves now include `sourceFormat`.
- Go live backend can persist Python account revisions with Python runtime metadata, non-counted warning metadata, and exhibition-only eligibility.
- Go account summaries now include `languageId` and `adapterId` runtime semantics and distinguish Python from TypeScript.
- Workshop, account, exhibition creation, and public strategy pages now label Python as non-counted exhibition beta.
- Added Go tests for Python revision metadata, validation, and eligibility gates.

## Evidence

- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...` passed.
- `pnpm --filter @cowards/web typecheck` passed.
- `pnpm exec tsx scripts/check-boundary-monitors.ts` passed.

