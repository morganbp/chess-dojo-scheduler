package database

import (
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
)

type UserCreator interface {
	// CreateUser creates a new User object with the provided information.
	CreateUser(username, email, name string) (*User, error)
}

type UserGetter interface {
	// GetUser returns the User object with the provided username.
	GetUser(username string) (*User, error)
}

type UserSetter interface {
	UserGetter

	// SetUser saves the provided User object into the database.
	SetUser(user *User) error
}

type AvailabilitySetter interface {
	// SetAvailablity inserts the provided availability into the database.
	SetAvailability(availability *Availability) error
}

type AvailabilityBooker interface {
	UserGetter

	// GetAvailability returns the Availability object with the provided owner and id.
	GetAvailability(owner, id string) (*Availability, error)

	// BookAvailablity converts the provided Availability into the provided Meeting object. The Availability
	// object is deleted and the Meeting object is saved in its place.
	BookAvailability(availability *Availability, request *Meeting) error
}

type AvailabilityDeleter interface {
	// DeleteAvailability deletes the given availability object. An error is returned if it does not exist.
	DeleteAvailability(owner, id string) error
}

// dynamoRepository implements a database using AWS DynamoDB.
type dynamoRepository struct {
	svc *dynamodb.DynamoDB
}

// DynamoDB implements the UserRepository interface using AWS DynamoDB
// as the data store.
var DynamoDB = &dynamoRepository{
	svc: dynamodb.New(session.New()),
}

var userTable = os.Getenv("stage") + "-users"
var availabilityTable = os.Getenv("stage") + "-availabilities"
var meetingTable = os.Getenv("stage") + "-meetings"

// CreateUser creates a new User object with the provided information.
func (repo *dynamoRepository) CreateUser(username, email, name string) (*User, error) {
	user := &User{
		Username: username,
		Email:    email,
		Name:     name,
	}

	err := repo.setUserConditional(user, aws.String("attribute_not_exists(username)"))
	return user, err
}

// SetUser saves the provided User object in the database.
func (repo *dynamoRepository) SetUser(user *User) error {
	return repo.setUserConditional(user, nil)
}

// setUserConditional saves the provided User object in the database using an optional condition statement.
func (repo *dynamoRepository) setUserConditional(user *User, condition *string) error {
	item, err := dynamodbattribute.MarshalMap(user)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Unable to marshal user", err)
	}

	input := &dynamodb.PutItemInput{
		ConditionExpression: condition,
		Item:                item,
		TableName:           aws.String(userTable),
	}

	_, err = repo.svc.PutItem(input)
	return errors.Wrap(500, "Temporary server error", "DynamoDB PutItem failure", err)
}

// GetUser returns the User object with the provided username.
func (repo *dynamoRepository) GetUser(username string) (*User, error) {
	input := &dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"username": {
				S: aws.String(username),
			},
		},
		TableName: aws.String(userTable),
	}

	result, err := repo.svc.GetItem(input)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "DynamoDB GetItem failure", err)
	}

	if result.Item == nil {
		return nil, errors.New(404, "Invalid request: user not found", "GetUser result.Item is nil")
	}

	user := User{}
	err = dynamodbattribute.UnmarshalMap(result.Item, &user)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to unmarshal GetUser result", err)
	}
	return &user, nil
}

// SetAvailability inserts the provided Availability into the database.
func (repo *dynamoRepository) SetAvailability(availability *Availability) error {
	item, err := dynamodbattribute.MarshalMap(availability)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Unable to marshal availability", err)
	}

	input := &dynamodb.PutItemInput{
		Item:      item,
		TableName: aws.String(availabilityTable),
	}

	_, err = repo.svc.PutItem(input)
	return errors.Wrap(500, "Temporary server error", "Failed Dynamo PutItem request", err)
}

// GetAvailability returns the availability object with the provided owner username and id.
func (repo *dynamoRepository) GetAvailability(owner, id string) (*Availability, error) {
	input := &dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"owner": {
				S: aws.String(owner),
			},
			"id": {
				S: aws.String(id),
			},
		},
		TableName: aws.String(availabilityTable),
	}

	result, err := repo.svc.GetItem(input)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "DynamoDB GetItem failure", err)
	}

	if result.Item == nil {
		return nil, errors.New(404, "Invalid request: availability not found or already booked", "GetAvailability result.Item is nil")
	}

	availability := Availability{}
	err = dynamodbattribute.UnmarshalMap(result.Item, &availability)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to unmarshal GetAvailability result", err)
	}
	return &availability, nil
}

// DeleteAvailability deletes the given availability object. An error is returned if it does not exist.
func (repo *dynamoRepository) DeleteAvailability(owner, id string) error {
	input := &dynamodb.DeleteItemInput{
		ConditionExpression: aws.String("attribute_exists(id)"),
		Key: map[string]*dynamodb.AttributeValue{
			"owner": {
				S: aws.String(owner),
			},
			"id": {
				S: aws.String(id),
			},
		},
		TableName: aws.String(availabilityTable),
	}

	if _, err := repo.svc.DeleteItem(input); err != nil {
		if aerr, ok := err.(*dynamodb.ConditionalCheckFailedException); ok {
			return errors.Wrap(404, "Invalid request: availability does not exist or is already booked", "DynamoDB conditional check failed", aerr)
		}
		return errors.Wrap(500, "Temporary server error", "Failed to unmarshal DeleteItem result", err)
	}
	return nil
}

// BookAvailablity converts the provided Availability into the provided Meeting object. The Availability
// object is deleted and the Meeting object is saved in its place.
func (repo *dynamoRepository) BookAvailability(availability *Availability, request *Meeting) error {
	// First delete the availability to make sure nobody else can book it
	if err := repo.DeleteAvailability(availability.Owner, availability.Id); err != nil {
		return err
	}

	// DynamoDB conditional expression should ensure only one person can make it here
	// for the same availability object, so it is now safe to save the meeting.
	err := repo.SetMeeting(request)
	return err
}

// SetMeeting inserts the provided Meeting into the database.
func (repo *dynamoRepository) SetMeeting(meeting *Meeting) error {
	item, err := dynamodbattribute.MarshalMap(meeting)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Unable to marshal meeting", err)
	}

	input := &dynamodb.PutItemInput{
		Item:      item,
		TableName: aws.String(meetingTable),
	}

	_, err = repo.svc.PutItem(input)
	return errors.Wrap(500, "Temporary server error", "Failed Dynamo PutItem request", err)
}
