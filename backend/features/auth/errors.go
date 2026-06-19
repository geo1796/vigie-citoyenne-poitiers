package auth

type Error string

func (e Error) Error() string {
	return string(e)
}

const (
	ErrUserNotFound       = Error("user not found")
	ErrInvalidCredentials = Error("invalid credentials")
	ErrEmailAlreadyTaken  = Error("email already taken")

	ErrInvalidPasswordResetToken = Error("invalid password reset token")

	ErrInvalidRefreshToken = Error("invalid refresh token")

	ErrInvalidRegistrationToken = Error("invalid registration token")
)
