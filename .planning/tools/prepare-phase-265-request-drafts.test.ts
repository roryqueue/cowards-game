import { chmodSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { admitCanonicalJsonValue, CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import * as ts from "typescript"
import { createFactoryRepository, publishFactoryArtifact } from "../../packages/strategy-lab/src/factory/repository.js"
import { labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { LEAGUE_APPROVED_PROSPECTIVE_POLICY } from "../../packages/strategy-lab/src/league/allocation.js"
import { createPhase265RequestDrafts, writePhase265RequestDraftsExclusive } from "./prepare-phase-265-request-drafts.js"
import { factoryAssessmentImplementationManifest } from "../../scripts/v1-38-factory-implementation.js"

const canonical = (value: unknown) => {
  const result = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!result.ok) throw new Error("canonical test fixture failed")
  return result.canonicalBytes
}
const root = (digit: string) => `sha256:${digit.repeat(64)}` as LabRoot
const configTemplate = 'model = "gpt-5.6-sol"\napproval_policy = "never"\nsandbox_mode = "read-only"\n'
const bytesRoot = (value: string | Uint8Array) => `sha256:${createHash("sha256").update(value).digest("hex")}` as LabRoot
const settingsRoot = () => bytesRoot(configTemplate)
const sourceBuildDisclosure = (settingsRoot: LabRoot, providerId: string, clientVersion: string) => {
  const manifest = factoryAssessmentImplementationManifest()
  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { packageManager: string }
  const toolchainPreimage = { node: process.version, v8: process.versions.v8, openssl: process.versions.openssl, packageManager: pkg.packageManager, typescriptVersion: ts.version, lockfileRoot: bytesRoot(readFileSync("pnpm-lock.yaml")), platform: process.platform, architecture: process.arch }
  return {
    schemaVersion: "phase265-source-build-disclosure-v3", privacy: "private_offline", sourceCommit: "25ba6a10cb11ca74bf53738aca5e2396fd974a24",
    implementationRoot: "sha256:67d8f60e2691582d2d4e7f8d5f7ba52deb5a1ec65784111161f3adeb85ba7049", sourceRoot: "sha256:32465649b2c9727c116a6bb2e661315f0e7eea256db58b7afa421a4acf836fe9",
    entries: manifest.entries,
    toolchain: { preimage: toolchainPreimage, root: labRoot("phase265-request-toolchain-v1", toolchainPreimage) },
    modelSettings: { settingsRoot, configTemplateUtf8: configTemplate, requestedProvider: providerId, requestedModel: "gpt-5.6-sol", strictConfig: true, toolUseDisabled: true },
    scope: "Reviewed current source/build inputs and exact local authoring configuration.",
  }
}

describe("Phase 265 request drafts", () => {
  it("creates 11 target-free unsigned drafts matching the approved schedule and provenance boundaries", () => {
    const parent = mkdtempSync(join(tmpdir(), "phase265-drafts-")), repositoryPath = join(parent, "factory-response"), historicalPath = join(parent, "factory-history")
    mkdirSync(repositoryPath); mkdirSync(historicalPath)
    const repository = createFactoryRepository(realpathSync(repositoryPath)), historicalFactoryRepository = createFactoryRepository(realpathSync(historicalPath))
    const executable = join(parent, "codex"), authFile = join(parent, "auth.json"), outputPath = join(parent, "drafts.json")
    writeFileSync(executable, "fixture executable", { mode: 0o700 }); chmodSync(executable, 0o700)
    writeFileSync(authFile, "never read or copied")
    const dependency = publishFactoryArtifact(repository, canonical(sourceBuildDisclosure(settingsRoot(), "fixture-provider", "0.154.0")))
    const bases = ["S01", "S03", "S05"].map((sourceSlot, i) => {
      let artifactIndex = 0
      const reference = () => publishFactoryArtifact(historicalFactoryRepository, canonical({ sourceSlot, i, artifactIndex: artifactIndex++ }))
      return { sourceSlot, publicationArtifactRoot: reference(), candidateAdmissionRoot: root(String(i + 1)), sourceRoot: reference(), supervisionArtifactRoot: reference() }
    })
    const baseManifest = {
      schemaVersion: "phase265-verified-bases-v1",
      historicalAssessment: {
        artifactRoot: "sha256:25913b26fa81fa15177774fbdcf9c0d1ef244ad13910bc664bfde4ea8c2e43f8",
        assessmentRoot: "sha256:0446fef49598ef425c883774adb23159ade4b1e44f630463a72562777a9ecea1",
        thresholdArtifactRoot: "sha256:f6098c9e14ed868e162a9374557e518678996b619f3f8912fb8723113328fa72",
        producerImplementationRoot: "sha256:5baaeb677327a6102fd3dc719543686b14448122a91a4bca320cd0836cf5040b",
        assessmentImplementationRoot: "sha256:6a6094089e6714def26c427f60dfc0fae15e534cc685ad7a76dc883c4911b97c",
      }, bases,
    }
    try {
      const result = createPhase265RequestDrafts({
        baseManifest, repository, historicalFactoryRepository, responseFactoryDependencyRoot: dependency, codexExecutable: executable, authFile,
        clientVersion: "0.154.0", providerId: "fixture-provider", settingsRoot: settingsRoot(), path: "/fixture/bin",
        priorExposure: "local operator source familiarity", outputPath,
      })
      expect(result.jobs).toHaveLength(11)
      expect(result.jobs.map((job: any) => job.producerRequest.producerIdentity)).toEqual(LEAGUE_APPROVED_PROSPECTIVE_POLICY.schedule.flat().map((producer) => ({ tactical: "emitTacticalFactoryPacket", teacher: "emitTeacherFactoryPacket", model: "emitModelFactoryPacket" }[producer])))
      expect(result.jobs.every((job: any) => !("review" in job) && !("reviewArtifactRoot" in job))).toBe(true)
      expect(result.jobs.every((job: any) => job.disclosure.dependencyArtifactRoots[0] === dependency && job.provenance.priorExposure === "local operator source familiarity")).toBe(true)
      const models = result.jobs.filter((job: any) => job.producerRequest.producerIdentity === "emitModelFactoryPacket") as any[]
      expect(models).toHaveLength(5)
      expect(models.map((job) => job.producerRequest.producerInput.request.split)).toEqual(["development", "development", "development", "development", "probe"])
      expect(models.every((job) => job.producerRequest.producerInput.authoring.requestedModel === "gpt-5.6-sol")).toBe(true)
      expect(models.every((job) => job.producerRequest.producerInput.authoring.codexExecutable === executable && job.producerRequest.producerInput.authoring.existingAuthFile === authFile)).toBe(true)
      expect(models.every((job) => !job.producerRequest.producerInput.authoring.sourceMessage.includes("target"))).toBe(true)
      expect(models.every((job) => job.producerRequest.producerInput.authoring.sourceMessage.includes('exactly one JSON object with exactly one string property named "source"'))).toBe(true)
      expect(models.every((job) => job.producerRequest.producerInput.authoring.sourceMessage.includes("strategy-runtime-abi-v1.19") && job.producerRequest.producerInput.authoring.sourceMessage.includes('"UP" | "DOWN" | "LEFT" | "RIGHT"'))).toBe(true)
      expect(() => createPhase265RequestDrafts({
        baseManifest, repository, historicalFactoryRepository, responseFactoryDependencyRoot: dependency, codexExecutable: executable, authFile,
        clientVersion: "0.154.0", providerId: "fixture-provider", settingsRoot: root("b"), path: "/fixture/bin",
        priorExposure: "local operator source familiarity", outputPath,
      })).toThrow("DISCLOSURE_MODEL_SETTINGS")
      const mismatches = [
        { ...sourceBuildDisclosure(settingsRoot(), "fixture-provider", "0.154.0"), sourceCommit: "a".repeat(40) },
        { ...sourceBuildDisclosure(settingsRoot(), "fixture-provider", "0.154.0"), modelSettings: { ...sourceBuildDisclosure(settingsRoot(), "fixture-provider", "0.154.0").modelSettings, configTemplateUtf8: "model = \\\"other\\\"\\n" } },
        { ...sourceBuildDisclosure(settingsRoot(), "fixture-provider", "0.154.0"), toolchain: { ...sourceBuildDisclosure(settingsRoot(), "fixture-provider", "0.154.0").toolchain, preimage: { ...sourceBuildDisclosure(settingsRoot(), "fixture-provider", "0.154.0").toolchain.preimage, node: "v0.0.0-false" } } },
      ]
      for (const mismatch of mismatches) {
        const badDependency = publishFactoryArtifact(repository, canonical(mismatch))
        expect(() => createPhase265RequestDrafts({ baseManifest, repository, historicalFactoryRepository, responseFactoryDependencyRoot: badDependency, codexExecutable: executable, authFile, clientVersion: "0.154.0", providerId: "fixture-provider", settingsRoot: settingsRoot(), path: "/fixture/bin", priorExposure: "local operator source familiarity", outputPath })).toThrow()
      }
      const teachers = result.jobs.filter((job: any) => job.producerRequest.producerIdentity === "emitTeacherFactoryPacket") as any[]
      expect(teachers).toHaveLength(3)
      for (const job of teachers) {
        const input = job.producerRequest.producerInput
        expect(input.searches).toHaveLength(2)
        expect(input.searches.reduce((sum: number, search: any) => sum + search.maxNodes, 0)).toBe(100)
        expect(input.searches.every((search: any) => search.maxDepth >= 1 && [search.canonicalMatch.bottomPlayerId, search.canonicalMatch.topPlayerId].includes(search.studentPlayerId))).toBe(true)
        expect(input.searches.every((search: any) => CANONICAL_ARENA_CATALOG_V1_37.arenas.some((arena) => arena.status === "active" && arena.schedulable && arena.id === search.canonicalMatch.arenaVariant.id))).toBe(true)
      }
      expect(result.jobs.filter((job: any) => job.producerRequest.producerIdentity === "emitTacticalFactoryPacket")).toHaveLength(3)
      expect(result.jobs.some((job: any) => JSON.stringify(job).includes("targetArtifactRoot"))).toBe(false)
      expect(() => writePhase265RequestDraftsExclusive(outputPath, result)).not.toThrow()
      const bytes = readFileSync(outputPath)
      expect(admitCanonicalJsonValue(JSON.parse(bytes.toString("utf8")), { profile: "canonical-manifest" })).toMatchObject({ ok: true })
      expect(() => writePhase265RequestDraftsExclusive(outputPath, { invalid: true })).toThrow("OUTPUT_EXISTS")
      expect(readFileSync(outputPath)).toEqual(bytes)
    } finally { rmSync(parent, { recursive: true, force: true }) }
  }, 20_000)

  it("rejects an unverified/malformed base or absent dependency before creating output", () => {
    const parent = mkdtempSync(join(tmpdir(), "phase265-drafts-invalid-")), repositoryPath = join(parent, "factory-response"), historicalPath = join(parent, "factory-history")
    mkdirSync(repositoryPath); mkdirSync(historicalPath)
    const repository = createFactoryRepository(realpathSync(repositoryPath)), historicalFactoryRepository = createFactoryRepository(realpathSync(historicalPath)), executable = join(parent, "codex"), authFile = join(parent, "auth.json"), outputPath = join(parent, "drafts.json")
    writeFileSync(executable, "x", { mode: 0o700 }); chmodSync(executable, 0o700); writeFileSync(authFile, "x")
    const goodBase = { schemaVersion: "phase265-verified-bases-v1", historicalAssessment: {}, bases: [] }
    try {
      expect(() => createPhase265RequestDrafts({ baseManifest: goodBase, repository, historicalFactoryRepository, responseFactoryDependencyRoot: root("f"), codexExecutable: executable, authFile, clientVersion: "0.154.0", providerId: "fixture", settingsRoot: settingsRoot(), path: "/bin", priorExposure: "local operator source familiarity", outputPath })).toThrow()
    } finally { rmSync(parent, { recursive: true, force: true }) }
  })
})
