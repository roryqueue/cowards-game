import { execFileSync } from "node:child_process"
import { appendFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, describe, expect, it } from "vitest"
import { checkV138Plan26268ReplacementAuthorization } from "./check-v1-38-plan-262-68-replacement-authorization.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const copies: string[] = []
const createDeniedCandidate = () => deepFreeze({
  schemaVersion: "v1.38-plan-262-68-replacement-authorization-v10-source-only" as const,
  checkpointRoot: "sha256:f1bc58ff9a4f107c293f1bfba9e7d44d5eda92aac78fbe93f7596889d04f404a" as const,
  reviewDisposition: "r4_source_only_review_passed_non_authorizing" as const,
  executable: false as const, consumable: false as const,
  admit03: { status: "blocked" as const, freshAccepted: 0 as const, requiredAccepted: 540 as const },
  frozenBounds: { headroomSamplingMs: 200 as const, minimumEffectiveAvailableBasisPoints: 2500 as const,
    calibrationAttempts: 8 as const, calibrationShards: 4 as const, conditionalReproductionCells: 540 as const,
    formationMaterialization: false as const },
  canonicalAuthorizationWritten: false as const, canonicalSealWritten: false as const, routeStarted: false as const,
})
const deepFreeze = <T>(value: T): T => {
  if (typeof value === "object" && value !== null) {
    for (const nested of Object.values(value)) deepFreeze(nested)
    Object.freeze(value)
  }
  return value
}
const cloneWithoutRepresentationModule = (): string => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "plan-262-68-")); copies.push(directory)
  execFileSync("git", ["clone", "--quiet", "--no-hardlinks", root, directory])
  rmSync(path.join(directory, "scripts/lib/v1-38-plan-262-68-replacement-authorization.ts"), { force: true })
  return directory
}
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
    const candidate = deepFreeze({ ...createDeniedCandidate(), ...mutation })
    expect(() => checkV138Plan26268ReplacementAuthorization(root, candidate as never)).toThrow("V138_262_68_REPRESENTATION_INVALID")
  })
  it.each([
    { admit03: { status: "passed", freshAccepted: 540, requiredAccepted: 540 } },
    { frozenBounds: { ...createDeniedCandidate().frozenBounds, minimumEffectiveAvailableBasisPoints: 2499 } },
    { canonicalAuthorizationWritten: true }, { canonicalSealWritten: true },
  ])("rejects nested policy or canonical-output drift", mutation => {
    const candidate = deepFreeze({ ...createDeniedCandidate(), ...mutation })
    expect(() => checkV138Plan26268ReplacementAuthorization(root, candidate as never)).toThrow("V138_262_68_REPRESENTATION_INVALID")
  })
  it("rejects a dangling retired-route destination", () => {
    const directory = cloneWithoutRepresentationModule()
    symlinkSync("/missing", path.join(directory, ".planning/artifacts/v1.38-plan-262-57-route-start-v1.json"))
    expect(() => checkV138Plan26268ReplacementAuthorization(directory)).toThrow("V138_262_68_FORBIDDEN_DESTINATION_PRESENT")
  }, 30000)
  it("rejects a hostile toJSON projection", () => {
    const expected = createDeniedCandidate()
    const hostile = Object.freeze({ ...expected, executable: true, toJSON: () => expected })
    expect(() => checkV138Plan26268ReplacementAuthorization(root, hostile as never)).toThrow("V138_262_68_REPRESENTATION_INVALID")
  })
  it.each([
    ["mutable clone", () => structuredClone(createDeniedCandidate())],
    ["accessor", () => Object.freeze(Object.defineProperty({ ...createDeniedCandidate() }, "executable", { get: () => false, enumerable: true }))],
    ["symbol", () => Object.freeze({ ...createDeniedCandidate(), [Symbol("authority")]: true })],
    ["custom prototype", () => Object.freeze(Object.assign(Object.create({ authority: true }), createDeniedCandidate()))],
    ["proxy", () => new Proxy(createDeniedCandidate(), {})],
  ])("rejects a %s representation", (_name, build) => {
    expect(() => checkV138Plan26268ReplacementAuthorization(root, build() as never)).toThrow("V138_262_68_REPRESENTATION_INVALID")
  })
  it("rejects historical checkpoint tampering", () => {
    const directory = cloneWithoutRepresentationModule()
    appendFileSync(path.join(directory, ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-67-CHECKPOINT.md"), "\ntampered\n")
    expect(() => checkV138Plan26268ReplacementAuthorization(directory)).toThrow("V138_262_68_HISTORICAL_INPUT_INVALID")
  }, 30000)
  it("rejects resurrection of the removed importable representation module", () => {
    const directory = cloneWithoutRepresentationModule()
    writeFileSync(path.join(directory, "scripts/lib/v1-38-plan-262-68-replacement-authorization.ts"), "export const executable = true\n")
    expect(() => checkV138Plan26268ReplacementAuthorization(directory)).toThrow("V138_262_68_FORBIDDEN_DESTINATION_PRESENT")
  }, 30000)
  it("rejects a hidden route-reservation claim", () => {
    const directory = cloneWithoutRepresentationModule()
    const reservation = path.join(directory, ".planning/artifacts/.v1.38-plan-262-57-route-reservation-v1")
    mkdirSync(reservation, { recursive: true }); writeFileSync(path.join(reservation, "claim.json"), "{}\n")
    expect(() => checkV138Plan26268ReplacementAuthorization(directory)).toThrow("V138_262_68_FORBIDDEN_DESTINATION_PRESENT")
  }, 30000)
})
