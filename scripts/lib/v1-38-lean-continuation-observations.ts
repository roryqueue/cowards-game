/** Fixed historical expected observations only. No admission or runtime override. */
import { join } from "node:path"
import { freezeLabValue } from "../../packages/strategy-lab/src/contracts.js"
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

const fixed = freezeLabValue({
  sourcePaths: SOURCE_PATHS,
  continuationOwnedPaths: LEAN_BASELINE_CONTINUATION_OWNED_PATHS,
  continuationExtraPaths: ["packages/strategy-lab/src/league/lean-training.test.ts", "scripts/lib/v1-38-lean-baseline-analysis.test.ts", "scripts/lib/v1-38-lean-baseline-source.test.ts", "scripts/lib/v1-38-lean-startup-supervisor-v8.mjs", "AGENTS.md"],
  continuationPlanningPaths: LEAN_BASELINE_CONTINUATION_PLANNING_PATHS,
  spentV3Metadata, spentV4Metadata, spentV4Directories, spentV5Metadata, spentV5Directories, spentV6Metadata, spentV7Metadata, spentV7Directories,
  spentV8Metadata, spentV8Directories,
  closedCostV2: LEAN_CONTINUATION_CLOSED_COST_V2,
})
type DeepReadonly<T> = T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T
export type LeanContinuationExpectedObservations = DeepReadonly<typeof fixed>
export const LEAN_CONTINUATION_EXPECTED_OBSERVATIONS: LeanContinuationExpectedObservations = fixed
export const readLeanContinuationExpectedObservations = (): LeanContinuationExpectedObservations => LEAN_CONTINUATION_EXPECTED_OBSERVATIONS
