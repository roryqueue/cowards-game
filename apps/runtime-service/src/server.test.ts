import { once } from "node:events"
import type { AddressInfo } from "node:net"
import { afterEach, describe, expect, it } from "vitest"
import {
  RUNTIME_EXECUTION_SERVICE_VERSION,
  RuntimeExecutionServiceResponseSchema,
} from "@cowards/spec"
import { createRuntimeServiceConfig } from "./runtime-config.js"
import { createRuntimeExecutionHttpServer } from "./server.js"

process.env.COWARDS_PROVIDER_VALIDATION_SECRET =
  "cowards-provider-validation-test-secret-v1.32"

const runtimeConfig = createRuntimeServiceConfig({
  strategyExecutionAdapter: "worker-thread",
})

const servers: ReturnType<typeof createRuntimeExecutionHttpServer>[] = []

const withServer = async (
  bodyLimitBytes = 1024,
): Promise<{
  url: string
  close: () => Promise<void>
}> => {
  const server = createRuntimeExecutionHttpServer({
    runtimeConfig,
    bodyLimitBytes,
  })
  servers.push(server)
  server.listen(0, "127.0.0.1")
  await once(server, "listening")
  const address = server.address() as AddressInfo
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      }),
  }
}

afterEach(async () => {
  await Promise.allSettled(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve) => {
          if (!server.listening) {
            resolve()
            return
          }
          server.close(() => resolve())
        }),
    ),
  )
})

describe("runtime execution HTTP boundary", () => {
  it("health labels the current HTTP+JSON isolated JS/TS runtime implementation", async () => {
    const server = await withServer()
    const response = await fetch(`${server.url}/health`)
    const body = (await response.json()) as Record<string, unknown>

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      ok: true,
      service: RUNTIME_EXECUTION_SERVICE_VERSION,
      boundaryName: "Strategy Execution Service / Runtime Broker",
      implementationLabel: "isolated JS/TS runtime service",
      transportBinding: "HTTP+JSON",
      backendAuthority: false,
    })
  })

  it("validates Python through the provider validator instead of backend string scanning", async () => {
    const server = await withServer(8 * 1024)
    const validSource = `
def select_activations(input):
    return {"activationOrders": [], "strategyMemory": input["strategyMemory"]}

def soldier_brain(input):
    return {"action": {"type": "TURN_TO_STONE"}, "soldierMemory": input["soldierMemory"]}
`
    const valid = await fetch(`${server.url}/validate-strategy`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFormat: "python",
        source: validSource,
        strategyId: "strategy:python",
      }),
    })
    const validBody = (await valid.json()) as Record<string, unknown>

    expect(valid.status).toBe(200)
    expect(validBody).toMatchObject({
      ok: true,
      kind: "strategyValidation",
      sourceFormat: "python",
      provider: {
        id: "strategy-language-provider-python",
      },
      metadata: {
        tags: ["python", "counted", "provider"],
        providerValidation: {
          providerId: "strategy-language-provider-python",
          contractVersion: "strategy-language-provider-contract-v1.32",
          sourceHash: expect.any(String),
          sourceBytes: expect.any(Number),
          proof: expect.stringMatching(/^hmac-sha256:[0-9a-f]{64}$/),
        },
      },
    })
    expect(JSON.stringify(validBody)).not.toContain("NON_COUNTED_RUNTIME")

    const invalid = await fetch(`${server.url}/validate-strategy`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceFormat: "python",
        source:
          "# def select_activations(input): pass\n# def soldier_brain(input): pass\nimport\tos\n",
      }),
    })
    const invalidBody = (await invalid.json()) as Record<string, unknown>

    expect(invalid.status).toBe(422)
    expect(invalidBody).toMatchObject({
      ok: false,
      kind: "strategyValidation",
      sourceFormat: "python",
    })
    expect(JSON.stringify(invalidBody)).toContain("IMPORT_NOT_ALLOWED")
    expect(JSON.stringify(invalidBody)).toContain("MISSING_SELECT_ACTIVATIONS")
    expect(JSON.stringify(invalidBody)).not.toContain("python_validation_host.py")
  })

  it("exposes no product API routes outside health and execute-match", async () => {
    const server = await withServer()
    for (const route of [
      "/api/matches",
      "/public/strategies/strategy:demo",
      "/matchsets/match-set:demo",
      "/session",
      "/jobs/claim",
    ]) {
      const response = await fetch(`${server.url}${route}`)
      const body = await response.text()
      expect(response.status).toBe(404)
      expect(body).toContain("not_found")
      expect(body).not.toContain("Chronicle")
      expect(body).not.toContain("MatchSet scoring")
    }
  })

  it("returns schema-valid malformed-request envelopes for bad JSON and body limit failures", async () => {
    const server = await withServer(8)
    const badJson = await fetch(`${server.url}/execute-match`, {
      method: "POST",
      body: "{not-json",
    })
    const oversized = await fetch(`${server.url}/execute-match`, {
      method: "POST",
      body: JSON.stringify({ tooLarge: "x".repeat(64) }),
    })

    for (const response of [badJson, oversized]) {
      const body = await response.json()
      expect(response.status).toBe(400)
      expect(RuntimeExecutionServiceResponseSchema.parse(body)).toMatchObject({
        ok: false,
        kind: "systemFailure",
        systemFailure: {
          code: "MALFORMED_REQUEST",
          retryable: false,
        },
      })
      expect(JSON.stringify(body)).not.toContain("StrategyMemory")
      expect(JSON.stringify(body)).not.toContain("postgres://")
      expect(JSON.stringify(body)).not.toContain("/Users/")
      expect(JSON.stringify(body)).not.toContain("token=")
    }
  })
})
