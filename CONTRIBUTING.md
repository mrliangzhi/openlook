# Contributing to OpenLook

Thanks for helping build open-source observability. A few ground rules:

- **Issues first** for anything non-trivial — let's agree on direction before code.
- Keep the tracker dependency-free. Bundle size is a feature: core must stay under 12KB gzipped.
- Conventional commits: `feat(scope):`, `fix(scope):`, `docs:`, `chore:`.
- Run `pnpm test` and `pnpm lint` before opening a PR. CI must be green.

## Dev setup

```bash
pnpm install
pnpm dev        # runs tracker against a local fixture page
pnpm test
```

Self-host dev: `docker compose -f deploy/docker-compose.dev.yml up`.
