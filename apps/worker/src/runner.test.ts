import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"
import path from "node:path"
import { describe, expect, it, vi } from "vitest"
import type { Pool } from "pg"
import type { WorkerRunnerDependencies } from "./runner.js"
import {
  assertTypeScriptWorkerEntrypointAllowed,
  assertTypeScriptWorkerJobOwnershipAllowed,
  runWorkerLoop,
  runWorkerOnce,
  TypeScriptWorkerRetiredError,
} from "./runner.js"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const pool = {} as Pool

const RETIRED_CODE = "TYPESCRIPT_WORKER_RETIRED"
const RETIRED_MESSAGE = "Direct TypeScript Match worker execution is retired."

const allDependencies = () => ({
  claimNextMatchJob: vi.fn(),
  loadRunMatchInput: vi.fn(),
  createRuntimeFromRevision: vi.fn(),
  createRuntimeConfig: vi.fn(),
  buildChronicleFromMatch: vi.fn(),
  completeMatch: vi.fn(),
  recordAttemptFailure: vi.fn(),
  mutateMatchFailure: vi.fn(),
  recordPlayerPenalty: vi.fn(),
})

const expectRetired = (run: () => unknown): void => {
  try {
    run()
    throw new Error("Expected TypeScript worker retirement")
  } catch (error) {
    expect(error).toBeInstanceOf(TypeScriptWorkerRetiredError)
    expect(error).toMatchObject({
      name: "TypeScriptWorkerRetiredError",
      code: RETIRED_CODE,
      message: RETIRED_MESSAGE,
    })
  }
}

describe("retired direct TypeScript Match worker", () => {
  it.each([
    undefined,
    null,
    {},
    { lifecycleOwner: "go", workerPurpose: "normal" },
    { lifecycleOwner: "go", workerPurpose: "rollback" },
    { lifecycleOwner: "go", workerPurpose: "test" },
    { lifecycleOwner: "go", workerPurpose: "parity" },
    { lifecycleOwner: "typescript", workerPurpose: "normal" },
    { lifecycleOwner: "typescript", workerPurpose: "rollback" },
    { lifecycleOwner: "unspecified", workerPurpose: "test" },
    { lifecycleOwner: "unknown", workerPurpose: "surprise" },
    "malformed",
  ])("rejects every direct ownership config before inspection: %j", (config) => {
    expectRetired(() =>
      assertTypeScriptWorkerJobOwnershipAllowed(config as never),
    )
  })

  it.each([
    undefined,
    {},
    { COWARDS_MATCH_JOB_LIFECYCLE_OWNER: "go" },
    { COWARDS_BACKEND_OWNER: "typescript" },
    { COWARDS_TYPESCRIPT_WORKER_PURPOSE: "normal" },
    { COWARDS_TYPESCRIPT_WORKER_PURPOSE: "rollback" },
    { COWARDS_TYPESCRIPT_WORKER_PURPOSE: "test" },
    { COWARDS_TYPESCRIPT_WORKER_PURPOSE: "parity" },
    {
      COWARDS_MATCH_JOB_LIFECYCLE_OWNER: "typescript",
      COWARDS_TYPESCRIPT_WORKER_PURPOSE: "rollback",
      STRATEGY_EXECUTION_ADAPTER: "subprocess",
      NODE_ENV: "test",
    },
  ])("rejects every executable environment with one stable error: %j", (env) => {
    expectRetired(() =>
      assertTypeScriptWorkerEntrypointAllowed(env as never),
    )
  })

  it.each([
    undefined,
    null,
    {},
    { workerId: "worker:normal" },
    {
      workerId: "worker:rollback",
      jobOwnership: { lifecycleOwner: "go", workerPurpose: "rollback" },
    },
    {
      workerId: "worker:test",
      jobOwnership: { lifecycleOwner: "typescript", workerPurpose: "test" },
      runtimeConfig: { metadata: { id: "forged" } },
    },
    {
      workerId: "worker:parity",
      jobOwnership: { lifecycleOwner: "unspecified", workerPurpose: "parity" },
      once: true,
      matchIds: ["match:target"],
    },
    "malformed",
  ])(
    "rejects runWorkerOnce before claim, input, runtime, Chronicle, or mutation: %j",
    async (options) => {
      const dependencies = allDependencies()

      await expect(
        runWorkerOnce(pool, options as never, dependencies as never),
      ).rejects.toMatchObject({
        code: RETIRED_CODE,
        message: RETIRED_MESSAGE,
      })

      for (const dependency of Object.values(dependencies)) {
        expect(dependency).not.toHaveBeenCalled()
      }
    },
  )

  it("rejects the loop before polling or any injected execution dependency", async () => {
    const dependencies = allDependencies()

    await expect(
      runWorkerLoop(
        pool,
        {
          workerId: "worker:loop",
          pollMs: 0,
          once: true,
          jobOwnership: { lifecycleOwner: "go", workerPurpose: "test" },
        },
        dependencies as never,
      ),
    ).rejects.toMatchObject({ code: RETIRED_CODE })

    for (const dependency of Object.values(dependencies)) {
      expect(dependency).not.toHaveBeenCalled()
    }
  })

  it("keeps the retirement payload public-safe and non-diagnostic", () => {
    let retirement: TypeScriptWorkerRetiredError | undefined
    try {
      assertTypeScriptWorkerEntrypointAllowed({
        DATABASE_URL: "postgres://secret@host/private",
        COWARDS_PROVIDER_VALIDATION_SECRET: "secret",
        COWARDS_TYPESCRIPT_WORKER_PURPOSE: "test",
      })
    } catch (error) {
      retirement = error as TypeScriptWorkerRetiredError
    }

    expect(retirement).toBeDefined()
    const payload = JSON.stringify({
      name: retirement?.name,
      code: retirement?.code,
      message: retirement?.message,
    })
    expect(payload).toBe(
      JSON.stringify({
        name: "TypeScriptWorkerRetiredError",
        code: RETIRED_CODE,
        message: RETIRED_MESSAGE,
      }),
    )
    expect(payload).not.toMatch(
      /postgres|secret|host|source|artifact|memory|objective|credential|stack|diagnostic/i,
    )
  })

  it("asserts retirement before every startup side effect", () => {
    const source = readFileSync(`${__dirname}/index.ts`, "utf8")
    const assertion = source.indexOf("assertTypeScriptWorkerEntrypointAllowed(")
    expect(assertion).toBeGreaterThan(-1)
    for (const effect of [
      "createWorkerRuntimeConfig(",
      "createDatabasePool(",
      "process.once(",
      "console.log(",
      "runWorkerLoop(",
    ]) {
      const offset = source.indexOf(effect)
      expect(offset === -1 || assertion < offset).toBe(true)
    }
  })

  it("launches with one safe retirement payload and no stack or host path", () => {
    const workerRoot = path.resolve(__dirname, "..")
    const tsx = path.resolve(workerRoot, "../../node_modules/.bin/tsx")
    const result = spawnSync(tsx, ["src/index.ts"], {
      cwd: workerRoot,
      encoding: "utf8",
    })

    expect(result.status).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr).toBe(
      `${JSON.stringify({
        code: RETIRED_CODE,
        message: RETIRED_MESSAGE,
      })}\n`,
    )
    expect(result.stderr).not.toMatch(
      /\/Users\/|postgres|database_url|source|artifact|memory|objective|credential|diagnostic|stack/i,
    )
  })

  it("does not accept an executable default dependency set", () => {
    const source = readFileSync(`${__dirname}/runner.ts`, "utf8")
    expect(source).not.toMatch(/const\s+defaultDependencies\s*=/)
    expect(source).not.toMatch(/allowedTypeScriptWorkerPurposes/)
    expect(source).not.toMatch(/workerPurpose\s*===\s*["'](?:rollback|test|parity)/)
  })
})
