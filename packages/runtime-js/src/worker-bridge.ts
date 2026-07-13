import {
  MessageChannel,
  receiveMessageOnPort,
  Worker,
} from "node:worker_threads"
import type { RuntimeResult } from "@cowards/engine"
import type { StrategyMethodName } from "./adapter.js"
import { RUNTIME_OUTPUT_BYTES, RUNTIME_TIMEOUT_MS } from "./guards.js"
import { WORKER_HARNESS_SOURCE } from "./worker-harness.js"

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
