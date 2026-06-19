package auth

import (
	"net/http"

	"github.com/geo1796/vigie-citoyenne-poitiers/features/common/async"
	"github.com/geo1796/vigie-citoyenne-poitiers/features/common/httpx"
	"github.com/geo1796/vigie-citoyenne-poitiers/features/common/mailer"
	"github.com/geo1796/vigie-citoyenne-poitiers/postgres"
	"github.com/go-chi/chi/v5"
)

func Router(
	store postgres.Store,
	runner async.Runner,
	mailer mailer.Mailer,
	accessTokenManager AccessTokenManager,
	registrationTokenManager RegistrationTokenManager,
	refreshTokenIssuer RefreshTokenIssuer,
	passwordResetTokenIssuer PasswordResetTokenIssuer,
	appLinks AppLinks,
) chi.Router {
	r := chi.NewRouter()

	r.Post("/login", NewLoginHandler(NewLoginService(
		store.Queries(),
		accessTokenManager,
		refreshTokenIssuer,
	)).Login())

	r.Post("/refresh", NewRefreshHandler(NewRefreshService(
		store,
		refreshTokenIssuer,
		accessTokenManager,
	)).Refresh())

	r.Post("/logout", NewLogoutHandler(
		runner,
		store.Queries(),
		refreshTokenIssuer,
	).Logout())

	r.Post("/start-password-reset", NewStartPasswordResetHandler(NewStartPasswordResetService(
		store.Queries(),
		passwordResetTokenIssuer,
		mailer,
		appLinks,
	)).StartPasswordReset())

	r.Post("/complete-password-reset", NewCompletePasswordResetHandler(NewCompletePasswordResetService(
		store,
		passwordResetTokenIssuer,
	)).CompletePasswordReset())

	r.Post("/complete-registration", NewCompleteRegistrationHandler(NewCompleteRegistrationService(
		store.Queries(),
		registrationTokenManager,
	)).CompleteRegistration())

	r.Group(func(r chi.Router) {
		UseAuthenticate(r, accessTokenManager)
		r.Get("/me", httpx.Adapt(func(w http.ResponseWriter, r *http.Request) error {
			authedUser, ok := r.Context().Value("authedUser").(AuthedUser)
			if !ok {
				return httpx.NewError(http.StatusInternalServerError, "authedUser not present in context")
			}
			return httpx.JSON(w, http.StatusOK, authedUser)
		}))

		r.Group(func(r chi.Router) {
			UseRequireRole(r, RoleAdmin)
			r.Post("/start-registration", NewStartRegistrationHandler(NewStartRegistrationService(
				store.Queries(),
				mailer,
				appLinks,
				registrationTokenManager,
			)).StartRegistration())
		})
	})

	return r
}
