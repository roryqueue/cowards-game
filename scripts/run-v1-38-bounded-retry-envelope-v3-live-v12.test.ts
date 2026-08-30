import { execFileSync } from "node:child_process"
import {
  chmodSync,
  lstatSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  V138_LIVE_V12_MODES,
  V138_LIVE_V12_PATHS,
  authenticateV138LiveV12SourceOnly,
  checkV138LiveV12ProspectiveCustodyForReview,
  deriveV138LiveV12ProspectiveContractsForReview,
  executeV138LiveV12Cli,
  inspectV138LiveV12ProductionBoundaryForReview,
  inspectV138LiveV12ProductionBoundarySourceForReview,
} from "./run-v1-38-bounded-retry-envelope-v3-live-v12.js"

const repoRoot = path.resolve(import.meta.dirname, "..")
const correctionCommit = "0f8258d888eba27cfaa48a9cc5175e578364077b"
const correctionParent = "7f65ff66be29de4f655736f60d6c68683fae3e35"
const producerDestinations = [
  ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json",
  ".planning/artifacts/v1.38-current-matrix-retry-v3-journal.json",
]

const runExpectingFailure = (script: string, selector: string): string => {
  try {
    execFileSync("pnpm", ["exec", "tsx", script, selector], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
    throw new Error("EXPECTED_FAIL_CLOSED_REJECTION")
  } catch (error) {
    return `${(error as { stderr?: string }).stderr ?? ""}${String(error)}`
  }
}

const withLinkedWorktree = <T>(run: (root: string) => T): T => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-live-v12-test-"))
  const root = path.join(owner, "repo")
  let added = false
  try {
    execFileSync("/usr/bin/git", ["worktree", "add", "--quiet", "--detach", root, "HEAD"], {
      cwd: repoRoot,
      env: { PATH: "/usr/bin:/bin", HOME: owner, LANG: "C", LC_ALL: "C" },
    })
    added = true
    symlinkSync(path.join(repoRoot, "node_modules"), path.join(root, "node_modules"), "dir")
    for (const repoPath of [V138_LIVE_V12_PATHS.seal, V138_LIVE_V12_PATHS.envelope])
      chmodSync(path.join(root, repoPath), 0o600)
    return run(root)
  } finally {
    if (added) {
      try { execFileSync("/usr/bin/git", ["worktree", "remove", "--force", root], { cwd: repoRoot }) }
      catch { /* preserve the primary assertion */ }
    }
    rmSync(owner, { recursive: true, force: true })
  }
}

const withProspectiveClosure = <T>(run: (root: string) => T): T => withLinkedWorktree((root) => {
  writeFileSync(
    path.join(root, V138_LIVE_V12_PATHS.tests),
    readFileSync(path.join(repoRoot, V138_LIVE_V12_PATHS.tests)),
  )
  execFileSync("/usr/bin/git", ["add", V138_LIVE_V12_PATHS.tests], { cwd: root })
  if (execFileSync("/usr/bin/git", ["status", "--short"], { cwd: root, encoding: "utf8" }) !== "")
    execFileSync("/usr/bin/git", [
      "-c", "user.name=Plan 262 Test", "-c", "user.email=plan262-test@example.invalid",
      "commit", "--quiet", "-m", "test: prospective live-v12 closure",
    ], { cwd: root })
  return run(root)
})
const withProspectiveClosureAsync = async <T>(run: (root: string) => Promise<T>): Promise<T> => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-live-v12-async-test-"))
  const root = path.join(owner, "repo")
  let added = false
  try {
    execFileSync("/usr/bin/git", ["worktree", "add", "--quiet", "--detach", root, "HEAD"], {
      cwd: repoRoot,
      env: { PATH: "/usr/bin:/bin", HOME: owner, LANG: "C", LC_ALL: "C" },
    })
    added = true
    symlinkSync(path.join(repoRoot, "node_modules"), path.join(root, "node_modules"), "dir")
    for (const repoPath of [V138_LIVE_V12_PATHS.seal, V138_LIVE_V12_PATHS.envelope])
      chmodSync(path.join(root, repoPath), 0o600)
    writeFileSync(
      path.join(root, V138_LIVE_V12_PATHS.tests),
      readFileSync(path.join(repoRoot, V138_LIVE_V12_PATHS.tests)),
    )
    execFileSync("/usr/bin/git", ["add", V138_LIVE_V12_PATHS.tests], { cwd: root })
    if (execFileSync("/usr/bin/git", ["status", "--short"], { cwd: root, encoding: "utf8" }) !== "")
      execFileSync("/usr/bin/git", [
        "-c", "user.name=Plan 262 Test", "-c", "user.email=plan262-test@example.invalid",
        "commit", "--quiet", "-m", "test: prospective live-v12 closure",
      ], { cwd: root })
    return await run(root)
  } finally {
    if (added) {
      try { execFileSync("/usr/bin/git", ["worktree", "remove", "--force", root], { cwd: repoRoot }) }
      catch { /* preserve the primary assertion */ }
    }
    rmSync(owner, { recursive: true, force: true })
  }
}

describe("Plan 262-119 allowed live-v12 successor", () => {
  it("retains the truthful live-v11 and Plan118 v1 current-entry rejection", () => {
    const liveV11 = runExpectingFailure(
      "scripts/run-v1-38-bounded-retry-envelope-v3-live-v11.ts",
      "--check-reviewed-live-ready",
    )
    const plan118 = runExpectingFailure(
      "scripts/check-v1-38-plan-262-118-live-v11-custody-v1.ts",
      "--check-review",
    )
    expect(liveV11).toContain("V138_PATH_STABLE_CURRENT_ENTRY_INVALID")
    expect(plan118).toContain("V138_PLAN118_SUBJECT_ENTRY_INVALID")
    for (const destination of producerDestinations)
      expect(() => lstatSync(path.join(repoRoot, destination))).toThrow()
  }, 120_000)

  it("authenticates the exact allowed successor and frozen zero-state custody", () => {
    const exact = authenticateV138LiveV12SourceOnly(repoRoot)
    expect(exact).toMatchObject({
      plan114V2PublicationCommit: "34bc94ec4e348f71e6055a091d60a505cffc0d79",
      plan116V4PublicationCommit: "f03f0e05539a1591b91000fc9d35b8381a082ec2",
      supplementPublicationCommit: "a1e693a2ae528ba06597d3262041d6f947ecbeca",
      pairCommit: "8080ff66a0880db25db227d23e7e7a0884a79b56",
      plan117SubjectCommit: "41c716c55cec09a35180cd5229cf2f7545c504d4",
      plan118PublicationCommit: "e693f8fe1ff74e2c0d1d733c85c422fd68cb467c",
      allowedCorrectionCommit: correctionCommit,
      allowedCorrectionParent: correctionParent,
      liveV11SourceBlob: "4cb2041a1305db808fe7459a64f331558e5f981c",
      liveV11ReviewedTestBlob: "e5b32103b0355b4abeecfc6f85cf05a92ad787b8",
      liveV11CorrectedTestBlob: "a7d7368c41a95a100c8c144c3a78dfe84aea76d4",
      envelopeStatus: "sealed_inactive",
      producerCalls: 0,
      readinessInvoked: false,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      authorizesExecution: false,
      downstreamAuthority: "denied",
    })
    expect(exact.allowedHistoryRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(exact.counters).toEqual({
      acceptedCells: 0,
      calibrationIdentitiesCharged: 0,
      preflightObservationsConsumed: 0,
      reproductionIdentitiesCharged: 0,
      routeStartsConsumed: 0,
    })
    expect(execFileSync("/usr/bin/git", ["rev-parse", `${correctionCommit}^`], {
      cwd: repoRoot, encoding: "utf8",
    }).trim()).toBe(correctionParent)
  })

  it("runs only the three producer-incapable Plan119 modes", async () => {
    const outputs = await withProspectiveClosureAsync(async (root) => {
      const values: Record<string, unknown>[] = []
      for (const selector of [
        "--check-source-only",
        "--check-prospective-custody",
        "--check-post-run-custody",
      ] as const) await executeV138LiveV12Cli([selector], {
        repoRoot: root,
        writeOutput: (value) => values.push(JSON.parse(value) as Record<string, unknown>),
      })
      return values
    })
    expect(outputs.map(({ status }) => status)).toEqual([
      "source_only_checked",
      "prospective_custody_checked",
      "post_run_no_effect_custody_checked",
    ])
    for (const output of outputs) expect(output).toMatchObject({
      producerCalls: 0,
      readinessInvoked: false,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      downstreamAuthority: "denied",
    })
    expect(V138_LIVE_V12_MODES).toEqual([
      "--check-source-only",
      "--check-prospective-custody",
      "--check-post-run-custody",
      "--check-reviewed-live-ready",
      "--run-reviewed-bounded-live-envelope",
    ])
    await expect(executeV138LiveV12Cli([], { repoRoot })).rejects.toThrow("V138_LIVE_V12_ARGUMENTS_INVALID")
  }, 120_000)

  it("renders the future Plan120 v2 contract without publishing it", () => {
    const prospective = withProspectiveClosure((root) => {
      const sourceCommit = execFileSync(
        "/usr/bin/git",
        ["log", "-1", "--format=%H", "--", V138_LIVE_V12_PATHS.source, V138_LIVE_V12_PATHS.tests],
        { cwd: root, encoding: "utf8" },
      ).trim()
      return deriveV138LiveV12ProspectiveContractsForReview({
        repoRoot: root,
        reviewedSourceCommit: sourceCommit,
        plan120PublicationCommit: "0".repeat(40),
      })
    })
    expect(prospective.payload).toMatchObject({
      schemaVersion: "v1.38-plan-262-120-live-v12-custody-review-payload-v2",
      protocol: "independent-live-v12-executable-custody-review-v2",
      allowedCorrectionCommit: correctionCommit,
      plan110Eligible: true,
      producerCalls: 0,
      readinessInvoked: false,
      liveInvoked: false,
      authorizesExecution: false,
      downstreamAuthority: "denied",
    })
    expect(prospective.carrier).toMatchObject({
      schemaVersion: "v1.38-plan-262-120-live-v12-custody-review-carrier-v2",
      producerCalls: 0,
      authorizesExecution: false,
      downstreamAuthority: "denied",
    })
    for (const repoPath of [
      V138_LIVE_V12_PATHS.plan120Payload,
      V138_LIVE_V12_PATHS.plan120Review,
      V138_LIVE_V12_PATHS.plan120Carrier,
    ]) expect(() => lstatSync(path.join(repoRoot, repoPath))).toThrow()
  }, 120_000)

  it("fails closed on current correction, reviewed history, and pair drift", () => {
    withLinkedWorktree((root) => {
      const mutate = (repoPath: string, expected: RegExp) => {
        const absolute = path.join(root, repoPath)
        const original = readFileSync(absolute)
        writeFileSync(absolute, Buffer.concat([original, Buffer.from("\n")]))
        expect(() => authenticateV138LiveV12SourceOnly(root)).toThrow(expected)
        writeFileSync(absolute, original)
      }
      mutate(
        "scripts/run-v1-38-bounded-retry-envelope-v3-live-v11.test.ts",
        /CORRECTION_CURRENT_ENTRY_INVALID/,
      )
      mutate(V138_LIVE_V12_PATHS.plan118PayloadV1, /PUBLICATION_CURRENT_BYTES_INVALID/)
      mutate(V138_LIVE_V12_PATHS.plan114PayloadV2, /PUBLICATION_CURRENT_BYTES_INVALID/)
      mutate(V138_LIVE_V12_PATHS.supplementV3, /SUPPLEMENT_BYTES_INVALID/)
      mutate(V138_LIVE_V12_PATHS.envelope, /PAIR_CURRENT_BYTES_INVALID/)
    })
  }, 120_000)

  it("keeps one direct historical producer call and no injected bypass", () => {
    const source = readFileSync(path.join(repoRoot, V138_LIVE_V12_PATHS.source), "utf8")
    expect(source.match(/await runV138V3ProductionLive\(/gu)).toHaveLength(1)
    expect(source).not.toMatch(/runV138ReviewedBoundedLiveEnvelopeV12\s*=\s*async\s*\([^)]*,/u)
    expect(source).not.toMatch(/Partial<\{[^}]*?(?:producer|readiness|renderer|verdict)/su)
    expect(inspectV138LiveV12ProductionBoundaryForReview(repoRoot)).toEqual({
      producerCallSites: 1,
      readinessSelectorPresent: true,
      productionSelectorPresent: true,
      injectedProducerPresent: false,
      injectedReadinessPresent: false,
      injectedRendererPresent: false,
      producerCalls: 0,
      readinessInvoked: false,
      liveInvoked: false,
      downstreamAuthority: "denied",
    })
    expect(() => inspectV138LiveV12ProductionBoundarySourceForReview(source.replace(
      "await runV138V3ProductionLive(repoRoot, {",
      "await runV138V3ProductionLive(repoRoot, {} as never)\n    await runV138V3ProductionLive(repoRoot, {",
    ))).toThrow("V138_LIVE_V12_PRODUCTION_BOUNDARY_INVALID")
    expect(() => inspectV138LiveV12ProductionBoundarySourceForReview(source.replace(
      "await runV138V3ProductionLive(repoRoot, {",
      "const producer = runV138V3ProductionLive\n    await producer(repoRoot, {",
    ))).toThrow("V138_LIVE_V12_PRODUCTION_BOUNDARY_INVALID")
  })

  it("requires the producer call to belong only to the closed owner and exact live selector", () => {
    const source = readFileSync(path.join(repoRoot, V138_LIVE_V12_PATHS.source), "utf8")
    const withoutOwnerCall = source.replace(
      "await runV138V3ProductionLive(repoRoot, {",
      "await Promise.resolve(repoRoot, {",
    )
    const movedCalls = [
      withoutOwnerCall.replace(
        "const result = authenticateV138LiveV12SourceOnly(root)",
        "await runV138V3ProductionLive(root, {} as never)\n    const result = authenticateV138LiveV12SourceOnly(root)",
      ),
      withoutOwnerCall.replace(
        "const subjectCommit = resolveCurrentSubjectCommit(root)",
        "await runV138V3ProductionLive(root, {} as never)\n    const subjectCommit = resolveCurrentSubjectCommit(root)",
      ),
      withoutOwnerCall.replace(
        "if (args[0] === \"--check-post-run-custody\") assertV138LiveV10PostRunForReview(root)",
        "if (args[0] === \"--check-post-run-custody\") {\n    await runV138V3ProductionLive(root, {} as never)\n    assertV138LiveV10PostRunForReview(root)\n  }",
      ),
      withoutOwnerCall.replace(
        "const result = authenticateFutureCustody(root, args[0] === \"--check-post-run-custody\" ? \"post\" : \"pre\")",
        "await runV138V3ProductionLive(root, {} as never)\n  const result = authenticateFutureCustody(root, args[0] === \"--check-post-run-custody\" ? \"post\" : \"pre\")",
      ),
    ]
    for (const moved of movedCalls)
      expect(() => inspectV138LiveV12ProductionBoundarySourceForReview(moved)).toThrow(
        "V138_LIVE_V12_PRODUCTION_BOUNDARY_INVALID",
      )

    const missingDispatch = source.replace(
      "await runV138ReviewedBoundedLiveEnvelopeV12(root)",
      "await Promise.resolve(root)",
    )
    expect(() => inspectV138LiveV12ProductionBoundarySourceForReview(missingDispatch)).toThrow(
      "V138_LIVE_V12_PRODUCTION_BOUNDARY_INVALID",
    )
    const extraDispatch = source.replace(
      "const result = authenticateV138LiveV12SourceOnly(root)",
      "await runV138ReviewedBoundedLiveEnvelopeV12(root)\n    const result = authenticateV138LiveV12SourceOnly(root)",
    )
    expect(() => inspectV138LiveV12ProductionBoundarySourceForReview(extraDispatch)).toThrow(
      "V138_LIVE_V12_PRODUCTION_BOUNDARY_INVALID",
    )
  })

  it("rejects forged local closure claims and binds every closure layer", () => {
    withProspectiveClosure((root) => {
      const sourceCommit = execFileSync(
        "/usr/bin/git",
        ["log", "-1", "--format=%H", "--", V138_LIVE_V12_PATHS.source, V138_LIVE_V12_PATHS.tests],
        { cwd: root, encoding: "utf8" },
      ).trim()
      expect(() => deriveV138LiveV12ProspectiveContractsForReview({
        repoRoot: root,
        reviewedSourceCommit: sourceCommit,
        plan120PublicationCommit: "0".repeat(40),
        reviewedLocalExecutionClosureRoot: `sha256:${"f".repeat(64)}`,
      })).toThrow("V138_LIVE_V12_FRESH_CLOSURE_INVALID")

      const preview = deriveV138LiveV12ProspectiveContractsForReview({
        repoRoot: root,
        reviewedSourceCommit: sourceCommit,
        plan120PublicationCommit: "0".repeat(40),
      })
      expect(preview.payload).toMatchObject({
        recursiveDependencyRoot: preview.reviewedClosure.recursiveDependencyRoot,
        recursiveDependencyCount: preview.reviewedClosure.recursiveDependencyCount,
        installedClosureRoot: preview.reviewedClosure.installedClosureRoot,
        nodeSha256: preview.reviewedClosure.nodeSha256,
        pnpmDistributionSha256: preview.reviewedClosure.pnpmDistributionSha256,
        pathStableNativeSourcesRoot: preview.reviewedClosure.pathStableNativeSourcesRoot,
        gitExecutableSha256: preview.reviewedClosure.gitExecutableSha256,
        hardenedGitArgumentsRoot: preview.reviewedClosure.hardenedGitArgumentsRoot,
        localInstalledClosureRoot: preview.reviewedClosure.localInstalledClosureRoot,
        localGitObjectRoot: preview.reviewedClosure.localGitObjectRoot,
        localNativeSourcesRoot: preview.reviewedClosure.localNativeSourcesRoot,
        reviewedLocalExecutionClosureRoot: preview.reviewedClosure.localExecutionClosureRoot,
      })
      expect(() => checkV138LiveV12ProspectiveCustodyForReview({
        repoRoot: root,
        source: preview.source,
        reviewedClosure: {
          ...preview.reviewedClosure,
          pathnameLaunchReplacementResistanceClaimed: true as false,
        },
        reviewedLocalExecutionClosureRoot: preview.reviewedClosure.localExecutionClosureRoot,
        plan120PublicationCommit: "0".repeat(40),
        plan120: preview,
      })).toThrow("V138_LIVE_V12_FRESH_CLOSURE_INVALID")
    })
  }, 120_000)
})
