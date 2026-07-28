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
  checkV136ServiceProofArtifacts,
  createV136UnavailableServiceProof,
  renderV136ServiceProofJson,
  renderV136ServiceProofMarkdown,
  requiredV136NegativeScenarioIds,
  requiredV136PositiveScenarioIds,
  validateV136ServiceProof,
  v136ServiceProofArtifactPaths,
  v136ServiceProofSchemaVersion,
  writeV136ServiceProofArtifacts,
  type V136ServiceProof,
  type V136ServiceProofScenario,
} from "./evaluate-v1-36-service-proof.ts"

const roots: string[] = []
const now = new Date("2026-07-11T18:00:00.000Z")
const hash = "a".repeat(64)

const playwrightNativeProof = (): Record<string, unknown> => ({
  schemaVersion: v136ServiceProofSchemaVersion,
  status: "passed-local-services",
  generatedAt: "2026-07-11T17:30:00.000Z",
  topology: {
    postgres: "healthy",
    redisConfiguration: "present",
    goBackend: "healthy",
    runtimeService: "healthy",
    accountRevisionOwner: "go",
    publicReadOwner: "go",
  },
  accounts: {
    count: 4,
    distinct: true,
    providerReadyRevisionCount: 4,
    sourceHashes: [hash, hash, hash, hash],
  },
  season: {
    seasonId: "season:proof",
    seasonHref: "/ladder/season:proof",
    standingsHref: "/ladder/season:proof#standings",
    entryCount: 4,
    scheduleRunId: "schedule:proof",
    matchSetId: "matchset:proof",
    scheduleIdempotent: true,
  },
  execution: {
    runOnceIterations: 4,
    durationMs: 100,
    matchCount: 6,
    completeMatchCount: 6,
    chronicleHashCount: 6,
  },
  result: {
    resultHref: "/matchsets/matchset:proof",
    status: "complete",
    countedState: "counted",
    replayHref: "/matches/match:proof/replay",
    replayPageMs: 20,
    replayCanvasBytes: 400,
  },
  standings: {
    deterministicRepeatedRead: true,
    rowCount: 4,
    rows: [{}, {}, {}, {}],
  },
  privacy: {
    publicResultSafe: true,
    publicSeasonSafe: true,
    publicReplaySafe: true,
    proofArtifactSafe: true,
  },
  cleanup: {
    mutableCompetitionRowsRemoved: true,
    sessionsRevoked: true,
    adminCapabilityRemoved: true,
    appendOnlyLifecycleAuditRetained: true,
  },
})

const passedProof = (): V136ServiceProof => {
  const scenario = (
    id: string,
    kind: V136ServiceProofScenario["kind"],
  ): V136ServiceProofScenario => ({
    id,
    kind,
    status: "passed",
    outcome: `${id} passed through public service boundaries.`,
  })
  return {
    schemaVersion: v136ServiceProofSchemaVersion,
    milestone: "v1.36",
    phase: 255,
    generatedAt: "2026-07-11T17:30:00.000Z",
    generatedBy: "apps/web/e2e/v1-36-competition-service-proof.spec.ts",
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
      { id: "public-result", sha256: hash },
      { id: "public-standings", sha256: hash },
      { id: "public-replay", sha256: hash },
    ],
    scenarios: [
      ...requiredV136PositiveScenarioIds.map((id) => scenario(id, "positive")),
      ...requiredV136NegativeScenarioIds.map((id) => scenario(id, "negative")),
    ],
  }
}

const tempRepo = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "cowards-v136-service-"))
  roots.push(root)
  mkdirSync(path.join(root, ".planning/artifacts"), { recursive: true })
  return root
}

afterEach(() => {
  roots
    .splice(0)
    .forEach((root) => rmSync(root, { recursive: true, force: true }))
})

describe("v1.36 service proof evaluator", () => {
  it("accepts fresh complete live service evidence in strict mode", () => {
    expect(
      validateV136ServiceProof(passedProof(), {
        now,
        requireServiceProof: true,
      }),
    ).toEqual([])
  })

  it("adapts Playwright-native facts without inventing missing negative proof", () => {
    const native = playwrightNativeProof()
    const incomplete = validateV136ServiceProof(native, {
      now,
      requireServiceProof: true,
    })
    expect(incomplete).not.toContain(
      "missing required service scenario counted-season-flow",
    )
    expect(incomplete).toContain(
      "missing required service scenario stale-provider-proof",
    )

    native.negativeScenarios = requiredV136NegativeScenarioIds.map((id) => ({
      id,
      status: "passed",
      outcome: `${id} was rejected through the entry boundary.`,
    }))
    expect(
      validateV136ServiceProof(native, {
        now,
        requireServiceProof: true,
      }),
    ).toEqual([])
  })

  it("writes canonical synchronized JSON and Markdown", () => {
    const root = tempRepo()
    const proof = writeV136ServiceProofArtifacts(passedProof(), root, { now })

    expect(
      readFileSync(path.join(root, v136ServiceProofArtifactPaths.json), "utf8"),
    ).toBe(renderV136ServiceProofJson(proof))
    expect(
      readFileSync(
        path.join(root, v136ServiceProofArtifactPaths.markdown),
        "utf8",
      ),
    ).toBe(renderV136ServiceProofMarkdown(proof))
    expect(checkV136ServiceProofArtifacts(root, { now })).toEqual([])
  })

  it("allows a fresh explicit unavailable record only outside strict mode", () => {
    const proof = createV136UnavailableServiceProof(
      "Local service topology is not configured.",
      "2026-07-11T17:30:00.000Z",
    )

    expect(validateV136ServiceProof(proof, { now })).toEqual([])
    expect(
      validateV136ServiceProof(proof, { now, requireServiceProof: true }),
    ).toContain("strict mode requires passed-local-services evidence")
  })

  it("rejects missing, failed, and stale strict evidence", () => {
    const proof = passedProof()
    proof.generatedAt = "2026-07-09T17:30:00.000Z"
    proof.scenarios = proof.scenarios
      .filter((scenario) => scenario.id !== "missing-provider-proof")
      .map((scenario) =>
        scenario.id === "stale-provider-proof"
          ? { ...scenario, status: "failed" as const }
          : scenario,
      )

    const errors = validateV136ServiceProof(proof, {
      now,
      requireServiceProof: true,
    })
    expect(errors).toContain("service proof is stale")
    expect(errors).toContain(
      "missing required service scenario missing-provider-proof",
    )
    expect(errors).toContain(
      "required service scenario stale-provider-proof must be passed",
    )
  })

  it("rejects private fields, absolute paths, and credentials", () => {
    const proof = passedProof() as V136ServiceProof & {
      reporterUserId?: string
    }
    proof.reporterUserId = "private-user"
    proof.scenarios = [
      ...proof.scenarios,
      {
        id: "credential-leak",
        kind: "negative",
        status: "passed",
        outcome: "Bearer private-value",
      },
    ]

    const errors = validateV136ServiceProof(proof, { now })
    expect(errors.some((error) => error.includes("reporterUserId"))).toBe(true)
    expect(errors.some((error) => error.includes("Bearer "))).toBe(true)
  })

  it("detects stale Markdown without rewriting live evidence", () => {
    const root = tempRepo()
    writeV136ServiceProofArtifacts(passedProof(), root, { now })
    writeFileSync(
      path.join(root, v136ServiceProofArtifactPaths.markdown),
      "stale\n",
    )

    expect(checkV136ServiceProofArtifacts(root, { now })).toContain(
      `${v136ServiceProofArtifactPaths.markdown} is stale`,
    )
  })
})
