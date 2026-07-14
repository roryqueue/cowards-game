import {
  RUNTIME_INVOCATION_V1_17_CANDIDATE,
  STRATEGY_RUNTIME_ABI_VERSION,
  STRATEGY_RUNTIME_ADAPTER_REGISTRY,
  type StrategyLanguageId,
  type StrategyRuntimeMetadata,
} from "@cowards/spec"

export const WASM_WASI_V1_17_EXECUTION_SETTINGS = Object.freeze({
  runtime: "wasmtime-cli",
  runtimeInterface: "wasi-preview1-command",
  environment: "empty",
  preopenedDirectories: Object.freeze([] as string[]),
  network: "unavailable",
  arguments: "none",
  fuel: "request-budget-computeFuel",
  wallTimeout: "request-budget-wallMilliseconds",
  linearMemory: "request-budget-memoryBytes",
  wasmStackBytes: 1_048_576,
  trapOnGrowFailure: true,
  stdout: "raw-canonical-strategy-payload",
  stderrBytes: 16_384,
  processLimit: 1,
  cliArgumentTemplate: Object.freeze([
    "run",
    "-W",
    "fuel=<signed-computeFuel>",
    "-W",
    "timeout=<signed-wallMilliseconds>ms",
    "-W",
    "max-memory-size=<signed-memoryBytes>",
    "-W",
    "max-wasm-stack=1048576",
    "-W",
    "trap-on-grow-failure=y",
    "<artifact>",
  ]),
  unsupportedMeters: Object.freeze([
    "portable-cross-runtime-compute-equivalence",
    "guest-process-tree-accounting",
    "per-invocation-peak-linear-memory-observation",
    "signed-match-cumulative-meter-readback",
    "guest-stderr-provenance-attribution",
  ]),
  certification: "uncertified",
} as const)

export const wasmWasiRuntimeMetadataV117 = (
  languageId: Extract<StrategyLanguageId, "rust" | "zig">,
) =>
  Object.freeze({
    abiVersion: RUNTIME_INVOCATION_V1_17_CANDIDATE.runtimeAbiVersion,
    candidateStatus: RUNTIME_INVOCATION_V1_17_CANDIDATE.lifecycle,
    current: false as const,
    language: Object.freeze({
      id: languageId,
      targetTriple: languageId === "rust" ? "wasm32-wasip1" : "wasm32-wasi",
    }),
    adapter: Object.freeze({
      id: "runtime-wasm-wasi-wasmtime-preview1",
      outerEnvelopeOwner: "adapter-host" as const,
      guestPayload: "raw-canonical-json-v1" as const,
    }),
    package: Object.freeze({ mode: "none" as const, entrypoint: "_start" }),
    countedCertification: "uncertified" as const,
    productionTrustedProducers: Object.freeze([] as string[]),
  })

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
