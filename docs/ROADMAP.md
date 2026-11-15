# Roadmap

Rule for every phase: the PS1 look of the original demo (`legacy/index.html`) is the
reference. Rendering changes are checked with the look check in the README.

Status: `[x]` done and verified, `[~]` built but needs a human playtest, `[ ]` not started.

## Phase 1 — Modular architecture and smooth movement

- [x] Vite project; original demo preserved in `legacy/`
- [x] Split into modules: `world`, `player`, `dayNight`, `audio`, `render`, `assets`,
      `tram`, `npcs`, `effects`, `hud`, `input`, `state`, `ground`
- [x] `quests.js` and `saveSystem.js` API stubs (not wired yet)
- [x] Split verified pixel-identical to the original on Three.js r128
- [x] Upgrade to `three@0.187.0` with the look preserved (custom per-vertex material,
      colour management off, 16-bit depth); verified against the original
- [x] Continuous ground height: sloped kerb, `addRamp()` for stairs and decks, unit tests
- [x] Movement sub-steps on slow frames
- [~] Human playtest: walking feel, touch controls on a phone

## Phase 2 — Lighting and time of day

- [ ] Night stays as in the demo: readable, never pitch-black
- [ ] Overcast Belgrade Day and Dusk presets
- [ ] `[T]` steps through modes; slow automatic cycle with smooth blending

## Phase 3 — Expanding the map

- [ ] Blocks loaded around the player, connected avenues
- [ ] Red-and-cream GSP trams on a timetable, more lit K67 kiosks
- [ ] Underpasses and overpasses (walkable via `addRamp()`)
- [ ] Landmarks: Genex, Ušće, Palata Srbije walkable; Hram and Avala on the skyline

## Phase 4 — Saves, quests and activities

- [ ] Save Benches under streetlamps (`[F]`), wired to `saveSystem.js`
- [ ] Quest log and internal monologue, wired to `quests.js`
- [ ] New interactions next to `[E]` Pivo and `[Q]` Pljuga

## Phase 5 — Desktop app and co-creator workflow

- [ ] Windows `.exe` (Electron recommended: identical rendering to the browser)
- [ ] Release builds on GitHub Actions
- [ ] GitHub milestones per phase; Notion page with roadmap, ideas inbox, playtest notes
