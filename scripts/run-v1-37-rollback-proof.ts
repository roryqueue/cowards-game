#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { checkV136HistoricalProof } from "./check-v1-36-historical-proof.js"
import { runV137AuditReproductionGate } from "./check-v1-37-audit-reproduction.js"
import {
  createV137RestrictedEvidenceStore,
  v137RestrictedEvidenceAttestationRelativePath,
  v137RestrictedEvidenceObjectRelativePath,
  V137_RESTRICTED_EVIDENCE_ACCESS_LOG_RELATIVE_PATH,
  type V137PublicRestrictedEvidenceRef,
  type V137RestrictedEvidenceRecord,
} from "./lib/v1-37-restricted-evidence-store.js"

export const V137_ROLLBACK_PROOF_CONTROL_PATH =
  "control/v1.37-rollback-proof.json" as const

const scenarioIds = [
  "audit-current-exact",
  "lane-kill-switch-before-schedule",
  "certificate-stale-before-schedule",
  "lane-kill-switch-after-claim",
  "certificate-stale-after-claim",
  "completion-failure-before-chronicle",
  "completion-failure-after-chronicle",
  "completion-failure-after-match",
  "exact-idempotent-retry",
  "cohort-invalidation",
  "compensating-reversal",
  "standings-governance-recompute",
  "service-runtime-exact-tuple-rollback",
  "mixed-state-tuple-rejection",
  "historical-v1-4",
  "historical-v1-17",
  "historical-v1-36",
] as const

type ScenarioId = (typeof scenarioIds)[number]
type TupleDisposition =
  | "exact-current"
  | "explicit-prior-exact"
  | "explicit-original-dispatch"

export interface V137RollbackProofScenarioReceipt {
  id: ScenarioId
  status: "passed"
  tupleDisposition: TupleDisposition
  observationRootSha256: `sha256:${string}`
  publicLimitationCode:
    | "none"
    | "historical-semantics-preserved"
    | "prior-tuple-non-current"
  restrictedEvidenceRef: V137PublicRestrictedEvidenceRef
}

export interface V137RollbackProofReceipt {
  schemaVersion: "v1.37-rollback-proof-receipt-v1"
  status: "passed"
  scenarios: readonly V137RollbackProofScenarioReceipt[]
  deterministicRoots: Readonly<{
    first: `sha256:${string}`
    second: `sha256:${string}`
  }>
  aggregateRootSha256: `sha256:${string}`
}

export interface V137RollbackProofControl {
  schemaVersion: "v1.37-rollback-proof-control-v1"
  inputRootSha256: `sha256:${string}`
  receipt: V137RollbackProofReceipt
  records: readonly V137RestrictedEvidenceRecord[]
}

const SHA = /^sha256:[0-9a-f]{64}$/u
const receiptKeys = [
  "aggregateRootSha256",
  "deterministicRoots",
  "scenarios",
  "schemaVersion",
  "status",
] as const
const scenarioKeys = [
  "id",
  "observationRootSha256",
  "publicLimitationCode",
  "restrictedEvidenceRef",
  "status",
  "tupleDisposition",
] as const
const controlKeys = ["inputRootSha256", "receipt", "records", "schemaVersion"] as const
const inputPaths = [
  "scripts/run-v1-37-rollback-proof.ts",
  "scripts/run-v1-37-rollback-proof-cli.ts",
  "scripts/run-v1-37-rollback-proof.test.ts",
  "scripts/check-v1-37-audit-reproduction.ts",
  "scripts/check-v1-37-audit-reproduction.test.ts",
  "apps/go-backend/v1_37_release_rollback_test.go",
  "packages/persistence/src/v1-37-release-rollback.test.ts",
  "scripts/check-v1-36-historical-proof.ts",
  "packages/replay/src/historical-v1-4.test.ts",
  ".planning/artifacts/v1.37-v1.36-historical-proof-dispatch.json",
  ".planning/artifacts/v1.37-protected-working-tree-baseline.json",
  "package.json",
] as const

const fail = (code: string): never => {
  throw new TypeError(code)
}
const sha256 = (value: Uint8Array | string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const exactKeys = (value: object, keys: readonly string[]): boolean => {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index])
}
const canonical = (value: unknown): string => JSON.stringify(value)

const tupleDisposition = (id: ScenarioId): TupleDisposition =>
  id.startsWith("historical-")
    ? "explicit-original-dispatch"
    : id === "service-runtime-exact-tuple-rollback"
      ? "explicit-prior-exact"
      : "exact-current"

const limitation = (
  id: ScenarioId,
): V137RollbackProofScenarioReceipt["publicLimitationCode"] =>
  id.startsWith("historical-")
    ? "historical-semantics-preserved"
    : id === "service-runtime-exact-tuple-rollback"
      ? "prior-tuple-non-current"
      : "none"

const fixtureRef = (id: string): V137PublicRestrictedEvidenceRef => ({
  schemaVersion: "v1.37-restricted-evidence-ref-v1",
  sha256: sha256(`fixture:object:${id}`),
  class: id === "audit-current-exact" || id.startsWith("historical-")
    ? "command-receipt"
    : "rollback-trace",
  attestationSha256: sha256(`fixture:attestation:${id}`),
  retentionClass: "certificate-plus-audit-window",
  availabilityPosture: "available",
})

export const createV137RollbackProofReceiptFixture = (): V137RollbackProofReceipt => {
  const root = sha256("v1.37:rollback-proof:deterministic-fixture")
  const scenarios = scenarioIds.map((id) => ({
    id,
    status: "passed" as const,
    tupleDisposition: tupleDisposition(id),
    observationRootSha256: sha256(`fixture:observation:${id}`),
    publicLimitationCode: limitation(id),
    restrictedEvidenceRef: fixtureRef(id),
  }))
  return {
    schemaVersion: "v1.37-rollback-proof-receipt-v1",
    status: "passed",
    scenarios,
    deterministicRoots: { first: root, second: root },
    aggregateRootSha256: sha256(canonical({ root, scenarios })),
  }
}

export const validateV137RollbackProofReceipt = (
  input: unknown,
): V137RollbackProofReceipt => {
  if (input === null || typeof input !== "object" || Array.isArray(input) || !exactKeys(input, receiptKeys)) {
    fail("V137_ROLLBACK_RECEIPT_SCHEMA_INVALID")
  }
  const receipt = input as V137RollbackProofReceipt
  if (
    receipt.schemaVersion !== "v1.37-rollback-proof-receipt-v1" ||
    receipt.status !== "passed" ||
    !Array.isArray(receipt.scenarios) ||
    receipt.scenarios.length !== scenarioIds.length ||
    receipt.deterministicRoots === null ||
    typeof receipt.deterministicRoots !== "object" ||
    !exactKeys(receipt.deterministicRoots, ["first", "second"]) ||
    !SHA.test(receipt.deterministicRoots.first) ||
    receipt.deterministicRoots.first !== receipt.deterministicRoots.second ||
    !SHA.test(receipt.aggregateRootSha256)
  ) fail("V137_ROLLBACK_RECEIPT_SCHEMA_INVALID")
  receipt.scenarios.forEach((scenario, index) => {
    if (
      scenario === null ||
      typeof scenario !== "object" ||
      !exactKeys(scenario, scenarioKeys) ||
      scenario.id !== scenarioIds[index] ||
      scenario.status !== "passed" ||
      scenario.tupleDisposition !== tupleDisposition(scenario.id) ||
      scenario.publicLimitationCode !== limitation(scenario.id) ||
      !SHA.test(scenario.observationRootSha256) ||
      scenario.restrictedEvidenceRef.schemaVersion !== "v1.37-restricted-evidence-ref-v1" ||
      !SHA.test(scenario.restrictedEvidenceRef.sha256) ||
      !SHA.test(scenario.restrictedEvidenceRef.attestationSha256)
    ) fail("V137_ROLLBACK_SCENARIO_INVALID")
  })
  const expectedAggregate = sha256(
    canonical({
      root: receipt.deterministicRoots.first,
      scenarios: receipt.scenarios,
    }),
  )
  if (receipt.aggregateRootSha256 !== expectedAggregate) fail("V137_ROLLBACK_AGGREGATE_INVALID")
  return receipt
}

export const computeV137RollbackInputRoot = (repoRoot: string): `sha256:${string}` =>
  sha256(
    canonical(
      inputPaths.map((repoPath) => ({
        path: repoPath,
        sha256: sha256(readFileSync(path.resolve(repoRoot, repoPath))),
      })),
    ),
  )

type NormalizedRun = Readonly<{ id: string; tests: readonly string[] }>
type Command = Readonly<{ command: string; args: readonly string[]; cwd?: string }>

const run = (repoRoot: string, spec: Command): string => {
  const result = spawnSync(spec.command, [...spec.args], {
    cwd: path.resolve(repoRoot, spec.cwd ?? "."),
    env: process.env,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
  if (result.status !== 0 || result.signal !== null || result.stderr.trim() !== "") {
    fail("V137_ROLLBACK_COMMAND_FAILED")
  }
  return result.stdout
}

const normalizeVitest = (id: string, output: string): NormalizedRun => {
  let report: {
    success?: boolean
    numFailedTests?: number
    numPendingTests?: number
    numTodoTests?: number
    assertionResults?: unknown
    testResults?: Array<{ assertionResults?: Array<{ fullName?: unknown; status?: unknown }> }>
  }
  try { report = JSON.parse(output) as typeof report } catch { fail("V137_ROLLBACK_COMMAND_RECEIPT_INVALID") }
  if (
    report.success !== true ||
    report.numFailedTests !== 0 ||
    report.numPendingTests !== 0 ||
    report.numTodoTests !== 0
  ) fail("V137_ROLLBACK_COMMAND_INCOMPLETE")
  const assertions = report.testResults?.flatMap(({ assertionResults = [] }) => assertionResults) ?? []
  if (assertions.length === 0 || assertions.some(({ status }) => status !== "passed")) fail("V137_ROLLBACK_COMMAND_INCOMPLETE")
  return { id, tests: assertions.map(({ fullName }) => String(fullName)).sort() }
}

const normalizeGo = (id: string, output: string): NormalizedRun => {
  const events = output.split("\n").filter(Boolean).map((line) => {
    try { return JSON.parse(line) as { Action?: string; Test?: string } } catch { fail("V137_ROLLBACK_COMMAND_RECEIPT_INVALID") }
  })
  if (events.some(({ Action }) => Action === "fail" || Action === "skip")) fail("V137_ROLLBACK_COMMAND_INCOMPLETE")
  const tests = events.filter(({ Action, Test }) => Action === "pass" && Test).map(({ Test }) => Test!).sort()
  if (tests.length === 0) fail("V137_ROLLBACK_COMMAND_INCOMPLETE")
  return { id, tests }
}

const executeDeterministicRun = async (repoRoot: string): Promise<{
  root: `sha256:${string}`
  normalized: readonly NormalizedRun[]
}> => {
  const audit = runV137AuditReproductionGate(repoRoot)
  const persistence = normalizeVitest(
    "persistence-d11",
    run(repoRoot, {
      command: "pnpm",
      args: ["exec", "vitest", "run", "--maxWorkers=1", "--no-file-parallelism", "--reporter=json", "packages/persistence/src/v1-37-release-rollback.test.ts"],
    }),
  )
  const go = normalizeGo(
    "go-d11",
    run(repoRoot, {
      command: "go",
      args: ["test", "./...", "-run", "TestV137ReleaseRollback", "-count=1", "-json"],
      cwd: "apps/go-backend",
    }),
  )
  const historicalV14 = normalizeVitest(
    "historical-v1-4",
    run(repoRoot, {
      command: "pnpm",
      args: ["exec", "vitest", "run", "--maxWorkers=1", "--no-file-parallelism", "--reporter=json", "packages/replay/src/historical-v1-4.test.ts"],
    }),
  )
  const historicalV117 = normalizeVitest(
    "historical-v1-17",
    run(repoRoot, {
      command: "pnpm",
      args: ["exec", "vitest", "run", "--maxWorkers=1", "--no-file-parallelism", "--reporter=json", "packages/replay/src/record.test.ts", "packages/replay/src/validate.test.ts"],
    }),
  )
  const v136 = await checkV136HistoricalProof({ repoRoot })
  if (v136.findings.length !== 0 || v136.archivedValidators.length !== 4) fail("V137_ROLLBACK_HISTORICAL_V136_FAILED")
  const normalized: readonly NormalizedRun[] = [
    { id: "audit-current-exact", tests: [audit.hashes.joinSha256] },
    persistence,
    go,
    historicalV14,
    historicalV117,
    { id: "historical-v1-36", tests: v136.archivedValidators },
  ]
  return { root: sha256(canonical(normalized)), normalized }
}

const buildAndWrite = (
  repoRoot: string,
  restrictedRoot: string,
  deterministic: Readonly<{ first: `sha256:${string}`; second: `sha256:${string}` }>,
  evidenceByScenario: Readonly<Record<ScenarioId, unknown>>,
): V137RollbackProofControl => {
  process.env.COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT = restrictedRoot
  const store = createV137RestrictedEvidenceStore({ repoRoot, maxObjectBytes: 16 * 1024 * 1024 })
  const records: V137RestrictedEvidenceRecord[] = []
  const scenarios = scenarioIds.map((id) => {
    const bytes = Buffer.from(`${canonical({ schemaVersion: "v1.37-rollback-scenario-evidence-v1", id, evidence: evidenceByScenario[id] })}\n`)
    const record = store.writeEvidence({
      bytes,
      evidenceClass: id === "audit-current-exact" || id.startsWith("historical-") ? "command-receipt" : "rollback-trace",
      actorClass: "collector",
      latestBoundCertificateValidUntil: "2027-07-22T00:00:00.000Z",
    })
    records.push(record)
    return {
      id,
      status: "passed" as const,
      tupleDisposition: tupleDisposition(id),
      observationRootSha256: sha256(bytes),
      publicLimitationCode: limitation(id),
      restrictedEvidenceRef: record.reference,
    }
  })
  const receipt: V137RollbackProofReceipt = {
    schemaVersion: "v1.37-rollback-proof-receipt-v1",
    status: "passed",
    scenarios,
    deterministicRoots: deterministic,
    aggregateRootSha256: sha256(canonical({ root: deterministic.first, scenarios })),
  }
  validateV137RollbackProofReceipt(receipt)
  const control: V137RollbackProofControl = {
    schemaVersion: "v1.37-rollback-proof-control-v1",
    inputRootSha256: computeV137RollbackInputRoot(repoRoot),
    receipt,
    records,
  }
  const target = path.resolve(restrictedRoot, V137_ROLLBACK_PROOF_CONTROL_PATH)
  mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 })
  const temporary = `${target}.tmp-${process.pid}`
  writeFileSync(temporary, `${JSON.stringify(control)}\n`, { flag: "wx", mode: 0o600 })
  renameSync(temporary, target)
  return control
}

export const writeV137RollbackProofFixture = (
  repoRoot: string,
  restrictedRoot: string,
): V137RollbackProofControl => {
  const fixture = createV137RollbackProofReceiptFixture()
  return buildAndWrite(
    repoRoot,
    restrictedRoot,
    fixture.deterministicRoots,
    Object.fromEntries(scenarioIds.map((id) => [id, { fixture: true }])) as Record<ScenarioId, unknown>,
  )
}

export const writeV137RollbackProof = async (
  repoRoot: string,
  restrictedRoot: string,
): Promise<V137RollbackProofControl> => {
  for (const required of ["DATABASE_URL", "COWARDS_GO_BACKEND_TEST_DATABASE_URL"] as const) {
    if (!process.env[required]?.startsWith("postgresql://")) fail("V137_ROLLBACK_DATABASE_URL_REQUIRED")
  }
  if (process.env.COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF !== "1") fail("V137_ROLLBACK_INTEGRATED_PROOF_REQUIRED")
  const first = await executeDeterministicRun(repoRoot)
  const second = await executeDeterministicRun(repoRoot)
  if (first.root !== second.root) fail("V137_ROLLBACK_DETERMINISTIC_ROOT_MISMATCH")
  const evidence = Object.fromEntries(
    scenarioIds.map((id) => [id, { deterministicRoot: first.root, normalized: first.normalized }]),
  ) as Record<ScenarioId, unknown>
  return buildAndWrite(repoRoot, restrictedRoot, { first: first.root, second: second.root }, evidence)
}

const readControl = (restrictedRoot: string): V137RollbackProofControl => {
  const target = path.resolve(restrictedRoot, V137_ROLLBACK_PROOF_CONTROL_PATH)
  if (!existsSync(target)) fail("V137_ROLLBACK_CONTROL_MISSING")
  if (!lstatSync(target).isFile() || lstatSync(target).isSymbolicLink()) fail("V137_ROLLBACK_CONTROL_INVALID")
  let parsed: unknown
  try { parsed = JSON.parse(readFileSync(target, "utf8")) } catch { fail("V137_ROLLBACK_CONTROL_INVALID") }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed) || !exactKeys(parsed, controlKeys)) fail("V137_ROLLBACK_CONTROL_INVALID")
  return parsed as V137RollbackProofControl
}

export const checkV137RollbackProof = (
  repoRoot: string,
  restrictedRoot: string,
): V137RollbackProofReceipt => {
  const control = readControl(restrictedRoot)
  if (control.schemaVersion !== "v1.37-rollback-proof-control-v1") fail("V137_ROLLBACK_CONTROL_INVALID")
  if (control.inputRootSha256 !== computeV137RollbackInputRoot(repoRoot)) fail("V137_ROLLBACK_INPUT_STALE")
  const receipt = validateV137RollbackProofReceipt(control.receipt)
  if (control.records.length !== scenarioIds.length) fail("V137_ROLLBACK_RECORD_INVENTORY_INVALID")
  const accessPath = path.resolve(restrictedRoot, V137_RESTRICTED_EVIDENCE_ACCESS_LOG_RELATIVE_PATH)
  const access = existsSync(accessPath) ? readFileSync(accessPath, "utf8") : ""
  control.records.forEach((record, index) => {
    const scenario = receipt.scenarios[index]!
    if (canonical(record.reference) !== canonical(scenario.restrictedEvidenceRef)) fail("V137_ROLLBACK_RECORD_INVENTORY_INVALID")
    const object = readFileSync(path.resolve(restrictedRoot, v137RestrictedEvidenceObjectRelativePath(record.reference.sha256)))
    const attestation = readFileSync(path.resolve(restrictedRoot, v137RestrictedEvidenceAttestationRelativePath(record.reference.attestationSha256)))
    if (object.length !== record.byteLength || sha256(object) !== record.reference.sha256 || sha256(attestation) !== record.reference.attestationSha256) fail("V137_ROLLBACK_RECORD_DIGEST_INVALID")
    if (!access.split("\n").some((line) => line.includes(`\"action\":\"write\"`) && line.includes(record.reference.sha256))) fail("V137_ROLLBACK_WRITE_RECORD_MISSING")
  })
  return receipt
}
