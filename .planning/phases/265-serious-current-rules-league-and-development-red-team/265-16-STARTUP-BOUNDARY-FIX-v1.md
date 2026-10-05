---
phase: 265
fixed_at: 2026-10-05T22:50:00Z
status: fixed_source_only
findings_in_scope: 1
fixed: 1
skipped: 0
execution_authorized: false
empirical_credit: false
phase_complete: false
---

# Plan16 startup private-boundary fix

The prior source fix introduced host dynamic compilation at session.ts, detected by the unchanged private transitive execution boundary scan. This report supplements rather than overwrites earlier reports.

**Commit:** 73698ead — fix(265): remove dynamic startup control compilation at private boundary

**Files:** session module, startup fixture, new `scripts/lib/v1-38-lean-startup-supervisor.mjs` and new matching `.d.mts` declaration. No policy, scanner, authority, cap, ledger, engine or rule changes.

The fixed control function is now a static JavaScript module export. Host fake-control tests import/re-export that function normally. The broker builder reads and embeds the exact checked-in module source byte-for-byte, including its ordinary ESM export; it neither dynamically compiles code on the host nor serializes a transformed function. Control logic is unchanged from the preceding checked control string. No helper stripping, eval, Function constructor, toString serialization or boundary allowlist bypass is introduced.

## Actual checks

- RED: `node --import tsx scripts/check-v1-38-factory-boundaries.ts` returned `ok:false`, two PRIVATE_TRANSITIVE_HOSTILE_EXECUTION violations for authority/experiment, 1404 scanned files.
- GREEN: the exact unchanged command returned `{"ok":true,"violations":[],"scannedFiles":1406}`.
- `node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-startup-v5.test.ts --maxWorkers=1`: 37/37 passed, start18:48:54 America/New_York,28.02s.
- The new fixture asserts static function identity, exact source bytes in the broker, no host AST Function/eval call/construction, and both module/declaration file roots in the actual source inventory.
- The existing real `node --import tsx` inert import/build regression still passes without __name in generated broker bytes. No broker or guest is evaluated.
- Existing complete request/accepted diagnostic, effective close/rollback/terminal snapshot, caps, privacy and legacy initializer/harness-pin regressions all pass.
- `node -c scripts/lib/v1-38-lean-startup-supervisor.mjs`: passed.
- `node node_modules/typescript/bin/tsc --noEmit --project packages/strategy-lab/tsconfig.json --pretty false`: passed.
- Script-inclusive config `/tmp/lean-startup-boundary-fix-types-v5.json`: nine inherited exact-optional diagnostics, zero new production/fixture/declaration diagnostics. Not a global type pass. Locations remain factory-independence307; league-response-runtime222/223; child-cli-terminal86; baseline123/238; experiment41; serious-league300/333.
- `git diff --check`: passed. Modified/new source and declaration reread.

## Exact actual-loader identities

Inert actual-loader build-only check,890source entries:

- sourceRoot: `sha256:a0940a8a76119a8e2f0033bd91d24473acd383d97ca17d108395bccabb7d8873`
- harnessRoot: `sha256:ce33dc1d4eaba6eed31362f533a4dcc2e2b6091f16b5c34efae085af1e7188f2`
- brokerRoot: `sha256:a1683867437aba61cb36b9e423e9bd9239239ce5eb80149b4f50525266e0eed0`
- moduleRoot: `sha256:797582056fedce0a8865253219d0a73c393f1b3f13a00bc1d5e54270d4c46a90`
- declarationRoot: `sha256:9a3a2a3aa7900abbfcc9cc5b4916cb119f7674e039205d0c1bc3575fc176fce3`
- undefined transpiler helper present: false

The existing inventory automatically binds both new exact files; no scanner or manifest whitelist changed. These identities grant no execution authority.

## Custody and remaining gates

Startup2500/guest1000/host5000/Match600000, exact v5 twelve-hour43200000ms versus old28800000ms,15GB/300charges, prior23charges and every surviving-byte debit are unchanged. All active source/test/report/setup/administration time carries from26634447ms before1791235144280; no reset or old recredit.

No native Worker/child/transport/provider/Docker/Strategy/Match, real helper/prepare/allocation/capacity or empirical reader was entered. Only the known trusted inert loader import/build subprocess is permitted in the fixture. No historical private payload scan, production/public/counting change, formation or holdout opening occurred. Native latency/startup sufficiency and original v4 cause remain unproven/UNKNOWN. Independent re-review/source verification still precede any separately authorized empirical operation; no phase/freeze/empirical credit follows.

Isolated base68596edfe96b4d320ad7ec84a4bea1f8b216d0c3, branch `gsd-reviewfix/265-12088`, worktree `/tmp/sv-265-reviewfix-ePPWcN`. Guarded main fast-forward and transactional cleanup remove only this disposable worktree/branch/sentinel. This report is transferred uncommitted for the orchestrator; old reports/reservations remain unchanged.
