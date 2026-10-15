# @openlook/replay

DOM-snapshot replay engine. Reconstructs the recorded DOM mutation stream into a scrubbable timeline.

- `player/` — canvas-free DOM renderer (no video files)
- `timeline/` — event ↔ frame alignment, frustration markers
- `mask/` — re-applies masking rules at render time as a second safety layer
