import { describe, expect, it } from "vitest"
import {
  PublicStrategyRuntimeMetadataSchema,
  STRATEGY_RUNTIME_ABI_VERSION,
} from "./index.js"

const metadataFor = (abiVersion: string) => ({
  abiVersion,
  language: { id: "typescript", version: "5.9.3" },
  adapter: { id: "runtime-js-worker-thread", version: "0.1.0" },
  package: { mode: "none", entrypoint: "strategy.ts" },
  requiredCapabilities: [],
})

describe("public Strategy runtime metadata versioning", () => {
  it.each([
    STRATEGY_RUNTIME_ABI_VERSION,
    "strategy-runtime-abi-v1.17",
    "strategy-runtime-abi-v1.14",
  ])("admits exact %s read-only evidence", (abiVersion) => {
    expect(
      PublicStrategyRuntimeMetadataSchema.safeParse(metadataFor(abiVersion))
        .success,
    ).toBe(true)
  })

  it.each(["strategy-runtime-abi-v1.18", "strategy-runtime-abi-unknown"])(
    "rejects unregistered %s evidence",
    (abiVersion) => {
      expect(
        PublicStrategyRuntimeMetadataSchema.safeParse(metadataFor(abiVersion))
          .success,
      ).toBe(false)
    },
  )
})
