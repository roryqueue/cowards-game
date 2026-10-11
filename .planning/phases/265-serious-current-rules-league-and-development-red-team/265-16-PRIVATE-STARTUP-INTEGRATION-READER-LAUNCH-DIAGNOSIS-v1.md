# Retained reader launcher diagnosis v1

Scope: source-only launcher diagnosis, not retained verification or another game. The failed independent process28308 and its one failed tsx launch remain immutable history in RETAINED-VERIFICATION-v1.

Observed finite cause: the generic review process used `--sandbox read-only`; tsx's command-line launcher attempted a local IPC listen and received EPERM. No verification verdict was emitted. No inference about retained evidence validity follows.

A distinct non-consuming generic diagnostic99885 ran exactly one inert `env TSX_DISABLE_CACHE=1 NODE_DISABLE_COMPILE_CACHE=1 node --import tsx --input-type=module -e` readiness command in that same read-only sandbox. It imported only the loader, not the private runner or experiment data; CLOSEDexit0/loader_ready=true/commands_closed=true. This supports an IPC-free launcher for a prospectively approved new verification-only process, not a second invocation under the consumed verifier's authority. No dependency/install/source/rule/resource change is needed.

Pending human choice: one fresh verification-only process against the exact held b1eb00c3 HEAD and unchanged allocation/result/terminal/eight-file anchors, preferably the tested IPC-free loader. No new Match, charge, provider, Strategy, budget extension or interpretation of old failure as success. The approved21:06:02UTC hardstop still binds. No process has been started for that proposed check.
