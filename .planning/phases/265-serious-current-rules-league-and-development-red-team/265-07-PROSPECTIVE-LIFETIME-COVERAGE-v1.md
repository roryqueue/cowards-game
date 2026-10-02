# Plan 265-07 prospective lifetime supplement — coverage map

Scope: source/test coverage mapping for supplement `prospective-lifetime-v1` only. This is not a Phase 265 completion audit, source gate, or empirical result. No tests or gates were launched for this map; the unique fixed-source gate43923/PID7438 remains root-owned and active at `bb98878ec996ec63529093a45d9e55ed89e64610`.

## Evidence basis and status

The supplement has three tasks, five explicit `must_haves`, and threats LT-01–LT-05 plus SC. The current source-review-v2 records zero findings over the cumulative 13 source/test files. The recorded focused GREEN observations below are historical scoped evidence only; they are not a whole-suite/source-gate pass, independent re-execution, or LEAG/freeze acceptance.

| Recorded session | Recorded scope/result | Coverage relevance |
|---|---|---|
| 40355 | Final five-file prospective-lifetime focused group; 23 passed, 238 skipped | Allocation, both supervisors, runner, response; main charge, response arm/self-play and source-inventory assertions |
| 66692 | Tactical corpus prospective-lifetime group; 4 passed | v1/v2 tactical selection and actual retained authoring/profile/envelope joins using inert records |
| 73198 | Restored tactical/factory/response regression group; 6 passed | Defect-restoration GREEN for selector, inherited-constructor rejection and actual response wiring |
| 44083 | Response focused group; 6 passed; strict production types exit 0 | Response wiring plus strict types across tactical and lifetime production files |

The gate report says wrapper type-check passed before entry; gate43923 then completed CI3 build and CI4 strict script/test types. CI1 full league/runtime/factory suite was running at the report snapshot; other CI commands and package-scoped regressions/build were pending. Whole source acceptance therefore remains **PARTIAL/PENDING**. Do not infer fresh green status from an active gate.

## Task-to-behavior map

| Supplement task | Behavioral coverage and concrete files/tests | Classification | Pending or limitation |
|---|---|---|---|
| T1 — failing mock-only regressions | `allocation.test.ts`: `prospective lifetime allocation` (exact v2 policy, fail-closed malformed/crossed capacity); factory and planner test files cover authority rejection, defaults and clock boundaries; runner tests cover prospective preparation/root closure and main retained charge; response tests cover enumeration and retained score/self-play wiring. All five focused suites were included in session40355. | COVERED (focused) | Not independently rerun here. 238 skipped cases are expected under `-t`; they are not additional coverage. |
| T2 — versioned admission and nested clocks | `allocation.test.ts`; `v1-38-factory-supervised-runtime.test.ts` (`prospective lifetime empirical authority rejects inherited constructor…`, scalar/forged-handle denial); `v1-38-planner-supervised-runtime.test.ts` (`…planner uses issued nested claim…exact expiry`). Session40355 includes the core groups; session44083 adds production strict types. | COVERED (focused) | Full source gate and package-scoped engine/runtime regressions remain distinct pending gates; no empirical runtime result is represented. |
| T3 — selectors, roots, retained joins | `run-v1-38-serious-league.test.ts`: preparation binds reviewed roots before candidate reads; changed production byte inventory; main cell charge-before-two-provider identities. `league-response-runtime.test.ts`: 72-condition enumeration, actual retained response charge and both provider identities/seats/arms; refusal path checks no providers. `league-tactical-corpus.test.ts`: v1/v2 selector plus actual retained tactical authoring joins. Recorded in 40355, 66692, 73198, 44083. | PARTIAL | Focused joins are recorded green, but unique complete source gate, package-scoped builds/regressions and independent final-source acceptance are pending. This task also has no live allocation/capacity/retained verification by design. |

## Five must-have truths

| Must-have | Observable test/evidence anchor | Status |
|---|---|---|
| Exact600000 prospective-v2 allocation; only elapsed ceiling differs from prospective-v1 | `allocation.test.ts` prospective-lifetime allocation cases; source-review-v2 allocation policy audit | COVERED (focused/source-reviewed) |
| Legacy/v1 remain120000; defaults, diagnostic-v4 and planner benchmark meanings unchanged | Allocation, factory and planner focused groups in40355; explicit benchmark boundary/prerequisite assertions in planner suite | COVERED (focused) |
| Both clocks receive the admitted duration through charged Match and provider provenance; scalar/forged/crossed authority denied | Factory/planner issue/claim negatives and fake-clock tests; runner main cell test; response actual wiring test; tactical authoring regression | COVERED (focused) |
| Main/response, capacity, reservation and retained readers select the same version and roots | Runner preparation/source test; response and main provider joins; tactical retained selector; review-v2 inspection of all applicable selectors | PARTIAL |
| Mock-clock/source review cannot confer empirical LEAG or freeze completion | Plan summary/review/gate explicitly classify source work separately; phase `265-VALIDATION.md` remains partial/false | COVERED as a status boundary; empirical requirement remains open |

The fourth truth is partial pending the unique complete gate and scoped package regressions. No source-coverage finding changes the immutable consumed-route history or upgrades the v9 outcome.

## Threat map

| Threat | Concrete defense and test/evidence | Status |
|---|---|---|
| LT-01 spoofed scalar/forged authority | Allocation exact-version tests; factory/planner forged and partial authority denial before constructor/session; inherited constructor variants; independent once-only claims. | COVERED (focused) |
| LT-02 crossed allocation/start/source/seat | Factory authority provenance negatives; main cell charge test; response both-seat/self-play test; tactical retained target/corpus/envelope join tests. | COVERED (focused) |
| LT-03 lifetime drift/timer reset or bypass | Fake monotonic clock setup and exact-expiry/cleanup tests in factory and planner; awaited-retention boundary in focused suite; unchanged guest/invocation/budget limits reviewed. | COVERED (focused/source-reviewed) |
| LT-04 stale roots/history reinterpretation | Preparation binds current roots; source inventory assertions; version-aware retained readers reviewed; consumed routes explicitly immutable. | PARTIAL — focused/source review recorded; complete final-source gates pending. |
| LT-05 public/synthetic authority leakage | Private helper and no-public-export intent; conservative source inventory plus boundary scans required by fixed-source gate. | PARTIAL — inventory assertion and review exist; final boundary scans pending in gate43923. |
| SC package/dependency drift | No package/dependency additions in reviewed diff; diff/review evidence. | COVERED by review; no installation performed. |

## Cumulative source/test surface (13 files)

Tests are bolded by `.test.ts` suffix; the remaining files are production dependencies whose bytes must stay in the reviewed source identity.

- `packages/strategy-lab/src/league/allocation.ts` / **`allocation.test.ts`**
- `scripts/lib/v1-38-factory-supervised-runtime.ts` / **`v1-38-factory-supervised-runtime.test.ts`**
- `scripts/lib/v1-38-league-prospective-lifetime.ts`
- `scripts/lib/v1-38-planner-supervised-runtime.ts` / **`v1-38-planner-supervised-runtime.test.ts`**
- `scripts/lib/v1-38-league-response-runtime.ts` / **`v1-38-league-response-runtime.test.ts`**
- `scripts/lib/v1-38-league-tactical-corpus.ts` / **`v1-38-league-tactical-corpus.test.ts`** (necessary transitive selector/retained-authoring dependency)
- `scripts/run-v1-38-serious-league.ts` / **`run-v1-38-serious-league.test.ts`**

## Remaining validation gaps

1. Complete the one root-owned gate43923 on the pinned source. At the captured gate snapshot CI1 and remaining exact CI commands, package-scoped engine/runtime-js/core regressions/build, and source boundary scans were pending. Do not duplicate the gate or run competing heavy checks.
2. Record the gate's actual terminal outcome and verify the source identity remained fixed; a clean review and focused GREEN groups do not substitute.
3. Keep empirical proof explicitly separate: fresh allocation and capacity admission have not occurred; no provider, Match or retained verifier is authorized by this coverage map. The approval only supports the stated prospective private ceiling, not LEAG/freeze completion.

No implementation/test/validation file was modified by this mapping except this supplement artifact.
