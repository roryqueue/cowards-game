import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, describe, expect, it } from "vitest"
import {
  analyzeV138LocalSealIndependentVerification,
  buildV138LocalSealIndependentVerificationArtifact,
  calculateV138LocalSealVersionedVerificationRoot,
  renderV138LocalSealIndependentVerificationArtifact,
  verifyV138LocalSealVersionedVerificationBytes,
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

    const protocolV2 = JSON.parse(readFileSync(
      path.join(REPO_ROOT, ".planning/artifacts/v1.38-local-seal-protocol-v2.json"),
      "utf8",
    )) as { protocolRoot: string }
    expect(analysis.protocolRoot).toBe(protocolV2.protocolRoot)
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
  }, 15_000)

  it("rejects the former dirty-checkout/freeze-binding reproduction without altering v1 evidence", () => {
    const analysis = analyzeV138LocalSealIndependentVerification({
      repoRoot: REPO_ROOT,
      scratchRoot: temporaryDirectory("v138-local-seal-independent-"),
    })

    expect(analysis.findings.map((finding) => finding.code)).not.toContain("DIRTY_FREEZE_BINDING_MISSING")
    expect(createHash("sha256").update(readFileSync(
      path.join(REPO_ROOT, ".planning/artifacts/v1.38-local-seal-independent-verification-v1.json"),
    )).digest("hex")).toBe("01a7e1e8e5534a762845cf39be3ed4c79ff98c6cda8bcd3e86f7ffaafe1c6c3e")
  }, 15_000)

  it("builds an exact-schema public-safe FAIL artifact with every authority denied", () => {
    const analysis = analyzeV138LocalSealIndependentVerification({
      repoRoot: REPO_ROOT,
      scratchRoot: temporaryDirectory("v138-local-seal-independent-"),
    })
    const artifact = buildV138LocalSealIndependentVerificationArtifact({
      analysis: {
        ...analysis,
        verdict: "fail",
        findings: [{
          code: "DIRTY_FREEZE_BINDING_MISSING",
          severity: "critical",
          publicReason: "pre_open_freeze_checkout_binding_not_enforced",
        }],
      },
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
  }, 15_000)

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
  }, 15_000)
})

describe("v1.38 local-seal versioned read-only verification", () => {
  const v2Path = path.join(
    REPO_ROOT,
    ".planning/artifacts/v1.38-local-seal-independent-verification-v2.json",
  )

  const v3Body = () => ({
    schemaVersion: "v1.38-local-seal-independent-verification-v3" as const,
    assuranceClass: "single_operator_local_seal_v1" as const,
    sourceCommit: "1".repeat(40),
    sourceTree: "2".repeat(40),
    sourceParent: "3".repeat(40),
    reviewerIdentity: "codex-independent-plan-262-52-reviewer",
    reviewerSourceAuthorSeparated: true,
    plan26251ImplementationCommits: ["4".repeat(40)],
    cleanSourceStatus: { staged: 0, unstaged: 0, untracked: 0 },
    localSealProtocolRoot: "sha256:bd4cd1af650f026fd45045d45069eaad0ccd7154140899e314780bb0ec38541a",
    protectedInventoryRoot: `sha256:${"5".repeat(64)}`,
    preservedEvidenceSha256: {
      localSealProtocolV1: "sha256:0db2b18d7e09894d52856478415889748802b745f1a36ca0d1bc1fcb39ecec5e",
      independentVerificationV1: "sha256:01a7e1e8e5534a762845cf39be3ed4c79ff98c6cda8bcd3e86f7ffaafe1c6c3e",
      plan26246Review: "sha256:d23272bc13a6f35c9158dae3b9da881deffcf13a490c627c60f4cc3e227bb96b",
      archivedPlan26246: "sha256:ebe4a0a03768ed47984058d5ba1166c861d4d70e6bf95ac17799ab36bae87f41",
      localSealProtocolV2: "sha256:b6c087a10d17eb1a8361b0beea728f5c987cd7b8e3a73f417c98c97aed1995c9",
      independentVerificationV2: "sha256:277b20a6149947e73532c83a92205621108a0afe804c10115c8eccb74185c8e6",
      plan26250Review: "sha256:704148d7882277fc7b033756879dd6afe9226edc5583c6de14cf01c7cfa4c8ba",
      archivedPlan26250: "sha256:e7ebdabdd057c541b09ab2337cd5f9fc505212f2b965a70aa042f8d0dcda81c8",
    },
    regressionResults: {
      DIRTY_FREEZE_BINDING_MISSING: "resolved",
      PLAN_DISCOVERY_DRIFT: "resolved",
      PRIVATE_DATA_EXPOSURE: "resolved",
      V2_VERIFIER_MODE_MISSING: "resolved",
    },
    commandResults: {
      focusedSuites: "passed",
      protocolV2ByteCheck: "passed",
      independentVerifierV2Check: "passed",
      dependencyRevisionBoundaryCheck: "passed",
      typecheck: "passed",
      diffCheck: "passed",
    },
    findingCount: 0,
    findingCodes: [] as string[],
    independentEvidenceVerification: "passed" as const,
    satisfiesRevisedSeal01: true,
    independentCustodyClaimed: false,
    maliciousOwnerResistanceClaimed: false,
    comprehensiveHostMonitoringClaimed: false,
    cryptographicErasureClaimed: false,
    admit03Status: "blocked" as const,
    candidateSearchAuthorized: false,
    phase263Authorized: false,
    formationMaterializationAuthorized: false,
    holdoutOpeningAuthorized: false,
    publicAuthorized: false,
    activationAuthorized: false,
    productionAuthorized: false,
    downstreamAuthority: "denied" as const,
  })

  const v3Bytes = (mutate?: (body: Record<string, unknown>) => void): Buffer => {
    const body = v3Body() as unknown as Record<string, unknown>
    mutate?.(body)
    const artifact = {
      ...body,
      verificationRoot: calculateV138LocalSealVersionedVerificationRoot("v3", body),
    }
    return Buffer.from(`${JSON.stringify(artifact)}\n`)
  }

  it("reproduces the exact Plan 262-50 CLI failure before the repair", () => {
    const result = spawnSync(
      "pnpm",
      ["exec", "tsx", "scripts/verify-v1-38-local-seal.ts", "--check-v2"],
      { cwd: REPO_ROOT, encoding: "utf8" },
    )
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('"status":"failed_with_findings"')
    expect(`${result.stdout}${result.stderr}`).not.toContain("V138_LOCAL_SEAL_REVIEW_CLI_USAGE")
  }, 15_000)

  it("checks immutable canonical v2 FAIL bytes without writing or upgrading them", () => {
    const before = readFileSync(v2Path)
    const result = verifyV138LocalSealVersionedVerificationBytes({ version: "v2", bytes: before })
    expect(result).toEqual({
      status: "failed_with_findings",
      verificationRoot: "sha256:e55933eb22d7bf028d3eb25f64861b8be078776a4c97156761977efdabf33b34",
      satisfiesRevisedSeal01: false,
    })
    expect(readFileSync(v2Path)).toEqual(before)
  })

  it("fails closed for malformed, noncanonical, mutated, wrong-root, and upgraded v2 bytes", () => {
    const canonical = readFileSync(v2Path)
    expect(() => verifyV138LocalSealVersionedVerificationBytes({ version: "v2", bytes: Buffer.from("not-json\n") }))
      .toThrow("V138_LOCAL_SEAL_VERSIONED_ARTIFACT_INVALID")
    expect(() => verifyV138LocalSealVersionedVerificationBytes({ version: "v2", bytes: Buffer.from(` ${canonical}`) }))
      .toThrow("V138_LOCAL_SEAL_VERSIONED_ARTIFACT_NONCANONICAL")
    for (const mutate of [
      (value: Record<string, unknown>) => { value.verificationRoot = `sha256:${"0".repeat(64)}` },
      (value: Record<string, unknown>) => { value.satisfiesRevisedSeal01 = true },
      (value: Record<string, unknown>) => { value.productionAuthorized = true },
      (value: Record<string, unknown>) => { value.findingCount = 0 },
      (value: Record<string, unknown>) => { value.extra = true },
    ]) {
      const value = JSON.parse(canonical.toString("utf8")) as Record<string, unknown>
      mutate(value)
      expect(() => verifyV138LocalSealVersionedVerificationBytes({
        version: "v2",
        bytes: Buffer.from(`${JSON.stringify(value)}\n`),
      })).toThrow(/^V138_LOCAL_SEAL_VERSIONED_/u)
    }
  })

  it("checks canonical v3 PASS or bounded FAIL fixtures and rejects mutation or wrong domains", () => {
    expect(verifyV138LocalSealVersionedVerificationBytes({ version: "v3", bytes: v3Bytes() }))
      .toMatchObject({ status: "passed", satisfiesRevisedSeal01: true })

    const fail = v3Bytes((body) => {
      body.findingCount = 1
      body.findingCodes = ["SYNTHETIC_REVIEW_FINDING"]
      body.independentEvidenceVerification = "failed_with_findings"
      body.satisfiesRevisedSeal01 = false
    })
    expect(verifyV138LocalSealVersionedVerificationBytes({ version: "v3", bytes: fail }))
      .toMatchObject({ status: "failed_with_findings", satisfiesRevisedSeal01: false })

    const wrongDomainBody = v3Body() as unknown as Record<string, unknown>
    const wrongDomain = {
      ...wrongDomainBody,
      verificationRoot: calculateV138LocalSealVersionedVerificationRoot("v2", wrongDomainBody),
    }
    expect(() => verifyV138LocalSealVersionedVerificationBytes({
      version: "v3",
      bytes: Buffer.from(`${JSON.stringify(wrongDomain)}\n`),
    })).toThrow("V138_LOCAL_SEAL_VERSIONED_ROOT_MISMATCH")

    for (const mutate of [
      (body: Record<string, unknown>) => { body.independentCustodyClaimed = true },
      (body: Record<string, unknown>) => { body.admit03Status = "passed" },
      (body: Record<string, unknown>) => { body.findingCount = 1 },
      (body: Record<string, unknown>) => { body.plan26251ImplementationCommits = [] },
    ]) expect(() => verifyV138LocalSealVersionedVerificationBytes({
      version: "v3",
      bytes: v3Bytes(mutate),
    })).toThrow(/^V138_LOCAL_SEAL_VERSIONED_/u)
  })
})
