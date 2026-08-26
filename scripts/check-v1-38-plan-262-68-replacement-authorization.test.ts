import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { checkV138Plan26268ReplacementAuthorization } from "./check-v1-38-plan-262-68-replacement-authorization.js"
import { createV138Plan26268ReplacementAuthorization } from "./lib/v1-38-plan-262-68-replacement-authorization.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
describe("Plan 262-68 replacement authorization representation", () => {
  it("passes only as non-executable denied authority", () => expect(checkV138Plan26268ReplacementAuthorization(root)).toMatchObject({ status: "passed", authority: "denied" }))
  it.each([
    { executable: true }, { consumable: true }, { routeStarted: true },
    { checkpointRoot: "sha256:forged" },
    { schemaVersion: "v1.38-authorizing" },
    { reviewDisposition: "authorizing" },
    { executable: undefined },
  ])("rejects authority or identity drift", mutation => {
    const candidate = { ...createV138Plan26268ReplacementAuthorization(), ...mutation }
    expect(() => checkV138Plan26268ReplacementAuthorization(root, candidate as ReturnType<typeof createV138Plan26268ReplacementAuthorization>)).toThrow("V138_262_68_REPRESENTATION_INVALID")
  })
  it.each([
    { admit03: { status: "passed", freshAccepted: 540, requiredAccepted: 540 } },
    { frozenBounds: { ...createV138Plan26268ReplacementAuthorization().frozenBounds, minimumEffectiveAvailableBasisPoints: 2499 } },
    { canonicalAuthorizationWritten: true }, { canonicalSealWritten: true },
  ])("rejects nested policy or canonical-output drift", mutation => {
    const candidate = { ...createV138Plan26268ReplacementAuthorization(), ...mutation }
    expect(() => checkV138Plan26268ReplacementAuthorization(root, candidate as ReturnType<typeof createV138Plan26268ReplacementAuthorization>)).toThrow("V138_262_68_REPRESENTATION_INVALID")
  })
})
