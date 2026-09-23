import { chmodSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { admitCanonicalJsonValue, CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import * as ts from "typescript"
import { createFactoryRepository, publishFactoryArtifact } from "../../packages/strategy-lab/src/factory/repository.js"
import { labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { LEAGUE_APPROVED_PROSPECTIVE_POLICY } from "../../packages/strategy-lab/src/league/allocation.js"
import { assertNoCredentialInventoryPaths, assertPhase265ResponseFactoryPath, createPhase265RequestDrafts, createPhase265SourceBuildDisclosure, parsePhase265DisclosureArguments, publishPhase265SourceBuildDisclosure, writePhase265RequestDraftsExclusive } from "./prepare-phase-265-request-drafts.js"
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
    schemaVersion: "phase265-source-build-disclosure-v3", privacy: "private_offline", sourceCommit: "4eb48e4d0070551cde3e0f7cb86ba7b46c0ed53a",
    implementationRoot: "sha256:92b40fc585ac087928a477924fa1bc560d309bda29e5fe762151a5a0152bf564", sourceRoot: "sha256:945321708ba5e15489fd3de0e2fb90d80425e7b8ba8e89d1ef61569ee99fb3e4",
    entries: manifest.entries,
    toolchain: { preimage: toolchainPreimage, root: labRoot("phase265-request-toolchain-v1", toolchainPreimage) },
    modelSettings: { settingsRoot, configTemplateUtf8: configTemplate, requestedProvider: providerId, requestedModel: "gpt-5.6-sol", strictConfig: true, toolUseDisabled: true },
    scope: "Reviewed current source/build inputs and exact local authoring configuration.",
  }
}

describe("Phase 265 request drafts", () => {
  it("keeps reviewed source and toolchain in one repository regardless of caller cwd", () => {
    const original = process.cwd(), foreign = mkdtempSync(join(tmpdir(), "phase265-foreign-build-"))
    const expected = sourceBuildDisclosure(settingsRoot(), "openai", "0.154.0")
    try {
      writeFileSync(join(foreign, "package.json"), '{"packageManager":"other@0"}')
      writeFileSync(join(foreign, "pnpm-lock.yaml"), "unrelated-lockfile")
      process.chdir(foreign)
      expect(createPhase265SourceBuildDisclosure("openai", settingsRoot())).toEqual(expected)
    } finally { process.chdir(original); rmSync(foreign, { recursive: true, force: true }) }
  })
  it("rejects credential-shaped inventory paths before opening any source bytes", () => {
    const parent = mkdtempSync(join(tmpdir(), "phase265-source-inventory-")), nested = join(parent, "scripts")
    try {
      mkdirSync(nested)
      for (const name of ["auth.json", "auth.yaml", "credentials.toml", "auth.local.json"]) {
        const secret = join(nested, name)
        writeFileSync(secret, "sentinel-never-opened")
        expect(() => assertNoCredentialInventoryPaths(parent, new Set([`scripts/${name}`]))).toThrow("CREDENTIAL_IN_SOURCE_INVENTORY")
        expect(readFileSync(secret, "utf8")).toBe("sentinel-never-opened")
        rmSync(secret)
      }
      writeFileSync(join(nested, "unexpected.json"), "unreviewed-private-input")
      expect(() => assertNoCredentialInventoryPaths(parent, new Set())).toThrow("UNREVIEWED_SOURCE_PATH")
    } finally { rmSync(parent, { recursive: true, force: true }) }
  })
  it("rejects malformed disclosure mode and a historical repository before publication", () => {
    const parent = mkdtempSync(join(tmpdir(), "phase265-disclosure-negative-"))
    try {
      const historical = join(parent, "factory-historical"); mkdirSync(historical)
      const valid = ["--publish-disclosure", "--response-factory", parent, "--provider-id", "openai", "--settings-root", settingsRoot()]
      expect(parsePhase265DisclosureArguments(valid)).toEqual({ repositoryPath: parent, providerId: "openai", settingsRoot: settingsRoot() })
      for (const malformed of [valid.slice(0, 5).concat(["--settings-root", settingsRoot(), "--extra", "x"]), [...valid, "--provider-id", "other"], ["--publish-disclosure", "--response-factory", parent, "--provider-id", "--settings-root", settingsRoot()], ["--publish-disclosure", "--bases", "historical", ...valid.slice(1)]]) expect(() => parsePhase265DisclosureArguments(malformed)).toThrow("DISCLOSURE_ARGUMENTS")
      expect(() => createPhase265SourceBuildDisclosure("--settings-root", settingsRoot())).toThrow("DISCLOSURE_BINDING")
      const repository = createFactoryRepository(realpathSync(historical))
      expect(() => publishPhase265SourceBuildDisclosure(repository, "openai", settingsRoot())).toThrow("RESPONSE_FACTORY_PATH")
      expect(readdirSync(historical)).toEqual([])
    } finally { rmSync(parent, { recursive: true, force: true }) }
  })
  it("requires a real named response directory and preserves idempotent content-addressed bytes", () => {
    const parent = realpathSync(mkdtempSync(join(tmpdir(), "phase265-disclosure-target-"))), responsePath = join(parent, "factory-response"), historicalPath = join(parent, "factory-historical"), aliasPath = join(parent, "factory-response-alias")
    try {
      mkdirSync(responsePath); mkdirSync(historicalPath); symlinkSync(historicalPath, aliasPath)
      const response = createFactoryRepository(realpathSync(responsePath)), historical = createFactoryRepository(realpathSync(historicalPath))
      expect(() => assertPhase265ResponseFactoryPath(response, responsePath)).not.toThrow()
      expect(() => assertPhase265ResponseFactoryPath(historical, aliasPath)).toThrow("RESPONSE_FACTORY_PATH")
      expect(readdirSync(historicalPath)).toEqual([])
      const value = canonical(createPhase265SourceBuildDisclosure("openai", settingsRoot()))
      const first = publishFactoryArtifact(response, value), retained = readFileSync(join(responsePath, `factory-artifact-${first.slice(7)}.bin`))
      expect(publishFactoryArtifact(response, value)).toBe(first)
      expect(readFileSync(join(responsePath, `factory-artifact-${first.slice(7)}.bin`))).toEqual(retained)
    } finally { rmSync(parent, { recursive: true, force: true }) }
  })
  it("creates 11 target-free unsigned drafts matching the approved schedule and provenance boundaries", () => {
    const parent = mkdtempSync(join(tmpdir(), "phase265-drafts-")), repositoryPath = join(parent, "factory-response"), historicalPath = join(parent, "factory-history")
    mkdirSync(repositoryPath); mkdirSync(historicalPath)
    const repository = createFactoryRepository(realpathSync(repositoryPath)), historicalFactoryRepository = createFactoryRepository(realpathSync(historicalPath))
    const executable = join(parent, "codex"), authFile = join(parent, "auth.json"), outputPath = join(parent, "drafts.json")
    writeFileSync(executable, "fixture executable", { mode: 0o700 }); chmodSync(executable, 0o700)
    writeFileSync(authFile, "never read or copied")
    const generated = createPhase265SourceBuildDisclosure("fixture-provider", settingsRoot())
    expect(generated).toEqual(sourceBuildDisclosure(settingsRoot(), "fixture-provider", "0.154.0"))
    const dependency = publishFactoryArtifact(repository, canonical(generated))
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
