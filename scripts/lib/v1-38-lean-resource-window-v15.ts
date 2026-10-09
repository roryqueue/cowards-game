/** Finite private metadata custody. No ordinary historical reader, provider,
 * allocation writer or entry is invoked by importing this module. */
import { freezeLabValue, labRoot, exactLabKeys, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { leanBytesRoot, leanCanonicalBytes, isLeanResourceWindowModeV15, LEAN_RESOURCE_WINDOW_V15_POLICY as policy, leanCorrectionRoutePaths, type LeanResourceWindowModeV15, type LeanCorrectionPredecessor } from "../../packages/strategy-lab/src/league/lean-experiment.js"

const phase = ".planning/phases/265-serious-current-rules-league-and-development-red-team/"
const fail = (): never => { throw new TypeError("LEAN_RESOURCE_WINDOW_V15_CUSTODY") }
const rooted = (v: unknown): v is LabRoot => typeof v === "string" && /^sha256:[a-f0-9]{64}$/u.test(v)
const natural = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) >= 0
type Route = "diagnostic" | "baseline"
export const leanResourceWindowDocumentsV15 = (route: Route, mode: LeanResourceWindowModeV15) => {
  if (!isLeanResourceWindowModeV15(mode) || route !== "diagnostic" && route !== "baseline") return fail()
  const path = (role: string, ext = "json") => `${phase}265-16-POST-V14-RESOURCE-WINDOW-${route}-${mode}-${role}-v1.${ext}`, paths = leanCorrectionRoutePaths(route, mode)
  // Diagnostic and conditional baseline share one pair continuation/setup/close;
  // actual authorizations, helpers and review gates stay distinct per route.
  const pairPath = (role: string) => `${phase}265-16-POST-V14-RESOURCE-WINDOW-diagnostic-${mode}-${role}-v1.json`
  return Object.freeze({ review: `${phase}265-16-POST-V14-RESOURCE-WINDOW-SOURCE-REVIEW-v1.md`, distinctionReview: path("POLICY-ATTESTATION"), dataReview: path("DATA-REVIEW", "md"), helperReview: path("HELPER-REVIEW", "md"), helper: `.strategy-lab/lean-resource-window-${route}-${mode}-helper.mts`, authorization: path("AUTHORIZATION"), setup: pairPath("SETUP"), continuation: pairPath("CONTINUATION"), pairClosure: pairPath("PAIR-CLOSURE"), carry: `${paths.temp}/terminal-carry-v15.json`, hold: `${paths.temp}/terminal-hold-complete-v15.json` })
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
    if (labRoot("lean-resource-window-policy-join-v15", pair.timeboxExtension) !== labRoot("lean-resource-window-policy-join-v15", policy) || !natural(pair.closedAtMs) || pair.closedAtMs < policy.actualResumeMs || !Array.isArray(pair.survivors) || new Set(pair.survivors.map((row: any) => row.identity)).size !== pair.survivors.length || pair.survivors.some((row: any) => !exactLabKeys(row, ["identity", "allocatedBytes"]) || typeof row.identity !== "string" || row.identity.startsWith("/") || row.identity.includes("..") || !natural(row.allocatedBytes)) || pair.survivors.reduce((sum: number, row: any) => sum + row.allocatedBytes, 0) > pair.allocatedDiskBytes) return fail()
    if (!exactLabKeys(pair, ["schemaVersion", "timeboxExtension", "attemptOrdinal", "authorizing", "sourceRoot", "priorClosureRoot", "diagnosticCarryRoot", "baselineCarryRoot", "lastRoute", "holdRoot", "holdBytesRoot", "historicalCharged", "cumulativeCharged", "cumulativeElapsedMs", "allocatedDiskBytes", "survivors", "closedAtMs", "endsEnvelope", "endReason", "root"]) || pair.schemaVersion !== "lean-resource-window-pair-closure-v15" || pair.attemptOrdinal !== ordinal || pair.authorizing !== false || pair.priorClosureRoot !== carryRoot || pair.historicalCharged !== charged || pair.endsEnvelope !== false || pair.endReason !== null || !["diagnostic", "baseline"].includes(pair.lastRoute) || !natural(pair.cumulativeCharged) || pair.cumulativeCharged < charged || pair.cumulativeCharged > charged + (pair.lastRoute === "baseline" ? 37 : 1) || !natural(pair.cumulativeElapsedMs) || pair.cumulativeElapsedMs < elapsed || pair.cumulativeElapsedMs < policy.priorElapsedMs + Number(pair.closedAtMs) - policy.startedAtMs || !natural(pair.allocatedDiskBytes) || pair.allocatedDiskBytes < debit || pair.allocatedDiskBytes > 12000000000 || !rooted(pair.sourceRoot)) return fail()
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
  if (!isLeanResourceWindowModeV15(mode) || !exactLabKeys(accepted, ["root", "bytesRoot", "allocationRoot", "sourceRoot", "head", "attemptOrdinal", "readerCloseMs", "cumulativeCharged"]) || ![accepted.root, accepted.bytesRoot, accepted.allocationRoot, accepted.sourceRoot].every(rooted) || closure.finalReaderClose !== true || closure.closureClass !== "accepted" || closure.acceptedCheckAbsent !== false || closure.resultAbsent !== false || closure.currentCharges !== 1 || closure.attemptOrdinal !== Number(mode.slice(-1)) || accepted.attemptOrdinal !== closure.attemptOrdinal || closure.checkRoot !== accepted.root || closure.checkBytesRoot !== accepted.bytesRoot || closure.allocationRoot !== accepted.allocationRoot || closure.sourceRoot !== accepted.sourceRoot || closure.head !== accepted.head || closure.readerCloseMs !== accepted.readerCloseMs || closure.cumulativeCharged !== accepted.cumulativeCharged || accepted.cumulativeCharged < 37 || !natural(accepted.readerCloseMs) || accepted.readerCloseMs < policy.actualResumeMs || !/^[a-f0-9]{40}$/u.test(accepted.head)) return fail()
  return Object.freeze({ closure, accepted: Object.freeze({ ...accepted }) })
}
