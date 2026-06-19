package validatorx

import (
	"regexp"

	"github.com/go-playground/validator/v10"
)

const minPasswordLen = 8
const maxPasswordLen = 50

func validatePassword(fl validator.FieldLevel) bool {
	password := fl.Field().String()

	if password == "" {
		return true
	}

	// Check length
	if len(password) < minPasswordLen || len(password) > maxPasswordLen {
		return false
	}

	// Check for numeric character
	if match, _ := regexp.MatchString(`[0-9]`, password); !match {
		return false
	}

	// Check for uppercase character
	if match, _ := regexp.MatchString(`[A-Z]`, password); !match {
		return false
	}

	// Check for lowercase character
	if match, _ := regexp.MatchString(`[a-z]`, password); !match {
		return false
	}

	// Check for special character
	if match, _ := regexp.MatchString(`[!@#$%^&*(),.?:|<>]`, password); !match {
		return false
	}

	return true
}
