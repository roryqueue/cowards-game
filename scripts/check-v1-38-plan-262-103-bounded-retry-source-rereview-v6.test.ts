import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  V138_PLAN_262_103_CANDIDATE_DOMAIN,
  V138_PLAN_262_103_CANDIDATE_PATH,
  V138_PLAN_262_103_CARRIER_DOMAIN,
  V138_PLAN_262_103_CARRIER_PATH,
  V138_PLAN_262_103_REPORT_PATH,
  V138_PLAN_262_103_SOURCE_PATHS,
  candidatePreimageIndependent,
  carrierPreimageIndependent,
  checkV138Plan262103PublishedReview,
  deriveV138Plan262103ReviewNoPublish,
  inspectV138Plan262103ProtectedHistory,
  inspectV138Plan262103Source,
  renderV138Plan262103Report,
  snapshotV138Plan262103Destinations,
  validateV138Plan262103Publication,
} from "./check-v1-38-plan-262-103-bounded-retry-source-rereview-v6.js"
import {
  computeV138Plan262103CandidatePayloadRoot,
  computeV138Plan262103CarrierRoot,
} from "./lib/v1-38-plan-262-103-nonrecursive-review-contract-v1.js"

const repoRoot = path.resolve(import.meta.dirname, "..")
const sha = (value: Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

describe("Plan 262-103 independent non-recursive source review", () => {
  it("pins exact inner-v6 and outer-v1 domains, paths, and Plan-102 source", () => {
    expect(V138_PLAN_262_103_CANDIDATE_DOMAIN).toBe(
      "v1.38:plan-262-103:git-object-byte-custody:candidate-payload:v6",
    )
    expect(V138_PLAN_262_103_CARRIER_DOMAIN).toBe(
      "v1.38:plan-262-103:git-object-byte-custody:carrier:v1",
    )
    expect(V138_PLAN_262_103_CANDIDATE_PATH).toMatch(/payload-v6\.json$/u)
    expect(V138_PLAN_262_103_CARRIER_PATH).toMatch(/carrier-v1\.json$/u)
    expect(V138_PLAN_262_103_REPORT_PATH).toMatch(/262-103-REVIEW\.md$/u)
    expect(V138_PLAN_262_103_SOURCE_PATHS).toHaveLength(3)
  })

  it("matches independent golden preimages without consumer root helpers", () => {
    const candidate = {
      nested: { b: "β", a: 'quote"' },
      array: [1, "\n", { z: null, x: true }],
      a: "é",
      candidatePayloadRoot: `sha256:${"0".repeat(64)}`,
    }
    expect(candidatePreimageIndependent(candidate).toString("hex")).toBe(
      "76312e33383a706c616e2d3236322d3130333a6769742d6f626a6563742d627974652d637573746f64793a63616e6469646174652d7061796c6f61643a7636007b2261223a22c3a9222c226172726179223a5b312c225c6e222c7b2278223a747275652c227a223a6e756c6c7d5d2c226e6573746564223a7b2261223a2271756f74655c22222c2262223a22ceb2227d7d0a",
    )
    expect(sha(candidatePreimageIndependent(candidate))).toBe(
      computeV138Plan262103CandidatePayloadRoot(candidate),
    )
    const carrier = {
      custody: { path: "r", mode: "100644", byteLength: 4 },
      binaryReportSha256: `sha256:${"ab".repeat(32)}`,
      carrierRoot: `sha256:${"0".repeat(64)}`,
    }
    expect(sha(carrierPreimageIndependent(carrier))).toBe(
      computeV138Plan262103CarrierRoot(carrier),
    )
  })

  it("authenticates the exact sole-parent source, raw blobs, modes, and working bytes", () => {
    expect(inspectV138Plan262103Source(repoRoot)).toEqual({
      commit: "332aae093ef6e26c95a18f21cfd253ccc829ce48",
      tree: "5be3d3f850d7d0ebcd2cfee87101242826faafc1",
      parent: "a98c0c40134d9b57efd34bbbedd8faf18f6df622",
      noLaterRewrite: true,
      summaryTrustedAsVerdict: false,
      files: [
        expect.objectContaining({ mode: "100644", blob: "0ad422245174c2f3cbb1cf46fc1932b45f758d9e", byteLength: 17_394, sha256: "sha256:dc3e63e49dbf104d21405f6b381181ac2cd29d481b1c3fa5ee27c68392486e27" }),
        expect.objectContaining({ mode: "100644", blob: "745495ff59a9dea6c898f2a0c2551396e6a54deb", byteLength: 18_903, sha256: "sha256:7ade65c9a6fb9a650bb837ed1d2381248de79bda5552dccd7309792e47318931" }),
        expect.objectContaining({ mode: "100644", blob: "df395006dfad9c63a9006fd8ee23e80982a009ec", byteLength: 15_969, sha256: "sha256:7ecf92a86948a23f01004841d58a6447f9e743bc5043143ff396f659ea1c1f03" }),
      ],
    })
    for (const repoPath of V138_PLAN_262_103_SOURCE_PATHS)
      expect(readFileSync(path.resolve(repoRoot, repoPath)).length).toBeGreaterThan(0)
  })

  it("preserves immutable Plan-100/101 blocked history", () => {
    expect(inspectV138Plan262103ProtectedHistory(repoRoot)).toMatchObject({
      plan100: { sourceCommit: "a879bfc6cab49abf2e12a5b882a06b7e9fb446cb", noLaterRewrite: true },
      plan101: {
        pairCommit: "8c4e74180e36f22e3a44520d2cda145b3aa30671",
        findingCode: "CANDIDATE_JSON_HASH_SELF_REFERENCE_UNSATISFIABLE",
        findingCount: 1,
        status: "blocked",
        plan26292Eligible: false,
        reinterpreted: false,
      },
    })
  })

  it("derives a consumer-tested trio without canonical publication", () => {
    const before = snapshotV138Plan262103Destinations(repoRoot)
    const built = deriveV138Plan262103ReviewNoPublish(repoRoot)
    expect(built.candidate.status).toBe("zero_findings")
    expect(built.candidate.findings).toEqual([])
    expect(built.candidate.authority.plan26292Eligible).toBe(true)
    expect(built.carrier.actualConsumer.status).toBe("passed")
    expect(built.consumer.kind).toBe("eligible")
    expect(Buffer.from(renderV138Plan262103Report(built.candidate))).toEqual(built.reportBytes)
    expect(snapshotV138Plan262103Destinations(repoRoot)).toEqual(before)
  }, 180_000)

  it("rejects root, custody, history, and authority mutations", () => {
    const built = deriveV138Plan262103ReviewNoPublish(repoRoot)
    for (const mutate of [
      (value: any) => (value.candidate.candidatePayloadRoot = `sha256:${"f".repeat(64)}`),
      (value: any) => (value.carrier.carrierRoot = `sha256:${"f".repeat(64)}`),
      (value: any) => (value.carrier.candidate.mode = "120000"),
      (value: any) => (value.candidate.protectedHistory.plan101.reinterpreted = true),
      (value: any) => (value.carrier.authority.phase263PlanningAuthorized = true),
    ]) {
      const changed = structuredClone({ candidate: built.candidate, carrier: built.carrier })
      mutate(changed)
      expect(() => validateV138Plan262103Publication(changed.candidate, changed.carrier, built.reportBytes)).toThrow()
    }
  }, 180_000)

  it("validates one unique canonical three-path publication", () => {
    const checked = checkV138Plan262103PublishedReview(repoRoot)
    expect(checked.publicationCommit).toMatch(/^[0-9a-f]{40}$/u)
    expect(checked.candidate.findingCount).toBe(0)
    expect(checked.carrier.authority.plan26292Eligible).toBe(true)
  }, 180_000)
})
