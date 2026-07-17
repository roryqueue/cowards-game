import { Buffer } from "node:buffer"
import { execFile, spawn } from "node:child_process"
import { createHash, randomUUID } from "node:crypto"
import { once } from "node:events"
import { createRequire } from "node:module"
import {
  access,
  chmod,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { setTimeout as delay } from "node:timers/promises"
import { promisify } from "node:util"
import { afterAll, describe, expect, it } from "vitest"
import {
  ACTIVATION_GATE_COMMANDS,
  ACTIVATION_PROOF_PATH,
  ACTIVATION_SELECTOR_PATHS,
  ACTIVATION_VALIDATION_GATE_IDS,
  activationCandidateWorkspaceKey,
  createProductionActivationAdapter,
  hashActivationPathDigests,
  hashActivationProofCommitment,
  runV137ObservationV119Activation,
  type ActivationCoordinatorAdapter,
  type Sha256,
} from "./activate-v1-37-observation-v1-19.js"
import {
  collectV137ObservationV119PostactivationEvidence,
  validateV137ObservationV119PostactivationEvidence,
} from "./evaluate-v1-37-observation-v1-19-postactivation.js"

const runFile = promisify(execFile)
const databaseUrl = process.env.DATABASE_URL
const describePostgres = databaseUrl === undefined ? describe.skip : describe
type PoolType = Parameters<typeof createProductionActivationAdapter>[1]
const requireFromPersistence = createRequire(
  new URL("../packages/persistence/package.json", import.meta.url),
)
const { Pool } = requireFromPersistence("pg") as {
  Pool: new (config: Record<string, unknown>) => PoolType
}

const sha256 = (value: string | Uint8Array): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

interface IsolatedContext {
  root: string
  schema: string
  pool: PoolType
  adapter: ActivationCoordinatorAdapter
  activationId: string
  gateFailure: { id: string | null }
}

const contexts: IsolatedContext[] = []

const initializeGit = async (root: string): Promise<void> => {
  await runFile("git", ["init", "-q"], { cwd: root })
  await runFile("git", ["config", "user.name", "Activation Integration"], {
    cwd: root,
  })
  await runFile(
    "git",
    ["config", "user.email", "activation-integration@test.invalid"],
    { cwd: root },
  )
  for (const selectorPath of ACTIVATION_SELECTOR_PATHS) {
    const absolute = path.join(root, selectorPath)
    await mkdir(path.dirname(absolute), { recursive: true })
    await writeFile(absolute, `old:${selectorPath}\n`)
  }
  await runFile("git", ["add", "-A"], { cwd: root })
  await runFile("git", ["commit", "-q", "-m", "isolated parent"], {
    cwd: root,
  })
}

const initializeSchema = async (
  admin: PoolType,
  schema: string,
): Promise<void> => {
  await admin.query(`create schema ${schema}`)
  await admin.query(
    `create table ${schema}.semantic_authority_selection_head
       (like public.semantic_authority_selection_head including all)`,
  )
  await admin.query(
    `create table ${schema}.semantic_authority_selection_history
       (like public.semantic_authority_selection_history including all)`,
  )
  await admin.query(
    `insert into ${schema}.semantic_authority_selection_head
     select * from public.semantic_authority_selection_head`,
  )
  await admin.query(
    `insert into ${schema}.semantic_authority_selection_history (
       transition_kind, state, revision, activation_id, active_selection,
       active_selection_root, pending_intent, finalization, compensation,
       created_at
     ) select transition_kind, state, revision, activation_id, active_selection,
              active_selection_root, pending_intent, finalization, compensation,
              created_at
         from public.semantic_authority_selection_history
        where transition_kind = 'bootstrap'
        order by sequence limit 1`,
  )
}

const createContext = async (label: string): Promise<IsolatedContext> => {
  const root = await mkdtemp(path.join(tmpdir(), `cowards-${label}-`))
  await initializeGit(root)
  const schema = `activation_${randomUUID().replaceAll("-", "_")}`
  const admin = new Pool({ connectionString: databaseUrl })
  try {
    await initializeSchema(admin, schema)
  } finally {
    await admin.end()
  }
  const pool = new Pool({
    connectionString: databaseUrl,
    options: `-c search_path=${schema},public`,
  })
  const gateFailure = { id: null as string | null }
  const production = createProductionActivationAdapter(root, pool, {
    gateProcessRunner: async (command, args) => {
      const commandText = [command, ...args].join(" ")
      const id = Object.entries(ACTIVATION_GATE_COMMANDS).find(
        ([, expected]) => expected === commandText,
      )?.[0]
      if (id === undefined)
        throw new Error(`Unknown gate command ${commandText}`)
      if (gateFailure.id === id)
        throw new Error(`real adapter gate failure: ${id}`)
      if (id === "rollback" || ACTIVATION_VALIDATION_GATE_IDS.includes(id)) {
        const head = await production.readHead()
        if (
          head.state === "pending-precommit" ||
          head.state === "pending-compensation"
        ) {
          throw new Error(`Gate ${id} observed a premature pending intent`)
        }
      }
      return {
        stdout: `isolated stdout:${id}`,
        stderr: `isolated stderr:${id}`,
      }
    },
    now: () => new Date("2026-07-17T12:00:00.000Z"),
  })
  const adapter: ActivationCoordinatorAdapter = production
  const context = {
    root,
    schema,
    pool,
    adapter,
    activationId: `activation:phase260:plan31:integration:${label}`,
    gateFailure,
  }
  contexts.push(context)
  return context
}

const run = (
  context: IsolatedContext,
  mode: Parameters<typeof runV137ObservationV119Activation>[0]["mode"],
) =>
  runV137ObservationV119Activation({
    mode,
    activationId: context.activationId,
    adapter: context.adapter,
  })

const waitForFile = async (filePath: string): Promise<void> => {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    try {
      await access(filePath)
      return
    } catch {
      await delay(50)
    }
  }
  throw new Error(`Timed out waiting for ${filePath}`)
}

const createFakePnpm = async (root: string): Promise<string> => {
  const bin = path.join(root, "bin")
  await mkdir(bin, { recursive: true })
  const executable = path.join(bin, "pnpm")
  await writeFile(
    executable,
    `#!/usr/bin/env node
const { spawn } = require("node:child_process")
const { renameSync, writeFileSync } = require("node:fs")
const writeMarker = (value) => {
  const temporary = process.env.TEST_GATE_MARKER + ".tmp-" + process.pid
  writeFileSync(temporary, JSON.stringify(value) + "\\n")
  renameSync(temporary, process.env.TEST_GATE_MARKER)
}
if (process.env.TEST_GATE_BEHAVIOR === "exit") {
  writeMarker({ gatePid: process.pid, childPid: null })
  process.stdout.write("supervised gate complete\\n")
  process.exit(0)
}
const child = spawn(process.execPath, ["--eval", "setInterval(() => {}, 1000)"], { stdio: "ignore" })
writeMarker({ gatePid: process.pid, childPid: child.pid })
setInterval(() => {}, 1000)
`,
  )
  await chmod(executable, 0o755)
  return bin
}

const processRows = async (pids: readonly number[]): Promise<string> => {
  try {
    return (
      await runFile(
        "ps",
        ["-o", "pid=,ppid=,pgid=,command=", "-p", pids.join(",")],
        { maxBuffer: 1024 * 1024 },
      )
    ).stdout.trim()
  } catch (error) {
    if ((error as { code?: number }).code === 1) return ""
    throw error
  }
}

const waitForProcessesToExit = async (
  pids: readonly number[],
): Promise<void> => {
  for (let attempt = 0; attempt < 400; attempt += 1) {
    if ((await processRows(pids)) === "") return
    await delay(25)
  }
  throw new Error(`Processes remained alive: ${await processRows(pids)}`)
}

const waitForPathToDisappear = async (filePath: string): Promise<void> => {
  for (let attempt = 0; attempt < 400; attempt += 1) {
    try {
      await access(filePath)
      await delay(25)
    } catch (error) {
      if ((error as { code?: string }).code === "ENOENT") return
      throw error
    }
  }
  const entries = await readdir(filePath)
  throw new Error(
    `Path remained present: ${filePath} (${entries.join(", ") || "empty"})`,
  )
}

const throughCommit = async (context: IsolatedContext): Promise<void> => {
  for (const mode of [
    "prepare",
    "validate",
    "rollback-drill",
    "stage",
    "commit",
  ] as const) {
    await run(context, mode)
  }
}

afterAll(async () => {
  for (const context of contexts.reverse()) {
    await context.pool.end()
    const admin = new Pool({ connectionString: databaseUrl })
    try {
      await admin.query(`drop schema if exists ${context.schema} cascade`)
    } finally {
      await admin.end()
    }
    await rm(context.root, { recursive: true, force: true })
  }
})

describePostgres(
  "production activation adapter with isolated real Git and PostgreSQL",
  () => {
    it("finalizes and compensates without touching the development head", async () => {
      const admin = new Pool({ connectionString: databaseUrl })
      const before = await admin.query(
        "select state, revision, active_selection_root, pending_intent from public.semantic_authority_selection_head",
      )
      await admin.end()
      const context = await createContext("compensate")
      await throughCommit(context)
      await run(context, "finalize")
      expect((await context.adapter.readHead()).state).toBe(
        "active-v1.19-finalized",
      )
      const activationHead = await context.adapter.readHead()
      const proofFile = await context.adapter.readCommitFile(
        activationHead.finalization!.commitSha,
        ACTIVATION_PROOF_PATH,
      )
      expect(proofFile.state).toBe("present")
      if (proofFile.state === "present") {
        const proof = JSON.parse(Buffer.from(proofFile.bytes).toString()) as {
          preimage: Array<{
            path: string
            state: "present" | "absent"
            sha256?: Sha256
          }>
        }
        expect(
          await context.adapter.readPreparedProofCommitment(
            context.activationId,
          ),
        ).toBe(
          hashActivationProofCommitment(
            hashActivationPathDigests(proof.preimage),
            sha256(proofFile.bytes),
          ),
        )
      }
      expect(
        validateV137ObservationV119PostactivationEvidence(
          await collectV137ObservationV119PostactivationEvidence(
            context.adapter,
            context.activationId,
          ),
        ).status,
      ).toBe("passed")
      await run(context, "compensate")
      const compensated = await context.adapter.readHead()
      expect(compensated.state).toBe("active-v1.17-compensated")
      expect(compensated.compensation?.sourceActivationId).toBe(
        context.activationId,
      )
      expect(
        await context.adapter.readCommitFile(
          await context.adapter.gitHead(),
          ACTIVATION_PROOF_PATH,
        ),
      ).toEqual({ state: "absent" })
      const afterAdmin = new Pool({ connectionString: databaseUrl })
      const after = await afterAdmin.query(
        "select state, revision, active_selection_root, pending_intent from public.semantic_authority_selection_head",
      )
      await afterAdmin.end()
      expect(after.rows).toEqual(before.rows)
    }, 30_000)

    it("recovers an exact committed-but-unfinalized activation", async () => {
      const context = await createContext("recover")
      await throughCommit(context)
      expect((await context.adapter.readHead()).state).toBe("pending-precommit")
      await run(context, "recover")
      expect((await context.adapter.readHead()).state).toBe(
        "active-v1.19-finalized",
      )
    }, 30_000)

    it("restores files, index, and database on staged precommit abort", async () => {
      const context = await createContext("abort")
      for (const mode of [
        "prepare",
        "validate",
        "rollback-drill",
        "stage",
      ] as const) {
        await run(context, mode)
      }
      await run(context, "recover")
      const head = await context.adapter.readHead()
      expect(head.state).toBe("active-v1.17-bootstrap")
      expect(head.revision).toBe(2)
      expect(head.pendingIntent).toBeNull()
      expect(await context.adapter.stagedPaths()).toEqual([])
      for (const selectorPath of ACTIVATION_SELECTOR_PATHS) {
        const file = await context.adapter.readFile(selectorPath)
        expect(file.state).toBe("present")
        if (file.state === "present") {
          expect(Buffer.from(file.bytes).toString("utf8")).toBe(
            `old:${selectorPath}\n`,
          )
        }
      }
    }, 30_000)

    it("rejects a forged durable reverse preimage in an isolated PostgreSQL intent", async () => {
      const context = await createContext("forged-reverse-intent")
      await throughCommit(context)
      await run(context, "finalize")
      const production = context.adapter
      let failReverseFinalize = true
      context.adapter = {
        ...production,
        async finalize(input) {
          if (input.direction === "reverse" && failReverseFinalize) {
            throw new Error("simulated reverse finalization crash")
          }
          return production.finalize(input)
        },
      }
      await expect(run(context, "compensate")).rejects.toThrow(
        /reverse finalization crash/iu,
      )
      expect((await context.adapter.readHead()).state).toBe(
        "pending-compensation",
      )
      await context.pool.query(
        `update semantic_authority_selection_head
            set pending_intent = jsonb_set(
              pending_intent,
              '{proofPreimageRoot}',
              to_jsonb($1::text),
              false
            )
          where singleton = true`,
        [sha256("forged production activation snapshot")],
      )
      failReverseFinalize = false
      await expect(run(context, "recover")).rejects.toThrow(
        /reverse pending activation preimage mismatch/iu,
      )
      expect((await context.adapter.readHead()).state).toBe(
        "pending-compensation",
      )
    }, 30_000)

    it("restores a real pre-prepare gate failure without creating pending state", async () => {
      const context = await createContext("failed-pre-prepare-gate")
      context.gateFailure.id = "engine"
      await expect(run(context, "prepare")).rejects.toThrow(
        /real adapter gate failure/iu,
      )
      expect((await context.adapter.readHead()).state).toBe(
        "active-v1.17-bootstrap",
      )
      expect(await context.adapter.stagedPaths()).toEqual([])
      expect(await context.adapter.readFile(ACTIVATION_PROOF_PATH)).toEqual({
        state: "absent",
      })
      for (const selectorPath of ACTIVATION_SELECTOR_PATHS) {
        const file = await context.adapter.readFile(selectorPath)
        expect(file.state).toBe("present")
        if (file.state === "present") {
          expect(Buffer.from(file.bytes).toString()).toBe(
            `old:${selectorPath}\n`,
          )
        }
      }
    }, 30_000)

    it("cleans the watchdog lease after a normally exiting production gate", async () => {
      const context = await createContext("normal-gate-supervisor")
      const markerRoot = await mkdtemp(
        path.join(tmpdir(), "cowards-normal-gate-"),
      )
      const marker = path.join(markerRoot, "gate-complete")
      const fakeBin = await createFakePnpm(markerRoot)
      const leaseDirectory = path.join(
        context.root,
        ".git",
        "cowards-activation-gate-leases",
      )
      try {
        const adapter = createProductionActivationAdapter(
          context.root,
          context.pool,
          {
            activationId: context.activationId,
            gateEnvironment: {
              ...process.env,
              PATH: `${fakeBin}:${process.env.PATH ?? ""}`,
              TEST_GATE_BEHAVIOR: "exit",
              TEST_GATE_MARKER: marker,
            },
          },
        )
        await expect(adapter.runGate("spec")).resolves.toMatchObject({
          id: "spec",
          exitCode: 0,
        })
        expect(JSON.parse(await readFile(marker, "utf8"))).toMatchObject({
          childPid: null,
        })
        await expect(access(leaseDirectory)).rejects.toMatchObject({
          code: "ENOENT",
        })
      } finally {
        await rm(markerRoot, { recursive: true, force: true })
      }
    }, 30_000)

    it("kills the exact current gate group when its supervisor exits unexpectedly", async () => {
      const context = await createContext("unexpected-supervisor-exit")
      const markerRoot = await mkdtemp(
        path.join(tmpdir(), "cowards-supervisor-exit-"),
      )
      const marker = path.join(markerRoot, "gate-started")
      const fakeBin = await createFakePnpm(markerRoot)
      const leaseDirectory = path.join(
        context.root,
        ".git",
        "cowards-activation-gate-leases",
      )
      let supervisorPid: number | undefined
      let launcherPid: number | undefined
      let gatePid: number | undefined
      let gateChildPid: number | undefined
      try {
        const adapter = createProductionActivationAdapter(
          context.root,
          context.pool,
          {
            activationId: context.activationId,
            gateEnvironment: {
              ...process.env,
              PATH: `${fakeBin}:${process.env.PATH ?? ""}`,
              TEST_GATE_BEHAVIOR: "hang",
              TEST_GATE_MARKER: marker,
            },
          },
        )
        const gateResult = adapter.runGate("spec")
        const gateRejection = expect(gateResult).rejects.toThrow(
          /supervisor exited unexpectedly/iu,
        )
        await waitForFile(marker)
        const markerValue = JSON.parse(await readFile(marker, "utf8")) as {
          gatePid: number
          childPid: number
        }
        gatePid = markerValue.gatePid
        gateChildPid = markerValue.childPid
        const leases = await readdir(leaseDirectory)
        expect(leases).toHaveLength(1)
        const lease = JSON.parse(
          await readFile(path.join(leaseDirectory, leases[0]!), "utf8"),
        ) as { supervisorPid: number; processGroupId: number }
        supervisorPid = lease.supervisorPid
        launcherPid = lease.processGroupId
        expect(launcherPid).not.toBe(gatePid)
        process.kill(supervisorPid, "SIGKILL")
        await gateRejection
        await waitForProcessesToExit([launcherPid, gatePid, gateChildPid])
        await expect(access(leaseDirectory)).rejects.toMatchObject({
          code: "ENOENT",
        })
      } finally {
        for (const pid of [supervisorPid, launcherPid, gatePid, gateChildPid]) {
          if (pid === undefined) continue
          try {
            process.kill(pid, "SIGKILL")
          } catch {
            continue
          }
        }
        await rm(markerRoot, { recursive: true, force: true })
      }
    }, 30_000)

    it("ignores an adversarial disk PGID and terminates only the IPC-registered group", async () => {
      const context = await createContext("adversarial-gate-lease")
      const markerRoot = await mkdtemp(
        path.join(tmpdir(), "cowards-adversarial-lease-"),
      )
      const marker = path.join(markerRoot, "gate-started")
      const fakeBin = await createFakePnpm(markerRoot)
      const leaseDirectory = path.join(
        context.root,
        ".git",
        "cowards-activation-gate-leases",
      )
      const unrelated = spawn(
        process.execPath,
        ["--eval", "setInterval(() => {}, 1000)"],
        { detached: true, stdio: "ignore" },
      )
      const unrelatedExit = once(unrelated, "exit")
      let supervisorPid: number | undefined
      let launcherPid: number | undefined
      let gatePid: number | undefined
      let gateChildPid: number | undefined
      try {
        const adapter = createProductionActivationAdapter(
          context.root,
          context.pool,
          {
            activationId: context.activationId,
            gateEnvironment: {
              ...process.env,
              PATH: `${fakeBin}:${process.env.PATH ?? ""}`,
              TEST_GATE_BEHAVIOR: "hang",
              TEST_GATE_MARKER: marker,
            },
          },
        )
        const gateResult = adapter.runGate("spec")
        const gateRejection = expect(gateResult).rejects.toThrow(
          /supervisor exited unexpectedly/iu,
        )
        await waitForFile(marker)
        const markerValue = JSON.parse(await readFile(marker, "utf8")) as {
          gatePid: number
          childPid: number
        }
        gatePid = markerValue.gatePid
        gateChildPid = markerValue.childPid
        const [leaseName] = await readdir(leaseDirectory)
        const leasePath = path.join(leaseDirectory, leaseName!)
        const lease = JSON.parse(await readFile(leasePath, "utf8")) as {
          supervisorPid: number
          processGroupId: number
          gatePid: number
          [key: string]: unknown
        }
        supervisorPid = lease.supervisorPid
        launcherPid = lease.processGroupId
        await writeFile(
          leasePath,
          `${JSON.stringify({
            ...lease,
            gatePid: unrelated.pid,
            processGroupId: unrelated.pid,
          })}\n`,
        )
        process.kill(supervisorPid, "SIGKILL")
        await gateRejection
        await waitForProcessesToExit([launcherPid, gatePid, gateChildPid])
        expect(await processRows([unrelated.pid!])).not.toBe("")
        await expect(access(leaseDirectory)).rejects.toMatchObject({
          code: "ENOENT",
        })
      } finally {
        for (const pid of [supervisorPid, launcherPid, gatePid, gateChildPid]) {
          if (pid === undefined) continue
          try {
            process.kill(pid, "SIGKILL")
          } catch {
            continue
          }
        }
        if (unrelated.exitCode === null && unrelated.signalCode === null) {
          unrelated.kill("SIGKILL")
          await unrelatedExit
        }
        await rm(markerRoot, { recursive: true, force: true })
        await rm(leaseDirectory, { recursive: true, force: true })
      }
    }, 30_000)

    it.each([
      "after-starting-lease-temp",
      "before-launcher-spawn",
      "after-launcher-spawn",
      "before-coordinator-ack",
      "after-coordinator-ack",
      "before-active-lease",
      "after-active-lease",
    ])(
      "leaves no process or lease when the coordinator dies at %s",
      async (boundary) => {
        const context = await createContext(`registration-${boundary}`)
        const markerRoot = await mkdtemp(
          path.join(tmpdir(), "cowards-registration-boundary-"),
        )
        const commandMarker = path.join(markerRoot, "command-started")
        const fakeBin = await createFakePnpm(markerRoot)
        const reached = path.join(markerRoot, `${boundary}.reached`)
        const leaseDirectory = path.join(
          context.root,
          ".git",
          "cowards-activation-gate-leases",
        )
        const childSource = `
          import path from "node:path";
          import { pathToFileURL } from "node:url";
          const activation = await import(
            pathToFileURL(path.join(process.env.TEST_MODULE_ROOT, "scripts/activate-v1-37-observation-v1-19.ts")).href
          );
          const adapter = activation.createProductionActivationAdapter(
            process.env.TEST_REPO_ROOT,
            {},
            {
              activationId: process.env.TEST_ACTIVATION_ID,
              gateSupervisionTestBoundary: process.env.TEST_BOUNDARY,
              gateSupervisionTestControlDirectory: process.env.TEST_CONTROL_ROOT,
            },
          );
          await adapter.runGate("spec");
        `
        const childEnvironment = Object.fromEntries(
          Object.entries(process.env).filter(
            ([key]) => !key.startsWith("VITEST"),
          ),
        )
        const child = spawn(
          process.execPath,
          ["--import", "tsx", "--eval", childSource],
          {
            cwd: process.cwd(),
            env: {
              ...childEnvironment,
              TEST_MODULE_ROOT: process.cwd(),
              TEST_REPO_ROOT: context.root,
              TEST_ACTIVATION_ID: context.activationId,
              TEST_BOUNDARY: boundary,
              TEST_CONTROL_ROOT: markerRoot,
              TEST_GATE_BEHAVIOR: "hang",
              TEST_GATE_MARKER: commandMarker,
              PATH: `${fakeBin}:${childEnvironment.PATH ?? ""}`,
            },
            stdio: ["ignore", "pipe", "pipe"],
          },
        )
        const exited = once(child, "exit") as Promise<
          [number | null, string | null]
        >
        try {
          await waitForFile(reached)
          const boundaryState = JSON.parse(await readFile(reached, "utf8")) as {
            supervisorPid: number
            launcherPid: number | null
          }
          child.kill("SIGKILL")
          const [, signal] = await exited
          expect(signal).toBe("SIGKILL")
          await waitForProcessesToExit(
            [boundaryState.supervisorPid, boundaryState.launcherPid].filter(
              (pid): pid is number => pid !== null,
            ),
          )
          await waitForPathToDisappear(leaseDirectory)
          await expect(access(commandMarker)).rejects.toMatchObject({
            code: "ENOENT",
          })
          expect(
            (
              await runFile("git", ["status", "--porcelain"], {
                cwd: context.root,
              })
            ).stdout,
          ).toBe("")
          await expect(run(context, "recover")).resolves.toMatchObject({
            state: "active-v1.17-bootstrap",
          })
        } finally {
          if (child.exitCode === null && child.signalCode === null) {
            child.kill("SIGKILL")
            await exited
          }
          await rm(markerRoot, { recursive: true, force: true })
          await rm(leaseDirectory, { recursive: true, force: true })
        }
      },
      30_000,
    )

    it.each([
      "before-launcher-spawn",
      "after-launcher-spawn",
      "before-coordinator-ack",
      "after-coordinator-ack",
      "before-active-lease",
      "after-active-lease",
    ])(
      "leaves no process or lease when the supervisor dies at %s",
      async (boundary) => {
        const context = await createContext(`supervisor-death-${boundary}`)
        const markerRoot = await mkdtemp(
          path.join(tmpdir(), "cowards-supervisor-boundary-"),
        )
        const commandMarker = path.join(markerRoot, "command-started")
        const fakeBin = await createFakePnpm(markerRoot)
        const reached = path.join(markerRoot, `${boundary}.reached`)
        const leaseDirectory = path.join(
          context.root,
          ".git",
          "cowards-activation-gate-leases",
        )
        const childSource = `
          import path from "node:path";
          import { pathToFileURL } from "node:url";
          const activation = await import(
            pathToFileURL(path.join(process.env.TEST_MODULE_ROOT, "scripts/activate-v1-37-observation-v1-19.ts")).href
          );
          const adapter = activation.createProductionActivationAdapter(
            process.env.TEST_REPO_ROOT,
            {},
            {
              activationId: process.env.TEST_ACTIVATION_ID,
              gateSupervisionTestBoundary: process.env.TEST_BOUNDARY,
              gateSupervisionTestControlDirectory: process.env.TEST_CONTROL_ROOT,
            },
          );
          await adapter.runGate("spec");
        `
        const childEnvironment = Object.fromEntries(
          Object.entries(process.env).filter(
            ([key]) => !key.startsWith("VITEST"),
          ),
        )
        const child = spawn(
          process.execPath,
          ["--import", "tsx", "--eval", childSource],
          {
            cwd: process.cwd(),
            env: {
              ...childEnvironment,
              TEST_MODULE_ROOT: process.cwd(),
              TEST_REPO_ROOT: context.root,
              TEST_ACTIVATION_ID: context.activationId,
              TEST_BOUNDARY: boundary,
              TEST_CONTROL_ROOT: markerRoot,
              TEST_GATE_BEHAVIOR: "hang",
              TEST_GATE_MARKER: commandMarker,
              PATH: `${fakeBin}:${childEnvironment.PATH ?? ""}`,
            },
            stdio: ["ignore", "pipe", "pipe"],
          },
        )
        const exited = once(child, "exit") as Promise<
          [number | null, string | null]
        >
        try {
          await waitForFile(reached)
          const boundaryState = JSON.parse(await readFile(reached, "utf8")) as {
            supervisorPid: number
            launcherPid: number | null
          }
          process.kill(boundaryState.supervisorPid, "SIGKILL")
          const [code, signal] = await exited
          expect(signal).toBeNull()
          expect(code).not.toBe(0)
          await waitForProcessesToExit(
            [boundaryState.supervisorPid, boundaryState.launcherPid].filter(
              (pid): pid is number => pid !== null,
            ),
          )
          await waitForPathToDisappear(leaseDirectory)
          await expect(access(commandMarker)).rejects.toMatchObject({
            code: "ENOENT",
          })
          expect(
            (
              await runFile("git", ["status", "--porcelain"], {
                cwd: context.root,
              })
            ).stdout,
          ).toBe("")
        } finally {
          if (child.exitCode === null && child.signalCode === null) {
            child.kill("SIGKILL")
            await exited
          }
          await rm(markerRoot, { recursive: true, force: true })
          await rm(leaseDirectory, { recursive: true, force: true })
        }
      },
      30_000,
    )

    it("fails recovery closed on a stale lease without signaling its unrelated PID", async () => {
      const context = await createContext("stale-gate-lease")
      const leaseDirectory = path.join(
        context.root,
        ".git",
        "cowards-activation-gate-leases",
      )
      const candidateBase = path.join(
        context.root,
        ".git",
        "cowards-activation-candidates",
      )
      const candidateSentinel = path.join(candidateBase, "must-remain")
      const unrelated = spawn(
        process.execPath,
        ["--eval", "setInterval(() => {}, 1000)"],
        { detached: true, stdio: "ignore" },
      )
      const unrelatedExit = once(unrelated, "exit")
      try {
        await mkdir(leaseDirectory, { recursive: true })
        await mkdir(candidateBase, { recursive: true })
        await writeFile(candidateSentinel, "candidate preimage\n")
        await writeFile(
          path.join(leaseDirectory, "stale.json"),
          `${JSON.stringify({
            version: 1,
            state: "active",
            activationId: context.activationId,
            workspace: candidateBase,
            gateId: "spec",
            coordinatorPid: process.pid,
            coordinatorNonce: "stale-nonce-that-is-not-an-ipc-lease",
            supervisorPid: process.pid,
            gatePid: unrelated.pid,
            processGroupId: unrelated.pid,
          })}\n`,
        )
        context.adapter = createProductionActivationAdapter(
          context.root,
          context.pool,
          {
            activationId: context.activationId,
            gateLeaseWaitMs: 100,
          },
        )
        await expect(run(context, "recover")).rejects.toThrow(
          /lease remains active; refusing workspace cleanup/iu,
        )
        expect(await processRows([unrelated.pid!])).not.toBe("")
        expect(await readFile(candidateSentinel, "utf8")).toBe(
          "candidate preimage\n",
        )
        await rm(leaseDirectory, { recursive: true, force: true })
        unrelated.kill("SIGKILL")
        await unrelatedExit
        await expect(run(context, "recover")).resolves.toMatchObject({
          state: "active-v1.17-bootstrap",
        })
        await expect(access(candidateBase)).rejects.toMatchObject({
          code: "ENOENT",
        })
      } finally {
        if (unrelated.exitCode === null && unrelated.signalCode === null) {
          unrelated.kill("SIGKILL")
          await unrelatedExit
        }
        await rm(leaseDirectory, { recursive: true, force: true })
      }
    }, 30_000)

    it("rejects nonpositive and state-inconsistent gate lease identities", async () => {
      const context = await createContext("malformed-gate-leases")
      const leaseDirectory = path.join(
        context.root,
        ".git",
        "cowards-activation-gate-leases",
      )
      const adapter = createProductionActivationAdapter(
        context.root,
        context.pool,
        {
          activationId: context.activationId,
          gateLeaseWaitMs: 0,
        },
      )
      const base = {
        version: 1,
        state: "active",
        activationId: context.activationId,
        workspace: context.root,
        gateId: "spec",
        coordinatorPid: process.pid,
        coordinatorNonce: "closed-shape-lease-test",
        supervisorPid: process.pid,
        gatePid: process.pid,
        processGroupId: process.pid,
      }
      const malformed = [
        { ...base, coordinatorPid: 0 },
        { ...base, supervisorPid: -1 },
        { ...base, state: "starting", gatePid: 1, processGroupId: 1 },
        { ...base, gatePid: 1, processGroupId: 2 },
        { ...base, gatePid: null, processGroupId: null },
      ]
      try {
        for (const [index, value] of malformed.entries()) {
          await mkdir(leaseDirectory, { recursive: true })
          const leasePath = path.join(leaseDirectory, `${index}.json`)
          await writeFile(leasePath, `${JSON.stringify(value)}\n`)
          await expect(
            adapter.cleanupCandidateWorkspace(context.activationId),
          ).rejects.toThrow(/malformed activation gate lease/iu)
          await rm(leasePath, { force: true })
        }
      } finally {
        await rm(leaseDirectory, { recursive: true, force: true })
      }
    }, 30_000)

    it("kills the real production gate process group before exact SIGKILL recovery", async () => {
      const context = await createContext("sigkill-candidate")
      const markerRoot = await mkdtemp(path.join(tmpdir(), "cowards-sigkill-"))
      const marker = path.join(markerRoot, "candidate-gate-started")
      const fakeBin = await createFakePnpm(markerRoot)
      const candidateBase = path.join(
        context.root,
        ".git",
        "cowards-activation-candidates",
      )
      const candidateRoot = path.join(
        candidateBase,
        activationCandidateWorkspaceKey(context.activationId),
      )
      const schemasBefore = await context.pool.query(
        "select count(*)::integer as count from information_schema.schemata where schema_name like 'activation_%'",
      )
      const childSource = `
        import path from "node:path";
        import { createRequire } from "node:module";
        import { pathToFileURL } from "node:url";
        void (async () => {
          const moduleRoot = process.env.TEST_MODULE_ROOT;
          const requireFromPersistence = createRequire(
            pathToFileURL(path.join(moduleRoot, "packages/persistence/package.json")),
          );
          const { Pool } = requireFromPersistence("pg");
          const activation = await import(
            pathToFileURL(
              path.join(moduleRoot, "scripts/activate-v1-37-observation-v1-19.ts"),
            ).href
          );
          const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            options: "-c search_path=" + process.env.TEST_SCHEMA + ",public",
          });
          const adapter = activation.createProductionActivationAdapter(
            process.env.TEST_REPO_ROOT,
            pool,
            {
              activationId: process.env.TEST_ACTIVATION_ID,
            },
          );
          await activation.runV137ObservationV119Activation({
            mode: "prepare",
            activationId: process.env.TEST_ACTIVATION_ID,
            adapter,
          });
        })();
      `
      const childEnvironment = Object.fromEntries(
        Object.entries(process.env).filter(
          ([key]) => !key.startsWith("VITEST"),
        ),
      )
      const child = spawn(
        process.execPath,
        ["--import", "tsx", "--eval", childSource],
        {
          cwd: process.cwd(),
          env: {
            ...childEnvironment,
            DATABASE_URL: databaseUrl!,
            TEST_MODULE_ROOT: process.cwd(),
            TEST_REPO_ROOT: context.root,
            TEST_SCHEMA: context.schema,
            TEST_MARKER: marker,
            TEST_ACTIVATION_ID: context.activationId,
            TEST_GATE_BEHAVIOR: "hang",
            TEST_GATE_MARKER: marker,
            PATH: `${fakeBin}:${childEnvironment.PATH ?? ""}`,
          },
          stdio: ["ignore", "pipe", "pipe"],
        },
      )
      let stderr = ""
      child.stderr.on("data", (chunk) => {
        stderr += String(chunk)
      })
      const exited = once(child, "exit") as Promise<
        [number | null, string | null]
      >
      try {
        await Promise.race([
          waitForFile(marker),
          exited.then(([code, signal]) => {
            throw new Error(
              `Candidate child exited before marker (${String(code)}/${String(signal)}): ${stderr}`,
            )
          }),
        ])
        await access(candidateRoot)
        const gateMarker = JSON.parse(await readFile(marker, "utf8")) as {
          gatePid: number
          childPid: number
        }
        expect(
          await processRows([gateMarker.gatePid, gateMarker.childPid]),
        ).not.toBe("")
        const [leaseName] = await readdir(
          path.join(context.root, ".git", "cowards-activation-gate-leases"),
        )
        const launcherPid = (
          JSON.parse(
            await readFile(
              path.join(
                context.root,
                ".git",
                "cowards-activation-gate-leases",
                leaseName!,
              ),
              "utf8",
            ),
          ) as { processGroupId: number }
        ).processGroupId
        expect(
          await readFile(
            path.join(candidateRoot, ACTIVATION_SELECTOR_PATHS[0]),
            "utf8",
          ),
        ).not.toBe(`old:${ACTIVATION_SELECTOR_PATHS[0]}\n`)
        child.kill("SIGKILL")
        const [, signal] = await exited
        expect(signal).toBe("SIGKILL")
        await waitForProcessesToExit([
          launcherPid,
          gateMarker.gatePid,
          gateMarker.childPid,
        ])
        expect(
          await processRows([gateMarker.gatePid, gateMarker.childPid]),
        ).toBe("")

        expect((await context.adapter.readHead()).state).toBe(
          "active-v1.17-bootstrap",
        )
        expect(await context.adapter.stagedPaths()).toEqual([])
        expect(
          (
            await runFile("git", ["status", "--porcelain"], {
              cwd: context.root,
            })
          ).stdout,
        ).toBe("")
        expect(await context.adapter.readFile(ACTIVATION_PROOF_PATH)).toEqual({
          state: "absent",
        })
        for (const selectorPath of ACTIVATION_SELECTOR_PATHS) {
          const file = await context.adapter.readFile(selectorPath)
          expect(file.state).toBe("present")
          if (file.state === "present") {
            expect(Buffer.from(file.bytes).toString()).toBe(
              `old:${selectorPath}\n`,
            )
          }
        }

        await expect(run(context, "recover")).resolves.toMatchObject({
          state: "active-v1.17-bootstrap",
        })
        await expect(access(candidateBase)).rejects.toMatchObject({
          code: "ENOENT",
        })
        const schemasAfter = await context.pool.query(
          "select count(*)::integer as count from information_schema.schemata where schema_name like 'activation_%'",
        )
        expect(schemasAfter.rows).toEqual(schemasBefore.rows)
      } finally {
        if (child.exitCode === null && child.signalCode === null) {
          child.kill("SIGKILL")
          await exited
        }
        await rm(markerRoot, { recursive: true, force: true })
      }
    }, 30_000)
  },
)
