import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  V137_BROWSER_PROOF_CONTROL_PATH,
  checkV137BrowserProof,
  createV137BrowserProofReceiptFixture,
  validateV137BrowserProofReceipt,
  writeV137BrowserProofFixture,
} from "./run-v1-37-browser-proof.js"

const roots: string[] = []
const root = (): string => {
  const value = mkdtempSync(path.join(tmpdir(), "cowards-v137-browser-proof-"))
  roots.push(value)
  return value
}

afterEach(() => {
  for (const value of roots.splice(0)) rmSync(value, { recursive: true, force: true })
})

describe("v1.37 browser proof receipt", () => {
  it("binds an owned live-web fixture complement to the current real service receipt without backend overclaim", () => {
    const collector = readFileSync(
      path.join(process.cwd(), "scripts/run-v1-37-browser-proof.ts"),
      "utf8",
    )
    expect(collector).toContain("checkV137IntegratedServiceProof")
    expect(collector).toContain('topology: "live-web-fixture-complement"')
    expect(collector).toContain("liveBackendData: false")
    expect(collector).toContain("serviceReceiptBound: true")
    expect(collector).toContain('CI: "1"')
    expect(collector).toContain('"v1-37-rules-integrity-proof.spec.ts"')
    expect(collector).not.toContain("withGoBackend")
    expect(collector).not.toContain("createDatabasePool")
  })

  it("accepts only a complete live desktop/mobile receipt with safe restricted refs", () => {
    const receipt = createV137BrowserProofReceiptFixture()
    expect(validateV137BrowserProofReceipt(receipt)).toEqual(receipt)
    expect(receipt.projects).toEqual(["desktop", "mobile"])
    expect(receipt.liveBackendData).toBe(false)
    expect(receipt.serviceReceiptBound).toBe(true)
    expect(receipt.observations).toHaveLength(2)
    expect(receipt.browserProofReceiptRef.class).toBe("privacy-scan")
    expect(JSON.stringify(receipt)).not.toContain("match-set:")
    expect(JSON.stringify(receipt)).not.toContain("replay-match:")
  })

  it("rejects missing projects, stale handoffs, fixture substitution, and unsafe output", () => {
    const receipt = createV137BrowserProofReceiptFixture()
    expect(() =>
      validateV137BrowserProofReceipt({ ...receipt, projects: ["desktop"] }),
    ).toThrow("V137_BROWSER_PROOF_PROJECTS_INVALID")
    expect(() =>
      validateV137BrowserProofReceipt({ ...receipt, fixtureComplement: false }),
    ).toThrow("V137_BROWSER_PROOF_FIXTURE_COMPLEMENT_REQUIRED")
    expect(() =>
      validateV137BrowserProofReceipt({
        ...receipt,
        proofDataHandoffDigest: "not-a-digest",
      }),
    ).toThrow("V137_BROWSER_PROOF_HANDOFF_INVALID")
    expect(() =>
      validateV137BrowserProofReceipt({ ...receipt, accountId: "private" }),
    ).toThrow("V137_BROWSER_PROOF_RECEIPT_SHAPE")
  })

  it("writes restricted-first evidence and checks twice without writes", () => {
    const restrictedRoot = root()
    const control = writeV137BrowserProofFixture(process.cwd(), restrictedRoot)
    const before = readFileSync(
      path.join(restrictedRoot, V137_BROWSER_PROOF_CONTROL_PATH),
    )
    expect(checkV137BrowserProof(process.cwd(), restrictedRoot).status).toBe("passed")
    expect(checkV137BrowserProof(process.cwd(), restrictedRoot).status).toBe("passed")
    expect(readFileSync(path.join(restrictedRoot, V137_BROWSER_PROOF_CONTROL_PATH))).toEqual(before)
    writeFileSync(
      path.join(restrictedRoot, V137_BROWSER_PROOF_CONTROL_PATH),
      `${JSON.stringify({ ...control, inputRootSha256: `sha256:${"f".repeat(64)}` })}\n`,
    )
    expect(() => checkV137BrowserProof(process.cwd(), restrictedRoot)).toThrow(
      "V137_BROWSER_PROOF_INPUT_STALE",
    )
  })
})
