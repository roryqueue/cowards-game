---
phase: 265
plan: 07
status: complete-source-only
date: 2026-10-02
empirical_authority: none
source_commit: a98b5c2be9410b63e944143e1b0b693fc5c303bf
---

# IPC preservation — actual final source gate v1

Root's ONE new gate95810/PID91648 completes exit0 at11:26:04.572UTC,
elapsed1998913ms. Independently reviewed private driverd221416d runs the
unchanged exact eight-command CI block sequentially. Every pre/post-command
raw-pin, implementation/source and ancestry guard passes. This gate is CLOSED;
never duplicate its invocation or replace its exclusive marker bytes.

Fixed implementation: sha256:ea34d793c2dd52015c7b12a66ae1ca7092793dafc08bb885392c116d333c4f4c.
Fixed source: sha256:2bf949994153e6d28c69916c3e2c3b4a29b0b5c8ff7595032e27054ba21c632f.

Actual private marker raws:

- start9419a6c4c5a998598de7a397b9eb44ecaee98ae6099db6fa53bd2ef2c61bb065,
  start2026-10-02T10:52:45.658Z;
- completionde6bda15cb15e661a96249dc0a4cff476698365f8d4841adbd2e558ed40ae5d6.

## Actual gate results

- Complete29-file league/factory/runtime suite:450/450tests,1889.35seconds.
- Separate tactical-corpus suite:3/3tests,69.07seconds.
- Strategy-lab build and unchanged strict14-script check:exit0.
- All three private-boundary scans:1353files each,zero violations.
- Service boundary checker:strict0,ownership0,report-only19. The existing
  report-only debt remains; it is not silently reported clean or fixed here.

Independent four-file source reviewa5b7a3f4 and driver-reviewe971e1c2 are clean.
Author's distinct whole owned suite62868 is already CLOSED152/152; focused
RED/GREEN, coherent negative guards and configured four-file strict proof are
in EXECUTION-v1, committeda8117a5e. No failed historical verifier was rerun.

## Root regression checks and honest initial command failure

Root initially invoked both package suites from repository cwd (session8136).
It CLOSED exit1:424passed,2failed,38files. Both failures are ENOENT at the
pre-existing sandbox-evaluation tests293/313 resolving process.cwd()+../..
to /Users/roryquinlan/apps/worker/src/runtime-config.ts. This is an incorrect
test invocation directory, not evidence of a repaired source regression.
No source changed and the failed invocation is not claimed passed.

Correct package-cwd invocations `pnpm test -- --maxWorkers=1` then pass:

- packages/runtime-js,session27147:19files/277tests,9.31seconds,exit0;
- packages/engine,session58019:19files/149tests,19.63seconds,exit0.

These controlled unit fixtures are not an empirical league route or accepted
Match evidence. Core build `tsc -b packages/spec packages/engine
packages/runtime-js` exits0. Private v8 helper configured strict no-emit check
(session4395,including noUncheckedIndexedAccess/exactOptionalPropertyTypes)
exits0. No guest/provider/candidate output is credited by these checks.

## Fresh preparation boundary

New v8 helper final raws531d4dae/fa54f60b have independent clean reviews-v14/v15.
Root's ONE data-only draft43883 completes exit0 after these technical gates:
request74aff3ca,disclosurecf5a3c7b,rolesea0691d7,completion9e2331ae.
Eleven requests remain UNEXECUTED and NOT REVIEWED; actual distinct packet
review must precede compilation. No allocation, receipt, charge or Match exists
yet. Source remains fixed. Standing human same-bounds approval applies, not a
new authority inferred from this gate. Old v7/retained66301 remain closed
failures, never reinterpreted. No LEAG, freeze, formation, holdout, public,
counted or production credit follows this source-only proof.
