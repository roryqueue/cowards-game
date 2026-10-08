---
status: inconclusive
trigger: "Bounded SOURCE-ONLY diagnosis of fresh v11-2 private parent resource_sampling_exception after successful compact cell"
created: 2026-10-08T01:09:00Z
updated: 2026-10-08T01:12:00Z
---

## Current Focus

hypothesis: child exits while synchronous ps is sampling and before its exit event is delivered; plausible but NOT confirmed for this run
test: source-only interval/exit ordering trace; alternative throwing budget/accounting operations checked
expecting: finite current reason cannot discriminate RSS disappearance, host command failure, accounting failure, or other exceptions
next_action: Return inconclusive native-cause diagnosis and prospective finite-provenance fix/test proposal; no additional execution under exhausted authority

## Symptoms

expected: Parent closes successfully only if resource supervision and identity remain established.
actual: MAIN24965 exit1; child exitCode0/nullsignal/507769ms; one compact cell success/OK/cleanupComplete=true; parent resource_sampling_exception; unique independent reader29841 refused, FINALfalse/check absent.
errors: finite resource_sampling_exception; native exception text withheld and not authorized for inspection
reproduction: exhausted approved pair two; source-only trace permitted, no repeat execution or ordinary reader
started: fresh v11-2 diagnostic over held ce68a908/source84b80756/915; current source hold released, HEAD e55bc8bd

## Eliminated

- hypothesis: exitCode0 plus compact success proves parent success or acceptance
  evidence: uncertainty is sticky; terminal status explicitly requires exitCode0 AND !uncertain AND no failure receipt; unique reader refused with FINALfalse/check absent
  timestamp: 2026-10-08T01:12:00Z
- hypothesis: resource_sampling_exception uniquely identifies failed ps sampling or native memory exhaustion
  evidence: same catch surrounds RSS acquisition, parent memoryUsage, allocation/time-budget checks, and threshold-branch kill; no operation tag or native category retained
  timestamp: 2026-10-08T01:12:00Z

## Evidence

- timestamp: 2026-10-08T01:09:00Z
  checked: Current STATE top frontier and source text search
  found: Both approved pairs closed; child success does not override parent sampling failure or reader refusal; exception reason set in scripts/run-v1-38-lean-baseline.ts interval catch.
  implication: Inspect source only; no acceptance, retry, recredit, guard weakening, source implementation, tests, provider/Match, or consumed-byte mutation authorized.
- timestamp: 2026-10-08T01:12:00Z
  checked: Current terminal verification v1; HEAD read-only check
  found: HEAD e55bc8bd3df418dc3837fe2cfda295b4e0eddf03; actual parent reason resource_sampling_exception; terminal exitCode0/nullsignal/507769ms; carry2cb8f651/34 cumulative charges/current1; refusal f9cf55fa and completion seal2aac2504.
  implication: Closed process-invalid evidence is immutable and non-authorizing; no current native exception or throw-stage attribution exists in permitted finite report.
- timestamp: 2026-10-08T01:12:00Z
  checked: scripts/run-v1-38-lean-baseline.ts:175-180 and 350-358
  found: rssOf executes ps -o rss= -p PID synchronously with timeout1000/maxBuffer128. Command failure can throw; malformed/empty/zero/negative/noninteger/out-of-range RSS throws PROCESS_RSS. The interval catch sets uncertainty and resource_sampling_exception, then attempts SIGKILL.
  implication: Ordinary process disappearance can make sampling fail without resource exhaustion; missing PID is not currently distinguished from unknown sampler failure.
- timestamp: 2026-10-08T01:12:00Z
  checked: scripts/run-v1-38-lean-baseline.ts:315-403 full parent lifecycle
  found: Interval begins after release; exit listener is registered before yielding; interval/timeout clear only after awaited exit delivery. A synchronous ps call blocks parent event processing while child may exit independently. Existing reason records have initiatingCause=unknown and no per-sample timestamp/stage/finite native code.
  implication: No obvious lost-listener-after-await defect; exit-versus-sample race remains a possible schedule, not the established cause. Adding an exit handler alone cannot prevent disappearance during synchronous ps.
- timestamp: 2026-10-08T01:12:00Z
  checked: packages/strategy-lab/src/league/lean-experiment.ts:1297-1375,1431-1437,1725-1731; parent leanBoundedParentTimeBudget
  found: Interval also calls allocation admission and current elapsed accounting. Accounting reads/validates the owned directory, time.ndjson and active entry.json, canonical JSON/schema/monotonic values, and extension clocks. Native filesystem errors or explicit validation guards may throw. Retry reserve exhaustion throws PREFIX_CAPACITY within leanBoundedParentTimeBudget, also reaching the same sampling-exception catch.
  implication: Catch reason is a supervision-branch umbrella, not RSS-only. Terminal timing/RSS do not establish which operation threw or its initiating cause.
- timestamp: 2026-10-08T01:12:00Z
  checked: scripts/run-v1-38-lean-baseline.test.ts existing finite-reason fixtures (source only)
  found: Fixture injects sampleThrow into ps and separately emits exit; checks sticky failure, finite reason and absence of PRIVATE sentinel. It does not exercise process disappearance during ps or distinguish budget/accounting throw from RSS throw.
  implication: Existing source tests do not confirm this empirical race; no tests were run in this diagnosis.

## Resolution

root_cause: Exact initiating/native cause UNKNOWN. Confirmed mechanism: an exception anywhere in the broad parent interval try makes uncertainty sticky, so even a later clean child exit becomes child_failed. Confirmed provenance limitation: finite resource_sampling_exception cannot identify the throwing operation. Child-exit/ps disappearance is a supported source-level hypothesis only, not a confirmed empirical defect.
fix: none; diagnosis only
verification: static source trace only; no command/test/reader/provider/Match execution or actual retained payload/exception inspection
files_changed: [.planning/debug/v11-2-resource-sampling.md]

## Throw surface and lifecycle assessment

1. RSS validation and synchronous ps execution: invalid PID/output, process disappearance, timeout, command status, spawn/permission/host resource failure or maxBuffer failure can throw. No retained code identifies which, and no OS memory-kill inference is justified.
2. Parent process.memoryUsage and time-budget/allocation/accounting validation: host resource/API failure, safe filesystem/JSON/schema/entry/clock validation failure, or retry reserve refusal may enter the identical catch. JS arithmetic/Math.max ordinarily do not throw for the validated numeric inputs; no reason to label them the likely cause.
3. The resource-threshold body calls child.kill inside the try; a synchronous kill failure also enters the catch (and may retain both reasons). The subsequent kill in the catch is outside that try and cannot be caught by that same catch.
4. A clean child exit by itself does not set uncertainty. A clean exit concurrent with synchronous ps can leave the sampled PID absent while the exit event is queued; the failed sampler then marks uncertainty before exit delivery. exitCode0/nullsignal is compatible with a kill attempt after process exit; it neither proves nor excludes this schedule.
5. No post-exit-success exemption or silently ignored unknown sample error is safe under the existing fail-closed resource requirement. Prechecking exitCode cannot close the in-flight race; PID probing alone cannot establish all resource supervision or cleanup acceptance.

## Minimal safe prospective fix and test proposal (NOT implementation authority)

Add private, versioned, schema-bound finite sampler provenance while retaining the existing catch, sticky uncertainty, kill attempts, limits and terminal/refusal semantics. Track only whitelisted operation stage (child_rss / parent_rss / time_budget / threshold_kill), sample sequence/finite elapsed offset and whether the parent exit event had already been observed; optionally classify locally known validation failures or tightly allowlisted native status categories without retaining raw message, stack, stdout/stderr, command payload or private path. Unknown remains unknown and failed. Do not mutate consumed v1 envelopes or old check authority, and do not convert any current failure to success. This addresses the confirmed attribution limitation, not a claimed empirical cure.

Proposed synthetic source tests, pending separate authorized execution: make ps disappear/fail while an exitCode0 event is queued; make ps throw while child remains live; make time accounting/reserve throw after RSS succeeds; test threshold kill throw. All must remain child_failed/refused with exactly bounded stage provenance, no private sentinel leakage, unknown errors fail closed, and ordinary clean exit without sampling failure still follows existing terminal/independent-reader gates. No native or Match run needed for these tests. A later lifecycle repair would require its own confirmed reproduction and assurance that resource observation is not weakened; this report does not recommend ignoring child-gone/unknown errors.

## Scope / accounting

No code/resource/game-rule changes or commits. Only this NEW debug report written with apply_patch. Both approved pairs remain exhausted; no fresh empirical authority, acceptance, retry, recredit or refund. Deadline remains 2026-10-08T01:43:30.738Z; all diagnosis/admin cost counts toward unchanged108000000ms/15000000000B/300Match envelope, exact2000000000B scratch,768MiB Node old-space, guest1000ms/host5000ms/Match600000ms. No LEAG/phase/freeze/formation/holdout/public/counting/production credit. GSD debug skill influenced persistent evidence/hypothesis separation and diagnosis-only stop. Memory quick search returned no matching entries and was not used for conclusions.
