package validatorx

import (
	"fmt"

	"github.com/go-playground/validator/v10"
)

var globalValidator *validator.Validate

func Validate(i any) error {
	if globalValidator == nil {
		panic("globalValidator is not initialized")
	}
	return globalValidator.Struct(i)
}

func Init() error {
	globalValidator = validator.New()

	if err := globalValidator.RegisterValidation("password", validatePassword); err != nil {
		return fmt.Errorf("failed to register password validation: %w", err)
	}
	if err := globalValidator.RegisterValidation("email", validateEmail); err != nil {
		return fmt.Errorf("failed to register email validation: %w", err)
	}

	return nil
}
