import { freezeLabValue } from "../contracts.js"

/**
 * The Phase 265 reference corpus is deliberately source-only.  These labels are
 * not Match records, provider requests, or authorization to dispatch work.
 */
export interface LeagueEvaluationFixture {
  readonly id: string
  readonly evidenceClass: "injected_fixture"
  readonly expectedDisposition: string
  readonly coverage: Readonly<{ testFile: string; testName: string; assertion: string; assertionId: string }>
  readonly prohibitedActions: readonly string[]
  readonly empiricalRequirementsComplete: false
}

const prohibitedActions = Object.freeze([
  "candidate_authoring",
  "provider_handshake",
  "guest_execution",
  "empirical_dispatch",
  "participant_or_holdout_access",
] as const)

const fixture = (id: string, expectedDisposition: string, coverage: Omit<LeagueEvaluationFixture["coverage"], "assertionId">): Readonly<LeagueEvaluationFixture> =>
  freezeLabValue({
    id,
    evidenceClass: "injected_fixture" as const,
    expectedDisposition,
    coverage: { ...coverage, assertionId: `league-eval:${id}` },
    prohibitedActions,
    empiricalRequirementsComplete: false as const,
  })

/** The exact sixteen AI-SPEC groups, indexed for source-proof tests and review. */
export const LEAGUE_EVALUATION_FIXTURES = Object.freeze([
  fixture("complete-alias-aware-matrix", "complete", { testFile: "packages/strategy-lab/src/league/integration.test.ts", testName: "joins an eight-cell matrix to the actual solver, durable terminals, and issued-false nonempty reopening", assertion: "enumerateLeagueCells returns eight semantic cells and admitCompletePayoffSnapshot is complete" }),
  fixture("matrix-fault-families", "blocked", { testFile: "packages/strategy-lab/src/league/matrix.test.ts", testName: "blocks every gap, duplicate, identity mismatch, invalid disposition, and system failure while retaining process evidence", assertion: "missing, duplicate, conflict and identity mismatch remain blocked" }),
  fixture("invalid-and-system-terminals", "process_invalid", { testFile: "packages/strategy-lab/src/league/matrix.test.ts", testName: "blocks every gap, duplicate, identity mismatch, invalid disposition, and system failure while retaining process evidence", assertion: "invalid, player violation and system failure terminals cannot reduce" }),
  fixture("degenerate-solver", "solved", { testFile: "packages/strategy-lab/src/league/solver.test.ts", testName: "selects only a decisive exact synthetic candidate with committed golden and boundary evidence", assertion: "exact tied optimum uses the frozen solver output" }),
  fixture("permutation-and-numeric-boundary", "byte_identical", { testFile: "packages/strategy-lab/src/league/solver.test.ts", testName: "emits canonical exact output across repeat, source-order, worker, shard, and restart probes", assertion: "permutation and numeric boundary vectors retain exact bytes" }),
  fixture("repeat-layout-and-replay", "byte_identical", { testFile: "packages/strategy-lab/src/league/matrix.test.ts", testName: "reduces reorders and operational layouts to identical semantic payoff bytes and roots", assertion: "reversed terminal layout retains snapshot root and payoff bytes" }),
  fixture("round-targets", "declared", { testFile: "packages/strategy-lab/src/league/psro.test.ts", testName: "roots a frozen mixture plus strongest and vulnerable pure targets and charges before response work", assertion: "mixture and named pure targets are rooted before response admission" }),
  fixture("accepted-counter-reentry", "reenter", { testFile: "packages/strategy-lab/src/league/red-team.test.ts", testName: "returns a positive counter to actual PSRO and cannot close while that counter is omitted", assertion: "accepted counter produces next-round admission and rejects early closure" }),
  fixture("charged-outcomes", "retained", { testFile: "packages/strategy-lab/src/league/red-team.test.ts", testName: "starts before work, burns reservations, retains every terminal and refuses capacity refunds", assertion: "every terminal retains the full reserved charge" }),
  fixture("clone-and-novelty", "classify", { testFile: "packages/strategy-lab/src/league/selection.test.ts", testName: "uses candidate-specific assessed base edges without laundering an affirmative calibration's cosmetic controls", assertion: "controls and unresolved candidates cannot launder novelty" }),
  fixture("mixture-and-portfolio", "separate", { testFile: "packages/strategy-lab/src/league/selection.test.ts", testName: "rejects arbitrary roots and independent labels, while only retained source-backed FactoryFingerprintEvidence can create a portfolio", assertion: "portfolio derives from retained fingerprint evidence, not labels" }),
  fixture("robust-pure-pass", "robust_pure_finalist", { testFile: "packages/strategy-lab/src/league/selection.test.ts", testName: "recomputes strict frozen policy boundaries and qualified maximin rather than accepting pass flags or another candidate's proof", assertion: "all hard gates produce only a maximin-oracle-relative pure disposition" }),
  fixture("no-finalist", "no_robust_pure_finalist_found", { testFile: "packages/strategy-lab/src/league/selection.test.ts", testName: "does not turn twelve novel labels or fingerprint roots into six behavioral families or five independent cores", assertion: "insufficient behavioral/core evidence remains no-finalist" }),
  fixture("nine-probes", "complete", { testFile: "packages/strategy-lab/src/league/red-team.test.ts", testName: "records all nine probes with exact identity versus bounded valid-condition contrasts", assertion: "all nine probe families close every target" }),
  fixture("hostile-runtime", "process_invalid", { testFile: "packages/strategy-lab/src/league/connected-runner.test.ts", testName: "rejects a forged closure or caller-created provider, and preserves cleanup failure as charged non-payoff evidence", assertion: "host-owned issuance and invalid runtime evidence fail closed" }),
  fixture("safe-projection-denial", "reject", { testFile: "packages/strategy-lab/src/league/report.test.ts", testName: "fails closed for stale/incomplete repository state, unsupported claims, and sensitive projection fields", assertion: "source, memory and objective fields are absent from safe reports" }),
] satisfies readonly LeagueEvaluationFixture[])
