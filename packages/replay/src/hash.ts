import { createHash } from "node:crypto"
import type { JsonValue } from "@cowards/spec"
import type { Chronicle } from "@cowards/spec"
import { normalizeChronicle } from "./normalize.js"

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const sortValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortValue)
  }
  if (!isPlainObject(value)) {
    return value
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => [key, sortValue(entryValue)]),
  )
}

export const stableStringify = (value: JsonValue | unknown): string =>
  JSON.stringify(sortValue(value))

export const createChronicleContentHash = (chronicle: Chronicle) => ({
  algorithm: "sha256" as const,
  normalizedContentHash: createHash("sha256")
    .update(stableStringify(normalizeChronicle(chronicle)))
    .digest("hex"),
})
