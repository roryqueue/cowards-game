/**
 * Sole compact TypeScript activation source for the semantic authority.
 *
 * This one-key record deliberately cannot select tuple members independently.
 * Phase 260 Plan 14 is the sole owner allowed to change the key and regenerate
 * every current projection after the complete successor proof passes.
 */
export const CURRENT_SEMANTIC_AUTHORITY_SOURCE = Object.freeze({
  semanticAuthorityKey: "runtime-v1.17",
} as const)

export type CurrentSemanticAuthoritySource = Readonly<{
  semanticAuthorityKey: (typeof CURRENT_SEMANTIC_AUTHORITY_SOURCE)["semanticAuthorityKey"]
}>
