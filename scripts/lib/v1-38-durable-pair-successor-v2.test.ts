import { spawn } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { V138_DURABLE_PAIR_V2_CLI } from "./v1-38-durable-pair-successor-v2.js"

const roots: string[] = []
afterEach(() => { while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true }) })
const fixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "v138-pair-v2-")); roots.push(root)
  mkdirSync(path.join(root, "artifacts")); mkdirSync(path.join(root, "reviews"))
  return root
}
const run = (input: unknown) => new Promise<number | null>((resolve) => {
  const expression = `import(${JSON.stringify(V138_DURABLE_PAIR_V2_CLI)}).then(m=>m.durablyPublishV138PairV2(JSON.parse(Buffer.from(process.argv[1],"base64").toString("utf8"))))`
  const child = spawn(process.execPath, ["--import", "tsx", "--eval", expression, Buffer.from(JSON.stringify(input)).toString("base64")], { cwd: process.cwd(), stdio: "ignore" })
  child.once("exit", resolve)
})

describe("CR-03 common-lock durable pair", () => {
  it("serializes reversed-order conflicting processes to one complete pair", async () => {
    const root = fixture()
    const membersA = [
      { target: "artifacts/review.json", bytes: "A-review\n" },
      { target: "reviews/review.md", bytes: "A-report\n" },
    ] as const
    const membersB = [
      { target: "reviews/review.md", bytes: "B-report\n" },
      { target: "artifacts/review.json", bytes: "B-review\n" },
    ] as const
    const results = await Promise.all([
      run({ trustedRoot: root, intentPath: "intent-a.json", transactionId: "intent-a", members: membersA }),
      run({ trustedRoot: root, intentPath: "intent-b.json", transactionId: "intent-b", members: membersB }),
    ])
    expect(results.filter((status) => status === 0)).toHaveLength(1)
    const pair = [readFileSync(path.join(root, "artifacts/review.json"), "utf8"), readFileSync(path.join(root, "reviews/review.md"), "utf8")]
    expect(pair).toSatisfy((value: string[]) =>
      (value[0] === "A-review\n" && value[1] === "A-report\n") ||
      (value[0] === "B-review\n" && value[1] === "B-report\n"),
    )
  }, 30_000)

  it.each(["artifacts/review.json", "artifacts\\review.json", "artifacts//review.json"])("rejects intent/member and path aliases: %s", async (intentPath) => {
    const root = fixture()
    expect(await run({
      trustedRoot: root,
      transactionId: "alias",
      intentPath,
      members: [{ target: "artifacts/review.json", bytes: "review\n" }, { target: "reviews/review.md", bytes: "report\n" }],
    })).not.toBe(0)
  })

  it.each(["intermediate", "final"])("rejects %s publisher symlinks", async (kind) => {
    const root = fixture(); const external = mkdtempSync(path.join(tmpdir(), "v138-pair-external-")); roots.push(external)
    writeFileSync(path.join(external, "review.json"), "external\n")
    if (kind === "intermediate") symlinkSync(external, path.join(root, "linked"))
    else symlinkSync(path.join(external, "review.json"), path.join(root, "artifacts", "linked.json"))
    const target = kind === "intermediate" ? "linked/review.json" : "artifacts/linked.json"
    expect(await run({
      trustedRoot: root,
      transactionId: `symlink-${kind}`,
      intentPath: "pair.intent",
      members: [{ target, bytes: "ours\n" }, { target: "reviews/review.md", bytes: "report\n" }],
    })).not.toBe(0)
    expect(readFileSync(path.join(external, "review.json"), "utf8")).toBe("external\n")
  })

  it("rejects hostile internal directories before creating any external bytes", async () => {
    const root = fixture(); const external = mkdtempSync(path.join(tmpdir(), "v138-pair-internal-external-")); roots.push(external)
    symlinkSync(external, path.join(root, ".v138-pair-staging"))
    expect(await run({
      trustedRoot: root,
      transactionId: "internal-symlink",
      intentPath: "pair.intent",
      members: [{ target: "artifacts/review.json", bytes: "review\n" }, { target: "reviews/review.md", bytes: "report\n" }],
    })).not.toBe(0)
    expect(readdirSync(external)).toEqual([])
    expect(() => readFileSync(path.join(root, "pair.intent"))).toThrow()
  })
})
