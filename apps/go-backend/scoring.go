package main

import (
	"errors"
	"sort"
)

const (
	matchStatusPending      = "pending"
	matchStatusRunning      = "running"
	matchStatusComplete     = "complete"
	matchStatusFailedSystem = "failed_system"
	matchStatusBlocked      = "blocked"

	matchSetStatusPending      = "pending"
	matchSetStatusRunning      = "running"
	matchSetStatusComplete     = "complete"
	matchSetStatusFailedSystem = "failed_system"
	matchSetStatusBlocked      = "blocked"
	matchSetStatusDegraded     = "degraded"
)

const (
	scoringWinPoints             = 3
	scoringDrawPoints            = 1
	scoringLossPoints            = 0
	scoringStrategyFailurePoints = -1
)

type scorePenalty struct {
	MatchID string `json:"matchId"`
	Reason  string `json:"reason"`
	Points  int    `json:"points"`
}

type matchScoreInput struct {
	MatchID                   string
	BottomStrategyRevisionID  string
	TopStrategyRevisionID     string
	WinnerStrategyRevisionID  *string
	StrategyFailureRevisionID *string
	Status                    string
	SurvivingSoldiers         int
	BottomSurvivingSoldiers   int
	TopSurvivingSoldiers      int
	SurvivalTurns             int
	BottomSurvivalTurns       int
	TopSurvivalTurns          int
}

type matchSetStrategyScore struct {
	StrategyRevisionID  string         `json:"strategyRevisionId"`
	Wins                int            `json:"wins"`
	Losses              int            `json:"losses"`
	Draws               int            `json:"draws"`
	Points              int            `json:"points"`
	PenaltyPoints       int            `json:"penaltyPoints"`
	Penalties           []scorePenalty `json:"penalties"`
	FailedSystemMatches int            `json:"failedSystemMatches"`
	SurvivingSoldiers   int            `json:"survivingSoldiers"`
	SurvivalTurns       int            `json:"survivalTurns"`
}

type matchSetScore struct {
	Degraded bool                    `json:"degraded"`
	Complete bool                    `json:"complete"`
	Rankings []matchSetStrategyScore `json:"rankings"`
}

type successorRevisionEvidenceV119 struct {
	StrategyRevisionID        string
	ScheduledRevalidationID   string
	CurrentRevalidationID     *string
	ScheduledRevalidationRoot string
	CurrentRevalidationRoot   *string
	Revoked                   bool
}

type successorMatchScoreInputV119 struct {
	matchScoreInput
	SemanticAuthorityKey        string
	ScenarioID                  string
	ConditionID                 string
	ConditionOrdinal            int
	RequestIdentity             string
	BottomEntrantKey            string
	TopEntrantKey               string
	InitialInitiativeEntrantKey string
	TerminalKind                string
	AttemptNumber               int
	RetryableSystemFailure      bool
	BottomRevisionEvidence      successorRevisionEvidenceV119
	TopRevisionEvidence         successorRevisionEvidenceV119
}

type successorMatchSetScoreV119 struct {
	Degraded              bool                    `json:"degraded"`
	Complete              bool                    `json:"complete"`
	Rankings              []matchSetStrategyScore `json:"rankings"`
	Status                string                  `json:"status"`
	Counted               bool                    `json:"counted"`
	CanonicalConditionIDs []string                `json:"canonicalConditionIds"`
}

func successorRevisionEvidenceIsCurrentV119(evidence successorRevisionEvidenceV119, expectedRevisionID string) bool {
	return evidence.StrategyRevisionID == expectedRevisionID &&
		evidence.ScheduledRevalidationID != "" && evidence.CurrentRevalidationID != nil &&
		*evidence.CurrentRevalidationID == evidence.ScheduledRevalidationID &&
		evidence.ScheduledRevalidationRoot != "" && evidence.CurrentRevalidationRoot != nil &&
		*evidence.CurrentRevalidationRoot == evidence.ScheduledRevalidationRoot && !evidence.Revoked
}

// scoreSuccessorMatchSetV119 is an admission gate around the unchanged current
// scorer. Only the exact generated four-condition membership, terminal policy,
// and still-current D-04 evidence can reach scoreMatchSet.
func scoreSuccessorMatchSetV119(expected []candidateFourConditionMatchV119, matches []successorMatchScoreInputV119) (successorMatchSetScoreV119, error) {
	canonical := append([]candidateFourConditionMatchV119(nil), expected...)
	sort.Slice(canonical, func(i, j int) bool {
		if canonical[i].ScenarioID != canonical[j].ScenarioID {
			return canonical[i].ScenarioID < canonical[j].ScenarioID
		}
		return canonical[i].ConditionOrdinal < canonical[j].ConditionOrdinal
	})
	if len(canonical) != 4 {
		return successorMatchSetScoreV119{}, errors.New("candidate scoring requires the exact four-condition matrix")
	}
	expectedByID := make(map[string]candidateFourConditionMatchV119, len(canonical))
	canonicalIDs := make([]string, 0, len(canonical))
	for ordinal, condition := range canonical {
		if condition.SemanticAuthorityKey != "runtime-v1.19" || condition.ConditionOrdinal != ordinal ||
			condition.ID == "" || condition.ConditionID == "" || condition.ScenarioID != canonical[0].ScenarioID ||
			condition.RequestIdentity == "" || condition.BottomEntrantKey == condition.TopEntrantKey ||
			condition.InitialInitiativeEntrantKey == "" {
			return successorMatchSetScoreV119{}, errors.New("candidate scoring membership authority is noncanonical")
		}
		if _, duplicate := expectedByID[condition.ConditionID]; duplicate {
			return successorMatchSetScoreV119{}, errors.New("candidate scoring membership contains a duplicate condition")
		}
		expectedByID[condition.ConditionID] = condition
		canonicalIDs = append(canonicalIDs, condition.ConditionID)
	}

	ordered := append([]successorMatchScoreInputV119(nil), matches...)
	sort.Slice(ordered, func(i, j int) bool {
		if ordered[i].ScenarioID != ordered[j].ScenarioID {
			return ordered[i].ScenarioID < ordered[j].ScenarioID
		}
		return ordered[i].ConditionOrdinal < ordered[j].ConditionOrdinal
	})
	seen := make(map[string]struct{}, len(ordered))
	invalidEvidence := false
	validTerminalCount := 0
	retryableFailure := false
	exhaustedFailure := false
	currentInputs := make([]matchScoreInput, 0, len(ordered))
	for _, match := range ordered {
		condition, ok := expectedByID[match.ConditionID]
		if !ok {
			return successorMatchSetScoreV119{}, errors.New("candidate scoring contains a substituted condition")
		}
		if _, duplicate := seen[match.ConditionID]; duplicate {
			return successorMatchSetScoreV119{}, errors.New("candidate scoring contains a duplicate condition")
		}
		seen[match.ConditionID] = struct{}{}
		if match.SemanticAuthorityKey != condition.SemanticAuthorityKey || match.ScenarioID != condition.ScenarioID ||
			match.ConditionOrdinal != condition.ConditionOrdinal || match.RequestIdentity != condition.RequestIdentity ||
			match.MatchID != condition.ID || match.BottomEntrantKey != condition.BottomEntrantKey ||
			match.TopEntrantKey != condition.TopEntrantKey || match.InitialInitiativeEntrantKey != condition.InitialInitiativeEntrantKey ||
			match.BottomStrategyRevisionID != condition.BottomStrategyRevisionID || match.TopStrategyRevisionID != condition.TopStrategyRevisionID {
			return successorMatchSetScoreV119{}, errors.New("candidate scoring condition identity mismatch")
		}
		if !successorRevisionEvidenceIsCurrentV119(match.BottomRevisionEvidence, condition.BottomStrategyRevisionID) ||
			!successorRevisionEvidenceIsCurrentV119(match.TopRevisionEvidence, condition.TopStrategyRevisionID) {
			invalidEvidence = true
		}
		if match.Status == matchStatusComplete && (match.TerminalKind == "success" || match.TerminalKind == "player_violation") {
			validTerminalCount++
		} else if match.Status == matchStatusFailedSystem {
			if match.RetryableSystemFailure {
				retryableFailure = true
			} else {
				exhaustedFailure = true
			}
		}
		currentInputs = append(currentInputs, match.matchScoreInput)
	}

	status := matchSetStatusPending
	if exhaustedFailure {
		status = matchSetStatusDegraded
	}
	if len(ordered) != len(canonical) || len(seen) != len(canonical) || invalidEvidence || retryableFailure || validTerminalCount != len(canonical) {
		return successorMatchSetScoreV119{
			Degraded: status == matchSetStatusDegraded, Complete: false,
			Rankings: []matchSetStrategyScore{}, Status: status, Counted: false,
			CanonicalConditionIDs: canonicalIDs,
		}, nil
	}

	current := scoreMatchSet(currentInputs)
	return successorMatchSetScoreV119{
		Degraded: current.Degraded, Complete: current.Complete, Rankings: current.Rankings,
		Status: matchSetStatusComplete, Counted: true, CanonicalConditionIDs: canonicalIDs,
	}, nil
}

func scoreMatchSet(matches []matchScoreInput) matchSetScore {
	scores := map[string]*matchSetStrategyScore{}
	degraded := false
	complete := true

	for _, match := range matches {
		bottom := getMatchSetScore(scores, match.BottomStrategyRevisionID)
		top := getMatchSetScore(scores, match.TopStrategyRevisionID)
		if match.Status != matchStatusComplete {
			complete = false
		}
		if match.Status == matchStatusFailedSystem {
			degraded = true
			bottom.FailedSystemMatches++
			top.FailedSystemMatches++
			continue
		}
		if match.Status != matchStatusComplete {
			continue
		}

		bottom.SurvivingSoldiers += match.BottomSurvivingSoldiers
		bottom.SurvivalTurns += match.BottomSurvivalTurns
		top.SurvivingSoldiers += match.TopSurvivingSoldiers
		top.SurvivalTurns += match.TopSurvivalTurns

		switch {
		case match.WinnerStrategyRevisionID == nil:
			bottom.Draws++
			top.Draws++
			bottom.Points += scoringDrawPoints
			top.Points += scoringDrawPoints
		case *match.WinnerStrategyRevisionID == bottom.StrategyRevisionID:
			bottom.Wins++
			top.Losses++
			bottom.Points += scoringWinPoints
			top.Points += scoringLossPoints
		case *match.WinnerStrategyRevisionID == top.StrategyRevisionID:
			top.Wins++
			bottom.Losses++
			top.Points += scoringWinPoints
			bottom.Points += scoringLossPoints
		default:
			bottom.Draws++
			top.Draws++
			bottom.Points += scoringDrawPoints
			top.Points += scoringDrawPoints
		}

		if match.StrategyFailureRevisionID != nil {
			failed := getMatchSetScore(scores, *match.StrategyFailureRevisionID)
			penalty := scorePenalty{
				MatchID: match.MatchID,
				Reason:  "strategy_failure",
				Points:  scoringStrategyFailurePoints,
			}
			failed.Penalties = append(failed.Penalties, penalty)
			failed.PenaltyPoints += penalty.Points
			failed.Points += penalty.Points
		}
	}

	rankings := make([]matchSetStrategyScore, 0, len(scores))
	for _, score := range scores {
		rankings = append(rankings, *score)
	}
	sort.Slice(rankings, func(leftIndex, rightIndex int) bool {
		left := rankings[leftIndex]
		right := rankings[rightIndex]
		if left.Points != right.Points {
			return left.Points > right.Points
		}
		if left.Wins != right.Wins {
			return left.Wins > right.Wins
		}
		if left.SurvivingSoldiers != right.SurvivingSoldiers {
			return left.SurvivingSoldiers > right.SurvivingSoldiers
		}
		if left.SurvivalTurns != right.SurvivalTurns {
			return left.SurvivalTurns > right.SurvivalTurns
		}
		return left.StrategyRevisionID < right.StrategyRevisionID
	})

	return matchSetScore{
		Degraded: degraded,
		Complete: complete,
		Rankings: rankings,
	}
}

func getMatchSetScore(scores map[string]*matchSetStrategyScore, strategyRevisionID string) *matchSetStrategyScore {
	if existing := scores[strategyRevisionID]; existing != nil {
		return existing
	}
	created := &matchSetStrategyScore{
		StrategyRevisionID: strategyRevisionID,
		Penalties:          []scorePenalty{},
	}
	scores[strategyRevisionID] = created
	return created
}

func determineMatchSetStatus(scoring matchSetScore, statuses []string) string {
	if len(statuses) == 0 || allStatuses(statuses, matchStatusPending) {
		return matchSetStatusPending
	}
	if anyStatus(statuses, matchStatusBlocked) {
		return matchSetStatusBlocked
	}
	if anyStatus(statuses, matchStatusRunning) {
		if anyStatus(statuses, matchStatusFailedSystem) {
			return matchSetStatusDegraded
		}
		return matchSetStatusRunning
	}
	if scoring.Degraded {
		if allStatusesIn(statuses, map[string]struct{}{matchStatusComplete: {}, matchStatusFailedSystem: {}}) {
			return matchSetStatusDegraded
		}
		return matchSetStatusRunning
	}
	if allStatuses(statuses, matchStatusComplete) {
		return matchSetStatusComplete
	}
	if allStatuses(statuses, matchStatusFailedSystem) {
		return matchSetStatusFailedSystem
	}
	return matchSetStatusRunning
}

func allStatuses(statuses []string, expected string) bool {
	for _, status := range statuses {
		if status != expected {
			return false
		}
	}
	return true
}

func anyStatus(statuses []string, expected string) bool {
	for _, status := range statuses {
		if status == expected {
			return true
		}
	}
	return false
}

func allStatusesIn(statuses []string, allowed map[string]struct{}) bool {
	for _, status := range statuses {
		if _, ok := allowed[status]; !ok {
			return false
		}
	}
	return true
}
