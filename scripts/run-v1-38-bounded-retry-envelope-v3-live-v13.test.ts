import { describe, expect, it } from "vitest"
import { fileURLToPath } from "node:url"
import path from "node:path"
import {
  V138_LIVE_V13_PATHS,
  authenticateV138LiveV13SourceOnly,
} from "./run-v1-38-bounded-retry-envelope-v3-live-v13.js"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

describe("Plan 262-121 closed live-v13 successor", () => {
  it("requires an additive live-v13 owner that records Plan120 v2 as process-invalid", () => {
    expect(V138_LIVE_V13_PATHS.source).toBe(
      "scripts/run-v1-38-bounded-retry-envelope-v3-live-v13.ts",
    )
    expect(authenticateV138LiveV13SourceOnly(repoRoot)).toMatchObject({
      plan120PublicationCommit: "c7390cf521234e13e6c09c784df25f65a722aa23",
      plan120Disposition: "process_invalid_local_context_misbinding",
      supersededV2Plan110Eligible: false,
      producerCalls: 0,
      readinessInvoked: false,
      liveInvoked: false,
      downstreamAuthority: "denied",
    })
  })
})
