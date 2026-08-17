"use strict";
/* ====================================================================
   audio.js — alle Klänge über die Web Audio API
   Keine Audiodateien: Stadionrauschen, Trommelgroove, Pfiff, Schuss,
   Jubel, Stöhnen und der Torschrei werden zur Laufzeit erzeugt.
   ==================================================================== */

let AC = null, master, ambGain, musicGain, soundOn = true;
let grooveTimer = null, grooveBeat = 0, grooveNext = 0;

function initAudio(){
  if(AC){ if(AC.state==="suspended" && soundOn) AC.resume(); return; }
  try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return; }
  master=AC.createGain(); master.gain.value=0.9; master.connect(AC.destination);

  const len=2*AC.sampleRate;
  const buf=AC.createBuffer(1,len,AC.sampleRate);
  const d=buf.getChannelData(0);
  let last=0;
  for(let i=0;i<len;i++){
    const w=Math.random()*2-1;
    last=(last+0.02*w)/1.02;
    d[i]=last*3.2;
  }
  const src=AC.createBufferSource(); src.buffer=buf; src.loop=true;
  const lp=AC.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=700;
  ambGain=AC.createGain(); ambGain.gain.value=0.06;
  src.connect(lp); lp.connect(ambGain); ambGain.connect(master);
  src.start();
  const lfo=AC.createOscillator(), lfoG=AC.createGain();
  lfo.frequency.value=0.07; lfoG.gain.value=0.02;
  lfo.connect(lfoG); lfoG.connect(ambGain.gain); lfo.start();

  musicGain=AC.createGain(); musicGain.gain.value=0.5; musicGain.connect(master);
  grooveNext=AC.currentTime+0.2; grooveBeat=0;
  grooveTimer=setInterval(scheduleGroove,150);
}
function scheduleGroove(){
  if(!AC || AC.state!=="running") return;
  const beat=60/104;
  while(grooveNext < AC.currentTime+0.4){
    const step=grooveBeat%4;
    if(step===0||step===1) drum(grooveNext);
    if(step===2) clap(grooveNext);
    grooveBeat++; grooveNext+=beat;
  }
}
function drum(t){
  const o=AC.createOscillator(), g=AC.createGain();
  o.type="sine"; o.frequency.setValueAtTime(130,t);
  o.frequency.exponentialRampToValueAtTime(45,t+0.12);
  g.gain.setValueAtTime(0.12,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+0.18);
  o.connect(g); g.connect(musicGain); o.start(t); o.stop(t+0.2);
}
function clap(t){
  const n=noiseSrc(0.08);
  const bp=AC.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=1700; bp.Q.value=1.2;
  const g=AC.createGain();
  g.gain.setValueAtTime(0.09,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+0.08);
  n.connect(bp); bp.connect(g); g.connect(musicGain); n.start(t);
}
function noiseSrc(sec){
  const b=AC.createBuffer(1,sec*AC.sampleRate,AC.sampleRate);
  const d=b.getChannelData(0);
  for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  const s=AC.createBufferSource(); s.buffer=b; return s;
}
function whistle(){
  if(!AC||AC.state!=="running") return;
  const t=AC.currentTime;
  const o=AC.createOscillator(), g=AC.createGain();
  o.type="sine"; o.frequency.value=2300;
  const v=AC.createOscillator(), vg=AC.createGain();
  v.frequency.value=34; vg.gain.value=170;
  v.connect(vg); vg.connect(o.frequency);
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(0.12,t+0.03);
  g.gain.setValueAtTime(0.12,t+0.42);
  g.gain.exponentialRampToValueAtTime(0.0001,t+0.52);
  o.connect(g); g.connect(master);
  o.start(t); v.start(t); o.stop(t+0.55); v.stop(t+0.55);
}
function segTone(i){
  if(!AC||AC.state!=="running") return;
  const freqs=[261.63, 293.66, 329.63, 349.23];
  const durs=[0.14, 0.26, 0.42, 0.52];
  const t=AC.currentTime;
  const o=AC.createOscillator(), g=AC.createGain();
  o.type="sine"; o.frequency.value=freqs[i]||freqs[freqs.length-1];
  const dur=durs[i]||durs[durs.length-1];
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(0.07,t+0.02);
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t+dur+0.05);
}
function kickSound(){
  if(!AC||AC.state!=="running") return;
  const t=AC.currentTime;
  const o=AC.createOscillator(), g=AC.createGain();
  o.type="sine"; o.frequency.setValueAtTime(95,t);
  o.frequency.exponentialRampToValueAtTime(40,t+0.1);
  g.gain.setValueAtTime(0.3,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+0.14);
  o.connect(g); g.connect(master); o.start(t); o.stop(t+0.16);
  const n=noiseSrc(0.05), ng=AC.createGain();
  ng.gain.setValueAtTime(0.12,t); ng.gain.exponentialRampToValueAtTime(0.001,t+0.05);
  n.connect(ng); ng.connect(master); n.start(t);
}
function cheer(){
  if(!AC||AC.state!=="running") return;
  const t=AC.currentTime;
  const n=noiseSrc(1.6);
  const bp=AC.createBiquadFilter(); bp.type="bandpass"; bp.Q.value=0.7;
  bp.frequency.setValueAtTime(400,t);
  bp.frequency.linearRampToValueAtTime(1500,t+0.5);
  const g=AC.createGain();
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(0.3,t+0.18);
  g.gain.exponentialRampToValueAtTime(0.001,t+1.5);
  n.connect(bp); bp.connect(g); g.connect(master); n.start(t);
  ambGain.gain.cancelScheduledValues(t);
  ambGain.gain.linearRampToValueAtTime(0.16,t+0.25);
  ambGain.gain.linearRampToValueAtTime(0.06,t+2.0);
}
function groan(){
  if(!AC||AC.state!=="running") return;
  const t=AC.currentTime;
  const o=AC.createOscillator(), g=AC.createGain();
  o.type="sawtooth";
  o.frequency.setValueAtTime(190,t);
  o.frequency.exponentialRampToValueAtTime(110,t+0.7);
  const lp=AC.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=500;
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(0.08,t+0.12);
  g.gain.exponentialRampToValueAtTime(0.001,t+0.8);
  o.connect(lp); lp.connect(g); g.connect(master); o.start(t); o.stop(t+0.85);
  const n=noiseSrc(0.9);
  const bp=AC.createBiquadFilter(); bp.type="bandpass"; bp.Q.value=0.8;
  bp.frequency.setValueAtTime(900,t);
  bp.frequency.linearRampToValueAtTime(350,t+0.7);
  const ng=AC.createGain();
  ng.gain.setValueAtTime(0.0001,t);
  ng.gain.exponentialRampToValueAtTime(0.12,t+0.12);
  ng.gain.exponentialRampToValueAtTime(0.001,t+0.85);
  n.connect(bp); bp.connect(ng); ng.connect(master); n.start(t);
}
function siuSound(){
  if(!AC||AC.state!=="running") return;
  const t=AC.currentTime;
  const o=AC.createOscillator();
  o.type="sawtooth";
  o.frequency.setValueAtTime(240,t);
  o.frequency.linearRampToValueAtTime(180,t+0.8);
  const bp=AC.createBiquadFilter(); bp.type="bandpass"; bp.Q.value=6;
  bp.frequency.setValueAtTime(2600,t);
  bp.frequency.setValueAtTime(2600,t+0.22);
  bp.frequency.exponentialRampToValueAtTime(520,t+0.7);
  const g=AC.createGain();
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(0.16,t+0.06);
  g.gain.setValueAtTime(0.16,t+0.55);
  g.gain.exponentialRampToValueAtTime(0.0001,t+0.9);
  o.connect(bp); bp.connect(g); g.connect(master);
  o.start(t); o.stop(t+0.95);
  cheer();
}

/* Sound-Schalter im Scoreboard */
$("sndBtn").onclick=()=>{
  soundOn=!soundOn;
  $("sndBtn").textContent = soundOn ? "🔊" : "🔇";
  if(!AC) return;
  if(soundOn) AC.resume(); else AC.suspend();
};
