package auth

import (
	"fmt"
	"time"
)

type RegistrationClaims struct {
	Email string `json:"email"`
}

type RegistrationTokenManager interface {
	Generate(email string) (token string, expiry time.Time, err error)
	Parse(token string) (email string, err error)
}

type registrationTokenManager struct {
	inner JWTManager[RegistrationClaims]
}

func (a *registrationTokenManager) Generate(email string) (token string, expiry time.Time, err error) {
	return a.inner.Generate(RegistrationClaims{email})
}

func (a *registrationTokenManager) Parse(token string) (email string, err error) {
	payload, err := a.inner.Parse(token)
	if err != nil {
		return "", fmt.Errorf("invalid registration token: %w", err)
	}
	return payload.Email, nil
}

func NewRegistrationTokenManager(inner JWTManager[RegistrationClaims]) RegistrationTokenManager {
	return &registrationTokenManager{inner}
}
