// The protagonist: rig, walking, collisions, the Pivo/Pljuga actions and the
// over-the-shoulder camera.
import * as THREE from 'three';
import { V3, PI, clamp, lerp, sm } from './util.js';
import { scene, camera, lam, bas } from './render.js';
import { B, Cy, taper, mergeGeo } from './assets.js';
import { colliders, blocked } from './world.js';
import { groundHeight, followHeight } from './ground.js';
import { sfx, mumbleSelf, MB, MC } from './audio.js';
import { puff, tossed } from './effects.js';
import { input } from './input.js';
import { game } from './state.js';

const man=new THREE.Group();scene.add(man);
const mJack=lam(0x1d1d22),mPant=lam(0x1a1a1f),mBoot=lam(0x0e0e10),mCap=lam(0x141418),mSkin=lam(0xb48c72),mHair=lam(0x1a1512);
const mk=(g,m,p,x,y,z)=>{const o=new THREE.Mesh(g,m);o.position.set(x||0,y||0,z||0);p.add(o);return o;};
const grp=(p,x,y,z)=>{const o=new THREE.Group();o.position.set(x||0,y||0,z||0);p.add(o);return o;};
const HIP=.91;
const hips=grp(man,0,HIP,0);mk(B(.34,.18,.22),mPant,hips);
const torso=grp(hips,0,.08,0);
mk(taper(B(.5,.58,.3),.94,.92),mJack,torso,0,.3,0);mk(B(.53,.13,.33),mJack,torso,0,.03,0);
mk(B(.3,.13,.14),mJack,torso,0,.6,-.12);mk(B(.1,.08,.1),mSkin,torso,0,.6,0);
const head=grp(torso,0,.62,0);
mk(B(.19,.22,.2),mSkin,head,0,.11,.01);mk(B(.2,.15,.07),mHair,head,0,.085,-.075);
mk(B(.215,.12,.225),mCap,head,0,.195,.005);
{const b=mk(B(.17,.02,.16),mCap,head,0,.155,.17);b.rotation.x=.3;const l=mk(B(.05,.02,.15),mCap,head,.1,.146,.165);l.rotation.set(.3,0,-.4);const r=mk(B(.05,.02,.15),mCap,head,-.1,.146,.165);r.rotation.set(.3,0,.4);}
function limbArm(side){const a=grp(torso,side*.3,.5,0);a.rotation.order='YXZ';mk(B(.14,.32,.15),mJack,a,0,-.16,0);const e=grp(a,0,-.32,0);mk(B(.125,.28,.135),mJack,e,0,-.14,0);mk(B(.08,.09,.09),mSkin,e,0,-.32,0);return{a,e};}
const AL=limbArm(1),AR=limbArm(-1);
function limbLeg(side){const l=grp(hips,side*.1,-.04,0);mk(B(.15,.42,.17),mPant,l,0,-.21,0);const k=grp(l,0,-.42,0);mk(B(.13,.4,.15),mPant,k,0,-.2,0);mk(B(.14,.1,.27),mBoot,k,0,-.4,.05);return{l,k};}
const LL=limbLeg(1),LR=limbLeg(-1);
// beer can (right hand) & cigarette (left hand)
const canG=mergeGeo([{g:Cy(.034,.034,.13,6).rotateX(PI/2),c:0x2a7a40},{g:Cy(.03,.03,.01,6).rotateX(PI/2),c:0xb0b0b0,z:.068},{g:B(.071,.03,.05),c:0xd8d0b0}]);
const canMat=lam(0xffffff,{vertexColors:true});
const handCan=mk(canG,canMat,AR.e,0,-.33,.03);
const cigM=grp(AL.e,0,-.35,.04);mk(B(.014,.014,.075),bas(0xb8b4a8),cigM,0,0,.035);
const tipMat=bas(0xff6010);const cigTip=mk(B(.016,.016,.016),tipMat,cigM,0,0,.078);cigM.visible=false;
const faceLight=new THREE.PointLight(0xffa040,0,5,1.6);faceLight.position.set(.06,.08,.36);head.add(faceLight);
man.position.set(-4,.15,17);
let heading=PI/2,phase=0,curSpeed=0,stepIdx=0,dirX=1,dirZ=0;
man.rotation.y=heading;

const beer={t:-1,pre:0,sips:0,ev:0,hide:0},cig={t:-1,mode:0,ev:0,lit:false,left:0,emit:0};
const busy=()=>beer.t>=0||cig.t>=0;
function startBeer(){if(!game.started||busy()||beer.hide>0)return;beer.t=0;beer.ev=0;beer.pre=beer.sips===0?.85:0;if(beer.pre)sfx.beerOpen(.3);}
function startCig(){if(!game.started||busy())return;cig.t=0;cig.ev=0;cig.mode=cig.lit?1:0;cigM.visible=true;}
const tv=new V3(),tv2=new V3();
let wB=0,wC=0,tilt=0,flame=0,dragGlow=0;
function updateActions(dt,t){
 wB=0;tilt=0;
 if(beer.t>=0){beer.t+=dt;const u=beer.t-beer.pre,base=beer.pre?.34:0;
  if(u<0)wB=.34*sm(beer.t/.3);else if(u<.55)wB=lerp(base,1,sm(u/.55));else if(u<1.9)wB=1;else wB=1-sm((u-1.9)/.6);
  tilt=sm((u-.45)/.4)*(1-sm((u-1.65)/.35));
  if(beer.ev===0&&u>.85){beer.ev=1;sfx.gulp();}
  if(beer.ev===1&&u>1.3){beer.ev=2;sfx.gulp();}
  if(u>2.5){beer.t=-1;mumbleSelf(MB,.25);if(++beer.sips>=4){beer.sips=0;beer.hide=1.6;handCan.visible=false;
    handCan.getWorldPosition(tv);const m=new THREE.Mesh(canG,canMat);m.position.copy(tv);m.rotation.set(Math.random()*3,Math.random()*3,0);scene.add(m);
    tossed.push({m,vx:-Math.sin(heading+1.3)*2.2,vy:1.6,vz:-Math.cos(heading+1.3)*2.2,rest:false});if(tossed.length>14)scene.remove(tossed.shift().m);}}
 }
 if(beer.hide>0){beer.hide-=dt;if(beer.hide<=0)handCan.visible=true;}
 wC=0;flame=0;dragGlow=0;
 if(cig.t>=0){cig.t+=dt;const u=cig.t;
  if(cig.mode===0){
   wC=u<.5?sm(u/.5):u<2.0?1:1-sm((u-2.0)/.6);
   if(cig.ev===0&&u>.62){cig.ev=1;sfx.flick();}
   if(u>.62&&u<.7)flame=2.2;
   if(cig.ev===1&&u>1.0){cig.ev=2;sfx.flick();sfx.flame();}
   if(u>1.0&&u<1.8)flame=1.5+Math.random()*.9;
   if(cig.ev===2&&u>1.15){cig.ev=3;sfx.inhale();cig.lit=true;cig.left=85;}
   if(u>1.15&&u<1.95)dragGlow=1;
   if(cig.ev===3&&u>2.45){cig.ev=4;exhale();}
   if(u>2.6)cig.t=-1;
  }else{
   wC=u<.45?sm(u/.45):u<1.5?1:1-sm((u-1.5)/.5);
   if(cig.ev===0&&u>.5){cig.ev=1;sfx.inhale();cig.left-=6;}
   if(u>.5&&u<1.4)dragGlow=1;
   if(cig.ev===1&&u>1.9){cig.ev=2;exhale();}
   if(u>2.0)cig.t=-1;
  }
 }
 if(cig.lit){
  if(cig.t<0){cig.left-=dt;if(cig.left<=0){cig.lit=false;cigM.visible=false;cigTip.getWorldPosition(tv);for(let i=0;i<3;i++)puff(tv,(Math.random()-.5)*.3,.3,(Math.random()-.5)*.3,.12,1.5);}}
  const b=dragGlow?1.5+Math.random()*.2:.55+.22*Math.sin(t*3.1)+.12*Math.sin(t*7.7)+Math.random()*.06;
  tipMat.color.setRGB(Math.min(1,b),Math.min(1,.36*b),Math.min(1,.07*b*b));
  cig.emit-=dt;if(cig.emit<=0&&!(dragGlow&&cig.t>=0)){cig.emit=.16+Math.random()*.12;cigTip.getWorldPosition(tv);puff(tv,(Math.random()-.5)*.08,.3+Math.random()*.15,(Math.random()-.5)*.08,.06+Math.random()*.04,2.6+Math.random());}
 }else tipMat.color.setRGB(.25,.22,.2);
 faceLight.intensity=flame+(cig.lit?(dragGlow?.5:.07)*wC+(dragGlow?.1:0):0);
}
function exhale(){sfx.exhale();if(Math.random()<.8)mumbleSelf(MC,1.0);head.getWorldPosition(tv);tv.y+=.07;const fx=Math.sin(heading),fz=Math.cos(heading);tv.x+=fx*.14;tv.z+=fz*.14;
 for(let i=0;i<9;i++){const s=.7+Math.random()*.7;puff(tv,fx*s+(Math.random()-.5)*.3,.12+Math.random()*.25,fz*s+(Math.random()-.5)*.3,.1+Math.random()*.08,2.2+Math.random()*1.4);}}

/* ================= PER-FRAME: movement, walk cycle, camera ================= */
const camT=new V3(-4,1.6,17);
let walkAmt=0,camRoll=0;
// Returns the view basis and camera position the other systems need this frame.
function updatePlayer(dt, t) {
 const pos=man.position;
 let ix=(input.keys.KeyD||input.keys.ArrowRight?1:0)-(input.keys.KeyA||input.keys.ArrowLeft?1:0)+input.jx,iz=(input.keys.KeyW||input.keys.ArrowUp?1:0)-(input.keys.KeyS||input.keys.ArrowDown?1:0)-input.jy;
 let len=Math.hypot(ix,iz);if(len>1){ix/=len;iz/=len;len=1;}
 const fx=-Math.sin(input.yaw),fz=-Math.cos(input.yaw),rx=-fz,rz=fx;
 const moving=game.started&&len>.12;
 let top=(input.keys.ShiftLeft||input.keys.ShiftRight||Math.hypot(input.jx,input.jy)>.93)?2.3:1.35;if(busy())top*=.6;
 curSpeed=lerp(curSpeed,moving?top*len:0,1-Math.exp(-(moving?5:9)*dt));
 if(moving){const mx=fx*iz+rx*ix,mz=fz*iz+rz*ix,ml=Math.hypot(mx,mz)||1;dirX=mx/ml;dirZ=mz/ml;
  const target=Math.atan2(dirX,dirZ);let d=((target-heading+PI)%(2*PI)+2*PI)%(2*PI)-PI;heading+=d*(1-Math.exp(-9*dt));}
 // Integrate in sub-steps on slow frames so collisions stay solid at low frame rates.
 const nSub=Math.max(1,Math.min(3,Math.ceil(dt*60-.001))),sdt=dt/nSub;
 for(let sub=0;sub<nSub;sub++){
 pos.x+=dirX*curSpeed*sdt;pos.z+=dirZ*curSpeed*sdt;
 const r=.35;
 for(const c of colliders){if(pos.x>c.x0-r&&pos.x<c.x1+r&&pos.z>c.z0-r&&pos.z<c.z1+r){
  const a=pos.x-(c.x0-r),b=(c.x1+r)-pos.x,d=pos.z-(c.z0-r),e=(c.z1+r)-pos.z,m=Math.min(a,b,d,e);
  if(m===a)pos.x=c.x0-r;else if(m===b)pos.x=c.x1+r;else if(m===d)pos.z=c.z0-r;else pos.z=c.z1+r;}}
 }
 pos.x=clamp(pos.x,-240,240);pos.z=clamp(pos.z,-235,235);
 // Height eases towards a continuous target (kerb slope, ramps), so it never snaps.
 pos.y=followHeight(pos.y,groundHeight(pos.x,pos.z),dt);
 man.rotation.y=heading;

 // ---- walk cycle (phase is distance-driven so planted feet do not slide)
 walkAmt=clamp(curSpeed/1.35,0,1.3);
 phase+=curSpeed*dt/(1.2+.22*walkAmt)*2*PI;
 const si=Math.floor(phase/PI+.5);if(si!==stepIdx){stepIdx=si;if(curSpeed>.35)sfx.step();}
 const s=Math.sin(phase),c=Math.cos(phase),A=.42*Math.min(1,walkAmt)*(1+.25*Math.max(0,walkAmt-1));
 updateActions(dt,t);
 LL.l.rotation.x=-s*A;LR.l.rotation.x=s*A;
 LL.k.rotation.x=Math.max(0,c)*.95*walkAmt+.04;LR.k.rotation.x=Math.max(0,-c)*.95*walkAmt+.04;
 hips.position.y=HIP-.032*walkAmt*Math.abs(s)+Math.sin(t*1.4)*.003;
 hips.position.x=c*.012*walkAmt;
 hips.rotation.y=-s*.08*walkAmt;
 torso.rotation.y=s*.17*walkAmt;torso.rotation.z=c*.03*walkAmt;
 torso.rotation.x=.05+.045*walkAmt+Math.sin(t*1.4)*.012-tilt*.1;
 head.rotation.y=-s*.09*walkAmt;head.rotation.x=-.34*tilt+.05-wC*.04;
 const eb=-.14-.22*walkAmt;
 AR.a.rotation.set(lerp(-s*.42*walkAmt,-1.0,wB),lerp(0,1.0,wB),.05*(1-wB));AR.e.rotation.x=lerp(eb-Math.max(0,s)*.15*walkAmt,-2.2,wB);
 AL.a.rotation.set(lerp(s*.42*walkAmt,-1.02,wC),lerp(0,-1.05,wC),-.05*(1-wC));AL.e.rotation.x=lerp(eb-Math.max(0,-s)*.15*walkAmt,-2.25,wC);

 // ---- camera (over-the-shoulder orbit with wall avoidance)
 tv.set(pos.x+rx*.26,pos.y+1.85,pos.z+rz*.26);camT.lerp(tv,1-Math.exp(-11*dt));
 const cp=Math.cos(input.pitch),ox=Math.sin(input.yaw)*cp,oy=Math.sin(input.pitch),oz=Math.cos(input.yaw)*cp;
 let D=3.1;for(let i=1;i<=10;i++){const k=i/10*3.1;if(blocked(camT.x+ox*k,camT.y+oy*k,camT.z+oz*k)){D=Math.max(.45,k-.3);break;}}
 camera.position.set(camT.x+ox*D,Math.max(groundHeight(camT.x+ox*D,camT.z+oz*D)+.25,camT.y+oy*D),camT.z+oz*D);
 const sway=Math.max(wB,tilt);
 tv.set(camT.x,camT.y-.3+Math.sin(t*1.9)*.03*sway+tilt*.08,camT.z);camera.lookAt(tv);
 camRoll=lerp(camRoll,Math.sin(t*2.3)*.03*sway+c*.004*walkAmt,1-Math.exp(-6*dt));camera.rotateZ(camRoll);
 const cx=camera.position.x,cy=camera.position.y,cz=camera.position.z;
 return { fx, fz, rx, rz, cx, cy, cz };
}
const getHeading = () => heading, getFlame = () => flame;
export { man, mk, grp, mSkin, mHair, mBoot, beer, cig, busy, startBeer, startCig, updatePlayer, getHeading, getFlame };
