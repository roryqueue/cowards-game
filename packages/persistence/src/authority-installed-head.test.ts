import { randomUUID } from "node:crypto"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { Pool, type PoolClient } from "pg"
import { migrate } from "./migrations.js"

const databaseUrl = process.env.DATABASE_URL
const describePostgres = databaseUrl ? describe : describe.skip

describePostgres("PostgreSQL monotonic installed authority head", () => {
  let admin: Pool
  let pool: Pool
  const schema = `authority_head_${randomUUID().replaceAll("-", "")}`

  beforeAll(async () => {
    admin = new Pool({ connectionString: databaseUrl! })
    await admin.query(`create schema ${schema}`)
    pool = new Pool({
      connectionString: databaseUrl!,
      options: `-c search_path=${schema}`,
      max: 4,
    })
    await migrate(pool)
  })

  afterAll(async () => {
    await pool.end()
    await admin.query(`drop schema ${schema} cascade`)
    await admin.end()
  })

  const insertPublication = async (generation: number): Promise<string> => {
    const id = `publication:${generation}`
    await pool.query(
      `insert into runtime_evidence_authority_publications
        (id,generation,semantic_tuple_manifest_hash,source_manifest_hash,
         payload_sha256,envelope_sha256,signer_key_id,trust_domain,
         issued_at,valid_from,valid_until,payload_bytes,envelope_bytes,
         attestation_ids,certificate_ids,revocation_ids,supersession_ids,
         lane_control_ids)
       values ($1,$2,$3,$4,$5,$6,'key','production',$7,$7,$8,$9,$10,
               '[]','[]','[]','[]','[]')`,
      [
        id,
        generation,
        `sha256:${"a".repeat(64)}`,
        `sha256:${String(generation).padStart(64, "b")}`,
        `sha256:${String(generation).padStart(64, "c")}`,
        `sha256:${String(generation).padStart(64, "d")}`,
        new Date("2026-07-13T00:00:00.000Z"),
        new Date("2026-07-14T00:00:00.000Z"),
        Buffer.from(`payload:${generation}`),
        Buffer.from(`envelope:${generation}`),
      ],
    )
    await pool.query(
      `update runtime_evidence_authority_publication_head
          set next_generation = greatest(next_generation, $1 + 1)
        where singleton = true`,
      [generation],
    )
    return id
  }

  const insertTerminal = async (input: {
    client?: PoolClient
    publicationId: string
    generation: number
    kind: "installed" | "failed" | "uncertain"
    sequence: number
  }): Promise<void> => {
    const queryable = input.client ?? pool
    const reason =
      input.kind === "installed" ? null : `${input.kind}-reason`
    await queryable.query(
      `insert into runtime_evidence_authority_publication_events
        (id,publication_id,event_kind,attempt_id,envelope_sha256,reason_code,
         receipt,occurred_at)
       select $1,p.id,$2,$3,p.envelope_sha256,$4,
              jsonb_build_object(
                'schemaVersion','v1.37-runtime-evidence-authority-install-receipt-v1',
                'generation',p.generation::text,
                'payloadSha256',p.payload_sha256,
                'envelopeSha256',p.envelope_sha256,
                'sourceManifestHash',p.source_manifest_hash,
                'sourceIds',jsonb_build_object(
                  'attestationIds',p.attestation_ids,
                  'certificateIds',p.certificate_ids,
                  'revocationIds',p.revocation_ids,
                  'supersessionIds',p.supersession_ids,
                  'laneControlIds',p.lane_control_ids
                )
              ),
              $5
         from runtime_evidence_authority_publications p where p.id=$6`,
      [
        `${input.publicationId}:${input.kind}:${input.sequence}`,
        input.kind,
        `attempt:${input.sequence}`,
        reason,
        new Date(
          Date.parse("2026-07-13T00:00:00.000Z") + input.sequence * 1_000,
        ),
        input.publicationId,
      ],
    )
  }

  const installedHead = async (): Promise<
    Array<{ generation: string; install_receipt_id: string }>
  > =>
    (
      await pool.query<{ generation: string; install_receipt_id: string }>(
        `select generation::text, install_receipt_id
           from runtime_evidence_authority_installed_head`,
      )
    ).rows

  it("never rolls back after install and reconciles only the exact current generation", async () => {
    const generation1 = await insertPublication(1)
    const generation2 = await insertPublication(2)

    await insertTerminal({
      publicationId: generation1,
      generation: 1,
      kind: "installed",
      sequence: 1,
    })
    expect(await installedHead()).toEqual([
      {
        generation: "1",
        install_receipt_id: `${generation1}:installed:1`,
      },
    ])

    await insertTerminal({
      publicationId: generation2,
      generation: 2,
      kind: "failed",
      sequence: 2,
    })
    expect((await installedHead())[0]?.generation).toBe("1")

    await insertTerminal({
      publicationId: generation2,
      generation: 2,
      kind: "uncertain",
      sequence: 3,
    })
    expect(await installedHead()).toEqual([])

    await insertTerminal({
      publicationId: generation2,
      generation: 2,
      kind: "installed",
      sequence: 4,
    })
    expect((await installedHead())[0]?.generation).toBe("2")

    await insertTerminal({
      publicationId: generation2,
      generation: 2,
      kind: "uncertain",
      sequence: 5,
    })
    expect(await installedHead()).toEqual([])
    await insertTerminal({
      publicationId: generation2,
      generation: 2,
      kind: "installed",
      sequence: 6,
    })
    expect(await installedHead()).toEqual([
      {
        generation: "2",
        install_receipt_id: `${generation2}:installed:6`,
      },
    ])
  })

  it("blocks every terminal writer while a lifecycle transaction holds the head", async () => {
    const generation3 = await insertPublication(3)
    const lifecycle = await pool.connect()
    const writer = await pool.connect()
    try {
      await lifecycle.query("begin")
      await lifecycle.query(
        "select next_generation from runtime_evidence_authority_publication_head where singleton=true for share",
      )
      await writer.query("set lock_timeout='100ms'")
      await expect(
        insertTerminal({
          client: writer,
          publicationId: generation3,
          generation: 3,
          kind: "uncertain",
          sequence: 7,
        }),
      ).rejects.toMatchObject({ code: "55P03" })
      await lifecycle.query("rollback")
      await writer.query("set lock_timeout=0")
      await insertTerminal({
        client: writer,
        publicationId: generation3,
        generation: 3,
        kind: "uncertain",
        sequence: 8,
      })
      expect(await installedHead()).toEqual([])
    } finally {
      await lifecycle.query("rollback").catch(() => undefined)
      lifecycle.release()
      writer.release()
    }
  })

  it("makes a lifecycle check see a terminal event that held the head first", async () => {
    const generation4 = await insertPublication(4)
    const writer = await pool.connect()
    const lifecycle = await pool.connect()
    try {
      await writer.query("begin")
      await insertTerminal({
        client: writer,
        publicationId: generation4,
        generation: 4,
        kind: "installed",
        sequence: 9,
      })
      await lifecycle.query("begin")
      let acquired = false
      const acquireHead = lifecycle
        .query(
          "select next_generation from runtime_evidence_authority_publication_head where singleton=true for share",
        )
        .then(() => {
          acquired = true
        })
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(acquired).toBe(false)
      await writer.query("commit")
      await acquireHead
      const observed = await lifecycle.query<{ generation: string }>(
        "select generation::text from runtime_evidence_authority_installed_head",
      )
      expect(observed.rows).toEqual([{ generation: "4" }])
      await lifecycle.query("commit")
    } finally {
      await writer.query("rollback").catch(() => undefined)
      await lifecycle.query("rollback").catch(() => undefined)
      writer.release()
      lifecycle.release()
    }
  })
})
