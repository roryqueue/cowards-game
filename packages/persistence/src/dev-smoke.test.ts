import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import type { Pool } from "pg"
import { defaultDatabaseUrl } from "./db.js"
import { runDevelopmentMatchSetSmoke } from "./dev-smoke.js"
import { createFixtureMatchSetEvidenceResolver } from "./matchset-service.js"

describe("development smoke helper", () => {
  it("exports the local PostgreSQL smoke contract", () => {
    expect(defaultDatabaseUrl).toBe(
      "postgresql://cowards:cowards@localhost:5432/cowards_game",
    )
    expect(runDevelopmentMatchSetSmoke).toBeTypeOf("function")
  })

  it("routes fixture evidence through the sole verified import authority", () => {
    const source = readFileSync(new URL("./dev-smoke.ts", import.meta.url), "utf8")
    expect(source).toContain("importVerifiedRuntimeEvidenceAttestation")
    expect(source).not.toMatch(
      /insert\s+into\s+runtime_evidence_(?:verified_attestations|certificates)/iu,
    )
  })

  it("fails before touching PostgreSQL without explicit fixture authority", async () => {
    let touched = false
    const pool = {
      connect: async () => {
        touched = true
        throw new Error("database must not be reached")
      },
      query: async () => {
        touched = true
        throw new Error("database must not be reached")
      },
    } as unknown as Pool

    await expect(runDevelopmentMatchSetSmoke(pool)).rejects.toThrow(
      /explicit fixture-domain evidence/i,
    )
    expect(touched).toBe(false)
  })

  it.skipIf(process.env.DATABASE_URL === undefined)(
    "can run against an explicit DATABASE_URL integration database",
    async () => {
      const { createDatabasePool } = await import("./db.js")
      const pool = createDatabasePool()
      try {
        const result = await runDevelopmentMatchSetSmoke(pool, {
          matchSetId: `match-set:dev-smoke:${randomUUID()}`,
          evidenceResolver: createFixtureMatchSetEvidenceResolver(),
          runQueuedMatch: async () => undefined,
        })
        expect(result.matchSetId).toMatch(/^match-set:dev-smoke:/u)
        expect(result.matchIds.length).toBe(result.matchCount)
        expect(["complete", "degraded", "pending", "running"]).toContain(
          result.status,
        )
        expect(result.chronicleCount).toBeGreaterThanOrEqual(0)
        const imported = await pool.query<{ count: number }>(
          `select count(*)::integer as count
             from match_set_execution_entrants entrant
             join runtime_evidence_certificates certificate
               on certificate.id = entrant.containment_certificate_id
             join runtime_evidence_verified_attestations attestation
               on attestation.id = certificate.verified_attestation_id
            where entrant.match_set_id = $1
              and certificate.certificate_kind = 'containment'
              and certificate.certificate_status = 'passed'
              and attestation.verification_status = 'passed'
              and attestation.trust_domain = 'fixture'`,
          [result.matchSetId],
        )
        expect(imported.rows[0]?.count).toBe(2)
      } finally {
        await pool.end()
      }
    },
  )
})
