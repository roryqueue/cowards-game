import { createHash } from "node:crypto"
import { spawn, spawnSync } from "node:child_process"
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { recoverV138AdmittedObservationWithoutRoute } from "./v1-38-bounded-retry-integrity-successor-v1.js"
import { appendV138RetryV2JournalRecord, createV138InactiveRetryV2Envelope, type V138RetryV2JournalRecord } from "./v1-38-bounded-retry-envelope-v2.js"
import { deriveV138PairIntentV2, type V138DurablePairV2Input } from "./v1-38-durable-pair-successor-v2.js"
import { deriveV138LifecycleIntentV2, type V138LifecycleTransactionV2 } from "./v1-38-restartable-lifecycle-successor-v2.js"
import { completeV138EffectV2, recoverV138EffectDecisionV2, type V138EffectRecordV2 } from "./v1-38-successor-effect-state-machine-v2.js"
import { sha256V138Secure, trustedRootV138 } from "./v1-38-secure-workspace-path-v2.js"

const fail = (code: string): never => { throw new TypeError(code) }
const SHA_A = `sha256:${"a".repeat(64)}` as const
const SHA_B = `sha256:${"b".repeat(64)}` as const
const sourceDirectory = path.dirname(fileURLToPath(import.meta.url))
const nativeSource = path.resolve(sourceDirectory, "../native/v1-38-successor-transaction-helper-v2.c")

export const V138_SUCCESSOR_CONTROLLER_V2_CLI = fileURLToPath(import.meta.url)
export const V138_SUCCESSOR_CONTROLLER_V2_OPERATIONS = Object.freeze([
  "recover_admitted_observation",
  "complete_semantic_effect",
  "recover_semantic_decision",
  "publish_canonical_pair",
  "apply_lifecycle_transaction",
] as const)

type NativeResult = Readonly<{ code: number | null; stderr: string }>
const nativeExecutable = (): string => {
  const sourceBytes = readFileSync(nativeSource)
  const identity = createHash("sha256").update(sourceBytes).digest("hex")
  const executable = path.join(tmpdir(), `cowards-v138-successor-native-${identity}`)
  if (!existsSync(executable)) {
    const output = `${executable}.${process.pid}.tmp`
    const compilation = spawnSync("/usr/bin/clang", ["-std=c11", "-Wall", "-Wextra", "-Werror", nativeSource, "-o", output], { encoding: "utf8" })
    if (compilation.status !== 0) fail(`V138_SUCCESSOR_NATIVE_COMPILE_FAILED:${compilation.stderr}`)
    spawnSync("/bin/chmod", ["0700", output])
    const install = spawnSync("/bin/mv", ["-n", output, executable], { encoding: "utf8" })
    if (install.status !== 0 && !existsSync(executable)) fail("V138_SUCCESSOR_NATIVE_INSTALL_FAILED")
    if (existsSync(output)) rmSync(output, { force: true })
  }
  return executable
}

const hex = (value: string): string => Buffer.from(value).toString("hex")
const trustedIdentity = (rootInput: string) => {
  const root = trustedRootV138(rootInput)
  const status = lstatSync(root)
  return Object.freeze({ path: root, device: String(status.dev), inode: String(status.ino) })
}

/**
 * The only production filesystem-mutation call site. It is deliberately
 * private to this module and receives roots created by the controller itself.
 * `/usr/bin/lockf` owns one global advisory lock from native precheck through
 * native postconditions; the kernel releases it on every process exit.
 */
const invokeNative = (rootInput: string, input: string, targetLocks: readonly string[]): Promise<NativeResult> => {
  const identity = trustedIdentity(rootInput)
  const normalizedLocks = [...new Set(targetLocks)].sort()
  if (normalizedLocks.length === 0) fail("V138_SUCCESSOR_LOCK_SET_EMPTY")
  const lockPaths = normalizedLocks.map((target) => path.join(identity.path, `.v138-successor-${sha256V138Secure(target).slice(7)}.lock`))
  const command: string[] = []
  for (const lockPath of lockPaths) command.push("/usr/bin/lockf", "-t", "0", lockPath)
  command.push(nativeExecutable(), identity.path, identity.device, identity.inode)
  const child = spawn(
    command.shift()!, command,
    { cwd: identity.path, stdio: ["pipe", "ignore", "pipe"] },
  )
  child.stdin.end(input)
  let stderr = ""
  child.stderr.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk })
  return new Promise((resolve) => child.once("exit", (code) => resolve(Object.freeze({ code, stderr }))))
}

const pairInput = (root: string, input: V138DurablePairV2Input, crashBoundary = 0): string => {
  const identity = trustedIdentity(root)
  const derived = deriveV138PairIntentV2(identity, input)
  return [
    "PAIR", input.transactionId, input.intentPath, derived.namespace,
    derived.members[0].target, hex(derived.members[0].bytes),
    derived.members[1].target, hex(derived.members[1].bytes),
    hex(derived.intentBytes), "pair-v2", String(crashBoundary),
  ].join("\t") + "\n"
}

const lifecycleInput = (root: string, input: V138LifecycleTransactionV2, crashBoundary = 0): string => {
  const identity = trustedIdentity(root)
  const derived = deriveV138LifecycleIntentV2(identity, input)
  return [
    ["LIFE", input.transactionId, derived.intentPath, derived.namespace, derived.lifecycle.target, hex(derived.lifecycle.bytes), String(derived.steps.length), String(crashBoundary), hex(derived.intentBytes), "lifecycle-v2"].join("\t"),
    ...derived.steps.map((step) => [step.id, step.target, step.beforeSha256.slice(7), hex(step.afterBytes)].join("\t")),
  ].join("\n") + "\n"
}

const requireComplete = async (result: Promise<NativeResult>): Promise<void> => {
  const completed = await result
  if (completed.code !== 0) fail(`V138_SUCCESSOR_NATIVE_FAILED:${completed.code}:${completed.stderr.trim()}`)
}

const overlapRaceEvidence = async (root: string, iterations: number): Promise<number> => {
  for (let index = 0; index < iterations; index++) {
    const left: V138DurablePairV2Input = {
      transactionId: `overlap-left-${index}`, intentPath: `overlap-left-${index}.intent`,
      members: [{ target: `left/left-${index}.json`, bytes: `left-${index}\n` }, { target: `shared/shared-${index}.json`, bytes: `shared-left-${index}\n` }],
    }
    const right: V138DurablePairV2Input = {
      transactionId: `overlap-right-${index}`, intentPath: `overlap-right-${index}.intent`,
      members: [{ target: `shared/shared-${index}.json`, bytes: `shared-right-${index}\n` }, { target: `right/right-${index}.json`, bytes: `right-${index}\n` }],
    }
    const results = await Promise.all([
      invokeNative(root, pairInput(root, left), left.members.map(({ target }) => target)),
      invokeNative(root, pairInput(root, right), right.members.map(({ target }) => target)),
    ])
    if (results.filter(({ code }) => code === 0).length !== 1) fail("V138_SUCCESSOR_OVERLAP_RACE_RESULT_INVALID")
    const shared = readFileSync(path.join(root, `shared/shared-${index}.json`), "utf8")
    const leftExists = existsSync(path.join(root, `left/left-${index}.json`))
    const rightExists = existsSync(path.join(root, `right/right-${index}.json`))
    if (shared === `shared-left-${index}\n`) {
      if (!leftExists || rightExists) fail("V138_SUCCESSOR_OVERLAP_PARTIAL_LOSER")
    } else if (shared === `shared-right-${index}\n`) {
      if (!rightExists || leftExists) fail("V138_SUCCESSOR_OVERLAP_PARTIAL_LOSER")
    } else fail("V138_SUCCESSOR_OVERLAP_SHARED_INVALID")
  }
  return iterations
}

const disjointRaceEvidence = async (root: string, iterations: number): Promise<number> => {
  for (let index = 0; index < iterations; index++) {
    const left: V138DurablePairV2Input = {
      transactionId: "same-id", intentPath: `disjoint-left-${index}.intent`,
      members: [{ target: `left/disjoint-a-${index}.json`, bytes: "same-a\n" }, { target: `left/disjoint-b-${index}.json`, bytes: "same-b\n" }],
    }
    const right: V138DurablePairV2Input = {
      transactionId: "same-id", intentPath: `disjoint-right-${index}.intent`,
      members: [{ target: `right/disjoint-a-${index}.json`, bytes: "same-a\n" }, { target: `right/disjoint-b-${index}.json`, bytes: "same-b\n" }],
    }
    const results = await Promise.all([
      invokeNative(root, pairInput(root, left), left.members.map(({ target }) => target)),
      invokeNative(root, pairInput(root, right), right.members.map(({ target }) => target)),
    ])
    if (results.some(({ code }) => code !== 0)) fail("V138_SUCCESSOR_DISJOINT_RACE_FAILED")
    for (const member of [...left.members, ...right.members]) if (readFileSync(path.join(root, member.target), "utf8") !== member.bytes) fail("V138_SUCCESSOR_DISJOINT_POSTCONDITION_FAILED")
  }
  return iterations
}

const runSyntheticSuccessorProtocolV2 = async (): Promise<Readonly<Record<string, unknown>>> => {
  const root = mkdtempSync(path.join(tmpdir(), "v138-successor-controller-v2-"))
  try {
    for (const relative of ["artifacts", "reviews", "planning", "left", "right", "shared"]) mkdirSync(path.join(root, relative), { mode: 0o700 })
    const envelope = createV138InactiveRetryV2Envelope({ sourceRoot: SHA_A, reviewRoot: SHA_B, sealRoot: SHA_A, protectedHistoryRoot: SHA_B, protectedHistoricalIdentities: ["retry-envelope:v1"] })
    let journal: readonly V138RetryV2JournalRecord[] = []
    journal = appendV138RetryV2JournalRecord(journal, { kind: "reserve_preflight", identity: "preflight:v2:0", owner: "synthetic-controller" }, 1, envelope.envelopeRoot)
    journal = appendV138RetryV2JournalRecord(journal, { kind: "observe_preflight", identity: "preflight:v2:0", owner: "synthetic-controller", effectiveAvailableBasisPoints: 2_500 }, 2, envelope.envelopeRoot)
    recoverV138AdmittedObservationWithoutRoute({ envelope, records: journal, owner: "synthetic-controller", nowMilliseconds: 3, appendDurableRecord: () => undefined })
    const effectRecords: V138EffectRecordV2[] = []
    let clock = 10
    const completed = await completeV138EffectV2({ effectKind: "preflight", effectIdentity: "synthetic:preflight", owner: "synthetic-controller", deadlineMilliseconds: 100, monotonicMilliseconds: () => clock++, runEffect: async () => ({ status: "observed", acceptedCells: 0, completeCleanup: true }), appendDurableRecord: (record) => effectRecords.push(record) })
    recoverV138EffectDecisionV2({ records: completed.records, deadlineMilliseconds: 100, appendDurableRecord: () => undefined })

    const pair: V138DurablePairV2Input = {
      transactionId: "synthetic-pair", intentPath: "synthetic-pair.intent",
      members: [{ target: "artifacts/synthetic-review.json", bytes: '{"authority":false}\n' }, { target: "reviews/synthetic-review.md", bytes: "# Synthetic non-authorizing review\n" }],
    }
    await requireComplete(invokeNative(root, pairInput(root, pair), pair.members.map(({ target }) => target)))
    const before = "status: before\n"
    writeFileSync(path.join(root, "planning/status.md"), before)
    const lifecycle: V138LifecycleTransactionV2 = {
      transactionId: "synthetic-lifecycle", intentPath: "synthetic-lifecycle.intent",
      steps: [{ id: "status", target: "planning/status.md", beforeSha256: sha256V138Secure(before), afterBytes: "status: synthetic-complete\n" }],
      lifecycle: { target: "synthetic-lifecycle.json", bytes: '{"authority":false,"status":"synthetic_complete"}\n' },
    }
    await requireComplete(invokeNative(root, lifecycleInput(root, lifecycle), [...lifecycle.steps.map(({ target }) => target), lifecycle.lifecycle.target]))

    const overlapRaces = await overlapRaceEvidence(root, 50)
    const disjointRaces = await disjointRaceEvidence(root, 100)
    return Object.freeze({
      operations: V138_SUCCESSOR_CONTROLLER_V2_OPERATIONS,
      acceptedCells: 0,
      workspaceWrites: false,
      pairMembers: [readFileSync(path.join(root, "artifacts/synthetic-review.json"), "utf8"), readFileSync(path.join(root, "reviews/synthetic-review.md"), "utf8")],
      lifecycle: readFileSync(path.join(root, "planning/status.md"), "utf8"),
      overlapRaces,
      disjointRaces,
      internalDirectories: readdirSync(root).filter((entry) => entry.startsWith(".v138-")).sort(),
    })
  } finally { rmSync(root, { recursive: true, force: true }) }
}

export const checkV138SuccessorControllerV2Source = (sourcePath: string): true => {
  const source = readFileSync(sourcePath, "utf8")
  for (const required of ["/usr/bin/lockf", '"-t", "0"', "invokeNative", "openat", "fstatat", "linkat", "unlinkat"]) {
    if (!(source + readFileSync(nativeSource, "utf8")).includes(required)) fail("V138_SUCCESSOR_CONTROLLER_ROUTE_INCOMPLETE")
  }
  if (/export\s+(?:const|function)\s+(?:runV138Synthetic|invokeNative|durablyPublishV138Pair|applyV138RestartableLifecycle|withV138ExclusiveDirectoryLock)/u.test(source)) fail("V138_SUCCESSOR_CONTROLLER_MUTATION_EXPORT_FORBIDDEN")
  for (const relative of ["v1-38-durable-pair-successor-v2.ts", "v1-38-restartable-lifecycle-successor-v2.ts"]) {
    const constituent = readFileSync(path.join(path.dirname(sourcePath), relative), "utf8")
    for (const forbidden of ["node:fs", "node:child_process", "openSync", "writeFileSync", "linkSync", "unlinkSync", "export const durably", "export const apply"]) {
      if (constituent.includes(forbidden)) fail("V138_SUCCESSOR_CONSTITUENT_MUTATION_SURFACE_FORBIDDEN")
    }
  }
  return true
}

if (process.argv[1] === V138_SUCCESSOR_CONTROLLER_V2_CLI) {
  if (process.argv[2] === "--source-check") {
    checkV138SuccessorControllerV2Source(V138_SUCCESSOR_CONTROLLER_V2_CLI)
    process.stdout.write("successor_controller_source_only=true\n")
  } else if (process.argv[2] === "--synthetic-check") {
    checkV138SuccessorControllerV2Source(V138_SUCCESSOR_CONTROLLER_V2_CLI)
    const result = await runSyntheticSuccessorProtocolV2()
    process.stdout.write(`${JSON.stringify({ sourceOnly: true, liveSideEffects: false, ...result })}\n`)
  } else fail("V138_SUCCESSOR_CONTROLLER_SOURCE_ONLY")
}
