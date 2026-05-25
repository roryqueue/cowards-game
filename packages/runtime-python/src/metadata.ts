import {
  STRATEGY_RUNTIME_ABI_VERSION,
  STRATEGY_RUNTIME_ADAPTER_REGISTRY,
  type StrategyRuntimeMetadata,
} from "@cowards/spec"

export const pythonExperimentalRuntimeMetadata =
  (): StrategyRuntimeMetadata => {
    const adapter = STRATEGY_RUNTIME_ADAPTER_REGISTRY.find(
      (candidate) => candidate.id === "runtime-python-subprocess-experimental",
    )
    if (!adapter) {
      throw new Error("Python runtime adapter metadata is not registered")
    }
    return {
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      language: {
        id: "python",
        version: "3.9",
      },
      adapter: {
        id: adapter.id,
        version: adapter.version,
      },
      package: {
        mode: "none",
        entrypoint: "module",
      },
      requiredCapabilities: [],
      limits: adapter.limits,
    }
  }
