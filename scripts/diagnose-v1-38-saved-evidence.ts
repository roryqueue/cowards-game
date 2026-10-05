/**
 * One-shot, non-authorizing diagnosis of the fixed saved v3 diagnostic record.
 * This file is intentionally inert on import. Its entry point is for a later,
 * independently reviewed pass; current-source admission and accepted readers
 * are deliberately absent.
 */
import {
  constants,
  closeSync,
  existsSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  realpathSync,
  opendirSync,
  writeFileSync,
} from "node:fs"
import { join, relative, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { performance } from "node:perf_hooks"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import {
  leanBytesRoot,
  leanCanonicalBytes,
  leanCorrectionRoutePaths,
  openLeanLedger,
  readLeanChildEntry,
  readLeanChildTerminal,
  readLeanLedger,
  readLeanTimeAccounting,
  verifyLeanEvidence,
  type LeanCorrectionAllocation,
} from "../packages/strategy-lab/src/league/lean-experiment.js"
import {
  leanCorrectionCliFailure,
  leanCorrectionSourceManifest,
  readLeanCorrectionJson,
  readLeanCorrectionPrivateBytes,
} from "./run-v1-38-lean-correction.js"
import { validateLeanColdReuse } from "./lib/v1-38-lean-baseline-reuse.js"
import { readLeanBaselineSource } from "./lib/v1-38-lean-baseline-source.js"
import {
  auditLeanCorrectionRetained,
  type LeanCorrectionRetainedSnapshot,
} from "./lib/v1-38-lean-correction-retained.js"
import {
  LEAN_SUPERVISOR_REASON_FILE,
  LEAN_SUPERVISOR_REASON_MAX_BYTES,
} from "./run-v1-38-lean-baseline.js"

export const SAVED_DIAGNOSTIC_PATHS = Object.freeze({
  store: ".strategy-lab/lean-correction-supervisor-diagnostic-20261005-v3",
  request:
    ".strategy-lab/lean-correction-supervisor-diagnostic-request-20261005-v3.json",
  allocation:
    ".planning/artifacts/v1.38-lean-correction-supervisor-diagnostic-allocation-v3.json",
  entry: ".strategy-lab/lean-saved-evidence-diagnostic-20261005-v1-entry.json",
  result:
    ".strategy-lab/lean-saved-evidence-diagnostic-20261005-v1-result.json",
})

const SETUP_START_MS = 1_791_215_127_000
const PRIOR_ELAPSED_MS = 17_324_046
const PASS_LIMIT_MS = 60_000
const RSS_LIMIT_BYTES = 768 * 1024 * 1024
const FILE_LIMIT = 64
const FILE_BYTES_LIMIT = 8 * 1024 * 1024
const TOTAL_BYTES_LIMIT = 32 * 1024 * 1024
const VERIFY_ARGS = [
  "verify-supervisor-diagnostic-v3",
  "--request",
  SAVED_DIAGNOSTIC_PATHS.request,
] as const
const HISTORICAL_ROOTS = Object.freeze({
  allocationRoot:
    "sha256:aff06160f3852f3efd4fdc7a5ecd52b7025eda32c58e82d58e526c090fbd8cf5",
  allocationBytesRoot:
    "sha256:adf7c4567e676abd33516b7e2e1d4b9470be041ebf1724ff7f812b8400d2f0b9",
  sourceRoot:
    "sha256:1087ef46736e1406bd0febf10755d5ec890f1c388a3a567d45479e251152ccb5",
  heldHead: "b56ce9be6163556d88caa2995f36839fa49c0528",
  currentCheckerSourceRoot:
    "sha256:726ae66ff9f656247af0992a6fbadf48c2b550a41d97b8b69363f10e91262add",
})

const safeAuditCodes = new Set([
  "ALLOCATION",
  "CLAIM",
  "CUSTODY",
  "DIAGNOSTIC",
  "DIAGNOSTIC_NOT_ACCEPTED",
  "EVIDENCE",
  "HOLD_OR_CAPACITY",
  "INCOMPLETE_SOLVER",
  "INITIAL_SCHEDULE",
  "INVENTORY",
  "JOURNAL",
  "METRIC",
  "OBSERVATION",
  "ORIGIN",
  "ORIGIN_EXECUTABLE",
  "ORIGIN_INVOCATION",
  "ORIGIN_ROOT",
  "ORIGIN_SOURCE",
  "PAIR",
  "PAIR_ROOT",
  "PAIR_SOURCE",
  "PIPELINE",
  "POINTS",
  "PRECHARGE",
  "PROBE_SCHEDULE",
  "RESPONSE_BRAIN_INPUT",
  "RESPONSE_COUNTER_SOURCE",
  "RESPONSE_NODES",
  "RESPONSE_NODE_INPUT_OUTPUT",
  "RESPONSE_NODE_RECEIPT",
  "RESPONSE_NODE_ROOT",
  "RESPONSE_NODE_TOTAL",
  "RESPONSE_SCHEDULE",
  "RESPONSE_SOURCE_TARGET",
  "RESPONSE_WORK",
  "RESULT",
  "RESULT_ROOT",
  "REUSE",
  "REUSED_PIPELINE",
  "SCHEDULE",
  "SCHEDULE_EVIDENCE",
  "SELECTION",
  "SNAPSHOT",
  "SOLVER",
  "SOURCE",
  "STATUS",
  "SUPERVISOR_REASON_CUSTODY",
  "SUPERVISOR_REQUEST",
  "TERMINAL_ONLY_REQUIRED",
  "TRAINING",
  "TRAINING_JOIN",
  "TRAINING_OUTCOME",
  "UNCLOSED",
  "WORK_VECTOR",
])
const diagnosticCode = (
  error: unknown,
  project: (error: unknown) => string | null,
): string => {
  try {
    const code = project(error)
    if (code && /^LEAN_CORRECTION_RETAINED_[A-Z0-9_]+$/u.test(code)) {
      const suffix = code.slice("LEAN_CORRECTION_RETAINED_".length)
      if (safeAuditCodes.has(suffix)) return code
    }
  } catch {
    /* Error objects are untrusted; never inspect or print their text. */
  }
  return "UNKNOWN"
}

const DIAGNOSTIC_BOUND = Object.freeze({ code: "DIAGNOSTIC_BOUND" })
const stagedErrors = new WeakMap<object, DiagnosticStage>()
const readStageAt = <T>(stage: DiagnosticStage, action: () => T): T => {
  try {
    return action()
  } catch {
    const marker = Object.freeze({})
    stagedErrors.set(marker, stage)
    throw marker
  }
}
const errorStage = (error: unknown): DiagnosticStage | null =>
  typeof error === "object" && error !== null
    ? (stagedErrors.get(error) ?? null)
    : null
export const assertNoOriginRows = (origin: unknown): void => {
  if (
    typeof origin !== "object" ||
    origin === null ||
    !Array.isArray((origin as { origins?: unknown }).origins) ||
    (origin as { origins: unknown[] }).origins.length !== 0
  )
    throw new Error("ORIGIN_ROWS_NOT_EMPTY")
}

export interface SafeInputInventory {
  root: string
  fileCount: number
  totalBytes: number
  custodyOk: boolean
}
export interface SafeDiagnosticResult {
  schemaVersion: "lean-saved-evidence-diagnostic-result-v1"
  code: string
  stage: DiagnosticStage
  accepted: false
  issued: false
  non_authorizing: true
  inputRoot: string | null
  inputFileCount: number
  inputBytes: number
  historicalSourceRoot: string | null
  historicalHeldHead: string | null
  historicalAllocationRoot: string | null
  historicalAllocationBytesRoot: string | null
  currentCheckerSourceRoot: string | null
  cumulativeElapsedUpperBoundMs: number
  passElapsedMs: number
}
export type DiagnosticStage =
  | "entry"
  | "input_inventory_before"
  | "snapshot"
  | "ledger_open"
  | "entry_read"
  | "terminal_read"
  | "ledger_state_read"
  | "time_read"
  | "evidence_replay"
  | "request_json"
  | "reuse_json"
  | "cold_reuse_validation"
  | "result_json"
  | "journal_bytes"
  | "pair_json"
  | "observation_json"
  | "source_snapshots"
  | "artifact_json"
  | "origin_json"
  | "zero_origin_guard"
  | "supervisor_reason_bytes"
  | "allocation_raw_bytes"
  | "historical_root_binding"
  | "current_reader_provenance"
  | "audit"
  | "input_inventory_after"
  | "complete"

export interface SavedEvidenceDiagnosticDependencies {
  entryExists(): boolean
  inputInventory(guard: () => void): SafeInputInventory
  loadSnapshot(guard: () => void): {
    snapshot: unknown
    historical: {
      sourceRoot: string
      heldHead: string
      allocationRoot: string
      allocationBytesRoot: string
    }
    currentCheckerSourceRoot: string
  }
  audit(snapshot: unknown, guard: () => void): unknown
  trustedFailureCode(error: unknown): string | null
  writeExclusive(identity: "entry" | "result", value: unknown): void
  now(): number
  elapsed(): number
  rssBytes(): number
}

const safeResult = (
  input: Partial<SafeDiagnosticResult> &
    Pick<
      SafeDiagnosticResult,
      "code" | "stage" | "cumulativeElapsedUpperBoundMs" | "passElapsedMs"
    >,
): SafeDiagnosticResult => ({
  schemaVersion: "lean-saved-evidence-diagnostic-result-v1",
  code: input.code,
  stage: input.stage,
  accepted: false,
  issued: false,
  non_authorizing: true,
  inputRoot: input.inputRoot ?? null,
  inputFileCount: input.inputFileCount ?? 0,
  inputBytes: input.inputBytes ?? 0,
  historicalSourceRoot: input.historicalSourceRoot ?? null,
  historicalHeldHead: input.historicalHeldHead ?? null,
  historicalAllocationRoot: input.historicalAllocationRoot ?? null,
  historicalAllocationBytesRoot: input.historicalAllocationBytesRoot ?? null,
  currentCheckerSourceRoot: input.currentCheckerSourceRoot ?? null,
  cumulativeElapsedUpperBoundMs: input.cumulativeElapsedUpperBoundMs,
  passElapsedMs: input.passElapsedMs,
})
const historicalFields = (
  loaded: ReturnType<SavedEvidenceDiagnosticDependencies["loadSnapshot"]>,
) => ({
  historicalSourceRoot: loaded.historical.sourceRoot,
  historicalHeldHead: loaded.historical.heldHead,
  historicalAllocationRoot: loaded.historical.allocationRoot,
  historicalAllocationBytesRoot: loaded.historical.allocationBytesRoot,
  currentCheckerSourceRoot: loaded.currentCheckerSourceRoot,
})

/** Synthetic test seam. Production calls use the fixed-bound dependency set below. */
export const diagnoseSavedEvidence = (
  deps: SavedEvidenceDiagnosticDependencies,
): SafeDiagnosticResult => {
  if (deps.entryExists()) throw new Error("DIAGNOSTIC_REPEAT_REFUSED")
  const setupElapsedMs = Math.max(0, deps.now() - SETUP_START_MS)
  const started = deps.elapsed()
  const timing = () => {
    const passElapsedMs = Math.max(0, Math.ceil(deps.elapsed() - started))
    return {
      passElapsedMs,
      cumulativeElapsedUpperBoundMs:
        PRIOR_ELAPSED_MS + setupElapsedMs + passElapsedMs,
    }
  }
  const checkBounds = () => {
    const { passElapsedMs } = timing()
    if (passElapsedMs > PASS_LIMIT_MS || deps.rssBytes() > RSS_LIMIT_BYTES)
      throw DIAGNOSTIC_BOUND
  }

  let result: SafeDiagnosticResult
  let stage: DiagnosticStage = "entry"
  let before: SafeInputInventory | null = null
  let loaded: ReturnType<
    SavedEvidenceDiagnosticDependencies["loadSnapshot"]
  > | null = null
  let after: SafeInputInventory | null = null
  let afterAttempted = false
  try {
    deps.writeExclusive("entry", {
      schemaVersion: "lean-saved-evidence-diagnostic-entry-v1",
      diagnostic: "saved-v3",
      startedAtMs: deps.now(),
      accepted: false,
      issued: false,
      non_authorizing: true,
    })
    stage = "input_inventory_before"
    before = deps.inputInventory(checkBounds)
    if (!before.custodyOk) throw new Error("INPUT_CUSTODY")
    checkBounds()
    stage = "snapshot"
    loaded = deps.loadSnapshot(checkBounds)
    checkBounds()
    if (
      loaded.currentCheckerSourceRoot !==
      HISTORICAL_ROOTS.currentCheckerSourceRoot
    ) {
      result = safeResult({
        code: "CURRENT_READER_PROVENANCE_MISMATCH",
        stage: "current_reader_provenance",
        inputRoot: before.root,
        inputFileCount: before.fileCount,
        inputBytes: before.totalBytes,
        ...historicalFields(loaded),
        cumulativeElapsedUpperBoundMs: timing().cumulativeElapsedUpperBoundMs,
        passElapsedMs: timing().passElapsedMs,
      })
      stage = "input_inventory_after"
      afterAttempted = true
      after = deps.inputInventory(checkBounds)
      if (!after.custodyOk || after.root !== before.root)
        result = safeResult({
          code: "INPUT_MUTATION",
          stage,
          inputRoot: before.root,
          inputFileCount: before.fileCount,
          inputBytes: before.totalBytes,
          ...historicalFields(loaded),
          cumulativeElapsedUpperBoundMs: timing().cumulativeElapsedUpperBoundMs,
          passElapsedMs: timing().passElapsedMs,
        })
      deps.writeExclusive("result", result)
      return result
    }
    stage = "audit"
    // Even a successful pure audit result is deliberately discarded.
    try {
      void deps.audit(loaded.snapshot, checkBounds)
    } catch (error) {
      const code = diagnosticCode(error, deps.trustedFailureCode)
      stage = "input_inventory_after"
      afterAttempted = true
      after = deps.inputInventory(checkBounds)
      if (!after.custodyOk || after.root !== before.root)
        result = safeResult({
          code: "INPUT_MUTATION",
          stage,
          inputRoot: before.root,
          inputFileCount: before.fileCount,
          inputBytes: before.totalBytes,
          cumulativeElapsedUpperBoundMs: timing().cumulativeElapsedUpperBoundMs,
          passElapsedMs: timing().passElapsedMs,
        })
      else
        result = safeResult({
          code,
          stage: "audit",
          inputRoot: before.root,
          inputFileCount: before.fileCount,
          inputBytes: before.totalBytes,
          ...historicalFields(loaded),
          cumulativeElapsedUpperBoundMs: timing().cumulativeElapsedUpperBoundMs,
          passElapsedMs: timing().passElapsedMs,
        })
      deps.writeExclusive("result", result)
      return result
    }
    stage = "input_inventory_after"
    afterAttempted = true
    after = deps.inputInventory(checkBounds)
    checkBounds()
    if (!after.custodyOk || after.root !== before.root)
      result = safeResult({
        code: "INPUT_MUTATION",
        stage,
        inputRoot: before.root,
        inputFileCount: before.fileCount,
        inputBytes: before.totalBytes,
        ...historicalFields(loaded),
        cumulativeElapsedUpperBoundMs: timing().cumulativeElapsedUpperBoundMs,
        passElapsedMs: timing().passElapsedMs,
      })
    else
      result = safeResult({
        code: "NO_CORE_AUDIT_REFUSAL_REPRODUCED",
        stage: "complete",
        inputRoot: before.root,
        inputFileCount: before.fileCount,
        inputBytes: before.totalBytes,
        ...historicalFields(loaded),
        cumulativeElapsedUpperBoundMs: timing().cumulativeElapsedUpperBoundMs,
        passElapsedMs: timing().passElapsedMs,
      })
  } catch (error) {
    let changed = false
    if (before && !afterAttempted) {
      try {
        afterAttempted = true
        after = deps.inputInventory(checkBounds)
        changed = !after.custodyOk || after.root !== before.root
      } catch {
        afterAttempted = true
      }
    } else if (
      before &&
      after &&
      (!after.custodyOk || after.root !== before.root)
    )
      changed = true
    const code = changed
      ? "INPUT_MUTATION"
      : afterAttempted && !after
        ? "INPUT_INVENTORY_UNVERIFIED"
        : error === DIAGNOSTIC_BOUND
          ? "BOUND_EXCEEDED"
          : diagnosticCode(error, deps.trustedFailureCode)
    const safeStage =
      afterAttempted && !after
        ? "input_inventory_after"
        : (errorStage(error) ?? stage)
    const safeInventory = before
    result = safeResult({
      code,
      stage: safeStage,
      inputRoot: safeInventory?.root ?? null,
      inputFileCount: safeInventory?.fileCount ?? 0,
      inputBytes: safeInventory?.totalBytes ?? 0,
      ...(loaded ? historicalFields(loaded) : {}),
      cumulativeElapsedUpperBoundMs: timing().cumulativeElapsedUpperBoundMs,
      passElapsedMs: timing().passElapsedMs,
    })
  }
  deps.writeExclusive("result", result)
  return result
}

const safeReadFile = (
  absolute: string,
): { bytes: Buffer; metadata: string } => {
  const beforePath = lstatSync(absolute)
  if (
    !beforePath.isFile() ||
    beforePath.isSymbolicLink() ||
    beforePath.uid !== process.getuid?.() ||
    beforePath.nlink !== 1 ||
    beforePath.size > FILE_BYTES_LIMIT ||
    realpathSync(absolute) !== absolute ||
    (beforePath.mode & 0o022) !== 0
  )
    throw new Error("INPUT_CUSTODY")
  const fd = openSync(absolute, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const before = fstatSync(fd)
    if (
      before.dev !== beforePath.dev ||
      before.ino !== beforePath.ino ||
      before.nlink !== 1 ||
      before.uid !== beforePath.uid ||
      before.size !== beforePath.size ||
      (before.mode & 0o022) !== 0
    )
      throw new Error("INPUT_CUSTODY")
    const bytes = readFileSync(fd)
    const after = fstatSync(fd)
    if (
      bytes.length !== before.size ||
      after.size !== before.size ||
      after.mtimeMs !== before.mtimeMs ||
      after.ctimeMs !== before.ctimeMs ||
      after.nlink !== 1 ||
      after.uid !== before.uid ||
      after.mode !== before.mode
    )
      throw new Error("INPUT_MUTATION")
    return {
      bytes,
      metadata: [
        before.dev,
        before.ino,
        before.uid,
        before.mode,
        before.nlink,
        before.size,
        before.mtimeMs,
        before.ctimeMs,
      ].join(":"),
    }
  } finally {
    closeSync(fd)
  }
}

/** Counts directories as well as files across the entire bounded inventory. */
export const diagnosticInventoryVisitGuard = (guard: () => void) => {
  let visited = 0
  return (depth: number): void => {
    guard()
    if (++visited > FILE_LIMIT || depth > 5) throw new Error("INPUT_BOUND")
  }
}

export const diagnosticDirectoryNames = (
  path: string,
  guard: () => void,
  open: (path: string) => { readSync(): { name: string } | null; closeSync(): void } =
    path => opendirSync(path, { bufferSize: 1 }),
): string[] => {
  guard()
  const directory = open(path), names: string[] = []
  try {
    while (true) {
      guard()
      const entry = directory.readSync()
      if (!entry) return names.sort()
      if (names.length === FILE_LIMIT) throw new Error("INPUT_BOUND")
      names.push(entry.name)
    }
  } finally { directory.closeSync() }
}

const scanInputs = (guard: () => void): SafeInputInventory => {
  const visitGuard = diagnosticInventoryVisitGuard(guard)
  const identities = [
    SAVED_DIAGNOSTIC_PATHS.request,
    SAVED_DIAGNOSTIC_PATHS.allocation,
  ]
  const rows: Array<{
    identity: string
    root: string
    metadata: string
    size: number
  }> = []
  const files: Array<{
    identity: string
    root: string
    metadata: string
    size: number
  }> = []
  const visit = (identity: string, depth: number): void => {
    visitGuard(depth)
    const absolute = resolve(identity),
      stat = lstatSync(absolute)
    if (
      stat.isSymbolicLink() ||
      stat.uid !== process.getuid?.() ||
      realpathSync(absolute) !== absolute ||
      (stat.mode & 0o022) !== 0
    )
      throw new Error("INPUT_CUSTODY")
    if (stat.isDirectory()) {
      if (depth > 5 || (stat.mode & 0o022) !== 0) throw new Error("INPUT_BOUND")
      rows.push({
        identity: relative(process.cwd(), absolute),
        root: "directory",
        metadata: [
          stat.dev,
          stat.ino,
          stat.uid,
          stat.mode,
          stat.mtimeMs,
          stat.ctimeMs,
        ].join(":"),
        size: 0,
      })
      const children = diagnosticDirectoryNames(absolute, guard)
      guard()
      if (children.length + files.length > FILE_LIMIT)
        throw new Error("INPUT_BOUND")
      for (const name of children.sort()) visit(join(identity, name), depth + 1)
      return
    }
    const { bytes, metadata } = safeReadFile(absolute)
    guard()
    const file = {
      identity: relative(process.cwd(), absolute),
      root: leanBytesRoot(bytes),
      metadata,
      size: bytes.length,
    }
    files.push(file)
    rows.push(file)
    if (
      files.length > FILE_LIMIT ||
      files.some((file) => file.size > FILE_BYTES_LIMIT) ||
      files.reduce((sum, file) => sum + file.size, 0) > TOTAL_BYTES_LIMIT
    )
      throw new Error("INPUT_BOUND")
  }
  visit(SAVED_DIAGNOSTIC_PATHS.store, 0)
  for (const identity of identities) visit(identity, 0)
  rows.sort((a, b) => a.identity.localeCompare(b.identity))
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0)
  return {
    root: labRoot("lean-saved-diagnostic-input-inventory-v1", rows),
    fileCount: files.length,
    totalBytes,
    custodyOk: true,
  }
}

const writeFreshExclusive = (
  identity: "entry" | "result",
  value: unknown,
): void => {
  const relativePath =
    identity === "entry"
      ? SAVED_DIAGNOSTIC_PATHS.entry
      : SAVED_DIAGNOSTIC_PATHS.result
  const absolute = resolve(relativePath),
    parent = lstatSync(resolve(".strategy-lab"))
  if (
    !parent.isDirectory() ||
    parent.isSymbolicLink() ||
    parent.uid !== process.getuid?.() ||
    (parent.mode & 0o077) !== 0 ||
    realpathSync(resolve(".strategy-lab")) !== resolve(".strategy-lab")
  )
    throw new Error("OUTPUT_CUSTODY")
  const bytes = leanCanonicalBytes(value)
  const fd = openSync(
    absolute,
    constants.O_CREAT |
      constants.O_EXCL |
      constants.O_WRONLY |
      constants.O_NOFOLLOW,
    0o600,
  )
  try {
    writeFileSync(fd, bytes)
    fsyncSync(fd)
    const stat = fstatSync(fd)
    if (
      !stat.isFile() ||
      stat.uid !== process.getuid?.() ||
      stat.nlink !== 1 ||
      (stat.mode & 0o777) !== 0o600
    )
      throw new Error("OUTPUT_CUSTODY")
  } finally {
    closeSync(fd)
  }
  const directory = openSync(resolve(".strategy-lab"), constants.O_RDONLY)
  try {
    fsyncSync(directory)
  } finally {
    closeSync(directory)
  }
}

const loadFixedSnapshot = (guard: () => void) => {
  const readAt = <T>(stage: DiagnosticStage, action: () => T): T => {
    guard()
    const value = readStageAt(stage, action)
    guard()
    return value
  }
  const paths = leanCorrectionRoutePaths("diagnostic", "v3")
  if (
    paths.store !== SAVED_DIAGNOSTIC_PATHS.store ||
    paths.request !== SAVED_DIAGNOSTIC_PATHS.request ||
    paths.allocation !== SAVED_DIAGNOSTIC_PATHS.allocation
  )
    throw new Error("FIXED_IDENTITY")
  const ledger = readAt("ledger_open", () => openLeanLedger(paths.store)),
    allocation = ledger.allocation
  const entry = readAt("entry_read", () => readLeanChildEntry(ledger))
  const terminal = readAt("terminal_read", () => readLeanChildTerminal(ledger))
  const evidence = readAt("evidence_replay", () => verifyLeanEvidence(ledger))
  const state = readAt("ledger_state_read", () => readLeanLedger(ledger))
  const time = readAt("time_read", () => readLeanTimeAccounting(ledger))
  const request = readAt("request_json", () =>
    readLeanCorrectionJson(paths.request),
  ) as Record<string, unknown>
  const retainedReuse = readAt("reuse_json", () =>
    readLeanCorrectionJson(
      join(ledger.directory, "cold-reuse.json"),
      4_194_304,
    ),
  )
  const reuse = readAt("cold_reuse_validation", () =>
    validateLeanColdReuse(retainedReuse, allocation.sourceRoot),
  )
  const result = readAt("result_json", () =>
    readLeanCorrectionJson(join(ledger.directory, "result.json"), 8_388_608),
  ) as Record<string, unknown>
  const journalBytes = readAt("journal_bytes", () =>
    readLeanCorrectionPrivateBytes(
      join(ledger.directory, "ledger.ndjson"),
      4_194_304,
    ),
  )
  readAt("ledger_state_read", () => {
    if (state.charges.size !== 1) throw new Error("FIXED_ONE_CELL_EXPECTATION")
  })
  const pairs = readAt("pair_json", () => [
    readLeanCorrectionJson(join(ledger.directory, "pair-0.json")) as never,
  ])
  const observations = readAt("observation_json", () => [
    readLeanCorrectionJson(
      join(ledger.directory, "observation-0.json"),
      8_388_608,
    ) as never,
  ])
  const names = readAt("source_snapshots", () => diagnosticDirectoryNames(ledger.directory, guard))
  const sources = readAt("source_snapshots", () =>
    names
      .filter((name) => /^source-[a-z0-9-]+\.json$/u.test(name))
      .sort()
      .map((name) =>
        readAt("source_snapshots", () => readLeanBaselineSource(ledger.directory, name.slice(7, -5))),
      ),
  )
  const artifactNames = [
    "seal-metadata.json",
    "cold-corpus.json",
    "cold-reuse-grant.json",
    "initial-proposals.json",
    "initial-selection.json",
    "initial-training.json",
    "initial-analysis.json",
    "response-work.json",
    "response-node-receipts.json",
    "response-training.json",
    "current-analysis.json",
  ]
  const artifacts = readAt("artifact_json", () =>
    Object.fromEntries(
      artifactNames
        .filter((name) => names.includes(name))
        .map((name) => [
          name,
          readAt("artifact_json", () => readLeanCorrectionJson(join(ledger.directory, name), 2_097_152)),
        ]),
    ),
  )
  const origin = readAt("origin_json", () =>
    names.includes("correction-origin.json")
      ? (readLeanCorrectionJson(
          join(ledger.directory, "correction-origin.json"),
        ) as Record<string, unknown>)
      : null,
  )
  readAt("zero_origin_guard", () => assertNoOriginRows(origin))
  const supervisorReasonBytes = readAt("supervisor_reason_bytes", () =>
    readLeanCorrectionPrivateBytes(
      join(ledger.directory, LEAN_SUPERVISOR_REASON_FILE),
      LEAN_SUPERVISOR_REASON_MAX_BYTES,
    ),
  )
  const snapshot: LeanCorrectionRetainedSnapshot = {
    schemaVersion: "lean-correction-supervisor-retained-snapshot-v3",
    supervisorReasonBytes,
    allocation: allocation as LeanCorrectionAllocation,
    request: request as never,
    entry,
    terminal,
    evidence,
    time,
    result,
    reuse,
    pairs,
    observations,
    sources,
    artifacts,
    origin,
    journalBytes,
  }
  const allocationBytesRoot = readAt("allocation_raw_bytes", () =>
    leanBytesRoot(
      safeReadFile(resolve(SAVED_DIAGNOSTIC_PATHS.allocation)).bytes,
    ),
  )
  const sourceManifest = readAt(
    "current_reader_provenance",
    () => leanCorrectionSourceManifest("v3").root,
  )
  readAt("historical_root_binding", () => {
    if (
      allocation.root !== HISTORICAL_ROOTS.allocationRoot ||
      allocationBytesRoot !== HISTORICAL_ROOTS.allocationBytesRoot ||
      allocation.sourceRoot !== HISTORICAL_ROOTS.sourceRoot ||
      entry.head !== HISTORICAL_ROOTS.heldHead
    )
      throw new Error("HISTORICAL_ROOT_MISMATCH")
  })
  return {
    snapshot,
    historical: {
      sourceRoot: allocation.sourceRoot,
      heldHead: entry.head,
      allocationRoot: allocation.root,
      allocationBytesRoot,
    },
    currentCheckerSourceRoot: sourceManifest,
  }
}

const actualDependencies: SavedEvidenceDiagnosticDependencies = {
  entryExists: () =>
    existsSync(resolve(SAVED_DIAGNOSTIC_PATHS.entry)) ||
    existsSync(resolve(SAVED_DIAGNOSTIC_PATHS.result)),
  inputInventory: scanInputs,
  loadSnapshot: loadFixedSnapshot,
  audit: (snapshot, guard) => auditLeanCorrectionRetained(snapshot, guard),
  trustedFailureCode: (error) => {
    const projected = leanCorrectionCliFailure(VERIFY_ARGS, error).trim()
    return projected === "LEAN_CORRECTION_FAILED_DETAILS_WITHHELD"
      ? null
      : projected
  },
  writeExclusive: writeFreshExclusive,
  now: () => Date.now(),
  elapsed: () => performance.now(),
  rssBytes: () => process.memoryUsage().rss,
}

export const runFixedSavedEvidenceDiagnostic = (): SafeDiagnosticResult =>
  diagnoseSavedEvidence(actualDependencies)

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href &&
  process.argv.length === 2
) {
  const capped =
    process.execArgv.some((arg) => arg === "--max-old-space-size=768") ||
    (process.env.NODE_OPTIONS ?? "")
      .split(/\s+/u)
      .includes("--max-old-space-size=768")
  if (!capped) {
    process.stdout.write("DIAGNOSTIC_RUNTIME_CAP_REQUIRED\n")
    process.exitCode = 2
  } else {
    try {
      const result = runFixedSavedEvidenceDiagnostic()
      process.stdout.write(`${JSON.stringify(result)}\n`)
    } catch {
      process.stdout.write("DIAGNOSTIC_REPEAT_REFUSED_OR_PREPASS_FAILURE\n")
      process.exitCode = 1
    }
  }
}
