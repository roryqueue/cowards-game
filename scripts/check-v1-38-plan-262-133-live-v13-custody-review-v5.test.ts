import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import path from "node:path"
import { beforeAll, describe, expect, it } from "vitest"
import {
  V138_PLAN133_B331_SCOPE,
  V138_PLAN133_PUBLICATION_SCOPE,
  V138_PLAN133_SUMMARY_SCOPE,
  assertV138Plan133ExactScopeForReview,
  assertV138Plan133StrictDescendantForReview,
  authenticateV138Plan133Plan132SourceForReview,
  executeV138Plan133DisposableObservationsForReview,
  renderV138Plan133EvidenceForReview,
  validateV138Plan133ObservationsForReview,
} from "./check-v1-38-plan-262-133-live-v13-custody-review-v5.js"

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

let genuineModes: ReturnType<typeof executeV138Plan133DisposableObservationsForReview>

describe("Plan 262-133 independent custody review v5", () => {
  beforeAll(() => {
    genuineModes = executeV138Plan133DisposableObservationsForReview(ROOT)
  }, 180_000)

  it("pins the corrected Plan132 subject, closeout, clean review, and exact source bytes", () => {
    expect(authenticateV138Plan133Plan132SourceForReview(ROOT)).toMatchObject({
      subjectCommit: "52d35eb88db55e31d7203abb64735d12a53bbcf3",
      subjectTree: "a62b646a89079729f0b65f79d21e48e29bd30cd2",
      subjectParent: "26ffbcd9f13861533f6782c4da184eef583960dd",
      sourceBlob: "825772873b7feb81b0ccf19acbb27435b12b6a03",
      sourceSha256: "sha256:95dc05e015d4f0fb94766469072ab7780e46fe94d05c558f3a0e46737cde6188",
      testBlob: "a974a881b7cecba0fcdb3a4490cbe148948e02aa",
      closeoutCommit: "3932bfee47ef6316fcaba59182960a831ef455a0",
      cleanReviewCommit: "2c6c73fbe6ba2f1796853f421c1eeb2debaf813a",
    })
  })

  it("accepts arbitrary strict descendants but rejects equality and non-ancestry", () => {
    expect(assertV138Plan133StrictDescendantForReview(
      "6a82901a8e73a4c2b8be92ba1b8d606919678784",
      "2c6c73fbe6ba2f1796853f421c1eeb2debaf813a", true)).toBe(true)
    for (const [head, ancestry] of [
      ["6a82901a8e73a4c2b8be92ba1b8d606919678784", true],
      ["6515ea1a2e372a71d9f9d161e395276cf163db76", false],
    ] as const) expect(() => assertV138Plan133StrictDescendantForReview(
      "6a82901a8e73a4c2b8be92ba1b8d606919678784", head, ancestry))
      .toThrow("V138_PLAN133_HEAD_NOT_STRICT_DESCENDANT")
  })

  it("requires exact b331, v4 publication, and v4 summary scopes", () => {
    for (const [actual, label] of [
      [V138_PLAN133_B331_SCOPE, "B331"],
      [V138_PLAN133_PUBLICATION_SCOPE, "PUBLICATION"],
      [V138_PLAN133_SUMMARY_SCOPE, "SUMMARY"],
    ] as const) {
      expect(assertV138Plan133ExactScopeForReview(actual, actual, label)).toEqual(actual)
      expect(() => assertV138Plan133ExactScopeForReview(actual.slice(1), actual, label))
        .toThrow(`V138_PLAN133_${label}_SCOPE_INVALID`)
      expect(() => assertV138Plan133ExactScopeForReview([...actual, "A\textra"], actual, label))
        .toThrow(`V138_PLAN133_${label}_SCOPE_INVALID`)
    }
  })

  it("runs exactly six unique canonical genuine disposable observations", () => {
    const modes = genuineModes
    expect(modes.actualModesPassed).toBe(6)
    expect(modes.findings).toEqual([])
    expect(modes.observations.map(({ mode, status }) => [mode, status])).toEqual([
      ["--check-source-only", "source_only_checked"],
      ["--check-prospective-custody", "prospective_custody_checked"],
      ["--check-post-run-custody", "post_run_no_effect_custody_checked"],
      ["--check-non-pass-value", "bounded_non_pass_value_checked"],
      ["--check-bounded-success-value", "bounded_success_value_checked"],
      ["--check-exact-reproduction-v17-value", "exact_reproduction_v17_value_checked"],
    ])
    expect(new Set(modes.observations.map(({ observationRoot }) => observationRoot)).size).toBe(6)
    expect(validateV138Plan133ObservationsForReview(ROOT, modes.observations,
      modes.canonicalBefore)).toEqual({
      actualModesPassed: 6,
      observationsRoot: rooted("v138-plan-262-133-observations-v5", modes.observations),
    })
  }, 180_000)

  it("rejects empty, missing, duplicate, misordered, status, root, reduced, and producer forgeries", () => {
    const modes = genuineModes
    const mutations = [
      (items: any[]) => items.splice(0),
      (items: any[]) => items.pop(),
      (items: any[]) => { items[1] = clone(items[0]) },
      (items: any[]) => { [items[0], items[1]] = [items[1], items[0]] },
      (items: any[]) => { items[2].status = "source_only_checked" },
      (items: any[]) => { items[3].observationRoot = `sha256:${"0".repeat(64)}` },
      (items: any[]) => { items[4].reducedValue.reproductionEligible = false },
      (items: any[]) => { items[5].producerGuardCount = 1 },
    ]
    for (const mutate of mutations) {
      const observations = clone(modes.observations)
      mutate(observations)
      expect(() => validateV138Plan133ObservationsForReview(ROOT, observations,
        modes.canonicalBefore)).toThrow("V138_PLAN133_OBSERVATIONS_INVALID")
    }
  }, 180_000)

  it("rejects self-consistent forged custody and caller-forged aggregates", () => {
    const modes = genuineModes
    const observations = clone(modes.observations)
    observations[0].disposableReviewedClosureRoot = `sha256:${"a".repeat(64)}`
    const { observationRoot: _ignored, ...body } = observations[0]
    observations[0].observationRoot = rooted("v138-plan-262-133-mode-observation-v5", body)
    expect(() => validateV138Plan133ObservationsForReview(ROOT, observations,
      modes.canonicalBefore)).toThrow("V138_PLAN133_OBSERVATIONS_INVALID")
    for (const forged of [
      { ...modes, actualModesPassed: 6 },
      { ...modes, observationsRoot: rooted("forged", modes.observations) },
      { ...modes, findingCount: 0 },
    ]) expect(() => renderV138Plan133EvidenceForReview(ROOT, [], forged as never))
      .toThrow("V138_PLAN133_MODES_INPUT_INVALID")
  }, 180_000)

  it("derives literal-zero eligibility only after the six-record validation gate", () => {
    const modes = genuineModes
    const evidence = renderV138Plan133EvidenceForReview(ROOT, [], modes)
    expect(evidence.payload).toMatchObject({ findingCount: 0, actualModesPassed: 6,
      supersededV4Plan110Eligible: false, plan110Eligible: true,
      authorizesExecution: false, createsCapacity: false, resetsCounters: false,
      authorizationLiteralCreated: false, producerCalls: 0, readinessInvoked: false,
      liveInvoked: false, freshCharged: 0, freshAccepted: 0,
      downstreamAuthority: "denied" })
    expect(renderV138Plan133EvidenceForReview(ROOT, [{ code: "X", severity: "critical",
      subject: "test", detail: "blocked" }], modes).payload.plan110Eligible).toBe(false)
  }, 180_000)

  it("creates no effect destination while reviewing", () => {
    const forbidden = [
      ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl",
      ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json",
      ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json",
      ".planning/artifacts/v1.38-plan-262-route-11-activation-v1.json",
    ]
    expect(forbidden.every((repoPath) => !existsSync(path.join(ROOT, repoPath)))).toBe(true)
  })
})
