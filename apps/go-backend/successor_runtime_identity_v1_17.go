package main

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"regexp"
	"strings"
)

var runtimeIdentityPublicIDV117 = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$`)

type runtimeIdentityBindingV117 struct {
	Domain   string `json:"domain"`
	PublicID string `json:"publicId"`
	SHA256   string `json:"sha256"`
}

type runtimeSuccessorIdentityTemplateV117 struct {
	SchemaVersion     string                       `json:"schemaVersion"`
	Profile           string                       `json:"profile"`
	Bindings          []runtimeIdentityBindingV117 `json:"bindings"`
	ExactPins         runtimeServiceExactPinsV117  `json:"exactPins"`
	LaneProfileSHA256 string                       `json:"laneProfileSha256"`
}

type runtimeIdentityManifestV117 struct {
	SchemaVersion string                       `json:"schemaVersion"`
	Profile       string                       `json:"profile"`
	Bindings      []runtimeIdentityBindingV117 `json:"bindings"`
}

func cloneRuntimeSuccessorIdentityTemplateV117(template *runtimeSuccessorIdentityTemplateV117) *runtimeSuccessorIdentityTemplateV117 {
	if template == nil {
		return nil
	}
	clone := *template
	clone.Bindings = append([]runtimeIdentityBindingV117(nil), template.Bindings...)
	return &clone
}

func normalizeRuntimeSuccessorIdentityTemplateV117(template *runtimeSuccessorIdentityTemplateV117) bool {
	if template == nil || template.SchemaVersion != runtimeSuccessorIdentityTemplateSchemaV117 ||
		template.Profile != runtimeSuccessorIdentityTemplateProfileV117 ||
		len(template.Bindings) != len(runtimeSuccessorIdentityTemplateDomainsV117) ||
		!validRuntimeServiceExactPinsV117(template.ExactPins) || !isPrefixedLowerSHA256(template.LaneProfileSHA256) {
		return false
	}
	byDomain := map[string]runtimeIdentityBindingV117{}
	publicIDs := map[string]bool{}
	for _, binding := range template.Bindings {
		if !runtimeIdentityPublicIDV117.MatchString(binding.PublicID) || !isLowerSHA256(binding.SHA256) ||
			publicIDs[binding.PublicID] {
			return false
		}
		allowed := false
		for _, domain := range runtimeSuccessorIdentityTemplateDomainsV117 {
			if binding.Domain == domain {
				allowed = true
				break
			}
		}
		if !allowed || byDomain[binding.Domain].Domain != "" {
			return false
		}
		byDomain[binding.Domain] = binding
		publicIDs[binding.PublicID] = true
	}
	normalized := make([]runtimeIdentityBindingV117, 0, len(runtimeSuccessorIdentityTemplateDomainsV117))
	for _, domain := range runtimeSuccessorIdentityTemplateDomainsV117 {
		binding, ok := byDomain[domain]
		if !ok {
			return false
		}
		normalized = append(normalized, binding)
	}
	template.Bindings = normalized
	return validNormalizedRuntimeSuccessorIdentityTemplateV117(template)
}

func validNormalizedRuntimeSuccessorIdentityTemplateV117(template *runtimeSuccessorIdentityTemplateV117) bool {
	if template == nil || template.SchemaVersion != runtimeSuccessorIdentityTemplateSchemaV117 ||
		template.Profile != runtimeSuccessorIdentityTemplateProfileV117 ||
		len(template.Bindings) != len(runtimeSuccessorIdentityTemplateDomainsV117) ||
		!validRuntimeServiceExactPinsV117(template.ExactPins) || !isPrefixedLowerSHA256(template.LaneProfileSHA256) {
		return false
	}
	publicIDs := map[string]bool{}
	for index, binding := range template.Bindings {
		if binding.Domain != runtimeSuccessorIdentityTemplateDomainsV117[index] ||
			!runtimeIdentityPublicIDV117.MatchString(binding.PublicID) || !isLowerSHA256(binding.SHA256) || publicIDs[binding.PublicID] {
			return false
		}
		publicIDs[binding.PublicID] = true
	}
	bindings := runtimeIdentityBindingMapV117(template.Bindings)
	return bindings["semanticTuple"].PublicID == runtimeSuccessorSemanticTupleIDV117 &&
		bindings["semanticTuple"].SHA256 == strings.TrimPrefix(runtimeSuccessorSemanticTupleIDV117, "sha256:") &&
		template.ExactPins[0][1] == "sha256:"+bindings["runtimeExecutable"].SHA256 &&
		template.ExactPins[4][1] == "sha256:"+bindings["adapterBuild"].SHA256 &&
		template.ExactPins[5][1] == "sha256:"+bindings["sysrootStdlib"].SHA256 &&
		template.ExactPins[6][1] == bindings["containmentPolicy"].PublicID &&
		template.ExactPins[7][1] == "sha256:"+bindings["budgetProfile"].SHA256 &&
		template.ExactPins[7][1] == runtimeServiceV117BudgetProfileSHA256 &&
		template.ExactPins[8][1] == bindings["canonicalJsonProfile"].PublicID &&
		template.ExactPins[8][1] == canonicalJSONVersionV11
}

func runtimeIdentityBindingMapV117(bindings []runtimeIdentityBindingV117) map[string]runtimeIdentityBindingV117 {
	result := make(map[string]runtimeIdentityBindingV117, len(bindings))
	for _, binding := range bindings {
		result[binding.Domain] = binding
	}
	return result
}

func runtimeIdentityDomainTagV117(domain string) (string, bool) {
	for index, name := range runtimeCanonicalIdentityDomainsV117 {
		if domain == name {
			return runtimeCanonicalIdentityDomainTagsV117[index], true
		}
	}
	return "", false
}

func hashRuntimeIdentityBytesV117(domain string, segments ...[]byte) (string, bool) {
	tag, ok := runtimeIdentityDomainTagV117(domain)
	if !ok {
		return "", false
	}
	return strings.TrimPrefix(runtimeInvocationV117SHA256Value(runtimeInvocationV117Frame(tag, segments...)), "sha256:"), true
}

func hashRuntimeIdentityValueV117(domain string, value any) (string, bool) {
	encoded, err := runtimeInvocationV117CanonicalValue(value)
	if err != nil {
		return "", false
	}
	return hashRuntimeIdentityBytesV117(domain, encoded)
}

func runtimeServiceArtifactBytesV117(strategy runtimeServiceStrategyRevision, evidence goEntrantExecutionEvidence) ([]byte, bool) {
	var artifact map[string]any
	for _, key := range []string{"sourceArtifact", "compiledArtifact"} {
		candidate := mapValue(strategy.Metadata, key)
		if stringValue(candidate, "hash") == evidence.LaneIdentity.ArtifactSHA256 && stringValue(candidate, "bytesBase64") != "" {
			if artifact != nil {
				return nil, false
			}
			artifact = candidate
		}
	}
	bytes, err := base64.StdEncoding.Strict().DecodeString(stringValue(artifact, "bytesBase64"))
	return bytes, err == nil && len(bytes) > 0 && runtimeInvocationV117SHA256Value(bytes) == "sha256:"+evidence.LaneIdentity.ArtifactSHA256
}

func composeRuntimeSuccessorIdentityV117(strategy runtimeServiceStrategyRevision, evidence goEntrantExecutionEvidence, template *runtimeSuccessorIdentityTemplateV117) (string, runtimeServiceSourceIdentityV117, bool) {
	if !validNormalizedRuntimeSuccessorIdentityTemplateV117(template) {
		return "", runtimeServiceSourceIdentityV117{}, false
	}
	sourceIdentity, ok := runtimeServiceSourceIdentityFromPersistedRevisionV117(strategy, evidence)
	if !ok {
		return "", runtimeServiceSourceIdentityV117{}, false
	}
	artifactBytes, ok := runtimeServiceArtifactBytesV117(strategy, evidence)
	if !ok {
		return "", runtimeServiceSourceIdentityV117{}, false
	}
	originalBytes := []byte(strategy.Source)
	normalizedBytes := []byte(strings.ReplaceAll(strings.ReplaceAll(strategy.Source, "\r\n", "\n"), "\r", "\n"))
	revisionDigest := sha256.Sum256([]byte(strategy.ID))
	revisionKey := hex.EncodeToString(revisionDigest[:])
	directBinding := func(domain string, publicID string, bytes []byte) (runtimeIdentityBindingV117, bool) {
		hash, valid := hashRuntimeIdentityBytesV117(domain, bytes)
		return runtimeIdentityBindingV117{Domain: domain, PublicID: publicID, SHA256: hash}, valid
	}
	bindings := runtimeIdentityBindingMapV117(template.Bindings)
	var binding runtimeIdentityBindingV117
	binding, ok = directBinding("originalSource", "strategy-revision."+revisionKey+".originalSource", originalBytes)
	if !ok {
		return "", runtimeServiceSourceIdentityV117{}, false
	}
	bindings[binding.Domain] = binding
	binding, ok = directBinding("normalizedSource", "strategy-revision."+revisionKey+".normalizedSource", normalizedBytes)
	if !ok {
		return "", runtimeServiceSourceIdentityV117{}, false
	}
	bindings[binding.Domain] = binding
	binding, ok = directBinding("normalizationPolicy", "source-normalization.crlf-cr-to-lf.v1", []byte("replace-crlf-and-cr-with-lf:v1"))
	if !ok {
		return "", runtimeServiceSourceIdentityV117{}, false
	}
	bindings[binding.Domain] = binding
	binding, ok = directBinding("artifact", "strategy-revision."+revisionKey+".artifact", artifactBytes)
	if !ok {
		return "", runtimeServiceSourceIdentityV117{}, false
	}
	bindings[binding.Domain] = binding
	artifactManifestDomains := []string{"originalSource", "normalizedSource", "normalizationPolicy", "artifact", "compilerExecutable", "sysrootStdlib", "semanticTuple", "canonicalJsonProfile"}
	artifactManifestBindings := make([]runtimeIdentityBindingV117, 0, len(artifactManifestDomains))
	for _, domain := range artifactManifestDomains {
		artifactManifestBindings = append(artifactManifestBindings, bindings[domain])
	}
	artifactManifestHash, ok := hashRuntimeIdentityValueV117("artifactManifest", map[string]any{"bindings": artifactManifestBindings})
	if !ok {
		return "", runtimeServiceSourceIdentityV117{}, false
	}
	bindings["artifactManifest"] = runtimeIdentityBindingV117{Domain: "artifactManifest", PublicID: "strategy-revision." + revisionKey + ".artifactManifest", SHA256: artifactManifestHash}
	preEvidenceBindings := make([]runtimeIdentityBindingV117, 0, len(runtimeCanonicalIdentityDomainsV117)-1)
	for _, domain := range runtimeCanonicalIdentityDomainsV117 {
		if domain != "evidenceBundle" {
			preEvidenceBindings = append(preEvidenceBindings, bindings[domain])
		}
	}
	evidenceHash, ok := hashRuntimeIdentityValueV117("evidenceBundle", map[string]any{
		"bindings": preEvidenceBindings, "exactPins": template.ExactPins, "laneProfileSha256": template.LaneProfileSHA256,
	})
	if !ok {
		return "", runtimeServiceSourceIdentityV117{}, false
	}
	bindings["evidenceBundle"] = runtimeIdentityBindingV117{Domain: "evidenceBundle", PublicID: "strategy-revision." + revisionKey + ".evidenceBundle", SHA256: evidenceHash}
	manifestBindings := make([]runtimeIdentityBindingV117, 0, len(runtimeCanonicalIdentityDomainsV117))
	publicIDs := map[string]bool{}
	for _, domain := range runtimeCanonicalIdentityDomainsV117 {
		candidate, exists := bindings[domain]
		if !exists || !runtimeIdentityPublicIDV117.MatchString(candidate.PublicID) || !isLowerSHA256(candidate.SHA256) || publicIDs[candidate.PublicID] {
			return "", runtimeServiceSourceIdentityV117{}, false
		}
		manifestBindings = append(manifestBindings, candidate)
		publicIDs[candidate.PublicID] = true
	}
	manifest := runtimeIdentityManifestV117{SchemaVersion: "runtime-identity-manifest-v1", Profile: "runtime-identity-v1", Bindings: manifestBindings}
	manifestBytes, err := runtimeInvocationV117CanonicalValue(manifest)
	if err != nil {
		return "", runtimeServiceSourceIdentityV117{}, false
	}
	manifestHash, ok := hashRuntimeIdentityBytesV117("evidenceBundle", manifestBytes)
	if !ok {
		return "", runtimeServiceSourceIdentityV117{}, false
	}
	return "sha256:" + manifestHash, sourceIdentity, true
}
