import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
/* eslint-disable-next-line no-restricted-imports -- Generator tests compare the exact source modules, not package projections. */
import { CANONICAL_ARENA_CATALOG_V1_37 } from "../packages/spec/src/arena-catalog-v1-37.js"
/* eslint-disable-next-line no-restricted-imports -- Generator tests pin the exact compact current selector module. */
import { CURRENT_SEMANTIC_AUTHORITY_GENERATED } from "../packages/spec/src/current-semantic-authority-generated.js"
/* eslint-disable-next-line no-restricted-imports -- Generator tests compare the explicit candidate-only tuple record. */
import {
  CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_RECORD,
} from "../packages/spec/src/integrity-authority.js"
/* eslint-disable-next-line no-restricted-imports -- Generator tests compare exact authority source ordering and bytes. */
import {
  CANONICAL_SET_CONDITION_ROWS_V1_37,
  SET_CONDITION_POLICY_V1_37,
} from "../packages/spec/src/set-condition-policy-v1-37.js"
import {
  buildV137ArenaSetAuthorityArtifacts,
  checkV137ArenaSetAuthorityArtifacts,
  renderV137ArenaSetAuthorityArtifacts,
  runV137ArenaSetAuthorityGenerator,
  v137ArenaSetAuthorityOutputPaths,
} from "./generate-v1-37-arena-set-authority.js"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

const clone = <T>(value: T): T => globalThis.structuredClone(value)

describe("v1.37 arena and Set Go authority generator", () => {
  it("builds the exact closed candidate records and Phase-259 current selector", () => {
    const authority = buildV137ArenaSetAuthorityArtifacts()
    expect(authority.source.candidateSemanticAuthorityKey).toBe("runtime-v1.19")
    expect(authority.source.candidateTuple).toEqual(
      CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_RECORD,
    )
    expect(authority.source.arenaCatalog).toEqual(
      CANONICAL_ARENA_CATALOG_V1_37,
    )
    expect(authority.source.setPolicy).toEqual(SET_CONDITION_POLICY_V1_37)
    expect(authority.source.conditionRows).toEqual(
      CANONICAL_SET_CONDITION_ROWS_V1_37,
    )
    expect(authority.source.currentSelection).toEqual(
      CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection,
    )
    expect(authority.source.currentSelection).toMatchObject({
      semanticAuthorityKey: "runtime-v1.17",
      runtimeAbiVersion: "strategy-runtime-abi-v1.17",
      arenaCatalogVersion: "semantic-arena-catalog-v1.37-candidate-1",
      setPolicyVersion: "canonical-set-policy-v1.4",
      conformanceCertificateVersion: "runtime-conformance-certificate-v1.17",
    })
  })

  it("renders all three Go files deterministically and checks every byte", () => {
    const rendered = renderV137ArenaSetAuthorityArtifacts()
    expect(Object.keys(rendered)).toEqual(v137ArenaSetAuthorityOutputPaths)
    expect(new Set(Array.from({ length: 5 }, () =>
      JSON.stringify(renderV137ArenaSetAuthorityArtifacts()),
    )).size).toBe(1)

    const persisted = new Map(Object.entries(rendered))
    expect(
      checkV137ArenaSetAuthorityArtifacts((relativePath) => {
        const bytes = persisted.get(relativePath)
        if (bytes === undefined) throw new Error("missing")
        return bytes
      }),
    ).toEqual([])

    for (const relativePath of v137ArenaSetAuthorityOutputPaths) {
      const stale = new Map(persisted)
      stale.set(relativePath, `${stale.get(relativePath)} `)
      expect(
        checkV137ArenaSetAuthorityArtifacts((candidatePath) => {
          const bytes = stale.get(candidatePath)
          if (bytes === undefined) throw new Error("missing")
          return bytes
        }),
      ).toEqual([`STALE_OUTPUT:${relativePath}`])
    }
  })

  it("rejects extra, reordered, aliased, seeded, stale, and preactivation drift", () => {
    const catalog = clone(CANONICAL_ARENA_CATALOG_V1_37)
    catalog.arenas.reverse()
    expect(() => buildV137ArenaSetAuthorityArtifacts({ arenaCatalog: catalog }))
      .toThrow(/catalog|order/iu)

    const rows = clone(CANONICAL_SET_CONDITION_ROWS_V1_37)
    rows[0]!.suffix = "a-bottom-b-first"
    expect(() => buildV137ArenaSetAuthorityArtifacts({ conditionRows: rows }))
      .toThrow(/condition/iu)

    const policy = clone(SET_CONDITION_POLICY_V1_37)
    ;(policy as { seedCarriesFairnessSemantics: boolean })
      .seedCarriesFairnessSemantics = true
    expect(() => buildV137ArenaSetAuthorityArtifacts({ setPolicy: policy }))
      .toThrow(/policy|seed/iu)

    const currentSelection = clone(CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection)
    ;(currentSelection as { semanticAuthorityKey: string }).semanticAuthorityKey =
      "runtime-v1.19"
    expect(() =>
      buildV137ArenaSetAuthorityArtifacts({ currentSelection }),
    ).toThrow(/Phase-259|current/iu)

    const candidateTuple = clone(CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_RECORD)
    ;(candidateTuple.tuple as { arenaCatalog: string }).arenaCatalog =
      "semantic-arena-catalog-v1.37-candidate-1"
    expect(() => buildV137ArenaSetAuthorityArtifacts({ candidateTuple }))
      .toThrow(/candidate|tuple/iu)
  })

  it("owns strict write/check CLI modes without environment or toolchain input", () => {
    const persisted = new Map<string, string>()
    expect(
      runV137ArenaSetAuthorityGenerator(["--write", "--check"], {
        readOutput: (relativePath) => {
          const bytes = persisted.get(relativePath)
          if (bytes === undefined) throw new Error("missing")
          return bytes
        },
        writeOutput: (relativePath, bytes) => {
          persisted.set(relativePath, bytes)
        },
      }),
    ).toEqual({ wrote: true, checked: true })
    expect(persisted.size).toBe(3)
    expect(() => runV137ArenaSetAuthorityGenerator([], {
      readOutput: () => "",
      writeOutput: () => undefined,
    })).toThrow(/--write|--check/u)
    expect(() => runV137ArenaSetAuthorityGenerator(["--latest"], {
      readOutput: () => "",
      writeOutput: () => undefined,
    })).toThrow(/unknown/iu)

    const source = readFileSync(
      path.join(repoRoot, "scripts/generate-v1-37-arena-set-authority.ts"),
      "utf8",
    )
    expect(source).not.toMatch(
      /DATABASE_URL|postgres|child_process|spawnSync|execFileSync|process\.env|Date\.now|new Date|Math\.random/iu,
    )
  })
})
