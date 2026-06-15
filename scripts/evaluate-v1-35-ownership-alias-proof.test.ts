import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  checkV135OwnershipAliasProofArtifacts,
  generateV135OwnershipAliasProof,
  ownershipAliasArtifactPaths,
  renderV135OwnershipAliasProofJson,
  renderV135OwnershipAliasProofMarkdown,
  validateV135OwnershipAliasProof,
  writeV135OwnershipAliasProofArtifacts,
} from "./evaluate-v1-35-ownership-alias-proof.ts"

const tempRoots: string[] = []

const createTempRepo = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "cowards-v135-owner-alias-"))
  tempRoots.push(root)
  mkdirSync(path.join(root, ".planning/artifacts"), { recursive: true })
  for (const [file, text] of Object.entries({
    "apps/web/app/api/account/revisions/[revisionId]/source/route.ts":
      'getAccountSessionId()\n"cache-control": "private, no-store"',
    "apps/go-backend/live_backend.go":
      "where sr.id = $1 and s.owner_user_id = $2",
    "apps/web/app/api/workshop/source/route.ts":
      'status: 410\n"cache-control": "private, no-store"',
    "apps/web/app/api/workshop/revisions/[revisionId]/source/route.ts":
      'status: 410\n"cache-control": "private, no-store"',
    "apps/web/app/matches/server.ts":
      'LOCAL_WORKSHOP_PLAYER_ID = "player:workshop-local"\nrequestedOwnerPlayerId === LOCAL_WORKSHOP_PLAYER_ID',
    "apps/web/app/workshop/workshop-client-state.ts":
      "localPlayerId !== LOCAL_WORKSHOP_PLAYER_ID\nownerHref: null",
  })) {
    const fullPath = path.join(root, file)
    mkdirSync(path.dirname(fullPath), { recursive: true })
    writeFileSync(fullPath, text)
  }
  return root
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe("v1.35 ownership alias proof evaluator", () => {
  it("covers every Phase 245 requirement and evidence kind", () => {
    const root = createTempRepo()
    const proof = generateV135OwnershipAliasProof(root)

    expect(validateV135OwnershipAliasProof(proof)).toEqual([])
    expect(proof.requiredRequirements).toEqual([
      "AUTH-01",
      "AUTH-02",
      "PRIV-01",
      "PRIV-02",
      "API-01",
      "API-02",
      "API-03",
    ])
  })

  it("writes and checks synchronized artifacts", () => {
    const root = createTempRepo()
    const proof = writeV135OwnershipAliasProofArtifacts(root)

    expect(
      readFileSync(path.join(root, ownershipAliasArtifactPaths.json), "utf8"),
    ).toBe(renderV135OwnershipAliasProofJson(proof))
    expect(
      readFileSync(
        path.join(root, ownershipAliasArtifactPaths.markdown),
        "utf8",
      ),
    ).toBe(renderV135OwnershipAliasProofMarkdown(proof))
    expect(checkV135OwnershipAliasProofArtifacts(root)).toEqual([])
  })

  it("fails when artifacts are stale", () => {
    const root = createTempRepo()
    writeV135OwnershipAliasProofArtifacts(root)
    writeFileSync(
      path.join(root, ownershipAliasArtifactPaths.json),
      '{"stale":true}\n',
    )

    expect(checkV135OwnershipAliasProofArtifacts(root)).toContain(
      `${ownershipAliasArtifactPaths.json} is stale`,
    )
  })

  it("rejects local Workshop private replay overclaims", () => {
    const root = createTempRepo()
    const proof = {
      ...generateV135OwnershipAliasProof(root),
      guardrails: {
        ...generateV135OwnershipAliasProof(root).guardrails,
        localWorkshopPlayerAuthorizesPrivateReplay: true,
      },
    }

    expect(validateV135OwnershipAliasProof(proof)).toContain(
      "player:workshop-local must not authorize private replay",
    )
  })

  it("rejects source alias regressions", () => {
    const root = createTempRepo()
    writeFileSync(
      path.join(root, "apps/web/app/api/workshop/source/route.ts"),
      'status: 200\n"cache-control": "private, no-store"\ngetRevisionSource(',
    )

    expect(generateV135OwnershipAliasProof(root).sourceChecks).toEqual(
      expect.arrayContaining([
        "apps/web/app/api/workshop/source/route.ts must return 410 Gone",
        "apps/web/app/api/workshop/source/route.ts must not read or return Workshop source",
      ]),
    )
  })

  it("rejects private marker leakage in proof artifacts", () => {
    const root = createTempRepo()
    const proof = generateV135OwnershipAliasProof(root, [
      {
        ...generateV135OwnershipAliasProof(root).evidence[0],
        outcome: "leaked bytesBase64",
      },
      ...generateV135OwnershipAliasProof(root).evidence.slice(1),
    ])

    expect(validateV135OwnershipAliasProof(proof)).toContain(
      "forbidden private marker bytesBase64",
    )
  })
})
