package main

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"errors"
	"reflect"
	"regexp"
	"sort"
	"strings"
	"unicode/utf8"
)

const runtimeSemanticReceiptV117SchemaVersion = "runtime-semantic-receipt-v1.17"
const runtimeSemanticReceiptV117Profile = "canonical-full-service-v1"
const runtimeSemanticReceiptV117ServiceVersion = "runtime-execution-service-v1.17"
const runtimeSemanticReceiptV117Domain = "cowards-game:runtime-semantic-receipt:v1.17"
const runtimeSemanticReceiptV117KeyID = "runtime-service-semantic-receipt:v1.17"
const runtimeSemanticTerminalStateV117Domain = "cowards-game:candidate-game-state-projection:v1"

var runtimeSemanticReceiptV117Hash = regexp.MustCompile(`^sha256:[0-9a-f]{64}$`)
var runtimeSemanticReceiptV117Signature = regexp.MustCompile(`^hmac-sha256:[0-9a-f]{64}$`)

type runtimeSemanticReceiptV117 struct {
	SchemaVersion                     string `json:"schemaVersion"`
	Profile                           string `json:"profile"`
	ServiceContractVersion            string `json:"serviceContractVersion"`
	RequestSHA256                     string `json:"requestSha256"`
	RequestID                         string `json:"requestId"`
	MatchID                           string `json:"matchId"`
	CompatibilityTupleID              string `json:"compatibilityTupleId"`
	AuthorityBundleHash               string `json:"authorityBundleHash"`
	AuthoritySourceManifestHash       string `json:"authoritySourceManifestHash"`
	RegistryGeneration                string `json:"registryGeneration"`
	LegacyAuthorityBundleHash         string `json:"legacyAuthorityBundleHash"`
	LegacyAuthoritySourceManifestHash string `json:"legacyAuthoritySourceManifestHash"`
	LegacyRegistryGeneration          string `json:"legacyRegistryGeneration"`
	BottomIdentityManifestRoot        string `json:"bottomIdentityManifestRoot"`
	BottomEvidenceGraphRoot           string `json:"bottomEvidenceGraphRoot"`
	BottomStrategyRevisionID          string `json:"bottomStrategyRevisionId"`
	BottomLaneIdentityHash            string `json:"bottomLaneIdentityHash"`
	BottomOriginalSourceSHA256        string `json:"bottomOriginalSourceSha256"`
	BottomNormalizedSourceSHA256      string `json:"bottomNormalizedSourceSha256"`
	BottomArtifactSHA256              string `json:"bottomArtifactSha256"`
	BottomExactPinsSHA256             string `json:"bottomExactPinsSha256"`
	TopIdentityManifestRoot           string `json:"topIdentityManifestRoot"`
	TopEvidenceGraphRoot              string `json:"topEvidenceGraphRoot"`
	TopStrategyRevisionID             string `json:"topStrategyRevisionId"`
	TopLaneIdentityHash               string `json:"topLaneIdentityHash"`
	TopOriginalSourceSHA256           string `json:"topOriginalSourceSha256"`
	TopNormalizedSourceSHA256         string `json:"topNormalizedSourceSha256"`
	TopArtifactSHA256                 string `json:"topArtifactSha256"`
	TopExactPinsSHA256                string `json:"topExactPinsSha256"`
	BudgetProfileSHA256               string `json:"budgetProfileSha256"`
	LedgerPrestateRoot                string `json:"ledgerPrestateRoot"`
	LedgerPoststateRoot               string `json:"ledgerPoststateRoot"`
	ChronicleCanonicalHash            string `json:"chronicleCanonicalHash"`
	FinalStateCanonicalHash           string `json:"finalStateCanonicalHash"`
	ReconstructedTerminalStateHash    string `json:"reconstructedTerminalStateHash"`
	OutcomeCanonicalHash              string `json:"outcomeCanonicalHash"`
	RuntimeViolationEventCount        int    `json:"runtimeViolationEventCount"`
	Algorithm                         string `json:"algorithm"`
	KeyID                             string `json:"keyId"`
	Signature                         string `json:"signature"`
}

func runtimeSemanticReceiptV117SchemaKnown(schema string) bool {
	return schema == runtimeSemanticReceiptV117SchemaVersion
}

func runtimeSemanticReceiptV117Message(receipt runtimeSemanticReceiptV117) ([]byte, error) {
	if !runtimeSemanticReceiptV117SchemaKnown(receipt.SchemaVersion) ||
		receipt.Profile != runtimeSemanticReceiptV117Profile ||
		receipt.ServiceContractVersion != runtimeSemanticReceiptV117ServiceVersion ||
		receipt.Algorithm != "hmac-sha256" || receipt.KeyID != runtimeSemanticReceiptV117KeyID ||
		!validRuntimeSemanticReceiptV117Identifier(receipt.RequestID) ||
		!validRuntimeSemanticReceiptV117Identifier(receipt.MatchID) ||
		!validCanonicalGeneration(receipt.RegistryGeneration) ||
		!validCanonicalGeneration(receipt.LegacyRegistryGeneration) ||
		!validRuntimeSemanticReceiptV117Identifier(receipt.BottomStrategyRevisionID) ||
		!validRuntimeSemanticReceiptV117Identifier(receipt.TopStrategyRevisionID) ||
		receipt.RuntimeViolationEventCount < 0 ||
		int64(receipt.RuntimeViolationEventCount) > 9_007_199_254_740_991 {
		return nil, errors.New("runtime semantic receipt v1.17 unavailable")
	}
	encoded, err := json.Marshal(receipt)
	if err != nil {
		return nil, errors.New("runtime semantic receipt v1.17 unavailable")
	}
	var claims map[string]any
	if err := json.Unmarshal(encoded, &claims); err != nil {
		return nil, errors.New("runtime semantic receipt v1.17 unavailable")
	}
	delete(claims, "signature")
	var loose bytes.Buffer
	encoder := json.NewEncoder(&loose)
	encoder.SetEscapeHTML(false)
	if err := encoder.Encode(claims); err != nil {
		return nil, errors.New("runtime semantic receipt v1.17 unavailable")
	}
	encodedClaims := bytes.TrimSuffix(loose.Bytes(), []byte("\n"))
	canonical := decodeCanonicalJSONV11(encodedClaims, canonicalJSONV11Options{
		Context: canonicalJSONV11CanonicalManifest,
	})
	if canonical.Error != nil {
		return nil, errors.New("runtime semantic receipt v1.17 unavailable")
	}
	claimBytes := canonical.CanonicalBytes
	domain := []byte(runtimeSemanticReceiptV117Domain)
	result := make([]byte, 8+len(domain)+8+len(claimBytes))
	binary.BigEndian.PutUint64(result[0:8], uint64(len(domain)))
	copy(result[8:], domain)
	offset := 8 + len(domain)
	binary.BigEndian.PutUint64(result[offset:offset+8], uint64(len(claimBytes)))
	copy(result[offset+8:], claimBytes)
	return result, nil
}

func validRuntimeSemanticReceiptV117(receipt runtimeSemanticReceiptV117, secret string) bool {
	if strings.TrimSpace(secret) == "" || !runtimeSemanticReceiptV117Signature.MatchString(receipt.Signature) {
		return false
	}
	for _, value := range []string{
		receipt.RequestSHA256, receipt.CompatibilityTupleID,
		receipt.AuthorityBundleHash, receipt.AuthoritySourceManifestHash,
		receipt.LegacyAuthorityBundleHash, receipt.LegacyAuthoritySourceManifestHash,
		receipt.BottomIdentityManifestRoot, receipt.BottomEvidenceGraphRoot,
		receipt.BottomLaneIdentityHash, receipt.BottomOriginalSourceSHA256,
		receipt.BottomNormalizedSourceSHA256, receipt.BottomArtifactSHA256,
		receipt.BottomExactPinsSHA256,
		receipt.TopIdentityManifestRoot, receipt.TopEvidenceGraphRoot,
		receipt.TopLaneIdentityHash, receipt.TopOriginalSourceSHA256,
		receipt.TopNormalizedSourceSHA256, receipt.TopArtifactSHA256,
		receipt.TopExactPinsSHA256,
		receipt.BudgetProfileSHA256, receipt.LedgerPrestateRoot,
		receipt.LedgerPoststateRoot, receipt.ChronicleCanonicalHash,
		receipt.FinalStateCanonicalHash, receipt.ReconstructedTerminalStateHash,
		receipt.OutcomeCanonicalHash,
	} {
		if !runtimeSemanticReceiptV117Hash.MatchString(value) {
			return false
		}
	}
	message, err := runtimeSemanticReceiptV117Message(receipt)
	if err != nil {
		return false
	}
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write(message)
	expected := mac.Sum(nil)
	actual, err := hex.DecodeString(receipt.Signature[len("hmac-sha256:"):])
	return err == nil && hmac.Equal(actual, expected)
}

func validRuntimeSemanticReceiptV117Identifier(value string) bool {
	return value != "" && utf8.ValidString(value) && !strings.ContainsRune(value, '\x00') && len([]byte(value)) <= 512
}

func runtimeSemanticReceiptRecordJSONV117(receipt runtimeSemanticReceiptV117) ([]byte, error) {
	if !runtimeSemanticReceiptV117SchemaKnown(receipt.SchemaVersion) {
		return nil, errors.New("runtime semantic receipt v1.17 record is unavailable")
	}
	return runtimeInvocationV117CanonicalValue(receipt)
}

func runtimeSemanticReceiptHashV117(receipt runtimeSemanticReceiptV117) (string, error) {
	encoded, err := runtimeSemanticReceiptRecordJSONV117(receipt)
	if err != nil {
		return "", err
	}
	return hashRuntimeServiceCanonicalValueV117(
		"cowards-game:runtime-semantic-receipt-record:v1.17",
		encoded,
	)
}

func validateVersionedRuntimeSemanticReceiptForCompletion(input completeMatchInput, integrity *claimedMatchIntegrityIdentity, secret string) error {
	if integrity == nil {
		return errors.New("runtime semantic receipt completion admission unavailable")
	}
	if integrity.CompatibilityTuple.RuntimeABI == strategyRuntimeABIVersionV117 {
		if input.RuntimeRequestV117 == nil || input.SemanticReceiptV117 == nil {
			return errors.New("runtime semantic receipt v1.17 completion admission unavailable")
		}
		return validateRuntimeSemanticReceiptV117ForCompletion(input, integrity, secret)
	}
	if input.RuntimeRequestV117 != nil || input.SemanticReceiptV117 != nil {
		return errors.New("runtime semantic receipt completion contract is mixed-version")
	}
	return validateRuntimeSemanticReceiptForCompletion(input, integrity, secret)
}

func validateRuntimeSemanticReceiptV117ForCompletion(input completeMatchInput, integrity *claimedMatchIntegrityIdentity, secret string) error {
	request := input.RuntimeRequestV117
	receipt := input.SemanticReceiptV117
	binding := integrity.RuntimeServiceV117
	if request == nil || receipt == nil || !validClaimedRuntimeServiceV117(binding, integrity) || strings.TrimSpace(secret) == "" {
		return errors.New("runtime semantic receipt v1.17 completion admission unavailable")
	}
	if failure := validateRuntimeServiceRequestV117(*request); failure != nil ||
		request.CompatibilityTupleID != integrity.CompatibilityTupleID ||
		request.Authority.BundleHash != binding.Authority.BundleHash ||
		request.Authority.SourceManifestHash != binding.Authority.SourceManifestHash ||
		request.Authority.RegistryGeneration != binding.Authority.RegistryGeneration ||
		request.LegacyAuthority.BundleHash != integrity.AuthorityBundleHash ||
		request.LegacyAuthority.SourceManifestHash != integrity.SourceManifestHash ||
		request.LegacyAuthority.RegistryGeneration != integrity.RegistryGeneration ||
		!runtimeServiceEntrantMatchesClaimedV117(request.Entrants.Bottom, binding.Bottom) ||
		!runtimeServiceEntrantMatchesClaimedV117(request.Entrants.Top, binding.Top) ||
		request.Accounting.BudgetProfileSHA256 != binding.BudgetProfileSHA256 ||
		request.Accounting.LedgerPrestateRoot != binding.LedgerPrestateRoot {
		return errors.New("runtime semantic receipt v1.17 request binding changed")
	}
	var nested runtimeServiceRequest
	if err := decodeStrictJSONUseNumber(request.Match, &nested); err != nil ||
		nested.RequestID != request.RequestID || nested.Match.MatchID != request.MatchID ||
		stringValue(input.FinalState, "matchId") != request.MatchID {
		return errors.New("runtime semantic receipt v1.17 Match binding changed")
	}
	requestBytes, requestErr := encodeRuntimeServiceRequestV117(*request)
	bottomExactPinsHash, bottomExactPinsErr := hashRuntimeServiceExactPinsV117(request.Entrants.Bottom.ExactPins)
	topExactPinsHash, topExactPinsErr := hashRuntimeServiceExactPinsV117(request.Entrants.Top.ExactPins)
	chronicleBytes, chronicleErr := runtimeInvocationV117CanonicalValue(input.Chronicle)
	finalStateBytes, finalStateErr := runtimeInvocationV117CanonicalValue(input.FinalState)
	outcomeBytes, outcomeErr := runtimeInvocationV117CanonicalValue(input.FinalState["outcome"])
	chronicleHash, chronicleHashErr := hashRuntimeServiceCanonicalValueV117(
		"cowards-game:runtime-semantic-chronicle-canonical-json:v1.17", chronicleBytes,
	)
	finalStateHash, finalStateHashErr := hashRuntimeServiceCanonicalValueV117(
		"cowards-game:runtime-semantic-final-state-canonical-json:v1.17", finalStateBytes,
	)
	outcomeHash, outcomeHashErr := hashRuntimeServiceCanonicalValueV117(
		"cowards-game:runtime-semantic-outcome-canonical-json:v1.17", outcomeBytes,
	)
	if requestErr != nil || bottomExactPinsErr != nil || topExactPinsErr != nil || chronicleErr != nil || finalStateErr != nil || outcomeErr != nil ||
		chronicleHashErr != nil || finalStateHashErr != nil || outcomeHashErr != nil ||
		!validRuntimeSemanticReceiptV117(*receipt, secret) ||
		receipt.RequestSHA256 != runtimeInvocationV117SHA256Value(requestBytes) ||
		receipt.RequestID != request.RequestID || receipt.MatchID != request.MatchID ||
		receipt.CompatibilityTupleID != request.CompatibilityTupleID ||
		receipt.AuthorityBundleHash != request.Authority.BundleHash ||
		receipt.AuthoritySourceManifestHash != request.Authority.SourceManifestHash ||
		receipt.RegistryGeneration != request.Authority.RegistryGeneration ||
		receipt.LegacyAuthorityBundleHash != request.LegacyAuthority.BundleHash ||
		receipt.LegacyAuthoritySourceManifestHash != request.LegacyAuthority.SourceManifestHash ||
		receipt.LegacyRegistryGeneration != request.LegacyAuthority.RegistryGeneration ||
		receipt.BottomIdentityManifestRoot != request.Entrants.Bottom.IdentityManifestRoot ||
		receipt.BottomEvidenceGraphRoot != request.Entrants.Bottom.EvidenceGraphRoot ||
		receipt.BottomStrategyRevisionID != request.Entrants.Bottom.StrategyRevisionID ||
		receipt.BottomLaneIdentityHash != request.Entrants.Bottom.LaneIdentityHash ||
		receipt.BottomOriginalSourceSHA256 != request.Entrants.Bottom.SourceIdentity.OriginalSourceSHA256 ||
		receipt.BottomNormalizedSourceSHA256 != request.Entrants.Bottom.SourceIdentity.NormalizedSourceSHA256 ||
		receipt.BottomArtifactSHA256 != request.Entrants.Bottom.SourceIdentity.ArtifactSHA256 ||
		receipt.BottomExactPinsSHA256 != bottomExactPinsHash ||
		receipt.TopIdentityManifestRoot != request.Entrants.Top.IdentityManifestRoot ||
		receipt.TopEvidenceGraphRoot != request.Entrants.Top.EvidenceGraphRoot ||
		receipt.TopStrategyRevisionID != request.Entrants.Top.StrategyRevisionID ||
		receipt.TopLaneIdentityHash != request.Entrants.Top.LaneIdentityHash ||
		receipt.TopOriginalSourceSHA256 != request.Entrants.Top.SourceIdentity.OriginalSourceSHA256 ||
		receipt.TopNormalizedSourceSHA256 != request.Entrants.Top.SourceIdentity.NormalizedSourceSHA256 ||
		receipt.TopArtifactSHA256 != request.Entrants.Top.SourceIdentity.ArtifactSHA256 ||
		receipt.TopExactPinsSHA256 != topExactPinsHash ||
		receipt.BudgetProfileSHA256 != request.Accounting.BudgetProfileSHA256 ||
		receipt.LedgerPrestateRoot != request.Accounting.LedgerPrestateRoot ||
		!isPrefixedLowerSHA256(receipt.LedgerPoststateRoot) ||
		receipt.ChronicleCanonicalHash != chronicleHash ||
		receipt.FinalStateCanonicalHash != finalStateHash ||
		receipt.OutcomeCanonicalHash != outcomeHash ||
		receipt.RuntimeViolationEventCount != runtimeSemanticViolationCount(input.Chronicle) {
		return errors.New("runtime semantic receipt v1.17 completion evidence changed")
	}
	if validation := validateGoCanonicalGameState(input.FinalState); !validation.OK {
		return errors.New("runtime semantic receipt v1.17 completion state is invalid")
	}
	if err := validateGoChronicleShape(input.Chronicle); err != nil {
		return errors.New("runtime semantic receipt v1.17 completion Chronicle is invalid")
	}
	reconstructedTerminalStateHash, err := runtimeSemanticReconstructedTerminalStateHashV117(input.Chronicle, input.FinalState)
	if err != nil || receipt.ReconstructedTerminalStateHash != reconstructedTerminalStateHash {
		return errors.New("runtime semantic receipt v1.17 completion terminal reconstruction changed")
	}
	return nil
}

type runtimeSemanticPositionV117 struct {
	X int64 `json:"x"`
	Y int64 `json:"y"`
}

type runtimeSemanticBoundsV117 struct {
	MinX int64 `json:"minX"`
	MaxX int64 `json:"maxX"`
	MinY int64 `json:"minY"`
	MaxY int64 `json:"maxY"`
}

type runtimeSemanticSoldierV117 struct {
	ID                          string                       `json:"id"`
	OwnerPlayerID               string                       `json:"ownerPlayerId"`
	Status                      string                       `json:"status"`
	Position                    *runtimeSemanticPositionV117 `json:"position"`
	Facing                      *string                      `json:"facing"`
	LastSuccessfulMoveDirection *string                      `json:"lastSuccessfulMoveDirection"`
}

type runtimeSemanticBoardV117 struct {
	Bounds        runtimeSemanticBoundsV117     `json:"bounds"`
	Soldiers      []runtimeSemanticSoldierV117  `json:"soldiers"`
	TerrainStones []runtimeSemanticPositionV117 `json:"terrainStones"`
}

type runtimeSemanticOutcomeV117 struct {
	Type           string  `json:"type"`
	WinnerPlayerID *string `json:"winnerPlayerId,omitempty"`
	Reason         *string `json:"reason,omitempty"`
}

type runtimeSemanticReplayStateV117 struct {
	Board   runtimeSemanticBoardV117
	Outcome *runtimeSemanticOutcomeV117
}

type runtimeSemanticVersionsV117 struct {
	Spec             string `json:"spec"`
	Engine           string `json:"engine"`
	RuntimeJS        string `json:"runtimeJs"`
	Chronicle        string `json:"chronicle"`
	StrategyRevision string `json:"strategyRevision"`
	ArenaVariant     string `json:"arenaVariant"`
}

type runtimeSemanticArenaV117 struct {
	ID            string                        `json:"id"`
	Name          string                        `json:"name"`
	InitialBounds runtimeSemanticBoundsV117     `json:"initialBounds"`
	TerrainStones []runtimeSemanticPositionV117 `json:"terrainStones"`
}

type runtimeSemanticPlayerV117 struct {
	ID                 string `json:"id"`
	Side               string `json:"side"`
	StrategyRevisionID string `json:"strategyRevisionId"`
}

type runtimeSemanticStateProjectionV117 struct {
	MatchID            string                        `json:"matchId"`
	Seed               string                        `json:"seed"`
	Versions           runtimeSemanticVersionsV117   `json:"versions"`
	ArenaVariant       runtimeSemanticArenaV117      `json:"arenaVariant"`
	Players            []runtimeSemanticPlayerV117   `json:"players"`
	Phase              string                        `json:"phase"`
	PhaseNumber        int64                         `json:"phaseNumber"`
	RoundNumber        int64                         `json:"roundNumber"`
	ActivationCount    int64                         `json:"activationCount"`
	InitiativePlayerID string                        `json:"initiativePlayerId"`
	Bounds             runtimeSemanticBoundsV117     `json:"bounds"`
	Soldiers           []runtimeSemanticSoldierV117  `json:"soldiers"`
	TerrainStones      []runtimeSemanticPositionV117 `json:"terrainStones"`
	Outcome            runtimeSemanticOutcomeV117    `json:"outcome"`
}

func runtimeSemanticReconstructedTerminalStateHashV117(chronicle map[string]any, finalState map[string]any) (string, error) {
	reconstructed, start, err := reconstructRuntimeSemanticReplayV117(chronicle)
	if err != nil {
		return "", err
	}
	projection, finalReplay, err := composeRuntimeSemanticStateProjectionV117(finalState, reconstructed)
	if err != nil || !reflect.DeepEqual(reconstructed, finalReplay) {
		return "", errors.New("runtime semantic terminal state differs from final state")
	}
	if err := runtimeSemanticReproducibilityMatchesV117(chronicle, projection, start); err != nil {
		return "", err
	}
	encoded, err := runtimeSemanticJSONStringifyV117(projection)
	if err != nil {
		return "", err
	}
	digest := sha256.Sum256(append([]byte(runtimeSemanticTerminalStateV117Domain+"\x00"), encoded...))
	return "sha256:" + hex.EncodeToString(digest[:]), nil
}

func reconstructRuntimeSemanticReplayV117(chronicle map[string]any) (runtimeSemanticReplayStateV117, runtimeSemanticReplayStateV117, error) {
	events := sliceValue(chronicle, "events")
	snapshots := sliceValue(chronicle, "snapshots")
	if len(events) == 0 || len(snapshots) < 2 {
		return runtimeSemanticReplayStateV117{}, runtimeSemanticReplayStateV117{}, errors.New("runtime semantic Chronicle is incomplete")
	}
	terminalEvents := 0
	for index, raw := range events {
		event, ok := raw.(map[string]any)
		if !ok || runtimeServiceIntValue(event, "sequence") != index {
			return runtimeSemanticReplayStateV117{}, runtimeSemanticReplayStateV117{}, errors.New("runtime semantic Chronicle event sequence is invalid")
		}
		if stringValue(event, "type") == "MATCH_ENDED" {
			terminalEvents++
		}
	}
	lastEvent, _ := events[len(events)-1].(map[string]any)
	if terminalEvents != 1 || stringValue(lastEvent, "type") != "MATCH_ENDED" {
		return runtimeSemanticReplayStateV117{}, runtimeSemanticReplayStateV117{}, errors.New("runtime semantic Chronicle terminal event is invalid")
	}

	states := make([]runtimeSemanticReplayStateV117, len(snapshots))
	sequences := make([]int, len(snapshots))
	terminalSnapshots := 0
	for index, raw := range snapshots {
		snapshot, ok := raw.(map[string]any)
		if !ok {
			return runtimeSemanticReplayStateV117{}, runtimeSemanticReplayStateV117{}, errors.New("runtime semantic Chronicle snapshot is invalid")
		}
		sequence64, sequenceOK := semanticSafeInteger(snapshot["sequence"])
		if !sequenceOK || sequence64 < 0 || sequence64 >= int64(len(events)) || (index > 0 && sequence64 < int64(sequences[index-1])) {
			return runtimeSemanticReplayStateV117{}, runtimeSemanticReplayStateV117{}, errors.New("runtime semantic Chronicle snapshot sequence is invalid")
		}
		board, boardErr := runtimeSemanticBoardV117FromAny(snapshot["board"])
		if boardErr != nil {
			return runtimeSemanticReplayStateV117{}, runtimeSemanticReplayStateV117{}, boardErr
		}
		state := runtimeSemanticReplayStateV117{Board: board}
		if rawOutcome, exists := snapshot["outcome"]; exists {
			outcome, outcomeErr := runtimeSemanticOutcomeV117FromAny(rawOutcome)
			if outcomeErr != nil {
				return runtimeSemanticReplayStateV117{}, runtimeSemanticReplayStateV117{}, outcomeErr
			}
			state.Outcome = &outcome
		}
		states[index] = state
		sequences[index] = int(sequence64)
		if stringValue(snapshot, "kind") == "TERMINAL" {
			terminalSnapshots++
		}
	}
	firstSnapshot := snapshots[0].(map[string]any)
	lastSnapshot := snapshots[len(snapshots)-1].(map[string]any)
	if stringValue(firstSnapshot, "kind") != "MATCH_START" || terminalSnapshots != 1 || stringValue(lastSnapshot, "kind") != "TERMINAL" || sequences[len(sequences)-1] != len(events)-1 || states[len(states)-1].Outcome == nil {
		return runtimeSemanticReplayStateV117{}, runtimeSemanticReplayStateV117{}, errors.New("runtime semantic Chronicle terminal snapshot is invalid")
	}

	for index := 0; index < len(states)-1; index++ {
		current := cloneRuntimeSemanticReplayStateV117(states[index])
		for eventIndex := sequences[index] + 1; eventIndex <= sequences[index+1]; eventIndex++ {
			event := events[eventIndex].(map[string]any)
			if err := applyRuntimeSemanticReplayEventV117(&current, event); err != nil {
				return runtimeSemanticReplayStateV117{}, runtimeSemanticReplayStateV117{}, err
			}
		}
		if !reflect.DeepEqual(current, states[index+1]) {
			return runtimeSemanticReplayStateV117{}, runtimeSemanticReplayStateV117{}, errors.New("runtime semantic Chronicle boundary reconstruction differs")
		}
	}
	return states[len(states)-1], states[0], nil
}

func applyRuntimeSemanticReplayEventV117(state *runtimeSemanticReplayStateV117, event map[string]any) error {
	payload, _ := event["payload"].(map[string]any)
	eventType := stringValue(event, "type")
	switch eventType {
	case "MATCH_STARTED", "ROUND_STARTED", "STRATEGY_EVALUATED", "ACTIVATION_STARTED", "ACTIVATION_SKIPPED", "ACTIVATION_ENDED", "CYCLE_STARTED", "CYCLE_ENDED", "AWARENESS_GRID_OBSERVED", "ACTION_EMITTED", "MOVE_BLOCKED", "PUSH_ATTEMPTED", "PUSH_BLOCKED", "RUNTIME_VIOLATION":
		return nil
	case "MOVE_ADVANCED":
		soldier, ok := runtimeSemanticSoldierForUpdateV117(state, stringValue(payload, "soldierId"))
		direction := stringValue(payload, "direction")
		if !ok || soldier.Position == nil || !runtimeSemanticDirectionV117(direction) {
			return errors.New("runtime semantic MOVE_ADVANCED is invalid")
		}
		position := runtimeSemanticMovePositionV117(*soldier.Position, direction)
		soldier.Position = &position
		soldier.Facing = runtimeSemanticStringPointerV117(direction)
		soldier.LastSuccessfulMoveDirection = runtimeSemanticStringPointerV117(direction)
		return nil
	case "TURN_RESOLVED":
		soldier, ok := runtimeSemanticSoldierForUpdateV117(state, stringValue(payload, "soldierId"))
		direction := stringValue(payload, "direction")
		if !ok || !runtimeSemanticDirectionV117(direction) {
			return errors.New("runtime semantic TURN_RESOLVED is invalid")
		}
		soldier.Facing = runtimeSemanticStringPointerV117(direction)
		return nil
	case "PUSH_RESOLVED":
		mover, moverOK := runtimeSemanticSoldierForUpdateV117(state, stringValue(payload, "soldierId"))
		target, targetOK := runtimeSemanticSoldierForUpdateV117(state, stringValue(payload, "targetSoldierId"))
		if !moverOK || !targetOK || mover.Position == nil || target.Position == nil {
			return errors.New("runtime semantic PUSH_RESOLVED is invalid")
		}
		direction, ok := runtimeSemanticDirectionBetweenV117(*mover.Position, *target.Position)
		if !ok {
			return errors.New("runtime semantic PUSH_RESOLVED adjacency is invalid")
		}
		pushedOffBoard, _ := payload["pushedOffBoard"].(bool)
		if pushedOffBoard {
			target.Status = "FALLEN"
			target.Position = nil
		} else {
			position := runtimeSemanticMovePositionV117(*target.Position, direction)
			target.Position = &position
		}
		return nil
	case "BACKSTAB_RESOLVED":
		pairs, exists := payload["pairs"]
		if !exists {
			return nil
		}
		rows, ok := pairs.([]any)
		if !ok {
			return nil
		}
		victims := make([]*runtimeSemanticSoldierV117, 0, len(rows))
		for _, raw := range rows {
			pair, pairOK := raw.(map[string]any)
			if !pairOK {
				return errors.New("runtime semantic BACKSTAB_RESOLVED is invalid")
			}
			if _, attackerOK := runtimeSemanticSoldierForUpdateV117(state, stringValue(pair, "attackerId")); !attackerOK {
				return errors.New("runtime semantic BACKSTAB_RESOLVED attacker is invalid")
			}
			victim, victimOK := runtimeSemanticSoldierForUpdateV117(state, stringValue(pair, "victimId"))
			if !victimOK {
				return errors.New("runtime semantic BACKSTAB_RESOLVED victim is invalid")
			}
			victims = append(victims, victim)
		}
		for _, victim := range victims {
			victim.Status = "STONE"
		}
		return nil
	case "SOLDIER_STONED":
		soldier, ok := runtimeSemanticSoldierForUpdateV117(state, stringValue(payload, "soldierId"))
		if !ok {
			return errors.New("runtime semantic SOLDIER_STONED is invalid")
		}
		soldier.Status = "STONE"
		return nil
	case "SOLDIER_FELL":
		soldier, ok := runtimeSemanticSoldierForUpdateV117(state, stringValue(payload, "soldierId"))
		if !ok {
			return errors.New("runtime semantic SOLDIER_FELL is invalid")
		}
		soldier.Status = "FALLEN"
		soldier.Position = nil
		return nil
	case "CONTRACTION_RESOLVED":
		bounds, err := runtimeSemanticBoundsV117FromAny(payload["bounds"])
		if err != nil {
			return errors.New("runtime semantic CONTRACTION_RESOLVED is invalid")
		}
		state.Board.Bounds = bounds
		for index := range state.Board.Soldiers {
			soldier := &state.Board.Soldiers[index]
			if soldier.Status != "FALLEN" && soldier.Position != nil && !runtimeSemanticWithinBoundsV117(*soldier.Position, bounds) {
				soldier.Status = "FALLEN"
				soldier.Position = nil
			}
		}
		terrain := state.Board.TerrainStones[:0]
		for _, stone := range state.Board.TerrainStones {
			if runtimeSemanticWithinBoundsV117(stone, bounds) {
				terrain = append(terrain, stone)
			}
		}
		state.Board.TerrainStones = terrain
		return nil
	case "MATCH_ENDED":
		outcome, err := runtimeSemanticOutcomeV117FromAny(payload)
		if err != nil {
			return errors.New("runtime semantic MATCH_ENDED is invalid")
		}
		state.Outcome = &outcome
		return nil
	default:
		return errors.New("runtime semantic Chronicle event type is unsupported")
	}
}

func composeRuntimeSemanticStateProjectionV117(finalState map[string]any, reconstructed runtimeSemanticReplayStateV117) (runtimeSemanticStateProjectionV117, runtimeSemanticReplayStateV117, error) {
	versions, ok := finalState["versions"].(map[string]any)
	if !ok {
		return runtimeSemanticStateProjectionV117{}, runtimeSemanticReplayStateV117{}, errors.New("runtime semantic final versions are invalid")
	}
	parsedVersions := runtimeSemanticVersionsV117{
		Spec: stringValue(versions, "spec"), Engine: stringValue(versions, "engine"), RuntimeJS: stringValue(versions, "runtimeJs"),
		Chronicle: stringValue(versions, "chronicle"), StrategyRevision: stringValue(versions, "strategyRevision"), ArenaVariant: stringValue(versions, "arenaVariant"),
	}
	arena, ok := finalState["arenaVariant"].(map[string]any)
	if !ok {
		return runtimeSemanticStateProjectionV117{}, runtimeSemanticReplayStateV117{}, errors.New("runtime semantic final arena is invalid")
	}
	initialBounds, err := runtimeSemanticBoundsV117FromAny(arena["initialBounds"])
	if err != nil {
		return runtimeSemanticStateProjectionV117{}, runtimeSemanticReplayStateV117{}, err
	}
	arenaTerrain, err := runtimeSemanticPositionsV117FromAny(arena["terrainStones"])
	if err != nil {
		return runtimeSemanticStateProjectionV117{}, runtimeSemanticReplayStateV117{}, err
	}
	runtimeSemanticSortPositionsV117(arenaTerrain)
	playersRaw, ok := finalState["players"].([]any)
	if !ok {
		return runtimeSemanticStateProjectionV117{}, runtimeSemanticReplayStateV117{}, errors.New("runtime semantic final players are invalid")
	}
	players := make([]runtimeSemanticPlayerV117, 0, len(playersRaw))
	for _, raw := range playersRaw {
		player, playerOK := raw.(map[string]any)
		if !playerOK {
			return runtimeSemanticStateProjectionV117{}, runtimeSemanticReplayStateV117{}, errors.New("runtime semantic final player is invalid")
		}
		players = append(players, runtimeSemanticPlayerV117{ID: stringValue(player, "id"), Side: stringValue(player, "side"), StrategyRevisionID: stringValue(player, "strategyRevisionId")})
	}
	sort.Slice(players, func(left, right int) bool { return players[left].ID < players[right].ID })
	finalBounds, err := runtimeSemanticBoundsV117FromAny(finalState["bounds"])
	if err != nil {
		return runtimeSemanticStateProjectionV117{}, runtimeSemanticReplayStateV117{}, err
	}
	finalSoldiers, err := runtimeSemanticSoldiersV117FromAny(finalState["soldiers"])
	if err != nil {
		return runtimeSemanticStateProjectionV117{}, runtimeSemanticReplayStateV117{}, err
	}
	sort.Slice(finalSoldiers, func(left, right int) bool { return finalSoldiers[left].ID < finalSoldiers[right].ID })
	finalTerrain, err := runtimeSemanticPositionsV117FromAny(finalState["terrainStones"])
	if err != nil {
		return runtimeSemanticStateProjectionV117{}, runtimeSemanticReplayStateV117{}, err
	}
	runtimeSemanticSortPositionsV117(finalTerrain)
	finalOutcome, err := runtimeSemanticOutcomeV117FromAny(finalState["outcome"])
	if err != nil {
		return runtimeSemanticStateProjectionV117{}, runtimeSemanticReplayStateV117{}, err
	}
	phaseNumber, phaseNumberOK := semanticSafeInteger(finalState["phaseNumber"])
	roundNumber, roundNumberOK := semanticSafeInteger(finalState["roundNumber"])
	activationCount, activationCountOK := semanticSafeInteger(finalState["activationCount"])
	if !phaseNumberOK || !roundNumberOK || !activationCountOK || stringValue(finalState, "phase") != "COMPLETE" {
		return runtimeSemanticStateProjectionV117{}, runtimeSemanticReplayStateV117{}, errors.New("runtime semantic final lifecycle is invalid")
	}
	finalReplay := runtimeSemanticReplayStateV117{
		Board:   runtimeSemanticBoardV117{Bounds: finalBounds, Soldiers: finalSoldiers, TerrainStones: finalTerrain},
		Outcome: &finalOutcome,
	}
	projection := runtimeSemanticStateProjectionV117{
		MatchID: stringValue(finalState, "matchId"), Seed: stringValue(finalState, "seed"), Versions: parsedVersions,
		ArenaVariant: runtimeSemanticArenaV117{ID: stringValue(arena, "id"), Name: stringValue(arena, "name"), InitialBounds: initialBounds, TerrainStones: arenaTerrain},
		Players:      players, Phase: "COMPLETE", PhaseNumber: phaseNumber, RoundNumber: roundNumber, ActivationCount: activationCount,
		InitiativePlayerID: stringValue(finalState, "initiativePlayerId"), Bounds: reconstructed.Board.Bounds,
		Soldiers: reconstructed.Board.Soldiers, TerrainStones: reconstructed.Board.TerrainStones, Outcome: *reconstructed.Outcome,
	}
	return projection, finalReplay, nil
}

func runtimeSemanticReproducibilityMatchesV117(chronicle map[string]any, projection runtimeSemanticStateProjectionV117, start runtimeSemanticReplayStateV117) error {
	reproducibility, ok := chronicle["reproducibility"].(map[string]any)
	if !ok || stringValue(reproducibility, "matchId") != projection.MatchID || stringValue(reproducibility, "seed") != projection.Seed || stringValue(reproducibility, "arenaVariantId") != projection.ArenaVariant.ID || stringValue(reproducibility, "arenaVariantVersion") != projection.Versions.ArenaVariant {
		return errors.New("runtime semantic Chronicle reproducibility differs")
	}
	versions, ok := reproducibility["versions"].(map[string]any)
	if !ok || stringValue(versions, "spec") != projection.Versions.Spec || stringValue(versions, "engine") != projection.Versions.Engine || stringValue(versions, "runtimeJs") != projection.Versions.RuntimeJS || stringValue(versions, "chronicle") != projection.Versions.Chronicle || stringValue(versions, "strategyRevision") != projection.Versions.StrategyRevision || stringValue(versions, "arenaVariant") != projection.Versions.ArenaVariant {
		return errors.New("runtime semantic Chronicle versions differ")
	}
	revisions := sliceValue(reproducibility, "strategyRevisionIds")
	expected := map[string]string{}
	for _, player := range projection.Players {
		expected[player.Side] = player.StrategyRevisionID
	}
	if len(revisions) != 2 || stringFromAny(revisions[0]) != expected["bottom"] || stringFromAny(revisions[1]) != expected["top"] || !reflect.DeepEqual(start.Board.Bounds, projection.ArenaVariant.InitialBounds) || !reflect.DeepEqual(start.Board.TerrainStones, projection.ArenaVariant.TerrainStones) {
		return errors.New("runtime semantic Chronicle authority differs")
	}
	return nil
}

func runtimeSemanticBoardV117FromAny(value any) (runtimeSemanticBoardV117, error) {
	board, ok := value.(map[string]any)
	if !ok || !semanticExactKeys(board, "bounds", "soldiers", "terrainStones") {
		return runtimeSemanticBoardV117{}, errors.New("runtime semantic Chronicle board is invalid")
	}
	bounds, err := runtimeSemanticBoundsV117FromAny(board["bounds"])
	if err != nil {
		return runtimeSemanticBoardV117{}, err
	}
	soldiers, err := runtimeSemanticSoldiersV117FromAny(board["soldiers"])
	if err != nil {
		return runtimeSemanticBoardV117{}, err
	}
	terrain, err := runtimeSemanticPositionsV117FromAny(board["terrainStones"])
	if err != nil {
		return runtimeSemanticBoardV117{}, err
	}
	return runtimeSemanticBoardV117{Bounds: bounds, Soldiers: soldiers, TerrainStones: terrain}, nil
}

func runtimeSemanticBoundsV117FromAny(value any) (runtimeSemanticBoundsV117, error) {
	bounds, ok := value.(map[string]any)
	if !ok || !semanticExactKeys(bounds, "minX", "maxX", "minY", "maxY") {
		return runtimeSemanticBoundsV117{}, errors.New("runtime semantic bounds are invalid")
	}
	minX, minXOK := semanticSafeInteger(bounds["minX"])
	maxX, maxXOK := semanticSafeInteger(bounds["maxX"])
	minY, minYOK := semanticSafeInteger(bounds["minY"])
	maxY, maxYOK := semanticSafeInteger(bounds["maxY"])
	if !minXOK || !maxXOK || !minYOK || !maxYOK || minX >= maxX || minY >= maxY {
		return runtimeSemanticBoundsV117{}, errors.New("runtime semantic bounds are invalid")
	}
	return runtimeSemanticBoundsV117{MinX: minX, MaxX: maxX, MinY: minY, MaxY: maxY}, nil
}

func runtimeSemanticSoldiersV117FromAny(value any) ([]runtimeSemanticSoldierV117, error) {
	rows, ok := value.([]any)
	if !ok {
		return nil, errors.New("runtime semantic soldiers are invalid")
	}
	result := make([]runtimeSemanticSoldierV117, 0, len(rows))
	seen := map[string]bool{}
	for _, raw := range rows {
		row, rowOK := raw.(map[string]any)
		if !rowOK || !semanticOptionalKeys(row, []string{"id", "ownerPlayerId", "status", "position", "facing", "lastSuccessfulMoveDirection"}, "soldierMemory") {
			return nil, errors.New("runtime semantic Soldier is invalid")
		}
		id := stringValue(row, "id")
		owner := stringValue(row, "ownerPlayerId")
		status := stringValue(row, "status")
		if id == "" || owner == "" || seen[id] || (status != "ACTIVE" && status != "STONE" && status != "FALLEN") {
			return nil, errors.New("runtime semantic Soldier identity is invalid")
		}
		seen[id] = true
		var position *runtimeSemanticPositionV117
		if row["position"] != nil {
			parsed, err := runtimeSemanticPositionV117FromAny(row["position"])
			if err != nil {
				return nil, err
			}
			position = &parsed
		}
		facing, facingOK := runtimeSemanticNullableDirectionV117(row["facing"])
		last, lastOK := runtimeSemanticNullableDirectionV117(row["lastSuccessfulMoveDirection"])
		if !facingOK || !lastOK || ((status == "ACTIVE" || status == "STONE") && (position == nil || facing == nil)) || (status == "FALLEN" && position != nil) {
			return nil, errors.New("runtime semantic Soldier state is invalid")
		}
		result = append(result, runtimeSemanticSoldierV117{ID: id, OwnerPlayerID: owner, Status: status, Position: position, Facing: facing, LastSuccessfulMoveDirection: last})
	}
	return result, nil
}

func runtimeSemanticPositionsV117FromAny(value any) ([]runtimeSemanticPositionV117, error) {
	rows, ok := value.([]any)
	if !ok {
		return nil, errors.New("runtime semantic positions are invalid")
	}
	result := make([]runtimeSemanticPositionV117, 0, len(rows))
	for _, raw := range rows {
		position, err := runtimeSemanticPositionV117FromAny(raw)
		if err != nil {
			return nil, err
		}
		result = append(result, position)
	}
	return result, nil
}

func runtimeSemanticPositionV117FromAny(value any) (runtimeSemanticPositionV117, error) {
	position, ok := value.(map[string]any)
	if !ok || !semanticExactKeys(position, "x", "y") {
		return runtimeSemanticPositionV117{}, errors.New("runtime semantic position is invalid")
	}
	x, xOK := semanticSafeInteger(position["x"])
	y, yOK := semanticSafeInteger(position["y"])
	if !xOK || !yOK {
		return runtimeSemanticPositionV117{}, errors.New("runtime semantic position is invalid")
	}
	return runtimeSemanticPositionV117{X: x, Y: y}, nil
}

func runtimeSemanticOutcomeV117FromAny(value any) (runtimeSemanticOutcomeV117, error) {
	outcome, ok := value.(map[string]any)
	if !ok {
		return runtimeSemanticOutcomeV117{}, errors.New("runtime semantic outcome is invalid")
	}
	switch stringValue(outcome, "type") {
	case "WIN":
		winner := stringValue(outcome, "winnerPlayerId")
		if winner == "" || !semanticExactKeys(outcome, "type", "winnerPlayerId") {
			return runtimeSemanticOutcomeV117{}, errors.New("runtime semantic outcome is invalid")
		}
		return runtimeSemanticOutcomeV117{Type: "WIN", WinnerPlayerID: runtimeSemanticStringPointerV117(winner)}, nil
	case "DRAW":
		if !semanticExactKeys(outcome, "type") {
			return runtimeSemanticOutcomeV117{}, errors.New("runtime semantic outcome is invalid")
		}
		return runtimeSemanticOutcomeV117{Type: "DRAW"}, nil
	case "FAILED":
		reason := stringValue(outcome, "reason")
		if reason == "" || !semanticExactKeys(outcome, "type", "reason") {
			return runtimeSemanticOutcomeV117{}, errors.New("runtime semantic outcome is invalid")
		}
		return runtimeSemanticOutcomeV117{Type: "FAILED", Reason: runtimeSemanticStringPointerV117(reason)}, nil
	default:
		return runtimeSemanticOutcomeV117{}, errors.New("runtime semantic outcome is invalid")
	}
}

func runtimeSemanticSoldierForUpdateV117(state *runtimeSemanticReplayStateV117, id string) (*runtimeSemanticSoldierV117, bool) {
	if id == "" {
		return nil, false
	}
	for index := range state.Board.Soldiers {
		if state.Board.Soldiers[index].ID == id {
			return &state.Board.Soldiers[index], true
		}
	}
	return nil, false
}

func cloneRuntimeSemanticReplayStateV117(state runtimeSemanticReplayStateV117) runtimeSemanticReplayStateV117 {
	clone := state
	clone.Board.Soldiers = make([]runtimeSemanticSoldierV117, len(state.Board.Soldiers))
	copy(clone.Board.Soldiers, state.Board.Soldiers)
	for index := range clone.Board.Soldiers {
		if state.Board.Soldiers[index].Position != nil {
			position := *state.Board.Soldiers[index].Position
			clone.Board.Soldiers[index].Position = &position
		}
	}
	clone.Board.TerrainStones = make([]runtimeSemanticPositionV117, len(state.Board.TerrainStones))
	copy(clone.Board.TerrainStones, state.Board.TerrainStones)
	if state.Outcome != nil {
		outcome := *state.Outcome
		clone.Outcome = &outcome
	}
	return clone
}

func runtimeSemanticNullableDirectionV117(value any) (*string, bool) {
	if value == nil {
		return nil, true
	}
	direction, ok := value.(string)
	if !ok || !runtimeSemanticDirectionV117(direction) {
		return nil, false
	}
	return runtimeSemanticStringPointerV117(direction), true
}

func runtimeSemanticDirectionV117(direction string) bool {
	return direction == "UP" || direction == "RIGHT" || direction == "DOWN" || direction == "LEFT"
}

func runtimeSemanticStringPointerV117(value string) *string {
	clone := value
	return &clone
}

func runtimeSemanticMovePositionV117(position runtimeSemanticPositionV117, direction string) runtimeSemanticPositionV117 {
	switch direction {
	case "UP":
		position.Y--
	case "DOWN":
		position.Y++
	case "LEFT":
		position.X--
	case "RIGHT":
		position.X++
	}
	return position
}

func runtimeSemanticDirectionBetweenV117(from runtimeSemanticPositionV117, to runtimeSemanticPositionV117) (string, bool) {
	for _, direction := range []string{"UP", "DOWN", "LEFT", "RIGHT"} {
		if runtimeSemanticMovePositionV117(from, direction) == to {
			return direction, true
		}
	}
	return "", false
}

func runtimeSemanticWithinBoundsV117(position runtimeSemanticPositionV117, bounds runtimeSemanticBoundsV117) bool {
	return position.X >= bounds.MinX && position.X <= bounds.MaxX && position.Y >= bounds.MinY && position.Y <= bounds.MaxY
}

func runtimeSemanticSortPositionsV117(positions []runtimeSemanticPositionV117) {
	sort.Slice(positions, func(left, right int) bool {
		return positions[left].X < positions[right].X || (positions[left].X == positions[right].X && positions[left].Y < positions[right].Y)
	})
}

func runtimeSemanticJSONStringifyV117(value any) ([]byte, error) {
	var encoded bytes.Buffer
	encoder := json.NewEncoder(&encoded)
	encoder.SetEscapeHTML(false)
	if err := encoder.Encode(value); err != nil {
		return nil, err
	}
	return runtimeSemanticUnescapeLineSeparatorsV117(bytes.TrimSuffix(encoded.Bytes(), []byte("\n"))), nil
}

func runtimeSemanticUnescapeLineSeparatorsV117(encoded []byte) []byte {
	result := make([]byte, 0, len(encoded))
	for index := 0; index < len(encoded); {
		if index+6 <= len(encoded) && encoded[index] == '\\' && (string(encoded[index:index+6]) == `\u2028` || string(encoded[index:index+6]) == `\u2029`) {
			backslashes := 0
			for previous := index - 1; previous >= 0 && encoded[previous] == '\\'; previous-- {
				backslashes++
			}
			if backslashes%2 == 0 {
				if encoded[index+5] == '8' {
					result = append(result, []byte("\u2028")...)
				} else {
					result = append(result, []byte("\u2029")...)
				}
				index += 6
				continue
			}
		}
		result = append(result, encoded[index])
		index++
	}
	return result
}

func runtimeServiceEntrantMatchesClaimedV117(request runtimeServiceEntrantV117, claimed claimedRuntimeServiceEntrantV117) bool {
	return request.StrategyRevisionID == claimed.StrategyRevisionID &&
		request.LaneIdentityHash == claimed.LaneIdentityHash &&
		request.IdentityManifestRoot == claimed.IdentityManifestRoot &&
		request.EvidenceGraphRoot == claimed.EvidenceGraphRoot &&
		request.ExactPins == claimed.ExactPins
}
