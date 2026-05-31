import { describe, expect, it } from "vitest"
import type { PublicMatchSetResultDto } from "@cowards/spec"
import type { ReplayReadyDto } from "../matches/types.js"
import {
  matchSetEvidenceRows,
  publicMatchEvidenceLabel,
  publicPrivacyProvenanceCue,
  publicReliabilityPrivacyCue,
  replayEvidenceRows,
  statusChipClass,
} from "./evidence-copy.js"

const matchSet = (
  input: Pick<PublicMatchSetResultDto, "status" | "matches">,
): PublicMatchSetResultDto =>
  ({
    ...input,
    matchSetId: "match-set:test",
  }) as PublicMatchSetResultDto

const rowValue = (
  rows: readonly { label: string; value: string }[],
  label: string,
) => rows.find((row) => row.label === label)?.value ?? ""

describe("reliability evidence copy", () => {
  it("explains running exhibitions as bounded slow/running states", () => {
    const rows = matchSetEvidenceRows(
      matchSet({
        status: "running",
        matches: [{ matchId: "match:1", status: "running" }] as never,
      }),
      ["Python · Counted eligible · runtime-python-subprocess-experimental"],
    )

    expect(rowValue(rows, "status")).toContain("Running or slow")
    expect(rowValue(rows, "result state")).toContain("Running public result")
    expect(rowValue(rows, "status")).not.toContain("Python")
    expect(rowValue(rows, "retry policy")).toContain("Go-owned orchestration")
    expect(rowValue(rows, "timeout budget")).toContain("1000 ms")
    expect(rowValue(rows, "proof limits")).toContain("bounded cycles")
  })

  it("keeps JS/TS-only running copy runtime neutral", () => {
    const rows = matchSetEvidenceRows(
      matchSet({
        status: "running",
        matches: [{ matchId: "match:js", status: "running" }] as never,
      }),
      ["JS/TS · runtime-js-worker-thread"],
    )

    expect(rowValue(rows, "status")).toContain("exhibition Matches")
    expect(rowValue(rows, "status")).not.toContain("Python")
  })

  it("distinguishes strategy-failed and system-failed retry semantics", () => {
    const strategyRows = matchSetEvidenceRows(
      matchSet({
        status: "degraded",
        matches: [
          {
            matchId: "match:strategy",
            status: "failed_system",
            publicReason: "strategy_failure",
          },
        ] as never,
      }),
      ["JS/TS · runtime-js-worker-thread"],
    )
    const systemRows = matchSetEvidenceRows(
      matchSet({
        status: "degraded",
        matches: [
          {
            matchId: "match:system",
            status: "failed_system",
            publicReason: "system_failure",
          },
        ] as never,
      }),
      ["Python · Counted eligible · runtime-python-subprocess-experimental"],
    )

    expect(rowValue(strategyRows, "match states")).toContain("strategy-failed")
    expect(rowValue(strategyRows, "retry policy")).toContain(
      "not retried as system failures",
    )
    expect(rowValue(systemRows, "match states")).toContain("system-failed")
    expect(rowValue(systemRows, "retry policy")).toContain(
      "Retryable system/runtime-service failures",
    )
  })

  it("explains blocked, invalid-result, and no-result categories without retry overclaiming", () => {
    const blockedRows = matchSetEvidenceRows(
      matchSet({
        status: "failed",
        matches: [{ matchId: "match:blocked", status: "blocked" }] as never,
      }),
      ["JS/TS · runtime-js-worker-thread"],
    )
    const invalidRows = matchSetEvidenceRows(
      matchSet({
        status: "degraded",
        matches: [
          {
            matchId: "match:invalid",
            status: "failed_system",
            publicReason: "invalid_result",
          },
        ] as never,
      }),
      ["JS/TS · runtime-js-worker-thread"],
    )
    const noResultRows = matchSetEvidenceRows(
      matchSet({
        status: "degraded",
        matches: [
          {
            matchId: "match:none",
            status: "failed_system",
            publicReason: "no_result",
          },
        ] as never,
      }),
      ["JS/TS · runtime-js-worker-thread"],
    )

    expect(rowValue(blockedRows, "retry policy")).toContain(
      "Blocked Matches stop before replayable execution evidence",
    )
    expect(rowValue(invalidRows, "retry policy")).toContain(
      "Invalid public results are terminal evidence",
    )
    expect(rowValue(noResultRows, "retry policy")).toContain(
      "No-result Matches expose only safe status evidence",
    )
  })

  it("explains stale, missing-Chronicle, unavailable-runtime, and no-result lifecycle evidence", () => {
    const rowsFor = (
      lifecycle: Parameters<typeof matchSetEvidenceRows>[0]["lifecycle"],
    ) =>
      matchSetEvidenceRows(
        {
          ...matchSet({
            status: lifecycle?.state === "degraded" ? "degraded" : "failed",
            matches: [
              {
                matchId: "match:lifecycle",
                status: "failed_system",
                publicReason: "no_result",
              },
            ] as never,
          }),
          lifecycle,
        },
        ["JS/TS · runtime-js-worker-thread"],
      )

    const staleRows = matchSetEvidenceRows(
      {
        ...matchSet({
          status: "failed",
          matches: [{ matchId: "match:stale", status: "blocked" }] as never,
        }),
        lifecycle: {
          state: "failed",
          terminal: true,
          retryDisposition: "non_retryable",
          failureCategory: "stale_artifact",
          resultAvailability: "none",
          replayAvailability: "stale",
          publicMessageKey: "match_execution.stale_artifact",
        },
      },
      ["JS/TS · runtime-js-worker-thread"],
    )
    const missingRows = rowsFor({
      state: "failed",
      terminal: true,
      retryDisposition: "non_retryable",
      failureCategory: "missing_chronicle",
      resultAvailability: "none",
      replayAvailability: "missing",
      publicMessageKey: "match_execution.missing_chronicle",
    })
    const unavailableRows = rowsFor({
      state: "unavailable",
      terminal: true,
      retryDisposition: "retryable",
      failureCategory: "runtime_unavailable",
      resultAvailability: "none",
      replayAvailability: "none",
      publicMessageKey: "match_execution.runtime_unavailable",
    })
    const noResultRows = rowsFor({
      state: "degraded",
      terminal: true,
      retryDisposition: "non_retryable",
      failureCategory: "no_result",
      resultAvailability: "partial",
      replayAvailability: "none",
      publicMessageKey: "match_execution.no_result",
    })

    expect(rowValue(staleRows, "result state")).toContain("Stale artifact")
    expect(rowValue(missingRows, "result state")).toContain("Missing Chronicle")
    expect(rowValue(unavailableRows, "result state")).toContain(
      "Unavailable runtime",
    )
    expect(rowValue(noResultRows, "result state")).toContain("No public result")
  })

  it("maps Match ledger evidence labels to player-facing copy", () => {
    expect(
      publicMatchEvidenceLabel({
        status: "failed_system",
        publicReason: "no_result",
      } as never),
    ).toBe("No public result")
    expect(
      publicMatchEvidenceLabel({
        status: "failed_system",
        publicReason: "invalid_result",
      } as never),
    ).toBe("Invalid public result")
    expect(publicMatchEvidenceLabel({ status: "running" } as never)).toBe(
      "Running",
    )
  })

  it("keeps candidate and privacy copy public-safe", () => {
    const rows = replayEvidenceRows({
      status: "ready",
      mode: "public",
    } as ReplayReadyDto)
    const serialized = JSON.stringify(rows)

    expect(rowValue(rows, "candidate lane")).toContain("readiness evidence")
    expect(publicReliabilityPrivacyCue).toContain("runtime internals excluded")
    expect(publicPrivacyProvenanceCue).toContain("runtime internals")
    for (const forbidden of [
      "StrategyMemory",
      "SoldierMemory",
      "objectivePayload",
      "strategySource",
      "rawRuntimeDetails",
      "privateRuntime",
      "runtimeInternals",
      "Traceback",
      "stderr",
      "site-packages",
      "DATABASE_URL",
      "Bearer ",
    ]) {
      expect(serialized).not.toContain(forbidden)
    }
  })

  it("maps MatchSet status to compact chip classes", () => {
    expect(statusChipClass("complete")).toBe("valid")
    expect(statusChipClass("degraded")).toBe("warning")
    expect(statusChipClass("running")).toBe("warning")
    expect(statusChipClass("failed")).toBe("invalid")
    expect(statusChipClass("accepted")).toBe("")
  })
})
