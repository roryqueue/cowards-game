---
phase: 265
plan: "07"
task: "2-source-only"
status: source-implemented-pending-independent-review-and-full-gate
empirical_authority: false
---

# Phase 265 Plan 07 lean source-only handoff

## Scope and status

The approved prospective three-base source path is implemented. This is a partial
Task 2 handoff, not Task 2 completion, a Plan 07 SUMMARY, phase completion, or run
authority. The main agent owns independent source review, the single complete
29-suite validation gate, remaining technical preparation, and Task 3.

No empirical allocation, amendment root, capacity receipt, preflight, provider,
model request, authored Strategy, Match, holdout, formation, public/counting, or
production action was created or performed. Test roots and repositories are
explicitly injected, temporary mechanics. Task 1's source proof is unchanged.
The operator's approval remains conditional on the remaining technical gates.

## Source changes and API

`packages/strategy-lab/src/league/allocation.ts` exports:

- `createLeagueProspectiveAmendment(input)` and
  `admitLeagueProspectiveAmendment(value)` for the separate
  `league-prospective-measurement-amendment-v1`.
- `createProspectiveLeagueExecutionAllocation(input)` and
  `admitProspectiveLeagueExecutionAllocation(value)` for the separate
  `league-prospective-execution-allocation-v1`.
- `createLeagueCapacityReceipt(input, allocation)` and
  `admitLeagueCapacityReceipt(value, allocation, currentObservation)` for
  `league-capacity-receipt-v1`.
- `LEAGUE_APPROVED_PROSPECTIVE_POLICY` supplies exact validation constraints,
  never missing-input defaults. `admitAnyLeagueExecutionAllocation` is a private
  consumer union reader; the existing V1 admission still accepts only V1.
- `assertProspectiveLeagueProducerRequest` binds each declared job to its exact
  tactical/teacher/model producer and, for model jobs, exact `gpt-5.6-sol` request.

The CLI module exports `leagueCurrentSourceIdentity`,
`prepareProspectiveSeriousLeague`, `preflightProspectiveSeriousLeague`, and the
existing run/retained-reader functions. `readLeagueInitialCandidates` also
accepts an explicitly data-only selection of publication/assessment roots and
read bounds; this resolves historical evidence before the amendment/allocation
DAG exists and grants no execution authority.

The package index is unchanged. Narrow integration beyond the four primary
allocation/CLI files was necessary in exactly these three files:

- `scripts/lib/v1-38-league-authoring.ts`: union allocation admission and exact
  prospective producer/model validation in preflight and retained reading.
- `scripts/lib/v1-38-league-response-runtime.ts`: union allocation admission and
  type; response execution, numeric evidence, and retained verification unchanged.
- `packages/strategy-lab/src/factory/fingerprint.ts`: union admission and the same
  prospective producer binding at the retained production boundary.

Without these changes, downstream consumers would reject the new schema or
allow tactical/teacher substitution within the automated channel. No engine,
runtime implementation, selection, matrix, probe, report, stored policy,
`LAB_ADMITTED_ROOTS`, historical artifact, or public export was changed.

## Exact future command interfaces — not executed

All files must be canonical JSON; all output directories must already exist.
The CLI prints its result and does not invent or persist a default allocation.

```text
./node_modules/.bin/tsx scripts/run-v1-38-serious-league.ts prepare-prospective --allocation <complete-prospective-input.json> --factory-repository <historical-factory-directory>
./node_modules/.bin/tsx scripts/run-v1-38-serious-league.ts preflight --allocation <rooted-prospective-allocation.json> --allocation-root <root> --capacity-input <data-only-measurements.json> --factory-repository <historical-factory-directory>
./node_modules/.bin/tsx scripts/run-v1-38-serious-league.ts run --allocation <rooted-prospective-allocation.json> --allocation-root <root> --repository <fresh-league-directory> --factory-repository <historical-factory-directory> --response-factory-repository <fresh-response-factory-directory> --capacity-receipt <rooted-capacity-receipt.json>
./node_modules/.bin/tsx scripts/run-v1-38-serious-league.ts verify-retained --allocation <rooted-prospective-allocation.json> --allocation-root <root> --repository <league-directory> --factory-repository <historical-factory-directory> --response-factory-repository <response-factory-directory> --head-root <retained-head-root>
```

The preparation input is `ProspectiveLeagueExecutionAllocationInput`: every
legacy required field plus a rooted amendment and eleven explicit
`participantRoles` rows. The amendment requires approval `06cdb050`, the exact
original historical assessment identities, ordered S01/S03/S05 publication,
admission, source and supervision roots, control exclusion, current implementation
and source roots, and the complete approved policy. Each job uses deterministic
`<job-id>-author` / `<job-id>-reviewer` IDs and records actual corresponding
agent IDs separately. Supplying IDs does not certify an unperformed review.

Derive actual source/implementation roots only after final independent source
review. Then derive amendment → allocation → capacity receipt → run. Existing
V1 schema, root construction, empirical twelve-root guard, and legacy command
semantics remain intact; legacy `prepare` rejects prospective inputs.

## Receipt precision and limitations

The amendment documents the exact six-category formula, representative-path
units, ordinary-pool margins, terminal reserve, host free-space margin, and
five-minute maximum receipt age. Inline measurement contents are rooted and
scaled with exact integer arithmetic. Actual source/time/filesystem/memory
observations are checked by preflight/run. A current host capacity stop remains
before charged dispatch and invocation. Retained receipt verification uses the
saved start observation, so later read-only inspection does not require a live
receipt or create a capability.

Technical preparation must derive and substantiate the supplied sample
measurements and witness roots from retained evidence. The receipt validator
verifies their canonical/root/source bindings and arithmetic; it does not infer
the meaning of arbitrary witness bytes or turn a representative estimate into
a worst-case guarantee. Positive explicit process headroom is required. Both
fresh stores must share a filesystem to avoid double-counting free space.

Missing, malformed, stale, substituted, or insufficient receipts and invalid
historical bases stop before a durable run reservation or provider issuance.
The exact final inventory/response/invariance/robustness/privacy/runtime gates
remain unchanged. Fewer accepted responses can still yield a process-valid
disappointing result or no finalist; the source does not guarantee success.

## Verification evidence

RED commits:

- `a0a60401`: prospective allocation/capacity tests initially failed because the
  new contracts were absent (three failures; four unrelated skipped).
- `dee4d77a`: prospective preparation/receipt CLI tests initially failed because
  the new helper/help were absent (three failures).

GREEN source commit: `3db4347b` — approved prospective league envelope and
receipt admission before dispatch, including the seven narrowly scoped source
and test files described above. No tracked file was deleted.

Initial focused GREEN: two suites, 20 passed and 30 skipped in 24.04 seconds,
followed by a successful strategy-lab project build and strict NodeNext script
typecheck. These include the full exact vector, legacy V1 root/guard, malformed
and substituted bases, all capacity bindings and margins, exact producer/model
binding, missing/stale receipts before effects, and an injected charged failure
whose receipt reopens with `issued: false`, unchanged bytes, and no new issuance.

Final GREEN: five affected suites, 58 passed and 37 skipped in 116.78 seconds.
The selector also covers authoring failures, host-bound probe projection,
common-reference accounting, fingerprint retained production, the legacy
journal-start preflight, stale/oversized allocation rejection, and unchanged
small V1 retention root. Imported fixture modules register some shared tests;
the reported count is Vitest's total, not a claim of 58 distinct new tests.

```text
./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/allocation.test.ts scripts/run-v1-38-serious-league.test.ts scripts/lib/v1-38-league-authoring.test.ts scripts/lib/v1-38-league-response-runtime.test.ts packages/strategy-lab/src/factory/fingerprint.test.ts -t 'prospective CLI source-only gates|approved prospective three-base admission|prospective complete Phase 265 execution allocation|prospective league authoring adapter|host-bound league behavioral probes|charges separate common-reference|issues a separate prospective league producer branch|preflights the journal-start|rejects partial or stale allocations|rejects unrepresentable declared population|preserving the exact small v1 root'
./node_modules/.bin/tsc -b packages/strategy-lab/tsconfig.json --pretty false
./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --types node --skipLibCheck scripts/run-v1-38-serious-league.ts scripts/run-v1-38-serious-league.test.ts
```

Both final TypeScript commands passed. CLI `--help` passed. The private-league
boundary monitor passed over 1,330 source files with zero violations. Service
boundary check passed with zero strict/ownership offenses; its 19 pre-existing
report-only findings are outside this task and were not edited. `git diff --check`
passed. No new stub was found in the modified production files.

The expensive complete 29-suite gate has not been run by this executor and
remains explicitly pending with the main agent.

## Preservation and remaining gates

No new numbered plan or literal continuation chain was created. Existing
untracked historical recovery records, cache and successor locks were left
alone. No package installation was needed. No unrelated tracked edits were
staged. No SUMMARY/STATE/ROADMAP or empirical result was changed.

Remaining: independent review of final source, complete validation gate, truthful
technical preparation of actual identities/provenance and measured capacity,
then only if every condition passes the one approved run and immediate retained
verification. A failed gate leaves Phase 265 incomplete without cap increases,
retries, policy rewrites, or replacement scope.

## Self-check: passed

All three RED/GREEN commits exist, the handoff and amendment files exist, and
the source commit contains no deleted files. The final tracked diff against the
reviewed planning baseline changes neither STATE/ROADMAP nor Task 1 source proof
nor the Phase 265 allocation/run-result artifact paths. Existing unrelated
untracked recovery/cache/lock files remain untouched. This self-check confirms
the source-only handoff, not completion of the remaining gates.
