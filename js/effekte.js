"use strict";
/* ====================================================================
   effekte.js — Szenenaufbau und Animationen
   Ballflug und Ballsprünge laufen über requestAnimationFrame,
   alles andere möglichst über CSS-Animationen (schonend fürs Tablet).
   ==================================================================== */

/* ---------- Zuschauerränge (einmal beim Laden aufgebaut) ---------- */
function buildCrowd(){
  const crowdG=$("crowd");
  let dots="";
  for(let i=0;i<260;i++){
    const x=Math.random()*600, y=8+Math.random()*108;
    const c=["#8a9","#a98","#99a","#aa8","#888"][zufall(5)];
    dots+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.5" fill="${c}" opacity="${(0.15+Math.random()*0.3).toFixed(2)}"/>`;
  }
  // Fotoblitze in der Menge
  for(let i=0;i<12;i++){
    const x=Math.random()*600, y=8+Math.random()*108;
    dots+=`<circle class="camflash" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2" fill="#fff" style="animation-duration:${(2.6+Math.random()*4).toFixed(1)}s;animation-delay:${(Math.random()*4).toFixed(1)}s"/>`;
  }
  crowdG.innerHTML=dots;
}

/* ---------- Tornetz ---------- */
function buildNet(){
  let net="";
  for(let x=GX;x<=GX+GW;x+=20) net+=`<line x1="${x}" y1="${GY}" x2="${x}" y2="${GY+GH}" stroke="rgba(242,245,239,.10)" stroke-width="1"/>`;
  for(let y=GY;y<=GY+GH;y+=20) net+=`<line x1="${GX}" y1="${y}" x2="${GX+GW}" y2="${y}" stroke="rgba(242,245,239,.10)" stroke-width="1"/>`;
  $("net").innerHTML=net;
}

/* ---------- Ballflug ---------- */
function flyBall(targetSVG, opts, done){
  const {dur=460, endScale=0.58, arc=65, groundEnd=255}=opts||{};
  const ball=$("ball"), shadow=$("ballshadow");
  const f=SPOT, tt=targetSVG;
  const cx=(f.x+tt.x)/2, cy=Math.min(f.y,tt.y)-arc;
  const t0=performance.now();
  ball.style.opacity="1"; ball.classList.add("live");
  shadow.style.opacity="0.45";

  function step(now){
    let u=Math.min(1,(now-t0)/dur);
    const e=1-Math.pow(1-u,1.7);
    const x=(1-e)*(1-e)*f.x + 2*(1-e)*e*cx + e*e*tt.x;
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
