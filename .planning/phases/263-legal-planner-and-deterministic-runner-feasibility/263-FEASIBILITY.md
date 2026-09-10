---
phase: 263
plan: "06"
status: non_pass
reason: LAB_BENCHMARK_NON_PASS
empirical: true
allocation_consumed: true
retries_remaining: 0
phase_complete: false
factory_eligible: false
production_authorized: false
---

# Phase 263 — Actual-source feasibility result

The sole bounded run passed behavioral validation but failed the selection-method speed gate. It correctly dispatched **zero Matches**. This is an honest terminal non-pass, not Phase263 completion or competitive-strength evidence.

## Observed results

| Check | Observed | Disposition |
|---|---:|---|
| Frozen validation cases | 256/256 | Pass |
| Actual validation guest calls | 232 | Pass |
| Expected pre-runtime rejections | 16 source +8 input | Pass; not guest calls |
| Benchmark calls | 2200/2200 | Complete; no retry |
| Selection direct-method p99 | 64.135270 ms | **Fail: must be strictly below5 ms** |
| SoldierBrain direct-method p99 | 2.349449 ms | Pass: strictly below5 ms |
| Match attempts | 0 charged,24 unused | Correctly gated |
| Uncertain validation/benchmark/Match units | 0/0/0 | No missing accounting |
| Complete run elapsed | 517054.38332 ms (8.62minutes) | Within60-minute bound |
| Host peak RSS | 800024 KiB | Host measurement, not container peak |
| Private evidence size | 13784794 bytes | No Match traces; source/input/output evidence remains private |

Each method used100 excluded warmups and1000 measured calls; nearest-rank p99 is unchanged. No truncation, timing-region change, threshold relaxation, extra source sample, retry, formation, holdout, public or counted play occurred. The strict speed gate stopped the run before checkpoint/restart/reproduction Matches, so those actual-source guarantees remain unproven.

## Immutable bindings

- Run source commit: `d138fdb2fe1767bb1d5439b4c935e1ea91deba0c`.
- Manifest: `sha256:074d63e3879dee0f43ee01cb18eec4e088d79eb5092b2219feeb27cd8d87721e`.
- Emitted source: `sha256:6bf1f02f273f4c743781aee7f9a9693aa55096e687bedaedba49504e4c14907b` (24294bytes).
- Execution closure: `sha256:08cb747202ea9d67ec28119b1c776fcc2efabfcd8986887dd1dfdf25bfc2ca1c`.
- Terminal receipt raw bytes: `sha256:fcac4e5bdfee23a25e5d785ee74089a1c65819f394b20420646b4b154cd1f734`.
- Validation result raw bytes: `sha256:1fd593fc5be37f3a9cb6c48f93be83085ee13947a5299c0e60df8b5ecd85f9fd`.
- Benchmark cleanup raw bytes: `sha256:b6ec473e56d103e26a99e6e8edcf60c21a035f16b262cf143a915a2d31f316df`.

The checked-in manifest records exact machine/runtime/corpus/review/budget identity. Raw data remains under owner-only ignored `.strategy-lab/phase263-feasibility`; no source, memory, objective, raw diagnostics or traces are included here.

## Cleanup nuance

The validation result reports complete cleanup. The dedicated benchmark cleanup record reports `cleanupComplete:true,orphanedChild:false`, and the post-run read-only Docker listing found no `planner-263` container. The aggregate receipt nevertheless conservatively reports `cleanupComplete:false`: its success-shaped benchmark branch folds `benchmark.passed` into that field. Preserve these exact bytes; do not reinterpret a failed timing gate as an orphan, or rewrite the receipt into a pass. Any future implementation should derive this aggregate field from the retained cleanup fact independently of timing success. This reporting issue does not rescue the failed64.14ms speed gate.

## Verification and realism

The planned read-only `--verify` command completed successfully and returned `non_pass`, with no execution. Before preparation,196 safe synthetic/static tests, strict standalone CLI/test types and package build passed; full-source independent review had zero active findings. Those checks did not predict or certify real speed.

All256 actual validation cases passed, including legal-input/hidden-state equality, fresh/reused contexts, visible sensitivity, tactic/stale/Advance controls and hostile classifications. There are no Match traces to inspect: the planned8 geometry-distinct baseline start reviews and24-Match semantic reproduction are blocked, not waived. Three arena labels still represent only two geometries. No result supports competitive strength, a frozen current league, formation comparison, or factory-scale eligibility.

## Next boundary

### Read-only diagnosis and ordinary repair

All1000 measured selection samples exceed5ms (minimum14.162ms); retained median durations scale with reserved Soldiers:1=16.884ms,2=37.046ms,3=46.975ms,4=56.252ms. This is systematic computation cost, not just outliers. The owned observer times `method.call(...)`, excluding build and transport.

Static inspection identifies repeated per-objective validation, mission creation and unchanged input scoring inside the beam. A four-Soldier256-expansion call evaluates missions2056times across both hypotheses. Call-local caching of reserve missions, mission status and invariant scoring facts is being prepared in an isolated repair branch, preserving exact ordering, hypotheses, beam size, expansions, decisions and memory. This is a source-derived optimization hypothesis; no profiler or extra timing sample was run, and the required12.83x p99 improvement is not yet established. The measured source and immutable evidence remain unchanged on main during repair.

The run is permanently consumed. Ordinary source diagnosis and a proposed behavior-preserving optimization are allowed, but a new actual-source measurement allocation requires a bounded contract revision by the operator. Do not reuse this directory, manifest, consumed marker or unused Match slots as a new retry. Continue within the existing phase/plans; no new numbered repair-plan chain or exact authorization literal is needed.
