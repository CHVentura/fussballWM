"use strict";
/* ====================================================================
   teams.js — Länder, Schützen und die SVG-Flaggen
   Die Reihenfolge von TEAMS und PLAYERS gehört zusammen:
   TEAMS[i] spielt mit PLAYERS[i] und trägt die Flagge flagInner(i).
   ==================================================================== */

const TEAMS = [
  "Schweiz","Deutschland","Österreich","Frankreich","Italien","Spanien","Portugal","England",
  "Niederlande","Belgien","Kroatien","Dänemark","Norwegen","USA","Kanada","Mexiko",
  "Brasilien","Argentinien","Uruguay","Kolumbien","Ecuador","Japan","Südkorea","Australien",
  "Marokko","Senegal"
];

const PLAYERS = [
  {p:"Granit Xhaka",      num:10, skin:"#e8b88a", hair:"#26201a", style:"short", jersey:"#d52b1e", shorts:"#f2f5ef", socks:"#d52b1e"},
  {p:"Jamal Musiala",     num:10, skin:"#8d5a3b", hair:"#161310", style:"curly", jersey:"#f2f5ef", shorts:"#1a1a1a", socks:"#f2f5ef"},
  {p:"David Alaba",       num:8,  skin:"#7a4a30", hair:"#161310", style:"short", jersey:"#d52b1e", shorts:"#f2f5ef", socks:"#d52b1e"},
  {p:"Kylian Mbappé",     num:10, skin:"#8d5a3b", hair:"#161310", style:"buzz",  jersey:"#1c2f8a", shorts:"#f2f5ef", socks:"#d52b1e"},
  {p:"Federico Chiesa",   num:14, skin:"#e8b88a", hair:"#2a2118", style:"short", jersey:"#2a6df0", shorts:"#f2f5ef", socks:"#2a6df0"},
  {p:"Lamine Yamal",      num:19, skin:"#c98a5b", hair:"#161310", style:"curly", jersey:"#c60b1e", shorts:"#1c2f8a", socks:"#c60b1e"},
  {p:"Cristiano Ronaldo", num:7,  skin:"#e0a87a", hair:"#1c1712", style:"short", jersey:"#d31334", shorts:"#046a38", socks:"#d31334"},
  {p:"Harry Kane",        num:9,  skin:"#e8b88a", hair:"#6b4a2a", style:"short", jersey:"#f2f5ef", shorts:"#1c2f55", socks:"#f2f5ef"},
  {p:"Virgil van Dijk",   num:4,  skin:"#6f4428", hair:"#161310", style:"bun",   jersey:"#f36c21", shorts:"#f2f5ef", socks:"#f36c21"},
  {p:"Kevin De Bruyne",   num:7,  skin:"#f0c8a0", hair:"#c87f3a", style:"short", jersey:"#d52b1e", shorts:"#1a1a1a", socks:"#d52b1e"},
  {p:"Luka Modrić",       num:10, skin:"#e8b88a", hair:"#8a6a3a", style:"short", jersey:"#f2f5ef", shorts:"#f2f5ef", socks:"#2a4f9e"},
  {p:"Christian Eriksen", num:10, skin:"#f0c8a0", hair:"#caa55a", style:"short", jersey:"#d52b1e", shorts:"#f2f5ef", socks:"#d52b1e"},
  {p:"Erling Haaland",    num:9,  skin:"#f0c8a0", hair:"#e8d28a", style:"bun",   jersey:"#d52b1e", shorts:"#1c2f8a", socks:"#1c2f8a"},
  {p:"Christian Pulisic", num:10, skin:"#e8b88a", hair:"#5a3a22", style:"short", jersey:"#f2f5ef", shorts:"#1c2f8a", socks:"#f2f5ef"},
  {p:"Alphonso Davies",   num:19, skin:"#6f4428", hair:"#161310", style:"short", jersey:"#d52b1e", shorts:"#d52b1e", socks:"#d52b1e"},
  {p:"Santiago Giménez",  num:9,  skin:"#c98a5b", hair:"#161310", style:"short", jersey:"#046a38", shorts:"#f2f5ef", socks:"#d52b1e"},
  {p:"Vinícius Júnior",   num:7,  skin:"#7a4a30", hair:"#161310", style:"curly", jersey:"#ffd400", shorts:"#1c2f8a", socks:"#f2f5ef"},
  {p:"Lionel Messi",      num:10, skin:"#e8b88a", hair:"#2a2118", style:"short", jersey:"#9ecbf0", shorts:"#1a1a1a", socks:"#f2f5ef"},
  {p:"Federico Valverde", num:15, skin:"#c98a5b", hair:"#2a2118", style:"buzz",  jersey:"#4aa3dd", shorts:"#1a1a1a", socks:"#1a1a1a"},
  {p:"Luis Díaz",         num:7,  skin:"#8d5a3b", hair:"#161310", style:"curly", jersey:"#ffd400", shorts:"#1c2f8a", socks:"#d52b1e"},
  {p:"Moisés Caicedo",    num:23, skin:"#6f4428", hair:"#161310", style:"short", jersey:"#ffd400", shorts:"#1c2f8a", socks:"#ffd400"},
  {p:"Takefusa Kubo",     num:11, skin:"#f0d0a8", hair:"#1c1712", style:"short", jersey:"#1c2f8a", shorts:"#f2f5ef", socks:"#1c2f8a"},
  {p:"Son Heung-min",     num:7,  skin:"#f0d0a8", hair:"#1c1712", style:"short", jersey:"#d52b1e", shorts:"#1a1a1a", socks:"#d52b1e"},
  {p:"Mathew Leckie",     num:7,  skin:"#e8b88a", hair:"#3a2a1a", style:"short", jersey:"#ffd400", shorts:"#046a38", socks:"#ffd400"},
  {p:"Achraf Hakimi",     num:2,  skin:"#c98a5b", hair:"#161310", style:"short", jersey:"#d52b1e", shorts:"#046a38", socks:"#d52b1e"},
  {p:"Sadio Mané",        num:10, skin:"#5a3a22", hair:"#161310", style:"buzz",  jersey:"#f2f5ef", shorts:"#046a38", socks:"#d52b1e"}
];

/* ====================== Flaggen (SVG, 30x20) ====================== */
const STAR = "15,5 16.18,8.38 19.76,8.45 16.9,10.62 17.94,14.05 15,12 12.06,14.05 13.1,10.62 10.24,8.45 13.82,8.38";
const R = (x,y,w,h,c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const v3 = (a,b,c) => R(0,0,10,20,a)+R(10,0,10,20,b)+R(20,0,10,20,c);
const h3 = (a,b,c) => R(0,0,30,6.67,a)+R(0,6.67,30,6.67,b)+R(0,13.33,30,6.67,c);

function flagInner(i){
  switch(i){
    case 0: return R(0,0,30,20,"#da291c")+R(13,4,4,12,"#fff")+R(9,8,12,4,"#fff");
    case 1: return h3("#000","#dd0000","#ffce00");
    case 2: return h3("#ed2939","#fff","#ed2939");
    case 3: return v3("#0055a4","#fff","#ef4135");
    case 4: return v3("#009246","#fff","#ce2b37");
    case 5: return R(0,0,30,5,"#aa151b")+R(0,5,30,10,"#f1bf00")+R(0,15,30,5,"#aa151b");
    case 6: return R(0,0,12,20,"#046a38")+R(12,0,18,20,"#da291c")+`<circle cx="12" cy="10" r="3.6" fill="none" stroke="#ffd200" stroke-width="1.4"/><circle cx="12" cy="10" r="1.7" fill="#fff"/>`;
    case 7: return R(0,0,30,20,"#fff")+R(13,0,4,20,"#ce1124")+R(0,8,30,4,"#ce1124");
    case 8: return h3("#ae1c28","#fff","#21468b");
    case 9: return v3("#000","#fdda24","#ef3340");
    case 10:{
      let s=h3("#ff0000","#fff","#171796");
      for(let r=0;r<3;r++)for(let c=0;c<5;c++){
        if((r+c)%2===0) s+=R(11+c*1.7, 3.5+r*1.7, 1.7, 1.7, "#e03");
        else s+=R(11+c*1.7, 3.5+r*1.7, 1.7, 1.7, "#fff");
      }
      return s;
    }
    case 11: return R(0,0,30,20,"#c8102e")+R(9,0,4,20,"#fff")+R(0,8,30,4,"#fff");
    case 12: return R(0,0,30,20,"#ef2b2d")+R(8,0,6,20,"#fff")+R(0,7,30,6,"#fff")+R(9.5,0,3,20,"#002868")+R(0,8.5,30,3,"#002868");
    case 13:{
      let s=R(0,0,30,20,"#b22234");
      for(let k=1;k<7;k+=2) s+=R(0,k*20/13,30,20/13,"#fff");
      s+=R(0,0,12,10.8,"#3c3b6e");
      for(let r=0;r<3;r++)for(let c=0;c<4;c++) s+=`<circle cx="${1.8+c*2.9}" cy="${1.9+r*3.6}" r=".7" fill="#fff"/>`;
      return s;
    }
    case 14: return R(0,0,8,20,"#d80621")+R(8,0,14,20,"#fff")+R(22,0,8,20,"#d80621")+`<polygon points="15,5.5 16.3,8.2 18.8,7.8 17.5,10 19.8,11.4 17,11.9 17.2,14.6 15,12.9 12.8,14.6 13,11.9 10.2,11.4 12.5,10 11.2,7.8 13.7,8.2" fill="#d80621"/>`;
    case 15: return v3("#006847","#fff","#ce1126")+`<ellipse cx="15" cy="10" rx="2.6" ry="2.1" fill="#8c6a3f"/>`;
    case 16: return R(0,0,30,20,"#009b3a")+`<polygon points="15,2.5 27,10 15,17.5 3,10" fill="#fedf00"/><circle cx="15" cy="10" r="4" fill="#002776"/>`;
    case 17: return h3("#74acdf","#fff","#74acdf")+`<circle cx="15" cy="10" r="2.4" fill="#f6b40e"/>`;
    case 18:{
      let s=R(0,0,30,20,"#fff");
      s+=R(11,2.3,19,2.2,"#0038a8")+R(11,6.7,19,2.2,"#0038a8")+R(0,11.1,30,2.2,"#0038a8")+R(0,15.5,30,2.2,"#0038a8");
      s+=`<circle cx="5.5" cy="5" r="3" fill="#fcd116"/>`;
      return s;
    }
    case 19: return R(0,0,30,10,"#fcd116")+R(0,10,30,5,"#003893")+R(0,15,30,5,"#ce1126");
    case 20: return R(0,0,30,10,"#fcd116")+R(0,10,30,5,"#003893")+R(0,15,30,5,"#ce1126")+`<ellipse cx="15" cy="10" rx="2.6" ry="2.1" fill="#6a4c2f"/>`;
    case 21: return R(0,0,30,20,"#fff")+`<circle cx="15" cy="10" r="5" fill="#bc002d"/>`;
    case 22: return R(0,0,30,20,"#fff")+`<path d="M10 10 a5 5 0 0 1 10 0 a2.5 2.5 0 0 1 -5 0 a2.5 2.5 0 0 0 -5 0 z" fill="#cd2e3a"/><path d="M20 10 a5 5 0 0 1 -10 0 a2.5 2.5 0 0 0 5 0 a2.5 2.5 0 0 1 5 0 z" fill="#0047a0"/>`;
    case 23:{
      let s=R(0,0,30,20,"#00247d");
      s+=`<line x1="0" y1="0" x2="14" y2="10" stroke="#fff" stroke-width="2"/><line x1="14" y1="0" x2="0" y2="10" stroke="#fff" stroke-width="2"/>`;
      s+=R(6,0,2.6,10,"#fff")+R(0,4,14,2.6,"#fff")+R(6.7,0,1.2,10,"#cf142b")+R(0,4.7,14,1.2,"#cf142b");
      s+=`<circle cx="7" cy="15.5" r="1.5" fill="#fff"/><circle cx="22" cy="4" r="1" fill="#fff"/><circle cx="26" cy="8" r="1" fill="#fff"/><circle cx="22" cy="13" r="1" fill="#fff"/><circle cx="19" cy="8.5" r="1" fill="#fff"/><circle cx="24.5" cy="16.5" r="1" fill="#fff"/>`;
      return s;
    }
    case 24: return R(0,0,30,20,"#c1272d")+`<polygon points="${STAR}" fill="none" stroke="#006233" stroke-width="1.1"/>`;
    case 25: return v3("#00853f","#fdef42","#e31b23")+`<g transform="translate(15,10) scale(.62) translate(-15,-10)"><polygon points="${STAR}" fill="#00853f"/></g>`;
  }
  return R(0,0,30,20,"#888");
}
function flagFrame(){ return `<rect x="0.4" y="0.4" width="29.2" height="19.2" fill="none" stroke="rgba(0,0,0,.35)" stroke-width=".8"/>`; }
function flagHTML(i,h){
  return `<svg class="flag-svg" viewBox="0 0 30 20" width="${(h*1.5).toFixed(0)}" height="${h}" preserveAspectRatio="none" aria-hidden="true">${flagInner(i)}${flagFrame()}</svg>`;
}
