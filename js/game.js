"use strict";
/* ====================================================================
   game.js — Spielablauf: Auswahl, Elfmeterschiessen, Entscheidung
   Ablauf pro Elfmeter: Torwart deckt verdeckt 3 Zonen, dann wählt der
   Schütze 1 Zone. Abgedeckte Zone = gehalten, sonst Tor.
   ==================================================================== */

/* ====================== Zustand ====================== */
/* mode: "2p" = zwei Spieler, "1p" = gegen Computer, "wm" = Turnier */
let mode = "2p";
let selIdxA = 0, selIdxB = 1;
let teamA, teamB;
let kicksA = [], kicksB = [];
let phase = "idle";
let keeperZones = [];
let shootIsA = true;
let sudden = false;
let lastDive = {dx:0, rot:0};
/* Schützenreihenfolge pro Team: jeder Spieler kommt einmal dran, bevor
   einer zum zweiten Mal antritt (wie in den echten Regeln). */
let schuetzeNr = {A:0, B:0};
/* Wer für ein Team zuletzt getroffen hat — für den Sieger-Screen */
let letzterTreffer = {A:null, B:null};
/* Trefferserie pro Team und Paraden in dieser Partie (für Abzeichen) */
let serie = {A:0, B:0};
let paradenPartie = 0;

/* Das Profil spielt immer als Team A — im Zweispieler-Modus ist das
   Spieler 1. Statistik und Abzeichen zählen für diese Seite. */
function meineSeite(){ return "A"; }

/* Im Turnier zu zweit: läuft gerade ein Duell Mensch gegen Mensch? */
let wm2GegenMensch = false;
/* Welcher der zwei Spieler ist gerade dran (0 oder 1) */
let wm2Akt = 0;

/* Spiele ich gegen den Computer? */
function gegenComputer(){
  if(mode==="wm2") return !wm2GegenMensch;
  return mode==="1p" || mode==="wm";
}
/* Läuft gerade eine Turnierpartie (egal welches Turnier)? */
function imTurnier(){ return mode==="wm" || mode==="wm2"; }

/* ====================== DOM ====================== */
const scr = {
  profil:$("scr-profil"), setup:$("scr-setup"), game:$("scr-game"), win:$("scr-win"),
  wm:$("scr-wm"), pokal:$("scr-pokal"), aus:$("scr-aus"), vitrine:$("scr-vitrine")
};

/* Setup: ein Flaggen-Raster, alle Länder auf einen Blick */
const gridEl=$("grid"), gridCards=[];
TEAMS.forEach((n,i)=>{
  const card=document.createElement("div");
  card.className="flag-card";
  card.innerHTML=flagHTML(i,14)+`<span>${n}<small>${stern(i).p}</small></span><span class="badge"></span>`;
  card.onclick=()=>{
    if(mode==="wm"){
      selIdxA=i;                 // im Turnier wähle ich nur mein eigenes Team
    } else if(i===selIdxA) selIdxA=null;
    else if(i===selIdxB) selIdxB=null;
    else if(selIdxA==null) selIdxA=i;
    else if(selIdxB==null) selIdxB=i;
    else selIdxB=i;
    refreshGrid();
  };
  gridEl.appendChild(card); gridCards.push(card);
});
function refreshGrid(){
  gridCards.forEach((card,i)=>{
    const istA = i===selIdxA;
    const istB = mode!=="wm" && i===selIdxB;
    card.classList.toggle("selA", istA);
    card.classList.toggle("selB", istB);
    const b=card.querySelector(".badge");
    const txt = istA ? (mode==="2p"?"1":"DU") : istB ? (mode==="1p"?"PC":"2") : "";
    b.textContent=txt;
    b.style.display = txt ? "flex" : "none";
  });
}
refreshGrid();

$("m2p").onclick=()=>setMode("2p");
$("m1p").onclick=()=>setMode("1p");
$("mwm").onclick=()=>setMode("wm");
$("mwm2").onclick=()=>setMode("wm2");
function setMode(m){
  mode=m;
  $("m2p").classList.toggle("sel", m==="2p");
  $("m1p").classList.toggle("sel", m==="1p");
  $("mwm").classList.toggle("sel", m==="wm");
  $("mwm2").classList.toggle("sel", m==="wm2");
  $("pickLbl").textContent =
    m==="wm2" ? "Zwei Teams wählen — zuerst Spieler 1, dann Spieler 2" :
    m==="wm" ? "Dein Team für die Geldmeisterschaft wählen — der Rest wird ausgelost" :
    m==="1p" ? "Länder wählen — zuerst dein Team, dann der Computer"
             : "Länder wählen — zuerst Team 1, dann Team 2";
  $("startBtn").textContent = (m==="wm"||m==="wm2") ? "TURNIER STARTEN" : "ANSTOSS";
  sp2BoxZeigen();
  wmFrageAktualisieren();
  refreshGrid();
}

/* ---- Spieler 2 im Turnier zu zweit ---- */
let sp2Profil = null;
function sp2BoxZeigen(){
  const box=$("sp2Box");
  if(mode!=="wm2"){ box.style.display="none"; return; }
  box.style.display="block";
  const andere=profile.liste.filter(p=>p.name!==profile.aktiv);
  if(!andere.length){
    $("sp2Liste").innerHTML=`<div class="sp2-hinweis">Für ein Turnier zu zweit
      braucht es ein zweites Profil. Tipp auf <b>Profil wechseln</b> und leg
      eines an — danach könnt ihr gemeinsam spielen.</div>`;
    sp2Profil=null;
    return;
  }
  if(!andere.some(p=>p.name===sp2Profil)) sp2Profil=andere[0].name;
  $("sp2Liste").innerHTML=andere.map(p=>
    `<button class="sp2-btn${p.name===sp2Profil?" sel":""}" type="button" data-name="${p.name}">${p.name}</button>`
  ).join("");
  [...$("sp2Liste").querySelectorAll(".sp2-btn")].forEach(b=>{
    b.onclick=()=>{ sp2Profil=b.getAttribute("data-name"); sp2BoxZeigen(); };
  });
}

$("startBtn").onclick=()=>{
  if(mode==="wm2"){
    if(!sp2Profil){ alert("Bitte zuerst ein zweites Profil anlegen."); return; }
    if(selIdxA==null || selIdxB==null){ alert("Bitte zwei Länder wählen."); return; }
    initAudio();
    wm2Neu(profile.aktiv, selIdxA, sp2Profil, selIdxB);
    wm2BaumZeigen("Ausgelost — ihr seid beide dabei!");
    return;
  }
  if(mode==="wm"){
    if(selIdxA==null){ alert("Bitte dein Team wählen."); return; }
    initAudio();
    wmNeu(selIdxA);
    wmBaumZeigen("Die Auslosung ist gemacht — 16 Teams, du bist dabei!");
    return;
  }
  if(selIdxA==null || selIdxB==null){
    alert("Bitte zwei Länder wählen.");
    return;
  }
  teamA = {name:TEAMS[selIdxA], idx:selIdxA};
  teamB = {name:TEAMS[selIdxB], idx:selIdxB};
  initAudio();
  startGame();
};

/* Knopf auf dem Sieger-Screen: im Turnier geht es weiter, sonst neues Spiel */
$("againBtn").onclick=()=>{
  if(mode==="wm"  && turnier  && turnier.status==="laufend"){ wmNachPartie(); }
  else if(mode==="wm2" && turnier2){ wm2NachPartie(); }
  else show("setup");
};

function show(name){
  Object.values(scr).forEach(s=>s.classList.remove("active"));
  scr[name].classList.add("active");
  const titelZeigen = (name==="setup" || name==="profil");
  document.querySelector("h1").style.display = titelZeigen ? "" : "none";
  if(name==="setup") profilKopfZeigen();
}

/* ====================================================================
   Profile: wer spielt, Vitrine, Anfänger oder Profi
   ==================================================================== */
function profilScreenZeigen(){
  $("profListe").innerHTML = profilListeHTML();
  profilKartenBinden();
  $("profName").value="";
  neuProfilModus = "anfaenger";
  profilModusKnoepfe();
  show("profil");
}

/* Karten anklickbar machen — auch nach dem Einlesen einer Sicherung.
   Der Lösch-Knopf liegt in der Karte, darum muss er das Weiterreichen
   des Tipps stoppen, sonst würde das Profil zugleich gewählt. */
function profilKartenBinden(){
  [...document.querySelectorAll(".prof-karte")].forEach(k=>{
    k.onclick=()=>{
      profilWaehlen(k.getAttribute("data-name"));
      initAudio();
      nachProfilwahl();
    };
  });
  [...document.querySelectorAll(".prof-loeschen")].forEach(b=>{
    b.onclick=(e)=>{
      e.stopPropagation();
      const name=b.getAttribute("data-name");
      if(!confirm(`Profil "${name}" wirklich löschen? Pokale und Abzeichen sind dann weg.`)) return;
      profilLoeschen(name);
      $("profListe").innerHTML=profilListeHTML();
      profilKartenBinden();
      sicherMeldung(`Profil "${name}" gelöscht.`, true);
    };
  });
}
let neuProfilModus = "anfaenger";
function profilModusKnoepfe(){
  $("profAnf").classList.toggle("sel", neuProfilModus==="anfaenger");
  $("profPro").classList.toggle("sel", neuProfilModus==="profi");
}
$("profAnf").onclick=()=>{ neuProfilModus="anfaenger"; profilModusKnoepfe(); };
$("profPro").onclick=()=>{ neuProfilModus="profi";     profilModusKnoepfe(); };
$("profAnlegenBtn").onclick=()=>{
  profilAnlegen($("profName").value, neuProfilModus);
  initAudio();
  nachProfilwahl();
};
$("profName").addEventListener("keydown",e=>{
  if(e.key==="Enter") $("profAnlegenBtn").click();
});

/* Nach der Profilwahl: offenes Turnier? Dann direkt in den WM-Modus. */
function nachProfilwahl(){
  turnier=null;
  const t=wmLaden();
  if(t) setMode("wm"); else setMode(mode);
  show("setup");
}

function profilKopfZeigen(){
  const p=aktivProfil();
  if(!p) return;
  $("profWer").innerHTML=`${p.name}<small>🏆 ${p.pokale.length} Pokale · 🏅 ${abzeichenAnzahl()} Abzeichen</small>`;
  $("modusBtn").textContent = p.modus==="profi" ? "Modus: Profi" : "Modus: Anfänger";
  $("challBox").innerHTML=challengeHTML();
}
$("modusBtn").onclick=()=>{
  const neu=modusUmschalten();
  profilKopfZeigen();
  $("modusBtn").textContent = neu==="profi" ? "Modus: Profi" : "Modus: Anfänger";
};
$("profWechselBtn").onclick=()=>profilScreenZeigen();

/* ---------------- Sicherung: Export und Import ---------------- */
function sicherMeldung(text, gut){
  const m=$("sicherMeldung");
  m.textContent=text||"";
  m.className="sicher-meldung"+(text ? (gut ? " gut" : " schlecht") : "");
}
$("sicherAufBtn").onclick=()=>{
  const box=$("sicherInhalt");
  const auf = box.style.display!=="none";
  box.style.display = auf ? "none" : "block";
  $("sicherAufBtn").textContent = auf ? "🗂 Sicherung" : "🗂 Sicherung schliessen";
  if(auf){
    $("sicherExport").style.display="none";
    $("sicherImport").style.display="none";
    sicherMeldung("");
  }
};
$("sicherZeigenBtn").onclick=()=>{
  $("sicherAus").value = sicherungText();
  $("sicherExport").style.display="block";
  $("sicherImport").style.display="none";
  sicherMeldung(`${profile.liste.length} ${profile.liste.length===1?"Profil":"Profile"} gesichert.`, true);
};
$("sicherLesenBtn").onclick=()=>{
  $("sicherImport").style.display="block";
  $("sicherExport").style.display="none";
  sicherMeldung("");
};
$("sicherKopierBtn").onclick=()=>{
  const feld=$("sicherAus");
  const text=feld.value;
  /* Erst die moderne Zwischenablage, sonst der alte Weg über die
     Textauswahl — auf älteren iPads gibt es navigator.clipboard nicht. */
  const altWeg=()=>{
    feld.focus();
    feld.setSelectionRange(0, text.length);
    let ok=false;
    try{ ok=document.execCommand("copy"); }catch(e){}
    sicherMeldung(ok ? "Kopiert — jetzt in eine Notiz oder Mail einfügen."
                     : "Kopieren hat nicht geklappt. Text von Hand auswählen und kopieren.", ok);
  };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text)
      .then(()=>sicherMeldung("Kopiert — jetzt in eine Notiz oder Mail einfügen.", true))
      .catch(altWeg);
  } else altWeg();
};
$("sicherDateiBtn").onclick=()=>{
  try{
    const blob=new Blob([sicherungText()], {type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url; a.download=sicherungDateiname();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url), 2000);
    sicherMeldung("Datei gespeichert: "+sicherungDateiname(), true);
  }catch(e){
    sicherMeldung("Das Speichern als Datei geht hier nicht — nimm den Weg über \u201eText kopieren\u201c.", false);
  }
};
$("sicherStartBtn").onclick=()=>{
  const text=$("sicherEin").value.trim();
  if(!text){ sicherMeldung("Zuerst den Sicherungs-Text einfügen.", false); return; }
  const erg=sicherungEinlesen(text);
  if(erg.fehler){ sicherMeldung(erg.fehler, false); return; }
  $("sicherEin").value="";
  sicherMeldung(`Eingelesen: ${erg.dazu.join(", ")}. Tipp auf den Namen, um zu spielen.`, true);
  $("profListe").innerHTML=profilListeHTML();
  profilKartenBinden();
};
$("sicherDatei").addEventListener("change", e=>{
  const datei=e.target.files && e.target.files[0];
  if(!datei) return;
  const leser=new FileReader();
  leser.onload=()=>{ $("sicherEin").value=String(leser.result||""); sicherMeldung("Datei gelesen — jetzt auf Einlesen tippen.", true); };
  leser.onerror=()=>sicherMeldung("Die Datei liess sich nicht lesen.", false);
  leser.readAsText(datei);
  e.target.value="";   // gleiche Datei nochmals wählbar
});
$("vitrineBtn").onclick=()=>vitrineZeigen();
$("vitZurueckBtn").onclick=()=>show("setup");

function vitrineZeigen(){
  const p=aktivProfil();
  if(!p) return;
  $("vitTitel").textContent=`Vitrine von ${p.name}`;
  $("vitUnter").textContent = p.pokale.length
    ? `${p.pokale.length} ${p.pokale.length===1?"Pokal":"Pokale"} · ${abzeichenAnzahl()} von ${ABZEICHEN.length} Abzeichen`
    : "Hier landet alles, was du gewinnst.";
  $("vitrine").innerHTML=vitrineHTML();
  show("vitrine");
}

/* ====================== Tor-SVG aufbauen ====================== */
const zonesG=$("zones");
const zoneEls=[];
(function buildScene(){
  buildCrowd(selIdxA, selIdxB);
  buildNet();
  const numForZone=z=>Object.keys(KEY2ZONE).find(k=>KEY2ZONE[k]===z);
  for(let z=0;z<9;z++){
    const r=Math.floor(z/3), c=z%3;
    const rect=document.createElementNS(SVG_NS,"rect");
    rect.setAttribute("x",GX+c*CW); rect.setAttribute("y",GY+r*CH);
    rect.setAttribute("width",CW); rect.setAttribute("height",CH);
    rect.setAttribute("class","zone");
    rect.addEventListener("click",()=>handleZone(z));
    zonesG.appendChild(rect);
    zoneEls.push(rect);
    const t=document.createElementNS(SVG_NS,"text");
    t.setAttribute("x",GX+c*CW+8); t.setAttribute("y",GY+r*CH+18);
    t.setAttribute("class","zone-num");
    t.textContent=numForZone(z);
    zonesG.appendChild(t);
  }
  $("keeper").style.pointerEvents="none";
  $("shooter").style.pointerEvents="none";
})();

/* ====================== Spielablauf ====================== */
function startGame(){
  kicksA=[]; kicksB=[]; shootIsA=true; sudden=false;
  schuetzeNr={A:0, B:0};
  letzterTreffer={A:null, B:null};
  serie={A:0, B:0};
  paradenPartie=0;
  grooveTempo(104);
  landGespielt(teamA.idx);
  $("nameA").innerHTML=flagHTML(teamA.idx,13)+`<span>${teamA.name}</span>`;
  $("nameB").innerHTML=flagHTML(teamB.idx,13)+`<span>${teamB.name}</span>`;
  buildCrowd(teamA.idx, teamB.idx);   // Ränge in den Farben der zwei Teams
  renderWmBand();
  show("game");
  renderBoard();
  nextKick();
}

function curShooter(){ return shootIsA?teamA:teamB; }
function curKeeperTeam(){ return shootIsA?teamB:teamA; }
function shooterPlayer(){
  const nr = (shootIsA ? schuetzeNr.A : schuetzeNr.B) % KADER_GROESSE;
  return kaderVoll(curShooter().idx)[nr];
}
/* Wievielter Schütze des Teams ist gerade dran (1 … 11) */
function schuetzePos(){
  return ((shootIsA ? schuetzeNr.A : schuetzeNr.B) % KADER_GROESSE) + 1;
}
function score(arr){ return arr.filter(Boolean).length; }

function nextKick(){
  clearAuto();
  clearZones();
  const ball=$("ball");
  ball.classList.remove("live"); ball.style.opacity="0";
  $("ballshadow").style.opacity="0";
  $("banner").textContent=""; $("banner").className="banner";
  $("nextBtn").classList.remove("show");
  document.querySelectorAll(".confetti").forEach(c=>c.remove());
  $("streaker").classList.remove("go");
  $("fx").innerHTML="";
  versteckeZielkreuz();
  zeitlupeAus();
  kameraZurueck();
  kraftAbbrechen();

  const keeper=$("keeper"), shooter=$("shooter");
  keeper.style.transition="none"; keeper.style.transform="";
  shooter.classList.remove("run","celebrate","joy");
  shooter.style.transition=""; shooter.style.transform="";
  $("legR").style.transform="";
  void keeper.offsetWidth;
  keeper.style.transition="";
  keeper.classList.add("sway");
  $("keeperFlagG").innerHTML=flagInner(curKeeperTeam().idx)+flagFrame();
  $("shooterFlagG").innerHTML=flagInner(curShooter().idx)+flagFrame();
  applyShooterLook(curShooter().idx, shooterPlayer());

  /* Der Ball brennt nur, wenn das Team am Ball eine Serie hat */
  ball.classList.toggle("feuer", serie[shootIsA?"A":"B"]>=3);

  keeperZones=[];
  phase="keeper";
  renderBoard();

  const keeperIsComputer = (gegenComputer() && shootIsA);
  const shooterIsComputer = (gegenComputer() && !shootIsA);

  if(keeperIsComputer){
    keeperZones = (mode==="wm") ? wmKeeperZonen()
                : (mode==="wm2") ? keeperZonenFuerRunde(turnier2.runde, wm2Spieler(wm2Akt).schuss)
                : pick3();
    phase="shooter";
    whistle();
    const wieViele = keeperZones.length;
    const matchball = istMatchball();
    setStatus(curShooter().idx, `${shooterPlayer().p} — ${schuetzePos()}. Schütze`,
      (matchball ? "Matchball! " : "") + (imTurnier()
        ? `Der Torwart deckt ${wieViele} Zonen ab. Wähle deine Zone (1–9).`
        : "Der Computer-Torwart steht. Wähle deine Zone (1–9)."), false);
    zeigeZielkreuz(anspannung());
  } else {
    setStatus(curKeeperTeam().idx, `${curKeeperTeam().name} — Torwart`,
      shooterIsComputer
        ? "Wähle verdeckt 3 Zonen (Tasten 1–9). Danach schiesst der Computer."
        : "Schütze wegschauen! Wähle verdeckt 3 Zonen (Tasten 1–9).",
      true);
  }
}

function pick3(){
  const all=[0,1,2,3,4,5,6,7,8], out=[];
  while(out.length<3){
    out.push(all.splice(zufall(all.length),1)[0]);
  }
  return out;
}

function setStatus(flagIdx,who,what,secretVisible){
  $("stWho").innerHTML=(flagIdx!=null?flagHTML(flagIdx,13):"")+`<span>${who}</span>`;
  $("stWhat").textContent=what;
  const s=$("secret");
  s.style.display = secretVisible ? "inline-flex" : "none";
  if(secretVisible) updateSecret();
}
function updateSecret(){
  [...$("secret").children].forEach((el,i)=>{
    el.textContent = i<keeperZones.length ? "✱" : "";
  });
}

/* ----- Eingabe ----- */
document.addEventListener("keydown",e=>{
  /* Im Profi-Modus stoppt jede Taste den Kraftbalken */
  if(phase==="timing" && kraftLaeuft()){ kraftStop(); e.preventDefault(); return; }
  if(phase==="result" && (e.key==="Enter" || e.key===" ")){ $("nextBtn").click(); return; }
  const d=parseInt(e.key,10);
  if(!Number.isInteger(d) || !(d in KEY2ZONE)) return;
  handleZone(KEY2ZONE[d]);
});
/* Auf dem Tablet: Tipp irgendwo auf die Szene stoppt den Balken */
document.querySelector(".pitch").addEventListener("pointerdown",()=>{
  if(phase==="timing" && kraftLaeuft()) kraftStop();
});

function handleZone(z){
  if(phase==="keeper"){
    if(keeperZones.includes(z)) return;
    keeperZones.push(z);
    segTone(keeperZones.length-1);
    updateSecret();
    if(keeperZones.length===3){
      phase="shooter";
      whistle();
      const shooterIsComputer=(gegenComputer() && !shootIsA);
      if(shooterIsComputer){
        setStatus(curShooter().idx, `${shooterPlayer().p} — ${schuetzePos()}. Schütze`,"Der Computer läuft an …",false);
        const ziel = (mode==="wm") ? wmSchussZone()
                   : (mode==="wm2") ? schussZoneFuerRunde(turnier2.runde, wm2Spieler(wm2Akt).deck)
                   : zufall(9);
        const tim = computerTiming();
        setTimeout(()=>resolveShot(ziel, tim), 600);
      } else {
        setStatus(curShooter().idx, `${shooterPlayer().p} — ${schuetzePos()}. Schütze`,
          istMatchball() ? "Matchball — wähle deine Zone (1–9)!" : "Wähle deine Zone (1–9).", false);
        zeigeZielkreuz(anspannung());
      }
    }
  } else if(phase==="shooter"){
    schussStarten(z);
  }
}

/* Im Anfänger-Modus geht der Schuss direkt los. Im Profi-Modus kommt
   zuerst der Kraftbalken — der Mensch stoppt ihn selber, der Computer
   bekommt seinen Wert ausgewürfelt (siehe computerTiming). */
function schussStarten(z){
  if(!timingAn()){ resolveShot(z, null); return; }
  phase="timing";
  versteckeZielkreuz();
  const sp=shooterPlayer();
  setStatus(curShooter().idx, `${sp.p} ${sterne(sp.koennen)}`,
    sp.koennen>=5 ? "Kraftbalken stoppen — er trifft fast immer!"
    : sp.koennen<=2 ? "Kraftbalken stoppen — schwieriger Schütze, kleines grünes Feld!"
    : "Kraftbalken stoppen — grün ist perfekt!", false);
  /* Schwächere Schützen haben ein kleineres grünes Feld und einen
     schnelleren Balken (siehe KRAFT_STUFEN in effekte.js) */
  kraftStarten(art=>{
    phase="anim";
    resolveShot(z, art);
  }, sp.koennen);
}

/* Der Computer zielt im Profi-Modus auch nicht perfekt. Im Turnier wird
   er von Runde zu Runde sicherer. */
function computerTiming(){
  if(!timingAn()) return null;
  let danebenP=0.16, perfektP=0.26;
  if(mode==="wm" && turnier){
    danebenP = [0.20, 0.16, 0.12, 0.09][turnier.runde] || 0.14;
    perfektP = [0.20, 0.26, 0.32, 0.38][turnier.runde] || 0.26;
  }
  /* Auch beim Computer zählt, wer schiesst: ein Ersatzspieler verzieht
     öfter als der beste Schütze des Landes. */
  const k = shooterPlayer().koennen || 4;
  danebenP += (4-k)*0.035;
  perfektP += (k-4)*0.045;
  danebenP = Math.max(0.04, Math.min(0.34, danebenP));
  perfektP = Math.max(0.06, Math.min(0.46, perfektP));
  const w=Math.random();
  if(w < danebenP) return "rot";
  if(w < danebenP + perfektP) return "gruen";
  return "gelb";
}

/* ----- Matchball und Anspannung -----
   Matchball: dieser Schuss kann die Partie entscheiden — egal ob Tor
   oder Fehlschuss. Dann läuft der Ball in Zeitlupe.
   Anspannung: ab Halbfinal oder bei Matchball wackelt das Zielkreuz. */
function wuerdeEntscheiden(treffer){
  const a0=kicksA.slice(), b0=kicksB.slice();
  (shootIsA?a0:b0).push(treffer);
  const a=a0.filter(Boolean).length, b=b0.filter(Boolean).length;
  const na=a0.length, nb=b0.length;
  if(na<=5 && nb<=5){
    return a > b+(5-nb) || b > a+(5-na);
  }
  if(na===nb && na>5) return a!==b;
  return false;
}
function istMatchball(){
  return wuerdeEntscheiden(true) || wuerdeEntscheiden(false);
}
function anspannung(){
  const spaeteRunde = (mode==="wm"  && turnier  && turnier.runde>=2) ||
                      (mode==="wm2" && turnier2 && turnier2.runde>=2);
  return spaeteRunde || istMatchball();
}

/* ----- Auswertung + Animation -----
   timing: null im Anfänger-Modus, sonst "rot" (daneben), "gelb"
   (normal) oder "gruen" (perfekt — ein gedeckter Ball rutscht dem
   Torwart dann manchmal durch). */
function resolveShot(z, timing){
  phase="anim";
  $("secret").style.display="none";
  versteckeZielkreuz();
  setStatus(curShooter().idx, shooterPlayer().p, "Anlauf …", false);

  /* Beim Matchball läuft alles knapp doppelt so langsam */
  const matchball = istMatchball();
  const zeit = matchball ? 1.9 : 1;
  const schuetze = shooterPlayer();

  const daneben = (timing==="rot");
  const covered = keeperZones.includes(z);
  /* Ein perfekter Schuss ist so hart, dass der Torwart ihn manchmal
     nicht festhalten kann */
  const durchgerutscht = covered && !daneben && timing==="gruen" && Math.random()<0.35;
  const goal = !daneben && (!covered || durchgerutscht);
  const ziel = daneben ? danebenZiel(z) : zoneCenterSVG(z);

  /* Im Turnier merkt sich der Computer meine Gewohnheiten */
  if(mode==="wm" && turnier){
    if(shootIsA) turnier.schuss[z]++;
    else keeperZones.forEach(k=>turnier.deck[k]++);
  } else if(mode==="wm2" && turnier2 && !wm2GegenMensch){
    const sp=wm2Spieler(wm2Akt);
    if(shootIsA) sp.schuss[z]++;
    else keeperZones.forEach(k=>sp.deck[k]++);
  }

  const ball=$("ball");
  const spot=s2p(SPOT);
  ball.style.left=spot.x+"px"; ball.style.top=spot.y+"px";
  ball.style.transform="translate(-50%,-50%) scale(1)";
  ball.style.opacity="1"; ball.classList.add("live");

  const shooter=$("shooter");
  shooter.classList.add("run");

  setTimeout(()=>{
    // Schussmoment
    shooter.classList.remove("run");
    shooter.style.transform="translate(0px,2px) rotate(-8deg)";
    kickSound();
    const legR=$("legR");
    legR.style.transform="rotate(-62deg)";
    setTimeout(()=>{ legR.style.transform="rotate(-16deg)"; },130);
    // Ball kurz stauchen, dann Flug
    ball.style.transform="translate(-50%,-50%) scale(1.22,0.78)";
    if(matchball) zeitlupeAn();
    kameraSchwenk(z, Math.round(520*zeit), false);
    diveKeeper(z, covered, zeit);

    setTimeout(()=>{
      const flug = daneben
        ? {dur:Math.round(520*zeit), endScale:0.42, arc:88, groundEnd:200}
        : {dur:Math.round(460*zeit), endScale:0.58, arc:65, groundEnd:255};
      flyBall(ziel, flug, ()=>{
        phase="result";
        zeitlupeAus();
        keeperZones.forEach(k=>zoneEls[k].classList.add("kept"));
        const banner=$("banner");
        banner.classList.remove("pop"); void banner.offsetWidth;
        let hinweis="";
        if(daneben){
          /* Verrissen: der Ball geht neben oder über das Tor */
          banner.textContent="DANEBEN!";
          banner.className="banner vorbei pop";
          groan();
          $("ball").classList.remove("live");
          $("ball").style.opacity="0";
          shooter.style.transition="transform .6s ease-out";
          shooter.style.transform="translate(0px,5px) rotate(-9deg)";
          hinweis="Den hat er verrissen — vorbei!";
        } else if(goal){
          zoneEls[z].classList.add("hit");
          banner.textContent="TOOOR!";
          banner.className="banner goal pop";
          netRipple(); pitchShake();
          kameraSchwenk(z, 260, true);   // kurz näher ran
          cheer();
          shooter.style.transform="translate(0px,2px)";
          shooter.classList.add("celebrate","joy");
          spawnConfetti(document.querySelector(".pitch"));
          if(durchgerutscht){
            hinweis="Perfekt geschossen — der Torwart kann ihn nicht halten!";
          }
        } else {
          zoneEls[z].classList.add("shot-stop");
          banner.textContent="GEHALTEN!";
          banner.className="banner stop pop";
          groan();
          dropBall(zoneCenterSVG(z));
          // Schütze lässt den Kopf hängen
          shooter.style.transition="transform .6s ease-out";
          shooter.style.transform="translate(0px,5px) rotate(7deg)";
          // Torwart springt nach der Parade wieder auf
          setTimeout(()=>{
            const keeper=$("keeper");
            keeper.style.transition="transform .32s cubic-bezier(.3,1.4,.5,1)";
            keeper.style.transform=`translate(${lastDive.dx}px,0px) rotate(0deg)`;
          }, 750);
        }

        (shootIsA?kicksA:kicksB).push(goal);
        const seite = shootIsA ? "A" : "B";
        if(goal) letzterTreffer[seite]=schuetze;
        schuetzeNr[seite]++;              // nächster Schütze ist dran
        serieBuchen(seite, goal);
        statistikBuchen(seite, goal, daneben);
        renderBoard(true);

        const result = checkDecided();
        if(result){
          setTimeout(()=>showWinner(result), 1500);
        } else {
          shootIsA = !shootIsA;
          $("nextBtn").classList.add("show");
          setStatus(null,"",hinweis,false);
          const flitzer = Math.random()<0.14;
          if(flitzer) setTimeout(runStreaker, 550);
          scheduleAuto(flitzer ? 3900 : 2400);
        }
      });
    }, 45);
  }, 540);
}

/* ----- Trefferserie -----
   Ab drei Toren hintereinander brennt der Ball und die Trommeln
   treiben an. Ein Fehlschuss setzt die Serie zurück. */
function serieBuchen(seite, goal){
  if(goal){
    serie[seite]++;
    if(seite===meineSeite()){
      statBesteSerie(serie[seite]);
      if(serie[seite]>=3) abzeichenGeben("hattrick");
      if(serie[seite]>=5) abzeichenGeben("unaufhaltsam");
      challengePruefen("serie", serie[seite]);
    }
    if(serie[seite]>=2) serieTon(serie[seite]-2);
  } else {
    serie[seite]=0;
  }
  /* Tempo aus der höchsten noch laufenden Serie — ein Fehlschuss des
     Gegners darf meine Serie nicht ausbremsen */
  const hoechste=Math.max(serie.A, serie.B);
  grooveTempo(hoechste>=3 ? 104 + (hoechste-2)*10 : 104);
  $("ball").classList.toggle("feuer", serie[seite]>=3 && goal);
}

/* ----- Statistik und Abzeichen ----- */
function statistikBuchen(seite, goal, daneben){
  if(seite===meineSeite()){
    statPlus("schuesse");
    if(goal) statPlus("tore");
  } else if(!goal && !daneben){
    /* Echte Parade — ein Schuss neben das Tor zählt nicht als meine Leistung */
    statPlus("paraden");
    paradenPartie++;
    if(paradenPartie>=3) abzeichenGeben("katze");
    challengePruefen("paraden", paradenPartie);
  }
  profileSpeichern();
}

/* Torwart-Hechtsprung mit Landung und Staub.
   zeit > 1 verlangsamt den Sprung passend zur Zeitlupe. */
function diveKeeper(z, covered, zeit){
  const f = zeit || 1;
  const keeper=$("keeper");
  keeper.classList.remove("sway");
  if(f!==1) keeper.style.transitionDuration=(0.42*f).toFixed(2)+"s";
  let targetZone = covered ? z : zufallAus(keeperZones);
  const c=zoneCenterSVG(targetZone);
  const dx=c.x-KEEPER_REF.x, dy=c.y-KEEPER_REF.y;
  let rot=0;
  if(Math.abs(dx)>35){
    rot=Math.sign(dx)*(Math.abs(dy)>40 ? 80 : 88);
  }
  lastDive={dx, rot};

  keeper.style.transform=`translate(${dx}px,${dy}px) rotate(${rot}deg)`;

  setTimeout(()=>{
    keeper.style.transition=`transform ${(0.3*f).toFixed(2)}s cubic-bezier(.55,0,.8,.55)`;
    if(rot!==0){
      keeper.style.transform=`translate(${(dx*1.04).toFixed(1)}px,36px) rotate(${Math.sign(rot)*92}deg)`;
    } else {
      keeper.style.transform=`translate(${dx}px,0px)`;
    }
    setTimeout(()=>{
      keeper.style.transition="";
      spawnDust(KEEPER_REF.x+dx*1.04);
    }, 310*f);
  }, 440*f);
}

/* ----- Weiter-Knopf mit Rücklauf ----- */
let autoTimer=null, autoTick=null;
function scheduleAuto(delayMs){
  clearAuto();
  let remain=Math.ceil(delayMs/1000);
  const btn=$("nextBtn");
  btn.textContent=`Weiter (${remain}) ⏎`;
  autoTick=setInterval(()=>{
    remain--;
    if(remain>0) btn.textContent=`Weiter (${remain}) ⏎`;
  },1000);
  autoTimer=setTimeout(()=>{
    clearAuto();
    if(phase==="result") nextKick();
  },delayMs);
}
function clearAuto(){
  if(autoTimer){clearTimeout(autoTimer);autoTimer=null;}
  if(autoTick){clearInterval(autoTick);autoTick=null;}
  $("nextBtn").textContent="Weiter ⏎";
}
$("nextBtn").onclick=()=>{ if(phase==="result"){ clearAuto(); nextKick(); } };

/* ----- Entscheidung ----- */
function checkDecided(){
  const a=score(kicksA), b=score(kicksB);
  const na=kicksA.length, nb=kicksB.length;

  if(na<=5 && nb<=5){
    const remA=5-na, remB=5-nb;
    if(a > b+remB) return "A";
    if(b > a+remA) return "B";
    if(na===5 && nb===5 && a===b) sudden=true;
    return null;
  }
  if(na===nb && na>5){
    if(a>b) return "A";
    if(b>a) return "B";
  }
  return null;
}

function showWinner(side){
  phase="over";
  grooveTempo(104);

  /* Abzeichen und Tages-Aufgabe für die gewonnene Partie */
  if(side===meineSeite()){
    if(sudden) abzeichenGeben("nervenstark");
    const ohneFehler = kicksA.length>=3 && score(kicksA)===kicksA.length;
    if(ohneFehler){
      abzeichenGeben("makellos");
      challengePruefen("makellos");
    }
    challengePruefen("schlage", teamB.idx);
  }
  profileSpeichern();

  /* Turnier zu zweit: Resultat eintragen, dann geht es im Baum weiter */
  if(mode==="wm2" && turnier2 && turnier2.status==="laufend"){
    wm2ResultatBuchen(side);
    $("againBtn").textContent="Weiter im Turnier →";
    const t = side==="A"?teamA:teamB;
    const pl2 = letzterTreffer[side] || stern(t.idx);
    $("winFlag").innerHTML=flagHTML(t.idx,56);
    $("winName").textContent=`${t.name} gewinnt!`;
    $("winScore").textContent=`${teamA.name} ${score(kicksA)} : ${score(kicksB)} ${teamB.name}`+(sudden?" — nach Sudden Death":"");
    $("winPlayer").textContent=pl2.p;
    drawWinFig(t.idx, pl2);
    const siu2=$("siuText");
    siu2.style.display="none";
    show("win");
    setTimeout(()=>{
      siu2.style.display="block";
      siu2.style.animation="none"; void siu2.offsetWidth; siu2.style.animation="";
      siuSound();
    }, 350);
    spawnConfetti($("winnerBox"));
    return;
  }

  /* Im Turnier: Resultat eintragen, danach Turnierbaum oder Trost-Screen */
  if(mode==="wm" && turnier && turnier.status==="laufend"){
    wmMeinResultatEintragen(score(kicksA), score(kicksB));
    if(side!=="A"){ wmAusgeschieden(); return; }
    $("againBtn").textContent = turnier.runde >= WM_RUNDEN.length-1
      ? "Pokalübergabe ansehen 🏆"
      : "Weiter im Turnier →";
  } else {
    $("againBtn").textContent="Neues Spiel";
  }

  const t = side==="A"?teamA:teamB;
  const pl = letzterTreffer[side] || stern(t.idx);
  $("winFlag").innerHTML=flagHTML(t.idx,56);
  $("winName").textContent=`${t.name} gewinnt!`;
  $("winScore").textContent=`${teamA.name} ${score(kicksA)} : ${score(kicksB)} ${teamB.name}` + (sudden?" — nach Sudden Death":"");
  $("winPlayer").textContent=pl.p;
  drawWinFig(t.idx, pl);
  const siu=$("siuText");
  siu.style.display="none";
  show("win");
  setTimeout(()=>{
    siu.style.display="block";
    siu.style.animation="none"; void siu.offsetWidth; siu.style.animation="";
    siuSound();
  }, 350);
  spawnConfetti($("winnerBox"));
}

/* ----- Anzeige ----- */
function clearZones(){
  zoneEls.forEach(el=>el.classList.remove("kept","hit","shot-stop"));
}
function renderBoard(pop){
  $("scoreA").textContent=score(kicksA);
  $("scoreB").textContent=score(kicksB);
  if(pop){
    const sc=document.querySelector(".board .score");
    sc.classList.remove("pop"); void sc.offsetWidth; sc.classList.add("pop");
  }
  renderTicks($("ticksA"), kicksA, shootIsA && phase!=="over");
  renderTicks($("ticksB"), kicksB, !shootIsA && phase!=="over");
  renderSerie();
}

/* Serienanzeige: erst ab zwei Treffern, ab drei mit Feuer */
function renderSerie(){
  const el=$("serieAnz");
  const s=Math.max(serie.A, serie.B);
  if(s<2 || phase==="over"){ el.style.display="none"; return; }
  const wer = serie.A>=serie.B ? teamA : teamB;
  const heiss = s>=3;
  el.style.display="flex";
  el.classList.toggle("heiss", heiss);
  el.innerHTML=`${heiss?"🔥":"⚡"} ${s}er-Serie <small>${wer.name}</small>`;
}
function renderTicks(el, arr, active){
  const total=Math.max(5, arr.length + (active && arr.length>=5 ? 1 : 0));
  let html="";
  for(let i=0;i<total;i++){
    if(i<arr.length){
      html+=`<div class="tick ${arr[i]?"goal":"fail"}">${arr[i]?"✓":"✗"}</div>`;
    } else {
      const now = active && i===arr.length;
      html+=`<div class="tick ${now?"now":""}"></div>`;
    }
  }
  el.innerHTML=html;
}

/* ====================================================================
   Weltmeisterschaft — Ablauf über die Bildschirme
   ==================================================================== */

/* Band über dem Scoreboard: welche Runde läuft gerade */
function renderWmBand(){
  const band=$("wmBand");
  if(mode==="wm2" && turnier2){
    const cfg=WM_RUNDEN[turnier2.runde];
    band.style.display="flex";
    band.innerHTML=`<span class="runde">${cfg.name}</span><span class="info">`+
      (wm2GegenMensch
        ? `Duell: ${wm2Name(0)} gegen ${wm2Name(1)}!`
        : `${wm2Name(wm2Akt)} spielt · ${cfg.tw}`)+`</span>`;
    return;
  }
  if(mode!=="wm" || !turnier){ band.style.display="none"; return; }
  const cfg=WM_RUNDEN[turnier.runde];
  band.style.display="flex";
  band.innerHTML=`<span class="runde">${cfg.name}</span><span class="info">${cfg.tw}</span>`;
}

/* Frage im Setup: gespeichertes Turnier weiterspielen? */
function wmFrageAktualisieren(){
  const box=$("wmFrage");

  if(mode==="wm2"){
    const t2=wm2Laden();
    if(!t2){ box.style.display="none"; return; }
    const stand = t2.status==="fertig" ? "beendet" : WM_RUNDEN[t2.runde].name;
    $("wmFrageTxt").innerHTML =
      `Turnier zu zweit offen: ${flagHTML(t2.spieler[0].idx,15)}<b>${t2.spieler[0].profil}</b>`+
      ` gegen ${flagHTML(t2.spieler[1].idx,15)}<b>${t2.spieler[1].profil}</b> — <b>${stand}</b>.`;
    box.style.display="block";
    return;
  }

  const t=(mode==="wm") ? wmLaden() : null;
  if(!t){ box.style.display="none"; return; }
  let stand;
  if(t.status==="titel") stand="Geldmeister — Pokalübergabe";
  else if(t.status==="aus") stand="beendet im "+wmRundenName(t.ausRunde);
  else stand=wmRundenName(t.runde);
  $("wmFrageTxt").innerHTML =
    `Du hast noch ein Turnier offen: ${flagHTML(t.meinIdx,15)}<b>${TEAMS[t.meinIdx]}</b> — <b>${stand}</b>.`;
  box.style.display="block";
}

$("wmWeiterBtn").onclick=()=>{
  if(mode==="wm2"){
    const t2=wm2Laden();
    if(!t2){ wmFrageAktualisieren(); return; }
    turnier2=t2;
    initAudio();
    wm2BaumZeigen("Willkommen zurück — es geht weiter!");
    return;
  }
  const t=wmLaden();
  if(!t){ wmFrageAktualisieren(); return; }
  turnier=t;
  mode="wm";
  selIdxA=t.meinIdx;
  initAudio();
  if(turnier.status==="titel"){ pokalZeigen(); return; }
  if(turnier.status==="aus"){ ausZeigen(); return; }
  wmBaumZeigen("Willkommen zurück — es geht weiter!");
};
$("wmNeuStartBtn").onclick=()=>{
  if(mode==="wm2"){
    wm2Loeschen();
    turnier2=null;
    $("wmFrage").style.display="none";
    $("pickLbl").textContent="Zwei Teams wählen — zuerst Spieler 1, dann Spieler 2";
    return;
  }
  wmLoeschen();
  turnier=null;
  $("wmFrage").style.display="none";
  $("pickLbl").textContent="Dein Team für die Geldmeisterschaft wählen — der Rest wird ausgelost";
};

/* ---------------- Turnierbaum-Ansicht ---------------- */
function wmBaumZeigen(hinweis){
  $("baum").innerHTML=wmBaumHTML();
  const btn=$("wmSpielBtn");

  if(turnier.status==="laufend"){
    const g=wmGegner();
    $("wmTitel").textContent=wmRundenName(turnier.runde);
    $("wmUnter").innerHTML=(hinweis?hinweis+"<br>":"")+
      `Deine Partie: <b>${TEAMS[turnier.meinIdx]}</b> gegen <b>${TEAMS[g]}</b>`;
    btn.textContent=`ANSTOSS: ${KURZ[turnier.meinIdx]} — ${KURZ[g]}`;
    btn.style.display="block";
    btn.onclick=()=>wmPartieStarten();
  } else if(turnier.status==="titel"){
    $("wmTitel").textContent="Geldmeister!";
    $("wmUnter").innerHTML=`<b>${TEAMS[turnier.meinIdx]}</b> hat die Geldmeisterschaft gewonnen.`;
    btn.textContent="Pokalübergabe ansehen 🏆";
    btn.style.display="block";
    btn.onclick=()=>pokalZeigen();
  } else {
    $("wmTitel").textContent="Turnier beendet";
    $("wmUnter").innerHTML=`Du bist im <b>${wmRundenName(turnier.ausRunde)}</b> ausgeschieden.`;
    btn.style.display="none";
  }
  show("wm");
}

$("wmNeuBtn").onclick=()=>{
  if(mode==="wm2" && turnier2){
    const s=turnier2.spieler;
    wm2Neu(s[0].profil, s[0].idx, s[1].profil, s[1].idx);
    wm2BaumZeigen("Neu ausgelost — viel Glück, ihr zwei!");
    return;
  }
  const meins = turnier ? turnier.meinIdx : selIdxA;
  wmNeu(meins);
  wmBaumZeigen("Neu ausgelost — viel Glück!");
};
$("wmMenuBtn").onclick=()=>{
  if(mode==="wm2" && turnier2 && turnier2.chef) profilWaehlen(turnier2.chef);
  setMode(mode);
  show("setup");
};

/* ---------------- Meine Partie starten ---------------- */
function wmPartieStarten(){
  const g=wmGegner();
  teamA={name:TEAMS[turnier.meinIdx], idx:turnier.meinIdx};
  teamB={name:TEAMS[g], idx:g};
  initAudio();
  startGame();
}

/* ---------------- Nach meiner gewonnenen Partie ---------------- */
function wmNachPartie(){
  wmAndereSimulieren();          // die übrigen Partien der Runde
  wmSpeichern();
  if(turnier.runde < WM_RUNDEN.length-1){
    wmNaechsteRunde();
    const g=wmGegner();
    wmBaumZeigen(`Weiter! Im ${wmRundenName(turnier.runde)} wartet ${TEAMS[g]}.`);
  } else {
    turnier.status="titel";
    /* Pokal in die Vitrine — einmal pro Turnier */
    if(!turnier.pokalGezaehlt){
      turnier.pokalGezaehlt=true;
      const weg=wmMeinWeg();
      const finalGegner = weg.length ? weg[weg.length-1].gegner : null;
      pokalEintragen(turnier.meinIdx, finalGegner);
      challengePruefen("titel");
    }
    wmSpeichern();
    pokalZeigen();
  }
}

/* ---------------- Ausgeschieden ---------------- */
function wmAusgeschieden(){
  turnier.status="aus";
  turnier.ausRunde=turnier.runde;
  wmAndereSimulieren();
  wmRestSimulieren();            // damit man sieht, wer Weltmeister wird
  wmSpeichern();
  ausZeigen();
}

/* Meine Partien als Liste */
function wegHTML(){
  return wmMeinWeg().map(w=>
    `<div class="zeile ${w.gewonnen?"gewonnen":"verloren"}">`+
    `<span class="rd">${wmRundenName(w.runde)}</span>`+
    `${flagHTML(w.gegner,12)}<span>${TEAMS[w.gegner]}</span>`+
    `<span class="erg">${w.meine}:${w.seine}</span></div>`
  ).join("");
}

function ausZeigen(){
  const r=turnier.ausRunde;
  const trostText=[
    "Du warst unter den besten 16 der Welt — nicht schlecht!",
    "Viertelfinal! Unter den besten 8 von der ganzen Welt.",
    "Halbfinal! Nur drei Teams waren besser als du.",
    "Vizeweltmeister! Ganz knapp am Titel vorbei — riesig!"
  ][r] || "Gut gespielt!";

  $("ausTitel").textContent = r===3 ? "So knapp!" : "Schade — aber gut gespielt!";
  $("ausFlag").innerHTML=flagHTML(turnier.meinIdx,56);
  $("ausName").textContent=TEAMS[turnier.meinIdx];
  $("ausTxt").textContent=trostText;
  $("ausWeg").innerHTML=wegHTML();

  const wm=wmWeltmeister();
  $("ausWM").innerHTML = wm!=null
    ? `Geldmeister: ${flagHTML(wm,18)}<b>${TEAMS[wm]}</b>`
    : "";
  show("aus");
  groan();
}
$("ausBaumBtn").onclick=()=>wmBaumZeigen();
$("ausNeuBtn").onclick=()=>{ wmNeu(turnier.meinIdx); wmBaumZeigen("Neu ausgelost — noch einmal!"); };
$("ausMenuBtn").onclick=()=>{ setMode("wm"); show("setup"); };

/* ---------------- Pokalübergabe ---------------- */
function pokalZeigen(){
  const idx=turnier.meinIdx;
  $("pokalFlag").innerHTML=flagHTML(idx,56);
  $("pokalName").textContent=TEAMS[idx];
  $("pokalPlayer").textContent=stern(idx).p+" hebt den Pokal";
  $("pokalWeg").innerHTML=`<div class="trost-weg">${wegHTML()}</div>`;
  drawPokalSzene(idx);
  show("pokal");

  /* Konfettiregen in Wellen, dazu Fanfare und Jubel */
  const buehne=$("pokalBuehne");
  spawnConfetti(buehne, 110);
  fanfare();
  let welle=0;
  const regen=setInterval(()=>{
    welle++;
    if(welle>4 || !scr.pokal.classList.contains("active")){ clearInterval(regen); return; }
    spawnConfetti(buehne, 70);
    if(welle===2) cheer();
  }, 1400);
  setTimeout(()=>{ if(scr.pokal.classList.contains("active")) siuSound(); }, 1700);
}
$("pokalNeuBtn").onclick=()=>{
  if(mode==="wm2" && turnier2){ $("wmNeuBtn").click(); return; }
  wmNeu(turnier.meinIdx);
  wmBaumZeigen("Titelverteidigung — neu ausgelost!");
};
$("pokalMenuBtn").onclick=()=>{
  if(mode==="wm2" && turnier2 && turnier2.chef) profilWaehlen(turnier2.chef);
  setMode(mode);
  show("setup");
};

/* ====================================================================
   Weltmeisterschaft zu zweit — Ablauf über die Bildschirme
   ==================================================================== */
let wm2Partie = null;      // {pi, duell, spieler:[...]}

function wm2BaumZeigen(hinweis){
  /* Im Baum ist wieder der Menü-Besitzer aktiv, damit Vitrine und
     Kopfzeile die richtige Person zeigen */
  if(turnier2.chef) profilWaehlen(turnier2.chef);

  $("baum").innerHTML=wm2BaumHTML();
  const btn=$("wmSpielBtn");
  const naechste=wm2NaechstePartie();
  const s=turnier2.spieler;

  $("wmTitel").textContent = turnier2.status==="fertig"
    ? "Turnier beendet"
    : WM_RUNDEN[turnier2.runde].name;

  if(naechste){
    let txt;
    if(naechste.duell){
      txt = `<b class="duellwarn">Duell!</b> ${s[0].profil} (${TEAMS[s[0].idx]}) gegen `+
            `${s[1].profil} (${TEAMS[s[1].idx]}) — einer fliegt raus.`;
      btn.textContent=`DUELL: ${KURZ[s[0].idx]} — ${KURZ[s[1].idx]}`;
    } else {
      const nr=naechste.spieler[0], g=wm2Gegner(nr);
      txt = `<b>${s[nr].profil}</b> ist dran: ${TEAMS[s[nr].idx]} gegen ${TEAMS[g]}`;
      btn.textContent=`ANSTOSS ${s[nr].profil}: ${KURZ[s[nr].idx]} — ${KURZ[g]}`;
    }
    $("wmUnter").innerHTML=(hinweis?hinweis+"<br>":"")+txt;
    btn.style.display="block";
    btn.onclick=()=>wm2PartieStarten(naechste);
  } else if(turnier2.status==="fertig"){
    const wm=wm2Weltmeister();
    const mensch = turnier2.titel!=null;
    $("wmUnter").innerHTML =
      (mensch ? `<b>${wm2Name(turnier2.titel)}</b> ist Geldmeister mit ${TEAMS[wm]}!`
              : `Geldmeister: <b>${TEAMS[wm]}</b> — kein Mensch im Final.`)+
      `<br>${wm2StandText()}`;
    btn.textContent = mensch ? "Pokalübergabe ansehen 🏆" : "Neues Turnier";
    btn.style.display="block";
    btn.onclick = mensch ? (()=>wm2PokalZeigen(turnier2.titel)) : (()=>$("wmNeuBtn").click());
  } else {
    /* Runde durch, aber keiner der zwei mehr dabei */
    $("wmUnter").innerHTML=`Beide ausgeschieden — der Computer spielt zu Ende.<br>${wm2StandText()}`;
    btn.textContent="Weiter";
    btn.style.display="block";
    btn.onclick=()=>{ wm2RestSimulieren(); wm2BaumZeigen(); };
  }
  show("wm");
}

/* Kurzer Text, wie weit die zwei gekommen sind */
function wm2StandText(){
  return [0,1].map(nr=>{
    const r=turnier2.ausRunde[nr];
    const wieWeit = (r==null)
      ? (turnier2.titel===nr ? "Geldmeister 🏆" : "noch dabei")
      : "aus im "+WM_RUNDEN[r].name;
    return `${wm2Name(nr)}: ${wieWeit}`;
  }).join(" · ");
}

/* Partie starten — das Profil des Spielers wird aktiv, damit Statistik
   und Abzeichen bei der richtigen Person landen */
function wm2PartieStarten(naechste){
  wm2Partie=naechste;
  wm2GegenMensch=!!naechste.duell;
  const s=turnier2.spieler;
  if(naechste.duell){
    wm2Akt=0;
    profilWaehlen(s[0].profil);
    teamA={name:TEAMS[s[0].idx], idx:s[0].idx};
    teamB={name:TEAMS[s[1].idx], idx:s[1].idx};
  } else {
    const nr=naechste.spieler[0];
    wm2Akt=nr;
    profilWaehlen(s[nr].profil);
    const g=wm2Gegner(nr);
    teamA={name:TEAMS[s[nr].idx], idx:s[nr].idx};
    teamB={name:TEAMS[g], idx:g};
  }
  initAudio();
  startGame();
}

/* Resultat der gespielten Partie in den Baum schreiben */
function wm2ResultatBuchen(side){
  if(!wm2Partie) return;
  const pi=wm2Partie.pi;
  const paar=wm2Runde().paare[pi];
  const toreA=score(kicksA), toreB=score(kicksB);
  const ga = paar[0]===teamA.idx ? toreA : toreB;
  const gb = paar[0]===teamA.idx ? toreB : toreA;
  const siegerIdx = (side==="A") ? teamA.idx : teamB.idx;
  wm2ResultatEintragen(pi, siegerIdx, ga, gb);
}

/* Nach einer Partie: nächste Menschen-Partie, sonst Runde abschliessen */
function wm2NachPartie(){
  wm2GegenMensch=false;
  const offen=wm2NaechstePartie();
  if(offen){
    wm2BaumZeigen(`Weiter — jetzt ist ${wm2Name(offen.spieler[0])} dran.`);
    return;
  }
  wm2AndereSimulieren();
  const weiter=wm2NaechsteRunde();
  if(!weiter){
    /* Final ist gespielt */
    if(turnier2.titel!=null) wm2TitelBuchen(turnier2.titel);
    wm2BaumZeigen();
    return;
  }
  if(wm2BeideAus()){
    wm2RestSimulieren();
    if(turnier2.titel!=null) wm2TitelBuchen(turnier2.titel);
    wm2BaumZeigen();
    return;
  }
  wm2BaumZeigen(`${WM_RUNDEN[turnier2.runde].name}! ${wm2StandText()}`);
}

/* Pokal und Abzeichen dem richtigen Profil gutschreiben */
function wm2TitelBuchen(nr){
  if(turnier2.pokalGezaehlt) return;
  turnier2.pokalGezaehlt=true;
  const vorher=profile.aktiv;
  profilWaehlen(wm2Name(nr));
  const weg=wm2Weg(nr);
  pokalEintragen(wm2Spieler(nr).idx, weg.length ? weg[weg.length-1].gegner : null);
  challengePruefen("titel");
  profilWaehlen(vorher || turnier2.chef);
  wm2Speichern();
}

/* Pokalübergabe für den Sieger des Turniers zu zweit */
function wm2PokalZeigen(nr){
  const idx=wm2Spieler(nr).idx;
  $("pokalFlag").innerHTML=flagHTML(idx,56);
  $("pokalName").textContent=TEAMS[idx];
  $("pokalPlayer").textContent=`${wm2Name(nr)} ist Geldmeister!`;
  $("pokalWeg").innerHTML=`<div class="trost-weg">`+
    wm2Weg(nr).map(w=>
      `<div class="zeile ${w.gewonnen?"gewonnen":"verloren"}">`+
      `<span class="rd">${wmRundenName(w.runde)}</span>`+
      `${flagHTML(w.gegner,12)}<span>${TEAMS[w.gegner]}</span>`+
      `<span class="erg">${w.meine}:${w.seine}</span></div>`).join("")+
    `</div>`;
  drawPokalSzene(idx);
  show("pokal");

  const buehne=$("pokalBuehne");
  spawnConfetti(buehne, 110);
  fanfare();
  let welle=0;
  const regen=setInterval(()=>{
    welle++;
    if(welle>4 || !scr.pokal.classList.contains("active")){ clearInterval(regen); return; }
    spawnConfetti(buehne, 70);
    if(welle===2) cheer();
  }, 1400);
  setTimeout(()=>{ if(scr.pokal.classList.contains("active")) siuSound(); }, 1700);
}

/* ---------------- Beim Laden ----------------
   Ohne Profil zuerst die Frage "Wer spielt?", sonst gleich ins Menü —
   und wenn dieses Profil ein Turnier offen hat, in den WM-Modus. */
(function beimStart(){
  if(!aktivProfil()){
    profilScreenZeigen();
    return;
  }
  if(wmLaden()) setMode("wm");
  else if(wm2Laden()) setMode("wm2");
  else setMode("2p");
  show("setup");
})();
