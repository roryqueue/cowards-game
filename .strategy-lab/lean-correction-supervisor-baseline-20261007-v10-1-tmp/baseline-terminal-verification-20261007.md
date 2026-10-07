# Phase 265 v10-1 baseline terminal verification

Terminal-only verification completed for the single authorized v10-1 entry.

- Entry: `sha256:277e470f1e1c562d65362279b2c41f1d6f31594ea202152d342a040a0be5c91f`
- Entry HEAD: `d93811c2d7f3d8412aa11c62eed9b0fddeaebae2`
- Source root: `sha256:26c1befe2d2e214f8b1b50adc30292d4a9f4cede72e8fc3d6e8499a652161ab1`
- Allocation root: `sha256:ede8c18628b3fbfce6fc77655a3bdcac57d86295e30384befd6591c654591779`
- Terminal: `child_failed`, signal `SIGKILL`, no exit code; terminal stage `entry_terminal_only`.
- Supervisor reason: `resource_threshold`. Initiating cause remains `unknown`; the failure receipt is absent and terminalization was unobserved.
- Charges: current entry `0`; cumulative charged count `32`. The timebox-extension custody reports `31` charged, `93,600,000 ms` elapsed, and one-baseline/one-diagnostic maxima. Run admission closed as attempt 1 with `179,238 ms` imported and `179,324 ms` elapsed upper bound; finalization ledger interval closed at `1791389022004`.
- Cleanup was observed as `child_exit_observed`; no child process remains. No result artifact or ordinary retained reader eligibility was established.
- Terminal custody root: `sha256:b11d72b4c16a2497edebbf7e26dc9e6716d3f9886b6fa219fb95717e423de1be`
- Entry/terminal byte roots: `sha256:277e470f1e1c562d65362279b2c41f1d6f31594ea202152d342a040a0be5c91f` / `sha256:7e0b30530ee2609fe16322459d4bb7bc6bc772d9e7693ceeba3122ebaa68abac`
- Prepare start/close roots: `sha256:408104351aac6bc7d0e4ab20b64fc119518a77b8017af3a28e37174890b1e413` / `sha256:8f0c004b1dcdc7fa0b9a762bb6c361c39f8ce977be2729d4db95dabb8f1a46b5`
- Run start/close roots: `sha256:9e0be692fe6dd01adfd682a8b38f6b05a76e9c090fc34110cb764b4431cd7db9` / `sha256:a07b9434fea9282ff8414aad4960e414fef794adb06bb40ff6db4e0fc96471e8`
- Terminal reader start/close roots: `sha256:929dd779d06803f759553ad77082a764eb440a1f50cf918a2f6ceef7e41da22d` / `sha256:64098dbfb888321e8fd57170ed39b85d6649fd76baa5ebc896c7b81740b60069`

This terminal outcome ends the approved pair. No retry, new Match, completion/freeze claim, or Phase 265 credit is authorized or inferred. The command result is non-authorizing and not accepted (`authorizing=false`, `accepted=false`, `finalReaderClose=false`).
