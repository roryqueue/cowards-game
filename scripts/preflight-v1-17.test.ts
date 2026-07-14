import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
/* eslint-disable-next-line no-restricted-imports -- Script tests exercise the source contract before package build output exists. */
import {
  RUNTIME_ABI_V1_17,
  type RuntimeAbiV117PreflightLedgerReceipt,
  type RuntimeAbiV117PreflightProfile,
} from "../packages/spec/src/runtime.js"
import {
  PREFLIGHT_NON_CERTIFICATION_NOTICE,
  foldPreflightLedgerV117,
  runGoMatchJobOnce,
  runPreflight,
} from "./preflight.js"

const hash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`

const exactReceipt = (
  profile: RuntimeAbiV117PreflightProfile,
): RuntimeAbiV117PreflightLedgerReceipt => {
  const limits = RUNTIME_ABI_V1_17.budgets.preflight.profiles[profile]
  return {
    domain: "preflight",
    profile,
    prestateRevision: 0,
    operationId: `preflight:${profile}:0`,
    requestIdentity: hash("a"),
    evidenceIdentity: hash("b"),
    attribution: "proven_strategy",
    counters: {
      wallMilliseconds: {
        status: "measured",
        delta: limits.wallMilliseconds,
        cumulative: limits.wallMilliseconds,
      },
      computeFuel: {
        status: "measured",
        delta: limits.computeFuel,
        cumulative: limits.computeFuel,
      },
      inputBytes: {
        status: "measured",
        delta: limits.inputBytes,
        cumulative: limits.inputBytes,
      },
      outputBytes: {
        status: "measured",
        delta: limits.outputBytes,
        cumulative: limits.outputBytes,
      },
      stderrBytes: {
        status: "measured",
        delta: limits.stderrBytes,
        cumulative: limits.stderrBytes,
      },
    },
    memory: {
      status: "measured",
      peakBytes: limits.memoryBytes,
      cumulativePeakBytes: limits.memoryBytes,
    },
    process: {
      status: "verified",
      processes: limits.processes,
      threads: limits.threads,
      children: limits.children,
    },
    capabilities: {
      status: "verified",
      filesystem: limits.filesystem,
      network: limits.network,
    },
    accountingEvidence: {
      status: "verified",
      signatureVerified: true,
      monotonic: true,
    },
  }
}

describe("v1.17 preflight contract", () => {
  it.each(
    Object.keys(
      RUNTIME_ABI_V1_17.budgets.preflight.profiles,
    ) as RuntimeAbiV117PreflightProfile[],
  )("folds one separate exact-boundary %s ledger", (profile) => {
    const folded = foldPreflightLedgerV117(profile, [exactReceipt(profile)])

    expect(folded.outcomes).toHaveLength(1)
    expect(folded.outcomes[0]).toMatchObject({
      kind: "success",
      committed: true,
      replayed: false,
    })
    expect(folded.ledger).toMatchObject({
      domain: "preflight",
      profile,
      revision: 1,
      cumulative: { operationCount: 1 },
    })
    expect(Object.isFrozen(folded.ledger)).toBe(true)
  })

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
      /separate sourceValidation, compilation, artifactValidation, conformance ledgers with zero candidate-resource receipts/iu,
    )
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
