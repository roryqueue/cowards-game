import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  assertV138AbsentNoFollow,
  authenticateV138ManifestNoFollow,
  readV138RegularNoFollow,
  sha256V138Secure,
} from "./v1-38-secure-workspace-path-v2.js"

const roots: string[] = []
afterEach(() => { while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true }) })
const fixture = () => { const root = mkdtempSync(path.join(tmpdir(), "v138-secure-path-")); roots.push(root); mkdirSync(path.join(root, "safe")); writeFileSync(path.join(root, "safe", "file"), "bytes\n"); return root }

describe("CR-05 trusted-root no-follow paths", () => {
  it("authenticates regular bytes through an O_NOFOLLOW descriptor", () => {
    const root = fixture()
    expect(authenticateV138ManifestNoFollow(root, [{ path: "safe/file", sha256: sha256V138Secure("bytes\n") }])).toBe(true)
    expect(readV138RegularNoFollow(root, "safe/file").toString()).toBe("bytes\n")
    expect(assertV138AbsentNoFollow(root, "safe/absent")).toBe(true)
  })

  it.each(["intermediate", "final"])("rejects a %s symlink", (kind) => {
    const root = fixture(); const external = mkdtempSync(path.join(tmpdir(), "v138-external-")); roots.push(external); writeFileSync(path.join(external, "file"), "bytes\n")
    if (kind === "intermediate") symlinkSync(external, path.join(root, "linked"))
    else symlinkSync(path.join(external, "file"), path.join(root, "safe", "linked"))
    expect(() => readV138RegularNoFollow(root, kind === "intermediate" ? "linked/file" : "safe/linked")).toThrow("V138_SECURE_SYMLINK_FORBIDDEN")
  })

  it.each(["/absolute", "../escape", "safe/../escape", "safe//file"])("rejects uncontained input %s", (relative) => {
    expect(() => readV138RegularNoFollow(fixture(), relative)).toThrow("V138_SECURE_RELATIVE_PATH_INVALID")
  })
})
