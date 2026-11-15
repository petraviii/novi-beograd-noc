// Shared maths helpers and the seeded random generator.
//
// R() is a deterministic PRNG: the whole city layout depends on the ORDER in
// which modules call it (assets -> world -> tram -> npcs). Do not add calls to
// R()/rr()/pick() in code that runs before the world is built, or every
// building, car and tree will move.
import * as THREE from 'three';

export const V3 = THREE.Vector3, PI = Math.PI;
export const LITE = (window.matchMedia && matchMedia('(pointer:coarse)').matches) || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t, sm = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
export const R = (() => { let s = 2323; return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();
export const rr = (a, b) => a + R() * (b - a), pick = a => a[R() * a.length | 0];
