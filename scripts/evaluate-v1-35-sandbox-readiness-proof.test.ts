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
  checkV135SandboxReadinessProofArtifacts,
  generateV135SandboxReadinessProof,
  renderV135SandboxReadinessProofJson,
  renderV135SandboxReadinessProofMarkdown,
  sandboxReadinessArtifactPaths,
  validateV135SandboxReadinessProof,
  writeV135SandboxReadinessProofArtifacts,
} from "./evaluate-v1-35-sandbox-readiness-proof.ts"

const tempRoots: string[] = []

const createTempRepo = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "cowards-v135-sandbox-"))
  tempRoots.push(root)
  mkdirSync(path.join(root, ".planning/artifacts"), { recursive: true })
  for (const [file, text] of Object.entries({
    "packages/spec/src/runtime.ts": [
      "STRATEGY_RUNTIME_SANDBOX_READINESS_CONTRACT_VERSION",
      "productionSandboxCertification: false",
      'publicLabel: "Provenance evidence only"',
      'publicLabel: "WASM/WASI artifact-backed evidence"',
      'publicLabel: "Hidden spike-only lane"',
      "TinyGo remains hidden and spike-only",
      "not WASM/WASI isolation or sandbox certification",
    ].join("\n"),
    "apps/go-backend/live_backend.go": [
      "sandboxReadinessLabel",
      "Provenance evidence only",
      "WASM/WASI artifact-backed evidence",
      "Runtime containment evidence only",
    ].join("\n"),
    "package.json": "v1.35:sandbox-readiness-proof:check",
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

describe("v1.35 sandbox readiness proof evaluator", () => {
  it("covers every Phase 246 requirement and evidence kind", () => {
    const root = createTempRepo()
    const proof = generateV135SandboxReadinessProof(root)

    expect(validateV135SandboxReadinessProof(proof)).toEqual([])
    expect(proof.requiredRequirements).toEqual([
      "SBOX-01",
      "SBOX-02",
      "LABEL-01",
      "LABEL-02",
    ])
  })

  it("writes and checks synchronized artifacts", () => {
    const root = createTempRepo()
    const proof = writeV135SandboxReadinessProofArtifacts(root)

    expect(
      readFileSync(path.join(root, sandboxReadinessArtifactPaths.json), "utf8"),
    ).toBe(renderV135SandboxReadinessProofJson(proof))
    expect(
      readFileSync(
        path.join(root, sandboxReadinessArtifactPaths.markdown),
        "utf8",
      ),
    ).toBe(renderV135SandboxReadinessProofMarkdown(proof))
    expect(checkV135SandboxReadinessProofArtifacts(root)).toEqual([])
  })

  it("fails when artifacts are stale", () => {
    const root = createTempRepo()
    writeV135SandboxReadinessProofArtifacts(root)
    writeFileSync(
      path.join(root, sandboxReadinessArtifactPaths.json),
      '{"stale":true}\n',
    )

    expect(checkV135SandboxReadinessProofArtifacts(root)).toContain(
      `${sandboxReadinessArtifactPaths.json} is stale`,
    )
  })

  it("rejects stronger sandbox certification claims", () => {
    const root = createTempRepo()
    const proof = {
      ...generateV135SandboxReadinessProof(root),
      guardrails: {
        ...generateV135SandboxReadinessProof(root).guardrails,
        productionSandboxCertification: true,
      },
    }

    expect(validateV135SandboxReadinessProof(proof as any)).toContain(
      "production sandbox certification must remain false",
    )
  })

  it("rejects source label drift back to Production candidate", () => {
    const root = createTempRepo()
    writeFileSync(
      path.join(root, "apps/go-backend/live_backend.go"),
      '"Production candidate"',
    )

    expect(generateV135SandboxReadinessProof(root).sourceChecks).toContain(
      "Go backend must not publish Production candidate labels",
    )
  })

  it("rejects private marker leakage in proof artifacts", () => {
    const root = createTempRepo()
    const proof = generateV135SandboxReadinessProof(root, [
      {
        ...generateV135SandboxReadinessProof(root).evidence[0],
        outcome: "leaked PRIVATE_ARTIFACT_BYTES",
      },
      ...generateV135SandboxReadinessProof(root).evidence.slice(1),
    ])

    expect(validateV135SandboxReadinessProof(proof)).toContain(
      "forbidden private marker PRIVATE_ARTIFACT_BYTES",
    )
  })
})
