import type { CompatibilityVersions } from "./types.js"

// Kept with other compatibility constants so the canonical tuple and runtime
// facade can depend on it without creating an integrity-authority/runtime cycle.
export const STRATEGY_RUNTIME_ABI_VERSION = "strategy-runtime-abi-v1.14"

/**
 * The atomic semantic-tuple selector is deliberately separate from the ABI
 * string. Identity encodings are selected by the registered tuple record, not
 * inferred from a version-shaped value. Plan 258-14 flips this key together
 * with the runtime defaults after both records and encodings are proved.
 */
export const CURRENT_CANONICAL_COMPATIBILITY_TUPLE_KEY = "runtime-v1.14"

export const COMPATIBILITY_VERSIONS = {
  spec: "cowards-rules-v1.4",
  engine: "engine-kernel-v1.37-candidate-1",
  runtimeJs: "0.1.0",
  chronicle: "chronicle-recorder-current-events-v1.37-candidate-1",
  strategyRevision: "0.1.4",
  arenaVariant: "semantic-arena-catalog-v1.37-candidate-1",
} as const satisfies CompatibilityVersions
