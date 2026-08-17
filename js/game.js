"use strict";
/* ====================================================================
   game.js — Spielablauf: Auswahl, Elfmeterschiessen, Entscheidung
   Ablauf pro Elfmeter: Torwart deckt verdeckt 3 Zonen, dann wählt der
   Schütze 1 Zone. Abgedeckte Zone = gehalten, sonst Tor.
   ==================================================================== */

/* ====================== Zustand ====================== */
let mode = "2p";
let selIdxA = 0, selIdxB = 1;
let teamA, teamB;
let kicksA = [], kicksB = [];
let phase = "idle";
let keeperZones = [];
let shootIsA = true;
let sudden = false;
let lastDive = {dx:0, rot:0};

/* ====================== DOM ====================== */
const scr = {setup:$("scr-setup"), game:$("scr-game"), win:$("scr-win")};

/* Setup: ein Flaggen-Raster, alle Länder auf einen Blick */
const gridEl=$("grid"), gridCards=[];
TEAMS.forEach((n,i)=>{
  const card=document.createElement("div");
  card.className="flag-card";
  card.innerHTML=flagHTML(i,14)+`<span>${n}<small>${PLAYERS[i].p}</small></span><span class="badge"></span>`;
  card.onclick=()=>{
    if(i===selIdxA) selIdxA=null;
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
    card.classList.toggle("selA", i===selIdxA);
    card.classList.toggle("selB", i===selIdxB);
    const b=card.querySelector(".badge");
    const txt = i===selIdxA ? (mode==="1p"?"DU":"1") : i===selIdxB ? (mode==="1p"?"PC":"2") : "";
    b.textContent=txt;
    b.style.display = txt ? "flex" : "none";
  });
}
refreshGrid();

$("m2p").onclick=()=>setMode("2p");
$("m1p").onclick=()=>setMode("1p");
function setMode(m){
  mode=m;
  $("m2p").classList.toggle("sel", m==="2p");
  $("m1p").classList.toggle("sel", m==="1p");
  $("pickLbl").textContent = m==="1p"
    ? "Länder wählen — zuerst dein Team, dann der Computer"
    : "Länder wählen — zuerst Team 1, dann Team 2";
  refreshGrid();
}

$("startBtn").onclick=()=>{
  if(selIdxA==null || selIdxB==null){
    alert("Bitte zwei Länder wählen.");
    return;
  }
  teamA = {name:TEAMS[selIdxA], idx:selIdxA};
  teamB = {name:TEAMS[selIdxB], idx:selIdxB};
  initAudio();
  startGame();
};
$("againBtn").onclick=()=>show("setup");

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

  const keeperIsComputer = (mode==="1p" && shootIsA);
  const shooterIsComputer = (mode==="1p" && !shootIsA);

  if(keeperIsComputer){
    keeperZones=pick3();
    phase="shooter";
    whistle();
    setStatus(curShooter().idx, `${shooterPlayer().p} — Schütze`,
      "Der Computer-Torwart steht. Wähle deine Zone (1–9).", false);
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
      const shooterIsComputer=(mode==="1p" && !shootIsA);
      if(shooterIsComputer){
        setStatus(curShooter().idx, `${shooterPlayer().p} — Schütze`,"Der Computer läuft an …",false);
        setTimeout(()=>resolveShot(zufall(9)), 600);
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
