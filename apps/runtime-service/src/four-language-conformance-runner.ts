import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { lstatSync, readFileSync } from "node:fs"
import path from "node:path"
import {
  V1_37_CONFORMANCE_CORPUS,
  V1_37_CONFORMANCE_CORPUS_ROOT,
  V1_37_CONFORMANCE_LANGUAGES,
  V1_37_OBSERVATION_TRACE_V4_CANDIDATE_PIN,
  compareCanonicalConformanceTrace,
  hashCanonicalConformanceTrace,
  type CanonicalConformanceDivergence,
  type CanonicalConformanceTrace,
  type V137ConformanceCase,
  type V137ConformanceFixture,
  type V137ConformanceLanguageId,
  type V137ConformanceResultClass,
} from "@cowards/golden"
import {
  isVerifiedCountedTypeScriptSupervisedResultV118,
  type CountedTypeScriptSupervisedResultV118,
} from "@cowards/runtime-js"
import {
  isVerifiedCountedPythonSupervisedResultV118,
  type CountedPythonSupervisedResultV118,
} from "@cowards/runtime-python"
import {
  isVerifiedCountedWasmWasiSupervisedResultV118,
  type CountedWasmWasiSupervisedResultV118,
} from "@cowards/runtime-wasm-wasi"
import {
  CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD,
  encodeCanonicalJson,
  type JsonValue,
} from "@cowards/spec"

export const V137_REAL_ADAPTER_SELECTORS = Object.freeze({
  typescript: "typescript-native-supervised-v1.18",
  python: "python-native-supervised-v1.18",
  rust: "rust-wasmtime-native-supervised-v1.18",
  zig: "zig-wasmtime-native-supervised-v1.18",
} as const satisfies Readonly<Record<V137ConformanceLanguageId, string>>)

export const RETAINED_FOUR_LANGUAGE_PARITY_CERTIFICATION_STATUS =
  "non_promoting_regression_only" as const

const HASH = /^sha256:[0-9a-f]{64}$/u
const ORACLE_REGISTRY_RELATIVE =
  "packages/golden/src/fixtures/v1-37-conformance-traces/registry.json"
const PROTECTED_CATEGORIES = Object.freeze([
  "validV14State",
  "actionLegality",
  "eventOrder",
  "outcome",
  "terminalTimingReason",
  "strategyObservation",
  "historicalInterpretation",
] as const)

const sha256 = (value: Uint8Array | string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const canonicalHash = (
  domain: string,
  value: JsonValue,
): `sha256:${string}` => {
  const encoded = encodeCanonicalJson(value, { context: "canonical-manifest" })
  if (!encoded.ok) {
    throw new TypeError("Four-language conformance result is not canonical")
  }
  return sha256(
    Buffer.concat([
      Buffer.from(`${domain}\0`, "utf8"),
      Buffer.from(encoded.bytes),
    ]),
  )
}

const renderExactJson = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`

const exactJsonDomainHash = (
  domain: string,
  value: unknown,
): `sha256:${string}` =>
  sha256(`${domain}\0${renderExactJson(JSON.parse(JSON.stringify(value)))}`)

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

const exactKeys = (
  value: unknown,
  expected: readonly string[],
): value is Record<string, unknown> =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.keys(value).length === expected.length &&
  expected.every((key) => Object.hasOwn(value, key))

const allHashes = (value: Record<string, unknown>): boolean =>
  Object.values(value).every(
    (candidate) => typeof candidate === "string" && HASH.test(candidate),
  )

const protectedCategoriesHaveNoDelta = (
  value: unknown,
  includeRecomputed: boolean,
): boolean => {
  if (!exactKeys(value, PROTECTED_CATEGORIES)) return false
  for (const category of PROTECTED_CATEGORIES) {
    const record = value[category]
    const keys = includeRecomputed
      ? [
          "baselineHash",
          "candidateHash",
          "recomputedCandidateHash",
          "changeCount",
        ]
      : ["baselineHash", "candidateHash", "changeCount"]
    if (
      !exactKeys(record, keys) ||
      typeof record.baselineHash !== "string" ||
      !HASH.test(record.baselineHash) ||
      record.candidateHash !== record.baselineHash ||
      record.changeCount !== 0 ||
      (includeRecomputed &&
        record.recomputedCandidateHash !== record.baselineHash)
    ) {
      return false
    }
  }
  return true
}

export interface V137CommittedTraceOracle {
  readonly activeVersion: string
  readonly candidateRootSha256: `sha256:${string}`
  readonly caseIds: readonly string[]
  traceForCase(caseId: string): CanonicalConformanceTrace | undefined
}

const readRegularBytes = (filePath: string): Buffer => {
  const stat = lstatSync(filePath)
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new TypeError("Committed conformance evidence is not regular")
  }
  return readFileSync(filePath)
}

interface V137ValidatedTraceRegistry {
  readonly activeVersion: string
  readonly activePath: string
  readonly candidateRootSha256: `sha256:${string}`
  readonly manifestSha256: `sha256:${string}`
  readonly semanticDiffSha256: `sha256:${string}`
  readonly independentReviewSha256: `sha256:${string}`
  readonly compatibilityDispositionSha256: `sha256:${string}`
  readonly caseCount: number
}

const validatedObservationTraceV4Oracles = new Map<
  string,
  V137CommittedTraceOracle
>()

const loadCommittedV137ObservationTraceV4Oracle = (input: {
  readonly registry: V137ValidatedTraceRegistry
  readonly registryBytes: Buffer
  readonly activeDirectory: string
  readonly manifestBytes: Buffer
  readonly semanticDiffBytes: Buffer
  readonly independentReviewBytes: Buffer
  readonly dispositionBytes: Buffer
}): V137CommittedTraceOracle => {
  const { registry } = input
  const pin = V1_37_OBSERVATION_TRACE_V4_CANDIDATE_PIN
  const bundleBytes = readRegularBytes(
    path.join(input.activeDirectory, "traces.bundle.json"),
  )
  if (
    input.registryBytes.toString("utf8") !== renderExactJson(registry) ||
    registry.activeVersion !== pin.candidateVersion ||
    registry.activePath !== path.posix.dirname(pin.manifestPath) ||
    registry.candidateRootSha256 !== pin.candidateRootSha256 ||
    registry.manifestSha256 !== pin.manifestFileSha256 ||
    registry.semanticDiffSha256 !== pin.semanticDiffFileSha256 ||
    registry.independentReviewSha256 !== pin.independentReviewFileSha256 ||
    registry.compatibilityDispositionSha256 !==
      pin.compatibilityDispositionFileSha256 ||
    registry.caseCount !== pin.caseCount ||
    sha256(input.manifestBytes) !== pin.manifestFileSha256 ||
    sha256(bundleBytes) !== pin.bundleFileSha256 ||
    sha256(input.semanticDiffBytes) !== pin.semanticDiffFileSha256 ||
    sha256(input.independentReviewBytes) !== pin.independentReviewFileSha256 ||
    sha256(input.dispositionBytes) !== pin.compatibilityDispositionFileSha256
  ) {
    throw new TypeError("Committed conformance trace authority is invalid")
  }
  const cached = validatedObservationTraceV4Oracles.get(input.activeDirectory)
  if (cached !== undefined) return cached
  const manifest = JSON.parse(input.manifestBytes.toString("utf8")) as Record<
    string,
    unknown
  >
  const bundle = JSON.parse(bundleBytes.toString("utf8")) as Record<
    string,
    unknown
  >
  const semanticDiff = JSON.parse(
    input.semanticDiffBytes.toString("utf8"),
  ) as Record<string, unknown>
  const disposition = JSON.parse(
    input.dispositionBytes.toString("utf8"),
  ) as Record<string, unknown>
  const review = JSON.parse(
    input.independentReviewBytes.toString("utf8"),
  ) as Record<string, unknown>
  const manifestCases = manifest.cases
  const records = bundle.records
  const { candidateRootSha256: _candidateRoot, ...manifestMaterial } = manifest
  const { bundleRootSha256: _bundleRoot, ...bundleMaterial } = bundle
  const { semanticDiffRootSha256: _diffRoot, ...diffMaterial } = semanticDiff
  const {
    compatibilityDispositionRootSha256: _dispositionRoot,
    ...dispositionMaterial
  } = disposition
  if (
    input.manifestBytes.toString("utf8") !== renderExactJson(manifest) ||
    bundleBytes.toString("utf8") !== renderExactJson(bundle) ||
    input.semanticDiffBytes.toString("utf8") !==
      renderExactJson(semanticDiff) ||
    input.independentReviewBytes.toString("utf8") !== renderExactJson(review) ||
    input.dispositionBytes.toString("utf8") !== renderExactJson(disposition) ||
    !exactKeys(manifest, [
      "schemaVersion",
      "candidateVersion",
      "lifecycle",
      "current",
      "generatedBy",
      "policy",
      "corpusCandidateVersion",
      "corpusRootSha256",
      "corpusFileSha256",
      "corpusCandidatePinPath",
      "corpusCandidatePinFileSha256",
      "semanticTupleId",
      "bundlePath",
      "bundleFileSha256",
      "bundleRootSha256",
      "semanticDiffPath",
      "semanticDiffFileSha256",
      "semanticDiffRootSha256",
      "compatibilityDispositionPath",
      "compatibilityDispositionFileSha256",
      "compatibilityDispositionRootSha256",
      "caseCount",
      "cases",
      "candidateRootSha256",
    ]) ||
    manifest.schemaVersion !== "v1.37-observation-trace-candidate-v4" ||
    manifest.candidateVersion !== pin.candidateVersion ||
    manifest.lifecycle !== "inactive-candidate" ||
    manifest.current !== false ||
    manifest.generatedBy !== "scripts/generate-v1-37-conformance-traces.ts" ||
    manifest.policy !== "candidate-only-plan-14-atomic-promotion" ||
    manifest.corpusCandidateVersion !== pin.corpusCandidateVersion ||
    manifest.corpusRootSha256 !== V1_37_CONFORMANCE_CORPUS_ROOT ||
    manifest.corpusRootSha256 !== pin.corpusRootSha256 ||
    manifest.corpusCandidatePinFileSha256 !==
      pin.corpusCandidatePinFileSha256 ||
    manifest.semanticTupleId !==
      CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD.tupleId ||
    manifest.semanticTupleId !== pin.semanticTupleId ||
    manifest.bundlePath !== "traces.bundle.json" ||
    manifest.bundleFileSha256 !== pin.bundleFileSha256 ||
    manifest.bundleRootSha256 !== pin.bundleRootSha256 ||
    manifest.semanticDiffPath !== "semantic-diff.json" ||
    manifest.semanticDiffFileSha256 !== pin.semanticDiffFileSha256 ||
    manifest.semanticDiffRootSha256 !== pin.semanticDiffRootSha256 ||
    manifest.compatibilityDispositionPath !==
      "compatibility-disposition.json" ||
    manifest.compatibilityDispositionFileSha256 !==
      pin.compatibilityDispositionFileSha256 ||
    manifest.compatibilityDispositionRootSha256 !==
      pin.compatibilityDispositionRootSha256 ||
    manifest.caseCount !== V1_37_CONFORMANCE_CORPUS.cases.length ||
    !Array.isArray(manifestCases) ||
    manifestCases.length !== V1_37_CONFORMANCE_CORPUS.cases.length ||
    canonicalHash(
      "cowards-game:v1.37:observation-trace-candidate:v4",
      manifestMaterial as JsonValue,
    ) !== pin.candidateRootSha256 ||
    !exactKeys(bundle, [
      "schemaVersion",
      "candidateVersion",
      "corpusVersion",
      "corpusRootSha256",
      "semanticTupleId",
      "caseCount",
      "records",
      "bundleRootSha256",
    ]) ||
    bundle.schemaVersion !== "v1.37-observation-trace-bundle-v1" ||
    bundle.candidateVersion !== pin.candidateVersion ||
    bundle.corpusVersion !== pin.corpusCandidateVersion ||
    bundle.corpusRootSha256 !== pin.corpusRootSha256 ||
    bundle.semanticTupleId !== pin.semanticTupleId ||
    bundle.caseCount !== V1_37_CONFORMANCE_CORPUS.cases.length ||
    !Array.isArray(records) ||
    records.length !== V1_37_CONFORMANCE_CORPUS.cases.length ||
    exactJsonDomainHash(
      "cowards-game:v1.37:observation-trace-bundle:exact-json:v1",
      bundleMaterial,
    ) !== pin.bundleRootSha256 ||
    semanticDiff.semanticDiffRootSha256 !== pin.semanticDiffRootSha256 ||
    exactJsonDomainHash(
      "cowards-game:v1.37:observation-trace-semantic-diff:v1",
      diffMaterial,
    ) !== pin.semanticDiffRootSha256 ||
    disposition.compatibilityDispositionRootSha256 !==
      pin.compatibilityDispositionRootSha256 ||
    exactJsonDomainHash(
      "cowards-game:v1.37:observation-trace-compatibility-disposition:v1",
      dispositionMaterial,
    ) !== pin.compatibilityDispositionRootSha256 ||
    review.status !== "approved-inactive-observation-candidate" ||
    review.candidateRootSha256 !== pin.candidateRootSha256 ||
    review.bundleRootSha256 !== pin.bundleRootSha256 ||
    review.caseTraceRootsSha256 !== pin.caseTraceRootsSha256 ||
    review.dispositionCoverageSha256 !== pin.dispositionCoverageSha256 ||
    review.protectedSurfaceRootsSha256 !== pin.protectedSurfaceRootsSha256
  ) {
    throw new TypeError("Committed conformance trace authority is invalid")
  }
  const traces = new Map<string, CanonicalConformanceTrace>()
  for (const [ordinal, testCase] of V1_37_CONFORMANCE_CORPUS.cases.entries()) {
    const manifestCase = manifestCases[ordinal] as unknown
    const record = records[ordinal] as unknown
    if (
      !exactKeys(manifestCase, [
        "ordinal",
        "caseId",
        "resultClass",
        "traceRoot",
      ]) ||
      !exactKeys(record, [
        "ordinal",
        "caseId",
        "traceRef",
        "resultClass",
        "canonicalInput",
        "trace",
        "evidence",
        "traceRoot",
      ]) ||
      record.ordinal !== ordinal ||
      record.caseId !== testCase.id ||
      record.traceRef !== `trace:${testCase.id}` ||
      record.resultClass !== testCase.expectation.resultClass ||
      manifestCase.ordinal !== ordinal ||
      manifestCase.caseId !== record.caseId ||
      manifestCase.resultClass !== record.resultClass ||
      manifestCase.traceRoot !== record.traceRoot ||
      record.canonicalInput === null ||
      typeof record.canonicalInput !== "object" ||
      record.evidence === null ||
      typeof record.evidence !== "object" ||
      !HASH.test(String(record.traceRoot))
    ) {
      throw new TypeError("Committed conformance trace inventory is invalid")
    }
    const trace = record.trace as CanonicalConformanceTrace
    const evidence = record.evidence
    if (
      !exactKeys(evidence, [
        "states",
        "events",
        "memories",
        "objectives",
        "terminal",
        "failure",
      ]) ||
      JSON.stringify(evidence.failure) !== JSON.stringify(trace.failure) ||
      trace.caseId !== testCase.id ||
      trace.corpusVersion !== pin.corpusCandidateVersion ||
      trace.corpusRootSha256 !== pin.corpusRootSha256 ||
      trace.semanticTupleId !== pin.semanticTupleId ||
      trace.resultClass !== testCase.expectation.resultClass ||
      trace.traceRoot !== record.traceRoot ||
      hashCanonicalConformanceTrace(trace) !== record.traceRoot ||
      compareCanonicalConformanceTrace({ expected: trace, actual: trace })
        .status !== "equal"
    ) {
      throw new TypeError("Committed conformance trace bytes are invalid")
    }
    traces.set(testCase.id, deepFreeze(trace) as CanonicalConformanceTrace)
  }
  const caseIds = Object.freeze(
    V1_37_CONFORMANCE_CORPUS.cases.map(({ id }) => id),
  )
  const oracle = Object.freeze({
    activeVersion: registry.activeVersion,
    candidateRootSha256: registry.candidateRootSha256,
    caseIds,
    traceForCase(caseId: string) {
      return traces.get(caseId)
    },
  })
  validatedObservationTraceV4Oracles.set(input.activeDirectory, oracle)
  return oracle
}

export const loadCommittedV137ConformanceTraceOracle = ({
  repoRoot = path.resolve(import.meta.dirname, "../../.."),
}: {
  readonly repoRoot?: string
} = {}): V137CommittedTraceOracle => {
  const registryPath = path.join(repoRoot, ORACLE_REGISTRY_RELATIVE)
  const registryBytes = readRegularBytes(registryPath)
  const registry = JSON.parse(registryBytes.toString("utf8")) as unknown
  if (
    !exactKeys(registry, [
      "schemaVersion",
      "activeVersion",
      "activePath",
      "candidateRootSha256",
      "manifestSha256",
      "semanticDiffSha256",
      "independentReviewSha256",
      "compatibilityDispositionSha256",
      "caseCount",
    ]) ||
    registry.schemaVersion !== "v1.37-conformance-trace-registry-v1" ||
    typeof registry.activeVersion !== "string" ||
    typeof registry.activePath !== "string" ||
    registry.activePath !==
      path.posix.join(
        "packages/golden/src/fixtures/v1-37-conformance-traces",
        registry.activeVersion,
      ) ||
    typeof registry.candidateRootSha256 !== "string" ||
    !HASH.test(registry.candidateRootSha256) ||
    !allHashes({
      manifestSha256: registry.manifestSha256,
      semanticDiffSha256: registry.semanticDiffSha256,
      independentReviewSha256: registry.independentReviewSha256,
      compatibilityDispositionSha256: registry.compatibilityDispositionSha256,
    }) ||
    registry.caseCount !== V1_37_CONFORMANCE_CORPUS.cases.length
  ) {
    throw new TypeError("Committed conformance trace registry is invalid")
  }
  const activeDirectory = path.join(repoRoot, registry.activePath)
  const activeDirectoryStat = lstatSync(activeDirectory)
  if (
    activeDirectoryStat.isSymbolicLink() ||
    !activeDirectoryStat.isDirectory()
  ) {
    throw new TypeError("Committed conformance trace directory is invalid")
  }
  const manifestBytes = readRegularBytes(
    path.join(activeDirectory, "manifest.json"),
  )
  const semanticDiffBytes = readRegularBytes(
    path.join(activeDirectory, "semantic-diff.json"),
  )
  const independentReviewBytes = readRegularBytes(
    path.join(activeDirectory, "independent-review.json"),
  )
  const dispositionBytes = readRegularBytes(
    path.join(activeDirectory, "compatibility-disposition.json"),
  )
  if (registry.activeVersion === "v1.37-observation-trace-v4") {
    return loadCommittedV137ObservationTraceV4Oracle({
      registry: registry as unknown as V137ValidatedTraceRegistry,
      registryBytes,
      activeDirectory,
      manifestBytes,
      semanticDiffBytes,
      independentReviewBytes,
      dispositionBytes,
    })
  }
  const manifest = JSON.parse(manifestBytes.toString("utf8")) as {
    schemaVersion: string
    candidateVersion: string
    corpusVersion: string
    corpusRootSha256: string
    semanticTupleId: string
    generatedBy: string
    authoritySource: string
    recordingApi: string
    projectorApi: string
    policy: string
    caseCount: number
    cases: Array<{
      ordinal: number
      caseId: string
      tracePath: string
      traceRoot: string
      traceFileSha256: string
      traceRef: string
      resultClass: V137ConformanceResultClass
    }>
    compatibilityEvidence: {
      baselineVersion: string
      candidateCorpusVersion: string
      protectedCategories: Record<string, unknown>
    }
    candidateRootSha256: string
  }
  const semanticDiff = JSON.parse(semanticDiffBytes.toString("utf8")) as {
    schemaVersion: string
    generatedBy: string
    baselineVersion: string
    candidateVersion: string
    corpusVersion: string
    corpusRootSha256: string
    candidateRootSha256: string
    caseDiffs: unknown[]
    protectedCategories: Record<string, unknown>
    semanticDiffRootSha256: string
  }
  const review = JSON.parse(independentReviewBytes.toString("utf8")) as {
    schemaVersion: string
    reviewedBy: string
    candidateVersion: string
    corpusVersion: string
    corpusRootSha256: string
    semanticTupleId: string
    candidateManifestSha256: string
    claimedCandidateRootSha256: string
    computedCandidateRootSha256: string
    semanticDiffSha256: string
    claimedSemanticDiffRootSha256: string
    computedSemanticDiffRootSha256: string
    caseCount: number
    caseTraceRootsSha256: string
    protectedCategories: Record<string, unknown>
    status: string
  }
  const disposition = JSON.parse(dispositionBytes.toString("utf8")) as {
    schemaVersion: string
    candidateVersion: string
    status: string
    candidateRootSha256: string
    semanticDiffRootSha256: string
    independentReviewSha256: string
    approval: unknown
  }
  const { candidateRootSha256: _candidateRootSha256, ...manifestRootMaterial } =
    manifest
  const {
    semanticDiffRootSha256: _semanticDiffRootSha256,
    ...semanticDiffRootMaterial
  } = semanticDiff
  if (
    !exactKeys(manifest, [
      "schemaVersion",
      "candidateVersion",
      "corpusVersion",
      "corpusRootSha256",
      "semanticTupleId",
      "generatedBy",
      "authoritySource",
      "recordingApi",
      "projectorApi",
      "policy",
      "caseCount",
      "cases",
      "compatibilityEvidence",
      "candidateRootSha256",
    ]) ||
    manifest.schemaVersion !== "v1.37-conformance-trace-candidate-v1" ||
    manifest.generatedBy !== "scripts/generate-v1-37-conformance-traces.ts" ||
    manifest.authoritySource !== "canonical-engine-kernel-recording" ||
    manifest.recordingApi !== "RecordedCanonicalTransitionV137" ||
    manifest.projectorApi !== "projectCanonicalConformanceTrace" ||
    manifest.policy !== "candidate-only-no-live-lane-oracle-no-promotion" ||
    manifest.candidateVersion !== registry.activeVersion ||
    manifest.corpusVersion !== V1_37_CONFORMANCE_CORPUS.version ||
    manifest.corpusRootSha256 !== V1_37_CONFORMANCE_CORPUS_ROOT ||
    manifest.semanticTupleId !==
      CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD.tupleId ||
    manifest.caseCount !== V1_37_CONFORMANCE_CORPUS.cases.length ||
    manifest.cases.length !== V1_37_CONFORMANCE_CORPUS.cases.length ||
    !exactKeys(manifest.compatibilityEvidence, [
      "baselineVersion",
      "candidateCorpusVersion",
      "protectedCategories",
    ]) ||
    manifest.compatibilityEvidence.baselineVersion !==
      "v1.4-locked-compatibility-v1" ||
    manifest.compatibilityEvidence.candidateCorpusVersion !==
      "v1.4-full-observation-compatibility-v1" ||
    !exactKeys(
      manifest.compatibilityEvidence.protectedCategories,
      PROTECTED_CATEGORIES,
    ) ||
    !allHashes(manifest.compatibilityEvidence.protectedCategories) ||
    canonicalHash(
      "cowards-game:v1.37:conformance-trace-candidate:v1",
      manifestRootMaterial as unknown as JsonValue,
    ) !== registry.candidateRootSha256 ||
    !exactKeys(semanticDiff, [
      "schemaVersion",
      "generatedBy",
      "baselineVersion",
      "candidateVersion",
      "corpusVersion",
      "corpusRootSha256",
      "candidateRootSha256",
      "caseDiffs",
      "protectedCategories",
      "semanticDiffRootSha256",
    ]) ||
    semanticDiff.schemaVersion !== "v1.37-conformance-trace-semantic-diff-v1" ||
    semanticDiff.generatedBy !==
      "scripts/generate-v1-37-conformance-traces.ts" ||
    semanticDiff.baselineVersion !== "v1.4-locked-compatibility-v1" ||
    semanticDiff.candidateVersion !== registry.activeVersion ||
    semanticDiff.corpusVersion !== V1_37_CONFORMANCE_CORPUS.version ||
    semanticDiff.corpusRootSha256 !== V1_37_CONFORMANCE_CORPUS_ROOT ||
    semanticDiff.candidateRootSha256 !== registry.candidateRootSha256 ||
    semanticDiff.caseDiffs.length !== V1_37_CONFORMANCE_CORPUS.cases.length ||
    !protectedCategoriesHaveNoDelta(semanticDiff.protectedCategories, false) ||
    canonicalHash(
      "cowards-game:v1.37:conformance-trace-semantic-diff:v1",
      semanticDiffRootMaterial as unknown as JsonValue,
    ) !== semanticDiff.semanticDiffRootSha256 ||
    !exactKeys(review, [
      "schemaVersion",
      "reviewedBy",
      "candidateVersion",
      "corpusVersion",
      "corpusRootSha256",
      "semanticTupleId",
      "candidateManifestSha256",
      "claimedCandidateRootSha256",
      "computedCandidateRootSha256",
      "semanticDiffSha256",
      "claimedSemanticDiffRootSha256",
      "computedSemanticDiffRootSha256",
      "caseCount",
      "caseTraceRootsSha256",
      "protectedCategories",
      "status",
    ]) ||
    review.schemaVersion !== "v1.37-conformance-trace-independent-review-v1" ||
    review.reviewedBy !== "scripts/review-v1-37-conformance-trace-diff.ts" ||
    review.candidateVersion !== registry.activeVersion ||
    review.corpusVersion !== V1_37_CONFORMANCE_CORPUS.version ||
    review.corpusRootSha256 !== V1_37_CONFORMANCE_CORPUS_ROOT ||
    review.semanticTupleId !==
      CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD.tupleId ||
    review.candidateManifestSha256 !== registry.manifestSha256 ||
    review.claimedCandidateRootSha256 !== registry.candidateRootSha256 ||
    review.computedCandidateRootSha256 !== registry.candidateRootSha256 ||
    review.semanticDiffSha256 !== registry.semanticDiffSha256 ||
    review.claimedSemanticDiffRootSha256 !==
      semanticDiff.semanticDiffRootSha256 ||
    review.computedSemanticDiffRootSha256 !==
      semanticDiff.semanticDiffRootSha256 ||
    review.caseCount !== V1_37_CONFORMANCE_CORPUS.cases.length ||
    !HASH.test(review.caseTraceRootsSha256) ||
    !protectedCategoriesHaveNoDelta(review.protectedCategories, true) ||
    !exactKeys(disposition, [
      "schemaVersion",
      "candidateVersion",
      "status",
      "candidateRootSha256",
      "semanticDiffRootSha256",
      "independentReviewSha256",
      "approval",
    ]) ||
    disposition.schemaVersion !==
      "v1.37-conformance-trace-compatibility-disposition-v1" ||
    disposition.candidateVersion !== registry.activeVersion ||
    disposition.status !== "no_semantic_delta" ||
    disposition.candidateRootSha256 !== registry.candidateRootSha256 ||
    disposition.semanticDiffRootSha256 !==
      semanticDiff.semanticDiffRootSha256 ||
    disposition.independentReviewSha256 !== registry.independentReviewSha256 ||
    disposition.approval !== null ||
    sha256(manifestBytes) !== registry.manifestSha256 ||
    sha256(semanticDiffBytes) !== registry.semanticDiffSha256 ||
    sha256(independentReviewBytes) !== registry.independentReviewSha256 ||
    sha256(dispositionBytes) !== registry.compatibilityDispositionSha256
  ) {
    throw new TypeError("Committed conformance trace authority is invalid")
  }
  const traces = new Map<string, CanonicalConformanceTrace>()
  for (const [ordinal, testCase] of V1_37_CONFORMANCE_CORPUS.cases.entries()) {
    const entry = manifest.cases[ordinal]
    if (
      entry === undefined ||
      !exactKeys(entry, [
        "ordinal",
        "caseId",
        "tracePath",
        "traceRoot",
        "traceFileSha256",
        "traceRef",
        "resultClass",
      ]) ||
      entry.ordinal !== ordinal ||
      entry.caseId !== testCase.id ||
      entry.tracePath !== path.posix.join("traces", `${testCase.id}.json`) ||
      entry.traceRef !== `trace:${testCase.id}` ||
      entry.resultClass !== testCase.expectation.resultClass ||
      !HASH.test(entry.traceRoot) ||
      !HASH.test(entry.traceFileSha256)
    ) {
      throw new TypeError("Committed conformance trace inventory is invalid")
    }
    const traceBytes = readRegularBytes(
      path.join(activeDirectory, entry.tracePath),
    )
    const trace = JSON.parse(
      traceBytes.toString("utf8"),
    ) as CanonicalConformanceTrace
    if (
      sha256(traceBytes) !== entry.traceFileSha256 ||
      trace.caseId !== testCase.id ||
      trace.corpusRootSha256 !== V1_37_CONFORMANCE_CORPUS_ROOT ||
      trace.resultClass !== testCase.expectation.resultClass ||
      trace.traceRoot !== entry.traceRoot ||
      hashCanonicalConformanceTrace(trace) !== entry.traceRoot
    ) {
      throw new TypeError("Committed conformance trace bytes are invalid")
    }
    traces.set(testCase.id, deepFreeze(trace) as CanonicalConformanceTrace)
  }
  const caseIds = Object.freeze(
    V1_37_CONFORMANCE_CORPUS.cases.map(({ id }) => id),
  )
  return Object.freeze({
    activeVersion: registry.activeVersion,
    candidateRootSha256: registry.candidateRootSha256 as `sha256:${string}`,
    caseIds,
    traceForCase(caseId: string) {
      return traces.get(caseId)
    },
  })
}

export interface V137RealAdapterCaseExecution {
  readonly executionMode: "supervised_real_adapter"
  readonly adapterSelectorId: string
  readonly trace: CanonicalConformanceTrace
  readonly adapterResult:
    | CountedTypeScriptSupervisedResultV118
    | CountedPythonSupervisedResultV118
    | CountedWasmWasiSupervisedResultV118
}

export interface V137RealLanguageExecutor {
  readonly languageId: V137ConformanceLanguageId
  executeCase(input: {
    readonly testCase: V137ConformanceCase
    readonly fixture: V137ConformanceFixture
  }): Promise<V137RealAdapterCaseExecution> | V137RealAdapterCaseExecution
}

export interface V137RestrictedDivergence {
  readonly code:
    | "LANE_EXECUTION_FAILED"
    | "REAL_ADAPTER_REQUIRED"
    | "ADAPTER_RESULT_MISMATCH"
    | "TRACE_DIVERGENCE"
  readonly languageId: V137ConformanceLanguageId
  readonly caseId: string
  readonly field: string | null
  readonly invocationOrdinal: number | null
  readonly transitionOrdinal: number | null
  readonly expectedHash: string | null
  readonly actualHash: string | null
}

export interface V137LanguageCasePass {
  readonly caseId: string
  readonly capability: string
  readonly resultClass: V137ConformanceResultClass
  readonly traceRoot: string
  readonly signedEvidenceSha256: `sha256:${string}` | null
  readonly supervisorEvidenceSha256: `sha256:${string}` | null
  readonly invocationRequestSha256: `sha256:${string}` | null
  readonly identitySha256: `sha256:${string}` | null
  readonly systemFailureCode: string | null
}

export type V137CompleteLanguageConformanceLaneResult =
  | Readonly<{
      status: "passed"
      languageId: V137ConformanceLanguageId
      corpusRootSha256: string
      oracleRootSha256: string
      adapterSelectorId: string
      cases: readonly V137LanguageCasePass[]
      runRootSha256: `sha256:${string}`
      divergence: null
    }>
  | Readonly<{
      status: "failed"
      languageId: V137ConformanceLanguageId
      corpusRootSha256: string
      oracleRootSha256: string
      adapterSelectorId: string
      cases: readonly V137LanguageCasePass[]
      runRootSha256: null
      divergence: V137RestrictedDivergence
    }>

const restrictedDivergence = (
  languageId: V137ConformanceLanguageId,
  caseId: string,
  divergence: CanonicalConformanceDivergence,
): V137RestrictedDivergence =>
  Object.freeze({
    code: "TRACE_DIVERGENCE",
    languageId,
    caseId,
    field: divergence.field,
    invocationOrdinal: divergence.invocationOrdinal,
    transitionOrdinal: divergence.transitionOrdinal,
    expectedHash: divergence.expectedHash,
    actualHash: divergence.actualHash,
  })

const simpleFailure = (
  code: Exclude<V137RestrictedDivergence["code"], "TRACE_DIVERGENCE">,
  languageId: V137ConformanceLanguageId,
  caseId: string,
): V137RestrictedDivergence =>
  Object.freeze({
    code,
    languageId,
    caseId,
    field: null,
    invocationOrdinal: null,
    transitionOrdinal: null,
    expectedHash: null,
    actualHash: null,
  })

const isVerifiedAdapterResult = (
  languageId: V137ConformanceLanguageId,
  value: V137RealAdapterCaseExecution["adapterResult"],
): boolean => {
  switch (languageId) {
    case "typescript":
      return isVerifiedCountedTypeScriptSupervisedResultV118(value)
    case "python":
      return isVerifiedCountedPythonSupervisedResultV118(value)
    case "rust":
    case "zig":
      return isVerifiedCountedWasmWasiSupervisedResultV118(value)
  }
}

const adapterResultClass = (
  value: V137RealAdapterCaseExecution["adapterResult"],
): V137ConformanceResultClass =>
  value.kind === "success"
    ? "success"
    : value.kind === "player_violation"
      ? "player_violation"
      : "system_failure"

const safeAdapterEvidence = (
  value: V137RealAdapterCaseExecution["adapterResult"],
): Pick<
  V137LanguageCasePass,
  | "signedEvidenceSha256"
  | "supervisorEvidenceSha256"
  | "invocationRequestSha256"
  | "identitySha256"
  | "systemFailureCode"
> => {
  if (value.kind === "system_failure") {
    return {
      signedEvidenceSha256: null,
      supervisorEvidenceSha256: null,
      invocationRequestSha256: null,
      identitySha256: null,
      systemFailureCode: value.code,
    }
  }
  return {
    signedEvidenceSha256: value.signedEvidence.evidenceSha256,
    supervisorEvidenceSha256: value.signedEvidence.evidence.rawReceiptSha256,
    invocationRequestSha256:
      value.signedEvidence.evidence.invocationRequestSha256,
    identitySha256: canonicalHash(
      "cowards-game:v1.37:language-case-identity:v1",
      value.signedEvidence.evidence.identityPins as unknown as JsonValue,
    ),
    systemFailureCode: null,
  }
}

const failedLane = (input: {
  readonly languageId: V137ConformanceLanguageId
  readonly oracle: V137CommittedTraceOracle
  readonly selector: string
  readonly cases: readonly V137LanguageCasePass[]
  readonly divergence: V137RestrictedDivergence
}): V137CompleteLanguageConformanceLaneResult =>
  deepFreeze({
    status: "failed" as const,
    languageId: input.languageId,
    corpusRootSha256: V1_37_CONFORMANCE_CORPUS_ROOT,
    oracleRootSha256: input.oracle.candidateRootSha256,
    adapterSelectorId: input.selector,
    cases: [...input.cases],
    runRootSha256: null,
    divergence: input.divergence,
  }) as V137CompleteLanguageConformanceLaneResult

export const runCompleteLanguageConformanceLaneV137 = async (input: {
  readonly executor: V137RealLanguageExecutor
  readonly repoRoot?: string
}): Promise<V137CompleteLanguageConformanceLaneResult> => {
  const { executor } = input
  const oracle = loadCommittedV137ConformanceTraceOracle(
    input.repoRoot === undefined ? {} : { repoRoot: input.repoRoot },
  )
  const selector = V137_REAL_ADAPTER_SELECTORS[executor.languageId]
  const fixture = V1_37_CONFORMANCE_CORPUS.fixtures.find(
    ({ languageId }) => languageId === executor.languageId,
  )
  if (fixture === undefined) {
    throw new TypeError("Conformance language fixture is missing")
  }
  const passedCases: V137LanguageCasePass[] = []
  const seenInvocationRequests = new Set<string>()
  for (const testCase of V1_37_CONFORMANCE_CORPUS.cases) {
    const expectedTrace = oracle.traceForCase(testCase.id)
    if (expectedTrace === undefined) {
      throw new TypeError("Committed trace case is missing")
    }
    let executed: V137RealAdapterCaseExecution
    try {
      executed = await executor.executeCase({
        testCase,
        fixture,
      })
    } catch {
      return failedLane({
        languageId: executor.languageId,
        oracle,
        selector,
        cases: passedCases,
        divergence: simpleFailure(
          "LANE_EXECUTION_FAILED",
          executor.languageId,
          testCase.id,
        ),
      })
    }
    if (
      executed.executionMode !== "supervised_real_adapter" ||
      executed.adapterSelectorId !== selector ||
      !isVerifiedAdapterResult(executor.languageId, executed.adapterResult)
    ) {
      return failedLane({
        languageId: executor.languageId,
        oracle,
        selector,
        cases: passedCases,
        divergence: simpleFailure(
          "REAL_ADAPTER_REQUIRED",
          executor.languageId,
          testCase.id,
        ),
      })
    }
    if (
      adapterResultClass(executed.adapterResult) !==
      testCase.expectation.resultClass
    ) {
      return failedLane({
        languageId: executor.languageId,
        oracle,
        selector,
        cases: passedCases,
        divergence: simpleFailure(
          "ADAPTER_RESULT_MISMATCH",
          executor.languageId,
          testCase.id,
        ),
      })
    }
    const comparison = compareCanonicalConformanceTrace({
      expected: expectedTrace,
      actual: executed.trace,
    })
    if (comparison.status !== "equal") {
      const divergence =
        comparison.status === "diverged"
          ? restrictedDivergence(
              executor.languageId,
              testCase.id,
              comparison.divergence,
            )
          : Object.freeze({
              code: "TRACE_DIVERGENCE" as const,
              languageId: executor.languageId,
              caseId: testCase.id,
              field: "traceRoot",
              invocationOrdinal: null,
              transitionOrdinal: null,
              expectedHash:
                "claimedRootHash" in comparison
                  ? comparison.claimedRootHash
                  : null,
              actualHash:
                "computedRootHash" in comparison
                  ? comparison.computedRootHash
                  : comparison.errorHash,
            })
      return failedLane({
        languageId: executor.languageId,
        oracle,
        selector,
        cases: passedCases,
        divergence,
      })
    }
    const safeEvidence = safeAdapterEvidence(executed.adapterResult)
    if (
      safeEvidence.invocationRequestSha256 !== null &&
      seenInvocationRequests.has(safeEvidence.invocationRequestSha256)
    ) {
      return failedLane({
        languageId: executor.languageId,
        oracle,
        selector,
        cases: passedCases,
        divergence: simpleFailure(
          "ADAPTER_RESULT_MISMATCH",
          executor.languageId,
          testCase.id,
        ),
      })
    }
    if (safeEvidence.invocationRequestSha256 !== null) {
      seenInvocationRequests.add(safeEvidence.invocationRequestSha256)
    }
    passedCases.push(
      Object.freeze({
        caseId: testCase.id,
        capability: testCase.capability,
        resultClass: executed.trace.resultClass,
        traceRoot: comparison.traceRoot,
        ...safeEvidence,
      }),
    )
  }
  const material = {
    languageId: executor.languageId,
    corpusRootSha256: V1_37_CONFORMANCE_CORPUS_ROOT,
    oracleRootSha256: oracle.candidateRootSha256,
    adapterSelectorId: selector,
    cases: passedCases,
  }
  return deepFreeze({
    status: "passed" as const,
    ...material,
    runRootSha256: canonicalHash(
      "cowards-game:v1.37:complete-language-conformance-run:v1",
      material as unknown as JsonValue,
    ),
    divergence: null,
  }) as V137CompleteLanguageConformanceLaneResult
}

export interface V137CompleteFourLanguageMatrix {
  readonly schemaVersion: "v1.37-complete-four-language-matrix-v1"
  readonly corpusRootSha256: string
  readonly oracleRootSha256: string
  readonly laneRunRoots: Readonly<Record<V137ConformanceLanguageId, string>>
  readonly matrixRootSha256: `sha256:${string}`
}

export const requireCompleteFourLanguageMatrixV137 = (
  laneResults: readonly V137CompleteLanguageConformanceLaneResult[],
): V137CompleteFourLanguageMatrix => {
  if (
    laneResults.length !== V1_37_CONFORMANCE_LANGUAGES.length ||
    new Set(laneResults.map(({ languageId }) => languageId)).size !==
      V1_37_CONFORMANCE_LANGUAGES.length
  ) {
    throw new TypeError("Complete four-language matrix is required")
  }
  const laneRunRoots = Object.fromEntries(
    V1_37_CONFORMANCE_LANGUAGES.map((languageId) => {
      const result = laneResults.find(
        (candidate) => candidate.languageId === languageId,
      )
      if (
        result?.status !== "passed" ||
        result.cases.length !== V1_37_CONFORMANCE_CORPUS.cases.length ||
        result.runRootSha256 === null
      ) {
        throw new TypeError("Every real language lane must pass every case")
      }
      return [languageId, result.runRootSha256]
    }),
  ) as Record<V137ConformanceLanguageId, string>
  const oracleRoots = new Set(
    laneResults.map(({ oracleRootSha256 }) => oracleRootSha256),
  )
  if (oracleRoots.size !== 1) {
    throw new TypeError("Language lanes used different committed oracles")
  }
  const material = {
    schemaVersion: "v1.37-complete-four-language-matrix-v1" as const,
    corpusRootSha256: V1_37_CONFORMANCE_CORPUS_ROOT,
    oracleRootSha256: laneResults[0]!.oracleRootSha256,
    laneRunRoots,
  }
  return deepFreeze({
    ...material,
    matrixRootSha256: canonicalHash(
      "cowards-game:v1.37:complete-four-language-matrix:v1",
      material as unknown as JsonValue,
    ),
  }) as V137CompleteFourLanguageMatrix
}
