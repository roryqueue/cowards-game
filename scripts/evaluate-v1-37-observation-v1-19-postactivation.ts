#!/usr/bin/env -S pnpm exec tsx
import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { createRequire } from "node:module"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
/* eslint-disable-next-line no-restricted-imports -- The evaluator independently recomputes the persisted selector-manifest binding. */
import { hashSemanticAuthoritySelectorManifest } from "../packages/persistence/src/semantic-authority-selection-head.js"
import {
  ACTIVATION_PROOF_PATH,
  ACTIVATION_SELECTOR_PATHS,
  ACTIVATION_VALIDATION_GATE_IDS,
  buildV119SelectorBytes,
  createProductionActivationAdapter,
  type ActivationCoordinatorAdapter,
  type ActivationHead,
  type FileBytes,
  type GateReceipt,
  type Sha256,
} from "./activate-v1-37-observation-v1-19.js"

const SHA256 = /^sha256:[0-9a-f]{64}$/u
const GIT_OBJECT = /^[0-9a-f]{40,64}$/u
const ACTIVATION_ID = /^activation:[A-Za-z0-9._:-]{1,160}$/u
const TARGET_ROOT =
  "sha256:17954660f17c83e60e5d7df0b589cd89cf6b00eba4d4963e2d4bf43bc71c6ea2"
const BASELINE_ROOT =
  "sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707"
const ALL_PATHS = Object.freeze(
  [...ACTIVATION_SELECTOR_PATHS, ACTIVATION_PROOF_PATH].sort(),
)

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

const jsonBytes = (value: unknown): Uint8Array =>
  Buffer.from(`${JSON.stringify(value, null, 2)}\n`)

const exactKeys = (value: unknown, keys: readonly string[]): boolean =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  stable(Object.keys(value as Record<string, unknown>).sort()) ===
    stable([...keys].sort())

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const containsForbiddenPrivateKey = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(containsForbiddenPrivateKey)
  if (!record(value)) return false
  return Object.entries(value).some(
    ([key, child]) =>
      [
        "source",
        "artifacts",
        "memory",
        "objectives",
        "diagnostics",
        "hostData",
        "securityInternals",
        "bytesBase64",
      ].includes(key) || containsForbiddenPrivateKey(child),
  )
}

export interface SelectorManifestEntry {
  path: string
  sha256: Sha256
}

export const buildExpectedV119SelectorManifest = (): {
  entries: SelectorManifestEntry[]
  root: Sha256
} => {
  const entries = [...buildV119SelectorBytes()]
    .map(([selectorPath, bytes]) => ({
      path: selectorPath,
      sha256: sha256(bytes),
    }))
    .sort((left, right) => left.path.localeCompare(right.path))
  return {
    entries,
    root: hashSemanticAuthoritySelectorManifest(entries),
  }
}

export interface ActivationProofEvidence {
  schemaVersion: "v1.37-observation-v1.19-activation-proof-v1"
  lifecycle: "pending-precommit"
  activationId: string
  parentHead: string
  pendingSelectionRoot: string
  selectorManifest: SelectorManifestEntry[]
  selectorManifestRoot: Sha256
  preimage: Array<{
    path: string
    state: "present" | "absent"
    sha256?: Sha256
  }>
  proofPreimageRoot: Sha256
  validationReceipts: GateReceipt[]
  rollbackReceipt: GateReceipt | null
}

export interface V137ObservationV119PostactivationEvidence {
  schemaVersion: "v1.37-observation-v1.19-postactivation-evidence-v2"
  activationId: string
  proof: ActivationProofEvidence
  proofDigest: Sha256
  head: ActivationHead
  git: {
    headSha: string
    parentSha: string
    treeSha: string
    changedPaths: string[]
    selectorManifest: SelectorManifestEntry[]
  }
  smokeReceipt: GateReceipt
  protectedBaseline: {
    status: "verified"
    baselineSha256: Sha256
    protectedPathCount: 2
  }
}

export interface PostactivationEvaluationAdapter {
  readHead(): Promise<ActivationHead>
  gitHead(): Promise<string>
  gitParent(commit: string): Promise<string>
  gitTree(commit: string): Promise<string>
  changedPaths(commit: string): Promise<string[]>
  readCommitFile(commit: string, path: string): Promise<FileBytes>
  runGate(id: string): Promise<GateReceipt>
}

const parseProofBytes = (bytes: Uint8Array): ActivationProofEvidence => {
  let proof: unknown
  try {
    proof = JSON.parse(Buffer.from(bytes).toString("utf8"))
  } catch {
    throw new Error("Committed activation proof is invalid JSON")
  }
  if (proof === null || typeof proof !== "object" || Array.isArray(proof)) {
    throw new Error("Committed activation proof has an invalid shape")
  }
  return proof as ActivationProofEvidence
}

export const collectV137ObservationV119PostactivationEvidence = async (
  adapter: PostactivationEvaluationAdapter,
  activationId: string,
  protectedBaseline: V137ObservationV119PostactivationEvidence["protectedBaseline"] = {
    status: "verified",
    baselineSha256: BASELINE_ROOT,
    protectedPathCount: 2,
  },
): Promise<V137ObservationV119PostactivationEvidence> => {
  const head = await adapter.readHead()
  const activationCommit = head.finalization?.commitSha
  if (activationCommit === undefined) {
    throw new Error("Semantic head has no finalized activation commit")
  }
  const proofFile = await adapter.readCommitFile(
    activationCommit,
    ACTIVATION_PROOF_PATH,
  )
  if (proofFile.state === "absent") throw new Error("Committed proof is absent")
  const selectorManifest: SelectorManifestEntry[] = []
  for (const selectorPath of ACTIVATION_SELECTOR_PATHS) {
    const file = await adapter.readCommitFile(activationCommit, selectorPath)
    if (file.state === "absent") {
      throw new Error(`Committed selector is absent: ${selectorPath}`)
    }
    selectorManifest.push({ path: selectorPath, sha256: sha256(file.bytes) })
  }
  selectorManifest.sort((left, right) => left.path.localeCompare(right.path))
  return {
    schemaVersion: "v1.37-observation-v1.19-postactivation-evidence-v2",
    activationId,
    proof: parseProofBytes(proofFile.bytes),
    proofDigest: sha256(proofFile.bytes),
    head,
    git: {
      headSha: await adapter.gitHead(),
      parentSha: await adapter.gitParent(activationCommit),
      treeSha: await adapter.gitTree(activationCommit),
      changedPaths: (await adapter.changedPaths(activationCommit)).sort(),
      selectorManifest,
    },
    smokeReceipt: await adapter.runGate("smoke"),
    protectedBaseline,
  }
}

const validReceipt = (receipt: unknown, expectedId: string): boolean =>
  exactKeys(receipt, [
    "id",
    "command",
    "exitCode",
    "stdoutSha256",
    "stderrSha256",
    "completedAt",
  ]) &&
  (receipt as GateReceipt).id === expectedId &&
  (receipt as GateReceipt).exitCode === 0 &&
  typeof (receipt as GateReceipt).command === "string" &&
  !(receipt as GateReceipt).command.includes(
    "evaluate-v1-37-observation-v1-19-postactivation",
  ) &&
  SHA256.test((receipt as GateReceipt).stdoutSha256) &&
  SHA256.test((receipt as GateReceipt).stderrSha256) &&
  !Number.isNaN(Date.parse((receipt as GateReceipt).completedAt))

const validManifest = (
  value: unknown,
  expected: readonly SelectorManifestEntry[],
): boolean =>
  Array.isArray(value) &&
  value.length === 5 &&
  value.every(
    (entry) =>
      exactKeys(entry, ["path", "sha256"]) &&
      typeof entry.path === "string" &&
      typeof entry.sha256 === "string" &&
      SHA256.test(entry.sha256),
  ) &&
  stable(value) === stable(expected) &&
  !(value as SelectorManifestEntry[]).some(
    ({ path: selectorPath }) => selectorPath === ACTIVATION_PROOF_PATH,
  )

export type PostactivationValidation = Readonly<{
  status: "passed" | "failed" | "blocked"
  errors: string[]
}>

export const validateV137ObservationV119PostactivationEvidence = (
  evidence: unknown,
): PostactivationValidation => {
  if (
    !exactKeys(evidence, [
      "schemaVersion",
      "activationId",
      "proof",
      "proofDigest",
      "head",
      "git",
      "smokeReceipt",
      "protectedBaseline",
    ])
  ) {
    return { status: "failed", errors: ["evidence shape"] }
  }
  const exactEvidence = evidence as V137ObservationV119PostactivationEvidence
  if (
    containsForbiddenPrivateKey(exactEvidence) ||
    !record(exactEvidence.proof) ||
    !record(exactEvidence.head) ||
    !record(exactEvidence.git) ||
    !record(exactEvidence.protectedBaseline)
  ) {
    return { status: "failed", errors: ["evidence shape"] }
  }
  if (exactEvidence.head.state === "active-v1.17-compensated") {
    return { status: "blocked", errors: ["compensated v1.17 safe blocker"] }
  }
  const errors: string[] = []
  const expected = buildExpectedV119SelectorManifest()
  const proof = exactEvidence.proof
  if (
    !exactKeys(proof, [
      "schemaVersion",
      "lifecycle",
      "activationId",
      "parentHead",
      "pendingSelectionRoot",
      "selectorManifest",
      "selectorManifestRoot",
      "preimage",
      "proofPreimageRoot",
      "validationReceipts",
      "rollbackReceipt",
    ])
  ) {
    return { status: "failed", errors: ["activation proof"] }
  }
  if (
    exactEvidence.schemaVersion !==
      "v1.37-observation-v1.19-postactivation-evidence-v2" ||
    !ACTIVATION_ID.test(exactEvidence.activationId) ||
    proof.schemaVersion !== "v1.37-observation-v1.19-activation-proof-v1" ||
    proof.lifecycle !== "pending-precommit" ||
    proof.activationId !== exactEvidence.activationId ||
    !GIT_OBJECT.test(proof.parentHead) ||
    proof.pendingSelectionRoot !== TARGET_ROOT ||
    !SHA256.test(proof.proofPreimageRoot)
  ) {
    errors.push("activation proof")
  }
  if (
    !validManifest(proof.selectorManifest, expected.entries) ||
    proof.selectorManifestRoot !== expected.root
  ) {
    errors.push("selector manifest")
  }
  if (
    !Array.isArray(proof.preimage) ||
    proof.preimage.length !== 6 ||
    proof.preimage.some((member) => !record(member)) ||
    stable(proof.preimage.map(({ path: memberPath }) => memberPath).sort()) !==
      stable(ALL_PATHS) ||
    proof.preimage.some(
      (member) =>
        !exactKeys(
          member,
          member.state === "present"
            ? ["path", "state", "sha256"]
            : ["path", "state"],
        ) ||
        (member.state !== "present" && member.state !== "absent") ||
        (member.state === "present" &&
          (member.sha256 === undefined || !SHA256.test(member.sha256))),
    )
  ) {
    errors.push("six-path preimage")
  }
  if (
    !Array.isArray(proof.validationReceipts) ||
    proof.validationReceipts.some((receipt) => !record(receipt)) ||
    stable(proof.validationReceipts.map(({ id }) => id)) !==
      stable(ACTIVATION_VALIDATION_GATE_IDS) ||
    proof.validationReceipts.some(
      (receipt, index) =>
        !validReceipt(receipt, ACTIVATION_VALIDATION_GATE_IDS[index]!),
    )
  ) {
    errors.push("validation receipts")
  }
  if (!validReceipt(proof.rollbackReceipt, "rollback")) {
    errors.push("rollback receipt")
  }
  if (
    exactEvidence.head.state !== "active-v1.19-finalized" ||
    exactEvidence.head.activeSelectionRoot !== TARGET_ROOT ||
    exactEvidence.head.pendingIntent !== null ||
    exactEvidence.head.compensation !== null ||
    exactEvidence.head.finalization === null ||
    exactEvidence.head.finalization.activationId !== exactEvidence.activationId
  ) {
    errors.push("final semantic head")
  }
  const finalization = exactEvidence.head.finalization
  if (
    finalization === null ||
    finalization.commitSha !== exactEvidence.git.headSha ||
    finalization.treeSha !== exactEvidence.git.treeSha ||
    finalization.proofDigest !== exactEvidence.proofDigest ||
    finalization.selectorManifestRoot !== expected.root ||
    exactEvidence.git.parentSha !== proof.parentHead ||
    stable([...exactEvidence.git.changedPaths].sort()) !== stable(ALL_PATHS) ||
    !validManifest(exactEvidence.git.selectorManifest, expected.entries) ||
    sha256(jsonBytes(proof)) !== exactEvidence.proofDigest
  ) {
    errors.push("commit tree proof binding")
  }
  if (!validReceipt(exactEvidence.smokeReceipt, "smoke")) {
    errors.push("live smoke")
  }
  if (
    !exactKeys(exactEvidence.protectedBaseline, [
      "status",
      "baselineSha256",
      "protectedPathCount",
    ]) ||
    exactEvidence.protectedBaseline.status !== "verified" ||
    exactEvidence.protectedBaseline.baselineSha256 !== BASELINE_ROOT ||
    exactEvidence.protectedBaseline.protectedPathCount !== 2
  ) {
    errors.push("protected baseline")
  }
  return { status: errors.length === 0 ? "passed" : "failed", errors }
}

export const parseV137ObservationV119PostactivationArgs = (
  args: readonly string[],
): { activationId: string } => {
  if (args.includes("--write")) {
    throw new Error("Postactivation evaluation is read-only")
  }
  const activationIndex = args.indexOf("--activation-id")
  if (
    !args.includes("--check") ||
    activationIndex < 0 ||
    args.length !== 3 ||
    !ACTIVATION_ID.test(args[activationIndex + 1] ?? "")
  ) {
    throw new Error(
      "Usage: postactivation evaluator --check --activation-id <activation:id>",
    )
  }
  return { activationId: args[activationIndex + 1]! }
}

const readProtectedBaseline = async (
  repoRoot: string,
): Promise<V137ObservationV119PostactivationEvidence["protectedBaseline"]> => {
  const bytes = await readFile(
    path.join(
      repoRoot,
      ".planning/artifacts/v1.37-protected-working-tree-baseline.json",
    ),
  )
  const value = JSON.parse(Buffer.from(bytes).toString("utf8")) as {
    paths: unknown[]
    baselineSha256: Sha256
  }
  return {
    status: "verified",
    protectedPathCount: value.paths.length as 2,
    baselineSha256: value.baselineSha256,
  }
}

const main = async (): Promise<void> => {
  const { activationId } = parseV137ObservationV119PostactivationArgs(
    process.argv.slice(2),
  )
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
  type PoolType = Parameters<typeof createProductionActivationAdapter>[1]
  const { Pool } = requireFromPersistence("pg") as {
    Pool: new (config: { connectionString: string }) => PoolType
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const adapter: ActivationCoordinatorAdapter =
      createProductionActivationAdapter(repoRoot, pool)
    const evidence = await collectV137ObservationV119PostactivationEvidence(
      adapter,
      activationId,
      await readProtectedBaseline(repoRoot),
    )
    const result = validateV137ObservationV119PostactivationEvidence(evidence)
    process.stdout.write(`${JSON.stringify({ result, evidence })}\n`)
    if (result.status !== "passed") process.exitCode = 1
  } finally {
    await pool.end()
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    )
    process.exitCode = 1
  })
}
