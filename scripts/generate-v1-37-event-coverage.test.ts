import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  ACTIVE_EVENT_BYTE_BASELINE,
  CANDIDATE_CONSUMER_SURFACES,
  CandidateEventCoverageError,
  buildV137CandidateEventCoverage,
  candidateEventCoverageArtifactPath,
  checkV137CandidateEventCoverageArtifact,
  renderV137CandidateEventCoverageArtifact,
} from "./generate-v1-37-event-coverage.js"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

const readSource = (relativePath: string): string =>
  readFileSync(path.join(repoRoot, relativePath), "utf8")

const sha256File = (relativePath: string): string =>
  createHash("sha256")
    .update(readFileSync(path.join(repoRoot, relativePath)))
    .digest("hex")

const findingCodes = (operation: () => unknown): string[] => {
  try {
    operation()
  } catch (error) {
    expect(error).toBeInstanceOf(CandidateEventCoverageError)
    return (error as CandidateEventCoverageError).findings.map(
      (finding) => finding.code,
    )
  }
  throw new Error("Expected candidate event coverage to fail closed")
}

describe("v1.37 candidate event coverage generator", () => {
  it("renders a byte-identical, inactive candidate-only coverage matrix", () => {
    const artifact = buildV137CandidateEventCoverage()
    const rendered = renderV137CandidateEventCoverageArtifact(artifact)

    expect(
      readFileSync(
        path.join(repoRoot, candidateEventCoverageArtifactPath),
        "utf8",
      ),
    ).toBe(rendered)
    expect(checkV137CandidateEventCoverageArtifact()).toEqual([])
    expect(artifact).toMatchObject({
      status: "inactive-candidate",
      trustState: "untrusted-non-publishable",
      currentContractClaimed: false,
      publicationAllowed: false,
      countedExecutionAllowed: false,
      candidateTupleId:
        "sha256:922a6857fdbc8354b744d6e766bff216f3fee85b5ed381355cb427f5a616b3ae",
    })
    expect(artifact.candidateEventVocabulary).not.toContain("PUSH_ATTEMPTED")
    expect(artifact.removedFromCandidateCurrent).toEqual(["PUSH_ATTEMPTED"])
    expect(artifact.coverage).toHaveLength(
      artifact.candidateEventVocabulary.length,
    )
    expect(
      artifact.coverage.every(
        (entry) =>
          entry.producers.length > 0 &&
          entry.consumerDispositions.length ===
            CANDIDATE_CONSUMER_SURFACES.length,
      ),
    ).toBe(true)
  })

  it("fails missing and stale candidate consumer declarations", () => {
    const surface = CANDIDATE_CONSUMER_SURFACES[0]!
    const source = readSource(surface.relativePath)

    expect(
      findingCodes(() =>
        buildV137CandidateEventCoverage({
          sourceOverrides: {
            [surface.relativePath]: source.replace(
              '  "MATCH_STARTED",',
              '  // "MATCH_STARTED", regex-only non-executable reference',
            ),
          },
        }),
      ),
    ).toContain("MISSING_CONSUMER_DISPOSITION")

    expect(
      findingCodes(() =>
        buildV137CandidateEventCoverage({
          sourceOverrides: {
            [surface.relativePath]: source.replace(
              "const V1_37_CANDIDATE_GRAMMAR_EVENT_TYPES = new Set<string>([",
              'const V1_37_CANDIDATE_GRAMMAR_EVENT_TYPES = new Set<string>([\n  "STALE_EVENT",',
            ),
          },
        }),
      ),
    ).toContain("STALE_CONSUMER_DISPOSITION")
  })

  it("fails undeclared and unproduced events using AST evidence", () => {
    const producerPath = "packages/engine/src/match.ts"
    const source = readSource(producerPath)

    expect(
      findingCodes(() =>
        buildV137CandidateEventCoverage({
          sourceOverrides: {
            [producerPath]: `${source}\nvoid event("UNDECLARED_EVENT", {})\n`,
          },
        }),
      ),
    ).toContain("UNDECLARED_PRODUCER")

    expect(
      findingCodes(() =>
        buildV137CandidateEventCoverage({
          sourceOverrides: {
            [producerPath]: source.replace(
              'event("MATCH_STARTED", { matchId: state.matchId, seed: state.seed })',
              '/* event("MATCH_STARTED", {}) is only a regex-shaped comment */',
            ),
          },
        }),
      ),
    ).toContain("UNPRODUCED_EVENT")
  })

  it("fails declaration drift and reintroduction of the removed event", () => {
    const candidate = JSON.parse(
      readSource(
        "packages/spec/artifacts/v1.37-kernel-integrity-candidate.json",
      ),
    ) as {
      candidate: {
        eventVocabulary: {
          candidateCurrent: string[]
          removedFromCandidateCurrent: string[]
        }
      }
    }

    const missingDeclaration = structuredClone(candidate)
    missingDeclaration.candidate.eventVocabulary.candidateCurrent =
      missingDeclaration.candidate.eventVocabulary.candidateCurrent.filter(
        (eventType) => eventType !== "MATCH_STARTED",
      )
    expect(
      findingCodes(() =>
        buildV137CandidateEventCoverage({
          candidateArtifact: missingDeclaration,
        }),
      ),
    ).toEqual(
      expect.arrayContaining([
        "UNDECLARED_PRODUCER",
        "STALE_CONSUMER_DISPOSITION",
      ]),
    )

    const reintroduced = structuredClone(candidate)
    reintroduced.candidate.eventVocabulary.candidateCurrent.push(
      "PUSH_ATTEMPTED",
    )
    expect(
      findingCodes(() =>
        buildV137CandidateEventCoverage({ candidateArtifact: reintroduced }),
      ),
    ).toContain("REMOVED_EVENT_REINTRODUCED")
  })

  it("keeps active event declarations and authority artifacts byte-exact", () => {
    expect(
      Object.fromEntries(
        Object.keys(ACTIVE_EVENT_BYTE_BASELINE).map((relativePath) => [
          relativePath,
          sha256File(relativePath),
        ]),
      ),
    ).toEqual(ACTIVE_EVENT_BYTE_BASELINE)
  })
})
