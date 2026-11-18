// Builds a debug copy of the original single-file demo for look-regression
// checks. It adds a small `window.__dbg` handle (same shape as the dev build's)
// so both versions can be stepped frame by frame and compared pixel by pixel.
//
//   node tools/make-legacy-debug.mjs
//   npm run dev
//   open http://localhost:5173/__legacy/index.html and http://localhost:5173/
//   then follow "Checking the look" in the README.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';

const src = readFileSync('legacy/index.html', 'utf8');
const marker = 'frame();\n})();';
if (src.split(marker).length !== 2) throw new Error('legacy/index.html: expected exactly one main-loop start');
const hook = 'window.__dbg={man,camT,rainMesh,npcs,setView(y,p){yaw=y;pitch=p;},setDay(v){dayT=v;dayK=v;},canvas,frame};\n';
mkdirSync('public/__legacy', { recursive: true });
writeFileSync('public/__legacy/index.html', src.replace(marker, hook + marker));
copyFileSync('tools/lookcheck.js', 'public/__legacy/lookcheck.js');
console.log('wrote public/__legacy/ (git-ignored)');
