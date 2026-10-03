# Historical disk-accounting choice

Status: approved by the human on 2026-10-03; implementation and independent source checks pending. This is a resource-accounting choice for the existing private lean experiment, not another plan or authorization literal.

The failed launch did not record its temporary cache or possible crash-file high-water usage. Surviving experiment files occupy 12,288 allocated bytes. Today's cache contents, absence of a core file and core limit do not prove what that past process wrote. The approved crash-time amendment requires unknown material disk usage to be bounded or admission to remain closed; therefore it does not resolve this separate question.

## Recommended prospective amendment

Record the failed launch's historical peak disk usage as **unknown**, without claiming the whole experiment's past peak stayed below 15 GB. Count its surviving allocated experiment files toward the same 15,000,000,000-byte budget. Apply that ceiling to retained experiment files and all future experiment writes, including temporary files, buffers and evidence. Recheck surviving predecessor bytes before admission; future launches disable unmanaged TSX caching and core dumps and account for their allowed writable paths.

This changes the disk budget's historical assurance, not its number: future work remains bounded, but the unrecorded past peak is not retrospectively certified. Do not invent a numerical old peak or use a heap limit as an RSS bound. Preserve the failed allocation, open interval, result absence, verification and all historical bytes; retain the 565,459-ms conservative time carry-forward, zero retained historical Match charges, 28,800,000-ms total time and 300-Match maximum.

After explicit approval, make the narrow prospective accounting/schema and regression changes within the checked Plan 265-15 supplement, independently review/test them, then continue the fresh pilot only after source and same-process capacity checks. No approval implies a capacity pass or a Match result. Without approval or a defensible historical numeric bound, preparation stays closed; source-only repair may continue.

All gameplay, runtime, private holdout, freeze-before-formation and no-public/no-counted/no-production restrictions remain unchanged.

## Human approval

The human explicitly approved: “You may record it as unknown, count surviving files, and enforce the same 15 GB limit on retained files and future writes.” This adopts the recommended prospective amendment above. It does not establish a historical peak, capacity pass, pilot result or old-route refund. Record the surviving predecessor files conservatively and remeasure them at admission; preserve all old bytes and the separate 565,459-ms time carry-forward.

Evidence: [read-only failed-prefix inventory](265-15-FAILED-PREFIX-DISK-INVENTORY-v1.md), [approved crash-time amendment](265-15-CRASH-ACCOUNTING-DECISION-v1.md).
