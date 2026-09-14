/**
 * The only oracle-facing factory seam. It intentionally excludes admission,
 * repository, runtime, ledger, and candidate publication APIs.
 */
export { FactoryOraclePacketSchema } from "./contracts.js"
export type { FactoryOraclePacket } from "./contracts.js"
export { deriveFactoryOraclePacketRoot } from "./identity.js"
