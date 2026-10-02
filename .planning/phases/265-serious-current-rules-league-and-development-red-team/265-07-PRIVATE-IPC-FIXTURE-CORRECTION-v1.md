# Private IPC fixture correction — source-only

Sourcegate58270 failed CI1 at5d898acc after509passing tests: an older factory
lifetime assertion still called buildFeasibilityCorpus after root removed its
import to avoid a new strict-source dependency seam. That oversight escaped
the focused diagnostic prefix and clean reviewv2. Preserve failed v2 evidence
and scoped VERIFICATION-v1 gaps_found; neither is complete-gate proof.

Root corrected the remaining test-only call at63f1a1a380aa753d88e2825abef176b7306b3980:
local StrategyInputV119Schema-parsed snapshot, one bottom Soldier at(2,11),
12x12declared board and unchanged mocked factory clock/retention assertions.
No production, corpus, runtime, guest, game rule, resource or historical evidence
changed. The conservative production/source inventory excludes tests; fixed
implementationd42a6cf1/sourcee5428d3c therefore remain the expected roots.

Actual root session8153 exit0: all37factory tests pass (15.61s; tests13.20s),
including the exact-expiry test. Command:

```sh
pnpm exec vitest run scripts/lib/v1-38-factory-supervised-runtime.test.ts --maxWorkers=1 --testTimeout=10000
```

No guest/container/provider/model/Match/capacity was launched by these injected
unit tests. No unbound buildFeasibilityCorpus reference remains in this file
(root rg returnednohits/exit1). This full-file correction result is not a whole
gate pass, empirical result or LEAG/freeze completion. Independent reviewv3 is
pending; a NEW ignored sourcegate-v3 helper is drafted with pending review/test
pins and has not been imported/typechecked/executed. V1/v2 helpers/markers remain
immutable. Existing prospective600000/standing private-route approvals apply;
no newhuman checkpoint, retry of consumed route or rule/bound change.
