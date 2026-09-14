---
phase: 264
scope: plan-03-teacher
source_commit: 8c61ec0b1e73d1c0b86ad7d03a5ac3be77bd7537
status: findings
reviewer: main-orchestrator
---

# Teacher source review

This targeted review consolidates the independent readiness findings and the main orchestrator's inspection of the partial corrections. Three green fixture tests are not completion evidence. No guest, empirical Match, provider or emitted-source execution occurred.

## Findings requiring correction

1. **High — Search does not compare meaningful candidate responses.** `teacher.ts` varies initiative, responds with empty activation orders, breaks after the first effect, scores event counts and adds an arbitrary aggressive-hypothesis point. It neither enumerates valid competing candidate missions/Actions on the same canonical decision nor ranks their actual game-state consequences. Use the current canonical kernel and schema-valid responses; model the opponent separately from the candidate, hold the comparison's initial conditions fixed, and score canonical state/outcome consequences. No copied transition rules or fabricated empirical claim.

2. **High — No teacher-to-student training connection.** The receipt returns branch labels and hashes but no selected legal-observation/target records. `distillLegalStudent` accepts unrelated caller labels. Implement and test a real search → sanitized legal targets → conditional deterministic student → packet path, with bounded feature data rather than privileged state or opaque-ID memorization.

3. **Medium — Budget exhaustion can throw between branches and counters overclaim.** The next branch unconditionally calls machine creation after a prior branch exhausts `maxNodes`; `alternativesEvaluated` reports the configured branch count, not actual visited alternatives. Stop before every charged call and report actual work/depth, including low `maxNodes: 2` with `maxDepth: 6` and early terminal cases.

4. **High — Activation emission still has a second policy implementation.** `controller.ts` only owns brain logic; trusted and emitted activation logic remain separate handwritten copies. Put both actual entrypoints in the owned pure controller and mechanically bundle those same bytes. Require source-manifest/root-change tests for changes to either entrypoint; do not execute generated source in tests.

5. **High — Student/target validation can admit false or extra data.** Unknown record kinds enter the brain branch, invalid Action types collapse to STONE, `featurePolicy` is not fully runtime-validated/deeply frozen, and `controllerRoot` is trusted rather than rederived. Unknown student fields can survive into the serialized emitted student. Enforce exact bounded schemas, canonical legal inputs/targets, recomputed identities and deep immutability; reject teacher/evaluator/host extras instead of embedding them.

6. **Medium — Closure checks miss computed capability recovery and export shape.** The current teacher AST check denies identifier names but does not reject paths such as `Object["constructor"]["constructor"]`; a textual `export default` is not proof of both callable required methods. Add static computed-access/capability and real default-entrypoint checks, retaining ordinary safe array access needed by the owned controller. These are source prechecks, not sandbox certification.

## Verification required

Focused pure tests must assert actual canonical response/outcome differences, valid nonempty training linkage, conditional unseen-input behavior, global cap edge cases, actual depth/alternative counts, schema/root rejection and exact owned-source correspondence. Preserve canonical rules, initial formation, runtime/resource policies, all historical artifacts and the private-only boundary. Run the full teacher package typecheck without filtering diagnostics; no broad/historical suite, provider call or generated-source evaluation.
