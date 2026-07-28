import { Buffer } from "node:buffer"
import { execFile as execFileCallback } from "node:child_process"
import { createHash } from "node:crypto"
import {
  access,
  mkdtemp,
  mkdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { promisify } from "node:util"
import { describe, expect, it, vi } from "vitest"
import {
  ACTIVATION_COMMIT_MESSAGE,
  ACTIVATION_GATE_COMMANDS,
  ACTIVATION_PROOF_PATH,
  ACTIVATION_SELECTOR_PATHS,
  COMPENSATION_COMMIT_MESSAGE,
  PLAN14_ACTIVATION_ID,
  activationCandidateWorkspaceKey,
  buildCompensationActivationId,
  buildV119SelectorBytes,
  createProductionActivationAdapter,
  parseV137ObservationV119ActivationArgs,
  runV137ObservationV119Activation,
  type ActivationCoordinatorAdapter,
  type ActivationHead,
  type FileBytes,
  type GateReceipt,
} from "./activate-v1-37-observation-v1-19.js"

const execFile = promisify(execFileCallback)

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
  readonly preparedProofCommitments = new Map<string, `sha256:${string}`>()
  staged = new Set<string>()
  currentHead = git("a")
  head: ActivationHead
  failCommit = false
  failFinalize = false
  failGate: string | null = null
  failReinstall = false

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

  async withCandidateWorkspace<T>(
    _activationId: string,
    parentHead: string,
    operation: (candidate: ActivationCoordinatorAdapter) => Promise<T>,
  ): Promise<T> {
    this.events.push("candidate:create")
    const candidate = new ModelAdapter()
    candidate.files.clear()
    for (const [filePath, bytes] of this.commits.get(parentHead)!.files) {
      candidate.files.set(filePath, Buffer.from(bytes))
    }
    candidate.commits.clear()
    for (const [commit, value] of this.commits) {
      candidate.commits.set(commit, {
        parent: value.parent,
        tree: value.tree,
        files: new Map(
          [...value.files].map(([filePath, bytes]) => [
            filePath,
            Buffer.from(bytes),
          ]),
        ),
      })
    }
    candidate.currentHead = parentHead
    candidate.head = JSON.parse(JSON.stringify(this.head)) as ActivationHead
    candidate.failGate = this.failGate
    try {
      return await operation(candidate)
    } finally {
      this.events.push(...candidate.events.map((event) => `candidate:${event}`))
      this.events.push("candidate:remove")
    }
  }
  async cleanupCandidateWorkspace(_activationId: string): Promise<void> {
    this.events.push("candidate:cleanup")
  }
  async withLock<T>(operation: () => Promise<T>): Promise<T> {
    this.events.push("lock")
    return operation()
  }
  async readHead(): Promise<ActivationHead> {
    return JSON.parse(JSON.stringify(this.head)) as ActivationHead
  }
  async readPreparedProofCommitment(
    activationId: string,
  ): Promise<`sha256:${string}`> {
    const commitment = this.preparedProofCommitments.get(activationId)
    if (commitment === undefined) throw new Error("missing prepared commitment")
    return commitment
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
    if (input.direction === "forward") {
      this.preparedProofCommitments.set(
        input.activationId,
        input.proofPreimageRoot,
      )
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
        return (
          Buffer.compare(
            before ?? Buffer.alloc(0),
            after ?? Buffer.alloc(0),
          ) !== 0
        )
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
    if (this.failReinstall && this.head.state === "pending-precommit") {
      throw new Error("simulated post-prepare reinstall crash")
    }
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
  async unstage(paths: readonly string[]): Promise<void> {
    this.events.push("unstage")
    for (const path of paths) this.staged.delete(path)
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
      command: ACTIVATION_GATE_COMMANDS[id]!,
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
  it("parses every literal Plan 14 command directly and rejects a production argv bypass", async () => {
    for (const mode of [
      "prepare",
      "validate",
      "rollback-drill",
      "stage",
      "commit",
      "finalize",
      "smoke",
    ] as const) {
      const args = ["--mode", mode, "--activation-id", PLAN14_ACTIVATION_ID]
      expect(parseV137ObservationV119ActivationArgs(args)).toEqual({
        mode,
        activationId: PLAN14_ACTIVATION_ID,
      })
    }
    expect(() =>
      parseV137ObservationV119ActivationArgs([
        "--mode",
        "prepare",
        "--activation-id",
        PLAN14_ACTIVATION_ID,
        "--parse-only",
      ]),
    ).toThrow(/usage/iu)
    await expect(
      execFile(
        "pnpm",
        [
          "exec",
          "tsx",
          "scripts/activate-v1-37-observation-v1-19.ts",
          "--mode",
          "prepare",
          "--activation-id",
          PLAN14_ACTIVATION_ID,
          "--parse-only",
        ],
        { cwd: process.cwd() },
      ),
    ).rejects.toMatchObject({ stderr: expect.stringMatching(/usage/iu) })
  }, 30_000)

  it("uses a nonrecursive five-selector manifest and a separate proof output", () => {
    expect(ACTIVATION_SELECTOR_PATHS).toHaveLength(5)
    expect(new Set(ACTIVATION_SELECTOR_PATHS).size).toBe(5)
    expect(ACTIVATION_SELECTOR_PATHS).not.toContain(ACTIVATION_PROOF_PATH)
    const target = buildV119SelectorBytes()
    expect([...target.keys()].sort()).toEqual(
      [...ACTIVATION_SELECTOR_PATHS].sort(),
    )
  })

  it("uses the real filesystem and Git adapter in an isolated six-path commit", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "cowards-activation-"))
    try {
      await execFile("git", ["init", "-q"], { cwd: root })
      await execFile("git", ["config", "user.name", "Activation Test"], {
        cwd: root,
      })
      await execFile(
        "git",
        ["config", "user.email", "activation@test.invalid"],
        {
          cwd: root,
        },
      )
      for (const selectorPath of ACTIVATION_SELECTOR_PATHS) {
        const absolute = path.join(root, selectorPath)
        await mkdir(path.dirname(absolute), { recursive: true })
        await writeFile(absolute, `old:${selectorPath}\n`)
      }
      await execFile("git", ["add", "-A"], { cwd: root })
      await execFile("git", ["commit", "-q", "-m", "parent"], { cwd: root })

      const adapter = createProductionActivationAdapter(root, {} as never)
      const parent = await adapter.gitHead()
      for (const [selectorPath, bytes] of buildV119SelectorBytes()) {
        await adapter.writeFile(selectorPath, { state: "present", bytes })
      }
      await adapter.writeFile(ACTIVATION_PROOF_PATH, {
        state: "present",
        bytes: Buffer.from("{}\n"),
      })
      const paths = [...ACTIVATION_SELECTOR_PATHS, ACTIVATION_PROOF_PATH]
      await adapter.stage(paths)
      const commitSha = await adapter.commit(ACTIVATION_COMMIT_MESSAGE, paths)

      expect(await adapter.gitParent(commitSha)).toBe(parent)
      expect(await adapter.changedPaths(commitSha)).toEqual([...paths].sort())
      expect(
        (await adapter.readCommitFile(commitSha, ACTIVATION_PROOF_PATH)).state,
      ).toBe("present")
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it("runs an exact engine gate in a disposable clone without live-tree drift", async () => {
    const root = process.cwd()
    const activationId = "activation:phase260:plan31:candidate-engine-test"
    const cleanupLockClient = {
      query: vi.fn(async (sql: string) => ({
        rows: [
          sql.includes("pg_try_advisory_lock")
            ? { acquired: true }
            : { unlocked: true },
        ],
      })),
      release: vi.fn(),
    }
    const adapter = createProductionActivationAdapter(
      root,
      {
        connect: vi.fn(async () => cleanupLockClient),
      } as never,
    )
    const parentHead = await adapter.gitHead()
    const before = await execFile("git", ["status", "--porcelain=v1", "-z"], {
      cwd: root,
    })
    const receipts = await adapter.withCandidateWorkspace(
      activationId,
      parentHead,
      async (candidate) => ({
        engine: await candidate.runGate("engine"),
        protectedBaseline: await candidate.runGate("protected-baseline"),
      }),
    )
    expect(receipts.engine).toMatchObject({
      id: "engine",
      command: ACTIVATION_GATE_COMMANDS.engine,
      exitCode: 0,
    })
    expect(receipts.protectedBaseline).toMatchObject({
      id: "protected-baseline",
      command: ACTIVATION_GATE_COMMANDS["protected-baseline"],
      exitCode: 0,
    })
    const after = await execFile("git", ["status", "--porcelain=v1", "-z"], {
      cwd: root,
    })
    expect(after.stdout).toBe(before.stdout)
    await expect(
      access(
        path.join(
          root,
          ".git/cowards-activation-candidates",
          activationCandidateWorkspaceKey(activationId),
        ),
      ),
    ).rejects.toMatchObject({ code: "ENOENT" })
    expect(cleanupLockClient.release).toHaveBeenCalled()
  }, 120_000)

  it("resolves workspace dependencies inside the disposable candidate checkout", async () => {
    const root = process.cwd()
    const activationId =
      "activation:phase260:plan46:candidate-dependency-containment"
    const cleanupLockClient = {
      query: vi.fn(async (sql: string) => ({
        rows: [
          sql.includes("pg_try_advisory_lock")
            ? { acquired: true }
            : { unlocked: true },
        ],
      })),
      release: vi.fn(),
    }
    let candidateRoot = ""
    let candidateGolden = ""
    const liveGolden = await realpath(
      path.join(root, "apps/runtime-service/node_modules/@cowards/golden"),
    )
    const adapter = createProductionActivationAdapter(
      root,
      {
        connect: vi.fn(async () => cleanupLockClient),
      } as never,
      {
        gateProcessRunner: async (_command, _args, cwd) => {
          candidateRoot = cwd
          candidateGolden = await realpath(
            path.join(
              cwd,
              "apps/runtime-service/node_modules/@cowards/golden",
            ),
          )
          return { stdout: "candidate dependency contained", stderr: "" }
        },
      },
    )
    const parentHead = await adapter.gitHead()
    await adapter.withCandidateWorkspace(
      activationId,
      parentHead,
      async (candidate) => candidate.runGate("engine"),
    )

    expect(candidateRoot).not.toBe("")
    expect(candidateGolden).not.toBe(liveGolden)
    const relative = path.relative(candidateRoot, candidateGolden)
    expect(relative.startsWith("..")).toBe(false)
    expect(path.isAbsolute(relative)).toBe(false)
    await expect(
      access(
        path.join(
          root,
          ".git/cowards-activation-candidates",
          activationCandidateWorkspaceKey(activationId),
        ),
      ),
    ).rejects.toMatchObject({ code: "ENOENT" })
  }, 120_000)

  it("executes the exact runtime-service production gate", async () => {
    let executed = ""
    const adapter = createProductionActivationAdapter(
      process.cwd(),
      {} as never,
      {
        processRunner: async (command, args) => {
          executed = [command, ...args].join(" ")
          return { stdout: "exact runtime-service gate passed", stderr: "" }
        },
      },
    )
    const receipt = await adapter.runGate("runtime-service")
    expect(executed).toBe(
      "pnpm exec vitest run apps/runtime-service/src --maxWorkers=1",
    )
    expect(receipt.command).toBe(
      "pnpm exec vitest run apps/runtime-service/src --maxWorkers=1",
    )
    expect(receipt.exitCode).toBe(0)
  })

  it.each(["present", "absent"] as const)(
    "restores next-env.d.ts after build success and failure from a %s preimage",
    async (state) => {
      for (const fails of [false, true]) {
        const root = await mkdtemp(path.join(tmpdir(), "cowards-build-gate-"))
        const nextEnv = path.join(root, "apps/web/next-env.d.ts")
        try {
          if (state === "present") {
            await mkdir(path.dirname(nextEnv), { recursive: true })
            await writeFile(nextEnv, "original next env\n")
          }
          const adapter = createProductionActivationAdapter(root, {} as never, {
            processRunner: async (command, args) => {
              expect([command, ...args].join(" ")).toBe("pnpm build")
              await mkdir(path.dirname(nextEnv), { recursive: true })
              await writeFile(nextEnv, "rewritten by installed Next\n")
              if (fails) throw new Error("simulated build failure")
              return { stdout: "built", stderr: "" }
            },
          })
          if (fails) {
            await expect(adapter.runGate("build")).rejects.toThrow(
              /simulated build failure/iu,
            )
          } else {
            await expect(adapter.runGate("build")).resolves.toMatchObject({
              command: "pnpm build",
              exitCode: 0,
            })
          }
          if (state === "present") {
            expect(await readFile(nextEnv, "utf8")).toBe("original next env\n")
          } else {
            await expect(readFile(nextEnv)).rejects.toMatchObject({
              code: "ENOENT",
            })
          }
        } finally {
          await rm(root, { recursive: true, force: true })
        }
      }
    },
  )

  it("uses a bounded valid compensation ID for a maximum-length activation ID", () => {
    const source = `activation:${"x".repeat(160)}`
    const compensation = buildCompensationActivationId(source)
    expect(compensation).toMatch(/^compensation:[0-9a-f]{64}$/u)
    expect(compensation.length).toBeLessThanOrEqual(169)
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

  it("restores every pre-prepare gate failure with no pending and retries cleanly", async () => {
    const adapter = new ModelAdapter()
    adapter.failGate = "engine"
    await expect(run(adapter, "prepare")).rejects.toThrow(/gate failed/iu)
    expect(adapter.head.state).toBe("active-v1.17-bootstrap")
    expect(adapter.head.pendingIntent).toBeNull()
    expect(await adapter.stagedPaths()).toEqual([])
    expect(adapter.files.has(ACTIVATION_PROOF_PATH)).toBe(false)
    for (const selectorPath of ACTIVATION_SELECTOR_PATHS) {
      expect(Buffer.from(adapter.files.get(selectorPath)!).toString()).toBe(
        `old:${selectorPath}\n`,
      )
    }
    adapter.failGate = null
    await expect(run(adapter, "prepare")).resolves.toMatchObject({
      state: "pending-precommit",
    })
  })

  it("leaves a post-prepare reinstall crash pending for exact recovery and retry", async () => {
    const adapter = new ModelAdapter()
    adapter.failReinstall = true
    await expect(run(adapter, "prepare")).rejects.toThrow(/reinstall crash/iu)
    expect(adapter.head.state).toBe("pending-precommit")
    adapter.failReinstall = false
    await run(adapter, "recover")
    expect(adapter.head.state).toBe("active-v1.17-bootstrap")
    await expect(run(adapter, "prepare")).resolves.toMatchObject({
      state: "pending-precommit",
    })
  })

  it("rejects an unrelated staged path and leaves the durable intent pending", async () => {
    const adapter = new ModelAdapter()
    await throughValidate(adapter)
    adapter.staged.add("unrelated.txt")
    await expect(run(adapter, "stage")).rejects.toThrow(/staged allowlist/iu)
    expect(adapter.head.state).toBe("pending-precommit")
  })

  it("rejects a changed parent, a concurrent activation token, and mixed selector bytes", async () => {
    const changedParent = new ModelAdapter()
    await run(changedParent, "prepare")
    changedParent.currentHead = git("9")
    await expect(run(changedParent, "validate")).rejects.toThrow(
      /parent HEAD changed/iu,
    )

    const concurrent = new ModelAdapter()
    await run(concurrent, "prepare")
    await expect(
      runV137ObservationV119Activation({
        mode: "prepare",
        activationId: "activation:phase260:plan31:other",
        adapter: concurrent,
      }),
    ).rejects.toThrow(/exact forward pending intent/iu)

    const mixed = new ModelAdapter()
    await throughValidate(mixed)
    mixed.files.set(ACTIVATION_SELECTOR_PATHS[2], Buffer.from("mixed\n"))
    await expect(run(mixed, "stage")).rejects.toThrow(/mixed|stale selector/iu)
    expect(mixed.head.state).toBe("pending-precommit")
  })

  it("rejects forged commands and well-formed receipt mutations through the durable commitment", async () => {
    for (const mutate of [
      (proof: Record<string, any>) => {
        proof.validationReceipts[0].command = "test:spec"
      },
      (proof: Record<string, any>) => {
        proof.validationReceipts[0].stdoutSha256 = hash(
          "arbitrary well-formed stdout",
        )
      },
      (proof: Record<string, any>) => {
        proof.validationReceipts[0].completedAt = "2037-01-01T00:00:00.000Z"
      },
      (proof: Record<string, any>) => {
        proof.rollbackReceipt.command = "test:rollback-by-declaration"
      },
      (proof: Record<string, any>) => {
        proof.preimage[0].sha256 = hash("forged preimage")
      },
    ]) {
      const adapter = new ModelAdapter()
      await throughValidate(adapter)
      const proof = JSON.parse(
        Buffer.from(adapter.files.get(ACTIVATION_PROOF_PATH)!).toString("utf8"),
      ) as Record<string, any>
      mutate(proof)
      adapter.files.set(
        ACTIVATION_PROOF_PATH,
        Buffer.from(`${JSON.stringify(proof, null, 2)}\n`),
      )
      await expect(run(adapter, "stage")).rejects.toThrow(/proof/iu)
    }
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

  it("refuses to finalize a six-path commit with a tampered selector", async () => {
    const adapter = new ModelAdapter()
    await throughValidate(adapter)
    await run(adapter, "stage")
    await run(adapter, "commit")
    adapter.commits
      .get(adapter.currentHead)!
      .files.set(ACTIVATION_SELECTOR_PATHS[0], Buffer.from("tampered\n"))
    await expect(run(adapter, "recover")).rejects.toThrow(
      /committed selector mismatch/iu,
    )
    expect(adapter.head.state).toBe("pending-precommit")
  })

  it("restores and aborts an exact precommit crash but refuses an unrelated commit", async () => {
    const restored = new ModelAdapter()
    await run(restored, "prepare")
    await run(restored, "validate")
    await run(restored, "rollback-drill")
    await run(restored, "stage")
    await run(restored, "recover")
    expect(restored.head.state).toBe("active-v1.17-bootstrap")
    expect(restored.events).toContain("abort:forward")
    expect(await restored.stagedPaths()).toEqual([])

    const mismatch = new ModelAdapter()
    await run(mismatch, "prepare")
    mismatch.commits.set(git("9"), {
      parent: mismatch.currentHead,
      tree: git("8"),
      files: new Map([
        ...mismatch.files,
        ["unrelated.txt", Buffer.from("unrelated\n")],
      ]),
    })
    mismatch.currentHead = git("9")
    await expect(run(mismatch, "recover")).rejects.toThrow(
      /unrelated|mismatch/iu,
    )
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

  it("recovers an exact committed-but-unfinalized compensation", async () => {
    const adapter = new ModelAdapter()
    await throughValidate(adapter)
    await run(adapter, "stage")
    await run(adapter, "commit")
    await run(adapter, "finalize")
    adapter.failFinalize = true
    await expect(run(adapter, "compensate")).rejects.toThrow(/finalization/iu)
    expect(adapter.head.state).toBe("pending-compensation")
    adapter.failFinalize = false
    await run(adapter, "recover")
    expect(adapter.head.state).toBe("active-v1.17-compensated")
    expect(adapter.head.compensation?.commitSha).toBe(git("d"))
  })

  it("rejects forged reverse manifest and activation-preimage intent bindings", async () => {
    for (const mutate of [
      (adapter: ModelAdapter) => {
        const pendingIntent = JSON.parse(
          JSON.stringify(adapter.head.pendingIntent),
        ) as any
        pendingIntent.selectorManifest[0].sha256 = hash(
          "forged reverse manifest",
        )
        adapter.head = { ...adapter.head, pendingIntent }
      },
      (adapter: ModelAdapter) => {
        adapter.head = {
          ...adapter.head,
          pendingIntent: {
            ...adapter.head.pendingIntent!,
            proofPreimageRoot: hash("forged activation snapshot"),
          },
        }
      },
    ]) {
      const adapter = new ModelAdapter()
      await throughValidate(adapter)
      await run(adapter, "stage")
      await run(adapter, "commit")
      await run(adapter, "finalize")
      adapter.failFinalize = true
      await expect(run(adapter, "compensate")).rejects.toThrow(/finalization/iu)
      adapter.failFinalize = false
      mutate(adapter)
      await expect(run(adapter, "recover")).rejects.toThrow(
        /reverse pending (selector manifest|activation preimage) mismatch/iu,
      )
      expect(adapter.head.state).toBe("pending-compensation")
    }
  })

  it("rejects wrong tokens for pending reverse and terminal idempotence", async () => {
    const finalized = new ModelAdapter()
    await throughValidate(finalized)
    await run(finalized, "stage")
    await run(finalized, "commit")
    await run(finalized, "finalize")
    await expect(
      runV137ObservationV119Activation({
        mode: "recover",
        activationId: "activation:phase260:wrong",
        adapter: finalized,
      }),
    ).rejects.toThrow(/token mismatch/iu)

    finalized.failFinalize = true
    await expect(run(finalized, "compensate")).rejects.toThrow(/finalization/iu)
    finalized.failFinalize = false
    await expect(
      runV137ObservationV119Activation({
        mode: "recover",
        activationId: "activation:phase260:wrong",
        adapter: finalized,
      }),
    ).rejects.toThrow(/source activation token mismatch/iu)
  })

  it("refuses a compensation commit that does not restore the parent bytes", async () => {
    const adapter = new ModelAdapter()
    await throughValidate(adapter)
    await run(adapter, "stage")
    await run(adapter, "commit")
    await run(adapter, "finalize")
    adapter.failFinalize = true
    await expect(run(adapter, "compensate")).rejects.toThrow(/finalization/iu)
    adapter.commits
      .get(adapter.currentHead)!
      .files.set(ACTIVATION_SELECTOR_PATHS[1], Buffer.from("wrong restore\n"))
    adapter.failFinalize = false
    await expect(run(adapter, "recover")).rejects.toThrow(
      /compensation recovery commit mismatch/iu,
    )
    expect(adapter.head.state).toBe("pending-compensation")
  })

  it("serializes every mode under the coordinator lock", async () => {
    const adapter = new ModelAdapter()
    const spy = vi.spyOn(adapter, "withLock")
    await run(adapter, "prepare")
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
