import { createHash, randomUUID } from "node:crypto"
import { Buffer } from "node:buffer"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import type { Pool } from "pg"
import { hashCanonicalIdentity } from "@cowards/spec"
import { createDatabasePool } from "./db.js"
import { migrate } from "./migrations.js"
import {
  SOURCE_IDENTITY_VERSION_V2,
  SOURCE_NORMALIZATION_POLICY_V1_17,
  buildSourceIdentityV2,
  createAccountStrategyRevision,
} from "./account-revisions.js"

const databaseUrl = process.env.DATABASE_URL
const describeDatabase = databaseUrl ? describe : describe.skip

describe("source identity v2", () => {
  it.each([
    ["none", "alpha", { kind: "none", lf: 0, crlf: 0, cr: 0 }, false],
    ["lf", "a\nb\n", { kind: "lf", lf: 2, crlf: 0, cr: 0 }, true],
    ["crlf", "a\r\nb\r\n", { kind: "crlf", lf: 0, crlf: 2, cr: 0 }, true],
    ["cr", "a\rb\r", { kind: "cr", lf: 0, crlf: 0, cr: 2 }, true],
    ["mixed", "a\r\nb\nc\r", { kind: "mixed", lf: 1, crlf: 1, cr: 1 }, true],
  ])("derives exact %s line facts and separate domain hashes", (_name, source, endings, finalNewline) => {
    const identity = buildSourceIdentityV2(source)
    const original = Buffer.from(source, "utf8")
    const normalized = Buffer.from(source.replace(/\r\n?|\n/g, "\n"), "utf8")

    expect(identity).toEqual({
      sourceIdentityVersion: SOURCE_IDENTITY_VERSION_V2,
      originalSourceHash: hashCanonicalIdentity("originalSource", [original]),
      originalSourceBytes: original.byteLength,
      normalizedSourceHash: hashCanonicalIdentity("normalizedSource", [normalized]),
      normalizedSourceBytes: normalized.byteLength,
      sourceNormalizationPolicy: SOURCE_NORMALIZATION_POLICY_V1_17,
      sourceLineEndings: endings,
      sourceHasFinalNewline: finalNewline,
      normalizedSource: normalized.toString("utf8"),
    })
    expect(createHash("sha256").update(original).digest("hex")).not.toBe(
      identity.originalSourceHash,
    )
  })
})

describeDatabase("source identity v2 persistence", () => {
  let pool: Pool
  const userId = `user:phase258:${randomUUID()}`

  beforeAll(async () => {
    pool = createDatabasePool({ connectionString: databaseUrl! })
    await migrate(pool)
    await pool.query(
      "insert into users (id, display_name, metadata) values ($1, 'Phase 258', '{}'::jsonb)",
      [userId],
    )
  })

  afterAll(async () => {
    if (!pool) return
    await pool.query("delete from strategy_revisions where strategy_id in (select id from strategies where owner_user_id = $1)", [userId])
    await pool.query("delete from strategies where owner_user_id = $1", [userId])
    await pool.query("delete from users where id = $1", [userId])
    await pool.end()
  })

  it("inserts the complete identity group atomically and leaves legacy rows null", async () => {
    const source = "\ufeffalpha\r\nbeta\ngamma\r"
    const revision = await createAccountStrategyRevision(pool, {
      userId: userId as never,
      source,
    })
    const row = await pool.query(
      `select source, encode(convert_to(source, 'UTF8'), 'hex') source_hex,
              source_identity_version, original_source_hash, original_source_bytes,
              normalized_source_hash, normalized_source_bytes, source_normalization_policy,
              source_line_endings, source_has_final_newline
         from strategy_revisions where id = $1`,
      [revision.id],
    )
    expect(row.rows[0]).toMatchObject({
      source,
      source_hex: Buffer.from(source).toString("hex"),
      source_identity_version: SOURCE_IDENTITY_VERSION_V2,
      source_line_endings: { kind: "mixed", lf: 1, crlf: 1, cr: 1 },
      source_has_final_newline: true,
    })

    const legacyId = `strategy-revision:legacy:${randomUUID()}`
    await pool.query(
      `insert into strategy_revisions
       (id, strategy_id, source, source_hash, source_bytes, runtime, engine_compatibility, validation, metadata)
       select $1, strategy_id, 'legacy', $2, 6, runtime, engine_compatibility, validation, '{}'::jsonb
       from strategy_revisions where id = $3`,
      [legacyId, createHash("sha256").update("legacy").digest("hex"), revision.id],
    )
    const legacy = await pool.query("select source_identity_version, original_source_hash from strategy_revisions where id = $1", [legacyId])
    expect(legacy.rows[0]).toEqual({ source_identity_version: null, original_source_hash: null })
  })

  it("rejects partial groups and every post-insert identity mutation", async () => {
    const revision = await createAccountStrategyRevision(pool, {
      userId: userId as never,
      source: "immutable\n",
    })
    await expect(
      pool.query("update strategy_revisions set original_source_hash = $2 where id = $1", [revision.id, "f".repeat(64)]),
    ).rejects.toThrow(/immutable/i)
  })
})
