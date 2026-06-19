package auth

import "net/url"

const BaseLink = "https://vigie-citoyenne.fr/"

type AppLinks interface {
	BuildLink(path string, fragment map[string]string) string
}

type appLinks struct {
	baseURL *url.URL
}

func NewAppLinks() (AppLinks, error) {
	baseURL, err := url.Parse(BaseLink)
	if err != nil {
		return nil, err
	}

	return &appLinks{baseURL: baseURL}, nil
}

func (al *appLinks) BuildLink(path string, fragment map[string]string) string {
	u := al.baseURL.ResolveReference(&url.URL{Path: path})

	if len(fragment) > 0 {
		f := url.Values{}
		for k, v := range fragment {
			f.Set(k, v)
		}
		u.Fragment = f.Encode()
	}

	return u.String()
}