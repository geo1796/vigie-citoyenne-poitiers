package ingester

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/geo1796/vigie-citoyenne-poitiers/features/deliberation"
	"github.com/geo1796/vigie-citoyenne-poitiers/postgres/dao"
	"github.com/geo1796/vigie-citoyenne-poitiers/logger"
)

type deliberationsDatasetOptions struct {
	collectivite deliberation.Collectivite
	instance     deliberation.Instance
	datasetID    string
}

func (s *service) IngestDeliberations(ctx context.Context) error {
	datasetsOptions := []deliberationsDatasetOptions{
		{collectivite: deliberation.CollectivitePoitiers, instance: deliberation.InstanceConseilMunicipal, datasetID: "deliberations-poitiers"},
		{collectivite: deliberation.CollectiviteGrandPoitiers, instance: deliberation.InstanceConseilCommunautaire, datasetID: "deliberations-grand-poitiers"},
		{collectivite: deliberation.CollectiviteGrandPoitiers, instance: deliberation.InstanceBureauCommunautaire, datasetID: "deliberations-bureau-communautaire"},
	}

	var err error

	for _, opts := range datasetsOptions {
		err = errors.Join(err, s.fetchAndIngestDeliberations(ctx, opts))
	}

	if err != nil {
		return fmt.Errorf("failed to ingest dataset(s): %w", err)
	}

	return nil
}

func (s *service) fetchAndIngestDeliberations(ctx context.Context, opts deliberationsDatasetOptions) error {
	reader, cleanup, err := s.datafair.StreamDatasetCSV(ctx, opts.datasetID)
	if err != nil {
		return fmt.Errorf("failed to stream dataset: opts=%+v err=%w", opts, err)
	}
	defer cleanup()

	header, err := reader.Read()
	if err != nil {
		return fmt.Errorf("read header: %w", err)
	}

	idx := make(map[string]int, len(header))
	for i, h := range header {
		idx[strings.ToUpper(strings.TrimSpace(h))] = i
	}

	var batchParams []dao.UpsertDeliberationsParams
	for line := 2; ; line++ {
		row, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return fmt.Errorf("read row: %w", err)
		}

		params, err := mapDeliberationRow(row, idx, string(opts.collectivite), string(opts.instance))
		if err != nil {
			logger.Warn("skipping row",
				logger.Any("opts", opts),
				logger.Any("line", line),
				logger.Err(err))
			continue
		}

		batchParams = append(batchParams, params)
	}

	if len(batchParams) == 0 {
		return nil
	}

	batch := s.queries.UpsertDeliberations(ctx, batchParams)
	defer batch.Close()

	var batchErr error
	batch.Exec(func(i int, execErr error) {
		if execErr != nil && batchErr == nil {
			batchErr = fmt.Errorf("upsert row %d: %w", i, execErr)
		}
	})

	return batchErr
}

func mapDeliberationRow(row []string, idx map[string]int, collectivite, instance string) (dao.UpsertDeliberationsParams, error) {
	get := func(name string) string {
		i, ok := idx[name]
		if !ok || i >= len(row) {
			return ""
		}
		return strings.TrimSpace(row[i])
	}

	delibDate, ok := parseDate(get("DELIB_DATE"))
	if !ok {
		return dao.UpsertDeliberationsParams{}, fmt.Errorf("DELIB_DATE: invalid date %q", get("DELIB_DATE"))
	}

	var prefDate *time.Time
	if s := get("PREF_DATE"); s != "" {
		d, ok := parseDate(s)
		if !ok {
			return dao.UpsertDeliberationsParams{}, fmt.Errorf("PREF_DATE: invalid date %q", s)
		}
		prefDate = &d
	}

	var prefID *string
	if s := get("PREF_ID"); s != "" && s != "0" {
		prefID = &s
	}

	voteEffectif, err := parseInt32(get("VOTE_EFFECTIF"))
	if err != nil {
		return dao.UpsertDeliberationsParams{}, fmt.Errorf("VOTE_EFFECTIF: %w", err)
	}
	if voteEffectif == 0 {
		return dao.UpsertDeliberationsParams{}, errors.New("VOTE_EFFECTIF = 0")
	}

	voteReel, err := parseInt32(get("VOTE_REEL"))
	if err != nil {
		return dao.UpsertDeliberationsParams{}, fmt.Errorf("VOTE_REEL: %w", err)
	}
	if voteReel == 0 {
		return dao.UpsertDeliberationsParams{}, errors.New("VOTE_REEL = 0")
	}

	votePour, err := parseInt32(get("VOTE_POUR"))
	if err != nil {
		return dao.UpsertDeliberationsParams{}, fmt.Errorf("VOTE_POUR: %w", err)
	}
	voteContre, err := parseInt32(get("VOTE_CONTRE"))
	if err != nil {
		return dao.UpsertDeliberationsParams{}, fmt.Errorf("VOTE_CONTRE: %w", err)
	}
	voteAbstention, err := parseInt32(get("VOTE_ABSTENTION"))
	if err != nil {
		return dao.UpsertDeliberationsParams{}, fmt.Errorf("VOTE_ABSTENTION: %w", err)
	}

	rawMap := make(map[string]string, len(idx))
	for col, i := range idx {
		if i < len(row) {
			rawMap[col] = row[i]
		}
	}
	rawData, err := json.Marshal(rawMap)
	if err != nil {
		return dao.UpsertDeliberationsParams{}, fmt.Errorf("failed to marshal rawData: %w", err)
	}

	return dao.UpsertDeliberationsParams{
		DelibID:          get("DELIB_ID"),
		Collectivite:     collectivite,
		Instance:         instance,
		CollNom:          get("COLL_NOM"),
		CollSiret:        get("COLL_SIRET"),
		DelibDate:        delibDate,
		DelibObjet:       get("DELIB_OBJET"),
		DelibMatiereCode: get("DELIB_MATIERE_CODE"),
		DelibMatiereNom:  get("DELIB_MATIERE_NOM"),
		PrefID:           prefID,
		PrefDate:         prefDate,
		VoteEffectif:     voteEffectif,
		VoteReel:         voteReel,
		VotePour:         votePour,
		VoteContre:       voteContre,
		VoteAbstention:   voteAbstention,
		RawData:          rawData,
	}, nil
}
