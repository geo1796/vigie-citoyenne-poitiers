package engagement

import (
	"github.com/geo1796/vigie-citoyenne-poitiers/features/auth"
	"github.com/geo1796/vigie-citoyenne-poitiers/postgres/dao"
	"github.com/go-chi/chi/v5"
)

func Router(queries *dao.Queries, accessTokenManager auth.AccessTokenManager) chi.Router {
	r := chi.NewRouter()

	r.Get("/", NewListEngagementsHandler(queries).ListEngagements())
	r.Get("/{id}", NewFindEngagementHandler(queries).FindEngagement())

	r.Group(func(r chi.Router) {
		auth.UseAuthenticate(r, accessTokenManager)
		auth.UseRequireRole(r, auth.RoleContributeur)
		r.Post("/", NewCreateEngagementHandler(queries).CreateEngagement())
		r.Post("/{id}/updates", NewCreateEngagementUpdateHandler(queries).CreateEngagementUpdate())
		r.Put("/{id}/updates/{updateId}", NewUpdateEngagementUpdateHandler(queries).UpdateEngagementUpdate())
	})

	return r
}
