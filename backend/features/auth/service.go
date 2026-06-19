package auth

import (
	"context"
	"errors"
	"time"

	"github.com/geo1796/vigie-citoyenne-poitiers/features/common/mailer"
	"github.com/geo1796/vigie-citoyenne-poitiers/logger"
	"github.com/geo1796/vigie-citoyenne-poitiers/postgres"
	"github.com/geo1796/vigie-citoyenne-poitiers/postgres/dao"
	"github.com/jackc/pgx/v5"
)

// ---------- LOGIN ----------

type LoginService interface {
	Login(ctx context.Context, email, password string) (AuthTokens, AuthedUser, error)
}

type loginService struct {
	queries            *dao.Queries
	accessTokenManager AccessTokenManager
	refreshTokenIssuer RefreshTokenIssuer
}

func NewLoginService(queries *dao.Queries, accessTokenManager AccessTokenManager, refreshTokenIssuer RefreshTokenIssuer) LoginService {
	return &loginService{
		queries:            queries,
		accessTokenManager: accessTokenManager,
		refreshTokenIssuer: refreshTokenIssuer,
	}
}

func (s *loginService) Login(ctx context.Context, email, password string) (AuthTokens, AuthedUser, error) {
	row, err := s.queries.FindUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			err = ErrInvalidCredentials
		}
		return AuthTokens{}, AuthedUser{}, err
	}

	if err := VerifyPassword([]byte(row.Password), []byte(password)); err != nil {
		return AuthTokens{}, AuthedUser{}, ErrInvalidCredentials
	}

	roles := make([]Role, len(row.Roles))
	for i, role := range row.Roles {
		roles[i] = Role(role)
	}
	authedUser := AuthedUser{
		ID:    row.ID,
		Email: row.Email,
		Roles: roles,
	}

	accessToken, accessTokenExpiry, err := s.accessTokenManager.Generate(authedUser)
	if err != nil {
		return AuthTokens{}, AuthedUser{}, err
	}

	refreshTokenPlain, refreshTokenHash, refreshTokenExpiry, err := s.refreshTokenIssuer.GenerateRefreshToken()
	if err != nil {
		return AuthTokens{}, AuthedUser{}, err
	}

	if err = s.queries.CreateRefreshToken(ctx, dao.CreateRefreshTokenParams{
		UserID:    row.ID,
		Hash:      refreshTokenHash,
		ExpiresAt: refreshTokenExpiry,
	}); err != nil {
		return AuthTokens{}, AuthedUser{}, err
	}

	return AuthTokens{
		AccessToken:        accessToken,
		AccessTokenExpiry:  accessTokenExpiry,
		RefreshToken:       refreshTokenPlain,
		RefreshTokenExpiry: refreshTokenExpiry,
	}, authedUser, nil
}

// ---------- REFRESH ----------

type RefreshService interface {
	Refresh(ctx context.Context, token string) (AuthTokens, AuthedUser, error)
}

type refreshService struct {
	store              postgres.Store
	refreshTokenIssuer RefreshTokenIssuer
	accessTokenManager AccessTokenManager
}

func NewRefreshService(store postgres.Store, refreshTokenIssuer RefreshTokenIssuer, accessTokenManager AccessTokenManager) RefreshService {
	return &refreshService{
		store:              store,
		refreshTokenIssuer: refreshTokenIssuer,
		accessTokenManager: accessTokenManager,
	}
}

func (s *refreshService) Refresh(ctx context.Context, inputToken string) (AuthTokens, AuthedUser, error) {
	var reuse bool
	var authTokens AuthTokens
	var authedUser AuthedUser

	err := s.store.ExecTx(ctx, func(q *dao.Queries) error {
		tokenRow, err := q.FindRefreshTokenByHashForUpdate(ctx, s.refreshTokenIssuer.Hash(inputToken))
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return ErrInvalidRefreshToken
			}
			return err
		}
		if tokenRow.DeletedAt != nil {
			reuse = true
			if err = q.DeleteRefreshTokensByUserID(ctx, tokenRow.UserID); err != nil {
				logger.Error("failed to delete refresh tokens by userID", logger.Err(err))
			}
			return ErrInvalidRefreshToken
		}
		if tokenRow.ExpiresAt.Before(time.Now()) {
			return ErrInvalidRefreshToken
		}

		userRow, err := q.FindUserByID(ctx, tokenRow.UserID)
		if err != nil {
			return err
		}

		roles := make([]Role, len(userRow.Roles))
		for i, role := range userRow.Roles {
			roles[i] = Role(role)
		}
		authedUser = AuthedUser{
			ID:    userRow.ID,
			Email: userRow.Email,
			Roles: roles,
		}

		accessToken, accessTokenExpiry, err := s.accessTokenManager.Generate(authedUser)
		if err != nil {
			return err
		}

		refreshTokenPlain, refreshTokenHash, refreshTokenExpiry, err := s.refreshTokenIssuer.GenerateRefreshToken()
		if err != nil {
			return err
		}

		if err = q.CreateRefreshToken(ctx, dao.CreateRefreshTokenParams{
			UserID:    userRow.ID,
			Hash:      refreshTokenHash,
			ExpiresAt: refreshTokenExpiry,
		}); err != nil {
			return err
		}

		authTokens = AuthTokens{
			AccessToken:        accessToken,
			AccessTokenExpiry:  accessTokenExpiry,
			RefreshToken:       refreshTokenPlain,
			RefreshTokenExpiry: refreshTokenExpiry,
		}

		return nil
	})

	if err != nil {
		return AuthTokens{}, AuthedUser{}, err
	}
	if reuse {
		return AuthTokens{}, AuthedUser{}, ErrInvalidRefreshToken
	}

	return authTokens, authedUser, nil
}

// ---------- START REGISTRATION ----------

type StartRegistrationService interface {
	StartRegistration(ctx context.Context, email string) error
}

type startRegistrationService struct {
	queries                  *dao.Queries
	mailer                   mailer.Mailer
	appLinks                 AppLinks
	registrationTokenManager RegistrationTokenManager
}

func NewStartRegistrationService(queries *dao.Queries, mailer mailer.Mailer, appLinks AppLinks, registrationTokenManager RegistrationTokenManager) StartRegistrationService {
	return &startRegistrationService{
		queries:                  queries,
		mailer:                   mailer,
		appLinks:                 appLinks,
		registrationTokenManager: registrationTokenManager,
	}
}

func (s *startRegistrationService) StartRegistration(ctx context.Context, email string) error {
	if exists, err := s.queries.UserExistsByEmail(ctx, email); err != nil {
		return err
	} else if exists {
		return ErrEmailAlreadyTaken
	}

	token, _, err := s.registrationTokenManager.Generate(email)
	if err != nil {
		return err
	}

	appLink := s.appLinks.BuildLink("inscription", map[string]string{"token": token})
	return s.mailer.Send(
		email,
		"Invitation Vigie Citoyenne de Poitiers",
		"Cliquez sur le lien ci-dessous pour créer votre compte sur la Vigie Citoyenne de Poitiers.\n\n"+appLink+"\n\nCe lien est valable pendant une durée limitée.",
	)
}

// ---------- COMPLETE REGISTRATION ----------

type CompleteRegistrationService interface {
	CompleteRegistration(ctx context.Context, token, password string) error
}

type completeRegistrationService struct {
	queries                  *dao.Queries
	registrationTokenManager RegistrationTokenManager
}

func NewCompleteRegistrationService(queries *dao.Queries, registrationTokenManager RegistrationTokenManager) CompleteRegistrationService {
	return &completeRegistrationService{
		queries:                  queries,
		registrationTokenManager: registrationTokenManager,
	}
}

func (s *completeRegistrationService) CompleteRegistration(ctx context.Context, token, password string) error {
	email, err := s.registrationTokenManager.Parse(token)
	if err != nil {
		return ErrInvalidRegistrationToken
	}

	hashedPassword, err := HashPassword([]byte(password))
	if err != nil {
		return err
	}

	return s.queries.CreateUser(ctx, dao.CreateUserParams{
		Email:    email,
		Password: string(hashedPassword),
		Roles:    []string{string(RoleContributeur)},
	})
}

// ---------- START PASSWORD RESET ----------

type StartPasswordResetService interface {
	StartPasswordReset(ctx context.Context, email string) error
}

type startPasswordResetService struct {
	queries                  *dao.Queries
	passwordResetTokenIssuer PasswordResetTokenIssuer
	mailer                   mailer.Mailer
	appLinks                 AppLinks
}

func NewStartPasswordResetService(queries *dao.Queries, passwordResetTokenIssuer PasswordResetTokenIssuer, mailer mailer.Mailer, appLinks AppLinks) StartPasswordResetService {
	return &startPasswordResetService{
		queries:                  queries,
		passwordResetTokenIssuer: passwordResetTokenIssuer,
		mailer:                   mailer,
		appLinks:                 appLinks,
	}
}

func (s *startPasswordResetService) StartPasswordReset(ctx context.Context, email string) error {
	row, err := s.queries.FindUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrUserNotFound
		}
		return err
	}

	plain, hash, expiry, err := s.passwordResetTokenIssuer.GeneratePasswordResetToken()
	if err != nil {
		return err
	}

	if err = s.queries.CreatePasswordResetToken(ctx, dao.CreatePasswordResetTokenParams{
		UserID:    row.ID,
		Hash:      hash,
		ExpiresAt: expiry,
	}); err != nil {
		return err
	}

	appLink := s.appLinks.BuildLink("password-reset", map[string]string{"token": plain})

	return s.mailer.Send(
		row.Email,
		"Réinitialisation de mot de passe",
		"Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe.\n\n"+appLink+"\n\nCe lien est valable pendant une durée limitée.",
	)
}

// ---------- COMPLETE PASSWORD RESET ----------

type CompletePasswordResetService interface {
	CompletePasswordReset(ctx context.Context, token, password string) error
}

type completePasswordResetService struct {
	store                    postgres.Store
	passwordResetTokenIssuer PasswordResetTokenIssuer
}

func NewCompletePasswordResetService(store postgres.Store, passwordResetTokenIssuer PasswordResetTokenIssuer) CompletePasswordResetService {
	return &completePasswordResetService{
		store:                    store,
		passwordResetTokenIssuer: passwordResetTokenIssuer,
	}
}

func (s *completePasswordResetService) CompletePasswordReset(ctx context.Context, token, password string) error {
	return s.store.ExecTx(ctx, func(q *dao.Queries) error {
		row, err := q.FindPasswordResetTokenByHashForUpdate(ctx, s.passwordResetTokenIssuer.Hash(token))
		if err != nil {
			return err
		}
		if row.ExpiresAt.Before(time.Now()) {
			return ErrInvalidPasswordResetToken
		}

		if err = q.DeletePasswordResetTokensByUserID(ctx, row.UserID); err != nil {
			return err
		}
		if err = q.DeleteRefreshTokensByUserID(ctx, row.UserID); err != nil {
			return err
		}

		hashedPassword, err := HashPassword([]byte(password))
		if err != nil {
			return err
		}

		_, err = q.UpdateUserPassword(ctx, dao.UpdateUserPasswordParams{
			ID:       row.UserID,
			Password: string(hashedPassword),
		})
		return err
	})
}
