import { chmodSync, existsSync, lstatSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  authenticateV138Plan116PublishedReview,
  captureV138Plan116FoundationForReview,
  classifyV138Plan116ModeFailureForReview,
  executeV138Plan116DisposableModes,
  observeV138Plan116FoundationForReview,
  renderV138Plan116EvidenceForReview,
} from "./check-v1-38-plan-262-116-supplement-v3-adapter-v1.js"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const phase = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const reviewPaths = [
  ".planning/artifacts/v1.38-plan-262-116-supplement-v3-adapter-review-payload-v1.json",
  `${phase}/262-116-REVIEW.md`,
  ".planning/artifacts/v1.38-plan-262-116-supplement-v3-adapter-review-carrier-v1.json",
] as const
const adapterPath = "scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.ts"
const adapterTestPath = "scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.test.ts"
const nativePath = "scripts/native/v1-38-plan-262-115-exclusive-writer-v1.c"
const supplementPath = ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v3.json"
const effectPaths = [
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl",
  ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json",
  ".planning/artifacts/v1.38-plan-262-route-11-activation-v1.json",
] as const
let cachedModes: ReturnType<typeof executeV138Plan116DisposableModes> | undefined
const actualModes = () => cachedModes ??= executeV138Plan116DisposableModes(repoRoot)

describe("Plan 262-116 independent supplement-v3 adapter review", () => {
  it("pins exact committed three-file Plan-115 custody and source-separated closure", () => {
    const foundation = captureV138Plan116FoundationForReview(repoRoot)
    expect(foundation).toMatchObject({
      subjectCommit: "bb1d639ac4ba92c9a23ecd0356bc5c139ed4ea48",
      subjectTree: "0f55d28d514e1e5e37ffcdcada88fe606e87ccd3",
      subjectParent: "a2a5170ad0eb2ff0d8919aa9b78361ec5e34b076",
      subjectEntries: [
        { path: adapterPath, mode: "100644", blob: "de32acd9a664a1efde3390827b59121231e384ee" },
        { path: adapterTestPath, mode: "100644", blob: "2fa32f8c69a5515f4d1e0e31b9c93a23c9c3a21f" },
        { path: nativePath, mode: "100644", blob: "a733b6ce9239d02e522a78ad83930037e644a4d0" },
      ],
      secureCurrentMode: "0600",
      ordinaryCurrentMode: "0644",
      upstreamAuthenticated: true,
      supplementSemanticsAuthenticated: true,
      producerCalls: 0,
      freshCharged: 0,
      freshAccepted: 0,
      downstreamAuthority: "denied",
    })
    expect(foundation.recursiveDependencyCount).toBeGreaterThan(0)
    expect(foundation.reviewedClosureRoot).toMatch(/^sha256:[0-9a-f]{64}$/)
    expect(foundation.localExecutionClosureRoot).toMatch(/^sha256:[0-9a-f]{64}$/)
    expect(foundation.reviewedClosureRoot).not.toBe(foundation.localExecutionClosureRoot)
  }, 180_000)

  it("executes every required real disposable selector, race, cache, and mutation mode", () => {
    const modes = actualModes()
    expect(modes.modeNames).toEqual([
      "shared_source_only",
      "disposable_source_only",
      "exclusive_write",
      "exact_one_path_commit",
      "committed_check",
      "repeat_check",
      "parent_swap_rejected",
      "preseeded_cache_rejected",
      "representative_mutations_rejected",
    ])
    expect(modes).toMatchObject({
      actualModesPassed: 9,
      producerCalls: 0,
      readinessInvoked: false,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      findings: [],
      downstreamAuthority: "denied",
    })
    expect(modes.observationRoot).toMatch(/^sha256:[0-9a-f]{64}$/)
    expect(modes.observations.every(({ status }) => status === "passed")).toBe(true)
    expect(existsSync(path.join(repoRoot, supplementPath))).toBe(false)
    for (const repoPath of effectPaths) expect(existsSync(path.join(repoRoot, repoPath))).toBe(false)
  }, 300_000)

  it("classifies observable custody drift as a sorted rooted blocked finding", () => {
    const target = path.join(repoRoot,
      ".planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-payload-v2.json")
    const mode = lstatSync(target).mode & 0o7777
    try {
      chmodSync(target, 0o600)
      const observation = observeV138Plan116FoundationForReview(repoRoot)
      expect(observation.foundation).toBeUndefined()
      expect(observation.findings).toHaveLength(1)
      expect(observation.findings[0]?.code).toBe("FOUNDATION_SUBJECT_REJECTED")
      const evidence = renderV138Plan116EvidenceForReview(repoRoot, observation.findings, undefined, observation)
      expect(evidence.payload.reviewStatus).toBe("blocked")
      expect(evidence.payload.findingCount).toBe(1)
      expect(evidence.payload.findingRoot).toMatch(/^sha256:[0-9a-f]{64}$/)
      expect(evidence.payload.plan109Eligible).toBe(false)
      expect(evidence.carrier.plan109Eligible).toBe(false)
      expect(evidence.payload.subjectAuthenticated).toBe(true)
      expect(evidence.payload.upstreamAuthenticated).toBe(false)
      expect(evidence.payload.supplementSemanticsAuthenticated).toBe(false)
      expect(evidence.payload.failedBoundary).toBe("upstream")
    } finally {
      chmodSync(target, mode)
    }
  }, 180_000)

  it("renders subject-custody rejection without recapturing the failed closure", () => {
    const target = path.join(repoRoot, adapterPath)
    const mode = lstatSync(target).mode & 0o7777
    try {
      chmodSync(target, 0o600)
      const observed = observeV138Plan116FoundationForReview(repoRoot)
      expect(observed.foundation).toBeUndefined()
      expect(observed.authentication.failedBoundary).toBe("subject")
      const evidence = renderV138Plan116EvidenceForReview(repoRoot, observed.findings, undefined, observed)
      expect(evidence.payload).toMatchObject({
        reviewStatus: "blocked",
        subjectAuthenticated: false,
        upstreamAuthenticated: false,
        supplementSemanticsAuthenticated: false,
        failedBoundary: "subject",
        reviewedClosureRoot: null,
        plan109Eligible: false,
      })
    } finally { chmodSync(target, mode) }
  })

  it("grants revised Plan 109 eligibility only to literal zero after nine clean actual modes", () => {
    const modes = actualModes()
    const zero = renderV138Plan116EvidenceForReview(repoRoot, [], modes)
    expect(zero.payload).toMatchObject({
      reviewStatus: "zero_findings",
      findingCount: 0,
      actualModesPassed: 9,
      producerCalls: 0,
      freshCharged: 0,
      freshAccepted: 0,
      plan109Eligible: true,
      authorizesExecution: false,
      supplementPublished: false,
      liveInvoked: false,
      downstreamAuthority: "denied",
    })
    expect(zero.reviewBytes.toString("utf8")).toContain("ZERO FINDINGS")
    const blocked = renderV138Plan116EvidenceForReview(repoRoot, [{
      code: "TEST_FINDING", severity: "critical", detail: "deterministic",
    }], modes)
    expect(blocked.payload.plan109Eligible).toBe(false)
    expect(blocked.reviewBytes.toString("utf8")).toContain("BLOCKED")
  }, 300_000)

  it("rejects forged, missing, duplicate, and unbound nine-mode evidence", () => {
    const forged = {
      modeNames: [], actualModesPassed: 9, observations: [],
      observationRoot: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
      disposableExecutionClosureRoot: undefined,
      findings: [], producerCalls: 0, readinessInvoked: false, liveInvoked: false,
      freshCharged: 0, freshAccepted: 0, downstreamAuthority: "denied",
    } as unknown as ReturnType<typeof executeV138Plan116DisposableModes>
    expect(() => renderV138Plan116EvidenceForReview(repoRoot, [], forged))
      .toThrow(/MODE_EVIDENCE_INVALID/)

    const valid = actualModes()
    const duplicate = {
      ...valid,
      observations: valid.observations.map((item, index) => index === 1 ? valid.observations[0]! : item),
    } as ReturnType<typeof executeV138Plan116DisposableModes>
    expect(() => renderV138Plan116EvidenceForReview(repoRoot, [], duplicate))
      .toThrow(/MODE_EVIDENCE_INVALID/)
  }, 300_000)

  it("publishes only enumerated subject rejection and propagates process-integrity failure", () => {
    expect(classifyV138Plan116ModeFailureForReview(new TypeError("MODE_COMMITTED_CHECK_FAILED")))
      .toMatchObject({ code: "ACTUAL_MODE_SUBJECT_REJECTED", detail: "MODE_COMMITTED_CHECK_FAILED" })
    expect(() => classifyV138Plan116ModeFailureForReview(
      new TypeError("V138_PLAN116_COMMAND_FAILED:/usr/bin/clang"),
    )).toThrow(/COMMAND_FAILED/)
    expect(() => classifyV138Plan116ModeFailureForReview(
      new Error("V138_PLAN116_PROCESS_INTEGRITY:timeout"),
    )).toThrow(/PROCESS_INTEGRITY/)
  })

  it("authenticates only an exact committed trio and every no-effect sentinel", () => {
    if (!reviewPaths.every((repoPath) => existsSync(path.join(repoRoot, repoPath)))) return
    const checked = authenticateV138Plan116PublishedReview(repoRoot)
    expect(checked).toMatchObject({
      findingCount: 0,
      actualModesPassed: 9,
      plan109Eligible: true,
      supplementPublished: false,
      producerCalls: 0,
      readinessInvoked: false,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      downstreamAuthority: "denied",
    })
    expect(checked.publicationCommit).toMatch(/^[0-9a-f]{40}$/)
    for (const repoPath of effectPaths) expect(existsSync(path.join(repoRoot, repoPath))).toBe(false)
  })

  it("contains no import of subject acceptance decisions or live/readiness execution surface", () => {
    const source = readFileSync(path.join(repoRoot,
      "scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.ts"), "utf8")
    expect(source).not.toMatch(/from ["'].+supplement-v3-adapter-v1\.js["']/)
    expect(source).not.toMatch(/checkV138SupplementV3AdapterSourceOnly|renderV138SuccessorSupplementV3/)
    expect(source).not.toMatch(/check-reviewed-live-ready|run-reviewed-bounded-live-envelope/)
    expect(source).not.toMatch(/runV138V3ProductionLive|runV138ReviewedBoundedLiveEnvelope/)
    expect(source).not.toMatch(/--write-supplement-v3["']\s*\)/)
  })

  it("roots a semantic mutation without making the canonical trio or supplement", () => {
    const priorReviewBytes = new Map(reviewPaths.map((repoPath) => [repoPath,
      existsSync(path.join(repoRoot, repoPath)) ? readFileSync(path.join(repoRoot, repoPath)) : undefined]))
    const modes = actualModes()
    const altered = renderV138Plan116EvidenceForReview(repoRoot, [{
      code: "SUPPLEMENT_SEMANTIC_DRIFT", severity: "critical", detail: "createsCapacity:true",
    }], modes)
    expect(altered.payload.findingRoot).not.toBe(
      renderV138Plan116EvidenceForReview(repoRoot, [], modes).payload.findingRoot,
    )
    expect(altered.payload.plan109Eligible).toBe(false)
    expect(existsSync(path.join(repoRoot, supplementPath))).toBe(false)
    for (const repoPath of reviewPaths) {
      const prior = priorReviewBytes.get(repoPath)
      if (prior === undefined) expect(existsSync(path.join(repoRoot, repoPath))).toBe(false)
      else expect(readFileSync(path.join(repoRoot, repoPath))).toEqual(prior)
    }
  }, 300_000)
})
