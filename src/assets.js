// Procedural textures and geometry helpers. Everything is drawn in code.
import * as THREE from 'three';
import { PI, V3, R, rr, pick } from './util.js';

function ctex(w,h,draw,clampWrap){
 const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);
 const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;
 t.wrapS=t.wrapT=clampWrap?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;return t;
}
function speckle(g,w,h,t,a){const id=g.createImageData(w,h),d=id.data;
 for(let i=0;i<w*h;i++){const n=(R()-.5)*a;d[i*4]=t[0]+n;d[i*4+1]=t[1]+n;d[i*4+2]=t[2]+n;d[i*4+3]=255;}g.putImageData(id,0,0);}
function harden(g,w,h){const id=g.getImageData(0,0,w,h),d=id.data;for(let i=3;i<d.length;i+=4)d[i]=d[i]>105?255:0;g.putImageData(id,0,0);}
const tAsphalt=ctex(64,64,(g,w,h)=>{speckle(g,w,h,[50,53,60],30);
 for(let i=0;i<5;i++){g.strokeStyle='rgba(8,8,10,.6)';g.beginPath();let x=rr(0,w),y=rr(0,h);g.moveTo(x,y);for(let k=0;k<5;k++){x+=rr(-9,9);y+=rr(-9,9);g.lineTo(x,y);}g.stroke();}
 for(let i=0;i<8;i++){g.fillStyle='rgba(15,18,24,.5)';g.fillRect(rr(0,w)|0,rr(0,h)|0,rr(4,12)|0,rr(3,8)|0);}});
const tPave=ctex(64,64,(g,w,h)=>{speckle(g,w,h,[98,98,96],24);
 for(let y=0;y<4;y++)for(let x=0;x<4;x++){if(R()<.3){g.fillStyle='rgba(0,0,0,'+rr(.08,.25)+')';g.fillRect(x*16,y*16,16,16);}}
 g.fillStyle='rgba(0,0,0,.45)';for(let i=0;i<4;i++){g.fillRect(i*16,0,1,h);g.fillRect(0,i*16,w,1);}
 for(let i=0;i<6;i++){g.fillStyle='rgba(20,24,30,.35)';g.fillRect(rr(0,w)|0,rr(0,h)|0,rr(5,14)|0,rr(3,8)|0);}});
const tCobble=ctex(32,32,(g,w,h)=>{speckle(g,w,h,[58,57,56],26);g.fillStyle='rgba(0,0,0,.5)';for(let i=0;i<4;i++){g.fillRect(i*8,0,1,h);g.fillRect(0,i*8+(i%2)*2,w,1);}});
const tWall=ctex(64,32,(g,w,h)=>{speckle(g,w,h,[104,102,98],22);g.fillStyle='rgba(0,0,0,.3)';for(let i=0;i<4;i++)g.fillRect(i*16,0,1,h);g.fillRect(0,15,w,1);
 for(let i=0;i<7;i++){g.fillStyle='rgba(25,22,18,.3)';g.fillRect(rr(0,w)|0,0,rr(1,4)|0,rr(8,h)|0);}});
const glowTex=ctex(32,32,g=>{const gr=g.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.22,'rgba(255,255,255,.5)');gr.addColorStop(.6,'rgba(255,255,255,.1)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,32,32);},true);
const streakTex=ctex(8,32,(g,w,h)=>{const id=g.createImageData(w,h),d=id.data;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const u=1-Math.abs((x+.5)/w-.5)*2,v=Math.sin((y+.5)/h*PI);const a=Math.pow(v,1.6)*Math.pow(u,.8)*(.75+R()*.25);const i=(y*w+x)*4;d[i]=d[i+1]=d[i+2]=255;d[i+3]=a*255;}g.putImageData(id,0,0);},true);
const smokeTex=ctex(8,8,g=>{const px=['..xxx...','.xxxxx..','xxxxxxx.','xxxxxxxx','.xxxxxxx','.xxxxxx.','..xxxx..','...xx...'];for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(px[y][x]==='x'){const v=150+R()*80|0;g.fillStyle='rgb('+v+','+v+','+v+')';g.fillRect(x,y,1,1);}},true);
function facade(cols,floors,noG,tone){
 const cw=8,fh=8,w=cols*cw,h=floors*fh,lit=[];
 const map=ctex(w,h,g=>{speckle(g,w,h,tone,16);
  for(let f=0;f<floors;f++)for(let c=0;c<cols;c++){const x=c*cw,y=f*fh;
   if(!noG&&f===floors-1){g.fillStyle='rgba(18,18,20,.5)';g.fillRect(x,y,cw,fh);if(R()<.16){g.fillStyle='#0b0b0d';g.fillRect(x+2,y+2,4,6);}continue;}
   g.fillStyle='rgba(0,0,0,.3)';g.fillRect(x,y+fh-1,cw,1);g.fillStyle='rgba(0,0,0,.16)';g.fillRect(x,y,1,fh);
   g.fillStyle='#0a0d12';g.fillRect(x+2,y+2,5,4);
   if(R()<.3){g.fillStyle='rgba(0,0,0,.35)';g.fillRect(x+1,y+5,7,2);}
   if(R()<(f>floors-5?.13:.06))lit.push([x+2,y+2,pick(['#ffd08a','#e8a858','#ffc070','#8fb0e8','#d8c8a0'])]);}
  for(let i=0;i<cols/2;i++){g.fillStyle='rgba(0,0,0,.14)';g.fillRect(rr(0,w)|0,0,rr(1,3)|0,rr(h*.2,h)|0);}},true);
 const emis=ctex(w,h,g=>{g.fillStyle='#000';g.fillRect(0,0,w,h);for(const l of lit){g.fillStyle=l[2];g.fillRect(l[0],l[1],5,4);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(l[0]+2,l[1],1,4);}},true);
 return{map,emis};
}
function grafTex(text,col,block){
 const f=block?'bold 22px Impact,"Arial Black","Helvetica Neue",sans-serif':'italic bold 20px "Marker Felt","Chalkboard SE","Comic Sans MS","Arial Black",sans-serif';
 const mc=document.createElement('canvas').getContext('2d');mc.font=f;const tw=Math.ceil(mc.measureText(text).width)+12;
 return ctex(tw,36,(g,w,h)=>{g.font=f;g.textBaseline='middle';g.textAlign='center';
  g.fillStyle=col;for(let i=0;i<4;i++)g.fillRect(rr(8,w-8)|0,h/2,1,rr(6,15)|0);
  g.translate(w/2,h/2-2);g.rotate(rr(-.07,.07));
  if(block){g.lineWidth=4;g.lineJoin='round';g.strokeStyle='#08080a';g.strokeText(text,0,0);}
  g.fillStyle=col;g.fillText(text,0,0);g.setTransform(1,0,0,1,0,0);harden(g,w,h);},true);
}

/* ================= GEOMETRY HELPERS ================= */
const gcache={};
function B(w,h,d,sx,sy,sz){sx=sx||1;sy=sy||1;sz=sz||1;const k=[w,h,d,sx,sy,sz].join();return gcache[k]||(gcache[k]=new THREE.BoxGeometry(w,h,d,sx,sy,sz));}
function Cy(rt_,rb,h,n){return new THREE.CylinderGeometry(rt_,rb,h,n||6);}
function taper(g,fx,fz,dx){g=g.toNonIndexed();const p=g.attributes.position;for(let i=0;i<p.count;i++)if(p.getY(i)>0){p.setX(i,p.getX(i)*fx+(dx||0));p.setZ(i,p.getZ(i)*fz);}g.computeVertexNormals();return g;}
function mergeGeo(parts,jit){
 const pos=[],nor=[],col=[],m=new THREE.Matrix4(),nm=new THREE.Matrix3(),q=new THREE.Quaternion(),e=new THREE.Euler(),v=new V3(),c=new THREE.Color(),P=new V3(),S=new V3(1,1,1);
 for(const p of parts){
  const g=p.g.index?p.g.toNonIndexed():p.g;
  e.set(p.rx||0,p.ry||0,p.rz||0);q.setFromEuler(e);P.set(p.x||0,p.y||0,p.z||0);m.compose(P,q,S);nm.getNormalMatrix(m);
  const gp=g.attributes.position,gn=g.attributes.normal,gc=g.attributes.color,own=p.c!==undefined;if(own)c.set(p.c);
  let k=1;
  for(let i=0;i<gp.count;i++){
   if(jit&&i%6===0)k=1-R()*jit;
   v.fromBufferAttribute(gp,i).applyMatrix4(m);pos.push(v.x,v.y,v.z);
   v.fromBufferAttribute(gn,i).applyMatrix3(nm).normalize();nor.push(v.x,v.y,v.z);
   if(!own&&gc)col.push(gc.getX(i),gc.getY(i),gc.getZ(i));else col.push(c.r*k,c.g*k,c.b*k);
  }
 }
 const o=new THREE.BufferGeometry();
 o.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 o.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
 o.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
 return o;
}
function uvScale(g,su,sv){const u=g.attributes.uv;for(let i=0;i<u.count;i++)u.setXY(i,u.getX(i)*su,u.getY(i)*sv);}

export { ctex, speckle, harden, tAsphalt, tPave, tCobble, tWall, glowTex, streakTex, smokeTex, facade, grafTex, B, Cy, taper, mergeGeo, uvScale };
