---
phase: 61
slug: runtime-isolation-readiness-guardrails
status: context
created: 2026-05-22
---

# Phase 61 Context — Runtime Isolation Readiness Guardrails

## Goal

Make runtime isolation promotion criteria explicit and machine-checked while keeping counted JS/TS execution defaults unchanged and leaving every runtime candidate evidence-only.

## Decisions

- Treat container subprocess as the selected future production candidate, not as a promoted counted default.
- Add readiness criteria to the sandbox evaluation artifact for live container probes, resource limits, filesystem denial, network denial, image provenance, deployment preflight, failure taxonomy, redacted diagnostics, and local ergonomics.
- Add required-container checks that fail loudly when container evidence is skipped instead of silently falling back to worker-thread, host subprocess, JS/TS, stale fixtures, or in-process execution.
- Add spec-owned adapter isolation promotion state and criteria while keeping all current counted eligibility and worker defaults unchanged.
- Add topology and boundary-monitor checks for runtime isolation readiness.

## Out of Scope

- Promoting worker-thread, host subprocess, container subprocess, Deno, WASI, gVisor, microVM, Python, or any other candidate to production counted Match execution.
- Changing `createWorkerRuntimeConfig()` defaults.
- Moving Strategy execution into web/API.
- Adding Node `vm` or `vm2`.
- Adding Go/runtime orchestration ownership.
- Enabling counted non-JS play.
