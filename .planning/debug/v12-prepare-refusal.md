---
status: inconclusive
trigger: Fresh v12-1 diagnostic preparation refused before allocation
created: 2026-10-08
updated: 2026-10-08T12:47:33Z
goal: find_root_cause_only
---

## Symptoms

Expected: the independently reviewed fresh diagnostic request prepares one immutable allocation without dispatching a Match.
Actual: MAIN preparation session 9358 closed exit 1 after 2,988 ms, with `LEAN_CORRECTION_FAILED_DETAILS_WITHHELD`. Admission failure reports zero current charges, no ledger/store/allocation/entry/result/check, and no child spawn. The initiating exception was not retained.
Timeline: draft 79804 and finalization 66459 closed successfully. Source d94ede0f / manifest72c7432d / 922 and administrative HEAD f3e89016 remained fixed through the one independent terminal-only check 23267 and finite authentication 55209, both closed exit 0.
Reproduction boundary: source-only synthetic tests and non-admitting observations only. Never repeat preparation, finalize, any Match, an ordinary empirical reader, or the consumed terminal check. All actual private route bytes are immutable. The conditional baseline is ineligible; this approval ended at preparation refusal.

## Current Focus

hypothesis: Actual preparation9358 initiating cause remains UNKNOWN. Confirmed observability limitation: multiple preparation-only guard/native/construction paths have no retained finite stage/code and v12 preparation CLI always withholds them.
test: Completed bounded static source trace and one non-admitting synthetic HOST probe of exact current scope expression, actual parser and trusted formatter. No actual private request or consumed mode.
expecting: Synthetic scope pass/fail shows guard behavior and formatter collapse only; it does not reconstruct actual process9358 or establish its initiating cause.
next_action: Return INVESTIGATION INCONCLUSIVE and end diagnosis-only envelope now; no further probe, source change, prepare/finalize/helper/reader or route authority.

## Evidence

- timestamp: 2026-10-08
  checked: Required finite terminal report, SOURCE-REVIEW-v3, SOURCE-VERIFICATION-v1, DATA/HELPER review, and STATE first30lines
  found: Finalization succeeded separately; actual preparation9358 refused with no allocation/store/child/current charge; retained finite receipt has no initiating exception. Current STATE top predates the failure; terminal report is authoritative for closure/refusal. Check23267/authentication55209 closed and pair ended.
  implication: Neither source gate success nor helper finalization proves preparation path success; all actual failure branches remain unresolved.
- timestamp: 2026-10-08
  checked: scripts/run-v1-38-lean-correction.ts1283-1302,709-711,1043-1047,459-461 and scripts/run-v1-38-lean-correction.sh1-9,37-42
  found: Preparation performs admission start, scope, spent destination, request/predecessor, allocation and time gates before store creation. Generic predecessor dispatch reaches v12 correctly through prospective mode. Request dispatch also reaches v12. Wrapper explicitly supplies max-old-space-size768, disabled caches, sanitized NODE_OPTIONS family, core0 and canonical route TMPDIR.
  implication: No cheap missing-v12-dispatch or wrapper-flag defect established; scope and construction/time steps are not covered by final request-only success.
- timestamp: 2026-10-08
  checked: scripts/run-v1-38-lean-correction.ts1225-1229,139-145,1233-1245,177-183
  found: Preparation-only scope can fail on heap flags, route-parent aliases, environment, temp ownership/permissions/realpath or core limit. Current CLI formatter only exposes trusted guards for selected legacy verification commands; v12 preparation always receives withheld output. Admission failure stores custody/accounting, not operation/code. Time gate uses allocation extension and frozen reserve; finite terminal timing alone does not identify a throw.
  implication: Multiple guard/native/construction branches remain indistinguishable without raw private detail; no timeout/memory/disk inference warranted.
- timestamp: 2026-10-08T12:47:33Z
  checked: Non-admitting source/HOST synthetic probe session87428, CLOSED exit0; explicit node max-old-space-size768, cache controls, trusted source AST/transpilation; exact current scope expression and actual exported parseLeanCorrectionCommand/leanCorrectionTrustedGuardError/leanCorrectionCliFailure
  found: Valid wrapper-shaped flags/metadata PASS. Missing heap flag produces finite LEAN_CORRECTION_COORDINATOR_HEAP_BOUND; synthetic parent alias produces LEAN_CORRECTION_ROUTE_ALIAS; synthetic NODE_OPTIONS, temp permissions and core-limit violations each produce LEAN_CORRECTION_WRITABLE_SCOPE. Every corresponding v12 prepare formatter output is LEAN_CORRECTION_FAILED_DETAILS_WITHHELD. Parser selects diagnostic/v12-1 correctly.
  implication: No intrinsic scope or missing-dispatch defect was reproduced. Scope alternatives are distinguishable only inside the synthetic harness, not in retained actual failure evidence. Probe used fully synthetic metadata/env/process/ulimit dependencies and no actual prepare, store, request, helper or reader. No real source fix or new fixture file.

## Eliminated

- hypothesis: The current finite v12 preparation command dispatches to an unrecognized or legacy supervisor mode.
  evidence: Actual parser returns prepare-supervisor-diagnostic-v12-1/diagnostic/v12-1. Static predecessor dispatch709-711 reaches1043-1044 then1505; request dispatch398-399/424-425/459-460 reaches the strict v12 consumer.
  timestamp: 2026-10-08T12:47:33Z
- hypothesis: Correct wrapper-shaped flags and owned canonical metadata are intrinsically refused by the current scope expression.
  evidence: Exact source scope expression passed with actual probe execArgv containing explicit max-old-space-size768 and closed-world canonical/owned0700/core0/cache-off/env mocks. This does NOT eliminate a historical actual environment/path/OS failure.
  timestamp: 2026-10-08T12:47:33Z
- hypothesis: Successful finalization or terminal-only verification identifies the preparation initiating failure or proves preparation-only guards passed.
  evidence: Finalization authenticates request lineage/reviews; scope and later predecessor/allocation/time operations run separately in prepare1288-1293. Finite failure receipt1233-1245 retains custody and zero-charge absence, not operation/code; terminal report explicitly leaves native cause unestablished.
  timestamp: 2026-10-08T12:47:33Z

## Resolution

root_cause: UNKNOWN for actual preparation9358. No causal source defect confirmed. Static and synthetic evidence establishes only diagnostic loss: scope and later preparation branches may fail before ledger creation; v12 prepare CLI always emits withheld text and admission failure receipt has no finite initiating stage/code. No synthetic scenario is assigned retrospectively to actual9358.
fix: NONE; diagnosis-only. One minimal prospective recommendation: add a separately versioned, trusted finite preparation stage/code receipt covering scope/request/predecessor/allocation/time/publication/finalization boundaries, unknown errors still unknown and fail-closed; protect it with ONE closed-world synthetic HOST regression traversing the actual prepare boundary and proving absence/no dispatch/custody preservation plus safe code attribution. No consumed-byte/schema reinterpretation, guard weakening or approval reuse. Research/checked Plan16/source review/validation and new authority remain separate.
verification: Source-only trace plus one current-scope synthetic non-admitting node probe, session87428 exit0. Six scenarios:1 valid PASS and5 expected finite guard refusals; all5 CLI results WITHHELD. No actual prepare/finalize/helper invocation, current/old empirical reader, terminal checker, private payload, real store/provider/Strategy/Match, source edit or commit. This is not full prepare reproduction or whole-tree resource certification.
files_changed: [.planning/debug/v12-prepare-refusal.md]
specialist_hint: typescript

## Exact source references

- scripts/run-v1-38-lean-correction.ts1225-1229: complete private scope guard; preparation invokes it at1288, after admission begins1285.
- scripts/run-v1-38-lean-correction.ts1289-1302: spent-destination/request/predecessor/allocation/time gates precede store/allocation publication; finally closes and publishes nonauthorizing failure custody.
- scripts/run-v1-38-lean-correction.ts139-145: trusted finite CLI codes exposed only to selected legacy verify modes; all v12 preparation failures remain withheld.
- scripts/run-v1-38-lean-correction.ts1233-1245: no-ledger failure receipt schema has no exception stage/code.
- scripts/run-v1-38-lean-correction.ts709-711/1043-1044/1505/1546-1557: v12 predecessor dispatch and destination/inventory gates;398-399/424-425/459-460/1477-1502: v12 request dispatch and authentication.
- scripts/run-v1-38-lean-correction.ts177-183/1293: time cap and frozen reserve consume actual allocation extension.
- scripts/run-v1-38-lean-correction.sh1-9/37-42: core/env/cache controls, finite route TMPDIR, explicit768MiB Node old-space launch.

## Probe custody / bounds

One inline command: sanitized environment; `node --max-old-space-size=768 --import tsx --input-type=module -e` using TypeScript AST to extract ONLY the trusted current scope declaration, transpile it unchanged and bind synthetic HOST dependencies. Actual exported parser/formatter were called; no consumed command mode was invoked. The AST guard probe is not an actual whole-prepare regression and not historical runtime evidence. Only safe finite enum/passfail JSON was printed, no raw private errors/stack/Strategy/objectives/memory/runtime IO.

No consumed v12 setup/request/helper/review/authority/marker or source was modified. Check23267/authentication55209 remain uniquely CLOSED; hold released; pair ENDED and conditional baseline ineligible. All34spent/full108000000 plus all continuously elapsed wall from1791455941097 and all surviving files remain costs under136800000ms/deadline18:39:01.097Z/15GB300/exact2GB768MiB; no subtraction, reset, new allocation or empirical authority. New debug report remains inconclusive, unarchived and uncommitted.

## Constraints

No source fix in this diagnosis-only session, no empirical execution, no new route, no old reader. Preserve all historical files. Full108000000ms plus current wall remains charged against136800000ms, absolute deadline2026-10-08T18:39:01.097Z;34 old Match charges,15GB/300Matches, unchanged resources/rules/privacy. No LEAG/freeze/formation/holdout/public/counting/production credit. Safe finite conclusions only; do not publish private request payloads or raw errors.
