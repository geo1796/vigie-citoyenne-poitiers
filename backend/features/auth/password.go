package auth

import (
	"golang.org/x/crypto/bcrypt"
)

const bcryptCost = 12

func HashPassword(plain []byte) (hash []byte, err error) {
	return bcrypt.GenerateFromPassword([]byte(plain), bcryptCost)
}

func VerifyPassword(hash, plain []byte) error {
	return bcrypt.CompareHashAndPassword(hash, plain)
}
