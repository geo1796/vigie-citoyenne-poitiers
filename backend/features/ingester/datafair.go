package ingester

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"

	"golang.org/x/text/encoding/charmap"
	"golang.org/x/text/transform"
)

const (
	// maxLinesPageSize est la taille de page maximum supportée par data-fair pour
	// l'endpoint /lines. Au-delà l'API rejette la requête.
	maxLinesPageSize = 10000
	datafairBaseURL  = "https://data.grandpoitiers.fr/data-fair/api/v1/datasets"
)

type DatafairClient interface {
	FetchDatasetLines(ctx context.Context, datasetID string) ([]DatasetLine, error)
	StreamDatasetCSV(ctx context.Context, datasetID string) (*csv.Reader, func(), error)
}

type datafairClient struct {
	http *http.Client
}

func NewDatafairClient(http *http.Client) DatafairClient {
	return &datafairClient{http}
}

// DatasetLine représente une ligne brute d'un dataset data-fair. Le contenu
// est délibérément non typé : chaque calculator décode les champs dont il a
// besoin selon le schéma du dataset qu'il consomme.
type DatasetLine map[string]any

// linesResponse correspond à la structure de réponse de l'endpoint /lines.
// On n'expose pas ce type publiquement, on agrège les pages côté client.
type linesResponse struct {
	Total   int           `json:"total"`
	Results []DatasetLine `json:"results"`
	Next    string        `json:"next,omitempty"`
}

func buildNextURL(s string) (string, error) {
	u, err := url.Parse(s)
	if err != nil {
		return "", fmt.Errorf("failed to parse url: %w", err)
	}
	q := u.Query()
	q.Set("size", strconv.Itoa(maxLinesPageSize))
	u.RawQuery = q.Encode()
	return u.String(), nil
}
// FetchDatasetLines récupère toutes les lignes d'un dataset data-fair en JSON,
// en gérant la pagination automatiquement. Renvoie l'intégralité des lignes
// chargées en mémoire — adapté aux datasets de taille modérée (jusqu'à quelques
// dizaines de milliers de lignes). Pour des datasets plus volumineux, envisager
// une variante streaming via canal.
func (d *datafairClient) FetchDatasetLines(ctx context.Context, datasetID string) ([]DatasetLine, error) {
	nextURL, err := buildNextURL(fmt.Sprintf("%s/%s/lines", datafairBaseURL, datasetID))
	if err != nil {
		return nil, fmt.Errorf("failed build initial url: %w", err)
	}

	var all []DatasetLine

	for nextURL != "" {
		page, err := d.fetchLinesPage(ctx, nextURL)
		if err != nil {
			return nil, fmt.Errorf("fetch page: %w", err)
		}

		all = append(all, page.Results...)
		if page.Next != "" {
			nextURL, err = buildNextURL(page.Next)
			if err != nil {
				return nil, fmt.Errorf("failed to build nextURL: %w", err)
			}
		} else {
			nextURL = ""
		}

		// Garde-fou : on s'attend à ce que data-fair ne renvoie pas un Next
		// circulaire, mais si l'API se comporte mal, cap à 100 pages
		// (soit jusqu'à 1M de lignes au max size). Au-delà, on échoue
		// explicitement plutôt que de boucler indéfiniment.
		if len(all) > maxLinesPageSize*100 {
			return nil, errors.New("pagination overflow: too many pages, possible API loop")
		}
	}

	return all, nil
}

// fetchLinesPage exécute une seule requête HTTP vers l'URL fournie et décode
// la réponse JSON. L'URL doit être complète (avec ses paramètres de pagination).
func (d *datafairClient) fetchLinesPage(ctx context.Context, requestURL string) (*linesResponse, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		return nil, fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Accept", "application/json")

	res, err := d.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("execute request: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		snippet, _ := io.ReadAll(io.LimitReader(res.Body, 1024))
		return nil, fmt.Errorf("unexpected status %d: %s", res.StatusCode, snippet)
	}

	var page linesResponse
	if err := json.NewDecoder(res.Body).Decode(&page); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}

	return &page, nil
}

func (d *datafairClient) StreamDatasetCSV(ctx context.Context, datasetID string) (*csv.Reader, func(), error) {
	u, err := url.Parse(fmt.Sprintf("%s/%s/convert", datafairBaseURL, datasetID))
	if err != nil {
		return nil, nil, fmt.Errorf("failed to build url: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to build request: %w", err)
	}
	req.Header.Set("Accept", "text/csv")

	res, err := d.http.Do(req)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to execute request: %w", err)
	}

	if res.StatusCode != http.StatusOK {
		snippet, _ := io.ReadAll(io.LimitReader(res.Body, 1024))
		res.Body.Close()
		return nil, nil, fmt.Errorf("unexpected status: %d: %s", res.StatusCode, snippet)
	}

	utf8Body := transform.NewReader(res.Body, charmap.Windows1252.NewDecoder())
	reader := csv.NewReader(utf8Body)
	reader.Comma = ';'
	reader.FieldsPerRecord = -1 // tolère les variations de colonnes
	reader.LazyQuotes = true    // tolère les guillemets internes mal échappés

	cleanup := func() { res.Body.Close() }
	return reader, cleanup, nil
}
