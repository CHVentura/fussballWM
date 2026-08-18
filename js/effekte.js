"use strict";
/* ====================================================================
   effekte.js — Szenenaufbau und Animationen
   Ballflug und Ballsprünge laufen über requestAnimationFrame,
   alles andere möglichst über CSS-Animationen (schonend fürs Tablet).
   ==================================================================== */

/* ---------- Zuschauerränge ----------
   Die Menge steht in 30 Spalten. Jede Spalte ist eine eigene Gruppe mit
   versetzter Animationsverzögerung — dadurch läuft alle paar Sekunden
   eine La-Ola durch das Stadion, komplett über CSS (billig fürs Tablet).
   Die Farbtupfer sind die Trikotfarben der beiden Teams. */
const CROWD_SPALTEN = 30;
const CROWD_PRO_SPALTE = 11;

function crowdPalette(idxA, idxB){
  const p=[];
  [idxA, idxB].forEach(i=>{
    if(i==null) return;
    const j=KITS[i].jersey;
    p.push(j, j, shade(j, 0.28), shade(j, -0.22));
  });
  p.push("#8a9c92","#9a9a8e","#8e94a0");   // neutrale Zuschauer
  return p;
}

function buildCrowd(idxA, idxB){
  const farben=crowdPalette(idxA, idxB);
  const breite=600/CROWD_SPALTEN;
  let html="";
  for(let s=0;s<CROWD_SPALTEN;s++){
    let punkte="";
    for(let k=0;k<CROWD_PRO_SPALTE;k++){
      const x=s*breite + 2 + Math.random()*(breite-4);
      const y=8 + Math.random()*108;
      const c=farben[zufall(farben.length)];
      const o=(0.30+Math.random()*0.45).toFixed(2);
      punkte+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.6" fill="${c}" opacity="${o}"/>`;
    }
    html+=`<g class="ola-sp" style="animation-delay:${(s*0.14).toFixed(2)}s">${punkte}</g>`;
  }
  // Fotoblitze in der Menge
  for(let i=0;i<12;i++){
    const x=Math.random()*600, y=8+Math.random()*108;
    html+=`<circle class="camflash" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2" fill="#fff" style="animation-duration:${(2.6+Math.random()*4).toFixed(1)}s;animation-delay:${(Math.random()*4).toFixed(1)}s"/>`;
  }
  $("crowd").innerHTML=html;
}

/* ---------- Tornetz ---------- */
function buildNet(){
  let net="";
  for(let x=GX;x<=GX+GW;x+=20) net+=`<line x1="${x}" y1="${GY}" x2="${x}" y2="${GY+GH}" stroke="rgba(242,245,239,.10)" stroke-width="1"/>`;
  for(let y=GY;y<=GY+GH;y+=20) net+=`<line x1="${GX}" y1="${y}" x2="${GX+GW}" y2="${y}" stroke="rgba(242,245,239,.10)" stroke-width="1"/>`;
  $("net").innerHTML=net;
}

/* ---------- Ballflug ----------
   Quadratische Kurve vom Elfmeterpunkt zur Zone, dazu ein leichter Effet
   (seitliche Auslenkung, die in der Flugmitte am grössten ist) und ein
   Schatten, der mit der Flughöhe kleiner und heller wird.
   Läuft über requestAnimationFrame, nicht über Timer-Kaskaden. */
function flyBall(targetSVG, opts, done){
  const {dur=460, endScale=0.58, arc=65, groundEnd=255}=opts||{};
  const ball=$("ball"), shadow=$("ballshadow");
  const f=SPOT, tt=targetSVG;
  const cx=(f.x+tt.x)/2, cy=Math.min(f.y,tt.y)-arc;
  /* Effet: der Ball dreht in die Richtung, in die er geschossen wird */
  const effet = (opts && opts.effet!=null)
    ? opts.effet
    : (tt.x-f.x)*0.16 + (Math.random()*10-5);
  const t0=performance.now();
  ball.style.opacity="1"; ball.classList.add("live");
  shadow.style.opacity="0.45";

  function step(now){
    let u=Math.min(1,(now-t0)/dur);
    const e=1-Math.pow(1-u,1.7);
    const bogen=Math.sin(Math.PI*e);
    const x=(1-e)*(1-e)*f.x + 2*(1-e)*e*cx + e*e*tt.x + effet*bogen;
    const y=(1-e)*(1-e)*f.y + 2*(1-e)*e*cy + e*e*tt.y;
    const p=s2p({x,y});
    ball.style.left=p.x+"px"; ball.style.top=p.y+"px";
    const sc=1-(1-endScale)*e;
    const rot=e*720*Math.sign(tt.x-f.x||1);
    ball.style.transform=`translate(-50%,-50%) scale(${sc}) rotate(${rot}deg)`;
    const gy=f.y+(groundEnd-f.y)*e;
    const sp=s2p({x, y:gy});
    const h=Math.max(0, gy-y);
    shadow.style.left=sp.x+"px"; shadow.style.top=sp.y+"px";
    shadow.style.opacity=String(Math.max(0.05, 0.45 - h/500));
    shadow.style.transform=`translate(-50%,-50%) scale(${Math.max(0.35, 1-h/420)})`;
    if(u<1) requestAnimationFrame(step);
    else { shadow.style.opacity="0"; if(done) done(); }
  }
  requestAnimationFrame(step);
}

/* Ball fällt nach Parade zu Boden und springt zweimal auf */
function dropBall(fromSVG){
  const ball=$("ball");
  const pts=[
    {p:{x:fromSVG.x+3, y:246}, d:170},
    {p:{x:fromSVG.x+7, y:233}, d:130},
    {p:{x:fromSVG.x+11,y:247}, d:120},
    {p:{x:fromSVG.x+13,y:241}, d:90},
    {p:{x:fromSVG.x+15,y:248}, d:80}
  ];
  let cur=s2p(fromSVG), i=0;
  function seg(){
    if(i>=pts.length) return;
    const target=s2p(pts[i].p), dur=pts[i].d, t0=performance.now(), from={...cur};
    function st(now){
      const u=Math.min(1,(now-t0)/dur);
      ball.style.left=(from.x+(target.x-from.x)*u)+"px";
      ball.style.top=(from.y+(target.y-from.y)*u)+"px";
      if(u<1) requestAnimationFrame(st);
      else { cur=target; i++; seg(); }
    }
    requestAnimationFrame(st);
  }
  seg();
}

/* ---------- Staubwolke bei der Landung des Torwarts ---------- */
function spawnDust(svgX){
  const fx=$("fx");
  let s="";
  for(let i=0;i<6;i++){
    const ox=(Math.random()*36-18).toFixed(1), r=(2+Math.random()*3).toFixed(1);
    s+=`<circle class="dust" cx="${(svgX+ +ox).toFixed(1)}" cy="${(244+Math.random()*5).toFixed(1)}" r="${r}" fill="rgba(220,225,210,.5)"/>`;
  }
  fx.innerHTML+=s;
  setTimeout(()=>{ fx.innerHTML=""; }, 700);
}

/* ---------- Netz zappelt, Bild wackelt ---------- */
function netRipple(){
  const n=$("net");
  n.classList.remove("bulge"); void n.getBoundingClientRect();
  n.classList.add("bulge");
}
function pitchShake(){
  const p=document.querySelector(".pitch");
  p.classList.remove("shake"); void p.offsetWidth;
  p.classList.add("shake");
  setTimeout(()=>p.classList.remove("shake"), 450);
}

/* ---------- Flitzer ---------- */
function runStreaker(){
  const st=$("streaker");
  st.classList.remove("go");
  void st.getBoundingClientRect();
  st.classList.add("go");
  cheer();
  setTimeout(()=>st.classList.remove("go"), 2600);
}

/* ---------- Zielkreuz ----------
   Reine Stimmungssache: zeigt, dass jetzt gezielt wird. Ab Halbfinal und
   bei Matchball wackelt es — es verändert das Resultat nicht. */
function zeigeZielkreuz(nervoes){
  const zk=$("zielkreuz");
  zk.style.display="";
  zk.classList.toggle("nervoes", !!nervoes);
}
function versteckeZielkreuz(){
  const zk=$("zielkreuz");
  zk.style.display="none";
  zk.classList.remove("nervoes");
}

/* ---------- Kamera (2.5D) ----------
   Die Kamera lehnt sich beim Schuss leicht in die gewählte Ecke. Weil
   Ränge und Tor unterschiedlich weit hinten liegen, verschieben sie sich
   dabei verschieden stark — das ergibt den räumlichen Eindruck.
   Gerechnet wird nichts pro Bild: eine CSS-Transition macht die Bewegung. */
const KAMERA_RUHE = "none";

function kameraSchwenk(zone, dauerMs, naeher){
  if(bewegungReduziert()){
    /* Falls vorher geschwenkt wurde: Inline-Transform wieder freigeben,
       damit die Regel aus dem Stylesheet greift */
    $("szene").style.transform = "";
    return;
  }
  /* Sehr wenig Zoom — mehr würde Latte und obere Zonen abschneiden */
  const zoom = naeher ? 1.035 : 1.02;
  const sz = $("szene");
  if(dauerMs) sz.style.transitionDuration = (dauerMs/1000).toFixed(2)+"s";
  if(istGrobzeiger()){
    /* Touch: keine 3D-Neigung — auf iPad/Safari verpasst die
       Tipp-Erkennung sonst manchmal die Zonen (siehe istGrobzeiger). */
    sz.style.transform = `scale(${zoom})`;
    return;
  }
  const c = zoneCenterSVG(zone);
  const ry = -((c.x - 300) / 230) * 3.5;      // seitlich, bis ±3.5 Grad
  const rx = ((141 - c.y) / 111) * 1.6;       // hoch/tief, bis ±1.6 Grad
  sz.style.transform =
    `scale(${zoom}) rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg)`;
}
function kameraZurueck(){
  const sz = $("szene");
  sz.style.transitionDuration = "";
  sz.style.transform = KAMERA_RUHE;
}

/* ---------- Kraftbalken (Profi-Modus) ----------
   Die Marke pendelt hin und her; wer im grünen Feld stoppt, schiesst
   perfekt, wer im roten stoppt, setzt den Ball daneben. Läuft über
   requestAnimationFrame, ohne Timer-Kaskade. Wird nach drei Durchläufen
   von selbst ausgelöst, damit niemand ewig zögern kann. */
const KRAFT_ROT = 0.10;      // Randzonen links und rechts
const KRAFT_GELB = 0.25;     // je 25 Prozent daneben
const KRAFT_DAUER = 1100;    // eine Richtung in Millisekunden
const KRAFT_LAEUFE = 3;      // danach löst der Schuss selber aus

let kraftAktiv = false, kraftFertig = null, kraftT0 = 0, kraftRAF = null;

function kraftBewertung(wert){
  if(wert < KRAFT_ROT || wert > 1-KRAFT_ROT) return "rot";
  if(wert < KRAFT_ROT+KRAFT_GELB || wert > 1-KRAFT_ROT-KRAFT_GELB) return "gelb";
  return "gruen";
}

function kraftStarten(fertig){
  const box=$("kraft"), marke=$("kraftMarke");
  kraftAktiv=true; kraftFertig=fertig; kraftT0=performance.now();
  $("kraftTitel").textContent="Jetzt tippen!";
  $("kraftTitel").className="kraft-titel";
  box.style.display="block";

  function schritt(now){
    if(!kraftAktiv) return;
    const t=(now-kraftT0)/KRAFT_DAUER;
    /* Dreieckswelle: 0 → 1 → 0 → … */
    const wert=Math.abs(((t % 2) + 2) % 2 - 1);
    marke.style.left=(wert*100).toFixed(2)+"%";
    if(t >= KRAFT_LAEUFE*2){ kraftStop(); return; }
    kraftRAF=requestAnimationFrame(schritt);
  }
  kraftRAF=requestAnimationFrame(schritt);
}

/* Marke anhalten und das Ergebnis melden */
function kraftStop(){
  if(!kraftAktiv) return;
  kraftAktiv=false;
  if(kraftRAF) cancelAnimationFrame(kraftRAF);
  const t=(performance.now()-kraftT0)/KRAFT_DAUER;
  const wert=Math.abs(((t % 2) + 2) % 2 - 1);
  const art=kraftBewertung(wert);
  const titel=$("kraftTitel");
  titel.textContent = art==="gruen" ? "PERFEKT!" : art==="gelb" ? "Gut getroffen" : "Verrissen!";
  titel.className = "kraft-titel " + (art==="gruen" ? "perfekt" : art==="gelb" ? "gut" : "daneben");
  const melde=kraftFertig;
  kraftFertig=null;
  setTimeout(()=>{ $("kraft").style.display="none"; }, 420);
  if(melde) melde(art, wert);
}
function kraftLaeuft(){ return kraftAktiv; }
function kraftAbbrechen(){
  kraftAktiv=false; kraftFertig=null;
  if(kraftRAF) cancelAnimationFrame(kraftRAF);
  $("kraft").style.display="none";
}

/* ---------- Zeitlupe beim Matchball ---------- */
function zeitlupeAn(){
  document.querySelector(".pitch").classList.add("zeitlupe");
}
function zeitlupeAus(){
  document.querySelector(".pitch").classList.remove("zeitlupe");
}

/* ---------- Konfetti ---------- */
function spawnConfetti(container, anzahl){
  const colors=["#f0c548","#f2f5ef","#e05548","#26a69a","#4d8df0","#f08c3a","#4cd97b"];
  const wrap=document.createElement("div");
  wrap.className="confetti";
  const n=anzahl||80;
  for(let i=0;i<n;i++){
    const s=document.createElement("span");
    s.style.left=(Math.random()*100)+"%";
    s.style.background=colors[zufall(colors.length)];
    s.style.animationDuration=(1.1+Math.random()*1.2)+"s";
    s.style.animationDelay=(Math.random()*0.35)+"s";
    wrap.appendChild(s);
  }
  container.appendChild(wrap);
  setTimeout(()=>wrap.remove(), 3000);
}
