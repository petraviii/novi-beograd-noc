// The GSP tram: mesh, lights, schedule and collision box.
import * as THREE from 'three';
import { PI } from './util.js';
import { scene, lam, bas } from './render.js';
import { B, mergeGeo, glowTex } from './assets.js';
import { mkRefl, refls, colliders } from './world.js';
import { sfx } from './audio.js';

const tramObj=new THREE.Group();scene.add(tramObj);tramObj.visible=false;
{const P=[],Eg=[];
 for(const sx of[3.8,-3.8]){P.push({g:B(7.4,1.05,2.3,3,1,1),c:0xa81a16,x:sx,y:.95},{g:B(7.4,1.35,2.3,3,1,1),c:0xd8ceaa,x:sx,y:2.15},{g:B(7.0,.14,1.9),c:0x55585c,x:sx,y:2.9},{g:B(2.2,.42,1.8),c:0x0c0c0d,x:sx+1.6*Math.sign(sx),y:.24},{g:B(2.0,.42,1.8),c:0x0c0c0d,x:sx-2.2*Math.sign(sx),y:.24},{g:B(7.4,.08,2.34),c:0x7a1410,x:sx,y:1.48});
  Eg.push({g:B(6.7,.72,2.33),c:0xb89650,x:sx,y:2.25});
  for(let k=-3;k<=3;k++)P.push({g:B(.14,.76,2.36),c:0xc8be9a,x:sx+k*1.1,y:2.25});}
 P.push({g:B(.6,2.2,1.9),c:0x18181a,y:1.6},{g:B(.2,.3,2.34),c:0x101012,x:7.55,y:.55},{g:B(.2,.3,2.34),c:0x101012,x:-7.55,y:.55},
  {g:B(.05,1.0,.05),c:0x18181a,x:3.5,y:3.4,rz:.5},{g:B(.05,1.0,.05),c:0x18181a,x:4.1,y:3.4,rz:-.5},{g:B(.05,.05,1.5),c:0x18181a,x:3.8,y:3.85});
 Eg.push({g:B(.06,.8,1.8),c:0x9a8650,x:7.43,y:2.2},{g:B(.06,.8,1.8),c:0x6a5c38,x:-7.43,y:2.2},{g:B(.06,.2,.3),c:0xfff2c8,x:7.43,y:.9,z:.7},{g:B(.06,.2,.3),c:0xfff2c8,x:7.43,y:.9,z:-.7},
  {g:B(.06,.16,.26),c:0xd01810,x:-7.43,y:.9,z:.75},{g:B(.06,.16,.26),c:0xd01810,x:-7.43,y:.9,z:-.75},{g:B(.06,.26,.9),c:0xffc040,x:7.43,y:2.78});
 tramObj.add(new THREE.Mesh(mergeGeo(P,.06),lam(0xffffff,{vertexColors:true})));tramObj.add(new THREE.Mesh(mergeGeo(Eg),bas(0xffffff,{vertexColors:true})));
 const cone=new THREE.Mesh(new THREE.ConeGeometry(2.0,15,8,1,true).rotateZ(PI/2).translate(15,.8,0),new THREE.MeshBasicMaterial({color:0xffe0a0,transparent:true,opacity:.075,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
 cone.rotation.z=-.03;tramObj.add(cone);
 for(const z of[.7,-.7]){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xffe8b0,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false}));s.position.set(7.6,.9,z);s.scale.setScalar(2.4);tramObj.add(s);}
}
const tramHead=new THREE.PointLight(0xffe2a8,0,24,1.5),tramIn=new THREE.PointLight(0xffd090,0,9,1.5);scene.add(tramHead,tramIn);
const tram={active:false,x:0,z:1.5,dir:-1,next:1,clk:0,bell:false,refl:null,R:{lx:0,ly:1,lz:0,on:0}};
tram.R.refl=mkRefl(0xffe2a8);refls.push(tram.R);
const tramCol={x0:0,x1:0,z0:0,z1:0,h:0};colliders.push(tramCol);

function updateTram(dt, t, px) {
 if(!tram.active){tram.next-=dt;if(tram.next<=0){tram.active=true;tram.dir=-tram.dir;tram.x=-336*tram.dir;tram.z=tram.dir>0?1.5:-1.5;tram.bell=false;tram.clk=0;tramObj.visible=true;tramObj.rotation.y=tram.dir>0?0:PI;}}
 if(tram.active){tram.x+=tram.dir*11*dt;tramObj.position.set(tram.x,.02+Math.sin(t*9)*.006,tram.z);
  tramHead.position.set(tram.x+tram.dir*9.5,1.5,tram.z);tramHead.intensity=1.9;tramIn.position.set(tram.x,2.3,tram.z);tramIn.intensity=1.1;
  tram.R.lx=tram.x+tram.dir*7.6;tram.R.lz=tram.z;tram.R.on=.9;
  tramCol.x0=tram.x-7.7;tramCol.x1=tram.x+7.7;tramCol.z0=tram.z-1.2;tramCol.z1=tram.z+1.2;tramCol.h=3;
  tram.clk-=dt;if(tram.clk<=0){tram.clk=.6+Math.random()*.08;sfx.clatter();}
  if(!tram.bell&&Math.abs(tram.x-px)<42){tram.bell=true;sfx.bell();}
  if(Math.abs(tram.x)>337){tram.active=false;tramObj.visible=false;tramHead.intensity=tramIn.intensity=0;tram.R.on=0;tram.next=40+Math.random()*35;tramCol.x0=tramCol.x1=9999;tramCol.h=0;}
 }
}
export { tram, tramObj, updateTram };
