import type { CompatibilityVersions } from "./types.js"

export const COMPATIBILITY_VERSIONS = {
  spec: "1.0.0",
  engine: "0.1.0",
  runtimeJs: "0.1.0",
  chronicle: "0.1.0",
  strategyRevision: "0.1.0",
  arenaVariant: "0.1.0",
} as const satisfies CompatibilityVersions
