import { spawn, spawnSync } from "node:child_process"
import {
  closeSync,
  constants,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  assertV138AbsentNoFollow,
  authenticateV138ManifestNoFollow,
  readV138RegularNoFollow,
  sha256V138Secure,
  V138_SECURE_MANIFEST_READER_V4_SOURCE,
  withV138SecureWorkspaceSession,
} from "./v1-38-secure-workspace-path-v4.js"

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

  it("holds the authenticated parent descriptor across synchronized path replacement", async () => {
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
        V138_SECURE_MANIFEST_READER_V4_SOURCE,
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
    const child = spawn(reader, [], {
      env: { ...process.env, V138_READER_TEST_BARRIER: tag },
      stdio: ["pipe", "pipe", "pipe", rootDescriptor],
    })
    child.stdin.end("R\tsafe/file\nA\tsafe/absent\n")
    closeSync(rootDescriptor)
    for (
      let attempt = 0;
      attempt < 10_000 &&
      !existsSync(path.join(root, `.v138-reader-ready-${tag}`));
      attempt++
    )
      await new Promise((resolve) => setTimeout(resolve, 1))
    expect(existsSync(path.join(root, `.v138-reader-ready-${tag}`))).toBe(true)
    renameSync(path.join(root, "safe"), path.join(root, "safe-authenticated"))
    symlinkSync(external, path.join(root, "safe"))
    writeFileSync(path.join(root, `.v138-reader-continue-${tag}`), "continue\n")
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
    expect(code).toBe(0)
    expect(stderr).toBe("")
    expect(stdout).toContain(
      `R\t${Buffer.from("safe/file").toString("hex")}\t${Buffer.from("bytes\n").toString("hex")}\n`,
    )
    expect(stdout).toContain(
      `A\t${Buffer.from("safe/absent").toString("hex")}\t-\n`,
    )
  }, 30_000)

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
