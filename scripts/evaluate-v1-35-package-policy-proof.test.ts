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
  checkV135PackagePolicyProofArtifacts,
  generateV135PackagePolicyProof,
  packagePolicyArtifactPaths,
  renderV135PackagePolicyProofJson,
  renderV135PackagePolicyProofMarkdown,
  validateV135PackagePolicyProof,
  writeV135PackagePolicyProofArtifacts,
} from "./evaluate-v1-35-package-policy-proof.ts"

const tempRoots: string[] = []

const createTempRepo = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "cowards-v135-packages-"))
  tempRoots.push(root)
  mkdirSync(path.join(root, ".planning/artifacts"), { recursive: true })
  for (const [file, text] of Object.entries({
    "packages/spec/src/runtime.ts": [
      "STRATEGY_RUNTIME_PACKAGE_POLICY_CONTRACT_VERSION",
      'productionPackageMode: "none"',
      "hostImportsAllowed: false",
      "richPackagesAllowed: false",
      "nativeDependenciesAllowed: false",
      "Package metadata unsupported",
      "runtime-boundary proof before entry eligibility",
    ].join("\n"),
    "apps/go-backend/live_backend.go": [
      "packagePolicyLabel",
      "Package metadata unsupported",
      "Package metadata is not supported for counted play.",
    ].join("\n"),
    "apps/go-backend/provider_readiness.go": "package_policy_violation",
    "apps/go-backend/runtime_service_client.go": 'packageMode == "none"',
    "packages/runtime-python/src/validation.ts": "import, package",
    "packages/runtime-wasm-wasi/src/validation.ts": "package capabilities",
    "packages/runtime-js/src/validation.test.ts":
      "UNSUPPORTED_PACKAGE_METADATA",
    "package.json": "v1.35:package-policy-proof:check",
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

describe("v1.35 package policy proof evaluator", () => {
  it("covers every Phase 247 requirement and evidence kind", () => {
    const root = createTempRepo()
    const proof = generateV135PackagePolicyProof(root)

    expect(validateV135PackagePolicyProof(proof)).toEqual([])
    expect(proof.requiredRequirements).toEqual([
      "PKG-01",
      "PKG-02",
      "PKG-03",
      "PKG-04",
    ])
  })

  it("writes and checks synchronized artifacts", () => {
    const root = createTempRepo()
    const proof = writeV135PackagePolicyProofArtifacts(root)

    expect(
      readFileSync(path.join(root, packagePolicyArtifactPaths.json), "utf8"),
    ).toBe(renderV135PackagePolicyProofJson(proof))
    expect(
      readFileSync(
        path.join(root, packagePolicyArtifactPaths.markdown),
        "utf8",
      ),
    ).toBe(renderV135PackagePolicyProofMarkdown(proof))
    expect(checkV135PackagePolicyProofArtifacts(root)).toEqual([])
  })

  it("fails when artifacts are stale", () => {
    const root = createTempRepo()
    writeV135PackagePolicyProofArtifacts(root)
    writeFileSync(
      path.join(root, packagePolicyArtifactPaths.json),
      '{"stale":true}\n',
    )

    expect(checkV135PackagePolicyProofArtifacts(root)).toContain(
      `${packagePolicyArtifactPaths.json} is stale`,
    )
  })

  it("rejects package ecosystem expansion", () => {
    const root = createTempRepo()
    const proof = {
      ...generateV135PackagePolicyProof(root),
      guardrails: {
        ...generateV135PackagePolicyProof(root).guardrails,
        richPackageEcosystem: true,
      },
    }

    expect(validateV135PackagePolicyProof(proof as any)).toContain(
      "richPackageEcosystem must remain false",
    )
  })

  it("rejects source drift away from package mode none", () => {
    const root = createTempRepo()
    writeFileSync(
      path.join(root, "apps/go-backend/runtime_service_client.go"),
      'packageMode == "npm"',
    )

    expect(generateV135PackagePolicyProof(root).sourceChecks).toContain(
      "Go runtime-service compatibility must require package mode none",
    )
  })

  it("rejects private package-path marker leakage in proof artifacts", () => {
    const root = createTempRepo()
    const proof = generateV135PackagePolicyProof(root, [
      {
        ...generateV135PackagePolicyProof(root).evidence[0],
        outcome: "leaked node_modules/",
      },
      ...generateV135PackagePolicyProof(root).evidence.slice(1),
    ])

    expect(validateV135PackagePolicyProof(proof)).toContain(
      "forbidden private marker node_modules/",
    )
  })
})
