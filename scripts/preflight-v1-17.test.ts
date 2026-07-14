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
})
