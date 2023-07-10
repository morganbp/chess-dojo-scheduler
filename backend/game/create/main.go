package main

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/game"
)

type CreateGameRequest struct {
	Type        game.ImportType    `json:"type"`
	Url         string             `json:"url"`
	PgnText     string             `json:"pgnText"`
	Headers     []*game.HeaderData `json:"headers"`
	Orientation string             `json:"orientation"`
}

type CreateGameResponse struct {
	Headers []*game.HeaderData `json:"headers"`
	Count   int                `json:"count"`
}

var repository database.GamePutter = database.DynamoDB

const funcName = "game-create-handler"

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	req := CreateGameRequest{}
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		err = errors.Wrap(400, "Invalid request: body cannot be unmarshaled", "", err)
		return api.Failure(funcName, err), nil
	}
	if req.Orientation != "white" && req.Orientation != "black" {
		err := errors.New(400, "Invalid request: orientation must be `white` or `black`", "")
		return api.Failure(funcName, err), nil
	}

	var pgnText string
	var pgnTexts []string
	var err error
	if req.Type == game.LichessChapter {
		pgnText, err = game.GetLichessChapter(req.Url)
	} else if req.Type == game.LichessStudy {
		pgnTexts, err = game.GetLichessStudy(req.Url)
	} else if req.Type == game.Manual {
		pgnText = req.PgnText
	} else {
		err = errors.New(400, fmt.Sprintf("Invalid request: type `%s` not supported", req.Type), "")
	}

	if pgnTexts == nil {
		pgnTexts = []string{pgnText}
	}

	if err != nil {
		return api.Failure(funcName, err), nil
	}

	info := api.GetUserInfo(event)
	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	games, headers, err := getGames(user, pgnTexts, req.Headers, req.Orientation)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	if headers != nil {
		return api.Success(funcName, &CreateGameResponse{Headers: headers, Count: len(headers)}), nil
	}

	if len(games) == 0 {
		err := errors.New(400, "Invalid request: no games found", "")
		return api.Failure(funcName, err), nil
	}

	updated, err := repository.BatchPutGames(games)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	if err := repository.RecordGameCreation(user, updated); err != nil {
		// Only log this error as this happens on best effort
		log.Error("Failed RecordGameCreation: ", err)
	}

	if req.Type == game.LichessChapter || req.Type == game.Manual {
		return api.Success(funcName, games[0]), nil
	}
	return api.Success(funcName, &CreateGameResponse{Count: updated}), nil
}

func getGames(user *database.User, pgnTexts []string, reqHeaders []*game.HeaderData, orientation string) ([]*database.Game, []*game.HeaderData, error) {
	games := make([]*database.Game, 0, len(pgnTexts))
	headerDatas := make([]*game.HeaderData, 0, len(pgnTexts))
	missingData := false

	for i, pgnText := range pgnTexts {
		log.Debugf("Parsing game %d: %s", i+1, pgnText)

		var reqHeader *game.HeaderData = nil
		if len(reqHeaders) > i {
			reqHeader = reqHeaders[i]
		}

		g, headerData, err := game.GetGame(user, pgnText, reqHeader, orientation)
		if err != nil {
			if aerr, ok := err.(*errors.Error); ok {
				return nil, nil, errors.Wrap(400, fmt.Sprintf("Failed to read chapter %d: %s", i+1, aerr.PublicMessage), "", aerr)
			}
			return nil, nil, err
		}
		if g == nil {
			log.Debugf("Game %d is missing data. Header data: %#v", i+1, headerData)
			missingData = true
		}
		games = append(games, g)
		headerDatas = append(headerDatas, headerData)
	}

	if missingData {
		return nil, headerDatas, nil
	}

	return games, nil, nil
}

func main() {
	lambda.Start(Handler)
}
