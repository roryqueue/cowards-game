---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
verified: 2026-10-04T14:53:07Z
status: source_verified
scope: bounded_source_only_subprocess_cleanup_error_precedence
score: 5/5 bounded source truths verified
behavior_unverified: 0
overrides_applied: 0
source_commit: 4e71c9b60fb05cc832c2b83b3eb6f3c692254cfd
diff_base: cb829a71568cd07913ae4bef5091f088e0728e0e
verification_head: 5815eb7c5f9a6148587500521269c254fb2a4ec2
verifier: /root/verify_265_subprocess_repair
source_sha256: c3eb794d4ed05e4fbdd18359b065b1910b8eaf88dbd0b99e8b018b1299986ef0
test_sha256: ee70abf3b2acf15fc4e3efb631dda8fe687e34b268e03c71deb47ddbf86df3e8
actual_initiating_cause: unknown
empirical_repair_proved: false
baseline_unblocked: false
phase_265_complete: false
freeze_266_authorized: false
---

# Plan 265-16: Bounded subprocess source verification v1

**Outcome:** `source_verified` for the five narrowly scoped truths below. This
is not a phase `passed` verdict, baseline verification, full-source certification,
or authorization to run a replacement schedule. No BLOCKER or WARNING was found
within the bounded repair goal.

**Bounded goal:** Cleanup exceptions must not mask primary session failures or
skip remaining cleanup; cleanup must fail closed and remain cached, dispatch
must stop after poisoning/closure, and the existing runtime, correlation,
privacy and authority contracts must remain unchanged.

**Initial verification:** The exact target report did not exist. No override was
used. AGENTS.md, the current STATE frontier, SUBPROCESS-DIAGNOSIS-v1,
SUBPROCESS-REVIEW-v1, Phase 265 roadmap and Plan 16 scope were inspected. No
project-local `.codex/skills` or `.agents/skills` directory exists. Diagnosis and
review claims were treated as pointers, not passing evidence. The complete
two-file source/test diff and both current scoped files were read, together with
the relevant planner, factory and baseline caller paths. Only this report was
authored; no source modification or commit was made.

## Goal achievement

| # | Bounded observable truth | Status | Independent evidence |
|---|---|---|---|
| 1 | Primary native errors and their existing origin survive each cleanup throw. | VERIFIED | Session `remove()` at lines 279–293 contains exceptions separately; `runMethod` at line 335 rethrows the same primary error after poisoning. The 16-case fixture exercises signal, thrown stream error, stale correlation, and explicit close across close/rm/inspection/all faults. It asserts finite signal/exit/malformed codes; stream-error additionally asserts exact error identity and `stream_exchange/unknown`; stale-frame retains `outer_frame/correlation_invalid`. Signal origin remains absent, not fabricated. |
| 2 | Stream close, removal and final absence inspection are each attempted once without an earlier throw skipping later operations. | VERIFIED | Three sequential independent try/catch blocks at lines 284–291; each tested fault combination asserts one stream close, one rm and three total inspections (initial, post-create, final), including repeated close. Explicit-close cases dispatch no exchange. |
| 3 | Any throw from the three cleanup steps causes a cached incomplete cleanup result. | VERIFIED | Completion is the conjunction of three flags at line 292, each false on its failed step. Cache guard at line 280 returns the incomplete result without retry. All 16 cases assert repeated `cleanupComplete:false/orphanedChild:true`, unchanged counts, and fail closed even when later removal/absence succeeds. |
| 4 | Poisoned or closed sessions forbid additional dispatch. | VERIFIED | Poison changes state before cleanup at line 299; close changes state before cleanup at line 357. `assertActive()` at lines 304–306 precedes exchange. Each fault case asserts the correct poisoned/closed state, next-call rejection, and exchange count of one or zero, not another dispatch. |
| 5 | Guest 1000 / host 5000 / Match 600000, stale correlation, public privacy and authority remain unchanged by this repair. | VERIFIED | Functional diff changes only `remove()`. Broker/harness, authority and parser code are unchanged. Planner line 127 still passes guest 1000; session lines 259–263/317 retain issued host receipt and bounded exchange; authority lines 51–54 retain 600000/5000; `LEAN_CAPS` retains 15GB/8h/300Matches and 1000/5000/600000. Selected stale-frame, clean multiplex/counter-isolation, ambiguous-absence and both exact-absence-tuple tests pass. No new error publication or authority issuance is introduced. This is preservation evidence, not renewed certification of these wider contracts. |

**Score:** 5/5 bounded source truths; zero present-but-behavior-unverified truths
within this goal. Behavioral claims about cleanup and state are supported by
tests executed in this verifier's process, not merely symbol presence.

## Artifacts, wiring and data flow

| Artifact | Exists / substantive | Wiring | Result |
|---|---|---|---|
| `scripts/lib/v1-38-lean-container-match-session.ts` | 358 lines; substantive cleanup containment, state/cache and primary-error paths. | `remove()` is used by poison, explicit close and constructor cleanup. `createPlannerSupervisedRuntime` constructs the session and installs its adapter in the selected executor. | VERIFIED |
| `scripts/lib/v1-38-lean-subprocess-attribution.test.ts` | 157 lines; 4 primary modes × 4 fault modes, real assertions for classification/origin/counts/cache/no-dispatch. | Imports and invokes the actual session implementation with injected process-local transport and stream. | VERIFIED |

| Key connection | Evidence | Result |
|---|---|---|
| Native catch → poison → cleanup → original rethrow | Session lines 299, 335 and 279–293; primary identity/classification survives tested fault modes. | WIRED |
| Explicit close → state guard → cached cleanup | Session lines 280, 304–306 and 357; repeated close does not rerun cleanup or permit exchange. | WIRED |
| Private session origin → planner diagnostic → factory wrapper | Planner lines 156–159 retain `failureOrigin(error)` or executor/unknown fallback and finite system code; factory lines 117–120 forwards only authenticated diagnostic evidence. These caller bytes are unchanged. | WIRED (static preservation; no provider invocation) |
| Session cleanup → planner/factory close → baseline cleanup disposition | Planner lines 128–129, factory line 124, baseline-match lines 96/108 retain the cleanup result and incomplete disposition. | WIRED (static preservation; no Match invocation) |

Level 4 dynamic-rendering data trace is not applicable: the repair contains no
UI, database, dashboard or dynamic rendering. Its relevant output is the
non-hardcoded cleanup receipt derived from actual step results/throws; tested
incomplete output and selected successful cleanup paths both pass.

## Independently executed safe gates

```text
pnpm exec vitest run scripts/lib/v1-38-lean-subprocess-attribution.test.ts --maxWorkers=1 -t 'should preserve primary attribution and fail-closed cleanup'
```

Exit 0, **16 passed**, duration 2.35s (tool chunk `b2985d`). Each enumerated fault
case ran; the inert synthetic source bytes were serialized, never executed.

```text
pnpm exec vitest run scripts/lib/v1-38-lean-container-match-session.test.ts --maxWorkers=1 -t 'poisons on stale persistent response frames|requires exact absence after removal|accepts the exact.*absence tuple|multiplexes mixed methods|keeps separate streams'
```

Exit 0, **6 passed / 102 skipped**, duration 3.42s (chunk `2ce834`). The selected
cases use injected transport/stream fixtures. Broker/Worker/Strategy execution,
receipt allocation and provider cases were not selected. No workspace/full
suite was run; the review's 51-case selection was not duplicated.

```text
pnpm exec tsc --noEmit --ignoreConfig --types node --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes --skipLibCheck scripts/lib/v1-38-lean-container-match-session.ts scripts/lib/v1-38-lean-subprocess-attribution.test.ts
git diff --check 4e71c9b6^ 4e71c9b6
git diff --exit-code 4e71c9b6 -- scripts/lib/v1-38-lean-container-match-session.ts scripts/lib/v1-38-lean-subprocess-attribution.test.ts
```

All exited 0; configured two-file strict types had no diagnostics (chunk
`2e1a11`); diff/identity checks had no output (chunk `fdaee7`). Current scoped
file SHA-256 values match the frontmatter. HEAD remained `5815eb7c` through these
checks. This is not a global script/workspace typecheck claim.

**Probes:** No dedicated shell probe is declared for this two-file source
repair. No empirical driver or conventional wider phase probe was substituted
for safe mocked tests. The ordinary retained verifier was not invoked.

## Requirements and non-authority

| Requirements | Bounded repair relation | Completion disposition |
|---|---|---|
| LEAG-01/02/03/04/05/07 (Plan 16) | Preserves adjacent error/cleanup handling only; no complete matrix, solver, training, response or portfolio evidence is generated. | NOT VERIFIED by this report; requirements remain unchecked. |
| LEAG-06/08 | Original diversity/robust-finalist gates remain deferred/non-green under the approved limited experiment. | No completion credit. |
| LEAG-09 | Fixed automated-round disposition is unchanged; no round is executed here. | No completion credit. |

The roadmap's phase-level empirical success criteria and Plan 16 baseline
truths are deliberately **not** represented by the 5/5 source score. The actual
baseline failure remains a blocker to those broader outcomes. No future-phase
deferral is used to erase that empirical gap.

## Anti-pattern and disconfirmation checks

No unreferenced `TBD`/`FIXME`/`XXX`, TODO/HACK/PLACEHOLDER, empty implementation
or logging-only handler was found in the two scoped files. The existing broker
`parsePayload` null return at line 113 is schema rejection, not an empty data
stub. Buffer defaults and false cleanup flags are populated by bounded real
steps, not placeholders. Exception swallowing here is intentionally paired with
an incomplete receipt; it does not silently turn cleanup failure into success.

Adversarial checks targeted (1) an early throw skipping rm/inspection, (2)
absence success hiding a prior throw, and (3) repeated close retrying or a
poisoned session dispatching again. All are exercised by the fault fixtures.
Disconfirmation limits: LEAG outcomes remain unverified; signal-frame tests
prove classification retention, not why a real subprocess was signalled;
native asynchronous termination/OS behavior is not exercised by these mocks.
Malformed/accessor-throwing cleanup receipts are contained by the same guarded
receipt reads but have no separate named regression in this bounded selection.
No broader real-runtime or exhaustive error-path proof is claimed.

## Human frontier and limits

No human check is required to conclude the exact source-only goal above. Real
provider/Strategy/Match behavior and empirical crash repair are outside that
goal and remain unproved, not silently passed. Historical `cleanupComplete:true`
and retained `SUBPROCESS_SIGNAL` are recorded in the planning diagnosis/STATE;
this verifier did not reopen private empirical payloads to recheck them. Those
recorded facts mean the demonstrated masking branch was not the observed
initiating failure. **Actual initiating cause UNKNOWN; baseline not unblocked.**

The closed baseline and ONE ordinary reader `37314` remain spent/immutable. No
prepare, allocation, admission, provider, native Strategy, Match, old/new reader,
reconstruction or retry ran here. No `.strategy-lab` history/reservation was
opened or modified; no private source, stdio, memory or objective payload is
published. Phase 266 freeze/formation/holdout remain unstarted; no current-finalist,
LEAG/Phase completion, public/counted/production credit is granted. Shared
15GB/8h/300Match caps and fixed opportunity remain unchanged. The prospective
no-replacement-rule amendment is a separate pending human decision; this source
verdict does not infer approval or authorize continuation.

---

_Independent bounded source verifier: /root/verify_265_subprocess_repair._
