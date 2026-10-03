# Lean pilot crash-accounting decision

Status: awaiting human approval. This note grants no execution authority.

The approved smaller experiment runner is implemented and independently reviewed. Its first pilot failed while importing old evidence, before any retained Match charge. The importer validates the same historical assessment three times and holds large records in memory. The coordinator's 768 MiB heap limit was a main-orchestrator launch choice, not a Strategy rule or evidence that the laptop is full.

The crash left the execution stopwatch open. The current conservative reader therefore consumes the whole shared eight-hour allowance. The independently witnessed start and later process-closed observation bound that failed entry at 565,459 ms—about nine and a half minutes—but do not create a historical close event or establish its exact duration.

## Recommended amendment

Approve prospective crash accounting that carries this independently bounded failed-entry time forward, rather than consuming all eight hours because the stopwatch was not closed. Preserve the original failed route and its v1 accounting exactly; do not convert it to success, reuse its allocation, or reset cumulative work. Carry forward prior disk use and conservatively account for unmeasured peak scratch/resources; where a sound bound cannot be established, fail closed rather than invent one. Retain the same cumulative 15,000,000,000-byte disk ceiling, 28,800,000-ms execution ceiling and 300-Match maximum.

After approval: fix the importer to validate once with bounded memory, add crash-safe parent-observed timing and resource accounting in a new version, independently review/test it, then prepare a distinct fresh pilot under the remaining cumulative caps. Approval is not itself a capacity pass or permission to dispatch before those checks. No further repeat authorization literal is proposed.

All canonical gameplay/runtime/privacy restrictions remain unchanged. No holdout opening, formation execution before current-rules freeze, counted/public/production authority, or milestone completion is granted. Plan265-15 and Phase265 remain incomplete.

Evidence: [independent terminal check](265-15-PILOT-ENTRY-TERMINAL-VERIFICATION-v1.md), [source-only diagnosis](../../debug/lean-pilot-import-memory.md).
