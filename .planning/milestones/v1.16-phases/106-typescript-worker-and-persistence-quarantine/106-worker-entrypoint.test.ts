import { spawnSync } from "node:child_process"
import { describe, expect, it } from "vitest"

describe("Phase 106 worker entrypoint quarantine", () => {
  it("rejects lifecycleOwner=typescript as normal startup before the worker becomes ready", () => {
    const result = spawnSync(
      "pnpm",
      ["--filter", "@cowards/worker", "exec", "tsx", "src/index.ts"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: {
          ...process.env,
          COWARDS_MATCH_JOB_LIFECYCLE_OWNER: "typescript",
          COWARDS_TYPESCRIPT_WORKER_PURPOSE: "",
          DATABASE_URL: "postgres://127.0.0.1:1/should-not-be-used",
          PGHOST: "127.0.0.1",
          PGPORT: "1",
        },
        timeout: 5_000,
      },
    )

    const output = `${result.stdout}\n${result.stderr}`

    expect(result.error).toBeUndefined()
    expect(result.signal).toBeNull()
    expect(result.status).not.toBe(0)
    expect(output).toContain(
      "TypeScript Match job claiming is disabled for normal backend ownership",
    )
    expect(output).not.toContain(
      "Coward's Game TypeScript worker quarantine ready",
    )
  })
})
