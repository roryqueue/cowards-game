const LEAN_CHILD_FAILURE_STAGES = ["handshake", "preflight", "candidate-import", "match", "finalize", "unknown"] as const
const trustedCodes = <const Prefix extends string, const Codes extends readonly string[]>(prefix: Prefix, codes: Codes) =>
  codes.map(code => `${prefix}${code}` as `${Prefix}${Codes[number]}`)
// Exact static TypeError codes used by trusted readers and resource guards.
// These codes may also occur after charge; an error message is not stage
// provenance. Keep this list finite: no message fragments, stacks, paths, or
// artifact-controlled strings cross the child IPC boundary.
const TRUSTED_CANDIDATE_IMPORT_FAILURE_CODES = [
  "LEAN_EXPERIMENT_BUFFER_CAP", "LEAN_EXPERIMENT_RESOURCE",
  "SERIOUS_LEAGUE_FACTORY_READ_BUDGET", "SERIOUS_LEAGUE_CANDIDATE_ASSESSMENT", "SERIOUS_LEAGUE_CANDIDATE_SUPERVISION", "SERIOUS_LEAGUE_CANDIDATE_CHARGE", "SERIOUS_LEAGUE_CANDIDATE_CLOSURE", "SERIOUS_LEAGUE_PROSPECTIVE_BASE_ASSESSMENT",
  "FACTORY_ASSESSMENT_ARENA", "FACTORY_ASSESSMENT_ARGUMENTS", "FACTORY_ASSESSMENT_ASSESSMENT_REOPEN", "FACTORY_ASSESSMENT_CANDIDATE_BINDING", "FACTORY_ASSESSMENT_CANONICAL", "FACTORY_ASSESSMENT_CORRECTION_ROOT", "FACTORY_ASSESSMENT_EXTRA_ATTEMPTS", "FACTORY_ASSESSMENT_IMPORT_ASSESSMENT_REOPEN", "FACTORY_ASSESSMENT_IMPORT_ATTEMPT_COUNT", "FACTORY_ASSESSMENT_IMPORT_INVENTORY_LIMIT", "FACTORY_ASSESSMENT_IMPORT_PROJECTION_LIMIT", "FACTORY_ASSESSMENT_IMPORT_READ_ONLY", "FACTORY_ASSESSMENT_LEDGER_INVENTORY", "FACTORY_ASSESSMENT_LEDGER_NAME", "FACTORY_ASSESSMENT_LEDGER_ROOT", "FACTORY_ASSESSMENT_PAIR_GROUP", "FACTORY_ASSESSMENT_RECEIPT_BINDING", "FACTORY_ASSESSMENT_RECEIPT_MISSING", "FACTORY_ASSESSMENT_RECORD", "FACTORY_ASSESSMENT_SCHEMA", "FACTORY_ASSESSMENT_SUPERVISION_ROOTS", "FACTORY_ASSESSMENT_TERMINAL_EVIDENCE", "FACTORY_ASSESSMENT_TERMINAL_ROOTS", "FACTORY_ASSESSMENT_THRESHOLD_REOPEN", "FACTORY_ASSESSMENT_UNCERTAIN_START", "FACTORY_ASSESSMENT_USAGE", "FACTORY_ASSESSMENT_USAGE_TOTALS", "FACTORY_ASSESSMENT_WINDOW_CLOCK", "FACTORY_ASSESSMENT_WINDOW_COMPLETION", "FACTORY_ASSESSMENT_WINDOW_FAILURE", "FACTORY_ASSESSMENT_WINDOW_RESET", "FACTORY_ASSESSMENT_WINDOW_START", "FACTORY_ASSESSMENT_WINDOW_TERMINAL", "FACTORY_ASSESSMENT_WORKLOAD_CHARGE",
  "FACTORY_SUPERVISION_ARTIFACT_CANONICAL_BYTES", "FACTORY_SUPERVISION_ARTIFACT_CANONICAL_RECORD", "FACTORY_SUPERVISION_ARTIFACT_CHUNK", "FACTORY_SUPERVISION_ARTIFACT_CHUNK_BINDING", "FACTORY_SUPERVISION_ARTIFACT_CHUNK_CHAIN", "FACTORY_SUPERVISION_ARTIFACT_CHUNK_LENGTH", "FACTORY_SUPERVISION_ARTIFACT_CONTENT_BINDING", "FACTORY_SUPERVISION_ARTIFACT_DESCRIPTOR", "FACTORY_SUPERVISION_ARTIFACT_DESCRIPTOR_LIMITS", "FACTORY_SUPERVISION_ARTIFACT_DESCRIPTOR_ROOT", "FACTORY_SUPERVISION_ARTIFACT_EMPTY", "FACTORY_SUPERVISION_ARTIFACT_EXECUTION_METADATA", "FACTORY_SUPERVISION_ARTIFACT_FAILURE_METADATA", "FACTORY_SUPERVISION_ARTIFACT_MATCHUP_METADATA", "FACTORY_SUPERVISION_ARTIFACT_READ_LIMITS", "FACTORY_SUPERVISION_ARTIFACT_RECEIPT_BINDING", "FACTORY_SUPERVISION_ARTIFACT_RECEIPT_METADATA", "FACTORY_SUPERVISION_ARTIFACT_RECORD", "FACTORY_SUPERVISION_ARTIFACT_RECORD_COUNT", "FACTORY_SUPERVISION_ARTIFACT_RECORD_DEPTH", "FACTORY_SUPERVISION_ARTIFACT_RECORD_LIMIT", "FACTORY_SUPERVISION_ARTIFACT_RECORD_ORDER", "FACTORY_SUPERVISION_ARTIFACT_RESULT_METADATA", "FACTORY_SUPERVISION_ARTIFACT_SIZE", "FACTORY_SUPERVISION_ARTIFACT_UNISSUED_RECEIPT",
  "FACTORY_REPOSITORY_ARTIFACT", "FACTORY_REPOSITORY_ARTIFACT_DIGEST", "FACTORY_REPOSITORY_ATTEMPT_NAME", "FACTORY_REPOSITORY_BYTES", "FACTORY_REPOSITORY_CANONICAL", "FACTORY_REPOSITORY_CAP", "FACTORY_REPOSITORY_DIRECTORY", "FACTORY_REPOSITORY_DUPLICATE_OR_UNCHARGED", "FACTORY_REPOSITORY_FILE", "FACTORY_REPOSITORY_FILE_CHANGED", "FACTORY_REPOSITORY_OVERWRITE", "FACTORY_REPOSITORY_ROOT", "FACTORY_REPOSITORY_TEMPORARY", "FACTORY_REPOSITORY_UNCERTAIN_START_ONLY", "FACTORY_REPOSITORY_UNCERTAIN_TEMPORARY", "FACTORY_REPOSITORY_UNKNOWN_ARTIFACT",
  "FACTORY_ATTEMPT_LEDGER", "FACTORY_ADMISSION", "LAB_ENVELOPE_INVALID", "NUMERIC_CALIBRATION_EVIDENCE",
  ...trustedCodes("FACTORY_FRESH_", ["ALLOCATION", "ARTIFACT", "AUTHORIZATION", "BASE", "BOUNDS", "CELLS", "CLOCK", "CONTROL", "INGESTION", "PROTOCOL", "ROOT", "SLOTS", "WORKLOAD"] as const),
  ...trustedCodes("FACTORY_EXECUTION_", ["AUTHOR_ATTEMPTS", "AUTHOR_BUNDLE", "AUTHOR_BYTES", "AUTHOR_IDENTITY", "AUTHOR_ISOLATION", "AUTHOR_LAUNCH", "AUTHOR_PROTOCOL", "AUTHOR_SOURCE", "AUTHOR_START", "AUTHOR_TERMINAL", "AUTHOR_TOOLS", "AUTHOR_USAGE", "AUTHOR_WINNER_BINDING", "INDEX", "MODEL", "NEGATIVE_WITNESS", "NEGATIVE_WITNESSES", "REVIEW", "REVIEW_SOURCE", "SHARED_HELPER_AUDIT", "TEACHER_OUTCOME", "TEACHER_SEARCH", "TEACHER_SELECTION", "TEACHER_TRAINING"] as const),
  ...trustedCodes("FACTORY_OBSERVATION_", ["EXECUTION", "RECORDS", "TOKEN_LIMIT"] as const),
  ...trustedCodes("FACTORY_CALIBRATION_", ["BOUND", "CANONICAL", "INGESTION", "INGESTIONS", "MANIFEST", "MANIFEST_ROOT", "POLICY_ROOT", "SUPERVISION", "WORKLOAD", "WORKLOADS", "WORKLOAD_REF", "WORKLOAD_ROOT"] as const),
  ...trustedCodes("FACTORY_", ["BUILD_IDENTITY", "CANDIDATE", "CANDIDATE_ROOT", "CANDIDATE_VALIDATION", "CANONICAL_VALUE", "FINGERPRINTS", "INHERITED_AUTHORITY", "LINEAGE", "NATIVE_LANE", "PACKET", "PROPOSAL", "PROPOSAL_ROOT", "SOURCE_IDENTITY", "VALIDATION", "VALIDATION_ROOT", "VERSIONS"] as const),
  ...trustedCodes("LEAGUE_", ["CANONICAL_VALUE", "CANDIDATE_EVIDENCE", "IMPORT_ASSESSMENT", "IMPORT_BYTES", "IMPORT_EVIDENCE", "IMPORT_MEMBERSHIP", "IMPORT_PUBLICATION", "IMPORT_SOURCE", "IMPORT_SUPERVISION", "IMPORT_THRESHOLD", "ROOT", "ROOT_LIST", "ROOTED_VALUE"] as const),
] as const
const LEAN_CHILD_FAILURE_CODES = [
  "UNKNOWN_INTERNAL_FAILURE", "ARGUMENTS", "REQUEST", "FACTORY", "FILE", "REVIEW", "REVIEW_SOURCE", "PROCESS_RSS", "WRITABLE_SCOPE",
  "PARENT_LOST", "HANDSHAKE", "CHILD_PARENT", "ENTRY", "ENTRY_PATH", "ALLOCATION", "UNCOMMITTED_ALLOCATION", "SOURCE_HOLD",
  "PREFIX_CAPACITY", "CAPACITY_RANGE", "ASSESSED_PAIR", "CANDIDATE_HEADER", "CANDIDATE_JOIN", "ARENA", "REVISION", "IDENTITY",
  "MATCH_DEADLINE", "TIME_CAP", "RETAINED_RESULT", "RETAINED_ENTRY", "CHILD_FAILED", ...TRUSTED_CANDIDATE_IMPORT_FAILURE_CODES,
] as const
export type LeanChildFailureCode = typeof LEAN_CHILD_FAILURE_CODES[number]
export type LeanChildFailureStage = typeof LEAN_CHILD_FAILURE_STAGES[number]
export interface LeanChildFailureReceipt {
  type: "lean-child-failure"
  schemaVersion: "lean-child-failure-v1"
  code: LeanChildFailureCode
  stage: LeanChildFailureStage
}

/** Attempt the optional bounded diagnostic first, but always run the required
 * terminal callback. A diagnostic write failure is returned as uncertainty;
 * errors from the mandatory terminal callback deliberately propagate. */
export const publishChildTerminalAfterOptionalReceipt = <T>(
  receipt: LeanChildFailureReceipt | null,
  publishReceipt: (receipt: LeanChildFailureReceipt) => void,
  publishTerminal: (receiptPublicationUncertain: boolean) => T,
): T => {
  let receiptPublicationUncertain = false
  if (receipt) {
    try { publishReceipt(receipt) }
    catch { receiptPublicationUncertain = true }
  }
  return publishTerminal(receiptPublicationUncertain)
}

// Error text does not prove a host stage, including for legacy pilot codes.
// Preserve the actionable code but do not invent stage provenance.
const codeSet = new Set<string>(LEAN_CHILD_FAILURE_CODES)
const stageSet = new Set<string>(LEAN_CHILD_FAILURE_STAGES)
const isCode = (value: unknown): value is LeanChildFailureCode => typeof value === "string" && codeSet.has(value)
const isStage = (value: unknown): value is LeanChildFailureStage => typeof value === "string" && stageSet.has(value)

/** Only accept the helper's exact bounded wire schema; never retain arbitrary IPC. */
export const isLeanChildFailureReceipt = (value: unknown): value is LeanChildFailureReceipt =>
  value !== null && typeof value === "object" && Object.keys(value).length === 4 &&
  "type" in value && value.type === "lean-child-failure" &&
  "schemaVersion" in value && value.schemaVersion === "lean-child-failure-v1" &&
  "code" in value && isCode(value.code) && "stage" in value && isStage(value.stage)

const boundedFailureReceipt = (error: unknown): LeanChildFailureReceipt => {
  const message = error instanceof Error ? error.message : ""
  const match = /^LEAN_PILOT_([A-Z0-9_]{1,64})$/u.exec(message)
  const trustedImportCode = TRUSTED_CANDIDATE_IMPORT_FAILURE_CODES.find(code => code === message)
  const code = match && isCode(match[1]) ? match[1] : trustedImportCode ?? "UNKNOWN_INTERNAL_FAILURE"
  return { type: "lean-child-failure", schemaVersion: "lean-child-failure-v1", code, stage: "unknown" }
}

interface LeanCliChildProcess {
  connected: boolean
  exitCode?: number | string | null
  disconnect(): void
  send?(message: LeanChildFailureReceipt, callback?: (error: Error | null) => void): boolean
}

/** Finish a private child action without leaving its parent IPC handle alive.
 * The action must settle only after child-owned providers have closed. */
export const resolveLeanChildCliTerminal = async (
  action: Promise<unknown>,
  child: LeanCliChildProcess = process,
): Promise<void> => {
  let exitCode: 0 | 1 = 0
  try {
    await action
  } catch (error) {
    // Keep child failures bounded and non-sensitive. Never serialize the
    // underlying exception or its runtime/IO details across this boundary.
    process.stderr.write("LEAN_PILOT_FAILED_DETAILS_WITHHELD\n")
    const receipt = boundedFailureReceipt(error)
    if (child.connected && child.send) await new Promise<void>(resolveReceipt => {
      try { child.send!(receipt, () => resolveReceipt()) } catch { resolveReceipt() }
    })
    exitCode = 1
  }
  child.exitCode = exitCode
  if (child.connected) child.disconnect()
}
