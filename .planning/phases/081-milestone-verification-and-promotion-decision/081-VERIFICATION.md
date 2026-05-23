---
status: complete
phase: 081
---

# Verification

| Command | Result |
| --- | --- |
| `pnpm exec vitest run scripts/check-local-topology.test.ts scripts/check-boundary-monitors.test.ts apps/web/lib/public-go-read-client.test.ts apps/web/lib/public-service-adapter.test.ts` | Passed, 20 tests |
| `pnpm --filter @cowards/web typecheck` | Passed |
| `pnpm typecheck` | Passed, 12 packages |
| `pnpm lint` | Passed, 12 packages |
| `pnpm test` | Passed, 12 packages; web suite 109 tests |
| `pnpm boundary:imports` | Passed, `strict_offenses=0 report_only_offenses=29` |
| `pnpm boundary:monitors` | Passed |
| `pnpm topology:check -- --require-web-go-public-strategy-read --web-url http://localhost:3100 --go-url http://127.0.0.1:8087 --json` | Passed with live Go and switched web process |
| Stopped-Go web page curl | Rendered `Strategy temporarily unavailable`, not TypeScript fallback data |
| `pnpm format:check` | Passed |
| `git diff --check` | Passed |

Full promotion: not approved. The selected route remains TypeScript-owned in
production by default until Go has a production-equivalent data provider and the
live web-through-Go gate is run in the deployment-equivalent environment.
