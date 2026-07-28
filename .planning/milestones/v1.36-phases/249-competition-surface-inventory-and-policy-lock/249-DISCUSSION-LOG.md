# Phase 249: Competition Surface Inventory and Policy Lock - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-06-15
**Phase:** 249-Competition Surface Inventory and Policy Lock
**Areas discussed:** Public Posture Copy, Inventory Granularity, Policy Contract Shape, Forbidden Claims Monitor

---

## Public Posture Copy

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| How direct should the public beta trial, resettable, no durable rating message be? | Prominent and plain | Put it near standings/entry/result headers in calm product language. | yes |
| How direct should the public beta trial, resettable, no durable rating message be? | Contextual only | Show it in help text, policy panels, and empty states, but keep main pages cleaner. | |
| How direct should the public beta trial, resettable, no durable rating message be? | Strong warning style | Make reset/non-durable status very explicit anywhere standings appear. | |
| What default phrase should downstream agents use? | public beta trial competition | Most precise: beta quality, trial policy, competitive enough. | yes |
| What default phrase should downstream agents use? | Trial Season standings | Softer and simpler, but less clear that the whole competition posture is beta. | |
| What default phrase should downstream agents use? | Resettable public beta | Very clear about reset risk, slightly more product-y. | |
| Where should the no-durable-rating/reset language appear? | Every competition trust surface | Show it where counted/trial evidence appears. | yes |
| Where should the no-durable-rating/reset language appear? | Only standings and entry | The strongest decision points, less repetition elsewhere. | |
| Where should the no-durable-rating/reset language appear? | Standing/result/replay only | Wherever evidence could be mistaken as official ranking truth. | |
| Should completed/archived Seasons still carry the same label? | Yes, always | Archived evidence still must not look like permanent official ratings. | yes |
| Should completed/archived Seasons still carry the same label? | Lighter archive label | Keep the meaning, but less visual weight after completion. | |
| Should completed/archived Seasons still carry the same label? | Only in policy details | Archive pages are historical, so the warning can be tucked away. | |

**User's choice:** Prominent/plain posture copy, default phrase `public beta trial competition`, posture on every competition trust surface, and labels persist on completed/archived Seasons.
**Notes:** The copy should be calm product language rather than alarmist warning language.

---

## Inventory Granularity

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| How detailed should the Phase 249 surface inventory be? | Route/code/artifact inventory | Like v1.35 Phase 243: list routes, DTOs, modules, pages, proof scripts, docs/copy, monitors, owner, privacy class, downstream phase. | yes |
| How detailed should the Phase 249 surface inventory be? | Broad owner/risk matrix | Faster and easier to read, but planners may need to rediscover exact files later. | |
| How detailed should the Phase 249 surface inventory be? | Two-layer inventory | High-level summary plus detail appendix. | |
| What should count as an inventory surface for v1.36? | Everything that can affect public trust | Routes, DTOs, pages, persistence, Go paths, docs/copy, monitors, proof artifacts, test fixtures. | yes |
| What should count as an inventory surface for v1.36? | Only public/product surfaces | Pages, APIs, DTOs, public copy, public proof. | |
| What should count as an inventory surface for v1.36? | Only competition-owned surfaces | Ladder/competition/governance modules and pages, excluding replay/player/Strategy unless directly linked. | |
| How should each row be classified? | Single disposition | `lock-now`, `fix-in-250`, `fix-in-251`, `fix-in-252`, `fix-in-253`, `fix-in-254`, `prove-in-255`, `future/defer`. | yes |
| How should each row be classified? | Risk severity only | High/medium/low; planners decide phase mapping. | |
| How should each row be classified? | Owner only | Spec/Go/persistence/web/docs/proof; simpler but less actionable. | |
| Should Phase 249 create a machine-readable inventory file as well as Markdown? | Yes, Markdown plus JSON | Markdown for humans, JSON for monitors/future proof scripts. | yes |
| Should Phase 249 create a machine-readable inventory file as well as Markdown? | Markdown only | Simpler; enough if monitors parse text loosely or are added later. | |
| Should Phase 249 create a machine-readable inventory file as well as Markdown? | JSON first | Strong for tooling, but less pleasant for planning/audit review. | |

**User's choice:** Detailed route/code/artifact inventory, public-trust-inclusive scope, single downstream disposition per row, Markdown plus JSON.
**Notes:** v1.35 Phase 243 is the precedent.

---

## Policy Contract Shape

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| How strict should `competition-policy-v1.36` be? | Spec-owned schema and constants | Define posture, forbidden claims, counted-state vocabulary, privacy exclusions, public labels, and policy IDs in `@cowards/spec`. | yes |
| How strict should `competition-policy-v1.36` be? | Documentation-first contract | Human-readable artifact is authoritative; code imports can follow later. | |
| How strict should `competition-policy-v1.36` be? | Hybrid lightweight constants | A few constants in spec plus a detailed Markdown policy artifact. | |
| Which parts should be locked in that spec-owned contract during Phase 249? | Policy vocabulary and public labels | Posture, Season reset, no durable rating, counted-state names, privacy exclusions, forbidden claims. | yes |
| Which parts should be locked in that spec-owned contract during Phase 249? | Plus public DTO shapes | Also sketch public projection fields future phases must use. | |
| Which parts should be locked in that spec-owned contract during Phase 249? | Plus persistence enums | Push all storage enum names into the contract now. | |
| How should counted-state vocabulary be handled in Phase 249? | Projection vocabulary only | Define public-facing counted-state words and meanings; later phases map storage/internal states. | yes |
| How should counted-state vocabulary be handled in Phase 249? | Exact enum now | Lock final code enum names immediately. | |
| How should counted-state vocabulary be handled in Phase 249? | Copy-only descriptions | Avoid code vocabulary until Phase 252. | |
| Should forbidden claims be represented as exact phrases, categories, or both? | Both categories and examples | Categories for monitors and examples for humans. | yes |
| Should forbidden claims be represented as exact phrases, categories, or both? | Exact phrases only | Strong but brittle; misses paraphrases. | |
| Should forbidden claims be represented as exact phrases, categories, or both? | Categories only | Flexible but less concrete for copy writers. | |

**User's choice:** Spec-owned schema/constants, policy vocabulary and labels only, public projection counted-state vocabulary, forbidden claim categories plus examples.
**Notes:** Richer public DTO and persistence enum changes belong to later phases.

---

## Forbidden Claims Monitor

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| How broad should the Phase 249 monitor be? | Broad copy/privacy scan | Scan relevant code/docs/copy/proof artifacts for forbidden claim categories and private-output markers. | yes |
| How broad should the Phase 249 monitor be? | Known keyword guard only | Fast targeted checks for durable ratings, production sandbox, package ecosystem, TinyGo production. | |
| How broad should the Phase 249 monitor be? | Policy contract test only | Verify the contract exists; leave broad scans to Phase 255. | |
| Should that monitor be fail-loud immediately? | Fail-loud for clear violations | Block obvious overclaims/private markers now; allow documented false positives. | yes |
| Should that monitor be fail-loud immediately? | Evidence-only | Report findings but do not fail until final proof. | |
| Should that monitor be fail-loud immediately? | Fail only on new files | Avoid legacy cleanup, but weaker trust lock. | |
| What should the scan include by default? | Planning + code + UI + tests + proof artifacts | `.planning`, `packages`, `apps`, `scripts`, fixtures/snapshots where text appears. | yes |
| What should the scan include by default? | Public-facing paths only | `apps/web`, `packages/spec`, public proof artifacts/docs. | |
| What should the scan include by default? | Policy-owned paths only | New contract and inventory files plus monitor tests. | |
| Should Phase 249's monitor check required posture labels too? | Presence and absence | Check required posture labels where inventory requires them and forbidden/private markers absent. | yes |
| Should Phase 249's monitor check required posture labels too? | Absence only | Avoid brittle copy presence checks until UI phases. | |
| Should Phase 249's monitor check required posture labels too? | Presence only in policy artifacts | Contract must contain labels, pages can be checked later. | |

**User's choice:** Broad fail-loud scan across planning/code/UI/tests/proof artifacts, checking both required posture-label presence and forbidden/private-marker absence.
**Notes:** False positives should be documented explicitly.

---

## the agent's Discretion

- Exact filenames, JSON schema details, table columns, helper names, and test grouping.
- Exact implementation structure for monitors, as long as it follows existing v1.35 monitor patterns and preserves the decisions above.

## Deferred Ideas

None.
