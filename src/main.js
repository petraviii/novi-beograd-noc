// Entry point and main loop.
//
// Import order matters: world -> tram -> player -> npcs is the order in which
// the seeded PRNG is consumed, and it fixes the layout of the whole city.
import { LITE, clamp } from './util.js';
import { camera, renderFrame } from './render.js';
import { KX, KZ, updateLamps } from './world.js';
import { tram, updateTram } from './tram.js';
import { man, busy, startBeer, startCig, updatePlayer, getFlame } from './player.js';
import { updateNpcs } from './npcs.js';
import { updateEffects } from './effects.js';
import { updateAudio, updateMonologue } from './audio.js';
import { updateDayNight } from './dayNight.js';
import { input, bindActions } from './input.js';
import { updateHud } from './hud.js';
import { updateQuests } from './quests.js';
import { game, caption, day } from './state.js';

bindActions({ beer: startBeer, cig: startCig });

let lastTime = performance.now();

function frame() {
  requestAnimationFrame(frame);
  // Variable timestep, capped: every system below scales by dt, so speed is
  // the same at 30, 60 or 144 Hz and motion stays smooth at any refresh rate.
  const now = performance.now();
  const dt = Math.min(.05, (now - lastTime) / 1000); lastTime = now; game.time += dt;
  const t = game.time, pos = man.position;
  if (!game.started) input.yaw += dt * .07;

  updateDayNight(dt, t);
  const p = updatePlayer(dt, t);
  updateTram(dt, t, pos.x);

  if (LITE && camera.far !== 190) { camera.far = 190; camera.updateProjectionMatrix(); }
  updateMonologue(dt, game.started && !busy() && caption.t <= 0);
  if (caption.t > 0) { caption.t -= dt; if (caption.t <= 0) caption.text = ''; }
  updateNpcs(dt, t, pos);
  updateQuests(dt);

  const { near, kd } = updateLamps(dt, t, pos, p.fx, p.fz, p.cx, p.cy, p.cz);
  const flame = getFlame();
  const sAmb = Math.max(day.dk * .95, .2 + .8 * clamp(1 - Math.min(near, kd) / 15, 0, 1) * day.lampOn);
  const gust = .5 + .25 * Math.sin(t * .13) + .25 * Math.sin(t * .31 + 2);
  updateEffects(dt, t, p.cx, p.cz, sAmb, flame, gust);
  updateAudio(t, gust, near, kd, day.lampOn, tram, p.cx, p.cy, p.cz, p.rx, p.rz);

  updateHud(dt);
  renderFrame();
}

// Dev-only handle for look-regression checks (compare against legacy/index.html).
if (import.meta.env.DEV) {
  import('./effects.js').then(fx => import('./npcs.js').then(n => {
    window.__dbg = {
      man, rainMesh: fx.rainMesh, npcs: n.npcs, canvas: document.getElementById('game'),
      setView(y, pt) { input.yaw = y; input.pitch = pt; },
      setDay(v) { day.T = v; day.K = v; },
      frame,
    };
  }));
}
frame();
