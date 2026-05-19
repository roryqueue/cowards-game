import type { RuntimeResult } from "@cowards/engine"

export type StrategyMethodName = "selectActivations" | "soldierBrain"

export interface StrategyExecutionAdapterMetadata {
  id: string
  label: string
  default: boolean
  productionReadiness?:
    | "production-candidate"
    | "prototype"
    | "local-dev-fallback"
  isolationBoundary: string
  notes: readonly string[]
  runtimeControls: {
    timeout: boolean
    timeoutMs?: number | undefined
    outputByteLimit: boolean
    stdoutBytes?: number | undefined
    stderrBytes?: number | undefined
    environment: "empty" | "minimal" | "inherited"
    execArgv: "empty" | "inherited"
    resourceLimits: readonly string[]
    filesystem?: "none" | "read-only-root" | "host" | undefined
    network?: "disabled" | "inherited" | undefined
    shell?: "disabled" | "inherited" | undefined
  }
  diagnostics?:
    | {
        fallback: boolean
        dockerRequired: boolean
        preflight: string
      }
    | undefined
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
    productionReadiness: "local-dev-fallback",
    isolationBoundary:
      "Default compatibility containment and prototype boundary for Strategy execution; not a final sandbox for hostile Strategy code.",
    notes: [
      "Keeps the v1 runtime behavior stable while stronger subprocess, container, or WASM adapters are proven.",
      "Worker threads share a host process, so this boundary must not be treated as production-grade hostile-code isolation.",
      "The worker bridge starts with env {}, execArgv [], V8 resourceLimits, a wall-clock timeout, and an output byte cap before posting results to the host.",
    ],
    runtimeControls: {
      timeout: true,
      outputByteLimit: true,
      environment: "empty",
      execArgv: "empty",
      resourceLimits: [
        "maxOldGenerationSizeMb: 16",
        "maxYoungGenerationSizeMb: 8",
        "stackSizeMb: 4",
      ],
      filesystem: "host",
      network: "inherited",
      shell: "disabled",
    },
    diagnostics: {
      fallback: true,
      dockerRequired: false,
      preflight:
        "Available anywhere Node worker_threads are available; not approved as production hostile-code isolation.",
    },
  }

export const activeStrategyExecutionAdapter =
  workerThreadStrategyExecutionAdapterMetadata

export const getStrategyExecutionAdapterMetadata = (
  adapter?: StrategyExecutionAdapter | undefined,
): StrategyExecutionAdapterMetadata =>
  adapter?.metadata ?? activeStrategyExecutionAdapter
