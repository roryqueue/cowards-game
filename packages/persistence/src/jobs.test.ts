import { describe, expect, it } from "vitest"
import {
  CLAIM_NEXT_MATCH_JOB_SQL,
  DEFAULT_LEASE_MS,
  shouldExhaustRetries,
} from "./jobs.js"

describe("job claiming", () => {
  it("uses lease-based skip-locked claiming", () => {
    expect(DEFAULT_LEASE_MS).toBe(30_000)
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain("for update skip locked")
    expect(CLAIM_NEXT_MATCH_JOB_SQL).toContain("lease_expires_at < $1")
  })

  it("exhausts retries at the fixed system failure limit", () => {
    expect(
      shouldExhaustRetries({
        attempts: 2,
        maxAttempts: 3,
        retryable: true,
      }),
    ).toBe(false)
    expect(
      shouldExhaustRetries({
        attempts: 3,
        maxAttempts: 3,
        retryable: true,
      }),
    ).toBe(true)
    expect(
      shouldExhaustRetries({
        attempts: 1,
        maxAttempts: 3,
        retryable: false,
      }),
    ).toBe(true)
  })
})
