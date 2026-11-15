// Quests and internal monologue. Phase 4.
//
// Phase 1 only fixes the shape of the API so other modules can be written
// against it. Nothing calls these yet.
const flags = new Map();

export function setFlag(name, value = true) { flags.set(name, value); }
export function getFlag(name, fallback = false) { return flags.has(name) ? flags.get(name) : fallback; }
export function allFlags() { return Object.fromEntries(flags); }
export function loadFlags(obj) { flags.clear(); for (const k in obj || {}) flags.set(k, obj[k]); }

// Called once per frame from main.js when quests exist.
export function updateQuests(_dt) {}
