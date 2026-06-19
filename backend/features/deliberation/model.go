package deliberation

import (
	"time"

	"github.com/google/uuid"
)

type Collectivite string
type Instance string

const (
	CollectivitePoitiers      Collectivite = "poitiers"
	CollectiviteGrandPoitiers Collectivite = "grand_poitiers"

	InstanceConseilMunicipal     Instance = "conseil_municipal"
	InstanceConseilCommunautaire Instance = "conseil_communautaire"
	InstanceBureauCommunautaire  Instance = "bureau_communautaire"
)

func (i Instance) Label() string {
	switch i {
	case InstanceBureauCommunautaire:
		return "Bureau Communautaire"
	case InstanceConseilCommunautaire:
		return "Conseil Communautaire"
	case InstanceConseilMunicipal:
		return "Conseil Municipal"
	default:
		return ""
	}
}

func (i Instance) IsValid() bool {
	switch i {
	case InstanceBureauCommunautaire:
		return true
	case InstanceConseilCommunautaire:
		return true
	case InstanceConseilMunicipal:
		return true
	default:
		return false
	}
}

type Deliberation struct {
	ID uuid.UUID `json:"id"`

	DelibID string `json:"delibId"`

	Collectivite Collectivite `json:"collectivite"`
	Instance     Instance     `json:"instance"`

	CollNom   string `json:"collNom"`
	CollSiret string `json:"collSiret"`

	DelibDate        time.Time `json:"delibDate"`
	DelibMatiereCode string    `json:"delibMatiereCode"`
	DelibMatiereNom  string    `json:"delibMatiereNom"`
	DelibObjet       string    `json:"delibObjet"`

	PrefID   *string    `json:"prefId,omitempty"`
	PrefDate *time.Time `json:"prefDate,omitempty"`

	VoteEffectif   int `json:"voteEffectif"`
	VoteReel       int `json:"voteReel"`
	VotePour       int `json:"votePour"`
	VoteContre     int `json:"voteContre"`
	VoteAbstention int `json:"voteAbstention"`

	RawData []byte `json:"rawData,omitempty"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Document struct {
	URL   string `json:"url"`
	Label string `json:"label"`
}
