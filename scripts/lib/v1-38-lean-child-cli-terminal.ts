const LEAN_CHILD_FAILURE_STAGES = ["handshake", "preflight", "candidate-import", "match", "finalize", "unknown"] as const
const LEAN_CHILD_FAILURE_CODES = [
  "UNKNOWN_INTERNAL_FAILURE", "ARGUMENTS", "REQUEST", "FACTORY", "FILE", "REVIEW", "REVIEW_SOURCE", "PROCESS_RSS", "WRITABLE_SCOPE",
  "PARENT_LOST", "HANDSHAKE", "CHILD_PARENT", "ENTRY", "ENTRY_PATH", "ALLOCATION", "UNCOMMITTED_ALLOCATION", "SOURCE_HOLD",
  "PREFIX_CAPACITY", "CAPACITY_RANGE", "ASSESSED_PAIR", "CANDIDATE_HEADER", "CANDIDATE_JOIN", "ARENA", "REVISION", "IDENTITY",
  "MATCH_DEADLINE", "TIME_CAP", "RETAINED_RESULT", "RETAINED_ENTRY", "CHILD_FAILED",
] as const
export type LeanChildFailureCode = typeof LEAN_CHILD_FAILURE_CODES[number]
export type LeanChildFailureStage = typeof LEAN_CHILD_FAILURE_STAGES[number]
export interface LeanChildFailureReceipt {
  type: "lean-child-failure"
  schemaVersion: "lean-child-failure-v1"
  code: LeanChildFailureCode
  stage: LeanChildFailureStage
}

const codeStages: Partial<Record<LeanChildFailureCode, LeanChildFailureStage>> = {
  CHILD_PARENT: "handshake", HANDSHAKE: "handshake", PARENT_LOST: "handshake",
  ARGUMENTS: "preflight", REQUEST: "preflight", FACTORY: "preflight", REVIEW: "preflight", REVIEW_SOURCE: "preflight", WRITABLE_SCOPE: "preflight", ALLOCATION: "preflight", UNCOMMITTED_ALLOCATION: "preflight", ENTRY: "preflight", ENTRY_PATH: "preflight", SOURCE_HOLD: "preflight",
  FILE: "candidate-import", PREFIX_CAPACITY: "candidate-import", CAPACITY_RANGE: "candidate-import", ASSESSED_PAIR: "candidate-import", CANDIDATE_HEADER: "candidate-import", CANDIDATE_JOIN: "candidate-import",
  ARENA: "match", REVISION: "match", IDENTITY: "match", MATCH_DEADLINE: "match",
  TIME_CAP: "finalize", RETAINED_RESULT: "finalize", RETAINED_ENTRY: "finalize", CHILD_FAILED: "finalize",
}
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
  const code = match && isCode(match[1]) ? match[1] : "UNKNOWN_INTERNAL_FAILURE"
  return { type: "lean-child-failure", schemaVersion: "lean-child-failure-v1", code, stage: codeStages[code] ?? "unknown" }
}

interface LeanCliChildProcess {
  connected: boolean
  exitCode?: number | null
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
