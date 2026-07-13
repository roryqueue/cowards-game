import type { CompatibilityVersions } from "./types.js"

// Kept with other compatibility constants so the canonical tuple and runtime
// facade can depend on it without creating an integrity-authority/runtime cycle.
export const STRATEGY_RUNTIME_ABI_VERSION = "strategy-runtime-abi-v1.14"

export const COMPATIBILITY_VERSIONS = {
  spec: "cowards-rules-v1.4",
  engine: "engine-kernel-v1.37-candidate-1",
  runtimeJs: "0.1.0",
  chronicle: "chronicle-recorder-current-events-v1.37-candidate-1",
  strategyRevision: "0.1.4",
  arenaVariant: "semantic-arena-catalog-v1.37-candidate-1",
} as const satisfies CompatibilityVersions
