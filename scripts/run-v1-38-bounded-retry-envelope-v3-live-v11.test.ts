import { execFileSync } from "node:child_process"
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  V138_LIVE_V11_MODES,
  V138_LIVE_V11_PATHS,
  authenticateV138LiveV11SourceOnly,
  executeV138LiveV11Cli,
} from "./run-v1-38-bounded-retry-envelope-v3-live-v11.js"

const repoRoot = path.resolve(import.meta.dirname, "..")
const readJson = (repoPath: string) => JSON.parse(
  readFileSync(path.join(repoRoot, repoPath), "utf8"),
) as Record<string, unknown>
const withLinkedWorktree = <T>(run: (root: string) => T): T => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-live-v11-test-"))
  const root = path.join(owner, "repo")
  let added = false
  try {
    execFileSync("/usr/bin/git", ["worktree", "add", "--quiet", "--detach", root, "HEAD"], {
      cwd: repoRoot,
      env: { PATH: "/usr/bin:/bin", HOME: owner, LANG: "C", LC_ALL: "C" },
    })
    added = true
    symlinkSync(path.join(repoRoot, "node_modules"), path.join(root, "node_modules"), "dir")
    for (const repoPath of [V138_LIVE_V11_PATHS.seal, V138_LIVE_V11_PATHS.envelope])
      chmodSync(path.join(root, repoPath), 0o600)
    return run(root)
  } finally {
    if (added) {
      try { execFileSync("/usr/bin/git", ["worktree", "remove", "--force", root], { cwd: repoRoot }) }
      catch { /* preserve the primary assertion */ }
    }
    rmSync(owner, { recursive: true, force: true })
  }
}

describe("Plan 262-117 authoritative readiness consumer", () => {
  it("requires an additive owner because live-v10 binds v1 while supplement-v3 binds v2", () => {
    const v1 = readJson(".planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-payload-v1.json")
    const v2 = readJson(".planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-payload-v2.json")
    const supplement = readJson(".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v3.json")
    const liveV10 = readFileSync(
      path.join(repoRoot, "scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts"),
      "utf8",
    )

    expect(supplement.plan114PayloadRoot).toBe(v2.payloadRoot)
    expect(supplement.plan114PayloadRoot).not.toBe(v1.payloadRoot)
    expect(liveV10).toContain("v1.38-plan-262-114-live-v10-custody-review-payload-v1.json")

    expect(() => readFileSync(
      path.join(repoRoot, "scripts/run-v1-38-bounded-retry-envelope-v3-live-v11.ts"),
    )).not.toThrow()
  })

  it("authenticates authoritative v2/v4, exact supplement-v3, and the unchanged pair", async () => {
    const exact = authenticateV138LiveV11SourceOnly(repoRoot)
    expect(exact.plan114V2PublicationCommit).toBe("34bc94ec4e348f71e6055a091d60a505cffc0d79")
    expect(exact.plan116V4PublicationCommit).toBe("f03f0e05539a1591b91000fc9d35b8381a082ec2")
    expect(exact.supplementPublicationCommit).toBe("a1e693a2ae528ba06597d3262041d6f947ecbeca")
    expect(exact.supplementRoot).toBe("sha256:3a653c44db658a89250d4b90d9a3bb086c99ac3fc04ebf8c7107bc66fd4f8e4b")
    expect(exact.pairCommit).toBe("8080ff66a0880db25db227d23e7e7a0884a79b56")
    expect(exact.envelopeStatus).toBe("sealed_inactive")
    expect(exact.counters).toEqual({
      acceptedCells: 0,
      calibrationIdentitiesCharged: 0,
      preflightObservationsConsumed: 0,
      reproductionIdentitiesCharged: 0,
      routeStartsConsumed: 0,
    })
    expect(exact.producerCalls).toBe(0)
    expect(exact.readinessInvoked).toBe(false)
    expect(exact.liveInvoked).toBe(false)
    expect(exact.authorizesExecution).toBe(false)
    expect(exact.downstreamAuthority).toBe("denied")

    const outputs: string[] = []
    await executeV138LiveV11Cli(["--check-source-only"], {
      repoRoot,
      writeOutput: (value) => outputs.push(value),
    })
    await executeV138LiveV11Cli(["--check-prospective-custody"], {
      repoRoot,
      writeOutput: (value) => outputs.push(value),
    })
    expect(outputs.map((value) => JSON.parse(value))).toEqual([
      expect.objectContaining({ status: "source_only_checked", producerCalls: 0, readinessInvoked: false, liveInvoked: false }),
      expect.objectContaining({ status: "prospective_custody_checked", producerCalls: 0, readinessInvoked: false, liveInvoked: false }),
    ])
    expect(V138_LIVE_V11_MODES).toEqual([
      "--check-source-only",
      "--check-prospective-custody",
      "--check-post-run-custody",
      "--check-reviewed-live-ready",
      "--run-reviewed-bounded-live-envelope",
    ])
  }, 60_000)

  it("fails closed on authoritative history, supplement, pair, and forbidden-path drift", () => {
    withLinkedWorktree((root) => {
      const mutate = (repoPath: string, expected: RegExp) => {
        const absolute = path.join(root, repoPath)
        const bytes = readFileSync(absolute)
        writeFileSync(absolute, Buffer.concat([bytes, Buffer.from("\n")]))
        expect(() => authenticateV138LiveV11SourceOnly(root)).toThrow(expected)
        writeFileSync(absolute, bytes)
      }
      mutate(V138_LIVE_V11_PATHS.plan114PayloadV2, /PUBLICATION_CURRENT_BYTES_INVALID/)
      mutate(".planning/artifacts/v1.38-plan-262-116-supplement-v3-adapter-review-payload-v4.json", /PUBLICATION_CURRENT_BYTES_INVALID/)
      mutate(V138_LIVE_V11_PATHS.supplementV3, /SUPPLEMENT_BYTES_INVALID/)
      mutate(V138_LIVE_V11_PATHS.envelope, /PAIR_CURRENT_BYTES_INVALID/)

      const forbidden = path.join(root, V138_LIVE_V11_PATHS.supplementV1)
      mkdirSync(path.dirname(forbidden), { recursive: true })
      symlinkSync("missing-target", forbidden)
      expect(() => authenticateV138LiveV11SourceOnly(root)).toThrow(/FORBIDDEN_DESTINATION_PRESENT/)
      rmSync(forbidden)

      const effect = path.join(root, ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json")
      symlinkSync("missing-target", effect)
      expect(() => authenticateV138LiveV11SourceOnly(root)).toThrow(/FORBIDDEN_DESTINATION_PRESENT/)
    })
  }, 120_000)

  it("keeps a closed static single-call future live boundary", () => {
    const source = readFileSync(path.join(repoRoot, V138_LIVE_V11_PATHS.source), "utf8")
    expect(source.match(/await runV138V3ProductionLive\(/gu)).toHaveLength(1)
    expect(source).not.toMatch(/injectedProducer|producerCallback|injectedReadiness|callerRenderer/u)
    expect(source).toContain("settleV138LiveV9ProducerOutcomeForReview(producerError, postCustodyError)")
    expect(source).toContain("assertV138LiveV10PostRunForReview(repoRoot)")
  })
})
