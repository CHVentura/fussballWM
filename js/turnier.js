"use strict";
/* ====================================================================
   turnier.js — Weltmeisterschaft: Turnierbaum, Auslosung, Simulation
   16 Teams ab Achtelfinal. Meine Partien spiele ich selber, die
   anderen simuliert der Computer. Der Stand liegt in localStorage,
   damit ein Turnier über mehrere Tage weitergeht.
   ==================================================================== */

/* Die vier Runden. Pro Runde wird der Gegner stärker:
   - zonen       : Zonen, die der Computer-Torwart immer abdeckt
   - extraZone   : Wahrscheinlichkeit für eine zusätzliche Zone
   - lernen      : wie stark der Torwart meine Lieblingsecken kennt
   - lernenSchuss: wie stark der Computer-Schütze meine Torwart-Ecken kennt
                   (bewusst schwächer als "lernen" — sonst wird der Final
                    für Kinder unfair) */
const WM_RUNDEN = [
  {name:"Achtelfinal",  partien:8, zonen:3, extraZone:0,    lernen:0.00, lernenSchuss:0.00, tw:"Der Torwart ist noch nervös."},
  {name:"Viertelfinal", partien:4, zonen:3, extraZone:0,    lernen:0.25, lernenSchuss:0.15, tw:"Der Torwart schaut genau hin."},
  {name:"Halbfinal",    partien:2, zonen:3, extraZone:0.25, lernen:0.45, lernenSchuss:0.30, tw:"Der Torwart kennt deine Lieblingsecke."},
  {name:"Final",        partien:1, zonen:3, extraZone:0.50, lernen:0.60, lernenSchuss:0.40, tw:"Der beste Torwart der WM steht im Tor!"}
];

/* Aktueller Turnierstand (null = kein Turnier) */
let turnier = null;

/* ---------------- Speichern und Laden ----------------
   Der Turnierstand liegt im aktiven Profil (siehe profil.js), damit
   jedes Kind sein eigenes Turnier hat. */
function wmLaden(){
  const p = aktivProfil();
  const t = p && p.turnier;
  if(!t || t.version !== 1 || typeof t.meinIdx !== "number") return null;
  if(!Array.isArray(t.runden) || !t.runden.length) return null;
  return t;
}
function wmSpeichern(){
  const p = aktivProfil();
  if(!p || !turnier) return;
  p.turnier = turnier;
  profileSpeichern();
}
function wmLoeschen(){
  const p = aktivProfil();
  if(!p) return;
  p.turnier = null;
  profileSpeichern();
}

/* ---------------- Auslosung ---------------- */
function mischen(a){
  for(let i=a.length-1;i>0;i--){
    const j=zufall(i+1);
    const h=a[i]; a[i]=a[j]; a[j]=h;
  }
  return a;
}
function paareAus(feld){
  const p=[];
  for(let i=0;i<feld.length;i+=2) p.push([feld[i], feld[i+1]]);
  return p;
}

/* Neues Turnier: 16 Teams, mein Team ist immer dabei */
function wmNeu(meinIdx){
  const andere = TEAMS.map((_,i)=>i).filter(i=>i!==meinIdx);
  mischen(andere);
  const feld = mischen([meinIdx].concat(andere.slice(0,15)));
  turnier = {
    version: 1,
    meinIdx: meinIdx,
    runde: 0,
    runden: [{paare: paareAus(feld), res: []}],
    status: "laufend",   // laufend | aus | titel
    ausRunde: null,
    schuss: new Array(9).fill(0),   // wohin ich schiesse
    deck:   new Array(9).fill(0)    // welche Zonen ich als Torwart decke
  };
  statPlus("turniere");
  landGespielt(meinIdx);
  wmSpeichern();
  return turnier;
}

/* ---------------- Zugriffshelfer ---------------- */
function wmRunde(){ return turnier.runden[turnier.runde]; }
function wmRundenName(r){ return WM_RUNDEN[r] ? WM_RUNDEN[r].name : "Turnier"; }
function wmMeinPaar(){
  const r=wmRunde();
  if(!r) return -1;
  return r.paare.findIndex(p=>p.indexOf(turnier.meinIdx)>=0);
}
function wmGegner(){
  const p=wmRunde().paare[wmMeinPaar()];
  return p[0]===turnier.meinIdx ? p[1] : p[0];
}
/* Meine Partie in dieser Runde noch offen? */
function wmPartieOffen(){
  return turnier.status==="laufend" && !wmRunde().res[wmMeinPaar()];
}

/* ---------------- Simulation der anderen Partien ---------------- */
/* Trefferquote eines Schützen gegen einen Gegner */
function trefferP(iA, iB){
  const p = 0.58 + 0.34*STAERKE[iA] - 0.16*STAERKE[iB];
  return Math.max(0.50, Math.min(0.92, p));
}
function schonEntschieden(a,b,na,nb){
  return a > b + (5-nb) || b > a + (5-na);
}
/* Ein komplettes Elfmeterschiessen ausrechnen — mit Abbruchregel und
   Sudden Death, damit die Resultate echt aussehen (4:2, 5:4, 3:1 …) */
function simSchiessen(iA, iB){
  const pA=trefferP(iA,iB), pB=trefferP(iB,iA);
  let a=0,b=0,na=0,nb=0;
  for(let k=0;k<5;k++){
    if(schonEntschieden(a,b,na,nb)) break;
    if(Math.random()<pA) a++;
    na++;
    if(schonEntschieden(a,b,na,nb)) break;
    if(Math.random()<pB) b++;
    nb++;
  }
  /* Sudden Death: unter Druck trifft man schlechter, darum bleiben die
     Resultate in einem realistischen Rahmen (selten mehr als 7 Tore) */
  const dA=Math.max(0.40, pA-0.18), dB=Math.max(0.40, pB-0.18);
  let schutz=0;
  while(a===b && schutz<6){
    if(Math.random()<dA) a++;
    if(Math.random()<dB) b++;
    na++; nb++; schutz++;
  }
  if(a===b){ if(Math.random()<0.5) a++; else b++; }   // Münzwurf als Notbremse
  return {ga:a, gb:b, sieger:(a>b?iA:iB), sudden:(na>5)};
}

/* Alle Partien der aktuellen Runde ausser meiner simulieren */
function wmAndereSimulieren(){
  const r=wmRunde();
  r.paare.forEach((p,i)=>{
    if(r.res[i]) return;
    const s=simSchiessen(p[0],p[1]);
    r.res[i]={ga:s.ga, gb:s.gb, sieger:s.sieger, sudden:s.sudden};
  });
}

/* Mein Resultat eintragen */
function wmMeinResultatEintragen(meineTore, gegnerTore){
  const r=wmRunde(), i=wmMeinPaar(), p=r.paare[i];
  const ichBinA = p[0]===turnier.meinIdx;
  const ga = ichBinA ? meineTore : gegnerTore;
  const gb = ichBinA ? gegnerTore : meineTore;
  r.res[i]={ga:ga, gb:gb, sieger:(meineTore>gegnerTore ? turnier.meinIdx : wmGegner()), sudden:false};
  wmSpeichern();
}

/* Nächste Runde aus den Siegern bauen */
function wmNaechsteRunde(){
  const r=wmRunde();
  const sieger=r.res.map(x=>x.sieger);
  turnier.runden.push({paare: paareAus(sieger), res: []});
  turnier.runde++;
  wmSpeichern();
}

/* Nach dem Ausscheiden: Turnier fertig simulieren, damit die Kinder
   sehen, wer Weltmeister geworden ist */
function wmRestSimulieren(){
  while(turnier.runde < WM_RUNDEN.length-1){
    wmAndereSimulieren();
    wmNaechsteRunde();
  }
  wmAndereSimulieren();
  wmSpeichern();
}

/* Weltmeister, falls das Turnier fertig ist */
function wmWeltmeister(){
  const letzte=turnier.runden[WM_RUNDEN.length-1];
  if(!letzte || !letzte.res[0]) return null;
  return letzte.res[0].sieger;
}

/* Alle Teams, die auf meinem Weg standen bzw. stehen */
function wmMeinWeg(){
  const weg=[];
  turnier.runden.forEach((r,ri)=>{
    const i=r.paare.findIndex(p=>p.indexOf(turnier.meinIdx)>=0);
    if(i<0 || !r.res[i]) return;
    const p=r.paare[i], res=r.res[i];
    const gegner = p[0]===turnier.meinIdx ? p[1] : p[0];
    const meine  = p[0]===turnier.meinIdx ? res.ga : res.gb;
    const seine  = p[0]===turnier.meinIdx ? res.gb : res.ga;
    weg.push({runde:ri, gegner:gegner, meine:meine, seine:seine, gewonnen:res.sieger===turnier.meinIdx});
  });
  return weg;
}

/* ---------------- Stärke des Computers ---------------- */
/* Gewichtete Zufallsauswahl */
function gewichtetWaehlen(liste, gewichte){
  let summe=0;
  for(let i=0;i<gewichte.length;i++) summe+=gewichte[i];
  let w=Math.random()*summe;
  for(let i=0;i<liste.length;i++){
    w-=gewichte[i];
    if(w<=0) return liste[i];
  }
  return liste[liste.length-1];
}

/* Zonen, die der Computer-Torwart abdeckt.
   Mit der Wahrscheinlichkeit "lernen" nimmt er eine Zone, in die ich
   bisher oft geschossen habe — deshalb wird er von Runde zu Runde besser. */
function wmKeeperZonen(){
  const cfg=WM_RUNDEN[turnier.runde];
  const anzahl=cfg.zonen + (Math.random()<cfg.extraZone ? 1 : 0);
  const frei=[0,1,2,3,4,5,6,7,8];
  const out=[];
  const kenntMich=turnier.schuss.some(v=>v>0);
  while(out.length<anzahl && frei.length){
    let z;
    if(kenntMich && Math.random()<cfg.lernen){
      z=gewichtetWaehlen(frei, frei.map(k=>turnier.schuss[k]+0.4));
    } else {
      z=zufallAus(frei);
    }
    out.push(z);
    frei.splice(frei.indexOf(z),1);
  }
  return out;
}

/* Zone, in die der Computer schiesst, wenn ich im Tor stehe.
   Er merkt sich, welche Ecken ich selten decke. */
function wmSchussZone(){
  const cfg=WM_RUNDEN[turnier.runde];
  const alle=[0,1,2,3,4,5,6,7,8];
  if(turnier.deck.some(v=>v>0) && Math.random()<cfg.lernenSchuss){
    const max=Math.max.apply(null, turnier.deck);
    return gewichtetWaehlen(alle, alle.map(z=>(max-turnier.deck[z])+0.4));
  }
  return zufall(9);
}

/* ---------------- Turnierbaum als HTML ---------------- */
function wmZeileHTML(idx, tore, istSieger, istMein){
  const kl=["pz"];
  if(istSieger) kl.push("sieger");
  if(istMein) kl.push("mein");
  return `<div class="${kl.join(" ")}">${flagHTML(idx,11)}<b>${KURZ[idx]}</b>`+
         `<span class="pt">${tore==null?"":tore}</span></div>`;
}
function wmLeerZeileHTML(){
  return `<div class="pz leer"><span class="fl-leer"></span><b>—</b><span class="pt"></span></div>`;
}

function wmBaumHTML(){
  let html="";
  for(let r=0;r<WM_RUNDEN.length;r++){
    const runde=turnier.runden[r];
    let partien="";
    for(let i=0;i<WM_RUNDEN[r].partien;i++){
      if(runde && runde.paare[i]){
        const p=runde.paare[i], res=runde.res[i];
        const meins=p.indexOf(turnier.meinIdx)>=0;
        partien+=`<div class="partie${meins?" ist-mein":""}${res?" fertig":""}">`+
          wmZeileHTML(p[0], res?res.ga:null, res&&res.sieger===p[0], p[0]===turnier.meinIdx)+
          wmZeileHTML(p[1], res?res.gb:null, res&&res.sieger===p[1], p[1]===turnier.meinIdx)+
          `</div>`;
      } else {
        partien+=`<div class="partie offen">${wmLeerZeileHTML()}${wmLeerZeileHTML()}</div>`;
      }
    }
    html+=`<div class="baum-sp"><div class="baum-tit">${WM_RUNDEN[r].name}</div>`+
          `<div class="baum-partien">${partien}</div></div>`;
  }
  const wm=wmWeltmeister();
  html+=`<div class="baum-sp sp-pokal"><div class="baum-tit">Weltmeister</div>`+
        `<div class="baum-partien"><div class="pokal-feld${wm===turnier.meinIdx?" ist-mein":""}">`+
        (wm!=null
          ? `<div class="pokal-mini">${pokalSVG(46)}</div>${flagHTML(wm,20)}<div class="pokal-land">${TEAMS[wm]}</div>`
          : `<div class="pokal-mini blass">${pokalSVG(46)}</div><div class="pokal-land blass">noch offen</div>`)+
        `</div></div></div>`;
  return html;
}
