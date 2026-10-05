---
phase: 265
plan: 16-startup-v5-source
status: ready_for_independent_source_review
scope: source_only
execution_authorized: false
phase_complete: false
---

# Prospective v5 startup source validation

The three source tasks are implemented. These checks establish source behavior under synthetic fixtures, not startup sufficiency, native performance, an empirical diagnosis, a successful Match, or baseline authority. Independent review/fix and source-verification approval remain required.

## Exact checks

- `pnpm exec vitest run scripts/run-v1-38-lean-startup-v5.test.ts -t contracts --maxWorkers=1`: 3 passed, 25 skipped.
- `pnpm exec vitest run scripts/run-v1-38-lean-startup-v5.test.ts -t runtime --maxWorkers=1`: 12 passed, 16 skipped.
- `pnpm exec vitest run scripts/run-v1-38-lean-startup-v5.test.ts --maxWorkers=1`: 28 passed; final run 2026-10-05 18:12:23 America/New_York, 12.32 seconds.
- `pnpm exec tsc --noEmit --project packages/strategy-lab/tsconfig.json`: passed.
- `pnpm exec tsc --project /tmp/lean-startup-source-types.Ktjd4r/tsconfig.json --pretty false`: exit 2, nine inherited exact-optional diagnostics, zero new production/fixture diagnostics. This is not a global type pass. The temporary config extends the absolute repository tsconfig.base.json, sets noEmit/composite=false/node types, and lists the new fixture, correction runner, retained reader and baseline-match entry points. Its transitive closure includes the other changed source consumers.
- `bash -n scripts/run-v1-38-lean-correction.sh scripts/run-v1-38-lean-baseline.sh`: passed; wrappers unchanged.
- `git diff --check`: passed.
- Focused factory/planner boundary scan: no direct Worker/child/Node-vm execution or new rule logic was introduced there; both continue through the selected session adapter. Changed-file stub/forbidden-pattern scan found no implementation stubs or new engine impurity.

Inherited diagnostic locations: assess-v1-38-factory-independence.ts:307; league-response-runtime.ts:222/223; lean-child-cli-terminal.ts:86; lean-baseline runner:123/238; lean-experiment runner:41; serious-league runner:300/333. The last three additional runner edges explain why this wider script-inclusive closure reports nine rather than the previously recorded six.

## Actual reach and limits

Native Worker/child/process transport is deny-by-default. Only registered synchronous fake OS/control/stream/child surfaces are enabled for the named vertical and parent fixtures. No native Strategy or Match, Docker/provider operation, real capacity sampling, allocation preparation, install, historical reader command, or real prospective destination was entered. All writes are synthetic private temporary files.

The fixtures reach actual strict allocation/cap admission, CLI route parsing, resource predicates, both publishers, opaque issuer and ordered claims, factory/planner/session default construction, broker-frame exchange, finite receipt validation, parent timer and pre-release path, positive pure retained audit, reader-gap custody/closure, and actual retained-reader refusal/finally. The existing cold reuse validator is replaced only with an exact synthetic reuse grant in these fixtures; its production semantics are unchanged.

Boundary cases cover startup2499/2500, guest999/1000, host4999/5000, spent residual GO refusal, spurious wake, invalid READY/DONE/early exit, missing receipt, foreign request roots, failed termination/cleanup, late frame parsing, private canary refusal, >8h v5 acceptance versus unchanged old defaults, and strict cap/policy/source/HEAD/charge mutations.

Coverage limitation for the independent reviewer: a full positive filesystem request/authorization-carrier read and positive authenticateLeanSupervisorDiagnosticCheck path were not synthesized. Positive complete retained audit and the actual reader's refusal/closure path are covered separately. There is no 36-cell baseline fixture execution or native lifecycle certification. Do not treat this checklist as that missing proof.

## Source closure and legacy preservation

An inert tsx import/build-only check (no dispatcher entry) measured 888 source entries:

- sourceRoot: `sha256:20cdde9414ae2f954db0408e21929b5ed2731910ae985b4e8874f36ba419fc3b`
- v5 harnessRoot: `sha256:ce33dc1d4eaba6eed31362f533a4dcc2e2b6091f16b5c34efae085af1e7188f2`
- v5 brokerRoot: `sha256:c46395e6b3be7f982453959bc3ac3011dbb94df7c463b7dab1bd6250b2e01e14`

V5 source-root material includes all changed/new source and fixture bytes, plus exact generated broker/harness, policy and supplement roots. Recompute under the execution loader after any source fix; these roots grant no authority themselves.

AST initializer bytes captured inertly from a4b372f0 match current legacy broker, origin-v1 builder and authenticated-harness builder exactly; the original worker-harness.ts file hash is unchanged. The fixture pins those pre-edit hashes and retains origin-v1 strict acceptance/rejection. No consumed artifacts, engine/kernel/rules, search/cold/solver procedure, freeze-before-formation or private holdout was modified. Public/counting/production authorization remains false.

## Budget custody

Only exact admitted supervisor-v5 allocations select 43,200,000ms. Global LEAN_CAPS remains28,800,000ms; Match600,000ms, scratch/total15GB and300 charges remain unchanged. V5 control grants startup2500/guest1000/cancellation at most100 inside one host5000 acceptance deadline. Unknown/failed lifecycle cannot acquire guest-timeout or native-signal proof.

Carry is26,634,447ms before1791235144280, plus every active source/review/setup segment and all later nonoverlapping admitted ledger intervals, including diagnostic/run/reader-open gap/reader close/finalization. Prior23 charges cannot be refunded; an accepted diagnostic makes24 and only36 fresh charged baseline slots can make60. All survivors remain inventoried and historical peaks remain unknown.

Remaining time must be recomputed as43,200,000 minus that cumulative admitted carry, never by resetting to a fresh timer. Source work, including this validation and commits, still counts. No setup witness or execution carrier was created here. Future ONE diagnostic and conditional ONE fresh36 baseline remain unentered.
