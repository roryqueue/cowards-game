import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  accountProviderEntryArtifactPaths,
  checkV135AccountProviderEntryProofArtifacts,
  generateV135AccountProviderEntryProof,
  renderV135AccountProviderEntryProofJson,
  renderV135AccountProviderEntryProofMarkdown,
  validateV135AccountProviderEntryProof,
  writeV135AccountProviderEntryProofArtifacts,
} from "./evaluate-v1-35-account-provider-entry-proof.ts"

const tempRoots: string[] = []

const createTempRepo = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "cowards-v135-account-proof-"))
  tempRoots.push(root)
  mkdirSync(path.join(root, ".planning/artifacts"), { recursive: true })
  return root
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe("v1.35 account/provider entry proof evaluator", () => {
  it("covers every Phase 244 requirement and required evidence kind", () => {
    const proof = generateV135AccountProviderEntryProof()
    expect(validateV135AccountProviderEntryProof(proof)).toEqual([])
    expect(proof.requiredRequirements).toEqual([
      "ACCT-01",
      "ACCT-02",
      "ACCT-03",
      "ACCT-04",
      "ACCT-05",
      "ENTRY-01",
      "ENTRY-02",
      "ENTRY-03",
      "ENTRY-04",
    ])
  })

  it("writes and checks synchronized JSON and markdown artifacts", () => {
    const root = createTempRepo()
    const proof = writeV135AccountProviderEntryProofArtifacts(root)

    expect(
      readFileSync(path.join(root, accountProviderEntryArtifactPaths.json), "utf8"),
    ).toBe(renderV135AccountProviderEntryProofJson(proof))
    expect(
      readFileSync(
        path.join(root, accountProviderEntryArtifactPaths.markdown),
        "utf8",
      ),
    ).toBe(renderV135AccountProviderEntryProofMarkdown(proof))
    expect(checkV135AccountProviderEntryProofArtifacts(root)).toEqual([])
  })

  it("fails when artifacts are stale", () => {
    const root = createTempRepo()
    writeV135AccountProviderEntryProofArtifacts(root)
    writeFileSync(
      path.join(root, accountProviderEntryArtifactPaths.json),
      '{"stale":true}\n',
    )

    expect(checkV135AccountProviderEntryProofArtifacts(root)).toContain(
      `${accountProviderEntryArtifactPaths.json} is stale`,
    )
  })

  it("rejects missing requirement coverage", () => {
    const proof = generateV135AccountProviderEntryProof([
      {
        id: "partial",
        kind: "typescript-runtime-service-validation",
        decisions: ["D-01"],
        requirements: ["ACCT-01"],
        files: ["apps/go-backend/runtime_service_client.go"],
        commands: ["go test"],
        outcome: "partial",
        limitations: [],
      },
    ])

    expect(validateV135AccountProviderEntryProof(proof)).toContain(
      "missing requirement ACCT-02",
    )
  })

  it("rejects unsupported sandbox/package/TinyGo overclaims", () => {
    const proof = {
      ...generateV135AccountProviderEntryProof(),
      claimGuardrails: {
        ...generateV135AccountProviderEntryProof().claimGuardrails,
        productionSandboxCertified: true,
      },
    }

    expect(validateV135AccountProviderEntryProof(proof)).toContain(
      "Phase 244 must not certify a production sandbox",
    )
  })

  it("rejects private marker leakage in proof artifacts", () => {
    const proof = generateV135AccountProviderEntryProof([
      {
        ...generateV135AccountProviderEntryProof().evidence[0],
        outcome: "leaked bytesBase64",
      },
      ...generateV135AccountProviderEntryProof().evidence.slice(1),
    ])

    expect(validateV135AccountProviderEntryProof(proof)).toContain(
      "forbidden private marker bytesBase64",
    )
  })
})
