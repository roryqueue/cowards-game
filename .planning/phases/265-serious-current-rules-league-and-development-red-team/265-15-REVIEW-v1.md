---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-03
depth: standard
source_commit: 3a58afd9
diff_base: c22a69a6
files_reviewed: 8
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - packages/strategy-lab/src/league/lean-experiment.test.ts
  - scripts/run-v1-38-lean-experiment.ts
  - scripts/run-v1-38-lean-experiment.test.ts
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/lib/v1-38-factory-supervised-runtime.ts
  - scripts/lib/v1-38-planner-supervised-runtime.ts
  - scripts/lib/v1-38-lean-container-match-session.ts
findings:
  critical: 5
  warning: 1
  info: 0
  total: 6
status: issues_found
---

# Plan 265-15 scoped source review

## Narrative Findings (AI reviewer)

Reviewed the prospective compact pilot, its tests and additive factory → planner → container claims, with focused inspection of canonical scenario, runtime bridge and source-manifest dependencies. No provider, container, Match, capacity mode or empirical reader was invoked. No source or historical artifact was changed. The future baseline/training implementation is correctly outside this pilot's scope; these findings concern the implemented pilot itself, not deferred full-league certification.

### CR-01 — BLOCKER: Failed entry and retained-verifier time disappears from the shared budget

**File:** `scripts/run-v1-38-lean-experiment.ts:88,102,122,127–138,147–155`; `packages/strategy-lab/src/league/lean-experiment.ts:107–109`.

**Issue:** The only retained time is the most recent resource checkpoint, measured from a process-local `began`. Work after the last checkpoint (including producer verification, source rescan and publication) is omitted. An exception after charge/dispatch writes an entry failure without its elapsed time, leaving only the earlier checkpoint. `verify-retained` performs decompression/source/candidate work without any time accounting. The ledger has no persisted active-entry timing anchor or closed interval from which a later stage can recover the missing duration. Thus an expensive failed cell or verification consumes real time but not the approved shared eight-hour allowance. This is observable without restarting a route: throw after a charge and compare the retained elapsed checkpoint with the actual entry duration.

**Fix:** Persist a trusted interval start before empirical work and close it in terminal/failure paths, including elapsed time through publication/cleanup. Give the unique retained verifier its own durable interval charged to the same cumulative budget (keep outcome evidence immutable; a separate append-only accounting leaf is sufficient). Reject ambiguous interrupted intervals or reserve their bounded duration conservatively. Future stages must add to this same total, not initialize another process-local budget. Test failure after charge and verifier-duration accounting.

### CR-02 — BLOCKER: Replay/transient resource limits are checked after the oversized allocation or write

**File:** `packages/strategy-lab/src/league/lean-experiment.ts:47–53,127–138`; `scripts/run-v1-38-lean-experiment.ts:95–96,119–122`.

**Issue:** `encodeLeanReplay` canonicalizes every frame into an array of buffers before checking the 256 MB replay limit, then holds that array plus concatenated plaintext plus gzip output. The caller additionally constructs all redacted transition frames before calling it. The RSS/high-water check runs only after retention has finished, and retained-byte limits are checked after the gzip file is written. A large legal execution can allocate beyond the approved 2 GB transient envelope or cross the retained cap before refusal. A failed allocation/serialization also bypasses the resource checkpoint. This is a cap-enforcement correctness bug, not a speed optimization.

**Fix:** Bound accumulated encoded lengths while producing frames, reserve conservative simultaneous plaintext/compressed/transient headroom before allocation and publication, and measure/check high-water at those seams. Do not construct the full redacted replay for unsampled successful cells. Enforce remaining durable bytes before each write and account any trusted temporary/runtime scratch outside the evidence directory, or explicitly bound it conservatively. Add oversized multi-frame and near-retained-limit tests proving refusal precedes publication/over-allocation.

### CR-03 — BLOCKER: A durable charge can issue authority for a different candidate source

**File:** `scripts/lib/v1-38-lean-experiment-authority.ts:11–17`; `scripts/run-v1-38-lean-experiment.test.ts:25–35`.

**Issue:** Issuance checks only that `candidateRoot` occurs in the allocation; it never resolves that candidate's source/packet/validation closure or compares it with `binding.runtime`. The runtime source root, executable root, revision and factory authorization roots are caller-supplied. The existing test demonstrates successful issuance with arbitrary synthetic source/revision fields. Factory/planner reconstruction proves that a source matches the supplied runtime binding, not that it is the allocated candidate. Therefore calling the exported issuer with allocated candidate A and a valid different candidate B's runtime binding can mint a native capability for B under A's charge. WeakMap claim ordering does not repair that source substitution.

**Fix:** Issue only from a revalidated retained candidate closure and derived runtime identity, compare every candidate/source/packet/proposal/validation/revision/executable field to that closure, and bind the scheduled seat to the allocated candidate. Alternatively make the issuer inaccessible except through a closure-validating host constructor. Test allocated-A/different-valid-B substitution, not only forged capability objects.

### CR-04 — BLOCKER: Arbitrary review digests satisfy the entry's independent-review prerequisite

**File:** `scripts/run-v1-38-lean-experiment.ts:39–46,54–58,88–93`.

**Issue:** `reviewRoot` is checked only for a sha256-shaped string. Preparation commits it into an allocation, and entry compares the same unverified string; neither reads an actual review artifact nor checks its source commit/scope/disposition. A request containing an invented review digest passes this prerequisite and can enter once the allocation is committed. This defeats the explicitly required independently reviewed fixed source; it does not require hostile filesystem mutation or a retry.

**Fix:** Resolve one actual retained source-review artifact (or a small fixed-source admission record bound to that artifact), authenticate its bytes/root, checked source identity and clean/fixed disposition before entry. Keep this local and proportional; no external custody or new operator literal is needed. Test missing/fake review and review of another source.

### CR-05 — BLOCKER: Retained result verification accepts changed HEAD, success count and extra fields

**File:** `scripts/run-v1-38-lean-experiment.ts:147–155`.

**Issue:** The result reader parses unrestricted JSON and validates only selected fields. It does not compare `head` to the retained entry/committed allocation/source hold, recompute `successful`, check exact keys, or use safe bounded no-symlink file admission. Change a genuine result's `head` and `successful`, or append arbitrary fields, while leaving the checked fields unchanged: the reader still returns a passing pilot disposition. Consequently it cannot support the advertised exact allocation/HEAD/result join or closed safe projection.

**Fix:** Use a closed, bounded canonical result schema and safe file reader; reopen the retained entry and committed allocation join; compare every result field, including HEAD and success count, against authenticated observations. Strictly validate compact classification/code/outcome consistency. Add mutation tests for head, success count, extra fields and symlinked/oversized result files.

### WR-01 — WARNING: Exclusive ledger/replay writes do not handle partial writes

**File:** `packages/strategy-lab/src/league/lean-experiment.ts:71,75–76`.

**Issue:** `writeExclusive` and ledger append each call `writeSync` once and ignore its returned byte count. Node's API permits a short write. A short replay write or truncated newline event can leave immutable published evidence incomplete and permanently invalidate the one-shot pilot. The CLI's separate `exclusive` helper already loops correctly, so these two paths are inconsistent.

**Fix:** Share the write-all loop used by the CLI and fsync only after all bytes have been written. Treat a zero-byte write as a publication failure. Add a source-only injected short-write test; do not reuse a failed empirical route.

## Scope boundary

No claim of exhaustive historical-stream reconstruction is required for the compact pilot. Eight pilot slots are sufficient here; checked extension of the same cumulative ledger belongs to Plan 265-16. The historical full-league gates/readers, failed allocations and zero-byte reservations must remain unchanged. Fix the scoped admission/accounting defects before the first prospective pilot; findings do not authorize a larger experiment or another approval ceremony.
