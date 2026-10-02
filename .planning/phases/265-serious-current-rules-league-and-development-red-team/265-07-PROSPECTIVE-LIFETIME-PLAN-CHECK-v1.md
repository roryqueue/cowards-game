# Plan 265-07 prospective lifetime supplement — independent plan check

## VERIFICATION PASSED

Checked: 2026-10-02. One bounded supplement to existing Plan07; no new numbered plan, phase or count. Status: zero actionable blockers or warnings. This checks planned delivery, not implemented behavior or empirical success.

Reviewed plan SHA-256: `847e057d07302d9c78f96236cd1288d831d5fd53b34e79976d5c3d6d1050564e`.
Approval SHA-256: `7c316dcb60e570d41d5629c4ffe35705ad5b4c0b8005acb3063d7b44a1b5cc64`.
Research SHA-256: `5c84bd18bddc561e01a90701a499e911c3354e86290a8c9a56cbb5d816769ab2`.
Inspected checkout HEAD: `0f344d4d3b868c63c0d95e19cc5bdeed418e941f`; latest STATE header places the approved amendment before source implementation, with no active entry or retained verifier. Older state snapshots are history.

## Coverage and technical findings

| Required outcome | Executable coverage | Verdict |
|---|---|---|
| Only prospective private elapsed lifetime changes from120000 to600000ms | Tasks1–2 specify separate exact v2 amendment/allocation discriminators, domain-separated roots, exact policy equality and the recorded lifetime approval; legacy/V1 validators and every other vector value remain unchanged | PASS |
| Legacy prospective-v1, ordinary defaults, diagnostic-v4 and planner benchmark preserve their meanings | Task1 explicitly tests the historical cap/root behavior and benchmark3600000 endpoint/prerequisites; Task2 isolates the new branch rather than imposing a new ordinary planner maximum | PASS |
| Both clocks use the admitted ceiling without reset or retention bypass | Tasks1–2 bind exact600000 before construction at both boundaries, preserve setup/between-call elapsed time, factory pre/post checks and planner checking behavior; boundary expiry/cleanup and awaited retention crossings are tested | PASS |
| Existing charged Match and actual provider identity authorize construction | Tasks1–3 bind allocation/amendment/source/implementation, retained start, Match, seat, factory admission, runtime, budget and attempt identities; forged/copied/crossed handles and duplicate claims fail before constructors | PASS |
| Nested claims are not mistaken for authority reuse | Task2 explicitly uses one process-local handle with independent once-only factory/planner claims; subsequent provider construction is rejected. No serialized token, external custody or signing artifact is introduced | PASS |
| Main and every response arm receive correct authority | Task3 issues after durable `recordLeagueCellStart` plus `cell-start`, or after `response-match-start` returns chargeRoot. Response measured attemptRoot stays the red-team start; opposing attemptRoot stays chargeRoot. Both seats/self-play and score/independence arms have explicit tests | PASS |
| Selectors, capacity, reservations, types and retained reads agree | Tasks2–3 enumerate version-aware producer/capacity admission and all preparation, initial-candidate, session, reservation, run, CLI and retained-reader branches. Existing authoring/response consumers already import the admitted union, so extending that union preserves their strict shared path | PASS |
| Source closure remains complete and rooted in final bytes | Tasks1/3 require inventory coverage and byte-change sensitivity for every changed production file/helper. Current `factoryAssessmentImplementationManifest` uses the conservative boundary inventory, which includes a new scripts/lib TypeScript helper naturally; no manifest exclusion or historical root rewrite is planned | PASS |
| Validation stays source-only; later live work remains distinct | Task1 requires constructor/dispatch counters and injected clocks/host seams; Task3 requires the eight existing CI commands, touched types, package-scoped regressions and independent fixed-source review. Executor may not launch real capacity, provider/model/Match, empirical allocation or retained verifier | PASS |

The source-backed hardest constraint is matching retained charge/provider provenance through both nested runtime layers, not merely raising a number. It is addressed in Task2 and wired explicitly in Task3. Planned negatives cover stale/crossed roots, scalar-only admission, constructor overrides, version swapping and historical reinterpretation.

## Verification dimensions

- Requirement/decision coverage: the supplement addresses LEAG-01/02/04/05/09 plumbing; existing Plan07 retains all LEAG-01–09 responsibilities. D-01–06 are implemented/preserved in the actions; D-07–21 remain explicitly unchanged. Deferred formation, holdout and public/counted/production work is excluded. No scoped requirement is reduced.
- Task completeness: `gsd-tools.cjs query verify.plan-structure` returned valid, no errors/warnings, three tasks, each with files/action/verify/done. RED is intentional test development, not source acceptance.
- Dependencies/scope: serial RED → implementation → wiring/validation, grounded in existing Plan07 source. The plan expressly defines its wave as supplement-local; its foundation reference is not a new self-dependent numbered plan. Eleven files comprise six production files and five existing test suites for one coherent amendment. This is a sizing note, not grounds to add plans or approval gates.
- Must-haves/key links/data contracts: explicit roots and charge-to-provider wiring support all truths; no incompatible shared-stream transformation or changed durability barrier is planned.
- Architectural tier/AGENTS: authority/admission remains in private host/runtime boundaries; the canonical kernel and hostile-code sandbox are unchanged. No project-local `.codex/skills` or `.agents/skills` directory exists. The mapped PATTERNS files are not being introduced/modified by this supplement; applicable exact-schema, immutable identity, privacy and charged-failure patterns remain covered.
- Research resolution: scoped research lists no unresolved authorization question; Task2 settles the concrete version/authority design. No renewed human decision is required.
- Nyquist: VALIDATION.md exists. All three tasks have concrete non-watch automated commands; serial sampling is3/3. No MISSING test reference or Wave0 gap exists for this supplement. Whole-phase empirical Nyquist/LEAG remains partial, not passed by this check.
- Verify-command sanity: focused Vitest paths and strict touched-script types are concrete; no swallowed-error comparison, tree-output anchor, stale numeric test-count assertion or application command is used for this check. Longer existing source gates are explicit retained root work, not a promised sub30second feedback loop.

## Structured issues

```yaml
issues: []
```

Proceed with source-only execution of this checked supplement, then independent fixed-source review/validation. Standing fresh same-scope approval needs no repeat literal. Only the main orchestrator may subsequently create a distinct v2 route/new immutable allocation, admit fresh same-process capacity before charge/dispatch, and hold source fixed through terminal plus its one retained verification. Consumed history, every other bound, unopened holdout, and freeze-before-formation remain unchanged. No LEAG/freeze or full-league-success credit is awarded.

This checker ran only read-only inspection and plan-structure validation, wrote only this artifact, and ran no code tests, provider, capacity observation, allocation, Match, retained verifier or commit. Unrelated dirty entries were preserved.
