// openlook ingest — event intake service.
// Accepts gzipped session-event batches, validates project keys,
// and writes to ClickHouse via async batches.
package main

import (
	"compress/gzip"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

const (
	maxBodyBytes = 2 << 20 // 2 MiB
	flushEvery   = 2 * time.Second
	flushAt      = 2000
)

var store = &writer{ch: make(chan []byte, 8192)}

func main() {
	addr := envOr("OL_LISTEN", ":8081")
	go store.run()
	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/events", handleEvents)
	mux.HandleFunc("POST /v1/batch", handleEvents)
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(200) })
	srv := &http.Server{Addr: addr, Handler: mux, ReadTimeout: 5 * time.Second}
	log.Printf("ingest listening on %s", addr)
	log.Fatal(srv.ListenAndServe())
}

type envelope struct {
	Key       string          `json:"k"`
	SessionID string          `json:"sid"`
	Events    json.RawMessage `json:"ev"`
}

func handleEvents(w http.ResponseWriter, r *http.Request) {
	if r.ContentLength > maxBodyBytes {
		http.Error(w, "payload too large", http.StatusRequestEntityTooLarge)
		return
	}
	var body io.Reader = r.Body
	if strings.Contains(r.Header.Get("Content-Encoding"), "gzip") {
		gz, err := gzip.NewReader(r.Body)
		if err != nil {
			http.Error(w, "bad gzip", http.StatusBadRequest)
			return
		}
		defer gz.Close()
		body = gz
	}
	raw, err := io.ReadAll(io.LimitReader(body, maxBodyBytes))
	if err != nil {
		http.Error(w, "read error", http.StatusBadRequest)
		return
	}
	var env envelope
	if err := json.Unmarshal(raw, &env); err != nil || env.Key == "" || env.SessionID == "" {
		http.Error(w, "invalid envelope", http.StatusBadRequest)
		return
	}
	if !validKey(env.Key) {
		http.Error(w, "unknown project key", http.StatusForbidden)
		return
	}
	store.ch <- raw
	w.WriteHeader(http.StatusAccepted)
}

func validKey(k string) bool {
	// TODO: cache project keys from control plane; reject bad early.
	return strings.HasPrefix(k, "ol_pk_") && len(k) >= 10
}

type writer struct {
	ch  chan []byte
	mu  sync.Mutex
	buf [][]byte
}

func (w *writer) run() {
	t := time.NewTicker(flushEvery)
	defer t.Stop()
	for {
		select {
		case b := <-w.ch:
			w.mu.Lock()
			w.buf = append(w.buf, b)
			full := len(w.buf) >= flushAt
			w.mu.Unlock()
			if full {
				w.flush()
			}
		case <-t.C:
			w.flush()
		}
	}
}

func (w *writer) flush() {
	w.mu.Lock()
	defer w.mu.Unlock()
	if len(w.buf) == 0 {
		return
	}
	// TODO: batch insert into events_raw
	w.buf = w.buf[:0]
}

func envOr(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}
