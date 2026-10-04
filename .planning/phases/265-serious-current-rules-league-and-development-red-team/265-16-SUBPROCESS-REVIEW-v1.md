---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
reviewed: 2026-10-04T14:46:38Z
depth: standard
scope: source_only_subprocess_cleanup_error_precedence_repair
source_commit: 4e71c9b60fb05cc832c2b83b3eb6f3c692254cfd
diff_base: cb829a71568cd07913ae4bef5091f088e0728e0e
root_author: /root
source_git_author: Plan 262 Supplement Test
reviewer: /root/review_265_subprocess_repair
files_reviewed: 2
files_reviewed_list:
  - scripts/lib/v1-38-lean-container-match-session.ts
  - scripts/lib/v1-38-lean-subprocess-attribution.test.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
actual_initiating_cause: unknown
empirical_repair_proved: false
baseline_unblocked: false
phase_265_complete: false
freeze_266_authorized: false
---

# Plan 265-16: Subprocess cleanup repair code review v1

## Narrative Findings (AI reviewer)

No BLOCKER or WARNING found in this narrow repair against its immediate parent.
Both scoped files were read in full, with adjacent callers and IPC error handling
checked for error precedence and session-state effects. This is a source review,
not approval of the whole milestone, a live runtime, or baseline continuation.
No structural findings block was supplied.

## Scope and adversarial checks

The functional diff is confined to `remove()` at
`scripts/lib/v1-38-lean-container-match-session.ts:279-293`; the second scoped file
adds 16 process-local regressions. AGENTS.md, the current STATE frontier,
265-16-PLAN, SUBPROCESS-DIAGNOSIS-v1 and RETAINED-VERIFICATION-v1 informed the
scope. No project-local `.codex/skills` or `.agents/skills` directory was found.
The GSD code-review instructions supplied the severity and report criteria.

| Concern | Source-level evidence |
|---|---|
| Cleanup errors mask a primary failure | Lines 284-291 independently contain close, removal and inspection exceptions, including receipt validation failures. The native catch at line 335 can therefore rethrow its original error. No raw error is newly published. |
| An early cleanup throw skips later operations | Removal and final inspection are separate unconditional attempts after the close block. Each fault and combined-fault fixture asserts one close, one removal and one final inspection. |
| Cleanup failure is accidentally called complete | Each failed step retains a false flag; completion requires all three flags at line 292. A close exception stays incomplete even when subsequent removal and absence inspection succeed. |
| Repeated close retries incomplete cleanup | Line 280 returns the cached receipt, including incomplete receipts. The mock cases check the same disposition across repeated close calls and unchanged operation counts. |
| A poisoned or closed session dispatches again | `poison()` changes state before cleanup at line 299; explicit close changes state before cleanup at line 357. Lines 304-306 reject the next invocation before stream exchange. |
| Original classification, identity or private origin changes | The repair does not mutate errors or origin maps. Signal, injected stream-error and stale-frame cases assert the primary finite code; stream-error additionally asserts exact object identity and origin; stale-frame asserts correlation origin. |
| Successful cleanup or correlation/session isolation regresses | Existing selected fixtures cover clean close, exact Docker absence tuples and near misses, corrupt/stale frames, stream timeout, mixed methods and separate per-Match counters. No frame/parser or request-counter code changes. |
| Runtime/resource/public behavior expands | Broker/harness strings, authority joins, guest/host/Match limits and public projections are outside the functional diff and unchanged. Guest 1,000 ms, host 5,000 ms and Match 600,000 ms remain frozen. |

## Independently executed bounded gates

All commands below used source-only mocks or static checks; no native Strategy,
provider, Match, preflight, allocation or empirical reader was invoked.

```text
pnpm exec vitest run scripts/lib/v1-38-lean-subprocess-attribution.test.ts --maxWorkers=1
```

Actual exit 0; 16/16 PASS, duration 1.98 s (tool chunk `003abf`).

```text
pnpm exec vitest run scripts/lib/v1-38-lean-container-match-session.test.ts --maxWorkers=1 -t 'private IPC diagnostics injected session|multiplexes mixed methods|poisons on .*persistent response frames|poisons on stream timeout|treats status-1|requires exact absence|accepts the exact|rejects Docker 29.4|keeps separate streams'
```

Actual exit 0; 51 PASS / 57 skipped, duration 2.99 s (chunk `facfed`).
The unselected tests were not executed; no full-suite claim is made.

```text
pnpm exec tsc --noEmit --ignoreConfig --types node --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes --skipLibCheck scripts/lib/v1-38-lean-container-match-session.ts scripts/lib/v1-38-lean-subprocess-attribution.test.ts
git diff --check 4e71c9b6^ 4e71c9b6
```

Both exited 0; strict types had no diagnostics (chunk `3ce6f8`). Source HEAD
remained fixed at the reviewed commit, and both scoped files matched that commit
after the gates. Raw file SHA-256 values:

- Session source: `c3eb794d4ed05e4fbdd18359b065b1910b8eaf88dbd0b99e8b018b1299986ef0`.
- New test: `ee70abf3b2acf15fc4e3efb631dda8fe687e34b268e03c71deb47ddbf86df3e8`.

## Limits and immutable disposition

The consumed baseline and its one ordinary retained reader remain closed and
spent. Their recorded `cleanupComplete:true` and retained signal code do not
demonstrate this masking branch; the actual initiating cause remains unknown.
The source repair has mock proof only and does not unblock the baseline or
justify a replacement route, retry, re-reader, resource increase or credit.

No `.strategy-lab` consumed data or reservation was opened, changed or recreated
by this review. No Strategy source, private error/stdio, memory or objective
payload is published. No Phase 265/LEAG completion, freeze, formation, holdout,
public/counted play or production authority is conferred. The shared 15 GB /
8 hours / 300 Matches ceilings remain unchanged.

Only this new report was authored; no source files were modified and no commit
was made. The standard clean verdict applies solely to the two-file repair
scope above, not to actual baseline success.
