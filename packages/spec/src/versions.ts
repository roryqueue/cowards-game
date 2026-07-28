import type { CompatibilityVersions } from "./types.js"
import {
  CURRENT_SEMANTIC_AUTHORITY_KEY,
  CURRENT_SEMANTIC_RUNTIME_ABI_VERSION,
} from "./current-semantic-authority-generated.js"

// Kept with other compatibility constants so the canonical tuple and runtime
// facade can depend on it without creating an integrity-authority/runtime cycle.
export const STRATEGY_RUNTIME_ABI_VERSION = CURRENT_SEMANTIC_RUNTIME_ABI_VERSION

/**
 * Explicit successor identity. This is candidate data only: current schemas,
 * defaults, certificates, and consumers continue to use the v1.17 pointer
 * until the Phase 260 activation transaction.
 */
export const STRATEGY_RUNTIME_ABI_VERSION_V1_19 =
  "strategy-runtime-abi-v1.19" as const

export const CANDIDATE_CANONICAL_COMPATIBILITY_TUPLE_KEY_V1_19 =
  "runtime-v1.19" as const

/**
 * The atomic semantic-tuple selector is deliberately separate from the ABI
 * string. Identity encodings are selected by the registered tuple record, not
 * inferred from a version-shaped value. Plan 258-14 flips this key together
 * with the runtime defaults after both records and encodings are proved.
 */
export const CURRENT_CANONICAL_COMPATIBILITY_TUPLE_KEY =
  CURRENT_SEMANTIC_AUTHORITY_KEY

export const COMPATIBILITY_VERSIONS = {
  spec: "cowards-rules-v1.4",
  engine: "engine-kernel-v1.37-candidate-1",
  runtimeJs: "0.1.0",
  chronicle: "chronicle-recorder-current-events-v1.37-candidate-1",
  strategyRevision: "0.1.4",
  arenaVariant: "semantic-arena-catalog-v1.37-candidate-1",
} as const satisfies CompatibilityVersions
