// eslint-disable-next-line no-restricted-imports -- Release tooling reuses the canonical public-output privacy seam directly.
import { assertPublicOutputLeakSafe } from "../../packages/spec/src/public-output-privacy.js"

export const V137_INTEGRATED_PROOF_REQUIREMENT_IDS = Object.freeze([
  "PROOF-01",
  "PROOF-02",
  "PROOF-03",
  "PROOF-04",
  "PROOF-05",
  "PROOF-06",
] as const)

export const V137_INTEGRATED_PROOF_DECISION_IDS = Object.freeze(
  Array.from(
    { length: 12 },
    (_, index) => `D-${String(index + 1).padStart(2, "0")}`,
  ) as Array<`D-${string}`>,
)

export type V137IntegratedProofRequirementId =
  (typeof V137_INTEGRATED_PROOF_REQUIREMENT_IDS)[number]
export type V137IntegratedProofDecisionId =
  (typeof V137_INTEGRATED_PROOF_DECISION_IDS)[number]

export type V137IntegratedProofScenario = Readonly<{
  id: string
  group:
    | "four-lane-positive"
    | "typed-failures"
    | "identity-drift"
    | "chronicle-replay"
    | "set-persistence"
    | "retry-rollback"
    | "public-browser"
  requirementIds: readonly V137IntegratedProofRequirementId[]
  decisionIds: readonly V137IntegratedProofDecisionId[]
  topologyParticipants: readonly string[]
  expectedResultClass:
    | "success"
    | "player-violation"
    | "system-failure"
    | "rejected"
    | "complete"
    | "degraded"
    | "public-safe"
  mutationAssertions: readonly string[]
  restrictedEvidenceClass:
    | "command-receipt"
    | "service-trace"
    | "rollback-trace"
    | "privacy-scan"
  publicLimitationCode: string
  requiredDisposition: "required"
}>

export type V137IntegratedProofManifestErrorCode =
  | "V137_MANIFEST_INVALID"
  | "V137_MANIFEST_MISSING_SCENARIO"
  | "V137_MANIFEST_EXTRA_SCENARIO"
  | "V137_MANIFEST_DUPLICATE_SCENARIO"
  | "V137_MANIFEST_ORDER_MISMATCH"
  | "V137_MANIFEST_REQUIRED_SCENARIO_SKIPPED"
  | "V137_MANIFEST_REQUIRED_SCENARIO_UNAVAILABLE"
  | "V137_MANIFEST_ROW_SHAPE_MISMATCH"
  | "V137_MANIFEST_ROW_MALFORMED"
  | "V137_MANIFEST_TRACE_MISMATCH"
  | "V137_MANIFEST_COVERAGE_MISMATCH"

export class V137IntegratedProofManifestError extends TypeError {
  readonly code: V137IntegratedProofManifestErrorCode

  constructor(code: V137IntegratedProofManifestErrorCode) {
    super(code)
    this.name = "V137IntegratedProofManifestError"
    this.code = code
  }
}

const freeze = <T extends V137IntegratedProofScenario>(row: T): T => {
  Object.freeze(row.requirementIds)
  Object.freeze(row.decisionIds)
  Object.freeze(row.topologyParticipants)
  Object.freeze(row.mutationAssertions)
  return Object.freeze(row)
}

const scenario = (
  id: string,
  group: V137IntegratedProofScenario["group"],
  requirementIds: readonly V137IntegratedProofRequirementId[],
  decisionIds: readonly V137IntegratedProofDecisionId[],
  topologyParticipants: readonly string[],
  expectedResultClass: V137IntegratedProofScenario["expectedResultClass"],
  mutationAssertions: readonly string[],
  restrictedEvidenceClass: V137IntegratedProofScenario["restrictedEvidenceClass"],
  publicLimitationCode = "none",
): V137IntegratedProofScenario =>
  freeze({
    id,
    group,
    requirementIds: [...requirementIds],
    decisionIds: [...decisionIds],
    topologyParticipants: [...topologyParticipants],
    expectedResultClass,
    mutationAssertions: [...mutationAssertions],
    restrictedEvidenceClass,
    publicLimitationCode,
    requiredDisposition: "required",
  })

const LANE_REQUIREMENTS = ["PROOF-02", "PROOF-03", "PROOF-05"] as const
const LANE_DECISIONS = ["D-01", "D-02", "D-03", "D-05", "D-09", "D-12"] as const
const LANE_PARTICIPANTS = [
  "postgresql",
  "go-backend",
  "runtime-service",
  "selected-provider",
  "canonical-kernel",
  "chronicle",
  "replay",
] as const
const FAILURE_REQUIREMENTS = ["PROOF-03", "PROOF-05"] as const
const FAILURE_DECISIONS = ["D-01", "D-03", "D-05", "D-07", "D-09", "D-12"] as const
const FAILURE_PARTICIPANTS = [
  "postgresql",
  "go-backend",
  "runtime-service",
  "selected-provider",
] as const
const NO_MUTATION = [
  "no-gameplay-mutation",
  "no-memory-mutation",
  "no-result-mutation",
  "no-standings-mutation",
] as const
const IDENTITY_REQUIREMENTS = ["PROOF-01", "PROOF-02", "PROOF-03", "PROOF-06"] as const
const IDENTITY_DECISIONS = ["D-02", "D-03", "D-09", "D-10", "D-12"] as const
const CHRONICLE_REQUIREMENTS = ["PROOF-01", "PROOF-03", "PROOF-04", "PROOF-06"] as const
const CHRONICLE_DECISIONS = ["D-01", "D-03", "D-10", "D-12"] as const
const SET_REQUIREMENTS = ["PROOF-03", "PROOF-04"] as const
const SET_DECISIONS = ["D-01", "D-03", "D-11", "D-12"] as const
const PUBLIC_REQUIREMENTS = ["PROOF-03", "PROOF-04", "PROOF-05", "PROOF-06"] as const
const PUBLIC_DECISIONS = ["D-04", "D-05", "D-06", "D-07", "D-08", "D-09", "D-12"] as const

export const V137_INTEGRATED_PROOF_SCENARIOS = Object.freeze([
  ...(["typescript", "python", "rust", "zig"] as const).map((language) =>
    scenario(
      `lane-${language}-success`,
      "four-lane-positive",
      LANE_REQUIREMENTS,
      LANE_DECISIONS,
      LANE_PARTICIPANTS,
      "success",
      ["canonical-state-recorded", "chronicle-recorded", "reconstruction-equal"],
      "service-trace",
    ),
  ),
  scenario(
    "player-invalid-action",
    "typed-failures",
    FAILURE_REQUIREMENTS,
    FAILURE_DECISIONS,
    FAILURE_PARTICIPANTS,
    "player-violation",
    ["canonical-player-consequence-only", "no-system-penalty-substitution"],
    "service-trace",
  ),
  ...(["timeout", "crash", "unavailable", "transport", "malformed", "stale"] as const).map(
    (failure) =>
      scenario(
        `system-${failure}-no-mutation`,
        "typed-failures",
        FAILURE_REQUIREMENTS,
        FAILURE_DECISIONS,
        FAILURE_PARTICIPANTS,
        "system-failure",
        NO_MUTATION,
        "service-trace",
        failure === "unavailable" ? "infrastructure-unavailable-blocks-proof" : "none",
      ),
  ),
  scenario(
    "stale-certificate-rejected",
    "identity-drift",
    IDENTITY_REQUIREMENTS,
    IDENTITY_DECISIONS,
    ["evidence-authority", "go-backend", "runtime-service"],
    "rejected",
    NO_MUTATION,
    "command-receipt",
    "stale-runtime-evidence",
  ),
  ...(["artifact", "toolchain", "containment"] as const).map((identity) =>
    scenario(
      `${identity}-identity-drift-rejected`,
      "identity-drift",
      IDENTITY_REQUIREMENTS,
      IDENTITY_DECISIONS,
      ["evidence-authority", "runtime-service", "selected-provider"],
      "rejected",
      NO_MUTATION,
      "command-receipt",
      `${identity}-identity-mismatch`,
    ),
  ),
  scenario(
    "mixed-tuple-rejected",
    "identity-drift",
    IDENTITY_REQUIREMENTS,
    IDENTITY_DECISIONS,
    ["semantic-authority", "go-backend", "runtime-service"],
    "rejected",
    NO_MUTATION,
    "command-receipt",
    "mixed-semantic-tuple",
  ),
  ...(["schedule", "execution"] as const).map((boundary) =>
    scenario(
      `${boundary}-authority-stale-rejected`,
      "identity-drift",
      IDENTITY_REQUIREMENTS,
      IDENTITY_DECISIONS,
      ["semantic-authority", "postgresql", "go-backend", "runtime-service"],
      "rejected",
      NO_MUTATION,
      "service-trace",
      `stale-authority-at-${boundary}`,
    ),
  ),
  scenario(
    "current-chronicle-valid",
    "chronicle-replay",
    CHRONICLE_REQUIREMENTS,
    CHRONICLE_DECISIONS,
    ["canonical-kernel", "chronicle", "replay"],
    "success",
    ["chronicle-recorded", "canonical-state-recorded"],
    "service-trace",
  ),
  scenario(
    "chronicle-semantic-mutation-rejected",
    "chronicle-replay",
    CHRONICLE_REQUIREMENTS,
    CHRONICLE_DECISIONS,
    ["chronicle", "replay"],
    "rejected",
    NO_MUTATION,
    "service-trace",
    "chronicle-semantic-mismatch",
  ),
  scenario(
    "reconstruction-equivalent",
    "chronicle-replay",
    CHRONICLE_REQUIREMENTS,
    CHRONICLE_DECISIONS,
    ["canonical-kernel", "chronicle", "replay"],
    "success",
    ["reconstruction-equal", "canonical-state-recorded"],
    "service-trace",
  ),
  ...(["v1-4", "v1-17"] as const).map((version) =>
    scenario(
      `historical-${version}-replay`,
      "chronicle-replay",
      CHRONICLE_REQUIREMENTS,
      CHRONICLE_DECISIONS,
      ["historical-dispatch", "chronicle", "replay"],
      "success",
      ["historical-evidence-immutable", "reconstruction-equal"],
      "command-receipt",
      "historical-semantics-preserved",
    ),
  ),
  ...(["unknown", "mixed"] as const).map((version) =>
    scenario(
      `${version}-version-rejected`,
      "chronicle-replay",
      CHRONICLE_REQUIREMENTS,
      CHRONICLE_DECISIONS,
      ["chronicle", "replay"],
      "rejected",
      NO_MUTATION,
      "command-receipt",
      `${version}-chronicle-version`,
    ),
  ),
  scenario(
    "four-condition-set-complete",
    "set-persistence",
    SET_REQUIREMENTS,
    SET_DECISIONS,
    ["postgresql", "go-backend", "set-policy", "standings"],
    "complete",
    ["atomic-persistence", "exact-four-condition-coverage"],
    "service-trace",
  ),
  scenario(
    "set-atomic-persistence",
    "set-persistence",
    SET_REQUIREMENTS,
    SET_DECISIONS,
    ["postgresql", "go-backend", "set-policy"],
    "success",
    ["atomic-persistence", "no-partial-counting"],
    "service-trace",
  ),
  scenario(
    "set-order-independent-completion",
    "set-persistence",
    SET_REQUIREMENTS,
    SET_DECISIONS,
    ["postgresql", "go-backend", "set-policy", "standings"],
    "complete",
    ["completion-order-independent", "exact-four-condition-coverage"],
    "service-trace",
  ),
  scenario(
    "set-degraded-no-partial-counting",
    "set-persistence",
    SET_REQUIREMENTS,
    SET_DECISIONS,
    ["postgresql", "go-backend", "set-policy", "standings"],
    "degraded",
    ["no-partial-counting", "no-standings-mutation"],
    "service-trace",
    "degraded-set-not-counted",
  ),
  scenario(
    "idempotent-condition-retry",
    "retry-rollback",
    SET_REQUIREMENTS,
    SET_DECISIONS,
    ["postgresql", "go-backend", "runtime-service"],
    "success",
    ["idempotent-retry", "no-duplicate-condition"],
    "rollback-trace",
  ),
  scenario(
    "transaction-failure-no-completion",
    "retry-rollback",
    SET_REQUIREMENTS,
    SET_DECISIONS,
    ["postgresql", "go-backend", "chronicle"],
    "system-failure",
    ["no-result-mutation", "no-standings-mutation", "no-partial-counting"],
    "rollback-trace",
    "transaction-rolled-back",
  ),
  scenario(
    "lane-kill-switch",
    "retry-rollback",
    SET_REQUIREMENTS,
    SET_DECISIONS,
    ["evidence-authority", "go-backend", "runtime-service"],
    "rejected",
    NO_MUTATION,
    "rollback-trace",
    "lane-not-counted",
  ),
  scenario(
    "cohort-invalidation-compensation",
    "retry-rollback",
    SET_REQUIREMENTS,
    SET_DECISIONS,
    ["postgresql", "go-backend", "standings"],
    "success",
    ["compensating-reversal", "historical-evidence-immutable"],
    "rollback-trace",
  ),
  scenario(
    "standings-recompute",
    "retry-rollback",
    SET_REQUIREMENTS,
    SET_DECISIONS,
    ["postgresql", "go-backend", "standings"],
    "success",
    ["recompute-derived-only", "historical-evidence-immutable"],
    "rollback-trace",
  ),
  scenario(
    "runtime-service-version-rollback",
    "retry-rollback",
    SET_REQUIREMENTS,
    SET_DECISIONS,
    ["semantic-authority", "go-backend", "runtime-service"],
    "rejected",
    NO_MUTATION,
    "rollback-trace",
    "rolled-back-version-not-current",
  ),
  scenario(
    "mixed-state-rejected",
    "retry-rollback",
    SET_REQUIREMENTS,
    SET_DECISIONS,
    ["semantic-authority", "postgresql", "go-backend", "runtime-service"],
    "rejected",
    NO_MUTATION,
    "rollback-trace",
    "mixed-release-state",
  ),
  ...([
    ["lane-status-truthful", "lane-counted-status", ["web", "go-backend", "evidence-authority"]],
    ["historical-status-public", "historical-status", ["web", "go-backend", "chronicle"]],
    ["complete-degraded-results-public", "set-status", ["web", "go-backend", "postgresql"]],
    ["standings-public", "standings-status", ["web", "go-backend", "standings"]],
    ["replay-public", "replay-status", ["web", "go-backend", "replay"]],
  ] as const).map(([id, observation, participants]) =>
    scenario(
      id,
      "public-browser",
      PUBLIC_REQUIREMENTS,
      PUBLIC_DECISIONS,
      participants,
      "public-safe",
      ["public-read-only", "pre-reduction-scan", observation],
      "privacy-scan",
    ),
  ),
  ...(["desktop", "mobile"] as const).map((viewport) =>
    scenario(
      `${viewport}-board-realism`,
      "public-browser",
      PUBLIC_REQUIREMENTS,
      PUBLIC_DECISIONS,
      ["web", "browser", "replay"],
      "public-safe",
      ["public-read-only", "in-bounds-render", "pre-reduction-scan"],
      "privacy-scan",
    ),
  ),
  scenario(
    "rendered-privacy",
    "public-browser",
    PUBLIC_REQUIREMENTS,
    PUBLIC_DECISIONS,
    ["web", "browser"],
    "public-safe",
    ["public-read-only", "pre-reduction-scan"],
    "privacy-scan",
  ),
  scenario(
    "default-network-privacy",
    "public-browser",
    PUBLIC_REQUIREMENTS,
    PUBLIC_DECISIONS,
    ["web", "browser", "go-backend"],
    "public-safe",
    ["public-read-only", "pre-reduction-scan", "all-default-responses-scanned"],
    "privacy-scan",
  ),
] as const)

const ROW_KEYS = Object.freeze([
  "id",
  "group",
  "requirementIds",
  "decisionIds",
  "topologyParticipants",
  "expectedResultClass",
  "mutationAssertions",
  "restrictedEvidenceClass",
  "publicLimitationCode",
  "requiredDisposition",
] as const)

const exactKeys = (value: Record<string, unknown>): boolean => {
  const keys = Object.keys(value).sort()
  return keys.length === ROW_KEYS.length && keys.every((key, index) => key === [...ROW_KEYS].sort()[index])
}

const sameValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right)

const throwCode = (code: V137IntegratedProofManifestErrorCode): never => {
  throw new V137IntegratedProofManifestError(code)
}

const assertExactCoverage = (
  scenarios: readonly V137IntegratedProofScenario[],
): void => {
  const requirements = [...new Set(scenarios.flatMap((row) => row.requirementIds))].sort()
  const decisions = [...new Set(scenarios.flatMap((row) => row.decisionIds))].sort()
  if (
    !sameValue(requirements, V137_INTEGRATED_PROOF_REQUIREMENT_IDS) ||
    !sameValue(decisions, V137_INTEGRATED_PROOF_DECISION_IDS)
  ) {
    throwCode("V137_MANIFEST_COVERAGE_MISMATCH")
  }
}

assertExactCoverage(V137_INTEGRATED_PROOF_SCENARIOS)

export const parseV137IntegratedProofManifest = (
  input: unknown,
): typeof V137_INTEGRATED_PROOF_SCENARIOS => {
  if (!Array.isArray(input)) throwCode("V137_MANIFEST_INVALID")
  if (input.length < V137_INTEGRATED_PROOF_SCENARIOS.length) {
    throwCode("V137_MANIFEST_MISSING_SCENARIO")
  }
  if (input.length > V137_INTEGRATED_PROOF_SCENARIOS.length) {
    throwCode("V137_MANIFEST_EXTRA_SCENARIO")
  }
  const ids = input.map((row) =>
    row !== null && typeof row === "object" && typeof (row as { id?: unknown }).id === "string"
      ? (row as { id: string }).id
      : "",
  )
  if (new Set(ids).size !== ids.length) {
    throwCode("V137_MANIFEST_DUPLICATE_SCENARIO")
  }
  if (ids.some((id, index) => id !== V137_INTEGRATED_PROOF_SCENARIOS[index]!.id)) {
    throwCode("V137_MANIFEST_ORDER_MISMATCH")
  }

  input.forEach((rawRow, index) => {
    if (rawRow === null || typeof rawRow !== "object" || Array.isArray(rawRow)) {
      throwCode("V137_MANIFEST_ROW_MALFORMED")
    }
    const row = rawRow as Record<string, unknown>
    if (!exactKeys(row)) throwCode("V137_MANIFEST_ROW_SHAPE_MISMATCH")
    if (row.requiredDisposition === "skipped") {
      throwCode("V137_MANIFEST_REQUIRED_SCENARIO_SKIPPED")
    }
    if (row.requiredDisposition === "unavailable") {
      throwCode("V137_MANIFEST_REQUIRED_SCENARIO_UNAVAILABLE")
    }
    if (
      typeof row.id !== "string" ||
      typeof row.group !== "string" ||
      !Array.isArray(row.requirementIds) ||
      !Array.isArray(row.decisionIds) ||
      !Array.isArray(row.topologyParticipants) ||
      typeof row.expectedResultClass !== "string" ||
      !Array.isArray(row.mutationAssertions) ||
      typeof row.restrictedEvidenceClass !== "string" ||
      typeof row.publicLimitationCode !== "string" ||
      row.requiredDisposition !== "required" ||
      !/^(?:none|[a-z0-9]+(?:-[a-z0-9]+)*)$/u.test(row.publicLimitationCode)
    ) {
      throwCode("V137_MANIFEST_ROW_MALFORMED")
    }
    try {
      assertPublicOutputLeakSafe(row, "v1.37 integrated proof manifest row")
    } catch {
      throwCode("V137_MANIFEST_ROW_MALFORMED")
    }
    if (!sameValue(row, V137_INTEGRATED_PROOF_SCENARIOS[index])) {
      throwCode("V137_MANIFEST_TRACE_MISMATCH")
    }
  })
  assertExactCoverage(input as V137IntegratedProofScenario[])
  return V137_INTEGRATED_PROOF_SCENARIOS
}
