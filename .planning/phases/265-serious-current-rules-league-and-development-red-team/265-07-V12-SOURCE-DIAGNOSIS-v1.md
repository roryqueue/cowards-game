---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
scope: v12_bounded_read_only_source_diagnosis
date: 2026-10-03
diagnosis: inconclusive
original_throw_point: unknown
present_resource_candidate: disk_margin_deficit
new_type_error_reproduced: false
league_credit: false
---

# Plan 265-07 — V12 source diagnosis

## Outcome

The original V12 entry TypeError remains **UNKNOWN**. All eleven actual compiled
job authoring preflights pass under the unchanged source and current filesystem
metadata. Exact static capacity-plan admission and current implementation/source
joins also pass. One subsequently authorized present resource observation finds
a 699,357,864-byte disk-margin deficit with sufficient memory. No new TypeError
was reproduced and no receipt was constructed. These results narrow current
static hypotheses; they neither certify the full run nor retrospectively prove
which step the consumed entry completed.

The existing `265-07-V12-ENTRY-TERMINAL-VERIFICATION-v1.md` is already complete
and was read, not repeated. The ordinary retained empirical reader was not
invoked: it requires an actual published head, and none exists.

## Exact input identity and original interval

Checks use `.planning/artifacts/v1.38-phase-265-allocation-v12.json`, with raw
SHA-256 `19cce0e4ef93454e944990b58802dab053e3f86f0e881ba34d85d238ee696ce9`
and admitted root
`sha256:02bb7a07b956c37eeadb2282cf12cfd1775aa7bb71cf5d052d3c069736343b0e`.
The allocation is committed at
`526bb7c19e30a7b1059b0b8f436b9962eb393794`. The source identities remain
implementation `552bba3d` / source `defe5024`, accepted source `9ffde3ff`;
the independent source/helper checks referenced by the terminal report remain
unchanged. This diagnosis does not alter any of those inputs.

The exact private capacity-plan path is
`.strategy-lab/league-265-prospective-v12-20261002-a/capacity-plan-input.json`,
raw SHA-256 `284c7c7a87284b147b41359d3aa9301417e91ec13bd294b1872b94f29605ff59`.
The orchestrator confirmed the actual entry uses `--capacity-input`, not
`--capacity-receipt`, through its private entry marker/wrapper metadata.

Original entry `15575` / PID `44627` ran from
`2026-10-03T04:28:03.922Z` to `2026-10-03T04:42:54.570Z`:
890.648 seconds (14 minutes 50.648 seconds), exit 1. Its retained wrapper only
establishes TypeError with details withheld, result unpublished and no retry.
The duration is not proof of a particular historical-reader or capacity throw.

## Actual bounded diagnostic commands and timings

Executed once each from `/Users/roryquinlan/runtime/cowards-game`:

```sh
pnpm exec tsx .strategy-lab/265-v12-static-authoring-diagnosis-20261003-bounded-v1.ts
pnpm exec tsx .strategy-lab/265-v12-static-joins-diagnosis-20261003-bounded-v1.ts
pnpm exec tsx .strategy-lab/265-v12-present-resource-diagnosis-20261003-bounded-v1.ts
```

| Check | UTC interval | Internal / shell time | Result |
| --- | --- | --- | --- |
| All eleven direct `preflightLeagueAuthoring` calls | 04:54:51.978–04:54:56.135 | 4155.492574 ms / 4.962549139 s | 11/11 pass, exit 0 |
| Exact pure capacity-plan admission and source joins | 04:57:37.598–04:57:38.285 | 685.900575 ms / 2.672610530 s | All joins pass, exit 0 |
| Authorized single present resource observation | 05:01:03.830–05:01:05.110 | 1279.066244 ms / 1.989471735 s | Current disk shortfall, memory sufficient, exit 0 |

Authoring job ordinals 0–10 respectively took approximately
270.053, 262.369, 238.950, 259.899, 247.801, 237.245, 244.204, 252.076,
241.272, 239.218 and 266.056 ms. No artifact contents, Strategy source,
objectives, prompts, auth, memory, raw IO or arbitrary error text were emitted.
Diagnostic failures would expose only finite explicit known
`LEAGUE_AUTHOR_*` / `LEAGUE_ALLOCATION_*` codes; none occurred.

The authoring script uses the direct module function rather than the CLI or
runner. Before its dynamic imports it denies filesystem mutation, child-process
operations and Worker construction. The complete authoring module and its
immediate read/admission/transport/CLI paths were traced: preflight only reads
and validates artifacts, schemas, hashes and file metadata. App-server spawning
is inside a separate transport function, never called by this preflight; the
imported intake CLI is guarded against running on import. Factory repository
creation only validates and freezes an existing directory, without recovery.

The second script uses only allocation's pure plan admission and the read-only
source-manifest inventory. It creates no receipt, reads no host-capacity metric,
and excludes the root private evidence/planning/dependency/generated stores from
source inventory. Neither script imports or calls `runSeriousLeague`.

## One authorized present resource observation

After the initial inconclusive static checks, the root authorized exactly one
bounded present observation, not capacity admission. The entire existing
`scripts/lib/v1-38-darwin-headroom.ts` request/parser was read first. The third
fresh private script uses that exact `/usr/bin/memory_pressure -Q` request:
C locale, explicit fixed PATH, ignored stdin, 200 ms timeout, `SIGKILL`,
4096-byte maximum and `shell: false`. A one-use guard admits only that exact
command/options; every other child operation, Worker construction and filesystem
mutation remains denied. No full runner import is needed. Raw command buffers
are wiped after the existing pure parser and never emitted.

At `2026-10-03T05:01:05.103Z`, exactly one `statfs` call per declared directory
(two total) observes both on the same filesystem. Only the prescribed existing
query is executed once. The finite arithmetic is:

| Resource component | Bytes |
| --- | ---: |
| Observed free filesystem space | 209,669,144,576 |
| Static projected physical cost | 167,418,829,480 |
| Unchanged terminal reserve | 21,474,836,480 |
| Unchanged required free filesystem margin | 21,474,836,480 |
| Required total free filesystem space | 210,368,502,440 |
| Present filesystem deficit | 699,357,864 |
| Observed effective available memory | 11,854,109,736 |
| Required available memory | 1,073,741,824 |

Current disk does not satisfy the exact required margin; current memory does.
`createLeagueCapacityReceipt` at allocation source lines 343–350 would reject
this observed vector with the finite code `LEAGUE_ALLOCATION_CAPACITY_MARGIN`.
The branch is called by `measureProspectiveCapacity` before reservation as
traced below. This is a **predicted deterministic refusal for the present
vector**, not a newly thrown TypeError: no receipt construction/admission was
called. It is also not retrospective original-cause proof. Original free disk,
memory, capacity-stage arrival and throw point were not retained, and the
present observation is not claimed identical to the original host state.

## Exact source order and limits of inference

For the actual `capacityInput` branch in
`scripts/run-v1-38-serious-league.ts`:

1. `prepareLeagueRunInputs`, lines 684–693: admit allocation, bind run/implementation
   and current source, admit the static capacity plan, bind output repositories
   and check payoff retention limits. This branch does **not** observe live
   capacity here; the alternative supplied-receipt branch can do so.
2. Lines 694–699: call `readLeagueInitialCandidates`, validate prospective bases,
   population identities, candidate admission and source closures. The reader
   at lines 288–313 indexes historical artifacts, reads the retained factory
   ledger, verifies historical assessment, imports assessed candidates and
   binds their source/packet/proposal/validation closure. It was **not rerun**.
3. Lines 700–702: enforce the separate response repository, run all eleven
   authoring preflights and response-Match budget checks, then reopen the empty
   league inventory read-only. The new direct job check does not prove the
   original entry reached this point after its preceding historical work.
4. Lines 710–715: after static preparation returns, measure/admit fresh
   same-process capacity, then re-observe it through the dispatch guard.
5. Lines 716–718: create the retention budget and `LeagueConnectedSession`.
   Its constructor at lines 449–457 calls `prospectiveRunCapacity`, validating
   the newly supplied receipt and observing live capacity **again before reserve**.
   The graph constructor itself stores state; it does not execute a provider.
6. Line 719: `reserveRun` exclusively creates the allocation reservation and
   publishes the receipt-bound marker; line 720 publishes `run-start`.
   The main run failure-catching region starts at line 726, after those steps.
7. Native provider construction and Strategy execution belong to subsequent
   charged cell/response execution, not to direct authoring preflight.

Therefore a failure newly reproduced inside direct authoring preflight on this
same path would necessarily precede capacity observation and reservation. **No
such failure was reproduced.** Current static success cannot identify the
original throw site. Empty retained records establish record absence only:
they do not prove absence of every unrecorded host observation or transient
native/provider construction. In particular, live capacity observations and
session construction occur before the first retained run evidence.

## Remaining possibilities and bounded recommendation

Unobserved original throw locations remain in the historical/candidate validation
chain, other pre-reservation static joins/metadata, live capacity observation or
receipt admission/re-observation, and reservation/initial publication setup.
No retained original finite diagnostic or stack distinguishes them. The new authoring
and exact static-plan/source checks eliminate only their currently reproducible
static rejection hypotheses, not transient historical conditions. The present
disk-margin failure is now the strongest specific capacity-stage candidate:
it predicts an exact finite refusal before reservation if this vector is used,
but does not establish that the consumed entry reached that branch or saw that
same vector.

Stop here. Do not rerun the consumed entry, repeat the approximately fifteen-minute
historical scan, invoke the ordinary retained reader without a head, or perform
live capacity/runtime operations. If further diagnosis is separately approved,
use one narrowly scoped read-only stage-local probe with explicit time/IO caps,
fixed error-code whitelist and structural-only stage/stack metadata; an
expensive historical branch still needs explicit clearance. That probe must
exclude capacity admission, run reservation, Match/native/model/provider work,
holdout and formation, and must preserve original consumed evidence. This is a
recommendation for diagnosis only, not a fix or execution proposal.

Guest 1000 ms, private host receipt 5000 ms and Match 600000 ms remain unchanged.
No production source, STATE, consumed/old artifact, result reservation, ledger,
capacity receipt or historical result was edited. Only the existing debug file,
this new safe report and three fresh private diagnostic scripts were written.
The sole native command was the separately authorized existing read-only
memory query, not a runtime/Strategy/model/provider construction. No commit,
push, fix, test suite, verifier rerun, provider, Docker, Match or holdout
operation occurred. LEAG-01–09 remain pending; freeze, formation,
public/counted/production authority remain unchanged.
