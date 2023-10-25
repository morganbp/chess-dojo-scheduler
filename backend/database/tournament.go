package database

import (
	"fmt"
	"strings"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
)

type TournamentType string

const (
	TournamentType_Swiss TournamentType = "SWISS"
	TournamentType_Arena TournamentType = "ARENA"
)

type LeaderboardType string

const (
	LeaderboardType_OpenClassical LeaderboardType = "OPEN_CLASSICAL"
)

const CurrentLeaderboard = "CURRENT"

var LeaderboardNames = []LeaderboardType{
	"ARENA",
	"SWISS",
	"GRAND_PRIX",
	"MIDDLEGAME_SPARRING",
	"ENDGAME_SPARRING",
}

var TimeControls = []string{
	"BLITZ",
	"RAPID",
	"CLASSICAL",
}

// LeaderboardPlayer represents a single player in the tournament leaderboards.
type LeaderboardPlayer struct {
	// The Lichess username of the player.
	Username string `dynamodbav:"username" json:"username"`

	// The Lichess rating of the player.
	Rating int `dynamodbav:"rating" json:"rating"`

	// The score of the player in the given leaderboard.
	Score float32 `dynamodbav:"score" json:"score"`
}

type Leaderboard struct {
	// The type of the leaderboard and the hash key of the table. Follows this format:
	// LEADERBOARD_(MONTHLY|YEARLY)_(ARENA|SWISS|GRAND_PRIX|MIDDLEGAME_SPARRING|ENDGAME_SPARRING)_(BLITZ|RAPID|CLASSICAL)
	Type LeaderboardType `dynamodbav:"type" json:"type"`

	// The start of the period the leaderboard applies to and the range key of the table.
	// For the current leaderboard, this is set to the value of CurrentLeaderboard.
	StartsAt string `dynamodbav:"startsAt" json:"startsAt"`

	// The time control of the leaderboard. Valid values are blitz, rapid and classical.
	TimeControl string `dynamodbav:"timeControl" json:"timeControl"`

	// The players in the leaderboard, sorted by their score.
	Players []LeaderboardPlayer `dynamodbav:"players" json:"players"`
}

// SetLeaderboard inserts the provided leaderboard into the database.
func (repo *dynamoRepository) SetLeaderboard(leaderboard Leaderboard) error {
	item, err := dynamodbattribute.MarshalMap(leaderboard)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Unable to marshal leaderboard", err)
	}

	input := &dynamodb.PutItemInput{
		Item:      item,
		TableName: aws.String(tournamentTable),
	}
	_, err = repo.svc.PutItem(input)
	return errors.Wrap(500, "Temporary server error", "Failed DynamoDB PutItem request", err)
}

// GetLeaderboard fetches the leaderboard with the provided values.
func (repo *dynamoRepository) GetLeaderboard(timePeriod, tournamentType, timeControl, startsAt string) (*Leaderboard, error) {
	timePeriod = strings.ToUpper(timePeriod)
	tournamentType = strings.ToUpper(tournamentType)
	timeControl = strings.ToUpper(timeControl)

	leaderboardType := fmt.Sprintf("LEADERBOARD_%s_%s_%s", timePeriod, tournamentType, timeControl)
	input := &dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"type": {
				S: aws.String(leaderboardType),
			},
			"startsAt": {
				S: aws.String(startsAt),
			},
		},
		TableName: aws.String(tournamentTable),
	}

	leaderboard := Leaderboard{
		Type:        LeaderboardType(leaderboardType),
		StartsAt:    startsAt,
		TimeControl: timeControl,
	}
	err := repo.getItem(input, &leaderboard)
	return &leaderboard, err
}

// OpenClassicalPlayer represents a player in the Open Classical tournaments, which
// are separate from the regular tournaments.
type OpenClassicalPlayer struct {
	// The Lichess username of the player
	LichessUsername string `dynamodbav:"lichessUsername" json:"lichessUsername"`

	// The Discord username of the player
	DiscordUsername string `dynamodbav:"discordUsername" json:"discordUsername"`

	// The player's title, if they have one
	Title string `dynamodbav:"title" json:"title"`

	// The player's Lichess rating at the start of the Open Classical
	Rating int `dynamodbav:"rating" json:"rating"`
}

// OpenClassicalPairing represents a single pairing in the Open Classical tournaments,
// which are separate from the regular leaderboards.
type OpenClassicalPairing struct {
	// The player with the white pieces
	White OpenClassicalPlayer `dynamodbav:"white" json:"white"`

	// The player with the black pieces
	Black OpenClassicalPlayer `dynamodbav:"black" json:"black"`

	// The result of the game
	Result string `dynamodbav:"result" json:"result"`
}

// OpenClassicalRound represents a single round in the Open Classical tournaments.
type OpenClassicalRound struct {
	// The list of pairings for the round
	Pairings []OpenClassicalPairing `dynamodbav:"pairings" json:"pairings"`
}

// OpenClassical represents an Open Classical tournament.
type OpenClassical struct {
	// The hash key of the tournaments table. Regular tournaments have a complicated
	// structure, but for Open Classicals, this is just the value OPEN_CLASSICAL
	Type LeaderboardType `dynamodbav:"type" json:"type"`

	// The start of the period the tournament applies to and the range key of the table.
	// For the current Open Classical, this is set to the value of CurrentLeaderboard.
	StartsAt string `dynamodbav:"startsAt" json:"startsAt"`

	// The rounds in the tournament
	Rounds []OpenClassicalRound `dynamodbav:"rounds" json:"rounds"`
}

// SetOpenClassical inserts the provided OpenClassical into the database.
func (repo *dynamoRepository) SetOpenClassical(openClassical *OpenClassical) error {
	openClassical.Type = LeaderboardType_OpenClassical

	item, err := dynamodbattribute.MarshalMap(openClassical)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Unable to marshall open classical", err)
	}

	input := &dynamodb.PutItemInput{
		Item:      item,
		TableName: aws.String(tournamentTable),
	}
	_, err = repo.svc.PutItem(input)
	return errors.Wrap(500, "Temporary server error", "Failed DynamoDB PutItem request", err)
}

// GetOpenClassical returns the open classical for the provided startsAt period.
func (repo *dynamoRepository) GetOpenClassical(startsAt string) (*OpenClassical, error) {
	input := &dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"type": {
				S: aws.String(string(LeaderboardType_OpenClassical)),
			},
			"startsAt": {
				S: aws.String(startsAt),
			},
		},
		TableName: aws.String(tournamentTable),
	}

	openClassical := OpenClassical{}
	err := repo.getItem(input, &openClassical)
	return &openClassical, err
}
