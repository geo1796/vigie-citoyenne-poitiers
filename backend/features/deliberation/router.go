package deliberation

import (
	"github.com/geo1796/vigie-citoyenne-poitiers/postgres/dao"
	"github.com/go-chi/chi/v5"
)

func Router(queries *dao.Queries) chi.Router {
	r := chi.NewRouter()

	r.Get("/", NewListDeliberationsHandler(queries).ListDeliberations())
	r.Get("/{id}", NewFindDeliberationHandler(queries).FindDeliberation())

	return r
}
