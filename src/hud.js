// 2D overlay drawn on its own low-res canvas: key hints, caption, clock, minimap.
import { clamp } from './util.js';
import { view, onResize } from './render.js';
import { harden } from './assets.js';
import { foot } from './world.js';
import { man, beer, cig, getHeading } from './player.js';
import { isMusicOn } from './audio.js';
import { input } from './input.js';
import { game, caption, day } from './state.js';

const hudC=document.getElementById('hud'),hg=hudC.getContext('2d');
let hudKey='';
hudC.width=view.W;hudC.height=view.H;
onResize((W,H)=>{hudC.width=W;hudC.height=H;hudKey='';});

let clockMin=3*60+47,clockAcc=0;
const MS=.15,MW=74,MH=72,MX=6,MY=6,TAGC=['#34383e','#ffb040','#40c8e0','#e04838','#e8e8ff','#60e070','#c878e8'],LMK=[[-144,45,1,'GENEX'],[136,46,2,'UŠĆE'],[140,-52,3,'RUDO'],[0,172,4,'HRAM'],[-190,-150,5,'AVALA'],[70,-180,6,'SIV']];
const mpx=x=>Math.round(MX+MW/2+x*MS),mpz=z=>Math.round(MY+MH/2+z*MS);
function drawMap(){
 hg.fillStyle='#55554e';hg.fillRect(MX-1,MY-1,MW+2,MH+2);hg.fillStyle='#07090b';hg.fillRect(MX,MY,MW,MH);
 hg.fillStyle='#1a1d22';hg.fillRect(MX,mpz(-10),MW,3);
 for(const f of foot){const a=mpx(f.x0),b=mpz(f.z0),w=Math.max(1,Math.round((f.x1-f.x0)*MS)),h=Math.max(1,Math.round((f.z1-f.z0)*MS));if(a<MX||a+w>MX+MW||b<MY||b+h>MY+MH)continue;hg.fillStyle=TAGC[f.tag];hg.fillRect(a,b,w,h);}
 hg.textAlign='left';
 LMK.forEach((l,i)=>{hg.fillStyle=TAGC[l[2]];hg.fillRect(mpx(l[0])-2,mpz(l[1])-2,4,4);const y=MY+MH+12+(i%3)*10,lx=MX+(i/3|0)*46;hg.fillRect(lx,y-6,5,5);hg.fillStyle='#000';hg.fillText(l[3],lx+9,y+1);hg.fillStyle='#a8a89a';hg.fillText(l[3],lx+8,y);});
 const px=clamp(mpx(man.position.x),MX+1,MX+MW-2),pz=clamp(mpz(man.position.z),MY+1,MY+MH-2);
 hg.fillStyle='#ffffff';hg.fillRect(px+Math.round(Math.sin(getHeading())*2),pz+Math.round(Math.cos(getHeading())*2),1,1);
 if((game.time*2|0)%2)hg.fillRect(px-1,pz-1,2,2);else hg.fillRect(px,pz,1,1);
}
function drawHud(){
 const bA=beer.t>=0,cA=cig.lit||cig.t>=0,key=[bA,cA,clockMin,view.W,view.H,day.T,isMusicOn(),caption.text,input.touchUI,mpx(man.position.x),mpz(man.position.z),Math.round(getHeading()*2),game.time*2|0].join();if(key===hudKey)return;hudKey=key;
 hg.clearRect(0,0,view.W,view.H);hg.font='bold 10px Menlo,Monaco,Consolas,"Courier New",monospace';hg.textBaseline='alphabetic';hg.textAlign='left';
 let x=8;const y=view.H-9;
 if(!input.touchUI)for(const[s,a]of[['[E] PIVO',bA],['  |  ',null],['[Q] PLJUGA',cA],['  |  ',null],[day.T?'[T] NOĆ':'[T] DAN',false],['  |  ',null],['[M] MUZ',isMusicOn()]]){hg.fillStyle='#000';hg.fillText(s,x+1,y+1);hg.fillStyle=a===null?'#6e6e64':a?'#ffb040':'#c8c8b8';hg.fillText(s,x,y);x=Math.round(x+hg.measureText(s).width);}
 if(caption.text){hg.textAlign='center';hg.fillStyle='#000';const cy=input.touchUI?Math.round(view.H*.58):view.H-28;hg.fillText(caption.text,(view.W>>1)+1,cy+1);hg.fillStyle='#f0e8c0';hg.fillText(caption.text,view.W>>1,cy);}
 const hh=((clockMin/60|0)+(day.T?12:0))%24,mm=clockMin%60,ct=(hh<10?'0':'')+hh+':'+(mm<10?'0':'')+mm;
 hg.textAlign='right';hg.fillStyle='#000';hg.fillText(ct,view.W-7,15);hg.fillStyle='#8a8a7c';hg.fillText(ct,view.W-8,14);
 drawMap();
 harden(hg,view.W,view.H);
}

function updateHud(dt) { clockAcc+=dt;if(clockAcc>20){clockAcc=0;clockMin++;} drawHud(); }
export { updateHud };
