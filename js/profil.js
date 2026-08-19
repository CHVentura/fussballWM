"use strict";
/* ====================================================================
   profil.js — Spielerprofile, Pokalvitrine und Abzeichen
   Jedes Kind hat sein eigenes Profil: eigene Statistik, eigene Pokale,
   eigene Abzeichen und ein eigenes gespeichertes Turnier. Alles liegt
   in einem localStorage-Eintrag.
   ==================================================================== */

const PROFIL_KEY = "elfmeter-profile-v1";
const ALT_TURNIER_KEY = "elfmeter-wm-turnier-v1";   // Fassung vor den Profilen

/* Abzeichen: werden entdeckt, nicht gekauft. Reihenfolge = Anzeige in
   der Vitrine. "geheim" heisst: Bedingung wird erst nach dem Gewinn
   verraten, damit es eine Überraschung bleibt. */
const ABZEICHEN = [
  {id:"titel",         e:"🏆", name:"Geldmeister",   txt:"Ein Turnier gewonnen"},
  {id:"hattrick",      e:"🎩", name:"Hattrick",      txt:"3 Tore hintereinander"},
  {id:"unaufhaltsam",  e:"🔥", name:"Unaufhaltsam",  txt:"5 Tore hintereinander"},
  {id:"katze",         e:"🧤", name:"Katze",         txt:"3 Paraden in einer Partie"},
  {id:"nervenstark",   e:"💀", name:"Nervenstark",   txt:"Im Sudden Death gewonnen"},
  {id:"makellos",      e:"✨", name:"Makellos",      txt:"Eine Partie ohne Fehlschuss gewonnen"},
  {id:"weltenbummler", e:"🌍", name:"Weltenbummler", txt:"Mit 5 verschiedenen Ländern gespielt"},
  {id:"legende",       e:"👑", name:"Legende",       txt:"Titel mit einem Aussenseiter"},
  {id:"sammler",       e:"🏅", name:"Sammler",       txt:"3 Titel in der Vitrine"},
  {id:"tagesheld",     e:"⭐", name:"Tages-Held",    txt:"Eine Tages-Aufgabe erfüllt"}
];
function abzeichenInfo(id){
  for(let i=0;i<ABZEICHEN.length;i++) if(ABZEICHEN[i].id===id) return ABZEICHEN[i];
  return null;
}

/* Alle Profile. aktiv = Name des gewählten Profils. */
let profile = {aktiv:null, liste:[]};

function neuesProfilObjekt(name, modus){
  return {
    name: name,
    modus: (modus==="profi" ? "profi" : "anfaenger"),
    stats: {schuesse:0, tore:0, paraden:0, titel:0, turniere:0, serieBest:0, laender:[]},
    abzeichen: {},          // id -> Zeitpunkt
    pokale: [],             // {team, gegner, datum}
    turnier: null,
    challenge: null
  };
}

function profileLaden(){
  try{
    const raw = localStorage.getItem(PROFIL_KEY);
    if(raw){
      const p = JSON.parse(raw);
      if(p && Array.isArray(p.liste)){
        profile = p;
        /* Fehlende Felder ergänzen, falls ein älterer Stand geladen wird */
        profile.liste.forEach(pr=>{
          const leer = neuesProfilObjekt(pr.name, pr.modus);
          pr.stats = Object.assign(leer.stats, pr.stats||{});
          if(!pr.stats.laender) pr.stats.laender=[];
          if(!pr.abzeichen) pr.abzeichen={};
          if(!pr.pokale) pr.pokale=[];
        });
        return;
      }
    }
  }catch(e){}

  /* Erster Start: gibt es ein Turnier aus der Fassung ohne Profile?
     Dann übernehmen, damit niemand seinen Turnierstand verliert. */
  profile = {aktiv:null, liste:[]};
  try{
    const alt = localStorage.getItem(ALT_TURNIER_KEY);
    if(alt){
      const t = JSON.parse(alt);
      if(t && typeof t.meinIdx === "number"){
        const pr = neuesProfilObjekt("Spieler 1", "anfaenger");
        pr.turnier = t;
        profile.liste.push(pr);
        profile.aktiv = pr.name;
        profileSpeichern();
      }
    }
  }catch(e){}
}

function profileSpeichern(){
  try{ localStorage.setItem(PROFIL_KEY, JSON.stringify(profile)); }catch(e){}
}

function aktivProfil(){
  if(!profile.aktiv) return null;
  for(let i=0;i<profile.liste.length;i++){
    if(profile.liste[i].name===profile.aktiv) return profile.liste[i];
  }
  return null;
}

function profilAnlegen(name, modus){
  name = String(name||"").trim().slice(0,14) || "Spieler";
  /* Namen eindeutig halten */
  let endgueltig = name, n = 2;
  while(profile.liste.some(p=>p.name===endgueltig)){ endgueltig = name+" "+n; n++; }
  const pr = neuesProfilObjekt(endgueltig, modus);
  profile.liste.push(pr);
  profile.aktiv = endgueltig;
  profileSpeichern();
  return pr;
}

function profilWaehlen(name){
  profile.aktiv = name;
  profileSpeichern();
  return aktivProfil();
}

function profilLoeschen(name){
  profile.liste = profile.liste.filter(p=>p.name!==name);
  if(profile.aktiv===name) profile.aktiv = profile.liste.length ? profile.liste[0].name : null;
  profileSpeichern();
}

/* Spielt gerade jemand im Profi-Modus (mit Schusstiming)? */
function timingAn(){
  const p = aktivProfil();
  return !!p && p.modus === "profi";
}
function modusUmschalten(){
  const p = aktivProfil();
  if(!p) return;
  p.modus = (p.modus==="profi") ? "anfaenger" : "profi";
  profileSpeichern();
  return p.modus;
}

/* ---------------- Statistik ---------------- */
function statPlus(feld, wieviel){
  const p = aktivProfil();
  if(!p) return;
  p.stats[feld] = (p.stats[feld]||0) + (wieviel==null ? 1 : wieviel);
}
function statBesteSerie(serie){
  const p = aktivProfil();
  if(p && serie > (p.stats.serieBest||0)) p.stats.serieBest = serie;
}
function landGespielt(idx){
  const p = aktivProfil();
  if(!p) return;
  if(p.stats.laender.indexOf(idx) < 0){
    p.stats.laender.push(idx);
    if(p.stats.laender.length >= 5) abzeichenGeben("weltenbummler");
  }
}
function trefferQuote(){
  const p = aktivProfil();
  if(!p || !p.stats.schuesse) return 0;
  return Math.round(100 * p.stats.tore / p.stats.schuesse);
}

/* ---------------- Abzeichen ---------------- */
/* Gibt true zurück, wenn das Abzeichen neu ist */
function abzeichenGeben(id){
  const p = aktivProfil();
  if(!p || p.abzeichen[id]) return false;
  p.abzeichen[id] = Date.now();
  profileSpeichern();
  abzeichenMelden(id);
  return true;
}
function abzeichenAnzahl(){
  const p = aktivProfil();
  return p ? Object.keys(p.abzeichen).length : 0;
}

/* Kurze Einblendung, wenn ein Abzeichen freigeschaltet wird */
let abzeichenWarteschlange = [], abzeichenLaeuft = false;
function abzeichenMelden(id){
  abzeichenWarteschlange.push(id);
  if(!abzeichenLaeuft) abzeichenNaechste();
}
function abzeichenNaechste(){
  const id = abzeichenWarteschlange.shift();
  if(!id){ abzeichenLaeuft = false; return; }
  abzeichenLaeuft = true;
  const info = abzeichenInfo(id);
  const box = $("abzeichenToast");
  if(!info || !box){ abzeichenLaeuft=false; return; }
  box.innerHTML = `<span class="az-emoji">${info.e}</span>`+
                  `<span class="az-text"><b>${info.name}</b><small>${info.txt}</small></span>`;
  box.classList.add("show");
  jingel();
  setTimeout(()=>{
    box.classList.remove("show");
    setTimeout(abzeichenNaechste, 350);
  }, 2600);
}

/* ---------------- Pokal in die Vitrine ---------------- */
function pokalEintragen(teamIdx, gegnerIdx){
  const p = aktivProfil();
  if(!p) return;
  p.pokale.push({team:teamIdx, gegner:gegnerIdx, datum:Date.now()});
  p.stats.titel = p.pokale.length;
  abzeichenGeben("titel");
  if(p.pokale.length >= 3) abzeichenGeben("sammler");
  if(STAERKE[teamIdx] < 0.75) abzeichenGeben("legende");
  profileSpeichern();
}

/* ====================================================================
   Tages-Aufgabe — eine pro Tag und Profil
   Sie wird aus Datum und Profilname berechnet, ist also nach einem
   Neuladen dieselbe und für jedes Kind eine andere.
   ==================================================================== */
const CHALLENGES = [
  {art:"schlage",  txt:p=>`Schlage ${TEAMS[p]} in einer Partie`},
  {art:"serie",    txt:p=>`Triff ${p}-mal hintereinander`},
  {art:"paraden",  txt:p=>`Halte ${p} Elfmeter in einer Partie`},
  {art:"makellos", txt:()=>`Gewinne eine Partie ohne Fehlschuss`},
  {art:"titel",    txt:()=>`Gewinne ein ganzes Turnier`}
];
/* Starke Gegner für die Aufgabe "Schlage …" */
const CHALLENGE_GEGNER = [1, 3, 5, 6, 7, 8, 16, 17];

function heuteStr(){
  const d=new Date();
  return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);
}
function textZahl(s){
  let n=0;
  for(let i=0;i<s.length;i++) n=(n*31 + s.charCodeAt(i)) % 100000;
  return n;
}

/* Aufgabe von heute holen, bei Bedarf neu erzeugen */
function challengeHeute(){
  const p=aktivProfil();
  if(!p) return null;
  const heute=heuteStr();
  if(p.challenge && p.challenge.datum===heute) return p.challenge;

  const n=textZahl(heute+"|"+p.name);
  const vorlage=CHALLENGES[n % CHALLENGES.length];
  let param=null;
  if(vorlage.art==="schlage")  param=CHALLENGE_GEGNER[(n>>3) % CHALLENGE_GEGNER.length];
  if(vorlage.art==="serie")    param=3 + ((n>>5) % 2);      // 3 oder 4
  if(vorlage.art==="paraden")  param=2 + ((n>>7) % 2);      // 2 oder 3
  p.challenge={datum:heute, art:vorlage.art, param:param, erfuellt:false};
  profileSpeichern();
  return p.challenge;
}

function challengeText(c){
  if(!c) return "";
  for(let i=0;i<CHALLENGES.length;i++){
    if(CHALLENGES[i].art===c.art) return CHALLENGES[i].txt(c.param);
  }
  return "";
}

/* Prüfen, ob ein Ereignis die Aufgabe erfüllt */
function challengePruefen(art, wert){
  const c=challengeHeute();
  if(!c || c.erfuellt || c.art!==art) return false;
  if(c.param!=null){
    const passt = (art==="schlage") ? (wert===c.param) : (wert>=c.param);
    if(!passt) return false;
  }
  c.erfuellt=true;
  statPlus("challenges");
  profileSpeichern();
  abzeichenGeben("tagesheld");
  challengeMelden();
  return true;
}
function challengeMelden(){
  const box=$("abzeichenToast");
  if(!box) return;
  /* Nach der Abzeichen-Einblendung eine eigene Meldung */
  setTimeout(()=>{
    box.innerHTML=`<span class="az-emoji">⭐</span>`+
      `<span class="az-text"><b>Tages-Aufgabe erfüllt!</b><small>Morgen gibt es eine neue.</small></span>`;
    box.classList.add("show");
    jingel();
    setTimeout(()=>box.classList.remove("show"), 2600);
  }, 3200);
}

/* Banner im Menü */
function challengeHTML(){
  const c=challengeHeute();
  if(!c) return "";
  return `<div class="chall${c.erfuellt?" fertig":""}">`+
    `<span class="chall-icon">${c.erfuellt?"✅":"⭐"}</span>`+
    `<span class="chall-txt"><b>Aufgabe von heute</b>`+
    `<small>${challengeText(c)}${c.erfuellt?" — erledigt!":""}</small></span></div>`;
}

/* ---------------- Vitrine als HTML ---------------- */
function vitrineHTML(){
  const p = aktivProfil();
  if(!p) return "";
  const s = p.stats;

  let pokale;
  if(p.pokale.length){
    pokale = p.pokale.map(k=>
      `<div class="vit-pokal">${pokalSVG(58)}${flagHTML(k.team,18)}`+
      `<div class="vit-land">${TEAMS[k.team]}</div>`+
      `<div class="vit-datum">${datumKurz(k.datum)}</div></div>`
    ).join("");
  } else {
    pokale = `<div class="vit-leer">Noch kein Pokal. Gewinne ein Turnier —
              dann steht er hier.</div>`;
  }

  const zeichen = ABZEICHEN.map(a=>{
    const hat = !!p.abzeichen[a.id];
    return `<div class="vit-az${hat?" hat":""}">`+
           `<span class="az-emoji">${a.e}</span>`+
           `<span class="az-text"><b>${a.name}</b><small>${a.txt}</small></span></div>`;
  }).join("");

  return `
    <div class="vit-block">
      <div class="vit-tit">Pokale (${p.pokale.length})</div>
      <div class="vit-pokale">${pokale}</div>
    </div>
    <div class="vit-block">
      <div class="vit-tit">Abzeichen (${abzeichenAnzahl()} von ${ABZEICHEN.length})</div>
      <div class="vit-azliste">${zeichen}</div>
    </div>
    <div class="vit-block">
      <div class="vit-tit">Statistik</div>
      <div class="vit-stats">
        <div><b>${s.tore}</b><small>Tore</small></div>
        <div><b>${trefferQuote()}%</b><small>Trefferquote</small></div>
        <div><b>${s.paraden}</b><small>Paraden</small></div>
        <div><b>${s.serieBest}</b><small>beste Serie</small></div>
        <div><b>${s.turniere}</b><small>Turniere</small></div>
        <div><b>${s.laender.length}</b><small>Länder</small></div>
        <div><b>${s.challenges||0}</b><small>Aufgaben</small></div>
      </div>
    </div>`;
}

function datumKurz(ms){
  try{
    const d = new Date(ms);
    return ("0"+d.getDate()).slice(-2)+"."+("0"+(d.getMonth()+1)).slice(-2)+"."+d.getFullYear();
  }catch(e){ return ""; }
}

/* ====================================================================
   Sicherung: Profile als Text exportieren und wieder einlesen
   Alles liegt nur im Browser. Wer die Website-Daten löscht, verliert
   Pokale und Abzeichen — darum gibt es eine Sicherung zum Mitnehmen.
   ==================================================================== */
const SICHERUNG_MARKE = "elfmeterschiessen-profile";
const SICHERUNG_FASSUNG = 1;

/* Alle Profile als lesbarer Text (JSON) */
function sicherungText(){
  return JSON.stringify({
    marke: SICHERUNG_MARKE,
    fassung: SICHERUNG_FASSUNG,
    erstellt: Date.now(),
    aktiv: profile.aktiv,
    liste: profile.liste
  }, null, 1);
}

/* Dateiname mit Datum, damit mehrere Sicherungen unterscheidbar sind */
function sicherungDateiname(){
  const d = new Date();
  const zz = n => ("0"+n).slice(-2);
  return `elfmeter-profile-${d.getFullYear()}-${zz(d.getMonth()+1)}-${zz(d.getDate())}.json`;
}

/* Ein Profil aus der Sicherung säubern: nur bekannte Felder übernehmen,
   damit fremder oder beschädigter Inhalt nichts kaputt macht. */
function profilSaeubern(rohr){
  if(!rohr || typeof rohr !== "object") return null;
  const name = String(rohr.name||"").trim().slice(0,14);
  if(!name) return null;
  const sauber = neuesProfilObjekt(name, rohr.modus);

  if(rohr.stats && typeof rohr.stats === "object"){
    Object.keys(sauber.stats).forEach(k=>{
      const w = rohr.stats[k];
      if(k === "laender"){
        sauber.stats.laender = Array.isArray(w)
          ? w.filter(x=>typeof x==="number" && x>=0 && x<TEAMS.length)
          : [];
      } else if(typeof w === "number" && isFinite(w) && w>=0){
        sauber.stats[k] = Math.floor(w);
      }
    });
    if(typeof rohr.stats.challenges === "number" && rohr.stats.challenges>=0){
      sauber.stats.challenges = Math.floor(rohr.stats.challenges);
    }
  }
  if(rohr.abzeichen && typeof rohr.abzeichen === "object"){
    ABZEICHEN.forEach(a=>{
      if(rohr.abzeichen[a.id]) sauber.abzeichen[a.id] = rohr.abzeichen[a.id];
    });
  }
  if(Array.isArray(rohr.pokale)){
    sauber.pokale = rohr.pokale
      .filter(k=>k && typeof k.team === "number" && k.team>=0 && k.team<TEAMS.length)
      .map(k=>({team:k.team, gegner:(typeof k.gegner==="number"?k.gegner:null), datum:k.datum||Date.now()}));
  }
  /* Turnier und Tages-Aufgabe unverändert übernehmen, wenn sie plausibel
     aussehen — sonst weglassen, das kostet nur die laufende Partie. */
  const t = rohr.turnier;
  if(t && typeof t.meinIdx === "number" && Array.isArray(t.runden) && t.runden.length){
    sauber.turnier = t;
  }
  if(rohr.challenge && typeof rohr.challenge === "object") sauber.challenge = rohr.challenge;
  return sauber;
}

/* Sicherung einlesen. Bestehende Profile bleiben immer erhalten: bei
   gleichem Namen wird "Name (2)" angelegt. Rückgabe: Meldung für den
   Nutzer, oder {fehler:"..."} wenn der Text nicht passt. */
function sicherungEinlesen(text){
  let daten;
  try{ daten = JSON.parse(text); }
  catch(e){ return {fehler:"Das ist keine gültige Sicherung — der Text lässt sich nicht lesen."}; }

  if(!daten || typeof daten !== "object" || !Array.isArray(daten.liste)){
    return {fehler:"Das ist keine Sicherung von diesem Spiel."};
  }
  if(daten.marke && daten.marke !== SICHERUNG_MARKE){
    return {fehler:"Diese Sicherung gehört zu einem anderen Spiel."};
  }

  const dazu = [];
  daten.liste.forEach(rohr=>{
    const sauber = profilSaeubern(rohr);
    if(!sauber) return;
    /* Namen eindeutig halten, damit nichts überschrieben wird */
    let endgueltig = sauber.name, n = 2;
    while(profile.liste.some(p=>p.name===endgueltig)){
      endgueltig = sauber.name.slice(0,11) + " (" + n + ")";
      n++;
    }
    sauber.name = endgueltig;
    profile.liste.push(sauber);
    dazu.push(endgueltig);
  });

  if(!dazu.length) return {fehler:"In der Sicherung ist kein Profil zum Einlesen."};
  if(!profile.aktiv) profile.aktiv = dazu[0];
  profileSpeichern();
  return {dazu: dazu};
}

/* Profil-Liste zur Auswahl */
function profilListeHTML(){
  if(!profile.liste.length){
    return `<div class="vit-leer">Noch kein Profil — leg gleich eines an.</div>`;
  }
  return profile.liste.map(p=>{
    const az = Object.keys(p.abzeichen||{}).length;
    const offen = p.turnier && p.turnier.status==="laufend";
    return `<button class="prof-karte${p.name===profile.aktiv?" aktiv":""}" type="button" data-name="${p.name}">
      <span class="prof-name">${p.name}</span>
      <span class="prof-zeile">🏆 ${p.pokale.length} · 🏅 ${az} · ${p.modus==="profi"?"Profi":"Anfänger"}</span>
      ${offen ? `<span class="prof-offen">Turnier läuft: ${TEAMS[p.turnier.meinIdx]}</span>` : ``}
      <span class="prof-loeschen" role="button" title="Profil löschen" data-name="${p.name}">🗑</span>
    </button>`;
  }).join("");
}

profileLaden();
