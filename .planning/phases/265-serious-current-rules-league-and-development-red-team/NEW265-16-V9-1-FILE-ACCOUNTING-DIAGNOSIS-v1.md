---
status: diagnosis_only
source_commit: 32d09da9315f1df669a2f814206879f34608c51b
source_root: sha256:452182810a0b1179552a7977243144c71709ec460f73f4d361f6f7aa79b33d0c
mode: v9-1
route: diagnostic
admission_or_allocation: false
---

# V9-1 file-accounting refusal diagnosis

## Result

The `validateLeanRemainingSurvivorsV9` refusal is not explained by a missing pinned old survivor, or by any decrease in measured allocated bytes on old survivor rows. The observed failure is an accounting-basis mismatch: the predecessor constructor computes `allocatedDiskBytes` using the old predecessor's conservative reserve plus the new current inventory, while the validator separately requires the sum of current inventory rows alone to meet `physicalFloorBytes`.

## Read-only reproduction

Reconstructed the exact v9-1 diagnostic identity list used by `inspectLeanRemainingPredecessorV9`: prior v7 predecessor survivors and finite old identities; finite v8-2 refusal custody; v8 bookkeeping predecessor identities; v8-1 and v9-1 route/setup identities; and existing exact review/report identities. Used only `readLeanRetryFailedV7PrefixV8`, `authenticateLeanRemainingPreparationCustodyV9`, `authenticateLeanBookkeepingPredecessorV8`, and the bounded physical inventory helper. No ordinary historical reader, route prepare/admission, allocation, store, entry, provider, Strategy, or Match operation was run; nothing was modified.

| Basis | Rows | Allocated bytes |
|---|---:|---:|
| Pinned old predecessor survivor rows | 287 | 8,605,696 |
| Pinned old predecessor `allocatedDiskBytes` | — | 12,894,208 |
| Carried reserve (`allocatedDiskBytes - old survivor sum`) | — | 4,288,512 |
| Current complete v9-1 inventory | 387 | 10,698,752 |
| Current old/current shared rows | 287 | 8,605,696 unchanged |
| Current additions beyond old rows | 100 | 2,093,056 |

The 287 old rows are all still present, with zero bytes decreased and zero bytes increased. There are zero old-only rows. Thus the 100 new rows account for the entire increase from 8,605,696 to 10,698,752 bytes. Current inventory is short of the 14,864,384-byte physical floor by **4,165,632 bytes**.

However, the constructor's conservative debit arithmetic is:

`max(14,864,384, 4,288,512 + 10,698,752) = 14,987,264 bytes`

That is 122,880 bytes above the floor. `validateLeanRemainingSurvivorsV9` then rejects because it checks `sum(row.allocatedBytes) < physicalFloorBytes` (as well as `p.allocatedDiskBytes < physicalFloorBytes`), so the carried reserve cannot satisfy the row-sum condition. This localizes the exact refusal to the second, stricter condition; it does not establish that the carried reserve represents currently allocated filesystem blocks.

## Boundary / correction guidance

This result does not show that the 14,864,384-byte floor is physically met by present files. The 4,288,512-byte amount is inherited conservative headroom, not a current inventory row, and directory/block allocation cannot be inferred from it. Conversely, the observed shortfall is not evidence of omitted current identities: the exact old rows are intact and the reconstructed list adds 100 identities.

Do not lower the floor or mutate the old pin. A source-only repair/review must resolve the model explicitly: either validate an evidence-backed total that includes the carried conservative reserve (with clear semantics distinguishing budget from extant blocks), or preserve the requirement that extant survivor rows meet the floor and obtain additional admissible retained evidence before proceeding. This diagnosis does not authorize either change and does not claim a successful admission.

---

_Source: 32d09da9315f1df669a2f814206879f34608c51b_  
_Method: bounded finite custody reads and exact current identity inventory only_  
_No preparation/allocation/store/entry/Match performed_
