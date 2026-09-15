import { freezeLabValue, labRoot, type LabRoot } from "../contracts.js"

/**
 * The Phase 265 reference corpus is deliberately source-only.  These labels are
 * not Match records, provider requests, or authorization to dispatch work.
 */
export interface LeagueEvaluationFixture {
  readonly id: string
  readonly evidenceClass: "injected_fixture"
  readonly root: LabRoot
  readonly expectedDisposition: string
  readonly assertions: readonly string[]
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

const fixture = (id: string, expectedDisposition: string, assertions: readonly string[]): Readonly<LeagueEvaluationFixture> =>
  freezeLabValue({
    id,
    evidenceClass: "injected_fixture" as const,
    root: labRoot("phase-265-league-evaluation-fixture-v1", { id, expectedDisposition, assertions }),
    expectedDisposition,
    assertions: [...assertions],
    prohibitedActions,
    empiricalRequirementsComplete: false as const,
  })

/** The exact sixteen AI-SPEC groups, indexed for source-proof tests and review. */
export const LEAGUE_EVALUATION_FIXTURES = Object.freeze([
  fixture("complete-alias-aware-matrix", "complete", ["8 × C(n,2) identity set", "Smoke/Open Field semantic alias is one geometry"]),
  fixture("matrix-fault-families", "reject", ["sparse", "duplicate-identical", "duplicate-conflicting"]),
  fixture("invalid-and-system-terminals", "process_invalid", ["invalid terminal", "system failure terminal"]),
  fixture("degenerate-solver", "complete", ["tied exact-solver optima"]),
  fixture("permutation-and-numeric-boundary", "byte_identical", ["permutation", "completion order", "numeric boundary"]),
  fixture("repeat-layout-and-replay", "byte_identical", ["repeat", "worker/shard", "restart", "replay reconstruction"]),
  fixture("round-targets", "declared", ["frozen mixture", "named strongest/vulnerable pure policies"]),
  fixture("accepted-counter-reentry", "reenter", ["accepted counter produces next-round snapshot"]),
  fixture("charged-outcomes", "retained", ["weak", "rejected", "invalid", "duplicate", "unfilled", "unused"]),
  fixture("clone-and-novelty", "classify", ["correlated clone", "renamed clone", "genuinely novel fingerprint"]),
  fixture("mixture-and-portfolio", "separate", ["diagnostic mixture is never a deployable Strategy", "diverse pure portfolio"]),
  fixture("robust-pure-pass", "maximin_oracle_relative_pure", ["all frozen hard gates"]),
  fixture("no-finalist", "no_robust_pure_finalist_found", ["honest no-finalist result"]),
  fixture("nine-probes", "complete", ["side", "initiative", "horizontal symmetry", "opaque IDs", "Soldier order", "source order", "semantic arena identity", "repeat/restart", "worker/shard/completion"]),
  fixture("hostile-runtime", "blocked", ["hostile source boundary", "illegal output disposition"]),
  fixture("safe-projection-denial", "reject", ["source", "StrategyMemory", "SoldierMemory", "objective", "holdout", "formation", "public/deployment fields"]),
] satisfies readonly LeagueEvaluationFixture[])
