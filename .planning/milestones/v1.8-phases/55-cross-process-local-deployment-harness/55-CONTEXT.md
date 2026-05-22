---
phase: 55
slug: cross-process-local-deployment-harness
status: context
created: 2026-05-22
---

# Phase 55 Context — Cross-Process Local Deployment Harness

## Goal

Make the local v1.8 boundary topology repeatable and diagnosable without moving ownership between web, TypeScript service, worker/runtime adapter, or Go read-only service.

## Boundary Shape

- Web app remains the Next.js product surface.
- TypeScript service remains the canonical local service boundary.
- Worker/runtime adapter remains the only Strategy execution path.
- Go remains read-only and fixture-backed.
- Fixtures remain committed parity evidence, not mutable production data.

## Implementation Direction

Add a root topology check that can run in two modes:

- Static/local mode: verify scripts, fixture manifests, TypeScript service health, runtime adapter metadata, and privacy denylist.
- Live mode: when `--web-url` or `--go-url` are supplied, smoke the running web and Go processes with public/owner-safe requests.

The harness should print commands for starting the topology but should not silently spawn or hide required boundary processes.
