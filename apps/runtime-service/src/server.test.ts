import { once } from "node:events"
import type { AddressInfo } from "node:net"
import { afterEach, describe, expect, it } from "vitest"
import {
  RUNTIME_EXECUTION_SERVICE_VERSION,
  RuntimeExecutionServiceResponseSchema,
} from "@cowards/spec"
import { createRuntimeServiceConfig } from "./runtime-config.js"
import { createRuntimeExecutionHttpServer } from "./server.js"

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
    }
  })
})
