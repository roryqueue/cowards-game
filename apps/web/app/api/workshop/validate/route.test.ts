import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { afterEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route.js"

const hashSource = (source: string): string =>
  createHash("sha256").update(source).digest("hex")

const validValidation = (source: string) => ({
  valid: true,
  errors: [],
  warnings: [],
  sourceBytes: Buffer.byteLength(source),
  forbiddenPatterns: [],
  sourceHash: hashSource(source),
  runtimeVersion: "runtime-v1",
  engineCompatibility: {
    spec: "cowards-rules-v1.4",
    engine: "engine-v1",
  },
})

const request = (body: unknown): Request =>
  new Request("http://test.local/api/workshop/validate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })

describe("/api/workshop/validate", () => {
  const originalUrl = process.env.COWARDS_RUNTIME_SERVICE_URL

  afterEach(() => {
    vi.restoreAllMocks()
    if (originalUrl === undefined) {
      delete process.env.COWARDS_RUNTIME_SERVICE_URL
    } else {
      process.env.COWARDS_RUNTIME_SERVICE_URL = originalUrl
    }
  })

  it("routes Python through runtime-service provider validation", async () => {
    process.env.COWARDS_RUNTIME_SERVICE_URL = "http://runtime.test"
    const source = "def select_activations(input): pass"
    const validation = validValidation(source)
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        ok: true,
        kind: "strategyValidation",
        sourceFormat: "python",
        provider: {
          id: "strategy-language-provider-python",
          contractVersion: "strategy-language-provider-contract-v1.33",
          runtimeAbiVersion: "strategy-runtime-abi-v1.14",
        },
        validation,
        metadata: {
          sourceArtifact: {
            hash: "hash:artifact",
            bytes: 300,
            bytesBase64: "SHOULD_NOT_LEAK",
          },
          providerValidation: {
            providerId: "strategy-language-provider-python",
            contractVersion: "strategy-language-provider-contract-v1.33",
            sourceHash: validation.sourceHash,
            sourceBytes: validation.sourceBytes,
            artifactHash: "hash:artifact",
            artifactBytes: 300,
            proof: "hmac-sha256:secret",
          },
        },
      }),
    )

    const response = await POST(
      request({
        source,
        sourceFormat: "python",
      }),
    )
    const body = await response.json()

    expect(fetchMock).toHaveBeenCalledWith(
      "http://runtime.test/validate-strategy",
      expect.objectContaining({
        body: expect.stringContaining('"sourceFormat":"python"'),
      }),
    )
    expect(body.checker.status).toBe("ready")
    expect(body.checker.contractVersion).toBe("workshop-checker-v1.34")
    expect(body.checker.artifact.hash).toBe("hash:artifact")
    expect(JSON.stringify(body.checker)).not.toContain("SHOULD_NOT_LEAK")
    expect(JSON.stringify(body.checker)).not.toContain("hmac-sha256")
  })

  it("returns a calm runtime-service unavailable checker state", async () => {
    delete process.env.COWARDS_RUNTIME_SERVICE_URL

    const response = await POST(
      request({ source: "source", sourceFormat: "rust" }),
    )
    const body = await response.json()

    expect(body.checker.status).toBe("runtime_service_unavailable")
    expect(body.checker.runtimeService.availability).toBe("unavailable")
    expect(body.checker.diagnostics[0].message).toContain(
      "has not been judged invalid",
    )
  })

  it("schema-guards malformed runtime-service responses", async () => {
    process.env.COWARDS_RUNTIME_SERVICE_URL = "http://runtime.test"
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ ok: true, kind: "unexpected" }),
    )

    const response = await POST(
      request({ source: "source", sourceFormat: "typescript" }),
    )
    const body = await response.json()

    expect(body.checker.status).toBe("system_unavailable")
    expect(body.checker.diagnostics[0].category).toBe("system_unavailable")
  })

  it("rejects stale runtime-service validation identities", async () => {
    process.env.COWARDS_RUNTIME_SERVICE_URL = "http://runtime.test"
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        ok: true,
        kind: "strategyValidation",
        sourceFormat: "typescript",
        validation: validValidation("different source"),
      }),
    )

    const response = await POST(
      request({ source: "current source", sourceFormat: "typescript" }),
    )
    const body = await response.json()

    expect(body.checker.status).toBe("system_unavailable")
    expect(body.checker.source.hash).toBe(hashSource("current source"))
  })

  it("coalesces identical in-flight validation requests", async () => {
    process.env.COWARDS_RUNTIME_SERVICE_URL = "http://runtime.test"
    const source = "same"
    const validation = validValidation(source)
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () =>
        Response.json({
          ok: true,
          kind: "strategyValidation",
          sourceFormat: "zig",
          validation,
          metadata: {
            compiledArtifact: {
              hash: "hash:wasm",
              bytes: 128,
            },
            providerValidation: {
              providerId: "strategy-language-provider-zig-wasi",
              contractVersion: "strategy-language-provider-contract-v1.33",
              sourceHash: validation.sourceHash,
              sourceBytes: validation.sourceBytes,
              artifactHash: "hash:wasm",
              artifactBytes: 128,
              proof: "hmac-sha256:secret",
            },
          },
        }),
      )

    const [first, second] = await Promise.all([
      POST(request({ source, sourceFormat: "zig" })),
      POST(request({ source, sourceFormat: "zig" })),
    ])

    expect((await first.json()).checker.status).toBe("ready")
    expect((await second.json()).checker.status).toBe("ready")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
