---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 07
reviewed: 2026-10-02T10:41:31Z
depth: standard
reviewer: gsd-code-reviewer
source_commit: a98b5c2be9410b63e944143e1b0b693fc5c303bf
files_reviewed: 1
files_reviewed_list:
  - .strategy-lab/phase265-ipc-source-gate-v1.ts
helper_raw_sha256: d221416d49b5bd075764507ad829ba8680ac800d31490d478fff643b3dfebe74
predecessor_raw_sha256: c3017bf2f341e60aecb7b3a62c44680a403f63a0b735851b2af6376a3fe16b55
comparison_diff_raw_sha256: 5325ca809d90256f02cd2f9f78dd81882b9ccb29231c0de9068c454d04b1c321
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
empirical_authority: none
---

# IPC preservation source-gate helper — bounded static review v1

## Narrative Findings (AI reviewer)

No actionable BLOCKER or WARNING found in the new private gate helper.
This verdict covers static source/pin/namespace/command-order inspection only.
It does not claim any gate or test passed or authorize dispatch.

The full new helper and closed predecessor were read and compared. Their
algorithm is unchanged: the difference updates source identities, the two
runner pins, adds the two planner pins, and changes private marker/error-code
names to the IPC namespace. Comparison hash above is SHA-256 of the ordinary
`diff -u` output for predecessor then new helper, including its file headers.
No predecessor helper or marker was changed, imported or rerun.

## Checked controls

- Exact literal source commit is `a98b5c2be9410b63e944143e1b0b693fc5c303bf`;
  implementation is `sha256:ea34d793c2dd52015c7b12a66ae1ca7092793dafc08bb885392c116d333c4f4c`;
  source is `sha256:2bf949994153e6d28c69916c3e2c3b4a29b0b5c8ff7595032e27054ba21c632f`.
  These match the submitted values. Manifest evaluation was expressly not
  performed: the implementation/source values were checked as literals, not
  independently recomputed roots. The helper recomputes both at its guards.
- HEAD remained the exact source commit; read-only `git merge-base
  --is-ancestor` confirmed the guard's ancestry premise. The guard checks the
  eight source/test pins and CI raw hash, manifest root/source root and source
  ancestry before marker creation, before each command and after each command.
- `.github/workflows/ci.yml` raw hash matches its helper pin. Lines34–47
  contain exactly the intended eight commands: complete fixed one-worker
  league/factory/runtime suite list; separate tactical-corpus suite; strategy-lab
  build; affected-script strict types; three private boundary scans; and service
  import checker. Current commands contain no shell quoting/expansion that
  the helper's whitespace tokenization would misinterpret. They are executed
  directly, sequentially, without shell or retry, not replaced by filtered tests.
- Any spawn error, nonzero/null status or signal failure stops before a pass
  marker. Source/pin drift also throws before continuing. Completion is written
  only after all eight successful exits and their post-command guards.
- Fresh names are exclusively `phase265-ipc-source-gate-v1-start.json` and
  `phase265-ipc-source-gate-v1-complete.json` under the private directory.
  Both writes use `wx` and mode0600. Both paths were absent during inspection;
  an existing start refuses a second dispatch. No old async marker is targeted.
- The helper is an executable private gate entry, not an inert import API.
  Its deliberate top-level guard/dispatch behavior was inspected without
  importing it. Imported manifest/contracts code adds no runtime/Strategy
  invocation; source inventory evaluation remains confined to guard execution.

## Independently measured pin bytes

These raw hashes matched the helper before and after static inspection:

| Path | Raw SHA-256 |
| --- | --- |
| `.github/workflows/ci.yml` | `b02c04cbd7f4b6808153c3a6657df965b78712752bd801118be31b49cf9e186a` |
| `packages/strategy-lab/src/league/repository.ts` | `4ee61ed57a07d2d42e58a0e080c731deb8aae3ccdc8f72dcde1d53a54ea44599` |
| `packages/strategy-lab/src/league/repository.test.ts` | `a96cb2025f8e7e26b42d63a85a1796efec8fefe3eb667e8fe9784923a33d0b4b` |
| `scripts/run-v1-38-serious-league.ts` | `f25d846e5ebc786e49d368a62bd60d52740a608f792061a020d8cff5856d573a` |
| `scripts/run-v1-38-serious-league.test.ts` | `4713cdbb32203c89f6ef15ec72e6d0cd1cb83d4350af3d8801866d12c0291217` |
| `scripts/lib/v1-38-league-response-runtime.ts` | `ad75540ffe6853728b69acff058948537ddda564018a540abec1fc2290944c92` |
| `scripts/lib/v1-38-league-response-runtime.test.ts` | `57bb57d6bd9315ae305684bda5b0736584c76274220d4d97a63218047a39fcfa` |
| `scripts/lib/v1-38-planner-supervised-runtime.ts` | `021e8c5749bd0a2583208b7c8fcb9a76fb0c986557752a09845644ea88e5d5e6` |
| `scripts/lib/v1-38-planner-supervised-runtime.test.ts` | `2f913230d76202a6814f1e044fc778eee35fa1bf7ceb4d97c24d444c948f81ce` |

New helper and predecessor hashes also remained unchanged. The source-only
review did not interfere with the author's separately active suite62868.
Only this new report was created; no source edit, import, manifest evaluation,
test/type/build/helper/gate execution, Strategy/Docker/Match/capacity/verifier,
commit or push was performed.

## Separate source-review wording clarification

Root asked about the existing runner834 shortcut after the source review.
The pre-existing nonempirical COMPLETED/all-success fixture shortcut returns
before effect replay. Thus `completed === true` is unconditional at effects
**when replay is performed**, including empirical executions, not every
injected completed-success fixture. The new FAILURE branch cannot use that
shortcut. Its completed-negative regression deliberately has failure-shaped
final accounting plus the exact canonical pure prefix and reaches the new
guard. This qualifies the earlier completion wording; it introduces no new
repair defect or source change and does not alter the bounded clean verdict.

Root retains ownership of the unchanged full gate, source hold and authority.
No gate-pass, empirical/LEAG/freeze, rule/resource/budget/privacy, formation,
holdout, old-route reinterpretation or new-route authority follows.
