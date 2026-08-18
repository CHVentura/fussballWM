"use strict";
/* ====================================================================
   turnier2.js — Weltmeisterschaft für zwei Spieler am gleichen Gerät
   Beide wählen ein Team, beide sind im gleichen Turnierbaum. Jeder
   spielt seine Partien selber; treffen die zwei aufeinander, wird es
   ein Duell am Gerät. Alle übrigen Partien simuliert der Computer.
   Nutzt WM_RUNDEN, simSchiessen, mischen und paareAus aus turnier.js.
   ==================================================================== */

let turnier2 = null;

/* ---------------- Speichern und Laden ----------------
   Ein Zwei-Spieler-Turnier gehört keinem einzelnen Profil, darum liegt
   es neben der Profilliste. */
function wm2Laden(){
  const t = profile.turnier2;
  if(!t || t.version!==1 || !Array.isArray(t.spieler) || t.spieler.length!==2) return null;
  if(!Array.isArray(t.runden) || !t.runden.length) return null;
  return t;
}
function wm2Speichern(){
  if(!turnier2) return;
  profile.turnier2 = turnier2;
  profileSpeichern();
}
function wm2Loeschen(){
  profile.turnier2 = null;
  profileSpeichern();
}

/* ---------------- Neues Turnier ---------------- */
function wm2Neu(profil1, team1, profil2, team2){
  const andere = TEAMS.map((_,i)=>i).filter(i=>i!==team1 && i!==team2);
  mischen(andere);
  const feld = mischen([team1, team2].concat(andere.slice(0,14)));
  turnier2 = {
    version: 1,
    spieler: [
      {profil:profil1, idx:team1, schuss:new Array(9).fill(0), deck:new Array(9).fill(0)},
      {profil:profil2, idx:team2, schuss:new Array(9).fill(0), deck:new Array(9).fill(0)}
    ],
    chef: profile.aktiv,          // wer war im Menü aktiv
    runde: 0,
    runden: [{paare: paareAus(feld), res: []}],
    status: "laufend",            // laufend | fertig
    ausRunde: [null, null],
    titel: null                   // 0 oder 1, wenn ein Mensch gewinnt
  };
  wm2Speichern();
  return turnier2;
}

/* ---------------- Zugriffshelfer ---------------- */
function wm2Runde(){ return turnier2.runden[turnier2.runde]; }
function wm2Spieler(nr){ return turnier2.spieler[nr]; }
function wm2Name(nr){ return wm2Spieler(nr).profil; }

/* Ist das Team dieses Spielers in der aktuellen Runde noch dabei? */
function wm2NochDabei(nr){
  const idx = wm2Spieler(nr).idx;
  return wm2Runde().paare.some(p=>p.indexOf(idx)>=0);
}
/* Paarung dieses Spielers in der aktuellen Runde (-1 = ausgeschieden) */
function wm2PaarVon(nr){
  const idx = wm2Spieler(nr).idx;
  return wm2Runde().paare.findIndex(p=>p.indexOf(idx)>=0);
}
function wm2Gegner(nr){
  const pi = wm2PaarVon(nr);
  if(pi<0) return null;
  const p = wm2Runde().paare[pi], idx = wm2Spieler(nr).idx;
  return p[0]===idx ? p[1] : p[0];
}

/* Was ist als Nächstes zu spielen?
   null = keine Menschen-Partie offen (Runde kann abgeschlossen werden) */
function wm2NaechstePartie(){
  if(turnier2.status!=="laufend") return null;
  const r = wm2Runde();
  const offen = [];
  [0,1].forEach(nr=>{
    const pi = wm2PaarVon(nr);
    if(pi>=0 && !r.res[pi]) offen.push({nr:nr, pi:pi});
  });
  if(!offen.length) return null;
  /* Beide in derselben Paarung: Duell am Gerät */
  if(offen.length===2 && offen[0].pi===offen[1].pi){
    return {duell:true, pi:offen[0].pi, spieler:[0,1]};
  }
  return {duell:false, pi:offen[0].pi, spieler:[offen[0].nr]};
}

/* Resultat einer Menschen-Partie eintragen.
   toreVon/toreGegen beziehen sich auf Spieler nr (bzw. beim Duell auf
   Spieler 0). */
function wm2ResultatEintragen(pi, siegerIdx, toreHeim, toreGast){
  const r = wm2Runde(), p = r.paare[pi];
  /* toreHeim/-Gast in der Reihenfolge der Paarung */
  r.res[pi] = {ga:toreHeim, gb:toreGast, sieger:siegerIdx, sudden:false};
  wm2Speichern();
}

/* Übrige Partien der Runde simulieren */
function wm2AndereSimulieren(){
  const r = wm2Runde();
  r.paare.forEach((p,i)=>{
    if(r.res[i]) return;
    const s = simSchiessen(p[0], p[1]);
    r.res[i] = {ga:s.ga, gb:s.gb, sieger:s.sieger, sudden:s.sudden};
  });
}

/* Nächste Runde aus den Siegern bauen; merkt sich, wer ausgeschieden ist */
function wm2NaechsteRunde(){
  const r = wm2Runde();
  [0,1].forEach(nr=>{
    if(turnier2.ausRunde[nr]!=null) return;
    const idx = wm2Spieler(nr).idx;
    const pi = r.paare.findIndex(p=>p.indexOf(idx)>=0);
    if(pi>=0 && r.res[pi] && r.res[pi].sieger!==idx){
      turnier2.ausRunde[nr] = turnier2.runde;
    }
  });
  if(turnier2.runde >= WM_RUNDEN.length-1){
    /* Final gespielt — Turnier zu Ende */
    const sieger = r.res[0] ? r.res[0].sieger : null;
    turnier2.titel = [0,1].filter(nr=>wm2Spieler(nr).idx===sieger)[0];
    if(turnier2.titel===undefined) turnier2.titel=null;
    turnier2.status = "fertig";
    wm2Speichern();
    return false;
  }
  turnier2.runden.push({paare: paareAus(r.res.map(x=>x.sieger)), res: []});
  turnier2.runde++;
  wm2Speichern();
  return true;
}

/* Sind beide Menschen draussen? Dann läuft der Rest von selbst. */
function wm2BeideAus(){
  return !wm2NochDabei(0) && !wm2NochDabei(1);
}
function wm2RestSimulieren(){
  let sicherung = 0;
  while(turnier2.status==="laufend" && sicherung < 6){
    wm2AndereSimulieren();
    if(!wm2NaechsteRunde()) break;
    sicherung++;
  }
  wm2Speichern();
}
function wm2Weltmeister(){
  const letzte = turnier2.runden[WM_RUNDEN.length-1];
  if(!letzte || !letzte.res[0]) return null;
  return letzte.res[0].sieger;
}

/* Der Weg eines Spielers */
function wm2Weg(nr){
  const idx = wm2Spieler(nr).idx, weg = [];
  turnier2.runden.forEach((r,ri)=>{
    const i = r.paare.findIndex(p=>p.indexOf(idx)>=0);
    if(i<0 || !r.res[i]) return;
    const p = r.paare[i], res = r.res[i];
    const gegner = p[0]===idx ? p[1] : p[0];
    const meine  = p[0]===idx ? res.ga : res.gb;
    const seine  = p[0]===idx ? res.gb : res.ga;
    weg.push({runde:ri, gegner:gegner, meine:meine, seine:seine, gewonnen:res.sieger===idx});
  });
  return weg;
}

/* ---------------- Turnierbaum mit zwei Wegen ---------------- */
function wm2ZeileHTML(idx, tore, istSieger){
  const kl = ["pz"];
  if(istSieger) kl.push("sieger");
  if(idx===wm2Spieler(0).idx) kl.push("mein");
  if(idx===wm2Spieler(1).idx) kl.push("mein2");
  return `<div class="${kl.join(" ")}">${flagHTML(idx,11)}<b>${KURZ[idx]}</b>`+
         `<span class="pt">${tore==null?"":tore}</span></div>`;
}

function wm2BaumHTML(){
  const i0 = wm2Spieler(0).idx, i1 = wm2Spieler(1).idx;
  let html = "";
  for(let r=0;r<WM_RUNDEN.length;r++){
    const runde = turnier2.runden[r];
    let partien = "";
    for(let i=0;i<WM_RUNDEN[r].partien;i++){
      if(runde && runde.paare[i]){
        const p = runde.paare[i], res = runde.res[i];
        const hat0 = p.indexOf(i0)>=0, hat1 = p.indexOf(i1)>=0;
        const klasse = (hat0 && hat1) ? " ist-duell" : hat0 ? " ist-mein" : hat1 ? " ist-mein2" : "";
        partien += `<div class="partie${klasse}${res?" fertig":""}">`+
          wm2ZeileHTML(p[0], res?res.ga:null, res&&res.sieger===p[0])+
          wm2ZeileHTML(p[1], res?res.gb:null, res&&res.sieger===p[1])+
          `</div>`;
      } else {
        partien += `<div class="partie offen">${wmLeerZeileHTML()}${wmLeerZeileHTML()}</div>`;
      }
    }
    html += `<div class="baum-sp"><div class="baum-tit">${WM_RUNDEN[r].name}</div>`+
            `<div class="baum-partien">${partien}</div></div>`;
  }
  const wm = wm2Weltmeister();
  const mensch = wm!=null && (wm===i0 || wm===i1);
  html += `<div class="baum-sp sp-pokal"><div class="baum-tit">Geldmeister</div>`+
          `<div class="baum-partien"><div class="pokal-feld${mensch?" ist-mein":""}">`+
          (wm!=null
            ? `<div class="pokal-mini">${pokalSVG(46)}</div>${flagHTML(wm,20)}<div class="pokal-land">${TEAMS[wm]}</div>`
            : `<div class="pokal-mini blass">${pokalSVG(46)}</div><div class="pokal-land blass">noch offen</div>`)+
          `</div></div></div>`;
  return html;
}
