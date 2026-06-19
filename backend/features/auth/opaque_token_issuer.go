package auth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"time"
)

type OpaqueTokenIssuer interface {
	// Hash deterministically computes the base64url-encoded HMAC-SHA256 of the raw token
	// using the underlying secret. It allows looking up tokens by hash in storage.
	Hash(raw string) string
	Generate() (raw, hash string, expiry time.Time, err error)
}

type opaqueTokenIssuer struct {
	secret []byte
	ttl    time.Duration
}

func NewOpaqueTokenIssuer(secret []byte, ttl time.Duration) OpaqueTokenIssuer {
	return &opaqueTokenIssuer{
		secret: secret,
		ttl:    ttl,
	}
}

func (o *opaqueTokenIssuer) Hash(raw string) string {
	mac := hmac.New(sha256.New, o.secret)
	_, _ = mac.Write([]byte(raw))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func (o *opaqueTokenIssuer) Generate() (raw, hash string, expiry time.Time, err error) {
	// 32 bytes of cryptographically-secure randomness gives 256 bits of entropy.
	buf := make([]byte, 32)
	if _, err = rand.Read(buf); err != nil {
		return "", "", time.Time{}, err
	}

	// URL-safe token, no padding, convenient for JSON/URLs.
	raw = base64.RawURLEncoding.EncodeToString(buf)

	hash = o.Hash(raw)

	expiry = time.Now().UTC().Add(o.ttl)
	return
}
