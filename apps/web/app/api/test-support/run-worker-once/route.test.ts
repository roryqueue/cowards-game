import { describe, expect, it } from "vitest"
import { assertPublicOutputLeakSafe } from "@cowards/spec"
import {
  createRunWorkerOnceHandler,
  isWorkerTestSupportEnabled,
} from "./route.js"

describe("run-worker-once test-support route", () => {
  it("is unavailable outside explicit test support environments", async () => {
    expect(isWorkerTestSupportEnabled({})).toBe(false)

    const response = await createRunWorkerOnceHandler({
      env: {},
      runWorkerProcess: async () => {
        throw new Error("should not run")
      },
    })()

    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body).toEqual({ error: "Not found" })
    expect(() => assertPublicOutputLeakSafe(body)).not.toThrow()
  })

  it("returns parsed worker execution payloads when enabled", async () => {
    const response = await createRunWorkerOnceHandler({
      env: { PLAYWRIGHT_TEST: "1" },
      runWorkerProcess: async () => ({
        stdout:
          'worker log\n{"status":"ok","workerId":"worker:test","executed":["completed"]}\n',
        stderr: "",
      }),
    })()

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual({
      status: "ok",
      workerId: "worker:test",
      executed: ["completed"],
    })
    expect(() => assertPublicOutputLeakSafe(body)).not.toThrow()
  })

  it("fails loudly when the service-backed worker process cannot run", async () => {
    const response = await createRunWorkerOnceHandler({
      env: { PLAYWRIGHT_TEST: "1" },
      runWorkerProcess: async () => {
        throw new Error("connect ECONNREFUSED 127.0.0.1:5432")
      },
    })()

    expect(response.status).toBe(503)
    const body = await response.json()
    expect(body).toMatchObject({
      status: "service_unavailable",
      layer: "worker_execution",
      error: "connect ECONNREFUSED 127.0.0.1:5432",
    })
    expect(() => assertPublicOutputLeakSafe(body)).not.toThrow()
  })

  it("returns bounded worker diagnostics on process failure", async () => {
    const error = new Error("worker exited")
    Object.assign(error, {
      code: 1,
      stderr: "stack trace\n".repeat(400),
      stdout: "worker booted",
    })

    const response = await createRunWorkerOnceHandler({
      env: { PLAYWRIGHT_TEST: "1" },
      runWorkerProcess: async () => {
        throw error
      },
    })()

    expect(response.status).toBe(503)
    const body = await response.json()
    expect(body).toMatchObject({
      status: "service_unavailable",
      layer: "worker_execution",
      error: "worker exited",
      code: 1,
      outputDiagnostic: "worker booted",
      errorDiagnostic: "redacted diagnostic omitted",
    })
    expect(JSON.stringify(body)).not.toContain("stack trace")
    expect(JSON.stringify(body)).not.toContain("stderr")
    expect(() => assertPublicOutputLeakSafe(body)).not.toThrow()
  })
})
