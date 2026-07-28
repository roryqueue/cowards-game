const CANONICAL_JSON_INSTANT_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u

/**
 * Parses the one language-neutral timestamp representation admitted by public
 * contracts: an exact UTC instant with millisecond precision.
 *
 * The ISO round-trip is intentional. JavaScript's Date parser normalizes some
 * impossible calendar dates instead of rejecting them, which would otherwise
 * let different runtimes accept different scheduling decisions.
 */
export const parseCanonicalJsonInstant = (value: string): number | undefined => {
  if (!CANONICAL_JSON_INSTANT_PATTERN.test(value)) {
    return undefined
  }
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    return undefined
  }
  return parsed
}

export const isCanonicalJsonInstant = (value: string): boolean =>
  parseCanonicalJsonInstant(value) !== undefined
