package ingester

import (
	"fmt"
	"net/http"
	"net/url"
	"regexp"
	"strings"

	"github.com/PuerkitoBio/goquery"
	"github.com/geo1796/vigie-citoyenne-poitiers/features/deliberation"
	"github.com/geo1796/vigie-citoyenne-poitiers/logger"
	"github.com/google/uuid"
)

const WebdelibPoitiers = "villewebdelib"
const WebdelibGrandPoitiers = "gdpwebdelib"

var openDocPattern = regexp.MustCompile(`f_openDoc\("([^"]+)"`)

type WebdelibClient interface {
	ResolveDeliberationDocuments(id uuid.UUID, delibID string, instance deliberation.Instance) ([]deliberation.Document, error)
}

type webdelibClient struct {
	http *http.Client
}

func NewWebdelibClient(http *http.Client) WebdelibClient {
	return &webdelibClient{http}
}

func (w *webdelibClient) ResolveDeliberationDocuments(id uuid.UUID, delibID string, instance deliberation.Instance) ([]deliberation.Document, error) {
	if !instance.IsValid() {
		return nil, fmt.Errorf("invalid instance for deliberation: {id=%s delibID=%s instance=%s}", id, delibID, instance)
	}

	form := url.Values{
		"recGlobale":    {delibID},
		"hideRecDetail": {"false"},
		"nbresults":     {"50"},
		"SEA_ASSEMBLE":  {instance.Label()},
	}

	var webdelib string
	if instance == deliberation.InstanceConseilMunicipal {
		webdelib = WebdelibPoitiers
	} else {
		webdelib = WebdelibGrandPoitiers
	}

	req, err := http.NewRequest(http.MethodPost,
		"https://webdelib.grandpoitiers.fr/"+webdelib+"/servlet/WebDelibSearchServlet",
		strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := w.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("webdelib: unexpected status=%d for delibID=%s", resp.StatusCode, delibID)
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return nil, err
	}
	logger.Debug("webdlib", logger.Any("doc", doc.Text()))

	base := resp.Request.URL // .../servlet/WebDelibSearchServlet
	var out []deliberation.Document

	doc.Find("table.tabledelib tbody tr").Each(func(_ int, row *goquery.Selection) {
		cells := row.Find("td")

		// colonne N° : 4e cellule de données (après identifiant masqué, doc, fiche)
		numero := strings.TrimSpace(cells.Eq(3).Text())
		if numero != delibID {
			return // désambiguïsation déterministe sur le numéro exact
		}
		// colonne N° : 6e cellule de données (après identifiant masqué, doc, fiche, numéro, titre)
		assemble := strings.TrimSpace(cells.Eq(5).Text())
		if assemble != instance.Label() {
			return // désambiguïsation déterministe sur l'assemblée
		}

		// La cellule "Documents" peut contenir plusieurs liens :
		// la délibération elle-même + ses annexes (PV, etc.). On les prend tous.
		row.Find("td a[href^='javascript:f_openDoc']").Each(func(_ int, a *goquery.Selection) {
			href, _ := a.Attr("href")
			m := openDocPattern.FindStringSubmatch(href)
			if m == nil {
				return
			}

			u := *base
			u.Path = "/" + webdelib + "/servlet/WebDelibOpenFileServlet"
			u.RawQuery = url.Values{"fileName": {m[1]}}.Encode()

			out = append(out, deliberation.Document{
				URL: u.String(),
				// le libellé est dans le title de l'<img>, par document :
				// "Délibération", "Procès-verbal du Conseil municipal du 17 juin 2024"…
				Label: strings.TrimSpace(a.Find("img").AttrOr("title", "")),
			})
		})
	})

	return out, nil
}
