/** Finite private metadata custody. No ordinary historical reader, provider,
 * allocation writer or entry is invoked by importing this module. */
import { freezeLabValue, labRoot, exactLabKeys, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { leanBytesRoot, leanCanonicalBytes, isLeanResourceWindowModeV15, LEAN_RESOURCE_WINDOW_V15_POLICY as policy, leanCorrectionRoutePaths, type LeanResourceWindowModeV15, type LeanCorrectionPredecessor } from "../../packages/strategy-lab/src/league/lean-experiment.js"

const phase = ".planning/phases/265-serious-current-rules-league-and-development-red-team/"
const fail = (): never => { throw new TypeError("LEAN_RESOURCE_WINDOW_V15_CUSTODY") }
const rooted = (v: unknown): v is LabRoot => typeof v === "string" && /^sha256:[a-f0-9]{64}$/u.test(v)
const natural = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) >= 0
const exactKeys = (value: unknown, keys: readonly string[]): boolean => exactLabKeys(value, [...keys])
type Route = "diagnostic" | "baseline"
export const leanResourceWindowDocumentsV15 = (route: Route, mode: LeanResourceWindowModeV15) => {
  if (!isLeanResourceWindowModeV15(mode) || route !== "diagnostic" && route !== "baseline") return fail()
  const path = (role: string, ext = "json") => `${phase}265-16-POST-V14-RESOURCE-WINDOW-${route}-${mode}-${role}-v1.${ext}`, paths = leanCorrectionRoutePaths(route, mode)
  // Diagnostic and conditional baseline share one pair continuation/setup/close;
  // actual authorizations, helpers and review gates stay distinct per route.
  const pairPath = (role: string) => `${phase}265-16-POST-V14-RESOURCE-WINDOW-diagnostic-${mode}-${role}-v1.json`
  return Object.freeze({ review: `${phase}265-16-POST-V14-RESOURCE-WINDOW-SOURCE-REVIEW-v3.md`, distinctionReview: path("POLICY-ATTESTATION"), dataReview: path("DATA-REVIEW", "md"), helperReview: path("HELPER-REVIEW", "md"), helper: `.strategy-lab/lean-resource-window-${route}-${mode}-helper.mts`, authorization: path("AUTHORIZATION"), setup: pairPath("SETUP"), continuation: pairPath("CONTINUATION"), pairClosure: pairPath("PAIR-CLOSURE"), carry: `${paths.temp}/terminal-carry-v15.json`, hold: `${paths.temp}/terminal-hold-complete-v15.json` })
}

/** Full raw digests from the actual saved closed v14-1 metadata. This authority
 * is intentionally finite: no directory/glob scan, mutable caller pins or old
 * consumed ordinary retained audit is permitted here. */
export const LEAN_RESOURCE_WINDOW_V15_HISTORY_PINS = freezeLabValue([
  { path: ".strategy-lab/lean-correction-supervisor-baseline-20261008-v14-1-tmp/terminal-verification-v14.json", bytesRoot: "sha256:9116153f759a6eea0b82d70834e508857ceb7a0fe468f2f46e58809a216cd9f3", root: "sha256:065f3b437a4c0000e2977ba64cc1f1b7ef56fe400a2eeb96a2d35fcfc3ddd9fc" },
  { path: ".strategy-lab/lean-correction-supervisor-baseline-20261008-v14-1-tmp/terminal-carry-v14.json", bytesRoot: "sha256:05cc3bd71a26558c93a448b37e64c6b3a4f6328598628b1d577c9a11a17ea8b4", root: "sha256:ed75f3956a950c59bd600ac51c166e3417cf40aefd3d4f07ff7230920f5776bc" },
  { path: ".strategy-lab/lean-correction-supervisor-baseline-20261008-v14-1-tmp/terminal-hold-complete-v14.json", bytesRoot: "sha256:ab8c4d6f835c5d692714b724a8258e7151a0e2c84356fc1c28b8f7261fee070f", root: "sha256:d5e79bec0d8b45af8f127e4fa2edd6101f09e852557d99a0e220fda4efddd4a0" },
  { path: ".strategy-lab/lean-correction-supervisor-diagnostic-20261008-v14-1/five-pair-closure-v14.json", bytesRoot: "sha256:fb474251b97a434ef322377cb3f756ea0605cda76e4e502b23b9c9fb0cb3b3e1", root: "sha256:ad65294c86b603c4509884f772c44674de8f84e93cbaa0f9ca9c6c49851c6469" },
  { path: ".strategy-lab/lean-correction-supervisor-diagnostic-20261008-v14-1/correction-supervisor-diagnostic-check-v14-1.json", bytesRoot: "sha256:c27d20345295a3ae0b92df2634888e6d796daa1ecc401ebfa80434719f3e0245", root: "sha256:9c8a0663f003384697216538f97d87eae33c72e6764923ceba3fd6c07f7f1085" },
  { path: ".strategy-lab/lean-correction-supervisor-diagnostic-20261008-v14-1-tmp/terminal-carry-v14.json", bytesRoot: "sha256:0a97d63bebd7fc3dd083bf874879d12d684c26efd1f25f1d88eff7245cd7f5da", root: "sha256:96074cbe62f06bec0ca0bd11a4327135106e0344885f02349e91acbdd17b0044" },
  { path: ".strategy-lab/lean-correction-supervisor-diagnostic-20261008-v14-1-tmp/terminal-hold-complete-v14.json", bytesRoot: "sha256:4c8f8eec7275bf5f6c6d3b5505e55b06c965fc2b0bd29f22ff0c2710f030bd6f", root: "sha256:877773d1989e29e6b9e581bcdae7fa73f7ed3b28918aef8df087766857933ebd" },
  { path: ".strategy-lab/lean-five-pair-closure-v14-1.json", bytesRoot: "sha256:497977ef94f8c0344bd0d54b763d8e9660114d193ee2df88e3b7c71215d49fa4", root: "sha256:3d6573193c9be86a94477ed1506a5a39b6f8d7adf3bc4c5303bb200b81df400d" },
] as const)

/** Immutable metadata-only refusal pins. Allocation's complete key set includes
 * acceptedReaderCloseRoot:null; independently clarified inventory-v1 omission.
 * Raw bytes and all recorded identities remain unchanged. */
export const LEAN_RESOURCE_WINDOW_ARCHIVED_V15_2_PINS = freezeLabValue([
  {
    "role": "allocation",
    "path": ".planning/artifacts/v1.38-lean-correction-supervisor-diagnostic-allocation-v15-2.json",
    "bytes": 118158,
    "bytesRoot": "sha256:7f837b8879b69e10fb488b322078d79acc40b0a398ef32ca17cbd4f81d6bf5b4",
    "canonicalRoot": "sha256:b0f3a370ebcb78a2a4f040f6ddcebe6a00c71832cca25a91692c6ccbafad850c",
    "root": "sha256:f54f21be9fddc9677654a6bec95277b7f981f5b14db92b4713e1a03e858c576f",
    "schemaVersion": "lean-correction-supervisor-diagnostic-allocation-v8",
    "keys": [
      "acceptedCheckRoot",
      "acceptedReaderCloseRoot",
      "attemptOrdinal",
      "candidateRoots",
      "caps",
      "coldRoot",
      "continuationRoot",
      "dataReviewRoot",
      "diagnosisRoot",
      "planRoot",
      "predecessor",
      "priorClosureRoot",
      "privacy",
      "requestBytesRoot",
      "requestRoots",
      "reuseGrantRoot",
      "reviewRoot",
      "root",
      "route",
      "runtimeRoot",
      "sampleSlotRoots",
      "schemaVersion",
      "seed",
      "setupAccountingRoot",
      "slots",
      "sourceRoot",
      "startupPolicyRoot",
      "supervisorDecisionRoot",
      "timeboxExtension",
      "tupleRoot"
    ]
  },
  {
    "role": "request",
    "path": ".strategy-lab/lean-correction-supervisor-diagnostic-request-20261009-v15-2.json",
    "bytes": 3763,
    "bytesRoot": "sha256:82efa6228aa446e6432440a3f1c204032416b0889299780ffc3f6eadb3a2fb7b",
    "canonicalRoot": "sha256:0427f40f0995d0ce8f0a4932b20adf7b90e4957c54166b3a066abc755ff90b1b",
    "root": null,
    "schemaVersion": "lean-correction-supervisor-request-v15",
    "keys": [
      "acceptedCheckRoot",
      "acceptedReaderCloseRoot",
      "amendmentRoot",
      "attemptOrdinal",
      "authorizationPath",
      "authorizationRoot",
      "candidateRoots",
      "coldRoot",
      "continuationRoot",
      "dataReviewPath",
      "dataReviewRoot",
      "diagnosis",
      "helperBytesRoot",
      "helperPath",
      "helperReviewPath",
      "helperReviewRoot",
      "planRoot",
      "priorClosureRoot",
      "requestRoots",
      "reuseGrantRoot",
      "reviewPath",
      "reviewRoot",
      "route",
      "schemaVersion",
      "seed",
      "setupAccountingPath",
      "setupAccountingRoot",
      "sourceRoot",
      "startupPolicyRoot",
      "supervisorDecisionRoot",
      "timeboxExtension"
    ]
  },
  {
    "role": "run start / entry",
    "path": ".strategy-lab/lean-correction-supervisor-diagnostic-20261009-v15-2/entry.json",
    "bytes": 551,
    "bytesRoot": "sha256:d99b16516e100cad8a69d6405ae71c94560e2663bc441e5c876bfbf6f8522b2a",
    "canonicalRoot": "sha256:138e6ee8106b2f4de67bdcdf8badedda18d2673736b67924a63b26706e662cd6",
    "root": null,
    "schemaVersion": "lean-child-entry-v2",
    "keys": [
      "allocationRoot",
      "childPid",
      "handshakeRoot",
      "head",
      "monotonicStartNs",
      "parentPid",
      "requestBytesRoot",
      "schemaVersion",
      "sourceRoot",
      "wallStartMs"
    ]
  },
  {
    "role": "child terminal",
    "path": ".strategy-lab/lean-correction-supervisor-diagnostic-20261009-v15-2/child-terminal.json",
    "bytes": 659,
    "bytesRoot": "sha256:b5737e6c4f9db324a8aa2ddc2407ecadb4980096017e49f4879ae9928c29e097",
    "canonicalRoot": "sha256:c53b430a69eb319ac5e4c32b908b12bbba4b09ef469f29d374110b8d5b8c834c",
    "root": null,
    "schemaVersion": "lean-child-terminal-v2",
    "keys": [
      "allocationRoot",
      "childPid",
      "childRssObservedBytes",
      "elapsedUpperBoundMs",
      "entryBytesRoot",
      "exitCode",
      "freeBytes",
      "head",
      "monotonicObservedNs",
      "parentPid",
      "parentRssBytes",
      "physicalBytes",
      "schemaVersion",
      "signal",
      "sourceRoot",
      "status",
      "wallObservedMs"
    ]
  },
  {
    "role": "run result",
    "path": ".strategy-lab/lean-correction-supervisor-diagnostic-20261009-v15-2/result.json",
    "bytes": 1410,
    "bytesRoot": "sha256:179771df269781ceae427b358b3cbc15ed794d0fb46869b01b2a9ea5223272ae",
    "canonicalRoot": "sha256:60545b87823243bb38083ab28a537f38ef36401483c8b4121fd75f88fc447981",
    "root": "sha256:e4f9d803a1aafc6480f95e5003b28d6a5dbbb622034b81f23bfc81b8123305d0",
    "schemaVersion": "lean-correction-supervisor-result-v8",
    "keys": [
      "allocationRoot",
      "attemptOrdinal",
      "cumulativeCharged",
      "evidenceRoot",
      "formationMaterialized",
      "head",
      "holdoutOpened",
      "issued",
      "phaseComplete",
      "pipeline",
      "privacy",
      "requestBytesRoot",
      "reuseGrantRoot",
      "root",
      "route",
      "schemaVersion",
      "sourceRoot"
    ]
  },
  {
    "role": "ROOT closure",
    "path": ".strategy-lab/lean-correction-supervisor-diagnostic-20261009-v15-2/resource-window-closure-v15.json",
    "bytes": 2368,
    "bytesRoot": "sha256:73224145a39a64562ea8f1726e7bc2b2d18c7ebf6f44a6bb2a866532cda7a608",
    "canonicalRoot": "sha256:697ccdaf2389d5bd87444f2c696e110160e79f81351436135f0bf77ba9d8560c",
    "root": "sha256:c3e2e8e06eb5351d4ee859919ddd36917d3dc3d4721b839fbfead65a620a430a",
    "schemaVersion": "lean-resource-window-diagnostic-closure-v15",
    "keys": [
      "acceptedCheckAbsent",
      "allocationRoot",
      "attemptOrdinal",
      "authorizing",
      "checkBytesRoot",
      "checkRoot",
      "closedElapsedMs",
      "closureClass",
      "cumulativeCharged",
      "currentCharges",
      "entryBytesRoot",
      "finalReaderClose",
      "head",
      "ledgerBytesRoot",
      "privacy",
      "readerCloseMs",
      "readerInterval",
      "readerStartMs",
      "requestBytesRoot",
      "resultAbsent",
      "resultBytesRoot",
      "root",
      "schemaVersion",
      "sourceRoot",
      "terminalBytesRoot",
      "timeBytesRoot",
      "timeboxExtension"
    ]
  },
  {
    "role": "ordinary reader refusal",
    "path": ".strategy-lab/lean-correction-supervisor-diagnostic-20261009-v15-2-tmp/result-reader-refusal-v15.json",
    "bytes": 765,
    "bytesRoot": "sha256:65f9ff2debbe7040659a6c008a7fe4d62d52996caf238bc9bd204d717c018690",
    "canonicalRoot": "sha256:3379acbad1516fad9beff8526f524321f1ddeb53e6f7247ec9a1de43087b318f",
    "root": "sha256:27a31e47fe8ea59671082861264449f4d37e6a8d52823c54bb58725a375a4dc1",
    "schemaVersion": "lean-resource-window-result-reader-refusal-v15",
    "keys": [
      "accepted",
      "allocationRoot",
      "attemptOrdinal",
      "authorizing",
      "closedAtMs",
      "cumulativeCharged",
      "currentCharged",
      "head",
      "readerInterval",
      "requestBytesRoot",
      "resultRoot",
      "root",
      "route",
      "schemaVersion",
      "sourceRoot"
    ]
  },
  {
    "role": "terminal carry",
    "path": ".strategy-lab/lean-correction-supervisor-diagnostic-20261009-v15-2-tmp/terminal-carry-v15.json",
    "bytes": 120026,
    "bytesRoot": "sha256:26bfef708a983ab4e43c9a705067a9b268128f6ee8125a841573d106832f331a",
    "canonicalRoot": "sha256:f2b9980f2c5107f1c4f118e3dca4bcbc8d630edf7596cc647a755d9a287e2504",
    "root": "sha256:9cc30f4ff53f40078fd3867b88482ea2e3121d513396b10828156b0db6eb50e8",
    "schemaVersion": "lean-resource-window-terminal-carry-v15",
    "keys": [
      "accepted",
      "allocatedDiskBytes",
      "allocationRoot",
      "attemptOrdinal",
      "authorizing",
      "closedAtMs",
      "closureRoot",
      "cumulativeCharged",
      "cumulativeElapsedMs",
      "currentCharges",
      "entryBytesRoot",
      "entryHead",
      "outcome",
      "requestBytesRoot",
      "resultBytesRoot",
      "root",
      "route",
      "schemaVersion",
      "sourceRoot",
      "survivors",
      "terminalBytesRoot",
      "timeboxExtension",
      "verificationBytesRoot",
      "verificationRoot"
    ]
  },
  {
    "role": "completed hold record (non-authorizing)",
    "path": ".strategy-lab/lean-correction-supervisor-diagnostic-20261009-v15-2-tmp/terminal-hold-complete-v15.json",
    "bytes": 873,
    "bytesRoot": "sha256:1be92aae1a3f742d4c4490bb44af4660960fa41040501f0a1ce7727871171262",
    "canonicalRoot": "sha256:9cf21a106bc917f9e1d6bdae7a9f3c137f7a6fc164b0d2363c3f5e8da3d8d20d",
    "root": "sha256:3ec534b3954ad0746a5e4890eef5563de4264055ff71bc1a913d988cd528af79",
    "schemaVersion": "lean-resource-window-terminal-hold-complete-v15",
    "keys": [
      "carryBytesRoot",
      "carryRoot",
      "entryBytesRoot",
      "head",
      "mode",
      "requestBytesRoot",
      "root",
      "route",
      "schemaVersion",
      "sourceRoot",
      "verificationBytesRoot",
      "verificationRoot"
    ]
  },
  {
    "role": "separate operator-error hold-refusal",
    "path": ".strategy-lab/lean-correction-supervisor-diagnostic-20261009-v15-2-tmp/terminal-hold-refusal-v15.json",
    "bytes": 541,
    "bytesRoot": "sha256:2f373af99a6bc0dd264ca977df4591b352fb6ad3fb2319311746fd29561e872e",
    "canonicalRoot": "sha256:a16148f0181187a3318bafed002305be349889dcb54a84cc5269953bf0a0242e",
    "root": "sha256:7f443817046ab7ff51e7b4689daabb1e30709d21d42ead23be64932a0c16845e",
    "schemaVersion": "lean-resource-window-terminal-hold-refusal-v15",
    "keys": [
      "accepted",
      "authorizing",
      "entryBytesRoot",
      "head",
      "mode",
      "requestBytesRoot",
      "root",
      "route",
      "schemaVersion",
      "sourceRoot"
    ]
  },
  {
    "role": "pair closure",
    "path": ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V14-RESOURCE-WINDOW-diagnostic-v15-2-PAIR-CLOSURE-v1.json",
    "bytes": 119895,
    "bytesRoot": "sha256:41ace92f0e31721f4597ee0034e24aa37bcb95252d09bc302fe5ab4fb7a9fae2",
    "canonicalRoot": "sha256:d1d94ee7d150b7564ffa77c8e5d394c35536e47df15ac184a76c30dfc04e0573",
    "root": "sha256:b4f2ee25065725795ebec7bd976ca06f0f5996be5a0c8a7a3c0ffe808885e447",
    "schemaVersion": "lean-resource-window-pair-closure-v15",
    "keys": [
      "allocatedDiskBytes",
      "attemptOrdinal",
      "authorizing",
      "baselineCarryRoot",
      "closedAtMs",
      "cumulativeCharged",
      "cumulativeElapsedMs",
      "diagnosticCarryRoot",
      "endReason",
      "endsEnvelope",
      "historicalCharged",
      "holdBytesRoot",
      "holdRoot",
      "lastRoute",
      "priorClosureRoot",
      "root",
      "schemaVersion",
      "sourceRoot",
      "survivors",
      "timeboxExtension"
    ]
  }
] as const)

/** Cost custody only. A completed hold record is pinned provenance, not a
 * successful hold audit; no accepted reader or FINAL authority is returned. */
export const authenticateLeanResourceWindowArchivedPrefixV15_2 = (bytes: ReadonlyMap<string, Uint8Array>) => {
  if (bytes.size !== LEAN_RESOURCE_WINDOW_ARCHIVED_V15_2_PINS.length || [...bytes.keys()].some(path => !LEAN_RESOURCE_WINDOW_ARCHIVED_V15_2_PINS.some(pin => pin.path === path))) return fail()
  const records = LEAN_RESOURCE_WINDOW_ARCHIVED_V15_2_PINS.map(pin => {
    const raw = bytes.get(pin.path)
    if (!raw || raw.byteLength !== pin.bytes || leanBytesRoot(raw) !== pin.bytesRoot) return fail()
    let record: Record<string, any>
    try { record = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw)) } catch { return fail() }
    if (!exactKeys(record, pin.keys) || record.schemaVersion !== pin.schemaVersion || labRoot("lean-resource-window-archived-v15-2-pin-v1", record) !== pin.canonicalRoot) return fail()
    const { root, ...body } = record
    if (pin.root === null ? root !== undefined : root !== pin.root || labRoot(pin.schemaVersion, body) !== root) return fail()
    return record
  })
  const [allocation, request, entry, terminal, result, closure, refusal, carry, hold, holdRefusal, pair] = records as Record<string, any>[]
  const rawRoot = (index: number) => LEAN_RESOURCE_WINDOW_ARCHIVED_V15_2_PINS[index]!.bytesRoot
  const same = (a: unknown, b: unknown) => labRoot("lean-resource-window-archived-role-join-v1", a) === labRoot("lean-resource-window-archived-role-join-v1", b)
  const all = [allocation!, request!, result!, closure!, refusal!, carry!, pair!]
  if (all.some(v => v.attemptOrdinal !== 2) || [allocation!, request!, result!, refusal!, carry!, hold!, holdRefusal!].some(v => v.route !== "diagnostic") || records.some(v => v.sourceRoot !== allocation!.sourceRoot) || allocation!.requestBytesRoot !== rawRoot(1) || allocation!.acceptedCheckRoot !== null || allocation!.acceptedReaderCloseRoot !== null || request!.acceptedCheckRoot !== null || request!.acceptedReaderCloseRoot !== null || allocation!.predecessor.chargedMatches !== 36 || !same(allocation!.timeboxExtension, policy) || !same(request!.timeboxExtension, policy)) return fail()
  for (const key of ["sourceRoot", "planRoot", "reviewRoot", "coldRoot", "seed", "candidateRoots", "requestRoots", "continuationRoot", "priorClosureRoot", "setupAccountingRoot", "startupPolicyRoot", "supervisorDecisionRoot", "dataReviewRoot", "reuseGrantRoot"]) if (!same(allocation![key], request![key])) return fail()
  for (const v of [entry!, terminal!, result!, closure!, refusal!, carry!]) if (v.allocationRoot !== allocation!.root) return fail()
  for (const v of [entry!, result!, closure!, refusal!, carry!, hold!, holdRefusal!]) if (v.requestBytesRoot !== rawRoot(1)) return fail()
  for (const v of [terminal!, result!, closure!, refusal!, hold!, holdRefusal!]) if (v.head !== entry!.head) return fail()
  if (carry!.entryHead !== entry!.head || !/^[a-f0-9]{40}$/u.test(entry!.head) || terminal!.entryBytesRoot !== rawRoot(2) || terminal!.parentPid !== entry!.parentPid || terminal!.childPid !== entry!.childPid || !natural(terminal!.elapsedUpperBoundMs) || terminal!.wallObservedMs !== entry!.wallStartMs + terminal!.elapsedUpperBoundMs || result!.cumulativeCharged !== 37 || result!.issued !== false || result!.phaseComplete !== false || result!.formationMaterialized !== false || result!.holdoutOpened !== false) return fail()
  if (closure!.authorizing !== false || closure!.closureClass !== "refused" || closure!.finalReaderClose !== false || closure!.acceptedCheckAbsent !== true || closure!.resultAbsent !== false || closure!.checkRoot !== null || closure!.checkBytesRoot !== null || closure!.currentCharges !== 1 || closure!.cumulativeCharged !== 37 || closure!.entryBytesRoot !== rawRoot(2) || closure!.terminalBytesRoot !== rawRoot(3) || closure!.resultBytesRoot !== rawRoot(4) || !rooted(closure!.ledgerBytesRoot) || !rooted(closure!.timeBytesRoot) || !same(closure!.timeboxExtension, policy)) return fail()
  if (refusal!.accepted !== false || refusal!.authorizing !== false || refusal!.currentCharged !== 1 || refusal!.cumulativeCharged !== 37 || refusal!.resultRoot !== result!.root || refusal!.closedAtMs !== closure!.readerCloseMs || !same(refusal!.readerInterval, closure!.readerInterval)) return fail()
  if (carry!.authorizing !== false || carry!.accepted !== false || carry!.outcome !== "failed_result" || carry!.currentCharges !== 1 || carry!.cumulativeCharged !== 37 || carry!.closedAtMs !== closure!.readerCloseMs || carry!.closureRoot !== closure!.root || carry!.verificationRoot !== refusal!.root || carry!.verificationBytesRoot !== rawRoot(6) || carry!.entryBytesRoot !== rawRoot(2) || carry!.resultBytesRoot !== rawRoot(4) || carry!.terminalBytesRoot !== rawRoot(3) || !same(carry!.timeboxExtension, policy)) return fail()
  if (hold!.mode !== "v15-2" || hold!.carryRoot !== carry!.root || hold!.carryBytesRoot !== rawRoot(7) || hold!.verificationRoot !== refusal!.root || hold!.verificationBytesRoot !== rawRoot(6) || hold!.entryBytesRoot !== rawRoot(2) || holdRefusal!.mode !== "v15-2" || holdRefusal!.accepted !== false || holdRefusal!.authorizing !== false || holdRefusal!.entryBytesRoot !== rawRoot(2) || holdRefusal!.root === hold!.root) return fail()
  if (pair!.authorizing !== false || pair!.historicalCharged !== 36 || pair!.cumulativeCharged !== 37 || pair!.baselineCarryRoot !== null || pair!.diagnosticCarryRoot !== carry!.root || pair!.priorClosureRoot !== allocation!.priorClosureRoot || pair!.lastRoute !== "diagnostic" || pair!.holdRoot !== hold!.root || pair!.holdBytesRoot !== rawRoot(8) || pair!.closedAtMs !== closure!.readerCloseMs || pair!.endsEnvelope !== false || pair!.endReason !== null || !same(pair!.timeboxExtension, policy)) return fail()
  const survivorMap = (v: Record<string, any>) => {
    if (!natural(v.allocatedDiskBytes) || v.allocatedDiskBytes > 12000000000 || !Array.isArray(v.survivors)) return fail()
    const rows = new Map<string, number>()
    for (const row of v.survivors) {
      if (!exactKeys(row, ["identity", "allocatedBytes"]) || typeof row.identity !== "string" || row.identity.startsWith("/") || row.identity.includes("..") || row.identity.includes("\\") || rows.has(row.identity) || !natural(row.allocatedBytes)) return fail()
      rows.set(row.identity, row.allocatedBytes)
    }
    if ([...rows.values()].reduce((sum, value) => sum + value, 0) > v.allocatedDiskBytes) return fail()
    return rows
  }
  const inherited = allocation!.predecessor, carried = survivorMap(carry!), final = survivorMap(pair!), prior = survivorMap(inherited)
  if (inherited.historicalPeakDiskBytes !== "unknown" || inherited.historicalPeakRssBytes !== "unknown" || prior.size < 854 || final.size !== 907 || [...prior].some(([path, size]) => (carried.get(path) ?? -1) < size) || [...carried].some(([path, size]) => (final.get(path) ?? -1) < size) || carry!.allocatedDiskBytes < inherited.allocatedDiskBytes || pair!.allocatedDiskBytes < carry!.allocatedDiskBytes || pair!.cumulativeElapsedMs !== carry!.cumulativeElapsedMs || carry!.cumulativeElapsedMs !== closure!.closedElapsedMs || closure!.closedElapsedMs < inherited.elapsedUpperBoundMs || closure!.closedElapsedMs < policy.priorElapsedMs + closure!.readerCloseMs - policy.startedAtMs || !natural(closure!.readerStartMs) || closure!.readerStartMs < terminal!.wallObservedMs || closure!.readerCloseMs < closure!.readerStartMs) return fail()
  const provenance = { allocationRoot: allocation!.root, entryBytesRoot: rawRoot(2), requestBytesRoot: rawRoot(1), sourceRoot: allocation!.sourceRoot, head: entry!.head, refusalRoot: refusal!.root, rootClosureRoot: closure!.root, completedHoldMetadataRoot: hold!.root, operatorErrorHoldRefusalRoot: holdRefusal!.root, pairClosureRoot: pair!.root }
  const historyRoot = labRoot("v15-2-failed-prefix-cost-only-v1", { pins: LEAN_RESOURCE_WINDOW_ARCHIVED_V15_2_PINS, provenance })
  const predecessorBody = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: 37, elapsedUpperBoundMs: Number(pair!.cumulativeElapsedMs), allocatedDiskBytes: Number(pair!.allocatedDiskBytes), historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot, survivors: pair!.survivors as LeanCorrectionPredecessor["survivors"] }
  const body = { schemaVersion: "v15-2-failed-prefix-cost-only-v1" as const, authorizing: false as const, currentCharges: 1, cumulativeCharged: 37, carryRoot: pair!.root as LabRoot, holdRoot: hold!.root as LabRoot, provenance, identities: LEAN_RESOURCE_WINDOW_ARCHIVED_V15_2_PINS.map(pin => pin.path), predecessor: { ...predecessorBody, root: labRoot(predecessorBody.schemaVersion, predecessorBody) } }
  return freezeLabValue({ ...body, root: labRoot(body.schemaVersion, body) })
}

export const authenticateLeanResourceWindowPriorPairV15 = (bytes: ReadonlyMap<string, Uint8Array>, mode: LeanResourceWindowModeV15 = "v15-2") => {
  if (!isLeanResourceWindowModeV15(mode) || bytes.size !== LEAN_RESOURCE_WINDOW_V15_HISTORY_PINS.length + 3 * (Number(mode.slice(-1)) - 2)) return fail()
  const records = LEAN_RESOURCE_WINDOW_V15_HISTORY_PINS.map(pin => {
    const raw = bytes.get(pin.path)
    if (!raw || leanBytesRoot(raw) !== pin.bytesRoot) return fail()
    const v = JSON.parse(new TextDecoder().decode(raw)) as Record<string, any>
    if (v.root !== pin.root || leanBytesRoot(leanCanonicalBytes(v)) !== pin.bytesRoot) return fail()
    return v
  })
  const [verification, carry, hold, closure, check, diagnosticCarry, diagnosticHold, pair] = records
  if (verification!.cumulativeCharged !== 36 || carry!.currentCharges !== 0 || carry!.cumulativeCharged !== 36 || carry!.accepted !== false || carry!.authorizing !== false || carry!.outcome !== "entered_without_result" || verification!.resultAbsent !== true || verification!.checkAbsent !== true || verification!.accepted !== false || carry!.verificationRoot !== verification!.root || hold!.carryRoot !== carry!.root || hold!.verificationRoot !== verification!.root || closure!.finalReaderClose !== true || closure!.closureClass !== "accepted" || closure!.currentCharges !== 1 || closure!.cumulativeCharged !== 36 || closure!.checkRoot !== check!.root || check!.accepted !== true || check!.successful !== 1 || diagnosticCarry!.closureRoot !== closure!.root || diagnosticCarry!.verificationRoot !== check!.root || diagnosticHold!.carryRoot !== diagnosticCarry!.root || pair!.baselineCarryRoot !== carry!.root || pair!.diagnosticCarryRoot !== diagnosticCarry!.root || pair!.holdRoot !== hold!.root || pair!.cumulativeCharged !== 36 || pair!.endsEnvelope !== false || pair!.allocatedDiskBytes !== policy.physicalFloorBytes) return fail()
  const historyRoot = labRoot("lean-resource-window-finite-history-v15", LEAN_RESOURCE_WINDOW_V15_HISTORY_PINS)
  const body = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: 36, elapsedUpperBoundMs: Number(pair!.cumulativeElapsedMs), allocatedDiskBytes: Number(pair!.allocatedDiskBytes), historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot, survivors: pair!.survivors as LeanCorrectionPredecessor["survivors"] }
  if (!natural(body.elapsedUpperBoundMs) || body.elapsedUpperBoundMs < 161277097 || !Array.isArray(body.survivors) || body.survivors.length !== 854) return fail()
  let charged = 36, elapsed = body.elapsedUpperBoundMs, debit = body.allocatedDiskBytes, carryRoot = pair!.root as LabRoot, holdRoot = hold!.root as LabRoot, survivors = body.survivors
  const identities: string[] = LEAN_RESOURCE_WINDOW_V15_HISTORY_PINS.map(pin => pin.path)
  const metadata = (path: string) => {
    const raw = bytes.get(path)
    if (!raw) return fail()
    const v = JSON.parse(new TextDecoder().decode(raw)) as Record<string, any>, { root, ...b } = v
    if (typeof v.schemaVersion !== "string" || !rooted(root) || root !== labRoot(v.schemaVersion, b) || leanBytesRoot(raw) !== leanBytesRoot(leanCanonicalBytes(v))) return fail()
    identities.push(path); return v
  }
  for (let ordinal = 2; ordinal < Number(mode.slice(-1)); ordinal++) {
    const previous = `v15-${ordinal}` as LeanResourceWindowModeV15, pair = metadata(leanResourceWindowDocumentsV15("diagnostic", previous).pairClosure)
    if (labRoot("lean-resource-window-policy-join-v15", pair.timeboxExtension) !== labRoot("lean-resource-window-policy-join-v15", policy) || !natural(pair.closedAtMs) || pair.closedAtMs < policy.actualResumeMs || !Array.isArray(pair.survivors) || new Set(pair.survivors.map((row: any) => row.identity)).size !== pair.survivors.length || pair.survivors.some((row: any) => !exactKeys(row, ["identity", "allocatedBytes"]) || typeof row.identity !== "string" || row.identity.startsWith("/") || row.identity.includes("..") || !natural(row.allocatedBytes)) || pair.survivors.reduce((sum: number, row: any) => sum + row.allocatedBytes, 0) > pair.allocatedDiskBytes) return fail()
    if (!exactKeys(pair, ["schemaVersion", "timeboxExtension", "attemptOrdinal", "authorizing", "sourceRoot", "priorClosureRoot", "diagnosticCarryRoot", "baselineCarryRoot", "lastRoute", "holdRoot", "holdBytesRoot", "historicalCharged", "cumulativeCharged", "cumulativeElapsedMs", "allocatedDiskBytes", "survivors", "closedAtMs", "endsEnvelope", "endReason", "root"]) || pair.schemaVersion !== "lean-resource-window-pair-closure-v15" || pair.attemptOrdinal !== ordinal || pair.authorizing !== false || pair.priorClosureRoot !== carryRoot || pair.historicalCharged !== charged || pair.endsEnvelope !== false || pair.endReason !== null || !["diagnostic", "baseline"].includes(pair.lastRoute) || !natural(pair.cumulativeCharged) || pair.cumulativeCharged < charged || pair.cumulativeCharged > charged + (pair.lastRoute === "baseline" ? 37 : 1) || !natural(pair.cumulativeElapsedMs) || pair.cumulativeElapsedMs < elapsed || pair.cumulativeElapsedMs < policy.priorElapsedMs + Number(pair.closedAtMs) - policy.startedAtMs || !natural(pair.allocatedDiskBytes) || pair.allocatedDiskBytes < debit || pair.allocatedDiskBytes > 12000000000 || !rooted(pair.sourceRoot)) return fail()
    const docs = leanResourceWindowDocumentsV15(pair.lastRoute, previous), carry = metadata(docs.carry), hold = metadata(docs.hold)
    if (carry.root !== (pair.lastRoute === "baseline" ? pair.baselineCarryRoot : pair.diagnosticCarryRoot) || hold.root !== pair.holdRoot || hold.carryRoot !== carry.root || hold.carryBytesRoot !== leanBytesRoot(bytes.get(docs.carry)!) || pair.holdBytesRoot !== leanBytesRoot(bytes.get(docs.hold)!) || carry.sourceRoot !== pair.sourceRoot || carry.attemptOrdinal !== ordinal || carry.route !== pair.lastRoute || carry.cumulativeCharged !== pair.cumulativeCharged || carry.cumulativeElapsedMs !== pair.cumulativeElapsedMs || carry.authorizing !== false || carry.accepted !== false || hold.mode !== previous || hold.route !== pair.lastRoute || hold.sourceRoot !== pair.sourceRoot || hold.verificationRoot !== carry.verificationRoot || hold.verificationBytesRoot !== carry.verificationBytesRoot || !Array.isArray(pair.survivors) || survivors.some(row => !pair.survivors.some((next: any) => next.identity === row.identity && next.allocatedBytes >= row.allocatedBytes))) return fail()
    charged = pair.cumulativeCharged; elapsed = pair.cumulativeElapsedMs; debit = pair.allocatedDiskBytes; survivors = pair.survivors; carryRoot = pair.root; holdRoot = hold.root
  }
  const rootedBody = { ...body, chargedMatches: charged, elapsedUpperBoundMs: elapsed, allocatedDiskBytes: debit, survivors }
  return freezeLabValue({ root: labRoot("lean-resource-window-prefix-v15", { historyRoot, carryRoot, holdRoot, mode }), cumulativeCharged: charged, carryRoot, holdRoot, identities, predecessor: { ...rootedBody, root: labRoot(rootedBody.schemaVersion, rootedBody) } })
}

/** Pure join check used AFTER the existing full accepted-result audit. A
 * rooted JSON fixture alone is not accepted authority; callers must supply
 * the actual audit-returned allocation/check and actual FINAL closure. */
export const authenticateLeanResourceWindowAcceptedJoinV15 = (mode: LeanResourceWindowModeV15, closure: Record<string, any>, accepted: { root: LabRoot; bytesRoot: LabRoot; allocationRoot: LabRoot; sourceRoot: LabRoot; head: string; attemptOrdinal: number; readerCloseMs: number; cumulativeCharged: number }) => {
  if (!isLeanResourceWindowModeV15(mode) || !exactKeys(accepted, ["root", "bytesRoot", "allocationRoot", "sourceRoot", "head", "attemptOrdinal", "readerCloseMs", "cumulativeCharged"]) || ![accepted.root, accepted.bytesRoot, accepted.allocationRoot, accepted.sourceRoot].every(rooted) || closure.finalReaderClose !== true || closure.closureClass !== "accepted" || closure.acceptedCheckAbsent !== false || closure.resultAbsent !== false || closure.currentCharges !== 1 || closure.attemptOrdinal !== Number(mode.slice(-1)) || accepted.attemptOrdinal !== closure.attemptOrdinal || closure.checkRoot !== accepted.root || closure.checkBytesRoot !== accepted.bytesRoot || closure.allocationRoot !== accepted.allocationRoot || closure.sourceRoot !== accepted.sourceRoot || closure.head !== accepted.head || closure.readerCloseMs !== accepted.readerCloseMs || closure.cumulativeCharged !== accepted.cumulativeCharged || accepted.cumulativeCharged < 37 || !natural(accepted.readerCloseMs) || accepted.readerCloseMs < policy.actualResumeMs || !/^[a-f0-9]{40}$/u.test(accepted.head)) return fail()
  return Object.freeze({ closure, accepted: Object.freeze({ ...accepted }) })
}
