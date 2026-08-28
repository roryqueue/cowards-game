import { execFileSync } from "node:child_process"
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  V138_PLAN_262_105_ACTUAL_MODES,
  checkV138Plan262105PublishedReview,
  checkV138Plan262105ReviewModeBranch,
  deriveV138Plan262105ReviewNoPublish,
  inspectV138Plan262104SourceIndependent,
  inspectV138Plan262103TrioIndependent,
  renderV138Plan262105Review,
  resultPreimageV138Plan262105Independent,
  validateV138Plan262105Result,
} from "./check-v1-38-plan-262-105-pair-publication-source-review-v1.js"

const repoRoot = path.resolve(import.meta.dirname, "..")
const temporaryRoots: string[] = []
const canonicalIndependent = (value: unknown): string => {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize)
    if (item !== null && typeof item === "object")
      return Object.fromEntries(
        Object.entries(item as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, child]) => [key, normalize(child)]),
      )
    return item
  }
  return `${JSON.stringify(normalize(value))}\n`
}

const git = (root: string, args: readonly string[]): string =>
  execFileSync(
    "/usr/bin/git",
    ["-c", "core.hooksPath=/dev/null", "-c", "commit.gpgSign=false", ...args],
    {
      cwd: root,
      encoding: "utf8",
      env: {
        PATH: "/usr/bin:/bin",
        LANG: "C",
        LC_ALL: "C",
        HOME: root,
        GIT_CONFIG_NOSYSTEM: "1",
        GIT_CONFIG_GLOBAL: "/dev/null",
        GIT_NO_REPLACE_OBJECTS: "1",
      },
    },
  ).trim()

const disposableClone = (): string => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan-262-105-test-"))
  chmodSync(owner, 0o700)
  temporaryRoots.push(owner)
  const clone = path.join(owner, "repo")
  execFileSync(
    "/usr/bin/git",
    ["-c", "core.hooksPath=/dev/null", "clone", "--quiet", "--no-local", repoRoot, clone],
    { env: { PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C", HOME: owner } },
  )
  symlinkSync(path.join(repoRoot, "node_modules"), path.join(clone, "node_modules"), "dir")
  git(clone, ["config", "user.name", "Plan 262 Independent Review"])
  git(clone, ["config", "user.email", "plan-262-review@example.invalid"])
  return clone
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0))
    rmSync(root, { recursive: true, force: true })
})

describe("Plan 262-105 independent source custody", () => {
  it("authenticates exact Plan-104 raw Git objects without producer verdicts", () => {
    expect(inspectV138Plan262104SourceIndependent(repoRoot)).toEqual({
      commit: "58669ae69376375f171aa56fd57b331355703e9a",
      tree: "cca6ff090cc82c70f28109fbbedf3c2f61fa073b",
      parent: "d86abb40eb8bbc68860925072b1c9cd4fe42dfb4",
      noLaterRewrite: true,
      files: [
        {
          path: "scripts/run-v1-38-bounded-retry-envelope-v3-review-v7.ts",
          mode: "100644",
          blob: "b293acb6b025aa460b9e886379fe47498e3fb705",
          byteLength: 25_977,
          sha256: "sha256:d8fed836bf6c1b6c81a65b3ecb01818fef38bfe7905a4a223e35f37ebed88642",
        },
        {
          path: "scripts/run-v1-38-bounded-retry-envelope-v3-review-v7.test.ts",
          mode: "100644",
          blob: "9c9a52ce996245959b5fbf1006749e05d85b7a0c",
          byteLength: 10_446,
          sha256: "sha256:efe202a4302b5cfa11d0c95a4de34059b31f4fdfd57c4823ef440076334dd6d2",
        },
      ],
    })
  })

  it("independently resolves the exact carrier-bound trio below later history", () => {
    expect(inspectV138Plan262103TrioIndependent(repoRoot)).toMatchObject({
      reviewedSourceCommit: "332aae093ef6e26c95a18f21cfd253ccc829ce48",
      publicationCommit: "2f4fd225ca32b0ac67c2fd09f3036cbbe208725c",
      noLaterRewrite: true,
      candidate: { mode: "100644", blob: "2d3f995bcd4c0067e3d8c0c2a0120a36bfdc1745" },
      review: { mode: "100644", blob: "680616684dcdc408829923bf9f062a075ddf32f2" },
      carrier: { mode: "100644", blob: "89d1077b12672c4a066cbcba77568e228c0669de" },
    })
  })

  it("pins exactly the four non-live actual v7 modes", () => {
    expect(V138_PLAN_262_105_ACTUAL_MODES).toEqual([
      "--check-source-only",
      "--derive-seal-envelope-no-publish",
      "--publish-sealed-inactive-envelope",
      "--check-sealed-inactive-envelope",
    ])
    expect(V138_PLAN_262_105_ACTUAL_MODES.some((mode) => /live|run/u.test(mode))).toBe(false)
  })

  it("rejects working-byte and mode drift before any actual mode", () => {
    const clone = disposableClone()
    const sourcePath = path.join(clone, "scripts/run-v1-38-bounded-retry-envelope-v3-review-v7.ts")
    writeFileSync(sourcePath, Buffer.concat([readFileSync(sourcePath), Buffer.from("\n")]))
    expect(() => inspectV138Plan262104SourceIndependent(clone)).toThrow(
      "V138_PLAN_262_105_SOURCE_WORKING_BYTES_INVALID",
    )
    git(clone, ["checkout", "--", "scripts/run-v1-38-bounded-retry-envelope-v3-review-v7.ts"])
    chmodSync(sourcePath, 0o755)
    expect(() => inspectV138Plan262104SourceIndependent(clone)).toThrow(
      "V138_PLAN_262_105_SOURCE_WORKING_MODE_INVALID",
    )
  })

  it("rejects later trio rewrite and duplicate exact publication", () => {
    const clone = disposableClone()
    const trio = [
      ".planning/artifacts/v1.38-plan-262-103-bounded-retry-source-rereview-payload-v6.json",
      ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-103-REVIEW.md",
      ".planning/artifacts/v1.38-plan-262-103-bounded-retry-source-rereview-carrier-v1.json",
    ]
    const candidate = path.join(clone, trio[0])
    writeFileSync(candidate, Buffer.concat([readFileSync(candidate), Buffer.from(" \n")]))
    git(clone, ["add", "--", trio[0]])
    git(clone, ["commit", "-m", "rewrite trio"])
    git(clone, ["checkout", "2f4fd225ca32b0ac67c2fd09f3036cbbe208725c", "--", trio[0]])
    expect(() => inspectV138Plan262103TrioIndependent(clone)).toThrow(
      "V138_PLAN_262_105_TRIO_REWRITTEN",
    )

    const clone2 = disposableClone()
    git(clone2, ["rm", "--", ...trio])
    git(clone2, ["commit", "-m", "remove trio"])
    git(clone2, ["checkout", "2f4fd225ca32b0ac67c2fd09f3036cbbe208725c", "--", ...trio])
    git(clone2, ["commit", "-m", "duplicate trio"])
    expect(() => inspectV138Plan262103TrioIndependent(clone2)).toThrow(
      "V138_PLAN_262_105_TRIO_PUBLICATION_NOT_UNIQUE",
    )
  })
})

describe("Plan 262-105 actual four-mode review", () => {
  it("runs all actual v7 modes in one disposable later-summary topology", () => {
    const beforeHead = git(repoRoot, ["rev-parse", "HEAD"])
    const beforeRefs = git(repoRoot, ["for-each-ref", "--format=%(refname)%00%(objectname)"])
    const reviewed = deriveV138Plan262105ReviewNoPublish(repoRoot)
    expect(reviewed.result).toMatchObject({
      schemaVersion: "v1.38-plan-262-105-pair-publication-source-review-v1",
      protocol: "git-object-pair-publication-source-review-v1",
      status: "zero_findings",
      findingCount: 0,
      findings: [],
      source: {
        commit: "58669ae69376375f171aa56fd57b331355703e9a",
        tree: "cca6ff090cc82c70f28109fbbedf3c2f61fa073b",
        parent: "d86abb40eb8bbc68860925072b1c9cd4fe42dfb4",
      },
      lineage: {
        reviewedSourceCommit: "332aae093ef6e26c95a18f21cfd253ccc829ce48",
        publicationCommit: "2f4fd225ca32b0ac67c2fd09f3036cbbe208725c",
      },
      execution: {
        ownerOnly: true,
        noLocalClone: true,
        laterSummaryTopology: true,
        cleanupComplete: true,
        canonicalRefsUnchanged: true,
        canonicalObjectsUnchanged: true,
        canonicalDestinationsUnchanged: true,
        modes: {
          "--check-source-only": { status: "passed" },
          "--derive-seal-envelope-no-publish": { status: "passed" },
          "--publish-sealed-inactive-envelope": { status: "passed" },
          "--check-sealed-inactive-envelope": { status: "passed" },
        },
      },
      authority: {
        plan26292Eligible: true,
        authorizesExecution: false,
        liveInvoked: false,
        freshCharged: 0,
        freshAccepted: 0,
        phase263PlanningAuthorized: false,
      },
    })
    expect(reviewed.result.reviewRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(reviewed.result.resultRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(reviewed.reportBytes.toString("utf8")).toBe(
      renderV138Plan262105Review(reviewed.result),
    )
    expect(git(repoRoot, ["rev-parse", "HEAD"])).toBe(beforeHead)
    expect(git(repoRoot, ["for-each-ref", "--format=%(refname)%00%(objectname)"])).toBe(beforeRefs)
  }, 180_000)

  it("uses the exact one-field result-root preimage and deterministic REVIEW bytes", () => {
    const reviewed = deriveV138Plan262105ReviewNoPublish(repoRoot)
    const body = { ...reviewed.result } as Record<string, unknown>
    delete body.resultRoot
    expect(resultPreimageV138Plan262105Independent(reviewed.result)).toEqual(
      Buffer.concat([
        Buffer.from("v1.38:plan-262-105:pair-publication-source-review:result:v1"),
        Buffer.from([0]),
        Buffer.from(canonicalIndependent(body)),
      ]),
    )
    expect(validateV138Plan262105Result(reviewed.result, reviewed.reportBytes)).toBe(true)
  }, 180_000)

  it("blocks every non-literal-zero mode or authority branch", () => {
    const reviewed = deriveV138Plan262105ReviewNoPublish(repoRoot)
    const badMode = structuredClone(reviewed.result)
    badMode.execution.modes["--publish-sealed-inactive-envelope"].status = "rejected_expected"
    expect(() => validateV138Plan262105Result(badMode, reviewed.reportBytes)).toThrow(
      "V138_PLAN_262_105_RESULT_INVALID",
    )
    const badAuthority = structuredClone(reviewed.result)
    badAuthority.authority.productionAuthorized = true
    expect(() => validateV138Plan262105Result(badAuthority, reviewed.reportBytes)).toThrow(
      "V138_PLAN_262_105_RESULT_INVALID",
    )
    const badCleanup = structuredClone(reviewed.result)
    badCleanup.execution.cleanupComplete = false
    expect(() => validateV138Plan262105Result(badCleanup, reviewed.reportBytes)).toThrow(
      "V138_PLAN_262_105_RESULT_INVALID",
    )
  }, 180_000)

  it("checks the canonical published pair and literal-zero mode branch", () => {
    const checked = checkV138Plan262105PublishedReview(repoRoot)
    expect(checked.result.status).toBe("zero_findings")
    expect(checkV138Plan262105ReviewModeBranch(repoRoot).result.authority.plan26292Eligible).toBe(true)
  })
})
