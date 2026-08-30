import { execFileSync } from "node:child_process"
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
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
  V138_LIVE_V11_MODES,
  V138_LIVE_V11_PATHS,
  authenticateV138LiveV11FutureCustodyForReview,
  authenticateV138LiveV11SourceOnly,
  checkV138LiveV11PostRunOutputCustodyForReview,
  checkV138LiveV11ProspectiveCustodyForReview,
  deriveV138LiveV11ProspectiveContractsForReview,
  executeV138LiveV11Cli,
  inspectV138LiveV11ProductionBoundaryForReview,
  inspectV138LiveV11ProductionBoundarySourceForReview,
} from "./run-v1-38-bounded-retry-envelope-v3-live-v11.js"

const repoRoot = path.resolve(import.meta.dirname, "..")
const POST_PLAN118_EXACT_REF = "7f65ff66be29de4f655736f60d6c68683fae3e35"
const plan118AddCommit = execFileSync(
  "/usr/bin/git",
  ["log", "--diff-filter=A", "--format=%H", "--", V138_LIVE_V11_PATHS.plan118Payload],
  { cwd: repoRoot, encoding: "utf8" },
).trim()
const PRE_PLAN118_REF = `${plan118AddCommit}^`
const readJson = (repoPath: string) => JSON.parse(
  readFileSync(path.join(repoRoot, repoPath), "utf8"),
) as Record<string, unknown>
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => Array.isArray(item)
    ? item.map(normalize)
    : item !== null && typeof item === "object"
      ? Object.fromEntries(Object.entries(item as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)]))
      : item
  return `${JSON.stringify(normalize(value))}\n`
}
const withLinkedWorktree = <T>(run: (root: string) => T): T => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-live-v11-test-"))
  const root = path.join(owner, "repo")
  let added = false
  try {
    execFileSync("/usr/bin/git", ["worktree", "add", "--quiet", "--detach", root, "HEAD"], {
      cwd: repoRoot,
      env: { PATH: "/usr/bin:/bin", HOME: owner, LANG: "C", LC_ALL: "C" },
    })
    added = true
    symlinkSync(path.join(repoRoot, "node_modules"), path.join(root, "node_modules"), "dir")
    for (const repoPath of [V138_LIVE_V11_PATHS.seal, V138_LIVE_V11_PATHS.envelope])
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
const withLinkedWorktreeAsync = async <T>(
  run: (root: string) => Promise<T>,
  startRef = "HEAD",
): Promise<T> => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-live-v11-async-test-"))
  const root = path.join(owner, "repo")
  let added = false
  try {
    execFileSync("/usr/bin/git", ["worktree", "add", "--quiet", "--detach", root, startRef], {
      cwd: repoRoot,
      env: { PATH: "/usr/bin:/bin", HOME: owner, LANG: "C", LC_ALL: "C" },
    })
    added = true
    symlinkSync(path.join(repoRoot, "node_modules"), path.join(root, "node_modules"), "dir")
    for (const repoPath of [V138_LIVE_V11_PATHS.seal, V138_LIVE_V11_PATHS.envelope])
      chmodSync(path.join(root, repoPath), 0o600)
    return await run(root)
  } finally {
    if (added) {
      try { execFileSync("/usr/bin/git", ["worktree", "remove", "--force", root], { cwd: repoRoot }) }
      catch { /* preserve the primary assertion */ }
    }
    rmSync(owner, { recursive: true, force: true })
  }
}

describe("Plan 262-117 authoritative readiness consumer", () => {
  it("requires an additive owner because live-v10 binds v1 while supplement-v3 binds v2", () => {
    const v1 = readJson(".planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-payload-v1.json")
    const v2 = readJson(".planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-payload-v2.json")
    const supplement = readJson(".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v3.json")
    const liveV10 = readFileSync(
      path.join(repoRoot, "scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts"),
      "utf8",
    )

    expect(supplement.plan114PayloadRoot).toBe(v2.payloadRoot)
    expect(supplement.plan114PayloadRoot).not.toBe(v1.payloadRoot)
    expect(liveV10).toContain("v1.38-plan-262-114-live-v10-custody-review-payload-v1.json")

    expect(() => readFileSync(
      path.join(repoRoot, "scripts/run-v1-38-bounded-retry-envelope-v3-live-v11.ts"),
    )).not.toThrow()
  })

  it("authenticates authoritative v2/v4, exact supplement-v3, and the unchanged pair", async () => {
    const exact = authenticateV138LiveV11SourceOnly(repoRoot)
    expect(exact.plan114V2PublicationCommit).toBe("34bc94ec4e348f71e6055a091d60a505cffc0d79")
    expect(exact.plan116V4PublicationCommit).toBe("f03f0e05539a1591b91000fc9d35b8381a082ec2")
    expect(exact.supplementPublicationCommit).toBe("a1e693a2ae528ba06597d3262041d6f947ecbeca")
    expect(exact.supplementRoot).toBe("sha256:3a653c44db658a89250d4b90d9a3bb086c99ac3fc04ebf8c7107bc66fd4f8e4b")
    expect(exact.pairCommit).toBe("8080ff66a0880db25db227d23e7e7a0884a79b56")
    expect(exact.envelopeStatus).toBe("sealed_inactive")
    expect(exact.counters).toEqual({
      acceptedCells: 0,
      calibrationIdentitiesCharged: 0,
      preflightObservationsConsumed: 0,
      reproductionIdentitiesCharged: 0,
      routeStartsConsumed: 0,
    })
    expect(exact.producerCalls).toBe(0)
    expect(exact.readinessInvoked).toBe(false)
    expect(exact.liveInvoked).toBe(false)
    expect(exact.authorizesExecution).toBe(false)
    expect(exact.downstreamAuthority).toBe("denied")

    const outputs: string[] = []
    await executeV138LiveV11Cli(["--check-source-only"], {
      repoRoot,
      writeOutput: (value) => outputs.push(value),
    })
    await withLinkedWorktreeAsync(async (root) => {
      const committed = authenticateV138LiveV11FutureCustodyForReview(root, "pre")
      expect(committed.payload.payloadRoot).toBe(
        "sha256:6a262e4b8e267a6be8858c1247a49ceab3c0dbb23b9ebfea9f675a6e02f527e8",
      )
      expect(committed.reviewRoot).toBe(
        "sha256:be5bea259659c0b8878a09ff7ca7df991fda9b6702c8bc3b90f38922068d8f16",
      )
      expect(committed.carrier.carrierRoot).toBe(
        "sha256:ae957db112a31b563ae5357104351c0c8da90b1de7563d6ab86cfd2223286bcb",
      )
      await executeV138LiveV11Cli(["--check-prospective-custody"], {
        repoRoot: root,
        writeOutput: (value) => outputs.push(value),
      })
    }, POST_PLAN118_EXACT_REF)
    await expect(executeV138LiveV11Cli([], { repoRoot })).rejects.toThrow("V138_LIVE_V11_ARGUMENTS_INVALID")
    await expect(executeV138LiveV11Cli(["--unknown"], { repoRoot })).rejects.toThrow("V138_LIVE_V11_ARGUMENTS_INVALID")
    expect(outputs.map((value) => JSON.parse(value))).toEqual([
      expect.objectContaining({ status: "source_only_checked", producerCalls: 0, readinessInvoked: false, liveInvoked: false }),
      expect.objectContaining({
        status: "prospective_custody_checked",
        payloadRoot: "sha256:6a262e4b8e267a6be8858c1247a49ceab3c0dbb23b9ebfea9f675a6e02f527e8",
        producerWouldInvoke: false,
        producerCalls: 0,
        readinessInvoked: false,
        liveInvoked: false,
      }),
    ])
    expect(V138_LIVE_V11_MODES).toEqual([
      "--check-source-only",
      "--check-prospective-custody",
      "--check-post-run-custody",
      "--check-reviewed-live-ready",
      "--run-reviewed-bounded-live-envelope",
    ])
  }, 120_000)

  it("fails closed on authoritative history, supplement, pair, and forbidden-path drift", () => {
    withLinkedWorktree((root) => {
      const mutate = (repoPath: string, expected: RegExp) => {
        const absolute = path.join(root, repoPath)
        const bytes = readFileSync(absolute)
        writeFileSync(absolute, Buffer.concat([bytes, Buffer.from("\n")]))
        expect(() => authenticateV138LiveV11SourceOnly(root)).toThrow(expected)
        writeFileSync(absolute, bytes)
      }
      mutate(V138_LIVE_V11_PATHS.plan114PayloadV2, /PUBLICATION_CURRENT_BYTES_INVALID/)
      mutate(".planning/artifacts/v1.38-plan-262-116-supplement-v3-adapter-review-payload-v4.json", /PUBLICATION_CURRENT_BYTES_INVALID/)
      mutate(V138_LIVE_V11_PATHS.supplementV3, /SUPPLEMENT_BYTES_INVALID/)
      mutate(V138_LIVE_V11_PATHS.envelope, /PAIR_CURRENT_BYTES_INVALID/)

      const forbidden = path.join(root, V138_LIVE_V11_PATHS.supplementV1)
      mkdirSync(path.dirname(forbidden), { recursive: true })
      symlinkSync("missing-target", forbidden)
      expect(() => authenticateV138LiveV11SourceOnly(root)).toThrow(/FORBIDDEN_DESTINATION_PRESENT/)
      rmSync(forbidden)

      const effect = path.join(root, ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json")
      symlinkSync("missing-target", effect)
      expect(() => authenticateV138LiveV11SourceOnly(root)).toThrow(/FORBIDDEN_DESTINATION_PRESENT/)
    })
  }, 120_000)

  it("keeps a closed static single-call future live boundary", () => {
    const source = readFileSync(path.join(repoRoot, V138_LIVE_V11_PATHS.source), "utf8")
    expect(source.match(/await runV138V3ProductionLive\(/gu)).toHaveLength(1)
    expect(source).not.toMatch(/runV138ReviewedBoundedLiveEnvelopeV11\s*=\s*async\s*\([^)]*,/u)
    expect(source).not.toMatch(/Partial<\{[^}]*?(?:producer|readiness|renderer)/su)
    expect(source).toContain("settleV138LiveV9ProducerOutcomeForReview(producerError, postCustodyError)")
    expect(source).toContain("assertV138LiveV10PostRunForReview(repoRoot)")

    expect(inspectV138LiveV11ProductionBoundaryForReview(repoRoot)).toEqual({
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

    const aliased = source.replace(
      "await runV138V3ProductionLive(repoRoot, {",
      "const invokeProducer = runV138V3ProductionLive\n    await invokeProducer(repoRoot, {",
    )
    expect(() => inspectV138LiveV11ProductionBoundarySourceForReview(aliased)).toThrow(
      "V138_LIVE_V11_PRODUCTION_BOUNDARY_INVALID",
    )
    const indirect = source.replace(
      "await runV138V3ProductionLive(repoRoot, {",
      "await ({ invoke: runV138V3ProductionLive }).invoke(repoRoot, {",
    )
    expect(() => inspectV138LiveV11ProductionBoundarySourceForReview(indirect)).toThrow(
      "V138_LIVE_V11_PRODUCTION_BOUNDARY_INVALID",
    )
  })

  it("derives and checks a disposable Plan-118 contract through post-no-effect custody", async () => {
    await withLinkedWorktreeAsync(async (root) => {
      for (const repoPath of [V138_LIVE_V11_PATHS.source, V138_LIVE_V11_PATHS.tests])
        copyFileSync(path.join(repoRoot, repoPath), path.join(root, repoPath))
      execFileSync("/usr/bin/git", ["add", "--", V138_LIVE_V11_PATHS.source, V138_LIVE_V11_PATHS.tests], { cwd: root })
      execFileSync("/usr/bin/git", ["-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid",
        "commit", "--quiet", "--allow-empty", "-m", "fixture live-v11 subject"], { cwd: root })
      const subjectCommit = execFileSync("/usr/bin/git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim()
      const preview = deriveV138LiveV11ProspectiveContractsForReview({
        repoRoot: root,
        reviewedSourceCommit: subjectCommit,
        plan118PublicationCommit: "0".repeat(40),
      })
      expect(preview.payload).toEqual(expect.objectContaining({
        schemaVersion: "v1.38-plan-262-118-live-v11-custody-review-payload-v1",
        subjectCommit,
        findingCount: 0,
        actualModesPassed: 6,
        plan110Eligible: true,
        producerCalls: 0,
        readinessInvoked: false,
        liveInvoked: false,
        authorizesExecution: false,
        downstreamAuthority: "denied",
      }))
      const checked = checkV138LiveV11ProspectiveCustodyForReview({
        source: preview.source,
        reviewedClosure: preview.reviewedClosure,
        reviewedLocalExecutionClosureRoot: preview.reviewedClosure.localExecutionClosureRoot,
        plan118PublicationCommit: "0".repeat(40),
        plan118: {
          payload: preview.payload,
          reviewBytes: preview.reviewBytes,
          carrier: preview.carrier,
          reviewRoot: preview.reviewRoot,
        },
      })
      expect(checked).toEqual(expect.objectContaining({
        producerCalls: 0,
        readinessInvoked: false,
        liveInvoked: false,
        freshCharged: 0,
        freshAccepted: 0,
        downstreamAuthority: "denied",
      }))
      for (const mutation of [
        { ...preview.payload, plan114V2PayloadRoot: `sha256:${"1".repeat(64)}` },
        { ...preview.payload, plan116V4PayloadRoot: `sha256:${"2".repeat(64)}` },
        { ...preview.payload, supplementRoot: `sha256:${"3".repeat(64)}` },
        { ...preview.payload, counters: { ...preview.payload.counters, routeStartsConsumed: 1 } },
        { ...preview.payload, authorizesExecution: true },
      ]) expect(() => checkV138LiveV11ProspectiveCustodyForReview({
        source: preview.source,
        reviewedClosure: preview.reviewedClosure,
        reviewedLocalExecutionClosureRoot: preview.reviewedClosure.localExecutionClosureRoot,
        plan118PublicationCommit: "0".repeat(40),
        plan118: {
          payload: mutation,
          reviewBytes: preview.reviewBytes,
          carrier: preview.carrier,
          reviewRoot: preview.reviewRoot,
        },
      })).toThrow("V138_LIVE_V11_PLAN118_CUSTODY_INVALID")
      expect(() => checkV138LiveV11ProspectiveCustodyForReview({
        source: preview.source,
        reviewedClosure: preview.reviewedClosure,
        reviewedLocalExecutionClosureRoot: preview.reviewedClosure.localExecutionClosureRoot,
        plan118PublicationCommit: "0".repeat(40),
        plan118: {
          payload: preview.payload,
          reviewBytes: Buffer.concat([preview.reviewBytes, Buffer.from("drift")]),
          carrier: preview.carrier,
          reviewRoot: preview.reviewRoot,
        },
      })).toThrow("V138_LIVE_V11_PLAN118_CUSTODY_INVALID")
      expect(() => checkV138LiveV11ProspectiveCustodyForReview({
        source: preview.source,
        reviewedClosure: preview.reviewedClosure,
        reviewedLocalExecutionClosureRoot: preview.reviewedClosure.localExecutionClosureRoot,
        plan118PublicationCommit: "0".repeat(40),
        plan118: {
          payload: preview.payload,
          reviewBytes: preview.reviewBytes,
          carrier: { ...preview.carrier, authorizesExecution: true },
          reviewRoot: preview.reviewRoot,
        },
      })).toThrow("V138_LIVE_V11_PLAN118_CUSTODY_INVALID")
      expect(() => checkV138LiveV11ProspectiveCustodyForReview({
        source: preview.source,
        reviewedClosure: {
          ...preview.reviewedClosure,
          localInstalledClosureRoot: `sha256:${"4".repeat(64)}`,
        },
        reviewedLocalExecutionClosureRoot: preview.reviewedClosure.localExecutionClosureRoot,
        plan118PublicationCommit: "0".repeat(40),
        plan118: preview,
      })).toThrow()

      for (const [repoPath, bytes] of [
        [V138_LIVE_V11_PATHS.plan118Payload, Buffer.from(canonical(preview.payload))],
        [V138_LIVE_V11_PATHS.plan118Review, preview.reviewBytes],
        [V138_LIVE_V11_PATHS.plan118Carrier, Buffer.from(canonical(preview.carrier))],
      ] as const) {
        mkdirSync(path.dirname(path.join(root, repoPath)), { recursive: true })
        writeFileSync(path.join(root, repoPath), bytes, { mode: 0o644 })
      }
      execFileSync("/usr/bin/git", ["add", "--", V138_LIVE_V11_PATHS.plan118Payload,
        V138_LIVE_V11_PATHS.plan118Review, V138_LIVE_V11_PATHS.plan118Carrier], { cwd: root })
      execFileSync("/usr/bin/git", ["-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid",
        "commit", "--quiet", "-m", "fixture Plan118 review"], { cwd: root })
      const outputs: string[] = []
      await executeV138LiveV11Cli(["--check-prospective-custody"], {
        repoRoot: root,
        writeOutput: (value) => outputs.push(value),
      })
      await executeV138LiveV11Cli(["--check-post-run-custody"], {
        repoRoot: root,
        writeOutput: (value) => outputs.push(value),
      })
      expect(outputs.map((value) => JSON.parse(value))).toEqual([
        expect.objectContaining({ status: "prospective_custody_checked", producerCalls: 0, liveInvoked: false }),
        expect.objectContaining({ status: "post_run_custody_checked", producerCalls: 0, liveInvoked: false }),
      ])

      chmodSync(path.join(root, V138_LIVE_V11_PATHS.plan118Payload), 0o600)
      expect(() => authenticateV138LiveV11FutureCustodyForReview(root, "pre")).toThrow(
        /V138_LIVE_V11_CURRENT_ENTRY_INVALID/,
      )
      chmodSync(path.join(root, V138_LIVE_V11_PATHS.plan118Payload), 0o644)

      for (const repoPath of [
        ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl",
        ".planning/artifacts/v1.38-current-matrix-retry-private-v3",
        ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json",
      ]) {
        const absolute = path.join(root, repoPath)
        if (repoPath.endsWith("private-v3")) mkdirSync(absolute, { recursive: true })
        else {
          mkdirSync(path.dirname(absolute), { recursive: true })
          writeFileSync(absolute, "fixture\n")
        }
      }
      expect(() => authenticateV138LiveV11FutureCustodyForReview(root, "post")).not.toThrow()
      expect(checkV138LiveV11PostRunOutputCustodyForReview({
        journalPresent: true,
        privateDirectoryPresent: true,
        terminalPresent: true,
        lockPresent: false,
        reproductionPresent: false,
        adjudicationOrDownstreamPresent: false,
        outcome: {
          disposition: "exhausted",
          completeCleanup: true,
          reproductionPresent: false,
          downstreamAuthority: "denied",
        },
      })).toEqual({ status: "bounded_terminal", downstreamAuthority: "denied" })

      writeFileSync(path.join(root, ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json"), "fixture\n")
      expect(() => authenticateV138LiveV11FutureCustodyForReview(root, "post")).not.toThrow()
      expect(checkV138LiveV11PostRunOutputCustodyForReview({
        journalPresent: true,
        privateDirectoryPresent: true,
        terminalPresent: true,
        lockPresent: false,
        reproductionPresent: true,
        adjudicationOrDownstreamPresent: false,
        outcome: {
          disposition: "succeeded",
          completeCleanup: true,
          reproductionPresent: true,
          downstreamAuthority: "denied",
        },
      })).toEqual({ status: "bounded_success", downstreamAuthority: "denied" })

      const payloadBytes = readFileSync(path.join(root, V138_LIVE_V11_PATHS.plan118Payload))
      writeFileSync(path.join(root, V138_LIVE_V11_PATHS.plan118Payload), Buffer.concat([payloadBytes, Buffer.from("\n")]))
      execFileSync("/usr/bin/git", ["add", "--", V138_LIVE_V11_PATHS.plan118Payload], { cwd: root })
      execFileSync("/usr/bin/git", ["-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid",
        "commit", "--quiet", "-m", "fixture forbidden Plan118 rewrite"], { cwd: root })
      expect(() => authenticateV138LiveV11FutureCustodyForReview(root, "post")).toThrow(
        /V138_LIVE_V11_PUBLICATION_CURRENT_BYTES_INVALID|V138_LIVE_V11_SUCCESSOR_REWRITE/,
      )
    }, PRE_PLAN118_REF)
  }, 180_000)
})
