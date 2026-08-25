import { describe, expect, it } from "vitest"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { checkV138Plan26265R4Source } from "./check-v1-38-plan-262-65-r4-source.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
describe("Plan 262-65 R4 source boundary", () => {
  it("is read-only and leaves all authority denied", () => {
    expect(checkV138Plan26265R4Source(root)).toMatchObject({ reviewer: "r4_source_only", disposition: "no_canonical_output", admit03: "blocked", freshAccepted: 0, requiredAccepted: 540, authority: "denied" })
  })
})
