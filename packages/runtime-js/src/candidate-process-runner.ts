import { Buffer } from "node:buffer"
import {
  MessageChannel,
  receiveMessageOnPort,
  Worker,
} from "node:worker_threads"

export interface CandidateProcessResult {
  readonly stdout: Buffer
  readonly stderr: Buffer
  readonly status: number | null
  readonly signal: string | null
  readonly error?: Error | undefined
  readonly stdoutOverflow: boolean
  readonly stderrOverflow: boolean
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
}

const CANDIDATE_PROCESS_COLLECTOR_SOURCE = String.raw`
const { Buffer } = require("node:buffer")
const { spawn } = require("node:child_process")
const { hrtime } = require("node:process")
const { workerData } = require("node:worker_threads")

const signal = new Int32Array(workerData.signalBuffer)
const port = workerData.port
const stdoutChunks = []
const stderrChunks = []
let stdoutBytes = 0
let stderrBytes = 0
let stdoutOverflow = false
let stderrOverflow = false
let childError
let finished = false
let watchdog
let forcedReceipt
let child

const retainedChunk = (chunk, retainedBytes, byteLimit) => {
  const remaining = Math.max(0, byteLimit + 1 - retainedBytes)
  return remaining === 0 ? undefined : chunk.subarray(0, remaining)
}

const finish = (status, childSignal) => {
  if (finished) return
  finished = true
  clearTimeout(watchdog)
  clearTimeout(forcedReceipt)
  port.postMessage({
    stdout: Buffer.concat(stdoutChunks),
    stderr: Buffer.concat(stderrChunks),
    status,
    signal: childSignal,
    error: childError,
    stdoutOverflow,
    stderrOverflow,
  })
  port.close()
  Atomics.store(signal, 0, 1)
  Atomics.notify(signal, 0)
}

const terminate = (reason) => {
  if (reason === "stdout") stdoutOverflow = true
  if (reason === "stderr") stderrOverflow = true
  const killed = child.kill(workerData.killSignal)
  forcedReceipt = setTimeout(
    () => finish(null, killed ? workerData.killSignal : null),
    100,
  )
}

try {
  child = spawn(workerData.command, workerData.args, {
    env: workerData.env,
    shell: false,
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  })
} catch (error) {
  childError = {
    message: error instanceof Error ? error.message : String(error),
  }
  finish(null, null)
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
  child.on("error", (error) => {
    childError = {
      message: error instanceof Error ? error.message : String(error),
      code:
        error && typeof error === "object" && typeof error.code === "string"
          ? error.code
          : undefined,
    }
  })
  child.on("close", (status, childSignal) => finish(status, childSignal))
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
  }
}

export const runCandidateProcessSync = (
  options: CandidateProcessRunOptions,
): CandidateProcessResult => {
  const signalBuffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT)
  const signal = new Int32Array(signalBuffer)
  const { port1, port2 } = new MessageChannel()
  const worker = new Worker(CANDIDATE_PROCESS_COLLECTOR_SOURCE, {
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
    100
  const wait = Atomics.wait(signal, 0, 0, waitMilliseconds)
  const received = wait === "timed-out" ? undefined : receiveMessageOnPort(port1)
  void worker.terminate()
  port1.close()
  if (received === undefined || received.message === null ||
      typeof received.message !== "object") {
    return runnerFailure(
      "ETIMEDOUT",
      "Candidate process collector did not return a bounded receipt",
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
  }
}
