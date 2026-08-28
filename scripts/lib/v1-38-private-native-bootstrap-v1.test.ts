import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import { compileV138PrivateNative } from "./v1-38-private-native-bootstrap-v1.js"

const roots: string[] = []
afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true })
})

describe("CR-03 private native bootstrap", () => {
  it("executes a reviewed private compiler copy and rejects transient substitution", () => {
    const root = mkdtempSync(path.join(tmpdir(), "v138-bootstrap-test-"))
    roots.push(root)
    const source = path.join(root, "source.c")
    writeFileSync(source, "int main(void) { return 0; }\n")
    const expectedSourceSha256 = createHash("sha256")
      .update(readFileSync(source))
      .digest("hex")
    const built = compileV138PrivateNative({
      source,
      expectedSourceSha256,
      prefix: "v138-bootstrap-private-",
      testSubstitution: true,
    })
    try {
      expect(built.compilerSha256).toMatch(/^[0-9a-f]{64}$/u)
      expect(built.executableSha256).toMatch(/^[0-9a-f]{64}$/u)
    } finally {
      built.cleanup()
    }
  })
})
