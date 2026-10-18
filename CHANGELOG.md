# Changelog

## [2.4.0] — 2026-10-18

### Added
- Performance insights: per-session web vitals (LCP, INP, CLS) on the timeline
- Rage-click and dead-click detection with frustration scoring
- `data-ol-ignore` subtree exclusion attribute
- Self-host: `OL_RETENTION_DAYS` retention control

### Fixed
- Ingest: backpressure drops under burst load (#41)
- Tracker: duplicate `input` events on React controlled inputs (#38)
- Replay: iframe boundary offset on scroll restore (#33)

## [2.3.0] — 2026-09-21

### Added
- Network waterfall view with request/response bodies (opt-in)
- EU region pinning for cloud workspaces
