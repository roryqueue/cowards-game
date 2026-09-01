import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { afterEach, describe, expect, it } from "vitest"

import {
  AUTHORITY_KEYS,
  PLAN_125_REVIEW_SCHEMA,
  REQUIREMENT_IDS,
  V138_PLAN_262_95_PATHS,
  assertPlan125Review,
  assertReviewedReadiness,
  buildPlan125ReviewRoot,
  inspectCommittedPhase262Inventory,
  inspectDispositionBranch,
  projectLifecycleBranch,
  replaceReviewedReadiness,
  validateReviewedReadinessGate,
  validateProvisionalCloseoutGate,
} from "./check-v1-38-plan-262-95-lifecycle-v4.js"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)
const roots: string[] = []
const sha256 = (bytes: string | Buffer): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const canonicalFixture = (value: unknown): string => {
  const normalizeFixture = (child: any): any =>
    Array.isArray(child)
      ? child.map(normalizeFixture)
      : child !== null && typeof child === "object"
        ? Object.fromEntries(
            Object.entries(child)
              .sort(([left], [right]) => left.localeCompare(right))
              .map(([key, nested]) => [key, normalizeFixture(nested)]),
          )
        : child
  return `${JSON.stringify(normalizeFixture(value))}\n`
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true })
})

const deniedAuthority = Object.fromEntries(
  AUTHORITY_KEYS.map((key) => [key, false]),
)

const disposition = (overrides: Record<string, unknown> = {}) => ({
  schemaVersion: "v1.38-plan-262-94-admission-disposition-v4",
  status: "non_pass",
  producerDisposition: "exhausted",
  producerSucceeded: false,
  assuranceStatus: "clean",
  assuranceFindings: [],
  assuranceLimitation: "single_operator_local_seal_v1_no_hostile_same_uid",
  contamination: false,
  reproductionPreserved: false,
  counts: {
    freshAccepted: 0,
    requiredAccepted: 540,
    reproductionIdentitiesCharged: 0,
  },
  authority: deniedAuthority,
  ...overrides,
})

const passDisposition = () =>
  disposition({
    status: "pass",
    producerDisposition: "succeeded",
    producerSucceeded: true,
    reproductionPreserved: true,
    counts: {
      freshAccepted: 540,
      requiredAccepted: 540,
      reproductionIdentitiesCharged: 540,
    },
  })

describe("Plan 262-95 committed inventory", () => {
  it("enumerates the exact all-16 requirement set without a fixed plan count", () => {
    expect(REQUIREMENT_IDS).toEqual([
      "ADMIT-01",
      "ADMIT-02",
      "ADMIT-03",
      "ADMIT-04",
      "MEAS-01",
      "MEAS-02",
      "MEAS-03",
      "MEAS-04",
      "MEAS-05",
      "MEAS-06",
      "MEAS-07",
      "MEAS-08",
      "MEAS-09",
      "MEAS-10",
      "SEAL-01",
      "DECI-02",
    ])
  })

  it("derives every required artifact class from committed Git paths", () => {
    const inventory = inspectCommittedPhase262Inventory(repoRoot)
    expect(inventory.requirementIds).toEqual(REQUIREMENT_IDS)
    expect(inventory.activePlans.length).toBeGreaterThan(0)
    expect(inventory.historicalPlans.length).toBeGreaterThan(0)
    expect(inventory.dormantCarriers.length).toBeGreaterThan(0)
    expect(inventory.summaries.length).toBeGreaterThan(0)
    expect(inventory.reviews.length).toBeGreaterThan(0)
    expect(inventory.validations).toHaveLength(1)
    expect(inventory.verifications).toHaveLength(1)
    expect(inventory.allPaths).toEqual(
      [...inventory.allPaths].sort((left, right) => left.localeCompare(right)),
    )
    expect(inventory.counts.total).toBe(inventory.allPaths.length)
    expect(inventory.roots.all).toMatch(/^sha256:[a-f0-9]{64}$/u)
  })
})

describe("Plan 262-95 branch honesty", () => {
  it("projects the actual exhausted 0/540 branch as bookkeeping-only gaps", () => {
    const actual = JSON.parse(
      readFileSync(
        path.join(repoRoot, V138_PLAN_262_95_PATHS.disposition),
        "utf8",
      ),
    )
    const inspected = inspectDispositionBranch(actual, {
      reproductionPresent: false,
      route12Present: false,
    })
    const projected = projectLifecycleBranch(inspected)
    expect(projected).toMatchObject({
      branch: "gaps",
      admit03: "blocked",
      phase262: "incomplete",
      phase263PlanningEligible: false,
      phase263ExecutionEligible: false,
      permittedMutationClass: "branch_neutral_bookkeeping_only",
      authority: deniedAuthority,
    })
  })

  it("permits provisional Phase 262 completion only for reviewed exact clean 540/540", () => {
    const projected = projectLifecycleBranch(
      inspectDispositionBranch(passDisposition(), {
        reproductionPresent: true,
        route12Present: true,
      }),
    )
    expect(projected).toMatchObject({
      branch: "pass",
      admit03: "provisionally_complete_pending_convergence",
      phase262: "provisionally_complete_pending_convergence",
      phase263PlanningEligible: false,
      phase263ExecutionEligible: false,
      permittedMutationClass: "provisional_foundation_status_only",
      authority: deniedAuthority,
    })
  })

  it.each([
    ["non-pass Route-12", disposition(), false, true],
    [
      "successful producer without reproduction",
      passDisposition(),
      false,
      true,
    ],
    [
      "assurance non-pass without preserved reproduction",
      passDisposition(),
      false,
      false,
    ],
    [
      "external custody overclaim",
      disposition({ assuranceLimitation: "independent_external_custody" }),
      false,
      false,
    ],
  ])("rejects %s", (_name, candidate, reproductionPresent, route12Present) => {
    expect(() =>
      inspectDispositionBranch(candidate, {
        reproductionPresent,
        route12Present,
      }),
    ).toThrow()
  })

  it("preserves reproduction on a later assurance non-pass while forbidding Route-12", () => {
    const candidate: any = passDisposition()
    candidate.status = "non_pass"
    candidate.assuranceStatus = "defects_found"
    candidate.assuranceFindings = ["post-run-assurance"]
    expect(
      projectLifecycleBranch(
        inspectDispositionBranch(candidate, {
          reproductionPresent: true,
          route12Present: false,
        }),
      ).branch,
    ).toBe("gaps")
  })
})

const createReviewFixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "v138-plan-262-95-review-"))
  roots.push(root)
  execFileSync("git", ["init", "-q"], { cwd: root })
  execFileSync("git", ["config", "user.email", "fixture@example.invalid"], {
    cwd: root,
  })
  execFileSync("git", ["config", "user.name", "fixture"], { cwd: root })
  const sourceFiles = [
    "scripts/check-v1-38-plan-262-95-lifecycle-v4.ts",
    "scripts/check-v1-38-plan-262-95-lifecycle-v4.test.ts",
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-95-SUMMARY.md",
  ]
  for (const [index, relative] of sourceFiles.entries()) {
    mkdirSync(path.dirname(path.join(root, relative)), { recursive: true })
    writeFileSync(path.join(root, relative), `fixture-${index}\n`)
  }
  const inventoryFiles = [
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-01-PLAN.md",
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/archived/262-02-HISTORICAL.md",
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/dormant/262-03-ACTIVATION-CONTRACT.md",
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-01-SUMMARY.md",
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-01-REVIEW.md",
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-VALIDATION.md",
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-VERIFICATION.md",
  ]
  for (const relative of inventoryFiles) {
    mkdirSync(path.dirname(path.join(root, relative)), { recursive: true })
    writeFileSync(path.join(root, relative), `${relative}\n`)
  }
  execFileSync("git", ["add", ...sourceFiles, ...inventoryFiles], { cwd: root })
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root })
  const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim()
  const sourceTree = execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
    cwd: root,
    encoding: "utf8",
  }).trim()
  const entries = sourceFiles.map((relative) => ({
    path: relative,
    mode: "100644",
    blob: execFileSync("git", ["rev-parse", `HEAD:${relative}`], {
      cwd: root,
      encoding: "utf8",
    }).trim(),
    sha256: sha256(readFileSync(path.join(root, relative))),
  }))
  const body = {
    schemaVersion: PLAN_125_REVIEW_SCHEMA,
    sourceCommit,
    sourceTree,
    sourceFiles: entries,
    findingCount: 0,
    plan126Eligible: true,
    authorizesExecution: false as const,
  }
  const review = { ...body, reviewRoot: buildPlan125ReviewRoot(body) }
  return { root, review }
}

const commitReviewFixture = (root: string, review: unknown) => {
  const reviewPath = path.join(root, V138_PLAN_262_95_PATHS.review125)
  mkdirSync(path.dirname(reviewPath), { recursive: true })
  writeFileSync(reviewPath, `${JSON.stringify(review)}\n`)
  execFileSync("git", ["add", V138_PLAN_262_95_PATHS.review125], { cwd: root })
  execFileSync("git", ["commit", "-qm", "review"], { cwd: root })
}

const commitInventoryPath = (root: string, relative: string) => {
  const target = path.join(root, relative)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, `${relative}\n`)
  execFileSync("git", ["add", relative], { cwd: root })
  execFileSync("git", ["commit", "-qm", `add ${path.basename(relative)}`], {
    cwd: root,
  })
}

const fixtureSourceFiles = [
  "scripts/check-v1-38-plan-262-95-lifecycle-v4.ts",
  "scripts/check-v1-38-plan-262-95-lifecycle-v4.test.ts",
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-95-SUMMARY.md",
]

const buildFixtureReview = (root: string) => {
  const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim()
  const sourceTree = execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
    cwd: root,
    encoding: "utf8",
  }).trim()
  const sourceFiles = fixtureSourceFiles.map((relative) => ({
    path: relative,
    mode: "100644",
    blob: execFileSync("git", ["rev-parse", `HEAD:${relative}`], {
      cwd: root,
      encoding: "utf8",
    }).trim(),
    sha256: sha256(readFileSync(path.join(root, relative))),
  }))
  const body = {
    schemaVersion: PLAN_125_REVIEW_SCHEMA,
    sourceCommit,
    sourceTree,
    sourceFiles,
    findingCount: 0,
    plan126Eligible: true,
    authorizesExecution: false as const,
  }
  return { ...body, reviewRoot: buildPlan125ReviewRoot(body) }
}

const prepareReplacementFixture = () => {
  const { root, review: oldReview } = createReviewFixture()
  commitReviewFixture(root, oldReview)
  const oldReadiness = validateReviewedReadinessGate(root, oldReview)
  const dispositionPath = path.join(root, V138_PLAN_262_95_PATHS.disposition)
  const readinessPath = path.join(root, V138_PLAN_262_95_PATHS.readiness)
  mkdirSync(path.dirname(dispositionPath), { recursive: true })
  writeFileSync(dispositionPath, `${JSON.stringify(disposition())}\n`)
  mkdirSync(path.dirname(readinessPath), { recursive: true })
  writeFileSync(readinessPath, canonicalFixture(oldReadiness))
  execFileSync(
    "git",
    [
      "add",
      V138_PLAN_262_95_PATHS.disposition,
      V138_PLAN_262_95_PATHS.readiness,
    ],
    { cwd: root },
  )
  execFileSync("git", ["commit", "-qm", "old readiness"], { cwd: root })
  commitInventoryPath(root, V138_PLAN_262_95_PATHS.summary126)
  writeFileSync(
    path.join(root, V138_PLAN_262_95_PATHS.source),
    "fixture-current-source\n",
  )
  execFileSync("git", ["add", V138_PLAN_262_95_PATHS.source], { cwd: root })
  execFileSync("git", ["commit", "-qm", "current source"], { cwd: root })
  const freshReview = buildFixtureReview(root)
  commitReviewFixture(root, freshReview)
  return { root, oldReadiness, freshReview }
}

describe("Plan 262-125 and Plan 262-126 closed gates", () => {
  it("authenticates the frozen domain-separated literal-zero review schema", () => {
    const { root, review } = createReviewFixture()
    expect(assertPlan125Review(root, review)).toEqual(review)
  })

  it.each([
    ["finding", (review: any) => ({ ...review, findingCount: 1 })],
    ["eligibility", (review: any) => ({ ...review, plan126Eligible: false })],
    ["authority", (review: any) => ({ ...review, authorizesExecution: true })],
    [
      "root",
      (review: any) => ({ ...review, reviewRoot: `sha256:${"0".repeat(64)}` }),
    ],
    [
      "source entry",
      (review: any) => ({
        ...review,
        sourceFiles: review.sourceFiles.slice(1),
      }),
    ],
  ])("rejects a stale or false %s review before readiness", (_name, mutate) => {
    const { root, review } = createReviewFixture()
    expect(() => assertPlan125Review(root, mutate(review))).toThrow()
  })

  it("keeps reviewed readiness entirely non-authorizing and mutation-free", () => {
    const { root, review } = createReviewFixture()
    const readiness = validateReviewedReadinessGate(root, review)
    expect(readiness).toMatchObject({
      schemaVersion: "v1.38-plan-262-126-lifecycle-readiness-v4",
      reviewedSourceEligible: true,
      lifecycleMutationAuthorized: false,
      authorizesExecution: false,
      authority: deniedAuthority,
    })
  })

  it("accepts only the committed Plan 126 summary as the post-readiness inventory transition", () => {
    const { root, review } = createReviewFixture()
    commitReviewFixture(root, review)
    const readiness = validateReviewedReadinessGate(root, review)
    commitInventoryPath(root, V138_PLAN_262_95_PATHS.summary126)

    expect(assertReviewedReadiness(root, readiness)).toEqual(readiness)
  })

  it.each([
    [
      "another summary instead of Plan 126",
      [
        ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-127-SUMMARY.md",
      ],
    ],
    [
      "an additional summary",
      [
        V138_PLAN_262_95_PATHS.summary126,
        ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-127-SUMMARY.md",
      ],
    ],
    [
      "an additional review",
      [
        V138_PLAN_262_95_PATHS.summary126,
        ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-126-REVIEW.md",
      ],
    ],
  ])("rejects %s after readiness", (_name, additions) => {
    const { root, review } = createReviewFixture()
    commitReviewFixture(root, review)
    const readiness = validateReviewedReadinessGate(root, review)
    for (const relative of additions) commitInventoryPath(root, relative)

    expect(() => assertReviewedReadiness(root, readiness)).toThrow(
      "V138_PLAN_262_95_READINESS_INVALID",
    )
  })

  it("rejects stale or modified readiness inventory metadata", () => {
    const { root, review } = createReviewFixture()
    commitReviewFixture(root, review)
    const readiness: any = validateReviewedReadinessGate(root, review)
    commitInventoryPath(root, V138_PLAN_262_95_PATHS.summary126)
    const modified = {
      ...readiness,
      inventoryCounts: {
        ...readiness.inventoryCounts,
        summaries: readiness.inventoryCounts.summaries - 1,
      },
    }

    expect(() => assertReviewedReadiness(root, modified)).toThrow(
      "V138_PLAN_262_95_READINESS_INVALID",
    )
  })

  it("requires committed Plan 126 proof and correction before provisional closeout", () => {
    const gate = {
      readinessCommitted: true,
      readinessValid: true,
      metadataCorrectionCommitted: true,
      metadataCorrectionValid: true,
      validationCommitted: true,
      validationComplete: true,
      verificationCommitted: true,
      verificationComplete: true,
      summary126Committed: true,
      review125Committed: true,
      review125Valid: true,
    }
    expect(validateProvisionalCloseoutGate(gate)).toEqual(gate)
    for (const key of Object.keys(gate)) {
      expect(() =>
        validateProvisionalCloseoutGate({ ...gate, [key]: false }),
      ).toThrow()
    }
  })

  it("atomically replaces only stale canonical readiness after refreshed review", () => {
    const { root, oldReadiness, freshReview } = prepareReplacementFixture()
    const beforeDisposition = readFileSync(
      path.join(root, V138_PLAN_262_95_PATHS.disposition),
    )

    const replacement = replaceReviewedReadiness(root)

    expect(replacement.sourceCommit).toBe(freshReview.sourceCommit)
    expect(replacement.reviewRoot).toBe(freshReview.reviewRoot)
    expect(replacement.readinessRoot).not.toBe(oldReadiness.readinessRoot)
    expect(
      readFileSync(path.join(root, V138_PLAN_262_95_PATHS.disposition), "utf8"),
    ).toBe(beforeDisposition.toString("utf8"))
    expect(
      JSON.parse(
        readFileSync(
          path.join(root, V138_PLAN_262_95_PATHS.readiness),
          "utf8",
        ),
      ),
    ).toEqual(replacement)
  })

  it.each([
    "missing",
    "malformed",
    "noncanonical",
    "current",
    "drift",
    "stale-review",
  ])(
    "rejects %s readiness replacement state",
    (failure) => {
      const { root, freshReview } = prepareReplacementFixture()
      const readinessPath = path.join(root, V138_PLAN_262_95_PATHS.readiness)
      if (failure === "missing") rmSync(readinessPath)
      if (failure === "malformed") {
        writeFileSync(readinessPath, "{\n")
        execFileSync("git", ["add", V138_PLAN_262_95_PATHS.readiness], {
          cwd: root,
        })
        execFileSync("git", ["commit", "-qm", "malformed readiness"], {
          cwd: root,
        })
      }
      if (failure === "noncanonical") {
        const parsed = JSON.parse(readFileSync(readinessPath, "utf8"))
        writeFileSync(readinessPath, `${JSON.stringify(parsed, null, 2)}\n`)
        execFileSync("git", ["add", V138_PLAN_262_95_PATHS.readiness], {
          cwd: root,
        })
        execFileSync("git", ["commit", "-qm", "noncanonical readiness"], {
          cwd: root,
        })
      }
      if (failure === "current") {
        writeFileSync(
          readinessPath,
          canonicalFixture(validateReviewedReadinessGate(root, freshReview)),
        )
        execFileSync("git", ["add", V138_PLAN_262_95_PATHS.readiness], {
          cwd: root,
        })
        execFileSync("git", ["commit", "-qm", "current readiness"], {
          cwd: root,
        })
      }
      if (failure === "drift")
        writeFileSync(
          path.join(root, V138_PLAN_262_95_PATHS.source),
          "uncommitted mutation\n",
        )
      if (failure === "stale-review") {
        writeFileSync(
          path.join(root, V138_PLAN_262_95_PATHS.source),
          "committed after review\n",
        )
        execFileSync("git", ["add", V138_PLAN_262_95_PATHS.source], {
          cwd: root,
        })
        execFileSync("git", ["commit", "-qm", "source after review"], {
          cwd: root,
        })
      }

      expect(() => replaceReviewedReadiness(root)).toThrow()
    },
  )
})

describe("Plan 262-95 command publication incapability", () => {
  it.each(["--check-source-only", "--check-prospective"])(
    "%s is deterministic and writes nothing",
    (selector) => {
      const watched = [
        V138_PLAN_262_95_PATHS.readiness,
        V138_PLAN_262_95_PATHS.legacyReadiness,
        V138_PLAN_262_95_PATHS.lifecycle,
        V138_PLAN_262_95_PATHS.metadataCorrection,
        V138_PLAN_262_95_PATHS.validation,
        V138_PLAN_262_95_PATHS.verification,
        V138_PLAN_262_95_PATHS.requirements,
        V138_PLAN_262_95_PATHS.roadmap,
        V138_PLAN_262_95_PATHS.state,
      ]
      const before = watched.map((relative) => {
        try {
          return sha256(readFileSync(path.join(repoRoot, relative)))
        } catch (error) {
          if ((error as { code?: string }).code === "ENOENT") return "absent"
          throw error
        }
      })
      const first = execFileSync(
        process.execPath,
        ["--import", "tsx", V138_PLAN_262_95_PATHS.source, selector],
        { cwd: repoRoot, encoding: "utf8" },
      )
      const second = execFileSync(
        process.execPath,
        ["--import", "tsx", V138_PLAN_262_95_PATHS.source, selector],
        { cwd: repoRoot, encoding: "utf8" },
      )
      expect(second).toBe(first)
      const after = watched.map((relative) => {
        try {
          return sha256(readFileSync(path.join(repoRoot, relative)))
        } catch (error) {
          if ((error as { code?: string }).code === "ENOENT") return "absent"
          throw error
        }
      })
      expect(after).toEqual(before)
    },
  )
})
