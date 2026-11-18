// Ground height. Pure maths with no Three.js dependency, so it is unit-tested
// in test/ground.test.js.
//
// Two different questions are answered here:
//   gY(z)             where STATIC things were placed when the city was built.
//                     A hard step at the kerb. Never change it: props, lamps
//                     and reflections all sit on these exact heights.
//   groundHeight(x,z) where something that MOVES should stand right now.
//                     Continuous: the kerb is a short slope and stairs/ramps
//                     registered with addRamp() are linear inclines, so a
//                     walker's target height never jumps.

export const ROAD_HALF_WIDTH = 10;   // the avenue runs along X, |z| < 10
export const SIDEWALK_Y = 0.15;
export const KERB_RUN = 0.3;         // metres over which the kerb rises

export const gY = z => Math.abs(z) < ROAD_HALF_WIDTH ? 0 : SIDEWALK_Y;

const smooth = t => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };

const ramps = [];

// Registers a walkable incline (stairs, underpass ramp, overpass deck).
//   { x0, x1, z0, z1, axis: 'x' | 'z', h0, h1 }
// Height runs linearly from h0 at the low end of `axis` to h1 at the high end.
// A flat deck is a ramp with h0 === h1.
export function addRamp(r) {
  if (!(r.x1 > r.x0) || !(r.z1 > r.z0)) throw new Error('addRamp: x1 > x0 and z1 > z0 required');
  if (r.axis !== 'x' && r.axis !== 'z') throw new Error("addRamp: axis must be 'x' or 'z'");
  ramps.push(r);
  return r;
}
export function clearRamps() { ramps.length = 0; }

export function baseHeight(z) {
  const a = Math.abs(z);
  if (a <= ROAD_HALF_WIDTH) return 0;
  if (a >= ROAD_HALF_WIDTH + KERB_RUN) return SIDEWALK_Y;
  return SIDEWALK_Y * smooth((a - ROAD_HALF_WIDTH) / KERB_RUN);
}

export function groundHeight(x, z) {
  let y = baseHeight(z);
  for (const r of ramps) {
    if (x < r.x0 || x > r.x1 || z < r.z0 || z > r.z1) continue;
    const t = r.axis === 'x' ? (x - r.x0) / (r.x1 - r.x0) : (z - r.z0) / (r.z1 - r.z0);
    const h = r.h0 + (r.h1 - r.h0) * t;
    if (h > y) y = h;
  }
  return y;
}

// Frame-rate independent easing of a height towards its target.
// Same result after 1 s whether it is called 30, 60 or 144 times.
export function followHeight(current, target, dt, rate = 14) {
  return current + (target - current) * (1 - Math.exp(-rate * dt));
}
