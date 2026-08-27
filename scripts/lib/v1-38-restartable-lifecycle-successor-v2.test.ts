import { createHash } from "node:crypto"
import { spawn } from "node:child_process"
import { linkSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { applyV138RestartableLifecycleTransactionV2, deriveV138LifecycleNamespaceV2, V138_RESTARTABLE_LIFECYCLE_V2_CLI } from "./v1-38-restartable-lifecycle-successor-v2.js"

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
  const expression = `import(${JSON.stringify(V138_RESTARTABLE_LIFECYCLE_V2_CLI)}).then(m=>m.applyV138RestartableLifecycleTransactionV2(JSON.parse(Buffer.from(process.argv[1],"base64").toString("utf8"))))`
  const child = spawn(process.execPath, ["--import", "tsx", "--eval", expression, Buffer.from(JSON.stringify(input)).toString("base64")], { cwd: process.cwd(), stdio: "ignore" }); child.once("exit", resolve)
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

  it("isolates the same transaction id across disjoint target sets", async () => {
    const left = fixture()
    const rightRoot = left.root
    const before = "other:before\n"; const after = "other:after\n"
    writeFileSync(path.join(rightRoot, "planning/other.md"), before)
    const right = {
      trustedRoot: rightRoot,
      transactionId: left.transactionId,
      intentPath: "other.intent",
      steps: [{ id: "other", target: "planning/other.md", beforeSha256: sha256(before), afterBytes: after }],
      lifecycle: { target: "other-lifecycle.json", bytes: '{"status":"other"}\n' },
    }
    expect(deriveV138LifecycleNamespaceV2(left)).not.toBe(deriveV138LifecycleNamespaceV2(right))
    expect(await Promise.all([run(left), run(right)])).toEqual([0, 0])
    expect(readFileSync(path.join(rightRoot, "planning/requirements.md"), "utf8")).toBe("requirements:after\n")
    expect(readFileSync(path.join(rightRoot, "planning/other.md"), "utf8")).toBe(after)
    expect(readFileSync(path.join(rightRoot, left.lifecycle.target), "utf8")).toBe(left.lifecycle.bytes)
    expect(readFileSync(path.join(rightRoot, right.lifecycle.target), "utf8")).toBe(right.lifecycle.bytes)
  }, 30_000)

  it("serializes the same transaction id across overlapping target sets without cross-installing status bytes", async () => {
    const left = fixture()
    const right = {
      ...left,
      intentPath: "overlap.intent",
      steps: [{ ...left.steps[0]!, afterBytes: "requirements:conflict\n" }],
      lifecycle: { target: "overlap-lifecycle.json", bytes: '{"status":"overlap"}\n' },
    }
    const results = await Promise.all([run(left), run(right)])
    expect(results.filter((status) => status === 0)).toHaveLength(1)
    expect(readFileSync(path.join(left.root, "planning/requirements.md"), "utf8")).toMatch(/^requirements:(after|conflict)\n$/u)
    const statuses = [left.lifecycle.target, right.lifecycle.target].filter((target) => {
      try { readFileSync(path.join(left.root, target)); return true } catch { return false }
    })
    expect(statuses).toHaveLength(1)
  }, 30_000)

  it.each(["intermediate", "final"])("rejects %s lifecycle symlinks", (kind) => {
    const input = fixture(); const external = mkdtempSync(path.join(tmpdir(), "v138-lifecycle-external-")); roots.push(external); writeFileSync(path.join(external, "step.md"), "requirements:before\n")
    if (kind === "intermediate") symlinkSync(external, path.join(input.root, "linked"))
    else symlinkSync(path.join(external, "step.md"), path.join(input.root, "planning", "linked.md"))
    input.steps[0] = { ...input.steps[0]!, target: kind === "intermediate" ? "linked/step.md" : "planning/linked.md" }
    expect(() => applyV138RestartableLifecycleTransactionV2(input)).toThrow()
    expect(readFileSync(path.join(external, "step.md"), "utf8")).toBe("requirements:before\n")
  })

  it("rejects a hostile internal staging directory before external mutation", () => {
    const input = fixture(); const external = mkdtempSync(path.join(tmpdir(), "v138-lifecycle-staging-external-")); roots.push(external)
    symlinkSync(external, path.join(input.root, ".v138-lifecycle-staging"))
    expect(() => applyV138RestartableLifecycleTransactionV2(input)).toThrow("V138_SECURE_INTERNAL_DIRECTORY_INVALID")
    expect(readdirSync(external)).toEqual([])
    for (const step of input.steps) expect(readFileSync(path.join(input.root, step.target), "utf8")).toContain(":before")
  })
})
