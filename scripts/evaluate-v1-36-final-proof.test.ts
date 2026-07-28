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
  renderV136CompetitionBoundaryJson,
  renderV136CompetitionBoundaryMarkdown,
  v136CompetitionBoundaryArtifactPaths,
  writeV136CompetitionBoundaryArtifacts,
} from "./evaluate-v1-36-competition-boundaries.ts"
import {
  checkV136FinalProofArtifacts,
  generateV136FinalProof,
  renderV136FinalProofJson,
  renderV136FinalProofMarkdown,
  requiredV136FinalEvidenceKinds,
  requiredV136FinalRequirements,
  validateV136FinalProof,
  v136FinalProofArtifactPaths,
  writeV136FinalProofArtifacts,
} from "./evaluate-v1-36-final-proof.ts"
import {
  renderV136ServiceProofJson,
  renderV136ServiceProofMarkdown,
  requiredV136BrowserScenarioIds,
  requiredV136GovernanceScenarioIds,
  requiredV136NegativeScenarioIds,
  requiredV136PositiveScenarioIds,
  v136ServiceProofArtifactPaths,
  v136ServiceProofSchemaVersion,
  type V136ServiceProof,
} from "./evaluate-v1-36-service-proof.ts"

const roots: string[] = []
const now = new Date("2026-07-11T18:00:00.000Z")
const digest = "c".repeat(64)
const focusedFiles = [
  "tests/phase250.test.ts",
  "tests/phase251.test.ts",
  "tests/phase252.test.ts",
  "tests/phase253.test.ts",
  "tests/phase254.test.ts",
] as const
const focusedTestCatalog = focusedFiles.map((file, index) => ({
  id: `phase${250 + index}`,
  requirements: requiredV136FinalRequirements,
  command: `pnpm exec vitest run ${file}`,
  files: [file],
}))

const serviceProof = (): V136ServiceProof => ({
  schemaVersion: v136ServiceProofSchemaVersion,
  milestone: "v1.36",
  phase: 255,
  generatedAt: "2026-07-11T17:30:00.000Z",
  generatedBy: "apps/web/e2e/v1-36-competition-realism-proof.spec.ts",
  status: "passed-local-services",
  command: "pnpm e2e:v1.36-service-proof",
  limitation: null,
  topology: {
    accountRevisionWrite: "selected-go-account-revisions",
    competitionMutation: "next-persistence-baseline",
    execution: "go-worker-runtime-service",
    publicReads: "selected-go-public-reads",
  },
  evidenceHashes: [
    { id: "public-result", sha256: digest },
    { id: "public-standings", sha256: digest },
    { id: "public-replay", sha256: digest },
  ],
  scenarios: [
    ...requiredV136PositiveScenarioIds.map((id) => ({
      id,
      kind: "positive" as const,
      status: "passed" as const,
      outcome: `${id} passed.`,
    })),
    ...requiredV136NegativeScenarioIds.map((id) => ({
      id,
      kind: "negative" as const,
      status: "passed" as const,
      outcome: `${id} passed.`,
    })),
    ...requiredV136GovernanceScenarioIds.map((id) => ({
      id,
      kind: "governance" as const,
      status: "passed" as const,
      outcome: `${id} passed.`,
    })),
    ...requiredV136BrowserScenarioIds.map((id) => ({
      id,
      kind: "browser" as const,
      status: "passed" as const,
      outcome: `${id} passed.`,
    })),
  ],
})

const boundaryOptions = {
  now,
  policyFailures: [] as string[],
  ownershipFailures: [] as string[],
  scanFiles: [
    v136ServiceProofArtifactPaths.json,
    v136ServiceProofArtifactPaths.markdown,
    ".planning/artifacts/v1.36-competition-surface-inventory.json",
    ".planning/artifacts/v1.36-competition-surface-inventory.md",
  ],
}

const finalOptions = {
  now,
  requireServiceProof: true,
  policyFailures: [] as string[],
  boundaryOptions,
  focusedTestCatalog,
}

const createRepo = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "cowards-v136-final-"))
  roots.push(root)
  mkdirSync(path.join(root, ".planning/artifacts"), { recursive: true })
  const service = serviceProof()
  writeFileSync(
    path.join(root, v136ServiceProofArtifactPaths.json),
    renderV136ServiceProofJson(service),
  )
  writeFileSync(
    path.join(root, v136ServiceProofArtifactPaths.markdown),
    renderV136ServiceProofMarkdown(service),
  )
  for (const [file, text] of Object.entries({
    ".planning/artifacts/v1.36-competition-surface-inventory.json": "{}\n",
    ".planning/artifacts/v1.36-competition-surface-inventory.md":
      "public policy\n",
    "scripts/check-boundary-monitors.ts": "monitor source\n",
    "packages/spec/src/public-output-privacy.ts": "privacy source\n",
    "packages/spec/src/competition-governance.ts": "governance source\n",
    "packages/spec/src/competition-policy-v1-36.ts": "policy source\n",
    ...Object.fromEntries(
      focusedFiles.map((file) => [file, `${file} coverage\n`]),
    ),
  })) {
    const fullPath = path.join(root, file)
    mkdirSync(path.dirname(fullPath), { recursive: true })
    writeFileSync(fullPath, text)
  }
  writeV136CompetitionBoundaryArtifacts(root, boundaryOptions)
  return root
}

afterEach(() => {
  roots
    .splice(0)
    .forEach((root) => rmSync(root, { recursive: true, force: true }))
})

describe("v1.36 final proof evaluator", () => {
  it("rolls up PROOF-01 through PROOF-06 and every evidence kind", () => {
    const proof = generateV136FinalProof(createRepo(), finalOptions)

    expect(proof.status).toBe("passed")
    expect(proof.requirements.map((row) => row.id)).toEqual(
      requiredV136FinalRequirements,
    )
    expect(proof.evidence.map((row) => row.kind)).toEqual(
      requiredV136FinalEvidenceKinds,
    )
    expect(validateV136FinalProof(proof, finalOptions)).toEqual([])
  })

  it("writes and checks synchronized artifacts with current input hashes", () => {
    const root = createRepo()
    const proof = writeV136FinalProofArtifacts(root, finalOptions)

    expect(
      readFileSync(path.join(root, v136FinalProofArtifactPaths.json), "utf8"),
    ).toBe(renderV136FinalProofJson(proof))
    expect(
      readFileSync(
        path.join(root, v136FinalProofArtifactPaths.markdown),
        "utf8",
      ),
    ).toBe(renderV136FinalProofMarkdown(proof))
    expect(checkV136FinalProofArtifacts(root, finalOptions)).toEqual([])
  })

  it("keeps PROOF-06 incomplete when live browser evidence is absent", () => {
    const root = createRepo()
    const service = serviceProof()
    service.scenarios = service.scenarios.filter(
      (row) => row.id !== "live-result-replay-mobile",
    )
    writeFileSync(
      path.join(root, v136ServiceProofArtifactPaths.json),
      renderV136ServiceProofJson(service),
    )
    writeFileSync(
      path.join(root, v136ServiceProofArtifactPaths.markdown),
      renderV136ServiceProofMarkdown(service),
    )
    const boundary = writeV136CompetitionBoundaryArtifacts(
      root,
      boundaryOptions,
    )
    writeFileSync(
      path.join(root, v136CompetitionBoundaryArtifactPaths.json),
      renderV136CompetitionBoundaryJson(boundary),
    )
    writeFileSync(
      path.join(root, v136CompetitionBoundaryArtifactPaths.markdown),
      renderV136CompetitionBoundaryMarkdown(boundary),
    )

    const proof = generateV136FinalProof(root, {
      ...finalOptions,
      requireServiceProof: false,
    })
    expect(proof.status).toBe("incomplete")
    expect(
      proof.requirements.find((row) => row.id === "PROOF-06")?.status,
    ).toBe("incomplete")
    expect(validateV136FinalProof(proof, finalOptions)).toContain(
      "strict mode requires a passed v1.36 final proof",
    )
  })

  it("detects stale final evidence when a consumed artifact changes", () => {
    const root = createRepo()
    writeV136FinalProofArtifacts(root, finalOptions)
    writeFileSync(
      path.join(root, v136CompetitionBoundaryArtifactPaths.markdown),
      "changed\n",
    )

    const errors = checkV136FinalProofArtifacts(root, finalOptions)
    expect(errors).toContain(`${v136FinalProofArtifactPaths.json} is stale`)
  })

  it("rejects private markers in the final artifact", () => {
    const proof = generateV136FinalProof(createRepo(), finalOptions)
    proof.evidence = [
      ...proof.evidence,
      {
        id: "private-leak",
        kind: "focused-tests",
        status: "passed",
        requirements: ["PROOF-04"],
        command: "Bearer private-value",
        artifacts: [],
      },
    ]

    expect(
      validateV136FinalProof(proof, finalOptions).some((error) =>
        error.includes("Bearer "),
      ),
    ).toBe(true)
  })
})
