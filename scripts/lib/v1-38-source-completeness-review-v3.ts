import { Buffer } from "node:buffer"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { encodeCanonicalJson, hashCanonicalIdentity, type JsonValue } from
  "@cowards/spec"

type Sha256 = `sha256:${string}`
const fail = (code: string): never => { throw new TypeError(code) }
const sha256 = (bytes: Uint8Array): Sha256 =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
const exactKeys = (value: Record<string, unknown>, keys: readonly string[]) =>
  JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort())
const canonicalBytes = (value: unknown): Buffer => {
  const encoded = encodeCanonicalJson(value as JsonValue, { context: "canonical-manifest" })
  if (!encoded.ok) fail("V138_REVIEW_V3_CANONICAL_INVALID")
  return Buffer.from(encoded.bytes)
}
const rootOf = (schema: string, value: unknown): Sha256 =>
  `sha256:${hashCanonicalIdentity("evidenceBundle", [
    Buffer.from(schema, "utf8"), canonicalBytes(value),
  ])}`
const fullOid = (value: unknown) => typeof value === "string" && /^[0-9a-f]{40}$/u.test(value)
const digest = (value: unknown) => typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)
const boundedString = (value: unknown, max = 4096) =>
  typeof value === "string" && value.length > 0 && value.length <= max && !value.includes("\0")
const boundedInt = (value: unknown, min: number, max: number) =>
  Number.isInteger(value) && Number(value) >= min && Number(value) <= max
const record = (value: unknown, keys: readonly string[], code: string) => {
  if (!isRecord(value) || !exactKeys(value, keys)) fail(code)
  return value
}
const unique = (values: readonly unknown[]) =>
  values.every((value, index) => values.indexOf(value) === index)

export const V138_REVIEW_V3_SOURCE_PATHS = Object.freeze([
  "scripts/check-v1-38-dependency-revision-boundaries.ts",
  "scripts/evaluate-v1-38-successor-route.test.ts",
  "scripts/evaluate-v1-38-successor-source-complete.test.ts",
  "scripts/lib/v1-38-current-matrix-reproduction.ts",
  "scripts/lib/v1-38-source-completeness-review-v3.ts",
  "scripts/lib/v1-38-successor-source-seal.ts",
] as const)

export const V138_REVIEW_V3_DELETION_PATHS = Object.freeze([
  "scripts/check-v1-38-plan-262-58-source-completeness-review-v2.test.ts",
  "scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts",
] as const)

export const V138_REVIEW_V3_COMMANDS = Object.freeze([
  "--calibrate-parallel-v11-receipt",
  "--check-plan-262-57-pre-execution-readiness-v1",
  "--check-plan-262-57-pre-start-obstruction-v1",
  "--check-plan-262-57-terminal-v1",
  "--resolve-plan-262-57-pre-start-v1",
  "--write-authoritative-v12-receipt",
  "--write-execution-context-v11-receipt",
  "--write-headroom-preflight-v11-receipt",
  "--write-plan-262-57-route-start-v1",
  "--write-plan-262-57-terminal-v1",
] as const)

const V138_REVIEW_V3_HANDLER_BY_COMMAND = Object.freeze({
  "--check-plan-262-57-pre-execution-readiness-v1":
    "checkV138Plan26257PreExecutionReadinessV1",
  "--resolve-plan-262-57-pre-start-v1":
    "writeV138Plan26257PreStartObstructionV1",
  "--check-plan-262-57-pre-start-obstruction-v1":
    "checkV138Plan26257PreStartObstructionBranch",
  "--write-execution-context-v11-receipt":
    "writeV138ExecutionContextV11Receipt",
  "--write-plan-262-57-route-start-v1": "writeV138Plan26257RouteStartV1",
  "--write-headroom-preflight-v11-receipt":
    "writeV138HostHeadroomPreflightV11Receipt",
  "--calibrate-parallel-v11-receipt": "writeV138ParallelCalibrationV11Receipt",
  "--write-authoritative-v12-receipt": "writeV138AuthoritativeMatrixV12Receipt",
  "--write-plan-262-57-terminal-v1": "writeV138Plan26257TerminalV1",
  "--check-plan-262-57-terminal-v1": "checkV138Plan26257TerminalBranch",
} as const)

export const V138_REVIEW_V3_SCHEMA =
  "v1.38-plan-262-62-source-completeness-review-v3" as const
export const V138_REVIEW_V3_CANONICAL_PATH =
  ".planning/artifacts/v1.38-plan-262-62-source-completeness-review-v3.json" as const
export const V138_REVIEW_V3_REPORT_PATH =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-62-REVIEW.md" as const

const DOCUMENT_KEYS = ["schemaVersion", "sourceBase9", "sourceA9", "sourceCustody",
  "commands", "handlerObservations", "protectedHistory", "chargeIds",
  "priorAuthorizationBytes", "snapshots", "orderedEvents", "cleanup",
  "publication", "verdict", "identityClaims", "reviewV3Root"] as const
const SOURCE_KEYS = ["tree", "parent", "authorRun", "paths", "blobs",
  "deletionHistory"] as const
const BLOB_KEYS = ["path", "mode", "blobOid", "sha256", "byteLength"] as const
const DELETION_KEYS = ["path", "deletionCommit", "deletionParent",
  "deletionTree", "authorRun", "priorBlobOid", "priorSha256",
  "priorByteLength"] as const
const COMMAND_KEYS = ["command", "argv", "exitStatus", "stdoutBase64",
  "stderrBase64", "stdoutSha256", "stderrSha256"] as const
const OBSERVATION_KEYS = ["command", "handler", "prerequisites", "destination",
  "effectClass", "disposition"] as const
const PRIOR_KEYS = ["path", "commit", "blobOid", "sha256", "byteLength"] as const
const SNAPSHOT_KEYS = ["name", "inventoryRoot", "pathCount"] as const
const EVENT_KEYS = ["ordinal", "event", "path", "result"] as const
const PUBLICATION_KEYS = ["changedPaths"] as const
const VERDICT_KEYS = ["findingCount", "sourceCompletenessPassed", "authorizesExecution"] as const
const IDENTITY_KEYS = ["independentPersonClaimed", "reviewerSeparated",
  "externalIdentityClaimed", "cryptographicReviewerIdentityClaimed",
  "independentCustodyClaimed", "proceduralContext"] as const

export type V138ReviewV3Document = Readonly<Record<string, unknown>>

export const V138_REVIEW_V3_ROUTE_MANIFEST = Object.freeze([
  { command: "--check-plan-262-57-pre-execution-readiness-v1",
    handler: "checkV138Plan26257PreExecutionReadinessV1",
    destination: ".planning/artifacts/v1.38-plan-262-57-pre-start-obstruction-v1.json",
    prerequisite: "authorization-v9/seal-v9/all-route-destinations-absent",
    sideEffect: "none", terminalDisposition: null },
  { command: "--resolve-plan-262-57-pre-start-v1",
    handler: "writeV138Plan26257PreStartObstructionV1",
    destination: ".planning/artifacts/v1.38-plan-262-57-pre-start-obstruction-v1.json",
    prerequisite: "authorization-v9/seal-v9/exactly-one-obstruction",
    sideEffect: "fixture-write-only", terminalDisposition: null },
  { command: "--check-plan-262-57-pre-start-obstruction-v1",
    handler: "checkV138Plan26257PreStartObstructionBranch",
    destination: ".planning/artifacts/v1.38-plan-262-57-pre-start-obstruction-v1.json",
    prerequisite: "pre-start-disposition-present", sideEffect: "none",
    terminalDisposition: null },
  { command: "--write-execution-context-v11-receipt",
    handler: "writeV138ExecutionContextV11Receipt",
    destination: ".planning/artifacts/v1.38-plan-262-57-route-start-v1.json",
    prerequisite: "authorization-v9/seal-v9/fresh-route",
    sideEffect: "fixture-write-only", terminalDisposition: null },
  { command: "--write-plan-262-57-route-start-v1",
    handler: "writeV138Plan26257RouteStartV1",
    destination: ".planning/artifacts/v1.38-plan-262-57-route-start-v1.json",
    prerequisite: "authorization-v9/seal-v9/fresh-route",
    sideEffect: "fixture-write-only", terminalDisposition: null },
  { command: "--write-headroom-preflight-v11-receipt",
    handler: "writeV138HostHeadroomPreflightV11Receipt",
    destination: ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v11.json",
    prerequisite: "atomic-route-start", sideEffect: "injected-headroom",
    terminalDisposition: "preflight_unavailable|preflight_refused" },
  { command: "--calibrate-parallel-v11-receipt",
    handler: "writeV138ParallelCalibrationV11Receipt",
    destination: ".planning/artifacts/v1.38-current-matrix-calibration-v11.json",
    prerequisite: "preflight_admitted", sideEffect: "injected-child-runner",
    terminalDisposition: "calibration_stopped" },
  { command: "--write-authoritative-v12-receipt",
    handler: "writeV138AuthoritativeMatrixV12Receipt",
    destination: ".planning/artifacts/v1.38-current-matrix-reproduction-v12.json",
    prerequisite: "calibration-admitted-8/8/4", sideEffect: "injected-child-runner",
    terminalDisposition: "reproduction_stopped|reproduction_passed" },
  { command: "--write-plan-262-57-terminal-v1",
    handler: "writeV138Plan26257TerminalV1",
    destination: ".planning/artifacts/v1.38-plan-262-57-terminal-v1.json",
    prerequisite: "route-started", sideEffect: "fixture-write-only",
    terminalDisposition: "tool_identity_failed|protected_history_failed|formation_absence_failed|pattern_c_ownership_failed|fresh_destination_failed|consumed_stage_interrupted|preflight_unavailable|preflight_refused|calibration_stopped|reproduction_stopped|reproduction_passed" },
  { command: "--check-plan-262-57-terminal-v1",
    handler: "checkV138Plan26257TerminalBranch",
    destination: ".planning/artifacts/v1.38-plan-262-57-terminal-v1.json",
    prerequisite: "terminal-present", sideEffect: "none",
    terminalDisposition: "tool_identity_failed|protected_history_failed|formation_absence_failed|pattern_c_ownership_failed|fresh_destination_failed|consumed_stage_interrupted|preflight_unavailable|preflight_refused|calibration_stopped|reproduction_stopped|reproduction_passed" },
] as const)

const AUTHORIZATION_PATH =
  ".planning/artifacts/v1.38-plan-262-56-authorization-v9.json"
const SEAL_PATH = ".planning/artifacts/v1.38-successor-source-seal-v9.json"
const ROUTE_START_PATH = V138_REVIEW_V3_ROUTE_MANIFEST[3].destination
const PREFLIGHT_PATH = V138_REVIEW_V3_ROUTE_MANIFEST[5].destination
const CALIBRATION_PATH = V138_REVIEW_V3_ROUTE_MANIFEST[6].destination
const REPRODUCTION_PATH = V138_REVIEW_V3_ROUTE_MANIFEST[7].destination
const TERMINAL_PATH = V138_REVIEW_V3_ROUTE_MANIFEST[8].destination

export const buildV138ReviewV3CommandArgv = (command: string,
  sourceA9: string, sourceB9: string): readonly string[] => {
  if (![sourceA9, sourceB9].every(fullOid) ||
    !V138_REVIEW_V3_COMMANDS.includes(command as never))
    fail("V138_REVIEW_V3_COMMANDS_INVALID")
  const source = ["--authorization", AUTHORIZATION_PATH, "--seal", SEAL_PATH,
    "--source-a9", sourceA9, "--source-b9", sourceB9]
  if (["--check-plan-262-57-pre-execution-readiness-v1",
    "--check-plan-262-57-pre-start-obstruction-v1"].includes(command))
    return Object.freeze(["node", "route", command, ...source])
  if (command === "--resolve-plan-262-57-pre-start-v1") return Object.freeze(
    ["node", "route", command, V138_REVIEW_V3_ROUTE_MANIFEST[1].destination,
      ...source])
  if (["--write-execution-context-v11-receipt",
    "--write-plan-262-57-route-start-v1"].includes(command)) return Object.freeze(
    ["node", "route", command, ROUTE_START_PATH, "--mode",
      "gsd-pattern-c-inline-main", "--cwd", "/Users/roryquinlan/runtime/cowards-game",
      "--terminal-agent-registry-json", JSON.stringify({ schemaVersion:
        "v1.38-plan-262-57-terminal-agent-registry-v1", activeExecutors: [] }),
      ...source])
  if (command === "--write-headroom-preflight-v11-receipt") return Object.freeze(
    ["node", "route", command, PREFLIGHT_PATH, "--route-start", ROUTE_START_PATH,
      ...source])
  if (command === "--calibrate-parallel-v11-receipt") return Object.freeze(
    ["node", "route", command, CALIBRATION_PATH, "--preflight", PREFLIGHT_PATH,
      "--route-start", ROUTE_START_PATH, "--source-a9", sourceA9,
      "--source-b9", sourceB9])
  if (command === "--write-authoritative-v12-receipt") return Object.freeze(
    ["node", "route", command, REPRODUCTION_PATH, "--calibration", CALIBRATION_PATH,
      "--route-start", ROUTE_START_PATH, "--source-a9", sourceA9,
      "--source-b9", sourceB9])
  const common = ["--authorization", AUTHORIZATION_PATH, "--seal", SEAL_PATH,
    "--route-start", ROUTE_START_PATH, "--preflight", PREFLIGHT_PATH,
    "--calibration", CALIBRATION_PATH, "--reproduction", REPRODUCTION_PATH]
  if (command === "--write-plan-262-57-terminal-v1") return Object.freeze(
    ["node", "route", command, TERMINAL_PATH, ...common, "--source-a9", sourceA9,
      "--source-b9", sourceB9, "--disposition", "reproduction_passed"])
  return Object.freeze(["node", "route", command, ...common, "--terminal",
    TERMINAL_PATH, "--source-a9", sourceA9, "--source-b9", sourceB9])
}

const exactBase64 = (value: unknown, maxBytes = 16 * 1024 * 1024) => {
  if (typeof value !== "string" || value.length > Math.ceil(maxBytes / 3) * 4)
    return undefined
  const bytes = Buffer.from(value, "base64")
  return bytes.toString("base64") === value ? bytes : undefined
}

const exactCommandArgv = (command: string, argv: readonly unknown[]) => {
  if (!argv.every(entry => boundedString(entry, 4096))) return false
  const sourceAIndex = argv.indexOf("--source-a9")
  const sourceBIndex = argv.indexOf("--source-b9")
  const sourceA9 = argv[sourceAIndex + 1]
  const sourceB9 = argv[sourceBIndex + 1]
  if (!fullOid(sourceA9) || !fullOid(sourceB9)) return false
  const expected = buildV138ReviewV3CommandArgv(command,
    String(sourceA9), String(sourceB9))
  return canonicalBytes(argv).equals(canonicalBytes(expected))
}

/** Strict pure validation only: this function never derives findings or performs I/O. */
export const validateV138ReviewV3Document = (value: unknown): V138ReviewV3Document => {
  const document = record(value, DOCUMENT_KEYS, "V138_REVIEW_V3_DOCUMENT_INVALID")
  const source = record(document.sourceCustody, SOURCE_KEYS, "V138_REVIEW_V3_SOURCE_INVALID")
  if (document.schemaVersion !== V138_REVIEW_V3_SCHEMA || !fullOid(document.sourceBase9) ||
    !fullOid(document.sourceA9) || document.sourceBase9 === document.sourceA9 ||
    !fullOid(source.tree) || !fullOid(source.parent) ||
    source.authorRun !== "codex-plan-262-60-a9-review-fix-v1" ||
    !Array.isArray(source.paths) ||
    canonicalBytes([...source.paths].sort()).toString("utf8") !==
      canonicalBytes([...V138_REVIEW_V3_SOURCE_PATHS].sort()).toString("utf8") ||
    !unique(source.paths) ||
    !source.paths.every((entry) => boundedString(entry)) ||
    !Array.isArray(source.blobs) ||
    source.blobs.length !== V138_REVIEW_V3_SOURCE_PATHS.length ||
    !Array.isArray(source.deletionHistory) ||
    source.deletionHistory.length !== V138_REVIEW_V3_DELETION_PATHS.length) {
    fail("V138_REVIEW_V3_SOURCE_INVALID")
  }
  for (const item of source.blobs) {
    const blob = record(item, BLOB_KEYS, "V138_REVIEW_V3_SOURCE_INVALID")
    if (!source.paths.includes(blob.path) || blob.mode !== "100644" && blob.mode !== "deleted" ||
      (blob.mode === "deleted" ? blob.blobOid !== null || blob.sha256 !== null ||
        blob.byteLength !== 0 : !fullOid(blob.blobOid) || !digest(blob.sha256) ||
          !boundedInt(blob.byteLength, 1, 16 * 1024 * 1024))) fail("V138_REVIEW_V3_SOURCE_INVALID")
  }
  const blobPaths = source.blobs.map((item) => (item as Record<string, unknown>).path)
  if (!unique(blobPaths) || canonicalBytes([...blobPaths].sort()).toString("utf8") !==
    canonicalBytes([...V138_REVIEW_V3_SOURCE_PATHS].sort()).toString("utf8")) {
    fail("V138_REVIEW_V3_SOURCE_INVALID")
  }
  for (const item of source.deletionHistory) {
    const deletion = record(item, DELETION_KEYS,
      "V138_REVIEW_V3_DELETION_HISTORY_INVALID")
    if (!V138_REVIEW_V3_DELETION_PATHS.includes(deletion.path as never) ||
      ![deletion.deletionCommit, deletion.deletionParent, deletion.deletionTree,
        deletion.priorBlobOid].every(fullOid) ||
      deletion.authorRun !== "codex-plan-262-60-a9-v1" ||
      !digest(deletion.priorSha256) ||
      !boundedInt(deletion.priorByteLength, 1, 16 * 1024 * 1024))
      fail("V138_REVIEW_V3_DELETION_HISTORY_INVALID")
  }
  const deletionPaths = source.deletionHistory.map((item) =>
    (item as Record<string, unknown>).path)
  if (!unique(deletionPaths) || canonicalBytes([...deletionPaths].sort())
    .toString("utf8") !== canonicalBytes([...V138_REVIEW_V3_DELETION_PATHS].sort())
    .toString("utf8")) fail("V138_REVIEW_V3_DELETION_HISTORY_INVALID")
  if (!Array.isArray(document.commands) || document.commands.length !== 10 ||
    !Array.isArray(document.handlerObservations) || document.handlerObservations.length !== 10) {
    fail("V138_REVIEW_V3_COMMANDS_INVALID")
  }
  for (const item of document.commands) {
    const command = record(item, COMMAND_KEYS, "V138_REVIEW_V3_COMMANDS_INVALID")
    const stdout = exactBase64(command.stdoutBase64)
    const stderr = exactBase64(command.stderrBase64)
    if (!boundedString(command.command, 160) || !Array.isArray(command.argv) ||
      command.exitStatus !== 0 || !exactCommandArgv(String(command.command),
        command.argv) || stdout === undefined || stderr === undefined ||
      command.stdoutSha256 !== sha256(stdout) ||
      command.stderrSha256 !== sha256(stderr)) fail("V138_REVIEW_V3_COMMANDS_INVALID")
  }
  for (const item of document.handlerObservations) {
    const observation = record(item, OBSERVATION_KEYS, "V138_REVIEW_V3_HANDLERS_INVALID")
    if (![observation.command, observation.handler, observation.prerequisites,
      observation.destination, observation.effectClass, observation.disposition]
      .every((entry) => boundedString(entry, 1024))) fail("V138_REVIEW_V3_HANDLERS_INVALID")
  }
  const commandNames = document.commands.map((item) =>
    (item as Record<string, unknown>).command)
  const observationCommands = document.handlerObservations.map((item) =>
    (item as Record<string, unknown>).command)
  const observationHandlers = document.handlerObservations.map((item) =>
    (item as Record<string, unknown>).handler)
  const expectedCommands = [...V138_REVIEW_V3_COMMANDS].sort()
  if (!unique(commandNames) || !unique(observationCommands) ||
    !unique(observationHandlers) ||
    canonicalBytes([...commandNames].sort()).toString("utf8") !==
      canonicalBytes(expectedCommands).toString("utf8") ||
    canonicalBytes([...observationCommands].sort()).toString("utf8") !==
      canonicalBytes(expectedCommands).toString("utf8")) {
    fail("V138_REVIEW_V3_COMMANDS_INVALID")
  }
  for (const item of document.handlerObservations) {
    const observation = item as Record<string, unknown>
    const manifest = V138_REVIEW_V3_ROUTE_MANIFEST.find(entry =>
      entry.command === observation.command)
    if (V138_REVIEW_V3_HANDLER_BY_COMMAND[
      observation.command as keyof typeof V138_REVIEW_V3_HANDLER_BY_COMMAND
    ] !== observation.handler || manifest === undefined ||
      observation.handler !== manifest.handler ||
      observation.prerequisites !== manifest.prerequisite ||
      observation.destination !== manifest.destination ||
      observation.effectClass !== manifest.sideEffect ||
      observation.disposition !== (manifest.terminalDisposition ?? "none"))
      fail("V138_REVIEW_V3_HANDLERS_INVALID")
  }
  const protectedHistory = record(document.protectedHistory,
    ["root", "protectedA8", "protectedRoots"], "V138_REVIEW_V3_HISTORY_INVALID")
  if (!digest(protectedHistory.root) || protectedHistory.protectedA8 !== document.sourceA9 ||
    !isRecord(protectedHistory.protectedRoots) || Object.keys(protectedHistory.protectedRoots).length < 8 ||
    !Object.values(protectedHistory.protectedRoots).every(digest)) fail("V138_REVIEW_V3_HISTORY_INVALID")
  const expectedCharges = [5, 6, 7, 8, 9].flatMap(version =>
    Array.from({ length: 8 }, (_, index) => `calibration:v${version}:${index}`))
  if (!Array.isArray(document.chargeIds) || JSON.stringify(document.chargeIds) !==
    JSON.stringify(expectedCharges) || !Array.isArray(document.priorAuthorizationBytes) ||
    document.priorAuthorizationBytes.length !== 6) fail("V138_REVIEW_V3_HISTORY_INVALID")
  for (const item of document.priorAuthorizationBytes) {
    const prior = record(item, PRIOR_KEYS, "V138_REVIEW_V3_HISTORY_INVALID")
    if (!boundedString(prior.path) || !fullOid(prior.commit) || !fullOid(prior.blobOid) ||
      !digest(prior.sha256) || !boundedInt(prior.byteLength, 1, 1024 * 1024)) fail("V138_REVIEW_V3_HISTORY_INVALID")
  }
  if (!unique(document.priorAuthorizationBytes.map((item) =>
    (item as Record<string, unknown>).path))) fail("V138_REVIEW_V3_HISTORY_INVALID")
  if (!Array.isArray(document.snapshots) || document.snapshots.length !== 2 ||
    !Array.isArray(document.orderedEvents) || document.orderedEvents.length === 0 ||
    document.orderedEvents.length > 512) fail("V138_REVIEW_V3_OBSERVATIONS_INVALID")
  for (const item of document.snapshots) {
    const snapshot = record(item, SNAPSHOT_KEYS, "V138_REVIEW_V3_OBSERVATIONS_INVALID")
    if (!boundedString(snapshot.name, 64) || !digest(snapshot.inventoryRoot) ||
      !boundedInt(snapshot.pathCount, 0, 4096)) fail("V138_REVIEW_V3_OBSERVATIONS_INVALID")
  }
  if (!unique(document.snapshots.map((item) =>
    (item as Record<string, unknown>).name))) fail("V138_REVIEW_V3_OBSERVATIONS_INVALID")
  document.orderedEvents.forEach((item, index) => {
    const event = record(item, EVENT_KEYS, "V138_REVIEW_V3_OBSERVATIONS_INVALID")
    if (event.ordinal !== index || !boundedString(event.event, 128) ||
      !boundedString(event.path, 1024) || !boundedString(event.result, 1024))
      fail("V138_REVIEW_V3_OBSERVATIONS_INVALID")
  })
  const cleanup = record(document.cleanup, ["complete", "residualPaths"],
    "V138_REVIEW_V3_CLEANUP_INVALID")
  if (cleanup.complete !== true || !Array.isArray(cleanup.residualPaths) ||
    cleanup.residualPaths.length !== 0) fail("V138_REVIEW_V3_CLEANUP_INVALID")
  const publication = record(document.publication, PUBLICATION_KEYS,
    "V138_REVIEW_V3_PUBLICATION_INVALID")
  if (JSON.stringify(publication.changedPaths) !== JSON.stringify([
    V138_REVIEW_V3_CANONICAL_PATH, V138_REVIEW_V3_REPORT_PATH]))
    fail("V138_REVIEW_V3_PUBLICATION_INVALID")
  const verdict = record(document.verdict, VERDICT_KEYS, "V138_REVIEW_V3_VERDICT_INVALID")
  if (verdict.findingCount !== 0 || verdict.sourceCompletenessPassed !== true ||
    verdict.authorizesExecution !== false) fail("V138_REVIEW_V3_VERDICT_INVALID")
  const identities = record(document.identityClaims, IDENTITY_KEYS, "V138_REVIEW_V3_IDENTITY_INVALID")
  if (identities.independentPersonClaimed !== false || identities.reviewerSeparated !== false ||
    identities.externalIdentityClaimed !== false ||
    identities.cryptographicReviewerIdentityClaimed !== false ||
    identities.independentCustodyClaimed !== false ||
    !boundedString(identities.proceduralContext, 512)) fail("V138_REVIEW_V3_IDENTITY_INVALID")
  const { reviewV3Root, ...body } = document
  if (!digest(reviewV3Root) || reviewV3Root !== rootOf(V138_REVIEW_V3_SCHEMA, body))
    fail("V138_REVIEW_V3_ROOT_INVALID")
  return Object.freeze(document)
}

export const checkV138ReviewV3ClaimsAgainstObservations = (input: Readonly<{
  document: unknown
  commands: unknown
  handlerObservations: unknown
  sourceCustody: unknown
  publication: unknown
  protectedHistory: unknown
  priorAuthorizationBytes: unknown
  snapshots: unknown
  orderedEvents: unknown
}>) => {
  const document = validateV138ReviewV3Document(input.document)
  for (const [claimed, observed, code] of [
    [document.commands, input.commands, "V138_REVIEW_V3_COMMAND_OBSERVATION_INVALID"],
    [document.handlerObservations, input.handlerObservations,
      "V138_REVIEW_V3_HANDLER_OBSERVATION_INVALID"],
    [document.sourceCustody, input.sourceCustody, "V138_REVIEW_V3_SOURCE_OBSERVATION_INVALID"],
    [document.publication, input.publication, "V138_REVIEW_V3_PUBLICATION_OBSERVATION_INVALID"],
    [document.protectedHistory, input.protectedHistory, "V138_REVIEW_V3_HISTORY_OBSERVATION_INVALID"],
    [document.priorAuthorizationBytes, input.priorAuthorizationBytes,
      "V138_REVIEW_V3_HISTORY_OBSERVATION_INVALID"],
    [document.snapshots, input.snapshots, "V138_REVIEW_V3_SNAPSHOT_OBSERVATION_INVALID"],
    [document.orderedEvents, input.orderedEvents, "V138_REVIEW_V3_EVENT_OBSERVATION_INVALID"],
  ] as const) {
    if (!canonicalBytes(claimed).equals(canonicalBytes(observed))) fail(code)
  }
  return document
}

const DETACHED_OPENAT_SOURCE = String.raw`
#define _GNU_SOURCE
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#define MAX_PARTS 256
#define MAX_BYTES (16 * 1024 * 1024)
#ifndef O_DIRECTORY
#define O_DIRECTORY 0
#endif
#ifndef O_NOFOLLOW
#define O_NOFOLLOW 0
#endif
#ifndef O_CLOEXEC
#define O_CLOEXEC 0
#endif
static long mt_sec(struct stat *s) {
#ifdef __APPLE__
  return s->st_mtimespec.tv_sec;
#else
  return s->st_mtim.tv_sec;
#endif
}
static long mt_nsec(struct stat *s) {
#ifdef __APPLE__
  return s->st_mtimespec.tv_nsec;
#else
  return s->st_mtim.tv_nsec;
#endif
}
static long ct_sec(struct stat *s) {
#ifdef __APPLE__
  return s->st_ctimespec.tv_sec;
#else
  return s->st_ctim.tv_sec;
#endif
}
static long ct_nsec(struct stat *s) {
#ifdef __APPLE__
  return s->st_ctimespec.tv_nsec;
#else
  return s->st_ctim.tv_nsec;
#endif
}
static int same_file(struct stat *a, struct stat *b) {
  return a->st_dev == b->st_dev && a->st_ino == b->st_ino &&
    a->st_size == b->st_size && mt_sec(a) == mt_sec(b) &&
    mt_nsec(a) == mt_nsec(b) && ct_sec(a) == ct_sec(b) &&
    ct_nsec(a) == ct_nsec(b);
}
static void close_all(int *fds, int count, int leaf) {
  if (leaf >= 0) close(leaf);
  for (int i = count - 1; i >= 0; --i) close(fds[i]);
}
static int walk(const char *absolute, int *fds, struct stat *stats,
  int *dir_count, int *leaf, struct stat *leaf_stat) {
  char *copy = strdup(absolute); char *parts[MAX_PARTS]; int count = 0;
  if (!copy || absolute[0] != '/') return 1;
  char *save = NULL; char *token = strtok_r(copy, "/", &save);
  while (token) {
    if (count >= MAX_PARTS || !strcmp(token, ".") || !strcmp(token, "..")) {
      free(copy); return 1;
    }
    parts[count++] = token; token = strtok_r(NULL, "/", &save);
  }
  if (count == 0) { free(copy); return 1; }
  int root = open("/", O_RDONLY | O_DIRECTORY | O_NOFOLLOW | O_CLOEXEC);
  if (root < 0 || fstat(root, &stats[0])) {
    if (root >= 0) close(root); free(copy); return 1;
  }
  fds[0] = root; *dir_count = 1;
  for (int i = 0; i < count - 1; ++i) {
    int next = openat(fds[*dir_count - 1], parts[i],
      O_RDONLY | O_DIRECTORY | O_NOFOLLOW | O_CLOEXEC);
    if (next < 0 || fstat(next, &stats[*dir_count]) ||
      !S_ISDIR(stats[*dir_count].st_mode)) {
      if (next >= 0) close(next); free(copy); return 1;
    }
    fds[(*dir_count)++] = next;
  }
  *leaf = openat(fds[*dir_count - 1], parts[count - 1],
    O_RDONLY | O_NOFOLLOW | O_CLOEXEC);
  if (*leaf < 0 || fstat(*leaf, leaf_stat)) { free(copy); return 1; }
  free(copy); return 0;
}
int main(int argc, char **argv) {
  if (argc != 3) { fputs("PATH_INVALID", stderr); return 10; }
  int fds[MAX_PARTS], post_fds[MAX_PARTS], count = 0, post_count = 0;
  int leaf = -1, post_leaf = -1; struct stat stats[MAX_PARTS], post_stats[MAX_PARTS];
  struct stat before, after, post_leaf_stat;
  if (walk(argv[1], fds, stats, &count, &leaf, &before)) {
    fputs("METADATA_INVALID", stderr); return 11;
  }
  if (!S_ISREG(before.st_mode) || before.st_nlink != 1 ||
    before.st_uid != geteuid() || (before.st_mode & 0222) != 0 ||
    before.st_size < 2 || before.st_size > MAX_BYTES) {
    close_all(fds, count, leaf); fputs("METADATA_INVALID", stderr); return 11;
  }
  long delay = strtol(argv[2], NULL, 10);
  if (delay > 0 && delay <= 5000) {
    struct timespec pause = { delay / 1000, (delay % 1000) * 1000000L };
    nanosleep(&pause, NULL);
  }
  size_t size = (size_t)before.st_size; unsigned char *bytes = malloc(size);
  if (!bytes) { close_all(fds, count, leaf); fputs("METADATA_INVALID", stderr); return 11; }
  size_t offset = 0;
  while (offset < size) {
    ssize_t got = pread(leaf, bytes + offset, size - offset, (off_t)offset);
    if (got == 0) { free(bytes); close_all(fds, count, leaf);
      fputs("TRUNCATED", stderr); return 12; }
    if (got < 0) { free(bytes); close_all(fds, count, leaf);
      fputs("MUTATED", stderr); return 14; }
    offset += (size_t)got;
  }
  if (fstat(leaf, &after) || !same_file(&before, &after)) {
    free(bytes); close_all(fds, count, leaf); fputs("MUTATED", stderr); return 14;
  }
  if (walk(argv[1], post_fds, post_stats, &post_count, &post_leaf, &post_leaf_stat) ||
    post_count != count || post_leaf_stat.st_dev != before.st_dev ||
    post_leaf_stat.st_ino != before.st_ino) {
    free(bytes); close_all(fds, count, leaf);
    if (post_leaf >= 0) close_all(post_fds, post_count, post_leaf);
    fputs("ANCESTOR_MUTATED", stderr); return 13;
  }
  for (int i = 0; i < count; ++i) if (stats[i].st_dev != post_stats[i].st_dev ||
    stats[i].st_ino != post_stats[i].st_ino) {
    free(bytes); close_all(fds, count, leaf); close_all(post_fds, post_count, post_leaf);
    fputs("ANCESTOR_MUTATED", stderr); return 13;
  }
  close_all(post_fds, post_count, post_leaf);
  printf("{\"dev\":\"%llu\",\"ino\":\"%llu\",\"size\":%lld}\n",
    (unsigned long long)before.st_dev, (unsigned long long)before.st_ino,
    (long long)before.st_size);
  fflush(stdout);
  if (fwrite(bytes, 1, size, stdout) != size) {
    free(bytes); close_all(fds, count, leaf); return 15;
  }
  free(bytes); close_all(fds, count, leaf); return 0;
}
`

let detachedOpenatHelper: string | undefined
const detachedHelper = () => {
  if (detachedOpenatHelper !== undefined) return detachedOpenatHelper
  const directory = mkdtempSync(path.join(tmpdir(), "v138-openat-"))
  const target = path.join(directory, "read-detached")
  execFileSync(process.env.CC ?? "cc", ["-x", "c", "-std=c11", "-O2",
    "-o", target, "-"], { input: DETACHED_OPENAT_SOURCE, maxBuffer: 1024 * 1024 })
  process.once("exit", () => {
    try { rmSync(directory, { recursive: true, force: true }) } catch {}
  })
  detachedOpenatHelper = target
  return target
}

export const readV138DetachedFileOpenat = (absolutePath: string,
  testDelayMilliseconds = 0) => {
  if (!path.isAbsolute(absolutePath) ||
    !boundedInt(testDelayMilliseconds, 0, 5000))
    fail("V138_REVIEW_V3_DETACHED_PATH_INVALID")
  let output: Buffer
  try {
    output = execFileSync(detachedHelper(), [path.resolve(absolutePath),
      String(testDelayMilliseconds)], { maxBuffer: 17 * 1024 * 1024 })
  } catch (error) {
    const observed = error as { status?: number; stderr?: Buffer | string }
    const detail = Buffer.isBuffer(observed.stderr) ? observed.stderr.toString("utf8") :
      String(observed.stderr ?? "")
    if (observed.status === 12 || detail.includes("TRUNCATED"))
      fail("V138_REVIEW_V3_DETACHED_TRUNCATED")
    if (observed.status === 13 || detail.includes("ANCESTOR_MUTATED"))
      fail("V138_REVIEW_V3_DETACHED_ANCESTOR_MUTATED")
    if (observed.status === 14 || detail.includes("MUTATED"))
      fail("V138_REVIEW_V3_DETACHED_MUTATED")
    fail("V138_REVIEW_V3_DETACHED_METADATA_INVALID")
  }
  const newline = output.indexOf(0x0a)
  if (newline <= 0) fail("V138_REVIEW_V3_DETACHED_METADATA_INVALID")
  let metadata: { dev?: unknown; ino?: unknown; size?: unknown }
  try { metadata = JSON.parse(output.subarray(0, newline).toString("utf8")) } catch {
    fail("V138_REVIEW_V3_DETACHED_METADATA_INVALID")
  }
  const bytes = output.subarray(newline + 1)
  if (typeof metadata.dev !== "string" || !/^[0-9]+$/u.test(metadata.dev) ||
    typeof metadata.ino !== "string" || !/^[0-9]+$/u.test(metadata.ino) ||
    metadata.size !== bytes.length) fail("V138_REVIEW_V3_DETACHED_METADATA_INVALID")
  return Object.freeze({ bytes: Buffer.from(bytes), noFollowIdentity:
    `dev:${metadata.dev}:ino:${metadata.ino}:size:${metadata.size}` })
}

export const readAndValidateV138DetachedReviewV3 = (input: Readonly<{
  repoRoot: string; absolutePath: string; expectedSourceA9: string
  testDelayMilliseconds?: number
}>) => {
  const absolutePath = path.resolve(input.absolutePath)
  const physicalRoot = path.resolve(input.repoRoot)
  if (!path.isAbsolute(input.absolutePath) || absolutePath === physicalRoot ||
    absolutePath.startsWith(`${physicalRoot}${path.sep}`) ||
    path.basename(absolutePath) !== path.basename(V138_REVIEW_V3_CANONICAL_PATH))
    fail("V138_REVIEW_V3_DETACHED_PATH_INVALID")
  const snapshot = readV138DetachedFileOpenat(absolutePath,
    input.testDelayMilliseconds ?? 0)
  let parsed: unknown
  try { parsed = JSON.parse(snapshot.bytes.toString("utf8")) } catch {
    fail("V138_REVIEW_V3_BYTES_INVALID")
  }
  const document = validateV138ReviewV3Document(parsed)
  if (document.sourceA9 !== input.expectedSourceA9 ||
    !snapshot.bytes.equals(Buffer.concat([canonicalBytes(document), Buffer.from("\n")])))
    fail("V138_REVIEW_V3_BYTES_INVALID")
  return Object.freeze({ absolutePath, bytes: snapshot.bytes,
    bytesSha256: sha256(snapshot.bytes), byteLength: snapshot.bytes.length,
    document, noFollowIdentity: snapshot.noFollowIdentity })
}

const git = (repoRoot: string, args: readonly string[]) => execFileSync("git", [...args], {
  cwd: repoRoot, encoding: "utf8", maxBuffer: 16 * 1024 * 1024,
}).trim()
export const validateV138ReviewV3PublicationLineage = (input: Readonly<{
  repoRoot: string; sourceA9: string; publicationCommit: string; reviewBytes: Uint8Array
}>) => {
  if (![input.sourceA9, input.publicationCommit].every(fullOid))
    fail("V138_REVIEW_V3_PUBLICATION_INVALID")
  const parents = git(input.repoRoot, ["show", "-s", "--format=%P", input.publicationCommit])
    .split(" ").filter(Boolean)
  const changedPaths = git(input.repoRoot, ["diff-tree", "--no-commit-id", "--name-only",
    "-r", "--no-renames", input.publicationCommit]).split("\n").filter(Boolean).sort()
  const firstParent = git(input.repoRoot, ["rev-list", "--first-parent", "HEAD"])
    .split("\n").filter(Boolean)
  const expectedPaths = [V138_REVIEW_V3_CANONICAL_PATH, V138_REVIEW_V3_REPORT_PATH].sort()
  if (parents.length !== 1 || parents[0] !== input.sourceA9 ||
    JSON.stringify(changedPaths) !== JSON.stringify(expectedPaths) ||
    firstParent.filter(commit => commit === input.publicationCommit).length !== 1 ||
    git(input.repoRoot, ["log", "--format=%H", `${input.publicationCommit}..HEAD`, "--",
      ...expectedPaths]) !== "") fail("V138_REVIEW_V3_PUBLICATION_INVALID")
  const committed = execFileSync("git", ["show",
    `${input.publicationCommit}:${V138_REVIEW_V3_CANONICAL_PATH}`], { cwd: input.repoRoot })
  if (!committed.equals(Buffer.from(input.reviewBytes))) fail("V138_REVIEW_V3_PUBLICATION_INVALID")
  return Object.freeze({ publicationCommit: input.publicationCommit, parent: parents[0]!,
    tree: git(input.repoRoot, ["rev-parse", `${input.publicationCommit}^{tree}`]),
    reviewBlob: git(input.repoRoot, ["rev-parse",
      `${input.publicationCommit}:${V138_REVIEW_V3_CANONICAL_PATH}`]),
    reportBlob: git(input.repoRoot, ["rev-parse",
      `${input.publicationCommit}:${V138_REVIEW_V3_REPORT_PATH}`]), changedPaths })
}

export const computeV138ReviewV3Root = (value: Omit<Record<string, unknown>, "reviewV3Root">) =>
  rootOf(V138_REVIEW_V3_SCHEMA, value)
