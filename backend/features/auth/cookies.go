package auth

import "net/http"

func setAuthCookies(w http.ResponseWriter, authTokens AuthTokens) {
	http.SetCookie(w, &http.Cookie{
		Name:     "access",
		Value:    authTokens.AccessToken,
		Path:     "/api/v1/",
		Expires:  authTokens.AccessTokenExpiry,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh",
		Value:    authTokens.RefreshToken,
		Path:     "/api/v1/auth/",
		Expires:  authTokens.RefreshTokenExpiry,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	})
}
