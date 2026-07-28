import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  PREFLIGHT_NON_CERTIFICATION_NOTICE,
  runGoMatchJobOnce,
  runPreflight,
} from "./preflight.js"

describe("v1.17 preflight contract", () => {
  it("stops a stale capability artifact before database startup", async () => {
    let databaseStarts = 0
    const lines: string[] = []

    const code = await runPreflight(["--skip-redis", "--skip-web"], {
      checkCapabilityArtifact: () => ["STALE_ARTIFACT_BYTES"],
      createPool: () => {
        databaseStarts += 1
        throw new Error("database must not start")
      },
      writeLine: (line) => lines.push(line),
    })

    expect(code).toBe(1)
    expect(databaseStarts).toBe(0)
    expect(lines.join("\n")).toMatch(
      /STALE_ARTIFACT_BYTES|capability artifact/iu,
    )
  })

  it("states that operational preflight cannot certify a counted lane", () => {
    expect(PREFLIGHT_NON_CERTIFICATION_NOTICE).toMatch(
      /does not certify.*counted runtime lane/iu,
    )
    expect(PREFLIGHT_NON_CERTIFICATION_NOTICE).toMatch(
      /contract-only|operational smoke/iu,
    )
  })

  it("uses the Go-owned service path and never revives the retired TypeScript worker", () => {
    const source = readFileSync(
      new URL("./preflight.ts", import.meta.url),
      "utf8",
    )
    expect(source).not.toMatch(/runWorkerOnce|apps\/worker\/src\/runner/iu)
    expect(source).toContain("/internal/match-jobs/run-once")
    expect(source).toContain("COWARDS_GO_BACKEND_INTERNAL_TOKEN")
  })

  it("fails before database mutation when Go-owned orchestration is absent", async () => {
    let databaseStarts = 0
    const lines: string[] = []
    const code = await runPreflight(["--skip-redis", "--skip-web"], {
      checkCapabilityArtifact: () => [],
      environment: {},
      createPool: () => {
        databaseStarts += 1
        throw new Error("database must not start")
      },
      writeLine: (line) => lines.push(line),
    })

    expect(code).toBe(1)
    expect(databaseStarts).toBe(0)
    expect(lines.join("\n")).toMatch(/Go-owned Match orchestration/iu)
    expect(lines.join("\n")).toMatch(/retired TypeScript worker/iu)
    expect(lines.join("\n")).toMatch(
      /authenticated.*no-commit.*sourceValidation.*compilation.*artifactValidation.*conformance/iu,
    )
  })

  it("operationally creates, verifies, and folds fail-closed signed preflight receipts", () => {
    const source = readFileSync(
      new URL("./preflight.ts", import.meta.url),
      "utf8",
    )
    expect(source).toContain("createAuthenticatedRuntimePreflightRequestV117")
    expect(source).toContain("createAuthenticatedRuntimePreflightReceiptV117")
    expect(source).toContain("verifyRuntimePreflightRequestV117")
    expect(source).toContain("verifyRuntimePreflightReceiptV117")
    expect(source).toContain("serializeRuntimePreflightRequestV117")
    expect(source).toContain("serializeRuntimePreflightReceiptV117")
    expect(source).not.toContain("foldPreflightLedgerV117(profile, [])")
  })

  it("rejects credential-bearing or non-origin Go URLs before database access", async () => {
    for (const goBackendUrl of [
      "http://user:password@127.0.0.1:8087",
      "file:///tmp/go.sock",
      "http://127.0.0.1:8087/internal?token=private",
    ]) {
      let databaseStarts = 0
      await expect(
        runPreflight(["--skip-redis", "--skip-web"], {
          checkCapabilityArtifact: () => [],
          environment: {
            COWARDS_GO_BACKEND_URL: goBackendUrl,
            COWARDS_GO_BACKEND_INTERNAL_TOKEN: "private-token",
          },
          createPool: () => {
            databaseStarts += 1
            throw new Error("database must not start")
          },
          writeLine: () => undefined,
        }),
      ).rejects.toThrow(/HTTP\(S\) origin/iu)
      expect(databaseStarts).toBe(0)
    }
  })

  it("rejects credential-bearing or non-origin web URLs before database access", async () => {
    for (const webUrl of [
      "http://user:password@127.0.0.1:3000",
      "file:///tmp/replay.html",
      "http://127.0.0.1:3000/private?token=never-print",
    ]) {
      let databaseStarts = 0
      await expect(
        runPreflight(["--skip-redis"], {
          checkCapabilityArtifact: () => [],
          environment: {
            COWARDS_WEB_URL: webUrl,
          },
          createPool: () => {
            databaseStarts += 1
            throw new Error("database must not start")
          },
          writeLine: () => undefined,
        }),
      ).rejects.toThrow(/HTTP\(S\) origin/iu)
      expect(databaseStarts).toBe(0)
    }
  })

  it("redacts arbitrary check failures from default output", async () => {
    const secret = "postgresql://admin:password@private.internal/cowards"
    const lines: string[] = []
    const code = await runPreflight(["--skip-redis", "--skip-web"], {
      checkCapabilityArtifact: () => {
        throw new Error(`driver failed at ${secret}`)
      },
      environment: {},
      createPool: () => {
        throw new Error("database must not start")
      },
      writeLine: (line) => lines.push(line),
    })

    expect(code).toBe(1)
    expect(lines.join("\n")).toMatch(/details are intentionally redacted/iu)
    expect(lines.join("\n")).not.toContain(secret)
    expect(lines.join("\n")).not.toContain("private.internal")
  })

  it("sends an exact allowlist without redirects and rejects foreign or terminal results", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const acceptedFetch: typeof globalThis.fetch = async (input, init) => {
      calls.push({ url: String(input), init: init ?? {} })
      return new globalThis.Response(
        JSON.stringify({ status: "complete", matchId: "match:allowed" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )
    }
    await expect(
      runGoMatchJobOnce(
        {
          goBackendUrl: "http://127.0.0.1:8087",
          goBackendInternalToken: "private-token",
        },
        ["match:allowed"],
        acceptedFetch,
      ),
    ).resolves.toBe("complete")
    expect(calls).toHaveLength(1)
    expect(calls[0]?.url).toBe(
      "http://127.0.0.1:8087/internal/match-jobs/run-once",
    )
    expect(calls[0]?.init).toMatchObject({
      method: "POST",
      redirect: "error",
      body: '{"matchIds":["match:allowed"]}',
      headers: {
        "Content-Type": "application/json",
        "X-Cowards-Internal-Token": "private-token",
      },
    })
    expect(calls[0]?.init.signal).toBeInstanceOf(globalThis.AbortSignal)

    for (const responseBody of [
      { status: "complete", matchId: "match:foreign" },
      { status: "failed_system", matchId: "match:allowed" },
      { status: "invented", matchId: "match:allowed" },
    ]) {
      const fetchResult: typeof globalThis.fetch = async () =>
        new globalThis.Response(JSON.stringify(responseBody), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      await expect(
        runGoMatchJobOnce(
          {
            goBackendUrl: "http://127.0.0.1:8087",
            goBackendInternalToken: "private-token",
          },
          ["match:allowed"],
          fetchResult,
        ),
      ).rejects.toThrow(/allowlist|terminal system failure|unknown status/iu)
    }
  })

  it("rejects unsafe origins in the exported Go helper before sending its token", async () => {
    let calls = 0
    const fetchImplementation: typeof globalThis.fetch = async () => {
      calls += 1
      throw new Error("must not send")
    }
    for (const goBackendUrl of [
      "http://user:password@127.0.0.1:8087",
      "file:///tmp/go.sock",
      "http://127.0.0.1:8087/private?token=never-send",
    ]) {
      await expect(
        runGoMatchJobOnce(
          {
            goBackendUrl,
            goBackendInternalToken: "private-token",
          },
          ["match:allowed"],
          fetchImplementation,
        ),
      ).rejects.toThrow(/HTTP\(S\) origin/iu)
    }
    expect(calls).toBe(0)
  })

  it("redacts Go transport errors instead of echoing URL or token details", async () => {
    const secret = "private-token-never-print"
    const failingFetch: typeof globalThis.fetch = async () => {
      throw new Error(`redirected token=${secret} to http://attacker.invalid`)
    }
    let message = ""
    try {
      await runGoMatchJobOnce(
        {
          goBackendUrl: "http://127.0.0.1:8087",
          goBackendInternalToken: secret,
        },
        ["match:allowed"],
        failingFetch,
      )
    } catch (error) {
      message = error instanceof Error ? error.message : String(error)
    }
    expect(message).toMatch(/intentionally redacted/iu)
    expect(message).not.toContain(secret)
    expect(message).not.toContain("attacker.invalid")
  })

  it("keeps replay origins and arbitrary crash messages out of default output", () => {
    const source = readFileSync(
      new URL("./preflight.ts", import.meta.url),
      "utf8",
    )
    expect(source).not.toContain("replayUrl.href")
    expect(source).not.toMatch(
      /preflight crashed: \$\{errorMessage\(error\)\}/u,
    )
    expect(source).toContain("dependencies.fetch")
  })
})
