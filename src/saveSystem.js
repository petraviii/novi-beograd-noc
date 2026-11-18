// Save / load. Phase 4 wires this to Save Benches ([F]).
//
// Phase 1 only fixes the storage format and API. Nothing calls these yet.
// Storage is localStorage in the browser; the desktop build (Phase 5) can swap
// the two functions at the bottom for a file on disk.
const KEY = 'novi-beograd-noc.save';
export const SAVE_VERSION = 1;

// state: { x, z, heading, dayT, clockMin, flags }
export function save(state) {
  const doc = { version: SAVE_VERSION, savedAt: new Date().toISOString(), ...state };
  try { writeRaw(JSON.stringify(doc)); return true; } catch (e) { return false; }
}

export function load() {
  try {
    const raw = readRaw(); if (!raw) return null;
    const doc = JSON.parse(raw);
    return doc && doc.version === SAVE_VERSION ? doc : null;
  } catch (e) { return null; }
}

export function clearSave() { try { localStorage.removeItem(KEY); } catch (e) { /* storage unavailable */ } }

function writeRaw(text) { localStorage.setItem(KEY, text); }
function readRaw() { return localStorage.getItem(KEY); }
