package spa

import (
	"embed"
	"io"
	"io/fs"
	"net/http"

	"github.com/go-chi/chi/v5"
)

//go:embed all:dist
var distFS embed.FS

// getFS returns the embedded SPA filesystem rooted at the dist/ directory.
func getFS() fs.FS {
	sub, err := fs.Sub(distFS, "dist")
	if err != nil {
		// This can only happen if the embed directive is wrong; panic at startup
		// is acceptable here since it's a programming error, not a runtime one.
		panic(err)
	}
	return sub
}

func MountSPA(r chi.Router) {
    fsys := getFS()
    fileServer := http.FileServer(http.FS(fsys))

    // Assets buildés par Vite (cache long terme côté navigateur grâce au hash dans le nom)
    r.Handle("/assets/*", fileServer)
    r.Handle("/favicon.ico", fileServer)

    // SPA fallback : sert index.html sans rewrite d'URL
    r.NotFound(func(w http.ResponseWriter, req *http.Request) {
        f, err := fsys.Open("index.html")
        if err != nil {
            http.Error(w, "not found", http.StatusNotFound)
            return
        }
        defer f.Close()

        w.Header().Set("Content-Type", "text/html; charset=utf-8")
        w.Header().Set("Cache-Control", "no-cache")
        _, _ = io.CopyBuffer(w, f, nil)
    })
}
