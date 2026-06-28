package auth

import (
	"context"
	"errors"
)

func WithAuthedUser(ctx context.Context, authedUser AuthedUser) context.Context {
	return context.WithValue(ctx, "authedUser", authedUser)
}

func ReadAuthedUser(ctx context.Context) (AuthedUser, error) {
	authedUser, ok := ctx.Value("authedUser").(AuthedUser)
	if !ok {
		return AuthedUser{}, errors.New("authedUser not set in context")
	}
	return authedUser, nil
}
