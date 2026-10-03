# Successor accounting and child-terminal focused validation

Fixed source `35f67b8d06cdad6098134c83d4e6dac8fe132353` includes successor accounting from `e1563827`, IPC cleanup from `e3f78ec4`, and the CR-01 repair. Actual primary author: `/root/fixture_265_15_full_verifier`; IPC/terminal coauthor: `/root/debug_lean_pilot_ipc_exit`. Independent review and narrow verification have separate reports.

Root reran both focused suites: **36/36 passed**, two files, 6.41 seconds. The lab, factory and serious-league boundary scanners each passed with zero violations across 1,364 files. Root shell syntax and whitespace checks passed. Author root TypeScript and project checks passed; root did not repeat those checks.

CR-01's regression injects an optional diagnostic publication failure and reaches the mandatory failed-terminal/interval-close callback exactly once. Mandatory terminal failures still propagate; no capacity guard is bypassed to retain the diagnostic. Tests are source-only evidence, not an actual Match or crash observation.

The approved successor carries 1,323,030 ms, zero retained charges and a conservative 114,688-byte disk debit. Historical peak disk/RSS remain unknown. The new v3 store/allocation and v4 request are disjoint from consumed routes. Neither preparation, empirical admission, pilot completion, baseline/freeze nor Phase completion is established by this gate. Same 15 GB/eight-hour/300-Match, runtime, gameplay and privacy bounds remain in force; no formation or holdout was opened.
