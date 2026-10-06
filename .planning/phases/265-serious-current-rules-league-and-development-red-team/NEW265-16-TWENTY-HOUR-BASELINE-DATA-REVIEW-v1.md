---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-06T23:43:00Z
scope: actual_main_fresh_conditional36_baseline_data_v8-1
status: clean
independently_reviewed: true
source_commit: 6cade0e237fe976051a71248f3f291166af3e769
source_root: sha256:9ba555e78f094004ea29229672d587f7d08a3ace06974d26219d61727a1441a6
request_root: sha256:e020b47d66fabe565d17d027b20c5d3d842008bc6bace017b948e3e0335231ca
author_agent: /root
reviewer_agent: /root/review_265_twenty_hour_baseline_data
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
---

# Twenty-hour conditional baseline — independent data review

## Result

No data-integrity finding in the specified fresh `v8-1` baseline request/helper handoff. This is not a source re-review, empirical execution, or baseline result.

## Authenticated bindings

- Source identity: commit `6cade0e237fe976051a71248f3f291166af3e769`, source root `sha256:9ba555e78f094004ea29229672d587f7d08a3ace06974d26219d61727a1441a6`.
- MAIN helper: `.strategy-lab/lean-correction-supervisor-baseline-20261006-v8-1-tmp/author-twenty-hour-baseline-v8-1.ts`, raw SHA-256 `32c747d90588aa6ed95104b24d1cb6071e31d6db5f4295adab0dab4f046c8a87`. It fixes route/ordinal/source/reviewer identity, checks the fresh private temp custody, authenticates the existing accepted diagnostic and FINAL closure, and has separate draft/finalize branches. The draft branch publishes only `draft-request.json`; it does not allocate or invoke a reader/provider/Match.
- Shell boundary inspected (not invoked): `scripts/run-v1-38-lean-correction.sh`, raw SHA-256 `796893e89f14c996acaa8c13d1ba55398a6a1c5f0641a71fb729a731317c78c9`. The baseline-v8-1 selector binds the intended temp path; restrictive umask/core/cache settings remain in place.
- Draft request: `.strategy-lab/lean-correction-supervisor-baseline-20261006-v8-1-tmp/draft-request.json`, raw SHA-256 `342bdf9664b1737183b6ddc4f3c632af8d8de4f4179c3eef637eaa2b58b18b47`. Independently recomputed with `leanCorrectionRequestDataRoot`; exact root is `sha256:e020b47d66fabe565d17d027b20c5d3d842008bc6bace017b948e3e0335231ca`. It is baseline ordinal 1, has 36 unique request slots, and retains the existing two candidate roots.
- Setup: root `sha256:b160bf880772e406bc71b61047fa28a118fde3749e984e63a08b24391734154e`, raw SHA-256 `1e275a981eacf432dbc55566c59da9d69e58fbbf5c26e2a1cb8f760cda0d3e07`; its authenticated extension equals the request extension. The extension root is `sha256:c9093818eca6b9a3967d8c4732871cb925b2880f48a971c7276e6800fd52e96a`. The approved 72,000,000-ms elapsed envelope is additive; the same 15-GB/300-Match limits and consumed-cost carry remain bound.
- Accepted diagnostic check: authenticated root `sha256:72ae7d0797b482fbe756e39fd3d9708b935c5106d06bad6e682a87601c2aae71`, raw SHA-256 `91734f311ac5ef0d0117bbf5eb7cff625a85b0c0fc7742a12be66c8d07c63079`.
- FINAL closure: authenticated root `sha256:6dcab26064d1fcb880518afc3716b0ed05812fb88c692525f94640681f78e830`. It is accepted, `finalReaderClose: true`, non-authorizing, and joins the same accepted-check root, diagnostic allocation root, source root, HEAD, and reader-close timestamp. Authentication used the existing diagnostic-check and v8 closure functions only, not an ordinary retained reader.

The data/request roots intentionally exclude review-root and authorization-root fields that are filled during finalization; thus those final bindings do not alter the independently recomputed request data root. No strategy/source payload, objective, memory, runtime I/O, allocation, or Match data is included here. No public/counting/production/freeze/formation/holdout status is implied. Remaining baseline destinations are not authorized by this review; subsequent gates remain controlling.

_Reviewer: /root/review_265_twenty_hour_baseline_data_
