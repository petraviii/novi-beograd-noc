// Pedestrians: they wander the sidewalks and greet the player by time of day.
import * as THREE from 'three';
import './tram.js'; // must be built first: it draws from the seeded PRNG before the pedestrians do
import { PI, LITE, R, rr, pick, sm } from './util.js';
import { scene, lam } from './render.js';
import { B } from './assets.js';
import { free } from './world.js';
import { mk, grp, mSkin, mHair, mBoot } from './player.js';
import { greet } from './audio.js';
import { game } from './state.js';

const npcs=[],palJ=[0x3a3f48,0x4a3a30,0x2c3a2e,0x50505a,0x5a2a2a,0x2a3050,0x6a6050].map(c=>lam(c)),palP=[0x1c1c22,0x2a2a30,0x22262e,0x30281e].map(c=>lam(c));
function person(){const g=new THREE.Group(),jm=pick(palJ),pm=pick(palP),old=R()<.3;
 const hp=grp(g,0,.88,0);mk(B(.36,.2,.24),pm,hp);
 const to=grp(hp,0,.08,0);mk(B(old?.5:.44,.56,.3),jm,to,0,.3,0);
 const hd=grp(to,0,.6,0);mk(B(.19,.22,.2),mSkin,hd,0,.11,0);
 if(old)mk(B(.23,.16,.24),pick(palJ),hd,0,.17,-.01);else if(R()<.5)mk(B(.2,.07,.21),mHair,hd,0,.215,0);else mk(B(.21,.1,.22),pick(palP),hd,0,.2,0);
 const arm=sd=>{const a=grp(to,sd*.28,.52,0);mk(B(.12,.56,.13),jm,a,0,-.28,0);mk(B(.08,.08,.08),mSkin,a,0,-.6,0);return a;};
 const leg=sd=>{const l=grp(hp,sd*.1,-.06,0);mk(B(.15,.8,.17),pm,l,0,-.4,0);mk(B(.14,.08,.26),mBoot,l,0,-.8,.04);return l;};
 g.scale.setScalar(rr(.92,1.06));scene.add(g);
 return{g,hp,aL:arm(1),aR:arm(-1),lL:leg(1),lR:leg(-1),ph:rr(0,6),sp:old?.7:rr(.95,1.3),f0:R()<.5?rr(95,130):rr(170,225),tx:0,tz:0,st:0,tm:0,cd:rr(0,4)};}
function npcTarget(n){const p=n.g.position;for(let i=0;i<20;i++){const a=Math.random()*6.28,d=8+Math.random()*30,x=p.x+Math.sin(a)*d,z=p.z+Math.cos(a)*d;
 if(Math.abs(z)>11.3&&z*p.z>0&&Math.abs(x)<236&&Math.abs(z)<232&&free(x,z,.5)){n.tx=x;n.tz=z;return;}}n.tx=p.x;n.tz=p.z;n.tm=2;}
for(let i=0;i<(LITE?12:20);i++){const n=person();for(let k=0;k<60;k++){const x=i<7?rr(-45,45):rr(-160,160),z=i<7?rr(11.6,30):(R()<.5?1:-1)*rr(11.6,100);if(free(x,z,.6)&&Math.hypot(x+4,z-17)>5){n.g.position.set(x,.15,z);break;}}
 if(Math.abs(n.g.position.z)<11)n.g.position.set(rr(-30,30),.15,12.5);npcTarget(n);npcs.push(n);}
let greetCd=0;
const GR_N=['Dobro veče!','Laku noć!','Zdravo, kako si?','Ćao, kako si?','Dobro veče, komšija!','Laku noć, komšija!'],GR_D=['Dobro jutro!','Dobar dan!','Zdravo, kako si?','Ćao, kako si?','Dobro jutro, komšija!','Dobar dan, kako si?'];

function updateNpcs(dt, t, pos) {
 greetCd-=dt;
 for(const n of npcs){const p=n.g.position,dx=pos.x-p.x,dz=pos.z-p.z,dp=Math.hypot(dx,dz);if(dp>95)continue;n.cd-=dt;let amt=0;
  if(n.st===1){n.tm-=dt;const d=((Math.atan2(dx,dz)-n.g.rotation.y+PI)%(2*PI)+2*PI)%(2*PI)-PI;n.g.rotation.y+=d*Math.min(1,dt*6);
   const w=sm(Math.min(n.tm,2.6-n.tm)*3);n.aR.rotation.x=-2.7*w;n.aR.rotation.z=(-.25+Math.sin(t*9)*.28)*w;if(n.tm<=0){n.st=0;n.aR.rotation.z=0;}}
  else if(game.started&&dp<3.6&&n.cd<=0&&greetCd<=0){n.st=1;n.tm=2.6;n.cd=45;greetCd=4.5;greet(n);}
  else if(n.tm>0)n.tm-=dt;
  else{const ex=n.tx-p.x,ez=n.tz-p.z,el=Math.hypot(ex,ez);
   if(el<.6){npcTarget(n);if(Math.random()<.3)n.tm=1+Math.random()*4;}
   else{const nx=p.x+ex/el*n.sp*dt,nz=p.z+ez/el*n.sp*dt;if(free(nx,nz,.3)&&Math.abs(nz)>10.9){p.x=nx;p.z=nz;amt=1;const d=((Math.atan2(ex,ez)-n.g.rotation.y+PI)%(2*PI)+2*PI)%(2*PI)-PI;n.g.rotation.y+=d*Math.min(1,dt*7);}else npcTarget(n);}}
  n.ph+=amt*n.sp*dt*4.6;const sw=Math.sin(n.ph)*amt;n.lL.rotation.x=-sw*.45;n.lR.rotation.x=sw*.45;n.aL.rotation.x=sw*.35;if(n.st!==1)n.aR.rotation.x=-sw*.35;n.hp.position.y=.88-Math.abs(sw)*.025;}
}
export { npcs, updateNpcs };
