import type { RuntimeResult } from "@cowards/engine"

export type StrategyMethodName = "selectActivations" | "soldierBrain"

export interface StrategyExecutionAdapterMetadata {
  id: string
  label: string
  default: boolean
  isolationBoundary: string
  notes: readonly string[]
  runtimeControls: {
    timeout: boolean
    outputByteLimit: boolean
    environment: "empty" | "minimal" | "inherited"
    execArgv: "empty" | "inherited"
    resourceLimits: readonly string[]
  }
}

export interface StrategyExecutionAdapterOptions {
  timeoutMs?: number | undefined
  outputByteLimit?: number | undefined
}

export interface StrategyExecutionRequest extends StrategyExecutionAdapterOptions {
  source: string
  methodName: StrategyMethodName
  input: unknown
}

export interface StrategyExecutionAdapter {
  readonly metadata: StrategyExecutionAdapterMetadata
  execute(request: StrategyExecutionRequest): RuntimeResult<unknown>
}

export const workerThreadStrategyExecutionAdapterMetadata: StrategyExecutionAdapterMetadata =
  {
    id: "worker-thread",
    label: "Node worker thread",
    default: true,
    isolationBoundary:
      "Default compatibility containment and prototype boundary for Strategy execution; not a final sandbox for hostile Strategy code.",
    notes: [
      "Keeps the v1 runtime behavior stable while stronger subprocess, container, or WASM adapters are proven.",
      "Worker threads share a host process, so this boundary must not be treated as production-grade hostile-code isolation.",
      "The worker bridge starts with env {}, execArgv [], V8 resourceLimits, and a wall-clock timeout.",
    ],
    runtimeControls: {
      timeout: true,
      outputByteLimit: false,
      environment: "empty",
      execArgv: "empty",
      resourceLimits: [
        "maxOldGenerationSizeMb: 16",
        "maxYoungGenerationSizeMb: 8",
        "stackSizeMb: 4",
      ],
    },
  }

export const activeStrategyExecutionAdapter =
  workerThreadStrategyExecutionAdapterMetadata

export const getStrategyExecutionAdapterMetadata = (
  adapter?: StrategyExecutionAdapter | undefined,
): StrategyExecutionAdapterMetadata =>
  adapter?.metadata ?? activeStrategyExecutionAdapter
