---
phase: 266
plan: "06"
date: 2026-10-02
status: source_only_trace_no_execution
empirical_authority: false
---

# History fixture: bounded read-only cost trace

The smaller-model explorer `/root/266_history_cost_trace` inspected the isolated
worktree at `6c70c9811e1234f64fc6f87d2348f88e2c2382ea` without executing imports,
helpers, tests, builds, providers, Matches or diagnostics. No file was changed.
Existing unrelated repository edits and untracked notes were preserved.

The entry emits `history-ready` only after
`createCurrentFreezeFactoryHistoryFixture` returns. Earlier 120-second and
600-second timeouts do not identify a slow substage. Timing attribution remains
unknown. The corrected conditional 1,536 synthetic-Match scenario belongs to
the downstream coordinator (24 matrix + 720 probes + 11 × 72 response Matches),
not the history builder itself; it is not a universal lower bound.

Source-derived work before `history-ready`:

- Donor setup occurs once, then retained non-execution/non-review artifacts are
  read and republished into a fresh repository (history fixture lines183–202).
- Policy/manifest setup and `readFreshFactoryCalibration` occur once. That reopen
  validates 12 ingestions and all48 workload bindings (history225–231;
  fresh-evidence27–63). The manifest is not reopened for every replay workload.
- The replay loop processes48 distinct workloads (history264,344–360,434–435).
  Each receives full binding admission and a canonical Match-kernel pump bounded
  by512steps/24runtime requests (canonical fixture100–146,185–236). These are
  required injected kernel workloads, not repeated complete coordinator runs.
- Per-workload accounting/start/admission/supervision/stream/final-usage/terminal
  records retain serial durable publication. Repository writes use exclusive
  temporary files, file fsync, hardlink/unlink and directory fsync; terminal
  publication rereads its start/ledger. These operations plausibly cost time,
  but source inspection does not prove they dominate.
- After replay,24 groups with exactly2 siblings each undergo fingerprint
  derivation/finalization, followed by a ledger read and production assessment
  (history438–507). No stage is credited complete by this trace.

Fixed-checkout paths for the line locators above:

- entry: `scripts/test-fixtures/v1-38-current-freeze-context.ts`;
- history: `scripts/fixtures/current-freeze-factory-history-fixture.ts`;
- canonical fixture: `scripts/fixtures/current-freeze-canonical-factory-workload-fixture.ts`;
- fresh evidence: `scripts/v1-38-factory-fresh-evidence.ts`;
- repository: `packages/strategy-lab/src/factory/repository.ts`;
- supervision stream: `packages/strategy-lab/src/factory/supervision-artifacts.ts`.

These are source evidence locators, not new execution measurements or changes
to production contracts.

Possible source-only optimization is confined to proven-immutable invariant
setup or canonical representations. It must retain each workload's full schema,
admission/identity joins, accounting, kernel pump, durable evidence, all48
workloads/all24 groups, and unchanged production semantic validators. No memoized
skip, reduced workload, timeout increase or weakened evidence is approved by
this note. Existing stage telemetry is the appropriate next measurement aid
after any independently reviewed new bounded diagnostic is ready; do not rerun
either closed timeout probe or the old full fixture blindly.

This is preparation for future Phase266 validation, not a current-rules freeze,
formation permission, retained-context proof or phase advancement. Main's active
Phase265 source gate remains untouched and no competing heavy test was launched.
