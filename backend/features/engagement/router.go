package engagement

import (
	"github.com/geo1796/vigie-citoyenne-poitiers/features/auth"
	"github.com/geo1796/vigie-citoyenne-poitiers/postgres"
	"github.com/go-chi/chi/v5"
)

func Router(store postgres.Store, accessTokenManager auth.AccessTokenManager) chi.Router {
	r := chi.NewRouter()

	r.Get("/", NewListEngagementsHandler(store.Queries()).ListEngagements())
	r.Get("/{id}", NewFindEngagementHandler(store.Queries()).FindEngagement())

	r.Group(func(r chi.Router) {
		auth.UseAuthenticate(r, accessTokenManager)
		auth.UseRequireRole(r, auth.RoleContributeur)
		r.Post("/", NewCreateEngagementHandler(
			store.Queries(),
			NewCreateEngagementService(store),
		).CreateEngagement())
	})

	return r
}
