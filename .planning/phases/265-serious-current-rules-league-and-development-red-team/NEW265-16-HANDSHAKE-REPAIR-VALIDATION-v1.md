---
phase: 265
plan: 16
kind: bounded_source_validation
status: complete
source-commit: 5077e3ac1246b4785f7ce60fbbb66b6aea86314
source-root: sha256:eaa793b2608a5a586a94f319b4cff7efe6575abba4dff80080817cf9ba92ba1c
manifest-entries: 888
---

# Handshake repair scoped validation

**Result: FILLED for the assigned connected handshake coverage only.** This is not Phase 265 completion, new empirical authorization, or evidence of native/provider/Docker/Strategy/Match execution.

## Executed check

Command:

```sh
node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-host-stage-v7.test.ts --maxWorkers=1 -t 'real issued v'
```

Observed: exit 0; 3 passed, 29 skipped (the other tests in this file); 9.06s. The three passing cases are the v5, v6, and v7 rows of `connected startup request digest handshake` / `real issued v%s host frames match their generated broker and reject wrong domains`.

An initial attempt used the full parameterized name as the filter and Vitest selected zero tests (32 skipped). It was not counted as validation; the narrower matching filter above selected and executed all three intended cases.

The connected test exercises the actual session producer/default transport and stream path with synthetic-only OS boundaries. It checks the selected generated broker source and exact emitted request-root domain for two identical payloads at ordinals 1 and 2; generated binding-guard acceptance for the matching domain and rejection for both other domains; authority-plus-injected `transport` and `streamFactory` refusal; and the 1000ms request / 5000ms host limits. The fixture denies unconfigured child-process/worker calls and uses only synthetic payloads. It does not execute the supervisor, broker imports, guest Strategy, native Worker, Docker, provider, or Match.

## Coverage and evidence map

| Requirement / invariant | Observable check | Result |
|---|---|---|
| v5/v6/v7 producer version maps to generated broker version | Per-version generated broker source is asserted against the actual startup `docker` invocation | green |
| Emitted payload/ordinal root uses selected version domain | Digest independently recomputed from emitted payload bytes and request ID; two calls assert ordinals and stable payload | green |
| Wrong-version roots are rejected | Generated trusted binding guard is exercised with each other version's domain | green |
| Injection guard remains active | Authority combined with either injected transport or stream factory throws before session construction | green |
| v5/v6 behavior preserved alongside v7 repair | All three version cases pass; historical pre-fix RED reported 1 failure (v7), 2 passes (v5/v6); post-fix GREEN reported 3 passes | green |
| Source identity and scope | Repair commit exists; both source/test files have no delta from that commit in this checkout | confirmed |
| Bounds/cleanup preservation | Focused test asserts request/host budgets and successful fixture close result; source review found no bounds/cleanup changes | green, scoped |
| No empirical/native route | No such route invoked; synthetic-only test fixture used | confirmed |

The 888-entry source root and root value above are the identities recorded by the repair summary. This validation did not independently recompute the full manifest. The source review reports the single intended producer correction and no findings; the worker separately reported the complete v7 file suite (32/32), strict strategy-lab typecheck, and `git diff --check` passing. Those broader checks were not rerun here.

## Limits and disposition

No historical/private payload, ordinary retained reader, allocation/result/credit state, or empirical route was accessed. Existing 29 spent charges and all prior results remain unchanged. Validation adds no empirical credit, requirement completion claim, or authorization. Implementation files remain unchanged.

**Assigned gap status: FILLED.** No implementation gap observed in the executed cases. This result is limited to the three connected handshake behaviors above.
