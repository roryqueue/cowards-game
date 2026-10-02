---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
fixed_at: 2026-10-02T07:01:53Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-ASYNC-DEPENDENCY-REVIEW-v1.md
iteration: 1
fix_scope: critical_warning
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
base_commit: e1d0005cf9512a62d0ebdb05f8b2af47673eb43d
source_commit: 5c8dbc720cba3462b64c0a0a41d7c6e6a6a849c6
four_file_diff_sha256: d7026820d74ca29678652ee27a130079bde183c295e7ed7f2d01a10dd5dd9aee
---

# Phase 265 Plan 07: Asynchronous dependency review fix report

Both in-scope blockers were fixed in separate atomic source/test commits. No finding was skipped. The old review and execution history remain unchanged. This report is intentionally uncommitted for root.

## Fixed issues

### CR-01: Invocation preparation and multi-chunk fallback bypass the graph failure latch

**Status:** fixed: requires human verification
**Commit:** `d713817400f72f3063fb50c3bf8eb58d107b6921`
**Files modified:** `scripts/run-v1-38-serious-league.ts`, `scripts/run-v1-38-serious-league.test.ts`

Moved invocation preparation and synchronous multi-chunk publication inside the existing failure-latching catch. The initial concurrent/pending refusal remains outside it; non-invocation synchronous routing is unchanged. Pending state is released only if this invocation owns it, after all repository dependency work settles. No bytes, publication/barrier order, caps or charging/refund policy changed.

Both invocation kinds now have regressions for a 140000-character multi-chunk payload's file-sync/directory-barrier faults, preparation/link-group publication failure and canonical preparation rejection. They assert the original injected error identity, no credited invocation head, conservative retained charges, graph-wide dispatch/invocation stop and refusal through a fresh wrapper with zero guest calls. Existing concurrent-append refusal tests now also assert that successful active publication leaves dispatch usable.

### CR-02: Outer failure retention is not exception-safe and can abort owned cleanup

**Status:** fixed: requires human verification
**Commit:** `5c8dbc720cba3462b64c0a0a41d7c6e6a6a849c6`
**Files modified:** all four source/test files in the hash table below.

Ordinary failure handling still waits for wrapper/graph settlement, then attempts each actual provider close separately from evidence publication. Cleanup evidence faults, cleanup-failure evidence faults, cell-issuance-failure publication, journal reopening and terminal publication cannot replace the initiating error or prevent remaining owned closes. A successful actual close with failed evidence is not misreported as an actual close failure.

Response cleanup captures close/retention faults and attempts every remaining owned close. With no primary operation error, the first close/retention exception propagates only after all close attempts. With a primary operation error, its original object survives. The outer response-production failure record and factory-terminal publication are guarded similarly. Failed secondary records remain absent; no success/terminal is forged and failed publication charges remain retained. No new free-form secondary diagnostics were added.

Added source-only ordinary cases for persistent secondary storage refusal, failed cell-failure retention, failed journal terminal publication and actual close failure combined with persistent storage refusal. Response cases cover persistent secondary refusal, failure-record/terminal faults and both cleanup-retention and actual-close errors without a primary operation failure. Controlled real-fsync settlement asserts no early evidence/cleanup, both provider close attempts, unchanged guest count, original caller error identity and no speculative records/terminal. Each integration case stops during the first injected Match; submitted Strategy code, Docker, models and real runtime providers are not executed.

The standard logic-change status flags above request review of the corrected control flow, not a new operator-authorization checkpoint. Root's independent exact-source rereview and unchanged complete source gate remain outstanding.

## Actual RED/GREEN and verification

All commands ran in the owned isolated worktree rooted at `e1d0005c`, using existing dependency directories via symlinks; nothing was installed. An initial CR-01 harness attempt failed during import because package-local `@cowards/engine` resolution was missing. It ran zero tests and is not RED evidence. Linking the existing package-local dependencies resolved that harness issue.

| Check | Actual result |
| --- | --- |
| CR-01 RED: runner selection `-t 'CR-01'` | 2 failed / 99 skipped; both fail because graph dispatch does not stop; 3.51s |
| CR-01 GREEN: async graph/durability selection | 22 passed / 79 skipped; 18.32s |
| CR-02 ordinary RED: runner selection `-t 'CR-02'` | 3 failed / 101 skipped; secondary error replaces original; 10.17s |
| CR-02 response RED: response selection `-t 'CR-02'` | 4 failed / 30 skipped; original error replaced or only one close attempted; 15.51s |
| CR-02 intermediate GREEN: both files `-t 'CR-02'` | 11 passed / 131 skipped; 34.56s; imported fixture tests overlap selections |
| Final runner async graph/durability selection | 26 passed / 84 skipped; 26.11s |
| Final host-bound response selection | 13 passed / 22 skipped; 23.97s |
| Strict named four-script no-emit types | exit 0 |
| Strategy-lab build | exit 0 |
| Source reread and `git diff --check` | affected sections intact; exit 0 |

Final exact commands:

```sh
./node_modules/.bin/vitest run --maxWorkers=1 scripts/run-v1-38-serious-league.test.ts -t 'asynchronous invocation graph retention|graph dependency durability'
./node_modules/.bin/vitest run --maxWorkers=1 scripts/lib/v1-38-league-response-runtime.test.ts -t 'host-bound league behavioral probes'
./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --types node --skipLibCheck scripts/run-v1-38-serious-league.ts scripts/run-v1-38-serious-league.test.ts scripts/lib/v1-38-league-response-runtime.ts scripts/lib/v1-38-league-response-runtime.test.ts
./node_modules/.bin/tsc -b packages/strategy-lab/tsconfig.json --pretty false
git diff --check
```

Each fix was committed with the installed GSD shim's top-level `commit "<message>" --files <each modified path>` command. No report commit or push occurred. No full CI/source gate, capacity admission, preflight, retained verifier or profiler ran. Focused source acceptance does not claim league completion, timing improvement, freeze eligibility or production certification.

## Exact repaired bytes

SHA-256 of `git diff e1d0005c HEAD --` plus the four paths in this table's order is the frontmatter's four-file diff hash.

| File | Raw SHA-256 |
| --- | --- |
| `scripts/run-v1-38-serious-league.ts` | `d968ded785d0bd7adb65da679e5886bcc011c2cf797ad3499eab0706a9abddc4` |
| `scripts/run-v1-38-serious-league.test.ts` | `804a863cc74d297b109b128fb6ae76799a217076cc7858fba93f2382dfb42efc` |
| `scripts/lib/v1-38-league-response-runtime.ts` | `ad75540ffe6853728b69acff058948537ddda564018a540abec1fc2290944c92` |
| `scripts/lib/v1-38-league-response-runtime.test.ts` | `57bb57d6bd9315ae305684bda5b0736584c76274220d4d97a63218047a39fcfa` |

The untouched repository pair still hashes to `4ee61ed57a07d2d42e58a0e080c731deb8aae3ccdc8f72dcde1d53a54ea44599` (source) and `a96cb2025f8e7e26b42d63a85a1796efec8fefe3eb667e8fe9784923a33d0b4b` (tests). No rule, resource, lifetime, capacity cadence, cache, ownership or authority contract changed.

_Fixer: gsd-code-fixer; iteration 1._

