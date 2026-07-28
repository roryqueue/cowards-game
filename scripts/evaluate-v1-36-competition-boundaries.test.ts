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
  checkV136CompetitionBoundaryArtifacts,
  generateV136CompetitionBoundaryProof,
  renderV136CompetitionBoundaryJson,
  renderV136CompetitionBoundaryMarkdown,
  validateV136CompetitionBoundaryProof,
  v136CompetitionBoundaryArtifactPaths,
  writeV136CompetitionBoundaryArtifacts,
} from "./evaluate-v1-36-competition-boundaries.ts"
import {
  renderV136ServiceProofJson,
  renderV136ServiceProofMarkdown,
  requiredV136GovernanceScenarioIds,
  requiredV136NegativeScenarioIds,
  requiredV136PositiveScenarioIds,
  v136ServiceProofArtifactPaths,
  v136ServiceProofSchemaVersion,
  type V136ServiceProof,
} from "./evaluate-v1-36-service-proof.ts"

const roots: string[] = []
const now = new Date("2026-07-11T18:00:00.000Z")
const digest = "b".repeat(64)

const serviceProof = (): V136ServiceProof => ({
  schemaVersion: v136ServiceProofSchemaVersion,
  milestone: "v1.36",
  phase: 255,
  generatedAt: "2026-07-11T17:30:00.000Z",
  generatedBy: "apps/web/e2e/v1-36-governance-service-proof.spec.ts",
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
      outcome: `${id} passed with public-safe state.`,
    })),
  ],
})

const createRepo = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "cowards-v136-boundary-"))
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
    "packages/spec/src/public-output-privacy.ts": "privacy contract\n",
    "packages/spec/src/competition-governance.ts": "governance contract\n",
    "packages/spec/src/competition-policy-v1-36.ts": "ownership contract\n",
  })) {
    const fullPath = path.join(root, file)
    mkdirSync(path.dirname(fullPath), { recursive: true })
    writeFileSync(fullPath, text)
  }
  return root
}

const options = {
  now,
  requireServiceProof: true,
  policyFailures: [] as string[],
  ownershipFailures: [] as string[],
  scanFiles: [
    v136ServiceProofArtifactPaths.json,
    v136ServiceProofArtifactPaths.markdown,
    ".planning/artifacts/v1.36-competition-surface-inventory.json",
    ".planning/artifacts/v1.36-competition-surface-inventory.md",
  ],
}

afterEach(() => {
  roots
    .splice(0)
    .forEach((root) => rmSync(root, { recursive: true, force: true }))
})

describe("v1.36 competition boundary evaluator", () => {
  it("aggregates required governance, privacy, policy, and ownership evidence", () => {
    const proof = generateV136CompetitionBoundaryProof(createRepo(), options)

    expect(proof.status).toBe("passed")
    expect(proof.governanceScenarios.map((row) => row.id).sort()).toEqual(
      [...requiredV136GovernanceScenarioIds].sort(),
    )
    expect(proof.monitors.map((monitor) => monitor.status)).toEqual([
      "passed",
      "passed",
      "passed",
    ])
    expect(validateV136CompetitionBoundaryProof(proof, options)).toEqual([])
  })

  it("writes and checks synchronized hash-addressed artifacts", () => {
    const root = createRepo()
    const proof = writeV136CompetitionBoundaryArtifacts(root, options)

    expect(
      readFileSync(
        path.join(root, v136CompetitionBoundaryArtifactPaths.json),
        "utf8",
      ),
    ).toBe(renderV136CompetitionBoundaryJson(proof))
    expect(
      readFileSync(
        path.join(root, v136CompetitionBoundaryArtifactPaths.markdown),
        "utf8",
      ),
    ).toBe(renderV136CompetitionBoundaryMarkdown(proof))
    expect(checkV136CompetitionBoundaryArtifacts(root, options)).toEqual([])
  })

  it("stays incomplete and fails strict mode when governance evidence is missing", () => {
    const root = createRepo()
    const service = serviceProof()
    service.scenarios = service.scenarios.filter(
      (row) => row.id !== "invalidated-result",
    )
    writeFileSync(
      path.join(root, v136ServiceProofArtifactPaths.json),
      renderV136ServiceProofJson(service),
    )
    writeFileSync(
      path.join(root, v136ServiceProofArtifactPaths.markdown),
      renderV136ServiceProofMarkdown(service),
    )

    const proof = generateV136CompetitionBoundaryProof(root, {
      ...options,
      requireServiceProof: false,
    })
    expect(proof.status).toBe("incomplete")
    expect(validateV136CompetitionBoundaryProof(proof, options)).toContain(
      "strict mode requires passed governance boundary evidence",
    )
  })

  it("fails on structural private governance markers", () => {
    const root = createRepo()
    const service = serviceProof() as V136ServiceProof & {
      reporterUserId?: string
    }
    service.reporterUserId = "private-user"
    writeFileSync(
      path.join(root, v136ServiceProofArtifactPaths.json),
      `${JSON.stringify(service, null, 2)}\n`,
    )

    expect(() => writeV136CompetitionBoundaryArtifacts(root, options)).toThrow(
      /reporterUserId/,
    )
  })

  it("fails on private values in scanned public surfaces", () => {
    const root = createRepo()
    writeFileSync(
      path.join(
        root,
        ".planning/artifacts/v1.36-competition-surface-inventory.md",
      ),
      "postgres://private-db\n",
    )

    expect(() => writeV136CompetitionBoundaryArtifacts(root, options)).toThrow(
      /postgres:\/\//,
    )
  })

  it("detects stale aggregates when an input hash changes", () => {
    const root = createRepo()
    writeV136CompetitionBoundaryArtifacts(root, options)
    writeFileSync(
      path.join(
        root,
        ".planning/artifacts/v1.36-competition-surface-inventory.md",
      ),
      "updated public policy\n",
    )

    expect(checkV136CompetitionBoundaryArtifacts(root, options)).toContain(
      `${v136CompetitionBoundaryArtifactPaths.json} is stale`,
    )
  })
})
