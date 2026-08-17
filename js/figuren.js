"use strict";
/* ====================================================================
   figuren.js — Spielerfiguren: Farbhelfer, Frisuren, Trikots
   Der Schütze wird von hinten gezeigt, die Siegerfigur von vorne.
   ==================================================================== */

/* Farbe aufhellen (p > 0) oder abdunkeln (p < 0), p: -1 … 1 */
function shade(hex,p){
  const n=parseInt(hex.slice(1),16);
  let r=(n>>16)&255, g=(n>>8)&255, b=n&255;
  if(p>=0){ r+= (255-r)*p; g+=(255-g)*p; b+=(255-b)*p; }
  else { r*=1+p; g*=1+p; b*=1+p; }
  return "#"+[r,g,b].map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,"0")).join("");
}
function luminance(hex){
  const n=parseInt(hex.slice(1),16);
  return (0.299*((n>>16)&255)+0.587*((n>>8)&255)+0.114*(n&255))/255;
}
/* Gut lesbare Schriftfarbe auf einem Trikot */
function contrastOn(hex){ return luminance(hex)>0.62 ? "#1a1a1a" : "#f7f7f7"; }

/* Frisuren (Rückansicht): Hinterkopf grossflächig bedeckt */
function hairBack(style, c, cx, cy, r){
  const base=`<path d="M${cx-r} ${cy+2} a${r} ${r} 0 1 1 ${2*r} 0 z" fill="${c}"/>`;
  if(style==="buzz") return `<path d="M${cx-r} ${cy} a${r} ${r} 0 1 1 ${2*r} 0 z" fill="${c}" opacity=".82"/>`;
  if(style==="curly") return base+
    `<circle cx="${cx-8}" cy="${cy-9}" r="4.5" fill="${c}"/>`+
    `<circle cx="${cx-3}" cy="${cy-12}" r="5" fill="${c}"/>`+
    `<circle cx="${cx+3}" cy="${cy-12}" r="5" fill="${c}"/>`+
    `<circle cx="${cx+8}" cy="${cy-9}" r="4.5" fill="${c}"/>`;
  if(style==="bun") return base+`<circle cx="${cx}" cy="${cy-r-2}" r="4.6" fill="${c}"/>`;
  return base;
}
/* Frisuren (Frontansicht, Siegerfigur) */
function hairFront(style, c, cx, cy, r){
  const cap=`<path d="M${cx-r-0.5} ${cy-3} q${r+0.5} -${r} ${2*r+1} 0 l0 -6 q-${r+0.5} -10 -${2*r+1} 0 z" fill="${c}"/>`;
  if(style==="buzz") return `<path d="M${cx-r-0.5} ${cy-3} q${r+0.5} -${r} ${2*r+1} 0 l0 -4 q-${r+0.5} -9 -${2*r+1} 0 z" fill="${c}" opacity=".82"/>`;
  if(style==="curly") return cap+
    `<circle cx="${cx-8}" cy="${cy-10}" r="4.5" fill="${c}"/>`+
    `<circle cx="${cx-3}" cy="${cy-13}" r="5" fill="${c}"/>`+
    `<circle cx="${cx+3}" cy="${cy-13}" r="5" fill="${c}"/>`+
    `<circle cx="${cx+8}" cy="${cy-10}" r="4.5" fill="${c}"/>`;
  if(style==="bun") return cap+`<circle cx="${cx+9}" cy="${cy-11}" r="4.5" fill="${c}"/>`;
  return cap;
}

/* Schütze in den Farben des gewählten Landes einkleiden */
function applyShooterLook(idx){
  const pl=PLAYERS[idx];
  $("gJ1").setAttribute("stop-color", shade(pl.jersey, 0.22));
  $("gJ2").setAttribute("stop-color", shade(pl.jersey, -0.28));
  $("shHead").setAttribute("fill",pl.skin);
  $("shEarL").setAttribute("fill",pl.skin);
  $("shEarR").setAttribute("fill",pl.skin);
  document.querySelectorAll("#shooter rect[x='324']").forEach(n=>n.setAttribute("fill",pl.skin)); // Nacken
  $("shHair").innerHTML=hairBack(pl.style,pl.hair,328,268,12);
  $("shShorts").setAttribute("fill",pl.shorts);
  $("shSleeveL").setAttribute("stroke",pl.jersey);
  $("shSleeveR").setAttribute("stroke",pl.jersey);
  $("shForeL").setAttribute("stroke",pl.skin);
  $("shForeR").setAttribute("stroke",pl.skin);
  $("shThighL").setAttribute("stroke",pl.skin);
  $("shThighR").setAttribute("stroke",pl.skin);
  $("shSockL").setAttribute("stroke",pl.socks);
  $("shSockR").setAttribute("stroke",pl.socks);
  $("shNum").textContent=pl.num;
  $("shNum").setAttribute("fill", contrastOn(pl.jersey));
  $("shName").textContent=pl.p;
}

/* ====================== WM-Pokal ======================
   Goldener Pokal: Sockel, zwei geschwungene Arme, Weltkugel obendrauf.
   Wird im Turnierbaum klein und bei der Zeremonie gross gezeichnet. */
let pokalNr = 0;
function pokalSVG(hoehe){
  const id = "gPokal" + (++pokalNr);
  return `<svg class="pokal-svg" viewBox="0 0 80 110" height="${hoehe}" width="${(hoehe*80/110).toFixed(0)}" aria-hidden="true">
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff3c0"/>
        <stop offset="0.35" stop-color="#f0c548"/>
        <stop offset="0.7" stop-color="#c8931b"/>
        <stop offset="1" stop-color="#8a6410"/>
      </linearGradient>
    </defs>
    <ellipse cx="40" cy="104" rx="24" ry="4" fill="rgba(0,0,0,.35)"/>
    <rect x="20" y="94" width="40" height="9" rx="3" fill="url(#${id})"/>
    <rect x="20" y="94" width="40" height="3" rx="1.5" fill="#fff" opacity=".35"/>
    <rect x="27" y="86" width="26" height="9" rx="2.5" fill="url(#${id})"/>
    <path d="M33 86 q-14 -16 -12 -34 q1 -12 11 -16 l0 8 q-5 3 -5 10 q-1 14 12 26 z" fill="url(#${id})"/>
    <path d="M47 86 q14 -16 12 -34 q-1 -12 -11 -16 l0 8 q5 3 5 10 q1 14 -12 26 z" fill="url(#${id})"/>
    <path d="M32 44 q8 8 16 0 l0 14 q-8 7 -16 0 z" fill="url(#${id})"/>
    <circle cx="40" cy="28" r="15" fill="url(#${id})"/>
    <path d="M25 28 h30 M40 13 v30 M29 19 q11 9 22 0 M29 37 q11 -9 22 0"
          stroke="rgba(120,80,10,.45)" stroke-width="1.1" fill="none"/>
    <ellipse cx="34" cy="22" rx="4.5" ry="6" fill="#fff" opacity=".33" transform="rotate(-20 34 22)"/>
  </svg>`;
}

/* Zeremonie: Siegerfigur hebt den Pokal in die Höhe */
function drawPokalSzene(idx){
  const pl=PLAYERS[idx];
  const numC=contrastOn(pl.jersey);
  $("pokalSzene").innerHTML=`
    <div class="pokal-hoch">${pokalSVG(120)}</div>
    <svg class="pokal-fig" viewBox="0 0 200 215" aria-hidden="true">
      <defs>
        <linearGradient id="gPokalFig" x1="0" y1="0" x2="0.85" y2="1">
          <stop offset="0" stop-color="${shade(pl.jersey,0.22)}"/>
          <stop offset="1" stop-color="${shade(pl.jersey,-0.28)}"/>
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="200" rx="34" ry="8" fill="rgba(0,0,0,.4)"/>
      <!-- Arme nach oben zum Pokal -->
      <line x1="89" y1="80" x2="76" y2="46" stroke="${pl.jersey}" stroke-width="9" stroke-linecap="round"/>
      <line x1="111" y1="80" x2="124" y2="46" stroke="${pl.jersey}" stroke-width="9" stroke-linecap="round"/>
      <line x1="76" y1="46" x2="86" y2="26" stroke="${pl.skin}" stroke-width="7" stroke-linecap="round"/>
      <line x1="124" y1="46" x2="114" y2="26" stroke="${pl.skin}" stroke-width="7" stroke-linecap="round"/>
      <rect x="96" y="66" width="8" height="8" rx="2" fill="${pl.skin}"/>
      <circle cx="100" cy="58" r="13" fill="${pl.skin}"/>
      ${hairFront(pl.style,pl.hair,100,58,13)}
      <circle cx="95.5" cy="57" r="1.4" fill="#222"/>
      <circle cx="104.5" cy="57" r="1.4" fill="#222"/>
      <path d="M94 64 q6 5 12 0" stroke="#7a4a30" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M85 74 q15 -10 30 0 l2 36 q-17 7 -34 0 z" fill="url(#gPokalFig)" stroke="rgba(0,0,0,.25)" stroke-width=".6"/>
      <text x="100" y="100" text-anchor="middle" font-family="Bebas Neue" font-size="17" fill="${numC}">${pl.num}</text>
      <path d="M86 108 q14 5 28 0 l-2 13 q-4 4 -9 1 l-3 -6 -3 6 q-5 3 -9 -1 z" fill="${pl.shorts}"/>
      <line x1="94" y1="122" x2="90" y2="140" stroke="${pl.skin}" stroke-width="8" stroke-linecap="round"/>
      <line x1="106" y1="122" x2="110" y2="140" stroke="${pl.skin}" stroke-width="8" stroke-linecap="round"/>
      <line x1="90" y1="140" x2="88" y2="158" stroke="${pl.socks}" stroke-width="7" stroke-linecap="round"/>
      <line x1="110" y1="140" x2="112" y2="158" stroke="${pl.socks}" stroke-width="7" stroke-linecap="round"/>
      <ellipse cx="86" cy="161" rx="8" ry="4.5" fill="#111"/>
      <ellipse cx="114" cy="161" rx="8" ry="4.5" fill="#111"/>
    </svg>
  `;
}

/* Jubelnde Siegerfigur auf dem Sieger-Screen */
function drawWinFig(idx){
  const pl=PLAYERS[idx];
  const numC=contrastOn(pl.jersey);
  $("winFig").innerHTML=`
    <defs>
      <linearGradient id="gWin" x1="0" y1="0" x2="0.85" y2="1">
        <stop offset="0" stop-color="${shade(pl.jersey,0.22)}"/>
        <stop offset="1" stop-color="${shade(pl.jersey,-0.28)}"/>
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="202" rx="30" ry="7" fill="rgba(0,0,0,.35)"/>
    <rect x="96" y="66" width="8" height="8" rx="2" fill="${pl.skin}"/>
    <circle cx="100" cy="58" r="13" fill="${pl.skin}"/>
    ${hairFront(pl.style,pl.hair,100,58,13)}
    <circle cx="95.5" cy="58" r="1.4" fill="#222"/>
    <circle cx="104.5" cy="58" r="1.4" fill="#222"/>
    <path d="M95 64 q5 4 10 0" stroke="#7a4a30" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M85 74 q15 -10 30 0 l2 36 q-17 7 -34 0 z" fill="url(#gWin)" stroke="rgba(0,0,0,.25)" stroke-width=".6"/>
    <text x="100" y="100" text-anchor="middle" font-family="Bebas Neue" font-size="17" fill="${numC}">${pl.num}</text>
    <line x1="89" y1="80" x2="70" y2="106" stroke="${pl.jersey}" stroke-width="9" stroke-linecap="round"/>
    <line x1="111" y1="80" x2="130" y2="106" stroke="${pl.jersey}" stroke-width="9" stroke-linecap="round"/>
    <line x1="70" y1="106" x2="62" y2="122" stroke="${pl.skin}" stroke-width="7" stroke-linecap="round"/>
    <line x1="130" y1="106" x2="138" y2="122" stroke="${pl.skin}" stroke-width="7" stroke-linecap="round"/>
    <path d="M86 108 q14 5 28 0 l-2 13 q-4 4 -9 1 l-3 -6 -3 6 q-5 3 -9 -1 z" fill="${pl.shorts}"/>
    <line x1="94" y1="122" x2="90" y2="138" stroke="${pl.skin}" stroke-width="8" stroke-linecap="round"/>
    <line x1="106" y1="122" x2="110" y2="138" stroke="${pl.skin}" stroke-width="8" stroke-linecap="round"/>
    <line x1="90" y1="138" x2="88" y2="156" stroke="${pl.socks}" stroke-width="7" stroke-linecap="round"/>
    <line x1="110" y1="138" x2="112" y2="156" stroke="${pl.socks}" stroke-width="7" stroke-linecap="round"/>
    <ellipse cx="86" cy="159" rx="8" ry="4.5" fill="#111"/>
    <ellipse cx="114" cy="159" rx="8" ry="4.5" fill="#111"/>
    <path d="M52 40 q6 6 0 12 M148 40 q-6 6 0 12" stroke="rgba(240,197,72,.7)" stroke-width="3" fill="none" stroke-linecap="round"/>
  `;
}
