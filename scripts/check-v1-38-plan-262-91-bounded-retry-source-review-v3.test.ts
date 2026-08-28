import { execFileSync } from "node:child_process"
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

const loadReviewer = async () =>
  import("./check-v1-38-plan-262-91-bounded-retry-source-review-v3.js")

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const roots: string[] = []

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true })
})

describe("Plan 262-91 bounded-retry v3 committed-source review", () => {
  it("derives exact Plan-90 custody without trusting its summary verdict", async () => {
    const reviewer = await loadReviewer()
    const before = reviewer.snapshotV138Plan26291Destinations(process.cwd())
    const review = reviewer.deriveV138Plan26291NoPublish(process.cwd())

    expect(reviewer.snapshotV138Plan26291Destinations(process.cwd())).toEqual(
      before,
    )
    expect(review.reviewedSource).toMatchObject({
      commit: "32f53bb743db799810dff820b8b7eb309b6a6629",
      tree: "63328eb2f3454508e664c89017d2bd6cb0213695",
      parent: "382d99326fec7a165c6416f4db800665aab02a1e",
      summaryTrustedAsVerdict: false,
    })
    expect(review.reviewedSource.blobs).toHaveLength(4)
    expect(review.reviewedSource.blobs.every((item: any) => item.mode === "100644")).toBe(true)
    expect(review.detachedExercise).toMatchObject({
      ownerMode: "0700",
      focusedTestsPassed: 40,
      sourceOnlyPassed: true,
      executedCheckoutBytesBoundToGitBlobs: true,
      installedClosureAuthenticated: true,
      ambientTsxChildUsed: false,
      canonicalWrites: 0,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
    })
    expect(review.status).toBe("blocked")
    expect(review.findingCount).toBeGreaterThan(0)
    expect(review.findings.map((item: any) => item.code)).toEqual(
      expect.arrayContaining([
        "AMBIENT_GIT_EXECUTION",
        "CURRENT_INSTALLED_CLOSURE_NOT_AUTHENTICATED",
        "EXECUTED_CHECKOUT_BINDING_NOT_ENFORCED",
        "NATIVE_PUBLICATION_NOT_ENFORCED",
        "PATHNAME_LOCK_LAUNCH_UNAUTHENTICATED",
        "ADVERSARIAL_SOURCE_TEST_MATRIX_INCOMPLETE",
      ]),
    )
    expect(review.authority).toMatchObject({
      plan26292Eligible: false,
      authorizesExecution: false,
      sealV13Created: false,
      retryEnvelopeV3Created: false,
      liveInvoked: false,
      lifecycleMutated: false,
      freshCharged: 0,
      freshAccepted: 0,
      phase263PlanningAuthorized: false,
      productionAuthorized: false,
      archiveAuthorized: false,
      tagAuthorized: false,
    })
    expect(Object.values(review.identityClaims).every((value) => !value)).toBe(true)
  }, 180_000)

  it("turns every incomplete or failed observation into a deterministic finding", async () => {
    const reviewer = await loadReviewer()
    const evaluated = reviewer.evaluateV138Plan26291Observations([
      {
        id: "git-custody",
        executed: true,
        passed: true,
        detail: { exact: true },
      },
      {
        id: "native-publication",
        executed: true,
        passed: false,
        detail: { implementation: "path-based" },
      },
    ])
    expect(evaluated.findings.map((item: any) => item.code)).toEqual(
      expect.arrayContaining([
        "OBSERVATION_NATIVE_PUBLICATION_FAILED",
        "OBSERVATION_PROTECTED_HISTORY_INCOMPLETE",
        "OBSERVATION_CANONICAL_ABSENCE_INCOMPLETE",
      ]),
    )
    expect(evaluated.findings).toEqual(
      [...evaluated.findings].sort((left, right) =>
        left.code.localeCompare(right.code),
      ),
    )
  })

  it("detects every named source mutation family in disposable fixtures", async () => {
    const reviewer = await loadReviewer()
    const source = {
      model: readFileSync(reviewer.V138_PLAN_262_91_SOURCE_PATHS[0], "utf8"),
      controller: readFileSync(reviewer.V138_PLAN_262_91_SOURCE_PATHS[1], "utf8"),
      tests: readFileSync(reviewer.V138_PLAN_262_91_SOURCE_PATHS[2], "utf8"),
      summary: readFileSync(reviewer.V138_PLAN_262_91_SOURCE_PATHS[3], "utf8"),
    }
    const baseline = reviewer.inspectV138Plan26291Source(source)
    expect(baseline).toEqual(
      expect.arrayContaining([
        "AMBIENT_GIT_EXECUTION",
        "CURRENT_INSTALLED_CLOSURE_NOT_AUTHENTICATED",
      ]),
    )
    for (const [code, file, token, replacement] of reviewer.V138_PLAN_262_91_MUTATIONS) {
      const root = mkdtempSync(path.join(tmpdir(), "v138-plan26291-mutation-"))
      roots.push(root)
      const fixture = path.join(root, `${file}.txt`)
      mkdirSync(path.dirname(fixture), { recursive: true })
      const mutated = source[file].replace(token, replacement)
      writeFileSync(fixture, mutated, { mode: 0o600 })
      expect(mutated, `${code} fixture`).not.toBe(source[file])
      expect(
        reviewer.inspectV138Plan26291Source({
          ...source,
          [file]: readFileSync(fixture, "utf8"),
        }),
        code,
      ).toContain(code)
    }
  })

  it("rejects findings, eligibility, roots, custody, and false-authority tampering", async () => {
    const reviewer = await loadReviewer()
    const review = reviewer.deriveV138Plan26291NoPublish(process.cwd())
    expect(reviewer.validateV138Plan26291Review(review, review)).toBe(true)
    for (const mutate of [
      (value: any) => {
        value.authority.authorizesExecution = true
      },
      (value: any) => {
        value.authority.plan26292Eligible = true
      },
      (value: any) => {
        value.identityClaims.independentCustodyClaimed = true
      },
      (value: any) => {
        value.protectedHistory.correctionV10Root = `sha256:${"0".repeat(64)}`
      },
      (value: any) => {
        value.reviewedSource.blobs[0].blob = "0".repeat(40)
      },
      (value: any) => {
        value.findings = []
        value.findingCount = 0
        value.status = "zero_findings"
        value.sourceReviewPassed = true
      },
    ]) {
      const candidate = clone(review)
      mutate(candidate)
      candidate.reviewRoot = reviewer.computeV138Plan26291ReviewRoot(candidate)
      expect(() =>
        reviewer.validateV138Plan26291Review(candidate, review),
      ).toThrow("V138_PLAN_262_91_REVIEW_MISMATCH")
    }
  }, 180_000)

  it("derive-no-publish is non-authorizing and leaves every destination unchanged", async () => {
    const reviewer = await loadReviewer()
    const before = reviewer.snapshotV138Plan26291Destinations(process.cwd())
    const output = JSON.parse(
      execFileSync(
        "pnpm",
        [
          "exec",
          "tsx",
          reviewer.V138_PLAN_262_91_CHECKER_PATH,
          "--derive-no-publish",
        ],
        { encoding: "utf8", timeout: 180_000 },
      ),
    )
    expect(output).toMatchObject({
      status: "blocked",
      plan26292Eligible: false,
      authorizesExecution: false,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
    })
    expect(reviewer.snapshotV138Plan26291Destinations(process.cwd())).toEqual(
      before,
    )
  }, 180_000)
})
