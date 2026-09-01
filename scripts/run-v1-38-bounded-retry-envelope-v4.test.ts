import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"
import { describe, expect, it } from "vitest"
import {
  V138_BOUNDED_RETRY_V4_CUSTODY,
  V138_BOUNDED_RETRY_V4_PATHS,
  acquireV138RetryV4OwnerLease,
  runV138BoundedRetryV4Controller,
} from "./run-v1-38-bounded-retry-envelope-v4.js"
import {
  V138_BOUNDED_RETRY_V4_IDENTITIES,
  V138_BOUNDED_RETRY_V4_POLICY,
  appendV138RetryV4JournalRecord,
  createV138InactiveRetryV4Envelope,
} from "./lib/v1-38-bounded-retry-envelope-v4.js"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SHA = `sha256:${"a".repeat(64)}` as const
const fixtureEnvelope = () => createV138InactiveRetryV4Envelope({ sourceRoot: SHA, reviewRoot: SHA, sealRoot: SHA,
  protectedHistoryRoot: SHA, protectedHistoricalIdentities: [] })
const admittedJournal = (includeSupervisionRoot = true) => {
  const envelope = fixtureEnvelope()
  let records: readonly any[] = []
  let atMilliseconds = 0
  const append = (event: any) => {
    records = appendV138RetryV4JournalRecord(
      records,
      event,
      atMilliseconds++,
      envelope.envelopeRoot,
    )
  }
  const preflightIdentity = V138_BOUNDED_RETRY_V4_IDENTITIES.preflights[0]
  const routeIdentity = V138_BOUNDED_RETRY_V4_IDENTITIES.routes[0]
  const identities = V138_BOUNDED_RETRY_V4_IDENTITIES.calibrations.slice(0, 8)
  append({ kind: "reserve_preflight", identity: preflightIdentity, owner: "fixture" })
  append({ kind: "observe_preflight", identity: preflightIdentity, owner: "fixture",
    effectiveAvailableBasisPoints: 3000 })
  append({ kind: "reserve_route", identity: routeIdentity, owner: "fixture", preflightIdentity })
  append({ kind: "reserve_calibration", routeIdentity, owner: "fixture", identities })
  append({ kind: "finish_calibration", routeIdentity, owner: "fixture", status: "admitted",
    completeCleanup: true, ...(includeSupervisionRoot ? { supervisionRoot: SHA } : {}) })
  return { envelope, records }
}

describe("bounded retry v4 lease wiring and synthetic controller", () => {
  it("keeps the production entry fail-closed behind committed review and invocation custody", () => {
    const source = readFileSync(path.join(ROOT, V138_BOUNDED_RETRY_V4_PATHS.sourceController), "utf8")
    const production = source.slice(source.indexOf("export const runV138V4ProductionLive"), source.indexOf("export interface V138BoundedRetryV4CliDependencies"))
    expect(production).toContain("authenticateV138LiveV15ImmutableCustody")
    expect(production).toContain("consumeV138LiveV15Invocation")
    expect(production).toContain("authenticateV138LiveV15InvocationMarker")
    expect(production.indexOf("consumeV138LiveV15Invocation")).toBeLessThan(production.indexOf("acquireV138RetryV4OwnerLease"))
    expect(production).not.toContain("validateInputs")
    expect(production).not.toContain("checkPair?.")
    expect(source).toContain("checkV138PublishedRetryV4OutcomeWithEnvelope")
    expect(source).toContain("shutdownUncertainty")
  })
  it("binds every native PAIR/LIFE call to the opaque lease argument", () => {
    const source = readFileSync(path.join(ROOT, V138_BOUNDED_RETRY_V4_PATHS.sourceController), "utf8")
    const ast = ts.createSourceFile("producer.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    const calls: Array<{ name: string; count: number; third: string }> = []
    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
        ["publishV138RetryV4NativePair", "applyV138RetryV4NativeLifecycle"].includes(node.expression.text)) {
        calls.push({ name: node.expression.text, count: node.arguments.length,
          third: node.arguments[2]?.getText(ast) ?? "" })
      }
      ts.forEachChild(node, visit)
    }
    visit(ast)
    expect(calls).toHaveLength(5)
    expect(calls.every(call => call.count >= 3 && /^(?:lease|args\.lease)$/u.test(call.third))).toBe(true)
    expect(source).not.toContain("v3-journal-bootstrap")
    expect(source).not.toContain("v3-reproduction-terminal")
  })
  it("exposes only acquisition, never a caller-selected descriptor", () => {
    expect(typeof acquireV138RetryV4OwnerLease).toBe("function")
    expect(acquireV138RetryV4OwnerLease).toHaveLength(1)
  })
  it("uses bounded bootstrap v3 and retains denied authority", () => {
    expect(V138_BOUNDED_RETRY_V4_CUSTODY).toMatchObject({
      schemaVersion: "v1.38-bounded-retry-v4-custody-v1",
      privateNativeAssurance: expect.objectContaining({ compilerTimeoutMilliseconds: 30_000, signingTimeoutMilliseconds: 10_000 }),
    })
    expect(V138_BOUNDED_RETRY_V4_POLICY).toMatchObject({ maximumRouteStarts: 3, maximumPreflightObservations: 12,
      productionAuthorized: false, holdoutOpeningAuthorized: false })
  })
  it("stops after terminal calibration failure and performs no reproduction", async () => {
    let now = 0, reproductions = 0
    const result = await runV138BoundedRetryV4Controller({ envelope: fixtureEnvelope(), owner: "fixture", records: [], effects: {
      monotonicMilliseconds: () => now++, waitUntil: async target => { now = target },
      observePreflight: async () => ({ available: true, effectiveAvailableBasisPoints: 3000 }),
      runCalibration: async () => ({ status: "system_failure", completeCleanup: false }),
      runReproduction: async () => { reproductions++; return { status: "system_failure", acceptedCells: 0, completeCleanup: false } },
      appendDurableRecord: () => {},
    } })
    expect(result.state).toMatchObject({ disposition: "terminal_failure", calibrationIdentitiesCharged: 8,
      reproductionIdentitiesCharged: 0, acceptedCells: 0 })
    expect(reproductions).toBe(0)
  })
  it("charges exactly 540 cells only after admitted calibration", async () => {
    let now = 0
    const result = await runV138BoundedRetryV4Controller({ envelope: fixtureEnvelope(), owner: "fixture", records: [], effects: {
      monotonicMilliseconds: () => now++, waitUntil: async target => { now = target },
      observePreflight: async () => ({ available: true, effectiveAvailableBasisPoints: 3000 }),
      runCalibration: async () => ({ status: "admitted", completeCleanup: true, supervisionRoot: SHA }),
      runReproduction: async ({ identities }) => ({ status: "passed_exact", acceptedCells: identities.length,
        completeCleanup: true, reproductionRoot: SHA, artifact: { status: "passed_exact", acceptedCellCount: 540, completeCleanup: true, receiptRoot: SHA } }),
      appendDurableRecord: () => {},
    } })
    expect(result.state).toMatchObject({ disposition: "succeeded", calibrationIdentitiesCharged: 8,
      reproductionIdentitiesCharged: 540, acceptedCells: 540 })
  })

  it("recovers the durable admitted supervision root across a controller restart", async () => {
    const { envelope, records } = admittedJournal()
    let now = 100, calibrationCalls = 0, reproductionCalls = 0
    const result = await runV138BoundedRetryV4Controller({ envelope, owner: "fixture", records, effects: {
      monotonicMilliseconds: () => now++, waitUntil: async target => { now = target },
      observePreflight: async () => ({ available: false }),
      runCalibration: async () => { calibrationCalls++; return { status: "system_failure", completeCleanup: false } },
      runReproduction: async ({ identities, supervisionRoot }) => {
        reproductionCalls++
        expect(supervisionRoot).toBe(SHA)
        return { status: "passed_exact", acceptedCells: identities.length, completeCleanup: true,
          reproductionRoot: SHA }
      },
      appendDurableRecord: () => {},
    } })
    expect(calibrationCalls).toBe(0)
    expect(reproductionCalls).toBe(1)
    expect(result.state).toMatchObject({ disposition: "succeeded", reproductionIdentitiesCharged: 540,
      acceptedCells: 540 })
  })

  it("rejects missing admitted supervision custody before charging or effects", async () => {
    const { envelope, records } = admittedJournal(false)
    let appended = 0, reproductions = 0
    await expect(runV138BoundedRetryV4Controller({ envelope, owner: "fixture", records, effects: {
      monotonicMilliseconds: () => 100, waitUntil: async () => {},
      observePreflight: async () => ({ available: false }),
      runCalibration: async () => ({ status: "system_failure", completeCleanup: false }),
      runReproduction: async () => { reproductions++; return { status: "system_failure", acceptedCells: 0,
        completeCleanup: false } },
      appendDurableRecord: () => { appended++ },
    } })).rejects.toThrow(/ADMITTED_SUPERVISION_ROOT/)
    expect(appended).toBe(0)
    expect(reproductions).toBe(0)
  })
})
