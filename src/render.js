// Renderer and the PS1 pipeline: low-res render target, vertex snapping,
// ordered dither + 15-bit colour post pass. This file defines the look.
import * as THREE from 'three';
import { clamp } from './util.js';
import { PS1Lambert } from './ps1Material.js';

// The demo was authored without colour management (Three.js r128 behaviour):
// hex colours and canvas textures go to the screen as written. Keep it that
// way so every colour in the game stays exactly what it was.
THREE.ColorManagement.enabled = false;

export const view = { W: 320, H: 240 };
let rt = null;
export const canvas = document.getElementById('game');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
export const FOG = 0x05070a;
export const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(FOG, 0.045);
scene.background = scene.fog.color;
export const camera = new THREE.PerspectiveCamera(80, 4 / 3, 0.1, 270);
const snapU = { value: new THREE.Vector2(160, 120) };
// vertex snapping for the unlit built-in materials: clip-space xy quantised
// to the low-res pixel grid -> polygon wobble
function ps1(m){
 m.onBeforeCompile=sh=>{
  sh.uniforms.uSnap=snapU;
  sh.vertexShader='uniform vec2 uSnap;\n'+sh.vertexShader.replace('#include <project_vertex>',
   '#include <project_vertex>\n if(gl_Position.w>0.0){vec2 sp=gl_Position.xy/gl_Position.w;sp=floor(sp*uSnap+0.5)/uSnap;gl_Position.xy=sp*gl_Position.w;}');
 };
 return m;
}
// Lit surfaces: per-vertex lighting with snapping built in (see ps1Material.js).
const lam=(color,o)=>new PS1Lambert(snapU,Object.assign({color},o||{}));
const bas=(color,o)=>ps1(new THREE.MeshBasicMaterial(Object.assign({color},o||{})));
// post pass: ordered dither + 15-bit colour quantisation
const postScene=new THREE.Scene(),postCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const postMat=new THREE.ShaderMaterial({
 uniforms:{tD:{value:null}},depthTest:false,depthWrite:false,
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
 fragmentShader:`uniform sampler2D tD;varying vec2 vUv;
 float B2(vec2 a){a=floor(a);return fract(a.x/2.+a.y*a.y*.75);}
 float B4(vec2 a){return B2(.5*a)*.25+B2(a);}
 void main(){vec3 c=texture2D(tD,vUv).rgb;
  c=pow(c,vec3(.82))*1.12;
  float d=B4(gl_FragCoord.xy)-.47;
  c=floor(c*31.+.5+d)/31.;
  gl_FragColor=vec4(clamp(c,0.,1.),1.);}`});
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),postMat));

const resizeListeners = [];
export function onResize(fn) { resizeListeners.push(fn); }
export function resize() {
 const a = innerWidth / Math.max(1, innerHeight);
 if (a >= 1) { view.H = 240; view.W = clamp(Math.round(240 * a / 2) * 2, 320, 560); } else { view.W = 240; view.H = clamp(Math.round(240 / a / 2) * 2, 320, 520); }
 const W = view.W, H = view.H;
 renderer.setSize(W, H, false);
 if (rt) rt.dispose();
 rt = new THREE.WebGLRenderTarget(W, H, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
 // 16-bit depth, as Three.js r128 allocated. The coarse depth makes nearly
 // coplanar surfaces (lit kiosk windows, signs, decals) resolve by draw order
 // exactly as they did in the original demo. 24-bit depth changes which wins.
 rt.depthTexture = new THREE.DepthTexture(W, H, THREE.UnsignedShortType);
 postMat.uniforms.tD.value = rt.texture;
 snapU.value.set(W / 2, H / 2);
 camera.aspect = W / H; camera.updateProjectionMatrix();
 for (const fn of resizeListeners) fn(W, H);
}
addEventListener('resize', resize); resize();

// Static scene object: bake its matrix once.
export function fix(o) { o.updateMatrix(); o.matrixAutoUpdate = false; scene.add(o); return o; }

export function renderFrame() {
 renderer.setRenderTarget(rt); renderer.render(scene, camera);
 renderer.setRenderTarget(null); renderer.render(postScene, postCam);
}
export { ps1, lam, bas };
