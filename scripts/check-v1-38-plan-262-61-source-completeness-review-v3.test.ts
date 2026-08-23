import { execFileSync, spawnSync } from "node:child_process"
import { linkSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync,
  writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, describe, expect, it } from "vitest"
import {
  PLAN_60_CONVERGENCE,
  PLAN_60_REVIEW_FIX_SHA256,
  PLAN_60_V9_SHA256,
  R3_PATHS,
  SOURCE_A9,
  SOURCE_A9_TREE,
  SOURCE_BASE9,
  SUMMARY_BLOB,
  SUMMARY_CARRIER,
  SUMMARY_PATH,
  SUMMARY_SHA256,
  canonicalV138ReviewerV3,
  deriveV138Plan26261NoPublish,
  inspectCommittedR3,
  inspectReviewerConvergence,
  inspectV138Plan26261A9Custody,
  inspectV138Plan26261Lifecycle,
  inspectV138Plan26261Predecessors,
  inspectV138Plan26261ProtectedHistory,
  inspectV138Plan26261RepositoryFile,
  inspectV138Plan26261Receipt,
  inspectV138Plan26261SummaryConvergence,
  selectCompletedAgentHistory,
  sha256V138ReviewerV3,
  observeV138Plan26261RouteDispatch,
} from "./check-v1-38-plan-262-61-source-completeness-review-v3.js"
import {
  V138_REVIEW_V3_CANONICAL_PATH,
  V138_REVIEW_V3_COMMANDS,
  V138_REVIEW_V3_REPORT_PATH,
  V138_REVIEW_V3_ROUTE_MANIFEST,
  V138_REVIEW_V3_SOURCE_PATHS,
  buildV138ReviewV3CommandArgv,
} from "./lib/v1-38-source-completeness-review-v3.js"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const checkerPath = path.join(repoRoot,
  "scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts")
const disposable: string[] = []
const git = (cwd: string, args: readonly string[]) => execFileSync("git", [...args], {
  cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
}).trim()
const clone = () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "plan-262-61-review-v3-"))
  disposable.push(directory)
  execFileSync("git", ["clone", "--quiet", "--no-hardlinks", repoRoot, directory],
    { maxBuffer: 64 * 1024 * 1024 })
  return realpathSync(directory)
}
const commitAll = (cwd: string, message: string) => {
  execFileSync("git", ["add", "-A"], { cwd })
  execFileSync("git", ["-c", "user.name=Fixture", "-c",
    "user.email=fixture@example.invalid", "commit", "--quiet", "-m", message], { cwd })
}

afterEach(() => {
  while (disposable.length > 0) rmSync(disposable.pop()!, { recursive: true, force: true })
})

describe("Plan 262-61 independent exact-A9 reviewer-v3", () => {
  it("pins exact final A9 as one four-path V8 layer", () => {
    const custody = inspectV138Plan26261A9Custody(repoRoot)
    expect(custody).toMatchObject({ sourceBase9: SOURCE_BASE9, sourceA9: SOURCE_A9,
      tree: SOURCE_A9_TREE, parent: SOURCE_BASE9,
      authorRun: "codex-plan-262-60-a9-review-fix-v8" })
    expect(custody.paths).toEqual([...V138_REVIEW_V3_SOURCE_PATHS].sort())
    expect(custody.blobs).toHaveLength(4)
    expect(custody.blobs.every(({ mode, blobOid, sha256, byteLength }) =>
      mode === "100644" && /^[0-9a-f]{40}$/u.test(String(blobOid)) &&
      /^sha256:[0-9a-f]{64}$/u.test(sha256) && byteLength > 0)).toBe(true)
  })

  it("derives the private V3-V7 tips and five following carriers from Git", () => {
    const layers = inspectV138Plan26261Predecessors(repoRoot)
    expect(layers.map(({ tip }) => tip.slice(0, 8)))
      .toEqual(["32eef5c1", "c5a08bd5", "5bf78391", "704eed00", "c60146dc"])
    expect(layers.map(({ carrier }) => carrier.slice(0, 8)))
      .toEqual(["7ce7e1e9", "bff3a3ca", "b1352f7e", "f42afce0", "1f6a8b4c"])
    expect(layers.every(({ tipParent, carrierParent, tip, tipTree, carrierTree,
      tipPaths, carrierPaths, carrierBlobs }) =>
      /^[0-9a-f]{40}$/u.test(tipParent) && carrierParent === tip &&
      /^[0-9a-f]{40}$/u.test(tipTree) && /^[0-9a-f]{40}$/u.test(carrierTree) &&
      tipPaths.length > 0 && carrierPaths.length === carrierBlobs.length)).toBe(true)
  })

  it("derives the unique current-byte summary carrier and later immutable convergence", () => {
    const value = inspectV138Plan26261SummaryConvergence(repoRoot)
    expect(value).toEqual({ carrierCommit: SUMMARY_CARRIER, carrierBlob: SUMMARY_BLOB,
      carrierSha256: SUMMARY_SHA256, carrierByteLength: 12486,
      convergenceCommit: PLAN_60_CONVERGENCE,
      v9Blob: "6611ca2b9087e491a3830816278e81d8aa2e7c35",
      v9Root: PLAN_60_V9_SHA256,
      reviewFixBlob: "c1f687c827a4f61d95a9e6b52bfe5e72f8c7449e",
      reviewFixRoot: PLAN_60_REVIEW_FIX_SHA256 })
  })

  it("derives exactly forty charges, six immutable authorizations, and protected roots", () => {
    const history = inspectV138Plan26261ProtectedHistory(repoRoot)
    expect(history.chargeIds).toHaveLength(40)
    expect(new Set(history.chargeIds).size).toBe(40)
    expect(history.authorizations).toHaveLength(6)
    expect(history.authorizations.every(({ commit, blobOid, sha256, byteLength }) =>
      /^[0-9a-f]{40}$/u.test(commit) && /^[0-9a-f]{40}$/u.test(blobOid) &&
      /^sha256:[0-9a-f]{64}$/u.test(sha256) && byteLength > 0)).toBe(true)
    expect(Object.values(history.protectedRoots).every((value) =>
      /^sha256:[0-9a-f]{64}$/u.test(String(value)))).toBe(true)
  })

  it("rejects replacement committed authorization bytes from immutable history", () => {
    const directory = clone()
    const target = path.join(directory,
      ".planning/artifacts/v1.38-plan-262-15-authorization-v1.json")
    writeFileSync(target, "{}\n")
    commitAll(directory, "replace frozen authorization")
    expect(() => inspectV138Plan26261ProtectedHistory(directory))
      .toThrow("V138_PLAN_262_61_AUTHORIZATION_HISTORY_INVALID")
  })

  it("derives the exact live 48-plan graph, archive, and lifecycle", () => {
    expect(inspectV138Plan26261Lifecycle(repoRoot)).toMatchObject({ totalPlans: 48,
      summaries: 43, incomplete: ["262-48", "262-56", "262-57", "262-61", "262-62"] })
    expect(inspectV138Plan26261Lifecycle(repoRoot).graph).toHaveLength(48)
    expect(inspectV138Plan26261Lifecycle(repoRoot).archive)
      .toEqual(["03", "04", "05", "06", "07", "40", "43", "46", "47", "48",
        "50", "55", "58", "59"])
  })

  it("builds full unique argv for every real route command and terminal branch", () => {
    expect(V138_REVIEW_V3_ROUTE_MANIFEST.map(({ command }) => command).sort())
      .toEqual([...V138_REVIEW_V3_COMMANDS].sort())
    const records = V138_REVIEW_V3_ROUTE_MANIFEST.map((entry) => ({ ...entry,
      argv: buildV138ReviewV3CommandArgv(entry.command, SOURCE_A9, "f".repeat(40)) }))
    expect(new Set(records.map(({ command }) => command))).toHaveProperty("size", 10)
    expect(records.every(({ command, handler, destination, argv }) =>
      argv.includes(command) && argv.includes(SOURCE_A9) &&
      typeof handler === "string" && handler.length > 0 &&
      typeof destination === "string" && destination.startsWith(".planning/")))
      .toBe(true)
    expect(records.map(({ terminalDisposition }) => terminalDisposition).join("|"))
      .toContain("reproduction_passed")
  })

  it("executes all production direct-entry branches in an exact-A9 disposable clone", async () => {
    const value = await observeV138Plan26261RouteDispatch(repoRoot)
    expect(value.observations).toHaveLength(10)
    expect(value.observations.every(({ exit, argv, command, handler }) => exit === 0 &&
      argv[2] === command && (handler.startsWith("checkV138") ||
        handler.startsWith("writeV138"))))
      .toBe(true)
    expect(value.b9ChangedPaths).toEqual([
      ".planning/artifacts/v1.38-plan-262-56-authorization-v9.json",
      ".planning/artifacts/v1.38-successor-source-seal-v9.json",
    ])
  })

  it("derives a shared-validator-checked no-publish review", async () => {
    const value = await deriveV138Plan26261NoPublish(repoRoot)
    expect(value).toMatchObject({ findingCount: 0, publishesCanonicalReview: false,
      authorizesExecution: false, lifecycle: { totalPlans: 48, summaries: 43 },
      identityClaims: { independentPersonClaimed: false, reviewerSeparated: false,
        externalIdentityClaimed: false, cryptographicReviewerIdentityClaimed: false,
        independentCustodyClaimed: false } })
    expect(value.commands).toHaveLength(10)
    expect(value.forbiddenDestinations).toContain(V138_REVIEW_V3_CANONICAL_PATH)
    expect(value.forbiddenDestinations).toContain(V138_REVIEW_V3_REPORT_PATH)
  })

  it("runs derive-no-publish with bounded output and no canonical write", () => {
    const before = git(repoRoot, ["status", "--porcelain=v1"])
    const result = spawnSync("pnpm", ["exec", "tsx", checkerPath, "--derive-no-publish"],
      { cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
    expect(result.status, result.stderr).toBe(0)
    expect(result.stderr).toBe("")
    const parsed = JSON.parse(result.stdout)
    expect(parsed.findingCount).toBe(0)
    expect(Buffer.byteLength(result.stdout)).toBeLessThan(512 * 1024)
    expect(git(repoRoot, ["status", "--porcelain=v1"])).toBe(before)
  })

  it.each([
    ["zero", []],
    ["multiple", [
      { agent_id: "a", phase: "262", plan: "61", status: "completed",
        completion_timestamp: "2026-08-23T00:00:00Z" },
      { agent_id: "b", phase: "262", plan: "61", status: "completed",
        completion_timestamp: "2026-08-23T00:01:00Z" },
    ]],
    ["spawned", [{ agent_id: "a", phase: "262", plan: "61", status: "spawned",
      completion_timestamp: "2026-08-23T00:00:00Z" }]],
    ["empty id", [{ agent_id: "", phase: "262", plan: "61", status: "completed",
      completion_timestamp: "2026-08-23T00:00:00Z" }]],
    ["empty completion", [{ agent_id: "a", phase: "262", plan: "61",
      status: "completed", completion_timestamp: "" }]],
  ])("rejects %s Plan-61 author history", (_name, entries) => {
    expect(() => selectCompletedAgentHistory(entries, "262", "61")).toThrow()
  })

  it("selects Plan-61 and Plan-62 authors without segment or description dependence", () => {
    const entries = [
      { agent_id: "r3-author", phase: 262, plan: 61, segment: 999,
        task_description: "ignored", status: "completed",
        completion_timestamp: "2026-08-23T00:00:00Z" },
      { agent_id: "review-author", phase: "262", plan: "62", segment: 0,
        status: "completed", completion_timestamp: "2026-08-23T00:02:00Z" },
    ]
    expect(selectCompletedAgentHistory(entries, "262", "61")).toMatchObject({
      agentId: "r3-author", plan: "61" })
    expect(selectCompletedAgentHistory(entries, "262", "62")).toMatchObject({
      agentId: "review-author", plan: "62" })
  })

  it("rejects post-A9 working-source drift even when Git history remains intact", () => {
    const directory = clone()
    const target = path.join(directory, V138_REVIEW_V3_SOURCE_PATHS[0])
    writeFileSync(target, Buffer.concat([readFileSync(target), Buffer.from("\n// drift\n")]))
    expect(() => inspectV138Plan26261A9Custody(directory))
      .toThrow("V138_PLAN_262_61_REPOSITORY_DIRTY")
  })

  it("rejects committed post-A9 drift even when visible bytes are restored", () => {
    const directory = clone()
    const repoPath = V138_REVIEW_V3_SOURCE_PATHS[0]
    const target = path.join(directory, repoPath)
    const exact = readFileSync(target)
    writeFileSync(target, Buffer.concat([exact, Buffer.from("\n// committed drift\n")]))
    commitAll(directory, "mutate protected A9 source")
    writeFileSync(target, exact)
    execFileSync("git", ["add", repoPath], { cwd: directory })
    commitAll(directory, "restore protected bytes")
    expect(() => inspectV138Plan26261A9Custody(directory))
      .toThrow("V138_PLAN_262_61_POST_A9_COMMITTED_SOURCE_DRIFT")
  })

  it("rejects a later committed rewrite of the current summary", () => {
    const directory = clone()
    const target = path.join(directory, SUMMARY_PATH)
    writeFileSync(target, Buffer.concat([readFileSync(target), Buffer.from("\nrewrite\n")]))
    commitAll(directory, "mutate summary")
    expect(() => inspectV138Plan26261SummaryConvergence(directory))
      .toThrow("V138_PLAN_262_61_SUMMARY_BYTES_INVALID")
  })

  it("rejects a lifecycle with an extra active plan after committing its inventory", () => {
    const directory = clone()
    const target = path.join(directory, `${path.dirname(SUMMARY_PATH)}/262-99-PLAN.md`)
    writeFileSync(target, "---\nphase: 262\nplan: 99\n---\n")
    commitAll(directory, "add invalid plan")
    expect(() => inspectV138Plan26261Lifecycle(directory))
      .toThrow("V138_PLAN_262_61_LIFECYCLE_INVALID")
  })

  it("rejects count-preserving lifecycle substitution with a specific graph code", () => {
    const directory = clone()
    const phase = path.dirname(SUMMARY_PATH)
    const oldPlan = path.join(directory, phase, "262-01-PLAN.md")
    const oldSummary = path.join(directory, phase, "262-01-SUMMARY.md")
    const newPlan = path.join(directory, phase, "262-99-PLAN.md")
    const newSummary = path.join(directory, phase, "262-99-SUMMARY.md")
    writeFileSync(newPlan, "---\nphase: 262\nplan: 99\nwave: 1\ndepends_on: []\n---\n")
    writeFileSync(newSummary, "# substituted\n")
    rmSync(oldPlan); rmSync(oldSummary)
    commitAll(directory, "count-preserving plan substitution")
    expect(() => inspectV138Plan26261Lifecycle(directory))
      .toThrow("V138_PLAN_262_61_LIFECYCLE_GRAPH_INVALID")
  })

  it("rejects canonical publication presence without deleting or restoring it", async () => {
    const directory = clone()
    const target = path.join(directory, V138_REVIEW_V3_CANONICAL_PATH)
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, "{}\n")
    commitAll(directory, "publish forbidden canonical review")
    await expect(deriveV138Plan26261NoPublish(directory))
      .rejects.toThrow("V138_PLAN_262_61_CANONICAL_DESTINATION_PRESENT")
  })

  it("rejects a noncanonical physical repository root through a symlink", async () => {
    const directory = clone()
    const linkRoot = mkdtempSync(path.join(os.tmpdir(), "plan-262-61-link-"))
    disposable.push(linkRoot)
    const link = path.join(linkRoot, "repo")
    symlinkSync(directory, link)
    await expect(deriveV138Plan26261NoPublish(link))
      .rejects.toThrow("V138_PLAN_262_61_PHYSICAL_ROOT_INVALID")
  })

  it.each([
    ["absolute", ["--check-r3-author-receipt", "--receipt", "/tmp/receipt.json"]],
    ["traversal", ["--check-r3-author-receipt", "--receipt", "../receipt.json"]],
    ["duplicate", ["--check-r3-author-receipt", "--receipt",
      ".planning/artifacts/v1.38-plan-262-61-r3-author-tracking-v1.json",
      "--receipt", ".planning/artifacts/v1.38-plan-262-61-r3-author-tracking-v1.json"]],
    ["extra", ["--derive-no-publish", "unexpected"]],
  ])("rejects %s CLI grammar with the exact argument code", (_name, args) => {
    const result = spawnSync("pnpm", ["exec", "tsx", checkerPath, ...args],
      { cwd: repoRoot, encoding: "utf8" })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain("V138_PLAN_262_61_ARGUMENTS_INVALID")
  })

  it("rejects symlink and hard-link repository leaves", () => {
    const directory = clone()
    const expected = ".planning/agent-history.json"
    const target = path.join(directory, expected)
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, "[]\n")
    const outside = path.join(directory, "outside.json")
    writeFileSync(outside, "[]\n")
    rmSync(target)
    symlinkSync(outside, target)
    expect(() => inspectV138Plan26261RepositoryFile(directory, expected, expected))
      .toThrow("V138_PLAN_262_61_PATH_METADATA_INVALID")
    rmSync(target)
    linkSync(outside, target)
    expect(() => inspectV138Plan26261RepositoryFile(directory, expected, expected))
      .toThrow("V138_PLAN_262_61_PATH_METADATA_INVALID")
  })

  it("binds committed R3 while convergence remains fail-closed before external review", () => {
    const r3 = inspectCommittedR3(repoRoot)
    expect(r3.commit).toMatch(/^[0-9a-f]{40}$/u)
    expect(r3.blobs.map(({ path: repoPath }) => repoPath).sort())
      .toEqual([...R3_PATHS].sort())
    expect(() => inspectReviewerConvergence(repoRoot)).toThrow()
  })

  it("requires immutable schema-bound review, fix, and one-path receipt custody", () => {
    const directory = clone()
    const sourceR3 = git(directory, ["rev-parse", "HEAD"])
    const sourceR3Tree = git(directory, ["rev-parse", "HEAD^{tree}"])
    const sourceR3Parent = git(directory, ["show", "-s", "--format=%P", "HEAD"])
    const reviewPath = `${path.dirname(SUMMARY_PATH)}/262-61-CODE-REVIEW-V2.md`
    const review = `---\nphase: 262\nplan: "61"\nreviewed_source_commit: ${sourceR3}\n` +
      `files_reviewed: 2\nfiles_reviewed_list:\n` +
      `  - scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts\n` +
      `  - scripts/check-v1-38-plan-262-61-source-completeness-review-v3.test.ts\n` +
      `depth: deep\nfindings:\n  critical: 0\n  warning: 0\n  info: 0\n  total: 0\n` +
      `status: clean\n---\n\n# Clean fixture review\n`
    writeFileSync(path.join(directory, reviewPath), review)
    commitAll(directory, "review(262-61): clean fixture R3")
    const reviewCommit = git(directory, ["rev-parse", "HEAD"])
    const reviewBlob = git(directory, ["rev-parse", `HEAD:${reviewPath}`])
    const reviewRoot = sha256V138ReviewerV3(Buffer.from(review))
    const fixPath = `${path.dirname(SUMMARY_PATH)}/262-61-REVIEW-FIX.md`
    const manifest = { schemaVersion: "v1.38-plan-262-61-review-fix-convergence-v1",
      sourceR3, sourceR3Tree, sourceR3Parent,
      reports: [`${path.dirname(SUMMARY_PATH)}/262-61-CODE-REVIEW.md`, reviewPath],
      terminalReviewPath: reviewPath, terminalReviewRoot: reviewRoot,
      terminalReviewCommit: reviewCommit, terminalReviewBlob: reviewBlob,
      sourceFixCommits: [sourceR3] }
    writeFileSync(path.join(directory, fixPath), `# Review fix fixture\n\n` +
      `\`\`\`review-convergence-json\n${JSON.stringify(manifest)}\n\`\`\`\n`)
    commitAll(directory, "review(262-61): bind fixture convergence")
    const convergence = inspectReviewerConvergence(directory)
    expect(convergence).toMatchObject({ codeReviewPath: reviewPath,
      codeReviewRoot: reviewRoot, sourceR3: { commit: sourceR3 } })
    const receiptPath =
      ".planning/artifacts/v1.38-plan-262-61-r3-author-tracking-v1.json"
    const history = { agentId: "fixture-r3-author", phase: "262", plan: "61",
      completionTimestamp: "2026-08-23T23:00:00Z" }
    const receipt = { schemaVersion: "v1.38-plan-262-61-r3-author-tracking-v1",
      r3AuthorAgent: history.agentId, phase: history.phase, plan: history.plan,
      completionTimestamp: history.completionTimestamp,
      historyEntryRoot: sha256V138ReviewerV3(canonicalV138ReviewerV3(history)),
      sourceR3, codeReviewPath: reviewPath, codeReviewRoot: reviewRoot,
      reviewFixRoot: convergence.reviewFixRoot }
    mkdirSync(path.dirname(path.join(directory, receiptPath)), { recursive: true })
    writeFileSync(path.join(directory, receiptPath), `${JSON.stringify(receipt)}\n`)
    commitAll(directory, "docs(262-61): fixture one-path author receipt")
    expect(inspectV138Plan26261Receipt(directory, receiptPath)).toMatchObject({
      receipt: { r3AuthorAgent: history.agentId }, convergence: {
        codeReviewRoot: reviewRoot } })
    writeFileSync(path.join(directory, receiptPath), "{}\n")
    expect(() => inspectV138Plan26261Receipt(directory, receiptPath))
      .toThrow("V138_PLAN_262_61_RECEIPT_NOT_IMMUTABLE")
  })

  it("canonicalization and roots detect nested mutation after recomputation", () => {
    const baseline = { source: SOURCE_A9, nested: { paths: [...R3_PATHS], count: 2 } }
    const mutation = { ...baseline, nested: { ...baseline.nested, count: 3 } }
    expect(canonicalV138ReviewerV3(baseline)).not.toBe(canonicalV138ReviewerV3(mutation))
    expect(sha256V138ReviewerV3(canonicalV138ReviewerV3(baseline)))
      .not.toBe(sha256V138ReviewerV3(canonicalV138ReviewerV3(mutation)))
  })
})
