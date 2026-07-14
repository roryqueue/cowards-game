package main

import (
	"bytes"
	"encoding/json"
	"math"
	"sort"
	"strconv"
	"strings"
	"unicode/utf8"
)

type canonicalJSONV11Context string

const (
	canonicalJSONV11DecodedStrategyPayload     canonicalJSONV11Context = "decoded-strategy-payload"
	canonicalJSONV11AuthenticatedOuterEnvelope canonicalJSONV11Context = "authenticated-outer-envelope"
	canonicalJSONV11CanonicalManifest          canonicalJSONV11Context = "canonical-manifest"
	canonicalJSONV11HostAPIValue               canonicalJSONV11Context = "host-api-value"
)

type canonicalJSONV11Limits struct {
	RawUTF8Bytes           int `json:"rawUtf8Bytes"`
	Depth                  int `json:"depth"`
	Nodes                  int `json:"nodes"`
	DecodedStringUTF8Bytes int `json:"decodedStringUtf8Bytes"`
	ArrayEntries           int `json:"arrayEntries"`
	ObjectEntries          int `json:"objectEntries"`
}

var canonicalJSONV11DefaultLimits = canonicalJSONV11Limits{
	RawUTF8Bytes: 8 * 1024 * 1024, Depth: 64, Nodes: 262_144,
	DecodedStringUTF8Bytes: 6 * 1024 * 1024, ArrayEntries: 65_536, ObjectEntries: 65_536,
}

type canonicalJSONV11Options struct {
	Context          canonicalJSONV11Context
	RequireCanonical bool
	Limits           *canonicalJSONV11Limits
}

type canonicalJSONV11Error struct {
	Code       string
	Path       []any
	ByteOffset int
	Owner      string
}

type canonicalJSONV11Result struct {
	Value          any
	CanonicalBytes []byte
	Error          *canonicalJSONV11Error
}

type canonicalJSONV11Node struct {
	kind       byte
	boolean    bool
	number     float64
	text       string
	array      []*canonicalJSONV11Node
	object     []canonicalJSONV11Entry
	inputStart int
}

type canonicalJSONV11Entry struct {
	key   string
	value *canonicalJSONV11Node
}

type canonicalJSONV11ParseFrame struct {
	kind             byte
	path             []any
	entries          int
	state            byte
	keys             map[string]struct{}
	pendingKey       string
	previousKeyBytes []byte
	node             *canonicalJSONV11Node
}

const (
	canonicalJSONV11ArrayFirst byte = iota
	canonicalJSONV11ArrayValue
	canonicalJSONV11ArrayComma
	canonicalJSONV11ObjectFirst
	canonicalJSONV11ObjectKey
	canonicalJSONV11ObjectColon
	canonicalJSONV11ObjectValue
	canonicalJSONV11ObjectComma
)

func canonicalJSONV11Owner(context canonicalJSONV11Context) string {
	if context == canonicalJSONV11DecodedStrategyPayload || context == canonicalJSONV11HostAPIValue {
		return "player_violation"
	}
	return "system_failure"
}

func canonicalJSONV11ResolvedLimits(options canonicalJSONV11Options) canonicalJSONV11Limits {
	if options.Limits == nil {
		return canonicalJSONV11DefaultLimits
	}
	return *options.Limits
}

func canonicalJSONV11Failure(options canonicalJSONV11Options, code string, byteOffset int, path []any) *canonicalJSONV11Error {
	clonedPath := make([]any, len(path))
	copy(clonedPath, path)
	return &canonicalJSONV11Error{Code: code, Path: clonedPath, ByteOffset: byteOffset, Owner: canonicalJSONV11Owner(options.Context)}
}

func canonicalJSONV11Path(path []any, value any) []any {
	result := make([]any, len(path)+1)
	copy(result, path)
	result[len(path)] = value
	return result
}

func canonicalJSONV11UTF8Width(input []byte, offset int) (int, rune, bool) {
	if offset >= len(input) {
		return 0, 0, false
	}
	first := input[offset]
	if first <= 0x7f {
		return 1, rune(first), true
	}
	if first >= 0xc2 && first <= 0xdf {
		if offset+1 >= len(input) || input[offset+1] < 0x80 || input[offset+1] > 0xbf {
			return 0, 0, false
		}
		return 2, rune(first&0x1f)<<6 | rune(input[offset+1]&0x3f), true
	}
	if first >= 0xe0 && first <= 0xef {
		if offset+2 >= len(input) {
			return 0, 0, false
		}
		second, third := input[offset+1], input[offset+2]
		minimumSecond := byte(0x80)
		maximumSecond := byte(0xbf)
		if first == 0xe0 {
			minimumSecond = 0xa0
		}
		if first == 0xed {
			maximumSecond = 0x9f
		}
		if second < minimumSecond || second > maximumSecond || third < 0x80 || third > 0xbf {
			return 0, 0, false
		}
		return 3, rune(first&0x0f)<<12 | rune(second&0x3f)<<6 | rune(third&0x3f), true
	}
	if first >= 0xf0 && first <= 0xf4 {
		if offset+3 >= len(input) {
			return 0, 0, false
		}
		second, third, fourth := input[offset+1], input[offset+2], input[offset+3]
		minimumSecond := byte(0x80)
		maximumSecond := byte(0xbf)
		if first == 0xf0 {
			minimumSecond = 0x90
		}
		if first == 0xf4 {
			maximumSecond = 0x8f
		}
		if second < minimumSecond || second > maximumSecond || third < 0x80 || third > 0xbf || fourth < 0x80 || fourth > 0xbf {
			return 0, 0, false
		}
		return 4, rune(first&0x07)<<18 | rune(second&0x3f)<<12 | rune(third&0x3f)<<6 | rune(fourth&0x3f), true
	}
	return 0, 0, false
}

func canonicalJSONV11HexValue(value byte) (int, bool) {
	switch {
	case value >= '0' && value <= '9':
		return int(value - '0'), true
	case value >= 'A' && value <= 'F':
		return int(value-'A') + 10, true
	case value >= 'a' && value <= 'f':
		return int(value-'a') + 10, true
	default:
		return 0, false
	}
}

func canonicalJSONV11ReadHexQuad(input []byte, offset int) (int, bool) {
	if offset+4 > len(input) {
		return 0, false
	}
	value := 0
	for index := 0; index < 4; index++ {
		digit, ok := canonicalJSONV11HexValue(input[offset+index])
		if !ok {
			return 0, false
		}
		value = value*16 + digit
	}
	return value, true
}

func canonicalJSONV11ReadString(input []byte, start int, path []any, limits canonicalJSONV11Limits, options canonicalJSONV11Options) (string, int, *canonicalJSONV11Error) {
	var builder strings.Builder
	offset := start + 1
	segmentStart := offset
	decodedBytes := 0
	addWidth := func(width int, errorOffset int) *canonicalJSONV11Error {
		if decodedBytes+width > limits.DecodedStringUTF8Bytes {
			return canonicalJSONV11Failure(options, "MAX_DECODED_STRING_UTF8_BYTES_EXCEEDED", errorOffset, path)
		}
		decodedBytes += width
		return nil
	}
	for offset < len(input) {
		value := input[offset]
		if value == '"' {
			builder.Write(input[segmentStart:offset])
			return builder.String(), offset + 1, nil
		}
		if value == '\\' {
			builder.Write(input[segmentStart:offset])
			escapeOffset := offset
			if offset+1 >= len(input) {
				return "", 0, canonicalJSONV11Failure(options, "INVALID_GRAMMAR", escapeOffset, path)
			}
			escaped := input[offset+1]
			simple := byte(0)
			switch escaped {
			case '"', '/', '\\':
				simple = escaped
			case 'b':
				simple = '\b'
			case 'f':
				simple = '\f'
			case 'n':
				simple = '\n'
			case 'r':
				simple = '\r'
			case 't':
				simple = '\t'
			}
			if simple != 0 {
				if failure := addWidth(1, escapeOffset); failure != nil {
					return "", 0, failure
				}
				builder.WriteByte(simple)
				offset += 2
				segmentStart = offset
				continue
			}
			if escaped != 'u' {
				return "", 0, canonicalJSONV11Failure(options, "INVALID_GRAMMAR", escapeOffset, path)
			}
			firstUnit, ok := canonicalJSONV11ReadHexQuad(input, offset+2)
			if !ok {
				return "", 0, canonicalJSONV11Failure(options, "INVALID_GRAMMAR", escapeOffset, path)
			}
			codePoint := firstUnit
			consumed := 6
			if firstUnit >= 0xd800 && firstUnit <= 0xdbff {
				if offset+8 > len(input) || input[offset+6] != '\\' || input[offset+7] != 'u' {
					return "", 0, canonicalJSONV11Failure(options, "INVALID_UNICODE_SCALAR", escapeOffset, path)
				}
				secondUnit, ok := canonicalJSONV11ReadHexQuad(input, offset+8)
				if !ok || secondUnit < 0xdc00 || secondUnit > 0xdfff {
					return "", 0, canonicalJSONV11Failure(options, "INVALID_UNICODE_SCALAR", escapeOffset, path)
				}
				codePoint = 0x10000 + ((firstUnit - 0xd800) << 10) + secondUnit - 0xdc00
				consumed = 12
			} else if firstUnit >= 0xdc00 && firstUnit <= 0xdfff {
				return "", 0, canonicalJSONV11Failure(options, "INVALID_UNICODE_SCALAR", escapeOffset, path)
			}
			width := 1
			switch {
			case codePoint <= 0x7f:
				width = 1
			case codePoint <= 0x7ff:
				width = 2
			case codePoint <= 0xffff:
				width = 3
			default:
				width = 4
			}
			if failure := addWidth(width, escapeOffset); failure != nil {
				return "", 0, failure
			}
			builder.WriteRune(rune(codePoint))
			offset += consumed
			segmentStart = offset
			continue
		}
		if value < 0x20 {
			return "", 0, canonicalJSONV11Failure(options, "INVALID_GRAMMAR", offset, path)
		}
		width, _, ok := canonicalJSONV11UTF8Width(input, offset)
		if !ok {
			return "", 0, canonicalJSONV11Failure(options, "INVALID_UTF8", offset, path)
		}
		if failure := addWidth(width, offset); failure != nil {
			return "", 0, failure
		}
		offset += width
	}
	return "", 0, canonicalJSONV11Failure(options, "INVALID_GRAMMAR", len(input), path)
}

func canonicalJSONV11IsDigit(value byte) bool {
	return value >= '0' && value <= '9'
}

func canonicalJSONV11ReadNumber(input []byte, start int, path []any, options canonicalJSONV11Options) (float64, int, *canonicalJSONV11Error) {
	offset := start
	if input[offset] == '-' {
		offset++
	}
	if offset >= len(input) || !canonicalJSONV11IsDigit(input[offset]) {
		return 0, 0, canonicalJSONV11Failure(options, "INVALID_GRAMMAR", start, path)
	}
	if input[offset] == '0' {
		offset++
	} else {
		for offset < len(input) && canonicalJSONV11IsDigit(input[offset]) {
			offset++
		}
	}
	if offset < len(input) && input[offset] == '.' {
		decimalOffset := offset
		offset++
		if offset >= len(input) || !canonicalJSONV11IsDigit(input[offset]) {
			return 0, 0, canonicalJSONV11Failure(options, "INVALID_GRAMMAR", decimalOffset, path)
		}
		for offset < len(input) && canonicalJSONV11IsDigit(input[offset]) {
			offset++
		}
	}
	if offset < len(input) && (input[offset] == 'e' || input[offset] == 'E') {
		exponentOffset := offset
		offset++
		if offset < len(input) && (input[offset] == '+' || input[offset] == '-') {
			offset++
		}
		if offset >= len(input) || !canonicalJSONV11IsDigit(input[offset]) {
			return 0, 0, canonicalJSONV11Failure(options, "INVALID_GRAMMAR", exponentOffset, path)
		}
		for offset < len(input) && canonicalJSONV11IsDigit(input[offset]) {
			offset++
		}
	}
	lexical := string(input[start:offset])
	value, err := strconv.ParseFloat(lexical, 64)
	if err != nil || math.IsInf(value, 0) || math.IsNaN(value) {
		return 0, 0, canonicalJSONV11Failure(options, "NUMBER_OUT_OF_RANGE", start, path)
	}
	lexicalInteger := !strings.ContainsAny(lexical, ".eE")
	// D-02 bounds JSON integer lexemes. Finite decimal/exponent binary64 values
	// retain their round-trip domain, including 1e21 and max finite binary64.
	if lexicalInteger && math.Abs(value) > 9_007_199_254_740_991 {
		return 0, 0, canonicalJSONV11Failure(options, "NUMBER_OUT_OF_RANGE", start, path)
	}
	return value, offset, nil
}

func canonicalJSONV11Whitespace(value byte) bool {
	return value == 0x09 || value == 0x0a || value == 0x0d || value == 0x20
}

func parseCanonicalJSONV11(input []byte, options canonicalJSONV11Options) (*canonicalJSONV11Node, *canonicalJSONV11Error) {
	limits := canonicalJSONV11ResolvedLimits(options)
	if len(input) > limits.RawUTF8Bytes {
		return nil, canonicalJSONV11Failure(options, "MAX_RAW_UTF8_BYTES_EXCEEDED", limits.RawUTF8Bytes, nil)
	}
	for offset := 0; offset < len(input); {
		width, _, ok := canonicalJSONV11UTF8Width(input, offset)
		if !ok {
			return nil, canonicalJSONV11Failure(options, "INVALID_UTF8", offset, nil)
		}
		offset += width
	}

	stack := []*canonicalJSONV11ParseFrame{}
	offset := 0
	nodeCount := 0
	rootStarted := false
	rootComplete := false
	var root *canonicalJSONV11Node
	skipWhitespace := func() {
		for offset < len(input) && canonicalJSONV11Whitespace(input[offset]) {
			offset++
		}
	}
	readValue := func(path []any) (*canonicalJSONV11Node, bool, *canonicalJSONV11Error) {
		if nodeCount >= limits.Nodes {
			return nil, false, canonicalJSONV11Failure(options, "MAX_NODES_EXCEEDED", offset, nil)
		}
		start := offset
		if offset >= len(input) {
			return nil, false, canonicalJSONV11Failure(options, "INVALID_GRAMMAR", offset, path)
		}
		value := input[offset]
		if value == '[' || value == '{' {
			depth := len(stack) + 1
			if depth > limits.Depth {
				return nil, false, canonicalJSONV11Failure(options, "MAX_DEPTH_EXCEEDED", offset, nil)
			}
			nodeCount++
			offset++
			node := &canonicalJSONV11Node{kind: value, inputStart: start}
			if value == '[' {
				stack = append(stack, &canonicalJSONV11ParseFrame{kind: value, path: append([]any(nil), path...), state: canonicalJSONV11ArrayFirst, node: node})
			} else {
				stack = append(stack, &canonicalJSONV11ParseFrame{kind: value, path: append([]any(nil), path...), state: canonicalJSONV11ObjectFirst, keys: map[string]struct{}{}, node: node})
			}
			return node, true, nil
		}
		nodeCount++
		switch value {
		case '"':
			decoded, next, failure := canonicalJSONV11ReadString(input, offset, path, limits, options)
			if failure != nil {
				return nil, false, failure
			}
			offset = next
			return &canonicalJSONV11Node{kind: 's', text: decoded, inputStart: start}, false, nil
		case 't':
			if offset+4 <= len(input) && string(input[offset:offset+4]) == "true" {
				offset += 4
				return &canonicalJSONV11Node{kind: 'b', boolean: true, inputStart: start}, false, nil
			}
		case 'f':
			if offset+5 <= len(input) && string(input[offset:offset+5]) == "false" {
				offset += 5
				return &canonicalJSONV11Node{kind: 'b', inputStart: start}, false, nil
			}
		case 'n':
			if offset+4 <= len(input) && string(input[offset:offset+4]) == "null" {
				offset += 4
				return &canonicalJSONV11Node{kind: 'n', inputStart: start}, false, nil
			}
		default:
			if value == '-' || canonicalJSONV11IsDigit(value) {
				number, next, failure := canonicalJSONV11ReadNumber(input, offset, path, options)
				if failure != nil {
					return nil, false, failure
				}
				offset = next
				return &canonicalJSONV11Node{kind: '#', number: number, inputStart: start}, false, nil
			}
		}
		return nil, false, canonicalJSONV11Failure(options, "INVALID_GRAMMAR", offset, path)
	}

	for {
		skipWhitespace()
		if len(stack) == 0 {
			if rootComplete {
				if offset != len(input) {
					return nil, canonicalJSONV11Failure(options, "INVALID_GRAMMAR", offset, nil)
				}
				return root, nil
			}
			if rootStarted {
				return nil, canonicalJSONV11Failure(options, "INVALID_GRAMMAR", offset, nil)
			}
			rootStarted = true
			node, container, failure := readValue(nil)
			if failure != nil {
				return nil, failure
			}
			root = node
			if !container {
				rootComplete = true
			}
			continue
		}

		frame := stack[len(stack)-1]
		if frame.kind == '[' {
			if frame.state == canonicalJSONV11ArrayFirst && offset < len(input) && input[offset] == ']' {
				offset++
				stack = stack[:len(stack)-1]
				if len(stack) == 0 {
					rootComplete = true
				}
				continue
			}
			if frame.state == canonicalJSONV11ArrayComma {
				if offset < len(input) && input[offset] == ']' {
					offset++
					stack = stack[:len(stack)-1]
					if len(stack) == 0 {
						rootComplete = true
					}
					continue
				}
				if offset >= len(input) || input[offset] != ',' {
					return nil, canonicalJSONV11Failure(options, "INVALID_GRAMMAR", offset, frame.path)
				}
				offset++
				frame.state = canonicalJSONV11ArrayValue
				continue
			}
			if frame.entries >= limits.ArrayEntries {
				return nil, canonicalJSONV11Failure(options, "MAX_ARRAY_ENTRIES_EXCEEDED", offset, nil)
			}
			entryPath := canonicalJSONV11Path(frame.path, frame.entries)
			node, _, failure := readValue(entryPath)
			if failure != nil {
				return nil, failure
			}
			frame.node.array = append(frame.node.array, node)
			frame.entries++
			frame.state = canonicalJSONV11ArrayComma
			continue
		}

		if frame.state == canonicalJSONV11ObjectFirst && offset < len(input) && input[offset] == '}' {
			offset++
			stack = stack[:len(stack)-1]
			if len(stack) == 0 {
				rootComplete = true
			}
			continue
		}
		if frame.state == canonicalJSONV11ObjectComma {
			if offset < len(input) && input[offset] == '}' {
				offset++
				stack = stack[:len(stack)-1]
				if len(stack) == 0 {
					rootComplete = true
				}
				continue
			}
			if offset >= len(input) || input[offset] != ',' {
				return nil, canonicalJSONV11Failure(options, "INVALID_GRAMMAR", offset, frame.path)
			}
			offset++
			frame.state = canonicalJSONV11ObjectKey
			continue
		}
		if frame.state == canonicalJSONV11ObjectFirst || frame.state == canonicalJSONV11ObjectKey {
			if frame.entries >= limits.ObjectEntries {
				return nil, canonicalJSONV11Failure(options, "MAX_OBJECT_ENTRIES_EXCEEDED", offset, nil)
			}
			if offset >= len(input) || input[offset] != '"' {
				return nil, canonicalJSONV11Failure(options, "INVALID_GRAMMAR", offset, frame.path)
			}
			keyOffset := offset
			key, next, failure := canonicalJSONV11ReadString(input, offset, frame.path, limits, options)
			if failure != nil {
				return nil, failure
			}
			keyPath := canonicalJSONV11Path(frame.path, key)
			if _, exists := frame.keys[key]; exists {
				return nil, canonicalJSONV11Failure(options, "DUPLICATE_KEY", keyOffset, keyPath)
			}
			keyBytes := []byte(key)
			if options.RequireCanonical && frame.previousKeyBytes != nil && bytes.Compare(frame.previousKeyBytes, keyBytes) >= 0 {
				return nil, canonicalJSONV11Failure(options, "NON_CANONICAL_KEY_ORDER", keyOffset, keyPath)
			}
			frame.keys[key] = struct{}{}
			frame.previousKeyBytes = append(frame.previousKeyBytes[:0], keyBytes...)
			frame.pendingKey = key
			frame.state = canonicalJSONV11ObjectColon
			offset = next
			continue
		}
		if frame.state == canonicalJSONV11ObjectColon {
			if offset >= len(input) || input[offset] != ':' {
				return nil, canonicalJSONV11Failure(options, "INVALID_GRAMMAR", offset, frame.path)
			}
			offset++
			frame.state = canonicalJSONV11ObjectValue
			continue
		}
		if frame.state == canonicalJSONV11ObjectValue {
			valuePath := canonicalJSONV11Path(frame.path, frame.pendingKey)
			node, _, failure := readValue(valuePath)
			if failure != nil {
				return nil, failure
			}
			frame.node.object = append(frame.node.object, canonicalJSONV11Entry{key: frame.pendingKey, value: node})
			frame.entries++
			frame.pendingKey = ""
			frame.state = canonicalJSONV11ObjectComma
			continue
		}
	}
}

func canonicalJSONV11Number(value float64) (string, bool) {
	if math.IsInf(value, 0) || math.IsNaN(value) {
		return "", false
	}
	if value == 0 {
		return "0", true
	}
	absolute := math.Abs(value)
	if absolute >= 1e-6 && absolute < 1e21 {
		return strconv.FormatFloat(value, 'f', -1, 64), true
	}
	formatted := strings.ToLower(strconv.FormatFloat(value, 'g', -1, 64))
	exponentAt := strings.IndexByte(formatted, 'e')
	if exponentAt < 0 {
		return formatted, true
	}
	exponent, err := strconv.Atoi(formatted[exponentAt+1:])
	if err != nil {
		return "", false
	}
	return formatted[:exponentAt] + "e" + strconv.Itoa(exponent), true
}

func canonicalJSONV11EncodeString(value string, path []any, limits canonicalJSONV11Limits, options canonicalJSONV11Options) ([]byte, *canonicalJSONV11Error) {
	result := make([]byte, 0, len(value)+2)
	result = append(result, '"')
	decodedBytes := 0
	for offset := 0; offset < len(value); {
		decoded, width := utf8.DecodeRuneInString(value[offset:])
		if decoded == utf8.RuneError && width == 1 {
			return nil, canonicalJSONV11Failure(options, "INVALID_UNICODE_SCALAR", 0, path)
		}
		if decodedBytes+width > limits.DecodedStringUTF8Bytes {
			return nil, canonicalJSONV11Failure(options, "MAX_DECODED_STRING_UTF8_BYTES_EXCEEDED", 0, path)
		}
		decodedBytes += width
		switch decoded {
		case '"':
			result = append(result, '\\', '"')
		case '\\':
			result = append(result, '\\', '\\')
		case '\b':
			result = append(result, '\\', 'b')
		case '\f':
			result = append(result, '\\', 'f')
		case '\n':
			result = append(result, '\\', 'n')
		case '\r':
			result = append(result, '\\', 'r')
		case '\t':
			result = append(result, '\\', 't')
		default:
			if decoded < 0x20 {
				const hex = "0123456789abcdef"
				result = append(result, '\\', 'u', '0', '0', hex[byte(decoded)>>4], hex[byte(decoded)&0x0f])
			} else {
				result = append(result, value[offset:offset+width]...)
			}
		}
		offset += width
	}
	result = append(result, '"')
	return result, nil
}

type canonicalJSONV11EncodeFrame struct {
	node    *canonicalJSONV11Node
	path    []any
	index   int
	entries []canonicalJSONV11Entry
}

func canonicalJSONV11EncodeNode(root *canonicalJSONV11Node, options canonicalJSONV11Options) ([]byte, *canonicalJSONV11Error) {
	limits := canonicalJSONV11ResolvedLimits(options)
	output := make([]byte, 0, 256)
	appendOutput := func(value []byte) *canonicalJSONV11Error {
		if len(output)+len(value) > limits.RawUTF8Bytes {
			return canonicalJSONV11Failure(options, "MAX_RAW_UTF8_BYTES_EXCEEDED", limits.RawUTF8Bytes, nil)
		}
		output = append(output, value...)
		return nil
	}
	stack := []canonicalJSONV11EncodeFrame{}
	current := root
	currentPath := []any{}
	nodeCount := 0
	for current != nil || len(stack) > 0 {
		if current != nil {
			if nodeCount >= limits.Nodes {
				return nil, canonicalJSONV11Failure(options, "MAX_NODES_EXCEEDED", len(output), currentPath)
			}
			nodeCount++
			node := current
			path := currentPath
			current = nil
			switch node.kind {
			case 'n':
				if failure := appendOutput([]byte("null")); failure != nil {
					return nil, failure
				}
			case 'b':
				encoded := []byte("false")
				if node.boolean {
					encoded = []byte("true")
				}
				if failure := appendOutput(encoded); failure != nil {
					return nil, failure
				}
			case '#':
				encoded, ok := canonicalJSONV11Number(node.number)
				if !ok {
					return nil, canonicalJSONV11Failure(options, "NON_CANONICAL_NUMBER", 0, path)
				}
				if failure := appendOutput([]byte(encoded)); failure != nil {
					return nil, failure
				}
			case 's':
				encoded, failure := canonicalJSONV11EncodeString(node.text, path, limits, options)
				if failure != nil {
					return nil, failure
				}
				if failure = appendOutput(encoded); failure != nil {
					return nil, failure
				}
			case '[', '{':
				depth := len(stack) + 1
				if depth > limits.Depth {
					return nil, canonicalJSONV11Failure(options, "MAX_DEPTH_EXCEEDED", len(output), path)
				}
				if node.kind == '[' {
					if len(node.array) > limits.ArrayEntries {
						return nil, canonicalJSONV11Failure(options, "MAX_ARRAY_ENTRIES_EXCEEDED", len(output), path)
					}
					if failure := appendOutput([]byte("[")); failure != nil {
						return nil, failure
					}
					if len(node.array) == 0 {
						if failure := appendOutput([]byte("]")); failure != nil {
							return nil, failure
						}
						continue
					}
					stack = append(stack, canonicalJSONV11EncodeFrame{node: node, path: path})
					current = node.array[0]
					currentPath = canonicalJSONV11Path(path, 0)
					continue
				}
				if len(node.object) > limits.ObjectEntries {
					return nil, canonicalJSONV11Failure(options, "MAX_OBJECT_ENTRIES_EXCEEDED", len(output), path)
				}
				entries := append([]canonicalJSONV11Entry(nil), node.object...)
				sort.Slice(entries, func(left, right int) bool {
					return bytes.Compare([]byte(entries[left].key), []byte(entries[right].key)) < 0
				})
				if failure := appendOutput([]byte("{")); failure != nil {
					return nil, failure
				}
				if len(entries) == 0 {
					if failure := appendOutput([]byte("}")); failure != nil {
						return nil, failure
					}
					continue
				}
				stack = append(stack, canonicalJSONV11EncodeFrame{node: node, path: path, entries: entries})
				encodedKey, failure := canonicalJSONV11EncodeString(entries[0].key, canonicalJSONV11Path(path, entries[0].key), limits, options)
				if failure != nil {
					return nil, failure
				}
				if failure = appendOutput(encodedKey); failure != nil {
					return nil, failure
				}
				if failure = appendOutput([]byte(":")); failure != nil {
					return nil, failure
				}
				current = entries[0].value
				currentPath = canonicalJSONV11Path(path, entries[0].key)
				continue
			default:
				return nil, canonicalJSONV11Failure(options, "INVALID_GRAMMAR", len(output), path)
			}
		}
		if len(stack) == 0 {
			continue
		}

		frameIndex := len(stack) - 1
		frame := &stack[frameIndex]
		frame.index++
		if frame.node.kind == '[' {
			if frame.index < len(frame.node.array) {
				if failure := appendOutput([]byte(",")); failure != nil {
					return nil, failure
				}
				current = frame.node.array[frame.index]
				currentPath = canonicalJSONV11Path(frame.path, frame.index)
				continue
			}
			if failure := appendOutput([]byte("]")); failure != nil {
				return nil, failure
			}
			stack = stack[:frameIndex]
			continue
		}
		if frame.index < len(frame.entries) {
			if failure := appendOutput([]byte(",")); failure != nil {
				return nil, failure
			}
			entry := frame.entries[frame.index]
			encodedKey, failure := canonicalJSONV11EncodeString(entry.key, canonicalJSONV11Path(frame.path, entry.key), limits, options)
			if failure != nil {
				return nil, failure
			}
			if failure = appendOutput(encodedKey); failure != nil {
				return nil, failure
			}
			if failure = appendOutput([]byte(":")); failure != nil {
				return nil, failure
			}
			current = entry.value
			currentPath = canonicalJSONV11Path(frame.path, entry.key)
			continue
		}
		if failure := appendOutput([]byte("}")); failure != nil {
			return nil, failure
		}
		stack = stack[:frameIndex]
	}
	return output, nil
}

func canonicalJSONV11Materialize(root *canonicalJSONV11Node) any {
	if root == nil {
		return nil
	}
	type materializeFrame struct {
		node   *canonicalJSONV11Node
		value  any
		index  int
		parent *materializeFrame
		key    string
	}
	scalar := func(node *canonicalJSONV11Node) (any, bool) {
		switch node.kind {
		case 'n':
			return nil, true
		case 'b':
			return node.boolean, true
		case '#':
			return node.number, true
		case 's':
			return node.text, true
		default:
			return nil, false
		}
	}
	if value, ok := scalar(root); ok {
		return value
	}
	var rootValue any
	if root.kind == '[' {
		rootValue = make([]any, len(root.array))
	} else {
		rootValue = map[string]any{}
	}
	stack := []*materializeFrame{{node: root, value: rootValue}}
	for len(stack) > 0 {
		frame := stack[len(stack)-1]
		children := len(frame.node.array)
		if frame.node.kind == '{' {
			children = len(frame.node.object)
		}
		if frame.index >= children {
			stack = stack[:len(stack)-1]
			continue
		}
		index := frame.index
		frame.index++
		child := (*canonicalJSONV11Node)(nil)
		key := ""
		if frame.node.kind == '[' {
			child = frame.node.array[index]
		} else {
			child = frame.node.object[index].value
			key = frame.node.object[index].key
		}
		childValue, isScalar := scalar(child)
		if !isScalar {
			if child.kind == '[' {
				childValue = make([]any, len(child.array))
			} else {
				childValue = map[string]any{}
			}
		}
		if frame.node.kind == '[' {
			frame.value.([]any)[index] = childValue
		} else {
			frame.value.(map[string]any)[key] = childValue
		}
		if !isScalar {
			stack = append(stack, &materializeFrame{node: child, value: childValue, parent: frame, key: key})
		}
	}
	return rootValue
}

func decodeCanonicalJSONV11(input []byte, options canonicalJSONV11Options) canonicalJSONV11Result {
	node, failure := parseCanonicalJSONV11(input, options)
	if failure != nil {
		return canonicalJSONV11Result{Error: failure}
	}
	canonical, failure := canonicalJSONV11EncodeNode(node, options)
	if failure != nil {
		return canonicalJSONV11Result{Error: failure}
	}
	if options.RequireCanonical && !bytes.Equal(input, canonical) {
		return canonicalJSONV11Result{Error: canonicalJSONV11Failure(options, "NON_CANONICAL_ENCODING", canonicalJSONV11FirstDifference(input, canonical), nil)}
	}
	return canonicalJSONV11Result{Value: canonicalJSONV11Materialize(node), CanonicalBytes: canonical}
}

func canonicalJSONV11FirstDifference(left []byte, right []byte) int {
	limit := len(left)
	if len(right) < limit {
		limit = len(right)
	}
	for index := 0; index < limit; index++ {
		if left[index] != right[index] {
			return index
		}
	}
	return limit
}

func encodeCanonicalJSONV11(value any, options canonicalJSONV11Options) canonicalJSONV11Result {
	var node *canonicalJSONV11Node
	switch typed := value.(type) {
	case nil:
		node = &canonicalJSONV11Node{kind: 'n'}
	case bool:
		node = &canonicalJSONV11Node{kind: 'b', boolean: typed}
	case string:
		node = &canonicalJSONV11Node{kind: 's', text: typed}
	case float64:
		node = &canonicalJSONV11Node{kind: '#', number: typed}
	case float32:
		node = &canonicalJSONV11Node{kind: '#', number: float64(typed)}
	case json.Number:
		parsed, err := strconv.ParseFloat(string(typed), 64)
		if err != nil {
			return canonicalJSONV11Result{Error: canonicalJSONV11Failure(options, "NON_CANONICAL_NUMBER", 0, nil)}
		}
		node = &canonicalJSONV11Node{kind: '#', number: parsed}
	default:
		return canonicalJSONV11Result{Error: canonicalJSONV11Failure(options, "INVALID_GRAMMAR", 0, nil)}
	}
	canonical, failure := canonicalJSONV11EncodeNode(node, options)
	if failure != nil {
		return canonicalJSONV11Result{Error: failure}
	}
	return canonicalJSONV11Result{Value: value, CanonicalBytes: canonical}
}
