/** Fixed historical expected observations only. No admission or runtime override. */
import { join } from "node:path"
import { freezeLabValue, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { LEAN_BASELINE_CONTINUATION_PATHS_V2, LEAN_BASELINE_CONTINUATION_PATHS_V4, LEAN_BASELINE_CONTINUATION_PATHS_V5, LEAN_BASELINE_CONTINUATION_PATHS_V6, LEAN_BASELINE_CONTINUATION_PATHS_V7 } from "../../packages/strategy-lab/src/league/lean-experiment.js"

const SOURCE_PATHS = [
  "scripts/run-v1-38-lean-baseline.ts", "scripts/run-v1-38-lean-baseline.sh",
  "scripts/lib/v1-38-lean-baseline-pipeline.ts", "scripts/lib/v1-38-lean-baseline-source.ts",
  "scripts/lib/v1-38-lean-baseline-match.ts", "scripts/lib/v1-38-lean-baseline-analysis.ts",
  "scripts/lib/v1-38-lean-baseline-metrics.ts",
  "scripts/lib/v1-38-lean-baseline-retained.ts", "scripts/lib/v1-38-lean-cold-corpus.ts",
  "scripts/lib/v1-38-lean-seal-metadata.ts",
  "scripts/lib/v1-38-lean-training-adapter.ts", "scripts/lib/v1-38-lean-experiment-authority.ts",
  "scripts/lib/v1-38-lean-baseline.ts", "packages/strategy-lab/src/league/lean-training.ts",
  "packages/strategy-lab/src/league/lean-experiment.ts", "scripts/run-v1-38-lean-experiment.ts",
  "scripts/lib/v1-38-lean-child-cli-terminal.ts", "scripts/lib/v1-38-factory-supervised-runtime.ts",
  "scripts/lib/v1-38-lean-container-match-session.ts", "scripts/lib/v1-38-league-prospective-lifetime.ts",
] as const
const CONTINUATION_PHASE = ".planning/phases/265-serious-current-rules-league-and-development-red-team/"
const LEAN_BASELINE_CONTINUATION_OWNED_PATHS = Object.freeze([
  "packages/strategy-lab/src/league/lean-experiment.ts", "scripts/lib/v1-38-lean-baseline-continuation.ts", "scripts/lib/v1-38-lean-baseline-continuation.test.ts",
  "scripts/lib/v1-38-lean-experiment-authority.ts", "scripts/lib/v1-38-lean-baseline-authority.test.ts", "scripts/lib/v1-38-lean-baseline-match.ts", "scripts/lib/v1-38-lean-baseline-match.test.ts",
  "scripts/run-v1-38-lean-baseline.ts", "scripts/lib/v1-38-lean-baseline-pipeline.ts", "scripts/lib/v1-38-lean-baseline-source.ts", "scripts/lib/v1-38-lean-baseline-pipeline.test.ts",
  "scripts/lib/v1-38-lean-baseline-retained.ts", "scripts/lib/v1-38-lean-baseline-retained.test.ts", "scripts/run-v1-38-lean-baseline.test.ts", "scripts/lib/v1-38-lean-container-match-session.ts",
  "scripts/lib/v1-38-lean-continuation-observations.ts",
])
const LEAN_BASELINE_CONTINUATION_PLANNING_PATHS = Object.freeze([
  ".planning/PROJECT.md", ".planning/REQUIREMENTS.md", ".planning/ROADMAP.md", ".planning/STATE.md", ".planning/research/SUMMARY.md",
  ".planning/debug/265-native-exit-reader-cost.md",
  ...["265-16-PLAN.md", "265-15-PLAN.md", "265-15-PILOT-RETAINED-VERIFICATION-v2.md", "265-16-BASELINE-CONTINUATION-APPROVAL-20261012.md", "265-16-BASELINE-CONTINUATION-RESEARCH-20261012.md", "265-16-BASELINE-CONTINUATION-PLAN-20261012.md", "265-16-BASELINE-CONTINUATION-GATES-20261012.md"].map(name => `${CONTINUATION_PHASE}${name}`),
  ".planning/milestone-proposals/v1.38-competitive-strategy-factory-and-adversarial-league/LEAN-EXPERIMENT-20261003.md",
  ".planning/milestone-proposals/v1.38-competitive-strategy-factory-and-adversarial-league/LEAN-REMAINING-PLAN-20261003.md",
])
const spentV3Metadata = Object.freeze([
  { path: LEAN_BASELINE_CONTINUATION_PATHS_V2.request, bytes: 4041, rawRoot: "sha256:900e97e973ac31c596d1f5f1b8b89e1b8e532310e0b2d6e67053fbe9a8321065" },
  { path: LEAN_BASELINE_CONTINUATION_PATHS_V2.window, bytes: 935, rawRoot: "sha256:2c0c2905fea2e4a264aac99df251e5aa89d0b2c44588453d3c41586f4b3a881d" },
])
/** Opaque spent setup anchors only, never a V4 run/custody capsule. */
const spentV4Metadata = freezeLabValue([
  { path: LEAN_BASELINE_CONTINUATION_PATHS_V4.window, bytes: 935, mode: 0o600, maximum: 65536, rawRoot: "sha256:98b0cd906323554e3c0cefb96700c317a9bd2e346135c7560d715b87eb303ba6" },
  { path: LEAN_BASELINE_CONTINUATION_PATHS_V4.request, bytes: 4056, mode: 0o600, maximum: 65536, rawRoot: "sha256:bd17509fee8d2138b89b4a114224f1ee1ee009217475e924d6dd7cdfd90466c7" },
  { path: LEAN_BASELINE_CONTINUATION_PATHS_V4.allocation, bytes: 17366, mode: 0o644, maximum: 262144, rawRoot: "sha256:19aeee9f9416849b4e7bb214afa7d470349f36e302b09bda700c7a50e717938f" },
  { path: join(LEAN_BASELINE_CONTINUATION_PATHS_V4.store, "allocation.json"), bytes: 17366, mode: 0o600, maximum: 262144, rawRoot: "sha256:19aeee9f9416849b4e7bb214afa7d470349f36e302b09bda700c7a50e717938f" },
  { path: join(LEAN_BASELINE_CONTINUATION_PATHS_V4.store, "carry.json"), bytes: 746080, mode: 0o600, maximum: 4194304, rawRoot: "sha256:7bb1e101e0938ab8497311444e81ad30578f41d372a3c7999e61dfddad90f5a7" },
  { path: join(LEAN_BASELINE_CONTINUATION_PATHS_V4.store, "source-manifest.json"), bytes: 208491, mode: 0o600, maximum: 4194304, rawRoot: "sha256:35c507b2a0fd12b3d131671ba6596f8e4dcfcafa62676fcfa703c672d9dee508" },
  { path: join(LEAN_BASELINE_CONTINUATION_PATHS_V4.store, "source-hold.json"), bytes: 146345, mode: 0o600, maximum: 4194304, rawRoot: "sha256:744be76efaaaeca29076208f2da70a5f755569b93c6a47d0622b3aa1f4525911" },
  { path: join(LEAN_BASELINE_CONTINUATION_PATHS_V4.store, "ledger.ndjson"), bytes: 0, mode: 0o600, maximum: 4194304, rawRoot: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" },
  { path: join(LEAN_BASELINE_CONTINUATION_PATHS_V4.store, "time.ndjson"), bytes: 0, mode: 0o600, maximum: 4194304, rawRoot: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" },
  { path: LEAN_BASELINE_CONTINUATION_PATHS_V4.claim, bytes: 1002, mode: 0o600, maximum: 65536, rawRoot: "sha256:14cc57d66661a98c8f9150842b441310c8a70d29fef5186b5c58a49e62c9e45c" },
])
const spentV4Directories = freezeLabValue([
  { path: LEAN_BASELINE_CONTINUATION_PATHS_V4.store, members: ["allocation.json", "carry.json", "ledger.ndjson", "source-hold.json", "source-manifest.json", "time.ndjson"] },
  { path: LEAN_BASELINE_CONTINUATION_PATHS_V4.temp, members: ["window-claim.json"] },
])
/** Independent terminal-check raw anchors; unknown claim size is bounded,
 * not invented. These bytes authenticate preservation, never run authority. */
const spentV5Metadata = freezeLabValue([
  { path: LEAN_BASELINE_CONTINUATION_PATHS_V5.window, bytes: 929, mode: 0o600, maximum: 65536, rawRoot: "sha256:989dc4984483ac4ebcecb154e2c8b9256657d0cbb21258b50fb4cdaa99481faa" },
  { path: LEAN_BASELINE_CONTINUATION_PATHS_V5.request, bytes: 4051, mode: 0o600, maximum: 65536, rawRoot: "sha256:386e72a26e326d7f09c9c93a6f087c481a7ff0117be284fcb72aeb0aa692e6b1" },
  ...[LEAN_BASELINE_CONTINUATION_PATHS_V5.allocation, join(LEAN_BASELINE_CONTINUATION_PATHS_V5.store, "allocation.json")].map((path, i) => ({ path, bytes: 17360, mode: i ? 0o600 : 0o644, maximum: 262144, rawRoot: "sha256:439ff997177d812aebc8194b77dd6dcc30353541b0f5061f3eea036f32c7c7c6" })),
  { path: join(LEAN_BASELINE_CONTINUATION_PATHS_V5.store, "carry.json"), bytes: 749813, mode: 0o600, maximum: 4194304, rawRoot: "sha256:a6168503f6bee69d22688a003c7acb1c0d850647cdc447f81d10747150eca348" },
  { path: join(LEAN_BASELINE_CONTINUATION_PATHS_V5.store, "source-manifest.json"), bytes: 208495, mode: 0o600, maximum: 4194304, rawRoot: "sha256:e01c2cc7f6fd49185f92ded151ddc0b4bc6c26347cd3e3b597a76b099943388a" },
  { path: join(LEAN_BASELINE_CONTINUATION_PATHS_V5.store, "source-hold.json"), bytes: 146600, mode: 0o600, maximum: 4194304, rawRoot: "sha256:e0ff6a1879e9cfb90f5303097a2a1e20a130be0ada3f3b42bfe63949ec79cb55" },
  ...["ledger.ndjson", "time.ndjson"].map(name => ({ path: join(LEAN_BASELINE_CONTINUATION_PATHS_V5.store, name), bytes: 0, mode: 0o600, maximum: 4194304, rawRoot: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" })),
  { path: LEAN_BASELINE_CONTINUATION_PATHS_V5.claim, bytes: null, mode: 0o600, maximum: 65536, rawRoot: "sha256:e2e94f1a122f3c994a09c4ccfb028d630fae52abb0c0aaacce733e4dd57cb13c" },
])
const spentV5Directories = freezeLabValue([
  { path: LEAN_BASELINE_CONTINUATION_PATHS_V5.store, members: ["allocation.json", "carry.json", "ledger.ndjson", "source-hold.json", "source-manifest.json", "time.ndjson"] },
  { path: LEAN_BASELINE_CONTINUATION_PATHS_V5.temp, members: ["window-claim.json"] },
])
/** ROOT's two observed opaque files only. No allocation, store, capsule or
 * terminal was created by the spent V6 preparation; absence stays required. */
const spentV6Metadata = freezeLabValue([
  { path: LEAN_BASELINE_CONTINUATION_PATHS_V6.window, bytes: 929, mode: 0o600, maximum: 65536, rawRoot: "sha256:1311fadb75d16b9e6eaa299f7e961034cc941ecbb8db4dbe28121724b98459ec" },
  { path: LEAN_BASELINE_CONTINUATION_PATHS_V6.request, bytes: 4047, mode: 0o600, maximum: 65536, rawRoot: "sha256:0c9c7559f42a08901ede3627d257cdf0efcfd6a98e8893dbf5df4c7c52f4361d" },
])
/** ROOT734f20 opaque observations. None of these objects is run authority. */
const spentV7Metadata = freezeLabValue([
  { path: LEAN_BASELINE_CONTINUATION_PATHS_V7.window, bytes: 929, allocatedBytes: 4096, mode: 0o600, maximum: 65536, rawRoot: "sha256:f6c864c6483805035f19c40b1c9652225d302ef39457723a9be9973e764652e3" },
  { path: LEAN_BASELINE_CONTINUATION_PATHS_V7.request, bytes: 4040, allocatedBytes: 4096, mode: 0o600, maximum: 65536, rawRoot: "sha256:1fcba4e7945739e8ccdbfde70eb769a9fd581eb422a0a2333472d55fc1f6567d" },
  ...[LEAN_BASELINE_CONTINUATION_PATHS_V7.allocation, join(LEAN_BASELINE_CONTINUATION_PATHS_V7.store, "allocation.json")].map((path, i) => ({ path, bytes: 17352, allocatedBytes: 20480, mode: i ? 0o600 : 0o644, maximum: 262144, rawRoot: "sha256:2d6a90d63a3f9e7af699046e1a6ddafcbf2eb0585844439b45233d7465129c96" })),
  { path: join(LEAN_BASELINE_CONTINUATION_PATHS_V7.store, "carry.json"), bytes: 754167, allocatedBytes: 757760, mode: 0o600, maximum: 4194304, rawRoot: "sha256:9e6808767f3b5ba461c28457bdaf0781de8fbe9a56fdbcdbc6b6a7cdca20283e" },
  { path: join(LEAN_BASELINE_CONTINUATION_PATHS_V7.store, "source-hold.json"), bytes: 146961, allocatedBytes: 147456, mode: 0o600, maximum: 4194304, rawRoot: "sha256:92bd96b0ab29518205f8583386dbcf4137733d5039656e9d33577ab538dd25a4" },
  { path: join(LEAN_BASELINE_CONTINUATION_PATHS_V7.store, "source-manifest.json"), bytes: 208476, allocatedBytes: 208896, mode: 0o600, maximum: 4194304, rawRoot: "sha256:d720d3d51da9e16b63bf93a1548c1fbff28719cf14696aa3d763e235cc7f9ad7" },
  ...["ledger.ndjson", "time.ndjson"].map(name => ({ path: join(LEAN_BASELINE_CONTINUATION_PATHS_V7.store, name), bytes: 0, allocatedBytes: 0, mode: 0o600, maximum: 4194304, rawRoot: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" })),
  { path: LEAN_BASELINE_CONTINUATION_PATHS_V7.claim, bytes: 1002, allocatedBytes: 4096, mode: 0o600, maximum: 65536, rawRoot: "sha256:8f63b98b44d23de6aca4cae83ed61056f7e76ebb9351ce36773abba6aa257518" },
])
const spentV7Directories = freezeLabValue([
  { path: LEAN_BASELINE_CONTINUATION_PATHS_V7.store, members: ["allocation.json", "carry.json", "ledger.ndjson", "source-hold.json", "source-manifest.json", "time.ndjson"] },
  { path: LEAN_BASELINE_CONTINUATION_PATHS_V7.temp, members: ["window-claim.json"] },
])
/** Independently compared spent V8 bytes: preservation/cost only, never authority. */
const spentV8Metadata = freezeLabValue([
  {
    "path": ".strategy-lab/lean-baseline-continuation-window-20261015-v8.json",
    "bytes": 927,
    "allocatedBytes": 4096,
    "mode": 384,
    "maximum": 65536,
    "rawRoot": "sha256:2d10cd37d22e6ef76b5ffe5d4cff283c8264543d3bfe79fca08aaface1fbc05f"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-request-20261015-v8.json",
    "bytes": 4036,
    "allocatedBytes": 4096,
    "mode": 384,
    "maximum": 65536,
    "rawRoot": "sha256:388cbe2d4e30f478a16f27e1fe657f4288a93a08074ec446c2b7b5700138e0ff"
  },
  {
    "path": ".planning/artifacts/v1.38-lean-baseline-continuation-allocation-20261015-v8.json",
    "bytes": 17350,
    "allocatedBytes": 20480,
    "mode": 420,
    "maximum": 262144,
    "rawRoot": "sha256:fbcd010d88de954894b9e9d97a4b81258e580721cfa9cc8498d91dd64e31389f"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261015-v8/allocation.json",
    "bytes": 17350,
    "allocatedBytes": 20480,
    "mode": 384,
    "maximum": 262144,
    "rawRoot": "sha256:fbcd010d88de954894b9e9d97a4b81258e580721cfa9cc8498d91dd64e31389f"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261015-v8/carry.json",
    "bytes": 757888,
    "allocatedBytes": 761856,
    "mode": 384,
    "maximum": 4194304,
    "rawRoot": "sha256:4ab94f7a355d603099aa0b7e94e465c97dc4ff67a0ad742fbf1a06c5e70f07c1"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261015-v8/source-manifest.json",
    "bytes": 208465,
    "allocatedBytes": 208896,
    "mode": 384,
    "maximum": 4194304,
    "rawRoot": "sha256:9e3f84f8ddcc9acdd5e7fef5f4957e1b1715f44b7d6eb7f4d367ba76a3b3d11e"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261015-v8/source-hold.json",
    "bytes": 147225,
    "allocatedBytes": 147456,
    "mode": 384,
    "maximum": 4194304,
    "rawRoot": "sha256:5a7f2f0da52b3b74d32638085b0338a04d299e2775366322e97a874b73508226"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261015-v8/ledger.ndjson",
    "bytes": 0,
    "allocatedBytes": 0,
    "mode": 384,
    "maximum": 4194304,
    "rawRoot": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261015-v8/time.ndjson",
    "bytes": 258,
    "allocatedBytes": 4096,
    "mode": 384,
    "maximum": 4194304,
    "rawRoot": "sha256:8f1778dabc27b4668e2b91f7e547e157351c74aca7d47b67ff329edb266a85e7"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261015-v8/run-claim.json",
    "bytes": 402,
    "allocatedBytes": 4096,
    "mode": 384,
    "maximum": 262144,
    "rawRoot": "sha256:4ab6b3aee85dab2bc17cb3d0f736de6e098a716e228c7db73b950fb19aaf266c"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261015-v8/entry.json",
    "bytes": 551,
    "allocatedBytes": 4096,
    "mode": 384,
    "maximum": 262144,
    "rawRoot": "sha256:7f3e14791b650e5e8eec9e1be1b9e809f56a4f8fce93253d754de7e7baab6663"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261015-v8/child-terminal.json",
    "bytes": 659,
    "allocatedBytes": 4096,
    "mode": 384,
    "maximum": 262144,
    "rawRoot": "sha256:29d750f49a075384d14fee50150af608203dfaeed5f80e32b805f76652021d6e"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261015-v8/entry-failure.json",
    "bytes": 121,
    "allocatedBytes": 4096,
    "mode": 384,
    "maximum": 262144,
    "rawRoot": "sha256:d8200b485f6aa73c7e37dd2c233766db62f7480f22133659f8abc6f0b45eb2fd"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261015-v8/parent-supervisor-reasons.json",
    "bytes": 888,
    "allocatedBytes": 4096,
    "mode": 384,
    "maximum": 262144,
    "rawRoot": "sha256:eb87a75da2dee291af822224d4fd586e2e3e7a65c4575da8eee74bb495398ca5"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261015-v8-tmp/window-claim.json",
    "bytes": 1000,
    "allocatedBytes": 4096,
    "mode": 384,
    "maximum": 65536,
    "rawRoot": "sha256:b02ae430adc7e7c6df0ec7633622c34a27f24bd42a5351017d3bac29d2e7150b"
  }
])
const spentV8Directories = freezeLabValue([
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261015-v8",
    "members": [
      "allocation.json",
      "carry.json",
      "child-terminal.json",
      "entry-failure.json",
      "entry.json",
      "ledger.ndjson",
      "parent-supervisor-reasons.json",
      "run-claim.json",
      "source-hold.json",
      "source-manifest.json",
      "time.ndjson"
    ]
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261015-v8-tmp",
    "members": [
      "window-claim.json"
    ]
  }
])
const LEAN_CONTINUATION_CLOSED_COST_V2 = Object.freeze({ sourceHead: "16db0fa0610e1a2378be8594b191d61f2f3c3baa", allocationCommit: "f6ff7ec36de7387feab7e4b4ad3695db480a4c1f", allocationBytesRoot: "sha256:3ea8c18d1a8a5b7816ed44f10572d4469870e75dcee8c7223895809830cd2c87", resultBytesRoot: "sha256:79ad5c21114afcec3b420b2f452db20cc29b2ca769c8ade317a343187b792796", checkBytesRoot: "sha256:64015d7c5e2c0ced02e0fa09f7c10f2cd7534a3f42b7f046af2a65d7bef17286", checkRoot: "sha256:e1711e16eafd3ded5d69988fe7617208fa7fcdc62b9681d45910ef2825f88838" })

/** Independently compared V9 terminal metadata; opaque preservation/cost only. */
const spentV9Metadata = freezeLabValue([
  {
    "path": ".strategy-lab/lean-baseline-continuation-window-20261017-v9.json",
    "bytes": 938,
    "allocatedBytes": 4096,
    "mode": 384,
    "maximum": 65536,
    "rawRoot": "sha256:9573d0dab6378c9fa32192b9086258415f35a5947576b2fac54b78df99e2aa9e"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-request-20261017-v9.json",
    "bytes": 4028,
    "allocatedBytes": 4096,
    "mode": 384,
    "maximum": 65536,
    "rawRoot": "sha256:052c4851e75bca37e2921e3c2769472f272ec373df63fd49370a05d563bb3b58"
  },
  {
    "path": ".planning/artifacts/v1.38-lean-baseline-continuation-allocation-20261017-v9.json",
    "bytes": 17356,
    "allocatedBytes": 20480,
    "mode": 420,
    "maximum": 262144,
    "rawRoot": "sha256:72392772c091b4fb9e05acc7ca0717bbd8ba4c5983bea344d3518cc94b24b490"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261017-v9/allocation.json",
    "bytes": 17356,
    "allocatedBytes": 20480,
    "mode": 384,
    "maximum": 262144,
    "rawRoot": "sha256:72392772c091b4fb9e05acc7ca0717bbd8ba4c5983bea344d3518cc94b24b490"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261017-v9/carry.json",
    "bytes": 763586,
    "allocatedBytes": 765952,
    "mode": 384,
    "maximum": 4194304,
    "rawRoot": "sha256:132e2192d25521bf012423a943d3f0617da2d8b5c1de19a03f565f5b4ba68abe"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261017-v9/child-terminal.json",
    "bytes": 666,
    "allocatedBytes": 4096,
    "mode": 384,
    "maximum": 65536,
    "rawRoot": "sha256:d1a0dc0c9d96dcecf99c7c97d44459cc7de79712188c9d0666ac60cb6c3b4cc2"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261017-v9/entry.json",
    "bytes": 549,
    "allocatedBytes": 4096,
    "mode": 384,
    "maximum": 65536,
    "rawRoot": "sha256:91bcc15a7082f4790e3c42516958b4509b2e00ad72516cb89bba7d8fd04b8e24"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261017-v9/ledger.ndjson",
    "bytes": 35,
    "allocatedBytes": 4096,
    "mode": 384,
    "maximum": 65536,
    "rawRoot": "sha256:74fc0b8bac1974c3d00ab565572da3786bf4bfaf0af7fa73b9b09c7f2279a898"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261017-v9/parent-supervisor-reasons.json",
    "bytes": 937,
    "allocatedBytes": 4096,
    "mode": 384,
    "maximum": 65536,
    "rawRoot": "sha256:ec0428650b65bae175c83de3dc4cf08e2fc614508c71cc3dd9b0a7dd80756be1"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261017-v9/run-claim.json",
    "bytes": 402,
    "allocatedBytes": 4096,
    "mode": 384,
    "maximum": 65536,
    "rawRoot": "sha256:100292610e1fec0ed36241ebc2e281c75ef3865a3ab1085d3961465ca8357551"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261017-v9/source-hold.json",
    "bytes": 147515,
    "allocatedBytes": 151552,
    "mode": 384,
    "maximum": 4194304,
    "rawRoot": "sha256:9276fe7e3638bec3758975ef8b82aecf8292c72bbd8a86d351816a44cdf7c172"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261017-v9/source-manifest.json",
    "bytes": 208745,
    "allocatedBytes": 208896,
    "mode": 384,
    "maximum": 4194304,
    "rawRoot": "sha256:c9ac2c20c80a19292b70df399e5c38f5b7e70b2c46daf9f6b2766fced4b7ccbe"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261017-v9/time.ndjson",
    "bytes": 258,
    "allocatedBytes": 4096,
    "mode": 384,
    "maximum": 65536,
    "rawRoot": "sha256:bf7ee677b86cbbb3b522924e9246cb9e7fa65ee49c9e5c5133d50562a3393fb9"
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261017-v9-tmp/window-claim.json",
    "bytes": 1011,
    "allocatedBytes": 4096,
    "mode": 384,
    "maximum": 65536,
    "rawRoot": "sha256:f53ea680e3952e92a629c141137f9838b9294ea204f874953862951cc006597d"
  }
])
const spentV9Directories = freezeLabValue([
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261017-v9",
    "members": [
      "allocation.json",
      "carry.json",
      "child-terminal.json",
      "entry.json",
      "ledger.ndjson",
      "parent-supervisor-reasons.json",
      "run-claim.json",
      "source-hold.json",
      "source-manifest.json",
      "time.ndjson"
    ]
  },
  {
    "path": ".strategy-lab/lean-baseline-continuation-20261017-v9-tmp",
    "members": [
      "window-claim.json"
    ]
  }
])

const spentV10Metadata = freezeLabValue([
  { path: ".strategy-lab/lean-baseline-continuation-request-20261017-v10.json", bytes: 4031, allocatedBytes: 4096, mode: 0o600, maximum: 65536, rawRoot: "sha256:c81226da93b9f4c76d26804f2fc7b23d3c30e31047044b4285b3ac21fc3fd029" as LabRoot },
  { path: ".strategy-lab/lean-baseline-continuation-window-20261017-v10.json", bytes: 941, allocatedBytes: 4096, mode: 0o600, maximum: 65536, rawRoot: "sha256:4d5c15298a6d096c72f15700728af2317826bc99cfc783a7332e62624a319179" as LabRoot },
])
/** ROOT-observed spent V11 inventory. Opaque cost-only facts, never run authority or corpus input. */
const spentV11Metadata = freezeLabValue([
  { path: ".strategy-lab/lean-baseline-continuation-window-20261017-v11.json", bytes: 942, allocatedBytes: 4096, mode: 0o600, maximum: 65536, rawRoot: "sha256:75dfe68b7389871f23ff0cfea0827dd9f123c850be02536dbe51106aa24c3a60" as LabRoot },
  { path: ".strategy-lab/lean-baseline-continuation-request-20261017-v11.json", bytes: 4044, allocatedBytes: 4096, mode: 0o600, maximum: 65536, rawRoot: "sha256:fd29bb705d49c1422a9651aaddeff1bd06820adbf92b0c153bda4f381b9414ce" as LabRoot },
  { path: ".planning/artifacts/v1.38-lean-baseline-continuation-allocation-20261017-v11.json", bytes: 17366, allocatedBytes: 20480, mode: 0o644, maximum: 262144, rawRoot: "sha256:62570ca50e1425382cc5408cf2683a496ebc85e22e75090296ddfb9f25a2a5a1" as LabRoot },
  { path: ".strategy-lab/lean-baseline-continuation-20261017-v11/allocation.json", bytes: 17366, allocatedBytes: 20480, mode: 0o600, maximum: 4194304, rawRoot: "sha256:62570ca50e1425382cc5408cf2683a496ebc85e22e75090296ddfb9f25a2a5a1" as LabRoot },
  { path: ".strategy-lab/lean-baseline-continuation-20261017-v11/carry.json", bytes: 769435, allocatedBytes: 770048, mode: 0o600, maximum: 4194304, rawRoot: "sha256:58f7cd1b7e78afee76903a7de4ef88ca1ba5d4bb6d665409c17f4d0411cb8208" as LabRoot },
  { path: ".strategy-lab/lean-baseline-continuation-20261017-v11/child-terminal.json", bytes: 665, allocatedBytes: 4096, mode: 0o600, maximum: 4194304, rawRoot: "sha256:09dfcd6ce0a5aee92e7b71a465e3565c4f0c0a481c7e3a043c581b5f556c747e" as LabRoot },
  { path: ".strategy-lab/lean-baseline-continuation-20261017-v11/cold-corpus.json", bytes: 137327, allocatedBytes: 139264, mode: 0o600, maximum: 4194304, rawRoot: "sha256:f948f9f2b284d951762a23c82f29a8663be16bdac335675a343922fadb40f8b1" as LabRoot },
  { path: ".strategy-lab/lean-baseline-continuation-20261017-v11/entry.json", bytes: 548, allocatedBytes: 4096, mode: 0o600, maximum: 4194304, rawRoot: "sha256:29f5d9616058f856914f35fc5e430d4d3c8d1f8dce4ff54a9f4298449fe07cf4" as LabRoot },
  { path: ".strategy-lab/lean-baseline-continuation-20261017-v11/ledger.ndjson", bytes: 0, allocatedBytes: 0, mode: 0o600, maximum: 4194304, rawRoot: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" as LabRoot },
  { path: ".strategy-lab/lean-baseline-continuation-20261017-v11/parent-supervisor-reasons.json", bytes: 939, allocatedBytes: 4096, mode: 0o600, maximum: 4194304, rawRoot: "sha256:d62e055976a12bf5fc40c5d9f75cb141d2ccd9b9c539c89a546ebd6f52b5678c" as LabRoot },
  { path: ".strategy-lab/lean-baseline-continuation-20261017-v11/publication-cold-opponent-continuation-v2.json", bytes: 1088, allocatedBytes: 4096, mode: 0o600, maximum: 4194304, rawRoot: "sha256:a2f8f11510fb1cffcd35f2db2d954f5d76dd2dbc69824bb985fbb79abb838f19" as LabRoot },
  { path: ".strategy-lab/lean-baseline-continuation-20261017-v11/publication-probe-continuation-v2.json", bytes: 1080, allocatedBytes: 4096, mode: 0o600, maximum: 4194304, rawRoot: "sha256:bb74c7b865c74eafb71596cb812789594a4d19cae2409851835270af62fdf9eb" as LabRoot },
  { path: ".strategy-lab/lean-baseline-continuation-20261017-v11/reader-claim.json", bytes: 555, allocatedBytes: 4096, mode: 0o600, maximum: 4194304, rawRoot: "sha256:1e4c259e2e10dc18312d87fdd8d546cd8f722666813e0843b810b3f290d5e61b" as LabRoot },
  { path: ".strategy-lab/lean-baseline-continuation-20261017-v11/retained-check.json", bytes: 1299, allocatedBytes: 4096, mode: 0o600, maximum: 4194304, rawRoot: "sha256:1692f8d66559dfbcc09f37bc84b33e88a529365d4777c1bfe8f00518b6285301" as LabRoot },
  { path: ".strategy-lab/lean-baseline-continuation-20261017-v11/run-claim.json", bytes: 402, allocatedBytes: 4096, mode: 0o600, maximum: 4194304, rawRoot: "sha256:3651567c9db6bffbda683a5332838e7daa91024067309d866905d360f86cbd84" as LabRoot },
  { path: ".strategy-lab/lean-baseline-continuation-20261017-v11/seal-metadata.json", bytes: 711, allocatedBytes: 4096, mode: 0o600, maximum: 4194304, rawRoot: "sha256:470fd5eec503fd4bcc6d3b3335cf780822ddae6f45fd4e33fe4008a822184cb3" as LabRoot },
  { path: ".strategy-lab/lean-baseline-continuation-20261017-v11/source-cold-opponent.json", bytes: 14131, allocatedBytes: 16384, mode: 0o600, maximum: 4194304, rawRoot: "sha256:80b5ee2ebc90573420c808c43c435b2599c423a0100e753d66e8632e1cef9e91" as LabRoot },
  { path: ".strategy-lab/lean-baseline-continuation-20261017-v11/source-hold.json", bytes: 147896, allocatedBytes: 151552, mode: 0o600, maximum: 4194304, rawRoot: "sha256:cf2e8196487ac247c6c139bdc4ac30a7477f629b7eae8a52c8efcef8f28822fa" as LabRoot },
  { path: ".strategy-lab/lean-baseline-continuation-20261017-v11/source-manifest.json", bytes: 208770, allocatedBytes: 208896, mode: 0o600, maximum: 4194304, rawRoot: "sha256:bd8331679a0ac5b08909e282b285b7b8044271d5bb7473dbc7e7aa86b9bad859" as LabRoot },
  { path: ".strategy-lab/lean-baseline-continuation-20261017-v11/source-probe.json", bytes: 37291, allocatedBytes: 40960, mode: 0o600, maximum: 4194304, rawRoot: "sha256:9f549e7095284d120806fc76e932859f8fc5ee03bc2eed6eee2fb1c15bf9849d" as LabRoot },
  { path: ".strategy-lab/lean-baseline-continuation-20261017-v11/time.ndjson", bytes: 416, allocatedBytes: 4096, mode: 0o600, maximum: 65536, rawRoot: "sha256:687f51bff04187f8bbd79085a87328c41f098e322724c0495748dde99eb4be3e" as LabRoot },
  { path: ".strategy-lab/lean-baseline-continuation-20261017-v11-tmp/window-claim.json", bytes: 1014, allocatedBytes: 4096, mode: 0o600, maximum: 4194304, rawRoot: "sha256:3ebd9719f06a7bf0200b9e6e9abff729d09aa1b6814e9266554af02e4f3488e1" as LabRoot },
])
const spentV11Directories = freezeLabValue([
  { path: ".strategy-lab/lean-baseline-continuation-20261017-v11", members: ["allocation.json", "carry.json", "child-terminal.json", "cold-corpus.json", "entry.json", "ledger.ndjson", "parent-supervisor-reasons.json", "publication-cold-opponent-continuation-v2.json", "publication-probe-continuation-v2.json", "reader-claim.json", "retained-check.json", "run-claim.json", "seal-metadata.json", "source-cold-opponent.json", "source-hold.json", "source-manifest.json", "source-probe.json", "time.ndjson"], allocatedBytes: 0, mode: 0o700 },
  { path: ".strategy-lab/lean-baseline-continuation-20261017-v11-tmp", members: ["window-claim.json"], allocatedBytes: 0, mode: 0o700 },
])
const spentV11Absences = freezeLabValue([
  ".strategy-lab/lean-baseline-continuation-20261017-v11/result.json",
  ".strategy-lab/lean-baseline-continuation-20261017-v11/entry-failure.json",
  ".strategy-lab/lean-baseline-continuation-20261017-v11/initial-proposals.json",
  ".strategy-lab/lean-baseline-continuation-20261017-v11/initial-selection.json",
  ".strategy-lab/lean-baseline-continuation-20261017-v11/initial-training.json",
])
/** Retired V12 binding only: no preparation or execution occurred. */
const spentV12Metadata = freezeLabValue([
  { path: ".strategy-lab/lean-baseline-continuation-window-20261017-v12.json", bytes: 941, allocatedBytes: 4096, mode: 0o600, maximum: 65536, rawRoot: "sha256:0d8ebb07b8c96b4d96da1e999e37c5d6f679e90bad27fe90efa55b8e9760f52c" as LabRoot },
])
const spentV12Absences = freezeLabValue([
  ".strategy-lab/lean-baseline-continuation-request-20261017-v12.json",
  ".planning/artifacts/v1.38-lean-baseline-continuation-allocation-20261017-v12.json",
  ".strategy-lab/lean-baseline-continuation-20261017-v12",
  ".strategy-lab/lean-baseline-continuation-20261017-v12-tmp",
])
const fixed = freezeLabValue({
  sourcePaths: SOURCE_PATHS,
  continuationOwnedPaths: LEAN_BASELINE_CONTINUATION_OWNED_PATHS,
  continuationExtraPaths: ["packages/strategy-lab/src/league/lean-training.test.ts", "scripts/lib/v1-38-lean-baseline-analysis.test.ts", "scripts/lib/v1-38-lean-baseline-source.test.ts", "scripts/lib/v1-38-lean-startup-supervisor-v8.mjs", "AGENTS.md"],
  continuationPlanningPaths: LEAN_BASELINE_CONTINUATION_PLANNING_PATHS,
  spentV3Metadata, spentV4Metadata, spentV4Directories, spentV5Metadata, spentV5Directories, spentV6Metadata, spentV7Metadata, spentV7Directories,
  spentV8Metadata, spentV8Directories, spentV9Metadata, spentV9Directories, spentV10Metadata,
  spentV11Metadata, spentV11Directories, spentV11Absences,
  spentV12Metadata, spentV12Absences,
  closedCostV2: LEAN_CONTINUATION_CLOSED_COST_V2,
})
type DeepReadonly<T> = T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T
export type LeanContinuationExpectedObservations = DeepReadonly<typeof fixed>
export const LEAN_CONTINUATION_EXPECTED_OBSERVATIONS: LeanContinuationExpectedObservations = fixed
export const readLeanContinuationExpectedObservations = (): LeanContinuationExpectedObservations => LEAN_CONTINUATION_EXPECTED_OBSERVATIONS
