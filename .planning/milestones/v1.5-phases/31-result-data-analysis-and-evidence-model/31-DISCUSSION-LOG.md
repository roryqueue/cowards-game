# Phase 31: Result Data Analysis and Evidence Model - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 31-Result Data Analysis and Evidence Model
**Areas discussed:** Evidence Packet Shape, Behavior Signal Taxonomy, Review Trigger Thresholds, Local Report Format

---

## Evidence Packet Shape

| Question | Option | Selected |
| --- | --- | --- |
| Minimum complete evidence packet | Provenance + standings + representative links | ✓ |
| Minimum complete evidence packet | Full tactical packet | |
| Minimum complete evidence packet | Compact score packet | |
| Minimum complete evidence packet | Machine-first packet | |
| Run/profile identity | Stable profile hash plus readable label | ✓ |
| Run/profile identity | Readable label only | |
| Run/profile identity | Opaque run id only | |
| Run/profile identity | Full expanded profile inline | |
| Representative links | Deterministic samples by category | ✓ |
| Representative links | Top-N by standings only | |
| Representative links | Manual curated links only | |
| Representative links | All links in JSON, curated subset in Markdown | |
| Caveats | Always include caveat fields | ✓ |
| Caveats | Only include caveats when triggered | |
| Caveats | One global caveat per report | |
| Caveats | Caveats only in UI copy | |

**User's choice:** Minimum evidence packets include provenance, standings, representative links, stable profile hash plus readable label, deterministic representative samples, and always-present caveat fields.
**Notes:** Evidence should remain audit-friendly without becoming a full tactical report in every packet.

---

## Behavior Signal Taxonomy

| Question | Option | Selected |
| --- | --- | --- |
| Signal role | Supportive signals, not proof alone | ✓ |
| Signal role | Hard archetype gates | |
| Signal role | Pure descriptive metrics | |
| Signal role | Manual review only | |
| First-class signal group | Core rules signals | ✓ |
| First-class signal group | Archetype-specific signals only | |
| First-class signal group | Everything countable from Chronicle events | |
| First-class signal group | Only standings + survival + Backstab | |
| Claim connection | Claim-to-signal mapping table | ✓ |
| Claim connection | Freeform notes per Strategy | |
| Claim connection | Automated score per archetype | |
| Claim connection | No formal mapping | |
| Ambiguous signals | Require replay-backed interpretation | ✓ |
| Ambiguous signals | Let counts speak for themselves | |
| Ambiguous signals | Hide ambiguous signals | |
| Ambiguous signals | Manual reviewer notes override metrics | |

**User's choice:** Behavior signals are supportive, use the core rules signal group, connect to archetype claims through a mapping table, and require replay-backed interpretation when ambiguous.
**Notes:** Counts alone should not be allowed to overclaim tactical meaning.

---

## Review Trigger Thresholds

| Question | Option | Selected |
| --- | --- | --- |
| Trigger strictness | Flag for human review, not automatic failure | ✓ |
| Trigger strictness | Hard blocking thresholds | |
| Trigger strictness | Advisory only | |
| Trigger strictness | Two-tier triggers | |
| Most severe trigger | Privacy/system integrity trigger | ✓ |
| Most severe trigger | Degenerate champion trigger | |
| Most severe trigger | Missing archetype trigger | |
| Most severe trigger | Filler entrant trigger | |
| Dominance flag | No close or unfavorable advanced-field matchup | ✓ |
| Dominance flag | Win-rate threshold | |
| Dominance flag | Points gap threshold | |
| Dominance flag | Composite dominance trigger | |
| v1.4 overfitting flag | Derivative-pattern cap | ✓ |
| v1.4 overfitting flag | Benchmark-performance skew | |
| v1.4 overfitting flag | Both derivative-pattern cap and benchmark-performance skew | |
| v1.4 overfitting flag | Manual notes only | |

**User's choice:** Review triggers mostly flag human review; privacy/system integrity is a hard stop; dominance is no close/unfavorable advanced matchup; overfitting is more than three Advanced Strategies primarily descended from v1.4 top winner styles.
**Notes:** Trigger policy should protect diversity without automatically rejecting legitimate specialists.

---

## Local Report Format

| Question | Option | Selected |
| --- | --- | --- |
| Canonical artifact | JSON canonical, Markdown summary generated from it | ✓ |
| Canonical artifact | Markdown canonical, optional JSON appendix | |
| Canonical artifact | Script stdout only | |
| Canonical artifact | App page canonical | |
| Artifact location | Planning phase directory | ✓ |
| Artifact location | Repo scripts/output or artifacts directory | |
| Artifact location | App fixture/data directory | |
| Artifact location | Both planning and generated artifacts directories | |
| Later phase consumption | Stable schema contract | ✓ |
| Later phase consumption | Human reference only | |
| Later phase consumption | Library module exported from app code | |
| Later phase consumption | CLI command as interface | |
| App-page readiness | None beyond link fields | ✓ |
| App-page readiness | Static mock report page | |
| App-page readiness | Reusable view-model only | |
| App-page readiness | Full local report page | |

**User's choice:** JSON is canonical, Markdown is generated, artifacts live in the phase directory, later phases consume a stable schema contract, and Phase 31 only requires link fields for later app pages.
**Notes:** Avoid pulling UI work into the analysis/model phase.

---

## the agent's Discretion

- Exact JSON file names, schema property names, Markdown layout, and implementation helpers.
- Exact mechanics for generating Markdown from JSON.

## Deferred Ideas

None.
