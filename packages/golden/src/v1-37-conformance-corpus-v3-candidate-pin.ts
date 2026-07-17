const CASE_ROOTS = Object.freeze([
  ["boundary-canonical-json-duplicate-key", "sha256:861cb52ece7151ddb815b8d35699f56f8b1928db36a81488ab1657f0cc3a18d1"],
  ["boundary-depth-limit", "sha256:7d1377875f01718796a2d1e1811aa93513a4aa879cd7682cad03c2e7bc0e7053"],
  ["boundary-numeric-negative-zero", "sha256:a6b42e7a1ad67bbf2a1452157d872d6463fce4455917f0701cbe45c0eb1dd1f4"],
  ["boundary-unicode-scalar", "sha256:683e4258e2aac6d6d00919a182bc2409c4480119c8a836a12547b01522324fe4"],
  ["failure-malformed-output-player", "sha256:f32d60c7128c0237341559a1f01c1392d1a6f974df2671be8666f1ec563c0740"],
  ["failure-resource-proven-player", "sha256:fa7c2c9dd7b0cb4b487f7e8e882b2a23021f4188538b3ea596e054392fccd868"],
  ["failure-stale-artifact-system", "sha256:6868969dc109c4f7bcb620e0481b5cc9f5972a8ef9fc74bbe9800e66ba6fed78"],
  ["failure-timeout-unattributed-system", "sha256:4cd2b15a024e66b13444427a50f5fdf5afb47f38a1e0776fe3d14c56dbae158e"],
  ["failure-toolchain-unavailable-system", "sha256:59baf3505467f77d6fb0b875d6357cc427a23682515e18ea7b481f4386aa38aa"],
  ["mutation-event-order-kill", "sha256:889850b9c5e73c97ea1eb03990a18268e541265ee963dd21c515095c14702cfc"],
  ["normative-first-active-turn-to-stone", "sha256:6988cd1d2546367ac39ac549ba571068974e12d8d69f7fcb31e7cc9e8265efb6"],
  ["observation-d01-initial-initiative-both-observers", "sha256:0ce4ca3f2214a4c1b80bb801c961789436d03d08b61d4ef9352dff329db1a302"],
  ["observation-d02-round-initiative-later-round", "sha256:3a223b94d90790da1ac1edcf041305b8bb08a79bebf69946229df6ada55616cc"],
  ["observation-d03-kernel-owned-signed-transport", "sha256:3d03efd5f356efbddac5063a9df62e992fb6ac9a6cefe9309673b941493e43d3"],
  ["observation-d04-real-revalidation-required", "sha256:1c7ece4e43682e88b3200f171f547ac54f07dbbd377eae1f01bd6edcb9ed7578"],
  ["observation-d05-blocked-move-false", "sha256:a0b4dfcb91057229e264b93c20f42812ba931ff2228a9f84fc1de5f564978e74"],
  ["observation-d05-blocked-push-false", "sha256:b407ef0795af48e31550d5fa1c82ccecae57284c3a8fe02968bb9701b95adec6"],
  ["observation-d05-pushed-target-false", "sha256:4b2a6661e746dbc034356503974527c70e228f66d6370531e66ca8fe2bfc9b31"],
  ["observation-d05-successful-pusher-true", "sha256:8b8620626d21ada908d5f19b1361a3bbbdda66fde8e4930a9ed6dbd1795517dd"],
  ["observation-d05-turn-false", "sha256:aa2bd7779a30e4b6a7c60e552fd5fc6030c41c942c5e3794b41710491cf3e17f"],
  ["observation-d06-first-call-false", "sha256:d6a56ee60421e9e69a916e1f33b72ed1b2d278591f35df1fc0d80d8bb097e71c"],
  ["observation-d06-later-cycle-true", "sha256:8359969848bf4f1408f82f00b74617ce6b35aeae1b5900fba65eaeffca498518"],
  ["observation-d06-post-self-advance-true", "sha256:6959514f3f6b800772a2d1bf74fc47e8f63eca713ac868081f435212b566a2eb"],
  ["observation-d07-new-slot-reset-false", "sha256:b8fa8c5b2fdf0cb796d3c9c85494fcd3b79ea8261bc2b7e2b1fb15e988b7bc13"],
  ["observation-d08-observational-only-no-hold", "sha256:332d50721d00de333f584c532ddef2c72b70ddde700a018f4e3c6a973525f783"],
  ["probe-raw-envelope-authentication", "sha256:c63177a1471c8c008bba1ee9dc3d613e8701c8f2d6b56242c7430686e1fb7e29"],
  ["probe-raw-envelope-transport-truncation", "sha256:3219c2ba4d5b17030ffb3e7e50ba438a6591701296c0af088e9a855497c9a2b0"],
  ["property-deterministic-repeat-seed-001", "sha256:5ff67434cb04408d5d3a70b1fedee07e7faafbfc220f69a0064028cd7e32dea5"],
  ["property-differential-full-trace-seed-002", "sha256:03cec5ddaf4b0d976311beb88e698f6048dbf955dfefefac2ad8eb559b22af63"],
  ["property-seeded-selection-seed-003", "sha256:af40b22afec1c8ee5b7d958337f52647cebe42ed84607ccc339001b345e7e232"],
].map(([caseId, rootSha256]) => Object.freeze({ caseId, rootSha256 })))

const SOURCE_ROOTS = Object.freeze([
  Object.freeze({ languageId: "typescript", sourceSha256: "sha256:a84f3ac5d34c8484269670c5d70013e11ee65baf822e3f585fe50f0ea0232859" }),
  Object.freeze({ languageId: "python", sourceSha256: "sha256:5085cb384fe3560394d5399e762b8595e7613b3abed370c4587a6634d725131a" }),
  Object.freeze({ languageId: "rust", sourceSha256: "sha256:6569a860516476eb02270a95f894e193a84f05b12e72dce015e51abbea81aadb" }),
  Object.freeze({ languageId: "zig", sourceSha256: "sha256:4afe9c23baf9c5577023ec0a140ea62507a8c7600293938efb8e16aadb279b32" }),
])

export const V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN = Object.freeze({
  schemaVersion: "v1.37-executable-conformance-candidate-pin-v1",
  lifecycle: "inactive-candidate",
  current: false,
  reviewedUnder: "phase-260-plan-11-independent-observation-review",
  candidateVersion: "v3",
  corpusRootSha256:
    "sha256:06d0717a16047cace0364c94a15353e2d53b53da5e8bebef6912f9f30f3d681d",
  corpusFileSha256:
    "sha256:ec92ba7506907e65a032083a2c68005022c7ad8d8873a9ddbc59338db2d8d5d0",
  semanticDiffFileSha256:
    "sha256:b4a1051b9b086ae61034ace006f5716e2b9510bc2fb1b39b129cc7b157e5d574",
  independentReviewFileSha256:
    "sha256:f24961c3191c73f8dc689a4445c8a354d5e2a9baa4a480c2f559406af6c60c4c",
  caseInventoryRootSha256:
    "sha256:39d9488891315e65388134a892ad514c08bb88adb09d6565edd1485a697c79fd",
  sourceInventoryRootSha256:
    "sha256:7d54394f989921a0a606544ba9c04b8530f4c06dab3ddddfeb074374adb261f8",
  corpusPath:
    "packages/golden/src/fixtures/v1-37-conformance-corpus/v3/corpus.json",
  semanticDiffPath:
    "packages/golden/src/fixtures/v1-37-conformance-corpus/v3/semantic-diff.json",
  independentReviewPath:
    "packages/golden/src/fixtures/v1-37-conformance-corpus/v3/independent-review.json",
  caseRoots: CASE_ROOTS,
  sourceRoots: SOURCE_ROOTS,
  updatePolicy: "plan-14-explicit-atomic-promotion-only",
} as const)
