import { Buffer } from "node:buffer"
import { MessageChannel, receiveMessageOnPort, Worker } from "node:worker_threads"

export interface CandidateContainerCleanupOptions {
  readonly runtimeCommand: string
  readonly cidFilePath: string
  readonly cleanupDirectory?: string | undefined
}

export interface CandidateProcessResult {
  readonly stdout: Buffer
  readonly stderr: Buffer
  readonly status: number | null
  readonly signal: string | null
  readonly error?: Error | undefined
  readonly stdoutOverflow: boolean
  readonly stderrOverflow: boolean
  readonly terminationRequested: boolean
  readonly terminationReceiptPresent: boolean
  readonly stdoutEof: boolean
  readonly stderrEof: boolean
  readonly containerCleanupRequired: boolean
  readonly containerCleanupVerified: boolean
}

export interface CandidateProcessRunOptions {
  readonly command: string
  readonly args: readonly string[]
  readonly env: Readonly<Record<string, string>>
  readonly input: string
  readonly killSignal: string
  readonly launchStartedNanoseconds: bigint
  readonly timeoutMilliseconds: number
  readonly stdoutByteLimit: number
  readonly stderrByteLimit: number
  readonly containerCleanup?: CandidateContainerCleanupOptions | undefined
}

const CANDIDATE_PROCESS_COLLECTOR_SOURCE = String.raw`
const { Buffer } = require("node:buffer")
const { spawn, spawnSync } = require("node:child_process")
const { readFileSync, rmSync } = require("node:fs")
const { hrtime, kill: processKill, platform } = require("node:process")
const { workerData } = require("node:worker_threads")

const signal = new Int32Array(workerData.signalBuffer)
const port = workerData.port
const stdoutChunks = []
const stderrChunks = []
let stdoutBytes = 0
let stderrBytes = 0
let stdoutOverflow = false
let stderrOverflow = false
let stdoutEof = false
let stderrEof = false
let childClosed = false
let childStatus = null
let childSignal = null
let childError
let messageSent = false
let terminationStarted = false
let terminationDeadlineNanoseconds
let watchdog
let receiptWatchdog
let child
const cleanupRequired = workerData.containerCleanup !== undefined
let cleanupAttempted = false
let cleanupVerified = !cleanupRequired
let containerId
let containerRemoved = !cleanupRequired
let containerReaperStarted = false

const retainedChunk = (chunk, retainedBytes, byteLimit) => {
  const remaining = Math.max(0, byteLimit + 1 - retainedBytes)
  return remaining === 0 ? undefined : chunk.subarray(0, remaining)
}

const captured = (chunks) => Buffer.concat(chunks)

const publish = (receiptPresent, errorOverride) => {
  if (messageSent) return
  messageSent = true
  clearTimeout(watchdog)
  clearTimeout(receiptWatchdog)
  port.postMessage({
    stdout: captured(stdoutChunks),
    stderr: captured(stderrChunks),
    status: receiptPresent ? childStatus : null,
    signal: receiptPresent ? childSignal : null,
    error: errorOverride || childError,
    stdoutOverflow,
    stderrOverflow,
    terminationRequested: terminationStarted,
    terminationReceiptPresent: receiptPresent,
    stdoutEof,
    stderrEof,
    containerCleanupRequired: cleanupRequired,
    containerCleanupVerified: cleanupVerified,
  })
  port.close()
  Atomics.store(signal, 0, 1)
  Atomics.notify(signal, 0)
}

const cleanupDirectory = () => {
  const directory = workerData.containerCleanup &&
    workerData.containerCleanup.cleanupDirectory
  if (!directory) return
  try {
    rmSync(directory, { force: true, recursive: true })
  } catch {}
}

const remainingUntil = (deadlineNanoseconds) => Math.max(
  0,
  Math.floor(Number(deadlineNanoseconds - hrtime.bigint()) / 1000000),
)

const cleanupContainer = (includeKill, deadlineNanoseconds) => {
  if (!cleanupRequired || cleanupAttempted) return
  cleanupAttempted = true
  if (!containerId) {
    try {
      containerId = readFileSync(
        workerData.containerCleanup.cidFilePath,
        "utf8",
      ).trim()
    } catch {
      return
    }
  }
  if (!/^[a-f0-9]{64}$/.test(containerId)) {
    return
  }
  const commands = [
    ...(includeKill ? [["kill", containerId]] : []),
    ["wait", containerId],
    ["rm", "-f", containerId],
  ]
  let waitVerified = false
  let removalVerified = false
  for (const args of commands) {
    const remaining = remainingUntil(deadlineNanoseconds)
    if (remaining <= 0) break
    const result = spawnSync(
      workerData.containerCleanup.runtimeCommand,
      args,
      {
        env: workerData.env,
        shell: false,
        stdio: "ignore",
        timeout: remaining,
        windowsHide: true,
      },
    )
    const succeeded = !result.error && result.status === 0
    if (args[0] === "wait") waitVerified = succeeded
    if (args[0] === "rm") {
      removalVerified = succeeded
      if (succeeded) containerRemoved = true
    }
  }
  cleanupVerified = waitVerified && removalVerified
  if (containerRemoved) cleanupDirectory()
}

const startContainerReaper = () => {
  if (!cleanupRequired || containerRemoved || containerReaperStarted) return
  containerReaperStarted = true
  const reapContainer = () => {
    cleanupAttempted = false
    cleanupContainer(true, hrtime.bigint() + 5000000000n)
    if (!containerRemoved) setTimeout(reapContainer, 250)
  }
  reapContainer()
}

const hasActualReceipt = () =>
  childClosed && stdoutEof && stderrEof && cleanupVerified && !childError

const maybePublishActual = () => {
  if (!childClosed || !stdoutEof || !stderrEof) return
  if (cleanupRequired && !cleanupAttempted) {
    cleanupContainer(
      terminationStarted,
      terminationDeadlineNanoseconds || hrtime.bigint() + 100000000n,
    )
  }
  if (hasActualReceipt()) {
    publish(true)
  } else if (childError) {
    publish(false, childError)
    startContainerReaper()
  } else if (cleanupRequired && cleanupAttempted) {
    publish(false, {
      message: "Authoritative container cleanup was unavailable",
      code: "NO_TERMINATION_RECEIPT",
    })
    startContainerReaper()
  }
}

const killProcessGroup = (killSignal) => {
  if (!child || !child.pid) return false
  if (platform !== "win32") {
    try {
      processKill(-child.pid, killSignal)
      return true
    } catch {}
  }
  try {
    return child.kill(killSignal)
  } catch {
    return false
  }
}

const receiptUnavailable = () => {
  if (hasActualReceipt()) {
    publish(true)
    return
  }
  publish(false, {
    message: "Candidate process lacked actual close and stream EOF receipt",
    code: "NO_TERMINATION_RECEIPT",
  })
  // The referenced collector remains alive as a reaper after the synchronous
  // caller has failed closed. Escalation covers the whole process group.
  killProcessGroup("SIGKILL")
  startContainerReaper()
}

const terminate = (reason) => {
  if (reason === "stdout") stdoutOverflow = true
  if (reason === "stderr") stderrOverflow = true
  if (terminationStarted) return
  terminationStarted = true
  terminationDeadlineNanoseconds = hrtime.bigint() + 100000000n
  killProcessGroup(workerData.killSignal)
  if (cleanupRequired) {
    cleanupContainer(true, terminationDeadlineNanoseconds)
  }
  const remaining = remainingUntil(terminationDeadlineNanoseconds)
  receiptWatchdog = setTimeout(receiptUnavailable, remaining)
  maybePublishActual()
}

try {
  child = spawn(workerData.command, workerData.args, {
    detached: platform !== "win32",
    env: workerData.env,
    shell: false,
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  })
} catch (error) {
  childError = {
    message: error instanceof Error ? error.message : String(error),
  }
  stdoutEof = true
  stderrEof = true
  cleanupDirectory()
  publish(false, childError)
}

if (child) {
  child.stdout.on("data", (value) => {
    const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value)
    const retained = retainedChunk(
      chunk,
      stdoutBytes,
      workerData.stdoutByteLimit,
    )
    if (retained) stdoutChunks.push(retained)
    stdoutBytes = Math.min(
      workerData.stdoutByteLimit + 1,
      stdoutBytes + chunk.byteLength,
    )
    if (stdoutBytes > workerData.stdoutByteLimit && !stdoutOverflow) {
      terminate("stdout")
    }
  })
  child.stdout.on("end", () => {
    stdoutEof = true
    maybePublishActual()
  })
  child.stderr.on("data", (value) => {
    const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value)
    const retained = retainedChunk(
      chunk,
      stderrBytes,
      workerData.stderrByteLimit,
    )
    if (retained) stderrChunks.push(retained)
    stderrBytes = Math.min(
      workerData.stderrByteLimit + 1,
      stderrBytes + chunk.byteLength,
    )
    if (stderrBytes > workerData.stderrByteLimit && !stderrOverflow) {
      terminate("stderr")
    }
  })
  child.stderr.on("end", () => {
    stderrEof = true
    maybePublishActual()
  })
  child.on("error", (error) => {
    childError = {
      message: error instanceof Error ? error.message : String(error),
      code:
        error && typeof error === "object" && typeof error.code === "string"
          ? error.code
          : undefined,
    }
  })
  child.on("close", (status, closeSignal) => {
    childClosed = true
    childStatus = status
    childSignal = closeSignal
    maybePublishActual()
  })
  child.stdin.on("error", () => {})
  child.stdin.end(workerData.input)

  const launchElapsedMilliseconds =
    Number(hrtime.bigint() - BigInt(workerData.launchStartedNanoseconds)) /
    1000000
  const remainingMilliseconds = Math.max(
    0,
    workerData.timeoutMilliseconds - launchElapsedMilliseconds,
  )
  watchdog = setTimeout(() => {
    childError = {
      message: "Candidate process exceeded its aggregate host watchdog",
      code: "ETIMEDOUT",
    }
    terminate("timeout")
  }, remainingMilliseconds)
}
`

const runnerFailure = (code: string, message: string): CandidateProcessResult => {
  const error = Object.assign(new Error(message), { code })
  return {
    stdout: Buffer.alloc(0),
    stderr: Buffer.alloc(0),
    status: null,
    signal: null,
    error,
    stdoutOverflow: false,
    stderrOverflow: false,
    terminationRequested: false,
    terminationReceiptPresent: false,
    stdoutEof: false,
    stderrEof: false,
    containerCleanupRequired: false,
    containerCleanupVerified: false,
  }
}

export const runCandidateProcessSync = (
  options: CandidateProcessRunOptions,
): CandidateProcessResult => {
  const signalBuffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT)
  const signal = new Int32Array(signalBuffer)
  const { port1, port2 } = new MessageChannel()
  // This worker is intentionally left referenced. If the 100 ms receipt
  // window expires, it survives the synchronous return long enough to reap
  // the process group and any identified daemon-owned container.
  new Worker(CANDIDATE_PROCESS_COLLECTOR_SOURCE, {
    eval: true,
    workerData: {
      ...options,
      args: Array.from(options.args),
      launchStartedNanoseconds: String(options.launchStartedNanoseconds),
      port: port2,
      signalBuffer,
    },
    transferList: [port2],
    env: {},
    execArgv: [],
    resourceLimits: {
      maxOldGenerationSizeMb: 16,
      maxYoungGenerationSizeMb: 8,
      stackSizeMb: 4,
    },
  })
  const alreadyElapsedMilliseconds =
    Number(process.hrtime.bigint() - options.launchStartedNanoseconds) /
    1_000_000
  const waitMilliseconds =
    Math.max(0, options.timeoutMilliseconds - alreadyElapsedMilliseconds) +
    125
  const wait = Atomics.wait(signal, 0, 0, waitMilliseconds)
  const received = wait === "timed-out" ? undefined : receiveMessageOnPort(port1)
  port1.close()
  if (
    received === undefined ||
    received.message === null ||
    typeof received.message !== "object"
  ) {
    return runnerFailure(
      "NO_TERMINATION_RECEIPT",
      "Candidate process collector did not return an actual bounded receipt",
    )
  }
  const message = received.message as Readonly<{
    stdout?: unknown
    stderr?: unknown
    status?: unknown
    signal?: unknown
    error?: unknown
    stdoutOverflow?: unknown
    stderrOverflow?: unknown
    terminationRequested?: unknown
    terminationReceiptPresent?: unknown
    stdoutEof?: unknown
    stderrEof?: unknown
    containerCleanupRequired?: unknown
    containerCleanupVerified?: unknown
  }>
  const errorRecord =
    message.error !== null && typeof message.error === "object"
      ? (message.error as Readonly<{ message?: unknown; code?: unknown }>)
      : undefined
  const error =
    errorRecord === undefined
      ? undefined
      : Object.assign(
          new Error(
            typeof errorRecord.message === "string"
              ? errorRecord.message
              : "Candidate process failed",
          ),
          typeof errorRecord.code === "string"
            ? { code: errorRecord.code }
            : {},
        )
  return {
    stdout: Buffer.from(
      message.stdout instanceof Uint8Array ? message.stdout : [],
    ),
    stderr: Buffer.from(
      message.stderr instanceof Uint8Array ? message.stderr : [],
    ),
    status: typeof message.status === "number" ? message.status : null,
    signal: typeof message.signal === "string" ? message.signal : null,
    ...(error === undefined ? {} : { error }),
    stdoutOverflow: message.stdoutOverflow === true,
    stderrOverflow: message.stderrOverflow === true,
    terminationRequested: message.terminationRequested === true,
    terminationReceiptPresent: message.terminationReceiptPresent === true,
    stdoutEof: message.stdoutEof === true,
    stderrEof: message.stderrEof === true,
    containerCleanupRequired: message.containerCleanupRequired === true,
    containerCleanupVerified: message.containerCleanupVerified === true,
  }
}
