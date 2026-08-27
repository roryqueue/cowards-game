import { createHash } from "node:crypto"
import { spawn } from "node:child_process"
import { linkSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { applyV138RestartableLifecycleTransactionV2, V138_RESTARTABLE_LIFECYCLE_V2_CLI } from "./v1-38-restartable-lifecycle-successor-v2.js"

const roots: string[] = []
afterEach(() => { while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true }) })
const sha256 = (value: string): `sha256:${string}` => `sha256:${createHash("sha256").update(value).digest("hex")}`
const fixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "v138-lifecycle-v2-")); roots.push(root); mkdirSync(path.join(root, "planning"))
  const steps = ["requirements", "roadmap", "state", "phase"].map((id) => {
    const before = `${id}:before\n`; const after = `${id}:after\n`; writeFileSync(path.join(root, "planning", `${id}.md`), before)
    return { id, target: `planning/${id}.md`, beforeSha256: sha256(before), afterBytes: after }
  })
  return { root, trustedRoot: root, transactionId: "lifecycle-v2-test", intentPath: "lifecycle.intent", steps, lifecycle: { target: "lifecycle.json", bytes: '{"status":"complete"}\n' } }
}
const run = (input: unknown) => new Promise<number | null>((resolve) => {
  const child = spawn(process.execPath, ["--import", "tsx", V138_RESTARTABLE_LIFECYCLE_V2_CLI, "--synthetic-lifecycle", Buffer.from(JSON.stringify(input)).toString("base64")], { cwd: process.cwd(), stdio: "ignore" }); child.once("exit", resolve)
})

describe("CR-04 locked restartable lifecycle CAS", () => {
  it.each([0, 1, 2, 3])("serializes two-process races at step %i", async () => {
    const input = fixture()
    const results = await Promise.all([run(input), run(input)])
    expect(results).toEqual([0, 0])
    for (const step of input.steps) expect(readFileSync(path.join(input.root, step.target), "utf8")).toBe(step.afterBytes)
    expect(readFileSync(path.join(input.root, input.lifecycle.target), "utf8")).toBe(input.lifecycle.bytes)
  }, 30_000)

  it("rejects an exact status marker when any postcondition is incomplete", () => {
    const input = fixture()
    writeFileSync(path.join(input.root, input.lifecycle.target), input.lifecycle.bytes)
    expect(() => applyV138RestartableLifecycleTransactionV2(input)).toThrow()
    for (const step of input.steps) expect(readFileSync(path.join(input.root, step.target), "utf8")).toContain(":before")
  })

  it("uses no-replace links rather than rename replacement", () => {
    const input = fixture()
    expect(applyV138RestartableLifecycleTransactionV2(input)).toMatchObject({ status: "complete", stepsApplied: 4 })
    const inodeAlias = path.join(input.root, "status-alias")
    linkSync(path.join(input.root, input.lifecycle.target), inodeAlias)
    expect(readFileSync(inodeAlias, "utf8")).toBe(input.lifecycle.bytes)
  })

  it.each(["intermediate", "final"])("rejects %s lifecycle symlinks", (kind) => {
    const input = fixture(); const external = mkdtempSync(path.join(tmpdir(), "v138-lifecycle-external-")); roots.push(external); writeFileSync(path.join(external, "step.md"), "requirements:before\n")
    if (kind === "intermediate") symlinkSync(external, path.join(input.root, "linked"))
    else symlinkSync(path.join(external, "step.md"), path.join(input.root, "planning", "linked.md"))
    input.steps[0] = { ...input.steps[0]!, target: kind === "intermediate" ? "linked/step.md" : "planning/linked.md" }
    expect(() => applyV138RestartableLifecycleTransactionV2(input)).toThrow()
    expect(readFileSync(path.join(external, "step.md"), "utf8")).toBe("requirements:before\n")
  })
})
