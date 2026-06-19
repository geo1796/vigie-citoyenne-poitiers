package auth

import (
	"context"
	"fmt"
	"net/http"
	"slices"

	"github.com/geo1796/vigie-citoyenne-poitiers/features/common/httpx"
	"github.com/go-chi/chi/v5"
)

func UseAuthenticate(r chi.Router, accessTokenManager AccessTokenManager) {
	r.Use(NewAuthenticateMiddleware(accessTokenManager).Authenticate)
}

type AuthenticateMiddleware interface {
	Authenticate(http.Handler) http.Handler
}

type authenticateMiddleware struct {
	accessTokenManager AccessTokenManager
}

func NewAuthenticateMiddleware(accessTokenManager AccessTokenManager) AuthenticateMiddleware {
	return &authenticateMiddleware{accessTokenManager}
}

func (m *authenticateMiddleware) Authenticate(next http.Handler) http.Handler {
	return httpx.Adapt(func(w http.ResponseWriter, r *http.Request) error {
		accessCookie, err := r.Cookie("access")
		if err != nil || accessCookie.Value == "" {
			return httpx.NewError(http.StatusUnauthorized, "missing access cookie")
		}

		authedUser, err := m.accessTokenManager.Parse(accessCookie.Value)
		if err != nil {
			return httpx.NewError(http.StatusUnauthorized, err.Error())
		}

		ctx := context.WithValue(r.Context(), "authedUser", authedUser)
		next.ServeHTTP(w, r.WithContext(ctx))
		return nil
	})
}

type RequireRoleMiddleware interface {
	RequireRole(next http.Handler) http.Handler
}

type requireRoleMiddlware struct {
	role Role
}

func UseRequireRole(r chi.Router, role Role) {
	r.Use(NewRequireRoleMiddleware(role).RequireRole)
}

func NewRequireRoleMiddleware(role Role) RequireRoleMiddleware {
	return &requireRoleMiddlware{role}
}

func (m *requireRoleMiddlware) RequireRole(next http.Handler) http.Handler {
	return httpx.Adapt(func(w http.ResponseWriter, r *http.Request) error {
		authedUser, ok := r.Context().Value("authedUser").(AuthedUser)
		if !ok {
			return httpx.NewError(http.StatusInternalServerError, "authedUser not present in context")
		}
		if !slices.Contains(authedUser.Roles, m.role) {
			return httpx.NewError(http.StatusForbidden, fmt.Sprintf("role '%s' required", m.role))
		}
		next.ServeHTTP(w, r)
		return nil
	})
}
