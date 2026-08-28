import { createHash, randomBytes } from "node:crypto"
import { spawn, spawnSync } from "node:child_process"
import { chmodSync, closeSync, constants, existsSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, readdirSync, renameSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { recoverV138AdmittedObservationWithoutRoute } from "./v1-38-bounded-retry-integrity-successor-v1.js"
import { appendV138RetryV2JournalRecord, createV138InactiveRetryV2Envelope, type V138RetryV2JournalRecord } from "./v1-38-bounded-retry-envelope-v2.js"
import { deriveV138PairIntentV2, type V138DurablePairV2Input } from "./v1-38-durable-pair-successor-v2.js"
import { deriveV138LifecycleIntentV2, type V138LifecycleTransactionV2 } from "./v1-38-restartable-lifecycle-successor-v2.js"
import { completeV138EffectV2, recoverV138EffectDecisionV2, type V138EffectRecordV2 } from "./v1-38-successor-effect-state-machine-v2.js"
import { sha256V138Secure, trustedRootV138 } from "./v1-38-secure-workspace-path-v3.js"

const fail = (code: string): never => { throw new TypeError(code) }
const SHA_A = `sha256:${"a".repeat(64)}` as const
const SHA_B = `sha256:${"b".repeat(64)}` as const
const sourceDirectory = path.dirname(fileURLToPath(import.meta.url))
const nativeSource = path.resolve(sourceDirectory, "../native/v1-38-successor-transaction-helper-v3.c")

export const V138_SUCCESSOR_CONTROLLER_V3_CLI = fileURLToPath(import.meta.url)
export const V138_SUCCESSOR_CONTROLLER_V3_OPERATIONS = Object.freeze([
  "recover_admitted_observation",
  "complete_semantic_effect",
  "recover_semantic_decision",
  "publish_canonical_pair",
  "apply_lifecycle_transaction",
] as const)

type NativeResult = Readonly<{ code: number | null; stderr: string; privateExecutable: string }>
const sha256Hex = (bytes: string | Buffer): string => createHash("sha256").update(bytes).digest("hex")

/**
 * A helper exists only for one native child.  Its random controller token is
 * compiled into those exact bytes, while the matching capability is inherited
 * on fd 3 and the already-open trusted root on fd 4.  Nothing reusable is
 * installed in a predictable cache.
 */
const compileOneShotNative = (input: string, normalizedLocks: readonly string[], root: string) => {
  const directory = mkdtempSync(path.join(tmpdir(), "cowards-v138-successor-native-"))
  chmodSync(directory, 0o700)
  const executable = path.join(directory, "one-shot-helper")
  const capabilityPath = path.join(directory, "controller.capability")
  const token = randomBytes(32).toString("hex")
  const nonce = randomBytes(32).toString("hex")
  const sourceBefore = readFileSync(nativeSource)
  const compilerBefore = readFileSync("/usr/bin/clang")
  const compilation = spawnSync("/usr/bin/clang", [
    "-std=c11", "-Wall", "-Wextra", "-Werror",
    `-DV138_CONTROLLER_TOKEN_HEX=\"${token}\"`, nativeSource, "-o", executable,
  ], { encoding: "utf8" })
  if (compilation.status !== 0) { rmSync(directory, { recursive: true, force: true }); fail(`V138_SUCCESSOR_NATIVE_COMPILE_FAILED:${compilation.stderr}`) }
  if (sha256Hex(readFileSync(nativeSource)) !== sha256Hex(sourceBefore) || sha256Hex(readFileSync("/usr/bin/clang")) !== sha256Hex(compilerBefore)) {
    rmSync(directory, { recursive: true, force: true }); fail("V138_SUCCESSOR_NATIVE_TOOLCHAIN_CHANGED")
  }
  chmodSync(executable, 0o700)
  const executableBefore = readFileSync(executable)
  const executableStatus = statSync(executable)
  if (!executableStatus.isFile() || executableStatus.uid !== process.getuid?.() || (executableStatus.mode & 0o777) !== 0o700) {
    rmSync(directory, { recursive: true, force: true }); fail("V138_SUCCESSOR_NATIVE_OUTPUT_UNTRUSTED")
  }
  const rootStatus = lstatSync(root)
  const capability = [
    "V138CAP2", token, nonce, sha256Hex(input), sha256Hex(normalizedLocks.map((item) => `${item}\n`).join("")),
    String(rootStatus.dev), String(rootStatus.ino), sha256Hex(sourceBefore), sha256Hex(compilerBefore), sha256Hex(executableBefore),
  ].join("\t") + "\n"
  writeFileSync(capabilityPath, capability, { mode: 0o600, flag: "wx" })
  const capabilityDescriptor = openSync(capabilityPath, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
  const rootDescriptor = openSync(root, constants.O_RDONLY | (constants.O_DIRECTORY ?? 0) | (constants.O_NOFOLLOW ?? 0))
  if (sha256Hex(readFileSync(executable)) !== sha256Hex(executableBefore)) fail("V138_SUCCESSOR_NATIVE_OUTPUT_CHANGED")
  return Object.freeze({ directory, executable, capabilityDescriptor, rootDescriptor, nonce })
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
const invokeNative = (rootInput: string, input: string, targetLocks: readonly string[], barrierTag?: string): Promise<NativeResult> => {
  const identity = trustedIdentity(rootInput)
  const normalizedLocks = [...new Set(targetLocks)].sort()
  if (normalizedLocks.length === 0) fail("V138_SUCCESSOR_LOCK_SET_EMPTY")
  const lockPaths = normalizedLocks.map((target) => path.join(identity.path, `.v138-successor-${sha256V138Secure(target).slice(7)}.lock`))
  const oneShot = compileOneShotNative(input, normalizedLocks, identity.path)
  const command: string[] = []
  for (const lockPath of lockPaths) command.push("/usr/bin/lockf", "-t", "0", lockPath)
  command.push(oneShot.executable)
  const child = spawn(
    command.shift()!, command,
    { cwd: identity.path, stdio: ["pipe", "ignore", "pipe", oneShot.capabilityDescriptor, oneShot.rootDescriptor, "pipe"], env: barrierTag === undefined ? process.env : { ...process.env, V138_NATIVE_TEST_BARRIER: barrierTag } },
  )
  closeSync(oneShot.capabilityDescriptor)
  closeSync(oneShot.rootDescriptor)
  let removed = false
  const removePrivateHelper = () => {
    if (!removed) { removed = true; rmSync(oneShot.directory, { recursive: true, force: true }) }
  }
  child.stdio[5]?.once("data", removePrivateHelper)
  child.stdin.end(input)
  let stderr = ""
  child.stderr.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk })
  return new Promise((resolve) => child.once("exit", (code) => { removePrivateHelper(); resolve(Object.freeze({ code, stderr, privateExecutable: oneShot.executable })) }))
}

const waitFor = async (predicate: () => boolean): Promise<void> => {
  for (let attempt = 0; attempt < 5_000; attempt++) {
    if (predicate()) return
    await new Promise((resolve) => setTimeout(resolve, 1))
  }
  fail("V138_SUCCESSOR_TEST_BARRIER_TIMEOUT")
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

const crashRecoveryEvidence = async (root: string): Promise<number> => {
  let recovered = 0
  for (let boundary = 1; boundary <= 5; boundary++) {
    const pair: V138DurablePairV2Input = {
      transactionId: `crash-pair-${boundary}`, intentPath: `crash-pair-${boundary}.intent`,
      members: [{ target: `left/crash-pair-${boundary}.json`, bytes: `pair-left-${boundary}\n` }, { target: `right/crash-pair-${boundary}.json`, bytes: `pair-right-${boundary}\n` }],
    }
    const locks = pair.members.map(({ target }) => target)
    const interrupted = await invokeNative(root, pairInput(root, pair, boundary), locks)
    if (interrupted.code === 0) fail("V138_SUCCESSOR_PAIR_CRASH_NOT_INJECTED")
    await requireComplete(invokeNative(root, pairInput(root, pair), locks))
    for (const member of pair.members) if (readFileSync(path.join(root, member.target), "utf8") !== member.bytes) fail("V138_SUCCESSOR_PAIR_RECOVERY_FAILED")
    recovered++
  }
  for (let boundary = 1; boundary <= 5; boundary++) {
    const beforeA = `crash-a-${boundary}:before\n`, beforeB = `crash-b-${boundary}:before\n`
    writeFileSync(path.join(root, `planning/crash-a-${boundary}.md`), beforeA)
    writeFileSync(path.join(root, `planning/crash-b-${boundary}.md`), beforeB)
    const lifecycle: V138LifecycleTransactionV2 = {
      transactionId: `crash-life-${boundary}`, intentPath: `crash-life-${boundary}.intent`,
      steps: [
        { id: "a", target: `planning/crash-a-${boundary}.md`, beforeSha256: sha256V138Secure(beforeA), afterBytes: `crash-a-${boundary}:after\n` },
        { id: "b", target: `planning/crash-b-${boundary}.md`, beforeSha256: sha256V138Secure(beforeB), afterBytes: `crash-b-${boundary}:after\n` },
      ],
      lifecycle: { target: `crash-life-${boundary}.json`, bytes: `{"boundary":${boundary},"authority":false}\n` },
    }
    const locks = [...lifecycle.steps.map(({ target }) => target), lifecycle.lifecycle.target]
    const interrupted = await invokeNative(root, lifecycleInput(root, lifecycle, boundary), locks)
    if (interrupted.code === 0) fail("V138_SUCCESSOR_LIFECYCLE_CRASH_NOT_INJECTED")
    await requireComplete(invokeNative(root, lifecycleInput(root, lifecycle), locks))
    for (const step of lifecycle.steps) if (readFileSync(path.join(root, step.target), "utf8") !== step.afterBytes) fail("V138_SUCCESSOR_LIFECYCLE_RECOVERY_FAILED")
    if (readFileSync(path.join(root, lifecycle.lifecycle.target), "utf8") !== lifecycle.lifecycle.bytes) fail("V138_SUCCESSOR_LIFECYCLE_STATUS_RECOVERY_FAILED")
    if (existsSync(path.join(root, lifecycle.intentPath))) fail("V138_SUCCESSOR_LIFECYCLE_INTENT_RETAINED")
    if (readdirSync(path.join(root, ".v138-lifecycle-staging")).some((entry) => entry.startsWith(deriveV138LifecycleIntentV2(trustedIdentity(root), lifecycle).namespace))) fail("V138_SUCCESSOR_LIFECYCLE_STAGE_RETAINED")
    recovered++
  }
  return recovered
}

const writeWindowRecoveryEvidence = async (root: string): Promise<Readonly<{ recoveries: number; partialDeterministicFilesAccepted: 0; abandonedTemps: 0 }>> => {
  let recovered = 0
  for (const boundary of [100, 101]) {
    const pair: V138DurablePairV2Input = {
      transactionId: `write-window-${boundary}`, intentPath: `write-window-${boundary}.intent`,
      members: [{ target: `left/write-window-${boundary}.json`, bytes: `left-${boundary}\n` }, { target: `right/write-window-${boundary}.json`, bytes: `right-${boundary}\n` }],
    }
    const locks = pair.members.map(({ target }) => target)
    const interrupted = await invokeNative(root, pairInput(root, pair, boundary), locks)
    if (interrupted.code === 0 || existsSync(path.join(root, pair.intentPath))) fail("V138_SUCCESSOR_PARTIAL_DETERMINISTIC_FILE_ACCEPTED")
    await requireComplete(invokeNative(root, pairInput(root, pair), locks))
    if (existsSync(path.join(root, pair.intentPath))) fail("V138_SUCCESSOR_WRITE_WINDOW_INTENT_RETAINED")
    const derived = deriveV138PairIntentV2(trustedIdentity(root), pair)
    const abandoned = readdirSync(root).filter((entry) => entry.startsWith(`.v138-u-${derived.namespace}-`))
    if (abandoned.length !== 0) fail("V138_SUCCESSOR_ABANDONED_TEMP_RETAINED")
    recovered++
  }
  return Object.freeze({ recoveries: recovered, partialDeterministicFilesAccepted: 0, abandonedTemps: 0 })
}

const directHelperBypassEvidence = async (root: string): Promise<number> => {
  const pair: V138DurablePairV2Input = {
    transactionId: "one-shot-location", intentPath: "one-shot-location.intent",
    members: [{ target: "left/one-shot-location.json", bytes: "left\n" }, { target: "right/one-shot-location.json", bytes: "right\n" }],
  }
  const result = await invokeNative(root, pairInput(root, pair), pair.members.map(({ target }) => target))
  if (result.code !== 0 || existsSync(result.privateExecutable)) fail("V138_SUCCESSOR_ONE_SHOT_REMOVAL_FAILED")
  const before = pair.members.map(({ target }) => readFileSync(path.join(root, target), "utf8"))
  const replay = spawnSync(result.privateExecutable, [root, "0", "0"], { encoding: "utf8", input: pairInput(root, pair) })
  if (replay.status === 0 || pair.members.some(({ target }, index) => readFileSync(path.join(root, target), "utf8") !== before[index])) fail("V138_SUCCESSOR_DIRECT_HELPER_BYPASS")
  const ordinaryDirectory = mkdtempSync(path.join(tmpdir(), "v138-ordinary-helper-"))
  try {
    const ordinary = path.join(ordinaryDirectory, "helper")
    const compilation = spawnSync("/usr/bin/clang", ["-std=c11", "-Wall", "-Wextra", "-Werror", nativeSource, "-o", ordinary], { encoding: "utf8" })
    if (compilation.status !== 0) fail("V138_SUCCESSOR_ORDINARY_HELPER_COMPILE_FAILED")
    const direct = spawnSync(ordinary, [root, "0", "0"], { encoding: "utf8", input: pairInput(root, pair) })
    if (direct.status === 0 || pair.members.some(({ target }, index) => readFileSync(path.join(root, target), "utf8") !== before[index])) fail("V138_SUCCESSOR_ORDINARY_ARGV_CAPABILITY_ACCEPTED")
  } finally { rmSync(ordinaryDirectory, { recursive: true, force: true }) }
  return 2
}

const directoryReplacementEvidence = async (root: string): Promise<number> => {
  let protectedOperations = 0
  const pairExternal = mkdtempSync(path.join(tmpdir(), "v138-pair-replacement-external-"))
  const lifecycleExternal = mkdtempSync(path.join(tmpdir(), "v138-life-replacement-external-"))
  try {
    mkdirSync(path.join(root, "replace-pair"))
    const pair: V138DurablePairV2Input = {
      transactionId: "replace-pair", intentPath: "replace-pair.intent",
      members: [{ target: "replace-pair/a.json", bytes: "a\n" }, { target: "replace-pair/b.json", bytes: "b\n" }],
    }
    const pairTag = "pair"
    const pairRun = invokeNative(root, pairInput(root, pair), pair.members.map(({ target }) => target), pairTag)
    await waitFor(() => existsSync(path.join(root, `.v138-test-ready-${pairTag}`)))
    renameSync(path.join(root, "replace-pair"), path.join(root, "replace-pair-authenticated"))
    symlinkSync(pairExternal, path.join(root, "replace-pair"))
    writeFileSync(path.join(root, `.v138-test-continue-${pairTag}`), "continue\n")
    await requireComplete(pairRun)
    if (readdirSync(pairExternal).length !== 0) fail("V138_SUCCESSOR_PAIR_REPLACEMENT_ESCAPE")
    if (readFileSync(path.join(root, "replace-pair-authenticated/a.json"), "utf8") !== "a\n") fail("V138_SUCCESSOR_PAIR_DIRFD_POSTCONDITION")
    protectedOperations++

    mkdirSync(path.join(root, "replace-life"))
    const before = "before\n"
    writeFileSync(path.join(root, "replace-life/status.md"), before)
    const lifecycle: V138LifecycleTransactionV2 = {
      transactionId: "replace-life", intentPath: "replace-life.intent",
      steps: [{ id: "status", target: "replace-life/status.md", beforeSha256: sha256V138Secure(before), afterBytes: "after\n" }],
      lifecycle: { target: "replace-life/lifecycle.json", bytes: '{"authority":false}\n' },
    }
    const lifeTag = "life"
    const lifeRun = invokeNative(root, lifecycleInput(root, lifecycle), [...lifecycle.steps.map(({ target }) => target), lifecycle.lifecycle.target], lifeTag)
    await waitFor(() => existsSync(path.join(root, `.v138-test-ready-${lifeTag}`)))
    renameSync(path.join(root, "replace-life"), path.join(root, "replace-life-authenticated"))
    symlinkSync(lifecycleExternal, path.join(root, "replace-life"))
    writeFileSync(path.join(root, `.v138-test-continue-${lifeTag}`), "continue\n")
    await requireComplete(lifeRun)
    if (readdirSync(lifecycleExternal).length !== 0) fail("V138_SUCCESSOR_LIFECYCLE_REPLACEMENT_ESCAPE")
    if (readFileSync(path.join(root, "replace-life-authenticated/status.md"), "utf8") !== "after\n") fail("V138_SUCCESSOR_LIFECYCLE_DIRFD_POSTCONDITION")
    protectedOperations++
    return protectedOperations
  } finally {
    rmSync(pairExternal, { recursive: true, force: true })
    rmSync(lifecycleExternal, { recursive: true, force: true })
  }
}

const runSyntheticSuccessorProtocolV2 = async (): Promise<Readonly<Record<string, unknown>>> => {
  const root = mkdtempSync(path.join(tmpdir(), "v138-successor-controller-v3-"))
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
    if (existsSync(path.join(root, lifecycle.intentPath)) || readdirSync(path.join(root, ".v138-lifecycle-staging")).length !== 0) fail("V138_SUCCESSOR_LIFECYCLE_CLEANUP_FAILED")

    const overlapRaces = await overlapRaceEvidence(root, 50)
    const disjointRaces = await disjointRaceEvidence(root, 100)
    const crashRecoveries = await crashRecoveryEvidence(root)
    const writeWindowEvidence = await writeWindowRecoveryEvidence(root)
    const directHelperBypassAttempts = await directHelperBypassEvidence(root)
    const directoryReplacementProtections = await directoryReplacementEvidence(root)
    return Object.freeze({
      operations: V138_SUCCESSOR_CONTROLLER_V3_OPERATIONS,
      acceptedCells: 0,
      workspaceWrites: false,
      pairMembers: [readFileSync(path.join(root, "artifacts/synthetic-review.json"), "utf8"), readFileSync(path.join(root, "reviews/synthetic-review.md"), "utf8")],
      lifecycle: readFileSync(path.join(root, "planning/status.md"), "utf8"),
      overlapRaces,
      disjointRaces,
      crashRecoveries,
      writeWindowRecoveries: writeWindowEvidence.recoveries,
      partialDeterministicFilesAccepted: writeWindowEvidence.partialDeterministicFilesAccepted,
      abandonedUncommittedTemps: writeWindowEvidence.abandonedTemps,
      directHelperBypassAttempts,
      directoryReplacementProtections,
      lifecycleStagingResidue: readdirSync(path.join(root, ".v138-lifecycle-staging")),
      internalDirectories: readdirSync(root).filter((entry) => entry.startsWith(".v138-")).sort(),
    })
  } finally { rmSync(root, { recursive: true, force: true }) }
}

export const checkV138SuccessorControllerV3Source = (sourcePath: string): true => {
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

if (process.argv[1] === V138_SUCCESSOR_CONTROLLER_V3_CLI) {
  if (process.argv[2] === "--source-check") {
    checkV138SuccessorControllerV3Source(V138_SUCCESSOR_CONTROLLER_V3_CLI)
    process.stdout.write("successor_controller_source_only=true\n")
  } else if (process.argv[2] === "--synthetic-check") {
    checkV138SuccessorControllerV3Source(V138_SUCCESSOR_CONTROLLER_V3_CLI)
    const result = await runSyntheticSuccessorProtocolV2()
    process.stdout.write(`${JSON.stringify({ sourceOnly: true, liveSideEffects: false, ...result })}\n`)
  } else fail("V138_SUCCESSOR_CONTROLLER_SOURCE_ONLY")
}
