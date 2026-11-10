# Novi Beograd — noć

A PS1-style walking simulator set in the brutalist blocks of Novi Beograd. One self-contained HTML file: all meshes, textures, audio and music are generated in the browser, and Three.js r128 (MIT) is bundled inline.

## Play

Open `index.html` in any modern browser and click to start. No install, no network.

| Key | Action |
| --- | --- |
| WASD / arrows | Walk (Shift: faster) |
| Mouse / touch drag | Orbit camera |
| E / 1 | Pivo (beer) |
| Q / 2 | Pljuga (cigarette) |
| T / 3 | Day / night |
| M | Music on / off |

## What's in it

- 320×240-class render target, vertex snapping, ordered dither and 15-bit colour, CRT overlay
- Tram, parked Yugos, K67 kiosks, graffiti, pooled sodium lamps with wet-ground reflections
- Landmarks on a minimap: Genex, Ušće, Rudo, Hram Svetog Save, Avala tower, Palata Srbije
- Pedestrians who greet you by time of day; optional real recordings in `voices/` (e.g. `voices/dobro_vece.mp3`)
- Procedural Web Audio: footsteps, wind, hum, tram clatter and a slow minor-key waltz
