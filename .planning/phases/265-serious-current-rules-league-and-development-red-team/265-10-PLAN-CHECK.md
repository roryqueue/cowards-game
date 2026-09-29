# Phase 265 Plan 10 — source-only repair plan check

**Verdict: BLOCK.** Checked the uncommitted `265-10-PLAN.md` against the diagnosed pilot failure, completed Plans 08/09, signed Plan 08 gate, current source, Phase 265 context/requirements, and GSD plan structure. This was static inspection only: no pilot command, Match, provider, Strategy, model, allocation, result, or historical evidence was run or written.

Plan 10 correctly treats Plan 09's allocation/result as consumed and `process_invalid`, does not credit LEAG-01–09, retains the 240,000-ms cell / 1,800,000-ms overall / 30,000-ms reserve and ordinary 120,000-ms / 1,000-ms limits, and keeps the proposed repair gate non-authorizing. Its three tasks have Files, Action, Verify, Done; `verify.plan-structure` reports valid. The pinned commit exists. These points do not close the executable gaps below.

## Blockers

1. **BLOCKER — catch-to-parent completion has no already-published-terminal branch.** In `scripts/run-v1-38-diagnostic-pilot.ts`, the normal path writes the terminal at line 621, then can still throw during reopen/evidence checking or IPC at lines 622–625. That enters the catch at lines 629–634 with a terminal already durable. Plan 10 Task 2 says the catch should publish a new versioned terminal and, if publication/reopen fails, omit `cell-complete`. In this reachable branch, the second exclusive terminal fails and `done` still reaches an active parent, reproducing `publication_uncertain` reconciliation against an already-terminal start. “Leave start-only” is also inaccurate if write succeeded but reopen failed. The catch currently calls `closeDiagnosticPilotIssuedProvider` without isolating a possible close exception, which can skip exact-owner cleanup and all publication. **Fix:** specify a per-cell idempotent publication/IPC state machine: inspect the exact start's pre-existing terminal first; never write another terminal over it; validate its root and actual disposition without relabeling a previously durable success; perform bounded exact-owner cleanup even if either handle close throws; emit one `cell-complete` then `done(process_invalid)` only after a terminal is durably reopened and validated; otherwise retain an explicit uncertain/process-invalid state, with no false start-only claim. Inject faults immediately after terminal write, during reopen, during each handle close, and at IPC send, then prove one charge, no second terminal, no false completion, and no parent timeout publication for a verified terminal.

2. **BLOCKER — the new signed gate lacks an executable trust/verification contract.** Task 3 requests an independently signed `diagnostic-pilot-repair-source-gate` and Task 2 adds `check-repair-gate`, but neither specifies the signing payload/domain, a verifier-pinned reviewer public key or equivalent independent trust anchor, nor the exact fields that the checker must recompute and reject. The existing `checkDiagnosticPilotGate` is intentionally hard-coded to the Plan 08 schema, review path, public key, command list and source closure; `parsePilotPaths` likewise pins the old gate path. Merely copying a signature or accepting a public key supplied by the new receipt would make the new gate self-attested rather than independently verified. **Fix:** define the distinct exact-key receipt schema and canonical signing/root domains; pin the independent reviewer's verification key outside the receipt; bind and re-read the reviewed ordered source hashes, review digest and zero-actionable text, named author/reviewer separation, exact required command list/exits, old baselines, and every false authority flag; add forged-key/signature, stale-source/review, omitted-command, and authority-flag mutation tests. Keep this checker read-only and disconnected from all `prepare`/`preflight`/`run` paths.

3. **BLOCKER — the gate can pass without proving historical v1 reopening.** Task 3's only automated verify is `check-repair-gate`, while its required source-gate command list does not include `verify-retained-v1`. A textual instruction to run the historical verifier after signing does not bind the promised old-gate/source/result compatibility to the new exact-source gate. Worse, exit 1 alone cannot distinguish the expected `process_invalid` verdict from a source-drift, signature, ledger or schema failure. **Fix:** add a read-only historical compatibility check to the required signed command/evidence set (or make `check-repair-gate` run it). It must authenticate the pinned ten Git blobs, old review/signature/gate root, Plan 09 allocation/result roots and five old baselines; parse the exact one-charge/three-unused process-invalid classification; accept the verifier's exit 1 only with that typed output and no other error. Test old-source tampering, wrong commit/blob, altered old artifact and malformed result; do not mutate or backfill any v1 byte.

## Warnings

1. **WARNING — wave metadata is not derivable from dependencies.** Plan 10 is Wave 7 with only `depends_on: [265-08]` (Wave 5), so the declared dependency minimum is Wave 6. Plan 09 is a historical consumed input, not a successful execution prerequisite; making the incomplete Plan 09 a formal dependency would block this source-only repair. **Fix:** use Wave 6 with the Plan 09 artifact/root checks as read-only preconditions, or document an explicit scheduler-supported reason for Wave 7 without implying Plan 09 completed.

2. **WARNING — checkpoint physical accounting needs an explicit boundary test.** The existing ledger inventory admits only started/terminal/evidence filenames and `writeEvidence` preserves a terminal reserve. Task 1 correctly calls for versioned inventory and byte/record/inode checks, but does not name near-cap tests covering all six checkpoint files, atomic temporary/link inodes, one emergency terminal and the bounded failed-terminal diagnosis in the same cell. **Fix:** add these cases and require both current/future inventories to reject foreign/orphaned checkpoints without consuming the fixed reserve or raising any approved cap.

## Structured issues

```yaml
issues:
  - plan: "265-10"
    task: 2
    dimension: key_links_planned
    severity: BLOCKER
    description: "Catch path can encounter an already durable terminal after normal-path write; plan lacks idempotent reopen/IPC handling and isolated cleanup failures."
    fix_hint: "Plan and fault-test the exact per-cell publication/IPC state machine, including post-write/reopen and handle-close failures."
  - plan: "265-10"
    task: 3
    dimension: verification_derivation
    severity: BLOCKER
    description: "Independent repair-gate signature and read-only checker have no pinned trust anchor or complete exact-field validation contract."
    fix_hint: "Specify distinct canonical receipt/signing domains, verifier-pinned key, recomputation and mutation tests; no run-path consumer."
  - plan: "265-10"
    task: 3
    dimension: verification_derivation
    severity: BLOCKER
    description: "Historical v1 compatibility is not bound to required gate evidence, and expected exit 1 is indistinguishable from verifier failure."
    fix_hint: "Require a typed read-only historical check in the signed gate, accepting exit 1 only with exact authenticated process-invalid output."
  - plan: "265-10"
    dimension: dependency_correctness
    severity: WARNING
    description: "Wave 7 does not follow from sole Wave-5 dependency on Plan 08."
    fix_hint: "Use Wave 6 or document a supported scheduling constraint; keep consumed Plan 09 historical, not a success dependency."
  - plan: "265-10"
    task: 1
    dimension: scope_sanity
    severity: WARNING
    description: "Checkpoint emergency physical reserve behavior is asserted but near-cap temporary-inode tests are not explicit."
    fix_hint: "Add near-cap checkpoint/temporary/terminal/diagnosis accounting tests without increasing caps."
```

**Disposition:** Revise Plan 10 before execution; rerun this revision gate. The source-only repair must not create any empirical authority, alter Plan 07/09 evidence, reopen the consumed allocation, or advance the Phase 265/266 gates.
