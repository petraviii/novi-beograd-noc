// Keyboard, mouse-drag and touch (virtual stick + buttons) input.
// Gameplay actions are injected with bindActions() so this file does not
// import the player (which reads `input` every frame).
import { clamp, PI } from './util.js';
import { game, day } from './state.js';
import { initAudio, resumeAudio, toggleMusic } from './audio.js';

export const input = { keys: {}, yaw: .6, pitch: .16, jx: 0, jy: 0, touchUI: false };
const actions = { beer() {}, cig() {} };
export function bindActions(a) { Object.assign(actions, a); }

const keys = input.keys;
let drag = null, joy = null;

function start() {
  if (game.started) return;
  game.started = true; initAudio();
  document.getElementById('start').classList.add('off');
  input.yaw = -PI / 2; input.pitch = .36;
}

addEventListener('keydown', e => {
  if (e.repeat) return;
  if (!game.started) { start(); } else resumeAudio();
  keys[e.code] = true;
  if (e.code === 'KeyE' || e.code === 'Digit1') actions.beer();
  if (e.code === 'KeyQ' || e.code === 'Digit2') actions.cig();
  if (e.code === 'KeyT' || e.code === 'Digit3') day.T = 1 - day.T;
  if (e.code === 'KeyM') toggleMusic();
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

const jbEl = document.getElementById('jb'), jkEl = document.getElementById('jk');
function touchOn() { if (input.touchUI) return; input.touchUI = true; document.getElementById('tb').style.display = 'grid'; jbEl.style.display = 'block'; }
function joyHome() { jbEl.style.left = '28px'; jbEl.style.top = ''; jbEl.style.bottom = '60px'; jkEl.style.transform = ''; }

document.addEventListener('pointerdown', e => {
  if (!game.started) { start(); if (e.pointerType === 'touch') touchOn(); return; }
  resumeAudio();
  if (e.pointerType === 'touch') {
    touchOn();
    if (e.clientX < innerWidth * .5 && e.clientY > innerHeight * .3 && !joy) {
      joy = { id: e.pointerId, x: e.clientX, y: e.clientY };
      jbEl.style.left = (e.clientX - 57) + 'px'; jbEl.style.bottom = 'auto'; jbEl.style.top = (e.clientY - 57) + 'px';
      return;
    }
  }
  if (!drag) drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
});
document.addEventListener('pointermove', e => {
  if (drag && e.pointerId === drag.id) {
    input.yaw -= (e.clientX - drag.x) * .006;
    input.pitch = clamp(input.pitch + (e.clientY - drag.y) * .004, -.22, .95);
    drag.x = e.clientX; drag.y = e.clientY;
  } else if (joy && e.pointerId === joy.id) {
    let vx = (e.clientX - joy.x) / 50, vy = (e.clientY - joy.y) / 50;
    const vl = Math.hypot(vx, vy); if (vl > 1) { vx /= vl; vy /= vl; }
    input.jx = vx; input.jy = vy;
    jkEl.style.transform = 'translate(' + vx * 42 + 'px,' + vy * 42 + 'px)';
  }
});
const pup = e => {
  if (drag && e.pointerId === drag.id) drag = null;
  if (joy && e.pointerId === joy.id) { joy = null; input.jx = input.jy = 0; joyHome(); }
  resumeAudio();
};
document.addEventListener('pointerup', pup); document.addEventListener('pointercancel', pup);
document.addEventListener('contextmenu', e => e.preventDefault());
document.getElementById('bE').addEventListener('pointerdown', e => { e.stopPropagation(); actions.beer(); });
document.getElementById('bQ').addEventListener('pointerdown', e => { e.stopPropagation(); actions.cig(); });
document.getElementById('bT').addEventListener('pointerdown', e => { e.stopPropagation(); day.T = 1 - day.T; e.currentTarget.textContent = day.T ? 'NOĆ' : 'DAN'; });
document.getElementById('bM').addEventListener('pointerdown', e => { e.stopPropagation(); const on = toggleMusic(); e.currentTarget.style.opacity = on ? 1 : .45; });
