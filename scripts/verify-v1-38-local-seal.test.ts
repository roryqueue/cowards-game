import { Buffer } from "node:buffer"
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, describe, expect, it } from "vitest"
import {
  analyzeV138LocalSealIndependentVerification,
  buildV138LocalSealIndependentVerificationArtifact,
  renderV138LocalSealIndependentVerificationArtifact,
} from "./verify-v1-38-local-seal.js"

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const cleanup = new Set<string>()

const temporaryDirectory = (prefix: string): string => {
  const target = mkdtempSync(path.join(tmpdir(), prefix))
  cleanup.add(target)
  return target
}

afterEach(() => {
  for (const target of cleanup) rmSync(target, { recursive: true, force: true })
  cleanup.clear()
})

describe("v1.38 local-seal independent verification", () => {
  it("reproduces the protocol and detects the complete adversarial mutation matrix", () => {
    const analysis = analyzeV138LocalSealIndependentVerification({
      repoRoot: REPO_ROOT,
      scratchRoot: temporaryDirectory("v138-local-seal-independent-"),
    })

    expect(analysis.protocolRoot).toBe("sha256:0d7f7ec3edd89638226105b7ae035330265f19634bb7acfc58fb204dba157e62")
    expect(analysis.protocolByteIdentical).toBe(true)
    expect(analysis.mutationChecks).toEqual({
      bundleMutationRejected: true,
      commitmentMutationRejected: true,
      eventChainMutationRejected: true,
      requestMutationRejected: true,
      freezeRootMutationRejected: true,
      resultMutationRejected: true,
      receiptMutationRejected: true,
      claimMutationRejected: true,
      protectedHistoryMutationRejected: true,
      secondOpeningRejected: true,
      crashBeforeResultRejected: true,
      privacySeedRejected: true,
      genericDebugExportRejected: true,
      forbiddenReachabilityRejected: true,
    })
    expect(analysis.protectedHistoryExact).toBe(true)
    expect(analysis.downstreamAuthorityDenied).toBe(true)
  })

  it("reports the missing dirty-checkout/freeze binding without altering Plan 262-45", () => {
    const analysis = analyzeV138LocalSealIndependentVerification({
      repoRoot: REPO_ROOT,
      scratchRoot: temporaryDirectory("v138-local-seal-independent-"),
    })

    expect(analysis.findings).toContainEqual({
      code: "DIRTY_FREEZE_BINDING_MISSING",
      severity: "critical",
      publicReason: "pre_open_freeze_checkout_binding_not_enforced",
    })
    expect(analysis.verdict).toBe("fail")
  })

  it("builds an exact-schema public-safe FAIL artifact with every authority denied", () => {
    const analysis = analyzeV138LocalSealIndependentVerification({
      repoRoot: REPO_ROOT,
      scratchRoot: temporaryDirectory("v138-local-seal-independent-"),
    })
    const artifact = buildV138LocalSealIndependentVerificationArtifact({
      analysis,
      sourceCommit: "755f6ce77f7f5554cba2a07f4913de900a3c7523",
      sourceTree: "0123456789abcdef0123456789abcdef01234567",
      reviewerCommit: "89abcdef0123456789abcdef0123456789abcdef",
    })

    expect(Object.keys(artifact).sort()).toEqual([
      "admit03Status",
      "assuranceClass",
      "candidateSearchAuthorized",
      "findingCodes",
      "formationMaterializationAuthorized",
      "holdoutOpeningAuthorized",
      "independentCustodyClaimed",
      "independentEvidenceVerification",
      "localSealProtocolRoot",
      "maliciousOwnerResistanceClaimed",
      "phase263Authorized",
      "productionAuthorized",
      "protectedHistoryRoot",
      "publicAuthorized",
      "reviewerCommit",
      "satisfiesRevisedSeal01",
      "schemaVersion",
      "sourceCommit",
      "sourceTree",
      "verificationRoot",
    ].sort())
    expect(artifact).toMatchObject({
      assuranceClass: "single_operator_local_seal_v1",
      independentEvidenceVerification: "failed_with_findings",
      satisfiesRevisedSeal01: false,
      independentCustodyClaimed: false,
      maliciousOwnerResistanceClaimed: false,
      admit03Status: "blocked",
      candidateSearchAuthorized: false,
      phase263Authorized: false,
      formationMaterializationAuthorized: false,
      holdoutOpeningAuthorized: false,
      publicAuthorized: false,
      productionAuthorized: false,
    })
    const rendered = renderV138LocalSealIndependentVerificationArtifact(artifact)
    expect(rendered).toBe(`${JSON.stringify(artifact)}\n`)
    expect(rendered).not.toContain(tmpdir())
    expect(rendered).not.toMatch(/PRIVATE_|StrategyMemory|SoldierMemory|objectivePayload|commitment-secret/u)
  })

  it("rejects claim inflation and local path or secret material in review carriers", () => {
    const scratch = temporaryDirectory("v138-local-seal-independent-claim-")
    const fakeRepo = path.join(scratch, "repo")
    mkdirSync(fakeRepo, { mode: 0o700 })
    writeFileSync(path.join(fakeRepo, "dirty.txt"), "dirty\n", { mode: 0o600 })
    chmodSync(fakeRepo, 0o700)
    const analysis = analyzeV138LocalSealIndependentVerification({
      repoRoot: REPO_ROOT,
      scratchRoot: temporaryDirectory("v138-local-seal-independent-"),
      claimCarrierOverrides: {
        "synthetic-claim.md": "Independent third-party custody with malicious-owner resistance.",
      },
    })
    expect(analysis.findings.map((finding) => finding.code)).toContain("INFLATED_CUSTODY_CLAIM")
    expect(JSON.stringify(analysis)).not.toContain(fakeRepo)
    expect(JSON.stringify(analysis)).not.toContain(readFileSync(path.join(fakeRepo, "dirty.txt"), "utf8"))
  })
})
