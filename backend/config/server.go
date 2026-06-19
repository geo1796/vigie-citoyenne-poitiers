package config

type Server struct {
	Addr string
}

func loadServer() Server {
	return Server{"0.0.0.0:" + getEnv("PORT", "8080")}
}
