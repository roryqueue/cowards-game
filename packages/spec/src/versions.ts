import type { CompatibilityVersions } from "./types.js"

export const COMPATIBILITY_VERSIONS = {
  spec: "cowards-rules-v1.4",
  engine: "0.1.4",
  runtimeJs: "0.1.0",
  chronicle: "chronicle-v1.4",
  strategyRevision: "0.1.4",
  arenaVariant: "0.1.0",
} as const satisfies CompatibilityVersions
