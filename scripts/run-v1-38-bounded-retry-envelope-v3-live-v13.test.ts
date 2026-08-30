import { describe, expect, it } from "vitest"
import { execFileSync } from "node:child_process"
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"
import path from "node:path"
import {
  V138_LIVE_V13_PATHS,
  V138_LIVE_V13_MODES,
  V138_LIVE_V13_REVIEW_MODES,
  authenticateV138LiveV13SourceOnly,
  checkV138LiveV13ProspectiveCustodyForReview,
  checkV138LiveV13ObservationsForReview,
  checkV138LiveV13PublishedPayloadForReview,
  computeV138LiveV13ObservationRoot,
  deriveV138LiveV13ProspectiveContractsForReview,
  executeV138LiveV13Cli,
  inspectV138LiveV13ProductionBoundaryForReview,
  inspectV138LiveV13ProductionBoundarySourceForReview,
} from "./run-v1-38-bounded-retry-envelope-v3-live-v13.js"
import { computeV138PathStableLocalExecutionClosureRoot } from
  "./lib/v1-38-bounded-retry-v3-path-stable-custody-v1.js"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const producerDestinations = [
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl",
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl.lock",
  ".planning/artifacts/v1.38-current-matrix-retry-private-v3",
  ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json",
]

const currentSubjectCommit = (root = repoRoot): string => execFileSync(
  "/usr/bin/git",
  ["log", "-1", "--format=%H", "--", V138_LIVE_V13_PATHS.source, V138_LIVE_V13_PATHS.tests],
  { cwd: root, encoding: "utf8" },
).trim()

const runExpectingFailure = (script: string, selector: string): string => {
  try {
    execFileSync("pnpm", ["exec", "tsx", script, selector], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
    throw new Error("expected failure")
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string; message: string }
    return `${failure.stdout ?? ""}\n${failure.stderr ?? ""}\n${failure.message}`
  }
}

const strictObservations = (reviewedClosureRoot: `sha256:${string}`) =>
  V138_LIVE_V13_REVIEW_MODES.map((mode, index) => {
    const disposableReviewedClosureRoot = `sha256:${(index + 1).toString(16).padStart(64, "0")}` as const
    const disposableLocalInstalledClosureRoot = `sha256:${(index + 11).toString(16).padStart(64, "0")}` as const
    const disposableLocalGitObjectRoot = `sha256:${(index + 21).toString(16).padStart(64, "0")}` as const
    const disposableLocalNativeSourcesRoot = `sha256:${(index + 31).toString(16).padStart(64, "0")}` as const
    const disposableLocalExecutionClosureRoot = computeV138PathStableLocalExecutionClosureRoot({
      reviewedClosureRoot: disposableReviewedClosureRoot,
      localInstalledClosureRoot: disposableLocalInstalledClosureRoot,
      localGitObjectRoot: disposableLocalGitObjectRoot,
      localNativeSourcesRoot: disposableLocalNativeSourcesRoot,
    })
    const status = {
      "--check-source-only": "source_only_checked",
      "--check-prospective-custody": "prospective_custody_checked",
      "--check-post-run-custody": "post_run_no_effect_custody_checked",
      "--check-non-pass-value": "bounded_non_pass_value_checked",
      "--check-bounded-success-value": "bounded_success_value_checked",
      "--check-exact-reproduction-v17-value": "exact_reproduction_v17_value_checked",
    }[mode]
    const reducedValue = mode === "--check-non-pass-value"
      ? { classification: "non_pass", reproductionEligible: false }
      : mode === "--check-bounded-success-value"
        ? { classification: "bounded_success", reproductionEligible: true }
        : mode === "--check-exact-reproduction-v17-value"
          ? { acceptedCells: 540, requiredAccepted: 540, exact: true }
          : { producerCalls: 0, readinessInvoked: false, liveInvoked: false,
              freshCharged: 0, freshAccepted: 0, downstreamAuthority: "denied" }
    const body = {
      mode,
      status,
      producerGuardCount: 0 as const,
      reducedValue,
      disposableReviewedClosureRoot,
      disposableLocalInstalledClosureRoot,
      disposableLocalGitObjectRoot,
      disposableLocalNativeSourcesRoot,
      disposableLocalExecutionClosureRoot,
    }
    return { ...body, observationRoot: computeV138LiveV13ObservationRoot(body), reviewedClosureRoot }
  }).map(({ reviewedClosureRoot: _ignored, ...observation }) => observation)

const withLinkedWorktree = <T>(run: (root: string) => T): T => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-live-v13-test-"))
  const root = path.join(owner, "repo")
  let added = false
  try {
    execFileSync("/usr/bin/git", ["worktree", "add", "--quiet", "--detach", root, "HEAD"], {
      cwd: repoRoot,
      env: { PATH: "/usr/bin:/bin", HOME: owner, LANG: "C", LC_ALL: "C" },
    })
    added = true
    symlinkSync(path.join(repoRoot, "node_modules"), path.join(root, "node_modules"), "dir")
    for (const packagePath of [
      "packages/spec", "packages/engine", "packages/runtime-supervisor", "packages/runtime-js",
      "packages/runtime-wasm-wasi", "packages/runtime-python", "packages/map-configs",
      "packages/persistence", "packages/replay", "packages/service", "packages/test-utils",
      "packages/golden", "apps/runtime-service", "apps/worker",
    ]) {
      const destination = path.join(root, packagePath, "node_modules")
      if (!existsSync(destination))
        symlinkSync(path.join(repoRoot, packagePath, "node_modules"), destination, "dir")
    }
    for (const repoPath of [V138_LIVE_V13_PATHS.seal, V138_LIVE_V13_PATHS.envelope])
      chmodSync(path.join(root, repoPath), 0o600)
    return run(root)
  } finally {
    if (added) {
      try { execFileSync("/usr/bin/git", ["worktree", "remove", "--force", root], { cwd: repoRoot }) }
      catch { /* preserve primary assertion */ }
    }
    rmSync(owner, { recursive: true, force: true })
  }
}

describe("Plan 262-121 closed live-v13 successor", () => {
  it("requires an additive live-v13 owner that records Plan120 v2 as process-invalid", () => {
    expect(V138_LIVE_V13_PATHS.source).toBe(
      "scripts/run-v1-38-bounded-retry-envelope-v3-live-v13.ts",
    )
    expect(authenticateV138LiveV13SourceOnly(repoRoot)).toMatchObject({
      plan120PublicationCommit: "c7390cf521234e13e6c09c784df25f65a722aa23",
      plan120Disposition: "process_invalid_local_context_misbinding",
      supersededV2Plan110Eligible: false,
      producerCalls: 0,
      readinessInvoked: false,
      liveInvoked: false,
      downstreamAuthority: "denied",
    })
    for (const destination of producerDestinations)
      expect(() => lstatSync(path.join(repoRoot, destination))).toThrow()
  })

  it("preserves live-v12's truthful current-main rejection with zero effect", () => {
    const failure = runExpectingFailure(
      "scripts/run-v1-38-bounded-retry-envelope-v3-live-v12.ts",
      "--check-reviewed-live-ready",
    )
    expect(failure).toMatch(
      /V138_LIVE_V12_(?:PLAN93_CURRENT_BYTES|PUBLISHED_LOCAL_CLOSURE|FRESH_CLOSURE)_INVALID/u,
    )
    for (const destination of producerDestinations)
      expect(() => lstatSync(path.join(repoRoot, destination))).toThrow()
  }, 120_000)

  it("renders only the context-typed Plan122 v3 prospective contract", () => {
    const prospective = deriveV138LiveV13ProspectiveContractsForReview({
      repoRoot,
      reviewedSourceCommit: currentSubjectCommit(),
      plan122PublicationCommit: "0".repeat(40),
    })
    expect(prospective.payload).toMatchObject({
      schemaVersion: "v1.38-plan-262-122-live-v13-custody-review-payload-v3",
      protocol: "independent-live-v13-executable-custody-review-v3",
      canonicalLocalExecutionClosureRoot: prospective.reviewedClosure.localExecutionClosureRoot,
      supersedesPublicationCommit: "c7390cf521234e13e6c09c784df25f65a722aa23",
      supersededV2Disposition: "process_invalid_local_context_misbinding",
      supersededV2Plan110Eligible: false,
      reviewStatus: "prospective_only",
      actualModesPassed: 0,
      plan110Eligible: false,
      producerCalls: 0,
      authorizesExecution: false,
      downstreamAuthority: "denied",
    })
    expect(prospective.payload).not.toHaveProperty("reviewedLocalExecutionClosureRoot")
    expect(prospective.payload.observations).toHaveLength(6)
    expect(prospective.payload.observations.map(({ mode }: { mode: string }) => mode)).toEqual(
      V138_LIVE_V13_REVIEW_MODES,
    )
    for (const observation of prospective.payload.observations) {
      expect(observation.disposableLocalExecutionClosureRoot).not.toBe(
        prospective.payload.canonicalLocalExecutionClosureRoot,
      )
      expect(observation.observationRoot).toBe(computeV138LiveV13ObservationRoot({
        mode: observation.mode,
        status: observation.status,
        producerGuardCount: observation.producerGuardCount,
        reducedValue: observation.reducedValue,
        disposableReviewedClosureRoot: observation.disposableReviewedClosureRoot,
        disposableLocalInstalledClosureRoot: observation.disposableLocalInstalledClosureRoot,
        disposableLocalGitObjectRoot: observation.disposableLocalGitObjectRoot,
        disposableLocalNativeSourcesRoot: observation.disposableLocalNativeSourcesRoot,
        disposableLocalExecutionClosureRoot: observation.disposableLocalExecutionClosureRoot,
      }))
    }
    for (const repoPath of [
      V138_LIVE_V13_PATHS.plan122Payload,
      V138_LIVE_V13_PATHS.plan122Review,
      V138_LIVE_V13_PATHS.plan122Carrier,
    ]) expect(existsSync(path.join(repoRoot, repoPath))).toBe(false)
    expect(() => checkV138LiveV13ProspectiveCustodyForReview({
      repoRoot,
      source: prospective.source,
      reviewedClosure: prospective.reviewedClosure,
      canonicalLocalExecutionClosureRoot: prospective.reviewedClosure.localExecutionClosureRoot,
      observations: prospective.payload.observations,
      plan122PublicationCommit: "0".repeat(40),
      plan122: prospective,
      requireEligiblePublication: true,
    })).toThrow("V138_LIVE_V13_PLAN122_NOT_ELIGIBLE")
  }, 120_000)

  it("runs exactly the three producer-incapable Plan121 selectors", async () => {
    const values: Record<string, unknown>[] = []
    for (const selector of [
      "--check-source-only",
      "--check-prospective-custody",
      "--check-post-run-custody",
    ] as const) await executeV138LiveV13Cli([selector], {
      repoRoot,
      writeOutput: (value) => values.push(JSON.parse(value) as Record<string, unknown>),
    })
    expect(values.map(({ status }) => status)).toEqual([
      "source_only_checked",
      "prospective_custody_checked",
      "post_run_no_effect_custody_checked",
    ])
    for (const value of values) expect(value).toMatchObject({
      producerCalls: 0,
      readinessInvoked: false,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      downstreamAuthority: "denied",
    })
    expect(V138_LIVE_V13_MODES).toEqual([
      "--check-source-only",
      "--check-prospective-custody",
      "--check-post-run-custody",
      "--check-reviewed-live-ready",
      "--run-reviewed-bounded-live-envelope",
    ])
  }, 180_000)

  it("rejects canonical/disposable swaps and ambiguous v2 fallback", () => {
    const prospective = deriveV138LiveV13ProspectiveContractsForReview({
      repoRoot,
      reviewedSourceCommit: currentSubjectCommit(),
      plan122PublicationCommit: "0".repeat(40),
    })
    expect(() => checkV138LiveV13ProspectiveCustodyForReview({
      repoRoot,
      source: prospective.source,
      reviewedClosure: prospective.reviewedClosure,
      canonicalLocalExecutionClosureRoot:
        prospective.payload.observations[0].disposableLocalExecutionClosureRoot,
      observations: prospective.payload.observations,
      plan122PublicationCommit: "0".repeat(40),
      plan122: prospective,
    })).toThrow("V138_LIVE_V13_FRESH_CLOSURE_INVALID")
    const forged = { ...prospective.payload, reviewedLocalExecutionClosureRoot:
      prospective.payload.canonicalLocalExecutionClosureRoot }
    expect(forged).toHaveProperty("reviewedLocalExecutionClosureRoot")
    expect(prospective.payload).not.toHaveProperty("reviewedLocalExecutionClosureRoot")
  }, 120_000)

  it("admits only six exact successful observations and rejects forged publication bytes", () => {
    const base = deriveV138LiveV13ProspectiveContractsForReview({
      repoRoot,
      reviewedSourceCommit: currentSubjectCommit(),
      plan122PublicationCommit: "0".repeat(40),
    })
    const observations = strictObservations(base.reviewedClosure.reviewedClosureRoot)
    const eligible = deriveV138LiveV13ProspectiveContractsForReview({
      repoRoot,
      reviewedSourceCommit: currentSubjectCommit(),
      plan122PublicationCommit: "0".repeat(40),
      observations,
    })
    expect(eligible.payload).toMatchObject({
      reviewStatus: "zero_findings",
      actualModesPassed: 6,
      plan110Eligible: true,
      producerCalls: 0,
      readinessInvoked: false,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      authorizesExecution: false,
      downstreamAuthority: "denied",
    })
    expect(checkV138LiveV13ProspectiveCustodyForReview({
      repoRoot,
      source: eligible.source,
      reviewedClosure: eligible.reviewedClosure,
      canonicalLocalExecutionClosureRoot: eligible.reviewedClosure.localExecutionClosureRoot,
      observations,
      plan122PublicationCommit: "0".repeat(40),
      plan122: eligible,
      requireEligiblePublication: true,
    }).payload.plan110Eligible).toBe(true)

    const invalidObservationSets = [
      observations.slice(0, 5),
      [observations[0]!, observations[0]!, ...observations.slice(2)],
      observations.map((value, index) => index === 1 ? { ...value, status: "prospective_only" } : value),
      observations.map((value, index) => index === 2
        ? { ...value, reducedValue: { producerCalls: 1 }, observationRoot: value.observationRoot }
        : value),
      observations.map((value, index) => index === 3
        ? { ...value, disposableLocalInstalledClosureRoot: `sha256:${"f".repeat(64)}` as const }
        : value),
    ]
    for (const candidate of invalidObservationSets)
      expect(() => checkV138LiveV13ObservationsForReview(
        candidate,
        eligible.reviewedClosure.localExecutionClosureRoot,
      )).toThrow("V138_LIVE_V13_OBSERVATIONS_INVALID")

    const forgedPayloads = [
      { ...eligible.payload, plan110Eligible: false },
      { ...eligible.payload, actualModesPassed: 0 },
      { ...eligible.payload, reviewedLocalExecutionClosureRoot:
        eligible.payload.canonicalLocalExecutionClosureRoot },
      { ...eligible.payload, productionAuthorized: true },
      { ...eligible.payload, counters: { ...eligible.payload.counters, acceptedCells: 1 } },
    ]
    for (const payload of forgedPayloads)
      expect(() => checkV138LiveV13PublishedPayloadForReview(payload)).toThrow(
        "V138_LIVE_V13_PLAN122_NOT_ELIGIBLE",
      )
    expect(() => checkV138LiveV13ProspectiveCustodyForReview({
      repoRoot,
      source: eligible.source,
      reviewedClosure: eligible.reviewedClosure,
      canonicalLocalExecutionClosureRoot: eligible.reviewedClosure.localExecutionClosureRoot,
      observations,
      plan122PublicationCommit: "0".repeat(40),
      plan122: { ...eligible, payload: forgedPayloads[0]! },
      requireEligiblePublication: true,
    })).toThrow("V138_LIVE_V13_PLAN122_CUSTODY_INVALID")
  }, 180_000)

  it("keeps one direct producer call under only the closed live selector", () => {
    const source = readFileSync(path.join(repoRoot, V138_LIVE_V13_PATHS.source), "utf8")
    expect(source.match(/await runV138V3ProductionLive\(/gu)).toHaveLength(1)
    expect(source).not.toMatch(/runV138ReviewedBoundedLiveEnvelopeV13\s*=\s*async\s*\([^)]*,/u)
    expect(inspectV138LiveV13ProductionBoundaryForReview(repoRoot)).toMatchObject({
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
    expect(() => inspectV138LiveV13ProductionBoundarySourceForReview(source.replace(
      "await runV138V3ProductionLive(repoRoot, {",
      "await runV138V3ProductionLive(repoRoot, {} as never)\n    await runV138V3ProductionLive(repoRoot, {",
    ))).toThrow("V138_LIVE_V13_PRODUCTION_BOUNDARY_INVALID")
    for (const injected of [
      `${source}\nconst hiddenDynamicProducer = () => import("./run-v1-38-bounded-retry-envelope-v3.js")\n`,
      `${source}\ndeclare const require: (value: string) => unknown\nconst hiddenRequiredProducer = require("./run-v1-38-bounded-retry-envelope-v3.js")\n`,
      `${source}\nconst hiddenComputedProducer = (value: Record<string, unknown>) => value["runV138V3ProductionLive"]\n`,
    ]) expect(() => inspectV138LiveV13ProductionBoundarySourceForReview(injected)).toThrow(
      "V138_LIVE_V13_PRODUCTION_BOUNDARY_INVALID",
    )
  })

  it("pins both b331 summary additions and the amended stop document", () => {
    withLinkedWorktree((root) => {
      for (const repoPath of [
        ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-93-SUMMARY.md",
        ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-120-SUMMARY.md",
      ]) {
        const absolute = path.join(root, repoPath)
        const original = readFileSync(absolute)
        writeFileSync(absolute, Buffer.concat([original, Buffer.from("\n")]))
        expect(() => authenticateV138LiveV13SourceOnly(root)).toThrow(/PLAN_CLOSEOUT_CURRENT_BYTES_INVALID/u)
        writeFileSync(absolute, original)
      }
    })
  }, 120_000)

  it("rejects current bytes, modes, successor rewrites, forbidden outputs, and frozen-history substitution", () => {
    withLinkedWorktree((root) => {
      const mutate = (repoPath: string, expected: RegExp) => {
        const absolute = path.join(root, repoPath)
        const original = readFileSync(absolute)
        writeFileSync(absolute, Buffer.concat([original, Buffer.from("\n")]))
        expect(() => authenticateV138LiveV13SourceOnly(root)).toThrow(expected)
        writeFileSync(absolute, original)
      }
      mutate(V138_LIVE_V13_PATHS.plan120PayloadV2, /PUBLICATION_CURRENT_BYTES_INVALID/u)
      mutate("scripts/run-v1-38-bounded-retry-envelope-v3-live-v12.ts", /PLAN119_ENTRY_INVALID/u)
      mutate(V138_LIVE_V13_PATHS.envelope, /PAIR_CURRENT_BYTES_INVALID/u)
      chmodSync(path.join(root, V138_LIVE_V13_PATHS.plan93Summary), 0o600)
      expect(() => authenticateV138LiveV13SourceOnly(root)).toThrow(/CURRENT_ENTRY_INVALID/u)
      chmodSync(path.join(root, V138_LIVE_V13_PATHS.plan93Summary), 0o644)
      const forbidden = path.join(root,
        ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl")
      writeFileSync(forbidden, "{}")
      expect(() => authenticateV138LiveV13SourceOnly(root)).toThrow(/FORBIDDEN_DESTINATION_PRESENT/u)
    })
    withLinkedWorktree((root) => {
      writeFileSync(path.join(root, V138_LIVE_V13_PATHS.plan93Summary), Buffer.concat([
        readFileSync(path.join(root, V138_LIVE_V13_PATHS.plan93Summary)), Buffer.from("\n"),
      ]))
      execFileSync("/usr/bin/git", ["add", "--", V138_LIVE_V13_PATHS.plan93Summary], { cwd: root })
      execFileSync("/usr/bin/git", [
        "-c", "user.name=Plan 262 Mutation", "-c", "user.email=plan262-mutation@example.invalid",
        "commit", "--quiet", "-m", "test: forbidden closeout rewrite",
      ], { cwd: root })
      expect(() => authenticateV138LiveV13SourceOnly(root)).toThrow(/SUCCESSOR_REWRITE/u)
    })
  }, 180_000)

  it("keeps the file-backed producer tripwire untouched in all Plan121 modes", () => {
    withLinkedWorktree((root) => {
      for (const repoPath of [V138_LIVE_V13_PATHS.source, V138_LIVE_V13_PATHS.tests])
        writeFileSync(path.join(root, repoPath), readFileSync(path.join(repoRoot, repoPath)))
      const marker = path.join(path.dirname(root), "producer-called")
      const testPath = path.join(root, V138_LIVE_V13_PATHS.tests)
      writeFileSync(testPath, Buffer.concat([
        readFileSync(testPath),
        Buffer.from("\n// Plan 262-121 disposable tripwire subject.\n"),
      ]))
      const producerPath = path.join(root, "scripts/run-v1-38-bounded-retry-envelope-v3.ts")
      const producer = readFileSync(producerPath, "utf8")
      const instrumented = producer.replace(
        "): Promise<void> => {\n  const executionBefore =",
        `): Promise<void> => {\n  await import("node:fs").then(({ writeFileSync }) => writeFileSync(${JSON.stringify(marker)}, "called"))\n  const executionBefore =`,
      )
      expect(instrumented).not.toBe(producer)
      writeFileSync(producerPath, instrumented)
      execFileSync("/usr/bin/git", ["add", "--",
        V138_LIVE_V13_PATHS.source, V138_LIVE_V13_PATHS.tests,
        "scripts/run-v1-38-bounded-retry-envelope-v3.ts"], { cwd: root })
      execFileSync("/usr/bin/git", [
        "-c", "user.name=Plan 262 Tripwire", "-c", "user.email=plan262-tripwire@example.invalid",
        "commit", "--quiet", "-m", "test: instrument live-v13 producer tripwire",
      ], { cwd: root })
      for (const selector of [
        "--check-source-only", "--check-prospective-custody", "--check-post-run-custody",
      ]) {
        const output = JSON.parse(execFileSync(
          "pnpm", ["exec", "tsx", V138_LIVE_V13_PATHS.source, selector],
          { cwd: root, encoding: "utf8" },
        )) as Record<string, unknown>
        expect(output).toMatchObject({
          producerCalls: 0,
          readinessInvoked: false,
          liveInvoked: false,
          freshCharged: 0,
          freshAccepted: 0,
          downstreamAuthority: "denied",
        })
        expect(existsSync(marker)).toBe(false)
      }
    })
  }, 180_000)
})
