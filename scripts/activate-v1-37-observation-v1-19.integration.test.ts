import { Buffer } from "node:buffer"
import { execFile } from "node:child_process"
import { createHash, randomUUID } from "node:crypto"
import { createRequire } from "node:module"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { promisify } from "node:util"
import { afterAll, describe, expect, it } from "vitest"
import {
  ACTIVATION_GATE_COMMANDS,
  ACTIVATION_PROOF_PATH,
  ACTIVATION_SELECTOR_PATHS,
  ACTIVATION_VALIDATION_GATE_IDS,
  createProductionActivationAdapter,
  hashActivationPathDigests,
  hashActivationProofCommitment,
  runV137ObservationV119Activation,
  type ActivationCoordinatorAdapter,
  type GateReceipt,
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
  const production = createProductionActivationAdapter(root, pool)
  const adapter: ActivationCoordinatorAdapter = {
    ...production,
    async runGate(id: string): Promise<GateReceipt> {
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
        id,
        command: ACTIVATION_GATE_COMMANDS[id]!,
        exitCode: 0,
        stdoutSha256: sha256(`isolated stdout:${id}`),
        stderrSha256: sha256(`isolated stderr:${id}`),
        completedAt: "2026-07-17T12:00:00.000Z",
      }
    },
  }
  const context = {
    root,
    schema,
    pool,
    adapter,
    activationId: `activation:phase260:plan31:integration:${label}`,
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
      const production = context.adapter
      context.adapter = {
        ...production,
        async runGate(id) {
          if (id === "engine") throw new Error("real adapter gate failure")
          return production.runGate(id)
        },
      }
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
  },
)
