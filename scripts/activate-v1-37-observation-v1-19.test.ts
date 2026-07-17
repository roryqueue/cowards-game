import { createHash } from "node:crypto"
import { describe, expect, it, vi } from "vitest"
import {
  ACTIVATION_COMMIT_MESSAGE,
  ACTIVATION_PROOF_PATH,
  ACTIVATION_SELECTOR_PATHS,
  COMPENSATION_COMMIT_MESSAGE,
  buildV119SelectorBytes,
  runV137ObservationV119Activation,
  type ActivationCoordinatorAdapter,
  type ActivationHead,
  type FileBytes,
  type GateReceipt,
} from "./activate-v1-37-observation-v1-19.js"

const hash = (value: string | Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const git = (character: string): string => character.repeat(40)

class ModelAdapter implements ActivationCoordinatorAdapter {
  readonly files = new Map<string, Uint8Array>()
  readonly commits = new Map<
    string,
    { parent: string; tree: string; files: Map<string, Uint8Array> }
  >()
  readonly events: string[] = []
  staged = new Set<string>()
  currentHead = git("a")
  head: ActivationHead
  failCommit = false
  failFinalize = false
  failGate: string | null = null

  constructor() {
    for (const path of [...ACTIVATION_SELECTOR_PATHS, ACTIVATION_PROOF_PATH]) {
      if (path !== ACTIVATION_PROOF_PATH) {
        this.files.set(path, Buffer.from(`old:${path}\n`))
      }
    }
    this.commits.set(this.currentHead, {
      parent: git("0"),
      tree: git("1"),
      files: new Map(this.files),
    })
    this.head = {
      state: "active-v1.17-bootstrap",
      revision: 0,
      activeSelectionRoot:
        "sha256:fd2cc24a345c0cb94dde9966262f128c663a4430022574729eb4a902177c4b5a",
      pendingIntent: null,
      finalization: null,
      compensation: null,
    }
  }

  async withLock<T>(operation: () => Promise<T>): Promise<T> {
    this.events.push("lock")
    return operation()
  }
  async readHead(): Promise<ActivationHead> {
    return structuredClone(this.head)
  }
  async prepare(input: any): Promise<ActivationHead> {
    this.events.push(`prepare:${input.direction}`)
    if (input.expectedRevision !== this.head.revision)
      throw new Error("stale revision")
    this.head = {
      ...this.head,
      state:
        input.direction === "forward"
          ? "pending-precommit"
          : "pending-compensation",
      revision: this.head.revision + 1,
      pendingIntent: {
        direction: input.direction,
        activationId: input.activationId,
        sourceActivationId: input.sourceActivationId,
        parentHead: input.parentHead,
        targetRoot: input.targetRoot,
        selectorManifest: input.selectorManifest,
        selectorManifestRoot: input.selectorManifestRoot,
        proofPreimageRoot: input.proofPreimageRoot,
      },
    }
    return this.readHead()
  }
  async finalize(input: any): Promise<ActivationHead> {
    this.events.push(`finalize:${input.direction}`)
    if (this.failFinalize) throw new Error("finalization failed")
    if (input.expectedRevision !== this.head.revision)
      throw new Error("stale finalization")
    if (input.direction === "forward") {
      this.head = {
        state: "active-v1.19-finalized",
        revision: this.head.revision + 1,
        activeSelectionRoot:
          "sha256:17954660f17c83e60e5d7df0b589cd89cf6b00eba4d4963e2d4bf43bc71c6ea2",
        pendingIntent: null,
        finalization: {
          activationId: input.activationId,
          proofDigest: input.proofDigest,
          commitSha: input.commitSha,
          treeSha: input.treeSha,
          selectorManifestRoot: input.expectedSelectorManifestRoot,
        },
        compensation: null,
      }
    } else {
      this.head = {
        ...this.head,
        state: "active-v1.17-compensated",
        revision: this.head.revision + 1,
        activeSelectionRoot:
          "sha256:fd2cc24a345c0cb94dde9966262f128c663a4430022574729eb4a902177c4b5a",
        pendingIntent: null,
        compensation: {
          activationId: input.activationId,
          sourceActivationId: input.sourceActivationId,
          recoveryReceiptDigest: input.recoveryReceiptDigest,
          commitSha: input.commitSha,
          treeSha: input.treeSha,
          selectorManifestRoot: input.expectedSelectorManifestRoot,
        },
      }
    }
    return this.readHead()
  }
  async abort(input: any): Promise<ActivationHead> {
    this.events.push(`abort:${input.direction}`)
    this.head = {
      ...this.head,
      state:
        input.direction === "forward"
          ? "active-v1.17-bootstrap"
          : "active-v1.19-finalized",
      revision: this.head.revision + 1,
      pendingIntent: null,
    }
    return this.readHead()
  }
  async gitHead(): Promise<string> {
    return this.currentHead
  }
  async gitParent(commit: string): Promise<string> {
    return this.commits.get(commit)?.parent ?? git("f")
  }
  async gitTree(commit: string): Promise<string> {
    return this.commits.get(commit)?.tree ?? git("e")
  }
  async changedPaths(commit: string): Promise<string[]> {
    const current = this.commits.get(commit)!
    const parent = this.commits.get(current.parent)
    const paths = new Set([
      ...current.files.keys(),
      ...(parent?.files.keys() ?? []),
    ])
    return [...paths]
      .filter((path) => {
        const before = parent?.files.get(path)
        const after = current.files.get(path)
        return Buffer.compare(before ?? Buffer.alloc(0), after ?? Buffer.alloc(0)) !== 0
      })
      .sort()
  }
  async readFile(path: string): Promise<FileBytes> {
    const bytes = this.files.get(path)
    return bytes ? { state: "present", bytes } : { state: "absent" }
  }
  async readCommitFile(commit: string, path: string): Promise<FileBytes> {
    const bytes = this.commits.get(commit)?.files.get(path)
    return bytes ? { state: "present", bytes } : { state: "absent" }
  }
  async writeFile(path: string, value: FileBytes): Promise<void> {
    this.events.push(`write:${path}`)
    if (value.state === "present") this.files.set(path, value.bytes)
    else this.files.delete(path)
  }
  async stagedPaths(): Promise<string[]> {
    return [...this.staged].sort()
  }
  async stage(paths: readonly string[]): Promise<void> {
    this.events.push("stage")
    for (const path of paths) this.staged.add(path)
  }
  async commit(message: string, paths: readonly string[]): Promise<string> {
    this.events.push(`commit:${message}`)
    if (this.failCommit) throw new Error("commit hook failed")
    const next = git(message.startsWith("compensate") ? "d" : "b")
    this.commits.set(next, {
      parent: this.currentHead,
      tree: git(message.startsWith("compensate") ? "e" : "c"),
      files: new Map(this.files),
    })
    this.currentHead = next
    for (const path of paths) this.staged.delete(path)
    return next
  }
  async runGate(id: string): Promise<GateReceipt> {
    this.events.push(`gate:${id}`)
    if (this.failGate === id) throw new Error(`gate failed: ${id}`)
    return {
      id,
      command: `test:${id}`,
      exitCode: 0,
      stdoutSha256: hash(`stdout:${id}`),
      stderrSha256: hash(`stderr:${id}`),
      completedAt: "2026-07-17T12:00:00.000Z",
    }
  }
}

const run = (
  adapter: ModelAdapter,
  mode: Parameters<typeof runV137ObservationV119Activation>[0]["mode"],
) =>
  runV137ObservationV119Activation({
    mode,
    activationId: "activation:phase260:plan31:test",
    adapter,
  })

const throughValidate = async (adapter: ModelAdapter) => {
  await run(adapter, "prepare")
  await run(adapter, "validate")
  await run(adapter, "rollback-drill")
}

describe("v1.37 observation v1.19 activation coordinator", () => {
  it("uses a nonrecursive five-selector manifest and a separate proof output", () => {
    expect(ACTIVATION_SELECTOR_PATHS).toHaveLength(5)
    expect(new Set(ACTIVATION_SELECTOR_PATHS).size).toBe(5)
    expect(ACTIVATION_SELECTOR_PATHS).not.toContain(ACTIVATION_PROOF_PATH)
    const target = buildV119SelectorBytes()
    expect([...target.keys()].sort()).toEqual([...ACTIVATION_SELECTOR_PATHS].sort())
  })

  it("runs prepare through smoke with exact staging and external finalization binding", async () => {
    const adapter = new ModelAdapter()
    await throughValidate(adapter)
    await run(adapter, "stage")
    expect(await adapter.stagedPaths()).toEqual(
      [...ACTIVATION_SELECTOR_PATHS, ACTIVATION_PROOF_PATH].sort(),
    )
    await run(adapter, "commit")
    await run(adapter, "finalize")
    await run(adapter, "smoke")

    expect(adapter.currentHead).toBe(git("b"))
    expect(adapter.head.state).toBe("active-v1.19-finalized")
    expect(adapter.head.pendingIntent).toBeNull()
    expect(adapter.head.finalization).toMatchObject({
      activationId: "activation:phase260:plan31:test",
      commitSha: git("b"),
      treeSha: git("c"),
    })
    expect(adapter.events).toContain(`commit:${ACTIVATION_COMMIT_MESSAGE}`)
  })

  it("rejects an unrelated staged path and leaves the durable intent pending", async () => {
    const adapter = new ModelAdapter()
    await throughValidate(adapter)
    adapter.staged.add("unrelated.txt")
    await expect(run(adapter, "stage")).rejects.toThrow(/staged allowlist/iu)
    expect(adapter.head.state).toBe("pending-precommit")
  })

  it("keeps commit and finalization failures recoverable and makes exact commit recovery idempotent", async () => {
    const adapter = new ModelAdapter()
    await throughValidate(adapter)
    await run(adapter, "stage")
    adapter.failCommit = true
    await expect(run(adapter, "commit")).rejects.toThrow(/commit hook/iu)
    expect(adapter.head.state).toBe("pending-precommit")

    adapter.failCommit = false
    await run(adapter, "commit")
    adapter.failFinalize = true
    await expect(run(adapter, "finalize")).rejects.toThrow(/finalization/iu)
    expect(adapter.head.state).toBe("pending-precommit")
    adapter.failFinalize = false
    await run(adapter, "recover")
    await run(adapter, "recover")
    expect(adapter.head.state).toBe("active-v1.19-finalized")
  })

  it("restores and aborts an exact precommit crash but refuses an unrelated commit", async () => {
    const restored = new ModelAdapter()
    await run(restored, "prepare")
    await run(restored, "validate")
    await run(restored, "recover")
    expect(restored.head.state).toBe("active-v1.17-bootstrap")
    expect(restored.events).toContain("abort:forward")

    const mismatch = new ModelAdapter()
    await run(mismatch, "prepare")
    mismatch.commits.set(git("9"), {
      parent: mismatch.currentHead,
      tree: git("8"),
      files: new Map(mismatch.files),
    })
    mismatch.currentHead = git("9")
    await expect(run(mismatch, "recover")).rejects.toThrow(/unrelated|mismatch/iu)
    expect(mismatch.head.state).toBe("pending-precommit")
  })

  it("compensates a finalized smoke failure with a bound reverse commit", async () => {
    const adapter = new ModelAdapter()
    await throughValidate(adapter)
    await run(adapter, "stage")
    await run(adapter, "commit")
    await run(adapter, "finalize")
    adapter.failGate = "smoke"
    await expect(run(adapter, "smoke")).rejects.toThrow(/smoke/iu)
    adapter.failGate = null
    await run(adapter, "compensate")

    expect(adapter.head.state).toBe("active-v1.17-compensated")
    expect(adapter.head.compensation).toMatchObject({
      sourceActivationId: "activation:phase260:plan31:test",
      commitSha: git("d"),
      treeSha: git("e"),
    })
    expect(adapter.events).toContain(`commit:${COMPENSATION_COMMIT_MESSAGE}`)
  })

  it("serializes every mode under the coordinator lock", async () => {
    const adapter = new ModelAdapter()
    const spy = vi.spyOn(adapter, "withLock")
    await run(adapter, "prepare")
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
