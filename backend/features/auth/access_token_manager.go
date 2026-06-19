package auth

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

type AccessTokenManager interface {
	Generate(user AuthedUser) (token string, expiry time.Time, err error)
	Parse(token string) (user AuthedUser, err error)
}

type AccessTokenClaims struct {
	ID    uuid.UUID `json:"id"`
	Email string    `json:"email"`
	Roles []Role    `json:"roles"`
}

type accessTokenManager struct {
	inner JWTManager[AccessTokenClaims]
}

func NewAccessTokenManager(inner JWTManager[AccessTokenClaims]) AccessTokenManager {
	return &accessTokenManager{inner}
}

func (a *accessTokenManager) Generate(user AuthedUser) (token string, expiry time.Time, err error) {
	return a.inner.Generate(AccessTokenClaims{
		ID:    user.ID,
		Email: user.Email,
		Roles: user.Roles,
	})
}

func (a *accessTokenManager) Parse(token string) (user AuthedUser, err error) {
	payload, err := a.inner.Parse(token)
	if err != nil {
		return AuthedUser{}, fmt.Errorf("invalid access token: %w", err)
	}
	return AuthedUser{
		ID:    payload.ID,
		Email: payload.Email,
		Roles: payload.Roles,
	}, nil
}
