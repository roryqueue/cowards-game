import { spawn, spawnSync } from "node:child_process"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  durablyPublishV138Pair,
  publishV138NoReplaceUnderLockf,
  V138_DURABLE_PUBLICATION_SUCCESSOR_CLI,
} from "./v1-38-durable-publication-successor-v1.js"

const roots: string[] = []
afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true })
})

const fixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "v138-pair-successor-"))
  roots.push(root)
  const artifacts = path.join(root, "artifacts")
  const reports = path.join(root, "reports")
  mkdirSync(artifacts)
  mkdirSync(reports)
  return {
    root,
    intentPath: path.join(root, ".pair-intent.json"),
    members: [
      { target: path.join(artifacts, "review.json"), bytes: "{\"ok\":true}\n" },
      { target: path.join(reports, "review.md"), bytes: "# reviewed\n" },
    ] as const,
  }
}

describe("CR-03 durable recoverable pair publication", () => {
  it.each([
    "member:0:stage_fsync",
    "member:1:stage_fsync",
    "intent:file_fsync",
    "intent:parent_fsync",
    "member:0:publish",
    "member:0:parent_fsync",
    "member:1:publish",
    "member:1:parent_fsync",
  ])("recovers byte-exactly after real SIGKILL at %s", (boundary) => {
    const input = fixture()
    const result = spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        V138_DURABLE_PUBLICATION_SUCCESSOR_CLI,
        "--pair-crash-probe",
        Buffer.from(
          JSON.stringify({
            transactionId: "review-pair-v3",
            intentPath: input.intentPath,
            members: input.members,
          }),
        ).toString("base64"),
        boundary,
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    )
    expect(result.signal).toBe("SIGKILL")

    const recovered = durablyPublishV138Pair({
      transactionId: "review-pair-v3",
      intentPath: input.intentPath,
      members: input.members,
    })
    expect(recovered).toMatchObject({ status: "complete", memberCount: 2 })
    for (const member of input.members) {
      expect(readFileSync(member.target, "utf8")).toBe(member.bytes)
    }
    expect(existsSync(input.intentPath)).toBe(false)
  }, 60_000)

  it("authenticates and completes an already durable first canonical member", () => {
    const input = fixture()
    writeFileSync(input.members[0].target, input.members[0].bytes, { mode: 0o600 })
    durablyPublishV138Pair({
      transactionId: "seal-envelope-v3",
      intentPath: input.intentPath,
      members: input.members,
    })
    expect(readFileSync(input.members[0].target, "utf8")).toBe(
      input.members[0].bytes,
    )
    expect(readFileSync(input.members[1].target, "utf8")).toBe(
      input.members[1].bytes,
    )
  })

  it("never rolls back or replaces a durable conflicting canonical member", () => {
    const input = fixture()
    writeFileSync(input.members[0].target, "foreign-bytes\n", { mode: 0o600 })
    expect(() =>
      durablyPublishV138Pair({
        transactionId: "review-pair-v3",
        intentPath: input.intentPath,
        members: input.members,
      }),
    ).toThrow("V138_DURABLE_PUBLICATION_CANONICAL_CONFLICT")
    expect(readFileSync(input.members[0].target, "utf8")).toBe("foreign-bytes\n")
    expect(existsSync(input.members[1].target)).toBe(false)
  })
})

const waitFor = async (predicate: () => boolean): Promise<void> => {
  const deadline = Date.now() + 10_000
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error("wait_timeout")
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
}

describe("CR-04 kernel-locked no-replace lifecycle publication", () => {
  it("publishes under lockf and rejects a second publication without mutation", () => {
    const input = fixture()
    const target = path.join(input.root, "lifecycle.json")
    const lockPath = path.join(input.root, ".lifecycle.lock")
    publishV138NoReplaceUnderLockf({
      transactionId: "lifecycle-v3",
      lockPath,
      target,
      bytes: "first\n",
    })
    expect(readFileSync(target, "utf8")).toBe("first\n")
    expect(() =>
      publishV138NoReplaceUnderLockf({
        transactionId: "lifecycle-v3-second",
        lockPath,
        target,
        bytes: "second\n",
      }),
    ).toThrow()
    expect(readFileSync(target, "utf8")).toBe("first\n")
  })

  it("rechecks under the kernel lock and cannot overwrite a synchronized racer", async () => {
    const input = fixture()
    const target = path.join(input.root, "readiness.json")
    const lockPath = path.join(input.root, ".readiness.lock")
    const readyPath = path.join(input.root, ".ready")
    const continuePath = path.join(input.root, ".continue")
    const payload = Buffer.from(
      JSON.stringify({
        transactionId: "readiness-v3-race",
        lockPath,
        target,
        bytes: "ours\n",
        readyPath,
        continuePath,
      }),
    ).toString("base64")
    const child = spawn(
      process.execPath,
      [
        "--import",
        "tsx",
        V138_DURABLE_PUBLICATION_SUCCESSOR_CLI,
        "--publish-no-replace",
        payload,
      ],
      { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] },
    )
    await waitFor(() => existsSync(readyPath))

    const contender = spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        V138_DURABLE_PUBLICATION_SUCCESSOR_CLI,
        "--publish-no-replace",
        Buffer.from(
          JSON.stringify({
            transactionId: "readiness-v3-contender",
            lockPath,
            target,
            bytes: "contender\n",
          }),
        ).toString("base64"),
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    )
    expect(contender.status).not.toBe(0)
    expect(existsSync(target)).toBe(false)

    writeFileSync(target, "racer\n", { mode: 0o600 })
    writeFileSync(continuePath, "continue\n", { mode: 0o600 })
    const exitCode = await new Promise<number | null>((resolve) =>
      child.once("exit", resolve),
    )
    expect(exitCode).not.toBe(0)
    expect(readFileSync(target, "utf8")).toBe("racer\n")
  }, 30_000)
})
