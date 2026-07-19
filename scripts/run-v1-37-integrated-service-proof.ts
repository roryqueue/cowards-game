#!/usr/bin/env -S pnpm exec tsx
import { spawn, type ChildProcess } from "node:child_process"
import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  existsSync,
  lstatSync,
  readFileSync,
} from "node:fs"
import path from "node:path"
import { clearTimeout, setTimeout } from "node:timers"
import { fileURLToPath } from "node:url"
import {
  V137_INTEGRATED_PROOF_SCENARIOS,
  type V137IntegratedProofScenario,
} from "./lib/v1-37-integrated-proof-manifest.js"
import type { V137PublicRestrictedEvidenceRef } from "./lib/v1-37-restricted-evidence-store.js"

const SHA256 = /^sha256:[0-9a-f]{64}$/u
const CURRENT_SELECTION_ROOT =
  "sha256:17954660f17c83e60e5d7df0b589cd89cf6b00eba4d4963e2d4bf43bc71c6ea2" as const

export const V137_INTEGRATED_SERVICE_PROOF_CONTROL_PATH =
  "manifests/v1.37-integrated-service-proof.json" as const

export interface V137IntegratedServiceEnvironment {
  databaseUrl: string
  goDatabaseUrl: string
  signedConformanceDatabaseUrl: string
  restrictedRoot: string
}

export interface V137IntegratedServiceTopology {
  postgres: "healthy" | "unhealthy"
  redis: "healthy" | "unhealthy"
  goOwner: "ready" | "unavailable"
  runtimeServiceOwner: "ready" | "unavailable"
  databaseHead: {
    state: string
    revision: number
    activeSelectionRoot: string
    pendingIntent: boolean
    compensation: boolean
  }
}

export interface V137OwnedProcess {
  pid: number
  label: string
  owned: boolean
}

export interface V137CommandReceipt {
  id: string
  status: "passed"
  exitCode: 0
  stdoutSha256: `sha256:${string}`
  stderrSha256: `sha256:${string}`
}

export interface V137CommandSpec {
  id: string
  executable: string
  args: readonly string[]
  cwd: string
  environment: Record<string, string>
  timeoutMs: number
}

export const V137_INTEGRATED_SERVICE_SCENARIOS = Object.freeze(
  V137_INTEGRATED_PROOF_SCENARIOS.filter(
    (scenario) =>
      scenario.group === "four-lane-positive" ||
      scenario.group === "typed-failures" ||
      scenario.group === "identity-drift" ||
      (scenario.group === "chronicle-replay" &&
        !scenario.id.startsWith("historical-")),
  ),
)

type V137Language = "typescript" | "python" | "rust" | "zig"

export interface V137IntegratedServiceLaneRun {
  runId: string
  resultRootSha256: `sha256:${string}`
  evidenceRootSha256: `sha256:${string}`
  identityManifestRoot: `sha256:${string}`
  toolchainSha256: `sha256:${string}`
  artifactSha256: `sha256:${string}`
  containmentPolicySha256: `sha256:${string}`
  complete: true
  freshProcess: true
  freshWorkspace: true
  skippedCaseCount: 0
  unsupportedCaseCount: 0
  fallbackUsed: false
  syntheticEvidence: false
}

export interface V137IntegratedServiceLane {
  languageId: V137Language
  laneId: string
  certificateId: string
  certificateSha256: `sha256:${string}`
  functionalConformance: "passed"
  containmentEvidence: "unattested"
  counted: false
  limitationCode: "deployable-containment-unattested"
  runs: V137IntegratedServiceLaneRun[]
}

export interface V137NoMutationRoots {
  gameplaySha256: `sha256:${string}`
  memorySha256: `sha256:${string}`
  resultSha256: `sha256:${string}`
  standingsSha256: `sha256:${string}`
}

export interface V137IntegratedServiceScenarioReceipt {
  id: string
  expectedResultClass: V137IntegratedProofScenario["expectedResultClass"]
  status: "passed"
  failureOwner: "none" | "player" | "system"
  before: V137NoMutationRoots
  after: V137NoMutationRoots
  observationRootSha256: `sha256:${string}`
  restrictedEvidenceRef: V137PublicRestrictedEvidenceRef
}

export interface V137IntegratedServiceReceipt {
  schemaVersion: "v1.37-integrated-service-receipt-v1"
  status: "passed-functional-containment-unattested"
  authority: {
    semanticAuthorityKey: "runtime-v1.19"
    tupleId: `sha256:${string}`
    runtimeAbiVersion: "strategy-runtime-abi-v1.19"
    chronicleVersion: "chronicle-recorder-current-events-v1.37-candidate-1"
    databaseSelectionRoot: typeof CURRENT_SELECTION_ROOT
  }
  topology: V137IntegratedServiceTopology
  lanes: V137IntegratedServiceLane[]
  scenarios: V137IntegratedServiceScenarioReceipt[]
  chronicle: {
    semanticValidation: "passed"
    eventVocabulary: "current-exact"
    chronicleRootSha256: `sha256:${string}`
    reconstructionRootSha256: `sha256:${string}`
    replayRootSha256: `sha256:${string}`
  }
  proofDataHandoffRef: V137PublicRestrictedEvidenceRef
  serviceTraceRef: V137PublicRestrictedEvidenceRef
  inputRootSha256: `sha256:${string}`
}

const fail = (code: string): never => {
  throw new TypeError(code)
}

const exactKeys = (value: unknown, expected: readonly string[]): boolean => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false
  }
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  return (
    actual.length === wanted.length &&
    actual.every((key, index) => key === wanted[index])
  )
}

const validHash = (value: unknown): value is `sha256:${string}` =>
  typeof value === "string" && SHA256.test(value)

const validRestrictedRef = (
  value: unknown,
): value is V137PublicRestrictedEvidenceRef =>
  exactKeys(value, [
    "schemaVersion",
    "sha256",
    "class",
    "attestationSha256",
    "retentionClass",
    "availabilityPosture",
  ]) &&
  (value as V137PublicRestrictedEvidenceRef).schemaVersion ===
    "v1.37-restricted-evidence-ref-v1" &&
  validHash((value as V137PublicRestrictedEvidenceRef).sha256) &&
  validHash((value as V137PublicRestrictedEvidenceRef).attestationSha256) &&
  ["command-receipt", "service-trace", "rollback-trace", "privacy-scan"].includes(
    (value as V137PublicRestrictedEvidenceRef).class,
  ) &&
  (value as V137PublicRestrictedEvidenceRef).retentionClass ===
    "certificate-plus-audit-window" &&
  (value as V137PublicRestrictedEvidenceRef).availabilityPosture === "available"

const validMutationRoots = (value: unknown): value is V137NoMutationRoots =>
  exactKeys(value, [
    "gameplaySha256",
    "memorySha256",
    "resultSha256",
    "standingsSha256",
  ]) &&
  Object.values(value as V137NoMutationRoots).every(validHash)

const sameMutationRoots = (
  left: V137NoMutationRoots,
  right: V137NoMutationRoots,
): boolean => JSON.stringify(left) === JSON.stringify(right)

const receiptKeys = [
  "schemaVersion",
  "status",
  "authority",
  "topology",
  "lanes",
  "scenarios",
  "chronicle",
  "proofDataHandoffRef",
  "serviceTraceRef",
  "inputRootSha256",
] as const

export const validateV137IntegratedServiceReceipt = (
  input: unknown,
): V137IntegratedServiceReceipt => {
  if (!exactKeys(input, receiptKeys)) {
    fail("V137_SERVICE_PROOF_RECEIPT_SHAPE")
  }
  const receipt = input as V137IntegratedServiceReceipt
  if (
    receipt.schemaVersion !== "v1.37-integrated-service-receipt-v1" ||
    receipt.status !== "passed-functional-containment-unattested" ||
    !exactKeys(receipt.authority, [
      "semanticAuthorityKey",
      "tupleId",
      "runtimeAbiVersion",
      "chronicleVersion",
      "databaseSelectionRoot",
    ]) ||
    receipt.authority.semanticAuthorityKey !== "runtime-v1.19" ||
    !validHash(receipt.authority.tupleId) ||
    receipt.authority.runtimeAbiVersion !== "strategy-runtime-abi-v1.19" ||
    receipt.authority.chronicleVersion !==
      "chronicle-recorder-current-events-v1.37-candidate-1" ||
    receipt.authority.databaseSelectionRoot !== CURRENT_SELECTION_ROOT ||
    !validHash(receipt.inputRootSha256) ||
    !validRestrictedRef(receipt.proofDataHandoffRef) ||
    receipt.proofDataHandoffRef.class !== "service-trace" ||
    !validRestrictedRef(receipt.serviceTraceRef) ||
    receipt.serviceTraceRef.class !== "command-receipt"
  ) {
    fail("V137_SERVICE_PROOF_RECEIPT_INVALID")
  }
  assertV137IntegratedServiceTopology(receipt.topology)

  const languages: readonly V137Language[] = [
    "typescript",
    "python",
    "rust",
    "zig",
  ]
  if (
    !Array.isArray(receipt.lanes) ||
    receipt.lanes.length !== languages.length ||
    receipt.lanes.some((lane, index) => {
      if (
        !exactKeys(lane, [
          "languageId",
          "laneId",
          "certificateId",
          "certificateSha256",
          "functionalConformance",
          "containmentEvidence",
          "counted",
          "limitationCode",
          "runs",
        ]) ||
        lane.languageId !== languages[index] ||
        typeof lane.laneId !== "string" ||
        lane.laneId.length === 0 ||
        typeof lane.certificateId !== "string" ||
        lane.certificateId.length === 0 ||
        !validHash(lane.certificateSha256) ||
        lane.functionalConformance !== "passed" ||
        lane.containmentEvidence !== "unattested" ||
        lane.limitationCode !== "deployable-containment-unattested" ||
        !Array.isArray(lane.runs) ||
        lane.runs.length !== 3
      ) {
        return true
      }
      if (lane.counted !== false) {
        fail("V137_SERVICE_PROOF_COUNTED_OVERCLAIM")
      }
      const runIds = new Set<string>()
      const processIdentityRoots = new Set<string>()
      return lane.runs.some((run) => {
        if (
          !exactKeys(run, [
            "runId",
            "resultRootSha256",
            "evidenceRootSha256",
            "identityManifestRoot",
            "toolchainSha256",
            "artifactSha256",
            "containmentPolicySha256",
            "complete",
            "freshProcess",
            "freshWorkspace",
            "skippedCaseCount",
            "unsupportedCaseCount",
            "fallbackUsed",
            "syntheticEvidence",
          ]) ||
          typeof run.runId !== "string" ||
          run.runId.length === 0 ||
          [
            run.resultRootSha256,
            run.evidenceRootSha256,
            run.identityManifestRoot,
            run.toolchainSha256,
            run.artifactSha256,
            run.containmentPolicySha256,
          ].some((value) => !validHash(value)) ||
          !run.complete ||
          !run.freshProcess ||
          !run.freshWorkspace ||
          run.skippedCaseCount !== 0 ||
          run.unsupportedCaseCount !== 0 ||
          run.fallbackUsed ||
          run.syntheticEvidence
        ) {
          return true
        }
        runIds.add(run.runId)
        processIdentityRoots.add(
          `${run.runId}:${run.identityManifestRoot}:${run.evidenceRootSha256}`,
        )
        return false
      }) || runIds.size !== 3 || processIdentityRoots.size !== 3
    })
  ) {
    fail("V137_SERVICE_PROOF_LANE_INVALID")
  }

  const expectedScenarioIds = V137_INTEGRATED_SERVICE_SCENARIOS.map(
    ({ id }) => id,
  )
  if (
    !Array.isArray(receipt.scenarios) ||
    JSON.stringify(receipt.scenarios.map(({ id }) => id)) !==
      JSON.stringify(expectedScenarioIds)
  ) {
    fail("V137_SERVICE_PROOF_SCENARIO_INVENTORY")
  }
  receipt.scenarios.forEach((scenario, index) => {
    const expected = V137_INTEGRATED_SERVICE_SCENARIOS[index]!
    if (
      !exactKeys(scenario, [
        "id",
        "expectedResultClass",
        "status",
        "failureOwner",
        "before",
        "after",
        "observationRootSha256",
        "restrictedEvidenceRef",
      ]) ||
      scenario.id !== expected.id ||
      scenario.expectedResultClass !== expected.expectedResultClass ||
      scenario.status !== "passed" ||
      !validMutationRoots(scenario.before) ||
      !validMutationRoots(scenario.after) ||
      !validHash(scenario.observationRootSha256) ||
      !validRestrictedRef(scenario.restrictedEvidenceRef) ||
      scenario.restrictedEvidenceRef.class !== expected.restrictedEvidenceClass
    ) {
      fail("V137_SERVICE_PROOF_SCENARIO_INVALID")
    }
    const expectedOwner =
      expected.expectedResultClass === "system-failure"
        ? "system"
        : expected.expectedResultClass === "player-violation"
          ? "player"
          : "none"
    if (scenario.failureOwner !== expectedOwner) {
      fail("V137_SERVICE_PROOF_FAILURE_OWNER")
    }
    if (
      expected.expectedResultClass === "system-failure" &&
      !sameMutationRoots(scenario.before, scenario.after)
    ) {
      fail("V137_SERVICE_PROOF_SYSTEM_MUTATION")
    }
  })

  if (
    !exactKeys(receipt.chronicle, [
      "semanticValidation",
      "eventVocabulary",
      "chronicleRootSha256",
      "reconstructionRootSha256",
      "replayRootSha256",
    ]) ||
    receipt.chronicle.semanticValidation !== "passed" ||
    receipt.chronicle.eventVocabulary !== "current-exact" ||
    !validHash(receipt.chronicle.chronicleRootSha256) ||
    receipt.chronicle.chronicleRootSha256 !==
      receipt.chronicle.reconstructionRootSha256 ||
    receipt.chronicle.chronicleRootSha256 !==
      receipt.chronicle.replayRootSha256
  ) {
    fail("V137_SERVICE_PROOF_RECONSTRUCTION_MISMATCH")
  }
  return globalThis.structuredClone(receipt)
}

const fixtureHash = (label: string): `sha256:${string}` => sha256(`fixture:${label}`)

const fixtureRef = (
  evidenceClass: V137PublicRestrictedEvidenceRef["class"],
  label: string,
): V137PublicRestrictedEvidenceRef => ({
  schemaVersion: "v1.37-restricted-evidence-ref-v1",
  sha256: fixtureHash(`object:${label}`),
  class: evidenceClass,
  attestationSha256: fixtureHash(`attestation:${label}`),
  retentionClass: "certificate-plus-audit-window",
  availabilityPosture: "available",
})

export const createV137IntegratedServiceReceiptFixture =
  (): V137IntegratedServiceReceipt => {
    const roots: V137NoMutationRoots = {
      gameplaySha256: fixtureHash("gameplay"),
      memorySha256: fixtureHash("memory"),
      resultSha256: fixtureHash("result"),
      standingsSha256: fixtureHash("standings"),
    }
    const lanes = (["typescript", "python", "rust", "zig"] as const).map(
      (languageId): V137IntegratedServiceLane => ({
        languageId,
        laneId: `${languageId}-exact-v1.19`,
        certificateId: `certificate:${languageId}:v1.19`,
        certificateSha256: fixtureHash(`certificate:${languageId}`),
        functionalConformance: "passed",
        containmentEvidence: "unattested",
        counted: false,
        limitationCode: "deployable-containment-unattested",
        runs: [0, 1, 2].map((ordinal) => ({
          runId: `run:${languageId}:${ordinal}`,
          resultRootSha256: fixtureHash("lane-result"),
          evidenceRootSha256: fixtureHash(`lane-evidence:${languageId}`),
          identityManifestRoot: fixtureHash(`identity:${languageId}`),
          toolchainSha256: fixtureHash(`toolchain:${languageId}`),
          artifactSha256: fixtureHash(`artifact:${languageId}`),
          containmentPolicySha256: fixtureHash(`containment:${languageId}`),
          complete: true,
          freshProcess: true,
          freshWorkspace: true,
          skippedCaseCount: 0,
          unsupportedCaseCount: 0,
          fallbackUsed: false,
          syntheticEvidence: false,
        })),
      }),
    )
    const chronicleRoot = fixtureHash("chronicle-reconstruction-replay")
    return {
      schemaVersion: "v1.37-integrated-service-receipt-v1",
      status: "passed-functional-containment-unattested",
      authority: {
        semanticAuthorityKey: "runtime-v1.19",
        tupleId: fixtureHash("tuple"),
        runtimeAbiVersion: "strategy-runtime-abi-v1.19",
        chronicleVersion:
          "chronicle-recorder-current-events-v1.37-candidate-1",
        databaseSelectionRoot: CURRENT_SELECTION_ROOT,
      },
      topology: {
        postgres: "healthy",
        redis: "healthy",
        goOwner: "ready",
        runtimeServiceOwner: "ready",
        databaseHead: {
          state: "active-v1.19-finalized",
          revision: 2,
          activeSelectionRoot: CURRENT_SELECTION_ROOT,
          pendingIntent: false,
          compensation: false,
        },
      },
      lanes,
      scenarios: V137_INTEGRATED_SERVICE_SCENARIOS.map((scenario) => ({
        id: scenario.id,
        expectedResultClass: scenario.expectedResultClass,
        status: "passed",
        failureOwner:
          scenario.expectedResultClass === "system-failure"
            ? "system"
            : scenario.expectedResultClass === "player-violation"
              ? "player"
              : "none",
        before: { ...roots },
        after: { ...roots },
        observationRootSha256: fixtureHash(`scenario:${scenario.id}`),
        restrictedEvidenceRef: fixtureRef(
          scenario.restrictedEvidenceClass,
          scenario.id,
        ),
      })),
      chronicle: {
        semanticValidation: "passed",
        eventVocabulary: "current-exact",
        chronicleRootSha256: chronicleRoot,
        reconstructionRootSha256: chronicleRoot,
        replayRootSha256: chronicleRoot,
      },
      proofDataHandoffRef: fixtureRef("service-trace", "proof-data-handoff"),
      serviceTraceRef: fixtureRef("command-receipt", "service-trace"),
      inputRootSha256: fixtureHash("inputs"),
    }
  }

const sha256 = (value: Uint8Array | string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const isWithin = (parent: string, candidate: string): boolean =>
  candidate === parent || candidate.startsWith(`${parent}${path.sep}`)

const required = (
  environment: Record<string, string | undefined>,
  name: string,
  code: string,
): string => {
  const value = environment[name]?.trim()
  if (!value) fail(code)
  return value
}

export const validateV137IntegratedServiceEnvironment = (
  environment: Record<string, string | undefined>,
  repoRoot: string,
): V137IntegratedServiceEnvironment => {
  const databaseUrl = required(
    environment,
    "DATABASE_URL",
    "V137_SERVICE_PROOF_DATABASE_URL_REQUIRED",
  )
  const goDatabaseUrl = required(
    environment,
    "COWARDS_GO_BACKEND_TEST_DATABASE_URL",
    "V137_SERVICE_PROOF_GO_DATABASE_URL_REQUIRED",
  )
  const signedConformanceDatabaseUrl = required(
    environment,
    "COWARDS_V1_37_SIGNED_CONFORMANCE_TEST_DATABASE_URL",
    "V137_SERVICE_PROOF_SIGNED_DATABASE_URL_REQUIRED",
  )
  const restrictedRoot = path.resolve(
    required(
      environment,
      "COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT",
      "V137_SERVICE_PROOF_RESTRICTED_ROOT_REQUIRED",
    ),
  )
  if (
    databaseUrl !== goDatabaseUrl ||
    databaseUrl !== signedConformanceDatabaseUrl
  ) {
    fail("V137_SERVICE_PROOF_DSN_MISMATCH")
  }
  if (isWithin(path.resolve(repoRoot), restrictedRoot)) {
    fail("V137_SERVICE_PROOF_RESTRICTED_ROOT_IN_REPOSITORY")
  }
  if (existsSync(restrictedRoot) && lstatSync(restrictedRoot).isSymbolicLink()) {
    fail("V137_SERVICE_PROOF_RESTRICTED_ROOT_SYMLINK")
  }
  return Object.freeze({
    databaseUrl,
    goDatabaseUrl,
    signedConformanceDatabaseUrl,
    restrictedRoot,
  })
}

export const assertV137IntegratedServiceTopology = (
  topology: V137IntegratedServiceTopology,
): V137IntegratedServiceTopology => {
  if (
    topology.postgres !== "healthy" ||
    topology.redis !== "healthy" ||
    topology.goOwner !== "ready" ||
    topology.runtimeServiceOwner !== "ready"
  ) {
    fail("V137_SERVICE_PROOF_TOPOLOGY_UNHEALTHY")
  }
  const { databaseHead } = topology
  if (
    databaseHead.state !== "active-v1.19-finalized" ||
    databaseHead.revision !== 2 ||
    databaseHead.activeSelectionRoot !== CURRENT_SELECTION_ROOT ||
    databaseHead.pendingIntent ||
    databaseHead.compensation
  ) {
    fail("V137_SERVICE_PROOF_DATABASE_HEAD_MISMATCH")
  }
  return Object.freeze(globalThis.structuredClone(topology))
}

export const cleanupV137OwnedProcesses = async (
  processes: readonly V137OwnedProcess[],
  signal: (pid: number, signal: "SIGTERM") => Promise<void>,
): Promise<void> => {
  for (const process of [...processes].reverse()) {
    if (!process.owned || !Number.isSafeInteger(process.pid) || process.pid < 2) {
      continue
    }
    await signal(process.pid, "SIGTERM")
  }
}

export const runV137Command = (
  command: V137CommandSpec,
  onSpawn?: (child: ChildProcess) => void,
): Promise<V137CommandReceipt> =>
  new Promise((resolve, reject) => {
    const child = spawn(command.executable, [...command.args], {
      cwd: command.cwd,
      env: command.environment,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    })
    onSpawn?.(child)
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    let stdoutBytes = 0
    let stderrBytes = 0
    const maxBytes = 64 * 1024 * 1024
    const append = (target: Buffer[], chunk: Buffer, current: number): number => {
      const next = current + chunk.byteLength
      if (next > maxBytes) {
        child.kill("SIGTERM")
        fail("V137_SERVICE_PROOF_COMMAND_OUTPUT_LIMIT")
      }
      target.push(chunk)
      return next
    }
    child.stdout?.on("data", (chunk: Buffer) => {
      stdoutBytes = append(stdout, Buffer.from(chunk), stdoutBytes)
    })
    child.stderr?.on("data", (chunk: Buffer) => {
      stderrBytes = append(stderr, Buffer.from(chunk), stderrBytes)
    })
    const timeout = setTimeout(() => child.kill("SIGTERM"), command.timeoutMs)
    child.once("error", (error) => {
      clearTimeout(timeout)
      reject(error)
    })
    child.once("close", (code, signal) => {
      clearTimeout(timeout)
      if (code !== 0 || signal !== null) {
        reject(new TypeError(`V137_SERVICE_PROOF_COMMAND_FAILED:${command.id}`))
        return
      }
      resolve(
        Object.freeze({
          id: command.id,
          status: "passed",
          exitCode: 0,
          stdoutSha256: sha256(Buffer.concat(stdout)),
          stderrSha256: sha256(Buffer.concat(stderr)),
        }),
      )
    })
  })

export const hashV137ServiceInput = (repoRoot: string, relativePath: string) => {
  const absolute = path.join(repoRoot, relativePath)
  if (!existsSync(absolute) || lstatSync(absolute).isSymbolicLink()) {
    fail("V137_SERVICE_PROOF_INPUT_MISSING")
  }
  return sha256(readFileSync(absolute))
}

const isDirectRun =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectRun) {
  process.stderr.write("V137_SERVICE_PROOF_NOT_IMPLEMENTED\n")
  process.exitCode = 1
}
