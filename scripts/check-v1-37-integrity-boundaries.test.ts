import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  analyzeV137IntegrityBoundaries,
  analyzeV137IntegritySources,
} from "./check-v1-37-integrity-boundaries.js"

const expectBypass = (
  repoPath: string,
  source: string,
  expectedCode: string,
): void => {
  const result = analyzeV137IntegritySources({ [repoPath]: source })
  expect(result.findings.map((finding) => finding.code)).toContain(expectedCode)
}

describe("v1.37 creation inventory and caller bypass monitor", () => {
  it("accounts for the repository creation inventory", () => {
    expect(analyzeV137IntegrityBoundaries().findings).toEqual([])
  })

  it.each([
    [
      "packages/persistence/src/competition.ts",
      "service.createFromMatrix({ id, matches })",
      "CALLER_EVIDENCE_MISSING",
    ],
    [
      "packages/persistence/src/workshop.ts",
      "service.createFromPreset({ id, presetId })",
      "CALLER_EVIDENCE_MISSING",
    ],
    [
      "packages/persistence/src/dev-smoke.ts",
      "service.createFromPreset({ id, presetId, integrityIdentity })",
      "DEV_FIXTURE_BOUNDARY_MISSING",
    ],
    [
      "packages/persistence/src/new-match-writer.ts",
      "service.createFromMatrix({ id, matches, integrityIdentity })",
      "UNRECOGNIZED_CREATION_CALLER",
    ],
  ])("rejects %s independently", (repoPath, source, expectedCode) => {
    expectBypass(repoPath, source, expectedCode)
  })

  it.each([
    "match_sets",
    "match_set_execution_entrants",
    "competition_entrants",
    "matches",
    "match_jobs",
    "chronicles",
  ])("rejects a direct SQL insert into %s", (table) => {
    expectBypass(
      "packages/persistence/src/alternate-writer.ts",
      `pool.query(\`insert into ${table} (id) values ($1)\`)`,
      "UNRECOGNIZED_SQL_WRITER",
    )
  })

  it("rejects a new legacy worker consumer", () => {
    expectBypass(
      "scripts/alternate-demo.ts",
      'import { runWorkerOnce } from "../apps/worker/src/runner.ts"; runWorkerOnce(pool)',
      "UNRECOGNIZED_LEGACY_WORKER_CONSUMER",
    )
  })

  it("keeps the advanced demo explicitly fixture-only and execution-unavailable", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "scripts/run-v1-5-advanced-demo.ts"),
      "utf8",
    )
    expect(source).not.toContain("runWorkerOnce")
    expect(source).not.toContain("counted_status = 'counted'")
    expect(source).toContain("V15_DEMO_EXECUTION_UNAVAILABLE")
  })
})
