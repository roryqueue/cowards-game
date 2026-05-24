package main

import "sort"

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
