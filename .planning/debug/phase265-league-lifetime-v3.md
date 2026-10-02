---
status: investigating
trigger: "Fresh approved Phase265 league-v3 stopped after one charged cell with FACTORY_RUNTIME_LIFETIME_EXHAUSTED"
created: 2026-10-01
updated: 2026-10-02
---

# Phase265 league-v3 lifetime diagnosis

## Symptoms

- Expected: a fresh same-scope private league runs under the frozen120-second
  per-Match,96-hour,resource/accounting/privacy bounds after source review and
  fresh passing capacity. Source validation alone is not empirical completion.
- Actual: exactly one start/terminal, no authoring jobs, terminal process-invalid
  at2026-10-01T22:52:59.983Z. Both distinct providers' retained cleanup records
  report cleanupComplete=true and orphanedChild=false. Container absence was
  initially unverified; root later observed exact-owned absence (Evidence below).
- Error: allowlisted FACTORY_RUNTIME_LIFETIME_EXHAUSTED on soldierBrain,
  phase3/round1/cycle6, transitionordinal1364. Kernel failure is system_failure /
  LAB_SUPERVISOR_FAILURE; allocation retention is not exhausted.
- Timeline: current source accb76c5 passed independent scoped review and exact
  29-suite/367-test gate. Root entry started22:29:13.977UTC; static preparation
  passed, fresh capacity observed22:50:55.470UTC, then the one cell failed.
- Reproduction: do not rerun any consumed allocation, provider, Strategy, Match,
  preflight or diagnostic envelope. Use closed retained graph and source-only
  profiling/fixtures. Any fresh empirical route retains independent source
  review, source gates, immutable new allocation, fresh capacity and zero retries.
  Direct human standing approval already covers future fresh same-scope routes;
  it does not extend the frozen120-second deadline or other budgets.

## Current Focus

- current_measurement: ONE current-source v6 profiler56053 completed exit0,
  complete/cleanupComplete=true, fixed70430463/2f008952.50fresh append samples
  reproduce exact retained records; mean107.548ms;150filefsync2931.027ms and
  100dirfsync1906.276ms (~90% sampled append elapsed). No live runtime issued.
  Separate ONE reviewed pressure observation20757 passes10calls,mean2.865ms;
  no capacity admission. Both probes closed. This supersedes unmeasured-cost
  wording below, not the preserved historical v3 or v6 failure evidence.
- next_corrective_action: source-only async dependency-sync plan with unchanged
  individual file syncs/dependency barrier-before-descriptor/final barrier,
  exact bytes, conservative charges and awaited evidence/next-dispatch gate.
  Feasibility/partial-failure contracts are not yet proven. No new route starts.

- current_epoch: v6 consumed at reviewed dbf5daa2; v3 evidence below stays
  historical. Unique ordinary retained verifier65319 completed exit0,
  observed05:30:44UTC,issued=false/process_invalid/empiricalRequirementsComplete=false.
  Do not repeat it. Root may run ONE independently reviewed bounded data-only
  profiler next; production source remains fixed for measurement.
- current_hypothesis: aggregate120-second supervisor lifetime is still the
  initiating failure; remaining live cost split is unknown after the accepted
  durability/canonical-literal/Unicode-key CPU repairs
- current_next_action: source-only trace and design of a bounded retained-input
  profile, independently reviewed before ONE future non-executing measurement;
  preserve all durability/accounting/resource/cache/hostile-input bounds.
- current_evidence: v6 allocation5c59970a/headb21465c7/raw result09002c67 ended
  05:04:02.930UTC after5charged cells (4valid,1systemfailure). Bounded metadata
  read of parent-linked runtime-failure descriptor8e1c2a37/raw78249965 names
  allowlistedFACTORY_RUNTIME_LIFETIME_EXHAUSTED; no whole-Match payload was
  opened and this is not a second ordinary retained verification. Exact ten
  expected provider containers are absent; retention exhausted=false.
- caution: four valid prefixes do not prove all workloads fit120seconds.
  Earlier profiling at v3 is not a measurement of the current dbf5daa2 source.
  No caller cache/provider reuse, silent clock reinterpretation, skipped
  durability, weaker validation or reduced quality denominator is authorized.

The following focus/evidence/resolution describes the prior v3 diagnosis.

- hypothesis: supervisor lifetime expiry confirmed; synchronous durability
  dominates sampled graph-recording work, but live aggregate share is unknown
- test: completed bounded source-only retained-input profiling; five actual
  graph-proven rows reproduced in 50 durable fresh-record writes with no runtime
  execution and injected no-op capacity callback
- expecting: root reviews CPU-only behavior-preserving optimization first;
  directory-barrier batching remains unproven and cannot be silently adopted
- next_action: hand diagnosis and private reproducible harness to root;
  no source edits/commits or fresh route initiated by this session; root retains
  ownership of unique verify-retained session73144 and later source gates
- reasoning_checkpoint:
- tdd_checkpoint:

## Evidence

- timestamp: 2026-10-01
  checked: actual rooted allocation and exclusive returned result
  found: allocationRoot80e2409f330b45d53ff565d9630a52b0b0767b1f9f4fd77c6705175d4044e0d7;
    headRoot82b6929c5c91a1f3b90bbda9b7c639627af8f351e295273a0c3000039420fcbe;
    process_invalid, empiricalRequirementsComplete=false, one executed cell
  implication: route consumed; no league/freeze requirement can be credited
- timestamp: 2026-10-01
  checked: retained run-start capacity receipt/observation
  found: receipt47c297d6a68363130ba4b8856588bcbcd41c52fe8c41f5b5f28b1a30e451684e;
    availableMemoryBytes10995116277, freeFilesystemBytes219157053440,
    unchanged projected required free filesystem210368502440
  implication: actual admission passed; entry was not a capacity refusal
- timestamp: 2026-10-01
  checked: graph failure and cleanup rows
  found: lifetime expiry code/stage above; cleanupComplete=true and
    orphanedChild=false; work5922403bytes/1438records, terminal411bytes/1record,
    retention exhausted=false
  implication: initiating retained failure is supervisor lifetime, not a
    storage budget stop; cleanup claims require separate retained verification
- timestamp: 2026-10-01
  checked: previously closed V4 diagnostic summary
  found: distinct diagnostic codec/lifetime route completed same S01/S03 Smoke
    cell with1473transitions/500calls in75.373seconds (parent93.739seconds)
  implication: comparison motivates instrumentation diagnosis but is not
    interchangeable full-league timing/capacity proof or old-route retry authority
- timestamp: 2026-10-01
  checked: independent read-only timing/source map from retry_plan_check
  found: factory lifetime starts before selected-runtime construction;
    aggregate 120-second clock includes construction, kernel, guest and graph
    work; wrapper prechecks canonical request and fresh capacity, then graph
    recording canonicalizes/hashes/chunks and durably writes perartifact;
    ordinary retained evidence has no percall elapsed timestamps
  implication: confirmed aggregate lifetime stop cannot yet be attributed to
    a specific dominant component; source-only retained-input profiling needed
- timestamp: 2026-10-01
  checked: GSD debugger resolution and scoped investigation authority
  found: local gsd-tools query resolves balanced profile, model gpt-5.4,
    effort xhigh; typed debugger router dispatched with fresh file context;
    typescript-expert specialist skill unavailable in active catalog/local skills
  implication: diagnosis proceeds without generic specialist substitution,
    source edits, live execution, deadline changes or redundant approval gates
- timestamp: 2026-10-01
  checked: root's completed compact actual-head graph read and exact-owned
    container absence inspection
  found: rooted graph contains 462 successful runtime-invocation rows; root
    supplied five actual graph-proven descriptor roots for bounded profiling;
    exact-owned league-c6d37cc3107e7b9ec1-{0,1} both returned NoSuchContainer
    against live daemon in read-only inspection, with no lifecycle command
  implication: cleanup absence is now independently observed by root;
    selected-row profiling can use proven graph membership without duplicating
    full retained verification or permitting any provider/container lifecycle
- timestamp: 2026-10-01
  checked: source-only profiling of five parent-proven retained rows through
    actual LeagueRecordGraph writes into fresh injected temporary stores
  found: 50/50 descriptor hashes matched originals; two 25-row rounds append
    totals 3135.131ms/3141.618ms, medians 124.196ms/124.090ms; each round had
    75 file-fsync and 75 dir-fsync calls; combined sync 90.46%/89.72% of append
    elapsed; real filesystem operations/accounting delegated unchanged;
    request prechecks 78.201ms/86.264ms used counted no-op capacity callback
  implication: synchronous durability is the sampled record-writer cost;
    historical live aggregate dominance is not established, since provider,
    construction, kernel, real capacity and historical store/host cost unmeasured
- timestamp: 2026-10-01
  checked: ten repeated component microbenchmarks per retained row
  found: full canonical admission medians 4.938-9.395ms, single encoding
    1.768-4.122ms, parsing 1.314-2.979ms, SHA 0.019-0.040ms; measurement windows
    excluded imports, allocation validation, store setup and retained-row decode;
    private harness /private/tmp/league-retained-profile.8yBSuZ/profile.mts
    sha256:57b73822d75a4dec6b6c2954c2aa96a3dfb1bf88c8a04f86d8e50d9e3f44448c
  implication: hash caching is poorly targeted; canonical encoder allocation
    optimization may offer limited source-only savings without any barrier change

## Eliminated

- hypothesis: this route was refused by initial capacity or retention limits
  evidence: actual run-start has admitted capacity; cell charged; retained
    failure allowlist is lifetime expiry and retention exhausted=false
  timestamp: 2026-10-01

## Specialist Review

- specialist_hint: typescript
- result: typescript-expert is not available in the active skill catalog or local
  skills; no generic specialist substitute invoked
- scope: diagnosis-only; no fix-choice prompt repeated because root explicitly
  owns later evidence-backed implementation and human already granted scoped
  same-bounds future routes, not any deadline or durability/accounting change

## Optimization Directions and Policy Boundary

- CPU-only candidate: optimize canonical encoder allocation/reuse of immutable
  punctuation bytes while preserving every admission stage, bound, error,
  artifact byte, accounting effect and fsync sequence. Source map:
  packages/spec/src/canonical-json.ts:234-253 and second encoding 197-200.
  Direct encoder substitution is not proven admission-equivalent. Any source
  fix still needs independent review and root's exact source gate.
- Durability candidate: file-fsync all dependencies, one dependency directory
  barrier, then descriptor and its own barrier before return. Successful-return
  closure could be preservable, but crash/uncertain-publication semantics are
  not yet proved equivalent. This is not an approved behavior-preserving fix;
  any actual semantic weakening is a human-only policy checkpoint.
- No empirical completion/admission/proof is credited from these temporary
  profiles. The distinct 75.373-second V4 route cannot be added to sampled costs
  as an asserted timing prediction or re-used as full-league proof.

## Dependency Barrier Equivalence Concerns and Minimum Tests

Current perartifact ordering is file fsync, hardlink, temporary-name unlink,
directory fsync; descriptors follow dependencies and latestRoot advances only
after every publication returns. A grouping candidate remains unproven.

- Ordering: every dependency file fsync and a successful dependency-directory
  barrier must precede descriptor hardlink; descriptor-directory sync must
  precede latestRoot advancement and append success. Cover one/multiple chunks.
- Interruptions: fault-inject after every write, file fsync, hardlink, unlink and
  barrier. Before the grouped barrier some dependencies may survive and others
  disappear, changing current durable partial progress. No descriptor/head may
  be credited; surviving partial artifacts remain inspection-only. Mocked call
  order alone does not prove crash persistence.
- Barrier errors: dependency-barrier failure prevents descriptor publication;
  descriptor-barrier failure prevents append success/head advancement. Preserve
  exact propagated errors, charges and no-refund behavior.
- Existing files: current identical-file reuse verifies bounded content and
  directory-syncs without another publication charge. Test existing dependency,
  existing descriptor, mixed fresh/existing and all-existing records. No fresh
  write is not proof that an existing name is already durably retained.
- Safety/errors: preserve digest/size/type/path guards, O_EXCL|O_NOFOLLOW,
  hardlink publication, temporary cleanup and conflict rejection. Cover
  conflicting bytes, invalid file types, write/file-sync/link/unlink failures.
- Accounting: preserve each fresh-target beforePublication charge/order/count,
  reserve checks, charged-but-absent republication rejection and no refunds for
  failed/uncertain writes; existing-identical reuse keeps current accounting.
- Concurrency: interleave two temporary-store publishers with same/conflicting
  bytes and boundary failures. Preserve collision errors and prevent overwrite,
  double credit or dangling descriptor. A directory barrier is not a transaction
  and cannot stand in for checking another publisher's dependency closure.

Byte/hash equality establishes encoding equivalence only. No crash, uncertain
write, accounting or concurrency equivalence for directory-barrier batching has
been demonstrated; any semantic weakening remains a human-only checkpoint.

## Resolution

- root_cause: aggregate supervisor 120-second lifetime expiry confirmed;
  synchronous durability dominates sampled graph writer, live cost split unknown
- fix: none applied; no frozen bounds or source epoch changed
- verification: root unique retained verifier retained; compact rooted reads and
  exact-owned absence inspection passed; source-only 50/50 descriptor equality;
  no live execution, new capacity observation or empirical completion claim
- files_changed: [.planning/debug/phase265-league-lifetime-v3.md]
