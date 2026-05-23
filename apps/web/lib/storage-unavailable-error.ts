const storageUnavailableCodes = new Set([
  "08000",
  "08001",
  "08003",
  "08004",
  "08006",
  "57P03",
  "ECONNABORTED",
  "ECONNREFUSED",
  "ECONNRESET",
  "EAI_AGAIN",
  "ENOTFOUND",
  "ETIMEDOUT",
])

export const isStorageUnavailableError = (error: unknown): boolean => {
  const seen = new Set<unknown>()
  const visit = (candidate: unknown): boolean => {
    if (typeof candidate !== "object" || candidate === null) {
      return false
    }
    if (seen.has(candidate)) {
      return false
    }
    seen.add(candidate)

    const coded = candidate as { code?: unknown }
    if (
      typeof coded.code === "string" &&
      storageUnavailableCodes.has(coded.code)
    ) {
      return true
    }

    const withCause = candidate as { cause?: unknown }
    if (visit(withCause.cause)) {
      return true
    }

    const withErrors = candidate as { errors?: unknown }
    return Array.isArray(withErrors.errors) && withErrors.errors.some(visit)
  }

  return visit(error)
}
