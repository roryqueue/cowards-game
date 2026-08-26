import { execFileSync } from "node:child_process"
import { appendFileSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, describe, expect, it } from "vitest"
import { checkV138Plan26268ReplacementAuthorization } from "./check-v1-38-plan-262-68-replacement-authorization.js"
import { createV138Plan26268ReplacementAuthorization } from "./lib/v1-38-plan-262-68-replacement-authorization.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const copies: string[] = []
afterEach(() => { while (copies.length) rmSync(copies.pop()!, { recursive: true, force: true }) })
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
  it("rejects a dangling retired-route destination", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "plan-262-68-")); copies.push(directory)
    execFileSync("git", ["clone", "--quiet", "--no-hardlinks", root, directory])
    symlinkSync("/missing", path.join(directory, ".planning/artifacts/v1.38-plan-262-57-route-start-v1.json"))
    expect(() => checkV138Plan26268ReplacementAuthorization(directory)).toThrow("V138_262_68_FORBIDDEN_DESTINATION_PRESENT")
  }, 30000)
  it("rejects a hostile toJSON projection", () => {
    const expected = createV138Plan26268ReplacementAuthorization()
    const hostile = { ...expected, executable: true, toJSON: () => expected }
    expect(() => checkV138Plan26268ReplacementAuthorization(root, hostile as unknown as ReturnType<typeof createV138Plan26268ReplacementAuthorization>)).toThrow("V138_262_68_REPRESENTATION_INVALID")
  })
  it("rejects historical checkpoint tampering", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "plan-262-68-")); copies.push(directory)
    execFileSync("git", ["clone", "--quiet", "--no-hardlinks", root, directory])
    appendFileSync(path.join(directory, ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-67-CHECKPOINT.md"), "\ntampered\n")
    expect(() => checkV138Plan26268ReplacementAuthorization(directory)).toThrow("V138_262_68_HISTORICAL_INPUT_INVALID")
  }, 30000)
  it("rejects imports outside the checker boundary", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "plan-262-68-")); copies.push(directory)
    execFileSync("git", ["clone", "--quiet", "--no-hardlinks", root, directory])
    const importer = path.join(directory, "scripts/runtime-import-plan-262-68.ts")
    writeFileSync(importer, 'import "./lib/v1-38-plan-262-68-replacement-authorization.js"\n')
    execFileSync("git", ["add", "scripts/runtime-import-plan-262-68.ts"], { cwd: directory })
    expect(() => checkV138Plan26268ReplacementAuthorization(directory)).toThrow("V138_262_68_IMPORT_BOUNDARY_INVALID")
  }, 30000)
})
