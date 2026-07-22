import { mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  V137_ROLLBACK_PROOF_CONTROL_PATH,
  checkV137RollbackProof,
  createV137RollbackProofReceiptFixture,
  validateV137RollbackProofReceipt,
  writeV137RollbackProofFixture,
} from "./run-v1-37-rollback-proof.js"

const roots: string[] = []
const makeRoot = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "cowards-v137-rollback-test-"))
  roots.push(root)
  return root
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe("v1.37 restricted rollback and historical proof", () => {
  it("accepts only the closed audit, D-11, and historical inventory", () => {
    const receipt = createV137RollbackProofReceiptFixture()
    expect(validateV137RollbackProofReceipt(receipt)).toEqual(receipt)
    expect(receipt.scenarios).toHaveLength(17)
    expect(new Set(receipt.scenarios.map(({ id }) => id)).size).toBe(17)
    expect(receipt.deterministicRoots.first).toBe(receipt.deterministicRoots.second)
  })

  it("writes restricted-first evidence and checks it twice without mutation", () => {
    const root = makeRoot()
    process.env.COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT = root
    writeV137RollbackProofFixture(process.cwd(), root)
    const before = readFileSync(path.join(root, V137_ROLLBACK_PROOF_CONTROL_PATH))
    expect(checkV137RollbackProof(process.cwd(), root).status).toBe("passed")
    expect(checkV137RollbackProof(process.cwd(), root).status).toBe("passed")
    expect(readFileSync(path.join(root, V137_ROLLBACK_PROOF_CONTROL_PATH))).toEqual(before)
  })

  it("rejects missing, stale, failed, skipped, mixed, and override receipts", () => {
    const fixture = createV137RollbackProofReceiptFixture()
    const [first, ...rest] = fixture.scenarios
    expect(first).toBeDefined()
    const mutations = [
      { ...fixture, scenarios: rest },
      { ...fixture, scenarios: [{ ...first!, status: "failed" }, ...rest] },
      { ...fixture, scenarios: [{ ...first!, status: "skipped" }, ...rest] },
      { ...fixture, scenarios: [{ ...first!, tupleDisposition: "mixed" }, ...rest] },
      { ...fixture, manualPass: true },
    ]
    for (const mutation of mutations) {
      expect(() => validateV137RollbackProofReceipt(mutation)).toThrow()
    }

    const root = makeRoot()
    process.env.COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT = root
    const control = writeV137RollbackProofFixture(process.cwd(), root)
    unlinkSync(path.join(root, V137_ROLLBACK_PROOF_CONTROL_PATH))
    expect(() => checkV137RollbackProof(process.cwd(), root)).toThrow(
      "V137_ROLLBACK_CONTROL_MISSING",
    )
    writeFileSync(
      path.join(root, V137_ROLLBACK_PROOF_CONTROL_PATH),
      `${JSON.stringify({ ...control, inputRootSha256: `sha256:${"f".repeat(64)}` })}\n`,
    )
    expect(() => checkV137RollbackProof(process.cwd(), root)).toThrow(
      "V137_ROLLBACK_INPUT_STALE",
    )
  })
})
