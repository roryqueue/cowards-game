---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16
date: 2026-10-05
scope: static_startup_resource_diagnosis_only
status: diagnosed_source_defect
historical_trigger_attribution: unproven
implementation_applied: false
execution_authorized: false
specialist_hint: typescript
---

# v5 baseline startup resource diagnosis

Confirmed source defect: baseline admission repeatedly fully materializes the already-accepted diagnostic before the first new charge. This is an allocation-heavy startup path, not merely a check-root lookup. The historical outcome is independently confirmed `resource_threshold` / `child_failed` / `SIGKILL`,96096ms, with zero recorded current charges/observations and no result/check. **The exact allocating call, numeric trigger sample and initiating OS cause are not established.** No fix or new run was performed.

## Evidence and source custody

Finite authoritative reports: [diagnostic verification](265-16-STARTUP-DIAGNOSTIC-VERIFICATION-v1.md) accepts check `sha256:a6b50ff770faaa7b1a5b6093dd3654c5c8f09fcc78db51e56bf95bc728c3043c`, current1/cumulative24. [failed baseline terminal verification](265-16-STARTUP-BASELINE-TERMINAL-VERIFICATION-v1.md) binds allocation `sha256:602a7e1b2869935b03a683943c220d0d7581a10119aa273ef1197633cb3a2d02`, held HEAD `f2df613f3d5563aa72e7e3e6dc9bcc81bcbaeedf` and source `sha256:a0940a8a76119a8e2f0033bd91d24473acd383d97ca17d108395bccabb7d8873`.

Relevant-source `git diff --exit-code <heldHEAD> -- <eight explicitly named correction/baseline/reuse/retained/pipeline/resource files>` returned0. Inspection HEAD was `51407c826eab9f0eff2fef9b65b985038071de26`; relevant execution source is unchanged. No current full-manifest helper was executed.

## Precharge call graph

Paths below are repository-relative; line numbers refer to unchanged inspected source.

|Boundary|Exact source path|
|---|---|
|Parent request admission|`scripts/run-v1-38-lean-correction.ts:658` → `allocationFor:567` → `readLeanCorrectionRequest:241–242` → supervisor request `267–285`; historical cold reuse at280, accepted diagnostic at282|
|Parent predecessor admission|Same parent at660 → `inspectLeanSupervisorCorrectionPredecessor:320–321` → v5 predecessor `483–501`, accepted diagnostic at493; repeats the first full diagnostic audit before `runLeanBoundedParent:661` forks|
|Released child admission|Child ready/release `636–646` → `runLeanCorrectionChildBody:573–575` → same allocation/request/accepted-diagnostic chain; first checkpoint at616, first charge at601 only after subsequent pipeline/publication/dispatch work|

Nominal startup therefore has **two parent full diagnostic audits plus one child full diagnostic audit** before first new charge. Preparation separately repeats both parent admissions (`correction.ts:557`), but is not simultaneous with baseline execution. The actual retained entry proves parent pre-fork admission completed; it does not identify where the failed child stopped or prove its full traversal finished. No child predecessor audit is present. The diagnostic request's accepted-check-null branch at282 terminates the nesting; this is repeated finite work, not infinite recursion.

For **each** `scripts/lib/v1-38-lean-correction-retained.ts:293–319` accepted-check authentication:

- Line305 rereads/authenticates diagnostic request and historical cold reuse.
- Line306 calls `verifyLeanEvidence`; `packages/strategy-lab/src/league/lean-experiment.ts:1336–1348` decodes every retained selected replay at1344. `decodeLeanReplay:878–888` allocates full gunzip output, UTF-8 string, split lines and parsed frame array, then returns that array even though this caller discards it. Uncompressed limit is256000000B at845; compressed on-disk size is not decoded heap size.
- Lines308–315 materialize result (8MiB ceiling), retained reuse (4MiB), observation (8MiB), pair, two source snapshots, origin and journal, then recompute the complete retained audit. Line310 canonical-hashes both reuse objects for equality. `auditLeanCorrectionRetained:46` validates/clones cold reuse again. The authenticator returns only compact roots/closure fields at319; no audited-object reuse is retained.
- The audit guard callback defaults to no-op at37 and the authenticator supplies none at315. Replay's own transient guard is single-process (`lean-experiment.ts:847,883`), not the live combined parent+child guard. This is not proof of an unbounded replay: existing byte limits and validations remain present.

Current cold-reuse optimization is real but narrower: `scripts/lib/v1-38-lean-baseline-reuse.ts:22–49,122–157` authenticates exactly fourteen fixed historical files, each at most262144B, and reuses original corpus/proposals/seven source snapshots rather than regenerating cold/search work. `validateLeanColdReuse:113–120` nevertheless revalidates semantic/hash/provenance inputs and returns `freeze(structuredClone(v))` on every call. Its seven source validators (`97–103`) call `scripts/lib/v1-38-lean-baseline-source.ts:60–65`, rebuilding static revisions (`31–57`; validation/artifact construction, not Strategy execution). Pipeline admission repeats reuse validation (`scripts/lib/v1-38-lean-baseline-pipeline.ts:58–61`); precharge publication of each reused source repeats it (`baseline-source.ts:78–83`). No cold-reuse or accepted-check memoization exists in these implementations.

Parent and child are separate processes and independently materialize the same private inputs. Completed temporary objects can become garbage; whether their RSS is retained, collected or overlaps later objects is unknown. Source alone cannot assign the terminal RSS to one specific object, parser or compiler operation.

## Guards and arithmetic

`scripts/run-v1-38-lean-baseline.ts:327–333` samples every250ms and records `resource_threshold` if either predicate is true:

`currentParentRss + currentChildRss + 512000000 + 335544320 > 2000000000`

OR `currentLeanElapsedMs(ledger) >= 43200000` for strictly admitted v5.

Constants are decimal2GB scratch and512MB external reserve, plus320MiB buffer; not2GiB/512MiB. `lean-experiment.ts:9–10,846,1357–1359` preserves15GB total/12GB retained/1GB terminal/300Match and old8h caps, selecting12h only after exact v5 admission. Combined parent+child RSS allowance is **1152455680B**. The parent ready check uses the same scratch arithmetic before release (`baseline.ts:318`). Child checks use maximum child live/retained RSS plus live parent (`baseline.ts:181–187`; `scripts/run-v1-38-lean-experiment.ts:112–115`) and correction checks add disk/headroom/time reserves (`correction.ts:196–199`).

Illustrative **terminal-only** substitution:

`627642368 + 607703040 + 512000000 + 335544320 = 2082889728B`

This exceeds scratch by **82889728B**. However parent RSS is reread after exit, and childRssObservedBytes is the maximum retained sampled child RSS (`baseline.ts:330,361`); these are not a simultaneous failure sample. Terminal physical10625024B/free205825908736B likewise do not prove historical peak disk/headroom. The finite reason stores the combined code, not which OR operand or live values triggered it (`baseline.ts:345–350`). It supports parent resource-guard termination, not OS OOM or a native Strategy signal diagnosis.

Closed accounting is33812347ms at1791242322180, leaving9387653ms below12h **at that closure**. Normal cumulative12h exhaustion is not supported by that record. `currentLeanElapsedMs:1000–1015` uses conservative wall/monotonic bounds and can fail closed to the cap on clock uncertainty; absent the actual sample, precise time-operand attribution remains unknown. Admission reserves1860000ms (one600000ms Match +30000 cleanup +30000 terminal +600000 check +600000 replay), not36 maximum Matches (`correction.ts:62,86–91,198`). Later diagnosis/report/admin costs continue carrying from the latest authenticated closure; no time, charge or file debit is reset.

## Minimal prospective correction seam — recommendation only

Preserve every full audit, byte/hash/schema/provenance/replay and closure obligation. Authenticate once **per invocation and process** into a bounded opaque immutable admission snapshot, then pass that result through request and predecessor validation instead of reopening/materializing the same diagnostic twice. Reuse already-admitted frozen cold inputs within that invocation rather than repeatedly rebuilding/cloning all seven sources. A child independently authenticates once; a parent Boolean or serialized cache is not authority.

Bind the snapshot to supervisor/version, current source/HEAD/policy, request bytes/data review, allocation, accepted-check bytes/root, all full-audit inputs and exact descriptor/custody identities, plus authenticated closed time/reader custody. Recheck required mutable/TOCTOU boundaries and invalidate/fail closed on any change; no status-only, global, cross-invocation, cross-source or cross-route cache. Preserve same-process capacity and live aggregate guard checks. Replay streaming/discarding parsed frames may merit a later source-only change, but do not skip integrity decoding or promise a memory/performance gain without bounded proof. No caps or historical artifacts change.

## Limits and disposition

Confirmed: redundant allocation-heavy startup source path and historical resource-threshold failed envelope. Strongly consistent, not confirmed: aggregate RSS as the exact stop predicate. Unknown: failed child's exact position, allocating peak/lifetime/GC cause, failure-time numeric sample, clock anomaly, OS initiating cause, or whether this proposed correction alone would make a fresh36 baseline finish. Even one full parent audit plus one full child audit might exceed2GB; removing repetition is not a memory-feasibility or completion guarantee.

Diagnosis-only overrides TDD/fix/empirical continuation. No implementation, tests, commits, ordinary reader, authoring/cold regeneration, private payload scan, native/helper/Strategy/provider/Docker/Match invocation or new numbered plan. Only this report and the persistent debug session changed. GSD debug protocol supplied hypothesis/evidence/limitations tracking; this is not production certification. The consumed baseline remains failed, accepted diagnostic immutable, holdout unopened, and Phase265/LEAG/freeze/formation/public/counted/production uncredited. Any new empirical envelope needs new human authority.
