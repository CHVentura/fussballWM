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

/* Spiele ich gegen den Computer? (Einzelspieler und Turnier) */
function gegenComputer(){ return mode==="1p" || mode==="wm"; }

/* ====================== DOM ====================== */
const scr = {
  setup:$("scr-setup"), game:$("scr-game"), win:$("scr-win"),
  wm:$("scr-wm"), pokal:$("scr-pokal"), aus:$("scr-aus")
};

/* Setup: ein Flaggen-Raster, alle Länder auf einen Blick */
const gridEl=$("grid"), gridCards=[];
TEAMS.forEach((n,i)=>{
  const card=document.createElement("div");
  card.className="flag-card";
  card.innerHTML=flagHTML(i,14)+`<span>${n}<small>${PLAYERS[i].p}</small></span><span class="badge"></span>`;
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
function setMode(m){
  mode=m;
  $("m2p").classList.toggle("sel", m==="2p");
  $("m1p").classList.toggle("sel", m==="1p");
  $("mwm").classList.toggle("sel", m==="wm");
  $("pickLbl").textContent =
    m==="wm" ? "Dein Team für die WM wählen — der Rest wird ausgelost" :
    m==="1p" ? "Länder wählen — zuerst dein Team, dann der Computer"
             : "Länder wählen — zuerst Team 1, dann Team 2";
  $("startBtn").textContent = m==="wm" ? "TURNIER STARTEN" : "ANSTOSS";
  wmFrageAktualisieren();
  refreshGrid();
}

$("startBtn").onclick=()=>{
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
  if(mode==="wm" && turnier && turnier.status==="laufend"){ wmNachPartie(); }
  else show("setup");
};

function show(name){
  Object.values(scr).forEach(s=>s.classList.remove("active"));
  scr[name].classList.add("active");
  document.querySelector("h1").style.display = name==="setup" ? "" : "none";
}

/* ====================== Tor-SVG aufbauen ====================== */
const zonesG=$("zones");
const zoneEls=[];
(function buildScene(){
  buildCrowd();
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
  $("nameA").innerHTML=flagHTML(teamA.idx,13)+`<span>${teamA.name}</span>`;
  $("nameB").innerHTML=flagHTML(teamB.idx,13)+`<span>${teamB.name}</span>`;
  renderWmBand();
  show("game");
  renderBoard();
  nextKick();
}

function curShooter(){ return shootIsA?teamA:teamB; }
function curKeeperTeam(){ return shootIsA?teamB:teamA; }
function shooterPlayer(){ return PLAYERS[curShooter().idx]; }
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
  applyShooterLook(curShooter().idx);

  keeperZones=[];
  phase="keeper";
  renderBoard();

  const keeperIsComputer = (gegenComputer() && shootIsA);
  const shooterIsComputer = (gegenComputer() && !shootIsA);

  if(keeperIsComputer){
    keeperZones = (mode==="wm") ? wmKeeperZonen() : pick3();
    phase="shooter";
    whistle();
    const wieViele = keeperZones.length;
    setStatus(curShooter().idx, `${shooterPlayer().p} — Schütze`,
      mode==="wm"
        ? `Der Torwart deckt ${wieViele} Zonen ab. Wähle deine Zone (1–9).`
        : "Der Computer-Torwart steht. Wähle deine Zone (1–9).", false);
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
  if(phase==="result" && (e.key==="Enter" || e.key===" ")){ $("nextBtn").click(); return; }
  const d=parseInt(e.key,10);
  if(!Number.isInteger(d) || !(d in KEY2ZONE)) return;
  handleZone(KEY2ZONE[d]);
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
        setStatus(curShooter().idx, `${shooterPlayer().p} — Schütze`,"Der Computer läuft an …",false);
        const ziel = (mode==="wm") ? wmSchussZone() : zufall(9);
        setTimeout(()=>resolveShot(ziel), 600);
      } else {
        setStatus(curShooter().idx, `${shooterPlayer().p} — Schütze`,"Wähle deine Zone (1–9).",false);
      }
    }
  } else if(phase==="shooter"){
    resolveShot(z);
  }
}

/* ----- Auswertung + Animation ----- */
function resolveShot(z){
  phase="anim";
  $("secret").style.display="none";
  setStatus(curShooter().idx, shooterPlayer().p, "Anlauf …", false);

  const covered = keeperZones.includes(z);
  const goal = !covered;

  /* Im Turnier merkt sich der Computer meine Gewohnheiten */
  if(mode==="wm" && turnier){
    if(shootIsA) turnier.schuss[z]++;
    else keeperZones.forEach(k=>turnier.deck[k]++);
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
    diveKeeper(z, covered);

    setTimeout(()=>{
      flyBall(zoneCenterSVG(z), {dur:460, endScale:0.58, arc:65, groundEnd:255}, ()=>{
        phase="result";
        keeperZones.forEach(k=>zoneEls[k].classList.add("kept"));
        const banner=$("banner");
        banner.classList.remove("pop"); void banner.offsetWidth;
        if(goal){
          zoneEls[z].classList.add("hit");
          banner.textContent="TOOOR!";
          banner.className="banner goal pop";
          netRipple(); pitchShake();
          cheer();
          shooter.style.transform="translate(0px,2px)";
          shooter.classList.add("celebrate","joy");
          spawnConfetti(document.querySelector(".pitch"));
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
        renderBoard(true);

        const result = checkDecided();
        if(result){
          setTimeout(()=>showWinner(result), 1500);
        } else {
          shootIsA = !shootIsA;
          $("nextBtn").classList.add("show");
          setStatus(null,"","",false);
          const flitzer = Math.random()<0.14;
          if(flitzer) setTimeout(runStreaker, 550);
          scheduleAuto(flitzer ? 3900 : 2400);
        }
      });
    }, 45);
  }, 540);
}

/* Torwart-Hechtsprung mit Landung und Staub */
function diveKeeper(z, covered){
  const keeper=$("keeper");
  keeper.classList.remove("sway");
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
    keeper.style.transition="transform .3s cubic-bezier(.55,0,.8,.55)";
    if(rot!==0){
      keeper.style.transform=`translate(${(dx*1.04).toFixed(1)}px,36px) rotate(${Math.sign(rot)*92}deg)`;
    } else {
      keeper.style.transform=`translate(${dx}px,0px)`;
    }
    setTimeout(()=>{
      keeper.style.transition="";
      spawnDust(KEEPER_REF.x+dx*1.04);
    }, 310);
  }, 440);
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
  const pl=PLAYERS[t.idx];
  $("winFlag").innerHTML=flagHTML(t.idx,56);
  $("winName").textContent=`${t.name} gewinnt!`;
  $("winScore").textContent=`${teamA.name} ${score(kicksA)} : ${score(kicksB)} ${teamB.name}` + (sudden?" — nach Sudden Death":"");
  $("winPlayer").textContent=pl.p;
  drawWinFig(t.idx);
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
  if(mode!=="wm" || !turnier){ band.style.display="none"; return; }
  const cfg=WM_RUNDEN[turnier.runde];
  band.style.display="flex";
  band.innerHTML=`<span class="runde">${cfg.name}</span><span class="info">${cfg.tw}</span>`;
}

/* Frage im Setup: gespeichertes Turnier weiterspielen? */
function wmFrageAktualisieren(){
  const box=$("wmFrage");
  const t=(mode==="wm") ? wmLaden() : null;
  if(!t){ box.style.display="none"; return; }
  let stand;
  if(t.status==="titel") stand="Weltmeister — Pokalübergabe";
  else if(t.status==="aus") stand="beendet im "+wmRundenName(t.ausRunde);
  else stand=wmRundenName(t.runde);
  $("wmFrageTxt").innerHTML =
    `Du hast noch ein Turnier offen: ${flagHTML(t.meinIdx,15)}<b>${TEAMS[t.meinIdx]}</b> — <b>${stand}</b>.`;
  box.style.display="block";
}

$("wmWeiterBtn").onclick=()=>{
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
  wmLoeschen();
  turnier=null;
  $("wmFrage").style.display="none";
  $("pickLbl").textContent="Dein Team für die WM wählen — der Rest wird ausgelost";
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
    $("wmTitel").textContent="Weltmeister!";
    $("wmUnter").innerHTML=`<b>${TEAMS[turnier.meinIdx]}</b> hat die WM gewonnen.`;
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
  const meins = turnier ? turnier.meinIdx : selIdxA;
  wmNeu(meins);
  wmBaumZeigen("Neu ausgelost — viel Glück!");
};
$("wmMenuBtn").onclick=()=>{ setMode("wm"); show("setup"); };

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
    ? `Weltmeister 2026: ${flagHTML(wm,18)}<b>${TEAMS[wm]}</b>`
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
  $("pokalPlayer").textContent=PLAYERS[idx].p+" hebt den Pokal";
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
$("pokalNeuBtn").onclick=()=>{ wmNeu(turnier.meinIdx); wmBaumZeigen("Titelverteidigung — neu ausgelost!"); };
$("pokalMenuBtn").onclick=()=>{ setMode("wm"); show("setup"); };

/* ---------------- Beim Laden: offenes Turnier? ---------------- */
(function beimStart(){
  if(wmLaden()) setMode("wm");
})();
