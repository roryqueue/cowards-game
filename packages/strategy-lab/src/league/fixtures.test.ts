import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"
import { LEAGUE_EVALUATION_FIXTURES } from "./fixtures.js"

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..")

// This links an index row to a matcher call, not to the truth of its assertion.
// Actual execution and captured test output remain the behavioral evidence.
const hasLinkedAssertion = (source: string, testName: string, assertionId: string): boolean => {
  const parsed = ts.createSourceFile("fixture.test.ts", source, ts.ScriptTarget.Latest, true)
  let linked = false
  const findMatcher = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && /^to[A-Z]/u.test(node.expression.name.text)) {
      const receiver = node.expression.expression
      const assertion = ts.isPropertyAccessExpression(receiver) && receiver.name.text === "not" ? receiver.expression : receiver
      if (ts.isCallExpression(assertion) && ts.isIdentifier(assertion.expression) && assertion.expression.text === "expect") {
        const marker = assertion.arguments[1]
        if (marker && ts.isStringLiteral(marker) && marker.text === assertionId) linked = true
      }
    }
    ts.forEachChild(node, findMatcher)
  }
  const findTest = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "it") {
      const name = node.arguments[0], callback = node.arguments[1]
      if (name && ts.isStringLiteral(name) && name.text === testName && callback && (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))) findMatcher(callback.body)
    }
    ts.forEachChild(node, findTest)
  }
  findTest(parsed)
  return linked
}

describe("Phase 265 injected evaluation reference corpus", () => {
  it("links every required source-only group to an actual marked matcher call", () => {
    expect(LEAGUE_EVALUATION_FIXTURES).toHaveLength(16)
    expect(LEAGUE_EVALUATION_FIXTURES.map((fixture) => fixture.id)).toEqual([
      "complete-alias-aware-matrix",
      "matrix-fault-families",
      "invalid-and-system-terminals",
      "degenerate-solver",
      "permutation-and-numeric-boundary",
      "repeat-layout-and-replay",
      "round-targets",
      "accepted-counter-reentry",
      "charged-outcomes",
      "clone-and-novelty",
      "mixture-and-portfolio",
      "robust-pure-pass",
      "no-finalist",
      "nine-probes",
      "hostile-runtime",
      "safe-projection-denial",
    ])
    expect(LEAGUE_EVALUATION_FIXTURES.map((fixture) => fixture.expectedDisposition)).toEqual([
      "complete", "blocked", "process_invalid", "solved", "byte_identical", "byte_identical", "declared", "reenter",
      "retained", "classify", "separate", "robust_pure_finalist", "no_robust_pure_finalist_found", "complete", "process_invalid", "reject",
    ])
    for (const fixture of LEAGUE_EVALUATION_FIXTURES) {
      expect(fixture.evidenceClass).toBe("injected_fixture")
      expect(fixture.empiricalRequirementsComplete).toBe(false)
      expect(fixture.expectedDisposition.length).toBeGreaterThan(0)
      expect(fixture.prohibitedActions).toContain("empirical_dispatch")
      expect(fixture.coverage.testFile).toMatch(/(?:\.test\.ts)$/u)
      expect(fixture.coverage.testName.length).toBeGreaterThan(12)
      expect(fixture.coverage.assertion.length).toBeGreaterThan(12)
      const source = readFileSync(resolve(repositoryRoot, fixture.coverage.testFile), "utf8")
      expect(hasLinkedAssertion(source, fixture.coverage.testName, fixture.coverage.assertionId), fixture.id).toBe(true)
    }
  })
  it("does not treat comments, marker strings, bare expect calls or another test as assertion linkage", () => {
    const name = "target", marker = "league-eval:test"
    for (const body of [`// ${marker}\n`, `const marker = "${marker}"`, `expect(true, "${marker}")`]) expect(hasLinkedAssertion(`it("target", () => { ${body} })`, name, marker)).toBe(false)
    expect(hasLinkedAssertion(`it("other", () => { expect(true, "${marker}").toBe(true) })`, name, marker)).toBe(false)
    expect(hasLinkedAssertion(`it("target", () => { expect(true, "${marker}").not.toBe(false) })`, name, marker)).toBe(true)
  })
})
