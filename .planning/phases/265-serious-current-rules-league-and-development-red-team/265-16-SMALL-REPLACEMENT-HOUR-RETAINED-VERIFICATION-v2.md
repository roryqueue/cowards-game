---
phase: 265
plan: 16-small-replacement-hour-v2
verified: 2026-10-10T21:47:54Z
source_head: 827b43419fe4c56290efa3af092a856d81be859b
allocation_commit: c98a6d3f0e78201ad57324ad4d4814710429b452
checkout_head: c98a6d3f0e78201ad57324ad4d4814710429b452
allocation_root: sha256:a3e6546bfd01ecfd141100644ac2fd51cef26ca6827a17060f11493c761cf548
result_root: sha256:d6cdd08823e7c8ad384a4486466a757a5637ac35a8cd1078991e17fd2b58ae02
status: retained_verification_passed_single_case
phase_status: gaps_found
runtime_admitted: true
empirical_feasibility: one_case_only
---

# Phase 265 Plan 16 Fresh Hour — Actual Retained Verification v2

## Outcome

The one authorized current v2 retained-store verification command completed once, closed with exit code **0**, and returned:

```json
{"verified":true,"resultRoot":"sha256:d6cdd08823e7c8ad384a4486466a757a5637ac35a8cd1078991e17fd2b58ae02"}
```

The result is valid for this one approved non-Match case only. It does not complete Phase 265, establish league/baseline/freeze readiness, or establish general runtime feasibility. The old v1 failure remains immutable and its cause is not determined by this v2 success.

## Authorized command

Invoked exactly once from the repository root; no retry or v1 reader was used:

```sh
node node_modules/tsx/dist/cli.mjs scripts/run-v1-38-lean-private-probe.ts verify --source-root sha256:1ac048cc2f2cbd9c8df497fc56af18be2861adf24a8f33450744f603ba9d62ed --store /Users/roryquinlan/runtime/cowards-game/.strategy-lab/lean-private-probe-v1/a3e6546bfd01ecfd141100644ac2fd51cef26ca6827a17060f11493c761cf548 --allocation-commit c98a6d3f0e78201ad57324ad4d4814710429b452 --allocation-path .planning/artifacts/v1.38-phase-265-private-probe-allocation-v2.json
```

## Fixed identity and safe retained-store metadata

- Allocation `sourceHead`: `827b43419fe4c56290efa3af092a856d81be859b`. Allocation commit and checkout HEAD before/after the reader: `c98a6d3f0e78201ad57324ad4d4814710429b452`, a direct child of that source HEAD. Entry and reader both bind that commit; the reader returned verified and did not change checkout HEAD.
- Canonical allocation path: `.planning/artifacts/v1.38-phase-265-private-probe-allocation-v2.json`; raw SHA-256 `00761b8fe8aca82879b6f66849d2075fb850c71337920d7232ef4adada50e38c`. The store `allocation.json` has the same size (2744 bytes) and digest.
- Allocation root: `sha256:a3e6546bfd01ecfd141100644ac2fd51cef26ca6827a17060f11493c761cf548`; schema v2; `windowRoot: sha256:98ef7a8553bd4c83861d02c48036460e933fca695af18ba9e705dab9c129393b`; `matchCount: 0`; exactly one case, ordinal 0, `selectActivations`.
- Exact private store: `/Users/roryquinlan/runtime/cowards-game/.strategy-lab/lean-private-probe-v1/a3e6546bfd01ecfd141100644ac2fd51cef26ca6827a17060f11493c761cf548`, mode `0700`, canonical real path. Inventory exactly matches the seven expected files: `allocation.json`, `entry.json`, `ledger.ndjson`, `probe-00.json`, `request.json`, `result.json`, and `terminal.json`; each file mode is `0600`.

| Store file | Size | Allocated bytes | SHA-256 |
|---|---:|---:|---|
| `allocation.json` | 2744 | 4096 | `00761b8fe8aca82879b6f66849d2075fb850c71337920d7232ef4adada50e38c` |
| `entry.json` | 447 | 4096 | `64999f8f35d758a1c91d4f782c7bd9464fcdd1f9aa320142f563ffab908e7b4b` |
| `ledger.ndjson` | 436 | 4096 | `270ad0f2787bd62fe67094069608cea5b71e3af70d28c30b6a4dabb8d3460b99` |
| `probe-00.json` | 770 | 4096 | `877e31761644d7013f777be527fe5f5b42da8acb7d8b05b8a47cb534164906e8` |
| `request.json` | 719 | 4096 | `6c98fe1b0c2fa8aa3d27bd9de4c3f75de76698ada6b5fe15ce9456ba5dbb80bb` |
| `result.json` | 558 | 4096 | `5dc7aff7336fdeab0be4af2b80a074b419f6b3e070836c38e2b47aba528a4e82` |
| `terminal.json` | 1028 | 4096 | `378240a541ca2500ead78552622b55df5c7abecdb15febcc080087fcc854162d` |

## Verified single-case result and terminal

- Result root `sha256:d6cdd08823e7c8ad384a4486466a757a5637ac35a8cd1078991e17fd2b58ae02` joins the allocation root, source HEAD, `matchCount: 0`, attempted ordinals `[0]`, and exactly one outcome: `success`, `cleanupComplete: true`.
- Case record root: `sha256:315791b2d08deb1ac74d96a997c763fc9d0aa0f56b6021f6a0b85020b615cb8b`; ordinal 0; `status: success`; `evidenceVerified: true`; `cleanupComplete: true`; elapsed `3072 ms`; factory construction `1260 ms`; output `719 bytes`; `guestStartup: "unknown"` (remains unknown, not inferred from constructor time).
- Exactly one attempt is paired with the one debited ledger row. The CLI's successful retained verification checked the v2 allocation/request/result/debit join, terminal root, current resource receipt, store inventory, and actual retained-block count.
- Terminal root: `sha256:0ac5193cfc9f739da9500d46812fd28dd3fd61da46575d5674b8996d993722a4`; `attemptedCount: 1`; `matchCount: 0`; elapsed `3820 ms`; `cleanupComplete: true`; `failureCode: null`; terminal resultRoot equals the result root.
- Terminal resource receipt binds the approved window root; `wallAtMs: 1791668784436`; `cumulativeElapsedMs: 320843339`; source carry `1183744` bytes; prior retained carry `32768` bytes; historical charge `40` Matches and `29970432` allocated bytes; new allocated bytes `20480`; retained upper bound `31338496`; available disk `196360564736` bytes; aggregate memory upper bound `1534300160` bytes. At report time `21:47:54Z`, the approved hard stop `22:30:00Z` had not passed. This is one current bounded result, not a new allowance or historical peak claim.

## Scope and remaining gaps

No additional prepare, entry, test suite, old-v1 reader, history scan, provider/container/worker invocation, Strategy execution, Match, or source edit was performed. Safe inspection after the single reader was limited to exact store inventory, modes/sizes/allocated sizes/digests and allowlisted allocation/entry/result/terminal/case metadata; raw strategy/objective/memory/runtime I/O/error/stdio payloads were not displayed.

This is one successful ordinal-0 non-Match diagnostic. It does not prove alternate ordinals, failure paths, the generated broker predicate's unexecuted branch, producer-reader integration across untested paths, LEAG requirements, baseline/freeze, public/counting/production eligibility, or full Phase 265. The prior v1 failure's cause and cleanup uncertainty remain unknown. Overall Phase 265 remains `gaps_found`.

All commands in this verification turn closed successfully. No commit or push was made.

_Verified: 2026-10-10T21:47:54Z_  
_Verifier: the agent (independent retained-result verifier)_
