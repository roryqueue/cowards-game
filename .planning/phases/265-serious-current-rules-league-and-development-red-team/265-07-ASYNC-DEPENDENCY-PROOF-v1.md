---
phase: 265
plan: "07"
date: 2026-10-02
status: measured_data_only_source_gate_in_progress
issued: false
empirical_completion: false
---

# Asynchronous dependency repair: bounded proof

Reviewed source `634b0e84896132a1a9ac5d855763b0793abfe1bc` is fixed at
implementation `sha256:f942c33fc577b1cca8b1742b73f2e31637f431abecf6b69b70001cc03b6a0744`
and source `sha256:ae9b47ba2c607fd54baee4fee8ac24291524877d5f60b954192f6aaa0ff69a06`.
The checked supplement to existing Plan07 changes only six source/test files;
there is no new phase, workstream, resource contract or gameplay decision.

## Source correction and independent review

The two dependency-file fsync waits overlap; both settle before dependency
publication/barrier, serial descriptor publication/final barrier and invocation
evidence issuance. All three file and two directory syncs remain. Exact bytes,
bounded snapshots, ordered conservative precharges, no-overwrite publication,
pending/close gates, no refunds and synchronous/large/stream fallbacks remain.

Three bounded correction passes fixed four independent findings: preparation
and fallback dispatch-stop coverage; exception-safe all-owned cleanup;
public-runner original-error handoff; and refusal of heads claiming unretained
response terminals. The final independent source reviewv4 is clean. The final
public-boundary selection passes9tests in39.98seconds, strict two-file types
and whitespace pass. Earlier repository32/runner26/response13passes and build
are prior-stage proof, not independently rerun final complete-gate evidence.
The preserved execution/review/fix-v1/v2/v3 reports give actual RED/GREEN and
harness facts. Their logic-change classification is not a human checkpoint.

## Unique data-only measurement

Root invoked the separately reviewed new watchdog once in session78928.
It completed exit0/no signal/no timeout/no output in10,643.976ms. Private
`league-async-cost-profile-20261002-a/profile.result.json` is42,516bytes,
raw SHA256 `6893aa60cfef286908c5e896e60270881007f50412972b016b28c110d6c5f958`.
Result complete=true, cleanupComplete=true, error=null, with both source
snapshots exactly matching the fixed identities above. This probe is CLOSED.

The same five parent-proven historicalv6 rows were used in2rounds×5repeats.
All50fresh real async writer stores reproduced exact original payload, chunk
and descriptor roots. Actual counts:150publications/504,320bytes,150file syncs,
100directory syncs,35retained reads/136,156bytes,50no-op capacity prechecks.
Only owned scratch files/directories were removed; old stores were unchanged.

| Fresh append sample | Mean ms | Median ms | p95 ms | Range ms |
| --- | ---: | ---: | ---: | ---: |
| Earlier synchronous source, closed profile56053 | 107.548 | 107.026 | 109.440 | 88.156–138.670 |
| Current async source, closed profile78928 | 98.885 | 104.497 | 107.719 | 69.654–110.530 |

Observed mean reduction is8.054%, median reduction about2.36%. These are
separate sequential observations on a fixed lexicographic slice, not randomized
whole-workload experiments. Instrumentation is included. Concurrent file-sync
waits sum3,520.236ms; directory-sync waits sum1,908.705ms. Concurrent sums
overlap and MUST NOT be added as exclusive wall time or CPU percentages.
No provider, Strategy, Match, model, Docker lifecycle, live capacity receipt,
preflight or whole retained verifier ran. Whole-Match improvement is unproven.

## Reviewed helpers and active source gate

Helper raw hashes:

- profile `84976030e5c0801b20a93ca68d9d05eaa13be5cc94fd4e0173c1cff157f746c0`;
- entry `68ac6a588147e0c93a3ce92e958a890d5a14f75bb239d205ada6187a77dca45e`;
- watchdog `fa8b73c14afe2ac2217bd049c3057c7a70e042a3c180a77e44b8d5366b47740e`;
- new source-gate driver `c3017bf2f341e60aecb7b3a62c44680a403f63a0b735851b2af6376a3fe16b55`.

Independent helper-reviewv1 is clean. The report's conservative literal bound
57,543<65,536bytes and external120second watchdog are unchanged safeguards.
Historical allocationv6 is read only as writer-budget data, not fresh authority.

Root's ONE unchanged eight-command source gate is active in session28406,
using NEW `phase265-async-source-gate-v1.ts` and create-only marker paths.
It checks all six raw pins, CI hash, full implementation/source and reviewed
commit ancestry before/after each command. Completion is not yet claimed.
Never duplicate this active gate or rerun old gate16883.

No fresh route is started. Standing approval permits later distinct same-bounds
private routes only after gates/new allocation/fresh same-process capacity.
Consumed routes remain terminal. LEAG, current-rules freeze, formation,
holdout, public, counted and production outcomes remain unclaimed/closed.
