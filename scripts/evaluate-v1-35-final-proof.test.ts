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
  checkV135FinalProofArtifacts,
  finalProofArtifactPaths,
  generateV135FinalProof,
  renderV135FinalProofJson,
  renderV135FinalProofMarkdown,
  validateV135FinalProof,
  writeV135FinalProofArtifacts,
} from "./evaluate-v1-35-final-proof.ts"

const tempRoots: string[] = []

const createTempRepo = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "cowards-v135-final-"))
  tempRoots.push(root)
  mkdirSync(path.join(root, ".planning/artifacts"), { recursive: true })
  const artifact = {
    serviceBackedProof: { status: "passed-local-postgresql" },
  }
  for (const file of [
    ".planning/artifacts/v1.35-account-provider-entry-proof.json",
    ".planning/artifacts/v1.35-ownership-alias-proof.json",
    ".planning/artifacts/v1.35-sandbox-readiness-proof.json",
    ".planning/artifacts/v1.35-package-policy-proof.json",
  ]) {
    const fullPath = path.join(root, file)
    mkdirSync(path.dirname(fullPath), { recursive: true })
    writeFileSync(fullPath, JSON.stringify(artifact))
  }
  for (const file of [
    ".planning/artifacts/v1.35-account-provider-entry-proof.md",
    ".planning/artifacts/v1.35-ownership-alias-proof.md",
    ".planning/artifacts/v1.35-sandbox-readiness-proof.md",
    ".planning/artifacts/v1.35-package-policy-proof.md",
  ]) {
    writeFileSync(path.join(root, file), "public-safe proof artifact\n")
  }
  for (const [file, text] of Object.entries({
    "package.json": [
      "v1.35:boundary-inventory:check",
      "v1.35:account-provider-entry-proof:check",
      "v1.35:ownership-alias-proof:check",
      "v1.35:sandbox-readiness-proof:check",
      "v1.35:package-policy-proof:check",
      "v1.35:final-proof:check",
    ].join("\n"),
    "apps/go-backend/phase244_account_provider_db_test.go":
      "TestPhase244AccountProviderProofPersistsThroughDBEntryAndRuntimeRequest",
    "packages/spec/src/public-output-privacy.ts":
      "PUBLIC_OUTPUT_FORBIDDEN_FIELDS",
    "apps/go-backend/main_test.go": "TestPublicResponses",
    "apps/web/app/matches/server.test.ts":
      "returns public replay data by default",
  })) {
    const fullPath = path.join(root, file)
    mkdirSync(path.dirname(fullPath), { recursive: true })
    writeFileSync(fullPath, text)
  }
  return root
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe("v1.35 final proof evaluator", () => {
  it("covers every Phase 248 requirement and evidence kind", () => {
    const root = createTempRepo()
    const proof = generateV135FinalProof(root, undefined, [])

    expect(validateV135FinalProof(proof)).toEqual([])
    expect(proof.requiredRequirements).toEqual([
      "PROOF-01",
      "PROOF-02",
      "PROOF-03",
      "PROOF-04",
      "PROOF-05",
    ])
  })

  it("writes and checks synchronized artifacts", () => {
    const root = createTempRepo()
    const proof = writeV135FinalProofArtifacts(root, [])

    expect(
      readFileSync(path.join(root, finalProofArtifactPaths.json), "utf8"),
    ).toBe(renderV135FinalProofJson(proof))
    expect(
      readFileSync(path.join(root, finalProofArtifactPaths.markdown), "utf8"),
    ).toBe(renderV135FinalProofMarkdown(proof))
    expect(checkV135FinalProofArtifacts(root, [])).toEqual([])
  })

  it("fails when artifacts are stale", () => {
    const root = createTempRepo()
    writeV135FinalProofArtifacts(root, [])
    writeFileSync(
      path.join(root, finalProofArtifactPaths.json),
      '{"stale":true}\n',
    )

    expect(checkV135FinalProofArtifacts(root, [])).toContain(
      `${finalProofArtifactPaths.json} is stale`,
    )
  })

  it("rejects missing service-backed proof", () => {
    const root = createTempRepo()
    writeFileSync(
      path.join(
        root,
        ".planning/artifacts/v1.35-account-provider-entry-proof.json",
      ),
      JSON.stringify({
        serviceBackedProof: { status: "not-run-local-postgresql-unavailable" },
      }),
    )

    expect(
      validateV135FinalProof(generateV135FinalProof(root, undefined, [])),
    ).toContain("service-backed PostgreSQL provider proof must be passed")
  })

  it("rejects private marker leakage in proof artifacts", () => {
    const root = createTempRepo()
    writeFileSync(
      path.join(root, ".planning/artifacts/v1.35-package-policy-proof.md"),
      "leaked bytesBase64",
    )

    expect(
      validateV135FinalProof(generateV135FinalProof(root, undefined, [])),
    ).toContain(
      ".planning/artifacts/v1.35-package-policy-proof.md contains private marker bytesBase64",
    )
  })

  it("rejects prior artifact check failures", () => {
    const root = createTempRepo()
    const proof = generateV135FinalProof(root, undefined, ["prior stale"])

    expect(validateV135FinalProof(proof)).toContain("prior stale")
  })
})
