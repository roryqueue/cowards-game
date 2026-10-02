# Plan 265-07 v10 helper draft

## Root completion pins — 2026-10-02

Root observed gate43923 exit0 and all scoped checks closed. The actual
completion raw is a03bb26f0dce863bb3aad30a4d5187c1ce2112c44e01ea3ed4a0c659e437460d;
final source-gate report raw is
120b171f2fb58722a878e27f37942cf6063c57dffa256b36f71acbc499b96c63.
The two helpers now pin those observed bytes, not pending placeholders.
CR-01/02 helper guard fixes are implemented. Final private helper hashes:

- prepare-data.ts:13efbe18a4322746b055af69f60b385149bc1c7146e7e0ed648619bac9c91171
- run-entry.ts:7055258577bd2b0848d0d3027f71ad9f39455733ec5a61a7d3ae106d141ddbaf

Independent helper re-review and source-supplement goal-backward verification
remain pending. No helper mode, allocation, capacity, provider or Match ran.
The draft/pending-pin snapshots below are historical.

Status: source-only helper draft with two scoped review fixes applied; not
re-reviewed or type-checked.

Created inert private helpers in the new ignored namespace
`.strategy-lab/league-265-prospective-v10-20261002-a/`:

- `prepare-data.ts` defines the fresh v10 request/review/compile/allocation-input,
  data-only prepare, and historical-static-sizing capacity-input modes. It uses
  the explicit prospective-v2 allocation creator/admitter and exact 600000 ms
  policy, a new author identity (`/root/265_lifetime_v10_helper_prepare`), and a
  distinct planned reviewer identity (`/root/265_lifetime_v10_packet_review`).
- `run-entry.ts` is import-inert and requires the real exclusive eight-command
  source-gate completion marker before allocation publication or run entry. It
  retains the read-only guard for the exact pre-created empty league repository
  before allocation publication, result reservation, or entry marking.

The two BLOCKERs from `265-07-V10-HELPER-REVIEW-v1.md` were addressed: the
repository guard now `lstat`s the exact directory, rejects symlinks/non-directory
or unexpected path identity, and requires an empty `readdir` without creating or
cleaning it; the gate guard now pins the fixed helper/CI/start bytes, requires
the exact unique start record and no terminal failure marker, validates the
strict eight-command completion shape/order/timing, and requires final
root-confirmed completion/report SHA pins. Those two final SHA constants remain
explicit `PENDING_ROOT_CONFIRMATION` sentinels and fail closed until root can
replace them after the actual gate closes. The final report must bind the
completion marker root; no independent-custody claim is made.

Unique source-gate local pins required by `run-entry.ts`:

- Gate helper raw SHA-256: `8500db6bbedc65a11d60b2c1f30c98312a8da1ca9d68d9a8b140e3eeaee1506e`
- CI file raw SHA-256: `b02c04cbd7f4b6808153c3a6657df965b78712752bd801118be31b49cf9e186a`
- Exclusive start-marker raw SHA-256: `de4355f52084f806ff4b984d7398de498ab25ee7372ba84120fcf76fbd77162e`
- Start record: PID `7438`, `2026-10-02T16:15:17.377Z`, source commit and
  implementation/source roots above, CI ordinals `[3,4,1,2,5,6,7,8]`.
- Terminal failure marker was absent at the draft check; exclusive completion
  marker was also absent then. Completion-marker and final gate-report raw
  SHA-256 values remain unknown and intentionally unpinned here.

Both helpers bind the fixed source at commit
`bb98878ec996ec63529093a45d9e55ed89e64610` (implementation
`sha256:d6872b1615cf06c1f7c667d5e58d7ddddfb96e1f296a84a52c5cab7df4a1bf33`,
source `sha256:e64686c2c927a5a0f54d786198df2149c215f8e9e7eab71284b36a1cdcece0ed`).
The active source-gate report is recorded as **active, not passed**; no helper
mode was invoked. The gate-completion marker and both v10 canonical allocation
and result destinations were absent at this inspection. No allocation,
capacity receipt, provider, Match, run-entry, result, or retained verification
was created. Capacity preparation is explicitly historical static sizing only;
the actual fresh same-process capacity admission remains part of the later root
entry.

All v9 identities, request review/timing, packet artifacts, allocation,
capacity receipt, provider/model outputs, Match results, and charges are
excluded from transfer. Only frozen unexecuted request/doctrine template
structure is reused. The 96-hour/11,328-Match/240,000-token/150-GiB bounds,
zero retries, 2CPU/256m and remaining v9 vector are retained; only prospective
per-Match lifetime is 600000 ms. No LEAG, freeze, holdout, formation, public,
counted, or production credit follows from this draft.

SHA-256:

- `prepare-data.ts`: `d11634c56739a2fadae7707ba1e77962d9dadc12a0801bdf525bd6c4e72a5d2f`
- `run-entry.ts`: `f3f3a4705cc870a43fdd3c1ff42e8369323fe07c828fe571dab19d73fdbb7646`

Remaining before any route action: re-review of the two fixes, focused helper
type-check, actual unique source-gate completion at the pinned source/CI hashes,
and root replacement of both pending gate completion/report SHA pins. No source
gate, tests, or runtime mode was started by this helper-drafting task.
