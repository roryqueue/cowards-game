import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { assertPublicOutputLeakSafe } from "@cowards/spec"
import { createRunWorkerOnceHandler } from "./route.js"

describe("retired run-worker-once test-support route", () => {
  it("is unavailable in every environment with a public-safe response", async () => {
    const response = await createRunWorkerOnceHandler()()
    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body).toEqual({ error: "Not found" })
    expect(() => assertPublicOutputLeakSafe(body)).not.toThrow()
  })

  it("contains no process, database, runtime, or worker execution route", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "apps/web/app/api/test-support/run-worker-once/route.ts",
      ),
      "utf8",
    )
    for (const forbidden of [
      "execFile",
      "createDatabasePool",
      "runWorkerOnce(",
      "executeMatch(",
      "runMatch(",
      "COWARDS_TYPESCRIPT_WORKER_PURPOSE",
    ]) {
      expect(source).not.toContain(forbidden)
    }
  })
})
