# Phase 93: JS Runtime Adapter Conformance - Plan

**Status:** Ready for execution  
**Mode:** Standard  
**Research:** Captured in `093-CONTEXT.md`

## Goal

Prove existing JS runtime adapters conform to the v1.14 ABI or one explicit conformance bridge while Strategy execution remains worker-owned.

## Tasks

1. Add or name the ABI conformance bridge.
   - Wrap the existing adapter interface without a runtime architecture rewrite.
   - Validate envelopes and method outputs consistently.

2. Cover worker-thread, subprocess, and container-subprocess adapters.
   - Test method names, inputs, outputs, limits, adapter metadata, and failure classification.

3. Align limits.
   - Spec runtime metadata, runtime-js guards, worker config, subprocess IPC, container metadata, sandbox probes, and boundary monitors must agree.

4. Preserve classification.
   - Runtime violations complete Match/Chronicle behavior.
   - Infrastructure failures remain system failures and do not become player losses.

5. Add hostile/determinism probes and executable API absence checks.
   - Cover time, randomness, filesystem, network, environment, shell/dynamic code, stdio caps, memory/source/objective caps, malformed output, and timeout.
   - Ensure web/API/Go packages cannot import executable runtime APIs.

## Verification

- Run runtime-js adapter contract and hostile matrix tests.
- Run worker runner tests.
- Run boundary monitors for adapter drift and runtime ownership creep.

## Exit Criteria

- All JS adapters have v1.14 conformance evidence.
- Container remains evidence-only/non-counted.
- Runtime execution remains absent from web/API/Go.
