import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { computeV138PathStableLocalExecutionClosureRoot } from
  "./lib/v1-38-bounded-retry-v3-path-stable-custody-v1.js"
import {
  V138_PLAN132_PUBLICATION_SCOPE,
  V138_PLAN132_SUMMARY_SCOPE,
  assertV138Plan132ExactScopeForReview,
  assertV138Plan132StrictSummaryDescendantForReview,
  authenticateV138Plan132V4InvalidHistoryForReview,
  renderV138Plan132SourceCorrectionForReview,
  validateV138Plan132ObservationsForReview,
} from "./check-v1-38-plan-262-132-live-v13-custody-v5.js"

const ROOT = new URL("..", import.meta.url).pathname
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => Array.isArray(item) ? item.map(normalize)
    : item !== null && typeof item === "object"
      ? Object.fromEntries(Object.entries(item as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)]))
      : item
  return `${JSON.stringify(normalize(value))}\n`
}
const rooted = (domain: string, value: unknown): string =>
  `sha256:${createHash("sha256").update(`${domain}\0${canonical(value)}`).digest("hex")}`

describe("Plan 262-132 strict descendant custody v5", () => {
  it("accepts tracking, review, planning, and current strict descendants", () => {
    for (const head of [
      "ca21e28b8dc7c9de4c1691d03601c95ef473ffe3",
      "f45ee38d529ba79d63e0b54995ed90d947811dd4",
      "823bc2ccf20b5efcf9d248ad7f48d832d0766f1b",
      "HEAD",
    ]) expect(authenticateV138Plan132V4InvalidHistoryForReview(ROOT, head)).toMatchObject({
      publicationCommit: "b80782214eeb323023287b4589049f0139befdd5",
      summaryCommit: "6a82901a8e73a4c2b8be92ba1b8d606919678784",
      reviewCommit: "f45ee38d529ba79d63e0b54995ed90d947811dd4",
      storedPlan110Eligible: true,
      currentPlan110Eligible: false,
      disposition: "process_invalid_descendant_and_observation_validation",
    })
  })

  it("rejects summary equality and non-descendants", () => {
    expect(() => assertV138Plan132StrictSummaryDescendantForReview(
      "a".repeat(40), "a".repeat(40), true,
    )).toThrow("V138_PLAN132_HEAD_NOT_STRICT_SUMMARY_DESCENDANT")
    expect(() => assertV138Plan132StrictSummaryDescendantForReview(
      "a".repeat(40), "b".repeat(40), false,
    )).toThrow("V138_PLAN132_HEAD_NOT_STRICT_SUMMARY_DESCENDANT")
    expect(() => authenticateV138Plan132V4InvalidHistoryForReview(ROOT,
      "6a82901a8e73a4c2b8be92ba1b8d606919678784"))
      .toThrow("V138_PLAN132_HEAD_NOT_STRICT_SUMMARY_DESCENDANT")
    expect(() => authenticateV138Plan132V4InvalidHistoryForReview(ROOT,
      "6515ea1a2e372a71d9f9d161e395276cf163db76"))
      .toThrow("V138_PLAN132_HEAD_NOT_STRICT_SUMMARY_DESCENDANT")
  })

  it("rejects an unrelated commit even when a local replacement ref forges ancestry", () => {
    const owner = mkdtempSync(path.join(tmpdir(), "v138-plan132-replace-"))
    const repo = path.join(owner, "repo")
    try {
      execFileSync("/usr/bin/git", ["clone", "--shared", "--quiet", ROOT, repo])
      execFileSync("/usr/bin/git", ["replace", "--graft",
        "6515ea1a2e372a71d9f9d161e395276cf163db76",
        "6a82901a8e73a4c2b8be92ba1b8d606919678784"], { cwd: repo })
      expect(() => authenticateV138Plan132V4InvalidHistoryForReview(repo,
        "6515ea1a2e372a71d9f9d161e395276cf163db76"))
        .toThrow("V138_PLAN132_REPLACE_REF_FORBIDDEN")
    } finally { rmSync(owner, { recursive: true, force: true }) }
  })

  it("requires exact publication and summary scopes", () => {
    expect(assertV138Plan132ExactScopeForReview(V138_PLAN132_PUBLICATION_SCOPE,
      V138_PLAN132_PUBLICATION_SCOPE, "PUBLICATION")).toEqual(V138_PLAN132_PUBLICATION_SCOPE)
    expect(assertV138Plan132ExactScopeForReview(V138_PLAN132_SUMMARY_SCOPE,
      V138_PLAN132_SUMMARY_SCOPE, "SUMMARY")).toEqual(V138_PLAN132_SUMMARY_SCOPE)
    for (const [actual, label] of [
      [V138_PLAN132_PUBLICATION_SCOPE.slice(1), "PUBLICATION"],
      [[...V138_PLAN132_PUBLICATION_SCOPE, "A\textra"], "PUBLICATION"],
      [[V138_PLAN132_SUMMARY_SCOPE[0]!.replace(/^A/u, "M")], "SUMMARY"],
    ] as const) expect(() => assertV138Plan132ExactScopeForReview(actual,
      label === "SUMMARY" ? V138_PLAN132_SUMMARY_SCOPE : V138_PLAN132_PUBLICATION_SCOPE, label))
      .toThrow(`V138_PLAN132_${label}_SCOPE_INVALID`)
  })

  it("derives the six-mode aggregate from exact genuine observations", () => {
    const history = authenticateV138Plan132V4InvalidHistoryForReview(ROOT)
    expect(validateV138Plan132ObservationsForReview(ROOT,
      history.payload.observations)).toEqual({
      actualModesPassed: 6,
      observationsRoot: "sha256:6d4867c2635613d0e3277b70f2b2efd3bc91c6940731daae2742eef7578e0ce7",
    })
    expect(renderV138Plan132SourceCorrectionForReview(ROOT, {
      observations: history.payload.observations,
      findings: [],
    })).toMatchObject({
      actualModesPassed: 6,
      findingCount: 0,
      plan133Eligible: true,
      plan110Eligible: false,
      producerCalls: 0,
      readinessInvoked: false,
      liveInvoked: false,
      downstreamAuthority: "denied",
    })
  })

  it("rejects caller-trusted aggregate claims and incomplete observation sets", () => {
    const history = authenticateV138Plan132V4InvalidHistoryForReview(ROOT)
    const observations = history.payload.observations
    for (const input of [
      { observations: [], findings: [] },
      { observations: observations.slice(0, 5), findings: [] },
      { observations, findings: [], actualModesPassed: 6 },
      { observations, findings: [], findingCount: 0 },
      { observations, findings: [], observationsRoot: history.payload.observationsRoot },
    ]) expect(() => renderV138Plan132SourceCorrectionForReview(ROOT, input))
      .toThrow(/V138_PLAN132_(INPUT_KEYS|OBSERVATIONS)_INVALID/u)
  })

  it("rejects duplicate, reordered, and forged observation evidence", () => {
    const history = authenticateV138Plan132V4InvalidHistoryForReview(ROOT)
    const canonicalObservations = history.payload.observations
    const mutations = [
      (observations: any[]) => { observations[1] = clone(observations[0]) },
      (observations: any[]) => { [observations[0], observations[1]] = [observations[1], observations[0]] },
      (observations: any[]) => { observations[2].status = "source_only_checked" },
      (observations: any[]) => { observations[3].observationRoot = `sha256:${"0".repeat(64)}` },
      (observations: any[]) => { observations[4].reducedValue.reproductionEligible = false },
      (observations: any[]) => { observations[5].disposableReviewedClosureRoot = `sha256:${"1".repeat(64)}` },
      (observations: any[]) => { observations[0].producerGuardCount = 1 },
    ]
    for (const mutate of mutations) {
      const observations = clone(canonicalObservations)
      mutate(observations)
      expect(() => validateV138Plan132ObservationsForReview(ROOT, observations))
        .toThrow("V138_PLAN132_OBSERVATIONS_INVALID")
    }
  })

  it("rejects self-consistent forged observations and a forged payload trust anchor", () => {
    const history = authenticateV138Plan132V4InvalidHistoryForReview(ROOT)
    const payload = clone(history.payload)
    const fakeReviewed = `sha256:${"a".repeat(64)}`
    const fakeInstalled = `sha256:${"b".repeat(64)}`
    const fakeGit = `sha256:${"c".repeat(64)}`
    payload.canonicalReviewedClosureRoot = fakeReviewed
    payload.canonicalLocalInstalledClosureRoot = fakeInstalled
    payload.canonicalLocalGitObjectRoot = fakeGit
    payload.canonicalLocalNativeSourcesRoot = `sha256:${"d".repeat(64)}`
    for (const observation of payload.observations) {
      observation.disposableReviewedClosureRoot = fakeReviewed
      observation.disposableLocalInstalledClosureRoot = fakeInstalled
      observation.disposableLocalGitObjectRoot = fakeGit
      observation.disposableLocalNativeSourcesRoot = `sha256:${createHash("sha256")
        .update(observation.mode).digest("hex")}`
      observation.disposableLocalExecutionClosureRoot = computeV138PathStableLocalExecutionClosureRoot({
        reviewedClosureRoot: observation.disposableReviewedClosureRoot,
        localInstalledClosureRoot: observation.disposableLocalInstalledClosureRoot,
        localGitObjectRoot: observation.disposableLocalGitObjectRoot,
        localNativeSourcesRoot: observation.disposableLocalNativeSourcesRoot,
      })
      const { observationRoot: _ignored, ...body } = observation
      observation.observationRoot = rooted("v138-plan-262-131-mode-observation-v4", body)
    }
    payload.observationsRoot = rooted("v138-plan-262-131-observations-v4", payload.observations)
    expect(() => (validateV138Plan132ObservationsForReview as (...args: any[]) => unknown)(
      payload.observations, payload,
    )).toThrow("V138_PLAN132_OBSERVATIONS_INVALID")
  })
})
