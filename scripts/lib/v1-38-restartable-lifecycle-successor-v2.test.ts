import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { deriveV138LifecycleIntentV2 } from "./v1-38-restartable-lifecycle-successor-v2.js"

const sha256 = (value: string): `sha256:${string}` => `sha256:${createHash("sha256").update(value).digest("hex")}`
const identity = { path: "/private/tmp/controller-owned", device: "1", inode: "2" }
const base = {
  transactionId: "lifecycle",
  intentPath: "lifecycle.intent",
  steps: [{ id: "status", target: "planning/status.md", beforeSha256: sha256("before\n"), afterBytes: "after\n" }],
  lifecycle: { target: "lifecycle.json", bytes: '{"authority":false}\n' },
}

describe("restartable lifecycle intent derivation", () => {
  it("binds root identity, intent, targets, before/after digests, and lifecycle bytes", () => {
    const derived = deriveV138LifecycleIntentV2(identity, base)
    expect(derived.namespace).toMatch(/^[0-9a-f]{64}$/u)
    expect(derived.intentBytes).toContain("v1.38-restartable-lifecycle-intent-v2")
    expect(Object.isFrozen(derived)).toBe(true)
  })

  it.each([
    [{ ...identity, inode: "3" }, base],
    [identity, { ...base, transactionId: "other" }],
    [identity, { ...base, intentPath: "other.intent" }],
    [identity, { ...base, steps: [{ ...base.steps[0]!, target: "planning/other.md" }] }],
    [identity, { ...base, steps: [{ ...base.steps[0]!, beforeSha256: sha256("different\n") }] }],
    [identity, { ...base, steps: [{ ...base.steps[0]!, afterBytes: "different\n" }] }],
    [identity, { ...base, lifecycle: { ...base.lifecycle, bytes: "different\n" } }],
  ])("changes for every lifecycle intent dimension", (root, input) => {
    expect(deriveV138LifecycleIntentV2(root, input).namespace).not.toBe(deriveV138LifecycleIntentV2(identity, base).namespace)
  })
})
