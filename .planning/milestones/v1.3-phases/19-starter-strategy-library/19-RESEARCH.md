# Phase 19 Research: Starter Strategy Library

## Findings

- Existing Workshop persistence already has account Strategy Revision creation, validation, and owner source retrieval, so starters should be normal fork targets rather than a special competition path.
- Starter metadata needs to preserve lineage without exposing private code on public pages.
- The useful starter set should span pressure, defense, mobility, traps, mirroring, and memory, with at least three starters using StrategyMemory or SoldierMemory.

## Decision

Implement a canonical in-repo Starter Strategy Library with 10 validated templates and expose it through Workshop snapshot data. Forking creates account-owned Strategy Revisions with tags and `starterLineage`.

