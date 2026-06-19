package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type customClaims[T any] struct {
	Payload T `json:"payload"`
	jwt.RegisteredClaims
}

type JWTManager[T any] interface {
	Generate(payload T) (token string, expiry time.Time, err error)
	Parse(tokenString string) (payload T, err error)
}

func NewJWTManager[T any](secret []byte, ttl time.Duration) JWTManager[T] {
	return &jwtManager[T]{
		secret:   secret,
		ttl:      ttl,
		issuer:   "vigie-api",
		audience: "vigie.auth",
		method:   jwt.SigningMethodHS256,
	}
}

type jwtManager[T any] struct {
	secret   []byte
	ttl      time.Duration
	issuer   string
	audience string
	method   jwt.SigningMethod
}

func (j *jwtManager[T]) Generate(payload T) (string, time.Time, error) {
	now := time.Now().UTC()
	expiry := now.Add(j.ttl)

	claims := customClaims[T]{
		Payload: payload,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiry),
			IssuedAt:  jwt.NewNumericDate(now),
			Issuer:    j.issuer,
			Audience:  []string{j.audience},
		},
	}

	token, err := jwt.NewWithClaims(j.method, claims).SignedString(j.secret)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("failed to generate token: %w", err)
	}

	return token, expiry, nil
}

func (j *jwtManager[T]) Parse(tokenString string) (T, error) {
	var zero T

	token, err := jwt.ParseWithClaims(tokenString, &customClaims[T]{}, func(token *jwt.Token) (any, error) {
		if token.Method.Alg() != j.method.Alg() {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return j.secret, nil
	}, jwt.WithAudience(j.audience), jwt.WithIssuer(j.issuer))
	if err != nil {
		return zero, fmt.Errorf("failed to parse token: %w", err)
	}

	if !token.Valid {
		return zero, errors.New("invalid token")
	}

	claims, ok := token.Claims.(*customClaims[T])
	if !ok {
		return zero, errors.New("invalid claims type")
	}

	return claims.Payload, nil
}
