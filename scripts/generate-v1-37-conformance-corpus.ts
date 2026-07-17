#!/usr/bin/env -S pnpm exec tsx
/// <reference types="node" />

import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
// eslint-disable-next-line no-restricted-imports -- repo-root candidate generator consumes the exact golden source contract.
import {
  V1_37_CONFORMANCE_ACTIVE_REGISTRY,
  V1_37_CONFORMANCE_CORPUS,
  computeV137ConformanceCorpusRoot,
  validateV137ConformanceCorpus,
  type V137ConformanceCorpus,
  type V137ConformanceFixture,
} from "../packages/golden/src/v1-37-conformance-corpus.ts"
// eslint-disable-next-line no-restricted-imports -- candidate checker binds the explicit inactive v3 pin without consulting current selection.
import { V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN } from "../packages/golden/src/v1-37-conformance-corpus-v3-candidate-pin.ts"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)
const ACTIVE_GOLDEN_ROOT = path.join(
  repoRoot,
  "packages/golden/src/fixtures/v1-37-conformance-corpus",
)
const VERSION = /^v[1-9][0-9]*$/u
const GOVERNED_FIXTURE_FIELDS = Object.freeze([
  "languageId",
  "providerId",
  "runtimeTarget",
  "behaviorManifestId",
  "sourceEncoding",
  "sourceSha256",
  "source",
] as const satisfies readonly (keyof V137ConformanceFixture)[])

const OBSERVATION_CASES_V3 = Object.freeze([
  ["observation-d01-initial-initiative-both-observers", "selectActivations"],
  ["observation-d02-round-initiative-later-round", "selectActivations"],
  ["observation-d03-kernel-owned-signed-transport", "selectActivations"],
  ["observation-d04-real-revalidation-required", "selectActivations"],
  ["observation-d05-blocked-move-false", "soldierBrain"],
  ["observation-d05-blocked-push-false", "soldierBrain"],
  ["observation-d05-pushed-target-false", "soldierBrain"],
  ["observation-d05-successful-pusher-true", "soldierBrain"],
  ["observation-d05-turn-false", "soldierBrain"],
  ["observation-d06-first-call-false", "soldierBrain"],
  ["observation-d06-later-cycle-true", "soldierBrain"],
  ["observation-d06-post-self-advance-true", "soldierBrain"],
  ["observation-d07-new-slot-reset-false", "soldierBrain"],
  ["observation-d08-observational-only-no-hold", "soldierBrain"],
] as const)

const TYPESCRIPT_OBSERVATION_FIXTURE_V3 = `const initiative = (input) => ({
  initialInitiativePlayerId: input.initialInitiativePlayerId,
  hasInitialInitiative: input.hasInitialInitiative,
  roundInitiativePlayerId: input.roundInitiativePlayerId,
  hasRoundInitiative: input.hasRoundInitiative,
})

export default {
  selectActivations(input) {
    const soldier = input.mySoldiers.find((candidate) => candidate.status === "ACTIVE")
    const observed = initiative(input)
    return {
      activationOrders: soldier
        ? [{ soldierId: soldier.id, objective: { fixture: "v1.37-observation-v1.19", initiative: observed, intent: "stone" } }]
        : [],
      strategyMemory: { fixture: "v1.37-observation-v1.19", initiative: observed },
    }
  },
  soldierBrain(input) {
    return {
      action: { type: "TURN_TO_STONE" },
      soldierMemory: {
        fixture: "v1.37-observation-v1.19",
        hasAdvancedThisActivation: input.hasAdvancedThisActivation,
      },
    }
  },
}
`

const PYTHON_OBSERVATION_FIXTURE_V3 = `def select_activations(input):
    observed = {
        "initialInitiativePlayerId": input["initialInitiativePlayerId"],
        "hasInitialInitiative": input["hasInitialInitiative"],
        "roundInitiativePlayerId": input["roundInitiativePlayerId"],
        "hasRoundInitiative": input["hasRoundInitiative"],
    }
    soldier = next(
        (candidate for candidate in input["mySoldiers"] if candidate["status"] == "ACTIVE"),
        None,
    )
    return {
        "activationOrders": ([{
            "soldierId": soldier["id"],
            "objective": {"fixture": "v1.37-observation-v1.19", "initiative": observed, "intent": "stone"},
        }] if soldier else []),
        "strategyMemory": {"fixture": "v1.37-observation-v1.19", "initiative": observed},
    }


def soldier_brain(input):
    return {
        "action": {"type": "TURN_TO_STONE"},
        "soldierMemory": {
            "fixture": "v1.37-observation-v1.19",
            "hasAdvancedThisActivation": input["hasAdvancedThisActivation"],
        },
    }
`

/* eslint-disable no-useless-escape -- escaped quotes are literal guest-language source bytes. */
const RUST_OBSERVATION_FIXTURE_V3 = `use std::io::{self, Read};

fn has(input: &str, field: &str) -> bool {
    input.contains(field)
}

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let has_initiative = has(&input, "initialInitiativePlayerId")
        && has(&input, "hasInitialInitiative")
        && has(&input, "roundInitiativePlayerId")
        && has(&input, "hasRoundInitiative");
    let is_brain = input.contains("\\\"methodName\\\":\\\"soldierBrain\\\"");
    let has_advanced = has(&input, "hasAdvancedThisActivation");
    if is_brain && has_advanced {
        println!("{}", r#"{"action":{"type":"TURN_TO_STONE"},"soldierMemory":{"fixture":"v1.37-observation-v1.19","hasAdvancedThisActivation":false}}"#);
    } else if has_initiative {
        println!("{}", r#"{"activationOrders":[{"soldierId":"soldier:fixture:active","objective":{"fixture":"v1.37-observation-v1.19","initiative":{"hasInitialInitiative":true,"hasRoundInitiative":true,"initialInitiativePlayerId":"player:bottom","roundInitiativePlayerId":"player:bottom"},"intent":"stone"}}],"strategyMemory":{"fixture":"v1.37-observation-v1.19","initiative":{"hasInitialInitiative":true,"hasRoundInitiative":true,"initialInitiativePlayerId":"player:bottom","roundInitiativePlayerId":"player:bottom"}}}"#);
    } else {
        println!("{}", r#"{"error":"missing-observation"}"#);
    }
}
`

const ZIG_OBSERVATION_FIXTURE_V3 = `const std = @import("std");

pub fn main(init: std.process.Init) !void {
    var input_buffer: [16384]u8 = undefined;
    var reader_buffer: [4096]u8 = undefined;
    var reader = std.Io.File.stdin().reader(init.io, &reader_buffer);
    const count = try reader.interface.readSliceShort(&input_buffer);
    const input = input_buffer[0..count];
    const has_initiative = std.mem.indexOf(u8, input, "initialInitiativePlayerId") != null and
        std.mem.indexOf(u8, input, "hasInitialInitiative") != null and
        std.mem.indexOf(u8, input, "roundInitiativePlayerId") != null and
        std.mem.indexOf(u8, input, "hasRoundInitiative") != null;
    const is_brain = std.mem.indexOf(u8, input, "\\\"methodName\\\":\\\"soldierBrain\\\"") != null;
    const has_advanced = std.mem.indexOf(u8, input, "hasAdvancedThisActivation") != null;
    const output = if (is_brain and has_advanced)
        "{\\\"action\\\":{\\\"type\\\":\\\"TURN_TO_STONE\\\"},\\\"soldierMemory\\\":{\\\"fixture\\\":\\\"v1.37-observation-v1.19\\\",\\\"hasAdvancedThisActivation\\\":false}}\\n"
    else if (has_initiative)
        "{\\\"activationOrders\\\":[{\\\"soldierId\\\":\\\"soldier:fixture:active\\\",\\\"objective\\\":{\\\"fixture\\\":\\\"v1.37-observation-v1.19\\\",\\\"initiative\\\":{\\\"hasInitialInitiative\\\":true,\\\"hasRoundInitiative\\\":true,\\\"initialInitiativePlayerId\\\":\\\"player:bottom\\\",\\\"roundInitiativePlayerId\\\":\\\"player:bottom\\\"},\\\"intent\\\":\\\"stone\\\"}}],\\\"strategyMemory\\\":{\\\"fixture\\\":\\\"v1.37-observation-v1.19\\\",\\\"initiative\\\":{\\\"hasInitialInitiative\\\":true,\\\"hasRoundInitiative\\\":true,\\\"initialInitiativePlayerId\\\":\\\"player:bottom\\\",\\\"roundInitiativePlayerId\\\":\\\"player:bottom\\\"}}}\\n"
    else
        "{\\\"error\\\":\\\"missing-observation\\\"}\\n";
    try std.Io.File.stdout().writeStreamingAll(init.io, output);
}
`
/* eslint-enable no-useless-escape */

const RUST_V1_37_TOOLCHAIN_FIXTURE = `use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    if input.contains("\\"methodName\\":\\"soldierBrain\\"") {
        println!("{}", r#"{"action":{"type":"TURN_TO_STONE"},"soldierMemory":{"fixture":"v1.37"}}"#);
    } else {
        println!("{}", r#"{"activationOrders":[{"soldierId":"soldier:fixture:active","objective":{"fixture":"v1.37","intent":"stone"}}],"strategyMemory":{"fixture":"v1.37"}}"#);
    }
}
`

const ZIG_V1_37_TOOLCHAIN_FIXTURE = `const std = @import("std");

pub fn main(init: std.process.Init) !void {
    var input_buffer: [16384]u8 = undefined;
    var reader_buffer: [4096]u8 = undefined;
    var reader = std.Io.File.stdin().reader(init.io, &reader_buffer);
    const count = try reader.interface.readSliceShort(&input_buffer);
    const input = input_buffer[0..count];
    const output = if (std.mem.indexOf(u8, input, "\\"methodName\\":\\"soldierBrain\\"") != null)
        "{\\"action\\":{\\"type\\":\\"TURN_TO_STONE\\"},\\"soldierMemory\\":{\\"fixture\\":\\"v1.37\\"}}\\n"
    else
        "{\\"activationOrders\\":[{\\"soldierId\\":\\"soldier:fixture:active\\",\\"objective\\":{\\"fixture\\":\\"v1.37\\",\\"intent\\":\\"stone\\"}}],\\"strategyMemory\\":{\\"fixture\\":\\"v1.37\\"}}\\n";
    try std.Io.File.stdout().writeStreamingAll(init.io, output);
}
`

export const repairV137PinnedToolchainFixtures = (
  input: V137ConformanceCorpus = V1_37_CONFORMANCE_CORPUS,
): V137ConformanceCorpus => {
  const candidate = globalThis.structuredClone(input)
  const rust = candidate.fixtures.find(
    ({ languageId }) => languageId === "rust",
  )
  const zig = candidate.fixtures.find(({ languageId }) => languageId === "zig")
  if (rust === undefined || zig === undefined) {
    fail("PINNED_TOOLCHAIN_FIXTURE_MISSING")
  }
  rust.source = RUST_V1_37_TOOLCHAIN_FIXTURE
  zig.source = ZIG_V1_37_TOOLCHAIN_FIXTURE
  return candidate
}

export interface WriteV137ConformanceCandidateInput {
  destinationRoot: string
  nextVersion: string
  candidateCorpus?: V137ConformanceCorpus
}

export interface V137ConformanceCandidateArgs {
  destinationRoot: string
  nextVersion: string
  inputPath: string | undefined
}

export interface V137ConformanceCandidateResult {
  version: string
  corpusRootSha256: string
  corpusPath: string
  corpusLogicalPath: string
  semanticDiffPath: string
  corpusFileSha256: string
}

export interface WriteCommittedV137ObservationCorpusV3CandidateInput {
  root?: string
}

export interface ReviewCommittedV137ObservationCorpusV3CandidateInput {
  root?: string
  reviewedBy: string
}

export interface V137ObservationCorpusV3IndependentReview {
  schemaVersion: "v1.37-executable-conformance-independent-review-v1"
  reviewedBy: string
  lifecycle: "inactive-candidate"
  current: false
  status: "approved-inactive-observation-candidate"
  candidateVersion: "v3"
  candidateCorpusRootSha256: string
  candidateCorpusFileSha256: string
  semanticDiffFileSha256: string
  caseInventoryRootSha256: string
  sourceInventoryRootSha256: string
  caseRoots: Array<{ caseId: string; rootSha256: string }>
  sourceRoots: Array<{ languageId: string; sourceSha256: string }>
  decisionDispositions: Array<{
    decisionId: string
    disposition: "approved-observation-only"
  }>
  protectedSurfaces: Array<{
    surface: string
    disposition: "unchanged"
  }>
  approvedChangedPaths: string[]
}

interface V137ConformanceSemanticDiff {
  schemaVersion: "v1.37-executable-conformance-semantic-diff-v1"
  generatedBy: "scripts/generate-v1-37-conformance-corpus.ts"
  baseline: {
    version: string
    corpusRootSha256: string
    path: string
  }
  candidate: {
    version: string
    corpusRootSha256: string
    path: string
  }
  changedPaths: string[]
  fixtureChanges: string[]
  sourceChanges: string[]
  caseChanges: string[]
}

export class V137ConformanceCandidateError extends Error {
  constructor(readonly code: string) {
    super(`Conformance corpus candidate rejected: ${code}.`)
    this.name = "V137ConformanceCandidateError"
  }
}

const fail = (code: string): never => {
  throw new V137ConformanceCandidateError(code)
}

const sha256 = (value: Uint8Array | string): string =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const renderJson = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`

const inside = (candidate: string, root: string): boolean => {
  const relative = path.relative(root, candidate)
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  )
}

const changed = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) !== JSON.stringify(right)

const OBSERVATION_DECISIONS_V3 = Object.freeze([
  "D-01",
  "D-02",
  "D-03",
  "D-04",
  "D-05",
  "D-06",
  "D-07",
  "D-08",
] as const)

const PROTECTED_OBSERVATION_SURFACES_V3 = Object.freeze([
  "valid-match-state",
  "action-legality",
  "canonical-event-order",
  "match-outcome",
  "v1.4-history",
  "hold-or-end-activation-vocabulary",
  "failure-ownership",
  "public-privacy-boundary",
] as const)

const observationExpectedSelection = {
  activationOrders: [
    {
      soldierId: "soldier:fixture:active",
      objective: {
        fixture: "v1.37-observation-v1.19",
        initiative: {
          initialInitiativePlayerId: "player:bottom",
          hasInitialInitiative: true,
          roundInitiativePlayerId: "player:bottom",
          hasRoundInitiative: true,
        },
        intent: "stone",
      },
    },
  ],
  strategyMemory: {
    fixture: "v1.37-observation-v1.19",
    initiative: {
      initialInitiativePlayerId: "player:bottom",
      hasInitialInitiative: true,
      roundInitiativePlayerId: "player:bottom",
      hasRoundInitiative: true,
    },
  },
}

const observationExpectedBrain = {
  action: { type: "TURN_TO_STONE" },
  soldierMemory: {
    fixture: "v1.37-observation-v1.19",
    hasAdvancedThisActivation: false,
  },
}

export const createV137ObservationCorpusV3Candidate =
  (): V137ConformanceCorpus => {
    const candidate = globalThis.structuredClone(
      V1_37_CONFORMANCE_CORPUS,
    ) as V137ConformanceCorpus
    candidate.version = "v3"
    candidate.behaviorManifest = {
      id: "behavior:truthful-strategy-observations:v1.19",
      description:
        "Consume kernel-owned initial and Round initiative plus pre-Action activation-slot Advance observations without changing gameplay.",
      invocationScript: OBSERVATION_CASES_V3.map(
        ([caseId, methodName], ordinal) => ({
          ordinal,
          methodName,
          inputFixtureId: `fixture:${caseId}`,
        }),
      ),
      expectedSelection: observationExpectedSelection,
      expectedBrain: observationExpectedBrain,
    }
    const sources = {
      typescript: TYPESCRIPT_OBSERVATION_FIXTURE_V3,
      python: PYTHON_OBSERVATION_FIXTURE_V3,
      rust: RUST_OBSERVATION_FIXTURE_V3,
      zig: ZIG_OBSERVATION_FIXTURE_V3,
    } as const
    for (const fixture of candidate.fixtures) {
      fixture.behaviorManifestId = candidate.behaviorManifest.id
      fixture.source = sources[fixture.languageId]
      fixture.sourceSha256 = sha256(fixture.source)
    }
    const requiredLanguageIds = [...V1_37_CONFORMANCE_CORPUS.languageIds]
    for (const [caseId] of OBSERVATION_CASES_V3) {
      candidate.cases.push({
        id: caseId,
        kind: "normative",
        capability: "valid-behavior",
        executionMode: "strategy",
        seed: null,
        generatorId: null,
        mutationTarget: null,
        required: true,
        unsupportedDisposition: "fail-certification",
        requiredLanguageIds,
        expectation: {
          resultClass: "success",
          reasonCode: "OBSERVATION_CONSUMED",
          failingBoundary: "none",
          gameplayMutation: false,
          retryable: false,
          traceRef: `trace:${caseId}`,
        },
      })
    }
    candidate.cases.sort((left, right) => left.id.localeCompare(right.id))
    candidate.corpusRootSha256 = computeV137ConformanceCorpusRoot(candidate)
    validateV137ConformanceCorpus(candidate)
    return candidate
  }

const semanticDiff = (
  candidate: V137ConformanceCorpus,
  corpusPath: string,
): V137ConformanceSemanticDiff => {
  const changedPaths = new Set<string>()
  if (candidate.version !== V1_37_CONFORMANCE_CORPUS.version) {
    changedPaths.add("version")
  }
  if (
    changed(
      candidate.behaviorManifest,
      V1_37_CONFORMANCE_CORPUS.behaviorManifest,
    )
  ) {
    changedPaths.add("behaviorManifest")
  }
  const fixtureChanges: string[] = []
  const sourceChanges = new Set<string>()
  for (const fixture of candidate.fixtures) {
    const baseline = V1_37_CONFORMANCE_CORPUS.fixtures.find(
      ({ languageId }) => languageId === fixture.languageId,
    )
    for (const field of GOVERNED_FIXTURE_FIELDS) {
      if (baseline === undefined || fixture[field] !== baseline[field]) {
        const changedPath = `fixtures.${fixture.languageId}.${field}`
        changedPaths.add(changedPath)
        fixtureChanges.push(changedPath)
        if (field === "source") sourceChanges.add(fixture.languageId)
      }
    }
  }
  const caseChanges: string[] = []
  const baselineCases = new Map(
    V1_37_CONFORMANCE_CORPUS.cases.map((testCase) => [testCase.id, testCase]),
  )
  const candidateCases = new Map(
    candidate.cases.map((testCase) => [testCase.id, testCase]),
  )
  for (const caseId of new Set([
    ...baselineCases.keys(),
    ...candidateCases.keys(),
  ])) {
    if (changed(baselineCases.get(caseId), candidateCases.get(caseId))) {
      caseChanges.push(caseId)
      changedPaths.add(`cases.${caseId}`)
    }
  }
  changedPaths.add("corpusRootSha256")
  return {
    schemaVersion: "v1.37-executable-conformance-semantic-diff-v1",
    generatedBy: "scripts/generate-v1-37-conformance-corpus.ts",
    baseline: {
      version: V1_37_CONFORMANCE_CORPUS.version,
      corpusRootSha256: V1_37_CONFORMANCE_CORPUS.corpusRootSha256,
      path: V1_37_CONFORMANCE_ACTIVE_REGISTRY.path,
    },
    candidate: {
      version: candidate.version,
      corpusRootSha256: candidate.corpusRootSha256,
      path: corpusPath,
    },
    changedPaths: [...changedPaths].sort(),
    fixtureChanges: fixtureChanges.sort(),
    sourceChanges: [...sourceChanges].sort(),
    caseChanges: caseChanges.sort(),
  }
}

export const writeCommittedV137ObservationCorpusV3Candidate = (
  input: WriteCommittedV137ObservationCorpusV3CandidateInput = {},
): V137ConformanceCandidateResult => {
  const root = path.resolve(input.root ?? repoRoot)
  const destinationRoot = path.join(
    root,
    "packages/golden/src/fixtures/v1-37-conformance-corpus",
  )
  const candidateDirectory = path.join(destinationRoot, "v3")
  if (existsSync(candidateDirectory)) fail("CANDIDATE_VERSION_EXISTS")
  const candidate = createV137ObservationCorpusV3Candidate()
  const corpusPath = path.join(candidateDirectory, "corpus.json")
  const corpusLogicalPath =
    "packages/golden/src/fixtures/v1-37-conformance-corpus/v3/corpus.json"
  const semanticDiffPath = path.join(candidateDirectory, "semantic-diff.json")
  const corpusBytes = renderJson(candidate)
  const diff = semanticDiff(candidate, corpusLogicalPath)
  mkdirSync(candidateDirectory, { recursive: true })
  writeFileSync(corpusPath, corpusBytes, { flag: "wx" })
  writeFileSync(semanticDiffPath, renderJson(diff), { flag: "wx" })
  return {
    version: candidate.version,
    corpusRootSha256: candidate.corpusRootSha256,
    corpusPath,
    corpusLogicalPath,
    semanticDiffPath,
    corpusFileSha256: sha256(corpusBytes),
  }
}

const observationCandidatePaths = (root: string) => {
  const directory = path.join(
    root,
    "packages/golden/src/fixtures/v1-37-conformance-corpus/v3",
  )
  return {
    directory,
    corpusPath: path.join(directory, "corpus.json"),
    semanticDiffPath: path.join(directory, "semantic-diff.json"),
    independentReviewPath: path.join(directory, "independent-review.json"),
  }
}

const readObservationCandidate = (root: string) => {
  const paths = observationCandidatePaths(root)
  const corpusBytes = readFileSync(paths.corpusPath)
  const semanticDiffBytes = readFileSync(paths.semanticDiffPath)
  let corpus: V137ConformanceCorpus
  try {
    corpus = JSON.parse(corpusBytes.toString("utf8")) as V137ConformanceCorpus
    validateV137ConformanceCorpus(corpus)
  } catch {
    return fail("CANDIDATE_CORPUS_STALE")
  }
  const expected = createV137ObservationCorpusV3Candidate()
  if (renderJson(corpus) !== renderJson(expected)) {
    fail("CANDIDATE_CORPUS_STALE")
  }
  const diff = JSON.parse(semanticDiffBytes.toString("utf8")) as {
    generatedBy: string
    candidate: { version: string; corpusRootSha256: string; path: string }
    changedPaths: string[]
    fixtureChanges: string[]
    sourceChanges: string[]
    caseChanges: string[]
  }
  const expectedDiff = semanticDiff(
    expected,
    "packages/golden/src/fixtures/v1-37-conformance-corpus/v3/corpus.json",
  )
  if (
    renderJson(diff) !== renderJson(expectedDiff) ||
    diff.generatedBy !== "scripts/generate-v1-37-conformance-corpus.ts" ||
    diff.candidate.version !== "v3" ||
    diff.candidate.corpusRootSha256 !== corpus.corpusRootSha256 ||
    diff.sourceChanges.join(",") !== "python,rust,typescript,zig" ||
    diff.caseChanges.join(",") !==
      OBSERVATION_CASES_V3.map(([caseId]) => caseId)
        .sort()
        .join(",") ||
    diff.changedPaths.some(
      (changedPath) =>
        changedPath !== "version" &&
        changedPath !== "corpusRootSha256" &&
        changedPath !== "behaviorManifest" &&
        !changedPath.startsWith("fixtures.") &&
        !changedPath.startsWith("cases.observation-d"),
    )
  ) {
    fail("SEMANTIC_DIFF_UNAPPROVED")
  }
  const baselineCases = new Map(
    V1_37_CONFORMANCE_CORPUS.cases.map((testCase) => [testCase.id, testCase]),
  )
  for (const testCase of corpus.cases) {
    const baseline = baselineCases.get(testCase.id)
    if (
      (baseline !== undefined && changed(baseline, testCase)) ||
      (baseline === undefined && testCase.expectation.gameplayMutation)
    ) {
      fail("GAMEPLAY_OR_HISTORY_DELTA")
    }
  }
  if (
    corpus.fixtures.some(({ source }) =>
      /\b(?:HOLD|END_ACTIVATION)\b/u.test(source),
    )
  ) {
    fail("HOLD_DELTA_FORBIDDEN")
  }
  return { paths, corpus, corpusBytes, semanticDiffBytes, diff }
}

const caseRoots = (corpus: V137ConformanceCorpus) =>
  corpus.cases.map((testCase) => ({
    caseId: testCase.id,
    rootSha256: sha256(renderJson(testCase)),
  }))

const sourceRoots = (corpus: V137ConformanceCorpus) =>
  corpus.fixtures.map(({ languageId, sourceSha256 }) => ({
    languageId,
    sourceSha256,
  }))

export const reviewCommittedV137ObservationCorpusV3Candidate = (
  input: ReviewCommittedV137ObservationCorpusV3CandidateInput,
): V137ObservationCorpusV3IndependentReview => {
  if (
    input.reviewedBy === "scripts/generate-v1-37-conformance-corpus.ts" ||
    !/^phase-260-plan-11-independent-[a-z-]+$/u.test(input.reviewedBy)
  ) {
    fail("SELF_AUTHORED_REVIEW")
  }
  const root = path.resolve(input.root ?? repoRoot)
  const candidate = readObservationCandidate(root)
  const cases = caseRoots(candidate.corpus)
  const sources = sourceRoots(candidate.corpus)
  const review: V137ObservationCorpusV3IndependentReview = {
    schemaVersion: "v1.37-executable-conformance-independent-review-v1",
    reviewedBy: input.reviewedBy,
    lifecycle: "inactive-candidate",
    current: false,
    status: "approved-inactive-observation-candidate",
    candidateVersion: "v3",
    candidateCorpusRootSha256: candidate.corpus.corpusRootSha256,
    candidateCorpusFileSha256: sha256(candidate.corpusBytes),
    semanticDiffFileSha256: sha256(candidate.semanticDiffBytes),
    caseInventoryRootSha256: sha256(renderJson(cases)),
    sourceInventoryRootSha256: sha256(renderJson(sources)),
    caseRoots: cases,
    sourceRoots: sources,
    decisionDispositions: OBSERVATION_DECISIONS_V3.map((decisionId) => ({
      decisionId,
      disposition: "approved-observation-only",
    })),
    protectedSurfaces: PROTECTED_OBSERVATION_SURFACES_V3.map((surface) => ({
      surface,
      disposition: "unchanged",
    })),
    approvedChangedPaths: candidate.diff.changedPaths,
  }
  writeFileSync(candidate.paths.independentReviewPath, renderJson(review), {
    flag: "wx",
  })
  return review
}

export const checkCommittedV137ObservationCorpusV3Candidate = (
  input: WriteCommittedV137ObservationCorpusV3CandidateInput = {},
): string[] => {
  const root = path.resolve(input.root ?? repoRoot)
  const errors: string[] = []
  try {
    const candidate = readObservationCandidate(root)
    const reviewBytes = readFileSync(candidate.paths.independentReviewPath)
    const review = JSON.parse(
      reviewBytes.toString("utf8"),
    ) as V137ObservationCorpusV3IndependentReview
    const cases = caseRoots(candidate.corpus)
    const sources = sourceRoots(candidate.corpus)
    if (
      review.schemaVersion !==
        "v1.37-executable-conformance-independent-review-v1" ||
      review.reviewedBy !==
        "phase-260-plan-11-independent-observation-review" ||
      review.lifecycle !== "inactive-candidate" ||
      review.current !== false ||
      review.status !== "approved-inactive-observation-candidate" ||
      review.candidateVersion !== "v3" ||
      review.candidateCorpusRootSha256 !== candidate.corpus.corpusRootSha256 ||
      review.candidateCorpusFileSha256 !== sha256(candidate.corpusBytes) ||
      review.semanticDiffFileSha256 !== sha256(candidate.semanticDiffBytes) ||
      review.caseInventoryRootSha256 !== sha256(renderJson(cases)) ||
      review.sourceInventoryRootSha256 !== sha256(renderJson(sources)) ||
      renderJson(review.caseRoots) !== renderJson(cases) ||
      renderJson(review.sourceRoots) !== renderJson(sources) ||
      review.decisionDispositions
        .map(({ decisionId }) => decisionId)
        .join(",") !== OBSERVATION_DECISIONS_V3.join(",") ||
      review.decisionDispositions.some(
        ({ disposition }) => disposition !== "approved-observation-only",
      ) ||
      review.protectedSurfaces.map(({ surface }) => surface).join(",") !==
        PROTECTED_OBSERVATION_SURFACES_V3.join(",") ||
      review.protectedSurfaces.some(
        ({ disposition }) => disposition !== "unchanged",
      ) ||
      renderJson(review.approvedChangedPaths) !==
        renderJson(candidate.diff.changedPaths)
    ) {
      errors.push("independent review is stale, self-authored, or incomplete")
    }
    const pin = V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN
    if (
      pin.lifecycle !== "inactive-candidate" ||
      pin.current !== false ||
      pin.candidateVersion !== "v3" ||
      pin.corpusRootSha256 !== candidate.corpus.corpusRootSha256 ||
      pin.corpusFileSha256 !== sha256(candidate.corpusBytes) ||
      pin.semanticDiffFileSha256 !== sha256(candidate.semanticDiffBytes) ||
      pin.independentReviewFileSha256 !== sha256(reviewBytes) ||
      pin.caseInventoryRootSha256 !== review.caseInventoryRootSha256 ||
      pin.sourceInventoryRootSha256 !== review.sourceInventoryRootSha256 ||
      renderJson(pin.caseRoots) !== renderJson(review.caseRoots) ||
      renderJson(pin.sourceRoots) !== renderJson(review.sourceRoots)
    ) {
      errors.push("inactive candidate pin does not bind exact reviewed bytes")
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error))
  }
  return errors
}

export const writeV137ConformanceCandidate = (
  input: WriteV137ConformanceCandidateInput,
): V137ConformanceCandidateResult => {
  if (!VERSION.test(input.nextVersion)) fail("CANDIDATE_VERSION")
  if (input.nextVersion === V1_37_CONFORMANCE_CORPUS.version) {
    fail("ACTIVE_VERSION_REUSE_FORBIDDEN")
  }
  const destinationRoot = path.resolve(input.destinationRoot)
  const candidateDirectory = path.join(destinationRoot, input.nextVersion)
  if (inside(candidateDirectory, ACTIVE_GOLDEN_ROOT)) {
    fail("ACTIVE_GOLDEN_OVERWRITE_FORBIDDEN")
  }
  if (existsSync(candidateDirectory)) fail("CANDIDATE_VERSION_EXISTS")

  const candidate = globalThis.structuredClone(
    input.candidateCorpus ?? V1_37_CONFORMANCE_CORPUS,
  ) as V137ConformanceCorpus
  candidate.version = input.nextVersion
  for (const fixture of candidate.fixtures) {
    fixture.sourceSha256 = sha256(fixture.source)
  }
  candidate.corpusRootSha256 = computeV137ConformanceCorpusRoot(candidate)
  validateV137ConformanceCorpus(candidate)

  const corpusPath = path.join(candidateDirectory, "corpus.json")
  const corpusLogicalPath = path.posix.join(input.nextVersion, "corpus.json")
  const semanticDiffPath = path.join(candidateDirectory, "semantic-diff.json")
  const corpusBytes = renderJson(candidate)
  const diff = semanticDiff(candidate, corpusLogicalPath)
  mkdirSync(candidateDirectory, { recursive: true })
  writeFileSync(corpusPath, corpusBytes, { flag: "wx" })
  writeFileSync(semanticDiffPath, renderJson(diff), { flag: "wx" })
  return {
    version: candidate.version,
    corpusRootSha256: candidate.corpusRootSha256,
    corpusPath,
    corpusLogicalPath,
    semanticDiffPath,
    corpusFileSha256: sha256(corpusBytes),
  }
}

export const parseV137ConformanceCandidateArgs = (
  args: readonly string[],
): V137ConformanceCandidateArgs => {
  const allowed = new Set(["--version", "--destination", "--input"])
  if (
    args.length < 4 ||
    args.length % 2 !== 0 ||
    args.some((value, index) => index % 2 === 0 && !allowed.has(value))
  ) {
    fail("CANDIDATE_ARGUMENTS")
  }
  const values = new Map<string, string>()
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index]
    const value = args[index + 1]
    if (
      key === undefined ||
      value === undefined ||
      value.length === 0 ||
      values.has(key)
    ) {
      fail("CANDIDATE_ARGUMENTS")
    }
    values.set(key, value)
  }
  const nextVersion = values.get("--version")
  const destinationRoot = values.get("--destination")
  if (nextVersion === undefined || destinationRoot === undefined) {
    fail("CANDIDATE_ARGUMENTS")
  }
  return {
    nextVersion,
    destinationRoot,
    inputPath: values.get("--input"),
  }
}

const main = (): void => {
  const rawArgs = process.argv.slice(2)
  if (rawArgs.length === 1 && rawArgs[0] === "--check-candidate=v3") {
    const errors = checkCommittedV137ObservationCorpusV3Candidate()
    if (errors.length > 0) throw new Error(errors.join("\n"))
    console.log(
      `v1.37 conformance corpus candidate v3: ${V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.corpusRootSha256} inactive`,
    )
    return
  }
  const args = parseV137ConformanceCandidateArgs(rawArgs)
  const candidateCorpus =
    args.inputPath === undefined
      ? undefined
      : (JSON.parse(
          readFileSync(path.resolve(args.inputPath), "utf8"),
        ) as V137ConformanceCorpus)
  const result = writeV137ConformanceCandidate({
    destinationRoot: args.destinationRoot,
    nextVersion: args.nextVersion,
    ...(candidateCorpus === undefined ? {} : { candidateCorpus }),
  })
  console.log(
    `v1.37 conformance candidate ${result.version}: ${result.corpusRootSha256} at ${result.corpusLogicalPath}`,
  )
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
