package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"sort"
	"strconv"
	"strings"
	"unicode/utf8"
)

const semanticIntegrityPublicCategory = "CANONICAL_INTEGRITY_FAILURE"
const semanticIntegrityOwnership = "system_integrity"

const currentCanonicalTupleID = "sha256:922a6857fdbc8354b744d6e766bff216f3fee85b5ed381355cb427f5a616b3ae"

var currentCanonicalTuple = canonicalCompatibilityTuple{
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

func responseHasRetiredProfileFields(object map[string]json.RawMessage) bool {
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
	if responseHasRetiredProfileFields(object) {
		return nil, semanticIntegrityFailure(createSemanticIntegrityResult([]semanticIntegrityIssue{
			semanticIssue("TUPLE_SHAPE_INVALID", []any{"response"}, nil),
		}))
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
