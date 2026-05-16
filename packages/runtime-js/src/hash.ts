import { createHash } from "node:crypto"
import type { StrategyRevisionId } from "@cowards/spec"

const sha256Hex = (text: string): string =>
  createHash("sha256").update(text, "utf8").digest("hex")

export const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`
  }

  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(
        ([key, entryValue]) =>
          `${JSON.stringify(key)}:${stableStringify(entryValue)}`,
      )
      .join(",")}}`
  }

  return JSON.stringify(value)
}

export const hashStrategySource = (source: string): string => sha256Hex(source)

export const createStrategyRevisionId = (input: {
  sourceHash: string
  runtimeVersion: string
  specVersion: string
  engineVersion: string
  strategyRevisionVersion: string
  strategyId?: string | undefined
}): StrategyRevisionId =>
  `strategy-revision:${sha256Hex(stableStringify(input))}`
