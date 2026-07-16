import { afterEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route.js"
import { workshopServer } from "../../../workshop/server.js"

const request = (body: unknown): Request =>
  new Request("http://test.local/api/workshop/revisions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })

describe("/api/workshop/revisions", () => {
  const originalUrl = process.env.COWARDS_RUNTIME_SERVICE_URL
  const originalPrivateArtifactToken =
    process.env.COWARDS_RUNTIME_SERVICE_PRIVATE_ARTIFACT_TOKEN

  afterEach(() => {
    vi.restoreAllMocks()
    if (originalUrl === undefined) {
      delete process.env.COWARDS_RUNTIME_SERVICE_URL
    } else {
      process.env.COWARDS_RUNTIME_SERVICE_URL = originalUrl
    }
    if (originalPrivateArtifactToken === undefined) {
      delete process.env.COWARDS_RUNTIME_SERVICE_PRIVATE_ARTIFACT_TOKEN
    } else {
      process.env.COWARDS_RUNTIME_SERVICE_PRIVATE_ARTIFACT_TOKEN =
        originalPrivateArtifactToken
    }
  })

  it("returns a calm unavailable response when runtime-service fetch fails", async () => {
    process.env.COWARDS_RUNTIME_SERVICE_URL = "http://runtime.test"
    process.env.COWARDS_RUNTIME_SERVICE_PRIVATE_ARTIFACT_TOKEN = "private-token"
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"))

    const response = await POST(
      request({ source: "export default {}", sourceFormat: "rust" }),
    )
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.error).toContain("could not reach runtime-service")
    expect(body.error).toContain("has not been judged invalid")
  })

  it("returns a public system response when runtime-service JSON is malformed", async () => {
    process.env.COWARDS_RUNTIME_SERVICE_URL = "http://runtime.test"
    process.env.COWARDS_RUNTIME_SERVICE_PRIVATE_ARTIFACT_TOKEN = "private-token"
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("not json", { status: 200 }),
    )

    const response = await POST(
      request({ source: "export default {}", sourceFormat: "zig" }),
    )
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.error).toContain("unsupported response")
    expect(body.error).not.toContain("not json")
  })

  it("fails closed before fetch when private artifact authorization is unavailable", async () => {
    process.env.COWARDS_RUNTIME_SERVICE_URL = "http://runtime.test"
    delete process.env.COWARDS_RUNTIME_SERVICE_PRIVATE_ARTIFACT_TOKEN
    const fetchSpy = vi.spyOn(globalThis, "fetch")

    const response = await POST(
      request({ source: "export default {}", sourceFormat: "typescript" }),
    )
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.error).toContain("could not reach runtime-service")
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("requests private admission evidence server to server and returns only public-safe metadata", async () => {
    const source = "export default { selectActivations() { return [] } }"
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      sourceBytes: source.length,
      forbiddenPatterns: [],
      sourceHash: "source-hash",
      runtimeVersion: "runtime-js-v1",
      engineCompatibility: {
        spec: "cowards-rules-v1.4",
        engine: "engine-v1",
      },
    }
    process.env.COWARDS_RUNTIME_SERVICE_URL = "http://runtime.test"
    process.env.COWARDS_RUNTIME_SERVICE_PRIVATE_ARTIFACT_TOKEN = "private-token"
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        ok: true,
        kind: "strategyValidation",
        sourceFormat: "typescript",
        runtime: { abiVersion: "strategy-runtime-abi-v1.17" },
        validation,
        engineCompatibility: validation.engineCompatibility,
        metadata: {
          sourceArtifact: {
            bytesBase64: "cHJpdmF0ZQ==",
            sourceIdentity: { identityVersion: "strategy-source-identity-v2" },
          },
          providerValidation: { proof: "sha256:private-proof" },
        },
      }),
    )
    const submitSpy = vi
      .spyOn(workshopServer, "submitSource")
      .mockImplementation(async (input) => {
        expect(input.runtimeServiceValidated).toBe(true)
        expect(input.metadata).toMatchObject({
          sourceArtifact: {
            bytesBase64: "cHJpdmF0ZQ==",
            sourceIdentity: {
              identityVersion: "strategy-source-identity-v2",
            },
          },
        })
        return {
          ok: true,
          validation,
          revision: {
            id: "strategy-revision:public",
            strategyId: "strategy:local-workshop",
            sourceHash: validation.sourceHash,
            sourceBytes: validation.sourceBytes,
            sourceFormat: "typescript",
            valid: true,
            validation,
            metadata: { providerValidation: { proof: "sha256:public-proof" } },
            runtimeSemantics: {
              runtimeTarget: "runtime-js",
              languageLabel: "TypeScript",
              countedPlayEligible: true,
              countedPlayLabel: "Counted eligible",
              countedPlayReason: "Provider validated.",
              restrictions: [],
            },
            createdAt: "test",
            usedInMatches: 0,
          },
        } as never
      })

    const response = await POST(request({ source }))
    const serialized = await response.text()

    expect(response.status).toBe(201)
    expect(submitSpy).toHaveBeenCalledOnce()
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://runtime.test/validate-strategy",
      expect.objectContaining({
        headers: {
          "content-type": "application/json",
          "x-cowards-private-artifact-token": "private-token",
        },
        body: JSON.stringify({
          sourceFormat: "typescript",
          source,
          includePrivateArtifact: true,
        }),
      }),
    )
    expect(serialized).not.toContain(source)
    expect(serialized).not.toContain("bytesBase64")
    expect(serialized).not.toContain("sourceIdentity")
    expect(serialized).not.toContain("private-proof")
    expect(serialized).not.toContain("private-token")
  })
})
