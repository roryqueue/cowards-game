# Corrected diagnostic v10-1 — independent retained verification

- Retained reader: `accepted=true`, `status=retained_valid`, `route=diagnostic`; verifier process exited 0.
- Actual check artifact: `correction-supervisor-diagnostic-check-v10-1.json`, SHA-256 `99ca58c644a0dc3b5d20a2397d20f452bb561756b05f269926319a7a9b119a0d`.
- Reader result root (FINAL metadata): `sha256:b3ebd9e63b0b70f38035304c4b21240f6d1fb4ea85457cf9759d3841082edc92`; evidence root: `sha256:44f9a96a6652d3158f1265dff7832d08373449af9113106467f8e83d9279ae1d`. The retained artifact reports no separate `acceptedCheckRoot` (`null`).
- Source root: `sha256:26c1befe2d2e214f8b1b50adc30292d4a9f4cede72e8fc3d6e8499a652161ab1`; allocation root: `sha256:f7e061d5ec77563d4475da17ea60e215c140b156bb7e905316c0fd0af17226c4` (raw allocation SHA-256 `9d9a2c1b48db527a867ac11200ccf391c4bed9c2a6805fd4457ade45fbbc86dd`). HEAD remained `4b60d593bef51f456a9ef325389f6c957bf26682` before and after verification.
- This attempt charged 1; cumulative charge is 32. Cumulative elapsed is 80,718,010 ms; retained child upper-bound elapsed is 434,520 ms.
- Diagnostic-only disposition: `phaseComplete=false`, `freezeAdmitted=false`, `holdoutOpened=false`, and `formationMaterialized=false`. No full-phase or freeze credit.

## Receipt clarification

The FINAL receipt is `retry-closure-v8.json` (not `resultRoot` above). Bounded metadata inspection confirms `finalReaderClose=true`, `closureClass=accepted`, and matching source/allocation roots. Its actual `checkRoot` is `sha256:23564b5d90fdf8e4bde2c004b052be5bc24804742db5466c6c41985a394ad6b2`; closure root is `sha256:91213587cc5e89f94a1f479734ac9587197f9188670bc16027cc53f7b74ed096`. The reader started at 1791388319808 ms and closed at 1791388336828 ms, for 17,020 ms elapsed. Closure artifact SHA-256: `2eb7161b0854bd168f42df28b71fcd5ba7ada545bd41137a3497e2b900445049`. HEAD remained `4b60d593bef51f456a9ef325389f6c957bf26682`.
