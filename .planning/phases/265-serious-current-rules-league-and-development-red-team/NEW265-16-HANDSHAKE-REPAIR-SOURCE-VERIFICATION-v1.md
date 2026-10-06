---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16
kind: narrow_source_only_handshake_repair_verification
verified: 2026-10-06T14:29:59Z
status: passed
score: 4/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
source_commit: 5077e3ac1246b4785f7ce60fbbb66b6aea86314d
source_root: sha256:eaa793b2608a5a586a94f319b4cff7efe6575abba4dff80080817cf9ba92ba1c
manifest_entries: 888
empirical_credit: false
phase_complete: false
requirements_completed: []
---

# Plan 16 handshake repair: source verification

**Result: passed, 4/4 narrowly scoped source truths.** This verifies the repair plan, not the Phase 265 empirical goal. No override, actionable gap, or human-verification item is required for this source decision. Native lifecycle/cleanup and empirical feasibility remain unproved and outside this verdict.

## Goal-backward truths

| # | Must be true | Status | Actual evidence |
| --- | --- | --- | --- |
| 1 | Actual v7 host frames match the selected generated v7 broker for the same payload and request ordinal, including the first two exchanges. | VERIFIED | Session source at line 444 hashes `v1.38-lean-startup-v7:<requestId>:` plus exact payload bytes; broker selection at line 430 selects `buildLeanContainerBrokerSourceV7`. Generated v7 at line 252 changes the actual v5 guard domain to v7; the guard at line 289 checks the payload root. The connected test at lines 90–157 invokes the real session/default stream producer twice with identical payloads and exercises the selected generated guard. Independent named v7 execution passed, not merely symbol inspection. |
| 2 | v5/v6 compatibility, wrong-domain rejection and authority injection refusal remain intact. | VERIFIED | The production ternary retains v6 and v5 selections. Test rows cover all three issued authority versions; each generated guard accepts the matching digest and rejects both other domains. The real authority guard at line 384 rejects either injected transport or streamFactory before construction; the test asserts both. Independent VALIDATION-v1 executed all three rows: 3 passed, 29 skipped, exit 0 in 9.06s. |
| 3 | Production repair is minimal and does not change resources, cleanup, game rules, authority or privacy semantics. | VERIFIED | Actual `git diff 00a5beda 5077e3ac` changes only one production line in the session digest selection, plus the connected test file. No source delta from repair commit exists in either file. Bounds, cleanup path, authority guard and response validation are unchanged. No debt/stub markers were found in either changed file; `git diff --check` exits 0. Full manifest independently recomputed once: 888 entries, exact root above. |
| 4 | Regression is connected to the real producer and grants no empirical or whole-phase completion claim. | VERIFIED | Test calls `createLeanContainerMatchSession` without injected production transport/stream options, obtains the actual broker in Worker arguments, and captures actual exchange frames. Hoisted child-process/Worker mocks are deny-by-default; synthetic control/shared buffers supply only fixture responses. Generated trusted guard is sliced before the supervisor, so no guest Strategy, broker imports, native Worker, Docker, provider or Match executes. Repair summary explicitly has empirical-credit:false, phase-complete:false and no requirements completed; LEAG-02 remains unchecked. |

## Artifact and wiring trace

Both production session and regression exist and are substantive. Issued authority → factory/planner claims → session claim → descriptor version → generated broker selection → real `runMethod` payload/frame → default stream exchange → generated digest guard is connected. Request IDs begin at 1 and increment in the real session; the fixture exercises two consecutive requests and identical payload bytes. This is protocol data flow, not a UI/static-placeholder substitute.

The regression's synthetic revision/admission/cold-store metadata and fabricated completion response are scaffolding, not proof of successful Strategy execution or native cleanup. `new Function` executes only trusted generated guard code here and is not a security boundary for hostile Strategy code.

## Independent verification performed

```sh
node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-host-stage-v7.test.ts --maxWorkers=1 -t 'real issued v7 host frames'
```

Exit 0: **1 passed, 31 skipped**, duration **5.63s**. It checks exact payload/domain roots, ordinal binding, matching generated broker, both wrong-domain negatives, both injection negatives, request1000/host5000 limits and synthetic fixture close. The independently recorded validation also passed v5/v6/v7; its full parameterized-name attempt selected zero tests and was correctly not counted.

```sh
node --import tsx --input-type=module -e 'import {leanCorrectionSourceManifest} from "./scripts/run-v1-38-lean-correction.ts"; const m=leanCorrectionSourceManifest("v7"); console.log(JSON.stringify({root:m.root,entries:m.entries.length}))'
```

Exit 0: **888 entries**, `sha256:eaa793b2608a5a586a94f319b4cff7efe6575abba4dff80080817cf9ba92ba1c`. Old consumed identities are not relabeled. The recorded worker 32/32 suite and strategy-lab noEmit were not rerun or presented as this verifier's execution. No probe is declared by this repair; no empirical CLI was run.

Disconfirmation targeted a detached-helper test, wrong-version broker selection, and injection bypass. Actual call-site/selected-source checks and executed negative cases resolve these for the repair. The sliced guard does not cover full broker supervision or native cleanup; no such coverage or empirical claim is made.

## Scope, requirements and authority

ROADMAP Phase 265 active goal/success and all nine LEAG requirements remain empirical and incomplete; this narrow repair does not certify them. LEAG-02 is supported only insofar as the repaired transport preserves failure/non-imputation boundaries, not marked satisfied. No gap is deferred and no prohibition override is used.

Existing v7 failed prefix, **29 spent charges**, all consumed records/readers and continuously carried time remain immutable. The prior one-plus-conditional-one envelope ended at refusal; releasing the source hold creates **no** allocation, run, route, refund/recredit, ordinary-reader or baseline authority. A genuinely new prospective decision is required for any future empirical envelope.

Only this new report was created. No source edit, commit, native execution, consumed private-payload inspection, ordinary retained reader or real empirical state mutation was performed. Synthetic test stores are newly isolated and removed by fixture teardown.

---

_Verifier: independent source-only gsd-verifier_
