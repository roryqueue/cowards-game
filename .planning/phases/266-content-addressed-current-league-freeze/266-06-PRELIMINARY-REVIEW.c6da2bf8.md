# Plan 266-06 canonical matrix and numeric-qualification checkpoint

Date: 2026-09-30. Disposition: incomplete, preliminary, source-only and non-authorizing.

## Exact isolated source

Branch `codex/phase266-context`, locally committed, clean, unmerged and unpushed.
Checkpoint commit `c6da2bf8f6abe317854d1fdc738fd1ecc4572589`, tree
`4ae7ab0734611610eb1fdc91134f11709aab8bd3`.
Main receives Markdown only; the Plan265-11/12 execution source is unchanged.

Three bounded commits follow `762cf03f`:

- `4873ba9c7318589db7a6fa7918b6a13de7d3d416`: distinguish synthetic numeric affirmation from complete-history qualification; two factory fixture paths.
- `111fa2075722f404a9a794cc921e18bcbd9dd505`: injected canonical 24-cell matrix constituent; two new fixture paths.
- `c6da2bf8f6abe317854d1fdc738fd1ecc4572589`: test-only harness repairs and exact three-store read-only snapshot assertions.

| File | SHA-256 |
| --- | --- |
| `scripts/fixtures/current-freeze-factory-history-fixture.ts` | `f9da5bbd81577cca8c13aacb02eeb613419ea4abab36a53018451d3570771849` |
| `scripts/fixtures/current-freeze-factory-history-fixture.test.ts` | `4971c44a1b9e3b4598118ef8392c8bfd2b344fdfb77b7434b278c2b86123d588` |
| `scripts/fixtures/current-freeze-canonical-matrix-fixture.ts` | `eb9ef464749534fc88fa6411e6a495754666fa8dc29c2c49c0bc2ff9ba5de858` |
| `scripts/fixtures/current-freeze-canonical-matrix-fixture.test.ts` | `9d9b6dfc9bf74a1225628769e500d6b16f08851082cefed9610042393a4368a2` |

Production parent/response collectors and all frozen rules, resource policies
and admission bounds are unchanged in this delta.

## Numeric affirmation is not completed evidence

The opt-in v2 variant prefixes the existing hypothetical local-unit excerpts
with schema-parsed, owner-scoped `ACTION_EMITTED`, containing only Soldier ID
and the canonical Action. No memory/private payload, terminal outcome, global
closure, starting formation or reachable canonical-start trajectory is invented.
The v1 lifecycle fields are illustrative, not a claim that an edge-start Soldier
can reach the described boundary-push location by Round 2.

Exactly one direct fixed-v2 diagnostic through the unchanged assessor measured
separation `0.053231312603537306`, exceeding the unchanged `0.05` requirement.
The temporary-store numeric assessment is `affirmed`, with all three base edges
distinct. Positive controls remain correlated; latent is distinct; near and
guard controls remain unresolved. Default and v1 data remain unresolved and
unchanged. These are synthetic test-data classifications, not Strategy results.

The initially proposed complete-history assertion failed correctly. Sixteen
v2 callbacks serialize partial observations without WIN/DRAW outcomes. The
actual production `deriveFactoryCalibrationOutcome` rejects completed callbacks
with missing outcomes as `FACTORY_RUN_MATCH_OUTCOME`; it maps to `failure` only
when the execution itself is failure. The full history parent collector also
refuses `CURRENT_FREEZE_PARENT_PHASE264_IMPORT_RESPONSE`. This is not a
collector defect. No fallback, fake DRAW or weakened import gate was added.

The corrected regressions preserve numeric/ordinary/historical read-only
affirmation, explicitly require rejection of those sixteen partial callbacks
and full-history qualification, project the other thirty-two DRAW-bearing
synthetic callbacks, and deny malformed parent order or an absent threshold
without reader repair. A returned synthetic threshold is not empirical,
import-qualified or complete checked-map evidence.

## Canonical matrix constituent

The new reusable helper accepts only an `injected_fixture` declaration and
three reopened source/packet/proposal/validation closures. Tests use explicitly
unassessed legacy admissions, not fabricated Phase264 imports. Static source
compilation binds mock identity; the source is never evaluated.

Fixed inert effect data advances the unchanged pure kernel from the ordinary
sixteen-Soldier edge start for all twenty-four enumerated cells. Full canonical
transitions, result events, mock accounting and two mock cleanup records per
cell are retained through actual graph/artifact/journal writers. Canonical
Soldier and terrain positions are checked against arena bounds and both
unchanged starting-position lists. This is source-test simulation, not an
operational Match, runtime/container-cleanup proof or competitive performance.

The constituent joins exact mock source/executable/packet/proposal/validation,
tuple/runtime/request/ordinal/attempt identities, twenty-four persisted journals,
cell-derived terminal/snapshot/solver data, the round target and the actual
tactical corpus/context reader. Wrong source, accounting, cleanup, transition,
round, matrix, target and corpus substitutions are denied. Repeated verification
and tactical reopening preserve filenames, lengths and SHA-256 bytes across
all three generated temporary stores. Generated stores are cleaned in teardown.

There is no run-start/run-complete, real reservation, live preflight, provider,
guest, Strategy or model invocation. The helper never calls the operational
league or canonical Match runner and never issues a checked parent map.

## Tests and independent review

The owner full matrix suite at `111fa207` returned **13 passed, 2 failed** in
`1110.34` seconds. Both failures were retained transparently: a graph-reopen
test took `25.77` seconds against the default five-second harness timeout;
the empty-transition negative correctly raised `LEAGUE_TACTICAL_CANONICAL`
outside its assertion's accounting/transition regex.

The bounded test-only follow-on adds the existing 600-second source-harness
deadline to that check, expects CANONICAL only on the transition arm, and adds
the three-store snapshot. Runtime deadlines are unchanged. Exactly the three
affected tests then passed, twelve skipped, in `622.31` seconds. The repeated
reopening/snapshot test took `407.959` seconds, no-authority graph check `26.448`
seconds and transition denial `0.842` seconds. The other unchanged passing
tests were not redundantly rerun; no fresh full fifteen-test pass is claimed.

Root independently ran the complete factory fixture file on exact `c6da2bf8`:
one file, **14/14 tests passed**, exit 0, `230.95` seconds (`228.36` test seconds).
This includes both unchanged default regressions and all new v2 numerical,
byte-stability, outcome/import refusal and missing-parent no-repair checks.
The outcome/import denial took `36.788` seconds; missing-threshold denial took
`26.021` seconds. No source changed afterward.

Exact test commands (owner matrix epoch, owner affected rerun, root factory):

```sh
pnpm exec vitest run scripts/fixtures/current-freeze-canonical-matrix-fixture.test.ts --maxWorkers=1
pnpm exec vitest run scripts/fixtures/current-freeze-canonical-matrix-fixture.test.ts --maxWorkers=1 --reporter=verbose -t 'independently reopens journals|retains no run-complete|actual tactical replay denies transition substitution'
./node_modules/.bin/vitest run scripts/fixtures/current-freeze-factory-history-fixture.test.ts --maxWorkers=1 --reporter=verbose
```

Root's exact-source extra-strict ten-file non-emitting TypeScript gate passes,
including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. The
fresh lab boundary scan has zero violations over `1350` files; scoped whitespace
checks pass. The previous 109-test core gate is historical evidence, not a new
whole-repository run for this delta.

```sh
./node_modules/.bin/tsc --ignoreConfig --noEmit --strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes --target ES2022 --module NodeNext --moduleResolution NodeNext --skipLibCheck --types node --ignoreDeprecations 6.0 scripts/lib/v1-38-current-freeze-parent-context.ts scripts/lib/v1-38-current-freeze-parent-context.test.ts scripts/lib/v1-38-current-freeze-response-context.ts scripts/lib/v1-38-current-freeze-response-context.test.ts scripts/fixtures/v1-38-positive-response-fixture.ts scripts/lib/v1-38-league-response-runtime.test.ts scripts/fixtures/current-freeze-factory-history-fixture.ts scripts/fixtures/current-freeze-factory-history-fixture.test.ts scripts/fixtures/current-freeze-canonical-matrix-fixture.ts scripts/fixtures/current-freeze-canonical-matrix-fixture.test.ts
./node_modules/.bin/tsx scripts/check-v1-38-lab-boundaries.ts
git diff --check 762cf03ff9c6e59aace7c918a2273990088e6866 HEAD
```

Independent reviewer `/root/review_266_06_repairs` authenticated all exact
commits, trees, Git blobs and four hashes. The factory delta has zero actionable
findings. The matrix review confirmed both harness warnings and no additional
source/custody findings; its follow-on review confirms both addressed and zero
new actionable findings. No duplicate suites, edits or actual private-store
reads occurred in review. Owner test results were not independently reproduced
by the reviewer. These are bounded preliminary reviews, not Task3 approval.

## Remaining work and unchanged authority

The complete positive checked-map fixture still needs a genuinely qualifying
full factory history and three imports, then the full four-round/eleven-job
retained league graph, probes, response conditions, final evaluations, payoff,
report and exact three-store union. Numeric v2 affirmation cannot substitute
for complete canonical outcomes; do not attach fake outcomes to its independent
local-unit excerpts. The canonical matrix constituent supplies one reusable
piece, not that whole proof.

Plan06's final full applicable suite, exact-source review, summary and Plan02
consumption remain open. No empirical carrier inventory, absence receipt,
freeze root, formation, holdout opening, counted/public/production action or
operational Match occurred. Plan265-07/09 remain consumed and immutable;
Plan265-12's fresh exact operator checkpoint is unchanged. No new authorization
or retry route is inferred from this source-only work.
