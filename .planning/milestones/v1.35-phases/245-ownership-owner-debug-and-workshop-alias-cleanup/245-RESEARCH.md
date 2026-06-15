# Phase 245: Ownership, Owner-Debug, and Workshop Alias Cleanup - Research

**Researched:** 2026-06-15  
**Status:** Complete  
**Sources:** local code inspection, Phase 243 inventory, Phase 244 proof, and read-only Phase 245 research subagent.

## Findings

- Account Strategy source reads already use the Go account source route through the current account session. Go joins `strategy_revisions` to `strategies.owner_user_id`, and the web route returns source as `text/plain` with `cache-control: private, no-store`.
- Owner-debug replay had two gates: query/env parsing in the replay page, then persisted Match participant authorization in the replay server. The risky edge was stale Workshop rows using `player:workshop-local`, which could still authorize owner-private replay.
- Workshop source aliases `/api/workshop/source` and `/api/workshop/revisions/:revisionId/source` returned source directly from Workshop storage. These aliases were the clearest API bypass risk because they did not use account ownership semantics.
- Retained Workshop submit/validate/test/analytics routes remain local Workshop compatibility surfaces. They must not be described as account ownership, competition entry, or owner-private replay authorization.
- Public/default replay tests already cover owner-private redaction. Phase 245 needed to add local Workshop quarantine and source-alias deprecation evidence.

## Phase Slices

1. Quarantine `player:workshop-local` from owner-private replay authorization.
2. Remove local Workshop owner-debug links from the Workshop UI flow.
3. Replace legacy Workshop source aliases with explicit private/no-store 410 migration responses.
4. Add deterministic proof artifacts and monitor wiring.
5. Validate account source, owner-debug, alias, retained Workshop, Go auth/source, and public privacy behavior.

## Surprise

`resolvePersistedMatchOwners` is intentionally limited to Workshop MatchSets today. Phase 245 keeps that conservative posture and does not claim broad account-owner private replay for all competitions.
