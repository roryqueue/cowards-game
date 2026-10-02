---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
reviewed: 2026-10-02T07:53:00Z
depth: standard
review_mode: bounded_source_only_helper_review
files_reviewed: 4
files_reviewed_list:
  - .strategy-lab/league-async-cost-profile-20261002-a/profile.mts
  - .strategy-lab/league-async-cost-profile-20261002-a/entry.mts
  - .strategy-lab/league-async-cost-profile-20261002-a/watchdog.mjs
  - .strategy-lab/phase265-async-source-gate-v1.ts
source_commit: 634b0e84896132a1a9ac5d855763b0793abfe1bc
checkout_head: 634b0e84896132a1a9ac5d855763b0793abfe1bc
implementation_root: sha256:f942c33fc577b1cca8b1742b73f2e31637f431abecf6b69b70001cc03b6a0744
source_root: sha256:ae9b47ba2c607fd54baee4fee8ac24291524877d5f60b954192f6aaa0ff69a06
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
execution_performed: false
source_modified_by_reviewer: false
---

# Plan 265-07: new asynchronous cost-profile and source-gate helper review

## Narrative Findings (AI reviewer)

No actionable BLOCKER or WARNING found in the four explicitly scoped private helpers. All four complete files were read, with the new profile/old closed profile and new gate/old closed gate diffs, current STATE and prior cost-profile reviews. The production six-file review-v4 and unchanged transitive inert-import analysis are carried forward after raw source pin checks. The Git-ignored helpers are inspected only because this exact private scope was explicitly requested. This is source suitability, not execution completion or new authority.

## Profile, async observation and bounds

- The new profile is callable-only at module scope. Its three-line entry deliberately calls only `profileCurrentAsync`. Current implementation/source identities are checked separately from the historical v6 allocation's immutable identities. The old allocation is admitted as data for arithmetic/publication budgets, not passed to run/preflight/capacity/prepare or reopened as dispatch authority. The five fixed historical descriptor/payload identities, exact lengths, canonical schemas and head → failure → group → selected-row membership checks are unchanged. No filename discovery or ordinary retained-verifier call is introduced.
- The changed writer path awaits actual `graph.appendInvocation` before timing, roots/accounting assertions, readback and cleanup. Its production dependency publisher waits for all launched fsyncs before error handoff; there is no detached callback or cleanup racing a pending descriptor. The new fsync observer invokes `original.fsync(fd, callback)` exactly once and forwards the actual error to the callback. It counts callback completions and sums elapsed waits without replacing durability. Named builtin exports are synchronized before the dynamic production imports and again after restoring every wrapped filesystem method, including `fsync`.
- Exactly 50 fresh successful writer samples are allowed, with three actual charges/file fsyncs and two directory fsyncs each: 150/100 overall. Byte/record/reserve accounting is delegated to the actual budget, no refunds occur, and payload/chunk/descriptor raw roots are compared to fixed historical bytes. All writer stores are fresh exclusively owned child paths under a private canonical temporary root. Normal cleanup restores exports and deletes only tracked owned paths; uncertain cleanup marks the result incomplete. Deadline/SIGKILL termination can leave only this attempt's residue and cannot claim successful cleanup or authorize a retry.
- The report explicitly sets `dependencyFileSyncsOverlap`, `fileSyncMsIsSumOfOverlappingWaits` and `historicalAllocationIsDataOnly`. Summed concurrent fsync waits are not exclusive CPU cost or an additive percentage of total wall time. Actual pressure/capacity/provider/kernel construction remains unmeasured. This fixed slice does not establish whole-Match timing or empirical representativeness.
- The compact report still fits 64 KiB. Independent reviewer-created literal serialization, without importing submitted code, bounds all 350 timing rows at **49,351 bytes** even using the longest new literal section (`durable_append_async_pair_real_fs`), longest admitted method and `119999.999` for every row. The prior conservative 8,192-byte metadata allowance remains ample for fixed roots, counts, two short snapshots and the three new flags: **57,543 < 65,536**. The final cap remains enforced. No payload, source, memory, objective, arbitrary identity, host inventory or free-form error spread reaches the report/watchdog projection.

## Static loader and import resolution

Installed `tsx` is 4.22.0. Reading its package exports and pnpm symlink establishes `tsx/esm` → project-local `node_modules/.pnpm/tsx@4.22.0/node_modules/tsx/dist/esm/index.mjs`; that entry's source registers the ESM hooks for `--import` and its raw hash is unchanged from the prior reviewed loader. Root/spec/strategy-lab remain ESM, and `@cowards/spec` exports current `src/index.ts`, not dist. No resolver or submitted module was executed to establish these facts.

The watchdog uses a distinct absolute entry path, so the serious-league CLI argv guard stays false. The profile checks this explicitly before import. The changed production modules have clean exact-source review-v4; their guest/provider/capacity/authoring/Match methods remain uncalled by the helper. The relevant unchanged assessment/ingestion/calibration/boundary inventory CLI guards and pure schema initialization analysis from the closed profile review remain applicable. The inventory callable reads only source when explicitly requested; importing its module does not invoke its CLI. This is not third-party loader certification or an executed loader claim.

## Watchdog and unchanged gate

The new watchdog's literal profile SHA matches actual reviewed bytes. It resolves only the project-local loader, creates a fresh exclusive/no-follow start marker, launches its own child with fixed cwd/sanitized environment, drains rather than forwards child output and targets that exact child with 120-second/65,536-byte stops. It records entry/loader hashes and only literal process-status metadata. Old closed probe paths are never launched.

The new source gate differs from its closed predecessor only in current source identities, six source/test pins, diagnostic names and fresh marker paths. Its pinned CI hash matches the actual file. Static extraction selects exactly the same eight source-only CI commands; tokenized `spawnSync` does not use a shell. Raw pins, production manifest expectations and reviewed-commit ancestry are checked before and after every command; nonzero/spawn failure prevents completion. Start/completion markers are create-only under fresh paths. The gate is intentionally executable, not a callable-only profile module: root must invoke it once separately, not import it as a diagnostic. No allocation, preparation, capacity or empirical command is added.

## Independently measured raw identities

| Scoped file | SHA-256 |
| --- | --- |
| `profile.mts` | `84976030e5c0801b20a93ca68d9d05eaa13be5cc94fd4e0173c1cff157f746c0` |
| `entry.mts` | `68ac6a588147e0c93a3ce92e958a890d5a14f75bb239d205ada6187a77dca45e` |
| `watchdog.mjs` | `fa8b73c14afe2ac2217bd049c3057c7a70e042a3c180a77e44b8d5366b47740e` |
| `.strategy-lab/phase265-async-source-gate-v1.ts` | `c3017bf2f341e60aecb7b3a62c44680a403f63a0b735851b2af6376a3fe16b55` |

Supporting read-only checks: installed loader entry `c00532b8bf5bfe758db5370ed3328d120787ef301b28bb70bc85bc06c82be7df`; CI file `b02c04cbd7f4b6808153c3a6657df965b78712752bd801118be31b49cf9e186a`. All ten profile CORE hashes match the current checkout. The runner/repository/response raw sizes are exactly 161025/17009/50058 bytes; all six gate source/test pins match review-v4. Production implementation/source roots are supplied fixed identities and runtime guard expectations, not rederived by executing a callable here.

Old profile/entry/watchdog raw hashes independently remain `6dc3ee8096e6e5f89662ddefb155fbd3c470cc58014771d4f3db6c038a2c9fb1`, `2a7f10cb6ec28c59b8916fb4995e150e526df6e7f52bfff7ce99f175d528c9a6`, `0c9d7f67bac33c75d6ac707b16cf97faac8928de7947971e3158286a0ffd678e`, exactly matching their preserved clean review. No old probe or gate was rerun or modified. Root's in-progress STATE edit was preserved.

## Handoff and limits

Root owns the unique new helper invocations and interpretation. Child exit zero alone is not profile success: root must inspect the new result's `complete`, `cleanupComplete`, source snapshots and expected sample/sync counts, together with watchdog status. The source gate's create-only successful completion remains separate evidence. A failed/consumed attempt does not authorize repetition.

No submitted helper/module was imported or executed. No test, typecheck, build, profile, provider/Strategy/Match/model/Docker call, capacity observation/admission, retained verifier, gate execution, source edit, commit or push occurred. Only this new review was written. No speedup, full source-gate pass, LEAG completion, freeze/formation/holdout eligibility, production certificate or new human approval literal is claimed. All closed routes/profilers/gates remain immutable.

_Reviewer: gsd-code-reviewer; standard bounded source-only review; reviewed 2026-10-02T07:53:00Z._
