import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import { createHash, randomBytes } from "node:crypto"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import {
  RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
  encodeCanonicalJson,
  encodeRuntimeConformanceCertificatePayloadV117,
  type JsonValue,
  type RuntimeConformanceCertificatePayloadV117,
  type RuntimeConformanceExpectedRunBindingV117,
  type RuntimeConformanceIdentityBindingsV117,
  type RuntimeConformanceLanguageIdV117,
  type RuntimeConformanceRunV117,
} from "@cowards/spec"
import {
  V1_37_CONFORMANCE_CORPUS,
  V1_37_CONFORMANCE_CORPUS_ROOT,
} from "@cowards/golden"

const HASH = /^sha256:[0-9a-f]{64}$/u
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,511}$/u
const ACTIVE_TRACE_REGISTRY =
  "packages/golden/src/fixtures/v1-37-conformance-traces/registry.json"
const REVIEWED_RESULT_PATHS = Object.freeze({
  typescript: ".planning/artifacts/v1.37-language-conformance-typescript.json",
  python: ".planning/artifacts/v1.37-language-conformance-python.json",
  rust: ".planning/artifacts/v1.37-language-conformance-rust.json",
  zig: ".planning/artifacts/v1.37-language-conformance-zig.json",
} as const)
const REVIEWED_INDEX_PATH =
  ".planning/artifacts/v1.37-language-conformance-candidates.md"
const LANGUAGES = Object.freeze([
  "typescript",
  "python",
  "rust",
  "zig",
] as const satisfies readonly RuntimeConformanceLanguageIdV117[])
const TSX_IMPORT_URL = import.meta.resolve("tsx")

const sha256 = (value: Uint8Array | string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const canonicalSha256 = (value: JsonValue): `sha256:${string}` => {
  const encoded = encodeCanonicalJson(value, {
    context: "canonical-manifest",
  })
  if (!encoded.ok) throw new TypeError("Certifier value is not canonical")
  return sha256(encoded.bytes)
}

export const V137_CONFORMANCE_CASE_INVENTORY_SHA256 = canonicalSha256(
  V1_37_CONFORMANCE_CORPUS.cases.map(
    ({ id, kind, capability, executionMode, expectation }) => ({
      id,
      kind,
      capability,
      executionMode,
      resultClass: expectation.resultClass,
      reasonCode: expectation.reasonCode,
    }),
  ) as unknown as JsonValue,
)

export interface V137FreshLanguageRunResult {
  readonly schemaVersion: "v1.37-fresh-language-run-v1"
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
}

export interface V137ReviewedLanguageCandidate {
  readonly schemaVersion: "v1.37-reviewed-language-candidate-v1"
  readonly status: "reviewed_unsigned_candidate"
  readonly languageId: RuntimeConformanceLanguageIdV117
  readonly candidatePayload: RuntimeConformanceCertificatePayloadV117
  readonly candidatePayloadSha256: `sha256:${string}`
  readonly expectedRunBinding: RuntimeConformanceExpectedRunBindingV117
}

export interface V137SafeLanguageFailure {
  readonly schemaVersion: "v1.37-reviewed-language-candidate-v1"
  readonly status: "system_failure"
  readonly languageId: RuntimeConformanceLanguageIdV117
  readonly code:
    | "LANE_RUN_FAILED"
    | "LANE_RUN_INVALID"
    | "LANE_RUN_DRIFT"
    | "GOLDEN_MUTATION"
  readonly candidatePayload: null
  readonly candidatePayloadSha256: null
  readonly expectedRunBinding: null
}

export type V137ReviewedLanguageResult =
  | V137ReviewedLanguageCandidate
  | V137SafeLanguageFailure

export interface V137LanguageChildInvocation {
  readonly languageId: RuntimeConformanceLanguageIdV117
  readonly runId: string
  readonly workspaceId: string
  readonly workspacePath: string
  readonly repoRoot: string
}

export type V137LanguageChildRunner = (
  invocation: V137LanguageChildInvocation,
) => unknown

const exactKeys = (value: unknown, expected: readonly string[]): boolean =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.keys(value).length === expected.length &&
  expected.every((key) => Object.hasOwn(value, key))

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
  const identity = value as unknown as RuntimeConformanceIdentityBindingsV117
  if (
    identity.languageId !== languageId ||
    identity.corpusRootSha256 !== V1_37_CONFORMANCE_CORPUS_ROOT ||
    identity.caseInventorySha256 !== V137_CONFORMANCE_CASE_INVENTORY_SHA256 ||
    identity.runtimeAbiVersion !== "strategy-runtime-abi-v1.18" ||
    identity.canonicalJsonProfileId !== "canonical-json-v1.1" ||
    identity.budgetPolicySha256 !== RUNTIME_BUDGET_PROFILE_V1_18_SHA256 ||
    !IDENTIFIER.test(identity.laneId)
  ) {
    throw new TypeError("Fresh run identity binding is invalid")
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
  expected: V137LanguageChildInvocation,
): V137FreshLanguageRunResult => {
  if (!exactKeys(value, RUN_KEYS)) {
    throw new TypeError("Fresh lane run has invalid shape")
  }
  const run = value as unknown as V137FreshLanguageRunResult
  const startedAt = parseInstant(run.startedAt)
  const completedAt = parseInstant(run.completedAt)
  const validUntil = parseInstant(run.validUntil)
  if (
    run.schemaVersion !== "v1.37-fresh-language-run-v1" ||
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
    run.caseCount !== V1_37_CONFORMANCE_CORPUS.cases.length ||
    run.caseInventorySha256 !== V137_CONFORMANCE_CASE_INVENTORY_SHA256 ||
    startedAt > completedAt ||
    completedAt > validUntil ||
    !HASH.test(run.resultRootSha256) ||
    !HASH.test(run.evidenceRootSha256)
  ) {
    throw new TypeError("Fresh lane run is incomplete")
  }
  return Object.freeze({
    ...globalThis.structuredClone(run),
    identity: parseIdentity(run.identity, expected.languageId),
  })
}

const sameIdentity = (
  left: RuntimeConformanceIdentityBindingsV117,
  right: RuntimeConformanceIdentityBindingsV117,
): boolean => IDENTITY_KEYS.every((key) => left[key] === right[key])

const readGoldenIdentity = (repoRoot: string): `sha256:${string}` =>
  sha256(readFileSync(path.join(repoRoot, ACTIVE_TRACE_REGISTRY)))

const failure = (
  languageId: RuntimeConformanceLanguageIdV117,
  code: V137SafeLanguageFailure["code"],
): V137SafeLanguageFailure =>
  Object.freeze({
    schemaVersion: "v1.37-reviewed-language-candidate-v1",
    status: "system_failure",
    languageId,
    code,
    candidatePayload: null,
    candidatePayloadSha256: null,
    expectedRunBinding: null,
  })

export const certifyLanguageLaneV137 = (input: {
  readonly languageId: RuntimeConformanceLanguageIdV117
  readonly repoRoot: string
  readonly runs?: 3 | undefined
  readonly childRunner: V137LanguageChildRunner
  readonly issuedAt: string
  readonly requestedValidUntil: string
  readonly registryGeneration: string
  readonly producerId: string
  readonly producerKeyId: string
}): V137ReviewedLanguageResult => {
  if (input.runs !== undefined && input.runs !== 3) {
    throw new TypeError("Exactly three fresh runs are required")
  }
  const goldenBefore = readGoldenIdentity(input.repoRoot)
  const temporaryRoots: string[] = []
  const runs: V137FreshLanguageRunResult[] = []
  try {
    for (let ordinal = 0; ordinal < 3; ordinal += 1) {
      const workspacePath = mkdtempSync(
        path.join(tmpdir(), `cowards-v137-${input.languageId}-`),
      )
      temporaryRoots.push(workspacePath)
      const invocation = {
        languageId: input.languageId,
        runId: `run:${input.languageId}:${String(ordinal).padStart(2, "0")}:${randomBytes(8).toString("hex")}`,
        workspaceId: `workspace:${input.languageId}:${String(ordinal).padStart(2, "0")}:${randomBytes(8).toString("hex")}`,
        workspacePath,
        repoRoot: input.repoRoot,
      } as const
      let raw: unknown
      try {
        raw = input.childRunner(invocation)
      } catch {
        return failure(input.languageId, "LANE_RUN_FAILED")
      }
      try {
        runs.push(parseFreshRun(raw, invocation))
      } catch {
        return failure(input.languageId, "LANE_RUN_INVALID")
      }
    }
    if (readGoldenIdentity(input.repoRoot) !== goldenBefore) {
      return failure(input.languageId, "GOLDEN_MUTATION")
    }
    const [first, ...rest] = runs
    if (
      first === undefined ||
      rest.some(
        (run) =>
          !sameIdentity(run.identity, first.identity) ||
          run.resultRootSha256 !== first.resultRootSha256 ||
          run.evidenceRootSha256 !== first.evidenceRootSha256,
      )
    ) {
      return failure(input.languageId, "LANE_RUN_DRIFT")
    }
    const issuedAt = parseInstant(input.issuedAt)
    const requestedValidUntil = parseInstant(input.requestedValidUntil)
    const runFreshUntil = Math.min(
      ...runs.map(({ validUntil }) => parseInstant(validUntil)),
      ...runs.map(
        ({ completedAt }) =>
          parseInstant(completedAt) + 30 * 24 * 60 * 60 * 1_000,
      ),
      issuedAt + 30 * 24 * 60 * 60 * 1_000,
      requestedValidUntil,
    )
    if (issuedAt >= runFreshUntil) {
      return failure(input.languageId, "LANE_RUN_INVALID")
    }
    const certificateRuns: RuntimeConformanceRunV117[] = runs.map((run) => ({
      runId: run.runId,
      workspaceId: run.workspaceId,
      processId: run.processId,
      status: "passed",
      complete: true,
      freshWorkspace: true,
      freshProcess: true,
      skippedCaseCount: 0,
      unsupportedCaseCount: 0,
      fallbackUsed: false,
      syntheticEvidence: false,
      caseCount: run.caseCount,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      validUntil: run.validUntil,
      identity: run.identity,
      resultRootSha256: run.resultRootSha256,
      evidenceRootSha256: run.evidenceRootSha256,
    }))
    const payload: RuntimeConformanceCertificatePayloadV117 = {
      schemaVersion: "runtime-conformance-certificate-v1.17",
      certificateId: `certificate:v1.37:${input.languageId}:${first.resultRootSha256.slice(-24)}`,
      certificateVersion: "runtime-conformance-certificate-v1.17",
      producerId: input.producerId,
      producerKeyId: input.producerKeyId,
      trustDomain: "production",
      managedIdentity: true,
      registryGeneration: input.registryGeneration,
      issuedAt: input.issuedAt,
      requestedValidUntil: input.requestedValidUntil,
      freshUntil: new Date(runFreshUntil).toISOString(),
      identity: first.identity,
      runs: certificateRuns,
    }
    const expectedRunBinding = Object.freeze({
      caseInventorySha256: V137_CONFORMANCE_CASE_INVENTORY_SHA256,
      requiredCaseCount: V1_37_CONFORMANCE_CORPUS.cases.length,
      resultRootSha256: first.resultRootSha256,
    })
    return Object.freeze({
      schemaVersion: "v1.37-reviewed-language-candidate-v1",
      status: "reviewed_unsigned_candidate",
      languageId: input.languageId,
      candidatePayload: payload,
      candidatePayloadSha256: sha256(
        encodeRuntimeConformanceCertificatePayloadV117(payload),
      ),
      expectedRunBinding,
    })
  } finally {
    for (const temporaryRoot of temporaryRoots) {
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
  }
}

const cliChildRunner: V137LanguageChildRunner = (invocation) => {
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
      maxBuffer: 1024 * 1024,
      shell: false,
      timeout: 300_000,
    },
  )
  if (result.error || result.status !== 0 || result.signal !== null) {
    if (process.env.COWARDS_CERTIFICATION_DEBUG === "1") {
      process.stderr.write(result.stderr)
    }
    throw new TypeError(
      process.env.COWARDS_CERTIFICATION_DEBUG === "1"
        ? `Real language child run failed: ${result.stderr}`
        : "Real language child run failed",
    )
  }
  return JSON.parse(result.stdout) as unknown
}

const canonicalResultBytes = (
  value: V137ReviewedLanguageResult,
): Uint8Array => {
  const encoded = encodeCanonicalJson(value as unknown as JsonValue, {
    context: "canonical-manifest",
  })
  if (!encoded.ok) throw new TypeError("Reviewed lane result is not canonical")
  return encoded.bytes
}

const checkReviewedResult = (
  languageId: RuntimeConformanceLanguageIdV117,
  value: unknown,
): V137ReviewedLanguageResult => {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    (value as { languageId?: unknown }).languageId !== languageId
  ) {
    throw new TypeError("Reviewed lane result identity is invalid")
  }
  const result = value as V137ReviewedLanguageResult
  if (result.status === "reviewed_unsigned_candidate") {
    if (
      !exactKeys(result, [
        "schemaVersion",
        "status",
        "languageId",
        "candidatePayload",
        "candidatePayloadSha256",
        "expectedRunBinding",
      ]) ||
      result.schemaVersion !== "v1.37-reviewed-language-candidate-v1" ||
      result.candidatePayload.identity.languageId !== languageId ||
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
          run.caseCount !== V1_37_CONFORMANCE_CORPUS.cases.length,
      ) ||
      sha256(
        encodeRuntimeConformanceCertificatePayloadV117(result.candidatePayload),
      ) !== result.candidatePayloadSha256 ||
      result.expectedRunBinding.caseInventorySha256 !==
        V137_CONFORMANCE_CASE_INVENTORY_SHA256 ||
      result.expectedRunBinding.requiredCaseCount !==
        V1_37_CONFORMANCE_CORPUS.cases.length ||
      result.expectedRunBinding.resultRootSha256 !==
        result.candidatePayload.runs[0]?.resultRootSha256
    ) {
      throw new TypeError("Reviewed lane candidate is invalid")
    }
  } else if (
    !exactKeys(result, [
      "schemaVersion",
      "status",
      "languageId",
      "code",
      "candidatePayload",
      "candidatePayloadSha256",
      "expectedRunBinding",
    ]) ||
    result.schemaVersion !== "v1.37-reviewed-language-candidate-v1" ||
    result.status !== "system_failure" ||
    result.candidatePayload !== null ||
    result.candidatePayloadSha256 !== null ||
    result.expectedRunBinding !== null
  ) {
    throw new TypeError("Reviewed lane failure is invalid")
  }
  const serialized = JSON.stringify(result)
  if (
    /"(?:source|sourceBytes|memory|objective|diagnostics|stderr|path|hostData|privateKey)"\s*:/iu.test(
      serialized,
    ) ||
    serialized.includes(path.resolve(import.meta.dirname, ".."))
  ) {
    throw new TypeError("Reviewed lane result exposes forbidden material")
  }
  canonicalResultBytes(result)
  return globalThis.structuredClone(result)
}

const reviewedIndex = (
  results: Readonly<
    Record<RuntimeConformanceLanguageIdV117, V137ReviewedLanguageResult>
  >,
): string => {
  const lines = [
    "# v1.37 Four-Language Conformance Candidates",
    "",
    "Each lane is independently reviewed, unsigned, and non-promoting until the managed signing and append-only import gates complete.",
    "",
    "| Language | Status | Candidate payload | Result root | Runs |",
    "|---|---|---|---|---:|",
  ]
  for (const languageId of LANGUAGES) {
    const result = results[languageId]
    if (result.status === "reviewed_unsigned_candidate") {
      lines.push(
        `| ${languageId} | reviewed unsigned candidate | ${result.candidatePayloadSha256} | ${result.expectedRunBinding.resultRootSha256} | ${result.candidatePayload.runs.length} |`,
      )
    } else {
      lines.push(
        `| ${languageId} | system failure: ${result.code} | — | — | 0 |`,
      )
    }
  }
  lines.push(
    "",
    "Closure requires all four current candidates, three fresh complete runs per lane, identical per-lane identity/result/evidence roots, zero skips/fallbacks/synthetic evidence, and later managed sign/verify/import receipts.",
    "",
  )
  return lines.join("\n")
}

const certifyOne = (
  languageId: RuntimeConformanceLanguageIdV117,
  issuedAt: string,
  requestedValidUntil: string,
): V137ReviewedLanguageResult =>
  certifyLanguageLaneV137({
    languageId,
    repoRoot: path.resolve(import.meta.dirname, ".."),
    runs: 3,
    childRunner: cliChildRunner,
    issuedAt,
    requestedValidUntil,
    registryGeneration: "0",
    producerId: "cowards-runtime-conformance-producer-v1.37",
    producerKeyId: "cowards-runtime-conformance-key-v1.37",
  })

export const runCertifierCli = (): void => {
  const args = process.argv.slice(2)
  const repoRoot = path.resolve(import.meta.dirname, "..")
  if (args.includes("--check-reviewed-lane-results")) {
    const results = {} as Record<
      RuntimeConformanceLanguageIdV117,
      V137ReviewedLanguageResult
    >
    for (const languageId of LANGUAGES) {
      const resultPath = path.join(repoRoot, REVIEWED_RESULT_PATHS[languageId])
      const bytes = readFileSync(resultPath)
      const result = checkReviewedResult(
        languageId,
        JSON.parse(bytes.toString("utf8")) as unknown,
      )
      const expectedBytes = Buffer.concat([
        Buffer.from(canonicalResultBytes(result)),
        Buffer.from("\n"),
      ])
      if (!bytes.equals(expectedBytes)) {
        throw new TypeError("Reviewed lane result bytes are not canonical")
      }
      results[languageId] = result
    }
    if (
      readFileSync(path.join(repoRoot, REVIEWED_INDEX_PATH), "utf8") !==
      reviewedIndex(results)
    ) {
      throw new TypeError("Reviewed lane index is not synchronized")
    }
    process.stdout.write(
      `${JSON.stringify({ status: "passed", lanes: LANGUAGES.length })}\n`,
    )
    return
  }
  const issuedAt = new Date().toISOString()
  const requestedValidUntil = new Date(
    Date.parse(issuedAt) + 30 * 24 * 60 * 60 * 1_000,
  ).toISOString()
  if (args.includes("--attempt-all")) {
    const results = {} as Record<
      RuntimeConformanceLanguageIdV117,
      V137ReviewedLanguageResult
    >
    for (const languageId of LANGUAGES) {
      const result = checkReviewedResult(
        languageId,
        certifyOne(languageId, issuedAt, requestedValidUntil),
      )
      results[languageId] = result
      if (args.includes("--write-reviewed-lane-results")) {
        writeFileSync(
          path.join(repoRoot, REVIEWED_RESULT_PATHS[languageId]),
          Buffer.concat([
            Buffer.from(canonicalResultBytes(result)),
            Buffer.from("\n"),
          ]),
          { flag: "w", mode: 0o600 },
        )
      }
    }
    if (args.includes("--write-reviewed-lane-results")) {
      writeFileSync(
        path.join(repoRoot, REVIEWED_INDEX_PATH),
        reviewedIndex(results),
        { encoding: "utf8", flag: "w", mode: 0o600 },
      )
    }
    process.stdout.write(
      `${JSON.stringify({
        status: LANGUAGES.every(
          (languageId) =>
            results[languageId].status === "reviewed_unsigned_candidate",
        )
          ? "passed"
          : "system_failure",
        lanes: LANGUAGES.map((languageId) => ({
          languageId,
          status: results[languageId].status,
        })),
      })}\n`,
    )
    if (
      LANGUAGES.some(
        (languageId) =>
          results[languageId].status !== "reviewed_unsigned_candidate",
      )
    ) {
      process.exitCode = 1
    }
    return
  }
  const languageValue = args[args.indexOf("--language") + 1]
  if (
    languageValue !== "typescript" &&
    languageValue !== "python" &&
    languageValue !== "rust" &&
    languageValue !== "zig"
  ) {
    throw new TypeError("A supported --language is required")
  }
  const result = certifyOne(languageValue, issuedAt, requestedValidUntil)
  process.stdout.write(`${JSON.stringify(result)}\n`)
  if (result.status !== "reviewed_unsigned_candidate") process.exitCode = 1
}

if (process.argv[1] === import.meta.filename) {
  runCertifierCli()
}
