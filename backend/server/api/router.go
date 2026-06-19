package api

import (
	"net/http"

	"github.com/geo1796/vigie-citoyenne-poitiers/features/auth"
	"github.com/geo1796/vigie-citoyenne-poitiers/features/common/async"
	"github.com/geo1796/vigie-citoyenne-poitiers/features/common/mailer"
	"github.com/geo1796/vigie-citoyenne-poitiers/postgres"
	"github.com/geo1796/vigie-citoyenne-poitiers/features/deliberation"
	"github.com/geo1796/vigie-citoyenne-poitiers/features/engagement"
	"github.com/geo1796/vigie-citoyenne-poitiers/features/indicateur"
	"github.com/go-chi/chi/v5"
)

func Router(
	store postgres.Store,
	runner async.Runner,
	mailer mailer.Mailer,
	accessTokenManager auth.AccessTokenManager,
	registrationTokenManager auth.RegistrationTokenManager,
	refreshTokenIssuer auth.RefreshTokenIssuer,
	passwordResetTokenIssuer auth.PasswordResetTokenIssuer,
	appLinks auth.AppLinks,
) chi.Router {
	r := chi.NewRouter()

	r.NotFound(func(w http.ResponseWriter, req *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusNotFound)
		_, _ = w.Write([]byte(`{"error":"not found"}`))
	})

	r.MethodNotAllowed(func(w http.ResponseWriter, req *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusMethodNotAllowed)
		_, _ = w.Write([]byte(`{"error":"method not allowed"}`))
	})

	r.Mount("/deliberations", deliberation.Router(store.Queries()))
	r.Mount("/engagements", engagement.Router(store, accessTokenManager))
	r.Mount("/indicateurs", indicateur.Router(store.Queries()))
	r.Mount("/auth", auth.Router(
		store,
		runner,
		mailer,
		accessTokenManager,
		registrationTokenManager,
		refreshTokenIssuer,
		passwordResetTokenIssuer,
		appLinks,
	))

	return r
}
