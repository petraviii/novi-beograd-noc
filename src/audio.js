// All sound is synthesised with Web Audio: ambience, footsteps, tram, the
// waltz, and a formant "murmur" voice for greetings and the player's mumbling.
// Real recordings win if present: put e.g. voices/dobro_vece.mp3 in public/voices/.
import { clamp } from './util.js';
import { caption, day } from './state.js';

let mBus=null,mVib=null,mNext=0,mBar=0,musicOn=true;
let AC=null,master,white,pink,brown,aWindLP,aWindG,aHowlBP,aHowlG,aHum,aTram,aTramLP,aTramPan;
function initAudio(){
 const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
 try{AC=new C();}catch(e){AC=null;return;}
 const comp=AC.createDynamicsCompressor();comp.connect(AC.destination);master=AC.createGain();master.gain.value=.9;master.connect(comp);
 const n=AC.sampleRate*3|0,mkb=()=>AC.createBuffer(1,n,AC.sampleRate);
 white=mkb();pink=mkb();brown=mkb();const w=white.getChannelData(0),p=pink.getChannelData(0),b=brown.getChannelData(0);
 let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0,last=0;
 for(let i=0;i<n;i++){const x=Math.random()*2-1;w[i]=x;
  b0=.99886*b0+x*.0555179;b1=.99332*b1+x*.0750759;b2=.969*b2+x*.153852;b3=.8665*b3+x*.3104856;b4=.55*b4+x*.5329522;b5=-.7616*b5-x*.016898;
  p[i]=(b0+b1+b2+b3+b4+b5+b6+x*.5362)*.11;b6=x*.115926;last=(last+.02*x)/1.02;b[i]=last*3.5;}
 for(const d of[p,b]){const k=d[n-1]-d[0];for(let i=0;i<n;i++)d[i]-=k*i/(n-1);}
 const loop=buf=>{const s=AC.createBufferSource();s.buffer=buf;s.loop=true;s.start(0,Math.random()*2);return s;};
 const flt=(t,f,q)=>{const x=AC.createBiquadFilter();x.type=t;x.frequency.value=f;x.Q.value=q||.7;return x;};
 const gn=v=>{const x=AC.createGain();x.gain.value=v;return x;};
 aWindLP=flt('lowpass',260);aWindG=gn(.2);loop(pink).connect(aWindLP).connect(aWindG).connect(master);
 aHowlBP=flt('bandpass',420,7);aHowlG=gn(.02);loop(pink).connect(aHowlBP).connect(aHowlG).connect(master);
 loop(white).connect(flt('highpass',2800)).connect(flt('lowpass',8500)).connect(gn(.007)).connect(master);
 aHum=gn(0);aHum.connect(master);
 [[50,'sine',1],[100,'sine',.55],[150,'sawtooth',.1],[250,'sine',.06]].forEach(h=>{const o=AC.createOscillator();o.type=h[1];o.frequency.value=h[0];const g=gn(h[2]);o.connect(g).connect(aHum);o.start();});
 aTram=gn(0);aTramLP=flt('lowpass',600);aTram.connect(aTramLP);
 if(AC.createStereoPanner){aTramPan=AC.createStereoPanner();aTramLP.connect(aTramPan).connect(master);}else aTramLP.connect(master);
 loop(brown).connect(flt('lowpass',120)).connect(gn(1.1)).connect(aTram);
 const wh=AC.createOscillator();wh.type='sawtooth';wh.frequency.value=132;wh.connect(flt('lowpass',520)).connect(gn(.045)).connect(aTram);wh.start();
 // music bus: band-limited like an old radio, with a synthetic hall reverb and tape wow
 mBus=gn(.5);const mlp=flt('lowpass',2500);mBus.connect(flt('highpass',85)).connect(mlp);mlp.connect(master);
 const ir=AC.createBuffer(2,AC.sampleRate*2.8|0,AC.sampleRate);for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);}
 const cv=AC.createConvolver();cv.buffer=ir;mlp.connect(cv).connect(gn(.5)).connect(master);
 mVib=gn(1);[[5.1,5],[.37,8]].forEach(v=>{const o=AC.createOscillator();o.frequency.value=v[0];o.connect(gn(v[1])).connect(mVib);o.start();});
 mNext=AC.currentTime+3;
}
function nburst(t,dur,type,f,q,g,dest,att,f1){const s=AC.createBufferSource();s.buffer=white;s.loop=true;const fl=AC.createBiquadFilter();fl.type=type;fl.frequency.setValueAtTime(f,t);if(f1)fl.frequency.linearRampToValueAtTime(f1,t+dur);fl.Q.value=q;
 const gn=AC.createGain();gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(g,t+(att||.002));gn.gain.exponentialRampToValueAtTime(.0001,t+dur);
 s.connect(fl).connect(gn).connect(dest||master);s.start(t,Math.random()*2);s.stop(t+dur+.05);}
function tone(t,dur,type,f0,f1,g,dest){const o=AC.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur);
 const gn=AC.createGain();gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(g,t+.003);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(gn).connect(dest||master);o.start(t);o.stop(t+dur+.05);}
function voice(t,dur,midis,type,cut,att,rel,g,det){const fl=AC.createBiquadFilter();fl.type='lowpass';fl.frequency.value=cut;const gg=AC.createGain();
 gg.gain.setValueAtTime(.0001,t);gg.gain.linearRampToValueAtTime(g,t+att);gg.gain.setValueAtTime(g,Math.max(t+att,t+dur));gg.gain.exponentialRampToValueAtTime(.0001,t+dur+rel);fl.connect(gg).connect(mBus);
 for(const m of midis)for(const d of(det?[-det,det]:[0])){const o=AC.createOscillator();o.type=type;o.frequency.value=440*Math.pow(2,(m-69)/12);o.detune.value=d;mVib.connect(o.detune);o.connect(fl);o.start(t);o.stop(t+dur+rel+.05);}}
// slow minor-key waltz: bass + off-beat accordion chords, then an accordion lead, then a low hummed repeat
const BEAT=.94,CH=[[45,57,60,64],[45,57,60,64],[50,57,62,65],[50,57,62,65],[40,56,62,64],[40,56,62,64],[45,57,60,64],[45,57,60,64],[41,57,60,65],[43,59,62,67],[48,60,64,67],[45,57,60,64],[50,57,62,65],[40,56,62,64],[45,57,60,64],[45,57,60,64]];
const MEL=[[[0,2,76],[2,1,72]],[[0,3,69]],[[0,2,77],[2,1,74]],[[0,2,69],[2,1,65]],[[0,1,71],[1,1,76],[2,1,74]],[[0,2,71],[2,1,68]],[[0,2,69],[2,1,72]],[[0,3,76]],[[0,2,81],[2,1,77]],[[0,2,79],[2,1,74]],[[0,2,76],[2,1,72]],[[0,3,69]],[[0,1,74],[1,1,77],[2,1,74]],[[0,2,71],[2,1,68]],[[0,3,69]],[]];
function music(){if(!AC||!mBus)return;const now=AC.currentTime;if(mNext<now)mNext=now+.2;
 while(mNext<now+.7){const b=mBar%16,pass=(mBar/16|0)%3,c=CH[b],t=mNext;
  voice(t,.5,[c[0]],'triangle',480,.02,1.7,.5);
  for(const k of[1,2])voice(t+k*BEAT,.1,c.slice(1),'sawtooth',950,.015,.55,.045,6);
  if(pass)for(const n of MEL[b]){if(pass===1)voice(t+n[0]*BEAT,n[1]*BEAT-.08,[n[2]],'sawtooth',1500,.09,.35,.08,9);else voice(t+n[0]*BEAT,n[1]*BEAT-.08,[n[2]-12],'triangle',850,.28,.5,.2,5);}
  mNext+=3*BEAT;mBar++;}}
const sfx={
 step(){if(!AC)return;const t=AC.currentTime,r=Math.random();tone(t,.12,'sine',82+r*18,44,.2);nburst(t,.075,'lowpass',480+r*320,.7,.11);nburst(t+.012,.06,'bandpass',2400+r*900,1,.022);},
 beerOpen(d){if(!AC)return;const t=AC.currentTime+d;nburst(t,.014,'highpass',3000,.7,.5);tone(t,.05,'square',2500,1800,.05);tone(t+.004,.09,'triangle',3900,3200,.05);tone(t+.03,.08,'sine',430,130,.22);
  nburst(t+.04,.95,'bandpass',6500,.8,.17,null,.02);nburst(t+.2,1.7,'highpass',8000,.5,.03,null,.3);},
 gulp(){if(!AC)return;const t=AC.currentTime;tone(t,.1,'sine',170,85,.13);tone(t+.03,.06,'sine',300,520,.03);},
 flick(){if(!AC)return;const t=AC.currentTime;nburst(t,.035,'bandpass',4600,2,.28);tone(t,.02,'square',1900,800,.05);nburst(t+.03,.02,'highpass',6000,1,.1);},
 flame(){if(!AC)return;nburst(AC.currentTime,.3,'lowpass',420,.7,.09,null,.03);},
 inhale(){if(!AC)return;const t=AC.currentTime;nburst(t,1.0,'bandpass',1200,1.2,.055,null,.5,2300);for(let i=0;i<7;i++)nburst(t+.1+Math.random()*.75,.008,'highpass',5000,1,.03);},
 exhale(){if(!AC)return;nburst(AC.currentTime,.9,'bandpass',950,.8,.035,null,.15,600);},
 clink(v){if(!AC)return;const t=AC.currentTime;tone(t,.07,'triangle',2100+Math.random()*500,1600,.06*v);nburst(t,.03,'bandpass',5200,3,.08*v);},
 clatter(){if(!AC)return;const t=AC.currentTime;for(const k of[0,.12]){nburst(t+k,.1,'bandpass',250,1.2,1.0,aTram);tone(t+k,.07,'triangle',96,58,.6,aTram);nburst(t+k,.05,'bandpass',1900,3,.14,aTram);}},
 bell(){if(!AC)return;const t=AC.currentTime;for(const k of[0,.32]){tone(t+k,.6,'sine',1318,1300,.5,aTram);tone(t+k,.4,'sine',2640,2600,.15,aTram);}}
};

// voices: a formant synth shaped by the vowels and intonation of each line (muffled human murmur, not text-to-speech).
// Real recordings win if present: drop e.g. voices/dobro_vece.mp3 next to this file and it is played instead.
const FT={a:[760,1250],e:[480,1900],i:[300,2300],o:[500,900],u:[330,800]},noVoice={};
function vocal(txt,f0,vol,slur,delay){
 if(!AC)return;const vw=txt.toLowerCase().match(/[aeiou]/g)||['a','o'],t0=AC.currentTime+.03+(delay||0),sd=slur?.25:.165,tot=vw.length*sd;
 const o=AC.createOscillator(),ns=AC.createBufferSource(),ng=AC.createGain(),env=AC.createGain(),lp=AC.createBiquadFilter(),out=AC.createGain();
 o.type='sawtooth';ns.buffer=white;ns.loop=true;ng.gain.value=slur?.05:.1;lp.type='lowpass';lp.frequency.value=slur?1300:3000;out.gain.value=vol;
 const fs=[[1,7],[.55,9],[.12,6]].map((d,k)=>{const f=AC.createBiquadFilter(),g=AC.createGain();f.type='bandpass';f.Q.value=d[1];f.frequency.value=k===2?2700:600;g.gain.value=d[0];o.connect(f);ns.connect(ng);ng.connect(f);f.connect(g).connect(env);return f;});
 env.connect(lp).connect(out).connect(master);
 const q=txt.indexOf('?')>=0;o.frequency.setValueAtTime(f0*1.13,t0);o.frequency.linearRampToValueAtTime(f0*.92,t0+tot*.75);o.frequency.linearRampToValueAtTime(f0*(q?1.3:.8),t0+tot);
 env.gain.setValueAtTime(0,t0);
 vw.forEach((v,i)=>{const a=t0+i*sd,F=FT[v];fs[0].frequency.setTargetAtTime(F[0]*(slur?.85:1),a,.035);fs[1].frequency.setTargetAtTime(F[1]*(slur?.8:1),a,.035);
  o.detune.setValueAtTime((Math.random()-.5)*90,a);env.gain.linearRampToValueAtTime(.8+Math.random()*.2,a+.05);env.gain.linearRampToValueAtTime(slur?.45:.1,a+sd);});
 env.gain.linearRampToValueAtTime(0,t0+tot+.1);o.start(t0);ns.start(t0);o.stop(t0+tot+.2);ns.stop(t0+tot+.2);
}
function say(txt,f0,vol){
 const slug=txt.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'dj').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
 if(noVoice[slug]||location.protocol==='data:'){vocal(txt,f0,vol);return;}
 try{const a=new Audio('voices/'+slug+'.mp3');a.volume=.9;a.play().catch(()=>{noVoice[slug]=1;vocal(txt,f0,vol);});}catch(e){noVoice[slug]=1;vocal(txt,f0,vol);}
}
function greet(n){const g=(day.T?GR_D:GR_N)[Math.random()*6|0];caption.text='— '+g;caption.t=3.4;say(g,n.f0,.5);}
const MB=['Aaah... dobro je.','Uh, hladno.','E, to je to.','Mmm... još jedno.'],MC=['Mmm... e, to.','Ehh... život.','Uf... dobra.','Hmm... da, da.'];
const MWM=['Marija... ili Nastenka?','Kako se zvala... Marija?','Nastenka... ne, Marija. Ne znam.','Ne sećam se više... Nastenka?','Marija... gde si sad.','Nastenka... ili beše Marija.'];let womanT=25;
function mumbleSelf(list,delay){if(list!==MWM&&Math.random()<.4)list=MWM;const g=list[Math.random()*list.length|0];setTimeout(()=>{caption.text=g;caption.t=2.8;},(delay||0)*1000);vocal(g,88+Math.random()*14,.42,true,delay);}

function resumeAudio() { if (AC && AC.state === 'suspended') AC.resume(); }
function toggleMusic() { musicOn = !musicOn; if (mBus) mBus.gain.setTargetAtTime(musicOn ? .5 : 0, AC.currentTime, .3); return musicOn; }
const isMusicOn = () => musicOn;
// The recurring "Marija... ili Nastenka?" thought. `idle` = not drinking/smoking and no caption showing.
function updateMonologue(dt, idle) { if (idle) { womanT -= dt; if (womanT <= 0) { womanT = 45 + Math.random() * 40; mumbleSelf(MWM, 0); } } }

function updateAudio(t, gust, near, kd, lampOn, tram, cx, cy, cz, rx, rz) {
 if(AC){const n=AC.currentTime;if(musicOn)music();
  aWindLP.frequency.setTargetAtTime(170+300*gust,n,.4);aWindG.gain.setTargetAtTime(.16+.3*gust,n,.4);
  const g2=.5+.5*Math.sin(t*.23+1);aHowlBP.frequency.setTargetAtTime(340+280*g2,n,.5);aHowlG.gain.setTargetAtTime(.01+.07*gust*g2,n,.5);
  const hd=Math.min(near,kd*.8),hv=clamp(1-hd/14,0,1);aHum.gain.setTargetAtTime(.07*hv*hv*(.25+.75*lampOn),n,.2);
  if(tram.active){const ddx=clamp(cx,tram.x-7,tram.x+7)-cx,ddz=tram.z-cz,d=Math.hypot(ddx,ddz,cy-1.5);
   aTram.gain.setTargetAtTime(.9/Math.pow(1+(d/14)*(d/14),.75),n,.1);aTramLP.frequency.setTargetAtTime(280+5200/(1+(d/15)*(d/15)),n,.1);
   if(aTramPan){const tx=tram.x-cx,tz=tram.z-cz,tl=Math.hypot(tx,tz)||1;aTramPan.pan.setTargetAtTime(clamp((tx*rx+tz*rz)/tl,-1,1)*.8,n,.1);}
  }else aTram.gain.setTargetAtTime(0,n,.6);
 }
}
export { initAudio, resumeAudio, toggleMusic, isMusicOn, sfx, vocal, say, greet, mumbleSelf, MB, MC, MWM, updateMonologue, updateAudio };
