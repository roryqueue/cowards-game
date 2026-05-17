import { describe, expect, it } from "vitest"
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
    await expect(response.json()).resolves.toEqual({ error: "Not found" })
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
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      workerId: "worker:test",
      executed: ["completed"],
    })
  })

  it("fails loudly when the service-backed worker process cannot run", async () => {
    const response = await createRunWorkerOnceHandler({
      env: { PLAYWRIGHT_TEST: "1" },
      runWorkerProcess: async () => {
        throw new Error("connect ECONNREFUSED 127.0.0.1:5432")
      },
    })()

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({
      status: "service_unavailable",
      error: "connect ECONNREFUSED 127.0.0.1:5432",
    })
  })
})
