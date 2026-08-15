import { Buffer } from "node:buffer"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { closeSync, constants, fstatSync, lstatSync, openSync, readSync,
  realpathSync } from "node:fs"
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
  "scripts/check-v1-38-plan-262-58-source-completeness-review-v2.test.ts",
  "scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts",
  "scripts/evaluate-v1-38-successor-route.test.ts",
  "scripts/evaluate-v1-38-successor-source-complete.test.ts",
  "scripts/lib/v1-38-current-matrix-reproduction.ts",
  "scripts/lib/v1-38-source-completeness-review-v3.ts",
  "scripts/lib/v1-38-successor-source-seal.ts",
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
const SOURCE_KEYS = ["tree", "parent", "authorRun", "paths", "blobs"] as const
const BLOB_KEYS = ["path", "mode", "blobOid", "sha256", "byteLength"] as const
const COMMAND_KEYS = ["command", "argv", "exitStatus", "stdoutSha256", "stderrSha256"] as const
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
    !Array.isArray(source.blobs) || source.blobs.length !== 8) {
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
  if (!Array.isArray(document.commands) || document.commands.length !== 10 ||
    !Array.isArray(document.handlerObservations) || document.handlerObservations.length !== 10) {
    fail("V138_REVIEW_V3_COMMANDS_INVALID")
  }
  for (const item of document.commands) {
    const command = record(item, COMMAND_KEYS, "V138_REVIEW_V3_COMMANDS_INVALID")
    if (!boundedString(command.command, 160) || !Array.isArray(command.argv) ||
      command.argv.length < 2 || command.argv.length > 32 ||
      !command.argv.every((entry) => boundedString(entry, 1024)) || command.exitStatus !== 0 ||
      !command.argv.includes(command.command) ||
      !digest(command.stdoutSha256) || !digest(command.stderrSha256)) fail("V138_REVIEW_V3_COMMANDS_INVALID")
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
    if (V138_REVIEW_V3_HANDLER_BY_COMMAND[
      observation.command as keyof typeof V138_REVIEW_V3_HANDLER_BY_COMMAND
    ] !== observation.handler) fail("V138_REVIEW_V3_HANDLERS_INVALID")
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
  sourceCustody: unknown
  publication: unknown
  protectedHistory: unknown
  priorAuthorizationBytes: unknown
  snapshots: unknown
  orderedEvents: unknown
}>) => {
  const document = validateV138ReviewV3Document(input.document)
  for (const [claimed, observed, code] of [
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

export const readAndValidateV138DetachedReviewV3 = (input: Readonly<{
  repoRoot: string; absolutePath: string; expectedSourceA9: string
}>) => {
  const physicalRoot = realpathSync(input.repoRoot)
  const absolutePath = path.resolve(input.absolutePath)
  if (!path.isAbsolute(input.absolutePath) || absolutePath === physicalRoot ||
    absolutePath.startsWith(`${physicalRoot}${path.sep}`) ||
    path.basename(absolutePath) !== path.basename(V138_REVIEW_V3_CANONICAL_PATH))
    fail("V138_REVIEW_V3_DETACHED_PATH_INVALID")
  let cursor = path.parse(absolutePath).root
  for (const segment of absolutePath.slice(cursor.length).split(path.sep)) {
    if (!segment) continue
    cursor = path.join(cursor, segment)
    if (lstatSync(cursor).isSymbolicLink()) fail("V138_REVIEW_V3_DETACHED_METADATA_INVALID")
  }
  const descriptor = openSync(absolutePath, constants.O_RDONLY | constants.O_NOFOLLOW)
  let bytes: Buffer; let before; let after
  try {
    before = fstatSync(descriptor, { bigint: true })
    if (!before.isFile() || before.nlink !== 1n || before.uid !== BigInt(process.geteuid?.() ?? -1) ||
      (before.mode & 0o222n) !== 0n || before.size < 2n || before.size > 16n * 1024n * 1024n)
      fail("V138_REVIEW_V3_DETACHED_METADATA_INVALID")
    bytes = Buffer.alloc(Number(before.size)); let offset = 0
    while (offset < bytes.length) offset += readSync(descriptor, bytes, offset,
      bytes.length - offset, offset)
    after = fstatSync(descriptor, { bigint: true })
  } finally { closeSync(descriptor) }
  if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size ||
    before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs)
    fail("V138_REVIEW_V3_DETACHED_MUTATED")
  let parsed: unknown
  try { parsed = JSON.parse(bytes.toString("utf8")) } catch { fail("V138_REVIEW_V3_BYTES_INVALID") }
  const document = validateV138ReviewV3Document(parsed)
  if (document.sourceA9 !== input.expectedSourceA9 ||
    !bytes.equals(Buffer.concat([canonicalBytes(document), Buffer.from("\n")])))
    fail("V138_REVIEW_V3_BYTES_INVALID")
  return Object.freeze({ absolutePath, bytesSha256: sha256(bytes), byteLength: bytes.length,
    document, noFollowIdentity: `dev:${before.dev}:ino:${before.ino}:size:${before.size}` })
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
