package auth

import (
	"time"

	"github.com/google/uuid"
)

type Role string

const (
	RoleAdmin        = Role("admin")
	RoleContributeur = Role("contributeur")
)

type AuthTokens struct {
	AccessToken        string    `json:"-"`
	AccessTokenExpiry  time.Time `json:"-"`
	RefreshToken       string    `json:"-"`
	RefreshTokenExpiry time.Time `json:"-"`
}

type AuthedUser struct {
	ID    uuid.UUID `json:"-"`
	Email string    `json:"email"`
	Roles []Role    `json:"roles"`
}
