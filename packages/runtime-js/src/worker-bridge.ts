import {
  MessageChannel,
  receiveMessageOnPort,
  Worker,
} from "node:worker_threads"
import type { RuntimeResult } from "@cowards/engine"
import type { StrategyMethodName } from "./adapter.js"
import type { JsonValue } from "@cowards/spec"
import type { RuntimeGuestObservationV117 } from "./abi-bridge.js"
import { RUNTIME_OUTPUT_BYTES, RUNTIME_TIMEOUT_MS } from "./guards.js"
import {
  WORKER_SIGNAL_V117,
  WORKER_HARNESS_SOURCE,
  WORKER_HARNESS_V117_SOURCE,
} from "./worker-harness.js"

type WorkerResult =
  | { ok: true; value: unknown }
  | {
      ok: false
      violation: RuntimeResult<unknown> extends {
        ok: false
        violation: infer V
      }
        ? V
        : never
    }

const workerScriptUrl = (): URL =>
  new URL(
    `data:text/javascript;charset=utf-8,${encodeURIComponent(
      WORKER_HARNESS_SOURCE,
    )}`,
  )

const workerScriptUrlV117 = (): URL =>
  new URL(
    `data:text/javascript;charset=utf-8,${encodeURIComponent(
      WORKER_HARNESS_V117_SOURCE,
    )}`,
  )

const malformedIpc = (): RuntimeResult<unknown> => ({
  ok: false,
  violation: {
    type: "THROWN_EXCEPTION",
    message: "Runtime system failure.",
  },
  systemFailure: { code: "MALFORMED_IPC", retryable: true },
})

const isWorkerResult = (value: unknown): value is WorkerResult => {
  if (value === null || typeof value !== "object" || !("ok" in value)) {
    return false
  }

  const candidate = value as { ok?: unknown }
  return candidate.ok === true || candidate.ok === false
}

export const runStrategyMethodInWorker = (args: {
  source: string
  methodName: StrategyMethodName
  input: unknown
  timeoutMs?: number | undefined
  outputByteLimit?: number | undefined
}): RuntimeResult<unknown> => {
  const signalBuffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT)
  const signal = new Int32Array(signalBuffer)
  const { port1, port2 } = new MessageChannel()
  const worker = new Worker(workerScriptUrl(), {
    workerData: {
      source: args.source,
      methodName: args.methodName,
      input: args.input,
      outputByteLimit: args.outputByteLimit ?? RUNTIME_OUTPUT_BYTES,
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

  const waitResult = Atomics.wait(
    signal,
    0,
    0,
    args.timeoutMs ?? RUNTIME_TIMEOUT_MS,
  )

  if (waitResult === "timed-out") {
    void worker.terminate()
    port1.close()
    return {
      ok: false,
      violation: { type: "TIMEOUT", message: "Strategy execution timed out" },
    }
  }

  void worker.terminate()
  const received = receiveMessageOnPort(port1)
  port1.close()

  if (!received || !isWorkerResult(received.message)) {
    return malformedIpc()
  }

  return received.message
}

export const runStrategyMethodInWorkerV117 = (args: {
  executableSource: string
  methodName: StrategyMethodName
  input: JsonValue
  timeoutMs: number
  startupTimeoutMs: number
  outputByteLimit: number
  stdoutByteLimit: number
}): RuntimeGuestObservationV117 => {
  const signalBuffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT)
  const signal = new Int32Array(signalBuffer)
  const { port1, port2 } = new MessageChannel()
  const worker = new Worker(workerScriptUrlV117(), {
    workerData: {
      source: args.executableSource,
      methodName: args.methodName,
      input: args.input,
      outputByteLimit: args.outputByteLimit,
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

  const startupWait = Atomics.wait(
    signal,
    0,
    WORKER_SIGNAL_V117.starting,
    args.startupTimeoutMs,
  )
  if (
    startupWait === "timed-out" ||
    Atomics.load(signal, 0) === WORKER_SIGNAL_V117.starting
  ) {
    void worker.terminate()
    port1.close()
    return {
      kind: "system_failure",
      code: "HOST_CRASH",
      retryable: true,
    }
  }

  if (Atomics.load(signal, 0) === WORKER_SIGNAL_V117.ready) {
    Atomics.store(signal, 0, WORKER_SIGNAL_V117.go)
    Atomics.notify(signal, 0)
    const methodWait = Atomics.wait(
      signal,
      0,
      WORKER_SIGNAL_V117.go,
      args.timeoutMs,
    )
    if (
      methodWait === "timed-out" ||
      Atomics.load(signal, 0) !== WORKER_SIGNAL_V117.done
    ) {
      void worker.terminate()
      port1.close()
      return {
        kind: "raw_frame",
        bytes: Uint8Array.of("D".charCodeAt(0)),
      }
    }
  }

  if (Atomics.load(signal, 0) !== WORKER_SIGNAL_V117.done) {
    void worker.terminate()
    port1.close()
    return {
      kind: "system_failure",
      code: "RUNTIME_CRASH",
      retryable: true,
    }
  }

  void worker.terminate()
  const received = receiveMessageOnPort(port1)
  port1.close()
  const message = received?.message
  if (!(message instanceof Uint8Array)) {
    return {
      kind: "system_failure",
      code: "RUNTIME_CRASH",
      retryable: true,
    }
  }
  if (message.byteLength > args.stdoutByteLimit + 1) {
    return {
      kind: "system_failure",
      code: "TRANSPORT_CRASH",
      retryable: true,
    }
  }
  return { kind: "raw_frame", bytes: Uint8Array.from(message) }
}
