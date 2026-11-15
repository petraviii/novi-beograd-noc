// The city: ground, buildings, landmarks, generated outer blocks, graffiti,
// props, lamps, kiosks and street furniture, plus the lamp/reflection update.
//
// Built at import time in a fixed order because it consumes the seeded PRNG.
import * as THREE from 'three';
import { PI, LITE, R, rr, pick } from './util.js';
import { scene, lam, bas, fix } from './render.js';
import { ctex, tAsphalt, tPave, tCobble, tWall, glowTex, streakTex, facade, grafTex, B, Cy, taper, mergeGeo, uvScale } from './assets.js';
import { gY } from './ground.js';
import { day } from './state.js';

const colliders=[],lamps=[],refls=[],ST=[],SE=[];
const put=(g,x,y,z,ry,c)=>ST.push({g,x,y,z,ry:ry||0,c});
const putE=(g,x,y,z,ry,c)=>SE.push({g,x,y,z,ry:ry||0,c});
const col=(x0,x1,z0,z1,h)=>colliders.push({x0,x1,z0,z1,h:h||0});
function free(x,z,m){for(const c of colliders)if(x>c.x0-m&&x<c.x1+m&&z>c.z0-m&&z<c.z1+m)return false;return true;}

const amb=new THREE.AmbientLight(0x3a4864,.62);scene.add(amb);
const moon=new THREE.DirectionalLight(0x27324a,.35);moon.position.set(-.4,1,.3);scene.add(moon);

// ---- ground
const mAsph=lam(0xffffff,{map:tAsphalt}),mPave=lam(0xffffff,{map:tPave}),mCob=lam(0xdddddd,{map:tCobble});
const GSEG=LITE?4.5:3;
function ground(x0,x1,z0,z1,y,mat,tile){const w=x1-x0,d=z1-z0,g=new THREE.PlaneGeometry(w,d,Math.ceil(w/GSEG),Math.ceil(d/GSEG));g.rotateX(-PI/2);uvScale(g,w/tile,d/tile);const m=new THREE.Mesh(g,mat);m.position.set((x0+x1)/2,y,(z0+z1)/2);fix(m);}
ground(-342,342,3,10,0,mAsph,5);ground(-342,342,-10,-3,0,mAsph,5);
ground(-342,342,-3,3,0,mCob,2.5);
ground(-342,342,10,330,.15,mPave,4);ground(-342,342,-330,-10,.15,mPave,4);
for(const s of[1,-1]){
 put(B(684,.15,.3,228,1,1),0,.075,s*10.15,0,0x6c6c68);
 for(const tz of[1.5,-1.5])for(const o of[.5,-.5])put(B(684,.06,.07,228,1,1),0,.03,tz+o,0,0x7a8088);
 put(B(684,.03,.03,1,1,1),0,5.7,s*1.5,0,0x101012);
 for(let z=3.6;z<9.8;z+=1.05)put(B(4,.02,.5,2,1,1),0,.012,s*z,0,0x8c8c84);
}
// catenary poles
const poleCat=mergeGeo([{g:Cy(.08,.12,6.4,5),c:0x25262a,y:3.2},{g:B(.08,.08,4.4),c:0x25262a,y:6.1},{g:B(.3,.5,.3),c:0x1a1a1c,y:.25}],.1);
for(let x=-324;x<=324;x+=36){put(poleCat,x,0,0);col(x-.15,x+.15,-.15,.15,0);}

// ---- buildings
const roofM=lam(0x0c0d10);
const bMats=[],foot=[];let footTag=0;
function building(x0,x1,z0,z1,h,y0,noG,tn){
 y0=y0===undefined?.15:y0;const w=x1-x0,d=z1-z0,hh=h-y0,fl=Math.max(1,Math.round(hh/3));
 const t=rr(58,82),tone=tn||[t,t+2,t+5];
 const A=facade(Math.max(1,Math.round(w/3.2)),fl,noG,tone),Bf=facade(Math.max(1,Math.round(d/3.2)),fl,noG,tone);
 const mA=lam(0xffffff,{map:A.map,emissive:0xffffff,emissiveMap:A.emis}),mB=lam(0xffffff,{map:Bf.map,emissive:0xffffff,emissiveMap:Bf.emis});
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,hh,d,Math.ceil(w/4),Math.ceil(hh/4),Math.ceil(d/4)),[mB,mB,roofM,roofM,mA,mA]);bMats.push(mA,mB);
 m.position.set((x0+x1)/2,y0+hh/2,(z0+z1)/2);fix(m);
 if(!noG){col(x0,x1,z0,z1,h);foot.push({x0,x1,z0,z1,tag:footTag});}
}
function slabPass(x0,x1,z0,z1,h,p0,p1){building(x0,p0,z0,z1,h);building(p1,x1,z0,z1,h);building(p0,p1,z0,z1,h,4.4,true);}
slabPass(-104,-34,44,58,46,-72,-64);
building(-12,10,34,56,62);
building(38,52,26,92,42);
building(70,112,56,70,44);
slabPass(-92,18,82,96,50,-40,-32);
slabPass(-62,12,-56,-42,48,-30,-22);
building(40,60,-54,-32,66);
building(-106,-92,-94,-26,40);
slabPass(20,104,-94,-80,46,56,64);
building(-70,-20,-96,-84,38);
// distant filler blocks (skyline in daylight)
building(-60,20,118,132,44);building(60,130,112,126,50);building(-150,-90,112,126,40);
building(-40,60,-126,-112,52);building(90,150,-124,-110,40);building(-140,-70,-128,-114,46);

// ---- LANDMARKS
const beacons=[];
function beacon(x,y,z,ph){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xff2010,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,fog:false}));s.position.set(x,y,z);s.scale.setScalar(7);s.userData.ph=ph||0;scene.add(s);beacons.push(s);}
// Western City Gate (Genex): two towers, sky bridge, cylindrical cores, rotating restaurant
footTag=1;{const gt=[88,86,80],cc=0x6e6c66;
 building(-152,-136,20,40,96,undefined,false,gt);building(-152,-136,54,70,78,undefined,false,gt);
 building(-150,-138,40,54,78,69,true,[62,62,60]);
 put(new THREE.CylinderGeometry(3.6,3.6,102,10,14),-144,51.15,17.5,0,cc);put(new THREE.CylinderGeometry(3.6,3.6,84,10,12),-144,42.15,72.5,0,cc);
 put(new THREE.CylinderGeometry(2.4,2.4,100,8,12),-134.5,50.15,30,0,cc);
 put(new THREE.CylinderGeometry(7.5,6.5,6,12,1),-144,103,27,0,0x4a4c50);put(new THREE.CylinderGeometry(6,7.5,1.5,12,1),-144,106.7,27,0,0x3a3a3c);
 put(new THREE.CylinderGeometry(.25,.6,16,5,2),-144,115,27,0,0x2a2a2c);
 col(-147.6,-140.4,13.9,20,102);col(-147.6,-140.4,70,76.1,84);col(-136,-132.1,27.6,32.4,100);
 beacon(-144,123.5,27,0);beacon(-144,86,72.5,1.6);}
// Usce tower (former CK)
footTag=2;building(126,146,36,56,106,undefined,false,[30,38,50]);
put(B(9,5,9),136,108.5,46,0,0x1c2026);put(new THREE.CylinderGeometry(.2,.5,22,5,2),136,122,46,0,0x2a2a2c);beacon(136,133.5,46,.8);
// Eastern City Gate (Rudo): three stepped slabs
footTag=3;function rudo(a0,a1,anchor,dir,alongZ){for(let k=0;k<5;k++){const len=36-k*6,b0=dir>0?anchor:anchor-len,b1=dir>0?anchor+len:anchor,y0=k?k*15+.15:undefined,h=(k+1)*15+.15,tn=[94,92,86];
  if(alongZ)building(a0,a1,b0,b1,h,y0,k>0,tn);else building(b0,b1,a0,a1,h,y0,k>0,tn);}
 const m=dir>0?anchor+6:anchor-6;if(alongZ)beacon((a0+a1)/2,77,m,anchor);else beacon(m,77,(a0+a1)/2,anchor);}
rudo(128,140,-22,-1,true);rudo(148,160,-64,1,true);rudo(-86,-74,146,-1,false);footTag=0;

// ---- procedural brutalist blocks filling the outer districts
const genLamps=[];
// Hram Svetog Save: Greek-cross plan, copper dome, four bell towers
{const cx=0,cz=172,mb=0xb8b6ae,cu=0x3e6458,dk=0x14171b,y0=.15;
 put(B(44,20,20,8,4,4),cx,y0+10,cz,0,mb);put(B(20,20,44,4,4,8),cx,y0+10,cz,0,mb);put(B(24,30,24,4,6,4),cx,y0+15,cz,0,mb);
 put(new THREE.CylinderGeometry(11,11,8,12,2),cx,y0+34,cz,0,mb);
 put(new THREE.SphereGeometry(11.6,12,5,0,PI*2,0,PI/2),cx,y0+38,cz,0,cu);
 for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){put(new THREE.SphereGeometry(9.5,10,4,0,PI*2,0,PI/2),cx+dx*14,y0+20,cz+dz*14,0,cu);
  for(const o of[-5,0,5])put(B(dz?1.6:.4,9,dz?.4:1.6),cx+dx*22.05+(dz?o:0),y0+9,cz+dz*22.05+(dx?o:0),0,dk);}
 for(const sx of[1,-1])for(const sz of[1,-1]){put(B(7,31,7,2,6,2),cx+sx*13.5,y0+15.5,cz+sz*13.5,0,mb);put(new THREE.SphereGeometry(4,8,4,0,PI*2,0,PI/2),cx+sx*13.5,y0+31,cz+sz*13.5,0,cu);putE(B(.25,2.4,.25),cx+sx*13.5,y0+36.4,cz+sz*13.5,0,0xb89030);}
 for(let k=0;k<12;k++){const a=k/12*PI*2;putE(B(1,3.2,1),cx+Math.sin(a)*10.7,y0+34,cz+Math.cos(a)*10.7,a,0xd8a850);}
 putE(B(.5,6,.5),cx,y0+52.5,cz,0,0xd0a030);putE(B(2.6,.5,.5),cx,y0+53.5,cz,0,0xd0a030);
 put(B(5,7,.5),cx,y0+3.5,cz-22.1,0,dk);
 col(cx-22,cx+22,cz-10,cz+10,30);col(cx-10,cx+10,cz-22,cz+22,30);col(cx-17,cx+17,cz-17,cz+17,31);
 foot.push({x0:cx-22,x1:cx+22,z0:cz-22,z1:cz+22,tag:4});
 genLamps.push([cx-12,cz-30,0,1],[cx+12,cz-30,0,1],[cx-30,cz,1,0],[cx+30,cz,-1,0]);}
// Avala TV tower: tripod legs, triangular shaft, observation pod
{const cx=-190,cz=-150,c=0x7a7872;
 put(new THREE.CylinderGeometry(2.4,4,96,3,12),cx,48.15,cz,0,c);
 for(let k=0;k<3;k++)put(new THREE.CylinderGeometry(1,1.7,27,4,3).rotateX(-.4636).translate(0,12,6).rotateY(k*PI*2/3+PI/3),cx,.15,cz,0,c);
 put(new THREE.CylinderGeometry(6.5,4,5,8,1),cx,92,cz,0,0x5a5c60);put(new THREE.CylinderGeometry(6.5,6.5,4,8,1),cx,96.5,cz,0,0x3a3c40);putE(new THREE.CylinderGeometry(6.6,6.6,1.2,8,1),cx,96.8,cz,0,0xc8a860);
 put(new THREE.CylinderGeometry(3,6.5,3,8,1),cx,100,cz,0,0x5a5c60);
 put(new THREE.CylinderGeometry(.5,1.3,22,4,2),cx,112.5,cz,0,0x9a2a22);put(new THREE.CylinderGeometry(.2,.5,16,4,2),cx,131.5,cz,0,0xc8c8c0);
 beacon(cx,140,cz,2.2);beacon(cx,103,cz,.4);
 col(cx-4,cx+4,cz-4,cz+4,96);foot.push({x0:cx-13,x1:cx+13,z0:cz-13,z1:cz+13,tag:5});genLamps.push([cx,cz-16,0,1],[cx+16,cz,-1,0]);}
// Palata Srbije (SIV): long low slab, two wings, domed central hall
{footTag=6;const cx=70,cz=-180,tn=[122,122,116];
 building(cx-58,cx+58,cz-8,cz+8,21,undefined,false,tn);building(cx-64,cx-48,cz-32,cz+32,25,undefined,false,tn);building(cx+48,cx+64,cz-32,cz+32,25,undefined,false,tn);
 building(cx-16,cx+16,cz+8,cz+26,15,undefined,false,tn);
 put(new THREE.SphereGeometry(8.5,12,4,0,PI*2,0,PI/2),cx,15.1,cz+17,0,0x35505a);
 footTag=0;genLamps.push([cx-30,cz+16,0,1],[cx+30,cz+16,0,1],[cx,cz+34,0,-1]);}
{const cc=[0x6a6862,0x5e5c58,0x74706a],gtx=['БЛОК 23','БГ','PARTIZAN','ZVEZDA','NBG','БЛОК 45','БЛОК 70'],gcl=['#e8e4d8','#d82020','#40c0e0','#e0c020','#e050a0','#40d070'];
 const hit=(x0,x1,z0,z1,m)=>{for(const f of foot)if(x0<f.x1+m&&x1>f.x0-m&&z0<f.z1+m&&z1>f.z0-m)return true;return false;};
 let n=0;
 for(let i=0;i<4000&&n<(LITE?26:48);i++){
  const az=R()<.45,type=R()*5|0,len=type===1?rr(20,26):rr(38,84),dep=type===1?len:rr(13,18),pad=type===4?7:0;
  const cx=rr(-300,300),cz=(R()<.5?1:-1)*rr(20,292);
  const hx=(az?dep/2+pad:len/2),hz=(az?len/2:dep/2+pad),x0=cx-hx,x1=cx+hx,z0=cz-hz,z1=cz+hz;
  if(Math.min(Math.abs(z0),Math.abs(z1))<19||(z0<0&&z1>0))continue;
  if(x0<168&&x1>-168&&z0<106&&z1>-106)continue;
  if(hit(x0,x1,z0,z1,11))continue;
  n++;
  const t=rr(60,96),tn=[t,t-1,t-4],c=pick(cc);
  const u0=az?z0:x0,u1=az?z1:x1,v0=(az?x0:z0)+pad,v1=(az?x1:z1)-pad,um=(u0+u1)/2,vm=(v0+v1)/2,L=u1-u0,D=v1-v0;
  const Bd=(a0,a1,b0,b1,h,y0,noG)=>az?building(b0,b1,a0,a1,h,y0,noG,tn):building(a0,a1,b0,b1,h,y0,noG,tn);
  const Bx=(ua,va,su,sv,h,yb,color,solid)=>{const g=az?B(sv,h,su,1,Math.ceil(h/6),1):B(su,h,sv,1,Math.ceil(h/6),1),X=az?va:ua,Z=az?ua:va;put(g,X,yb+h/2,Z,0,color);
   if(solid){const a=(az?sv:su)/2,b=(az?su:sv)/2;col(X-a,X+a,Z-b,Z+b,yb+h);}};
  if(type===0){const h=rr(34,58);Bd(u0+3,u1-3,v0,v1,h);Bx(u0+1.5,vm,3,D*.7,h+5,.15,c,1);Bx(u1-1.5,vm,3,D*.7,h+5,.15,c,1);for(let k=0;k<3;k++)Bx(rr(u0+8,u1-8),vm,rr(4,8),rr(4,7),rr(2,4),h,0x2e3034);}
  else if(type===1){const h=rr(58,88);Bd(u0+2,u1-2,v0+2,v1-2,h);for(const a of[u0+2,u1-2])for(const b of[v0+2,v1-2])Bx(a,b,4,4,h+4,.15,c,1);Bx(um,vm,L*.5,D*.5,5,h,0x2e3034);}
  else if(type===2){const h=rr(44,60),sg=L/3;Bd(u0,u0+sg,v0,v1,h);Bd(u0+sg,u0+2*sg,v0,v1,h-12);Bd(u0+2*sg,u1,v0,v1,h-24);Bx(u0+sg,vm,2.4,D+2,h+3,.15,c,1);Bx(u0+2*sg,vm,2.4,D+2,h-9,.15,c,1);}
  else if(type===3){const h=rr(36,50);Bd(u0,u1,v0,v1,h,5.2,true);foot.push({x0,x1,z0,z1,tag:0});for(let a=u0+3;a<u1-2;a+=7){Bx(a,v0+1.2,1.1,1.1,5.2,.15,c,1);Bx(a,v1-1.2,1.1,1.1,5.2,.15,c,1);}Bx(um,vm,7,D-5,5.2,.15,0x3a3a3c,1);}
  else{const h=rr(38,54),sg=L/3;Bd(u0,u0+sg+1,v0-pad,v1-pad,h);Bd(u0+sg,u0+2*sg+1,v0+pad,v1+pad,h+6);Bd(u0+2*sg,u1,v0-pad,v1-pad,h);}
  if(type!==3&&type!==1&&R()<.7){const a=rr(u0+8,u1-8),vf=type===4?v0-pad:v0;if(az)graf(pick(gtx),pick(gcl),R()<.6,vf-.06,1.6,a,-PI/2,rr(1,1.8));else graf(pick(gtx),pick(gcl),R()<.6,a,1.6,vf-.06,PI,rr(1,1.8));}
  const lo=(az?x0:z0)-5,hi=(az?x1:z1)+5;
  if(az){genLamps.push([lo,um,-1,0]);if(R()<.6)genLamps.push([hi,um+rr(-10,10),1,0]);}else{genLamps.push([um,lo,0,-1]);if(R()<.6)genLamps.push([um+rr(-10,10),hi,0,1]);}
 }}

// ---- freestanding concrete walls
const mWall=lam(0xffffff,{map:tWall});
function wall(x,z,len,alongZ){const n=Math.ceil(len/1.5),g=new THREE.BoxGeometry(alongZ?.3:len,2.3,alongZ?len:.3,alongZ?1:n,2,alongZ?n:1);
 const m=new THREE.Mesh(g,mWall);m.position.set(x,1.3,z);fix(m);
 if(alongZ)col(x-.15,x+.15,z-len/2,z+len/2,2.45);else col(x-len/2,x+len/2,z-.15,z+.15,2.45);}
wall(-22,25,9);wall(28,-24,8);wall(-60,68,10);wall(84,30,8,true);wall(-78,-66,9,true);

// ---- graffiti decals
function graf(text,color,block,x,y,z,ry,h){
 const t=grafTex(text,color,block),a=t.image.width/t.image.height;
 const m=new THREE.Mesh(new THREE.PlaneGeometry(h*a,h,4,2),lam(0xffffff,{map:t,transparent:true,alphaTest:.5,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-8}));
 m.position.set(x,y,z);m.rotation.y=ry;fix(m);
}
const E=.06;
graf('БЛОК 23','#e8e4d8',true,-2,1.75,34-E,PI,1.7);graf('NBG','#e050a0',false,7,1.3,34-E,PI,1.0);
graf('ZVEZDA','#d82020',true,-22,1.4,25.16+E,0,1.5);graf('БГ','#40c0e0',false,-24.5,1.4,24.84-E,PI,1.3);graf('NBG','#e8e4d8',true,-20,1.3,24.84-E,PI,1.1);
graf('PARTIZAN','#e8e8e8',true,-45,1.7,-42+E,0,1.5);graf('БГ','#e0c020',true,-10,1.5,-42+E,0,1.6);graf('NBG','#40d070',false,-3,1.2,-42+E,0,.9);
graf('NBG','#e8e4d8',true,-30+E,1.7,-46,PI/2,1.3);graf('БЛОК 23','#d82020',false,-30+E,1.5,-52,PI/2,1.0);graf('ZVEZDA','#d82020',true,-22-E,1.7,-49,-PI/2,1.4);
graf('PARTIZAN','#d8d8d8',true,-72+E,1.7,50,PI/2,1.3);graf('БГ','#e050a0',false,-64-E,1.6,47,-PI/2,1.2);graf('БЛОК 23','#40c0e0',false,-64-E,1.5,54,-PI/2,1.0);
graf('ZVEZDA','#d82020',false,-50,1.5,44-E,PI,1.2);graf('NBG','#e0c020',true,-90,1.6,44-E,PI,1.6);
graf('БЛОК 23','#e0c020',true,28,1.4,-23.84+E,0,1.4);graf('PARTIZAN','#e8e8e8',false,28,1.4,-24.16-E,PI,1.1);
graf('БГ','#e8e4d8',true,38-E,1.9,40,-PI/2,2.0);graf('ZVEZDA','#d82020',true,38-E,1.6,62,-PI/2,1.4);
graf('NBG','#40c0e0',true,50,1.9,-32+E,0,2.2);graf('PARTIZAN','#e8e8e8',true,44,1.3,-32+E,0,.9);
graf('БЛОК 23','#e8e4d8',true,-40+E,1.7,89,PI/2,1.3);graf('PARTIZAN','#d8d8d8',false,-32-E,1.5,88,-PI/2,1.0);
graf('ZVEZDA','#d82020',true,56+E,1.7,-87,PI/2,1.3);graf('БГ','#40d070',false,64-E,1.5,-88,-PI/2,1.3);
graf('NBG','#e050a0',false,-60,1.4,68.16+E,0,1.2);graf('БГ','#e8e4d8',true,-60,1.4,67.84-E,PI,1.5);
graf('БЛОК 23','#e8e4d8',false,84.16+E,1.4,30,PI/2,1.1);graf('PARTIZAN','#e8e8e8',true,83.84-E,1.4,30,-PI/2,1.3);
graf('ZVEZDA','#d82020',false,-77.84+E,1.4,-66,PI/2,1.2);graf('NBG','#e0c020',true,-78.16-E,1.4,-66,-PI/2,1.4);

// ---- prop prototypes (vertex-coloured, merged into one static mesh)
function carGeo(c){const dk=0x121214;return mergeGeo([
 {g:B(3.4,.5,1.5),c,y:.6},{g:taper(B(2.0,.48,1.42),.7,.86,-.08),c:0x18222c,x:-.3,y:1.09},{g:B(1.36,.05,1.2),c,x:-.38,y:1.35},
 {g:B(.12,.14,1.56),c:dk,x:1.72,y:.45},{g:B(.12,.14,1.56),c:dk,x:-1.72,y:.45},
 {g:B(.04,.14,.26),c:0xcfc8a0,x:1.71,y:.68,z:.52},{g:B(.04,.14,.26),c:0xcfc8a0,x:1.71,y:.68,z:-.52},{g:B(.04,.16,.7),c:0x0a0a0a,x:1.71,y:.68},
 {g:B(.04,.12,.3),c:0x801414,x:-1.71,y:.68,z:.5},{g:B(.04,.12,.3),c:0x801414,x:-1.71,y:.68,z:-.5},
 {g:Cy(.29,.29,1.58,7).rotateX(PI/2),c:0x09090b,x:1.1,y:.29},{g:Cy(.29,.29,1.58,7).rotateX(PI/2),c:0x09090b,x:-1.1,y:.29}],.08);}
const carGeos=[0xa82018,0xc8c4b4,0xb8a878,0x6890b0,0x2c4a34,0xc8a020,0x8a8a8c,0x5a1c1c].map(carGeo);
function car(x,z,ry){ry+=rr(-.05,.05);if(!free(x,z,1.2))return;put(pick(carGeos),x,gY(z),z,ry);
 const hx=Math.abs(Math.cos(ry))*1.75+Math.abs(Math.sin(ry))*.78,hz=Math.abs(Math.sin(ry))*1.75+Math.abs(Math.cos(ry))*.78;col(x-hx,x+hx,z-hz,z+hz,1.4);}
const dumpGeo=()=>mergeGeo([{g:taper(B(1.7,1.0,1.0),1,.82),c:pick([0x25503a,0x2a4636,0x3a4a2a]),y:.65},{g:B(1.76,.08,.9),c:0x15201a,y:1.19,rx:.08},
 {g:B(.5,.35,.03),c:0x5a3018,y:.5,z:.47,x:rr(-.4,.4)},{g:B(.3,.5,.03),c:0x4a2a16,y:.6,z:-.47,x:rr(-.4,.4)},
 {g:B(.12,.16,.12),c:0x0a0a0a,x:.7,y:.08,z:.35},{g:B(.12,.16,.12),c:0x0a0a0a,x:-.7,y:.08,z:.35},{g:B(.12,.16,.12),c:0x0a0a0a,x:.7,y:.08,z:-.35},{g:B(.12,.16,.12),c:0x0a0a0a,x:-.7,y:.08,z:-.35}],.14);
function dumpster(x,z,ry){put(dumpGeo(),x,.15,z,ry);const a=ry?.6:.95,b=ry?.95:.6;col(x-a,x+a,z-b,z+b,1.2);}
const benchGeo=mergeGeo([{g:B(1.7,.07,.45),c:0x4a3220,y:.46},{g:B(1.7,.4,.06),c:0x4a3220,y:.84,z:-.24,rx:-.15},{g:B(.1,.46,.42),c:0x5c5c58,x:.7,y:.23},{g:B(.1,.46,.42),c:0x5c5c58,x:-.7,y:.23}],.12);
function bench(x,z,ry){put(benchGeo,x,gY(z),z,ry);const s=Math.abs(Math.sin(ry))>.5;col(x-(s?.3:.85),x+(s?.3:.85),z-(s?.85:.3),z+(s?.85:.3),.9);}
const barrGeo=mergeGeo([{g:taper(B(2.2,.85,.7),1,.35),c:0x74746e,y:.425}],.12);
function barrier(x,z,ry){put(barrGeo,x,gY(z),z,ry);const s=Math.abs(Math.sin(ry))>.5;col(x-(s?.35:1.1),x+(s?.35:1.1),z-(s?1.1:.35),z+(s?1.1:.35),.85);}
const canGeo=mergeGeo([{g:Cy(.24,.19,.62,6),c:0x234432,y:.72},{g:B(.06,.5,.06),c:0x1a1a1c,y:.25},{g:Cy(.26,.26,.04,6),c:0x101412,y:1.03}],.12);
function trashcan(x,z){put(canGeo,x,gY(z),z,rr(0,3));col(x-.22,x+.22,z-.22,z+.22,1);}
const utilGeo=mergeGeo([{g:B(.9,1.4,.45),c:0x4c5852,y:.8},{g:B(.98,.06,.52),c:0x2a2e2c,y:1.53},{g:B(.94,.1,.5),c:0x333333,y:.05},{g:B(.3,.22,.02),c:0xc8b020,y:1.15,z:.235},{g:B(.02,1.2,.02),c:0x1a1a1a,y:.8,z:.23}],.1);
function utilbox(x,z,ry){put(utilGeo,x,gY(z),z,ry);const s=Math.abs(Math.sin(ry))>.5;col(x-(s?.25:.47),x+(s?.25:.47),z-(s?.47:.25),z+(s?.47:.25),1.5);}
function tree(x,z){const P=[{g:Cy(.1,.18,3.2,5),c:0x1e1812,y:1.6}];for(let i=0;i<5;i++){const a=rr(0,6.28),t=rr(.5,1.1),L=rr(1.2,2.2);P.push({g:Cy(.02,.07,L,4),c:0x1a1510,x:Math.sin(a)*Math.sin(t)*L/2,z:Math.cos(a)*Math.sin(t)*L/2,y:rr(2.8,3.4)+Math.cos(t)*L/2,rx:Math.cos(a)*t,rz:-Math.sin(a)*t});}
 put(mergeGeo(P,.15),x,.15,z,0);col(x-.18,x+.18,z-.18,z+.18,3);}
function kiosk(x,z,lit,ry){
 const red=lit?0xb8221a:pick([0x70201a,0x5c2420]),gl=R()<.5?0x0a0c10:0x3a2c1e;
 const P=[{g:B(2.3,2.1,2.3),c:red,y:1.3},{g:B(2.05,.25,2.05),c:0x1c1c1e,y:.125},{g:B(1.9,.16,1.9),c:red,y:2.42},
  {g:B(1.7,1.45,.3),c:red,y:1.4,z:1.2},{g:B(1.7,1.45,.3),c:red,y:1.4,z:-1.2},{g:B(.3,1.45,1.7),c:red,y:1.4,x:1.2},{g:B(.3,1.45,1.7),c:red,y:1.4,x:-1.2}];
 const G=[{g:B(1.4,1.1,.34),y:1.45,z:1.2},{g:B(1.4,1.1,.34),y:1.45,z:-1.2},{g:B(.34,1.1,1.4),y:1.45,x:1.2},{g:B(.34,1.1,1.4),y:1.45,x:-1.2}];
 if(lit){G.forEach(p=>p.c=0xe8be6c);putE(mergeGeo(G),x,.15,z,ry);
  P.push({g:B(1.2,.3,.36),c:0x2a1a12,y:1.05,z:1.2},{g:B(.2,.5,.36),c:0x1a1410,y:1.35,z:1.2,x:-.4},{g:B(.36,.3,1.2),c:0x2a1a12,y:1.05,x:1.2},{g:B(1.6,.06,.5),c:0x8a1814,y:.85,z:1.45});}
 else{G.forEach(p=>p.c=gl);P.push(...G);}
 put(mergeGeo(P,.1),x,.15,z,ry);col(x-1.4,x+1.4,z-1.4,z+1.4,2.7);
}

// ---- lamps (sodium vapour). Real PointLights are pooled onto the nearest lamps.
const poleGeos={};
function lamp(x,z,ax,az,h,o){o=o||{};const gy=gY(z),c=o.col||0xff9838;let lx=x,lz=z,ly=gy+h;
 if(!o.fixture){
  put(poleGeos[h]||(poleGeos[h]=mergeGeo([{g:Cy(.06,.1,h,5),c:0x2a2b2e,y:h/2},{g:B(.24,.5,.24),c:0x222224,y:.25}],.1)),x,gy,z);
  const ry=Math.atan2(-az,ax);put(B(1.5,.07,.07),x+ax*.7,gy+h,z+az*.7,ry,0x2a2b2e);
  lx=x+ax*1.4;lz=z+az*1.4;putE(B(.6,.1,.26),lx,gy+h-.05,lz,ry,o.dead?0x1a1410:c);col(x-.12,x+.12,z-.12,z+.12,0);ly=gy+h-.25;
 }else putE(B(1.2,.06,.14),x,ly,z,o.ry||0,c);
 if(o.dead)return;
 const L={lx,ly,lz,I:o.I||2.3,on:1,col:c,flicker:!!o.flicker,fl:0};
 L.glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:c,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:.9}));
 L.glow.position.set(lx,ly+.1,lz);L.glow.scale.setScalar(o.fixture?2.2:3.6);scene.add(L.glow);
 L.lamp=1;L.refl=mkRefl(c);lamps.push(L);refls.push(L);
}
const streakGeo=new THREE.PlaneGeometry(1,1,1,4).rotateX(-PI/2);
function mkRefl(c){const m=new THREE.Mesh(streakGeo,bas(c,{map:streakTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.4}));m.renderOrder=2;m.visible=false;scene.add(m);return m;}
let li=0;
for(let x=-300;x<=300;x+=24){li++;lamp(x,11.3,0,-1,7,{flicker:li===9,dead:li===3||li===12});lamp(x+12,-11.3,0,1,7,{dead:li===6,flicker:li===2});}
[[-1,27,0,1],[-68,39,0,1],[-45,-35,0,-1],[-12,-36,0,-1],[32,40,1,0],[50,-25,0,-1],[-26,70,-1,0],[20,66,1,0],[62,48,0,1],[90,36,-1,0],[-84,-20,0,-1],[-50,-72,0,-1],[30,-68,1,0],[84,-70,0,-1],[-96,72,1,0],[-20,76,0,1],[100,-40,-1,0],[-78,24,0,1],[-130,46,-1,0],[-128,62,-1,0],[121,46,1,0],[122,-40,1,0],[144,-64,0,1],[120,-80,1,0]]
 .forEach((p,i)=>lamp(p[0],p[1],p[2],p[3],5.5,{I:2.0,flicker:i===7}));
lamp(-68,51,0,0,4.3,{fixture:1,col:0xa8d8c8,I:1.3,ry:PI/2});lamp(-26,-49,0,0,4.3,{fixture:1,col:0xa8d8c8,I:1.3,ry:PI/2,flicker:1});
lamp(-36,89,0,0,4.3,{fixture:1,col:0xa8d8c8,I:1.3,ry:PI/2,flicker:1});lamp(60,-87,0,0,4.3,{fixture:1,col:0xa8d8c8,I:1.3,ry:PI/2});

genLamps.forEach(l=>{if(Math.abs(l[1])>15&&free(l[0],l[1],.6))lamp(l[0],l[1],l[2],l[3],5.5,{I:2.0,flicker:R()<.08});});

// ---- kiosks (one lit)
const KX=5,KZ=20.5;
kiosk(KX,KZ,true,0);kiosk(-50,17.6,false,0);kiosk(66,-17.6,false,PI/2);kiosk(-84,-17.6,false,0);kiosk(22,72,false,0);kiosk(8.2,21.2,false,.12);
const kioskLight=new THREE.PointLight(0xffd898,1.5,11,1.6);kioskLight.position.set(KX,1.7,KZ);scene.add(kioskLight);
{const K={lx:KX,ly:1.5,lz:KZ-1.4,on:.8,refl:mkRefl(0xf0c880)};refls.push(K);
 const st=ctex(64,14,(g,w,h)=>{g.fillStyle='#14100a';g.fillRect(0,0,w,h);g.font='bold 11px Menlo,Monaco,monospace';g.textBaseline='middle';g.textAlign='center';g.fillStyle='#ffd060';g.fillText('ТРАФИКА',w/2,h/2+1);},true);
 const s=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.35),bas(0xffffff,{map:st}));s.position.set(KX,2.3,KZ-1.37);s.rotation.y=PI;fix(s);
 graf('NBG','#e8e4d8',false,-50,1.2,17.6-1.38,PI,.7);graf('БГ','#40c0e0',false,66-1.38,1.2,-17.6,-PI/2,.8);}

// ---- vehicles & street furniture
for(let x=-236;x<=236;x+=5.2){if(Math.abs(x)<6)continue;if(R()<.42)car(x+rr(-.5,.5),8.8,0);if(R()<.42)car(x+rr(-.5,.5),-8.8,PI);}
for(let x=-98;x<=-36;x+=3.1)if(R()<.5)car(x,24.5,PI/2*(R()<.5?1:-1));
for(let x=66;x<=110;x+=3.1)if(R()<.5)car(x,-25,PI/2*(R()<.5?1:-1));
for(let x=72;x<=110;x+=3.1)if(R()<.45)car(x,49,PI/2*(R()<.5?1:-1));
for(let x=-60;x<=-10;x+=3.1)if(R()<.45)car(x,-66,PI/2*(R()<.5?1:-1));
[[-31,47,PI/2],[-31,49.3,PI/2],[14,38,PI/2],[14,40.4,PI/2],[37,-40,PI/2],[37,-37.6,PI/2],[-64.6,-50,PI/2],[-64.6,-47.6,PI/2],[56,60,0],[58.4,60,0],[-88,40,0],[66,-76,0],[-16,-80,0],[-108,62,PI/2]].forEach(d=>dumpster(d[0],d[1],d[2]));
[-60,-18,11,45,90,-110,128].forEach(x=>{bench(x,13.3,PI);bench(x+14,-13.3,0);});
[[-3,30,PI/2],[22,62,0],[-28,66,PI/2],[60,44,0],[-48,-33,0],[52,-22,0],[30,-64,PI/2]].forEach(b=>bench(b[0],b[1],b[2]));
for(let x=-140;x<=140;x+=28){trashcan(x+3,12.6);trashcan(x-9,-12.6);}
[[-30,13.7,0],[58,13.7,0],[-74,-13.7,PI],[24,-13.7,PI],[11.5,32,PI/2],[-33,60,PI/2],[39,-56,-PI/2],[-90.8,-40,PI/2]].forEach(u=>utilbox(u[0],u[1],u[2]));
for(let x=20;x<=30;x+=2.5)barrier(x,15.6,rr(-.08,.08));
for(let x=-16;x<=-9;x+=2.5)barrier(x,-15.6,rr(-.08,.08));
[[-33,34,PI/2],[-33,36.6,PI/2],[62,-28,0],[64.6,-28.3,.2],[-14,60,PI/2],[34,20,PI/2],[-80,64,0]].forEach(b=>barrier(b[0],b[1],b[2]));
graf('БГ','#e8e4d8',false,25,.52,15.6-.3,PI,.5);graf('NBG','#d82020',false,-12.5,.52,-15.6+.3,0,.5);
for(let i=0;i<70;i++){const x=rr(-236,236),z=(R()<.5?1:-1)*rr(18,232);if(Math.abs(x)<168&&Math.abs(z)<106)continue;car(x,z,pick([0,PI/2,PI,-PI/2]));}
for(let i=0,n=0;i<1600&&n<(LITE?55:110);i++){const x=rr(-236,236),z=(R()<.5?1:-1)*rr(17,232);if(free(x,z,2.2)&&Math.hypot(x+4,z-17)>9){tree(x,z);n++;}}
for(let i=0;i<(LITE?240:560);i++){const x=rr(-238,238),z=(R()<.45?(R()<.5?1:-1)*rr(10.5,15):(R()<.5?1:-1)*rr(15,232));if(!free(x,z,.1))continue;
 put(B(rr(.08,.4),rr(.02,.07),rr(.08,.3)),x,gY(z)+.03,z,rr(0,3),pick([0x8a8a80,0x2a2a2c,0x6a2420,0x2a5a3a,0x5a5548,0x3a3a40,0x9a8a60]));}
for(let i=0;i<70;i++){const x=rr(-236,236),z=(R()<.5?1:-1)*rr(16,232);if(free(x,z,.6)){put(B(rr(.3,.6),rr(.25,.45),rr(.3,.5)),x,.33,z,rr(0,3),pick([0x15151a,0x1a2420,0x4a3a2a]));}}

const vcMat=lam(0xffffff,{vertexColors:true}),veMat=bas(0xffffff,{vertexColors:true});
fix(new THREE.Mesh(mergeGeo(ST),vcMat));fix(new THREE.Mesh(mergeGeo(SE),veMat));

// pooled lamp lights
const lampLights=[];for(let i=0;i<(LITE?5:8);i++){const l=new THREE.PointLight(0xff9838,0,27,1.7);scene.add(l);lampLights.push(l);}

/* ================= PER-FRAME: lamp flicker, pooled lights, wet reflections ================= */
function updateLamps(dt, t, pos, fx, fz, cx, cy, cz) {
 const dk = day.dk, lampOn = day.lampOn;
 const ax=pos.x+fx*7,az=pos.z+fz*7;let near=1e9;
 for(const L of lamps){
  if(L.flicker){if(L.fl>0){L.fl-=dt;L.on=Math.random()<.5?.08:.75;}else{L.on=1;if(Math.random()<dt*1.2)L.fl=.08+Math.random()*.5;}}L.glow.material.opacity=.9*L.on*lampOn;
  L.d=(L.lx-ax)*(L.lx-ax)+(L.lz-az)*(L.lz-az);const dp=Math.hypot(L.lx-pos.x,L.lz-pos.z);if(dp<near)near=dp;}
 lamps.sort((a,b)=>a.d-b.d);
 for(let i=0;i<lampLights.length;i++){const L=lamps[i],l=lampLights[i];l.position.set(L.lx,L.ly,L.lz);l.intensity=L.I*L.on*lampOn;l.color.setHex(L.col);}
 for(const L of refls){const m=L.refl,dx=cx-L.lx,dz=cz-L.lz,d=Math.hypot(dx,dz);
  if(d>46||d<1.2||L.on<.03||(L.lamp&&lampOn<.03)){m.visible=false;continue;}
  let gy=gY(L.lz),k=L.ly/(L.ly+Math.max(.3,cy-gy));const pz=L.lz+dz*k;gy=gY(pz);
  m.visible=true;m.position.set(L.lx+dx*k,gy+.04,pz);m.rotation.y=Math.atan2(dx,dz);m.scale.set(.6+d*.035,1,1.4+d*.42);m.material.opacity=.4*L.on*(L.lamp?lampOn:1-.7*dk);}
 const kd=Math.hypot(pos.x-KX,pos.z-KZ);kioskLight.intensity=1.5+Math.sin(t*23)*.03;
 return { near, kd };
}
function blocked(x,y,z){for(const c of colliders)if(c.h>y&&x>c.x0-.25&&x<c.x1+.25&&z>c.z0-.25&&z<c.z1+.25)return true;return false;}

export { colliders, lamps, refls, free, blocked, col, put, putE, amb, moon, bMats, veMat, beacons, foot, KX, KZ, kioskLight, mkRefl, lampLights, graf, updateLamps };
