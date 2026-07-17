#!/usr/bin/env -S pnpm exec tsx
import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { execFile as execFileCallback } from "node:child_process"
import { createRequire } from "node:module"
import {
  mkdir,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises"
import path from "node:path"
import { promisify } from "node:util"
import { fileURLToPath } from "node:url"
/* eslint-disable-next-line no-restricted-imports -- The activation coordinator owns the exact persisted semantic head transition API. */
import {
  ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION,
  ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT,
  REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION,
  REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT,
  abortSemanticAuthoritySelectionTransition,
  finalizeSemanticAuthoritySelectionTransition,
  hashSemanticAuthoritySelectorManifest,
  prepareSemanticAuthoritySelectionTransition,
  readSemanticAuthoritySelectionHead,
  SEMANTIC_AUTHORITY_SELECTOR_PATHS,
  type SemanticAuthoritySelectorManifestEntry,
} from "../packages/persistence/src/semantic-authority-selection-head.js"

const execFile = promisify(execFileCallback)
type PersistencePool = Parameters<typeof readSemanticAuthoritySelectionHead>[0]

export const ACTIVATION_SELECTOR_PATHS = Object.freeze([
  ...SEMANTIC_AUTHORITY_SELECTOR_PATHS,
])
export const ACTIVATION_PROOF_PATH =
  ".planning/artifacts/v1.37-observation-v1.19-activation-transaction-proof.json"
export const ACTIVATION_COMMIT_MESSAGE =
  "activate(v1.37): promote observation runtime v1.19"
export const COMPENSATION_COMMIT_MESSAGE =
  "compensate(v1.37): restore semantic authority v1.17"

export type Sha256 = `sha256:${string}`
export type FileBytes =
  | Readonly<{ state: "present"; bytes: Uint8Array }>
  | Readonly<{ state: "absent" }>

export interface GateReceipt {
  readonly id: string
  readonly command: string
  readonly exitCode: 0
  readonly stdoutSha256: Sha256
  readonly stderrSha256: Sha256
  readonly completedAt: string
}

export interface ActivationHead {
  readonly state:
    | "active-v1.17-bootstrap"
    | "pending-precommit"
    | "active-v1.19-finalized"
    | "pending-compensation"
    | "active-v1.17-compensated"
  readonly revision: number
  readonly activeSelection?: unknown
  readonly activeSelectionRoot: string
  readonly pendingIntent: null | Readonly<{
    direction: "forward" | "reverse"
    activationId: string
    sourceActivationId?: string
    parentHead: string
    targetRoot: string
    selectorManifest: readonly SemanticAuthoritySelectorManifestEntry[]
    selectorManifestRoot: Sha256
    proofPreimageRoot: Sha256
  }>
  readonly finalization: null | Readonly<{
    activationId: string
    proofDigest: Sha256
    commitSha: string
    treeSha: string
    selectorManifestRoot: Sha256
  }>
  readonly compensation: null | Readonly<{
    activationId: string
    sourceActivationId: string
    recoveryReceiptDigest: Sha256
    commitSha: string
    treeSha: string
    selectorManifestRoot: Sha256
  }>
}

interface PrepareInput {
  readonly direction: "forward" | "reverse"
  readonly activationId: string
  readonly sourceActivationId?: string
  readonly expectedRevision: number
  readonly expectedActiveRoot: string
  readonly targetSelection: unknown
  readonly targetRoot: string
  readonly parentHead: string
  readonly selectorManifest: readonly SemanticAuthoritySelectorManifestEntry[]
  readonly selectorManifestRoot: Sha256
  readonly proofPreimageRoot: Sha256
}

interface FinalizeInput {
  readonly direction: "forward" | "reverse"
  readonly activationId: string
  readonly sourceActivationId?: string
  readonly expectedRevision: number
  readonly expectedParentHead: string
  readonly expectedTargetRoot: string
  readonly expectedSelectorManifestRoot: Sha256
  readonly proofDigest?: Sha256
  readonly recoveryReceiptDigest?: Sha256
  readonly commitSha: string
  readonly treeSha: string
}

interface AbortInput {
  readonly direction: "forward" | "reverse"
  readonly activationId: string
  readonly sourceActivationId?: string
  readonly expectedRevision: number
  readonly expectedParentHead: string
  readonly expectedTargetRoot: string
  readonly expectedSelectorManifestRoot: Sha256
}

export interface ActivationCoordinatorAdapter {
  withLock<T>(operation: () => Promise<T>): Promise<T>
  withCandidateWorkspace<T>(
    activationId: string,
    parentHead: string,
    operation: (candidate: ActivationCoordinatorAdapter) => Promise<T>,
  ): Promise<T>
  cleanupCandidateWorkspace(activationId: string): Promise<void>
  readHead(): Promise<ActivationHead>
  readPreparedProofCommitment(activationId: string): Promise<Sha256>
  prepare(input: PrepareInput): Promise<ActivationHead>
  finalize(input: FinalizeInput): Promise<ActivationHead>
  abort(input: AbortInput): Promise<ActivationHead>
  gitHead(): Promise<string>
  gitParent(commit: string): Promise<string>
  gitTree(commit: string): Promise<string>
  changedPaths(commit: string): Promise<string[]>
  readFile(path: string): Promise<FileBytes>
  readCommitFile(commit: string, path: string): Promise<FileBytes>
  writeFile(path: string, value: FileBytes): Promise<void>
  stagedPaths(): Promise<string[]>
  stage(paths: readonly string[]): Promise<void>
  unstage(paths: readonly string[]): Promise<void>
  commit(message: string, paths: readonly string[]): Promise<string>
  runGate(id: string): Promise<GateReceipt>
}

export type ActivationMode =
  | "prepare"
  | "validate"
  | "rollback-drill"
  | "stage"
  | "commit"
  | "finalize"
  | "smoke"
  | "recover"
  | "abort"
  | "compensate"

export const PLAN14_ACTIVATION_ID = "activation:phase260:plan14:production"

export const activationCandidateWorkspaceKey = (activationId: string): string =>
  createHash("sha256").update(activationId).digest("hex")

export interface RunActivationInput {
  readonly mode: ActivationMode
  readonly activationId: string
  readonly adapter: ActivationCoordinatorAdapter
}

const ALL_PATHS = Object.freeze(
  [...ACTIVATION_SELECTOR_PATHS, ACTIVATION_PROOF_PATH].sort(),
)

export const ACTIVATION_VALIDATION_GATE_IDS = Object.freeze([
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
])

const sha256 = (value: string | Uint8Array): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${stable(
            (value as Record<string, unknown>)[key],
          )}`,
      )
      .join(",")}}`
  }
  return JSON.stringify(value)
}

const equalBytes = (left: Uint8Array, right: Uint8Array): boolean =>
  Buffer.compare(Buffer.from(left), Buffer.from(right)) === 0

const equalFile = (left: FileBytes, right: FileBytes): boolean =>
  left.state === right.state &&
  (left.state === "absent" ||
    (right.state === "present" && equalBytes(left.bytes, right.bytes)))

const jsonBytes = (value: unknown): Uint8Array =>
  Buffer.from(`${JSON.stringify(value, null, 2)}\n`)

const corpusRegistry = {
  schemaVersion: "v1.37-executable-conformance-registry-v1",
  activeVersion: "v3",
  corpusRootSha256:
    "sha256:06d0717a16047cace0364c94a15353e2d53b53da5e8bebef6912f9f30f3d681d",
  corpusFileSha256:
    "sha256:ec92ba7506907e65a032083a2c68005022c7ad8d8873a9ddbc59338db2d8d5d0",
  path: "packages/golden/src/fixtures/v1-37-conformance-corpus/v3/corpus.json",
} as const

const traceRegistry = {
  schemaVersion: "v1.37-conformance-trace-registry-v1",
  activeVersion: "v1.37-observation-trace-v4",
  activePath:
    "packages/golden/src/fixtures/v1-37-conformance-traces/v1.37-observation-trace-v4",
  candidateRootSha256:
    "sha256:f9821fd2b3a5a3cb17a01b4a8050ea70c2274df04601f314a25adac6da4f428a",
  manifestSha256:
    "sha256:70c2cde3a61a24f8a8c379ed4554195497bc4a0248d278c292240cca36d63de1",
  semanticDiffSha256:
    "sha256:df4252c270abd5a8d763953384dd70f93278cd8bfb0076be85cfb3a5af0dde07",
  independentReviewSha256:
    "sha256:3f97d1bfb0bfcad6b9cd4fcb4451c09e205c2ab826fb9d5f537da1dd9ba5dab5",
  compatibilityDispositionSha256:
    "sha256:a05ea22797ce68b124e6926b4ce1a74b55437d13df2e3e8b4c7a6ccb896b864e",
  caseCount: 30,
} as const

const renderCorpusPin = (
  registryFileSha256: Sha256,
): string => `export const V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN = Object.freeze({
  schemaVersion: "v1.37-executable-conformance-reviewed-pin-v1",
  reviewedUnder: "phase-260-plan-11-independent-observation-review",
  activeVersion: "v3",
  corpusRootSha256:
    "sha256:06d0717a16047cace0364c94a15353e2d53b53da5e8bebef6912f9f30f3d681d",
  corpusFileSha256:
    "sha256:ec92ba7506907e65a032083a2c68005022c7ad8d8873a9ddbc59338db2d8d5d0",
  registryFileSha256:
    "${registryFileSha256}",
  independentReviewFileSha256:
    "sha256:f24961c3191c73f8dc689a4445c8a354d5e2a9baa4a480c2f559406af6c60c4c",
  path: "packages/golden/src/fixtures/v1-37-conformance-corpus/v3/corpus.json",
  independentReviewPath:
    "packages/golden/src/fixtures/v1-37-conformance-corpus/v3/independent-review.json",
  updatePolicy: "explicit-new-version-and-reviewed-pin-change",
} as const)
`

const currentSource = `/**
 * Sole compact TypeScript activation source for the semantic authority.
 *
 * This one-key record deliberately cannot select tuple members independently.
 * Phase 260 Plan 14 is the sole owner allowed to change the key and regenerate
 * every current projection after the complete successor proof passes.
 */
export const CURRENT_SEMANTIC_AUTHORITY_SOURCE = Object.freeze({
  semanticAuthorityKey: "runtime-v1.19",
} as const)

export type CurrentSemanticAuthoritySource = Readonly<{
  semanticAuthorityKey: (typeof CURRENT_SEMANTIC_AUTHORITY_SOURCE)["semanticAuthorityKey"]
}>
`

const currentGo = `// Code generated by scripts/generate-v1-37-arena-set-authority.ts; DO NOT EDIT.
package main

type currentSemanticAuthorityGeneratedSelection struct {
\tSemanticAuthorityKey string
\tTupleID string
\tRules string
\tEngine string
\tRuntimeABI string
\tChronicle string
\tArenaCatalog string
\tSetPolicy string
\tConformanceCertificateVersion string
\tSourceSHA256 string
\tOutputSHA256 string
}

func currentSemanticAuthorityGenerated() currentSemanticAuthorityGeneratedSelection {
\treturn currentSemanticAuthorityGeneratedSelection{
\t\tSemanticAuthorityKey: "runtime-v1.19",
\t\tTupleID: "sha256:37c9a07425d454c74859112debcc3ef362d43e80d5767560d9bde28a3c8d5e73",
\t\tRules: "cowards-rules-v1.4",
\t\tEngine: "engine-kernel-v1.37-candidate-1",
\t\tRuntimeABI: "strategy-runtime-abi-v1.19",
\t\tChronicle: "chronicle-recorder-current-events-v1.37-candidate-1",
\t\tArenaCatalog: "canonical-arena-catalog-v1.37",
\t\tSetPolicy: "canonical-set-policy-v1.37-four-condition-v1",
\t\tConformanceCertificateVersion: "runtime-conformance-certificate-v1.19",
\t\tSourceSHA256: "sha256:110d30db98623cb90f07b473045cf04aca3433fb823964163191a0a8cba64b61",
\t\tOutputSHA256: "sha256:15030ee59b81a2bf04667e045344de36d1b11b9834e64f71be05ccf7b73d80d5",
\t}
}
`

export const buildV119SelectorBytes = (): Map<string, Uint8Array> => {
  const corpusBytes = jsonBytes(corpusRegistry)
  return new Map([
    [ACTIVATION_SELECTOR_PATHS[0], Buffer.from(currentGo)],
    [ACTIVATION_SELECTOR_PATHS[1], corpusBytes],
    [ACTIVATION_SELECTOR_PATHS[2], jsonBytes(traceRegistry)],
    [
      ACTIVATION_SELECTOR_PATHS[3],
      Buffer.from(renderCorpusPin(sha256(corpusBytes))),
    ],
    [ACTIVATION_SELECTOR_PATHS[4], Buffer.from(currentSource)],
  ])
}

const manifestFor = (
  files: ReadonlyMap<string, Uint8Array>,
): readonly SemanticAuthoritySelectorManifestEntry[] =>
  Object.freeze(
    ACTIVATION_SELECTOR_PATHS.map((selectorPath) => {
      const bytes = files.get(selectorPath)
      if (bytes === undefined)
        throw new Error(`Missing selector ${selectorPath}`)
      return Object.freeze({ path: selectorPath, sha256: sha256(bytes) })
    }).sort((left, right) => left.path.localeCompare(right.path)),
  )

export interface ActivationPathDigest {
  readonly path: string
  readonly state: "present" | "absent"
  readonly sha256?: Sha256
}

const snapshotEntries = (
  snapshot: ReadonlyMap<string, FileBytes>,
): readonly ActivationPathDigest[] =>
  ALL_PATHS.map((filePath) => {
    const file = snapshot.get(filePath)
    if (file === undefined)
      throw new Error(`Missing snapshot member ${filePath}`)
    return file.state === "present"
      ? { path: filePath, state: "present", sha256: sha256(file.bytes) }
      : { path: filePath, state: "absent" }
  })

export const hashActivationPathDigests = (
  entries: readonly ActivationPathDigest[],
): Sha256 =>
  sha256(`cowards-game:activation-six-path-preimage:v1\0${stable(entries)}`)

export const hashActivationProofCommitment = (
  rawPreimageRoot: Sha256,
  proofDigest: Sha256,
): Sha256 =>
  sha256(
    `cowards-game:activation-proof-commitment:v1\0${rawPreimageRoot}\0${proofDigest}`,
  )

const snapshotRoot = (snapshot: ReadonlyMap<string, FileBytes>): Sha256 =>
  hashActivationPathDigests(snapshotEntries(snapshot))

const captureCommitSnapshot = async (
  adapter: ActivationCoordinatorAdapter,
  commit: string,
): Promise<Map<string, FileBytes>> =>
  new Map(
    await Promise.all(
      ALL_PATHS.map(
        async (filePath) =>
          [filePath, await adapter.readCommitFile(commit, filePath)] as const,
      ),
    ),
  )

const restoreSnapshot = async (
  adapter: ActivationCoordinatorAdapter,
  snapshot: ReadonlyMap<string, FileBytes>,
): Promise<void> => {
  for (const filePath of ALL_PATHS) {
    const file = snapshot.get(filePath)
    if (file === undefined)
      throw new Error(`Missing restore member ${filePath}`)
    await adapter.writeFile(filePath, file)
  }
}

const assertWorktreeSnapshot = async (
  adapter: ActivationCoordinatorAdapter,
  snapshot: ReadonlyMap<string, FileBytes>,
  label: string,
): Promise<void> => {
  for (const filePath of ALL_PATHS) {
    const expected = snapshot.get(filePath)
    if (
      expected === undefined ||
      !equalFile(await adapter.readFile(filePath), expected)
    ) {
      throw new Error(`${label} mismatch at ${filePath}`)
    }
  }
}

const assertCommitSnapshot = async (
  adapter: ActivationCoordinatorAdapter,
  commitSha: string,
  snapshot: ReadonlyMap<string, FileBytes>,
  label: string,
): Promise<void> => {
  for (const filePath of ALL_PATHS) {
    const expected = snapshot.get(filePath)
    if (
      expected === undefined ||
      !equalFile(await adapter.readCommitFile(commitSha, filePath), expected)
    ) {
      throw new Error(`${label} commit mismatch at ${filePath}`)
    }
  }
}

interface ActivationProof {
  readonly schemaVersion: "v1.37-observation-v1.19-activation-proof-v1"
  readonly lifecycle: "pending-precommit"
  readonly activationId: string
  readonly parentHead: string
  readonly pendingSelectionRoot: string
  readonly selectorManifest: readonly SemanticAuthoritySelectorManifestEntry[]
  readonly selectorManifestRoot: Sha256
  readonly preimage: readonly ActivationPathDigest[]
  readonly proofPreimageRoot: Sha256
  readonly validationReceipts: readonly GateReceipt[]
  readonly rollbackReceipt: GateReceipt | null
}

const parseProofBytes = (bytes: Uint8Array): ActivationProof => {
  let value: unknown
  try {
    value = JSON.parse(Buffer.from(bytes).toString("utf8"))
  } catch {
    throw new Error("Activation proof is invalid JSON")
  }
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    (value as Record<string, unknown>).schemaVersion !==
      "v1.37-observation-v1.19-activation-proof-v1"
  ) {
    throw new Error("Activation proof has an invalid schema")
  }
  return value as ActivationProof
}

const readProof = async (
  adapter: ActivationCoordinatorAdapter,
): Promise<{ proof: ActivationProof; bytes: Uint8Array }> => {
  const file = await adapter.readFile(ACTIVATION_PROOF_PATH)
  if (file.state === "absent") throw new Error("Activation proof is absent")
  return { proof: parseProofBytes(file.bytes), bytes: file.bytes }
}

const pendingForward = (head: ActivationHead, activationId: string) => {
  if (
    head.state !== "pending-precommit" ||
    head.pendingIntent?.direction !== "forward" ||
    head.pendingIntent.activationId !== activationId
  ) {
    throw new Error("Exact forward pending intent is required")
  }
  return head.pendingIntent
}

const isExactGateReceipt = (
  value: unknown,
  expectedId: string,
): value is GateReceipt => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false
  }
  const receipt = value as Record<string, unknown>
  return (
    Object.keys(receipt).sort().join("\0") ===
      [
        "command",
        "completedAt",
        "exitCode",
        "id",
        "stderrSha256",
        "stdoutSha256",
      ]
        .sort()
        .join("\0") &&
    receipt.id === expectedId &&
    receipt.command === ACTIVATION_GATE_COMMANDS[expectedId] &&
    receipt.exitCode === 0 &&
    typeof receipt.stdoutSha256 === "string" &&
    /^sha256:[0-9a-f]{64}$/u.test(receipt.stdoutSha256) &&
    typeof receipt.stderrSha256 === "string" &&
    /^sha256:[0-9a-f]{64}$/u.test(receipt.stderrSha256) &&
    typeof receipt.completedAt === "string" &&
    !Number.isNaN(Date.parse(receipt.completedAt))
  )
}

const assertProofMatchesIntent = (
  proof: ActivationProof,
  proofBytes: Uint8Array,
  intent: ReturnType<typeof pendingForward>,
  activationId: string,
): void => {
  const targetManifest = manifestFor(buildV119SelectorBytes())
  const receiptsAreExact = proof.validationReceipts.every((receipt, index) =>
    isExactGateReceipt(receipt, ACTIVATION_VALIDATION_GATE_IDS[index]),
  )
  if (
    proof.activationId !== activationId ||
    proof.parentHead !== intent.parentHead ||
    proof.pendingSelectionRoot !== intent.targetRoot ||
    proof.selectorManifestRoot !== intent.selectorManifestRoot ||
    hashActivationPathDigests(proof.preimage) !== proof.proofPreimageRoot ||
    hashActivationProofCommitment(
      proof.proofPreimageRoot,
      sha256(proofBytes),
    ) !== intent.proofPreimageRoot ||
    stable(proof.selectorManifest) !== stable(targetManifest) ||
    stable(proof.selectorManifest) !== stable(intent.selectorManifest) ||
    stable(proof.validationReceipts.map(({ id }) => id)) !==
      stable(ACTIVATION_VALIDATION_GATE_IDS) ||
    !receiptsAreExact ||
    !isExactGateReceipt(proof.rollbackReceipt, "rollback")
  ) {
    throw new Error("Activation proof does not match the durable intent")
  }
}

const assertCurrentSelectors = async (
  adapter: ActivationCoordinatorAdapter,
): Promise<void> => {
  for (const [filePath, bytes] of buildV119SelectorBytes()) {
    const current = await adapter.readFile(filePath)
    if (current.state !== "present" || !equalBytes(current.bytes, bytes)) {
      throw new Error(`Mixed or stale selector at ${filePath}`)
    }
  }
}

const exactPaths = (actual: readonly string[]): boolean =>
  stable([...actual].sort()) === stable(ALL_PATHS)

const exactActivationChild = async (
  adapter: ActivationCoordinatorAdapter,
  commit: string,
  parent: string,
): Promise<boolean> =>
  (await adapter.gitParent(commit)) === parent &&
  exactPaths(await adapter.changedPaths(commit))

const assertCommittedActivation = async (
  adapter: ActivationCoordinatorAdapter,
  commitSha: string,
  intent: ReturnType<typeof pendingForward>,
  activationId: string,
): Promise<{ proofBytes: Uint8Array; treeSha: string }> => {
  if (!(await exactActivationChild(adapter, commitSha, intent.parentHead))) {
    throw new Error("Activation commit is unrelated or mismatched")
  }
  for (const entry of intent.selectorManifest) {
    const file = await adapter.readCommitFile(commitSha, entry.path)
    if (file.state !== "present" || sha256(file.bytes) !== entry.sha256) {
      throw new Error(`Committed selector mismatch at ${entry.path}`)
    }
  }
  const proofFile = await adapter.readCommitFile(
    commitSha,
    ACTIVATION_PROOF_PATH,
  )
  if (proofFile.state === "absent") throw new Error("Committed proof is absent")
  const proof = parseProofBytes(proofFile.bytes)
  assertProofMatchesIntent(proof, proofFile.bytes, intent, activationId)
  if (proof.rollbackReceipt?.id !== "rollback") {
    throw new Error("Committed proof lacks rollback evidence")
  }
  return {
    proofBytes: proofFile.bytes,
    treeSha: await adapter.gitTree(commitSha),
  }
}

const assertFinalizedActivation = async (
  adapter: ActivationCoordinatorAdapter,
  head: ActivationHead,
  activationId: string,
  requireCurrentHead = true,
): Promise<void> => {
  const finalization = head.finalization
  if (
    finalization === null ||
    finalization.activationId !== activationId ||
    (requireCurrentHead &&
      (await adapter.gitHead()) !== finalization.commitSha) ||
    (await adapter.gitTree(finalization.commitSha)) !== finalization.treeSha ||
    !exactPaths(await adapter.changedPaths(finalization.commitSha))
  ) {
    throw new Error("Finalized activation Git binding mismatch")
  }
  const proofFile = await adapter.readCommitFile(
    finalization.commitSha,
    ACTIVATION_PROOF_PATH,
  )
  if (
    proofFile.state === "absent" ||
    sha256(proofFile.bytes) !== finalization.proofDigest
  ) {
    throw new Error("Finalized activation proof binding mismatch")
  }
  const proof = parseProofBytes(proofFile.bytes)
  const preparedProofCommitment =
    await adapter.readPreparedProofCommitment(activationId)
  if (
    proof.activationId !== activationId ||
    proof.parentHead !== (await adapter.gitParent(finalization.commitSha)) ||
    proof.selectorManifestRoot !== finalization.selectorManifestRoot ||
    hashActivationProofCommitment(
      proof.proofPreimageRoot,
      finalization.proofDigest,
    ) !== preparedProofCommitment
  ) {
    throw new Error("Finalized activation receipt mismatch")
  }
  for (const entry of proof.selectorManifest) {
    const file = await adapter.readCommitFile(
      finalization.commitSha,
      entry.path,
    )
    if (file.state !== "present" || sha256(file.bytes) !== entry.sha256) {
      throw new Error(`Finalized selector mismatch at ${entry.path}`)
    }
  }
}

const prepare = async (
  adapter: ActivationCoordinatorAdapter,
  activationId: string,
): Promise<ActivationHead> => {
  const head = await adapter.readHead()
  if (head.state === "pending-precommit") {
    const intent = pendingForward(head, activationId)
    const { proof, bytes } = await readProof(adapter)
    assertProofMatchesIntent(proof, bytes, intent, activationId)
    await assertCurrentSelectors(adapter)
    return head
  }
  if (head.state !== "active-v1.17-bootstrap") {
    throw new Error("Forward activation is unavailable from the current state")
  }
  const staged = await adapter.stagedPaths()
  if (staged.length > 0)
    throw new Error("Prepare requires an empty staged index")
  const parentHead = await adapter.gitHead()
  const preimage = await captureCommitSnapshot(adapter, parentHead)
  await assertWorktreeSnapshot(adapter, preimage, "worktree preimage")
  const rawPreimageRoot = snapshotRoot(preimage)
  const target = buildV119SelectorBytes()
  const manifest = manifestFor(target)
  const candidateEvidence = await adapter.withCandidateWorkspace(
    activationId,
    parentHead,
    async (candidate) => {
      if ((await candidate.gitHead()) !== parentHead) {
        throw new Error("Candidate workspace parent mismatch")
      }
      const candidatePreimage = await captureCommitSnapshot(
        candidate,
        parentHead,
      )
      await assertWorktreeSnapshot(
        candidate,
        candidatePreimage,
        "candidate preimage",
      )
      if (snapshotRoot(candidatePreimage) !== rawPreimageRoot) {
        throw new Error("Candidate workspace preimage mismatch")
      }
      for (const [filePath, bytes] of target) {
        await candidate.writeFile(filePath, { state: "present", bytes })
      }
      const validationReceipts: GateReceipt[] = []
      for (const id of ACTIVATION_VALIDATION_GATE_IDS) {
        validationReceipts.push(await candidate.runGate(id))
      }
      await restoreSnapshot(candidate, candidatePreimage)
      await candidate.unstage(ALL_PATHS)
      await assertWorktreeSnapshot(
        candidate,
        candidatePreimage,
        "candidate rollback",
      )
      return {
        validationReceipts,
        rollbackReceipt: await candidate.runGate("rollback"),
      }
    },
  )
  await assertWorktreeSnapshot(
    adapter,
    preimage,
    "post-candidate live preimage",
  )
  if ((await adapter.stagedPaths()).length > 0) {
    throw new Error("Candidate validation changed the live staged index")
  }
  const proof: ActivationProof = {
    schemaVersion: "v1.37-observation-v1.19-activation-proof-v1",
    lifecycle: "pending-precommit",
    activationId,
    parentHead,
    pendingSelectionRoot: REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT,
    selectorManifest: manifest,
    selectorManifestRoot: hashSemanticAuthoritySelectorManifest(manifest),
    preimage: snapshotEntries(preimage),
    proofPreimageRoot: rawPreimageRoot,
    validationReceipts: candidateEvidence.validationReceipts,
    rollbackReceipt: candidateEvidence.rollbackReceipt,
  }
  const proofBytes = jsonBytes(proof)
  const prepared = await adapter.prepare({
    direction: "forward",
    activationId,
    expectedRevision: head.revision,
    expectedActiveRoot: head.activeSelectionRoot,
    targetSelection: REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION,
    targetRoot: REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT,
    parentHead,
    selectorManifest: manifest,
    selectorManifestRoot: hashSemanticAuthoritySelectorManifest(manifest),
    proofPreimageRoot: hashActivationProofCommitment(
      rawPreimageRoot,
      sha256(proofBytes),
    ),
  })
  for (const [filePath, bytes] of target) {
    await adapter.writeFile(filePath, { state: "present", bytes })
  }
  await adapter.writeFile(ACTIVATION_PROOF_PATH, {
    state: "present",
    bytes: proofBytes,
  })
  return prepared
}

const validate = async (
  adapter: ActivationCoordinatorAdapter,
  activationId: string,
): Promise<ActivationProof> => {
  const intent = pendingForward(await adapter.readHead(), activationId)
  if ((await adapter.gitHead()) !== intent.parentHead) {
    throw new Error("Activation parent HEAD changed before validation")
  }
  const { proof, bytes } = await readProof(adapter)
  assertProofMatchesIntent(proof, bytes, intent, activationId)
  await assertCurrentSelectors(adapter)
  return proof
}

const rollbackDrill = async (
  adapter: ActivationCoordinatorAdapter,
  activationId: string,
): Promise<ActivationProof> => {
  const intent = pendingForward(await adapter.readHead(), activationId)
  if ((await adapter.gitHead()) !== intent.parentHead) {
    throw new Error("Activation parent HEAD changed before rollback drill")
  }
  const { proof, bytes } = await readProof(adapter)
  assertProofMatchesIntent(proof, bytes, intent, activationId)
  await assertCurrentSelectors(adapter)
  return proof
}

const stage = async (
  adapter: ActivationCoordinatorAdapter,
  activationId: string,
): Promise<void> => {
  const intent = pendingForward(await adapter.readHead(), activationId)
  const { proof, bytes } = await readProof(adapter)
  assertProofMatchesIntent(proof, bytes, intent, activationId)
  if (proof.rollbackReceipt?.id !== "rollback") {
    throw new Error("Successful rollback drill is required before staging")
  }
  if (proof.selectorManifestRoot !== intent.selectorManifestRoot) {
    throw new Error("Proof selector manifest mismatch")
  }
  await assertCurrentSelectors(adapter)
  const existing = await adapter.stagedPaths()
  if (existing.length > 0 && !exactPaths(existing)) {
    throw new Error("Existing staged allowlist contains an unrelated path")
  }
  await adapter.stage(ALL_PATHS)
  if (!exactPaths(await adapter.stagedPaths())) {
    throw new Error("Exact six-path staged allowlist was not established")
  }
}

const commit = async (
  adapter: ActivationCoordinatorAdapter,
  activationId: string,
): Promise<string> => {
  const intent = pendingForward(await adapter.readHead(), activationId)
  const current = await adapter.gitHead()
  if (current !== intent.parentHead) {
    await assertCommittedActivation(adapter, current, intent, activationId)
    return current
  }
  if (!exactPaths(await adapter.stagedPaths())) {
    throw new Error("Activation commit requires the exact staged allowlist")
  }
  const created = await adapter.commit(ACTIVATION_COMMIT_MESSAGE, ALL_PATHS)
  await assertCommittedActivation(adapter, created, intent, activationId)
  return created
}

const finalize = async (
  adapter: ActivationCoordinatorAdapter,
  activationId: string,
): Promise<ActivationHead> => {
  const head = await adapter.readHead()
  if (
    head.state === "active-v1.19-finalized" &&
    head.finalization?.activationId === activationId
  ) {
    await assertFinalizedActivation(adapter, head, activationId)
    return head
  }
  const intent = pendingForward(head, activationId)
  const commitSha = await adapter.gitHead()
  const committed = await assertCommittedActivation(
    adapter,
    commitSha,
    intent,
    activationId,
  )
  return adapter.finalize({
    direction: "forward",
    activationId,
    expectedRevision: head.revision,
    expectedParentHead: intent.parentHead,
    expectedTargetRoot: intent.targetRoot,
    expectedSelectorManifestRoot: intent.selectorManifestRoot,
    proofDigest: sha256(committed.proofBytes),
    commitSha,
    treeSha: committed.treeSha,
  })
}

const smoke = async (
  adapter: ActivationCoordinatorAdapter,
  activationId: string,
): Promise<GateReceipt> => {
  const head = await adapter.readHead()
  if (head.pendingIntent !== null) {
    throw new Error("Smoke requires the exact finalized activation")
  }
  await assertFinalizedActivation(adapter, head, activationId)
  return adapter.runGate("smoke")
}

const abortForward = async (
  adapter: ActivationCoordinatorAdapter,
  activationId: string,
): Promise<ActivationHead> => {
  const head = await adapter.readHead()
  const intent = pendingForward(head, activationId)
  if ((await adapter.gitHead()) !== intent.parentHead) {
    throw new Error("Abort refuses an unrelated or mismatched commit")
  }
  const snapshot = await captureCommitSnapshot(adapter, intent.parentHead)
  await restoreSnapshot(adapter, snapshot)
  await adapter.unstage(ALL_PATHS)
  await assertWorktreeSnapshot(adapter, snapshot, "abort restore")
  if (
    (await adapter.stagedPaths()).some((filePath) =>
      ALL_PATHS.includes(filePath),
    )
  ) {
    throw new Error("Abort restore left activation paths staged")
  }
  return adapter.abort({
    direction: "forward",
    activationId,
    expectedRevision: head.revision,
    expectedParentHead: intent.parentHead,
    expectedTargetRoot: intent.targetRoot,
    expectedSelectorManifestRoot: intent.selectorManifestRoot,
  })
}

export const buildCompensationActivationId = (
  sourceActivationId: string,
): string =>
  `compensation:${createHash("sha256").update(sourceActivationId).digest("hex")}`

export const hashCompensationRecoveryReceipt = (
  restoredEntries: readonly ActivationPathDigest[],
): Sha256 =>
  sha256(
    `cowards-game:activation-compensation-restore:v1\0${hashActivationPathDigests(
      restoredEntries,
    )}`,
  )

const recoveryReceiptDigest = (
  restoredSnapshot: ReadonlyMap<string, FileBytes>,
): Sha256 => hashCompensationRecoveryReceipt(snapshotEntries(restoredSnapshot))

const assertCompensatedActivation = async (
  adapter: ActivationCoordinatorAdapter,
  head: ActivationHead,
  sourceActivationId: string,
): Promise<void> => {
  const compensation = head.compensation
  const finalization = head.finalization
  if (
    head.state !== "active-v1.17-compensated" ||
    head.pendingIntent !== null ||
    compensation === null ||
    finalization === null ||
    compensation.activationId !==
      buildCompensationActivationId(sourceActivationId) ||
    compensation.sourceActivationId !== sourceActivationId ||
    finalization.activationId !== sourceActivationId ||
    (await adapter.gitHead()) !== compensation.commitSha ||
    (await adapter.gitTree(compensation.commitSha)) !== compensation.treeSha ||
    (await adapter.gitParent(compensation.commitSha)) !==
      finalization.commitSha ||
    !exactPaths(await adapter.changedPaths(compensation.commitSha))
  ) {
    throw new Error("Compensated activation binding mismatch")
  }
  await assertFinalizedActivation(adapter, head, sourceActivationId, false)
  const activationParent = await adapter.gitParent(finalization.commitSha)
  const restoredSnapshot = await captureCommitSnapshot(
    adapter,
    activationParent,
  )
  await assertCommitSnapshot(
    adapter,
    compensation.commitSha,
    restoredSnapshot,
    "compensated activation",
  )
  const restoredSelectors = new Map<string, Uint8Array>()
  for (const selectorPath of ACTIVATION_SELECTOR_PATHS) {
    const file = restoredSnapshot.get(selectorPath)
    if (file?.state !== "present") {
      throw new Error(`Compensated selector is absent: ${selectorPath}`)
    }
    restoredSelectors.set(selectorPath, file.bytes)
  }
  const restoredManifest = manifestFor(restoredSelectors)
  if (
    hashSemanticAuthoritySelectorManifest(restoredManifest) !==
      compensation.selectorManifestRoot ||
    recoveryReceiptDigest(restoredSnapshot) !==
      compensation.recoveryReceiptDigest
  ) {
    throw new Error("Compensated activation receipt mismatch")
  }
}

const compensate = async (
  adapter: ActivationCoordinatorAdapter,
  sourceActivationId: string,
): Promise<ActivationHead> => {
  let head = await adapter.readHead()
  if (head.state === "active-v1.17-compensated") {
    await assertCompensatedActivation(adapter, head, sourceActivationId)
    return head
  }
  if (head.state === "pending-compensation") {
    return recoverReverse(adapter, head, sourceActivationId)
  }
  if (
    head.state !== "active-v1.19-finalized" ||
    head.finalization?.activationId !== sourceActivationId ||
    (await adapter.gitHead()) !== head.finalization.commitSha
  ) {
    throw new Error("Compensation requires the exact finalized activation")
  }
  await assertFinalizedActivation(adapter, head, sourceActivationId)
  const activationCommit = head.finalization.commitSha
  const activationParent = await adapter.gitParent(activationCommit)
  const currentSnapshot = await captureCommitSnapshot(adapter, activationCommit)
  const parentSnapshot = await captureCommitSnapshot(adapter, activationParent)
  const restoredSelectors = new Map<string, Uint8Array>()
  for (const selectorPath of ACTIVATION_SELECTOR_PATHS) {
    const file = parentSnapshot.get(selectorPath)
    if (file?.state !== "present") {
      throw new Error(`Compensation parent selector absent: ${selectorPath}`)
    }
    restoredSelectors.set(selectorPath, file.bytes)
  }
  const manifest = manifestFor(restoredSelectors)
  const reverseActivationId = buildCompensationActivationId(sourceActivationId)
  head = await adapter.prepare({
    direction: "reverse",
    activationId: reverseActivationId,
    sourceActivationId,
    expectedRevision: head.revision,
    expectedActiveRoot: head.activeSelectionRoot,
    targetSelection: ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION,
    targetRoot: ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT,
    parentHead: activationCommit,
    selectorManifest: manifest,
    selectorManifestRoot: hashSemanticAuthoritySelectorManifest(manifest),
    proofPreimageRoot: snapshotRoot(currentSnapshot),
  })
  await restoreSnapshot(adapter, parentSnapshot)
  await assertWorktreeSnapshot(adapter, parentSnapshot, "compensation restore")
  await adapter.stage(ALL_PATHS)
  if (!exactPaths(await adapter.stagedPaths())) {
    throw new Error("Compensation staged allowlist mismatch")
  }
  const reverseCommit = await adapter.commit(
    COMPENSATION_COMMIT_MESSAGE,
    ALL_PATHS,
  )
  if (!(await exactActivationChild(adapter, reverseCommit, activationCommit))) {
    throw new Error("Compensation commit mismatch")
  }
  await assertCommitSnapshot(
    adapter,
    reverseCommit,
    parentSnapshot,
    "compensation restore",
  )
  return adapter.finalize({
    direction: "reverse",
    activationId: reverseActivationId,
    sourceActivationId,
    expectedRevision: head.revision,
    expectedParentHead: activationCommit,
    expectedTargetRoot: ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT,
    expectedSelectorManifestRoot: head.pendingIntent!.selectorManifestRoot,
    recoveryReceiptDigest: recoveryReceiptDigest(parentSnapshot),
    commitSha: reverseCommit,
    treeSha: await adapter.gitTree(reverseCommit),
  })
}

const recoverReverse = async (
  adapter: ActivationCoordinatorAdapter,
  head: ActivationHead,
  sourceActivationId: string,
): Promise<ActivationHead> => {
  const intent = head.pendingIntent
  if (
    head.state !== "pending-compensation" ||
    intent?.direction !== "reverse"
  ) {
    throw new Error("Exact reverse pending intent is required")
  }
  if (intent.sourceActivationId !== sourceActivationId) {
    throw new Error("Reverse pending source activation token mismatch")
  }
  if (
    intent.activationId !== buildCompensationActivationId(sourceActivationId) ||
    head.finalization?.activationId !== sourceActivationId ||
    head.finalization.commitSha !== intent.parentHead
  ) {
    throw new Error("Reverse pending activation binding mismatch")
  }
  await assertFinalizedActivation(adapter, head, sourceActivationId, false)
  const activationSnapshot = await captureCommitSnapshot(
    adapter,
    intent.parentHead,
  )
  if (snapshotRoot(activationSnapshot) !== intent.proofPreimageRoot) {
    throw new Error("Reverse pending activation preimage mismatch")
  }
  const activationParent = await adapter.gitParent(intent.parentHead)
  const restoredSnapshot = await captureCommitSnapshot(
    adapter,
    activationParent,
  )
  const restoredSelectors = new Map<string, Uint8Array>()
  for (const selectorPath of ACTIVATION_SELECTOR_PATHS) {
    const file = restoredSnapshot.get(selectorPath)
    if (file?.state !== "present") {
      throw new Error(
        `Reverse pending restored selector absent: ${selectorPath}`,
      )
    }
    restoredSelectors.set(selectorPath, file.bytes)
  }
  const restoredManifest = manifestFor(restoredSelectors)
  if (
    stable(restoredManifest) !== stable(intent.selectorManifest) ||
    hashSemanticAuthoritySelectorManifest(restoredManifest) !==
      intent.selectorManifestRoot
  ) {
    throw new Error("Reverse pending selector manifest mismatch")
  }
  const current = await adapter.gitHead()
  if (current === intent.parentHead) {
    await restoreSnapshot(adapter, activationSnapshot)
    await adapter.unstage(ALL_PATHS)
    await assertWorktreeSnapshot(
      adapter,
      activationSnapshot,
      "compensation abort restore",
    )
    return adapter.abort({
      direction: "reverse",
      activationId: intent.activationId,
      sourceActivationId: intent.sourceActivationId,
      expectedRevision: head.revision,
      expectedParentHead: intent.parentHead,
      expectedTargetRoot: intent.targetRoot,
      expectedSelectorManifestRoot: intent.selectorManifestRoot,
    })
  }
  if (!(await exactActivationChild(adapter, current, intent.parentHead))) {
    throw new Error(
      "Unrelated or mismatched compensation commit remains pending",
    )
  }
  await assertCommitSnapshot(
    adapter,
    current,
    restoredSnapshot,
    "compensation recovery",
  )
  return adapter.finalize({
    direction: "reverse",
    activationId: intent.activationId,
    sourceActivationId: intent.sourceActivationId,
    expectedRevision: head.revision,
    expectedParentHead: intent.parentHead,
    expectedTargetRoot: intent.targetRoot,
    expectedSelectorManifestRoot: intent.selectorManifestRoot,
    recoveryReceiptDigest: recoveryReceiptDigest(restoredSnapshot),
    commitSha: current,
    treeSha: await adapter.gitTree(current),
  })
}

const recover = async (
  adapter: ActivationCoordinatorAdapter,
  activationId: string,
): Promise<ActivationHead> => {
  const head = await adapter.readHead()
  if (head.state === "active-v1.19-finalized") {
    if (head.finalization?.activationId !== activationId) {
      throw new Error("Finalized activation token mismatch")
    }
    await assertFinalizedActivation(adapter, head, activationId)
    return head
  }
  if (head.state === "active-v1.17-compensated") {
    await assertCompensatedActivation(adapter, head, activationId)
    return head
  }
  if (head.state === "active-v1.17-bootstrap") {
    const currentHead = await adapter.gitHead()
    const snapshot = await captureCommitSnapshot(adapter, currentHead)
    await assertWorktreeSnapshot(adapter, snapshot, "bootstrap recovery")
    if ((await adapter.stagedPaths()).length > 0) {
      throw new Error("Bootstrap recovery requires an empty staged index")
    }
    return head
  }
  if (head.state === "pending-compensation")
    return recoverReverse(adapter, head, activationId)
  const intent = pendingForward(head, activationId)
  const current = await adapter.gitHead()
  if (current === intent.parentHead) return abortForward(adapter, activationId)
  if (!(await exactActivationChild(adapter, current, intent.parentHead))) {
    throw new Error("Unrelated or mismatched commit remains pending")
  }
  return finalize(adapter, activationId)
}

export const runV137ObservationV119Activation = async (
  input: RunActivationInput,
): Promise<unknown> =>
  input.adapter.withLock(async () => {
    await input.adapter.cleanupCandidateWorkspace(input.activationId)
    switch (input.mode) {
      case "prepare":
        return prepare(input.adapter, input.activationId)
      case "validate":
        return validate(input.adapter, input.activationId)
      case "rollback-drill":
        return rollbackDrill(input.adapter, input.activationId)
      case "stage":
        return stage(input.adapter, input.activationId)
      case "commit":
        return commit(input.adapter, input.activationId)
      case "finalize":
        return finalize(input.adapter, input.activationId)
      case "smoke":
        return smoke(input.adapter, input.activationId)
      case "recover":
        return recover(input.adapter, input.activationId)
      case "abort":
        return abortForward(input.adapter, input.activationId)
      case "compensate":
        return compensate(input.adapter, input.activationId)
    }
  })

export const ACTIVATION_GATE_ARGV: Readonly<Record<string, readonly string[]>> =
  Object.freeze({
    spec: ["pnpm", "--filter", "@cowards/spec", "test"],
    engine: ["pnpm", "--filter", "@cowards/engine", "test"],
    generator: ["pnpm", "v1.37:integrity-authority:check"],
    persistence: ["pnpm", "--filter", "@cowards/persistence", "test"],
    postgresql: [
      "pnpm",
      "exec",
      "vitest",
      "run",
      "packages/persistence/src/semantic-authority-selection-head.test.ts",
      "--maxWorkers=1",
    ],
    go: ["pnpm", "go:parity"],
    "runtime-service": [
      "pnpm",
      "exec",
      "vitest",
      "run",
      "apps/runtime-service/src",
      "--maxWorkers=1",
    ],
    replay: ["pnpm", "exec", "vitest", "run", "packages/replay/src"],
    "public-contract": ["pnpm", "contract:check"],
    web: ["pnpm", "--filter", "@cowards/web", "test"],
    privacy: ["pnpm", "v1.37:integrity-boundaries:check"],
    boundary: ["pnpm", "boundary:imports"],
    history: ["pnpm", "v1.36:historical-proof:check"],
    certification: ["pnpm", "v1.37:executable-conformance:check"],
    "d04-admission": [
      "pnpm",
      "exec",
      "vitest",
      "run",
      "packages/persistence/src/repositories.test.ts",
    ],
    corpus: [
      "pnpm",
      "exec",
      "vitest",
      "run",
      "scripts/generate-v1-37-conformance-corpus.test.ts",
    ],
    trace: [
      "pnpm",
      "exec",
      "vitest",
      "run",
      "scripts/generate-v1-37-conformance-traces.test.ts",
    ],
    workshop: [
      "pnpm",
      "exec",
      "vitest",
      "run",
      "packages/persistence/src/workshop.test.ts",
    ],
    typecheck: ["pnpm", "typecheck"],
    lint: ["pnpm", "lint"],
    build: ["pnpm", "build"],
    "protected-baseline": [
      "pnpm",
      "exec",
      "tsx",
      "scripts/capture-v1-37-protected-baseline.ts",
      "--check",
    ],
    rollback: [
      "git",
      "diff",
      "--exit-code",
      "--",
      ...ACTIVATION_SELECTOR_PATHS,
    ],
    smoke: [
      "pnpm",
      "exec",
      "vitest",
      "run",
      "packages/persistence/src/match-service.test.ts",
      "packages/persistence/src/matchset-service.test.ts",
      "--maxWorkers=1",
    ],
  })

export const ACTIVATION_GATE_COMMANDS: Readonly<Record<string, string>> =
  Object.freeze(
    Object.fromEntries(
      Object.entries(ACTIVATION_GATE_ARGV).map(([id, argv]) => [
        id,
        argv.join(" "),
      ]),
    ),
  )

const runProcess = async (
  command: string,
  args: readonly string[],
  cwd: string,
): Promise<{ stdout: string; stderr: string }> => {
  const childEnvironment = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith("VITEST")),
  )
  const result = await execFile(command, [...args], {
    cwd,
    env: childEnvironment,
    maxBuffer: 64 * 1024 * 1024,
    encoding: "utf8",
  })
  return { stdout: result.stdout, stderr: result.stderr }
}

export interface ProductionActivationAdapterOptions {
  readonly processRunner?: typeof runProcess
  readonly gateProcessRunner?: typeof runProcess
  readonly now?: () => Date
  readonly protectedBaselineRoot?: string
  readonly candidateWorkspaceEnabled?: boolean
}

const discoverNodeModulePaths = async (
  root: string,
  current = root,
): Promise<string[]> => {
  const paths: string[] = []
  for (const entry of await readdir(current, { withFileTypes: true })) {
    if (entry.name === ".git") continue
    const absolute = path.join(current, entry.name)
    if (entry.name === "node_modules") {
      paths.push(absolute)
      continue
    }
    if (
      entry.isDirectory() &&
      ![".next", ".turbo", "coverage", "dist", "target"].includes(entry.name)
    ) {
      paths.push(...(await discoverNodeModulePaths(root, absolute)))
    }
  }
  return paths
}

const linkWorkspaceNodeModules = async (
  sourceRoot: string,
  candidateRoot: string,
): Promise<void> => {
  for (const source of await discoverNodeModulePaths(sourceRoot)) {
    const target = path.join(candidateRoot, path.relative(sourceRoot, source))
    await mkdir(path.dirname(target), { recursive: true })
    await symlink(source, target, "junction")
  }
}

export const createProductionActivationAdapter = (
  repoRoot: string,
  pool: PersistencePool,
  options: ProductionActivationAdapterOptions = {},
): ActivationCoordinatorAdapter => {
  const execute = options.processRunner ?? runProcess
  const executeGate = options.gateProcessRunner ?? execute
  const now = options.now ?? (() => new Date())
  const protectedBaselineRoot = options.protectedBaselineRoot ?? repoRoot
  const candidateWorkspaceEnabled = options.candidateWorkspaceEnabled ?? true
  const candidateWorkspacePaths = async (
    activationId: string,
  ): Promise<{ base: string; root: string }> => {
    const commonDir = (
      await execute("git", ["rev-parse", "--git-common-dir"], repoRoot)
    ).stdout.trim()
    const gitCommonDir = path.resolve(repoRoot, commonDir)
    const base = path.join(gitCommonDir, "cowards-activation-candidates")
    return {
      base,
      root: path.join(base, activationCandidateWorkspaceKey(activationId)),
    }
  }
  const cleanupCandidate = async (activationId: string): Promise<void> => {
    const candidate = await candidateWorkspacePaths(activationId)
    await rm(candidate.base, { recursive: true, force: true })
  }
  const readLocalFile = async (filePath: string): Promise<FileBytes> => {
    try {
      return {
        state: "present",
        bytes: await readFile(path.join(repoRoot, filePath)),
      }
    } catch (error) {
      if ((error as { code?: string }).code === "ENOENT") {
        return { state: "absent" }
      }
      throw error
    }
  }
  const writeLocalFile = async (
    filePath: string,
    value: FileBytes,
  ): Promise<void> => {
    const absolute = path.join(repoRoot, filePath)
    if (value.state === "absent") {
      await rm(absolute, { force: true })
      return
    }
    await mkdir(path.dirname(absolute), { recursive: true })
    await writeFile(absolute, value.bytes)
  }
  return {
    async withCandidateWorkspace<T>(
      activationId: string,
      parentHead: string,
      operation: (candidate: ActivationCoordinatorAdapter) => Promise<T>,
    ): Promise<T> {
      if (!candidateWorkspaceEnabled) {
        throw new Error("Nested activation candidate workspace is forbidden")
      }
      const candidate = await candidateWorkspacePaths(activationId)
      await cleanupCandidate(activationId)
      await mkdir(candidate.base, { recursive: true })
      try {
        await execute(
          "git",
          [
            "clone",
            "--quiet",
            "--shared",
            "--no-checkout",
            repoRoot,
            candidate.root,
          ],
          repoRoot,
        )
        await execute(
          "git",
          ["checkout", "--quiet", "--detach", parentHead],
          candidate.root,
        )
        await linkWorkspaceNodeModules(repoRoot, candidate.root)
        return await operation(
          createProductionActivationAdapter(candidate.root, pool, {
            ...options,
            protectedBaselineRoot,
            candidateWorkspaceEnabled: false,
          }),
        )
      } finally {
        await cleanupCandidate(activationId)
      }
    },
    cleanupCandidateWorkspace: cleanupCandidate,
    async withLock<T>(operation: () => Promise<T>): Promise<T> {
      const client = await pool.connect()
      try {
        await client.query(
          "select pg_advisory_lock(hashtext('semantic-authority-activation-coordinator-v1'))",
        )
        return await operation()
      } finally {
        await client.query(
          "select pg_advisory_unlock(hashtext('semantic-authority-activation-coordinator-v1'))",
        )
        client.release()
      }
    },
    readHead: () => readSemanticAuthoritySelectionHead(pool),
    async readPreparedProofCommitment(activationId) {
      const result = (await pool.query(
        `select pending_intent->>'proofPreimageRoot' as proof_preimage_root
           from semantic_authority_selection_history
          where transition_kind = 'prepared' and activation_id = $1
          order by sequence desc
          limit 1`,
        [activationId],
      )) as { rows: Array<{ proof_preimage_root: unknown }> }
      const value = result.rows[0]?.proof_preimage_root
      if (
        result.rows.length !== 1 ||
        typeof value !== "string" ||
        !/^sha256:[0-9a-f]{64}$/u.test(value)
      ) {
        throw new Error("Exact prepared proof commitment is unavailable")
      }
      return value as Sha256
    },
    prepare: (input) =>
      prepareSemanticAuthoritySelectionTransition(
        pool,
        input as Parameters<
          typeof prepareSemanticAuthoritySelectionTransition
        >[1],
      ),
    finalize: (input) =>
      finalizeSemanticAuthoritySelectionTransition(
        pool,
        input as Parameters<
          typeof finalizeSemanticAuthoritySelectionTransition
        >[1],
      ),
    abort: (input) =>
      abortSemanticAuthoritySelectionTransition(
        pool,
        input as Parameters<
          typeof abortSemanticAuthoritySelectionTransition
        >[1],
      ),
    async gitHead() {
      return (
        await execute("git", ["rev-parse", "HEAD"], repoRoot)
      ).stdout.trim()
    },
    async gitParent(commitSha) {
      return (
        await execute("git", ["rev-parse", `${commitSha}^`], repoRoot)
      ).stdout.trim()
    },
    async gitTree(commitSha) {
      return (
        await execute("git", ["rev-parse", `${commitSha}^{tree}`], repoRoot)
      ).stdout.trim()
    },
    async changedPaths(commitSha) {
      const output = (
        await execute(
          "git",
          ["diff-tree", "--no-commit-id", "--name-only", "-r", "-z", commitSha],
          repoRoot,
        )
      ).stdout
      return output.split("\0").filter(Boolean).sort()
    },
    async readFile(filePath) {
      return readLocalFile(filePath)
    },
    async readCommitFile(commitSha, filePath) {
      try {
        const result = await execFile(
          "git",
          ["show", `${commitSha}:${filePath}`],
          {
            cwd: repoRoot,
            encoding: "buffer",
            maxBuffer: 64 * 1024 * 1024,
          },
        )
        return { state: "present", bytes: result.stdout }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (
          /does not exist|exists on disk, but not in|path .* not in/iu.test(
            message,
          )
        ) {
          return { state: "absent" }
        }
        throw error
      }
    },
    async writeFile(filePath, value) {
      await writeLocalFile(filePath, value)
    },
    async stagedPaths() {
      const output = (
        await execute(
          "git",
          ["diff", "--cached", "--name-only", "-z"],
          repoRoot,
        )
      ).stdout
      return output.split("\0").filter(Boolean).sort()
    },
    async stage(paths) {
      await execute("git", ["add", "-A", "--", ...paths], repoRoot)
    },
    async unstage(paths) {
      await execute("git", ["reset", "-q", "HEAD", "--", ...paths], repoRoot)
    },
    async commit(message, paths) {
      await execute(
        "git",
        ["commit", "--only", "-m", message, "--", ...paths],
        repoRoot,
      )
      return (
        await execute("git", ["rev-parse", "HEAD"], repoRoot)
      ).stdout.trim()
    },
    async runGate(id) {
      const argv = ACTIVATION_GATE_ARGV[id]
      if (argv === undefined) throw new Error(`Unknown activation gate ${id}`)
      const [command, ...args] = argv
      const startedAt = now()
      const gateRoot =
        id === "protected-baseline" ? protectedBaselineRoot : repoRoot
      const nextEnvPath = "apps/web/next-env.d.ts"
      const nextEnvPreimage =
        id === "build" ? await readLocalFile(nextEnvPath) : undefined
      let result: { stdout: string; stderr: string } | undefined
      let gateError: unknown
      try {
        result = await executeGate(command, args, gateRoot)
      } catch (error) {
        gateError = error
      }
      if (nextEnvPreimage !== undefined) {
        await writeLocalFile(nextEnvPath, nextEnvPreimage)
        if (!equalFile(await readLocalFile(nextEnvPath), nextEnvPreimage)) {
          throw new Error("Build gate failed to restore apps/web/next-env.d.ts")
        }
      }
      if (gateError !== undefined) throw gateError
      if (result === undefined) throw new Error(`Gate ${id} produced no result`)
      return {
        id,
        command: argv.join(" "),
        exitCode: 0,
        stdoutSha256: sha256(result.stdout),
        stderrSha256: sha256(result.stderr),
        completedAt: startedAt.toISOString(),
      }
    },
  }
}

const main = async (): Promise<void> => {
  const parsed = parseV137ObservationV119ActivationArgs(process.argv.slice(2))
  const { mode, activationId } = parsed
  if (process.env.DATABASE_URL === undefined) {
    throw new Error("DATABASE_URL is required")
  }
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  )
  const requireFromPersistence = createRequire(
    new URL("../packages/persistence/package.json", import.meta.url),
  )
  const { Pool } = requireFromPersistence("pg") as {
    Pool: new (config: { connectionString: string }) => PersistencePool
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const result = await runV137ObservationV119Activation({
      mode,
      activationId,
      adapter: createProductionActivationAdapter(repoRoot, pool),
    })
    process.stdout.write(`${JSON.stringify(result)}\n`)
  } finally {
    await pool.end()
  }
}

export const parseV137ObservationV119ActivationArgs = (
  args: readonly string[],
): { mode: ActivationMode; activationId: string } => {
  const modeIndex = args.indexOf("--mode")
  const activationIndex = args.indexOf("--activation-id")
  const mode = args[modeIndex + 1] as ActivationMode | undefined
  const activationId = args[activationIndex + 1]
  if (
    modeIndex < 0 ||
    activationIndex < 0 ||
    args.length !== 4 ||
    mode === undefined ||
    activationId === undefined ||
    !/^activation:[A-Za-z0-9._:-]{1,160}$/u.test(activationId) ||
    ![
      "prepare",
      "validate",
      "rollback-drill",
      "stage",
      "commit",
      "finalize",
      "smoke",
      "recover",
      "abort",
      "compensate",
    ].includes(mode)
  ) {
    throw new Error(
      "Usage: activate-v1-37-observation-v1-19.ts --mode <mode> --activation-id <id>",
    )
  }
  return { mode, activationId }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    )
    process.exitCode = 1
  })
}
