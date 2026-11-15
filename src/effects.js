// Smoke puffs, rain streaks and tossed beer cans.
import * as THREE from 'three';
import { V3, LITE } from './util.js';
import { scene } from './render.js';
import { smokeTex } from './assets.js';
import { groundHeight } from './ground.js';
import { sfx } from './audio.js';

const smoke=[];for(let i=0;i<56;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:smokeTex,transparent:true,opacity:0,depthWrite:false}));s.visible=false;scene.add(s);smoke.push({s,life:0,max:1,v:new V3(),s0:.1});}
let smokeI=0;
function puff(p,vx,vy,vz,s0,max){const o=smoke[smokeI=(smokeI+1)%smoke.length];o.s.position.copy(p);o.v.set(vx,vy,vz);o.life=0;o.max=max;o.s0=s0;o.s.visible=true;o.s.material.rotation=Math.random()*6;}
const NR=LITE?90:170,rainPos=new Float32Array(NR*6),rain=[];
for(let i=0;i<NR;i++)rain.push({x:(Math.random()-.5)*26,y:Math.random()*12,z:(Math.random()-.5)*26,v:15+Math.random()*5});
const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPos,3));
const rainMesh=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0x8a9ab0,transparent:true,opacity:.2}));rainMesh.frustumCulled=false;scene.add(rainMesh);
const tossed=[];
const wind = { x: 1.2, z: .5 };

function updateEffects(dt, t, cx, cz, sAmb, flame, gust) {
 // ---- smoke
 for(const p of smoke){if(!p.s.visible)continue;p.life+=dt;const k=p.life/p.max;if(k>=1){p.s.visible=false;continue;}
  p.v.multiplyScalar(1-.9*dt);p.v.y+=.1*dt;p.v.x+=wind.x*.12*dt;p.v.z+=wind.z*.12*dt;p.s.position.addScaledVector(p.v,dt);
  p.s.scale.setScalar(p.s0*(1+3.2*k));p.s.material.opacity=Math.min(1,k*10)*(1-k)*.6;const b=.42*sAmb+flame*.2;p.s.material.color.setRGB(b*1.05,b*.95,b*.85);}
 // ---- rain
 for(let i=0;i<NR;i++){const d=rain[i];d.y-=d.v*dt;d.x+=wind.x*(1+gust)*dt;d.z+=wind.z*(1+gust)*dt;
  if(d.y<0){d.y+=12;d.x=cx+(Math.random()-.5)*26;d.z=cz+(Math.random()-.5)*26;}
  if(d.x-cx>13)d.x-=26;else if(d.x-cx<-13)d.x+=26;if(d.z-cz>13)d.z-=26;else if(d.z-cz<-13)d.z+=26;
  const j=i*6;rainPos[j]=d.x;rainPos[j+1]=d.y;rainPos[j+2]=d.z;rainPos[j+3]=d.x+wind.x*.03;rainPos[j+4]=d.y+.42;rainPos[j+5]=d.z+wind.z*.03;}
 rainGeo.attributes.position.needsUpdate=true;
 // ---- tossed cans
 for(const o of tossed){if(o.rest)continue;o.vy-=9.8*dt;o.m.position.x+=o.vx*dt;o.m.position.y+=o.vy*dt;o.m.position.z+=o.vz*dt;o.m.rotation.x+=7*dt;o.m.rotation.z+=5*dt;
  const gy=groundHeight(o.m.position.x,o.m.position.z)+.04;if(o.m.position.y<gy){o.m.position.y=gy;sfx.clink(Math.min(1,Math.abs(o.vy)/2.5));o.vy=-o.vy*.42;o.vx*=.6;o.vz*=.6;if(Math.abs(o.vy)<.5){o.rest=true;o.m.rotation.x=0;o.m.rotation.z=0;}}}
}
export { puff, tossed, wind, rainMesh, updateEffects };
