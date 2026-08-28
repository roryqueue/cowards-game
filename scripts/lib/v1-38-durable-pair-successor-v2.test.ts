import { describe, expect, it } from "vitest"
import { deriveV138PairIntentV2 } from "./v1-38-durable-pair-successor-v2.js"

const identity = { path: "/private/tmp/controller-owned", device: "1", inode: "2" }
const base = {
  transactionId: "pair",
  intentPath: "pair.intent",
  members: [{ target: "artifacts/review.json", bytes: "A\n" }, { target: "reviews/review.md", bytes: "B\n" }] as const,
}

describe("CR-03 full-intent pair staging namespace", () => {
  it("is order-independent for one exact pair intent", () => {
    const forward = deriveV138PairIntentV2(identity, base)
    const reverse = deriveV138PairIntentV2(identity, { ...base, members: [base.members[1], base.members[0]] })
    expect(reverse).toEqual(forward)
  })

  it.each([
    [{ ...identity, inode: "3" }, base],
    [identity, { ...base, transactionId: "other" }],
    [identity, { ...base, intentPath: "other.intent" }],
    [identity, { ...base, members: [{ ...base.members[0], target: "other/review.json" }, base.members[1]] as const }],
    [identity, { ...base, members: [{ ...base.members[0], bytes: "changed\n" }, base.members[1]] as const }],
  ])("changes for every normalized pair intent dimension", (root, input) => {
    expect(deriveV138PairIntentV2(root, input).namespace).not.toBe(deriveV138PairIntentV2(identity, base).namespace)
  })

  it.each(["artifacts/review.json", "artifacts\\review.json", "artifacts//review.json"])("rejects intent/member and path aliases: %s", (intentPath) => {
    expect(() => deriveV138PairIntentV2(identity, { ...base, intentPath })).toThrow()
  })
})
