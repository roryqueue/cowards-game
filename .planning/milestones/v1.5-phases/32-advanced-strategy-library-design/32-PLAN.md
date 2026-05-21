# Phase 32: Advanced Strategy Library Design - Plan

## Research Summary

- Starter Strategies provide the best registry pattern.
- Public Strategy cards already expose safe metadata and records without source.
- Account fork flows already support Starter lineage and can be extended for Advanced lineage.

## Implemented Plan

1. Add a distinct `advanced-strategies.ts` registry with 10 v1.5 Advanced seeds.
2. Extend Strategy Revision metadata and public card DTOs with `advancedLineage`.
3. Add Advanced seed fork/apply support for account-owned revisions.
4. Show Advanced seed tier/archetype on Workshop, Strategy cards, and player profiles.

## Verification

- `pnpm --filter @cowards/persistence test -- workshop.test.ts`
- `pnpm --filter @cowards/spec test`
- Browser checks for Strategy cards and profiles.
