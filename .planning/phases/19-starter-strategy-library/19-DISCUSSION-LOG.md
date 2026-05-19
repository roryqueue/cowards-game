# Phase 19: Starter Strategy Library - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19
**Phase:** 19-Starter Strategy Library
**Areas discussed:** Starter Competence Bar, Doctrine Shape and Source Style, Library Placement and Fork Flow, Validation and Battle Testing

---

## Starter Competence Bar

| Option | Description | Selected |
| --- | --- | --- |
| Credible but readable | Real tactical doctrine, short enough to understand and fork. | ✓ |
| Teaching-first examples | Mostly API/mechanic demonstrations. |  |
| Strong baseline ladder bots | More sophisticated and explicitly competitive. |  |
| Tiered library | Mix of simple, credible, and advanced doctrines. | ✓ |

**User's choice:** A mix anchored on credible-but-readable, with a significant tiered element if strategy design warrants it, but no more than 4 advanced starters.
**Notes:** No starter should be a joke or pure API demo.

| Option | Description | Selected |
| --- | --- | --- |
| More tactical conditions | Combine threat escape, enemy proximity, contraction, and positioning priorities. | ✓ |
| More memory use | Demonstrate StrategyMemory/SoldierMemory patterns. |  |
| More aggressive optimization | Allow denser heuristics to win more. |  |
| Different learning role per advanced starter | Each advanced starter teaches a harder concept. | ✓ |

**User's choice:** Advanced means richer tactical condition chains plus harder strategic concepts.
**Notes:** Memory is allowed only where it clarifies doctrine.

| Option | Description | Selected |
| --- | --- | --- |
| Strategic coverage | Span major doctrine families. | ✓ |
| Matchup diversity | Create interesting interactions between starters. | ✓ |
| Learning progression | Order from approachable to harder concepts. | ✓ |
| Meta baseline | Establish a visible starter meta. |  |

**User's choice:** Prioritize strategic coverage and learning progression, with matchup diversity as secondary.
**Notes:** Sacrifice matchup diversity before coverage or progression.

| Option | Description | Selected |
| --- | --- | --- |
| Doctrine labels only | Names, tags, and expected behavior, no strength/difficulty ratings. | ✓ |
| Learning difficulty tags | Beginner/intermediate/advanced labels. |  |
| Competitive strength tags | Baseline/solid/advanced strength labels. |  |
| Both difficulty and doctrine tags | Doctrine plus subtle learning complexity. |  |

**User's choice:** Doctrine labels only.
**Notes:** Internal complexity notes are allowed for planning/tests, but not player-facing.

---

## Doctrine Shape and Source Style

| Option | Description | Selected |
| --- | --- | --- |
| Shared priority scaffold | Every starter uses the same broad structure. |  |
| Doctrine-specific style | Each starter uses the approach best suited to its tactics. | ✓ |
| Two-template family | Simple and advanced starters use different scaffolds. |  |
| Minimal pattern only | Only API shape is consistent. |  |

**User's choice:** Doctrine-specific source styles.
**Notes:** The user wants to expose players to different approaches, even with a steeper learning curve.

| Option | Description | Selected |
| --- | --- | --- |
| Doctrine header plus priority comments | Short doctrine block and key decision section labels. | ✓ |
| Heavy inline teaching comments | Comment most branches/helpers. |  |
| Minimal comments, clean code | Let names and structure explain. |  |
| External notes only | Put explanation on cards, keep source terse. |  |

**User's choice:** Doctrine header plus priority comments.
**Notes:** Enough to orient players without noisy tutorial code.

| Option | Description | Selected |
| --- | --- | --- |
| Use memory only where doctrine needs it | Most stay stateless; memory appears where useful. | ✓ |
| Avoid memory in all starters | Keep all starters simpler. |  |
| Require at least a few memory examples | Ensure early memory exposure. | ✓ |
| Make memory the advanced-starter marker | Memory distinguishes advanced starters. |  |

**User's choice:** Use memory where useful, with at least three starters using memory meaningfully.
**Notes:** Memory should show strategic value, not checkbox complexity.

| Option | Description | Selected |
| --- | --- | --- |
| Strongly distinct | Noticeably different decisions and heuristics. | ✓ |
| Same primitives, different weights | Shared helper concepts, different priorities. |  |
| Clustered families | 3-4 families, similar inside each. |  |
| Whatever wins | Allow convergence if effective. |  |

**User's choice:** Strongly distinct.
**Notes:** Code variety and maintenance cost are acceptable.

---

## Library Placement and Fork Flow

| Option | Description | Selected |
| --- | --- | --- |
| Distinct Workshop section | Separate Starter Library inside Workshop. | ✓ |
| Replace current starter samples | Promote into existing samples/templates area. |  |
| Account/onboarding entry point | Show starters from account or first-run onboarding. |  |
| Standalone public library page | Public browseable page. |  |

**User's choice:** Distinct Workshop section.
**Notes:** Future onboarding/public surfaces can reuse data later.

| Option | Description | Selected |
| --- | --- | --- |
| Preview first, then fork | Selecting previews; fork is explicit. | ✓ |
| Load into draft only | Current sample-like behavior. |  |
| Immediate fork | Click creates account revision. |  |
| Choose load or fork | Card offers both actions. |  |

**User's choice:** Preview first, then explicit fork.
**Notes:** Loading as draft can be secondary if it fits.

| Option | Description | Selected |
| --- | --- | --- |
| Stay in Workshop with fork selected | Continue edit/test flow. | ✓ |
| Go to account revisions | Reinforces ownership. |  |
| Go directly to exhibition setup | Fast testing path. |  |
| Show a small success choice | Stay by default plus lightweight next links. | ✓ |

**User's choice:** Prefer lightweight success choice if small; otherwise Workshop with fork selected.
**Notes:** Preserve edit/test flow.

| Option | Description | Selected |
| --- | --- | --- |
| System template lineage | Record starter lineage metadata. | ✓ |
| Copy source only | Simpler, loses lineage. |  |
| Create account Strategy from template | New account Strategy plus first revision. | ✓ |
| Let user choose name before fork | Better ownership feel, more friction. |  |

**User's choice:** Create account Strategy from template if it fits, and record lineage either way.
**Notes:** Minimum lineage: starter id/name/version/source hash.

---

## Validation and Battle Testing

| Option | Description | Selected |
| --- | --- | --- |
| Validation + smoke Match | Every starter validates and runs at least one smoke Match. | ✓ |
| Validation + standard exhibition | Broader standard preset evidence. |  |
| Validation + doctrine-specific scenario | Targeted intended-behavior proof. | ✓ |
| Validation only | Fastest but weak. |  |

**User's choice:** Validation + smoke Match, with selective doctrine-specific checks.
**Notes:** Advanced or tricky starters should get behavior checks where feasible.

| Option | Description | Selected |
| --- | --- | --- |
| Small gauntlet sample | Curated starter-vs-starter subset. | ✓ |
| Full round-robin all starters | Stronger but slower/noisy. |  |
| No starter-vs-starter testing yet | Lighter phase. |  |
| Snapshot expected records | Regression guard but brittle. |  |

**User's choice:** Small curated starter-vs-starter gauntlet.
**Notes:** Catch broken doctrines without balance engineering.

| Option | Description | Selected |
| --- | --- | --- |
| No fixed win-rate promises | Validate, execute, and observe behavior. | ✓ |
| Basic sanity thresholds | Avoid catastrophic results. |  |
| Doctrine-specific success signals | Behavior signals over wins. | ✓ |
| Fixed matchup expectations | Assert key winners. |  |

**User's choice:** No fixed win-rate promises plus doctrine-specific success signals.
**Notes:** Avoid exact wins or rankings.

| Option | Description | Selected |
| --- | --- | --- |
| Keep if doctrine is clear and execution is healthy | Distinct idea matters. | ✓ |
| Revise until it wins at least sometimes | Better competitive feel. |  |
| Move to future/experimental starter | Tighter beta set. |  |
| Replace with a stronger doctrine | Prioritize player success. |  |

**User's choice:** Keep underperformers if doctrine is clear and execution healthy.
**Notes:** Replace only if weakness misleads players.

## the agent's Discretion

- Pick which starters are advanced, capped at 4.
- Pick which at least three starters use memory meaningfully.
- Pick exact curated gauntlet matchups and behavior signals.
- Include post-fork success choice only if it remains lightweight.

## Deferred Ideas

- Account/onboarding starter entry point.
- Standalone public starter library page.
- Public difficulty, strength, or power labels.
