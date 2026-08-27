import { spawn } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
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
  const child = spawn(process.execPath, ["--import", "tsx", V138_DURABLE_PAIR_V2_CLI, "--synthetic-pair", Buffer.from(JSON.stringify(input)).toString("base64")], { cwd: process.cwd(), stdio: "ignore" })
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
    const base = { trustedRoot: root, intentPath: "pair.intent" }
    const results = await Promise.all([
      run({ ...base, transactionId: "intent-a", members: membersA }),
      run({ ...base, transactionId: "intent-b", members: membersB }),
    ])
    expect(results.filter((status) => status === 0)).toHaveLength(1)
    const pair = [readFileSync(path.join(root, "artifacts/review.json"), "utf8"), readFileSync(path.join(root, "reviews/review.md"), "utf8")]
    expect(pair).toSatisfy((value: string[]) =>
      (value[0] === "A-review\n" && value[1] === "A-report\n") ||
      (value[0] === "B-review\n" && value[1] === "B-report\n"),
    )
  }, 30_000)
})
