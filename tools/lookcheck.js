// Look-regression helper. Loaded in the browser console on both the legacy debug
// copy and the dev build (see "Checking the look" in the README). It stops the
// normal animation loop and steps frames with a fake clock, so both versions
// render exactly the same simulated time.
//   __cap(key)            seven low-res frame signatures -> localStorage[key]
//   __diff(keyA, keyB)    per-shot mean/max difference between two captures
//   __full(key, shot)     one full-resolution frame; shot = [x, z, yaw, pitch, day]
//   __fullDiff(a, b)      count of differing pixels between two full frames
window.requestAnimationFrame = () => 0;
window.__cap = (key) => {
  const d = window.__dbg; let ft = performance.now(); performance.now = () => ft;
  const shots = [[-4,17,-1.5708,.36,0],[30,14,0.6,.2,0],[-40,40,2.2,.3,0],[5,25,3.1,.25,0],[60,-30,1.0,.3,0],[-4,17,-1.5708,.36,1],[30,14,0.6,.2,1]];
  const out = []; d.rainMesh.visible = false; d.npcs.forEach(n => n.g.visible = false);
  for (const s of shots) {
    d.man.position.set(s[0], .15, s[1]); d.setDay(s[4]);
    for (let i = 0; i < 120; i++) { ft += 16.667; d.setView(s[2], s[3]); d.frame(); }
    const c = document.createElement('canvas'); c.width = 40; c.height = 30; const g = c.getContext('2d');
    g.drawImage(d.canvas, 0, 0, 40, 30);
    out.push(Array.from(g.getImageData(0, 0, 40, 30).data).filter((_, i) => i % 4 !== 3));
  }
  localStorage.setItem(key, JSON.stringify(out)); return out.length;
};
window.__diff = (ka, kb) => { const a = JSON.parse(localStorage.getItem(ka)), b = JSON.parse(localStorage.getItem(kb)); return b.map((s, i) => { let sum = 0, mx = 0; for (let k = 0; k < s.length; k++) { const e = Math.abs(s[k] - a[i][k]); sum += e; if (e > mx) mx = e; } return 'shot' + i + ' meanDiff ' + (sum / s.length).toFixed(2) + ' max ' + mx + ' mean ' + (s.reduce((x, y) => x + y, 0) / s.length).toFixed(1); }); };
window.__full = (key, s) => {
  const d = window.__dbg; let ft = performance.now(); performance.now = () => ft;
  d.rainMesh.visible = false; d.npcs.forEach(n => n.g.visible = false);
  d.man.position.set(s[0], .15, s[1]); d.setDay(s[4]);
  for (let i = 0; i < 120; i++) { ft += 16.667; d.setView(s[2], s[3]); d.frame(); }
  const W = d.canvas.width, H = d.canvas.height, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.drawImage(d.canvas, 0, 0); localStorage.setItem(key, c.toDataURL('image/png')); return W + 'x' + H;
};
window.__fullDiff = async (ka, kb) => {
  const load = k => new Promise(r => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0); r(g.getImageData(0, 0, im.width, im.height)); }; im.src = localStorage.getItem(k); });
  const a = await load(ka), b = await load(kb), W = a.width, H = a.height; let n = 0, big = 0; const cells = {};
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; const e = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2])); if (e > 0) n++; if (e > 16) { big++; const k = (x >> 5) + ',' + (y >> 5); cells[k] = (cells[k] || 0) + 1; } }
  return { pixels: W * H, differing: n, over16: big, cells32px: cells };
};
