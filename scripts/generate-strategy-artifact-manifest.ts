#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  COMPATIBILITY_VERSIONS,
  StrategyArtifactSchema,
  defaultRuntimeMetadata,
  runtimeCompatibilityKey,
  type StrategyArtifact,
} from "../packages/spec/src/index.ts"
import {
  listAdvancedStrategies,
  type AdvancedStrategySummary,
} from "../packages/persistence/src/advanced-strategies.ts"
import {
  listStarterStrategies,
  type StarterStrategySummary,
} from "../packages/persistence/src/starter-strategies.ts"
import {
  listWorkshopTemplates,
  type WorkshopTemplateSummary,
} from "../packages/persistence/src/workshop.ts"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

const manifestPath = path.join(
  repoRoot,
  "packages/spec/artifacts/strategy-artifacts.v1.14.json",
)

const lockedAt = "2026-05-23T00:00:00.000Z"

const sha256 = (value: string): string =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const stableJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`

const runtime = defaultRuntimeMetadata("typescript")

const compatibilityKeyFor = (sourceHash: string): string =>
  sha256(
    JSON.stringify(
      runtimeCompatibilityKey({
        runtime,
        sourceHash,
        specVersion: COMPATIBILITY_VERSIONS.spec,
        engineVersion: COMPATIBILITY_VERSIONS.engine,
      }),
    ),
  )

const sourceFormat = (source: string): "javascript" | "typescript" =>
  /\btype\s+|\binterface\s+|:\s*[A-Za-z_$][\w$]*/.test(source)
    ? "typescript"
    : "javascript"

const commonArtifact = (input: {
  id: string
  kind: StrategyArtifact["kind"]
  source: string
  sourceHash: string
  sourceBytes: number
  validation: StrategyArtifact["validation"]
  publicMetadata: StrategyArtifact["publicMetadata"]
  lineage: StrategyArtifact["lineage"]
}): StrategyArtifact => {
  const compatibilityKey = compatibilityKeyFor(input.sourceHash)
  return StrategyArtifactSchema.parse({
    id: input.id,
    kind: input.kind,
    sourceVisibility: "built-in-forkable",
    forkEligibility: { forkable: true },
    source: {
      text: input.source,
      hash: input.sourceHash,
      bytes: input.sourceBytes,
      format: sourceFormat(input.source),
      entrypoint: "default",
    },
    runtime,
    engineCompatibility: {
      spec: COMPATIBILITY_VERSIONS.spec,
      engine: COMPATIBILITY_VERSIONS.engine,
    },
    validation: input.validation,
    publicMetadata: input.publicMetadata,
    lineage: input.lineage,
    immutableEligibility: {
      lockedAt,
      sourceHash: input.sourceHash,
      validationStatus: input.validation.valid ? "valid" : "invalid",
      countedRuntimeEligible: input.validation.valid,
      runtimeCompatibility: compatibilityKey,
      engineCompatibility: {
        spec: COMPATIBILITY_VERSIONS.spec,
        engine: COMPATIBILITY_VERSIONS.engine,
      },
    },
    behaviorCompatibility: {
      compatibilityKey,
      behaviorSignificantFields: [
        "source.hash",
        "source.bytes",
        "runtime",
        "engineCompatibility",
        "validation.valid",
      ],
    },
  })
}

const starterArtifact = (starter: StarterStrategySummary): StrategyArtifact =>
  commonArtifact({
    id: `strategy-artifact:${starter.id}`,
    kind: "starter",
    source: starter.source,
    sourceHash: starter.sourceHash,
    sourceBytes: starter.sourceBytes,
    validation: starter.validation,
    publicMetadata: {
      name: starter.name,
      description: starter.description,
      tags: starter.tags,
      version: starter.version,
      level: "starter",
    },
    lineage: {
      starterLineage: {
        starterId: starter.id,
        starterName: starter.name,
        starterVersion: starter.version,
        sourceHash: starter.sourceHash,
      },
    },
  })

const advancedArtifact = (
  advanced: AdvancedStrategySummary,
): StrategyArtifact =>
  commonArtifact({
    id: `strategy-artifact:${advanced.id}`,
    kind: "advanced",
    source: advanced.source,
    sourceHash: advanced.sourceHash,
    sourceBytes: advanced.sourceBytes,
    validation: advanced.validation,
    publicMetadata: {
      name: advanced.name,
      description: advanced.description,
      tags: advanced.tags,
      version: advanced.version,
      level: "advanced",
      archetype: advanced.primaryArchetype,
      benchmarkStarterId: advanced.benchmarkStarterId,
    },
    lineage: {
      advancedLineage: {
        advancedId: advanced.id,
        advancedName: advanced.name,
        advancedVersion: advanced.version,
        archetype: advanced.primaryArchetype,
        sourceHash: advanced.sourceHash,
      },
      derivedFrom: {
        artifactId: `strategy-artifact:${advanced.benchmarkStarterId}`,
        kind: "starter",
        sourceHash: advanced.sourceHash,
        label: advanced.benchmarkStarterId,
      },
    },
  })

const templateArtifact = (
  template: WorkshopTemplateSummary,
): StrategyArtifact =>
  commonArtifact({
    id: `strategy-artifact:${template.id}`,
    kind: "template",
    source: template.source,
    sourceHash: template.validation.sourceHash,
    sourceBytes: template.validation.sourceBytes,
    validation: template.validation,
    publicMetadata: {
      label: template.label,
      name: template.label,
      version: "v1.14",
      level: "template",
    },
    lineage: {},
  })

const buildManifest = () => {
  const artifacts = [
    ...listStarterStrategies().map(starterArtifact),
    ...listAdvancedStrategies().map(advancedArtifact),
    ...listWorkshopTemplates().map(templateArtifact),
  ].sort((left, right) => left.id.localeCompare(right.id))
  const contentHash = sha256(stableJson(artifacts))
  return {
    schemaVersion: "strategy-artifact-manifest-v1.14",
    generatedBy: "scripts/generate-strategy-artifact-manifest.ts",
    sourceOfTruth: "typescript-registries",
    artifactCount: artifacts.length,
    contentHash,
    artifacts,
  }
}

const assertNoOwnerPrivateSource = (manifest: ReturnType<typeof buildManifest>) => {
  for (const artifact of manifest.artifacts) {
    if (artifact.kind === "account-revision") {
      throw new Error("Generated built-in manifest must not contain account revisions")
    }
    if (artifact.sourceVisibility !== "built-in-forkable") {
      throw new Error(`${artifact.id} is not explicitly built-in forkable`)
    }
    if (!artifact.forkEligibility.forkable) {
      throw new Error(`${artifact.id} is not fork eligible`)
    }
  }
}

const main = () => {
  const check = process.argv.includes("--check")
  const manifest = buildManifest()
  assertNoOwnerPrivateSource(manifest)
  const next = stableJson(manifest)
  if (check) {
    if (!existsSync(manifestPath)) {
      throw new Error(`Manifest is missing: ${manifestPath}`)
    }
    const current = readFileSync(manifestPath, "utf8")
    if (current !== next) {
      throw new Error(
        "Strategy artifact manifest is stale. Run pnpm strategy-artifacts:generate.",
      )
    }
    console.log(
      `strategy artifact manifest ok: ${manifest.artifactCount} artifacts`,
    )
    return
  }
  writeFileSync(manifestPath, next)
  console.log(`wrote ${path.relative(repoRoot, manifestPath)}`)
}

main()
