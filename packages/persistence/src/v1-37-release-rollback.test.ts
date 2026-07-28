import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const expectedD11Scenarios = [
  "lane-kill-switch-before-schedule",
  "certificate-stale-before-schedule",
  "lane-kill-switch-after-claim",
  "certificate-stale-after-claim",
  "completion-failure-before-chronicle",
  "completion-failure-after-chronicle",
  "completion-failure-after-match",
  "exact-idempotent-retry",
  "cohort-invalidation",
  "compensating-reversal",
  "standings-governance-recompute",
  "service-runtime-exact-tuple-rollback",
  "mixed-state-tuple-rejection",
] as const

type ScenarioId = (typeof expectedD11Scenarios)[number]

const ownerSuites = [
  {
    owner: "job-lifecycle",
    file: "packages/persistence/src/jobs.test.ts",
    scenarios: [
      "lane-kill-switch-before-schedule",
      "certificate-stale-before-schedule",
      "lane-kill-switch-after-claim",
      "certificate-stale-after-claim",
    ],
  },
  {
    owner: "completion-transaction",
    file: "packages/persistence/src/complete-match.test.ts",
    scenarios: [
      "completion-failure-before-chronicle",
      "completion-failure-after-chronicle",
      "completion-failure-after-match",
      "exact-idempotent-retry",
      "mixed-state-tuple-rejection",
    ],
  },
  {
    owner: "cohort-compensation",
    file: "packages/persistence/src/runtime-evidence-authority-publisher.test.ts",
    scenarios: ["cohort-invalidation", "compensating-reversal"],
  },
  {
    owner: "standings-recompute",
    file: "packages/persistence/src/standings-recompute.test.ts",
    scenarios: ["standings-governance-recompute"],
  },
  {
    owner: "semantic-selection-rollback",
    file: "packages/persistence/src/semantic-authority-selection-head.test.ts",
    scenarios: [
      "service-runtime-exact-tuple-rollback",
      "mixed-state-tuple-rejection",
    ],
  },
] as const satisfies readonly {
  owner: string
  file: string
  scenarios: readonly ScenarioId[]
}[]

const sha256 = (value: string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const repositoryRoot = fileURLToPath(new URL("../../..", import.meta.url))

const v137ReleaseRollbackScenarios = (repoRoot = repositoryRoot) =>
  expectedD11Scenarios.map((id) => {
    const owners = ownerSuites.filter(({ scenarios }) =>
      (scenarios as readonly string[]).includes(id),
    )
    if (owners.length === 0) throw new TypeError("V137_D11_OWNER_MISSING")
    return Object.freeze({
      id,
      ownerSourceHashes: owners.map(({ file }) => ({
        owner: file,
        sha256: sha256(readFileSync(path.resolve(repoRoot, file), "utf8")),
      })),
    })
  })

type JsonReport = {
  success: boolean
  numFailedTests: number
  numPendingTests: number
  numTodoTests: number
  numPassedTests: number
}

const runV137ReleaseRollbackOwnerSuites = (repoRoot: string) => {
  const { VITEST: _vitest, ...cleanEnv } = process.env
  return ownerSuites.map(({ owner, file }) => {
    const result = spawnSync(
      "pnpm",
      [
        "exec",
        "vitest",
        "run",
        "--maxWorkers=1",
        "--no-file-parallelism",
        "--reporter=json",
        file,
      ],
      {
        cwd: repoRoot,
        encoding: "utf8",
        env: cleanEnv,
        maxBuffer: 32 * 1024 * 1024,
      },
    )
    if (
      result.status !== 0 ||
      result.signal !== null ||
      result.stderr.trim() !== ""
    ) {
      throw new TypeError(`V137_D11_OWNER_FAILED:${owner}`)
    }
    let report: JsonReport
    try {
      report = JSON.parse(result.stdout) as JsonReport
    } catch {
      throw new TypeError(`V137_D11_OWNER_RECEIPT_INVALID:${owner}`)
    }
    if (
      !report.success ||
      report.numFailedTests !== 0 ||
      report.numPendingTests !== 0 ||
      report.numTodoTests !== 0 ||
      report.numPassedTests < 1
    ) {
      throw new TypeError(`V137_D11_OWNER_INCOMPLETE:${owner}`)
    }
    return Object.freeze({
      owner,
      status: "passed" as const,
      testCount: report.numPassedTests,
      resultHash: sha256(result.stdout),
    })
  })
}

describe("v1.37 D-11 persistence rollback release matrix", () => {
  it("has one closed owner-backed row for every D-11 scenario", () => {
    expect(v137ReleaseRollbackScenarios().map(({ id }) => id)).toEqual(
      expectedD11Scenarios,
    )
  })

  it("executes every database owner suite without a configured skip", () => {
    expect(process.env.DATABASE_URL).toMatch(/^postgresql:\/\//u)
    const receipts = runV137ReleaseRollbackOwnerSuites(repositoryRoot)
    expect(receipts.every(({ status }) => status === "passed")).toBe(true)
    expect(receipts.map(({ owner }) => owner)).toEqual([
      "job-lifecycle",
      "completion-transaction",
      "cohort-compensation",
      "standings-recompute",
      "semantic-selection-rollback",
    ])
  }, 180_000)
})
