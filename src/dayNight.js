// Time of day: blends fog, ambient and moon/sky light between night and
// overcast daylight, dims lit windows and switches the street lamps.
// Phase 2 extends this with dusk and a gradual automatic cycle.
import * as THREE from 'three';
import { clamp, lerp, sm } from './util.js';
import { scene } from './render.js';
import { amb, moon, bMats, veMat, beacons } from './world.js';
import { day } from './state.js';

const cNF = new THREE.Color(0x05070a), cDF = new THREE.Color(0x3d434a), cNA = new THREE.Color(0x3a4864), cDA = new THREE.Color(0x8c94a2), cNM = new THREE.Color(0x27324a), cDM = new THREE.Color(0xa2a8ae);

export function toggleDay() { day.T = 1 - day.T; return day.T; }

export function updateDayNight(dt, t) {
  day.K += clamp(day.T - day.K, -dt * .5, dt * .5);
  const dk = sm(day.K), lampOn = 1 - sm(day.K * 1.7);
  day.dk = dk; day.lampOn = lampOn;
  scene.fog.color.copy(cNF).lerp(cDF, dk); scene.fog.density = lerp(.045, .0165, dk);
  amb.color.copy(cNA).lerp(cDA, dk); amb.intensity = lerp(.62, .86, dk);
  moon.color.copy(cNM).lerp(cDM, dk); moon.intensity = lerp(.35, .6, dk);
  const ei = lerp(1, .22, dk); for (const m of bMats) m.emissiveIntensity = ei;
  veMat.color.setScalar(lerp(1, .5, dk));
  for (const b of beacons) b.material.opacity = (Math.sin(t * 2.4 + b.userData.ph) > .2 ? 1 : .25) * (1 - .75 * dk);
}
