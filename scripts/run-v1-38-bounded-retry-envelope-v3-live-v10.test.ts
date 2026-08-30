import { execFileSync } from "node:child_process"
import { chmodSync, copyFileSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  checkV138PathStableCustodyForReview,
  deriveV138PathStableCustody,
  deriveV138PathStableInstalledManifestForReview,
  type V138PathStableCustody,
} from "./lib/v1-38-bounded-retry-v3-path-stable-custody-v1.js"
import { authenticateV138RetryV3ExecutionClosure } from "./lib/v1-38-bounded-retry-v3-native-custody-v1.js"
import {
  V138_LIVE_V10_MODES,
  V138_LIVE_V10_PATHS,
  V138_LIVE_V10_REVIEWED_SOURCE_PATHS,
  V138_LIVE_V10_FORBIDDEN_DESTINATIONS,
  authenticateV138LiveV10SourceOnly,
  assertV138LiveV10ForbiddenDestinationsForReview,
  assertV138LiveV10PostRunForReview,
  checkV138LiveV10PostRunOutputCustodyForReview,
  checkV138LiveV10ProspectiveCustodyForReview,
  checkV138LiveV10ReproductionV17ForReview,
  computeV138LiveV10ReproductionV17ReceiptRoot,
  deriveV138LiveV10ProspectiveContractsForReview,
  runV138ReviewedBoundedLiveEnvelopeV10,
} from "./run-v1-38-bounded-retry-envelope-v3-live-v10.js"

const repoRoot = path.resolve(import.meta.dirname, "..")
const sourceCommit = "a301a06df0e4a3c038cf630f3485f8fb3a879c42"
const sourcePaths = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
  "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
  "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.ts",
])
const workspaces = Object.freeze([
  "apps/runtime-service", "apps/web", "apps/worker", "packages/engine",
  "packages/golden", "packages/map-configs", "packages/persistence", "packages/replay",
  "packages/runtime-js", "packages/runtime-python", "packages/runtime-supervisor",
  "packages/runtime-wasm-wasi", "packages/service", "packages/spec", "packages/test-utils",
])

const withLinkedWorktree = <T>(
  run: (root: string) => T,
  installation: "shared" | "separate" = "shared",
): T => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-live-v10-test-"))
  const root = path.join(owner, "repo")
  let added = false
  try {
    execFileSync("/usr/bin/git", ["worktree", "add", "--quiet", "--detach", root, "HEAD"], {
      cwd: repoRoot,
      env: { PATH: "/usr/bin:/bin", HOME: owner, LANG: "C", LC_ALL: "C" },
    })
    added = true
    if (installation === "separate") {
      execFileSync("/bin/cp", [
        "-cR", realpathSync(path.join(repoRoot, "node_modules")), path.join(root, "node_modules"),
      ])
    } else {
      symlinkSync(path.join(repoRoot, "node_modules"), path.join(root, "node_modules"), "dir")
      for (const workspace of workspaces) {
        const source = path.join(repoRoot, workspace, "node_modules")
        try {
          mkdirSync(path.join(root, workspace), { recursive: true })
          symlinkSync(source, path.join(root, workspace, "node_modules"), "dir")
        } catch {
          // Workspace has no installed node_modules projection.
        }
      }
    }
    return run(root)
  } finally {
    if (added) {
      try { execFileSync("/usr/bin/git", ["worktree", "remove", "--force", root], { cwd: repoRoot }) }
      catch { /* preserve the primary assertion */ }
    }
    rmSync(owner, { recursive: true, force: true })
  }
}

const readClosuresInLinkedProcess = (root: string) => JSON.parse(execFileSync(
  path.join(repoRoot, "node_modules/.bin/tsx"),
  ["--eval", `
    import { authenticateV138RetryV3ExecutionClosure } from "./scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts";
    import { deriveV138PathStableCustody } from "./scripts/lib/v1-38-bounded-retry-v3-path-stable-custody-v1.ts";
    const sourceCommit = ${JSON.stringify(sourceCommit)};
    const checkoutPaths = ${JSON.stringify(sourcePaths)};
    const historical = authenticateV138RetryV3ExecutionClosure(process.cwd(), { sourceCommit, checkoutPaths });
    const corrected = deriveV138PathStableCustody(process.cwd(), { sourceCommit, checkoutPaths });
    process.stdout.write(JSON.stringify({ historical, corrected }));
  `],
  { cwd: root, encoding: "utf8", env: { ...process.env, HOME: path.dirname(root) } },
)) as Readonly<{
  historical: ReturnType<typeof authenticateV138RetryV3ExecutionClosure>
  corrected: V138PathStableCustody
}>

const readCurrentClosuresInLinkedProcess = (root: string) => {
  copyFileSync(
    path.join(repoRoot, "scripts/lib/v1-38-bounded-retry-v3-path-stable-custody-v1.ts"),
    path.join(root, "scripts/lib/v1-38-bounded-retry-v3-path-stable-custody-v1.ts"),
  )
  return readClosuresInLinkedProcess(root)
}

const readSourceAdmissionInLinkedProcess = (root: string) => {
  copyFileSync(
    path.join(repoRoot, V138_LIVE_V10_PATHS.source),
    path.join(root, V138_LIVE_V10_PATHS.source),
  )
  return JSON.parse(execFileSync(
    path.join(repoRoot, "node_modules/.bin/tsx"),
    [V138_LIVE_V10_PATHS.source, "--check-source-only"],
    { cwd: root, encoding: "utf8", env: { ...process.env, HOME: path.dirname(root) } },
  )) as Readonly<{ reviewedClosureRoot: string; localExecutionClosureRoot: string }>
}

describe("Plan 262-113 path-stable custody", () => {
  it("separates the historical path mismatch from a location-stable reviewed root", () => {
    const canonicalHistorical = authenticateV138RetryV3ExecutionClosure(repoRoot, {
      sourceCommit,
      checkoutPaths: sourcePaths,
    })
    const canonical = deriveV138PathStableCustody(repoRoot, { sourceCommit, checkoutPaths: sourcePaths })
    const linked = withLinkedWorktree(readCurrentClosuresInLinkedProcess, "separate")

    expect(linked.historical.nativeSourcesRoot).not.toBe(canonicalHistorical.nativeSourcesRoot)
    expect(linked.historical.installedClosureRoot).not.toBe(canonicalHistorical.installedClosureRoot)
    expect(linked.historical.executionClosureRoot).not.toBe(canonicalHistorical.executionClosureRoot)
    expect(linked.corrected.installedClosureRoot).toBe(canonical.installedClosureRoot)
    expect(linked.corrected.reviewedClosureRoot).toBe(canonical.reviewedClosureRoot)
    expect(linked.corrected.pathStableNativeSourcesRoot).toBe(canonical.pathStableNativeSourcesRoot)
    expect(linked.corrected.localExecutionClosureRoot).not.toBe(canonical.localExecutionClosureRoot)
    expect(canonical.pathnameLaunchReplacementResistanceClaimed).toBe(false)
  }, 180_000)

  it("re-derives custody after real path, mode, byte, history, native, and install mutations", () => {
    withLinkedWorktree((root) => {
      const derive = () => deriveV138PathStableCustody(root, { sourceCommit, checkoutPaths: sourcePaths })
      const exact = derive()
      expect(() => deriveV138PathStableCustody(root, {
        sourceCommit, checkoutPaths: ["../outside.ts"],
      })).toThrow("V138_PATH_STABLE_INPUT_INVALID")

      const sourcePath = path.join(root, sourcePaths[0]!)
      const sourceBytes = readFileSync(sourcePath)
      chmodSync(sourcePath, 0o755)
      expect(derive).toThrow(/CURRENT_ENTRY_INVALID/)
      chmodSync(sourcePath, 0o644)
      writeFileSync(sourcePath, Buffer.concat([sourceBytes, Buffer.from("\n// custody mutation\n")]))
      expect(derive).toThrow(/CURRENT_ENTRY_INVALID/)
      writeFileSync(sourcePath, sourceBytes)

      const nativePath = path.join(root, "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c")
      const nativeBytes = readFileSync(nativePath)
      writeFileSync(nativePath, Buffer.concat([nativeBytes, Buffer.from("\n/* custody mutation */\n")]))
      expect(derive).toThrow(/CURRENT_ENTRY_INVALID/)
      writeFileSync(nativePath, nativeBytes)

      writeFileSync(sourcePath, Buffer.concat([sourceBytes, Buffer.from("\n// committed rewrite\n")]))
      execFileSync("/usr/bin/git", ["add", "--", sourcePaths[0]!], { cwd: root })
      execFileSync("/usr/bin/git", ["-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "fixture rewrite"], { cwd: root })
      writeFileSync(sourcePath, sourceBytes)
      execFileSync("/usr/bin/git", ["add", "--", sourcePaths[0]!], { cwd: root })
      execFileSync("/usr/bin/git", ["-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "fixture restore"], { cwd: root })
      expect(derive).toThrow(/SUCCESSOR_REWRITE/)

      for (const [name, candidate] of [
        ["Git executable evidence", { ...exact, gitExecutableSha256: `sha256:${"7".repeat(64)}` }],
        ["hardened argument evidence", { ...exact, hardenedGitArgumentsRoot: `sha256:${"8".repeat(64)}` }],
        ["local object evidence", { ...exact, localExecutionClosureRoot: `sha256:${"9".repeat(64)}` }],
      ] as Array<[string, V138PathStableCustody]>)
        expect(() => checkV138PathStableCustodyForReview(exact, candidate), name).toThrow()
    })

    const installRoot = mkdtempSync(path.join(tmpdir(), "v138-installed-fixture-"))
    try {
      writeFileSync(path.join(installRoot, "package.json"), "{}\n")
      for (const [name, version] of [["vitest", "1.0.0"], ["tsx", "2.0.0"]]) {
        const packageRoot = path.join(installRoot, "node_modules", name)
        mkdirSync(packageRoot, { recursive: true })
        writeFileSync(path.join(packageRoot, "package.json"), `${JSON.stringify({ name, version })}\n`)
        writeFileSync(path.join(packageRoot, "index.js"), `export const identity = ${JSON.stringify(name)}\n`)
      }
      const before = deriveV138PathStableInstalledManifestForReview(installRoot)
      writeFileSync(path.join(installRoot, "node_modules/vitest/index.js"), "export const identity = 'mutated'\n")
      const after = deriveV138PathStableInstalledManifestForReview(installRoot)
      expect(after.root).not.toBe(before.root)
    } finally { rmSync(installRoot, { recursive: true, force: true }) }
  }, 180_000)

  it("authenticates the immutable source chain without creating authority", () => {
    const exact = authenticateV138LiveV10SourceOnly(repoRoot)
    expect(exact.correctedPublicationCommit).toBe("2639ff3b42e2a238919a3104c9fa8c785c69b93d")
    expect(exact.plan111SourceCommit).toBe(sourceCommit)
    expect(exact.plan112V1PublicationCommit).toBe("29d4cf5c942d63fd767f658ec2506a5764ff19fa")
    expect(exact.plan112V2PublicationCommit).toBe("5b5ec60154bb82a3cfa3b25a03f8a2379010c829")
    expect(exact.plan112V2FindingCodes).toEqual([
      "MODE_POST_NO_EFFECT_FAILED",
      "MODE_PROSPECTIVE_CUSTODY_FAILED",
      "MODE_SOURCE_ONLY_FAILED",
    ])
    expect(exact.plan112V2FindingCount).toBe(3)
    expect(exact.plan109Eligible).toBe(false)
    expect(exact.envelopeStatus).toBe("sealed_inactive")
    expect(exact.counters).toEqual({
      acceptedCells: 0,
      calibrationIdentitiesCharged: 0,
      preflightObservationsConsumed: 0,
      reproductionIdentitiesCharged: 0,
      routeStartsConsumed: 0,
    })
    expect(exact.liveInvoked).toBe(false)
    expect(exact.downstreamAuthority).toBe("denied")

    const linked = withLinkedWorktree(readSourceAdmissionInLinkedProcess)
    expect(linked.reviewedClosureRoot).toBe(exact.reviewedClosureRoot)
    expect(linked.localExecutionClosureRoot).not.toBe(exact.localExecutionClosureRoot)
  }, 180_000)

  it("treats dangling links and unsafe entries as present at every forbidden destination", () => {
    withLinkedWorktree((root) => {
      for (const [index, repoPath] of V138_LIVE_V10_FORBIDDEN_DESTINATIONS.entries()) {
        const absolute = path.join(root, repoPath)
        mkdirSync(path.dirname(absolute), { recursive: true })
        symlinkSync(index % 2 === 0 ? "../missing-relative-target" : "/definitely/missing/absolute-target", absolute)
        expect(() => assertV138LiveV10ForbiddenDestinationsForReview(root, [repoPath]))
          .toThrow("V138_LIVE_V10_FORBIDDEN_DESTINATION_PRESENT")
        rmSync(absolute)
      }

      mkdirSync(path.join(root, V138_LIVE_V10_PATHS.plan114Payload), { recursive: true })
      expect(() => authenticateV138LiveV10SourceOnly(root))
        .toThrow("V138_LIVE_V10_FORBIDDEN_DESTINATION_PRESENT")
    })
  }, 180_000)

  it("rejects protected edit-and-restore history instead of trusting current bytes", () => {
    withLinkedWorktree((root) => {
      const repoPath = V138_LIVE_V10_PATHS.plan93Stop
      const absolute = path.join(root, repoPath)
      const original = readFileSync(absolute)
      writeFileSync(absolute, Buffer.concat([original, Buffer.from("\ntransient rewrite\n")]))
      execFileSync("/usr/bin/git", ["add", "--", repoPath], { cwd: root })
      execFileSync("/usr/bin/git", ["-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "test rewrite"], { cwd: root })
      writeFileSync(absolute, original)
      execFileSync("/usr/bin/git", ["add", "--", repoPath], { cwd: root })
      execFileSync("/usr/bin/git", ["-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "test restore"], { cwd: root })
      expect(() => authenticateV138LiveV10SourceOnly(root)).toThrow(/SUCCESSOR_REWRITE|PLAN_93_CUSTODY/)
    })
  }, 180_000)

  it("joins future Plan 114 custody to supplement-v3 and rejects mutations", () => {
    withLinkedWorktree((root) => {
      execFileSync("/usr/bin/git", [
        "-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid",
        "commit", "--allow-empty", "-m", "fixture reviewed source",
      ], { cwd: root })
      const reviewedSourceCommit = execFileSync("/usr/bin/git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim()
      const source = authenticateV138LiveV10SourceOnly(root)
      const plan114PublicationCommit = "1".repeat(40)
      const reviewedClosure = deriveV138PathStableCustody(root, {
        sourceCommit: reviewedSourceCommit,
        checkoutPaths: V138_LIVE_V10_REVIEWED_SOURCE_PATHS,
      })
      const exact = deriveV138LiveV10ProspectiveContractsForReview({
        repoRoot: root, source, reviewedSourceCommit, plan114PublicationCommit,
      })
      expect(exact.reviewedClosure).toEqual(reviewedClosure)
      expect(checkV138LiveV10ProspectiveCustodyForReview({
        source, reviewedClosure, plan114PublicationCommit, ...exact,
      }).producerWouldInvoke).toBe(true)
      expect(exact.plan114.payload.actualModesPassed).toBe(6)
      expect(exact.plan114.payload.findingCount).toBe(0)
      expect(exact.plan114.payload.reviewedLocalExecutionClosureRoot)
        .toBe(reviewedClosure.localExecutionClosureRoot)
      expect(exact.plan114.payload).not.toHaveProperty("localExecutionClosureRoot")
      expect(exact.supplement.createsEnvelope).toBe(false)
      expect(exact.supplement.createsCapacity).toBe(false)
      expect(exact.supplement.resetsCounters).toBe(false)
      expect(exact.supplement.authorizesExecution).toBe(false)

      expect(() => checkV138LiveV10ProspectiveCustodyForReview({
        source, reviewedClosure, plan114PublicationCommit,
        plan114: { ...exact.plan114, payload: { ...exact.plan114.payload, findingCount: 1 } },
        supplement: exact.supplement,
      })).toThrow("V138_LIVE_V10_PROSPECTIVE_CUSTODY_INVALID")
      expect(() => checkV138LiveV10ProspectiveCustodyForReview({
        source, reviewedClosure, plan114PublicationCommit,
        plan114: exact.plan114,
        supplement: { ...exact.supplement, createsCapacity: true },
      })).toThrow("V138_LIVE_V10_PROSPECTIVE_CUSTODY_INVALID")
      expect(() => deriveV138LiveV10ProspectiveContractsForReview({
        repoRoot: root, source, reviewedSourceCommit: "2".repeat(40), plan114PublicationCommit,
      })).toThrow()
    })
  }, 180_000)

  it("preserves bounded post-run and exact reproduction-v17 semantics", () => {
    expect(assertV138LiveV10PostRunForReview.toString())
      .toContain("checkV138LiveV10ReproductionV17ForReview")
    expect(checkV138LiveV10PostRunOutputCustodyForReview({
      journalPresent: false,
      privateDirectoryPresent: false,
      terminalPresent: false,
      lockPresent: false,
      reproductionPresent: false,
      adjudicationOrDownstreamPresent: false,
    }).status).toBe("no_effects")

    const body = {
      schemaVersion: "v1.38-current-matrix-reproduction-v17",
      status: "passed_exact",
      admittedCalibrationRoot: `sha256:${"2".repeat(64)}`,
      chargedAttemptCount: 540,
      acceptedCellCount: 540,
      completeCleanup: true,
      executionRoot: `sha256:${"3".repeat(64)}`,
      runtimeRoute: "v1.18/v1.19/MATCH_KERNEL",
      samplingMilliseconds: 200,
      partialAcceptedEvidenceReusable: false,
      privacyProjection: {
        strategySourceIncluded: false,
        strategyMemoryIncluded: false,
        soldierMemoryIncluded: false,
        objectivePayloadIncluded: false,
        rawDiagnosticsIncluded: false,
      },
      phase263PlanningAuthorized: false,
      candidateSearchAuthorized: false,
      formationMaterializationAuthorized: false,
      holdoutOpeningAuthorized: false,
      publicAuthorized: false,
      productAuthorized: false,
      productionAuthorized: false,
    }
    const artifact = {
      ...body,
      receiptRoot: computeV138LiveV10ReproductionV17ReceiptRoot(body),
    }
    const journalRecords = [
      {
        kind: "finish_calibration", status: "admitted",
        supervisionRoot: body.admittedCalibrationRoot,
        routeIdentity: "route-1", owner: "owner-1", completeCleanup: true,
      },
      {
        kind: "finish_reproduction", status: "passed_exact",
        routeIdentity: "route-1", owner: "owner-1", executionRoot: body.executionRoot,
        chargedAttemptCount: 540, acceptedCells: 540, completeCleanup: true,
        reproductionRoot: artifact.receiptRoot,
        recordRoot: `sha256:${"4".repeat(64)}`,
      },
    ]
    const outcome = {
      disposition: "succeeded" as const,
      journalRoot: `sha256:${"4".repeat(64)}`,
      stateRoot: `sha256:${"5".repeat(64)}`,
      completeCleanup: true,
      reproductionPresent: true,
      downstreamAuthority: "denied",
    }
    expect(checkV138LiveV10ReproductionV17ForReview({ artifact, journalRecords, outcome }))
      .toMatchObject({ chargedAttemptCount: 540, acceptedCellCount: 540 })
    expect(() => checkV138LiveV10ReproductionV17ForReview({
      artifact: { ...artifact, acceptedCellCount: 539 }, journalRecords, outcome,
    })).toThrow()
    for (const mutated of [
      { ...artifact, publicAuthorized: true },
      { ...artifact, privacyProjection: { ...artifact.privacyProjection, strategySourceIncluded: true } },
      { ...artifact, samplingMilliseconds: 201 },
      { ...artifact, extraAuthority: false },
    ]) expect(() => checkV138LiveV10ReproductionV17ForReview({
      artifact: mutated, journalRecords, outcome,
    })).toThrow()
    expect(() => checkV138LiveV10ReproductionV17ForReview({
      artifact,
      journalRecords: journalRecords.map((record, index) => index === 1
        ? { ...record, owner: "changed-owner" } : record),
      outcome,
    })).toThrow()
  })

  it("exposes only the closed five-mode adapter and leaves canonical outputs absent", () => {
    expect(V138_LIVE_V10_MODES).toEqual([
      "--check-source-only",
      "--check-prospective-custody",
      "--check-post-run-custody",
      "--check-reviewed-live-ready",
      "--run-reviewed-bounded-live-envelope",
    ])
    expect(runV138ReviewedBoundedLiveEnvelopeV10.length).toBe(1)
    expect(runV138ReviewedBoundedLiveEnvelopeV10.toString()).toContain("runV138V3ProductionLive")
    expect(runV138ReviewedBoundedLiveEnvelopeV10.toString()).toContain("ready.source.pair.seal")
    expect(runV138ReviewedBoundedLiveEnvelopeV10.toString()).not.toContain("as any")
    expect(runV138ReviewedBoundedLiveEnvelopeV10.toString()).not.toContain("injected")
    for (const repoPath of [
      V138_LIVE_V10_PATHS.plan114Payload,
      V138_LIVE_V10_PATHS.plan114Review,
      V138_LIVE_V10_PATHS.plan114Carrier,
      V138_LIVE_V10_PATHS.supplementV3,
    ]) expect(() => lstatSync(path.join(repoRoot, repoPath))).toThrow()
  })
})
