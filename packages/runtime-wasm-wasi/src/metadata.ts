import {
  STRATEGY_RUNTIME_ABI_VERSION,
  STRATEGY_RUNTIME_ADAPTER_REGISTRY,
  type StrategyLanguageId,
  type StrategyRuntimeMetadata,
} from "@cowards/spec"

export const wasmWasiRuntimeMetadata = (
  languageId: Extract<StrategyLanguageId, "rust" | "zig"> = "rust",
): StrategyRuntimeMetadata => {
  const adapter = STRATEGY_RUNTIME_ADAPTER_REGISTRY.find(
    (candidate) => candidate.id === "runtime-wasm-wasi-wasmtime-preview1",
  )
  if (!adapter) {
    throw new Error("WASM/WASI runtime adapter metadata is not registered")
  }
  return {
    abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
    language: {
      id: languageId,
      version:
        languageId === "rust" ? "1.95.0-wasm32-wasip1" : "0.16.0-wasm32-wasi",
    },
    adapter: {
      id: adapter.id,
      version: adapter.version,
    },
    package: {
      mode: "none",
      entrypoint: "_start",
    },
    requiredCapabilities: [],
    limits: adapter.limits,
  }
}
