/* eslint-disable no-restricted-imports -- Cross-surface tuple seams are the contract under test. */
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { resolveMatchIntelligenceEventContract } from "../apps/web/app/match-intelligence.js"
import { resolveReplayBoardEventContract } from "../apps/web/app/matches/[matchId]/replay/replay-board-model.js"
import { resolveReplayReadyEventContract } from "../apps/web/app/matches/replay-ready.js"
import { resolveGrammarEventContract } from "../packages/replay/src/grammar.js"
import { resolveReplayTransitionEventContract } from "../packages/replay/src/replay-transition.js"
import {
  ChronicleEventTypeSchema,
  HistoricalV14ChronicleEventTypeSchema,
} from "../packages/spec/src/schemas.js"
import {
  CURRENT_CONSUMER_SURFACES,
  CurrentEventCoverageError,
  RETAINED_CANDIDATE_EVENT_ARTIFACT_HASH,
  buildV137CurrentEventCoverage,
  candidateEventCoverageArtifactPath,
  checkRetainedCandidateEventCoverageProvenance,
  checkV137CurrentEventCoverageArtifact,
  currentEventCoverageArtifactPath,
  renderV137CurrentEventCoverageArtifact,
} from "./generate-v1-37-event-coverage.js"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)
const readSource = (relativePath: string): string =>
  readFileSync(path.join(repoRoot, relativePath), "utf8")

const findingCodes = (operation: () => unknown): string[] => {
  try {
    operation()
  } catch (error) {
    expect(error).toBeInstanceOf(CurrentEventCoverageError)
    return (error as CurrentEventCoverageError).findings.map(
      ({ code }) => code,
    )
  }
  throw new Error("Expected current event coverage to fail closed")
}

describe("v1.37 current event coverage generator", () => {
  it("routes only exact-current vocabulary while retaining historical PUSH", () => {
    const tupleId =
      "sha256:922a6857fdbc8354b744d6e766bff216f3fee85b5ed381355cb427f5a616b3ae"
    const resolvers = [
      resolveGrammarEventContract,
      resolveReplayTransitionEventContract,
      resolveMatchIntelligenceEventContract,
      resolveReplayReadyEventContract,
      resolveReplayBoardEventContract,
    ]

    for (const resolveContract of resolvers) {
      expect(resolveContract(tupleId, "MATCH_STARTED")).toBe("current-exact")
      expect(resolveContract(tupleId, "PUSH_ATTEMPTED")).toBe(
        "historical-or-unknown",
      )
      expect(resolveContract("sha256:other", "MATCH_STARTED")).toBe(
        "historical-or-unknown",
      )
    }
    expect(ChronicleEventTypeSchema.options).not.toContain("PUSH_ATTEMPTED")
    expect(HistoricalV14ChronicleEventTypeSchema.options).toContain(
      "PUSH_ATTEMPTED",
    )
  })

  it("renders byte-identical current coverage and pins candidate provenance", () => {
    const artifact = buildV137CurrentEventCoverage()
    expect(
      readFileSync(
        path.join(repoRoot, currentEventCoverageArtifactPath),
        "utf8",
      ),
    ).toBe(renderV137CurrentEventCoverageArtifact(artifact))
    expect(checkV137CurrentEventCoverageArtifact()).toEqual([])
    expect(checkRetainedCandidateEventCoverageProvenance()).toEqual([])
    expect(artifact).toMatchObject({
      status: "current-exact",
      tupleId:
        "sha256:922a6857fdbc8354b744d6e766bff216f3fee85b5ed381355cb427f5a616b3ae",
      historicalOnly: ["PUSH_ATTEMPTED"],
      retainedCandidateEvidence: {
        relativePath: candidateEventCoverageArtifactPath,
        sha256: RETAINED_CANDIDATE_EVENT_ARTIFACT_HASH,
      },
    })
    expect(artifact.coverage).toHaveLength(
      artifact.currentEventVocabulary.length,
    )
  })

  it("fails missing and stale current consumer declarations", () => {
    const surface = CURRENT_CONSUMER_SURFACES[0]
    const source = readSource(surface.relativePath)
    expect(
      findingCodes(() =>
        buildV137CurrentEventCoverage({
          sourceOverrides: {
            [surface.relativePath]: source.replace(
              '  "MATCH_STARTED",',
              '  // "MATCH_STARTED", non-executable reference',
            ),
          },
        }),
      ),
    ).toContain("MISSING_CONSUMER_DISPOSITION")
    expect(
      findingCodes(() =>
        buildV137CurrentEventCoverage({
          sourceOverrides: {
            [surface.relativePath]: source.replace(
              "const V1_37_CURRENT_GRAMMAR_EVENT_TYPES = new Set<string>([",
              'const V1_37_CURRENT_GRAMMAR_EVENT_TYPES = new Set<string>([\n  "PUSH_ATTEMPTED",',
            ),
          },
        }),
      ),
    ).toContain("STALE_CONSUMER_DISPOSITION")
  })

  it("fails undeclared producers and unproduced declarations", () => {
    const producerPath = "packages/engine/src/kernel/step.ts"
    const source = readSource(producerPath)
    expect(
      findingCodes(() =>
        buildV137CurrentEventCoverage({
          sourceOverrides: {
            [producerPath]: `${source}\nvoid event("UNDECLARED_EVENT", {})\n`,
          },
        }),
      ),
    ).toContain("UNDECLARED_PRODUCER")
    expect(
      findingCodes(() =>
        buildV137CurrentEventCoverage({
          currentVocabulary: ChronicleEventTypeSchema.options.filter(
            (eventType) => eventType !== "MATCH_STARTED",
          ),
        }),
      ),
    ).toContain("UNDECLARED_PRODUCER")
  })
})
