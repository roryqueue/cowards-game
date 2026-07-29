#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

export const V137_AUDIT_PROBE_IDS = [
  "noAdvanceLastSoldier",
  "cycleEndBackstabActor",
  "excessMalformedOrder",
  "deepValidation",
  "overlappingArenaAccepted",
  "legacyBoundaryAccepted",
  "successfulPushPusherHistory",
] as const

type ProbeId = (typeof V137_AUDIT_PROBE_IDS)[number]
type Observations = Readonly<Record<string, unknown>>

export interface V137AuditCompatibilityRuling {
  schemaVersion: "v1.37-exact-compatibility-ruling-v1"
  rulingId: string
  decision: string
  probe: ProbeId
  priorObservation: unknown
  approvedObservation: unknown
  matchState: "unchanged" | "changed"
  actionLegality: "unchanged" | "changed"
  canonicalEventOrder: "unchanged" | "changed"
  outcome: "unchanged" | "changed"
  terminalSemantics: "unchanged" | "changed"
  strategyObservations: "unchanged" | "changed"
  fixtures: readonly string[]
  requirements: readonly string[]
  tupleVersions: readonly string[]
  approvalSource: string
}

export interface V137AuditProtectedInput {
  path: string
  bytes: string
  expectedSha256: `sha256:${string}`
}

export interface V137AuditReproductionInput {
  reproductionSourceBytes: string
  freshObservations: Observations
  retainedResultBytes: string
  retainedResultMarkdownBytes: string
  rulings: readonly V137AuditCompatibilityRuling[]
  protectedInputs: readonly V137AuditProtectedInput[]
}

export interface V137AuditReproductionReceipt {
  schemaVersion: "v1.37-audit-reproduction-receipt-v1"
  status: "passed-exact"
  probeIds: readonly ProbeId[]
  hashes: Readonly<{
    reproductionSourceSha256: `sha256:${string}`
    freshResultSha256: `sha256:${string}`
    retainedResultSha256: `sha256:${string}`
    retainedRulingsSha256: `sha256:${string}`
    protectedInputsSha256: `sha256:${string}`
    joinSha256: `sha256:${string}`
  }>
}

const paths = {
  reproduction:
    ".planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts",
  retainedResult: ".planning/artifacts/v1.37-phase-257-core-rules-result.json",
  retainedMarkdown: ".planning/artifacts/v1.37-phase-257-core-rules-result.md",
} as const

const expectedHashes = {
  reproduction:
    "sha256:b269678612c3e7fee9416a5df45b9d20ca78cd575c60d8ed8472dfdc8a45f706",
  retainedResult:
    "sha256:cce93a1d6aa7d9fed752e7259eb1d283f1faa5784eaa70b86ce2d532469b7000",
  retainedMarkdown:
    "sha256:b9aab66dfaf53144d026de8f3e6bc14f55211505c645ea7ba861b0ca3c06364c",
} as const

const protectedInputHashes = {
  ".planning/artifacts/v1.37-core-rules-audit-baseline.json":
    "sha256:f069de5950030c59a04b9bf671ff7d149a54461690b766f8fd385a2c4dbb1a0b",
  ".planning/artifacts/v1.37-core-rules-audit-baseline.md":
    "sha256:4ebee5c0be4cdb4b554ce8f56483b8c5a11a3e3630c80e3f30460021ad09bdf2",
  ".planning/artifacts/v1.37-phase-257-red-baseline.json":
    "sha256:bd2a7575282ca7df86bf3a6fc2602a9797660b0ab27bdb0f2def203ddba58f0d",
  ".planning/artifacts/v1.37-protected-working-tree-baseline.json":
    "sha256:02cf7e6cc192d9cd8168ece3e28d75aeb23f4b789f3b315b25109b96a059ef70",
  "packages/engine/src/compatibility-fixtures.test.ts":
    "sha256:f443512e372eae98a16f65dcc8ea5e36bb23bdd8fb197431a890ea77b65eeb1a",
  "packages/replay/src/historical-v1-4.test.ts":
    "sha256:73a5f1b5ca9b8f23d169b5f8008399bc41a41e4152786b2e97988613dc68f111",
  ".planning/artifacts/v1.37-v1.36-historical-proof-dispatch.json":
    "sha256:108e3df9c07ed3f99a4907a8ef455ee8653169dffd1a9e4797c10a3621745e12",
} as const satisfies Readonly<Record<string, `sha256:${string}`>>

const exactRulings: readonly V137AuditCompatibilityRuling[] = Object.freeze([
  {
    schemaVersion: "v1.37-exact-compatibility-ruling-v1",
    rulingId: "phase-258-bounded-json-depth-repair",
    decision: "RABI-01/RABI-02",
    probe: "deepValidation",
    priorObservation: "threw:RangeError",
    approvedObservation: "rejected:MAX_DEPTH_EXCEEDED:player_violation",
    matchState: "unchanged",
    actionLegality: "unchanged",
    canonicalEventOrder: "unchanged",
    outcome: "unchanged",
    terminalSemantics: "unchanged",
    strategyObservations: "unchanged",
    fixtures: [
      "packages/spec/src/canonical-json-boundaries.test.ts",
      ".planning/artifacts/v1.37-runtime-abi-calibration.json",
    ],
    requirements: ["RABI-01", "RABI-02", "KERN-11"],
    tupleVersions: ["canonical-json-v1.1", "strategy-runtime-abi-v1.17"],
    approvalSource:
      ".planning/phases/258-canonical-json-failure-semantics-and-artifact-identity/258-05-SUMMARY.md",
  },
])

const inputKeys = [
  "freshObservations",
  "protectedInputs",
  "reproductionSourceBytes",
  "retainedResultBytes",
  "retainedResultMarkdownBytes",
  "rulings",
] as const
const rulingKeys = [
  "actionLegality",
  "approvalSource",
  "approvedObservation",
  "canonicalEventOrder",
  "decision",
  "fixtures",
  "matchState",
  "outcome",
  "priorObservation",
  "probe",
  "requirements",
  "rulingId",
  "schemaVersion",
  "strategyObservations",
  "terminalSemantics",
  "tupleVersions",
] as const

const fail = (code: string): never => {
  throw new TypeError(code)
}

const sha256 = (value: string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const exactKeys = (value: object, expected: readonly string[]): boolean => {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index])
}

const canonical = (value: unknown): string => JSON.stringify(value)
const equal = (left: unknown, right: unknown): boolean => canonical(left) === canonical(right)

const validateRuling = (value: unknown): V137AuditCompatibilityRuling => {
  if (value === null || typeof value !== "object" || Array.isArray(value) || !exactKeys(value, rulingKeys)) {
    fail("V137_AUDIT_RULING_SCHEMA_INVALID")
  }
  const ruling = value as V137AuditCompatibilityRuling
  if (
    ruling.schemaVersion !== "v1.37-exact-compatibility-ruling-v1" ||
    !V137_AUDIT_PROBE_IDS.includes(ruling.probe) ||
    !ruling.rulingId ||
    !ruling.decision ||
    !ruling.approvalSource ||
    !Array.isArray(ruling.fixtures) ||
    ruling.fixtures.length === 0 ||
    !Array.isArray(ruling.requirements) ||
    ruling.requirements.length === 0 ||
    !Array.isArray(ruling.tupleVersions) ||
    ruling.tupleVersions.length === 0 ||
    [ruling.matchState, ruling.actionLegality, ruling.canonicalEventOrder, ruling.outcome, ruling.terminalSemantics, ruling.strategyObservations].some(
      (surface) => surface !== "unchanged" && surface !== "changed",
    )
  ) {
    fail("V137_AUDIT_RULING_SCHEMA_INVALID")
  }
  return ruling
}

export const createV137AuditReproductionFixture = (
  repoRoot = process.cwd(),
): V137AuditReproductionInput => {
  const read = (repoPath: string): string =>
    readFileSync(path.resolve(repoRoot, repoPath), "utf8")
  const retainedResultBytes = read(paths.retainedResult)
  const retained = JSON.parse(retainedResultBytes) as { observations: Observations }
  const freshObservations = { ...retained.observations }
  freshObservations.deepValidation =
    "rejected:MAX_DEPTH_EXCEEDED:player_violation"
  return {
    reproductionSourceBytes: read(paths.reproduction),
    freshObservations,
    retainedResultBytes,
    retainedResultMarkdownBytes: read(paths.retainedMarkdown),
    rulings: exactRulings,
    protectedInputs: Object.entries(protectedInputHashes).map(
      ([repoPath, expectedSha256]) => ({
        path: repoPath,
        bytes: read(repoPath),
        expectedSha256,
      }),
    ),
  }
}

export const analyzeV137AuditReproduction = (
  input: V137AuditReproductionInput,
): V137AuditReproductionReceipt => {
  if (input === null || typeof input !== "object" || !exactKeys(input, inputKeys)) {
    fail("V137_AUDIT_INPUT_SCHEMA_INVALID")
  }
  if (sha256(input.reproductionSourceBytes) !== expectedHashes.reproduction) fail("V137_AUDIT_REPRODUCTION_SOURCE_DRIFT")
  if (sha256(input.retainedResultBytes) !== expectedHashes.retainedResult) fail("V137_AUDIT_RETAINED_RESULT_DRIFT")
  if (sha256(input.retainedResultMarkdownBytes) !== expectedHashes.retainedMarkdown) fail("V137_AUDIT_RETAINED_RESULT_DRIFT")

  const freshKeys = Object.keys(input.freshObservations)
  if (!exactKeys(input.freshObservations, V137_AUDIT_PROBE_IDS)) fail("V137_AUDIT_PROBE_INVENTORY_INVALID")
  if (freshKeys.length !== 7) fail("V137_AUDIT_PROBE_INVENTORY_INVALID")

  const expectedProtectedPaths = Object.keys(protectedInputHashes)
  if (
    input.protectedInputs.length !== expectedProtectedPaths.length ||
    input.protectedInputs.some((item, index) =>
      item.path !== expectedProtectedPaths[index] ||
      item.expectedSha256 !== protectedInputHashes[item.path as keyof typeof protectedInputHashes] ||
      sha256(item.bytes) !== item.expectedSha256,
    )
  ) fail("V137_AUDIT_PROTECTED_INPUT_DRIFT")

  const rulings = input.rulings.map(validateRuling)
  if (canonical(rulings) !== canonical(exactRulings)) fail("V137_AUDIT_RULING_DRIFT")
  const retained = JSON.parse(input.retainedResultBytes) as { observations?: Observations }
  if (retained.observations === undefined || !exactKeys(retained.observations, V137_AUDIT_PROBE_IDS)) fail("V137_AUDIT_RETAINED_RESULT_INVALID")

  for (const probe of V137_AUDIT_PROBE_IDS) {
    const prior = retained.observations[probe]
    const fresh = input.freshObservations[probe]
    if (equal(prior, fresh)) continue
    const ruling = rulings.find(
      (candidate) =>
        candidate.probe === probe &&
        equal(candidate.priorObservation, prior) &&
        equal(candidate.approvedObservation, fresh),
    )
    if (ruling === undefined) fail("V137_AUDIT_OBSERVATION_UNAPPROVED")
  }

  const hashes = {
    reproductionSourceSha256: sha256(input.reproductionSourceBytes),
    freshResultSha256: sha256(canonical(input.freshObservations)),
    retainedResultSha256: sha256(input.retainedResultBytes),
    retainedRulingsSha256: sha256(canonical(rulings)),
    protectedInputsSha256: sha256(
      canonical(input.protectedInputs.map(({ path: repoPath, expectedSha256 }) => ({ path: repoPath, sha256: expectedSha256 }))),
    ),
  }
  return {
    schemaVersion: "v1.37-audit-reproduction-receipt-v1",
    status: "passed-exact",
    probeIds: V137_AUDIT_PROBE_IDS,
    hashes: {
      ...hashes,
      joinSha256: sha256(canonical(hashes)),
    },
  }
}

export const runV137AuditReproductionGate = (
  repoRoot = process.cwd(),
): V137AuditReproductionReceipt => {
  const fixture = createV137AuditReproductionFixture(repoRoot)
  const command = spawnSync(
    process.execPath,
    ["--import", "tsx", paths.reproduction],
    { cwd: repoRoot, encoding: "utf8", env: process.env },
  )
  if (command.status !== 0 || command.signal !== null || command.stderr.trim() !== "") {
    fail("V137_AUDIT_REPRODUCTION_FAILED")
  }
  let freshObservations: Observations
  try {
    freshObservations = JSON.parse(command.stdout) as Observations
  } catch {
    fail("V137_AUDIT_REPRODUCTION_OUTPUT_INVALID")
  }
  return analyzeV137AuditReproduction({ ...fixture, freshObservations })
}

const isMain =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  try {
    const receipt = runV137AuditReproductionGate()
    process.stdout.write(`${JSON.stringify(receipt)}\n`)
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : "V137_AUDIT_GATE_FAILED"}\n`)
    process.exitCode = 1
  }
}
