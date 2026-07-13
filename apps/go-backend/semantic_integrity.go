package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"sort"
	"strconv"
	"strings"
	"unicode/utf8"
)

const semanticIntegrityPublicCategory = "CANONICAL_INTEGRITY_FAILURE"
const semanticIntegrityOwnership = "system_integrity"

const inactiveCandidateTupleID = "sha256:922a6857fdbc8354b744d6e766bff216f3fee85b5ed381355cb427f5a616b3ae"

var inactiveCandidateTuple = canonicalCompatibilityTuple{
	Rules:        "cowards-rules-v1.4",
	Engine:       "engine-kernel-v1.37-candidate-1",
	RuntimeABI:   "strategy-runtime-abi-v1.14",
	Chronicle:    "chronicle-recorder-current-events-v1.37-candidate-1",
	ArenaCatalog: "semantic-arena-catalog-v1.37-candidate-1",
	SetPolicy:    "canonical-set-policy-v1.4",
}

var semanticIntegrityFamilyOrder = []string{
	"TUPLE", "ARENA", "PLAYER", "SOLDIER", "POSITION", "LIFECYCLE", "OUTCOME", "TRANSITION",
}

// Keep this literal order in lockstep with packages/spec. The shared contract
// currently contains 34 codes (the original plan text said 33 before
// ARENA_TERRAIN_AUTHORITY_MISMATCH was added to the committed corpus).
var semanticIntegrityCodeOrder = []string{
	"TUPLE_SHAPE_INVALID",
	"TUPLE_UNKNOWN_COMPONENT",
	"TUPLE_MIXED_COMPONENTS",
	"ARENA_SHAPE_INVALID",
	"ARENA_BOUNDS_INVERTED",
	"ARENA_BOUNDS_DEGENERATE",
	"ARENA_TERRAIN_OUT_OF_BOUNDS",
	"ARENA_TERRAIN_DUPLICATE",
	"ARENA_TERRAIN_AUTHORITY_MISMATCH",
	"ARENA_TERRAIN_START_OVERLAP",
	"ARENA_START_NONCANONICAL",
	"PLAYER_SHAPE_INVALID",
	"PLAYER_ID_DUPLICATE",
	"PLAYER_INITIATIVE_UNKNOWN",
	"SOLDIER_SHAPE_INVALID",
	"SOLDIER_ID_DUPLICATE",
	"SOLDIER_OWNER_UNKNOWN",
	"SOLDIER_STATUS_POSITION_INCOHERENT",
	"SOLDIER_STATUS_FACING_INCOHERENT",
	"POSITION_SHAPE_INVALID",
	"POSITION_OCCUPANCY_DUPLICATE",
	"POSITION_OUT_OF_BOUNDS",
	"POSITION_TERRAIN_OCCUPIED",
	"LIFECYCLE_SHAPE_INVALID",
	"LIFECYCLE_CURSOR_INVALID",
	"LIFECYCLE_QUOTA_MISMATCH",
	"LIFECYCLE_PENDING_EFFECT_IDENTITY",
	"OUTCOME_SHAPE_INVALID",
	"OUTCOME_ACTIVE_COUNT_INCOHERENT",
	"OUTCOME_WINNER_INCOHERENT",
	"TRANSITION_SHAPE_INVALID",
	"TRANSITION_POST_TERMINAL",
	"TRANSITION_EVENT_STATE_MISMATCH",
	"TRANSITION_HASH_MISMATCH",
}

var semanticIntegrityCodeRank = func() map[string]int {
	rank := make(map[string]int, len(semanticIntegrityCodeOrder))
	for index, code := range semanticIntegrityCodeOrder {
		rank[code] = index
	}
	return rank
}()

var semanticSafeMetadataKeys = map[string]struct{}{
	"actual": {}, "axis": {}, "component": {}, "count": {}, "expected": {},
	"index": {}, "rule": {}, "side": {}, "status": {},
}

type semanticIntegrityLimits struct {
	Issues             int `json:"issues"`
	PathSegments       int `json:"pathSegments"`
	PathBytes          int `json:"pathBytes"`
	MetadataEntries    int `json:"metadataEntries"`
	MetadataValueBytes int `json:"metadataValueBytes"`
}

var defaultSemanticIntegrityLimits = semanticIntegrityLimits{
	Issues: 16, PathSegments: 8, PathBytes: 160, MetadataEntries: 4, MetadataValueBytes: 64,
}

type semanticIntegrityIssue struct {
	Code     string         `json:"code"`
	Path     []any          `json:"path"`
	Metadata map[string]any `json:"metadata"`
}

type semanticIntegrityResult struct {
	OK        bool                     `json:"ok"`
	Category  string                   `json:"category,omitempty"`
	Ownership string                   `json:"ownership,omitempty"`
	Issues    []semanticIntegrityIssue `json:"issues"`
	Truncated bool                     `json:"truncated"`
}

func semanticIssue(code string, path []any, metadata map[string]any) semanticIntegrityIssue {
	if path == nil {
		path = []any{}
	}
	if metadata == nil {
		metadata = map[string]any{}
	}
	return semanticIntegrityIssue{Code: code, Path: path, Metadata: metadata}
}

func createSemanticIntegrityResult(input []semanticIntegrityIssue) semanticIntegrityResult {
	if len(input) == 0 {
		return semanticIntegrityResult{OK: true, Issues: []semanticIntegrityIssue{}, Truncated: false}
	}
	ordered := append([]semanticIntegrityIssue(nil), input...)
	sort.SliceStable(ordered, func(left int, right int) bool {
		return compareSemanticIssue(ordered[left], ordered[right]) < 0
	})
	truncated := len(ordered) > defaultSemanticIntegrityLimits.Issues
	if len(ordered) > defaultSemanticIntegrityLimits.Issues {
		ordered = ordered[:defaultSemanticIntegrityLimits.Issues]
	}
	issues := make([]semanticIntegrityIssue, 0, len(ordered))
	for _, issue := range ordered {
		bounded, didTruncate := boundSemanticIssue(issue)
		truncated = truncated || didTruncate
		issues = append(issues, bounded)
	}
	return semanticIntegrityResult{
		OK: false, Category: semanticIntegrityPublicCategory, Ownership: semanticIntegrityOwnership,
		Issues: issues, Truncated: truncated,
	}
}

func compareSemanticIssue(left semanticIntegrityIssue, right semanticIntegrityIssue) int {
	leftRank, leftKnown := semanticIntegrityCodeRank[left.Code]
	rightRank, rightKnown := semanticIntegrityCodeRank[right.Code]
	if !leftKnown {
		leftRank = len(semanticIntegrityCodeOrder)
	}
	if !rightKnown {
		rightRank = len(semanticIntegrityCodeOrder)
	}
	if leftRank != rightRank {
		return leftRank - rightRank
	}
	if difference := compareSemanticPath(left.Path, right.Path); difference != 0 {
		return difference
	}
	return strings.Compare(semanticMetadataSignature(left.Metadata), semanticMetadataSignature(right.Metadata))
}

func compareSemanticPath(left []any, right []any) int {
	length := len(left)
	if len(right) < length {
		length = len(right)
	}
	for index := 0; index < length; index++ {
		leftNumber, leftIsNumber := semanticPathInteger(left[index])
		rightNumber, rightIsNumber := semanticPathInteger(right[index])
		switch {
		case leftIsNumber && rightIsNumber && leftNumber != rightNumber:
			if leftNumber < rightNumber {
				return -1
			}
			return 1
		case leftIsNumber && !rightIsNumber:
			return -1
		case !leftIsNumber && rightIsNumber:
			return 1
		case !leftIsNumber && !rightIsNumber:
			if difference := strings.Compare(fmt.Sprint(left[index]), fmt.Sprint(right[index])); difference != 0 {
				return difference
			}
		}
	}
	return len(left) - len(right)
}

func semanticPathInteger(value any) (int64, bool) {
	switch typed := value.(type) {
	case int:
		return int64(typed), true
	case int64:
		return typed, true
	case float64:
		if math.Trunc(typed) == typed && typed >= math.MinInt64 && typed <= math.MaxInt64 {
			return int64(typed), true
		}
	case json.Number:
		integer, err := strconv.ParseInt(string(typed), 10, 64)
		return integer, err == nil
	}
	return 0, false
}

func semanticMetadataSignature(metadata map[string]any) string {
	keys := make([]string, 0, len(metadata))
	for key := range metadata {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	parts := make([]string, 0, len(keys))
	for _, key := range keys {
		parts = append(parts, fmt.Sprintf("%s:%T:%v", key, metadata[key], metadata[key]))
	}
	return strings.Join(parts, "\x00")
}

func boundSemanticIssue(issue semanticIntegrityIssue) (semanticIntegrityIssue, bool) {
	truncated := false
	path := make([]any, 0, minInt(len(issue.Path), defaultSemanticIntegrityLimits.PathSegments))
	remaining := defaultSemanticIntegrityLimits.PathBytes
	for index, segment := range issue.Path {
		if index >= defaultSemanticIntegrityLimits.PathSegments {
			truncated = true
			break
		}
		text := fmt.Sprint(segment)
		bounded, didTruncate := truncateSemanticUTF8(text, remaining)
		remaining -= len([]byte(bounded))
		truncated = truncated || didTruncate
		if _, isNumber := semanticPathInteger(segment); isNumber && !didTruncate {
			path = append(path, segment)
		} else {
			path = append(path, bounded)
		}
		if remaining == 0 && index+1 < len(issue.Path) {
			truncated = true
			break
		}
	}
	keys := make([]string, 0, len(issue.Metadata))
	for key := range issue.Metadata {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	metadata := map[string]any{}
	for _, key := range keys {
		if _, safe := semanticSafeMetadataKeys[key]; !safe {
			truncated = true
			continue
		}
		if len(metadata) >= defaultSemanticIntegrityLimits.MetadataEntries {
			truncated = true
			continue
		}
		value := issue.Metadata[key]
		bounded, didTruncate := truncateSemanticUTF8(fmt.Sprint(value), defaultSemanticIntegrityLimits.MetadataValueBytes)
		truncated = truncated || didTruncate
		if _, isString := value.(string); isString || didTruncate {
			metadata[key] = bounded
		} else if isSemanticMetadataScalar(value) {
			metadata[key] = value
		} else {
			truncated = true
		}
	}
	return semanticIntegrityIssue{Code: issue.Code, Path: path, Metadata: metadata}, truncated
}

func truncateSemanticUTF8(value string, maximum int) (string, bool) {
	if len([]byte(value)) <= maximum {
		return value, false
	}
	if maximum <= 0 {
		return "", true
	}
	end := 0
	for index := range value {
		if index > maximum {
			break
		}
		end = index
	}
	if end == 0 && len(value) > 0 {
		_, size := utf8.DecodeRuneInString(value)
		if size <= maximum {
			end = size
		}
	}
	for end < len(value) {
		_, size := utf8.DecodeRuneInString(value[end:])
		if end+size > maximum {
			break
		}
		end += size
	}
	return value[:end], true
}

func isSemanticMetadataScalar(value any) bool {
	switch value.(type) {
	case nil, string, bool, int, int64, float64, json.Number:
		return true
	default:
		return false
	}
}

func minInt(left int, right int) int {
	if left < right {
		return left
	}
	return right
}

func semanticSafeInteger(value any) (int64, bool) {
	var integer int64
	switch typed := value.(type) {
	case int:
		integer = int64(typed)
	case int64:
		integer = typed
	case float64:
		if math.IsNaN(typed) || math.IsInf(typed, 0) || math.Trunc(typed) != typed || math.Abs(typed) > 9007199254740991 {
			return 0, false
		}
		integer = int64(typed)
	case json.Number:
		parsed, err := strconv.ParseInt(string(typed), 10, 64)
		if err != nil || parsed < -9007199254740991 || parsed > 9007199254740991 {
			return 0, false
		}
		integer = parsed
	default:
		return 0, false
	}
	if integer < -9007199254740991 || integer > 9007199254740991 {
		return 0, false
	}
	return integer, true
}

func semanticExactKeys(value map[string]any, keys ...string) bool {
	if value == nil || len(value) != len(keys) {
		return false
	}
	for _, key := range keys {
		if _, exists := value[key]; !exists {
			return false
		}
	}
	return true
}

func semanticOptionalKeys(value map[string]any, required []string, optional ...string) bool {
	if value == nil || len(value) < len(required) || len(value) > len(required)+len(optional) {
		return false
	}
	allowed := map[string]struct{}{}
	for _, key := range append(append([]string{}, required...), optional...) {
		allowed[key] = struct{}{}
	}
	for _, key := range required {
		if _, exists := value[key]; !exists {
			return false
		}
	}
	for key := range value {
		if _, exists := allowed[key]; !exists {
			return false
		}
	}
	return true
}

func semanticMap(value any) (map[string]any, bool) {
	result, ok := value.(map[string]any)
	return result, ok && result != nil
}

func semanticSlice(value any) ([]any, bool) {
	result, ok := value.([]any)
	return result, ok && result != nil
}

func semanticString(value any) (string, bool) {
	result, ok := value.(string)
	return result, ok && result != ""
}

type semanticPosition struct {
	X int64
	Y int64
}

func semanticPositionValue(value any) (semanticPosition, bool) {
	position, ok := semanticMap(value)
	if !ok || !semanticExactKeys(position, "x", "y") {
		return semanticPosition{}, false
	}
	x, xOK := semanticSafeInteger(position["x"])
	y, yOK := semanticSafeInteger(position["y"])
	return semanticPosition{X: x, Y: y}, xOK && yOK
}

type semanticBounds struct {
	MinX int64
	MaxX int64
	MinY int64
	MaxY int64
}

func semanticBoundsValue(value any) (semanticBounds, bool) {
	bounds, ok := semanticMap(value)
	if !ok || !semanticExactKeys(bounds, "minX", "maxX", "minY", "maxY") {
		return semanticBounds{}, false
	}
	minX, minXOK := semanticSafeInteger(bounds["minX"])
	maxX, maxXOK := semanticSafeInteger(bounds["maxX"])
	minY, minYOK := semanticSafeInteger(bounds["minY"])
	maxY, maxYOK := semanticSafeInteger(bounds["maxY"])
	return semanticBounds{MinX: minX, MaxX: maxX, MinY: minY, MaxY: maxY}, minXOK && maxXOK && minYOK && maxYOK
}

func semanticPositionKey(position semanticPosition) string {
	return fmt.Sprintf("%d,%d", position.X, position.Y)
}

func semanticWithinBounds(position semanticPosition, bounds semanticBounds) bool {
	return position.X >= bounds.MinX && position.X <= bounds.MaxX && position.Y >= bounds.MinY && position.Y <= bounds.MaxY
}

var semanticBottomStarts = []semanticPosition{{2, 11}, {3, 11}, {4, 11}, {5, 11}, {6, 11}, {7, 11}, {8, 11}, {9, 11}}
var semanticTopStarts = []semanticPosition{{2, 0}, {3, 0}, {4, 0}, {5, 0}, {6, 0}, {7, 0}, {8, 0}, {9, 0}}

var semanticCompatibilityVersions = map[string]string{
	"spec": "cowards-rules-v1.4", "engine": "0.1.4", "runtimeJs": "0.1.0",
	"chronicle": "chronicle-v1.4", "strategyRevision": "0.1.4", "arenaVariant": "0.1.0",
}

func validateGoCanonicalArena(arena map[string]any) semanticIntegrityResult {
	return createSemanticIntegrityResult(collectGoArenaIssues(arena, true))
}

func collectGoArenaIssues(arena map[string]any, includeStarts bool) []semanticIntegrityIssue {
	issues := []semanticIntegrityIssue{}
	if !semanticExactKeys(arena, "id", "name", "initialBounds", "terrainStones") {
		return append(issues, semanticIssue("ARENA_SHAPE_INVALID", []any{}, nil))
	}
	if _, ok := semanticString(arena["id"]); !ok {
		issues = append(issues, semanticIssue("ARENA_SHAPE_INVALID", []any{"id"}, nil))
	}
	if _, ok := arena["name"].(string); !ok {
		issues = append(issues, semanticIssue("ARENA_SHAPE_INVALID", []any{"name"}, nil))
	}
	bounds, boundsOK := semanticBoundsValue(arena["initialBounds"])
	terrain, terrainOK := semanticSlice(arena["terrainStones"])
	if !boundsOK || !terrainOK {
		return append(issues, semanticIssue("ARENA_SHAPE_INVALID", []any{}, nil))
	}
	for _, axis := range []struct {
		name string
		min  int64
		max  int64
	}{
		{"x", bounds.MinX, bounds.MaxX}, {"y", bounds.MinY, bounds.MaxY},
	} {
		if axis.min > axis.max {
			issues = append(issues, semanticIssue("ARENA_BOUNDS_INVERTED", []any{"initialBounds", "max" + strings.ToUpper(axis.name)}, map[string]any{"axis": axis.name}))
		} else if axis.min == axis.max {
			issues = append(issues, semanticIssue("ARENA_BOUNDS_DEGENERATE", []any{"initialBounds"}, map[string]any{"axis": axis.name}))
		}
	}
	seen := map[string]bool{}
	positions := make([]semanticPosition, 0, len(terrain))
	for index, raw := range terrain {
		position, ok := semanticPositionValue(raw)
		if !ok {
			issues = append(issues, semanticIssue("ARENA_SHAPE_INVALID", []any{"terrainStones", index}, nil))
			continue
		}
		positions = append(positions, position)
		key := semanticPositionKey(position)
		if !semanticWithinBounds(position, bounds) {
			issues = append(issues, semanticIssue("ARENA_TERRAIN_OUT_OF_BOUNDS", []any{"terrainStones", index}, nil))
		}
		if seen[key] {
			issues = append(issues, semanticIssue("ARENA_TERRAIN_DUPLICATE", []any{"terrainStones", index}, nil))
		}
		seen[key] = true
	}
	if includeStarts && bounds.MinX < bounds.MaxX && bounds.MinY < bounds.MaxY {
		starts := map[string]string{}
		for _, position := range semanticBottomStarts {
			starts[semanticPositionKey(position)] = "bottom"
		}
		for _, position := range semanticTopStarts {
			starts[semanticPositionKey(position)] = "top"
		}
		for index, position := range positions {
			if side := starts[semanticPositionKey(position)]; side != "" {
				issues = append(issues, semanticIssue("ARENA_TERRAIN_START_OVERLAP", []any{"terrainStones", index}, map[string]any{"side": side}))
			}
		}
		for side, sideStarts := range map[string][]semanticPosition{"bottom": semanticBottomStarts, "top": semanticTopStarts} {
			for _, position := range sideStarts {
				if !semanticWithinBounds(position, bounds) {
					issues = append(issues, semanticIssue("ARENA_START_NONCANONICAL", []any{"initialBounds"}, map[string]any{"side": side}))
					break
				}
			}
		}
	}
	return issues
}

func collectGoTupleIssues(versions map[string]any) []semanticIntegrityIssue {
	issues := []semanticIntegrityIssue{}
	if !semanticExactKeys(versions, "spec", "engine", "runtimeJs", "chronicle", "strategyRevision", "arenaVariant") {
		return append(issues, semanticIssue("TUPLE_SHAPE_INVALID", []any{"versions"}, nil))
	}
	recognizedMismatch := false
	for _, component := range []string{"spec", "engine", "runtimeJs", "chronicle", "strategyRevision", "arenaVariant"} {
		actual, ok := versions[component].(string)
		if !ok || actual == "" {
			issues = append(issues, semanticIssue("TUPLE_SHAPE_INVALID", []any{"versions", component}, map[string]any{"component": component}))
			continue
		}
		if actual == semanticCompatibilityVersions[component] {
			continue
		}
		knownPattern := false
		switch component {
		case "spec":
			knownPattern = strings.HasPrefix(actual, "cowards-rules-v")
		case "chronicle":
			knownPattern = strings.HasPrefix(actual, "chronicle-v")
		default:
			parts := strings.SplitN(actual, ".", 3)
			knownPattern = len(parts) == 3
		}
		if knownPattern {
			recognizedMismatch = true
		} else {
			issues = append(issues, semanticIssue("TUPLE_UNKNOWN_COMPONENT", []any{"versions", component}, map[string]any{"component": component}))
		}
	}
	if recognizedMismatch {
		issues = append(issues, semanticIssue("TUPLE_MIXED_COMPONENTS", []any{"versions"}, nil))
	}
	return issues
}

func validateGoCanonicalGameState(state map[string]any) semanticIntegrityResult {
	return createSemanticIntegrityResult(collectGoStateIssues(state))
}

func validateGoCanonicalInitialGameState(state map[string]any) semanticIntegrityResult {
	issues := collectGoStateIssues(state)
	players, _ := semanticSlice(state["players"])
	soldiers, _ := semanticSlice(state["soldiers"])
	playersBySide := map[string]string{}
	for _, raw := range players {
		player, ok := semanticMap(raw)
		if ok {
			playersBySide[stringValue(player, "side")] = stringValue(player, "id")
		}
	}
	for side, starts := range map[string][]semanticPosition{"bottom": semanticBottomStarts, "top": semanticTopStarts} {
		expected := map[string]bool{}
		for _, position := range starts {
			expected[semanticPositionKey(position)] = true
		}
		count := 0
		positions := map[string]bool{}
		invalidIndex := -1
		for index, raw := range soldiers {
			soldier, ok := semanticMap(raw)
			if !ok || stringValue(soldier, "ownerPlayerId") != playersBySide[side] {
				continue
			}
			count++
			position, positionOK := semanticPositionValue(soldier["position"])
			if stringValue(soldier, "status") != "ACTIVE" || !positionOK || !expected[semanticPositionKey(position)] {
				if invalidIndex < 0 {
					invalidIndex = index
				}
			} else {
				positions[semanticPositionKey(position)] = true
			}
		}
		if invalidIndex >= 0 || count != len(expected) || len(positions) != len(expected) {
			path := []any{"soldiers"}
			if invalidIndex >= 0 {
				path = []any{"soldiers", invalidIndex, "position"}
			}
			issues = append(issues, semanticIssue("ARENA_START_NONCANONICAL", path, map[string]any{"side": side}))
		}
	}
	return createSemanticIntegrityResult(issues)
}

func collectGoStateIssues(state map[string]any) []semanticIntegrityIssue {
	issues := []semanticIntegrityIssue{}
	required := []string{"matchId", "seed", "versions", "arenaVariant", "players", "phase", "phaseNumber", "roundNumber", "activationCount", "initiativePlayerId", "bounds", "soldiers", "terrainStones"}
	if !semanticOptionalKeys(state, required, "outcome") {
		return append(issues, semanticIssue("LIFECYCLE_SHAPE_INVALID", []any{}, nil))
	}
	versions, versionsOK := semanticMap(state["versions"])
	arena, arenaOK := semanticMap(state["arenaVariant"])
	players, playersOK := semanticSlice(state["players"])
	soldiers, soldiersOK := semanticSlice(state["soldiers"])
	terrain, terrainOK := semanticSlice(state["terrainStones"])
	bounds, boundsOK := semanticBoundsValue(state["bounds"])
	phase, phaseOK := state["phase"].(string)
	phaseNumber, phaseNumberOK := semanticSafeInteger(state["phaseNumber"])
	roundNumber, roundNumberOK := semanticSafeInteger(state["roundNumber"])
	activationCount, activationCountOK := semanticSafeInteger(state["activationCount"])
	initiative, initiativeOK := semanticString(state["initiativePlayerId"])
	if !versionsOK || !arenaOK || !playersOK || !soldiersOK || !terrainOK || !boundsOK || !phaseOK || !phaseNumberOK || !roundNumberOK || !activationCountOK || !initiativeOK {
		return append(issues, semanticIssue("LIFECYCLE_SHAPE_INVALID", []any{}, nil))
	}
	issues = append(issues, collectGoTupleIssues(versions)...)
	issues = append(issues, collectGoArenaIssues(arena, false)...)

	playerIDs := map[string]bool{}
	sideIDs := map[string]bool{}
	for index, raw := range players {
		player, ok := semanticMap(raw)
		if !ok || !semanticExactKeys(player, "id", "side", "strategyRevisionId", "strategyMemory") {
			issues = append(issues, semanticIssue("PLAYER_SHAPE_INVALID", []any{"players", index}, nil))
			continue
		}
		id, idOK := semanticString(player["id"])
		side, sideOK := player["side"].(string)
		_, revisionOK := semanticString(player["strategyRevisionId"])
		if !idOK || !sideOK || (side != "bottom" && side != "top") || !revisionOK {
			issues = append(issues, semanticIssue("PLAYER_SHAPE_INVALID", []any{"players", index}, nil))
			continue
		}
		if playerIDs[id] || sideIDs[side] {
			issues = append(issues, semanticIssue("PLAYER_ID_DUPLICATE", []any{"players", index, "id"}, nil))
		}
		playerIDs[id] = true
		sideIDs[side] = true
	}
	if !playerIDs[initiative] {
		issues = append(issues, semanticIssue("PLAYER_INITIATIVE_UNKNOWN", []any{"initiativePlayerId"}, nil))
	}

	initialBounds, initialBoundsOK := semanticBoundsValue(arena["initialBounds"])
	if initialBoundsOK {
		depths := []int64{bounds.MinX - initialBounds.MinX, initialBounds.MaxX - bounds.MaxX, bounds.MinY - initialBounds.MinY, initialBounds.MaxY - bounds.MaxY}
		allowedDepth := phaseNumber - 1
		validDepth := bounds.MinX < bounds.MaxX && bounds.MinY < bounds.MaxY
		for _, depth := range depths {
			validDepth = validDepth && depth >= 0 && depth == depths[0]
		}
		if phase == "COMPLETE" {
			validDepth = validDepth && (depths[0] == allowedDepth || depths[0] == phaseNumber)
		} else {
			validDepth = validDepth && depths[0] == allowedDepth
		}
		if !validDepth {
			issues = append(issues, semanticIssue("ARENA_BOUNDS_INVERTED", []any{"bounds"}, nil))
		}
	}

	currentTerrain := map[string]bool{}
	currentTerrainPositions := make([]semanticPosition, len(terrain))
	for index, raw := range terrain {
		position, ok := semanticPositionValue(raw)
		if !ok {
			issues = append(issues, semanticIssue("ARENA_SHAPE_INVALID", []any{"terrainStones", index}, nil))
			continue
		}
		currentTerrainPositions[index] = position
		key := semanticPositionKey(position)
		if !semanticWithinBounds(position, bounds) {
			issues = append(issues, semanticIssue("ARENA_TERRAIN_OUT_OF_BOUNDS", []any{"terrainStones", index}, nil))
		}
		if currentTerrain[key] {
			issues = append(issues, semanticIssue("ARENA_TERRAIN_DUPLICATE", []any{"terrainStones", index}, nil))
		}
		currentTerrain[key] = true
	}
	authorityTerrain := map[string]bool{}
	if arenaTerrain, ok := semanticSlice(arena["terrainStones"]); ok {
		for _, raw := range arenaTerrain {
			if position, positionOK := semanticPositionValue(raw); positionOK && semanticWithinBounds(position, bounds) {
				authorityTerrain[semanticPositionKey(position)] = true
			}
		}
	}
	if len(currentTerrain) != len(authorityTerrain) {
		issues = append(issues, semanticIssue("ARENA_TERRAIN_AUTHORITY_MISMATCH", []any{"terrainStones"}, nil))
	} else {
		for key := range authorityTerrain {
			if !currentTerrain[key] {
				issues = append(issues, semanticIssue("ARENA_TERRAIN_AUTHORITY_MISMATCH", []any{"terrainStones"}, nil))
				break
			}
		}
	}

	if phaseNumber < 1 || roundNumber < 1 || roundNumber > 4 || (phase != "ROUND" && phase != "CONTRACTION" && phase != "COMPLETE") {
		issues = append(issues, semanticIssue("LIFECYCLE_CURSOR_INVALID", []any{"phaseNumber"}, nil))
	}
	expectedActivation := map[int64]int64{1: 1, 2: 2, 3: 3, 4: 4}[roundNumber]
	if !activationCountOK || activationCount != expectedActivation {
		issues = append(issues, semanticIssue("LIFECYCLE_QUOTA_MISMATCH", []any{"activationCount"}, nil))
	}

	soldierIDs := map[string]bool{}
	occupied := map[string]bool{}
	activeCounts := map[string]int{}
	for playerID := range playerIDs {
		activeCounts[playerID] = 0
	}
	for index, raw := range soldiers {
		soldier, ok := semanticMap(raw)
		if !ok || !semanticExactKeys(soldier, "id", "ownerPlayerId", "status", "position", "facing", "lastSuccessfulMoveDirection", "soldierMemory") {
			issues = append(issues, semanticIssue("SOLDIER_SHAPE_INVALID", []any{"soldiers", index}, nil))
			continue
		}
		id, idOK := semanticString(soldier["id"])
		owner, ownerOK := semanticString(soldier["ownerPlayerId"])
		status, statusOK := soldier["status"].(string)
		if !idOK || !ownerOK || !statusOK || (status != "ACTIVE" && status != "STONE" && status != "FALLEN") {
			issues = append(issues, semanticIssue("SOLDIER_SHAPE_INVALID", []any{"soldiers", index}, nil))
			continue
		}
		if soldierIDs[id] {
			issues = append(issues, semanticIssue("SOLDIER_ID_DUPLICATE", []any{"soldiers", index, "id"}, nil))
		}
		soldierIDs[id] = true
		if !playerIDs[owner] {
			issues = append(issues, semanticIssue("SOLDIER_OWNER_UNKNOWN", []any{"soldiers", index, "ownerPlayerId"}, nil))
		}
		position, positionOK := semanticPositionValue(soldier["position"])
		positionNull := soldier["position"] == nil
		facing, facingIsString := soldier["facing"].(string)
		facingNull := soldier["facing"] == nil
		lastDirection, lastDirectionIsString := soldier["lastSuccessfulMoveDirection"].(string)
		lastDirectionNull := soldier["lastSuccessfulMoveDirection"] == nil
		if (status == "ACTIVE" || status == "STONE") && positionNull {
			issues = append(issues, semanticIssue("SOLDIER_STATUS_POSITION_INCOHERENT", []any{"soldiers", index, "position"}, map[string]any{"status": status}))
		}
		if status == "FALLEN" && !positionNull {
			issues = append(issues, semanticIssue("SOLDIER_STATUS_POSITION_INCOHERENT", []any{"soldiers", index, "position"}, map[string]any{"status": status}))
		}
		if (status == "ACTIVE" || status == "STONE") && facingNull {
			issues = append(issues, semanticIssue("SOLDIER_STATUS_FACING_INCOHERENT", []any{"soldiers", index, "facing"}, map[string]any{"status": status}))
		}
		if !facingNull && (!facingIsString || (facing != "UP" && facing != "RIGHT" && facing != "DOWN" && facing != "LEFT")) {
			issues = append(issues, semanticIssue("SOLDIER_SHAPE_INVALID", []any{"soldiers", index, "facing"}, nil))
		}
		if !lastDirectionNull && (!lastDirectionIsString || (lastDirection != "UP" && lastDirection != "RIGHT" && lastDirection != "DOWN" && lastDirection != "LEFT")) {
			issues = append(issues, semanticIssue("SOLDIER_SHAPE_INVALID", []any{"soldiers", index, "lastSuccessfulMoveDirection"}, nil))
		}
		if status == "ACTIVE" && playerIDs[owner] {
			activeCounts[owner]++
		}
		if positionNull || status == "FALLEN" || !positionOK {
			continue
		}
		key := semanticPositionKey(position)
		if occupied[key] {
			issues = append(issues, semanticIssue("POSITION_OCCUPANCY_DUPLICATE", []any{"soldiers", index, "position"}, nil))
		}
		occupied[key] = true
		if !semanticWithinBounds(position, bounds) {
			issues = append(issues, semanticIssue("POSITION_OUT_OF_BOUNDS", []any{"soldiers", index, "position"}, nil))
		}
		if currentTerrain[key] {
			issues = append(issues, semanticIssue("POSITION_TERRAIN_OCCUPIED", []any{"soldiers", index, "position"}, nil))
		}
	}

	counts := []int{}
	for _, raw := range players {
		player, ok := semanticMap(raw)
		if ok {
			counts = append(counts, activeCounts[stringValue(player, "id")])
		}
	}
	outcome, hasOutcome := state["outcome"]
	if phase == "COMPLETE" && (!hasOutcome || outcome == nil) {
		issues = append(issues, semanticIssue("OUTCOME_ACTIVE_COUNT_INCOHERENT", []any{"outcome"}, nil))
	} else if phase != "COMPLETE" && hasOutcome && outcome != nil {
		issues = append(issues, semanticIssue("OUTCOME_ACTIVE_COUNT_INCOHERENT", []any{"outcome"}, nil))
	} else if phase != "COMPLETE" {
		for _, count := range counts {
			if count == 0 {
				issues = append(issues, semanticIssue("OUTCOME_ACTIVE_COUNT_INCOHERENT", []any{"outcome"}, nil))
				break
			}
		}
	}
	if outcome != nil {
		outcomeMap, ok := semanticMap(outcome)
		if !ok {
			issues = append(issues, semanticIssue("OUTCOME_SHAPE_INVALID", []any{"outcome"}, nil))
		} else {
			typeName := stringValue(outcomeMap, "type")
			switch typeName {
			case "WIN":
				if !semanticExactKeys(outcomeMap, "type", "winnerPlayerId") {
					issues = append(issues, semanticIssue("OUTCOME_SHAPE_INVALID", []any{"outcome"}, nil))
				} else {
					winner := stringValue(outcomeMap, "winnerPlayerId")
					winnerIndex := -1
					for index, raw := range players {
						player, _ := semanticMap(raw)
						if stringValue(player, "id") == winner {
							winnerIndex = index
						}
					}
					if winnerIndex < 0 {
						issues = append(issues, semanticIssue("OUTCOME_WINNER_INCOHERENT", []any{"outcome", "winnerPlayerId"}, nil))
					} else if len(counts) == 2 && counts[winnerIndex] <= counts[1-winnerIndex] {
						issues = append(issues, semanticIssue("OUTCOME_ACTIVE_COUNT_INCOHERENT", []any{"outcome"}, nil))
					}
				}
			case "DRAW":
				if !semanticExactKeys(outcomeMap, "type") {
					issues = append(issues, semanticIssue("OUTCOME_SHAPE_INVALID", []any{"outcome"}, nil))
				} else if len(counts) == 2 && counts[0] != counts[1] {
					issues = append(issues, semanticIssue("OUTCOME_ACTIVE_COUNT_INCOHERENT", []any{"outcome"}, nil))
				}
			default:
				issues = append(issues, semanticIssue("OUTCOME_SHAPE_INVALID", []any{"outcome"}, nil))
			}
		}
	}
	return issues
}

func semanticIntegrityFailure(result semanticIntegrityResult) *runtimeServiceFailure {
	reason := "SEMANTIC_INTEGRITY_INVALID"
	if len(result.Issues) > 0 {
		reason = result.Issues[0].Code
	}
	return newRuntimeServiceFailure(
		"RuntimeServiceSemanticIntegrity",
		"Runtime execution evidence failed canonical semantic validation",
		true,
		map[string]any{"reason": reason, "status": semanticIntegrityPublicCategory},
	)
}

func decodeStrictJSONUseNumber(serialized []byte, destination any) error {
	if len(serialized) == 0 || !utf8.Valid(serialized) {
		return errors.New("JSON bytes are empty or invalid UTF-8")
	}
	if err := rejectDuplicateJSONKeys(serialized); err != nil {
		return err
	}
	decoder := json.NewDecoder(bytes.NewReader(serialized))
	decoder.UseNumber()
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(destination); err != nil {
		return err
	}
	if err := requireJSONEOF(decoder); err != nil {
		return err
	}
	return nil
}

func decodeStrictJSONObject(serialized []byte) (map[string]json.RawMessage, error) {
	var object map[string]json.RawMessage
	if err := decodeStrictJSONUseNumber(serialized, &object); err != nil {
		return nil, err
	}
	if object == nil {
		return nil, errors.New("JSON root is not an object")
	}
	return object, nil
}

func semanticTupleExact(reference runtimeServiceCompatibilityReference) bool {
	return reference.TupleID == inactiveCandidateTupleID && reference.Tuple == inactiveCandidateTuple
}

func semanticPrefixedSHA256(value string) bool {
	if len(value) != 71 || !strings.HasPrefix(value, "sha256:") {
		return false
	}
	_, err := hex.DecodeString(strings.TrimPrefix(value, "sha256:"))
	return err == nil && strings.ToLower(value) == value
}

func semanticStableJSONEqual(left any, right any) bool {
	leftBytes, leftErr := json.Marshal(left)
	rightBytes, rightErr := json.Marshal(right)
	return leftErr == nil && rightErr == nil && bytes.Equal(leftBytes, rightBytes)
}

func semanticCloneMap(value map[string]any) map[string]any {
	serialized, _ := json.Marshal(value)
	var clone map[string]any
	decoder := json.NewDecoder(bytes.NewReader(serialized))
	decoder.UseNumber()
	_ = decoder.Decode(&clone)
	return clone
}

func semanticHashBytes(domain string, payload []byte) string {
	hash := sha256.New()
	_, _ = io.WriteString(hash, domain)
	_, _ = hash.Write([]byte{0})
	_, _ = hash.Write(payload)
	return "sha256:" + hex.EncodeToString(hash.Sum(nil))
}

type candidateRuntimeEvidence struct {
	RawResponse       []byte
	Request           runtimeServiceRequest
	Compatibility     runtimeServiceCompatibilityReference
	Chronicle         map[string]any
	FinalState        map[string]any
	TerminalStateHash string
	Outcome           any
	ViolationCount    int64
}

type candidateRuntimeSuccessWire struct {
	OK            bool                                 `json:"ok"`
	Profile       string                               `json:"profile"`
	Counted       bool                                 `json:"counted"`
	Publishable   bool                                 `json:"publishable"`
	Privacy       string                               `json:"privacy"`
	RequestID     string                               `json:"requestId"`
	MatchID       string                               `json:"matchId"`
	Compatibility runtimeServiceCompatibilityReference `json:"compatibility"`
	Result        struct {
		Chronicle                  json.RawMessage `json:"chronicle"`
		FinalState                 json.RawMessage `json:"finalState"`
		TerminalStateHash          string          `json:"terminalStateHash"`
		Outcome                    json.RawMessage `json:"outcome"`
		RuntimeViolationEventCount json.Number     `json:"runtimeViolationEventCount"`
	} `json:"result"`
}

type candidateRuntimeFailureWire struct {
	OK          bool   `json:"ok"`
	Profile     string `json:"profile"`
	Counted     bool   `json:"counted"`
	Publishable bool   `json:"publishable"`
	Privacy     string `json:"privacy"`
	Failure     struct {
		Classification string `json:"classification"`
		Ownership      string `json:"ownership"`
		Code           string `json:"code"`
		Retryable      bool   `json:"retryable"`
		PlayerPenalty  bool   `json:"playerPenalty"`
	} `json:"failure"`
}

var candidateRuntimeFailureCodes = map[string]bool{
	"CANDIDATE_REQUEST_INVALID": true, "EVIDENCE_UNVERIFIABLE": true,
	"EVIDENCE_IDENTITY_MISMATCH": true, "EVIDENCE_REGISTRY_DRIFT": true, "EVIDENCE_REVOKED": true,
	"CANDIDATE_REVISION_INCOMPATIBLE": true, "UNSUPPORTED_RUNTIME_ADAPTER": true,
	"CANDIDATE_DRIVER_FAILURE": true, "CANDIDATE_FINAL_STATE_INVALID": true,
	"CANDIDATE_RECORDER_FAILURE": true, "CANDIDATE_REPLAY_INVALID": true,
	"EXECUTION_EXCEPTION": true,
}

func responseLooksCandidate(object map[string]json.RawMessage) bool {
	for _, key := range []string{"profile", "counted", "publishable", "privacy", "compatibility"} {
		if _, exists := object[key]; exists {
			return true
		}
	}
	return false
}

func decodeRuntimeServiceResponseBytes(request runtimeServiceRequest, payload []byte) (*runtimeServiceResponse, *runtimeServiceFailure) {
	object, err := decodeStrictJSONObject(payload)
	if err != nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceMalformedResponse", "Runtime service response did not match the execution contract", true, map[string]any{"actualBytes": len(payload)})
	}
	if responseLooksCandidate(object) {
		return decodeCandidateRuntimeServiceResponse(request, payload, object)
	}
	var decoded runtimeServiceResponse
	if err := decodeStrictJSONUseNumber(payload, &decoded); err != nil {
		return nil, newRuntimeServiceFailure("RuntimeServiceMalformedResponse", "Runtime service response did not match the execution contract", true, map[string]any{"actualBytes": len(payload)})
	}
	if failure := validateRuntimeServiceResponse(request, &decoded); failure != nil {
		return nil, failure
	}
	return &decoded, nil
}

func decodeCandidateRuntimeServiceResponse(request runtimeServiceRequest, payload []byte, object map[string]json.RawMessage) (*runtimeServiceResponse, *runtimeServiceFailure) {
	var ok bool
	if raw, exists := object["ok"]; !exists || decodeStrictJSONUseNumber(raw, &ok) != nil {
		return nil, semanticIntegrityFailure(createSemanticIntegrityResult([]semanticIntegrityIssue{
			semanticIssue("TUPLE_SHAPE_INVALID", []any{"response"}, nil),
		}))
	}
	if !ok {
		var failureWire candidateRuntimeFailureWire
		if err := decodeStrictJSONUseNumber(payload, &failureWire); err != nil ||
			failureWire.OK || failureWire.Profile != "candidate_exhibition" || failureWire.Counted || failureWire.Publishable ||
			failureWire.Privacy != "internal_candidate_exhibition" || failureWire.Failure.Classification != "system_failure" ||
			(failureWire.Failure.Ownership != "system_integrity" && failureWire.Failure.Ownership != "runtime_system" && failureWire.Failure.Ownership != "authority_system") ||
			!candidateRuntimeFailureCodes[failureWire.Failure.Code] || failureWire.Failure.PlayerPenalty {
			return nil, semanticIntegrityFailure(createSemanticIntegrityResult([]semanticIntegrityIssue{
				semanticIssue("TUPLE_SHAPE_INVALID", []any{"response"}, nil),
			}))
		}
		return &runtimeServiceResponse{
			OK: false, Profile: failureWire.Profile, Counted: failureWire.Counted,
			Publishable: failureWire.Publishable, Privacy: failureWire.Privacy,
			SystemFailure: &runtimeServiceFailure{
				Classification: failureWire.Failure.Classification, Ownership: failureWire.Failure.Ownership,
				Code: failureWire.Failure.Code, ErrorClass: failureWire.Failure.Code,
				ErrorMessage: "Candidate runtime execution failed", Retryable: failureWire.Failure.Retryable,
				PlayerPenalty: failureWire.Failure.PlayerPenalty,
			},
		}, nil
	}

	var wire candidateRuntimeSuccessWire
	if err := decodeStrictJSONUseNumber(payload, &wire); err != nil {
		return nil, semanticIntegrityFailure(createSemanticIntegrityResult([]semanticIntegrityIssue{
			semanticIssue("TUPLE_SHAPE_INVALID", []any{"response"}, nil),
		}))
	}
	if !wire.OK || wire.Profile != "candidate_exhibition" || wire.Counted || wire.Publishable ||
		wire.Privacy != "internal_candidate_exhibition" || wire.RequestID != request.RequestID || wire.MatchID != request.Match.MatchID ||
		!semanticTupleExact(wire.Compatibility) {
		return nil, semanticIntegrityFailure(createSemanticIntegrityResult([]semanticIntegrityIssue{
			semanticIssue("TUPLE_MIXED_COMPONENTS", []any{"compatibility"}, nil),
		}))
	}
	violationCount, countOK := semanticSafeInteger(wire.Result.RuntimeViolationEventCount)
	if !countOK || violationCount < 0 {
		return nil, semanticIntegrityFailure(createSemanticIntegrityResult([]semanticIntegrityIssue{
			semanticIssue("LIFECYCLE_SHAPE_INVALID", []any{"result", "runtimeViolationEventCount"}, nil),
		}))
	}
	var chronicle map[string]any
	var finalState map[string]any
	var outcome any
	if decodeStrictJSONUseNumber(wire.Result.Chronicle, &chronicle) != nil ||
		decodeStrictJSONUseNumber(wire.Result.FinalState, &finalState) != nil ||
		decodeStrictJSONUseNumber(wire.Result.Outcome, &outcome) != nil {
		return nil, semanticIntegrityFailure(createSemanticIntegrityResult([]semanticIntegrityIssue{
			semanticIssue("LIFECYCLE_SHAPE_INVALID", []any{"result"}, nil),
		}))
	}
	evidence := &candidateRuntimeEvidence{
		RawResponse: append([]byte(nil), payload...), Request: semanticCloneRuntimeServiceRequest(request), Compatibility: wire.Compatibility,
		Chronicle: chronicle, FinalState: finalState, TerminalStateHash: wire.Result.TerminalStateHash, Outcome: outcome,
		ViolationCount: violationCount,
	}
	if failure := validateCandidateRuntimeEvidence(request, evidence, violationCount); failure != nil {
		return nil, failure
	}
	return &runtimeServiceResponse{
		OK: true, Profile: wire.Profile, Counted: wire.Counted, Publishable: wire.Publishable,
		Privacy: wire.Privacy, RequestID: wire.RequestID, MatchID: wire.MatchID,
		Compatibility: &wire.Compatibility, Result: map[string]any{
			"chronicle": chronicle, "finalState": finalState, "terminalStateHash": wire.Result.TerminalStateHash,
			"outcome": outcome, "runtimeViolationEventCount": violationCount,
		}, CandidateEvidence: evidence,
	}, nil
}

func semanticCloneRuntimeServiceRequest(request runtimeServiceRequest) runtimeServiceRequest {
	serialized, err := json.Marshal(request)
	if err != nil {
		return runtimeServiceRequest{}
	}
	var clone runtimeServiceRequest
	if decodeStrictJSONUseNumber(serialized, &clone) != nil {
		return runtimeServiceRequest{}
	}
	return clone
}

func revalidateCandidateRuntimeEvidence(evidence *candidateRuntimeEvidence) *runtimeServiceFailure {
	if evidence == nil || len(evidence.RawResponse) == 0 {
		return semanticIntegrityFailure(createSemanticIntegrityResult([]semanticIntegrityIssue{
			semanticIssue("TUPLE_SHAPE_INVALID", []any{"response"}, nil),
		}))
	}
	decoded, failure := decodeRuntimeServiceResponseBytes(evidence.Request, append([]byte(nil), evidence.RawResponse...))
	if failure != nil {
		return failure
	}
	if decoded == nil || decoded.CandidateEvidence == nil || decoded.CandidateEvidence == evidence {
		return semanticIntegrityFailure(createSemanticIntegrityResult([]semanticIntegrityIssue{
			semanticIssue("TUPLE_SHAPE_INVALID", []any{"response"}, nil),
		}))
	}
	revalidated := decoded.CandidateEvidence
	if revalidated.Compatibility != evidence.Compatibility || revalidated.TerminalStateHash != evidence.TerminalStateHash ||
		revalidated.ViolationCount != evidence.ViolationCount || !bytes.Equal(revalidated.RawResponse, evidence.RawResponse) ||
		!semanticStableJSONEqual(revalidated.Chronicle, evidence.Chronicle) ||
		!semanticStableJSONEqual(revalidated.FinalState, evidence.FinalState) ||
		!semanticStableJSONEqual(revalidated.Outcome, evidence.Outcome) {
		return semanticIntegrityFailure(createSemanticIntegrityResult([]semanticIntegrityIssue{
			semanticIssue("TRANSITION_EVENT_STATE_MISMATCH", []any{"result"}, nil),
		}))
	}
	return nil
}

func validateCandidateRuntimeEvidence(request runtimeServiceRequest, evidence *candidateRuntimeEvidence, expectedViolationCount int64) *runtimeServiceFailure {
	if evidence == nil || !semanticTupleExact(evidence.Compatibility) {
		return semanticIntegrityFailure(createSemanticIntegrityResult([]semanticIntegrityIssue{
			semanticIssue("TUPLE_MIXED_COMPONENTS", []any{"compatibility"}, nil),
		}))
	}
	stateResult := validateGoCanonicalGameState(evidence.FinalState)
	if !stateResult.OK {
		return semanticIntegrityFailure(stateResult)
	}
	if stringValue(evidence.FinalState, "matchId") != request.Match.MatchID ||
		stringValue(evidence.FinalState, "seed") != request.Match.Seed ||
		!candidateFinalPlayersMatchRequest(evidence.FinalState, request) ||
		!semanticStableJSONEqual(evidence.FinalState["arenaVariant"], request.Match.ArenaVariant) {
		return semanticIntegrityFailure(createSemanticIntegrityResult([]semanticIntegrityIssue{
			semanticIssue("TUPLE_MIXED_COMPONENTS", []any{"result", "finalState"}, nil),
		}))
	}
	if !semanticStableJSONEqual(evidence.FinalState["outcome"], evidence.Outcome) {
		return semanticIntegrityFailure(createSemanticIntegrityResult([]semanticIntegrityIssue{
			semanticIssue("OUTCOME_WINNER_INCOHERENT", []any{"result", "outcome"}, nil),
		}))
	}
	hash, err := hashCandidateFinalState(evidence.FinalState)
	if err != nil || !semanticPrefixedSHA256(evidence.TerminalStateHash) || hash != evidence.TerminalStateHash {
		return semanticIntegrityFailure(createSemanticIntegrityResult([]semanticIntegrityIssue{
			semanticIssue("TRANSITION_HASH_MISMATCH", []any{"result", "terminalStateHash"}, nil),
		}))
	}
	if failure := validateCandidateChronicleAgreement(request, evidence, expectedViolationCount); failure != nil {
		return failure
	}
	return nil
}

func candidateFinalPlayersMatchRequest(finalState map[string]any, request runtimeServiceRequest) bool {
	players, ok := semanticSlice(finalState["players"])
	if !ok || len(players) != 2 {
		return false
	}
	want := map[string]struct {
		side     string
		revision string
	}{
		request.Match.BottomPlayerID: {"bottom", request.Match.BottomStrategyRevisionID},
		request.Match.TopPlayerID:    {"top", request.Match.TopStrategyRevisionID},
	}
	for _, raw := range players {
		player, ok := semanticMap(raw)
		if !ok {
			return false
		}
		expected, exists := want[stringValue(player, "id")]
		if !exists || expected.side != stringValue(player, "side") || expected.revision != stringValue(player, "strategyRevisionId") {
			return false
		}
	}
	return true
}

var candidateChronicleEventTypes = map[string]bool{
	"MATCH_STARTED": true, "ROUND_STARTED": true, "STRATEGY_EVALUATED": true,
	"ACTIVATION_STARTED": true, "ACTIVATION_SKIPPED": true, "ACTIVATION_ENDED": true,
	"CYCLE_STARTED": true, "CYCLE_ENDED": true, "AWARENESS_GRID_OBSERVED": true,
	"ACTION_EMITTED": true, "MOVE_ADVANCED": true, "MOVE_BLOCKED": true,
	"TURN_RESOLVED": true, "PUSH_RESOLVED": true, "PUSH_BLOCKED": true,
	"BACKSTAB_RESOLVED": true, "SOLDIER_STONED": true, "SOLDIER_FELL": true,
	"CONTRACTION_RESOLVED": true, "MATCH_ENDED": true, "RUNTIME_VIOLATION": true,
}

var candidatePrivateEventTypes = map[string]bool{
	"STRATEGY_EVALUATED": true, "AWARENESS_GRID_OBSERVED": true,
	"ACTION_EMITTED": true, "RUNTIME_VIOLATION": true,
}

var candidateSnapshotKinds = map[string]bool{
	"MATCH_START": true, "MATCH_END": true, "ROUND_START": true, "ROUND_END": true,
	"CONTRACTION": true, "TERMINAL": true,
}

type candidateChronicleGrammarState struct {
	phaseNumber       int64
	roundNumber       int64
	nextActivation    int64
	activations       map[string]candidateChronicleActivation
	selectionOrder    []string
	selectionIndex    int
	contractionOpen   bool
	matchStarted      bool
	matchEnded        bool
	seenEventTypes    map[string]bool
	referencedPrivate map[string]string
}

type candidateChronicleActivation struct {
	index           int64
	actingPlayerID  string
	soldierID       string
	nextCycle       int64
	cycleOpen       bool
	cycleClosed     bool
	observationSeen bool
	actionSeen      bool
	ended           bool
}

func candidateNonemptyString(value any) bool {
	text, ok := value.(string)
	return ok && text != ""
}

func candidateDirection(value any, nullable bool) bool {
	if value == nil {
		return nullable
	}
	direction, ok := value.(string)
	return ok && (direction == "UP" || direction == "RIGHT" || direction == "DOWN" || direction == "LEFT")
}

func candidateContext(value any) (map[string]any, bool) {
	context, ok := semanticMap(value)
	if !ok || !semanticOptionalKeys(context, []string{}, "phaseNumber", "roundNumber", "activationId", "activationIndex", "cycleIndex", "actingPlayerId", "soldierId") {
		return nil, false
	}
	for key, raw := range context {
		switch key {
		case "phaseNumber":
			parsed, valid := semanticSafeInteger(raw)
			if !valid || parsed < 1 {
				return nil, false
			}
		case "roundNumber":
			parsed, valid := semanticSafeInteger(raw)
			if !valid || parsed < 1 || parsed > 4 {
				return nil, false
			}
		case "activationIndex", "cycleIndex":
			parsed, valid := semanticSafeInteger(raw)
			if !valid || parsed < 0 {
				return nil, false
			}
		default:
			if !candidateNonemptyString(raw) {
				return nil, false
			}
		}
	}
	return context, true
}

func candidateContextHasExactKeys(context map[string]any, keys ...string) bool {
	return semanticExactKeys(context, keys...)
}

func candidatePayloadKeys(payload map[string]any, required []string, optional ...string) bool {
	return semanticOptionalKeys(payload, required, optional...)
}

func candidateStringFields(payload map[string]any, fields ...string) bool {
	for _, field := range fields {
		if !candidateNonemptyString(payload[field]) {
			return false
		}
	}
	return true
}

func candidateBoundsShape(value any) bool {
	bounds, ok := semanticMap(value)
	if !ok || !semanticExactKeys(bounds, "minX", "maxX", "minY", "maxY") {
		return false
	}
	_, valid := semanticBoundsValue(bounds)
	return valid
}

func candidateOutcomeShape(value any) bool {
	outcome, ok := semanticMap(value)
	if !ok {
		return false
	}
	switch stringValue(outcome, "type") {
	case "WIN":
		return semanticExactKeys(outcome, "type", "winnerPlayerId") && candidateNonemptyString(outcome["winnerPlayerId"])
	case "DRAW":
		return semanticExactKeys(outcome, "type")
	case "FAILED":
		return semanticExactKeys(outcome, "type", "reason") && candidateNonemptyString(outcome["reason"])
	default:
		return false
	}
}

func candidateActionShape(value any) bool {
	action, ok := semanticMap(value)
	if !ok {
		return false
	}
	switch stringValue(action, "type") {
	case "TURN_TO_STONE":
		return semanticExactKeys(action, "type")
	case "MOVE", "TURN":
		return semanticExactKeys(action, "type", "direction") && candidateDirection(action["direction"], false)
	default:
		return false
	}
}

func candidateEventPayloadShape(eventType string, payload map[string]any) bool {
	switch eventType {
	case "MATCH_STARTED":
		return candidatePayloadKeys(payload, []string{"matchId", "seed"}) && candidateStringFields(payload, "matchId", "seed")
	case "ROUND_STARTED":
		round, ok := semanticSafeInteger(payload["roundNumber"])
		return candidatePayloadKeys(payload, []string{"roundNumber"}) && ok && round >= 1 && round <= 4
	case "STRATEGY_EVALUATED", "ACTIVATION_STARTED":
		field := "playerId"
		if eventType == "ACTIVATION_STARTED" {
			field = "soldierId"
		}
		return candidatePayloadKeys(payload, []string{field}) && candidateStringFields(payload, field)
	case "ACTIVATION_SKIPPED":
		cycle, ok := semanticSafeInteger(payload["cycleIndex"])
		return candidatePayloadKeys(payload, []string{"soldierId", "cycleIndex", "reason"}) && candidateStringFields(payload, "soldierId", "reason") && ok && cycle >= 0
	case "ACTIVATION_ENDED":
		return candidatePayloadKeys(payload, []string{"soldierId", "reason"}) && candidateStringFields(payload, "soldierId", "reason")
	case "CYCLE_STARTED", "CYCLE_ENDED", "AWARENESS_GRID_OBSERVED":
		cycle, ok := semanticSafeInteger(payload["cycleIndex"])
		return candidatePayloadKeys(payload, []string{"soldierId", "cycleIndex"}) && candidateStringFields(payload, "soldierId") && ok && cycle >= 0
	case "ACTION_EMITTED":
		return candidatePayloadKeys(payload, []string{"soldierId", "action"}) && candidateStringFields(payload, "soldierId") && candidateActionShape(payload["action"])
	case "MOVE_ADVANCED", "TURN_RESOLVED":
		return candidatePayloadKeys(payload, []string{"soldierId", "direction"}) && candidateStringFields(payload, "soldierId") && candidateDirection(payload["direction"], false)
	case "MOVE_BLOCKED":
		if !candidatePayloadKeys(payload, []string{"soldierId", "reason"}, "targetSoldierId") || !candidateStringFields(payload, "soldierId", "reason") {
			return false
		}
		target, exists := payload["targetSoldierId"]
		return !exists || candidateNonemptyString(target)
	case "PUSH_RESOLVED":
		_, boolean := payload["pushedOffBoard"].(bool)
		return candidatePayloadKeys(payload, []string{"soldierId", "targetSoldierId", "pushedOffBoard"}) && candidateStringFields(payload, "soldierId", "targetSoldierId") && boolean
	case "PUSH_BLOCKED":
		return candidatePayloadKeys(payload, []string{"soldierId", "targetSoldierId"}) && candidateStringFields(payload, "soldierId", "targetSoldierId")
	case "BACKSTAB_RESOLVED":
		if !candidatePayloadKeys(payload, []string{"boundary", "pairs"}) {
			return false
		}
		boundary := stringValue(payload, "boundary")
		if boundary != "activation-start" && boundary != "activation-end" && boundary != "post-advance" && boundary != "cycle-start" && boundary != "cycle-end" {
			return false
		}
		pairs, ok := semanticSlice(payload["pairs"])
		if !ok {
			return false
		}
		for _, raw := range pairs {
			pair, pairOK := semanticMap(raw)
			if !pairOK || !semanticExactKeys(pair, "attackerId", "victimId") || !candidateStringFields(pair, "attackerId", "victimId") {
				return false
			}
		}
		return true
	case "SOLDIER_STONED", "SOLDIER_FELL":
		if !candidatePayloadKeys(payload, []string{"soldierId"}, "reason") || !candidateStringFields(payload, "soldierId") {
			return false
		}
		reason, exists := payload["reason"]
		return !exists || candidateNonemptyString(reason)
	case "CONTRACTION_RESOLVED":
		return candidatePayloadKeys(payload, []string{"bounds"}) && candidateBoundsShape(payload["bounds"])
	case "MATCH_ENDED":
		return candidateOutcomeShape(payload)
	case "RUNTIME_VIOLATION":
		if !candidatePayloadKeys(payload, []string{"type"}, "category", "playerId", "ownerPlayerId", "soldierId") || !candidateNonemptyString(payload["type"]) {
			return false
		}
		violationType := stringValue(payload, "type")
		if violationType != "INVALID_OUTPUT" && violationType != "TIMEOUT" && violationType != "THROWN_EXCEPTION" && violationType != "FORBIDDEN_CAPABILITY" && violationType != "OVERSIZED_OUTPUT" {
			return false
		}
		for _, field := range []string{"category", "playerId", "ownerPlayerId", "soldierId"} {
			if raw, exists := payload[field]; exists && !candidateNonemptyString(raw) {
				return false
			}
		}
		return true
	default:
		return false
	}
}

func candidateFullActivationContext(context map[string]any, soldierRequired bool) bool {
	required := []string{"phaseNumber", "roundNumber", "activationId", "activationIndex", "actingPlayerId"}
	optional := []string{"cycleIndex"}
	if soldierRequired {
		required = append(required, "soldierId")
	} else {
		optional = append(optional, "soldierId")
	}
	return semanticOptionalKeys(context, required, optional...)
}

func candidateActivationContextMatches(state *candidateChronicleGrammarState, context map[string]any, soldierRequired bool) bool {
	if !candidateFullActivationContext(context, soldierRequired) {
		return false
	}
	activationID := stringValue(context, "activationId")
	activation, exists := state.activations[activationID]
	if !exists {
		return false
	}
	phase, _ := semanticSafeInteger(context["phaseNumber"])
	round, _ := semanticSafeInteger(context["roundNumber"])
	index, _ := semanticSafeInteger(context["activationIndex"])
	if phase != state.phaseNumber || round != state.roundNumber || index != activation.index || stringValue(context, "actingPlayerId") != activation.actingPlayerID {
		return false
	}
	return context["soldierId"] == nil || stringValue(context, "soldierId") == activation.soldierID
}

func candidateSelectionMatches(state *candidateChronicleGrammarState, playerID string) bool {
	if state.selectionIndex >= len(state.selectionOrder) || playerID != state.selectionOrder[state.selectionIndex] {
		return false
	}
	state.selectionIndex++
	return true
}

func candidatePayloadContextAgrees(eventType string, context map[string]any, payload map[string]any) bool {
	if playerID := stringValue(payload, "playerId"); playerID != "" && playerID != stringValue(context, "actingPlayerId") {
		return false
	}
	if ownerID := stringValue(payload, "ownerPlayerId"); ownerID != "" && ownerID != stringValue(context, "actingPlayerId") {
		return false
	}
	if soldierID := stringValue(payload, "soldierId"); soldierID != "" && context["soldierId"] != nil {
		victimPayload := eventType == "SOLDIER_STONED" || eventType == "SOLDIER_FELL"
		if !victimPayload && soldierID != stringValue(context, "soldierId") {
			return false
		}
	}
	if payloadCycle, ok := semanticSafeInteger(payload["cycleIndex"]); ok {
		contextCycle, contextOK := semanticSafeInteger(context["cycleIndex"])
		if !contextOK || payloadCycle != contextCycle {
			return false
		}
	}
	if eventType == "ROUND_STARTED" {
		payloadRound, _ := semanticSafeInteger(payload["roundNumber"])
		contextRound, contextOK := semanticSafeInteger(context["roundNumber"])
		return contextOK && payloadRound == contextRound
	}
	return true
}

func validateCandidateEventWindow(state *candidateChronicleGrammarState, eventType string, context map[string]any, payload map[string]any) bool {
	if state.matchEnded || (eventType != "MATCH_STARTED" && !state.matchStarted) {
		return false
	}
	phase, _ := semanticSafeInteger(context["phaseNumber"])
	round, _ := semanticSafeInteger(context["roundNumber"])
	activationIndex, _ := semanticSafeInteger(context["activationIndex"])
	cycleIndex, cycleOK := semanticSafeInteger(context["cycleIndex"])
	switch eventType {
	case "MATCH_STARTED":
		if state.matchStarted || !candidateContextHasExactKeys(context) {
			return false
		}
		state.matchStarted = true
	case "ROUND_STARTED":
		if !candidateContextHasExactKeys(context, "phaseNumber", "roundNumber") {
			return false
		}
		if state.phaseNumber != 0 {
			if state.selectionIndex != len(state.selectionOrder) {
				return false
			}
			if state.contractionOpen {
				if phase != state.phaseNumber+1 || round != 1 {
					return false
				}
			} else if phase != state.phaseNumber || round != state.roundNumber+1 {
				return false
			}
		} else if phase != 1 || round != 1 {
			return false
		}
		state.phaseNumber, state.roundNumber, state.nextActivation, state.contractionOpen = phase, round, 0, false
		state.selectionIndex = 0
		state.activations = map[string]candidateChronicleActivation{}
	case "STRATEGY_EVALUATED":
		if !candidateContextHasExactKeys(context, "phaseNumber", "roundNumber", "actingPlayerId") || phase != state.phaseNumber || round != state.roundNumber || !candidateSelectionMatches(state, stringValue(context, "actingPlayerId")) {
			return false
		}
	case "ACTIVATION_STARTED":
		if !candidateContextHasExactKeys(context, "phaseNumber", "roundNumber", "activationId", "activationIndex", "actingPlayerId", "soldierId") || phase != state.phaseNumber || round != state.roundNumber || state.selectionIndex != len(state.selectionOrder) {
			return false
		}
		quota := map[int64]int64{1: 1, 2: 2, 3: 3, 4: 4}[round]
		activationID := stringValue(context, "activationId")
		if activationIndex != state.nextActivation || activationIndex >= quota*2 || activationID != fmt.Sprintf("%d:%d:%d", phase, round, activationIndex) || stringValue(context, "soldierId") != stringValue(payload, "soldierId") {
			return false
		}
		if _, duplicate := state.activations[activationID]; duplicate {
			return false
		}
		state.activations[activationID] = candidateChronicleActivation{
			index: activationIndex, actingPlayerID: stringValue(context, "actingPlayerId"), soldierID: stringValue(context, "soldierId"),
		}
		state.nextActivation++
	case "ACTIVATION_SKIPPED", "ACTIVATION_ENDED":
		if !candidateActivationContextMatches(state, context, true) {
			return false
		}
		activationID := stringValue(context, "activationId")
		activation := state.activations[activationID]
		if eventType == "ACTIVATION_SKIPPED" {
			if !cycleOK || cycleIndex > 11 || !activation.ended || cycleIndex != activation.nextCycle {
				return false
			}
			activation.nextCycle++
			activation.cycleClosed = false
		} else {
			if activation.ended || cycleOK {
				return false
			}
			activation.ended = true
			if activation.cycleOpen || !activation.cycleClosed {
				activation.nextCycle++
			}
			activation.cycleOpen = false
			activation.cycleClosed = false
		}
		state.activations[activationID] = activation
	case "CYCLE_STARTED", "CYCLE_ENDED", "AWARENESS_GRID_OBSERVED", "ACTION_EMITTED":
		if !candidateActivationContextMatches(state, context, true) || !cycleOK || cycleIndex > 11 {
			return false
		}
		activationID := stringValue(context, "activationId")
		activation := state.activations[activationID]
		switch eventType {
		case "CYCLE_STARTED":
			if activation.ended || activation.cycleOpen || cycleIndex != activation.nextCycle {
				return false
			}
			activation.cycleOpen, activation.cycleClosed = true, false
			activation.observationSeen, activation.actionSeen = false, false
		case "AWARENESS_GRID_OBSERVED":
			if activation.ended || !activation.cycleOpen || activation.observationSeen || activation.actionSeen || cycleIndex != activation.nextCycle {
				return false
			}
			activation.observationSeen = true
		case "ACTION_EMITTED":
			if activation.ended || !activation.cycleOpen || !activation.observationSeen || activation.actionSeen || cycleIndex != activation.nextCycle {
				return false
			}
			activation.actionSeen = true
		case "CYCLE_ENDED":
			if activation.ended || !activation.cycleOpen || !activation.actionSeen || cycleIndex != activation.nextCycle {
				return false
			}
			activation.cycleOpen, activation.cycleClosed = false, true
			activation.nextCycle++
		}
		state.activations[activationID] = activation
	case "MOVE_ADVANCED", "MOVE_BLOCKED", "TURN_RESOLVED", "PUSH_RESOLVED", "PUSH_BLOCKED", "SOLDIER_STONED":
		if !candidateActivationContextMatches(state, context, true) {
			return false
		}
	case "BACKSTAB_RESOLVED":
		if !candidateActivationContextMatches(state, context, false) {
			return false
		}
	case "SOLDIER_FELL":
		if context["activationId"] != nil {
			if !candidateActivationContextMatches(state, context, true) {
				return false
			}
		} else if !state.contractionOpen || !candidateContextHasExactKeys(context, "phaseNumber") || phase != state.phaseNumber {
			return false
		}
	case "CONTRACTION_RESOLVED":
		if !candidateContextHasExactKeys(context, "phaseNumber") || phase != state.phaseNumber || state.roundNumber != 4 || state.selectionIndex != len(state.selectionOrder) {
			return false
		}
		state.contractionOpen = true
		state.roundNumber = 0
		state.activations = map[string]candidateChronicleActivation{}
	case "RUNTIME_VIOLATION":
		strategyContext := candidateContextHasExactKeys(context, "phaseNumber", "roundNumber", "actingPlayerId")
		activationContext := context["soldierId"] != nil && candidateActivationContextMatches(state, context, true)
		if phase != state.phaseNumber || round != state.roundNumber || stringValue(context, "actingPlayerId") == "" || (!strategyContext && !activationContext) {
			return false
		}
		if strategyContext && !candidateSelectionMatches(state, stringValue(context, "actingPlayerId")) {
			return false
		}
	case "MATCH_ENDED":
		validContext := candidateContextHasExactKeys(context) || candidateContextHasExactKeys(context, "phaseNumber") || candidateContextHasExactKeys(context, "phaseNumber", "roundNumber") || candidateFullActivationContext(context, false) || candidateFullActivationContext(context, true)
		if !validContext {
			return false
		}
		if context["phaseNumber"] != nil && phase != state.phaseNumber {
			return false
		}
		if context["roundNumber"] != nil && round != state.roundNumber {
			return false
		}
		if state.roundNumber != 0 && state.selectionIndex != len(state.selectionOrder) {
			return false
		}
		if context["activationId"] != nil && !candidateActivationContextMatches(state, context, context["soldierId"] != nil) {
			return false
		}
		state.matchEnded = true
		state.activations = map[string]candidateChronicleActivation{}
	default:
		return false
	}
	state.seenEventTypes[eventType] = true
	return true
}

func validateCandidateChronicleEvents(chronicle map[string]any, request runtimeServiceRequest) (map[string]string, error) {
	events, ok := semanticSlice(chronicle["events"])
	if !ok || len(events) < 2 {
		return nil, errors.New("candidate Chronicle events are missing")
	}
	state := candidateChronicleGrammarState{
		activations: map[string]candidateChronicleActivation{}, selectionOrder: []string{request.Match.BottomPlayerID, request.Match.TopPlayerID},
		seenEventTypes: map[string]bool{}, referencedPrivate: map[string]string{},
	}
	for index, raw := range events {
		event, eventOK := semanticMap(raw)
		if !eventOK || !semanticOptionalKeys(event, []string{"type", "sequence", "context", "privacy", "payload"}, "privateRef") {
			return nil, errors.New("candidate Chronicle event shape is invalid")
		}
		eventType := stringValue(event, "type")
		sequence, sequenceOK := semanticSafeInteger(event["sequence"])
		context, contextOK := candidateContext(event["context"])
		payload, payloadOK := semanticMap(event["payload"])
		privacy := stringValue(event, "privacy")
		if !candidateChronicleEventTypes[eventType] || !sequenceOK || sequence != int64(index) || !contextOK || !payloadOK || !candidateEventPayloadShape(eventType, payload) || !candidatePayloadContextAgrees(eventType, context, payload) {
			return nil, errors.New("candidate Chronicle event contract is invalid")
		}
		_, hasPrivateRef := event["privateRef"]
		if candidatePrivateEventTypes[eventType] {
			reference := stringValue(event, "privateRef")
			if privacy != "owner" || !hasPrivateRef || reference != fmt.Sprintf("private:event:%d", index) {
				return nil, errors.New("candidate Chronicle private event contract is invalid")
			}
			if _, duplicate := state.referencedPrivate[reference]; duplicate {
				return nil, errors.New("candidate Chronicle private reference is duplicated")
			}
			state.referencedPrivate[reference] = stringValue(context, "actingPlayerId")
		} else if privacy != "public" || hasPrivateRef {
			return nil, errors.New("candidate Chronicle public event contract is invalid")
		}
		if eventType == "MATCH_STARTED" && (stringValue(payload, "matchId") != request.Match.MatchID || stringValue(payload, "seed") != request.Match.Seed) {
			return nil, errors.New("candidate Chronicle Match identity is invalid")
		}
		if !validateCandidateEventWindow(&state, eventType, context, payload) {
			return nil, errors.New("candidate Chronicle event window is invalid")
		}
	}
	for _, required := range []string{"MATCH_STARTED", "ROUND_STARTED", "MATCH_ENDED"} {
		if !state.seenEventTypes[required] {
			return nil, errors.New("candidate Chronicle required event is missing")
		}
	}
	if !state.matchEnded || stringValue(events[0].(map[string]any), "type") != "MATCH_STARTED" || stringValue(events[len(events)-1].(map[string]any), "type") != "MATCH_ENDED" {
		return nil, errors.New("candidate Chronicle terminal event is invalid")
	}
	return state.referencedPrivate, nil
}

func candidateSnapshotBoard(value any) (map[string]any, bool) {
	board, ok := semanticMap(value)
	if !ok || !semanticExactKeys(board, "bounds", "soldiers", "terrainStones") || !candidateBoundsShape(board["bounds"]) {
		return nil, false
	}
	bounds, _ := semanticBoundsValue(board["bounds"])
	soldiers, soldiersOK := semanticSlice(board["soldiers"])
	terrain, terrainOK := semanticSlice(board["terrainStones"])
	if !soldiersOK || !terrainOK {
		return nil, false
	}
	terrainPositions := map[string]bool{}
	for _, raw := range terrain {
		position, positionOK := semanticPositionValue(raw)
		if !positionOK || !semanticWithinBounds(position, bounds) || terrainPositions[semanticPositionKey(position)] {
			return nil, false
		}
		terrainPositions[semanticPositionKey(position)] = true
	}
	seen := map[string]bool{}
	occupied := map[string]bool{}
	for _, raw := range soldiers {
		soldier, soldierOK := semanticMap(raw)
		if !soldierOK || !semanticExactKeys(soldier, "id", "ownerPlayerId", "status", "position", "facing", "lastSuccessfulMoveDirection") || !candidateStringFields(soldier, "id", "ownerPlayerId") {
			return nil, false
		}
		status := stringValue(soldier, "status")
		if (status != "ACTIVE" && status != "STONE" && status != "FALLEN") || !candidateDirection(soldier["facing"], true) || !candidateDirection(soldier["lastSuccessfulMoveDirection"], true) {
			return nil, false
		}
		position, positionOK := semanticPositionValue(soldier["position"])
		if status == "FALLEN" {
			if soldier["position"] != nil {
				return nil, false
			}
		} else {
			if !positionOK || soldier["facing"] == nil || !semanticWithinBounds(position, bounds) {
				return nil, false
			}
			positionKey := semanticPositionKey(position)
			if occupied[positionKey] || terrainPositions[positionKey] {
				return nil, false
			}
			occupied[positionKey] = true
		}
		if seen[stringValue(soldier, "id")] {
			return nil, false
		}
		seen[stringValue(soldier, "id")] = true
	}
	return board, true
}

func candidateInitialBoard(finalState map[string]any) (map[string]any, error) {
	arena, arenaOK := semanticMap(finalState["arenaVariant"])
	initialBounds, boundsOK := semanticMap(arena["initialBounds"])
	if !arenaOK || !boundsOK {
		return nil, errors.New("candidate initial arena is invalid")
	}
	playersByID := map[string]string{}
	for _, raw := range sliceValue(finalState, "players") {
		player, ok := semanticMap(raw)
		if ok {
			playersByID[stringValue(player, "id")] = stringValue(player, "side")
		}
	}
	counts := map[string]int64{"bottom": 0, "top": 0}
	soldiers := []any{}
	for _, raw := range sliceValue(finalState, "soldiers") {
		soldier, ok := semanticMap(raw)
		if !ok {
			return nil, errors.New("candidate initial Soldier is invalid")
		}
		side := playersByID[stringValue(soldier, "ownerPlayerId")]
		if side != "bottom" && side != "top" {
			return nil, errors.New("candidate initial Soldier owner is invalid")
		}
		bounds, validBounds := semanticBoundsValue(initialBounds)
		if !validBounds {
			return nil, errors.New("candidate initial bounds are invalid")
		}
		position := map[string]any{"x": bounds.MinX + 2 + counts[side], "y": bounds.MinY}
		facing := "DOWN"
		if side == "bottom" {
			position["y"] = bounds.MaxY
			facing = "UP"
		}
		counts[side]++
		soldiers = append(soldiers, map[string]any{
			"id": stringValue(soldier, "id"), "ownerPlayerId": stringValue(soldier, "ownerPlayerId"),
			"status": "ACTIVE", "position": position, "facing": facing, "lastSuccessfulMoveDirection": nil,
		})
	}
	return map[string]any{"bounds": initialBounds, "soldiers": soldiers, "terrainStones": arena["terrainStones"]}, nil
}

func candidateEventSameRound(event map[string]any, phase int64, round int64) bool {
	context, ok := semanticMap(event["context"])
	if !ok {
		return false
	}
	eventPhase, phaseOK := semanticSafeInteger(context["phaseNumber"])
	eventRound, roundOK := semanticSafeInteger(context["roundNumber"])
	return phaseOK && roundOK && eventPhase == phase && eventRound == round
}

func candidateRoundEndSequence(events []any, startIndex int) (int64, bool) {
	start := events[startIndex].(map[string]any)
	context := start["context"].(map[string]any)
	phase, _ := semanticSafeInteger(context["phaseNumber"])
	round, _ := semanticSafeInteger(context["roundNumber"])
	last := int64(-1)
	for index := startIndex; index < len(events); index++ {
		event := events[index].(map[string]any)
		typeName := stringValue(event, "type")
		if index > startIndex && (typeName == "ROUND_STARTED" || typeName == "CONTRACTION_RESOLVED") {
			return last, last >= 0
		}
		if typeName == "MATCH_ENDED" {
			if candidateEventSameRound(event, phase, round) {
				return int64(index), true
			}
			return last, last >= 0
		}
		if candidateEventSameRound(event, phase, round) {
			last = int64(index)
		}
	}
	return last, last >= 0
}

type candidateExpectedSnapshot struct {
	kind     string
	sequence int64
	context  map[string]any
}

func candidateExpectedSnapshots(events []any) ([]candidateExpectedSnapshot, error) {
	expected := []candidateExpectedSnapshot{{kind: "MATCH_START", sequence: 0, context: map[string]any{}}}
	for index, raw := range events {
		event := raw.(map[string]any)
		context := event["context"].(map[string]any)
		switch stringValue(event, "type") {
		case "ROUND_STARTED":
			end, ok := candidateRoundEndSequence(events, index)
			if !ok {
				return nil, errors.New("candidate Chronicle Round boundary is invalid")
			}
			roundContext := map[string]any{"phaseNumber": context["phaseNumber"], "roundNumber": context["roundNumber"]}
			expected = append(expected,
				candidateExpectedSnapshot{kind: "ROUND_START", sequence: int64(index), context: roundContext},
				candidateExpectedSnapshot{kind: "ROUND_END", sequence: end, context: roundContext},
			)
		case "CONTRACTION_RESOLVED":
			expected = append(expected, candidateExpectedSnapshot{kind: "CONTRACTION", sequence: int64(index), context: map[string]any{"phaseNumber": context["phaseNumber"]}})
		}
	}
	terminal := int64(len(events) - 1)
	expected = append(expected,
		candidateExpectedSnapshot{kind: "MATCH_END", sequence: terminal, context: map[string]any{}},
		candidateExpectedSnapshot{kind: "TERMINAL", sequence: terminal, context: map[string]any{}},
	)
	return expected, nil
}

func validateCandidateChronicleSnapshots(chronicle map[string]any, finalState map[string]any, outcome any) error {
	events := sliceValue(chronicle, "events")
	snapshots, ok := semanticSlice(chronicle["snapshots"])
	if !ok {
		return errors.New("candidate Chronicle snapshots are missing")
	}
	expected, err := candidateExpectedSnapshots(events)
	if err != nil || len(snapshots) != len(expected) {
		return errors.New("candidate Chronicle snapshot set is invalid")
	}
	initialBoard, err := candidateInitialBoard(finalState)
	if err != nil {
		return err
	}
	finalBoard := candidateFinalBoard(finalState)
	expectedSoldiers := map[string]string{}
	for _, raw := range sliceValue(finalState, "soldiers") {
		soldier, soldierOK := semanticMap(raw)
		if !soldierOK {
			return errors.New("candidate final Soldier set is invalid")
		}
		expectedSoldiers[stringValue(soldier, "id")] = stringValue(soldier, "ownerPlayerId")
	}
	for index, raw := range snapshots {
		snapshot, snapshotOK := semanticMap(raw)
		if !snapshotOK || !semanticOptionalKeys(snapshot, []string{"kind", "sequence", "context", "board"}, "outcome") {
			return errors.New("candidate Chronicle snapshot shape is invalid")
		}
		kind := stringValue(snapshot, "kind")
		sequence, sequenceOK := semanticSafeInteger(snapshot["sequence"])
		context, contextOK := candidateContext(snapshot["context"])
		board, boardOK := candidateSnapshotBoard(snapshot["board"])
		want := expected[index]
		if !candidateSnapshotKinds[kind] || !sequenceOK || !contextOK || !boardOK || kind != want.kind || sequence != want.sequence || !semanticStableJSONEqual(context, want.context) {
			return errors.New("candidate Chronicle snapshot boundary is invalid")
		}
		boardSoldiers := sliceValue(board, "soldiers")
		if len(boardSoldiers) != len(expectedSoldiers) || !semanticStableJSONEqual(board["terrainStones"], finalState["terrainStones"]) {
			return errors.New("candidate Chronicle snapshot authority is invalid")
		}
		for _, rawSoldier := range boardSoldiers {
			soldier := rawSoldier.(map[string]any)
			if expectedSoldiers[stringValue(soldier, "id")] != stringValue(soldier, "ownerPlayerId") {
				return errors.New("candidate Chronicle snapshot Soldier identity is invalid")
			}
		}
		if kind == "MATCH_START" && !semanticStableJSONEqual(board, initialBoard) {
			return errors.New("candidate Chronicle Match-start reconstruction is invalid")
		}
		if kind == "MATCH_END" || kind == "TERMINAL" {
			if !semanticStableJSONEqual(board, finalBoard) || !semanticStableJSONEqual(snapshot["outcome"], outcome) {
				return errors.New("candidate Chronicle terminal reconstruction is invalid")
			}
		} else if _, hasOutcome := snapshot["outcome"]; hasOutcome {
			return errors.New("candidate Chronicle nonterminal outcome is invalid")
		}
	}
	return nil
}

func validateCandidateChroniclePrivate(chronicle map[string]any, references map[string]string) error {
	rawPrivate, hasPrivate := chronicle["private"]
	if len(references) == 0 {
		if hasPrivate {
			return errors.New("candidate Chronicle has unreferenced private data")
		}
		return nil
	}
	private, ok := semanticMap(rawPrivate)
	if !hasPrivate || !ok || !semanticExactKeys(private, "byPlayerId") {
		return errors.New("candidate Chronicle private section is invalid")
	}
	byPlayer, ok := semanticMap(private["byPlayerId"])
	if !ok {
		return errors.New("candidate Chronicle private ownership is invalid")
	}
	seen := map[string]bool{}
	for playerID, raw := range byPlayer {
		entries, entriesOK := semanticMap(raw)
		if !entriesOK || playerID == "" || len(entries) == 0 {
			return errors.New("candidate Chronicle private owner is invalid")
		}
		for reference := range entries {
			if references[reference] != playerID || seen[reference] {
				return errors.New("candidate Chronicle private reference is invalid")
			}
			seen[reference] = true
		}
	}
	if len(seen) != len(references) {
		return errors.New("candidate Chronicle private reference is missing")
	}
	return nil
}

func validateCandidateChronicleContract(request runtimeServiceRequest, evidence *candidateRuntimeEvidence) error {
	chronicle := evidence.Chronicle
	if !semanticOptionalKeys(chronicle, []string{"schemaVersion", "reproducibility", "events", "snapshots"}, "private") || stringValue(chronicle, "schemaVersion") != "chronicle-v1.4" {
		return errors.New("candidate Chronicle shape is invalid")
	}
	reproducibility, ok := semanticMap(chronicle["reproducibility"])
	if !ok || !semanticExactKeys(reproducibility, "matchId", "seed", "arenaVariantId", "arenaVariantVersion", "strategyRevisionIds", "versions") {
		return errors.New("candidate Chronicle reproducibility is invalid")
	}
	revisions, revisionsOK := semanticSlice(reproducibility["strategyRevisionIds"])
	if !revisionsOK || len(revisions) != 2 || stringValue(reproducibility, "matchId") != request.Match.MatchID || stringValue(reproducibility, "seed") != request.Match.Seed || stringValue(reproducibility, "arenaVariantId") != stringValue(request.Match.ArenaVariant, "id") || stringValue(reproducibility, "arenaVariantVersion") != stringValue(mapValue(evidence.FinalState, "versions"), "arenaVariant") || stringFromAny(revisions[0]) != request.Match.BottomStrategyRevisionID || stringFromAny(revisions[1]) != request.Match.TopStrategyRevisionID || !semanticStableJSONEqual(reproducibility["versions"], evidence.FinalState["versions"]) {
		return errors.New("candidate Chronicle reproducibility identity is invalid")
	}
	references, err := validateCandidateChronicleEvents(chronicle, request)
	if err != nil {
		return err
	}
	if err := validateCandidateChroniclePrivate(chronicle, references); err != nil {
		return err
	}
	return validateCandidateChronicleSnapshots(chronicle, evidence.FinalState, evidence.Outcome)
}

func validateCandidateChronicleAgreement(request runtimeServiceRequest, evidence *candidateRuntimeEvidence, expectedViolationCount int64) *runtimeServiceFailure {
	if err := validateCandidateChronicleContract(request, evidence); err != nil {
		return semanticIntegrityFailure(createSemanticIntegrityResult([]semanticIntegrityIssue{
			semanticIssue("TRANSITION_EVENT_STATE_MISMATCH", []any{"result", "chronicle"}, nil),
		}))
	}
	metadata, err := createGoChronicleMetadata(evidence.Chronicle)
	if err != nil || metadata.MatchID != request.Match.MatchID || metadata.ArenaVariantID != stringValue(request.Match.ArenaVariant, "id") ||
		metadata.BottomPlayerID != request.Match.BottomPlayerID || metadata.TopPlayerID != request.Match.TopPlayerID ||
		metadata.BottomStrategyRevisionID != request.Match.BottomStrategyRevisionID || metadata.TopStrategyRevisionID != request.Match.TopStrategyRevisionID {
		return semanticIntegrityFailure(createSemanticIntegrityResult([]semanticIntegrityIssue{
			semanticIssue("TRANSITION_EVENT_STATE_MISMATCH", []any{"result", "chronicle"}, nil),
		}))
	}
	if !semanticStableJSONEqual(metadata.Outcome, evidence.Outcome) {
		return semanticIntegrityFailure(createSemanticIntegrityResult([]semanticIntegrityIssue{
			semanticIssue("OUTCOME_WINNER_INCOHERENT", []any{"result", "chronicle", "outcome"}, nil),
		}))
	}
	events, ok := semanticSlice(evidence.Chronicle["events"])
	if !ok || len(events) == 0 {
		return semanticIntegrityFailure(createSemanticIntegrityResult([]semanticIntegrityIssue{
			semanticIssue("TRANSITION_SHAPE_INVALID", []any{"result", "chronicle", "events"}, nil),
		}))
	}
	violations := int64(0)
	for _, raw := range events {
		event, eventOK := semanticMap(raw)
		if eventOK && stringValue(event, "type") == "RUNTIME_VIOLATION" {
			violations++
		}
	}
	last, lastOK := semanticMap(events[len(events)-1])
	if !lastOK || stringValue(last, "type") != "MATCH_ENDED" || !semanticStableJSONEqual(last["payload"], evidence.Outcome) || violations != expectedViolationCount {
		return semanticIntegrityFailure(createSemanticIntegrityResult([]semanticIntegrityIssue{
			semanticIssue("TRANSITION_EVENT_STATE_MISMATCH", []any{"result", "chronicle", "events"}, nil),
		}))
	}
	snapshots, ok := semanticSlice(evidence.Chronicle["snapshots"])
	if !ok {
		return semanticIntegrityFailure(createSemanticIntegrityResult([]semanticIntegrityIssue{
			semanticIssue("TRANSITION_SHAPE_INVALID", []any{"result", "chronicle", "snapshots"}, nil),
		}))
	}
	var terminal map[string]any
	for _, raw := range snapshots {
		snapshot, snapshotOK := semanticMap(raw)
		if snapshotOK && stringValue(snapshot, "kind") == "TERMINAL" {
			terminal = snapshot
		}
	}
	if terminal == nil || !semanticStableJSONEqual(terminal["outcome"], evidence.Outcome) ||
		!semanticStableJSONEqual(terminal["board"], candidateFinalBoard(evidence.FinalState)) {
		return semanticIntegrityFailure(createSemanticIntegrityResult([]semanticIntegrityIssue{
			semanticIssue("TRANSITION_EVENT_STATE_MISMATCH", []any{"result", "chronicle", "snapshots"}, nil),
		}))
	}
	return nil
}

func candidateFinalBoard(finalState map[string]any) map[string]any {
	projectedSoldiers := []any{}
	if soldiers, ok := semanticSlice(finalState["soldiers"]); ok {
		for _, raw := range soldiers {
			soldier, soldierOK := semanticMap(raw)
			if !soldierOK {
				continue
			}
			projectedSoldiers = append(projectedSoldiers, map[string]any{
				"id": stringValue(soldier, "id"), "ownerPlayerId": stringValue(soldier, "ownerPlayerId"),
				"status": soldier["status"], "position": soldier["position"], "facing": soldier["facing"],
				"lastSuccessfulMoveDirection": soldier["lastSuccessfulMoveDirection"],
			})
		}
	}
	return map[string]any{"bounds": finalState["bounds"], "soldiers": projectedSoldiers, "terrainStones": finalState["terrainStones"]}
}

type candidateProjectionVersions struct {
	Spec             string `json:"spec"`
	Engine           string `json:"engine"`
	RuntimeJS        string `json:"runtimeJs"`
	Chronicle        string `json:"chronicle"`
	StrategyRevision string `json:"strategyRevision"`
	ArenaVariant     string `json:"arenaVariant"`
}

type candidateProjectionBounds struct {
	MinX int64 `json:"minX"`
	MaxX int64 `json:"maxX"`
	MinY int64 `json:"minY"`
	MaxY int64 `json:"maxY"`
}

type candidateProjectionPosition struct {
	X int64 `json:"x"`
	Y int64 `json:"y"`
}

type candidateProjectionArena struct {
	ID            string                        `json:"id"`
	Name          string                        `json:"name"`
	InitialBounds candidateProjectionBounds     `json:"initialBounds"`
	TerrainStones []candidateProjectionPosition `json:"terrainStones"`
}

type candidateProjectionPlayer struct {
	ID                 string `json:"id"`
	Side               string `json:"side"`
	StrategyRevisionID string `json:"strategyRevisionId"`
}

type candidateProjectionSoldier struct {
	ID                          string                       `json:"id"`
	OwnerPlayerID               string                       `json:"ownerPlayerId"`
	Status                      string                       `json:"status"`
	Position                    *candidateProjectionPosition `json:"position"`
	Facing                      any                          `json:"facing"`
	LastSuccessfulMoveDirection any                          `json:"lastSuccessfulMoveDirection"`
}

type candidateStateProjection struct {
	MatchID            string                        `json:"matchId"`
	Seed               string                        `json:"seed"`
	Versions           candidateProjectionVersions   `json:"versions"`
	ArenaVariant       candidateProjectionArena      `json:"arenaVariant"`
	Players            []candidateProjectionPlayer   `json:"players"`
	Phase              string                        `json:"phase"`
	PhaseNumber        int64                         `json:"phaseNumber"`
	RoundNumber        int64                         `json:"roundNumber"`
	ActivationCount    int64                         `json:"activationCount"`
	InitiativePlayerID string                        `json:"initiativePlayerId"`
	Bounds             candidateProjectionBounds     `json:"bounds"`
	Soldiers           []candidateProjectionSoldier  `json:"soldiers"`
	TerrainStones      []candidateProjectionPosition `json:"terrainStones"`
	Outcome            any                           `json:"outcome"`
}

func hashCandidateFinalState(finalState map[string]any) (string, error) {
	projection, err := candidateStateProjectionFromMap(finalState)
	if err != nil {
		return "", err
	}
	serialized, err := json.Marshal(projection)
	if err != nil {
		return "", err
	}
	return semanticHashBytes("cowards-game:candidate-game-state-projection:v1", serialized), nil
}

func candidateStateProjectionFromMap(state map[string]any) (candidateStateProjection, error) {
	versions := mapValue(state, "versions")
	arena := mapValue(state, "arenaVariant")
	initialBounds, initialOK := semanticBoundsValue(arena["initialBounds"])
	bounds, boundsOK := semanticBoundsValue(state["bounds"])
	phaseNumber, phaseOK := semanticSafeInteger(state["phaseNumber"])
	roundNumber, roundOK := semanticSafeInteger(state["roundNumber"])
	activationCount, activationOK := semanticSafeInteger(state["activationCount"])
	if !initialOK || !boundsOK || !phaseOK || !roundOK || !activationOK {
		return candidateStateProjection{}, errors.New("candidate state projection is invalid")
	}
	positionList := func(value any) ([]candidateProjectionPosition, error) {
		entries, ok := semanticSlice(value)
		if !ok {
			return nil, errors.New("candidate positions are invalid")
		}
		result := make([]candidateProjectionPosition, 0, len(entries))
		for _, raw := range entries {
			position, positionOK := semanticPositionValue(raw)
			if !positionOK {
				return nil, errors.New("candidate position is invalid")
			}
			result = append(result, candidateProjectionPosition{position.X, position.Y})
		}
		sort.Slice(result, func(left, right int) bool {
			return result[left].X < result[right].X || (result[left].X == result[right].X && result[left].Y < result[right].Y)
		})
		return result, nil
	}
	arenaTerrain, err := positionList(arena["terrainStones"])
	if err != nil {
		return candidateStateProjection{}, err
	}
	terrain, err := positionList(state["terrainStones"])
	if err != nil {
		return candidateStateProjection{}, err
	}
	players := []candidateProjectionPlayer{}
	for _, raw := range sliceValue(state, "players") {
		player, ok := semanticMap(raw)
		if !ok {
			return candidateStateProjection{}, errors.New("candidate player is invalid")
		}
		players = append(players, candidateProjectionPlayer{stringValue(player, "id"), stringValue(player, "side"), stringValue(player, "strategyRevisionId")})
	}
	sort.Slice(players, func(left, right int) bool { return players[left].ID < players[right].ID })
	soldiers := []candidateProjectionSoldier{}
	for _, raw := range sliceValue(state, "soldiers") {
		soldier, ok := semanticMap(raw)
		if !ok {
			return candidateStateProjection{}, errors.New("candidate Soldier is invalid")
		}
		var position *candidateProjectionPosition
		if soldier["position"] != nil {
			parsed, parsedOK := semanticPositionValue(soldier["position"])
			if !parsedOK {
				return candidateStateProjection{}, errors.New("candidate Soldier position is invalid")
			}
			position = &candidateProjectionPosition{parsed.X, parsed.Y}
		}
		soldiers = append(soldiers, candidateProjectionSoldier{
			ID: stringValue(soldier, "id"), OwnerPlayerID: stringValue(soldier, "ownerPlayerId"), Status: stringValue(soldier, "status"),
			Position: position, Facing: soldier["facing"], LastSuccessfulMoveDirection: soldier["lastSuccessfulMoveDirection"],
		})
	}
	sort.Slice(soldiers, func(left, right int) bool { return soldiers[left].ID < soldiers[right].ID })
	return candidateStateProjection{
		MatchID: stringValue(state, "matchId"), Seed: stringValue(state, "seed"),
		Versions: candidateProjectionVersions{
			Spec: stringValue(versions, "spec"), Engine: stringValue(versions, "engine"), RuntimeJS: stringValue(versions, "runtimeJs"),
			Chronicle: stringValue(versions, "chronicle"), StrategyRevision: stringValue(versions, "strategyRevision"), ArenaVariant: stringValue(versions, "arenaVariant"),
		},
		ArenaVariant: candidateProjectionArena{
			ID: stringValue(arena, "id"), Name: stringValue(arena, "name"),
			InitialBounds: candidateProjectionBounds{initialBounds.MinX, initialBounds.MaxX, initialBounds.MinY, initialBounds.MaxY}, TerrainStones: arenaTerrain,
		},
		Players: players, Phase: stringValue(state, "phase"), PhaseNumber: phaseNumber, RoundNumber: roundNumber, ActivationCount: activationCount,
		InitiativePlayerID: stringValue(state, "initiativePlayerId"), Bounds: candidateProjectionBounds{bounds.MinX, bounds.MaxX, bounds.MinY, bounds.MaxY},
		Soldiers: soldiers, TerrainStones: terrain, Outcome: state["outcome"],
	}, nil
}
