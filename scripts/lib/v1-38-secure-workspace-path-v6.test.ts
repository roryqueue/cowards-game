import { spawn, spawnSync } from "node:child_process"
import {
  appendFileSync,
  closeSync,
  constants,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  symlinkSync,
  truncateSync,
  writeFileSync,
  writeSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  assertV138AbsentNoFollow,
  authenticateV138ManifestNoFollow,
  readV138RegularNoFollow,
  sha256V138Secure,
  V138_SECURE_MANIFEST_READER_V6_SOURCE,
  V138_SECURE_BATCH_PROTOCOL_V6,
  readV138WorkspaceBatch,
  withV138SecureWorkspaceSession,
} from "./v1-38-secure-workspace-path-v6.js"

const roots: string[] = []
afterEach(() => {
  while (roots.length > 0)
    rmSync(roots.pop()!, { recursive: true, force: true })
})
const fixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "v138-secure-path-"))
  roots.push(root)
  mkdirSync(path.join(root, "safe"))
  writeFileSync(path.join(root, "safe", "file"), "bytes\n")
  return root
}

const runRetainedLeafRace = async (
  root: string,
  kind: "control" | "truncate" | "overwrite" | "append" | "in-place",
) => {
  const build = mkdtempSync(path.join(tmpdir(), "v138-reader-race-"))
  roots.push(build)
  const reader = path.join(build, "reader")
  expect(
    spawnSync("/usr/bin/clang", [
      "-std=c11",
      "-Wall",
      "-Wextra",
      "-Werror",
      V138_SECURE_MANIFEST_READER_V6_SOURCE,
      "-o",
      reader,
    ]).status,
  ).toBe(0)
  const tag = `leaf-${kind}`
  const rootDescriptor = openSync(
    root,
    constants.O_RDONLY |
      (constants.O_DIRECTORY ?? 0) |
      (constants.O_NOFOLLOW ?? 0),
  )
  const controlDescriptor = openSync(
    build,
    constants.O_RDONLY | (constants.O_DIRECTORY ?? 0),
  )
  const child = spawn(reader, [], {
    env: {
      PATH: "/usr/bin:/bin",
      LANG: "C",
      LC_ALL: "C",
      TMPDIR: build,
      V138_READER_TEST_BARRIER: tag,
    },
    stdio: ["pipe", "pipe", "pipe", rootDescriptor, controlDescriptor],
  })
  child.stdin.end("R\tsafe/file\n")
  closeSync(rootDescriptor)
  closeSync(controlDescriptor)
  const ready = path.join(build, `.v138-reader-ready-${tag}`)
  for (let attempt = 0; attempt < 10_000 && !existsSync(ready); attempt++)
    await new Promise((resolve) => setTimeout(resolve, 1))
  expect(existsSync(ready)).toBe(true)
  const leaf = path.join(root, "safe/file")
  if (kind === "truncate") truncateSync(leaf, 2)
  else if (kind === "overwrite") writeFileSync(leaf, "other\n")
  else if (kind === "append") appendFileSync(leaf, "growth\n")
  else if (kind === "in-place") {
    const descriptor = openSync(leaf, "r+")
    try {
      writeSync(descriptor, Buffer.from("X"), 0, 1, 2)
    } finally {
      closeSync(descriptor)
    }
  }
  writeFileSync(
    path.join(build, `.v138-reader-continue-${tag}`),
    "continue\n",
  )
  let stdout = "",
    stderr = ""
  child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
    stdout += chunk
  })
  child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
    stderr += chunk
  })
  const code = await new Promise<number | null>((resolve) =>
    child.once("exit", resolve),
  )
  return { code, stdout, stderr }
}

describe("CR-05 trusted-root no-follow paths", () => {
  it("authenticates regular bytes through an O_NOFOLLOW descriptor", () => {
    const root = fixture()
    expect(
      authenticateV138ManifestNoFollow(root, [
        { path: "safe/file", sha256: sha256V138Secure("bytes\n") },
      ]),
    ).toBe(true)
    expect(readV138RegularNoFollow(root, "safe/file").toString()).toBe(
      "bytes\n",
    )
    expect(assertV138AbsentNoFollow(root, "safe/absent")).toBe(true)
  })

  it.each(["intermediate", "final"])("rejects a %s symlink", (kind) => {
    const root = fixture()
    const external = mkdtempSync(path.join(tmpdir(), "v138-external-"))
    roots.push(external)
    writeFileSync(path.join(external, "file"), "bytes\n")
    if (kind === "intermediate")
      symlinkSync(external, path.join(root, "linked"))
    else
      symlinkSync(
        path.join(external, "file"),
        path.join(root, "safe", "linked"),
      )
    expect(() =>
      readV138RegularNoFollow(
        root,
        kind === "intermediate" ? "linked/file" : "safe/linked",
      ),
    ).toThrow("V138_SECURE_SYMLINK_FORBIDDEN")
  })

  it.each(["/absolute", "../escape", "safe/../escape", "safe//file"])(
    "rejects uncontained input %s",
    (relative) => {
      expect(() => readV138RegularNoFollow(fixture(), relative)).toThrow(
        "V138_SECURE_RELATIVE_PATH_INVALID",
      )
    },
  )

  it("fails the leaf snapshot when a retained subtree path changes", async () => {
    const root = fixture()
    const external = mkdtempSync(path.join(tmpdir(), "v138-reader-external-"))
    roots.push(external)
    writeFileSync(path.join(external, "file"), "external\n")
    const build = mkdtempSync(path.join(tmpdir(), "v138-reader-build-"))
    roots.push(build)
    const reader = path.join(build, "reader")
    expect(
      spawnSync("/usr/bin/clang", [
        "-std=c11",
        "-Wall",
        "-Wextra",
        "-Werror",
        V138_SECURE_MANIFEST_READER_V6_SOURCE,
        "-o",
        reader,
      ]).status,
    ).toBe(0)
    const tag = "replacement"
    const rootDescriptor = openSync(
      root,
      constants.O_RDONLY |
        (constants.O_DIRECTORY ?? 0) |
        (constants.O_NOFOLLOW ?? 0),
    )
    const controlDescriptor = openSync(
      build,
      constants.O_RDONLY | (constants.O_DIRECTORY ?? 0),
    )
    const child = spawn(reader, [], {
      env: {
        PATH: "/usr/bin:/bin",
        LANG: "C",
        LC_ALL: "C",
        TMPDIR: build,
        V138_READER_TEST_BARRIER: tag,
      },
      stdio: ["pipe", "pipe", "pipe", rootDescriptor, controlDescriptor],
    })
    child.stdin.end("R\tsafe/file\nA\tsafe/absent\n")
    closeSync(rootDescriptor)
    closeSync(controlDescriptor)
    for (
      let attempt = 0;
      attempt < 10_000 &&
      !existsSync(path.join(build, `.v138-reader-ready-${tag}`));
      attempt++
    )
      await new Promise((resolve) => setTimeout(resolve, 1))
    expect(existsSync(path.join(build, `.v138-reader-ready-${tag}`))).toBe(true)
    renameSync(path.join(root, "safe"), path.join(root, "safe-authenticated"))
    symlinkSync(external, path.join(root, "safe"))
    writeFileSync(path.join(build, `.v138-reader-continue-${tag}`), "continue\n")
    let stdout = "",
      stderr = ""
    child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
      stdout += chunk
    })
    child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
      stderr += chunk
    })
    const code = await new Promise<number | null>((resolve) =>
      child.once("exit", resolve),
    )
    expect(code).not.toBe(0)
    expect(stderr).toContain("V138_READER_BATCH_GENERATION_CHANGED")
    expect(stdout).not.toContain(`R\t${Buffer.from("safe/file").toString("hex")}\t`)
  }, 30_000)

  it("keeps synchronization outside the authenticated root and succeeds without replacement", async () => {
    const result = await runRetainedLeafRace(fixture(), "control")
    expect(result.code).toBe(0)
    expect(result.stderr).toBe("")
    expect(result.stdout).toContain(
      `R\t${Buffer.from("safe/file").toString("hex")}\t${Buffer.from("bytes\n").toString("hex")}`,
    )
  }, 30_000)

  it.each([
    ["truncate", "V138_READER_LEAF_TRUNCATED"],
    ["overwrite", "V138_READER_LEAF_GENERATION_CHANGED"],
    ["append", "V138_READER_LEAF_GREW"],
    ["in-place", "V138_READER_LEAF_GENERATION_CHANGED"],
  ] as const)("rejects a retained-leaf %s race before output", async (kind, expected) => {
    const result = await runRetainedLeafRace(fixture(), kind)
    expect(result.code).not.toBe(0)
    expect(result.stderr).toContain(expected)
    expect(result.stdout).toBe("")
  }, 30_000)

  it("uses one immutable reader per batch and removes all bootstrap residue", () => {
    const root = fixture()
    const before = new Set(
      readdirSync(tmpdir()).filter((entry) =>
        entry.startsWith("v138-secure-reader-v6-"),
      ),
    )
    const batch = readV138WorkspaceBatch(
      root,
      ["safe/file"],
      ["safe/absent"],
      "replace-reader-executable",
    )
    expect(batch.bytes["safe/file"]!.toString()).toBe("bytes\n")
    expect(batch.protocol).toBe(V138_SECURE_BATCH_PROTOCOL_V6)
    expect(batch.barrierControl).toBe(
      "external-private-bootstrap-directory",
    )
    expect(
      readdirSync(root).some((entry) => entry.startsWith(".v138-reader-")),
    ).toBe(false)
    expect(batch.snapshotGuarantee).toBe(
      "required_leaf_exact_generation_and_parent_generation_bound",
    )
    expect(
      readdirSync(tmpdir()).filter(
        (entry) =>
          entry.startsWith("v138-secure-reader-v6-") && !before.has(entry),
      ),
    ).toEqual([])
  })

  it("has no reusable reader cache or exit-only cleanup path", () => {
    const source = readFileSync(
      path.resolve(
        path.dirname(V138_SECURE_MANIFEST_READER_V6_SOURCE),
        "../lib/v1-38-secure-workspace-path-v6.ts",
      ),
      "utf8",
    )
    expect(source).not.toMatch(/let\s+readerExecutable|process\.once\(["']exit/u)
    const root = fixture()
    expect(readV138WorkspaceBatch(root, ["safe/file"]).bytes["safe/file"])
      .toEqual(readV138WorkspaceBatch(root, ["safe/file"]).bytes["safe/file"])
  })

  it("retains one root inode across a root-path replacement and checks absence there", () => {
    const root = fixture(),
      moved = `${root}-authenticated`,
      replacement = `${root}-replacement`
    roots.push(moved, replacement)
    expect(
      withV138SecureWorkspaceSession(root, (session) => {
        const identity = session.identity
        renameSync(root, moved)
        mkdirSync(root)
        mkdirSync(path.join(root, "safe"))
        writeFileSync(path.join(root, "safe", "file"), "replacement\n")
        writeFileSync(
          path.join(root, "safe", "absent"),
          "present-only-in-replacement\n",
        )
        expect(session.read("safe/file").toString()).toBe("bytes\n")
        expect(session.assertAbsent("safe/absent")).toBe(true)
        expect(session.identity).toEqual(identity)
        renameSync(root, replacement)
        renameSync(moved, root)
        return true
      }),
    ).toBe(true)
  })
})
