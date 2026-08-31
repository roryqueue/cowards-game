import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, symlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { validateV138LiveV15Review, consumeV138LiveV15Invocation,
  checkV138LiveV15EffectState, V138_LIVE_V15_PATHS } from "./run-v1-38-bounded-retry-envelope-v4-live-v15.js"

const roots: string[] = []
const fixture = () => { const r = mkdtempSync(path.join(tmpdir(), "v138-live15-test-")); roots.push(r); mkdirSync(path.join(r, ".planning/artifacts"), { recursive: true }); return r }
const digest = `sha256:${"a".repeat(64)}`
const review = () => ({ schema: "v1.38-plan-262-146-repair-review-v1", sourceCommit: "b".repeat(40),
  sourceFiles: [{ path: "scripts/fixture.ts", mode: "100644", blob: "c".repeat(40), sha256: digest }],
  runtimeClosureRoot: digest, envelopeSha256: digest, sealSha256: digest,
  nativeTestResults: { command: "native-fixture", passed: true, ownerPairLifePair: true,
    competingOwnerExcluded: true, invalidLeasesRejected: true, boundedCleanup: true, outerDeadlineMilliseconds: 55000 },
  findingCount: 0, plan147Eligible: true, correctedInvocationLimit: 1, authorizesExecution: false })
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
    consumeV138LiveV15Invocation(root, digest)
    expect(JSON.parse(readFileSync(path.join(root, V138_LIVE_V15_PATHS.invocation), "utf8")).correctedInvocationLimit).toBe(1)
    expect(() => consumeV138LiveV15Invocation(root, digest)).toThrow()
    expect(() => checkV138LiveV15EffectState(root, "pre")).toThrow()
    expect(() => checkV138LiveV15EffectState(root, "post")).toThrow(/TERMINAL_ABSENT/)
  })
  it("never converts a preexisting private directory or symlink into fresh authority", () => {
    const root = fixture(); const target = path.join(root, V138_LIVE_V15_PATHS.privateDir)
    mkdirSync(target, { mode: 0o700 })
    expect(() => consumeV138LiveV15Invocation(root, digest)).toThrow()
    rmSync(target, { recursive: true }); symlinkSync(tmpdir(), target)
    expect(() => consumeV138LiveV15Invocation(root, digest)).toThrow()
  })
  it("postcheck preserves an absent terminal as failure and never manufactures bytes", () => {
    const root = fixture(); consumeV138LiveV15Invocation(root, digest)
    writeFileSync(path.join(root, V138_LIVE_V15_PATHS.journal), "", { mode: 0o600 })
    expect(() => checkV138LiveV15EffectState(root, "post")).toThrow(/TERMINAL_ABSENT/)
    expect(readFileSync(path.join(root, V138_LIVE_V15_PATHS.journal), "utf8")).toBe("")
  })
  it("accepts authenticated later aggregate/disposition after raw state retirement", () => {
    const root = fixture(); consumeV138LiveV15Invocation(root, digest)
    writeFileSync(path.join(root, V138_LIVE_V15_PATHS.aggregate), JSON.stringify({
      schemaVersion: "v1.38-plan-262-historical-live-receipt-manifest-v4", assuranceClass: "single_operator_local_seal_v1",
      journalSha256: digest, terminalSha256: digest, downstreamAuthority: "denied" }))
    writeFileSync(path.join(root, V138_LIVE_V15_PATHS.disposition), JSON.stringify({
      schemaVersion: "v1.38-plan-262-94-admission-disposition-v4", receiptManifestSha256: digest,
      freshAccepted: 0, requiredAccepted: 540, downstreamAuthority: "denied" }))
    expect(checkV138LiveV15EffectState(root, "post").status).toBe("authenticated_raw_state_retired")
  })
})
