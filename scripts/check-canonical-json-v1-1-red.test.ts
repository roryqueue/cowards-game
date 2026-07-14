import { mkdtempSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  EXPECTED_GO_SENTINEL,
  EXPECTED_TS_SENTINEL,
  createCanonicalJsonV11RedReceipt,
  evaluateCanonicalJsonV11Red,
  writeCanonicalJsonV11RedReceipt,
  checkCanonicalJsonV11RedReceipt,
  type ConsumerCommandResult,
  type RedStage,
} from "./check-canonical-json-v1-1-red.js"

const root = "f658a8bcb6bd4457b2eb52b6628f7fc6ff4ca36661f685ab28d7b60c8b2722c0"
const enumeration = "a".repeat(64)
const line = (language: "TS" | "GO") =>
  `[CANONICAL_JSON_CORPUS:${language}] count=70 root=${root} enumeration=${enumeration}`
const result = (
  language: "TS" | "GO",
  mode: "missing" | "green",
  overrides: Partial<ConsumerCommandResult> = {},
): ConsumerCommandResult => ({
  command: language === "TS" ? "fake-ts" : "fake-go",
  exitCode: mode === "missing" ? 1 : 0,
  stdout: `${line(language)}\n`,
  stderr:
    mode === "missing"
      ? `${language === "TS" ? EXPECTED_TS_SENTINEL : EXPECTED_GO_SENTINEL}\n`
      : "",
  timedOut: false,
  ...overrides,
})

describe("canonical JSON v1.1 exact RED verifier", () => {
  it.each<[RedStage, "missing" | "green", "missing" | "green"]>([
    ["both-missing", "missing", "missing"],
    ["go-missing", "green", "missing"],
    ["green", "green", "green"],
  ])("accepts only the exact %s stage", (stage, tsMode, goMode) => {
    const receipt = evaluateCanonicalJsonV11Red({
      stage,
      vectorCount: 70,
      vectorRootSha256: root,
      ts: result("TS", tsMode),
      go: result("GO", goMode),
    })
    expect(receipt.stage).toBe(stage)
    expect(receipt.consumers.map((consumer) => consumer.result)).toEqual([
      tsMode === "missing" ? "expected-red" : "green",
      goMode === "missing" ? "expected-red" : "green",
    ])
  })

  it.each([
    ["zero enumeration", result("TS", "missing", { stdout: `[CANONICAL_JSON_CORPUS:TS] count=0 root=${root} enumeration=${enumeration}\n` })],
    ["wrong root", result("TS", "missing", { stdout: `[CANONICAL_JSON_CORPUS:TS] count=70 root=${"b".repeat(64)} enumeration=${enumeration}\n` })],
    ["generic nonzero", result("TS", "missing", { stderr: "assertion failed\n" })],
    ["counterfeit success", result("TS", "missing", { exitCode: 0 })],
    ["timeout", result("TS", "missing", { timedOut: true })],
    ["discovery failure", result("TS", "missing", { stderr: `No test files found\n${EXPECTED_TS_SENTINEL}\n` })],
    ["compile failure", result("TS", "missing", { stderr: `Cannot find module codec\n${EXPECTED_TS_SENTINEL}\n` })],
    ["wrong sentinel", result("TS", "missing", { stderr: `${EXPECTED_GO_SENTINEL}\n` })],
    ["sentinel before enumeration", result("TS", "missing", { stdout: `${EXPECTED_TS_SENTINEL}\n${line("TS")}\n`, stderr: "" })],
    ["forbidden empty-test mode", result("TS", "missing", { stderr: `passWithNoTests\n${EXPECTED_TS_SENTINEL}\n` })],
  ])("rejects counterfeit RED: %s", (_name, ts) => {
    expect(() =>
      evaluateCanonicalJsonV11Red({
        stage: "both-missing",
        vectorCount: 70,
        vectorRootSha256: root,
        ts,
        go: result("GO", "missing"),
      }),
    ).toThrow()
  })

  it("requires TS and Go to enumerate the identical complete identity", () => {
    expect(() =>
      evaluateCanonicalJsonV11Red({
        stage: "both-missing",
        vectorCount: 70,
        vectorRootSha256: root,
        ts: result("TS", "missing"),
        go: result("GO", "missing", {
          stdout: `${line("GO").replace(enumeration, "c".repeat(64))}\n`,
        }),
      }),
    ).toThrow(/enumeration/)
  })

  it("writes and checks one deterministic receipt", () => {
    const receipt = createCanonicalJsonV11RedReceipt({
      stage: "both-missing",
      vectorCount: 70,
      vectorRootSha256: root,
      ts: result("TS", "missing"),
      go: result("GO", "missing"),
    })
    const directory = mkdtempSync(path.join(tmpdir(), "canonical-json-red-"))
    const receiptPath = path.join(directory, "receipt.json")
    writeCanonicalJsonV11RedReceipt(receipt, receiptPath)
    expect(checkCanonicalJsonV11RedReceipt(receipt, receiptPath)).toEqual([])
    expect(readFileSync(receiptPath, "utf8")).not.toMatch(/createdAt|timestamp/)
  })
})
