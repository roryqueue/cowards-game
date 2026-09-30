# Plan 266-03 inherited local-seal verification test gap

This is a source-only diagnosis, not a seal, freeze, holdout opening, or authority.

The isolated `codex/phase266-seal-source` branch passes its five new `v1.38 unopened local seal inspection` tests and strict TypeScript for `scripts/lib/v1-38-local-seal.ts`. The existing unfiltered `scripts/verify-v1-38-local-seal.test.ts` fails before those new checks on the independent-verification cases with `V138_LOCAL_SEAL_POLICY_INVALID`; the same four failures reproduce on current `main`, so this is not evidence that Plan 266-03 changed the historical protocol.

The immediate mismatch is exact: `buildV138LocalSealProtocolArtifactV2` requires the original pre-search policy root `sha256:6ad9134977310215ce6e98171d3586c9ae1853313f912ff6e9af95966607e382`, while the test's `protocolFor` reads the current `.planning/artifacts/v1.38-pre-search-policy-root.json`, whose root is `sha256:4d05ebe8352512dd39a661d92fa46a5b84734aa87741fd229a2c678ad9603216`. Commit `a608eb66` superseded that artifact; its parent Git blob has the original root. The historical protocol-v2 reproduction must use authenticated historical policy bytes and separately verify the current policy's supersession. Do not change the pinned historical root or reinterpret the original protocol to make the test pass.

Plan 266-03 remains incomplete pending a reviewed, source-only test/verification repair and its full required test gate. No real operator-local preimage, real private seal store, Match, or formation material was accessed for this diagnosis.
