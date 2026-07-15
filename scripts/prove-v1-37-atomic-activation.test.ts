import { describe, expect, it } from "vitest"
import { CURRENT_CANONICAL_COMPATIBILITY_TUPLE_ID } from "../packages/spec/src/integrity-authority.js"
import {
  parseAtomicActivationProofArgs,
  proveV137AtomicActivation,
} from "./prove-v1-37-atomic-activation.js"

describe("v1.37 atomic activation proof", () => {
  it("requires the explicit disposable write/check contract", () => {
    expect(() =>
      parseAtomicActivationProofArgs([], {
        DATABASE_URL: "postgresql://proof",
      }),
    ).toThrow(/--write --check/u)
    expect(() =>
      parseAtomicActivationProofArgs(["--write", "--check", "--unknown"], {
        DATABASE_URL: "postgresql://proof",
      }),
    ).toThrow(/unknown/u)
    expect(
      parseAtomicActivationProofArgs(["--write", "--check"], {
        DATABASE_URL: "postgresql://proof",
      }),
    ).toEqual({
      write: true,
      check: true,
      databaseUrl: "postgresql://proof",
    })
  })

  it.runIf(Boolean(process.env.DATABASE_URL))(
    "publishes, installs, restarts, advances, and rejects rollback in one disposable schema",
    async () => {
      const report = await proveV137AtomicActivation({
        write: true,
        check: true,
        databaseUrl: process.env.DATABASE_URL!,
      })
      expect(report).toMatchObject({
        tupleId: CURRENT_CANONICAL_COMPATIBILITY_TUPLE_ID,
        selectedCertificateIds: ["certificate:atomic:exact-current"],
        rollbackCode: "ROLLBACK",
        productionReceiptCount: 0,
        disposable: true,
      })
      expect(report.excludedCertificateIds).toEqual([
        "certificate:atomic:historical",
        "certificate:atomic:partial",
        "certificate:atomic:mixed",
      ])
      expect(Number(report.secondGeneration)).toBe(
        Number(report.firstGeneration) + 1,
      )
      expect(report.restartGeneration).toBe(report.secondGeneration)
      expect(report.installedHeadGeneration).toBe(report.secondGeneration)
    },
    60_000,
  )
})
