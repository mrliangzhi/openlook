<p align="center">
  <img src="https://openlook.shop/favicon.svg" width="48" alt="OpenLook" />
</p>
<h1 align="center">OpenLook</h1>
<p align="center"><b>Open-source session replay &amp; frontend observability</b></p>
<p align="center">
  See exactly what your users saw — clicks, scrolls, console errors and network calls,
  replayed with pixel-perfect fidelity. Self-host the whole stack in minutes.
</p>

## Features

- 🎥 **Pixel-perfect replay** — DOM-snapshot based, not video
- 🛠 **Devtools attached** — console, network waterfall and stack traces on the timeline
- ⚡ **Frustration signals** — rage clicks, dead clicks and u-turns detected automatically
- 📈 **Performance insights** — per-session web vitals (LCP / INP / CLS)
- 🔒 **Privacy by default** — on-device masking, PII never leaves the browser
- 🏠 **Self-hostable** — one `docker compose up`, nothing phones home

## Quickstart

```html
<script>
  window.openlook=window.openlook||function(){(openlook.q=openlook.q||[]).push(arguments)};
  openlook('init', 'ol_pk_xxxx');
</script>
<script async src="https://cdn.openlook.dev/v2/openlook.js"></script>
```

Or with npm:

```bash
npx @openlook/init
```

## Self-host

```bash
curl -fsSL https://get.openlook.dev | sh
cd openlook && docker compose up -d
# dashboard on http://localhost:8080
```

See [`deploy/`](./deploy) for the reference compose file.

## Repository layout

| Path | Description |
|---|---|
| [`packages/tracker`](./packages/tracker) | Browser tracker (11KB, zero deps) |
| [`packages/ingest`](./packages/ingest) | Event ingest service |
| [`deploy`](./deploy) | Docker compose &amp; self-host configs |

## License

MIT © OpenLook Labs, Inc. — see [LICENSE](./LICENSE).
