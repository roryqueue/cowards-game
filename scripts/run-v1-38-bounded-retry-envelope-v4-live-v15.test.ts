import { execFileSync } from "node:child_process"
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, symlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { validateV138LiveV15Review, consumeV138LiveV15Invocation,
  authenticateV138LiveV15InvocationMarker, checkV138LiveV15EffectState,
  readV138LiveV15CommittedReview, V138_LIVE_V15_PATHS } from "./run-v1-38-bounded-retry-envelope-v4-live-v15.js"

const roots: string[] = []
const fixture = () => { const r = mkdtempSync(path.join(tmpdir(), "v138-live15-test-")); roots.push(r); mkdirSync(path.join(r, ".planning/artifacts"), { recursive: true }); return r }
const digest = `sha256:${"a".repeat(64)}`
const review = () => ({ schema: "v1.38-plan-262-146-repair-review-v1", sourceCommit: "b".repeat(40),
  sourceFiles: [{ path: "scripts/fixture.ts", mode: "100644", blob: "c".repeat(40), sha256: digest }],
  runtimeClosureRoot: digest, envelopeSha256: digest, sealSha256: digest,
  nativeTestResults: { command: "native-fixture", passed: true, ownerPairLifePair: true,
    competingOwnerExcluded: true, invalidLeasesRejected: true, boundedCleanup: true, outerDeadlineMilliseconds: 55000 },
  findingCount: 0, plan147Eligible: true, correctedInvocationLimit: 1, authorizesExecution: false })
const runGit = (root: string, args: readonly string[]): string => execFileSync("/usr/bin/git", ["-C", root, ...args]).toString().trim()
afterEach(() => { for (const r of roots.splice(0)) rmSync(r, { recursive: true, force: true }) })
describe("live-v15 single-review source and invocation boundary", () => {
  it("accepts precisely the non-authorizing zero-finding repair review", () => {
    expect(validateV138LiveV15Review(review())).toEqual(review())
    for (const patch of [{ findingCount: 1 }, { correctedInvocationLimit: 2 }, { authorizesExecution: true },
      { plan147Eligible: false }, { schema: "v3" }, { sourceFiles: [] }, { unknown: true }])
      expect(() => validateV138LiveV15Review({ ...review(), ...patch })).toThrow()
    expect(() => validateV138LiveV15Review({ ...review(), nativeTestResults: { ...review().nativeTestResults, ownerPairLifePair: false } })).toThrow()
  })
  it("durably consumes the invocation before producer entry and never reenters after bootstrap failure", () => {
    const root = fixture()
    checkV138LiveV15EffectState(root, "pre")
    const identity = { reviewedSourceRoot: digest, reviewReportCommit: "d".repeat(40), reviewReportBlob: "e".repeat(40) }
    consumeV138LiveV15Invocation(root, identity)
    expect(authenticateV138LiveV15InvocationMarker(root, identity)).toMatchObject(identity)
    expect(() => consumeV138LiveV15Invocation(root, identity)).toThrow()
    expect(() => checkV138LiveV15EffectState(root, "pre")).toThrow()
    expect(() => checkV138LiveV15EffectState(root, "post")).toThrow(/TERMINAL_ABSENT/)
  })
  it("never converts a preexisting private directory or symlink into fresh authority", () => {
    const root = fixture(); const target = path.join(root, V138_LIVE_V15_PATHS.privateDir)
    mkdirSync(target, { mode: 0o700 })
    expect(() => consumeV138LiveV15Invocation(root, { reviewedSourceRoot: digest, reviewReportCommit: "d".repeat(40), reviewReportBlob: "e".repeat(40) })).toThrow()
    rmSync(target, { recursive: true }); symlinkSync(tmpdir(), target)
    expect(() => consumeV138LiveV15Invocation(root, { reviewedSourceRoot: digest, reviewReportCommit: "d".repeat(40), reviewReportBlob: "e".repeat(40) })).toThrow()
  })
  it("postcheck preserves an absent terminal as failure and never manufactures bytes", () => {
    const root = fixture(); consumeV138LiveV15Invocation(root, { reviewedSourceRoot: digest, reviewReportCommit: "d".repeat(40), reviewReportBlob: "e".repeat(40) })
    writeFileSync(path.join(root, V138_LIVE_V15_PATHS.journal), "", { mode: 0o600 })
    expect(() => checkV138LiveV15EffectState(root, "post")).toThrow(/TERMINAL_ABSENT/)
    expect(readFileSync(path.join(root, V138_LIVE_V15_PATHS.journal), "utf8")).toBe("")
  })
  it("fails closed on claimed retired Plan94 state until its exact checker exists", () => {
    const root = fixture(); consumeV138LiveV15Invocation(root, { reviewedSourceRoot: digest, reviewReportCommit: "d".repeat(40), reviewReportBlob: "e".repeat(40) })
    writeFileSync(path.join(root, V138_LIVE_V15_PATHS.aggregate), JSON.stringify({
      schemaVersion: "v1.38-plan-262-historical-live-receipt-manifest-v4", assuranceClass: "single_operator_local_seal_v1",
      journalSha256: digest, terminalSha256: digest, downstreamAuthority: "denied" }))
    writeFileSync(path.join(root, V138_LIVE_V15_PATHS.disposition), JSON.stringify({
      schemaVersion: "v1.38-plan-262-94-admission-disposition-v4", receiptManifestSha256: digest,
      freshAccepted: 0, requiredAccepted: 540, downstreamAuthority: "denied" }))
    expect(() => checkV138LiveV15EffectState(root, "post")).toThrow(/RETIRED_STATE_CHECKER_UNAVAILABLE/)
  })
  it("authenticates only a committed review blob descendant from its reviewed source", () => {
    const root = fixture()
    runGit(root, ["init", "-q"]); runGit(root, ["config", "user.name", "fixture"]); runGit(root, ["config", "user.email", "fixture@example.invalid"])
    writeFileSync(path.join(root, "source.txt"), "source\n"); runGit(root, ["add", "source.txt"]); runGit(root, ["commit", "-qm", "source"])
    const sourceCommit = runGit(root, ["rev-parse", "HEAD"])
    const reviewPath = path.join(root, V138_LIVE_V15_PATHS.review); mkdirSync(path.dirname(reviewPath), { recursive: true })
    writeFileSync(reviewPath, `\`\`\`json\n${JSON.stringify({ ...review(), sourceCommit })}\n\`\`\`\n`)
    expect(() => readV138LiveV15CommittedReview(root)).toThrow(/REVIEW_NOT_COMMITTED/)
    runGit(root, ["add", V138_LIVE_V15_PATHS.review]); runGit(root, ["commit", "-qm", "review"])
    const authenticated = readV138LiveV15CommittedReview(root)
    expect(authenticated.review.sourceCommit).toBe(sourceCommit)
    expect(authenticated.reportCommit).toBe(runGit(root, ["rev-parse", "HEAD"]))
    expect(authenticated.reportBlob).toMatch(/^[0-9a-f]{40}$/)
    writeFileSync(reviewPath, "working tree replacement\n")
    expect(() => readV138LiveV15CommittedReview(root)).toThrow(/REVIEW_WORKTREE_CHANGED/)
  })
})
