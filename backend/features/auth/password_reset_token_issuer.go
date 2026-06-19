package auth

import "time"

type PasswordResetTokenIssuer interface {
	GeneratePasswordResetToken() (plain string, hash string, expiry time.Time, err error)
	Hash(plain string) (hash string)
}

type passwordResetTokenIssuer struct {
	inner OpaqueTokenIssuer
}

// GeneratePasswordResetToken implements [auth.PasswordResetTokenIssuer].
func (p *passwordResetTokenIssuer) GeneratePasswordResetToken() (plain string, hash string, expiry time.Time, err error) {
	return p.inner.Generate()
}

// Hash implements [auth.PasswordResetTokenIssuer].
func (p *passwordResetTokenIssuer) Hash(plain string) (hash string) {
	return p.inner.Hash(plain)
}

func NewPasswordResetTokenIssuer(inner OpaqueTokenIssuer) PasswordResetTokenIssuer {
	return &passwordResetTokenIssuer{inner}
}
