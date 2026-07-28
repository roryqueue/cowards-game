import { randomUUID } from "node:crypto"
import { Pool } from "pg"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { migrate } from "./migrations.js"
import {
  ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION,
  ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT,
  REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION,
  REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT,
  SemanticAuthoritySelectionHeadError,
  abortSemanticAuthoritySelectionTransition,
  assertCountedSemanticAuthoritySelection,
  finalizeSemanticAuthoritySelectionTransition,
  hashSemanticAuthoritySelectorManifest,
  prepareSemanticAuthoritySelectionTransition,
  readSemanticAuthoritySelectionHead,
  recoverSemanticAuthoritySelectionTransition,
} from "./semantic-authority-selection-head.js"

const databaseUrl = process.env.DATABASE_URL
const describeDatabase = databaseUrl ? describe : describe.skip
const hash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`
const git = (character: string): string => character.repeat(40)

const selectorManifest = Object.freeze(
  [
    "apps/go-backend/current_semantic_authority_generated.go",
    "packages/golden/src/fixtures/v1-37-conformance-corpus/registry.json",
    "packages/golden/src/fixtures/v1-37-conformance-traces/registry.json",
    "packages/golden/src/v1-37-conformance-corpus-pin.ts",
    "packages/spec/src/current-semantic-authority-source.ts",
  ].map((path, index) =>
    Object.freeze({ path, sha256: hash(String(index + 1)) }),
  ),
)
const selectorManifestRoot =
  hashSemanticAuthoritySelectorManifest(selectorManifest)

const forwardInput = (overrides: Record<string, unknown> = {}) => ({
  direction: "forward" as const,
  activationId: "activation:phase260:test",
  expectedRevision: 0,
  expectedActiveRoot: ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT,
  targetSelection: REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION,
  targetRoot: REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT,
  parentHead: git("a"),
  selectorManifest,
  selectorManifestRoot,
  proofPreimageRoot: hash("b"),
  ...overrides,
})

const forwardFinalization = (overrides: Record<string, unknown> = {}) => ({
  direction: "forward" as const,
  activationId: "activation:phase260:test",
  expectedRevision: 1,
  expectedParentHead: git("a"),
  expectedTargetRoot: REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT,
  expectedSelectorManifestRoot: selectorManifestRoot,
  proofDigest: hash("c"),
  commitSha: git("b"),
  treeSha: git("c"),
  ...overrides,
})

describeDatabase("semantic authority selection head", () => {
  let admin: Pool
  let pool: Pool
  let schema: string

  beforeEach(async () => {
    schema = `phase260_head_${randomUUID().replaceAll("-", "")}`
    admin = new Pool({ connectionString: databaseUrl!, max: 1 })
    await admin.query(`create schema ${schema}`)
    pool = new Pool({
      connectionString: databaseUrl!,
      max: 4,
      options: `-c search_path=${schema}`,
    })
    await migrate(pool)
  })

  afterEach(async () => {
    await pool.end()
    await admin.query(`drop schema if exists ${schema} cascade`)
    await admin.end()
  })

  it("reads one deeply frozen exact bootstrap selection", async () => {
    const head = await readSemanticAuthoritySelectionHead(pool)

    expect(head).toMatchObject({
      state: "active-v1.17-bootstrap",
      revision: 0,
      activeSelection: ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION,
      activeSelectionRoot: ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT,
      pendingIntent: null,
      finalization: null,
      compensation: null,
    })
    expect(Object.isFrozen(head)).toBe(true)
    expect(Object.isFrozen(head.activeSelection)).toBe(true)
    expect(() => {
      ;(
        head.activeSelection as { runtimeAbiVersion: string }
      ).runtimeAbiVersion = "strategy-runtime-abi-v1.19"
    }).toThrow()
  })

  it("prepares and finalizes the complete forward selection in short exact transitions", async () => {
    const pending = await prepareSemanticAuthoritySelectionTransition(
      pool,
      forwardInput(),
    )
    expect(pending).toMatchObject({
      state: "pending-precommit",
      revision: 1,
      activeSelection: ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION,
      pendingIntent: {
        direction: "forward",
        targetSelection: REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION,
      },
    })
    expect(() =>
      assertCountedSemanticAuthoritySelection(
        pending,
        ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION,
        ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT,
      ),
    ).toThrow(/unavailable/iu)

    const finalized = await finalizeSemanticAuthoritySelectionTransition(
      pool,
      forwardFinalization(),
    )
    expect(finalized).toMatchObject({
      state: "active-v1.19-finalized",
      revision: 2,
      activeSelection: REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION,
      activeSelectionRoot: REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT,
      pendingIntent: null,
      finalization: {
        activationId: "activation:phase260:test",
        proofDigest: hash("c"),
        commitSha: git("b"),
        treeSha: git("c"),
      },
    })
    expect(
      assertCountedSemanticAuthoritySelection(
        finalized,
        REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION,
        REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT,
      ),
    ).toEqual(REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION)

    const history = await pool.query<{
      transition_kind: string
      state: string
    }>(
      "select transition_kind, state from semantic_authority_selection_history order by sequence",
    )
    expect(history.rows).toEqual([
      {
        transition_kind: "bootstrap",
        state: "active-v1.17-bootstrap",
      },
      { transition_kind: "prepared", state: "pending-precommit" },
      { transition_kind: "finalized", state: "active-v1.19-finalized" },
    ])
    await expect(
      pool.query(
        "update semantic_authority_selection_history set state = state",
      ),
    ).rejects.toThrow(/append-only/iu)
  })

  it("prepares and finalizes only the recorded exact reverse preimage", async () => {
    await prepareSemanticAuthoritySelectionTransition(pool, forwardInput())
    await finalizeSemanticAuthoritySelectionTransition(
      pool,
      forwardFinalization(),
    )
    const reverse = await prepareSemanticAuthoritySelectionTransition(pool, {
      direction: "reverse",
      activationId: "compensation:phase260:test",
      sourceActivationId: "activation:phase260:test",
      expectedRevision: 2,
      expectedActiveRoot: REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT,
      targetSelection: ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION,
      targetRoot: ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT,
      parentHead: git("b"),
      selectorManifest,
      selectorManifestRoot,
      proofPreimageRoot: hash("e"),
    })
    expect(reverse).toMatchObject({
      state: "pending-compensation",
      revision: 3,
      pendingIntent: { direction: "reverse" },
      finalization: { activationId: "activation:phase260:test" },
    })

    const compensated = await finalizeSemanticAuthoritySelectionTransition(
      pool,
      {
        direction: "reverse",
        activationId: "compensation:phase260:test",
        sourceActivationId: "activation:phase260:test",
        expectedRevision: 3,
        expectedParentHead: git("b"),
        expectedTargetRoot: ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT,
        expectedSelectorManifestRoot: selectorManifestRoot,
        recoveryReceiptDigest: hash("f"),
        commitSha: git("d"),
        treeSha: git("e"),
      },
    )
    expect(compensated).toMatchObject({
      state: "active-v1.17-compensated",
      revision: 4,
      activeSelection: ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION,
      pendingIntent: null,
      compensation: {
        activationId: "compensation:phase260:test",
        sourceActivationId: "activation:phase260:test",
        recoveryReceiptDigest: hash("f"),
      },
    })
  })

  it("aborts only the exact pending token and makes exact retry idempotent", async () => {
    await prepareSemanticAuthoritySelectionTransition(pool, forwardInput())
    await expect(
      abortSemanticAuthoritySelectionTransition(pool, {
        direction: "forward",
        activationId: "activation:wrong",
        expectedRevision: 1,
      }),
    ).rejects.toThrow(/intent/iu)

    const aborted = await abortSemanticAuthoritySelectionTransition(pool, {
      direction: "forward",
      activationId: "activation:phase260:test",
      expectedRevision: 1,
    })
    expect(aborted).toMatchObject({
      state: "active-v1.17-bootstrap",
      revision: 2,
      pendingIntent: null,
    })
    const repeated = await abortSemanticAuthoritySelectionTransition(pool, {
      direction: "forward",
      activationId: "activation:phase260:test",
      expectedRevision: 1,
    })
    expect(repeated).toEqual(aborted)

    await expect(
      abortSemanticAuthoritySelectionTransition(pool, {
        direction: "forward",
        activationId: "activation:phase260:test",
        expectedRevision: 1,
        expectedParentHead: git("9"),
        expectedSelectorManifestRoot: selectorManifestRoot,
      }),
    ).rejects.toThrow(/intent|binding|stale/iu)
  })

  it("recovers precommit by aborting and exact committed state by finalizing without inference", async () => {
    await prepareSemanticAuthoritySelectionTransition(pool, forwardInput())
    const restored = await recoverSemanticAuthoritySelectionTransition(pool, {
      disposition: "precommit",
      direction: "forward",
      activationId: "activation:phase260:test",
      expectedRevision: 1,
      expectedParentHead: git("a"),
      expectedSelectorManifestRoot: selectorManifestRoot,
    })
    expect(restored.state).toBe("active-v1.17-bootstrap")

    await prepareSemanticAuthoritySelectionTransition(
      pool,
      forwardInput({ expectedRevision: 2 }),
    )
    const finalized = await recoverSemanticAuthoritySelectionTransition(pool, {
      disposition: "committed",
      ...forwardFinalization({ expectedRevision: 3 }),
    })
    expect(finalized.state).toBe("active-v1.19-finalized")
    const repeated = await recoverSemanticAuthoritySelectionTransition(pool, {
      disposition: "committed",
      ...forwardFinalization({ expectedRevision: 3 }),
    })
    expect(repeated).toEqual(finalized)
  })

  it("revalidates recovery bindings under the row lock and on idempotent retries", async () => {
    await prepareSemanticAuthoritySelectionTransition(pool, forwardInput())
    await expect(
      recoverSemanticAuthoritySelectionTransition(pool, {
        disposition: "precommit",
        direction: "forward",
        activationId: "activation:phase260:test",
        expectedRevision: 1,
        expectedParentHead: git("9"),
        expectedSelectorManifestRoot: selectorManifestRoot,
      }),
    ).rejects.toThrow(/binding/iu)

    await finalizeSemanticAuthoritySelectionTransition(
      pool,
      forwardFinalization(),
    )
    await expect(
      recoverSemanticAuthoritySelectionTransition(pool, {
        disposition: "committed",
        ...forwardFinalization({ expectedParentHead: git("9") }),
      }),
    ).rejects.toThrow(/binding/iu)
  })

  it("rejects stale CAS and concurrent activation tokens", async () => {
    await expect(
      prepareSemanticAuthoritySelectionTransition(
        pool,
        forwardInput({ expectedRevision: 4 }),
      ),
    ).rejects.toThrow(/stale/iu)

    const results = await Promise.allSettled([
      prepareSemanticAuthoritySelectionTransition(
        pool,
        forwardInput({ activationId: "activation:concurrent:a" }),
      ),
      prepareSemanticAuthoritySelectionTransition(
        pool,
        forwardInput({ activationId: "activation:concurrent:b" }),
      ),
    ])
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1)
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1)
  })

  it("rejects missing, extra, mixed, substituted, and forbidden selections", async () => {
    const missing = globalThis.structuredClone(
      REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION,
    ) as Record<string, unknown>
    delete missing.conformanceTraceRoot
    const extra = {
      ...REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION,
      diagnostics: "PRIVATE-MARKER",
    }
    const substituted = {
      ...REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION,
      conformanceCertificateVersion: "runtime-conformance-certificate-v1.17",
    }

    for (const targetSelection of [missing, extra, substituted]) {
      await expect(
        prepareSemanticAuthoritySelectionTransition(
          pool,
          forwardInput({ targetSelection }),
        ),
      ).rejects.toBeInstanceOf(SemanticAuthoritySelectionHeadError)
    }
    await expect(
      prepareSemanticAuthoritySelectionTransition(
        pool,
        forwardInput({
          targetRoot: ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT,
        }),
      ),
    ).rejects.toThrow(/target/iu)
    await expect(
      prepareSemanticAuthoritySelectionTransition(
        pool,
        forwardInput({ direction: "reverse" }),
      ),
    ).rejects.toThrow(/direction|state/iu)
  })

  it("rejects manifest, parent, target, proof, commit, and tree mismatches", async () => {
    await expect(
      prepareSemanticAuthoritySelectionTransition(
        pool,
        forwardInput({ selectorManifest: selectorManifest.slice(0, 4) }),
      ),
    ).rejects.toThrow(/manifest/iu)
    await prepareSemanticAuthoritySelectionTransition(pool, forwardInput())

    for (const overrides of [
      { expectedParentHead: git("9") },
      { expectedTargetRoot: ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT },
      { expectedSelectorManifestRoot: hash("9") },
      { proofDigest: "PRIVATE-PROOF" },
      { commitSha: "PRIVATE-COMMIT" },
      { treeSha: "PRIVATE-TREE" },
    ]) {
      await expect(
        finalizeSemanticAuthoritySelectionTransition(
          pool,
          forwardFinalization(overrides),
        ),
      ).rejects.toBeInstanceOf(SemanticAuthoritySelectionHeadError)
    }
    expect((await readSemanticAuthoritySelectionHead(pool)).state).toBe(
      "pending-precommit",
    )
  })

  it("rolls back transactions when a crash occurs after mutation or during finalization", async () => {
    await expect(
      prepareSemanticAuthoritySelectionTransition(pool, forwardInput(), {
        afterHeadWrite: () => {
          throw new Error("simulated crash")
        },
      }),
    ).rejects.toThrow(/simulated crash/iu)
    expect(await readSemanticAuthoritySelectionHead(pool)).toMatchObject({
      state: "active-v1.17-bootstrap",
      revision: 0,
    })

    await prepareSemanticAuthoritySelectionTransition(pool, forwardInput())
    await expect(
      finalizeSemanticAuthoritySelectionTransition(
        pool,
        forwardFinalization(),
        {
          afterHeadWrite: () => {
            throw new Error("simulated finalization crash")
          },
        },
      ),
    ).rejects.toThrow(/simulated finalization crash/iu)
    expect(await readSemanticAuthoritySelectionHead(pool)).toMatchObject({
      state: "pending-precommit",
      revision: 1,
    })
  })

  it("fails counted scheduling closed for absent, pending, stale, or file/head mismatch", async () => {
    const bootstrap = await readSemanticAuthoritySelectionHead(pool)
    expect(() =>
      assertCountedSemanticAuthoritySelection(
        bootstrap,
        REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION,
        REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT,
      ),
    ).toThrow(/mismatch/iu)

    await prepareSemanticAuthoritySelectionTransition(pool, forwardInput())
    const pending = await readSemanticAuthoritySelectionHead(pool)
    expect(() =>
      assertCountedSemanticAuthoritySelection(
        pending,
        ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION,
        ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT,
      ),
    ).toThrow(/unavailable/iu)
    expect(() =>
      assertCountedSemanticAuthoritySelection(
        undefined,
        ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION,
        ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT,
      ),
    ).toThrow(/unavailable/iu)
  })

  it("keeps validation errors privacy-safe", async () => {
    const privateMarker = "PRIVATE-SOURCE-ARTIFACT-DIAGNOSTIC"
    let error: unknown
    try {
      await prepareSemanticAuthoritySelectionTransition(
        pool,
        forwardInput({
          targetSelection: {
            ...REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION,
            source: privateMarker,
          },
        }),
      )
    } catch (caught) {
      error = caught
    }
    expect(error).toBeInstanceOf(SemanticAuthoritySelectionHeadError)
    expect(JSON.stringify(error)).not.toContain(privateMarker)
    expect(String(error)).not.toContain(privateMarker)
  })
})
