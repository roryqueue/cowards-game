---
phase: 246
status: complete
ui_required: yes
date: 2026-06-15
---

# Phase 246 UI Spec

## Label Contract

- TypeScript/Python: "Provenance evidence only"
- Rust/Zig: "WASM/WASI artifact-backed evidence"
- JavaScript/container containment: "Runtime containment evidence only"
- TinyGo: hidden from public production surfaces; developer proof labels it "Hidden spike-only lane"

## Public Behavior

No public/default page should claim production sandbox certification, TypeScript/Python WASM isolation, TinyGo production support, package ecosystem support, or active ABI promotion.

## Verification

Public Learn and MatchSet evidence-copy tests continue to assert TinyGo absence and no broad sandbox claim. Public discovery fixtures use evidence-scoped readiness labels.
