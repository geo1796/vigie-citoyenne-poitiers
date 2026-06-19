package auth

import (
	"time"
)

type RefreshTokenIssuer interface {
	GenerateRefreshToken() (plain string, hash string, expiry time.Time, err error)
	Hash(plain string) (hash string)
}

type refreshTokenIssuer struct {
	inner OpaqueTokenIssuer
}

func (r *refreshTokenIssuer) GenerateRefreshToken() (plain string, hash string, expiry time.Time, err error) {
	return r.inner.Generate()
}

func (r *refreshTokenIssuer) Hash(plain string) (hash string) {
	return r.inner.Hash(plain)
}

func NewRefreshTokenIssuer(inner OpaqueTokenIssuer) RefreshTokenIssuer {
	return &refreshTokenIssuer{inner}
}
