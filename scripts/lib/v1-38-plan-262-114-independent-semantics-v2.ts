import { createHash } from "node:crypto"

type Sha = `sha256:${string}`
type Json = Record<string, any>

const fail = (code: string): never => { throw new TypeError(code) }
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => Array.isArray(item)
    ? item.map(normalize)
    : item !== null && typeof item === "object"
      ? Object.fromEntries(Object.entries(item as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)]))
      : item
  return `${JSON.stringify(normalize(value))}\n`
}
const sha = (value: string): Sha => `sha256:${createHash("sha256").update(value).digest("hex")}`
const exactKeys = (value: Json, keys: readonly string[], code: string): void => {
  if (canonical(Object.keys(value).sort()) !== canonical([...keys].sort())) fail(code)
}
const shaPattern = /^sha256:[0-9a-f]{64}$/u

export type V138Plan114PostFixture = Readonly<{
  journalPresent: boolean
  privateDirectoryPresent: boolean
  terminalPresent: boolean
  lockPresent: boolean
  reproductionPresent: boolean
  adjudicationOrDownstreamPresent: boolean
  outcome?: Readonly<{
    disposition: "active" | "succeeded" | "terminal_failure" | "exhausted"
    journalRoot?: Sha
    stateRoot?: Sha
    completeCleanup: boolean
    reproductionPresent: boolean
    downstreamAuthority: string
  }>
}>

export const deriveV138Plan114IndependentPostSemantics = (input: V138Plan114PostFixture) => {
  if (input.lockPresent || input.adjudicationOrDownstreamPresent)
    fail("V138_PLAN114_ORACLE_POST_FORBIDDEN")
  const effectCount = [input.journalPresent, input.privateDirectoryPresent, input.terminalPresent]
    .filter(Boolean).length
  if (effectCount === 0) {
    if (input.outcome !== undefined || input.reproductionPresent)
      fail("V138_PLAN114_ORACLE_OUTCOME_WITHOUT_EFFECTS")
    return Object.freeze({ status: "no_effects" as const, downstreamAuthority: "denied" as const })
  }
  if (effectCount !== 3 || input.outcome === undefined || input.outcome.completeCleanup !== true ||
      input.outcome.disposition === "active" || input.outcome.downstreamAuthority !== "denied" ||
      input.reproductionPresent !== input.outcome.reproductionPresent ||
      (input.outcome.disposition === "succeeded") !== input.outcome.reproductionPresent)
    fail("V138_PLAN114_ORACLE_BOUNDED_OUTCOME_INVALID")
  return Object.freeze({
    status: input.outcome.disposition === "succeeded" ? "bounded_success" as const : "bounded_terminal" as const,
    downstreamAuthority: "denied" as const,
  })
}

export const V138_PLAN114_REPRODUCTION_KEYS = Object.freeze([
  "schemaVersion", "status", "admittedCalibrationRoot", "chargedAttemptCount",
  "acceptedCellCount", "completeCleanup", "executionRoot", "runtimeRoute",
  "samplingMilliseconds", "partialAcceptedEvidenceReusable", "privacyProjection",
  "phase263PlanningAuthorized", "candidateSearchAuthorized",
  "formationMaterializationAuthorized", "holdoutOpeningAuthorized",
  "publicAuthorized", "productAuthorized", "productionAuthorized", "receiptRoot",
])
const PRIVACY_KEYS = Object.freeze([
  "strategySourceIncluded", "strategyMemoryIncluded", "soldierMemoryIncluded",
  "objectivePayloadIncluded", "rawDiagnosticsIncluded",
])
const AUTHORITY_KEYS = Object.freeze([
  "phase263PlanningAuthorized", "candidateSearchAuthorized",
  "formationMaterializationAuthorized", "holdoutOpeningAuthorized",
  "publicAuthorized", "productAuthorized", "productionAuthorized",
])

export const computeV138Plan114IndependentReproductionRoot = (body: Json): Sha =>
  sha(`v138-current-matrix-reproduction-v17\0${canonical(body)}`)

export const deriveV138Plan114IndependentReproductionSemantics = (input: {
  artifact: Json
  journalRecords: readonly Json[]
  outcome: Json
}) => {
  const { artifact, journalRecords, outcome } = input
  exactKeys(artifact, V138_PLAN114_REPRODUCTION_KEYS, "V138_PLAN114_ORACLE_REPRODUCTION_KEYS")
  exactKeys(artifact.privacyProjection, PRIVACY_KEYS, "V138_PLAN114_ORACLE_PRIVACY_KEYS")
  const { receiptRoot, ...body } = artifact
  if (artifact.schemaVersion !== "v1.38-current-matrix-reproduction-v17" ||
      artifact.status !== "passed_exact" || !shaPattern.test(artifact.admittedCalibrationRoot) ||
      artifact.chargedAttemptCount !== 540 || artifact.acceptedCellCount !== 540 ||
      artifact.completeCleanup !== true || !shaPattern.test(artifact.executionRoot) ||
      artifact.runtimeRoute !== "v1.18/v1.19/MATCH_KERNEL" || artifact.samplingMilliseconds !== 200 ||
      artifact.partialAcceptedEvidenceReusable !== false ||
      PRIVACY_KEYS.some((key) => artifact.privacyProjection[key] !== false) ||
      AUTHORITY_KEYS.some((key) => artifact[key] !== false) || !shaPattern.test(receiptRoot) ||
      computeV138Plan114IndependentReproductionRoot(body) !== receiptRoot ||
      outcome.disposition !== "succeeded" || !shaPattern.test(outcome.journalRoot) ||
      !shaPattern.test(outcome.stateRoot) || outcome.completeCleanup !== true ||
      outcome.reproductionPresent !== true || outcome.downstreamAuthority !== "denied")
    fail("V138_PLAN114_ORACLE_REPRODUCTION_SEMANTICS")
  const admitted = journalRecords.filter((record) =>
    record.kind === "finish_calibration" && record.status === "admitted")
  const finished = journalRecords.filter((record) => record.kind === "finish_reproduction")
  if (admitted.length !== 1 || finished.length !== 1) fail("V138_PLAN114_ORACLE_JOURNAL_JOIN")
  const calibration = admitted[0]!
  const reproduction = finished[0]!
  if (calibration.completeCleanup !== true || calibration.supervisionRoot !== artifact.admittedCalibrationRoot ||
      calibration.routeIdentity !== reproduction.routeIdentity || calibration.owner !== reproduction.owner ||
      reproduction.status !== "passed_exact" || reproduction.acceptedCells !== 540 ||
      reproduction.completeCleanup !== true || reproduction.reproductionRoot !== receiptRoot ||
      journalRecords.at(-1)?.recordRoot !== outcome.journalRoot)
    fail("V138_PLAN114_ORACLE_JOURNAL_JOIN")
  return Object.freeze({
    receiptRoot: receiptRoot as Sha,
    admittedCalibrationRoot: artifact.admittedCalibrationRoot as Sha,
    executionRoot: artifact.executionRoot as Sha,
    chargedAttemptCount: 540 as const,
    acceptedCellCount: 540 as const,
    completeCleanup: true as const,
    downstreamAuthority: "denied" as const,
  })
}
