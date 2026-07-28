import { describe, expect, it } from "vitest"
import {
  V137_AUDIT_PROBE_IDS,
  analyzeV137AuditReproduction,
  createV137AuditReproductionFixture,
  runV137AuditReproductionGate,
  type V137AuditReproductionInput,
} from "./check-v1-37-audit-reproduction.js"

const replace = (
  input: V137AuditReproductionInput,
  replacement: Partial<V137AuditReproductionInput>,
): V137AuditReproductionInput => ({ ...input, ...replacement })

describe("v1.37 exact audit reproduction release gate", () => {
  it("runs the permanent reproduction and accepts the exact seven observations", () => {
    const receipt = runV137AuditReproductionGate(process.cwd())

    expect(receipt.status).toBe("passed-exact")
    expect(receipt.probeIds).toEqual(V137_AUDIT_PROBE_IDS)
    expect(receipt.probeIds).toHaveLength(7)
    expect(receipt.hashes).toEqual({
      reproductionSourceSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      freshResultSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      retainedResultSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      retainedRulingsSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      protectedInputsSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      joinSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
    })
    expect(JSON.stringify(receipt)).not.toMatch(/Users|DATABASE_URL|stack|diagnostic/iu)
  }, 20_000)

  it("fails closed for a missing, extra, or changed probe", () => {
    const fixture = createV137AuditReproductionFixture()
    const { successfulPushPusherHistory: _removed, ...missing } =
      fixture.freshObservations

    expect(() =>
      analyzeV137AuditReproduction(
        replace(fixture, { freshObservations: missing }),
      ),
    ).toThrow("V137_AUDIT_PROBE_INVENTORY_INVALID")

    expect(() =>
      analyzeV137AuditReproduction(
        replace(fixture, {
          freshObservations: {
            ...fixture.freshObservations,
            unreviewedProbe: true,
          },
        }),
      ),
    ).toThrow("V137_AUDIT_PROBE_INVENTORY_INVALID")

    expect(() =>
      analyzeV137AuditReproduction(
        replace(fixture, {
          freshObservations: {
            ...fixture.freshObservations,
            successfulPushPusherHistory: "LEFT",
          },
        }),
      ),
    ).toThrow("V137_AUDIT_OBSERVATION_UNAPPROVED")
  })

  it("rejects rewritten retained results and protected inputs by byte hash", () => {
    const fixture = createV137AuditReproductionFixture()

    expect(() =>
      analyzeV137AuditReproduction(
        replace(fixture, {
          retainedResultBytes: fixture.retainedResultBytes.replace(
            '"RIGHT"',
            '"LEFT"',
          ),
        }),
      ),
    ).toThrow("V137_AUDIT_RETAINED_RESULT_DRIFT")

    expect(() =>
      analyzeV137AuditReproduction(
        replace(fixture, {
          protectedInputs: fixture.protectedInputs.map((input, index) =>
            index === 0 ? { ...input, bytes: `${input.bytes}\n` } : input,
          ),
        }),
      ),
    ).toThrow("V137_AUDIT_PROTECTED_INPUT_DRIFT")
  })

  it("has no boolean override or generic waiver shape", () => {
    const fixture = createV137AuditReproductionFixture()

    for (const mutation of [
      { ...fixture, override: true },
      { ...fixture, waiver: "approved" },
      { ...fixture, manualPass: true },
    ]) {
      expect(() =>
        analyzeV137AuditReproduction(
          mutation as unknown as V137AuditReproductionInput,
        ),
      ).toThrow("V137_AUDIT_INPUT_SCHEMA_INVALID")
    }
  })

  it("rejects a ruling that does not name every compatibility surface", () => {
    const fixture = createV137AuditReproductionFixture()
    const [first, ...rest] = fixture.rulings
    expect(first).toBeDefined()
    const incomplete = { ...first } as Record<string, unknown>
    delete incomplete.strategyObservations

    expect(() =>
      analyzeV137AuditReproduction(
        replace(fixture, {
          rulings: [
            incomplete as unknown as V137AuditReproductionInput["rulings"][number],
            ...rest,
          ],
        }),
      ),
    ).toThrow("V137_AUDIT_RULING_SCHEMA_INVALID")
  })
})
