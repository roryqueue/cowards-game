#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { readFileSync, renameSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SHA256 = /^sha256:[0-9a-f]{64}$/u
const GIT_SHA = /^[0-9a-f]{40}$/u
const TRANSACTION_TOKEN =
  /^activation-transaction:phase-260-plan-14:[a-z0-9._:-]+$/u

export const V1_37_OBSERVATION_V1_19_ACTIVATION_FILES = Object.freeze([
  "packages/spec/src/current-semantic-authority-source.ts",
  "packages/spec/src/current-semantic-authority-generated.ts",
  "apps/go-backend/current_semantic_authority_generated.go",
  "packages/golden/src/fixtures/v1-37-conformance-corpus/registry.json",
  "packages/golden/src/v1-37-conformance-corpus-pin.ts",
  "packages/golden/src/fixtures/v1-37-conformance-traces/registry.json",
  "packages/persistence/src/current-workshop-contract-generated.ts",
  ".planning/artifacts/v1.37-integrity-authority.json",
  ".planning/artifacts/v1.37-observation-v1.19-activation-transaction-proof.json",
] as const)

/**
 * These are logical selectors, not writable table names. Plan 14 must map each
 * member to canonical row JSON inside its serializable transaction. Keeping
 * the fixed inventory here prevents a transaction receipt from omitting one
 * language, authority head, service selector, or revision-admission decision.
 */
export const V1_37_OBSERVATION_V1_19_DATABASE_SELECTORS = Object.freeze([
  "authority-installed-head",
  "semantic-tuple-current",
  "runtime-abi-current",
  "runtime-service-current",
  "certificate-typescript-current",
  "certificate-python-current",
  "certificate-rust-current",
  "certificate-zig-current",
  "arena-catalog-current",
  "set-policy-current",
  "strategy-revision-admission-current",
] as const)

export const V1_37_OBSERVATION_V1_19_POSTACTIVATION_GATES = Object.freeze([
  "spec",
  "engine",
  "generator",
  "persistence",
  "postgresql",
  "go",
  "runtime-service",
  "replay",
  "public-contract",
  "web",
  "privacy",
  "boundary",
  "history",
  "certification",
  "d04-admission",
  "corpus",
  "trace",
  "workshop",
  "typecheck",
  "lint",
  "build",
  "protected-baseline",
  "rollback",
] as const)

const REQUIREMENTS = Object.freeze([
  "STRAT-01",
  "STRAT-02",
  "STRAT-03",
  "STRAT-04",
  "SET-01",
  "SET-02",
  "SET-03",
  "SET-04",
  "SET-05",
] as const)
const DECISIONS = Object.freeze(
  Array.from(
    { length: 16 },
    (_, index) => `D-${String(index + 1).padStart(2, "0")}`,
  ),
)

const SUCCESSOR_SELECTION = Object.freeze({
  semantic: Object.freeze({
    semanticAuthorityKey: "runtime-v1.19",
    tupleId:
      "sha256:37c9a07425d454c74859112debcc3ef362d43e80d5767560d9bde28a3c8d5e73",
    runtimeAbiVersion: "strategy-runtime-abi-v1.19",
    arenaCatalogVersion: "canonical-arena-catalog-v1.37",
    setPolicyVersion: "canonical-set-policy-v1.37-four-condition-v1",
    certificateVersion: "runtime-conformance-certificate-v1.19",
  }),
  corpus: Object.freeze({
    version: "v3",
    rootSha256:
      "sha256:06d0717a16047cace0364c94a15353e2d53b53da5e8bebef6912f9f30f3d681d",
    candidateFileSha256:
      "sha256:ec92ba7506907e65a032083a2c68005022c7ad8d8873a9ddbc59338db2d8d5d0",
    reviewedPinFileSha256:
      "sha256:bd40526e92122be0e7b00e0c57fdc21f14374e19c18ff90c927215c1e2bcc9c6",
    current: true,
  }),
  trace: Object.freeze({
    version: "v1.37-observation-trace-v4",
    rootSha256:
      "sha256:f9821fd2b3a5a3cb17a01b4a8050ea70c2274df04601f314a25adac6da4f428a",
    bundleRootSha256:
      "sha256:11fee531edf255b80c2c9780b13c9daf9598581f3218fe5d4d38e38b879a04bd",
    reviewedPinFileSha256:
      "sha256:6dd4cd7cf9bdf2de46a3517062a5eac8f15301e87723fc39c98226a400a1d059",
    current: true,
  }),
  workshop: Object.freeze({
    version: "workshop-contract-v1.19",
    runtimeAbiVersion: "strategy-runtime-abi-v1.19",
    rootSha256:
      "sha256:b455b4e44ccae14cb724c6d3e8f41e3fb8dfcdb36976d35058f859dcfc7a385d",
    candidatePinFileSha256:
      "sha256:2ad1c0be0b79beb67308fe1c089c8223d93ed4f33130dbf9c7b88fb4dffca57b",
    current: true,
  }),
  go: Object.freeze({
    semanticAuthorityKey: "runtime-v1.19",
    tupleId:
      "sha256:37c9a07425d454c74859112debcc3ef362d43e80d5767560d9bde28a3c8d5e73",
    runtimeAbiVersion: "strategy-runtime-abi-v1.19",
  }),
  database: Object.freeze({
    semanticAuthorityKey: "runtime-v1.19",
    tupleId:
      "sha256:37c9a07425d454c74859112debcc3ef362d43e80d5767560d9bde28a3c8d5e73",
    runtimeAbiVersion: "strategy-runtime-abi-v1.19",
    arenaCatalogVersion: "canonical-arena-catalog-v1.37",
    setPolicyVersion: "canonical-set-policy-v1.37-four-condition-v1",
    certificateVersion: "runtime-conformance-certificate-v1.19",
    selectedCertificateCount: 4,
    selectedRunCount: 12,
    conditionCount: 4,
  }),
  arena: Object.freeze({
    activeSemanticGeometryCount: 2,
    schedulableArenaCount: 2,
    historicalAliasCount: 1,
    aliasDiversityCount: 0,
  }),
  set: Object.freeze({
    conditionCount: 4,
    typescriptMatrixProved: true,
    goMatrixProved: true,
    partialMatricesCounted: false,
    systemFailuresCounted: false,
  }),
  replay: Object.freeze({
    current: true,
    reconstructionEquivalent: true,
    historicalEvidenceImmutable: true,
  }),
  publicContract: Object.freeze({
    current: true,
    privateFieldCount: 0,
  }),
})

type ActivationFileId =
  (typeof V1_37_OBSERVATION_V1_19_ACTIVATION_FILES)[number]
type DatabaseSelectorId =
  (typeof V1_37_OBSERVATION_V1_19_DATABASE_SELECTORS)[number]
type GateId = (typeof V1_37_OBSERVATION_V1_19_POSTACTIVATION_GATES)[number]

export interface V137ObservationV119SnapshotMember {
  id: ActivationFileId | DatabaseSelectorId
  state: "present" | "absent"
  sha256: string | null
}

export interface V137ObservationV119GateReceipt {
  id: GateId
  status: "passed"
  exitCode: 0
  command: string
  stdoutSha256: string
  stderrSha256: string
  headSha: string
  dirtyWorktreeSha256: string
  transactionToken: string
  completedAt: string
  validUntil: string
  fresh: true
  synthetic: false
}

export interface V137ObservationV119PostactivationBuildInput {
  binding: {
    headSha: string
    dirtyWorktreeSha256: string
    preactivationProofSha256: string
    transactionToken: string
    transactionIsolation: "serializable"
  }
  snapshots: {
    files: {
      preimage: V137ObservationV119SnapshotMember[]
      activated: V137ObservationV119SnapshotMember[]
      restored: V137ObservationV119SnapshotMember[]
      reinstalled: V137ObservationV119SnapshotMember[]
    }
    database: {
      preimage: V137ObservationV119SnapshotMember[]
      activated: V137ObservationV119SnapshotMember[]
      restored: V137ObservationV119SnapshotMember[]
      reinstalled: V137ObservationV119SnapshotMember[]
    }
  }
  gates: V137ObservationV119GateReceipt[]
  revisionAdmission: {
    inventoryCount: number
    revalidatedCount: number
    nonCountedCount: number
    inferenceAllowed: boolean
    allDispositionsExplicit: boolean
    selectorActivated: boolean
    incompleteRevisionCount: number
    countedRevisionCount: number
  }
  protectedBaseline: {
    status: "verified"
    protectedPathCount: number
    baselineSha256: string
  }
}

export interface V137ObservationV119PostactivationProof {
  schemaVersion: "v1.37-observation-v1.19-postactivation-proof-v1"
  milestone: "v1.37"
  phase: 260
  lifecycle: "postactivation-precommit"
  current: true
  requirements: Array<{ id: string; status: "proved" }>
  decisions: Array<{ id: string; status: "proved" }>
  binding: V137ObservationV119PostactivationBuildInput["binding"]
  selection: typeof SUCCESSOR_SELECTION
  snapshots: V137ObservationV119PostactivationBuildInput["snapshots"]
  snapshotRoots: {
    filePreimageSha256: string
    fileActivatedSha256: string
    databasePreimageSha256: string
    databaseActivatedSha256: string
  }
  revisionAdmission: V137ObservationV119PostactivationBuildInput["revisionAdmission"]
  protectedBaseline: V137ObservationV119PostactivationBuildInput["protectedBaseline"]
  privacy: { publicSafe: true; forbiddenFieldCount: 0 }
  gates: V137ObservationV119GateReceipt[]
}

const sha256 = (value: string | Uint8Array): string =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const exactKeys = (value: unknown, keys: readonly string[]): boolean =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.keys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key))
const equal = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right)
const snapshotRoot = (
  snapshot: readonly V137ObservationV119SnapshotMember[],
): string => sha256(JSON.stringify(snapshot))

const snapshotErrors = (
  snapshot: unknown,
  expectedIds: readonly string[],
  requirePresent: boolean,
): boolean => {
  if (!Array.isArray(snapshot) || snapshot.length !== expectedIds.length)
    return true
  return snapshot.some((member, index) => {
    if (!exactKeys(member, ["id", "state", "sha256"])) return true
    const record = member as V137ObservationV119SnapshotMember
    if (record.id !== expectedIds[index]) return true
    if (record.state !== "present" && record.state !== "absent") return true
    if (requirePresent && record.state !== "present") return true
    return record.state === "present"
      ? typeof record.sha256 !== "string" || !SHA256.test(record.sha256)
      : record.sha256 !== null
  })
}

const everyMemberChanged = (
  before: readonly V137ObservationV119SnapshotMember[],
  after: readonly V137ObservationV119SnapshotMember[],
): boolean =>
  before.every(
    (member, index) =>
      member.state !== after[index]?.state ||
      member.sha256 !== after[index]?.sha256,
  )

const selectionHasExactShape = (value: unknown): boolean => {
  if (
    !exactKeys(value, [
      "semantic",
      "corpus",
      "trace",
      "workshop",
      "go",
      "database",
      "arena",
      "set",
      "replay",
      "publicContract",
    ])
  )
    return false
  const selection = value as Record<string, unknown>
  return (
    exactKeys(selection.semantic, [
      "semanticAuthorityKey",
      "tupleId",
      "runtimeAbiVersion",
      "arenaCatalogVersion",
      "setPolicyVersion",
      "certificateVersion",
    ]) &&
    exactKeys(selection.corpus, [
      "version",
      "rootSha256",
      "candidateFileSha256",
      "reviewedPinFileSha256",
      "current",
    ]) &&
    exactKeys(selection.trace, [
      "version",
      "rootSha256",
      "bundleRootSha256",
      "reviewedPinFileSha256",
      "current",
    ]) &&
    exactKeys(selection.workshop, [
      "version",
      "runtimeAbiVersion",
      "rootSha256",
      "candidatePinFileSha256",
      "current",
    ]) &&
    exactKeys(selection.go, [
      "semanticAuthorityKey",
      "tupleId",
      "runtimeAbiVersion",
    ]) &&
    exactKeys(selection.database, [
      "semanticAuthorityKey",
      "tupleId",
      "runtimeAbiVersion",
      "arenaCatalogVersion",
      "setPolicyVersion",
      "certificateVersion",
      "selectedCertificateCount",
      "selectedRunCount",
      "conditionCount",
    ]) &&
    exactKeys(selection.arena, [
      "activeSemanticGeometryCount",
      "schedulableArenaCount",
      "historicalAliasCount",
      "aliasDiversityCount",
    ]) &&
    exactKeys(selection.set, [
      "conditionCount",
      "typescriptMatrixProved",
      "goMatrixProved",
      "partialMatricesCounted",
      "systemFailuresCounted",
    ]) &&
    exactKeys(selection.replay, [
      "current",
      "reconstructionEquivalent",
      "historicalEvidenceImmutable",
    ]) &&
    exactKeys(selection.publicContract, ["current", "privateFieldCount"])
  )
}

export const buildV137ObservationV119PostactivationProof = (
  input: V137ObservationV119PostactivationBuildInput,
): V137ObservationV119PostactivationProof => ({
  schemaVersion: "v1.37-observation-v1.19-postactivation-proof-v1",
  milestone: "v1.37",
  phase: 260,
  lifecycle: "postactivation-precommit",
  current: true,
  requirements: REQUIREMENTS.map((id) => ({ id, status: "proved" })),
  decisions: DECISIONS.map((id) => ({ id, status: "proved" })),
  binding: clone(input.binding),
  selection: clone(SUCCESSOR_SELECTION),
  snapshots: clone(input.snapshots),
  snapshotRoots: {
    filePreimageSha256: snapshotRoot(input.snapshots.files.preimage),
    fileActivatedSha256: snapshotRoot(input.snapshots.files.activated),
    databasePreimageSha256: snapshotRoot(input.snapshots.database.preimage),
    databaseActivatedSha256: snapshotRoot(input.snapshots.database.activated),
  },
  revisionAdmission: clone(input.revisionAdmission),
  protectedBaseline: clone(input.protectedBaseline),
  privacy: { publicSafe: true, forbiddenFieldCount: 0 },
  gates: clone(input.gates),
})

export const validateV137ObservationV119PostactivationProof = (
  value: unknown,
  now: string = new Date().toISOString(),
): string[] => {
  if (
    !exactKeys(value, [
      "schemaVersion",
      "milestone",
      "phase",
      "lifecycle",
      "current",
      "requirements",
      "decisions",
      "binding",
      "selection",
      "snapshots",
      "snapshotRoots",
      "revisionAdmission",
      "protectedBaseline",
      "privacy",
      "gates",
    ])
  )
    return ["proof shape"]
  const proof = value as V137ObservationV119PostactivationProof
  if (!selectionHasExactShape(proof.selection)) return ["proof shape"]
  const errors: string[] = []
  if (
    proof.schemaVersion !== "v1.37-observation-v1.19-postactivation-proof-v1" ||
    proof.milestone !== "v1.37" ||
    proof.phase !== 260 ||
    proof.lifecycle !== "postactivation-precommit" ||
    proof.current !== true
  )
    errors.push("proof identity")
  if (
    !equal(
      proof.requirements,
      REQUIREMENTS.map((id) => ({ id, status: "proved" })),
    )
  )
    errors.push("requirements")
  if (
    !equal(
      proof.decisions,
      DECISIONS.map((id) => ({ id, status: "proved" })),
    )
  )
    errors.push("decisions")
  if (
    !exactKeys(proof.binding, [
      "headSha",
      "dirtyWorktreeSha256",
      "preactivationProofSha256",
      "transactionToken",
      "transactionIsolation",
    ]) ||
    !GIT_SHA.test(proof.binding.headSha) ||
    !SHA256.test(proof.binding.dirtyWorktreeSha256) ||
    !SHA256.test(proof.binding.preactivationProofSha256) ||
    !TRANSACTION_TOKEN.test(proof.binding.transactionToken) ||
    proof.binding.transactionIsolation !== "serializable"
  )
    errors.push("activation binding")
  if (!equal(proof.selection, SUCCESSOR_SELECTION))
    errors.push("successor selection")
  if (
    !exactKeys(proof.snapshots, ["files", "database"]) ||
    !exactKeys(proof.snapshots.files, [
      "preimage",
      "activated",
      "restored",
      "reinstalled",
    ]) ||
    !exactKeys(proof.snapshots.database, [
      "preimage",
      "activated",
      "restored",
      "reinstalled",
    ])
  )
    return ["proof shape"]

  const files = proof.snapshots.files
  const database = proof.snapshots.database
  if (
    snapshotErrors(
      files.preimage,
      V1_37_OBSERVATION_V1_19_ACTIVATION_FILES,
      false,
    )
  )
    errors.push("file preimage snapshot")
  if (
    snapshotErrors(
      files.activated,
      V1_37_OBSERVATION_V1_19_ACTIVATION_FILES,
      true,
    ) ||
    !everyMemberChanged(files.preimage, files.activated)
  )
    errors.push("activated file snapshot")
  if (
    snapshotErrors(
      database.preimage,
      V1_37_OBSERVATION_V1_19_DATABASE_SELECTORS,
      true,
    )
  )
    errors.push("database preimage snapshot")
  if (
    snapshotErrors(
      database.activated,
      V1_37_OBSERVATION_V1_19_DATABASE_SELECTORS,
      true,
    ) ||
    !everyMemberChanged(database.preimage, database.activated)
  )
    errors.push("activated database snapshot")
  if (!equal(files.restored, files.preimage)) errors.push("file rollback")
  if (!equal(files.reinstalled, files.activated)) errors.push("file reinstall")
  if (!equal(database.restored, database.preimage))
    errors.push("database rollback")
  if (!equal(database.reinstalled, database.activated))
    errors.push("database reinstall")
  if (
    !exactKeys(proof.snapshotRoots, [
      "filePreimageSha256",
      "fileActivatedSha256",
      "databasePreimageSha256",
      "databaseActivatedSha256",
    ]) ||
    proof.snapshotRoots.filePreimageSha256 !== snapshotRoot(files.preimage) ||
    proof.snapshotRoots.fileActivatedSha256 !== snapshotRoot(files.activated) ||
    proof.snapshotRoots.databasePreimageSha256 !==
      snapshotRoot(database.preimage) ||
    proof.snapshotRoots.databaseActivatedSha256 !==
      snapshotRoot(database.activated)
  )
    errors.push("snapshot roots")
  if (
    !exactKeys(proof.revisionAdmission, [
      "inventoryCount",
      "revalidatedCount",
      "nonCountedCount",
      "inferenceAllowed",
      "allDispositionsExplicit",
      "selectorActivated",
      "incompleteRevisionCount",
      "countedRevisionCount",
    ]) ||
    proof.revisionAdmission.inventoryCount !== 9 ||
    proof.revisionAdmission.revalidatedCount !== 0 ||
    proof.revisionAdmission.nonCountedCount !== 9 ||
    proof.revisionAdmission.inferenceAllowed !== false ||
    proof.revisionAdmission.allDispositionsExplicit !== true ||
    proof.revisionAdmission.selectorActivated !== true ||
    proof.revisionAdmission.incompleteRevisionCount !== 9 ||
    proof.revisionAdmission.countedRevisionCount !== 0
  )
    errors.push("revision admission")
  if (
    !exactKeys(proof.protectedBaseline, [
      "status",
      "protectedPathCount",
      "baselineSha256",
    ]) ||
    proof.protectedBaseline.status !== "verified" ||
    proof.protectedBaseline.protectedPathCount !== 2 ||
    proof.protectedBaseline.baselineSha256 !==
      "sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707"
  )
    errors.push("protected baseline")
  if (
    !exactKeys(proof.privacy, ["publicSafe", "forbiddenFieldCount"]) ||
    proof.privacy.publicSafe !== true ||
    proof.privacy.forbiddenFieldCount !== 0
  )
    errors.push("privacy")
  if (
    !Array.isArray(proof.gates) ||
    proof.gates.length !==
      V1_37_OBSERVATION_V1_19_POSTACTIVATION_GATES.length ||
    proof.gates.some((gate, index) => {
      if (
        !exactKeys(gate, [
          "id",
          "status",
          "exitCode",
          "command",
          "stdoutSha256",
          "stderrSha256",
          "headSha",
          "dirtyWorktreeSha256",
          "transactionToken",
          "completedAt",
          "validUntil",
          "fresh",
          "synthetic",
        ])
      )
        return true
      return (
        gate.id !== V1_37_OBSERVATION_V1_19_POSTACTIVATION_GATES[index] ||
        gate.status !== "passed" ||
        gate.exitCode !== 0 ||
        typeof gate.command !== "string" ||
        gate.command.length === 0 ||
        gate.command.includes(
          "evaluate-v1-37-observation-v1-19-postactivation",
        ) ||
        /(?:^|\s)--write(?:\s|$)/u.test(gate.command) ||
        !SHA256.test(gate.stdoutSha256) ||
        !SHA256.test(gate.stderrSha256) ||
        gate.headSha !== proof.binding.headSha ||
        gate.dirtyWorktreeSha256 !== proof.binding.dirtyWorktreeSha256 ||
        gate.transactionToken !== proof.binding.transactionToken ||
        !Number.isFinite(Date.parse(gate.completedAt)) ||
        !Number.isFinite(Date.parse(gate.validUntil)) ||
        Date.parse(gate.completedAt) > Date.parse(now) ||
        Date.parse(gate.validUntil) < Date.parse(now) ||
        gate.fresh !== true ||
        gate.synthetic !== false
      )
    })
  )
    errors.push("gates")
  return errors
}

export interface V137ObservationV119RollbackInput {
  transactionToken: string
  filePreimage: V137ObservationV119SnapshotMember[]
  fileActivated: V137ObservationV119SnapshotMember[]
  databasePreimage: V137ObservationV119SnapshotMember[]
  databaseActivated: V137ObservationV119SnapshotMember[]
}

export interface V137ObservationV119RollbackAdapter {
  restoreFiles(
    snapshot: readonly V137ObservationV119SnapshotMember[],
  ): Promise<unknown>
  restoreDatabase(
    snapshot: readonly V137ObservationV119SnapshotMember[],
    transactionToken: string,
  ): Promise<unknown>
  captureFiles(): Promise<V137ObservationV119SnapshotMember[]>
  captureDatabase(
    transactionToken: string,
  ): Promise<V137ObservationV119SnapshotMember[]>
  reinstallFiles(
    snapshot: readonly V137ObservationV119SnapshotMember[],
  ): Promise<unknown>
  reinstallDatabase(
    snapshot: readonly V137ObservationV119SnapshotMember[],
    transactionToken: string,
  ): Promise<unknown>
}

export interface V137ObservationV119RollbackReceipt {
  transactionToken: string
  restoredFiles: V137ObservationV119SnapshotMember[]
  restoredDatabase: V137ObservationV119SnapshotMember[]
  reinstalledFiles: V137ObservationV119SnapshotMember[]
  reinstalledDatabase: V137ObservationV119SnapshotMember[]
}

/**
 * Executes the only allowed rollback order. Exact old equality is proved
 * before any successor reinstall begins, then the complete successor is
 * captured again. Callers provide transaction/file adapters so unit tests can
 * prove orchestration without changing current authority in Plan 22.
 */
export const orchestrateV137ObservationV119Rollback = async (
  input: V137ObservationV119RollbackInput,
  adapter: V137ObservationV119RollbackAdapter,
): Promise<V137ObservationV119RollbackReceipt> => {
  if (!TRANSACTION_TOKEN.test(input.transactionToken))
    throw new Error("invalid activation transaction token")
  if (
    snapshotErrors(
      input.filePreimage,
      V1_37_OBSERVATION_V1_19_ACTIVATION_FILES,
      false,
    ) ||
    snapshotErrors(
      input.fileActivated,
      V1_37_OBSERVATION_V1_19_ACTIVATION_FILES,
      true,
    ) ||
    snapshotErrors(
      input.databasePreimage,
      V1_37_OBSERVATION_V1_19_DATABASE_SELECTORS,
      true,
    ) ||
    snapshotErrors(
      input.databaseActivated,
      V1_37_OBSERVATION_V1_19_DATABASE_SELECTORS,
      true,
    )
  )
    throw new Error("invalid rollback inventory")

  await adapter.restoreFiles(input.filePreimage)
  await adapter.restoreDatabase(input.databasePreimage, input.transactionToken)
  const restoredFiles = await adapter.captureFiles()
  const restoredDatabase = await adapter.captureDatabase(input.transactionToken)
  if (!equal(restoredFiles, input.filePreimage))
    throw new Error("file rollback equality failed")
  if (!equal(restoredDatabase, input.databasePreimage))
    throw new Error("database rollback equality failed")

  await adapter.reinstallFiles(input.fileActivated)
  await adapter.reinstallDatabase(
    input.databaseActivated,
    input.transactionToken,
  )
  const reinstalledFiles = await adapter.captureFiles()
  const reinstalledDatabase = await adapter.captureDatabase(
    input.transactionToken,
  )
  if (!equal(reinstalledFiles, input.fileActivated))
    throw new Error("file reinstall equality failed")
  if (!equal(reinstalledDatabase, input.databaseActivated))
    throw new Error("database reinstall equality failed")
  return {
    transactionToken: input.transactionToken,
    restoredFiles,
    restoredDatabase,
    reinstalledFiles,
    reinstalledDatabase,
  }
}

export interface V137ObservationV119PostactivationArgs {
  mode: "write" | "check"
  activationTransaction: boolean
}

export const parseV137ObservationV119PostactivationArgs = (
  args: readonly string[],
): V137ObservationV119PostactivationArgs => {
  const known = new Set(["--write", "--check", "--activation-transaction"])
  if (args.some((argument) => !known.has(argument)))
    throw new Error("unknown postactivation evaluator argument")
  const write = args.includes("--write")
  const check = args.includes("--check")
  const activationTransaction = args.includes("--activation-transaction")
  if (write === check) throw new Error("select exactly one write or check mode")
  if (write && !activationTransaction)
    throw new Error("write mode requires the activation transaction")
  if (check && activationTransaction) throw new Error("check mode is read-only")
  return { mode: write ? "write" : "check", activationTransaction }
}

const ARTIFACT_PATH =
  ".planning/artifacts/v1.37-observation-v1.19-activation-transaction-proof.json"

const readProof = (): V137ObservationV119PostactivationProof =>
  JSON.parse(
    readFileSync(path.join(root, ARTIFACT_PATH), "utf8"),
  ) as V137ObservationV119PostactivationProof

const writeAtomic = (proof: V137ObservationV119PostactivationProof): void => {
  const target = path.join(root, ARTIFACT_PATH)
  const temporary = `${target}.tmp-${process.pid}`
  writeFileSync(temporary, `${JSON.stringify(proof)}\n`, {
    flag: "wx",
    mode: 0o644,
  })
  renameSync(temporary, target)
}

const main = (): void => {
  try {
    const options = parseV137ObservationV119PostactivationArgs(
      process.argv.slice(2),
    )
    // Plan 14 constructs the draft through the exported fixed builder after
    // its rollback drill. Write mode canonicalizes that already-complete draft;
    // it never changes a selector or database row itself.
    const proof = readProof()
    const errors = validateV137ObservationV119PostactivationProof(proof)
    if (errors.length > 0) throw new Error(errors.join(","))
    if (options.mode === "write") writeAtomic(proof)
    const canonical = `${JSON.stringify(proof)}\n`
    if (readFileSync(path.join(root, ARTIFACT_PATH), "utf8") !== canonical)
      throw new Error("non-canonical postactivation proof")
    process.stdout.write(
      `${JSON.stringify({ status: "passed", code: "OBSERVATION_V1_19_POSTACTIVATION_PROVED", lifecycle: "postactivation-precommit" })}\n`,
    )
  } catch {
    process.stderr.write(
      `${JSON.stringify({ status: "failed", code: "POSTACTIVATION_PROOF_INVALID" })}\n`,
    )
    process.exitCode = 1
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
