import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gY, groundHeight, baseHeight, addRamp, clearRamps, followHeight, SIDEWALK_Y, ROAD_HALF_WIDTH, KERB_RUN } from '../src/ground.js';

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`);

test('gY keeps the original hard step used for static placement', () => {
  assert.equal(gY(0), 0);
  assert.equal(gY(9.99), 0);
  assert.equal(gY(-9.99), 0);
  assert.equal(gY(10), 0.15);
  assert.equal(gY(-40), 0.15);
});

test('road and sidewalk heights match the static heights away from the kerb', () => {
  near(groundHeight(0, 0), 0);
  near(groundHeight(50, 9.9), 0);
  near(groundHeight(50, ROAD_HALF_WIDTH + KERB_RUN), SIDEWALK_Y);
  near(groundHeight(-120, -80), SIDEWALK_Y);
});

test('the kerb is a continuous slope, not a step', () => {
  near(baseHeight(ROAD_HALF_WIDTH), 0);
  near(baseHeight(ROAD_HALF_WIDTH + KERB_RUN / 2), SIDEWALK_Y / 2);   // smoothstep midpoint
  // Walking across in 1 cm steps never changes height by more than 1 cm.
  let prev = groundHeight(0, 9.5);
  for (let z = 9.5; z <= 10.8; z += 0.01) {
    const y = groundHeight(0, z);
    assert.ok(Math.abs(y - prev) < 0.01, `jump of ${Math.abs(y - prev)} at z=${z}`);
    assert.ok(y >= prev - 1e-12, 'kerb height must not decrease while walking outwards');
    prev = y;
  }
  near(groundHeight(0, 10.2), groundHeight(0, -10.2));                // symmetric
});

test('stairs registered as a ramp rise linearly and meet their landings', () => {
  clearRamps();
  // 26 steps of 0.2 m over 10.4 m along +x, then a flat deck at 5.35 m.
  addRamp({ x0: 100, x1: 110.4, z0: 20, z1: 23, axis: 'x', h0: SIDEWALK_Y, h1: 5.35 });
  addRamp({ x0: 110.4, x1: 114, z0: -30, z1: 23, axis: 'z', h0: 5.35, h1: 5.35 });
  near(groundHeight(100, 21), SIDEWALK_Y);
  near(groundHeight(105.2, 21), (SIDEWALK_Y + 5.35) / 2);
  near(groundHeight(110.4, 21), 5.35);
  near(groundHeight(112, 0), 5.35);              // deck over the road
  near(groundHeight(99.9, 21), SIDEWALK_Y);      // just before the stairs
  near(groundHeight(105, 25), SIDEWALK_Y);       // beside the stairs
  // No jump anywhere along the climb, including the stair/deck seam.
  let prev = groundHeight(99, 21);
  for (let x = 99; x <= 113; x += 0.01) {
    const y = groundHeight(x, 21);
    assert.ok(Math.abs(y - prev) < 0.01, `jump at x=${x}`);
    prev = y;
  }
  clearRamps();
  near(groundHeight(105.2, 21), SIDEWALK_Y);
});

test('a ramp can run along z and descend', () => {
  clearRamps();
  addRamp({ x0: 0, x1: 4, z0: 40, z1: 50, axis: 'z', h0: 3, h1: 1 });
  near(groundHeight(2, 40), 3);
  near(groundHeight(2, 45), 2);
  near(groundHeight(2, 50), 1);
  clearRamps();
});

test('addRamp rejects malformed ramps', () => {
  assert.throws(() => addRamp({ x0: 1, x1: 1, z0: 0, z1: 1, axis: 'x', h0: 0, h1: 1 }));
  assert.throws(() => addRamp({ x0: 0, x1: 1, z0: 0, z1: 1, axis: 'y', h0: 0, h1: 1 }));
});

test('followHeight is frame-rate independent', () => {
  const run = hz => { let y = 0; for (let i = 0; i < hz; i++) y = followHeight(y, 1, 1 / hz); return y; };
  const at30 = run(30), at60 = run(60), at144 = run(144);
  near(at30, at60, 1e-9);
  near(at60, at144, 1e-9);
  near(at60, 1 - Math.exp(-14), 1e-9);           // hand-computed: one second at rate 14
  near(followHeight(0.5, 0.5, 0.016), 0.5);      // already there: stays put
});
