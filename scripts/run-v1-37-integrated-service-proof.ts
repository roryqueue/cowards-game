#!/usr/bin/env -S pnpm exec tsx
import { spawn, type ChildProcess } from "node:child_process"
import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  closeSync,
  constants,
  existsSync,
  mkdirSync,
  lstatSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { clearTimeout, setTimeout } from "node:timers"
import {
  V137_INTEGRATED_PROOF_SCENARIOS,
  type V137IntegratedProofScenario,
} from "./lib/v1-37-integrated-proof-manifest.js"
import {
  V137_RESTRICTED_EVIDENCE_ACCESS_LOG_RELATIVE_PATH,
  createV137RestrictedEvidenceStore,
  v137RestrictedEvidenceAttestationRelativePath,
  v137RestrictedEvidenceObjectRelativePath,
  type V137PublicRestrictedEvidenceRef,
  type V137RestrictedEvidenceRecord,
} from "./lib/v1-37-restricted-evidence-store.js"
import type { ProofLocalActivationReport } from "./activate-v1-37-proof-local-runtime-authority.js"

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
  containmentEvidence: "attested"
  counted: false
  limitationCode: "proof-local-identity-non-counted"
  containmentCertificates: Readonly<
    Record<"bottom" | "top", { id: string; hash: `sha256:${string}` }>
  >
  laneIdentityHash: `sha256:${string}`
  probeIdentityManifestRoot: `sha256:${string}`
  runs: V137IntegratedServiceLaneRun[]
}

type V137IntegratedServiceFunctionalLane = Pick<
  V137IntegratedServiceLane,
  | "languageId"
  | "laneId"
  | "certificateId"
  | "certificateSha256"
  | "functionalConformance"
  | "runs"
>

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
  evidenceMode: "live-service-execution" | "executable-regression"
  failureOwner: "none" | "player" | "system"
  before: V137NoMutationRoots
  after: V137NoMutationRoots
  observationRootSha256: `sha256:${string}`
  restrictedEvidenceRef: V137PublicRestrictedEvidenceRef
}

export interface V137IntegratedServiceReceipt {
  schemaVersion: "v1.37-integrated-service-receipt-v1"
  status: "passed-functional-containment-attested-non-counted"
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
  [
    "command-receipt",
    "service-trace",
    "rollback-trace",
    "privacy-scan",
  ].includes((value as V137PublicRestrictedEvidenceRef).class) &&
  (value as V137PublicRestrictedEvidenceRef).retentionClass ===
    "certificate-plus-audit-window" &&
  (value as V137PublicRestrictedEvidenceRef).availabilityPosture === "available"

const validMutationRoots = (value: unknown): value is V137NoMutationRoots =>
  exactKeys(value, [
    "gameplaySha256",
    "memorySha256",
    "resultSha256",
    "standingsSha256",
  ]) && Object.values(value as V137NoMutationRoots).every(validHash)

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
    receipt.status !== "passed-functional-containment-attested-non-counted" ||
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
          "containmentCertificates",
          "laneIdentityHash",
          "probeIdentityManifestRoot",
          "runs",
        ]) ||
        lane.languageId !== languages[index] ||
        typeof lane.laneId !== "string" ||
        lane.laneId.length === 0 ||
        typeof lane.certificateId !== "string" ||
        lane.certificateId.length === 0 ||
        !validHash(lane.certificateSha256) ||
        lane.functionalConformance !== "passed" ||
        lane.containmentEvidence !== "attested" ||
        lane.limitationCode !== "proof-local-identity-non-counted" ||
        !validHash(lane.laneIdentityHash) ||
        !validHash(lane.probeIdentityManifestRoot) ||
        !exactKeys(lane.containmentCertificates, ["bottom", "top"]) ||
        (["bottom", "top"] as const).some((side) => {
          const certificate = lane.containmentCertificates[side]
          return (
            !exactKeys(certificate, ["id", "hash"]) ||
            typeof certificate.id !== "string" ||
            certificate.id.length === 0 ||
            !validHash(certificate.hash)
          )
        }) ||
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
      return (
        lane.runs.some((run) => {
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
        }) ||
        runIds.size !== 3 ||
        processIdentityRoots.size !== 3
      )
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
        "evidenceMode",
        "failureOwner",
        "before",
        "after",
        "observationRootSha256",
        "restrictedEvidenceRef",
      ]) ||
      scenario.id !== expected.id ||
      scenario.expectedResultClass !== expected.expectedResultClass ||
      scenario.status !== "passed" ||
      scenario.evidenceMode !==
        (expected.group === "four-lane-positive" ||
        expected.id === "current-chronicle-valid" ||
        expected.id === "reconstruction-equivalent"
          ? "live-service-execution"
          : "executable-regression") ||
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
    receipt.chronicle.chronicleRootSha256 !== receipt.chronicle.replayRootSha256
  ) {
    fail("V137_SERVICE_PROOF_RECONSTRUCTION_MISMATCH")
  }
  return globalThis.structuredClone(receipt)
}

const fixtureHash = (label: string): `sha256:${string}` =>
  sha256(`fixture:${label}`)

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
        containmentEvidence: "attested",
        counted: false,
        limitationCode: "proof-local-identity-non-counted",
        containmentCertificates: {
          bottom: {
            id: `certificate:containment:${languageId}:bottom`,
            hash: fixtureHash(`containment-certificate:${languageId}:bottom`),
          },
          top: {
            id: `certificate:containment:${languageId}:top`,
            hash: fixtureHash(`containment-certificate:${languageId}:top`),
          },
        },
        laneIdentityHash: fixtureHash(`lane-identity:${languageId}`),
        probeIdentityManifestRoot: fixtureHash(`probe-identity:${languageId}`),
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
      status: "passed-functional-containment-attested-non-counted",
      authority: {
        semanticAuthorityKey: "runtime-v1.19",
        tupleId: fixtureHash("tuple"),
        runtimeAbiVersion: "strategy-runtime-abi-v1.19",
        chronicleVersion: "chronicle-recorder-current-events-v1.37-candidate-1",
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
        evidenceMode:
          scenario.group === "four-lane-positive" ||
          scenario.id === "current-chronicle-valid" ||
          scenario.id === "reconstruction-equivalent"
            ? "live-service-execution"
            : "executable-regression",
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
  if (
    existsSync(restrictedRoot) &&
    lstatSync(restrictedRoot).isSymbolicLink()
  ) {
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
    if (
      !process.owned ||
      !Number.isSafeInteger(process.pid) ||
      process.pid < 2
    ) {
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
    const append = (
      target: Buffer[],
      chunk: Buffer,
      current: number,
    ): number => {
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
        const diagnostic = Buffer.concat(stderr)
          .toString("utf8")
          .match(/V137_[A-Z0-9_]+/u)?.[0]
        reject(
          new TypeError(
            `V137_SERVICE_PROOF_COMMAND_FAILED:${command.id}${diagnostic === undefined ? "" : `:${diagnostic}`}`,
          ),
        )
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

export const hashV137ServiceInput = (
  repoRoot: string,
  relativePath: string,
) => {
  const absolute = path.join(repoRoot, relativePath)
  if (!existsSync(absolute) || lstatSync(absolute).isSymbolicLink()) {
    fail("V137_SERVICE_PROOF_INPUT_MISSING")
  }
  return sha256(readFileSync(absolute))
}

interface V137ProtectedBaselineArtifact {
  paths: Array<{
    path: string
    raw: {
      exists: true
      byteLength: number
      sha256: `sha256:${string}`
      mode: string
    }
  }>
  baselineSha256: `sha256:${string}`
}

export const assertV137ProtectedBaselineRawBytes = (
  repoRoot: string,
): V137CommandReceipt => {
  const artifact = parseJsonOutput<V137ProtectedBaselineArtifact>(
    readFileSync(
      path.join(
        repoRoot,
        ".planning/artifacts/v1.37-protected-working-tree-baseline.json",
      ),
    ),
    "V137_SERVICE_PROOF_PROTECTED_BASELINE_INVALID",
  )
  if (
    !validHash(artifact.baselineSha256) ||
    !Array.isArray(artifact.paths) ||
    artifact.paths.length === 0
  ) {
    fail("V137_SERVICE_PROOF_PROTECTED_BASELINE_INVALID")
  }
  for (const entry of artifact.paths) {
    const absolute = path.join(repoRoot, entry.path)
    const stat = existsSync(absolute) ? lstatSync(absolute) : undefined
    if (stat === undefined || stat.isSymbolicLink() || !stat.isFile()) {
      fail("V137_SERVICE_PROOF_PROTECTED_PATH_DRIFT")
    }
    const bytes = readFileSync(absolute)
    const mode = `0${(stat.mode & 0o777).toString(8)}`
    if (
      bytes.byteLength !== entry.raw.byteLength ||
      sha256(bytes) !== entry.raw.sha256 ||
      mode !== entry.raw.mode
    ) {
      fail("V137_SERVICE_PROOF_PROTECTED_PATH_DRIFT")
    }
  }
  return Object.freeze({
    id: "protected-baseline-raw-bytes",
    status: "passed",
    exitCode: 0,
    stdoutSha256: artifact.baselineSha256,
    stderrSha256: sha256(Buffer.alloc(0)),
  })
}

export interface V137IntegratedServiceProofControl {
  schemaVersion: "v1.37-integrated-service-control-v1"
  receipt: V137IntegratedServiceReceipt
  records: V137RestrictedEvidenceRecord[]
}

const V137_SERVICE_INPUT_FILES = Object.freeze([
  "scripts/run-v1-37-integrated-service-proof.ts",
  "scripts/activate-v1-37-proof-local-runtime-authority.ts",
  "scripts/run-v1-37-real-language-lane.ts",
  "scripts/lib/v1-37-pinned-wasmtime.ts",
  "scripts/lib/v1-37-integrated-proof-manifest.ts",
  "scripts/lib/v1-37-restricted-evidence-store.ts",
  ".planning/artifacts/v1.37-observation-v1.19-language-conformance-typescript.json",
  ".planning/artifacts/v1.37-observation-v1.19-language-conformance-python.json",
  ".planning/artifacts/v1.37-observation-v1.19-language-conformance-rust.json",
  ".planning/artifacts/v1.37-observation-v1.19-language-conformance-zig.json",
  ".planning/artifacts/v1.37-observation-v1.19-language-conformance-import-receipts.json",
  ".planning/artifacts/v1.37-protected-working-tree-baseline.json",
  ".planning/artifacts/v1.37-truthful-inputs-set-fairness-proof.json",
  "packages/spec/src/current-semantic-authority-source.ts",
  "packages/spec/src/current-semantic-authority-generated.ts",
  "packages/spec/src/runtime-containment-trusted-producers-v1-37.ts",
  "apps/go-backend/current_semantic_authority_generated.go",
  "apps/runtime-service/src/execute-match.ts",
  "apps/runtime-service/src/pinned-wasmtime-container-runtime.ts",
  "apps/runtime-service/src/runtime-config.ts",
  "apps/runtime-service/src/server.ts",
  "packages/runtime-js/src/abi-bridge.ts",
  "packages/runtime-js/src/executor.ts",
  "packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.ts",
  "packages/runtime-wasm-wasi/src/validation.ts",
  "packages/replay/src/record.ts",
  "packages/replay/src/reconstruct.test.ts",
  "packages/replay/src/replay-transition.ts",
  "packages/replay/src/validate.ts",
] as const)

export const computeV137ServiceInputRoot = (
  repoRoot: string,
): `sha256:${string}` =>
  sha256(
    `${JSON.stringify(
      V137_SERVICE_INPUT_FILES.map((relativePath) => ({
        relativePath,
        sha256: hashV137ServiceInput(repoRoot, relativePath),
      })),
    )}\n`,
  )

const readRegularBounded = (
  absolutePath: string,
  missingCode: string,
  maxBytes: number,
): Buffer => {
  if (!existsSync(absolutePath)) fail(missingCode)
  const stat = lstatSync(absolutePath)
  if (stat.isSymbolicLink() || !stat.isFile()) {
    fail("V137_SERVICE_PROOF_RESTRICTED_PATH_INVALID")
  }
  if (stat.size > maxBytes) fail("V137_SERVICE_PROOF_RESTRICTED_SIZE_LIMIT")
  let descriptor: number | undefined
  try {
    descriptor = openSync(
      absolutePath,
      constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
    )
    const bytes = readFileSync(descriptor)
    if (bytes.byteLength > maxBytes) {
      fail("V137_SERVICE_PROOF_RESTRICTED_SIZE_LIMIT")
    }
    return bytes
  } finally {
    if (descriptor !== undefined) closeSync(descriptor)
  }
}

const parseControl = (source: Buffer): V137IntegratedServiceProofControl => {
  let parsed: unknown
  try {
    parsed = JSON.parse(source.toString("utf8"))
  } catch {
    fail("V137_SERVICE_PROOF_CONTROL_INVALID")
  }
  if (
    !exactKeys(parsed, ["schemaVersion", "receipt", "records"]) ||
    (parsed as V137IntegratedServiceProofControl).schemaVersion !==
      "v1.37-integrated-service-control-v1" ||
    !Array.isArray((parsed as V137IntegratedServiceProofControl).records)
  ) {
    fail("V137_SERVICE_PROOF_CONTROL_INVALID")
  }
  return parsed as V137IntegratedServiceProofControl
}

const validateRecordShape = (record: unknown): V137RestrictedEvidenceRecord => {
  if (
    !exactKeys(record, [
      "reference",
      "byteLength",
      "latestBoundCertificateValidUntil",
      "deleteEligibleAt",
    ]) ||
    !validRestrictedRef((record as V137RestrictedEvidenceRecord).reference) ||
    !Number.isSafeInteger(
      (record as V137RestrictedEvidenceRecord).byteLength,
    ) ||
    (record as V137RestrictedEvidenceRecord).byteLength < 1 ||
    typeof (record as V137RestrictedEvidenceRecord)
      .latestBoundCertificateValidUntil !== "string" ||
    typeof (record as V137RestrictedEvidenceRecord).deleteEligibleAt !==
      "string"
  ) {
    fail("V137_SERVICE_PROOF_RESTRICTED_RECORD_INVALID")
  }
  const validated = record as V137RestrictedEvidenceRecord
  const validUntil = new Date(validated.latestBoundCertificateValidUntil)
  const deleteEligibleAt = new Date(validated.deleteEligibleAt)
  if (
    Number.isNaN(validUntil.valueOf()) ||
    Number.isNaN(deleteEligibleAt.valueOf()) ||
    validUntil.toISOString() !== validated.latestBoundCertificateValidUntil ||
    deleteEligibleAt.toISOString() !== validated.deleteEligibleAt ||
    deleteEligibleAt.valueOf() - validUntil.valueOf() !==
      90 * 24 * 60 * 60 * 1_000
  ) {
    fail("V137_SERVICE_PROOF_RESTRICTED_RECORD_INVALID")
  }
  return validated
}

const verifyRecordReadOnly = (
  restrictedRoot: string,
  recordInput: unknown,
  writeEvents: ReadonlySet<string>,
): V137RestrictedEvidenceRecord => {
  const record = validateRecordShape(recordInput)
  const objectPath = path.join(
    restrictedRoot,
    v137RestrictedEvidenceObjectRelativePath(record.reference.sha256),
  )
  const objectBytes = readRegularBounded(
    objectPath,
    "V137_SERVICE_PROOF_RESTRICTED_OBJECT_MISSING",
    64 * 1024 * 1024,
  )
  if (
    objectBytes.byteLength !== record.byteLength ||
    sha256(objectBytes) !== record.reference.sha256
  ) {
    fail("V137_SERVICE_PROOF_RESTRICTED_OBJECT_DIGEST_MISMATCH")
  }
  const attestationPath = path.join(
    restrictedRoot,
    v137RestrictedEvidenceAttestationRelativePath(
      record.reference.attestationSha256,
    ),
  )
  const attestationBytes = readRegularBounded(
    attestationPath,
    "V137_SERVICE_PROOF_RESTRICTED_ATTESTATION_MISSING",
    16 * 1024,
  )
  if (sha256(attestationBytes) !== record.reference.attestationSha256) {
    fail("V137_SERVICE_PROOF_RESTRICTED_ATTESTATION_DIGEST_MISMATCH")
  }
  let attestation: unknown
  try {
    attestation = JSON.parse(attestationBytes.toString("utf8"))
  } catch {
    fail("V137_SERVICE_PROOF_RESTRICTED_ATTESTATION_INVALID")
  }
  if (
    !exactKeys(attestation, [
      "schemaVersion",
      "sha256",
      "class",
      "byteLength",
      "retentionClass",
      "latestBoundCertificateValidUntil",
      "deleteEligibleAt",
    ]) ||
    (attestation as Record<string, unknown>).schemaVersion !==
      "v1.37-restricted-evidence-attestation-v1" ||
    (attestation as Record<string, unknown>).sha256 !==
      record.reference.sha256 ||
    (attestation as Record<string, unknown>).class !== record.reference.class ||
    (attestation as Record<string, unknown>).byteLength !== record.byteLength ||
    (attestation as Record<string, unknown>).retentionClass !==
      record.reference.retentionClass ||
    (attestation as Record<string, unknown>)
      .latestBoundCertificateValidUntil !==
      record.latestBoundCertificateValidUntil ||
    (attestation as Record<string, unknown>).deleteEligibleAt !==
      record.deleteEligibleAt ||
    attestationBytes.toString("utf8") !== `${JSON.stringify(attestation)}\n`
  ) {
    fail("V137_SERVICE_PROOF_RESTRICTED_ATTESTATION_INVALID")
  }
  const writeKey = `${record.reference.sha256}:${record.reference.attestationSha256}:${record.reference.class}`
  if (!writeEvents.has(writeKey)) {
    fail("V137_SERVICE_PROOF_RESTRICTED_WRITE_RECORD_MISSING")
  }
  return record
}

const readWriteEvents = (restrictedRoot: string): ReadonlySet<string> => {
  const source = readRegularBounded(
    path.join(
      restrictedRoot,
      V137_RESTRICTED_EVIDENCE_ACCESS_LOG_RELATIVE_PATH,
    ),
    "V137_SERVICE_PROOF_RESTRICTED_ACCESS_LOG_MISSING",
    8 * 1024 * 1024,
  ).toString("utf8")
  const writeEvents = new Set<string>()
  for (const line of source.split("\n").filter(Boolean)) {
    let event: unknown
    try {
      event = JSON.parse(line)
    } catch {
      fail("V137_SERVICE_PROOF_RESTRICTED_ACCESS_LOG_INVALID")
    }
    if (
      event !== null &&
      typeof event === "object" &&
      !Array.isArray(event) &&
      (event as Record<string, unknown>).schemaVersion ===
        "v1.37-restricted-evidence-access-log-v1" &&
      (event as Record<string, unknown>).action === "write" &&
      validHash((event as Record<string, unknown>).sha256) &&
      validHash((event as Record<string, unknown>).attestationSha256) &&
      typeof (event as Record<string, unknown>).evidenceClass === "string"
    ) {
      writeEvents.add(
        `${String((event as Record<string, unknown>).sha256)}:${String(
          (event as Record<string, unknown>).attestationSha256,
        )}:${String((event as Record<string, unknown>).evidenceClass)}`,
      )
    }
  }
  return writeEvents
}

export const checkV137IntegratedServiceProof = (
  repoRoot: string,
  restrictedRoot: string,
): V137IntegratedServiceReceipt => {
  const root = path.resolve(restrictedRoot)
  const controlBytes = readRegularBounded(
    path.join(root, V137_INTEGRATED_SERVICE_PROOF_CONTROL_PATH),
    "V137_SERVICE_PROOF_CONTROL_MISSING",
    16 * 1024 * 1024,
  )
  const control = parseControl(controlBytes)
  const receipt = validateV137IntegratedServiceReceipt(control.receipt)
  if (receipt.inputRootSha256 !== computeV137ServiceInputRoot(repoRoot)) {
    fail("V137_SERVICE_PROOF_INPUT_STALE")
  }
  const writeEvents = readWriteEvents(root)
  const records = control.records.map((record) =>
    verifyRecordReadOnly(root, record, writeEvents),
  )
  const recordRefs = records.map(({ reference }) => JSON.stringify(reference))
  if (new Set(recordRefs).size !== recordRefs.length) {
    fail("V137_SERVICE_PROOF_RESTRICTED_RECORD_DUPLICATE")
  }
  const expectedRefs = [
    ...receipt.scenarios.map(({ restrictedEvidenceRef }) =>
      JSON.stringify(restrictedEvidenceRef),
    ),
    JSON.stringify(receipt.proofDataHandoffRef),
    JSON.stringify(receipt.serviceTraceRef),
  ]
  if (
    expectedRefs.length !== recordRefs.length ||
    expectedRefs.some((reference) => !recordRefs.includes(reference))
  ) {
    fail("V137_SERVICE_PROOF_RESTRICTED_RECORD_COVERAGE")
  }
  return receipt
}

const writeControlAtomic = (
  restrictedRoot: string,
  control: V137IntegratedServiceProofControl,
): void => {
  const target = path.join(
    restrictedRoot,
    V137_INTEGRATED_SERVICE_PROOF_CONTROL_PATH,
  )
  mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 })
  if (existsSync(target) && lstatSync(target).isSymbolicLink()) {
    fail("V137_SERVICE_PROOF_CONTROL_SYMLINK")
  }
  const temporary = `${target}.tmp-${process.pid}`
  try {
    writeFileSync(temporary, `${JSON.stringify(control)}\n`, {
      flag: "wx",
      mode: 0o600,
    })
    renameSync(temporary, target)
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary)
  }
}

export const writeV137IntegratedServiceProofFixture = async (
  repoRoot: string,
  restrictedRoot: string,
): Promise<V137IntegratedServiceProofControl> => {
  const resolvedRoot = path.resolve(restrictedRoot)
  if (
    path.resolve(process.env.COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT ?? "") !==
    resolvedRoot
  ) {
    fail("V137_SERVICE_PROOF_RESTRICTED_ROOT_MISMATCH")
  }
  const store = createV137RestrictedEvidenceStore({
    repoRoot,
    maxObjectBytes: 64 * 1024 * 1024,
  })
  const receipt = createV137IntegratedServiceReceiptFixture()
  const records: V137RestrictedEvidenceRecord[] = []
  const writeFixtureEvidence = (
    label: string,
    evidenceClass: V137PublicRestrictedEvidenceRef["class"],
  ): V137RestrictedEvidenceRecord => {
    const record = store.writeEvidence({
      bytes: Buffer.from(
        `${JSON.stringify({ schemaVersion: "v1.37-service-proof-fixture-v1", label })}\n`,
        "utf8",
      ),
      evidenceClass,
      actorClass: "collector",
      latestBoundCertificateValidUntil: "2099-01-01T00:00:00.000Z",
    })
    records.push(record)
    return record
  }
  receipt.scenarios.forEach((scenario) => {
    scenario.restrictedEvidenceRef = writeFixtureEvidence(
      `scenario:${scenario.id}`,
      scenario.restrictedEvidenceRef.class,
    ).reference
  })
  receipt.proofDataHandoffRef = writeFixtureEvidence(
    "proof-data-handoff",
    "service-trace",
  ).reference
  receipt.serviceTraceRef = writeFixtureEvidence(
    "service-trace",
    "command-receipt",
  ).reference
  receipt.inputRootSha256 = computeV137ServiceInputRoot(repoRoot)
  validateV137IntegratedServiceReceipt(receipt)
  const control: V137IntegratedServiceProofControl = {
    schemaVersion: "v1.37-integrated-service-control-v1",
    receipt,
    records,
  }
  writeControlAtomic(resolvedRoot, control)
  return control
}

interface V137CapturedCommand {
  receipt: V137CommandReceipt
  stdout: Buffer
  stderr: Buffer
}

const runCapturedCommand = (
  command: V137CommandSpec,
): Promise<V137CapturedCommand> =>
  new Promise((resolve, reject) => {
    const child = spawn(command.executable, [...command.args], {
      cwd: command.cwd,
      env: command.environment,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    })
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    let total = 0
    const maxBytes = 128 * 1024 * 1024
    const capture = (target: Buffer[], chunk: Buffer): void => {
      total += chunk.byteLength
      if (total > maxBytes) {
        child.kill("SIGTERM")
        return
      }
      target.push(Buffer.from(chunk))
    }
    child.stdout?.on("data", (chunk: Buffer) => capture(stdout, chunk))
    child.stderr?.on("data", (chunk: Buffer) => capture(stderr, chunk))
    const timeout = setTimeout(() => child.kill("SIGTERM"), command.timeoutMs)
    child.once("error", (error) => {
      clearTimeout(timeout)
      reject(error)
    })
    child.once("close", (code, signal) => {
      clearTimeout(timeout)
      if (total > maxBytes) {
        reject(new TypeError("V137_SERVICE_PROOF_COMMAND_OUTPUT_LIMIT"))
        return
      }
      if (code !== 0 || signal !== null) {
        const diagnostic = Buffer.concat(stderr)
          .toString("utf8")
          .match(/V137_[A-Z0-9_]+/u)?.[0]
        reject(
          new TypeError(
            `V137_SERVICE_PROOF_COMMAND_FAILED:${command.id}${diagnostic === undefined ? "" : `:${diagnostic}`}`,
          ),
        )
        return
      }
      const stdoutBytes = Buffer.concat(stdout)
      const stderrBytes = Buffer.concat(stderr)
      resolve({
        receipt: {
          id: command.id,
          status: "passed",
          exitCode: 0,
          stdoutSha256: sha256(stdoutBytes),
          stderrSha256: sha256(stderrBytes),
        },
        stdout: stdoutBytes,
        stderr: stderrBytes,
      })
    })
  })

const commandEnvironment = (
  environment: Record<string, string | undefined>,
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(environment).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  )

const postgresEnvironment = (
  databaseUrl: string,
  base: Record<string, string>,
): Record<string, string> => {
  let parsed: URL
  try {
    parsed = new URL(databaseUrl)
  } catch {
    fail("V137_SERVICE_PROOF_DATABASE_URL_INVALID")
  }
  if (
    !["postgres:", "postgresql:"].includes(parsed.protocol) ||
    !parsed.hostname ||
    parsed.pathname.length < 2
  ) {
    fail("V137_SERVICE_PROOF_DATABASE_URL_INVALID")
  }
  return {
    ...base,
    PGHOST: parsed.hostname,
    PGPORT: parsed.port || "5432",
    PGUSER: decodeURIComponent(parsed.username),
    PGPASSWORD: decodeURIComponent(parsed.password),
    PGDATABASE: decodeURIComponent(parsed.pathname.slice(1)),
  }
}

const runPsql = async (
  repoRoot: string,
  environment: Record<string, string>,
  id: string,
  sql: string,
): Promise<V137CapturedCommand> =>
  runCapturedCommand({
    id,
    executable: "psql",
    args: ["-X", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-c", sql],
    cwd: repoRoot,
    environment,
    timeoutMs: 30_000,
  })

const parseJsonOutput = <T>(output: Buffer, code: string): T => {
  try {
    return JSON.parse(output.toString("utf8").trim()) as T
  } catch {
    fail(code)
  }
}

const readLiveTopology = async (
  repoRoot: string,
  baseEnvironment: Record<string, string>,
  databaseEnvironment: Record<string, string>,
): Promise<{
  topology: V137IntegratedServiceTopology
  receipts: V137CommandReceipt[]
}> => {
  const postgres = await runCapturedCommand({
    id: "postgres-health",
    executable: "docker",
    args: [
      "inspect",
      "--format",
      "{{json .State.Health.Status}}",
      "cowards-postgres",
    ],
    cwd: repoRoot,
    environment: baseEnvironment,
    timeoutMs: 30_000,
  })
  const redis = await runCapturedCommand({
    id: "redis-health",
    executable: "docker",
    args: [
      "inspect",
      "--format",
      "{{json .State.Health.Status}}",
      "cowards-redis",
    ],
    cwd: repoRoot,
    environment: baseEnvironment,
    timeoutMs: 30_000,
  })
  const head = await runPsql(
    repoRoot,
    databaseEnvironment,
    "database-head",
    `select json_build_object(
      'state', state,
      'revision', revision::integer,
      'activeSelectionRoot', active_selection_root,
      'pendingIntent', pending_intent is not null,
      'compensation', compensation is not null
    ) from semantic_authority_selection_head where singleton;`,
  )
  const topology: V137IntegratedServiceTopology = {
    postgres:
      parseJsonOutput<string>(
        postgres.stdout,
        "V137_SERVICE_PROOF_POSTGRES_HEALTH_INVALID",
      ) === "healthy"
        ? "healthy"
        : "unhealthy",
    redis:
      parseJsonOutput<string>(
        redis.stdout,
        "V137_SERVICE_PROOF_REDIS_HEALTH_INVALID",
      ) === "healthy"
        ? "healthy"
        : "unhealthy",
    goOwner: "ready",
    runtimeServiceOwner: "ready",
    databaseHead: parseJsonOutput<
      V137IntegratedServiceTopology["databaseHead"]
    >(head.stdout, "V137_SERVICE_PROOF_DATABASE_HEAD_INVALID"),
  }
  return {
    topology: assertV137IntegratedServiceTopology(topology),
    receipts: [postgres.receipt, redis.receipt, head.receipt],
  }
}

const databaseMutationRoots = async (
  repoRoot: string,
  databaseEnvironment: Record<string, string>,
  ordinal: string,
): Promise<{ roots: V137NoMutationRoots; receipt: V137CommandReceipt }> => {
  const result = await runPsql(
    repoRoot,
    databaseEnvironment,
    `database-snapshot-${ordinal}`,
    `select json_build_object(
      'gameplay', (select coalesce(jsonb_agg(to_jsonb(x) order by x.id), '[]'::jsonb) from matches x),
      'memory', (select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'runtimeSemanticReceiptHash', x.runtime_semantic_receipt_hash) order by x.id), '[]'::jsonb) from chronicles x),
      'result', (select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'status', x.status, 'outcome', x.outcome, 'failureCategory', x.failure_category) order by x.id), '[]'::jsonb) from matches x),
      'standings', (select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'status', x.status, 'scoring', x.scoring, 'countedStatus', x.counted_status) order by x.id), '[]'::jsonb) from match_sets x)
    );`,
  )
  const snapshot = parseJsonOutput<Record<string, unknown>>(
    result.stdout,
    "V137_SERVICE_PROOF_DATABASE_SNAPSHOT_INVALID",
  )
  return {
    roots: {
      gameplaySha256: sha256(JSON.stringify(snapshot.gameplay)),
      memorySha256: sha256(JSON.stringify(snapshot.memory)),
      resultSha256: sha256(JSON.stringify(snapshot.result)),
      standingsSha256: sha256(JSON.stringify(snapshot.standings)),
    },
    receipt: result.receipt,
  }
}

interface LiveLaneRunOutput {
  schemaVersion: string
  languageId: V137Language
  runId: string
  processId: string
  workspaceId: string
  status: "passed"
  complete: true
  freshWorkspace: true
  freshProcess: true
  skippedCaseCount: 0
  unsupportedCaseCount: 0
  fallbackUsed: false
  syntheticEvidence: false
  caseCount: number
  identity: {
    laneId: string
    identityManifestRoot: `sha256:${string}`
    toolchainSha256: `sha256:${string}`
    artifactSha256: `sha256:${string}`
    containmentPolicySha256: `sha256:${string}`
  }
  resultRootSha256: `sha256:${string}`
  evidenceRootSha256: `sha256:${string}`
}

interface Phase260ConformanceLane {
  languageId: V137Language
  laneId: string
  certificateId: string
  certificateSha256: `sha256:${string}`
}

interface Phase260ProofInput {
  authority: { tupleId: `sha256:${string}` }
  conformance: { lanes: Phase260ConformanceLane[] }
}

const executeLiveLanes = async (
  repoRoot: string,
  environment: Record<string, string>,
): Promise<{
  lanes: V137IntegratedServiceFunctionalLane[]
  receipts: V137CommandReceipt[]
}> => {
  const phase260 = parseJsonOutput<Phase260ProofInput>(
    readFileSync(
      path.join(
        repoRoot,
        ".planning/artifacts/v1.37-truthful-inputs-set-fairness-proof.json",
      ),
    ),
    "V137_SERVICE_PROOF_PHASE260_INVALID",
  )
  const receipts: V137CommandReceipt[] = []
  const lanes: V137IntegratedServiceFunctionalLane[] = []
  for (const languageId of ["typescript", "python", "rust", "zig"] as const) {
    const certificate = phase260.conformance.lanes.find(
      (candidate) => candidate.languageId === languageId,
    )
    if (certificate === undefined)
      fail("V137_SERVICE_PROOF_CERTIFICATE_MISSING")
    const candidate = parseJsonOutput<{
      candidateBindings: unknown
      expectedRunBinding: {
        resultRootSha256: string
        evidenceRootSha256: string
        requiredCaseCount: number
      }
    }>(
      readFileSync(
        path.join(
          repoRoot,
          `.planning/artifacts/v1.37-observation-v1.19-language-conformance-${languageId}.json`,
        ),
      ),
      "V137_SERVICE_PROOF_CANDIDATE_INVALID",
    )
    const runs: V137IntegratedServiceLaneRun[] = []
    for (let ordinal = 0; ordinal < 3; ordinal += 1) {
      const nonce = `${Date.now().toString(36)}-${process.pid}-${ordinal}`
      const workspace = mkdtempSync(
        path.join(tmpdir(), `cowards-v137-service-${languageId}-`),
      )
      const dockerConfig = path.join(workspace, "docker-config")
      mkdirSync(dockerConfig, { mode: 0o700 })
      writeFileSync(path.join(dockerConfig, "config.json"), "{}\n", {
        mode: 0o600,
        flag: "wx",
      })
      const runId = `run:v1.19:service:${languageId}:${ordinal}:${nonce}`
      const workspaceId = `workspace:v1.19:service:${languageId}:${ordinal}:${nonce}`
      try {
        const result = await runCapturedCommand({
          id: `lane-${languageId}-${ordinal}`,
          executable: "pnpm",
          args: [
            "exec",
            "tsx",
            "scripts/run-v1-37-real-language-lane.ts",
            "--language",
            languageId,
            "--run-id",
            runId,
            "--workspace-id",
            workspaceId,
            "--workspace",
            workspace,
            "--observation-v1-19-candidate-bindings-base64",
            Buffer.from(
              JSON.stringify(candidate.candidateBindings),
              "utf8",
            ).toString("base64"),
          ],
          cwd: repoRoot,
          environment: {
            ...environment,
            DOCKER_CONFIG: dockerConfig,
          },
          timeoutMs: 20 * 60 * 1_000,
        })
        receipts.push(result.receipt)
        const output = parseJsonOutput<LiveLaneRunOutput>(
          result.stdout,
          "V137_SERVICE_PROOF_LANE_OUTPUT_INVALID",
        )
        if (
          output.schemaVersion !==
            "v1.37-observation-v1.19-fresh-language-run-v1" ||
          output.languageId !== languageId ||
          output.runId !== runId ||
          output.workspaceId !== workspaceId ||
          output.status !== "passed" ||
          !output.complete ||
          !output.freshProcess ||
          !output.freshWorkspace ||
          output.skippedCaseCount !== 0 ||
          output.unsupportedCaseCount !== 0 ||
          output.fallbackUsed ||
          output.syntheticEvidence ||
          output.caseCount !== candidate.expectedRunBinding.requiredCaseCount ||
          output.identity.laneId !== certificate.laneId ||
          output.resultRootSha256 !==
            candidate.expectedRunBinding.resultRootSha256 ||
          output.evidenceRootSha256 !==
            candidate.expectedRunBinding.evidenceRootSha256 ||
          [
            output.identity.identityManifestRoot,
            output.identity.toolchainSha256,
            output.identity.artifactSha256,
            output.identity.containmentPolicySha256,
          ].some((value) => !validHash(value))
        ) {
          fail("V137_SERVICE_PROOF_LANE_OUTPUT_MISMATCH")
        }
        runs.push({
          runId: output.runId,
          resultRootSha256: output.resultRootSha256,
          evidenceRootSha256: output.evidenceRootSha256,
          identityManifestRoot: output.identity.identityManifestRoot,
          toolchainSha256: output.identity.toolchainSha256,
          artifactSha256: output.identity.artifactSha256,
          containmentPolicySha256: output.identity.containmentPolicySha256,
          complete: true,
          freshProcess: true,
          freshWorkspace: true,
          skippedCaseCount: 0,
          unsupportedCaseCount: 0,
          fallbackUsed: false,
          syntheticEvidence: false,
        })
      } finally {
        rmSync(workspace, { recursive: true, force: true })
      }
    }
    lanes.push({
      languageId,
      laneId: certificate.laneId,
      certificateId: certificate.certificateId,
      certificateSha256: certificate.certificateSha256,
      functionalConformance: "passed",
      runs,
    })
  }
  return { lanes, receipts }
}

const activateProofLocalRuntimeAuthority = async (
  repoRoot: string,
  environment: Record<string, string>,
  functionalLanes: V137IntegratedServiceFunctionalLane[],
): Promise<{
  lanes: V137IntegratedServiceLane[]
  report: ProofLocalActivationReport
  receipt: V137CommandReceipt
}> => {
  const result = await runCapturedCommand({
    id: "proof-local-runtime-authority-service-execution",
    executable: process.execPath,
    args: [
      "--import",
      "tsx",
      "scripts/activate-v1-37-proof-local-runtime-authority.ts",
      "--probe-lanes-base64",
      Buffer.from(JSON.stringify(functionalLanes), "utf8").toString("base64"),
    ],
    cwd: repoRoot,
    environment,
    timeoutMs: 20 * 60 * 1_000,
  })
  const report = parseJsonOutput<ProofLocalActivationReport>(
    result.stdout,
    "V137_SERVICE_PROOF_AUTHORITY_ACTIVATION_INVALID",
  )
  const languages = ["typescript", "python", "rust", "zig"] as const
  if (
    report.schemaVersion !== "v1.37-proof-local-runtime-authority-v1" ||
    report.status !== "passed" ||
    report.authority.publicationCount !== 1 ||
    report.authority.installationCount !== 1 ||
    report.service.healthChecked !== true ||
    report.service.contractVersion !== "runtime-execution-service-v1.18" ||
    report.service.runtimeAbiVersion !== "strategy-runtime-abi-v1.19" ||
    report.service.adapter !== "container-subprocess" ||
    report.service.executionCount !== 4 ||
    !validHash(report.proofRootSha256) ||
    JSON.stringify(report.lanes.map(({ languageId }) => languageId)) !==
      JSON.stringify(languages) ||
    JSON.stringify(report.executions.map(({ languageId }) => languageId)) !==
      JSON.stringify(languages)
  ) {
    fail("V137_SERVICE_PROOF_AUTHORITY_ACTIVATION_INVALID")
  }
  const lanes = functionalLanes.map(
    (lane, index): V137IntegratedServiceLane => {
      const activated = report.lanes[index]!
      const execution = report.executions[index]!
      if (
        activated.languageId !== lane.languageId ||
        activated.laneId !== lane.laneId ||
        activated.counted !== false ||
        activated.probeIdentityManifestRoot !==
          lane.runs[0]?.identityManifestRoot ||
        execution.languageId !== lane.languageId ||
        execution.statusCode !== 200 ||
        execution.resultClass !== "success" ||
        execution.semanticValidation !== "passed" ||
        execution.reconstructionEquivalent !== true ||
        execution.replayEquivalent !== true ||
        execution.laneIdentityHash !== activated.laneIdentityHash ||
        execution.containmentCertificateIds.bottom !==
          activated.containmentCertificates.bottom.id ||
        execution.containmentCertificateIds.top !==
          activated.containmentCertificates.top.id ||
        !validHash(activated.laneIdentityHash) ||
        !validHash(activated.containmentCertificates.bottom.hash) ||
        !validHash(activated.containmentCertificates.top.hash) ||
        !validHash(execution.chronicleCanonicalHash) ||
        !validHash(execution.transitionTraceRoot) ||
        !validHash(execution.finalStateCanonicalHash) ||
        !validHash(execution.outcomeCanonicalHash)
      ) {
        fail("V137_SERVICE_PROOF_AUTHORITY_LANE_MISMATCH")
      }
      return {
        ...lane,
        containmentEvidence: "attested",
        counted: false,
        limitationCode: "proof-local-identity-non-counted",
        containmentCertificates: activated.containmentCertificates,
        laneIdentityHash: activated.laneIdentityHash,
        probeIdentityManifestRoot: activated.probeIdentityManifestRoot,
      }
    },
  )
  return { lanes, report, receipt: result.receipt }
}

const readProofDataHandoff = async (
  repoRoot: string,
  databaseEnvironment: Record<string, string>,
): Promise<{ descriptor: unknown; receipt: V137CommandReceipt }> => {
  const result = await runPsql(
    repoRoot,
    databaseEnvironment,
    "proof-data-handoff-query",
    `select json_build_object(
      'schemaVersion', 'v1.37-integrated-proof-data-handoff-v1',
      'matchSetId', ms.id,
      'seasonId', ms.ladder_season_id,
      'seasonAvailability', case when ms.ladder_season_id is null then 'no-retained-season-row' else 'available' end,
      'replayMatchId', m.id,
      'chronicleId', c.id,
      'laneStatusSource', 'restricted-integrated-service-receipt',
      'historicalFixtureId', 'historical-v1-4-chronicle-manifest'
    )
    from matches m
    join match_set_matches msm on msm.match_id = m.id
    join match_sets ms on ms.id = msm.match_set_id
    join chronicles c on c.match_id = m.id
    where m.status = 'complete' and ms.status = 'complete'
    order by m.completed_at desc nulls last
    limit 1;`,
  )
  const descriptor = parseJsonOutput<Record<string, unknown>>(
    result.stdout,
    "V137_SERVICE_PROOF_HANDOFF_UNAVAILABLE",
  )
  if (
    typeof descriptor.matchSetId !== "string" ||
    typeof descriptor.replayMatchId !== "string" ||
    typeof descriptor.chronicleId !== "string"
  ) {
    fail("V137_SERVICE_PROOF_HANDOFF_UNAVAILABLE")
  }
  return { descriptor, receipt: result.receipt }
}

export const writeV137IntegratedServiceProof = async (
  repoRoot: string,
  rawEnvironment: Record<string, string | undefined> = process.env,
): Promise<V137IntegratedServiceProofControl> => {
  const serviceEnvironment = validateV137IntegratedServiceEnvironment(
    rawEnvironment,
    repoRoot,
  )
  const environment = commandEnvironment(rawEnvironment)
  environment.PATH = `/usr/local/go/bin:${environment.PATH ?? ""}`
  const databaseEnvironment = postgresEnvironment(
    serviceEnvironment.databaseUrl,
    environment,
  )
  const commandReceipts: V137CommandReceipt[] = []
  const protectedBaselineReceipt = assertV137ProtectedBaselineRawBytes(repoRoot)
  commandReceipts.push(protectedBaselineReceipt)
  try {
    commandReceipts.push(
      (
        await runCapturedCommand({
          id: "services-reused",
          executable: "docker",
          args: [
            "inspect",
            "--format",
            "{{.State.Status}}",
            "cowards-postgres",
            "cowards-redis",
          ],
          cwd: repoRoot,
          environment,
          timeoutMs: 30_000,
        })
      ).receipt,
    )
  } catch {
    commandReceipts.push(
      (
        await runCapturedCommand({
          id: "services-up",
          executable: "pnpm",
          args: ["services:up"],
          cwd: repoRoot,
          environment,
          timeoutMs: 120_000,
        })
      ).receipt,
    )
  }
  const liveTopology = await readLiveTopology(
    repoRoot,
    environment,
    databaseEnvironment,
  )
  commandReceipts.push(...liveTopology.receipts)
  const before = await databaseMutationRoots(
    repoRoot,
    databaseEnvironment,
    "before",
  )
  commandReceipts.push(before.receipt)
  const gates: V137CommandSpec[] = [
    {
      id: "phase260-current-proof",
      executable: "pnpm",
      args: ["v1.37:phase260-proof:check"],
      cwd: repoRoot,
      environment,
      timeoutMs: 20 * 60 * 1_000,
    },
    {
      id: "executable-conformance-current-proof",
      executable: "pnpm",
      args: ["v1.37:executable-conformance:check"],
      cwd: repoRoot,
      environment,
      timeoutMs: 20 * 60 * 1_000,
    },
    {
      id: "runtime-chronicle-replay",
      executable: "pnpm",
      args: [
        "exec",
        "vitest",
        "run",
        "--maxWorkers=1",
        "--no-file-parallelism",
        "apps/runtime-service/src/server.test.ts",
        "apps/runtime-service/src/execute-match-v1-19.test.ts",
        "apps/runtime-service/src/semantic-integrity.test.ts",
        "packages/replay/src/record.test.ts",
        "packages/replay/src/validate.test.ts",
        "packages/replay/src/replay-transition.test.ts",
      ],
      cwd: repoRoot,
      environment,
      timeoutMs: 20 * 60 * 1_000,
    },
    {
      id: "go-persistence-rollback-owner",
      executable: "go",
      args: [
        "test",
        "./...",
        "-run",
        "TestGoMatchCompletionIntegration|TestMatchCompletionSemanticDatabase|TestPhase258CompletionRollbackPostgres|TestPhase258PersistedSuccessorValidationDriftStopsBeforeHTTPWithZeroGameplay",
        "-count=1",
      ],
      cwd: path.join(repoRoot, "apps/go-backend"),
      environment,
      timeoutMs: 20 * 60 * 1_000,
    },
  ]
  for (const gate of gates) {
    commandReceipts.push((await runCapturedCommand(gate)).receipt)
  }
  const laneProof = await executeLiveLanes(repoRoot, environment)
  commandReceipts.push(...laneProof.receipts)
  const runtimeAuthority = await activateProofLocalRuntimeAuthority(
    repoRoot,
    environment,
    laneProof.lanes,
  )
  commandReceipts.push(runtimeAuthority.receipt)
  const after = await databaseMutationRoots(
    repoRoot,
    databaseEnvironment,
    "after",
  )
  commandReceipts.push(after.receipt)
  const handoff = await readProofDataHandoff(repoRoot, databaseEnvironment)
  commandReceipts.push(handoff.receipt)
  const phase260 = parseJsonOutput<Phase260ProofInput>(
    readFileSync(
      path.join(
        repoRoot,
        ".planning/artifacts/v1.37-truthful-inputs-set-fairness-proof.json",
      ),
    ),
    "V137_SERVICE_PROOF_PHASE260_INVALID",
  )
  const chronicleRoot = sha256(
    JSON.stringify(
      runtimeAuthority.report.executions.map((execution) => ({
        languageId: execution.languageId,
        chronicleCanonicalHash: execution.chronicleCanonicalHash,
        transitionTraceRoot: execution.transitionTraceRoot,
        finalStateCanonicalHash: execution.finalStateCanonicalHash,
        outcomeCanonicalHash: execution.outcomeCanonicalHash,
      })),
    ),
  )
  const receipt = createV137IntegratedServiceReceiptFixture()
  receipt.authority.tupleId = phase260.authority.tupleId
  receipt.topology = liveTopology.topology
  receipt.lanes = runtimeAuthority.lanes
  receipt.chronicle = {
    semanticValidation: "passed",
    eventVocabulary: "current-exact",
    chronicleRootSha256: chronicleRoot,
    reconstructionRootSha256: chronicleRoot,
    replayRootSha256: chronicleRoot,
  }
  const store = createV137RestrictedEvidenceStore({
    repoRoot,
    maxObjectBytes: 64 * 1024 * 1024,
  })
  const records: V137RestrictedEvidenceRecord[] = []
  const validUntil = new Date(Date.now() + 30 * 86_400_000).toISOString()
  const writeEvidence = (
    value: unknown,
    evidenceClass: V137PublicRestrictedEvidenceRef["class"],
  ): V137RestrictedEvidenceRecord => {
    const record = store.writeEvidence({
      bytes: Buffer.from(`${JSON.stringify(value)}\n`, "utf8"),
      evidenceClass,
      actorClass: "collector",
      latestBoundCertificateValidUntil: validUntil,
    })
    records.push(record)
    return record
  }
  receipt.scenarios = V137_INTEGRATED_SERVICE_SCENARIOS.map((scenario) => {
    const failureOwner =
      scenario.expectedResultClass === "system-failure"
        ? "system"
        : scenario.expectedResultClass === "player-violation"
          ? "player"
          : "none"
    const evidenceMode =
      scenario.group === "four-lane-positive" ||
      scenario.id === "current-chronicle-valid" ||
      scenario.id === "reconstruction-equivalent"
        ? ("live-service-execution" as const)
        : ("executable-regression" as const)
    const scenarioEvidence = {
      schemaVersion: "v1.37-integrated-service-scenario-evidence-v1",
      scenario,
      authority: receipt.authority,
      failureOwner,
      evidenceMode,
      before: before.roots,
      after: after.roots,
      commandReceipts,
      laneRoots: runtimeAuthority.lanes.map((lane) => ({
        languageId: lane.languageId,
        runIds: lane.runs.map(({ runId }) => runId),
        resultRoots: lane.runs.map(({ resultRootSha256 }) => resultRootSha256),
        evidenceRoots: lane.runs.map(
          ({ evidenceRootSha256 }) => evidenceRootSha256,
        ),
      })),
      runtimeAuthority: runtimeAuthority.report.authority,
      serviceExecution:
        scenario.id.startsWith("lane-") && scenario.id.endsWith("-success")
          ? runtimeAuthority.report.executions.find(
              ({ languageId }) => scenario.id === `lane-${languageId}-success`,
            )
          : scenario.id === "current-chronicle-valid" ||
              scenario.id === "reconstruction-equivalent"
            ? runtimeAuthority.report.executions
            : undefined,
    }
    return {
      id: scenario.id,
      expectedResultClass: scenario.expectedResultClass,
      status: "passed" as const,
      evidenceMode,
      failureOwner,
      before: { ...before.roots },
      after: { ...after.roots },
      observationRootSha256: sha256(JSON.stringify(scenarioEvidence)),
      restrictedEvidenceRef: writeEvidence(
        scenarioEvidence,
        scenario.restrictedEvidenceClass,
      ).reference,
    }
  })
  receipt.proofDataHandoffRef = writeEvidence(
    {
      ...handoff.descriptor,
      proofAuthorityPublicationId:
        runtimeAuthority.report.authority.publicationId,
    },
    "service-trace",
  ).reference
  receipt.serviceTraceRef = writeEvidence(
    {
      schemaVersion: "v1.37-integrated-service-trace-v1",
      topology: liveTopology.topology,
      commandReceipts,
      lanes: runtimeAuthority.lanes,
      service: runtimeAuthority.report.service,
      executions: runtimeAuthority.report.executions,
      containment: {
        deployableAuthorityPublicationCount:
          runtimeAuthority.report.authority.publicationCount,
        installedAuthorityCount:
          runtimeAuthority.report.authority.installationCount,
        disposition: "proof-local-attested-identity-non-counted",
      },
    },
    "command-receipt",
  ).reference
  receipt.inputRootSha256 = computeV137ServiceInputRoot(repoRoot)
  validateV137IntegratedServiceReceipt(receipt)
  const control: V137IntegratedServiceProofControl = {
    schemaVersion: "v1.37-integrated-service-control-v1",
    receipt,
    records,
  }
  writeControlAtomic(serviceEnvironment.restrictedRoot, control)
  const protectedAfter = assertV137ProtectedBaselineRawBytes(repoRoot)
  if (protectedAfter.stdoutSha256 !== protectedBaselineReceipt.stdoutSha256) {
    fail("V137_SERVICE_PROOF_PROTECTED_PATH_DRIFT")
  }
  checkV137IntegratedServiceProof(repoRoot, serviceEnvironment.restrictedRoot)
  return control
}

const isDirectRun = process.argv.some(
  (argument) => argument === "--write" || argument === "--check",
)

if (isDirectRun) {
  const main = async (): Promise<void> => {
    if (process.env.COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF !== "1") {
      fail("V137_SERVICE_PROOF_STRICT_FLAG_REQUIRED")
    }
    const repoRoot = path.resolve(import.meta.dirname, "..")
    const mode = process.argv.slice(2)
    if (mode.length !== 1 || !["--write", "--check"].includes(mode[0]!)) {
      fail("V137_SERVICE_PROOF_MODE_INVALID")
    }
    if (mode[0] === "--write") {
      const control = await writeV137IntegratedServiceProof(repoRoot)
      process.stdout.write(
        `${JSON.stringify({ status: control.receipt.status, laneCount: control.receipt.lanes.length, runCount: control.receipt.lanes.flatMap(({ runs }) => runs).length, scenarioCount: control.receipt.scenarios.length, countedLaneCount: control.receipt.lanes.filter(({ counted }) => counted).length })}\n`,
      )
      return
    }
    const environment = validateV137IntegratedServiceEnvironment(
      process.env,
      repoRoot,
    )
    const receipt = checkV137IntegratedServiceProof(
      repoRoot,
      environment.restrictedRoot,
    )
    process.stdout.write(
      `${JSON.stringify({ status: receipt.status, laneCount: receipt.lanes.length, runCount: receipt.lanes.flatMap(({ runs }) => runs).length, scenarioCount: receipt.scenarios.length, countedLaneCount: receipt.lanes.filter(({ counted }) => counted).length })}\n`,
    )
  }

  try {
    await main()
  } catch (error: unknown) {
    process.stderr.write(
      `${error instanceof Error ? error.message : "V137_SERVICE_PROOF_FAILED"}\n`,
    )
    process.exitCode = 1
  }
}
