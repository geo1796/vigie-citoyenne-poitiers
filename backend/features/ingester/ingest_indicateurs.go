package ingester

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strconv"

	"github.com/geo1796/vigie-citoyenne-poitiers/features/indicateur"
	"github.com/geo1796/vigie-citoyenne-poitiers/postgres/dao"
)

type indicateursDatasetOptions struct {
	key       indicateur.Key
	datasetID string
}

func (s *service) IngestIndicateurs(ctx context.Context) error {
	datasetsOptions := []indicateursDatasetOptions{
		{key: indicateur.BudgetCCAS, datasetID: "budget-du-ccas-de-poitiers-depuis-2018"},
		{key: indicateur.BudgetCommunauteUrbaine, datasetID: "budget-de-la-communaute-urbaine-de-grand-poitiers-depuis-2018"},
		{key: indicateur.BudgetVillePoitiers, datasetID: "budget-de-la-ville-de-poitiers"},
	}

	var err error
	for _, opts := range datasetsOptions {
		err = errors.Join(err, s.fetchAndIngestIndicateurs(ctx, opts))
	}

	if err != nil {
		return fmt.Errorf("failed to ingest dataset(s): %w", err)
	}
	return nil
}

func (s *service) fetchAndIngestIndicateurs(ctx context.Context, opts indicateursDatasetOptions) error {
	lines, err := s.datafair.FetchDatasetLines(ctx, opts.datasetID)
	if err != nil {
		return fmt.Errorf("fetch dataset lines: opts=%+v err=%w", opts, err)
	}

	observations, err := buildBudgetObservations(opts.key, lines)
	if err != nil {
		return fmt.Errorf("build observations: opts=%+v err=%w", opts, err)
	}

	if len(observations) == 0 {
		return nil
	}

	batchParams, err := observationsToUpsertParams(observations)
	if err != nil {
		return fmt.Errorf("marshal observations: opts=%+v err=%w", opts, err)
	}

	batch := s.queries.UpsertIndicateurObservations(ctx, batchParams)
	defer batch.Close()

	var batchErr error
	batch.Exec(func(i int, execErr error) {
		if execErr != nil && batchErr == nil {
			batchErr = fmt.Errorf("upsert observation #%d (key=%s, ref=%s): %w",
				i, observations[i].Key, observations[i].Reference, execErr)
		}
	})

	return batchErr
}

// buildBudgetObservations transforme les lignes brutes d'un dataset budget
// data-fair en observations agrégées par exercice. Elle filtre les opérations
// d'ordre (ordre = "O") et normalise les variations de nomenclature.
func buildBudgetObservations(key indicateur.Key, lines []DatasetLine) ([]indicateur.Observation, error) {
	linesByExercice := make(map[int][]indicateur.LigneBudget)

	for _, raw := range lines {
		ligne, ok, err := parseBudgetLine(raw)
		if err != nil {
			return nil, fmt.Errorf("parse line: %w", err)
		}
		if !ok {
			continue // ligne filtrée (ordre=O, exercice manquant, etc.)
		}
		exercice := int(raw["exercice"].(float64))
		linesByExercice[exercice] = append(linesByExercice[exercice], ligne)
	}

	exercices := make([]int, 0, len(linesByExercice))
	for ex := range linesByExercice {
		exercices = append(exercices, ex)
	}
	sort.Ints(exercices)

	observations := make([]indicateur.Observation, 0, len(exercices))
	for _, ex := range exercices {
		observations = append(observations, indicateur.Observation{
			Key:       key,
			Reference: strconv.Itoa(ex),
			Data: map[string]any{
				"count":  len(linesByExercice[ex]),
				"lignes": linesByExercice[ex],
			},
		})
	}
	return observations, nil
}

// parseBudgetLine extrait une LigneBudget depuis une ligne brute data-fair.
// Renvoie (_, false, nil) si la ligne doit être ignorée (opération d'ordre,
// exercice manquant, section/sens inconnus). Renvoie (_, _, err) seulement
// pour les erreurs structurelles inattendues.
func parseBudgetLine(raw DatasetLine) (indicateur.LigneBudget, bool, error) {
	// L'exercice doit être présent et entier ; sinon ligne parasite (ex: "Somme :").
	exFloat, ok := raw["exercice"].(float64)
	if !ok {
		return indicateur.LigneBudget{}, false, nil
	}
	_ = int(exFloat) // validé, utilisé par l'appelant

	categorie, ok := parseCategorie(raw["depensesrecettes"])
	if !ok {
		return indicateur.LigneBudget{}, false, nil
	}

	section, ok := parseSection(raw["section"])
	if !ok {
		return indicateur.LigneBudget{}, false, nil
	}

	libelleBudget, _ := raw["budget_libelle"].(string)
	libelleChapitre, _ := raw["libelle_du_chapitre"].(string)
	libelleFonction, _ := raw["libelle_de_la_fonction"].(string)
	codeFonctionnel, _ := parseStringOrNumber(raw["code_fonctionnel"])
	chapitre, _ := parseStringOrNumber(raw["chapitre"])
	operation, _ := raw["ordre"].(string)

	totalBP, _ := raw["total_bp"].(float64)
	var realise *float64
	if v, ok := raw["realise"].(float64); ok && v != 0 {
		realise = &v
	}

	return indicateur.LigneBudget{
		Categorie:       categorie,
		Section:         section,
		LibelleBudget:   libelleBudget,
		LibelleChapitre: libelleChapitre,
		LibelleFonction: libelleFonction,
		CodeFonctionnel: codeFonctionnel,
		Chapitre:        chapitre,
		TotalBP:         totalBP,
		Realise:         realise,
		Operation:       indicateur.LigneBudgetOperation(operation),
	}, true, nil
}

func parseStringOrNumber(v any) (string, bool) {
	switch x := v.(type) {
	case string:
		return x, true
	case float64:
		// JSON numbers always decode to float64. On formate en entier si
		// la valeur est entière (cas le plus fréquent pour chapitre et
		// code fonctionnel), sinon en float générique.
		if x == float64(int64(x)) {
			return strconv.FormatInt(int64(x), 10), true
		}
		return strconv.FormatFloat(x, 'f', -1, 64), true
	case json.Number:
		// Si jamais tu actives UseNumber() sur ton decoder, tu reçois ça.
		return x.String(), true
	case nil:
		return "", false
	}
	return "", false
}

func parseCategorie(v any) (indicateur.LigneBudgetCategorie, bool) {
	s, ok := v.(string)
	if !ok {
		return "", false
	}
	switch s {
	case "Dépenses":
		return indicateur.LigneBudgetCategorieDepenses, true
	case "Recettes":
		return indicateur.LigneBudgetCategorieRecettes, true
	default:
		return "", false
	}
}

func parseSection(v any) (indicateur.LigneBudgetSection, bool) {
	s, ok := v.(string)
	if !ok {
		return "", false
	}
	switch s {
	case "F", "Fonctionnement":
		return indicateur.LigneBudgetSectionFonctionnement, true
	case "I", "Investissement":
		return indicateur.LigneBudgetSectionInvestissement, true
	default:
		return "", false
	}
}

// observationsToUpsertParams sérialise les observations en paramètres pour
// le batch upsert sqlc. La sérialisation JSON peut échouer si une valeur
// Data n'est pas marshalable — improbable avec nos types mais on remonte
// l'erreur proprement le cas échéant.
func observationsToUpsertParams(observations []indicateur.Observation) ([]dao.UpsertIndicateurObservationsParams, error) {
	params := make([]dao.UpsertIndicateurObservationsParams, 0, len(observations))
	for _, obs := range observations {
		data, err := json.Marshal(obs.Data)
		if err != nil {
			return nil, fmt.Errorf("marshal data for key=%s ref=%s: %w",
				obs.Key, obs.Reference, err)
		}
		params = append(params, dao.UpsertIndicateurObservationsParams{
			Key:       string(obs.Key),
			Reference: obs.Reference,
			Data:      data,
		})
	}
	return params, nil
}
