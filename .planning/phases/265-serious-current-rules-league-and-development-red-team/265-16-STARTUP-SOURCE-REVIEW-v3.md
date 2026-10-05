---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16-startup-v5-source
reviewed: 2026-10-05T22:51:33Z
depth: standard
scope: narrow_static_module_boundary_fix_re_review
diff_base: 68596edfe96b4d320ad7ec84a4bea1f8b216d0c3
source_commit: 73698ead703346ffc972b14af6e573372c17723c
source_root: sha256:a0940a8a76119a8e2f0033bd91d24473acd383d97ca17d108395bccabb7d8873
independently_reviewed: true
author_agent: /root/fix_265_startup_v5
reviewer_agent: /root/review_265_startup_v5_fixed
files_reviewed: 4
files_reviewed_list:
  - scripts/lib/v1-38-lean-startup-supervisor.mjs
  - scripts/lib/v1-38-lean-startup-supervisor.d.mts
  - scripts/lib/v1-38-lean-container-match-session.ts
  - scripts/run-v1-38-lean-startup-v5.test.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
execution_authorized: false
empirical_credit: false
phase_complete: false
---

# Startup v5 boundary-fix re-review

## Summary

No remaining concrete BLOCKER or WARNING found in the exact four-file `68596edf..73698ead` boundary-fix diff. The host Function-constructor compilation subsequently caught by MAIN's boundary gate is removed. This narrow report supplements, and does not rewrite, v2 or any history. It is source-only, not full certification or empirical admission.

## Narrative Findings (AI reviewer)

No new findings in this scope.

`v1-38-lean-container-match-session.ts:3,264-271` statically re-exports the checked `.mjs` function and embeds that module's exact checked-in bytes in the module-mode broker. There is no host Function/eval compilation, transformed-function serialization or helper stripping. The new `.mjs` contains one closure-free ordinary exported function; its declaration imports only types. No scanner, authority, manifest whitelist, cap, clock/ledger or policy file changes occur in this diff.

Independent inert actual `node --import tsx` import/build confirmed static function identity, exact raw module embedding, no `__name` helper and both new exact file roots in the source inventory. Inert AST/literal comparison confirmed the extracted control body is unchanged from the prior trusted control string, apart from ordinary module export/comment; legacy broker, origin-v1 builder and authenticated-harness initializer bytes remain identical to `68596edf`.

The existing2500 startup,1000 guest,5000 absolute host and≤100 cancellation control is therefore preserved, including GO residual refusal, post-reconciliation deadline recheck, bounded termination and uncertainty handling. Allocation-bound opaque authority, input/request/policy correlation, finite private origins and cleanup behavior are untouched. Earlier CR-02 effective/raw/monotonic custody and WR-01 request/accepted-check composition fixes are unchanged by this diff; they were not re-executed here.

## Independently recomputed execution-loader identities

- sourceRoot: `sha256:a0940a8a76119a8e2f0033bd91d24473acd383d97ca17d108395bccabb7d8873` —890 entries
- harnessRoot: `sha256:ce33dc1d4eaba6eed31362f533a4dcc2e2b6091f16b5c34efae085af1e7188f2`
- brokerRoot: `sha256:a1683867437aba61cb36b9e423e9bd9239239ce5eb80149b4f50525266e0eed0`
- moduleRoot: `sha256:797582056fedce0a8865253219d0a73c393f1b3f13a00bc1d5e54270d4c46a90`

These match `265-16-STARTUP-BOUNDARY-FIX-v1.md`; both module/declaration inventory roots were independently compared to their current file bytes. Root identities confer no execution authority.

## Limits and remaining gates

Author-reported unchanged boundary scan:1406files/zero violations; focused fixtures37/37. These results and the disclosed nine inherited script-inclusive type diagnostics were inspected, not rerun. Independent checks were source/diff inspection, inert imports/builds, inert AST comparison and diff whitespace only. No tests, native Worker/child/Docker/provider, generated broker/Strategy/Match execution, helper/prepare/allocation/capacity, empirical/ordinary reader or private-history payload scan occurred. Only this new report is written, without source edits or commit.

Strict admitted v5 twelve-hour43200000ms versus old28800000ms,15GB/300, prior23charges, cumulative active time/surviving-file custody and Match600000 remain unchanged. Source verification and separately reviewed machine carriers still precede the at-mostONE diagnostic and conditional at-mostONE fresh36baseline with passing SAMEPROCESS capacity. Original v4 cause/startup performance remain unproven. Phase265 stays incomplete; no empirical/LEAG/freeze/formation/holdout/public/counted/production credit.

---

_Reviewer: /root/review_265_startup_v5_fixed; narrow source-only boundary-fix re-review._
