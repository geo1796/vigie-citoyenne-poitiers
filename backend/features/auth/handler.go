package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/geo1796/vigie-citoyenne-poitiers/features/common/async"
	"github.com/geo1796/vigie-citoyenne-poitiers/features/common/validatorx"
	"github.com/geo1796/vigie-citoyenne-poitiers/features/common/httpx"
	"github.com/geo1796/vigie-citoyenne-poitiers/postgres/dao"
	"github.com/geo1796/vigie-citoyenne-poitiers/logger"
)

// ---------- LOGIN ----------

type LoginHandler interface {
	Login() http.HandlerFunc
}

type loginHandler struct {
	service LoginService
}

func NewLoginHandler(service LoginService) LoginHandler {
	return &loginHandler{service}
}

func (h *loginHandler) Login() http.HandlerFunc {
	return httpx.Adapt(func(w http.ResponseWriter, r *http.Request) error {
		type input struct {
			Email    string `json:"email" validate:"required,email"`
			Password string `json:"password" validate:"required,password"`
		}
		var in input
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
			return httpx.NewError(http.StatusBadRequest, err.Error())
		}
		if err := validatorx.Validate(in); err != nil {
			return httpx.NewError(http.StatusBadRequest, err.Error())
		}

		authTokens, authedUser, err := h.service.Login(r.Context(), in.Email, in.Password)
		if err != nil {
			if errors.Is(err, ErrInvalidCredentials) {
				return httpx.NewError(http.StatusUnauthorized, err.Error())
			}
			return fmt.Errorf("Login failed: %w", err)
		}

		setAuthCookies(w, authTokens)
		return httpx.JSON(w, http.StatusOK, authedUser)
	})
}

// ---------- REFRESH ----------

type RefreshHandler interface {
	Refresh() http.HandlerFunc
}

type refreshHandler struct {
	service RefreshService
}

func NewRefreshHandler(service RefreshService) RefreshHandler {
	return &refreshHandler{service}
}

func (h *refreshHandler) Refresh() http.HandlerFunc {
	return httpx.Adapt(func(w http.ResponseWriter, r *http.Request) error {
		refreshCookie, err := r.Cookie("refresh")
		if err != nil || refreshCookie.Value == "" {
			return httpx.NewError(http.StatusUnauthorized, "missing refresh cookie")
		}

		authTokens, authedUser, err := h.service.Refresh(r.Context(), refreshCookie.Value)
		if err != nil {
			if errors.Is(err, ErrInvalidRefreshToken) {
				return httpx.NewError(http.StatusUnauthorized, err.Error())
			}
			return fmt.Errorf("Refresh failed: %w", err)
		}

		setAuthCookies(w, authTokens)
		return httpx.JSON(w, http.StatusOK, authedUser)
	})
}

// ---------- LOGOUT ----------

type LogoutHandler interface {
	Logout() http.HandlerFunc
}

type logoutHandler struct {
	runner             async.Runner
	queries            *dao.Queries
	refreshTokenIssuer RefreshTokenIssuer
}

func NewLogoutHandler(runner async.Runner, queries *dao.Queries, refreshTokenIssuer RefreshTokenIssuer) LogoutHandler {
	return &logoutHandler{
		runner:             runner,
		queries:            queries,
		refreshTokenIssuer: refreshTokenIssuer,
	}
}

func (h *logoutHandler) Logout() http.HandlerFunc {
	return httpx.Adapt(func(w http.ResponseWriter, r *http.Request) error {
		refreshCookie, err := r.Cookie("refresh")
		if err != nil || refreshCookie.Value == "" {
			return httpx.NewError(http.StatusBadRequest, "invalid refresh cookie")
		}
		h.runner.Run(func(ctx context.Context) {
			if err := h.queries.DeleteRefreshTokenByHash(ctx, h.refreshTokenIssuer.Hash(refreshCookie.Value)); err != nil {
				logger.Error("Logout failed", logger.Err(err))
			}
		})

		setAuthCookies(w, AuthTokens{
			AccessToken:        "",
			AccessTokenExpiry:  time.Now(),
			RefreshToken:       "",
			RefreshTokenExpiry: time.Now(),
		})

		return httpx.NoContent(w)
	})
}

// ---------- START REGISTRATION ----------

type StartRegistrationHandler interface {
	StartRegistration() http.HandlerFunc
}

type startRegistrationHandler struct {
	service StartRegistrationService
}

func NewStartRegistrationHandler(service StartRegistrationService) StartRegistrationHandler {
	return &startRegistrationHandler{service}
}

func (h *startRegistrationHandler) StartRegistration() http.HandlerFunc {
	return httpx.Adapt(func(w http.ResponseWriter, r *http.Request) error {
		type input struct {
			Email string `json:"email" validate:"required,email"`
		}
		var in input
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
			return httpx.NewError(http.StatusBadRequest, err.Error())
		}
		if err := validatorx.Validate(in); err != nil {
			return httpx.NewError(http.StatusBadRequest, err.Error())
		}

		if err := h.service.StartRegistration(r.Context(), in.Email); err != nil {
			if errors.Is(err, ErrEmailAlreadyTaken) {
				return httpx.NewError(http.StatusConflict, err.Error())
			}
			return fmt.Errorf("StartRegistration failed: %w", err)
		}

		return httpx.NoContent(w)
	})
}

// ---------- COMPLETE REGISTRATION ----------

type CompleteRegistrationHandler interface {
	CompleteRegistration() http.HandlerFunc
}

type completeRegistrationHandler struct {
	service CompleteRegistrationService
}

func NewCompleteRegistrationHandler(service CompleteRegistrationService) CompleteRegistrationHandler {
	return &completeRegistrationHandler{service}
}

func (h *completeRegistrationHandler) CompleteRegistration() http.HandlerFunc {
	return httpx.Adapt(func(w http.ResponseWriter, r *http.Request) error {
		type input struct {
			Token    string `json:"token" validate:"required"`
			Password string `json:"password" validate:"required,password"`
		}
		var in input
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
			return httpx.NewError(http.StatusBadRequest, err.Error())
		}
		if err := validatorx.Validate(in); err != nil {
			return httpx.NewError(http.StatusBadRequest, err.Error())
		}

		if err := h.service.CompleteRegistration(r.Context(), in.Token, in.Password); err != nil {
			if errors.Is(err, ErrInvalidRegistrationToken) {
				return httpx.NewError(http.StatusUnauthorized, err.Error())
			}
			return fmt.Errorf("CompleteRegistration failed: %w", err)
		}

		return httpx.NoContent(w)
	})
}

// ---------- START PASSWORD RESET ----------

type StartPasswordResetHandler interface {
	StartPasswordReset() http.HandlerFunc
}

type startPasswordResetHandler struct {
	service StartPasswordResetService
}

func NewStartPasswordResetHandler(service StartPasswordResetService) StartPasswordResetHandler {
	return &startPasswordResetHandler{service}
}

func (h *startPasswordResetHandler) StartPasswordReset() http.HandlerFunc {
	return httpx.Adapt(func(w http.ResponseWriter, r *http.Request) error {
		type input struct {
			Email string `json:"email" validate:"required,email"`
		}
		var in input
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
			return httpx.NewError(http.StatusBadRequest, err.Error())
		}
		if err := validatorx.Validate(in); err != nil {
			return httpx.NewError(http.StatusBadRequest, err.Error())
		}

		if err := h.service.StartPasswordReset(r.Context(), in.Email); err != nil && err != ErrUserNotFound {
			return fmt.Errorf("StartPasswordReset failed: %w", err)
		}

		return httpx.NoContent(w)
	})
}

// ---------- COMPLETE PASSWORD RESET ----------

type CompletePasswordResetHandler interface {
	CompletePasswordReset() http.HandlerFunc
}

type completePasswordResetHandler struct {
	service CompletePasswordResetService
}

func NewCompletePasswordResetHandler(service CompletePasswordResetService) CompletePasswordResetHandler {
	return &completePasswordResetHandler{service}
}

func (h *completePasswordResetHandler) CompletePasswordReset() http.HandlerFunc {
	return httpx.Adapt(func(w http.ResponseWriter, r *http.Request) error {
		type input struct {
			Token    string `json:"token" validate:"required"`
			Password string `json:"newPassword" validate:"required,password"`
		}
		var in input
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
			return httpx.NewError(http.StatusBadRequest, err.Error())
		}
		if err := validatorx.Validate(in); err != nil {
			return httpx.NewError(http.StatusBadRequest, err.Error())
		}

		if err := h.service.CompletePasswordReset(r.Context(), in.Token, in.Password); err != nil {
			if errors.Is(err, ErrInvalidPasswordResetToken) {
				return httpx.NewError(http.StatusUnauthorized, err.Error())
			}
			return fmt.Errorf("CompletePasswordReset failed: %w", err)
		}

		return httpx.NoContent(w)
	})
}
