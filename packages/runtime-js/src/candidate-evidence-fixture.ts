import type { RuntimeInvocationExecutionReceiptEvidenceV117 } from "@cowards/spec"
import type { StrategyExecutionAccountingObservationV117 } from "./adapter.js"

type CandidateEvidenceFixture = (
  observation: StrategyExecutionAccountingObservationV117,
) => RuntimeInvocationExecutionReceiptEvidenceV117

const fixtures = new WeakMap<object, CandidateEvidenceFixture>()

/** Internal test registration; this module is absent from package exports. */
export const registerCandidateEvidenceFixture = (
  request: object,
  fixture: CandidateEvidenceFixture,
): void => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Candidate evidence fixtures are test-only")
  }
  fixtures.set(request, fixture)
}

/** Consumed only after a complete host observation exists. */
export const consumeCandidateEvidenceFixture = (
  request: object,
  observation: StrategyExecutionAccountingObservationV117,
): RuntimeInvocationExecutionReceiptEvidenceV117 | undefined => {
  const fixture = fixtures.get(request)
  fixtures.delete(request)
  return fixture?.(observation)
}
