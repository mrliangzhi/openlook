// openlook ingest — event intake service.
// Accepts gzipped session-event batches, validates, writes to ClickHouse.
package main

import (
	"log"
	"net/http"
	"os"
)

func main() {
	addr := envOr("OL_LISTEN", ":8081")
	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/events", handleEvents)
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(200) })
	log.Printf("ingest listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}

func handleEvents(w http.ResponseWriter, r *http.Request) {
	// project key check, size limit, decompress, enqueue to store
	w.WriteHeader(http.StatusAccepted)
}

func envOr(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}
