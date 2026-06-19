package indicateur

import (
	"time"

	"github.com/google/uuid"
)

type Key string

const (
	BudgetCCAS              Key = "budget_ccas"
	BudgetCommunauteUrbaine Key = "budget_communaute_urbaine"
	BudgetVillePoitiers     Key = "budget_ville_poitiers"
)

func (k Key) IsValid() bool {
	switch k {
	case BudgetCCAS:
		return true
	case BudgetCommunauteUrbaine:
		return true
	case BudgetVillePoitiers:
		return true
	default:
		return false
	}
}

type Indicateur struct {
	Key               Key       `json:"key"`
	FirstReference    string    `json:"firstReference"`
	LastReference     string    `json:"lastReference"`
	LastUpdate        time.Time `json:"lastUpdate"`
	ObservationsCount int       `json:"observationsCount"`
}

type Observation struct {
	ID uuid.UUID `json:"id"`

	Key Key `json:"key"`

	Reference string `json:"reference"`

	Data map[string]any `json:"data"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type LigneBudgetCategorie string

const (
	LigneBudgetCategorieDepenses LigneBudgetCategorie = "depenses"
	LigneBudgetCategorieRecettes LigneBudgetCategorie = "recettes"
)

type LigneBudgetSection string

const (
	LigneBudgetSectionFonctionnement = "fonctionnement"
	LigneBudgetSectionInvestissement = "investissement"
)

type LigneBudgetOperation string

const (
	LigneBudgetOperationNormal LigneBudgetOperation = "normal"
	LigneBudgetOperationOrdre  LigneBudgetOperation = "ordre"
)

type LigneBudget struct {
	LibelleBudget   string               `json:"libelleBudget"`
	LibelleChapitre string               `json:"libelleChapitre"`
	LibelleFonction string               `json:"libelleFonction"`
	CodeFonctionnel string               `json:"codeFonctionnel"`
	Chapitre        string               `json:"chapitre"`
	Categorie       LigneBudgetCategorie `json:"categorie"`
	Section         LigneBudgetSection   `json:"section"`
	Operation       LigneBudgetOperation `json:"operation"`
	TotalBP         float64              `json:"totalBP"`
	Realise         *float64             `json:"realise"`
}
