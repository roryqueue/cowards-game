export const PUBLIC_OUTPUT_FORBIDDEN_FIELDS = [
  "source",
  "sourceText",
  "strategySource",
  "strategyMemory",
  "soldierMemory",
  "objective",
  "objectivePayload",
  "ownerDebug",
  "ownerPrivate",
  "exactAwarenessGrid",
  "awarenessGrid",
  "rawAwarenessGrid",
  "rawRuntimeDetails",
  "runtimeDetails",
  "privateRuntime",
  "privateDiagnostics",
  "privateError",
  "stack",
  "stackTrace",
  "stderr",
  "password",
  "passwordHash",
  "authorization",
  "token",
  "tokens",
  "accessToken",
  "refreshToken",
  "session",
  "sessions",
  "sessionId",
  "hostPath",
  "hostPaths",
  "databaseUrl",
  "databaseURL",
  "dbDsn",
  "dbDSN",
  "dsn",
  "runtimeInternal",
  "runtimeInternals",
  "privateRuntimeInternal",
  "privateRuntimeInternals",
] as const

export const PUBLIC_OUTPUT_FORBIDDEN_MARKERS = [
  "PRIVATE_",
  "GOLDEN_PRIVATE_",
  "DATABASE_URL",
  "postgres://",
  "postgresql://",
  "Bearer ",
  "stack trace",
] as const

export const normalizePublicOutputKey = (key: string): string =>
  key.toLowerCase().replaceAll(/[^a-z0-9]/g, "")

export const PUBLIC_OUTPUT_FORBIDDEN_FIELD_SET = new Set<string>(
  PUBLIC_OUTPUT_FORBIDDEN_FIELDS,
)

export const PUBLIC_OUTPUT_FORBIDDEN_NORMALIZED_FIELD_SET = new Set(
  PUBLIC_OUTPUT_FORBIDDEN_FIELDS.map(normalizePublicOutputKey),
)

export const assertPublicOutputLeakSafe = (
  value: unknown,
  label = "Public output",
): void => {
  const visit = (node: unknown, path: string): void => {
    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, `${path}[${index}]`))
      return
    }
    if (typeof node === "string") {
      for (const marker of PUBLIC_OUTPUT_FORBIDDEN_MARKERS) {
        if (node.includes(marker)) {
          throw new Error(`${label} leaks private marker at ${path}: ${marker}`)
        }
      }
      return
    }
    if (node === null || typeof node !== "object") {
      return
    }
    for (const [key, entryValue] of Object.entries(
      node as Record<string, unknown>,
    )) {
      if (
        PUBLIC_OUTPUT_FORBIDDEN_FIELD_SET.has(key) ||
        PUBLIC_OUTPUT_FORBIDDEN_NORMALIZED_FIELD_SET.has(
          normalizePublicOutputKey(key),
        )
      ) {
        throw new Error(`${label} leaks private field: ${path}.${key}`)
      }
      visit(entryValue, `${path}.${key}`)
    }
  }
  visit(value, "$")
}
