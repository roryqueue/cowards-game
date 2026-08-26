import { execFileSync } from "node:child_process"
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, describe, expect, it } from "vitest"
import { checkV138Plan26265R4Source } from "./check-v1-38-plan-262-65-r4-source.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const copies: string[] = []
const copy = () => { const directory = mkdtempSync(path.join(os.tmpdir(), "plan-262-65-")); copies.push(directory); execFileSync("git", ["clone", "--quiet", "--no-hardlinks", root, directory]); return directory }
afterEach(() => { while (copies.length) rmSync(copies.pop()!, { recursive: true, force: true }) })
describe("Plan 262-65 R4 source boundary", () => {
  it("is read-only and leaves all authority denied", () => {
    expect(checkV138Plan26265R4Source(root)).toMatchObject({ reviewer: "r4_source_only", disposition: "no_canonical_output", admit03: "blocked", freshAccepted: 0, requiredAccepted: 540, authority: "denied" })
  })
  it("fails closed for archive tampering and dangling forbidden paths", () => {
    const archiveTamper = copy()
    writeFileSync(path.join(archiveTamper, ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/archived/262-62-HISTORICAL.md"), "tampered\n")
    expect(() => checkV138Plan26265R4Source(archiveTamper)).toThrow("V138_262_65_ARCHIVE_HASH_INVALID")
    const dangling = copy()
    symlinkSync("/missing", path.join(dangling, ".planning/artifacts/v1.38-plan-262-56-authorization-v9.json"))
    expect(() => checkV138Plan26265R4Source(dangling)).toThrow("V138_262_65_FORBIDDEN_DESTINATION_PRESENT")
  }, 30000)
})
