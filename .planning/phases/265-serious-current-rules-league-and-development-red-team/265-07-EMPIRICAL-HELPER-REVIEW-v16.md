---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 07
reviewed: 2026-10-02T12:15:18Z
depth: standard
reviewer: gsd-code-reviewer
review_mode: bounded_static_fresh_v9_helper_review
files_reviewed: 2
files_reviewed_list:
  - .strategy-lab/league-265-prospective-v9-20261002-a/prepare-data.ts
  - .strategy-lab/league-265-prospective-v9-20261002-a/run-entry.ts
source_commit: a98b5c2be9410b63e944143e1b0b693fc5c303bf
observed_checkout_head: d0c141050e27c26c9482e310f99390aab165b0a8
implementation_root: sha256:ea34d793c2dd52015c7b12a66ae1ca7092793dafc08bb885392c116d333c4f4c
source_root: sha256:2bf949994153e6d28c69916c3e2c3b4a29b0b5c8ff7595032e27054ba21c632f
helper_raw_sha256:
  prepare-data.ts: e7bc98d21569b709f77dbc3361a4f4ba8c8db88a0283ce6b90de948644360ad0
  run-entry.ts: 08cfa38aeb80d12e16c355df20deea10794cef8155a34d1c1169377d7bc4fc4c
v8_to_v9_diff_raw_sha256:
  prepare-data.ts: bebec0a08ebbef7239bb0ae401d8867ba555c54deef99a96ad5b1fdb65b6b074
  run-entry.ts: 7092db9409d333d6749f10da53976111376fa14fa6a737e0baa38378de6a5f23
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
execution_performed: false
empirical_authority: none
---

# Fresh v9 functional helpers — source review v16

## Narrative Findings (AI reviewer)

No actionable BLOCKER or WARNING found in the submitted two-helper scope.
Both complete current files (265/79 lines), the v8-to-v9 diffs, preparation-v13
and the read-only repository guard call chain were inspected. Unchanged
functional preparation/compile/replay/entry boundary analysis from v14/v15 is
carried forward; those reports and all consumed routes remain untouched.

## New guard and ordering

`assertPreparedLeagueDirectory()` at prepare-data34–37 calls only
`createLeagueRepository(resolve(directory, "league-evidence"))`. Current
repository95–96 constructs a frozen descriptor; `safeDirectory`15–19 uses
resolve/realpath/lstat to require the existing exact nonsymlink directory.
It creates no directory, artifact, journal, randomness or runtime capability.
The default temporary-name callback is merely assigned, not called.

Entry41 calls this guard after mode validation and before allocation reading,
canonical allocation publication, result descriptor reservation, entry marker
or runner import. Both `publish-allocation` and `run` therefore refuse a missing
or invalid exact v9 directory before any of those writes. The draft absence
check still includes `league-evidence`: root must initialize only the new
directory **after draft plus preparation, before publication/entry**, as the
new handoff says. Preparation remains data-only and does not invoke this guard
prematurely or implicitly create the directory. The guard is not called on
import; exact module-URL CLI guards remain intact.

This addresses the supplied v8 missing-directory entry failure prospectively.
It does not retry, refund, recredit or reinterpret the closed v8 attempt.

## Functional port and fresh identities

Namespace, contract/draft/completion/reconciliation/entry schemas, eleven
job/context IDs, repositories, error strings and canonical allocation/result
destinations are v9-specific. The new directory contained only these helper
source files; canonical v9 allocation/result destinations were absent.
All create-only/exclusive writes, once-only entry guard, descriptor `finally`,
zero-retry records and static-before-fresh-capacity flow remain unchanged.

Author `/root/265_ipc_route_prepare` is distinct from prospective job reviewer
`/root/265_ipc_route_packet_review` and this source reviewer. Drafts are not
reviewed. Compile still requires new draft/output byte bindings, expected
reviewer, eleven accepted matching jobs and canonical actual post-draft
start/end/duration records before writing reviewed packet artifacts. No old
review or duration is inherited. V9 helper-review metadata points to this new
v16 report as pending at construction, not a reused v8 review.

Only pinned frozen v4 request/config/prompt input, historical unrooted
allocation-input shape and historical static sizing are read as input.
Build/toolchain/dependencies, jobs/participants/reviewers/channels, model
contexts, source/amendment, operator decision and output bindings are replaced.
No v8 packet/allocation/capacity receipt/provider/model/Match result/charge is
loaded or transferred. Earlier v7 and failed retained66301 likewise remain
closed and consumed.

Bounds remain 96 hours, 11328 Matches, five 48000-token `gpt-5.6-sol` attempts,
150GiB, 120000ms per Match, 2CPU/256MB, cache disabled, no retries, 1GiB ordinary
headroom, 20GiB terminal reserve and 20GiB free-filesystem margin. No rule or
resource relaxation is introduced. Entry still passes only data-only
`--capacity-input` to the guarded runner for fresh same-process host
measurement/admission; no prior live receipt is accepted by this helper flow.

## Source, format and closed-gate evidence

The four current planner/runner source/test pins were independently measured
and match the contract and clean IPC review. Current repository raw remains
`4ee61ed57a07d2d42e58a0e080c731deb8aae3ccdc8f72dcde1d53a54ea44599`.
No scripts/packages/CI source differs from fixed `a98b5c2b` at observed HEAD.
Implementation/source root literals are unchanged; no manifest was evaluated.

IPC review `a5b7a3f4…` and unchanged async physical-format proof `593c9a58…`
remain separate and their exact raw hashes were rechecked. Capacity reconciliation
still checks the current repository/proof bytes and requires all other listed
format sources unchanged against the historical disclosure. Numeric samples
are labeled inherited static sizing, not current observation or whole-Match
gain; no receipt or host timestamps are synthesized.

New CLOSED-PASS gate metadata was checked against the retained root-owned
start/completion JSON bytes, not by executing the gate. Helper raw is
`d221416d49b5bd075764507ad829ba8680ac800d31490d478fff643b3dfebe74`;
start raw is `9419a6c4c5a998598de7a397b9eb44ecaee98ae6099db6fa53bd2ef2c61bb065`;
completion raw is `de6bda15cb15e661a96249dc0a4cff476698365f8d4841adbd2e558ed40ae5d6`.
The records agree on fixed source/root identities and eight commands, with
completion `source_gate_passed` at `2026-10-02T11:26:04.572Z`. This is retained
root proof, not a reviewer rerun or validation of new private helpers.

## Integrity and handoff

Both helper pins matched before and after inspection. Diff hashes above are
SHA-256 of each actual `diff -u v8-file v9-file` stream including headers.
Predecessor v8 bytes remain at v15's `531d4dae…` and `fa54f60b…` hashes.
Preparation-v13 raw matches
`a840edd9071276305876a93ca8458f75eb28d61d769cc8a7d2175ab72ebdb121`.

No helper/import/manifest/test/build/typecheck/provider/model/Strategy/Docker/
Match/capacity/producer/verifier execution or gate duplication was performed.
Only this new report was created; no source/helper/frontdoc edit, directory
creation, output publication, commit or push. Root owns types, explicit fresh
directory initialization, preparation/job review and subsequent dispatch.
Clean is bounded source-review acceptance, not route execution authorization
or empirical/LEAG/freeze/formation/holdout/public/counting/production credit.
