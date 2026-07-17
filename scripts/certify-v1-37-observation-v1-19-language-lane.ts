import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import { createHash, randomBytes } from "node:crypto"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import {
  CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_RECORD,
  RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
  encodeCanonicalJson,
  type JsonValue,
  type RuntimeConformanceIdentityBindingsV117,
  type RuntimeConformanceLanguageIdV117,
} from "@cowards/spec"
// Candidate pins stay outside current package selectors until Plan 14 activation.
// eslint-disable-next-line no-restricted-imports
import { V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN } from "../packages/golden/src/v1-37-conformance-corpus-v3-candidate-pin.js"
// eslint-disable-next-line no-restricted-imports
import { V1_37_OBSERVATION_TRACE_V4_CANDIDATE_PIN } from "../packages/golden/src/v1-37-conformance-trace-v4-candidate-pin.js"
// eslint-disable-next-line no-restricted-imports
import { WORKSHOP_CONTRACT_V1_19_CANDIDATE_PIN } from "../packages/persistence/src/workshop-contract-v1-19-candidate-pin.js"

const HASH = /^sha256:[0-9a-f]{64}$/u
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,511}$/u
const LANGUAGES = Object.freeze([
  "typescript",
  "python",
  "rust",
  "zig",
] as const satisfies readonly RuntimeConformanceLanguageIdV117[])
const TSX_IMPORT_URL = import.meta.resolve("tsx")
const RESULT_PATHS = Object.freeze({
  typescript:
    ".planning/artifacts/v1.37-observation-v1.19-language-conformance-typescript.json",
  python:
    ".planning/artifacts/v1.37-observation-v1.19-language-conformance-python.json",
  rust: ".planning/artifacts/v1.37-observation-v1.19-language-conformance-rust.json",
  zig: ".planning/artifacts/v1.37-observation-v1.19-language-conformance-zig.json",
} as const)
const INDEX_PATH =
  ".planning/artifacts/v1.37-observation-v1.19-language-conformance-candidates.md"

const sha256 = (value: Uint8Array | string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const canonicalBytes = (value: JsonValue): Uint8Array => {
  const encoded = encodeCanonicalJson(value, { context: "canonical-manifest" })
  if (!encoded.ok) throw new TypeError("Candidate evidence is not canonical JSON")
  return encoded.bytes
}

const canonicalSha256 = (value: JsonValue): `sha256:${string}` =>
  sha256(canonicalBytes(value))

export const V137_OBSERVATION_V119_CASE_INVENTORY_SHA256 = canonicalSha256(
  V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.caseRoots as unknown as JsonValue,
)

export interface V137ObservationV119CandidateBindings {
  readonly schemaVersion: "v1.37-observation-v1.19-candidate-bindings-v1"
  readonly corpus: Readonly<{
    version: "v3"
    rootSha256: `sha256:${string}`
    fileSha256: `sha256:${string}`
    pinFileSha256: `sha256:${string}`
    current: false
  }>
  readonly trace: Readonly<{
    version: "v1.37-observation-trace-v4"
    rootSha256: `sha256:${string}`
    bundleRootSha256: `sha256:${string}`
    pinFileSha256: `sha256:${string}`
    current: false
  }>
  readonly workshop: Readonly<{
    version: "workshop-contract-v1.19"
    rootSha256: `sha256:${string}`
    observationSemanticsSha256: `sha256:${string}`
    pinFileSha256: `sha256:${string}`
    current: false
  }>
  readonly semanticTuple: Readonly<{
    runtimeAbiVersion: "strategy-runtime-abi-v1.19"
    tupleId: `sha256:${string}`
    tupleSha256: `sha256:${string}`
    arenaCatalogVersion: string
    setPolicyVersion: string
    current: false
  }>
}

const pinFile = (repoRoot: string, relativePath: string): `sha256:${string}` =>
  sha256(readFileSync(path.join(repoRoot, relativePath)))

export const exactObservationV119CandidateBindings = (
  repoRoot: string,
): V137ObservationV119CandidateBindings =>
  Object.freeze({
    schemaVersion: "v1.37-observation-v1.19-candidate-bindings-v1",
    corpus: Object.freeze({
      version: V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.candidateVersion,
      rootSha256:
        V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.corpusRootSha256,
      fileSha256:
        V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.corpusFileSha256,
      pinFileSha256: pinFile(
        repoRoot,
        "packages/golden/src/v1-37-conformance-corpus-v3-candidate-pin.ts",
      ),
      current: false,
    }),
    trace: Object.freeze({
      version: V1_37_OBSERVATION_TRACE_V4_CANDIDATE_PIN.candidateVersion,
      rootSha256:
        V1_37_OBSERVATION_TRACE_V4_CANDIDATE_PIN.candidateRootSha256,
      bundleRootSha256:
        V1_37_OBSERVATION_TRACE_V4_CANDIDATE_PIN.bundleRootSha256,
      pinFileSha256: pinFile(
        repoRoot,
        "packages/golden/src/v1-37-conformance-trace-v4-candidate-pin.ts",
      ),
      current: false,
    }),
    workshop: Object.freeze({
      version:
        WORKSHOP_CONTRACT_V1_19_CANDIDATE_PIN.workshopContractVersion,
      rootSha256:
        WORKSHOP_CONTRACT_V1_19_CANDIDATE_PIN.exampleSetRootSha256,
      observationSemanticsSha256:
        WORKSHOP_CONTRACT_V1_19_CANDIDATE_PIN.observationSemanticsSha256,
      pinFileSha256: pinFile(
        repoRoot,
        "packages/persistence/src/workshop-contract-v1-19-candidate-pin.ts",
      ),
      current: false,
    }),
    semanticTuple: Object.freeze({
      runtimeAbiVersion: "strategy-runtime-abi-v1.19",
      tupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_RECORD.tupleId,
      tupleSha256: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_RECORD.sha256,
      arenaCatalogVersion:
        CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_RECORD.tuple.arenaCatalog,
      setPolicyVersion:
        CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_RECORD.tuple.setPolicy,
      current: false,
    }),
  })

const exactKeys = (value: unknown, expected: readonly string[]): boolean =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.keys(value).length === expected.length &&
  expected.every((key) => Object.hasOwn(value, key))

const assertExactCandidateBindings = (
  value: unknown,
  repoRoot: string,
): V137ObservationV119CandidateBindings => {
  const expected = exactObservationV119CandidateBindings(repoRoot)
  if (
    value === undefined ||
    !exactKeys(value, [
      "schemaVersion",
      "corpus",
      "trace",
      "workshop",
      "semanticTuple",
    ]) ||
    JSON.stringify(value) !== JSON.stringify(expected) ||
    JSON.stringify(value).includes("registry.json") ||
    JSON.stringify(value).includes("v1.37-language-conformance-")
  ) {
    throw new TypeError("Exact explicit candidate binding is required")
  }
  return globalThis.structuredClone(expected)
}

export interface V137ObservationV119FreshLanguageRun {
  readonly schemaVersion: "v1.37-observation-v1.19-fresh-language-run-v1"
  readonly languageId: RuntimeConformanceLanguageIdV117
  readonly runId: string
  readonly workspaceId: string
  readonly processId: string
  readonly status: "passed"
  readonly complete: true
  readonly freshWorkspace: true
  readonly freshProcess: true
  readonly skippedCaseCount: 0
  readonly unsupportedCaseCount: 0
  readonly fallbackUsed: false
  readonly syntheticEvidence: false
  readonly caseCount: number
  readonly caseInventorySha256: `sha256:${string}`
  readonly startedAt: string
  readonly completedAt: string
  readonly validUntil: string
  readonly identity: RuntimeConformanceIdentityBindingsV117
  readonly resultRootSha256: `sha256:${string}`
  readonly evidenceRootSha256: `sha256:${string}`
  readonly candidateBindings: V137ObservationV119CandidateBindings
}

export interface V137ObservationV119LanguageChildInvocation {
  readonly languageId: RuntimeConformanceLanguageIdV117
  readonly runId: string
  readonly workspaceId: string
  readonly workspacePath: string
  readonly repoRoot: string
  readonly candidateBindings: V137ObservationV119CandidateBindings
}

export type V137ObservationV119LanguageChildRunner = (
  invocation: V137ObservationV119LanguageChildInvocation,
) => unknown

interface V137ObservationV119CertificatePayload {
  readonly schemaVersion: "runtime-conformance-certificate-candidate-v1.19"
  readonly certificateVersion: "runtime-conformance-certificate-v1.19"
  readonly certificateId: string
  readonly producerId: string
  readonly producerKeyId: string
  readonly registryGeneration: string
  readonly issuedAt: string
  readonly requestedValidUntil: string
  readonly freshUntil: string
  readonly status: "inactive-candidate"
  readonly identity: RuntimeConformanceIdentityBindingsV117
  readonly candidateBindings: V137ObservationV119CandidateBindings
  readonly runs: readonly V137ObservationV119FreshLanguageRun[]
}

export interface V137ObservationV119ReviewedLanguageCandidate {
  readonly schemaVersion:
    "v1.37-observation-v1.19-reviewed-language-candidate-v1"
  readonly status: "reviewed_unsigned_candidate"
  readonly languageId: RuntimeConformanceLanguageIdV117
  readonly candidateBindings: V137ObservationV119CandidateBindings
  readonly candidatePayload: V137ObservationV119CertificatePayload
  readonly candidatePayloadSha256: `sha256:${string}`
  readonly expectedRunBinding: Readonly<{
    caseInventorySha256: `sha256:${string}`
    requiredCaseCount: number
    resultRootSha256: `sha256:${string}`
    evidenceRootSha256: `sha256:${string}`
  }>
}

export interface V137ObservationV119SafeLanguageFailure {
  readonly schemaVersion:
    "v1.37-observation-v1.19-reviewed-language-candidate-v1"
  readonly status: "system_failure"
  readonly languageId: RuntimeConformanceLanguageIdV117
  readonly code:
    | "LANE_RUN_FAILED"
    | "LANE_RUN_INVALID"
    | "LANE_RUN_DRIFT"
    | "CANDIDATE_MUTATION"
  readonly candidateBindings: null
  readonly candidatePayload: null
  readonly candidatePayloadSha256: null
  readonly expectedRunBinding: null
}

export type V137ObservationV119ReviewedLanguageResult =
  | V137ObservationV119ReviewedLanguageCandidate
  | V137ObservationV119SafeLanguageFailure

const RUN_KEYS = [
  "schemaVersion",
  "languageId",
  "runId",
  "workspaceId",
  "processId",
  "status",
  "complete",
  "freshWorkspace",
  "freshProcess",
  "skippedCaseCount",
  "unsupportedCaseCount",
  "fallbackUsed",
  "syntheticEvidence",
  "caseCount",
  "caseInventorySha256",
  "startedAt",
  "completedAt",
  "validUntil",
  "identity",
  "resultRootSha256",
  "evidenceRootSha256",
  "candidateBindings",
] as const

const IDENTITY_KEYS = [
  "languageId",
  "laneId",
  "corpusRootSha256",
  "caseInventorySha256",
  "fixtureSourceSha256",
  "artifactSha256",
  "adapterBuildSha256",
  "runtimeExecutableSha256",
  "toolchainSha256",
  "sysrootStdlibSha256",
  "runtimeAbiVersion",
  "canonicalJsonProfileId",
  "budgetPolicySha256",
  "containmentPolicySha256",
  "semanticTupleSha256",
  "identityManifestRoot",
  "evidenceGraphRoot",
  "behaviorSettingsSha256",
] as const

const parseInstant = (value: unknown): number => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value)
  ) {
    throw new TypeError("Fresh run instant is invalid")
  }
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    throw new TypeError("Fresh run instant is invalid")
  }
  return parsed
}

const parseIdentity = (
  value: unknown,
  languageId: RuntimeConformanceLanguageIdV117,
): RuntimeConformanceIdentityBindingsV117 => {
  if (!exactKeys(value, IDENTITY_KEYS)) {
    throw new TypeError("Fresh run identity is invalid")
  }
  const identity = value as RuntimeConformanceIdentityBindingsV117
  const source = V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.sourceRoots.find(
    (candidate) => candidate.languageId === languageId,
  )
  if (
    source === undefined ||
    identity.languageId !== languageId ||
    identity.corpusRootSha256 !==
      V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.corpusRootSha256 ||
    identity.caseInventorySha256 !==
      V137_OBSERVATION_V119_CASE_INVENTORY_SHA256 ||
    identity.fixtureSourceSha256 !== source.sourceSha256 ||
    identity.runtimeAbiVersion !== "strategy-runtime-abi-v1.19" ||
    identity.canonicalJsonProfileId !== "canonical-json-v1.1" ||
    identity.budgetPolicySha256 !== RUNTIME_BUDGET_PROFILE_V1_18_SHA256 ||
    identity.semanticTupleSha256 !==
      CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_RECORD.tupleId ||
    !IDENTIFIER.test(identity.laneId)
  ) {
    throw new TypeError("Fresh run candidate identity binding is invalid")
  }
  for (const key of IDENTITY_KEYS) {
    if (
      key !== "languageId" &&
      key !== "laneId" &&
      key !== "runtimeAbiVersion" &&
      key !== "canonicalJsonProfileId" &&
      (typeof identity[key] !== "string" || !HASH.test(identity[key]))
    ) {
      throw new TypeError("Fresh run identity hash is invalid")
    }
  }
  return globalThis.structuredClone(identity)
}

const parseFreshRun = (
  value: unknown,
  expected: V137ObservationV119LanguageChildInvocation,
): V137ObservationV119FreshLanguageRun => {
  if (!exactKeys(value, RUN_KEYS)) throw new TypeError("Fresh lane run shape is invalid")
  const run = value as V137ObservationV119FreshLanguageRun
  const startedAt = parseInstant(run.startedAt)
  const completedAt = parseInstant(run.completedAt)
  const validUntil = parseInstant(run.validUntil)
  if (
    run.schemaVersion !== "v1.37-observation-v1.19-fresh-language-run-v1" ||
    run.languageId !== expected.languageId ||
    run.runId !== expected.runId ||
    run.workspaceId !== expected.workspaceId ||
    !IDENTIFIER.test(run.processId) ||
    run.status !== "passed" ||
    run.complete !== true ||
    run.freshWorkspace !== true ||
    run.freshProcess !== true ||
    run.skippedCaseCount !== 0 ||
    run.unsupportedCaseCount !== 0 ||
    run.fallbackUsed !== false ||
    run.syntheticEvidence !== false ||
    run.caseCount !==
      V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.caseRoots.length ||
    run.caseInventorySha256 !==
      V137_OBSERVATION_V119_CASE_INVENTORY_SHA256 ||
    startedAt > completedAt ||
    completedAt > validUntil ||
    !HASH.test(run.resultRootSha256) ||
    !HASH.test(run.evidenceRootSha256) ||
    JSON.stringify(run.candidateBindings) !==
      JSON.stringify(expected.candidateBindings)
  ) {
    throw new TypeError("Fresh lane run is incomplete or substituted")
  }
  return Object.freeze({
    ...globalThis.structuredClone(run),
    identity: parseIdentity(run.identity, expected.languageId),
  })
}

const failure = (
  languageId: RuntimeConformanceLanguageIdV117,
  code: V137ObservationV119SafeLanguageFailure["code"],
): V137ObservationV119SafeLanguageFailure =>
  Object.freeze({
    schemaVersion: "v1.37-observation-v1.19-reviewed-language-candidate-v1",
    status: "system_failure",
    languageId,
    code,
    candidateBindings: null,
    candidatePayload: null,
    candidatePayloadSha256: null,
    expectedRunBinding: null,
  })

export const certifyObservationLanguageLaneV119 = (input: {
  readonly languageId: RuntimeConformanceLanguageIdV117
  readonly repoRoot: string
  readonly runs?: 3
  readonly candidateBindings: V137ObservationV119CandidateBindings
  readonly childRunner: V137ObservationV119LanguageChildRunner
  readonly issuedAt: string
  readonly issueAfterRuns?: true
  readonly requestedValidUntil: string
  readonly registryGeneration: string
  readonly producerId: string
  readonly producerKeyId: string
}): V137ObservationV119ReviewedLanguageResult => {
  if (input.runs !== undefined && input.runs !== 3) {
    throw new TypeError("Exactly three fresh runs are required")
  }
  const bindings = assertExactCandidateBindings(
    input.candidateBindings,
    input.repoRoot,
  )
  const candidateFiles = [
    V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.corpusPath,
    V1_37_OBSERVATION_TRACE_V4_CANDIDATE_PIN.bundlePath,
    "packages/golden/src/v1-37-conformance-corpus-v3-candidate-pin.ts",
    "packages/golden/src/v1-37-conformance-trace-v4-candidate-pin.ts",
    "packages/persistence/src/workshop-contract-v1-19-candidate-pin.ts",
  ]
  const candidateBefore = candidateFiles.map((file) =>
    sha256(readFileSync(path.join(input.repoRoot, file))),
  )
  const temporaryRoots: string[] = []
  const runs: V137ObservationV119FreshLanguageRun[] = []
  try {
    for (let ordinal = 0; ordinal < 3; ordinal += 1) {
      const workspacePath = mkdtempSync(
        path.join(tmpdir(), `cowards-v137-v119-${input.languageId}-`),
      )
      temporaryRoots.push(workspacePath)
      const invocation: V137ObservationV119LanguageChildInvocation = {
        languageId: input.languageId,
        runId: `run:v1.19:${input.languageId}:${String(ordinal).padStart(2, "0")}:${randomBytes(8).toString("hex")}`,
        workspaceId: `workspace:v1.19:${input.languageId}:${String(ordinal).padStart(2, "0")}:${randomBytes(8).toString("hex")}`,
        workspacePath,
        repoRoot: input.repoRoot,
        candidateBindings: bindings,
      }
      try {
        runs.push(parseFreshRun(input.childRunner(invocation), invocation))
      } catch (error) {
        return failure(
          input.languageId,
          error instanceof SyntaxError ? "LANE_RUN_INVALID" : "LANE_RUN_FAILED",
        )
      }
    }
    const candidateAfter = candidateFiles.map((file) =>
      sha256(readFileSync(path.join(input.repoRoot, file))),
    )
    if (JSON.stringify(candidateBefore) !== JSON.stringify(candidateAfter)) {
      return failure(input.languageId, "CANDIDATE_MUTATION")
    }
    const [first, ...rest] = runs
    if (
      first === undefined ||
      rest.some(
        (run) =>
          JSON.stringify(run.identity) !== JSON.stringify(first.identity) ||
          run.resultRootSha256 !== first.resultRootSha256 ||
          run.evidenceRootSha256 !== first.evidenceRootSha256 ||
          JSON.stringify(run.candidateBindings) !== JSON.stringify(bindings),
      )
    ) {
      return failure(input.languageId, "LANE_RUN_DRIFT")
    }
    const effectiveIssuedAt = input.issueAfterRuns
      ? new Date(
          Math.max(Date.now(), ...runs.map((run) => parseInstant(run.completedAt))) +
            1,
        ).toISOString()
      : input.issuedAt
    const issuedAt = parseInstant(effectiveIssuedAt)
    const freshUntil = Math.min(
      ...runs.map((run) => parseInstant(run.validUntil)),
      ...runs.map(
        (run) => parseInstant(run.completedAt) + 30 * 24 * 60 * 60 * 1_000,
      ),
      issuedAt + 30 * 24 * 60 * 60 * 1_000,
      parseInstant(input.requestedValidUntil),
    )
    if (issuedAt >= freshUntil) return failure(input.languageId, "LANE_RUN_INVALID")
    const payload: V137ObservationV119CertificatePayload = {
      schemaVersion: "runtime-conformance-certificate-candidate-v1.19",
      certificateVersion: "runtime-conformance-certificate-v1.19",
      certificateId: `certificate:v1.37:v1.19:${input.languageId}:${first.resultRootSha256.slice(-24)}`,
      producerId: input.producerId,
      producerKeyId: input.producerKeyId,
      registryGeneration: input.registryGeneration,
      issuedAt: effectiveIssuedAt,
      requestedValidUntil: input.requestedValidUntil,
      freshUntil: new Date(freshUntil).toISOString(),
      status: "inactive-candidate",
      identity: first.identity,
      candidateBindings: bindings,
      runs,
    }
    return Object.freeze({
      schemaVersion:
        "v1.37-observation-v1.19-reviewed-language-candidate-v1",
      status: "reviewed_unsigned_candidate",
      languageId: input.languageId,
      candidateBindings: bindings,
      candidatePayload: payload,
      candidatePayloadSha256: sha256(
        canonicalBytes(payload as unknown as JsonValue),
      ),
      expectedRunBinding: Object.freeze({
        caseInventorySha256: V137_OBSERVATION_V119_CASE_INVENTORY_SHA256,
        requiredCaseCount:
          V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.caseRoots.length,
        resultRootSha256: first.resultRootSha256,
        evidenceRootSha256: first.evidenceRootSha256,
      }),
    })
  } finally {
    for (const temporaryRoot of temporaryRoots) {
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
  }
}

const cliChildRunner: V137ObservationV119LanguageChildRunner = (invocation) => {
  const result = spawnSync(
    process.execPath,
    [
      "--import",
      TSX_IMPORT_URL,
      path.join(invocation.repoRoot, "scripts/run-v1-37-real-language-lane.ts"),
      "--language",
      invocation.languageId,
      "--run-id",
      invocation.runId,
      "--workspace-id",
      invocation.workspaceId,
      "--workspace",
      invocation.workspacePath,
      "--observation-v1-19-candidate-bindings-base64",
      Buffer.from(JSON.stringify(invocation.candidateBindings), "utf8").toString(
        "base64",
      ),
    ],
    {
      cwd: invocation.workspacePath,
      encoding: "utf8",
      env: {
        PATH: process.env.PATH ?? "",
        HOME: invocation.workspacePath,
        TMPDIR: invocation.workspacePath,
        LANG: "C",
        LC_ALL: "C",
        TZ: "UTC",
        RUSTUP_HOME:
          process.env.RUSTUP_HOME ??
          path.join(process.env.HOME ?? invocation.workspacePath, ".rustup"),
        CARGO_HOME:
          process.env.CARGO_HOME ??
          path.join(process.env.HOME ?? invocation.workspacePath, ".cargo"),
        ...(process.env.COWARDS_CERTIFICATION_DEBUG === "1"
          ? { COWARDS_CERTIFICATION_DEBUG: "1" }
          : {}),
      },
      maxBuffer: 2 * 1024 * 1024,
      shell: false,
      timeout: 300_000,
    },
  )
  if (result.error || result.status !== 0 || result.signal !== null) {
    if (process.env.COWARDS_CERTIFICATION_DEBUG === "1") {
      process.stderr.write(result.stderr)
    }
    throw new TypeError("Real candidate language child run failed")
  }
  return JSON.parse(result.stdout) as unknown
}

const canonicalResultBytes = (
  result: V137ObservationV119ReviewedLanguageResult,
): Uint8Array => canonicalBytes(result as unknown as JsonValue)

const checkResult = (
  languageId: RuntimeConformanceLanguageIdV117,
  value: unknown,
  repoRoot: string,
): V137ObservationV119ReviewedLanguageCandidate => {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    (value as { languageId?: unknown }).languageId !== languageId
  ) {
    throw new TypeError("Reviewed candidate identity is invalid")
  }
  const result = value as V137ObservationV119ReviewedLanguageResult
  if (
    result.status !== "reviewed_unsigned_candidate" ||
    result.schemaVersion !==
      "v1.37-observation-v1.19-reviewed-language-candidate-v1" ||
    JSON.stringify(result.candidateBindings) !==
      JSON.stringify(exactObservationV119CandidateBindings(repoRoot)) ||
    result.candidatePayload.status !== "inactive-candidate" ||
    result.candidatePayload.runs.length !== 3 ||
    result.candidatePayload.runs.some(
      (run) =>
        !run.complete ||
        !run.freshWorkspace ||
        !run.freshProcess ||
        run.skippedCaseCount !== 0 ||
        run.unsupportedCaseCount !== 0 ||
        run.fallbackUsed ||
        run.syntheticEvidence ||
        run.identity.runtimeAbiVersion !== "strategy-runtime-abi-v1.19",
    ) ||
    sha256(canonicalBytes(result.candidatePayload as unknown as JsonValue)) !==
      result.candidatePayloadSha256 ||
    result.expectedRunBinding.caseInventorySha256 !==
      V137_OBSERVATION_V119_CASE_INVENTORY_SHA256 ||
    result.expectedRunBinding.requiredCaseCount !==
      V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.caseRoots.length
  ) {
    throw new TypeError("Reviewed candidate is incomplete or substituted")
  }
  const serialized = JSON.stringify(result)
  if (
    /"(?:source|sourceBytes|memory|objective|diagnostics|stderr|path|hostData|privateKey)"\s*:/iu.test(
      serialized,
    ) ||
    serialized.includes(repoRoot) ||
    serialized.includes("registry.json")
  ) {
    throw new TypeError("Reviewed candidate exposes forbidden material")
  }
  return globalThis.structuredClone(result)
}

const reviewedIndex = (
  results: Readonly<
    Record<RuntimeConformanceLanguageIdV117, V137ObservationV119ReviewedLanguageCandidate>
  >,
): string => {
  const bindings = results.typescript.candidateBindings
  const lines = [
    "# v1.37 Observation ABI v1.19 Four-Language Candidates",
    "",
    "These twelve executions are fresh, real, unsigned, inactive candidates. They do not select or promote any Phase-259 lane, corpus, trace, Workshop default, or certificate.",
    "",
    "## Exact candidate authority",
    "",
    `- Corpus: ${bindings.corpus.version} / ${bindings.corpus.rootSha256} / pin ${bindings.corpus.pinFileSha256}`,
    `- Trace: ${bindings.trace.version} / ${bindings.trace.rootSha256} / pin ${bindings.trace.pinFileSha256}`,
    `- Workshop: ${bindings.workshop.version} / ${bindings.workshop.rootSha256} / pin ${bindings.workshop.pinFileSha256}`,
    `- Semantic tuple: ${bindings.semanticTuple.runtimeAbiVersion} / ${bindings.semanticTuple.tupleId} / ${bindings.semanticTuple.arenaCatalogVersion} / ${bindings.semanticTuple.setPolicyVersion}`,
    "",
    "## Lane inventory",
    "",
    "| Language | Status | Candidate payload | Result root | Evidence root | Runs |",
    "|---|---|---|---|---|---:|",
  ]
  for (const languageId of LANGUAGES) {
    const result = results[languageId]
    lines.push(
      `| ${languageId} | reviewed unsigned inactive candidate | ${result.candidatePayloadSha256} | ${result.expectedRunBinding.resultRootSha256} | ${result.expectedRunBinding.evidenceRootSha256} | 3 |`,
    )
  }
  lines.push(
    "",
    "Closure requires managed signing and inactive append-only import before the separate atomic activation transaction may select these candidates.",
    "",
  )
  return lines.join("\n")
}

const certifyOne = (
  languageId: RuntimeConformanceLanguageIdV117,
  issuedAt: string,
  requestedValidUntil: string,
): V137ObservationV119ReviewedLanguageResult => {
  const repoRoot = path.resolve(import.meta.dirname, "..")
  return certifyObservationLanguageLaneV119({
    languageId,
    repoRoot,
    runs: 3,
    candidateBindings: exactObservationV119CandidateBindings(repoRoot),
    childRunner: cliChildRunner,
    issuedAt,
    issueAfterRuns: true,
    requestedValidUntil,
    registryGeneration: "candidate-0",
    producerId: "cowards-runtime-conformance-producer-v1.37-observation-v1.19",
    producerKeyId: "cowards-runtime-conformance-key-v1.37-observation-v1.19",
  })
}

const checkReviewedResults = (repoRoot: string): void => {
  const results = {} as Record<
    RuntimeConformanceLanguageIdV117,
    V137ObservationV119ReviewedLanguageCandidate
  >
  for (const languageId of LANGUAGES) {
    const bytes = readFileSync(path.join(repoRoot, RESULT_PATHS[languageId]))
    const result = checkResult(
      languageId,
      JSON.parse(bytes.toString("utf8")) as unknown,
      repoRoot,
    )
    const expected = Buffer.concat([
      Buffer.from(canonicalResultBytes(result)),
      Buffer.from("\n"),
    ])
    if (!bytes.equals(expected)) throw new TypeError("Candidate bytes are not canonical")
    results[languageId] = result
  }
  if (
    readFileSync(path.join(repoRoot, INDEX_PATH), "utf8") !== reviewedIndex(results)
  ) {
    throw new TypeError("Candidate inventory is not synchronized")
  }
}

export const runObservationV119CertifierCli = (): void => {
  const args = process.argv.slice(2)
  const repoRoot = path.resolve(import.meta.dirname, "..")
  if (args.includes("--attempt-all")) {
    const issuedAt = new Date().toISOString()
    const requestedValidUntil = new Date(
      Date.parse(issuedAt) + 30 * 24 * 60 * 60 * 1_000,
    ).toISOString()
    const results = {} as Record<
      RuntimeConformanceLanguageIdV117,
      V137ObservationV119ReviewedLanguageCandidate
    >
    for (const languageId of LANGUAGES) {
      const result = checkResult(
        languageId,
        certifyOne(languageId, issuedAt, requestedValidUntil),
        repoRoot,
      )
      results[languageId] = result
      writeFileSync(
        path.join(repoRoot, RESULT_PATHS[languageId]),
        Buffer.concat([
          Buffer.from(canonicalResultBytes(result)),
          Buffer.from("\n"),
        ]),
        { flag: "w", mode: 0o600 },
      )
    }
    writeFileSync(path.join(repoRoot, INDEX_PATH), reviewedIndex(results), {
      encoding: "utf8",
      flag: "w",
      mode: 0o600,
    })
  }
  if (args.includes("--check-reviewed-lane-results")) {
    checkReviewedResults(repoRoot)
    process.stdout.write(
      `${JSON.stringify({ status: "passed", lanes: 4, runs: 12, current: false })}\n`,
    )
    return
  }
  if (!args.includes("--attempt-all")) {
    throw new TypeError("Use --attempt-all and/or --check-reviewed-lane-results")
  }
  process.stdout.write(
    `${JSON.stringify({ status: "passed", lanes: 4, runs: 12, current: false })}\n`,
  )
}

if (process.argv[1] === import.meta.filename) runObservationV119CertifierCli()
