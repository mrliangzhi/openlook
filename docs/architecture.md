# Architecture

```
browser tracker ──gz──> ingest ──> ClickHouse ──> replay svc ──> dashboard
     11KB              edge api      events_raw      dom stream      SPA
```

- **Tracker**: MutationObserver + fetch/XHR hooks, 5s batched flush, sendBeacon on pagehide.
- **Ingest**: stateless Go service; validates `ol_pk_*` keys, streams into `events_raw`.
- **Storage**: ClickHouse, TTL'd by `OL_RETENTION_DAYS`.
- **Replay**: materializes a session's mutation stream into frames; masking re-applied server-side.
- **Dashboard**: SPA on the app service; queries replay svc via `/v1/sessions/{id}`.
