"use strict";
/* ====================================================================
   teams.js — Länder, Schützen und die SVG-Flaggen
   Alle Listen sind gleich sortiert: TEAMS[i] trägt das Trikot KITS[i],
   die Flagge flagInner(i) und tritt mit dem Kader KADER[i] an.
   ==================================================================== */

const TEAMS = [
  "Schweiz","Deutschland","Österreich","Frankreich","Italien","Spanien","Portugal","England",
  "Niederlande","Belgien","Kroatien","Dänemark","Norwegen","USA","Kanada","Mexiko",
  "Brasilien","Argentinien","Uruguay","Kolumbien","Ecuador","Japan","Südkorea","Australien",
  "Marokko","Senegal"
];

/* Heimtrikot pro Land — Farben gehören zum Team, nicht zum Spieler */
const KITS = [
  {jersey:"#d52b1e", shorts:"#f2f5ef", socks:"#d52b1e"},   // Schweiz
  {jersey:"#f2f5ef", shorts:"#1a1a1a", socks:"#f2f5ef"},   // Deutschland
  {jersey:"#d52b1e", shorts:"#f2f5ef", socks:"#d52b1e"},   // Österreich
  {jersey:"#1c2f8a", shorts:"#f2f5ef", socks:"#d52b1e"},   // Frankreich
  {jersey:"#2a6df0", shorts:"#f2f5ef", socks:"#2a6df0"},   // Italien
  {jersey:"#c60b1e", shorts:"#1c2f8a", socks:"#c60b1e"},   // Spanien
  {jersey:"#d31334", shorts:"#046a38", socks:"#d31334"},   // Portugal
  {jersey:"#f2f5ef", shorts:"#1c2f55", socks:"#f2f5ef"},   // England
  {jersey:"#f36c21", shorts:"#f2f5ef", socks:"#f36c21"},   // Niederlande
  {jersey:"#d52b1e", shorts:"#1a1a1a", socks:"#d52b1e"},   // Belgien
  {jersey:"#f2f5ef", shorts:"#f2f5ef", socks:"#2a4f9e"},   // Kroatien
  {jersey:"#d52b1e", shorts:"#f2f5ef", socks:"#d52b1e"},   // Dänemark
  {jersey:"#d52b1e", shorts:"#1c2f8a", socks:"#1c2f8a"},   // Norwegen
  {jersey:"#f2f5ef", shorts:"#1c2f8a", socks:"#f2f5ef"},   // USA
  {jersey:"#d52b1e", shorts:"#d52b1e", socks:"#d52b1e"},   // Kanada
  {jersey:"#046a38", shorts:"#f2f5ef", socks:"#d52b1e"},   // Mexiko
  {jersey:"#ffd400", shorts:"#1c2f8a", socks:"#f2f5ef"},   // Brasilien
  {jersey:"#9ecbf0", shorts:"#1a1a1a", socks:"#f2f5ef"},   // Argentinien
  {jersey:"#4aa3dd", shorts:"#1a1a1a", socks:"#1a1a1a"},   // Uruguay
  {jersey:"#ffd400", shorts:"#1c2f8a", socks:"#d52b1e"},   // Kolumbien
  {jersey:"#ffd400", shorts:"#1c2f8a", socks:"#ffd400"},   // Ecuador
  {jersey:"#1c2f8a", shorts:"#f2f5ef", socks:"#1c2f8a"},   // Japan
  {jersey:"#d52b1e", shorts:"#1a1a1a", socks:"#d52b1e"},   // Südkorea
  {jersey:"#ffd400", shorts:"#046a38", socks:"#ffd400"},   // Australien
  {jersey:"#d52b1e", shorts:"#046a38", socks:"#d52b1e"},   // Marokko
  {jersey:"#f2f5ef", shorts:"#046a38", socks:"#d52b1e"}    // Senegal
];

/* Die fünf Schützen pro Land, in der Reihenfolge, in der sie antreten.
   Das sind bekannte Nationalspieler nach Wissensstand Mai 2026 — die
   WM-Kader 2026 stehen noch nicht fest. Der erste ist das Gesicht des
   Landes und wird in der Länderauswahl angezeigt. */
const KADER = [
  [ // Schweiz
    {p:"Granit Xhaka",       num:10, skin:"#e8b88a", hair:"#26201a", style:"short"},
    {p:"Breel Embolo",       num:7,  skin:"#5a3a22", hair:"#161310", style:"buzz"},
    {p:"Ruben Vargas",       num:17, skin:"#c98a5b", hair:"#2a2118", style:"short"},
    {p:"Manuel Akanji",      num:5,  skin:"#6f4428", hair:"#161310", style:"buzz"},
    {p:"Fabian Rieder",      num:15, skin:"#f0c8a0", hair:"#8a6a3a", style:"short"}
  ],
  [ // Deutschland
    {p:"Jamal Musiala",      num:10, skin:"#8d5a3b", hair:"#161310", style:"curly"},
    {p:"Florian Wirtz",      num:17, skin:"#f0c8a0", hair:"#8a6a3a", style:"short"},
    {p:"Kai Havertz",        num:7,  skin:"#e8b88a", hair:"#6b4a2a", style:"short"},
    {p:"Joshua Kimmich",     num:6,  skin:"#f0c8a0", hair:"#caa55a", style:"short"},
    {p:"Niclas Füllkrug",    num:9,  skin:"#e8b88a", hair:"#3a2a1a", style:"short"}
  ],
  [ // Österreich
    {p:"David Alaba",        num:8,  skin:"#7a4a30", hair:"#161310", style:"short"},
    {p:"Marcel Sabitzer",    num:9,  skin:"#e8b88a", hair:"#2a2118", style:"short"},
    {p:"Christoph Baumgartner", num:19, skin:"#f0c8a0", hair:"#6b4a2a", style:"short"},
    {p:"Konrad Laimer",      num:6,  skin:"#e8b88a", hair:"#3a2a1a", style:"short"},
    {p:"Marko Arnautović",   num:7,  skin:"#e8b88a", hair:"#1c1712", style:"short"}
  ],
  [ // Frankreich
    {p:"Kylian Mbappé",      num:10, skin:"#8d5a3b", hair:"#161310", style:"buzz"},
    {p:"Ousmane Dembélé",    num:11, skin:"#6f4428", hair:"#161310", style:"curly"},
    {p:"Aurélien Tchouaméni",num:8,  skin:"#5a3a22", hair:"#161310", style:"buzz"},
    {p:"Michael Olise",      num:7,  skin:"#8d5a3b", hair:"#161310", style:"curly"},
    {p:"Jules Koundé",       num:5,  skin:"#7a4a30", hair:"#161310", style:"bun"}
  ],
  [ // Italien
    {p:"Federico Chiesa",    num:14, skin:"#e8b88a", hair:"#2a2118", style:"short"},
    {p:"Nicolò Barella",     num:18, skin:"#e8b88a", hair:"#3a2a1a", style:"short"},
    {p:"Gianluca Scamacca",  num:9,  skin:"#e8b88a", hair:"#1c1712", style:"short"},
    {p:"Giacomo Raspadori",  num:12, skin:"#e8b88a", hair:"#2a2118", style:"short"},
    {p:"Alessandro Bastoni", num:23, skin:"#e8b88a", hair:"#2a2118", style:"short"}
  ],
  [ // Spanien
    {p:"Lamine Yamal",       num:19, skin:"#c98a5b", hair:"#161310", style:"curly"},
    {p:"Nico Williams",      num:17, skin:"#8d5a3b", hair:"#161310", style:"curly"},
    {p:"Pedri",              num:8,  skin:"#e8b88a", hair:"#2a2118", style:"short"},
    {p:"Dani Olmo",          num:10, skin:"#e8b88a", hair:"#2a2118", style:"short"},
    {p:"Álvaro Morata",      num:7,  skin:"#e8b88a", hair:"#3a2a1a", style:"short"}
  ],
  [ // Portugal
    {p:"Cristiano Ronaldo",  num:7,  skin:"#e0a87a", hair:"#1c1712", style:"short"},
    {p:"Bruno Fernandes",    num:8,  skin:"#e0a87a", hair:"#2a2118", style:"short"},
    {p:"Bernardo Silva",     num:10, skin:"#e0a87a", hair:"#1c1712", style:"short"},
    {p:"Rafael Leão",        num:15, skin:"#5a3a22", hair:"#161310", style:"bun"},
    {p:"Vitinha",            num:16, skin:"#e0a87a", hair:"#1c1712", style:"short"}
  ],
  [ // England
    {p:"Harry Kane",         num:9,  skin:"#e8b88a", hair:"#6b4a2a", style:"short"},
    {p:"Jude Bellingham",    num:10, skin:"#c98a5b", hair:"#2a2118", style:"short"},
    {p:"Phil Foden",         num:11, skin:"#f0c8a0", hair:"#caa55a", style:"short"},
    {p:"Bukayo Saka",        num:7,  skin:"#5a3a22", hair:"#161310", style:"buzz"},
    {p:"Declan Rice",        num:4,  skin:"#e8b88a", hair:"#3a2a1a", style:"short"}
  ],
  [ // Niederlande
    {p:"Virgil van Dijk",    num:4,  skin:"#6f4428", hair:"#161310", style:"bun"},
    {p:"Cody Gakpo",         num:11, skin:"#7a4a30", hair:"#161310", style:"buzz"},
    {p:"Xavi Simons",        num:7,  skin:"#f0c8a0", hair:"#caa55a", style:"bun"},
    {p:"Frenkie de Jong",    num:21, skin:"#e8b88a", hair:"#3a2a1a", style:"short"},
    {p:"Denzel Dumfries",    num:22, skin:"#6f4428", hair:"#161310", style:"buzz"}
  ],
  [ // Belgien
    {p:"Kevin De Bruyne",    num:7,  skin:"#f0c8a0", hair:"#c87f3a", style:"short"},
    {p:"Romelu Lukaku",      num:9,  skin:"#5a3a22", hair:"#161310", style:"buzz"},
    {p:"Jérémy Doku",        num:11, skin:"#5a3a22", hair:"#161310", style:"curly"},
    {p:"Youri Tielemans",    num:8,  skin:"#e8b88a", hair:"#3a2a1a", style:"short"},
    {p:"Leandro Trossard",   num:17, skin:"#f0c8a0", hair:"#8a6a3a", style:"short"}
  ],
  [ // Kroatien
    {p:"Luka Modrić",        num:10, skin:"#e8b88a", hair:"#8a6a3a", style:"short"},
    {p:"Andrej Kramarić",    num:9,  skin:"#e8b88a", hair:"#3a2a1a", style:"short"},
    {p:"Mateo Kovačić",      num:8,  skin:"#e8b88a", hair:"#2a2118", style:"short"},
    {p:"Joško Gvardiol",     num:20, skin:"#e8b88a", hair:"#2a2118", style:"short"},
    {p:"Ivan Perišić",       num:4,  skin:"#e8b88a", hair:"#3a2a1a", style:"short"}
  ],
  [ // Dänemark
    {p:"Christian Eriksen",  num:10, skin:"#f0c8a0", hair:"#caa55a", style:"short"},
    {p:"Rasmus Højlund",     num:9,  skin:"#f0c8a0", hair:"#caa55a", style:"short"},
    {p:"Pierre-Emile Højbjerg", num:23, skin:"#f0c8a0", hair:"#8a6a3a", style:"short"},
    {p:"Mikkel Damsgaard",   num:14, skin:"#f0c8a0", hair:"#e8d28a", style:"short"},
    {p:"Joachim Andersen",   num:2,  skin:"#f0c8a0", hair:"#caa55a", style:"short"}
  ],
  [ // Norwegen
    {p:"Erling Haaland",     num:9,  skin:"#f0c8a0", hair:"#e8d28a", style:"bun"},
    {p:"Martin Ødegaard",    num:10, skin:"#f0c8a0", hair:"#caa55a", style:"short"},
    {p:"Alexander Sørloth",  num:19, skin:"#f0c8a0", hair:"#8a6a3a", style:"short"},
    {p:"Antonio Nusa",       num:11, skin:"#6f4428", hair:"#161310", style:"curly"},
    {p:"Oscar Bobb",         num:17, skin:"#c98a5b", hair:"#2a2118", style:"curly"}
  ],
  [ // USA
    {p:"Christian Pulisic",  num:10, skin:"#e8b88a", hair:"#5a3a22", style:"short"},
    {p:"Weston McKennie",    num:8,  skin:"#7a4a30", hair:"#161310", style:"buzz"},
    {p:"Folarin Balogun",    num:9,  skin:"#5a3a22", hair:"#161310", style:"buzz"},
    {p:"Timothy Weah",       num:21, skin:"#6f4428", hair:"#161310", style:"curly"},
    {p:"Tyler Adams",        num:4,  skin:"#7a4a30", hair:"#161310", style:"buzz"}
  ],
  [ // Kanada
    {p:"Alphonso Davies",    num:19, skin:"#6f4428", hair:"#161310", style:"short"},
    {p:"Jonathan David",     num:20, skin:"#5a3a22", hair:"#161310", style:"buzz"},
    {p:"Cyle Larin",         num:17, skin:"#6f4428", hair:"#161310", style:"buzz"},
    {p:"Stephen Eustáquio",  num:7,  skin:"#c98a5b", hair:"#2a2118", style:"short"},
    {p:"Tajon Buchanan",     num:11, skin:"#7a4a30", hair:"#161310", style:"curly"}
  ],
  [ // Mexiko
    {p:"Santiago Giménez",   num:9,  skin:"#c98a5b", hair:"#161310", style:"short"},
    {p:"Hirving Lozano",     num:22, skin:"#c98a5b", hair:"#161310", style:"short"},
    {p:"Edson Álvarez",      num:4,  skin:"#c98a5b", hair:"#161310", style:"short"},
    {p:"Orbelín Pineda",     num:10, skin:"#c98a5b", hair:"#161310", style:"short"},
    {p:"Raúl Jiménez",       num:11, skin:"#c98a5b", hair:"#1c1712", style:"short"}
  ],
  [ // Brasilien
    {p:"Vinícius Júnior",    num:7,  skin:"#7a4a30", hair:"#161310", style:"curly"},
    {p:"Rodrygo",            num:11, skin:"#8d5a3b", hair:"#161310", style:"short"},
    {p:"Raphinha",           num:19, skin:"#c98a5b", hair:"#161310", style:"curly"},
    {p:"Bruno Guimarães",    num:5,  skin:"#8d5a3b", hair:"#161310", style:"short"},
    {p:"Marquinhos",         num:4,  skin:"#c98a5b", hair:"#161310", style:"short"}
  ],
  [ // Argentinien
    {p:"Lionel Messi",       num:10, skin:"#e8b88a", hair:"#2a2118", style:"short"},
    {p:"Julián Álvarez",     num:9,  skin:"#e8b88a", hair:"#2a2118", style:"short"},
    {p:"Lautaro Martínez",   num:22, skin:"#e8b88a", hair:"#1c1712", style:"short"},
    {p:"Enzo Fernández",     num:24, skin:"#e8b88a", hair:"#2a2118", style:"short"},
    {p:"Alexis Mac Allister",num:20, skin:"#e8b88a", hair:"#3a2a1a", style:"short"}
  ],
  [ // Uruguay
    {p:"Federico Valverde",  num:15, skin:"#c98a5b", hair:"#2a2118", style:"buzz"},
    {p:"Darwin Núñez",       num:9,  skin:"#c98a5b", hair:"#161310", style:"short"},
    {p:"Rodrigo Bentancur",  num:6,  skin:"#e8b88a", hair:"#2a2118", style:"short"},
    {p:"Ronald Araújo",      num:4,  skin:"#c98a5b", hair:"#2a2118", style:"short"},
    {p:"Nicolás De la Cruz", num:10, skin:"#c98a5b", hair:"#161310", style:"short"}
  ],
  [ // Kolumbien
    {p:"Luis Díaz",          num:7,  skin:"#8d5a3b", hair:"#161310", style:"curly"},
    {p:"James Rodríguez",    num:10, skin:"#e8b88a", hair:"#caa55a", style:"short"},
    {p:"Jhon Durán",         num:9,  skin:"#7a4a30", hair:"#161310", style:"buzz"},
    {p:"Jefferson Lerma",    num:8,  skin:"#7a4a30", hair:"#161310", style:"short"},
    {p:"Dávinson Sánchez",   num:23, skin:"#6f4428", hair:"#161310", style:"buzz"}
  ],
  [ // Ecuador
    {p:"Moisés Caicedo",     num:23, skin:"#6f4428", hair:"#161310", style:"short"},
    {p:"Enner Valencia",     num:13, skin:"#7a4a30", hair:"#161310", style:"short"},
    {p:"Kendry Páez",        num:10, skin:"#c98a5b", hair:"#161310", style:"short"},
    {p:"Piero Hincapié",     num:3,  skin:"#c98a5b", hair:"#161310", style:"short"},
    {p:"Pervis Estupiñán",   num:7,  skin:"#6f4428", hair:"#161310", style:"curly"}
  ],
  [ // Japan
    {p:"Takefusa Kubo",      num:11, skin:"#f0d0a8", hair:"#1c1712", style:"short"},
    {p:"Kaoru Mitoma",       num:14, skin:"#f0d0a8", hair:"#1c1712", style:"short"},
    {p:"Daichi Kamada",      num:15, skin:"#f0d0a8", hair:"#1c1712", style:"short"},
    {p:"Ayase Ueda",         num:9,  skin:"#f0d0a8", hair:"#1c1712", style:"short"},
    {p:"Wataru Endō",        num:6,  skin:"#f0d0a8", hair:"#1c1712", style:"buzz"}
  ],
  [ // Südkorea
    {p:"Son Heung-min",      num:7,  skin:"#f0d0a8", hair:"#1c1712", style:"short"},
    {p:"Lee Kang-in",        num:18, skin:"#f0d0a8", hair:"#1c1712", style:"short"},
    {p:"Hwang Hee-chan",     num:11, skin:"#f0d0a8", hair:"#1c1712", style:"short"},
    {p:"Cho Gue-sung",       num:9,  skin:"#f0d0a8", hair:"#1c1712", style:"short"},
    {p:"Kim Min-jae",        num:4,  skin:"#f0d0a8", hair:"#1c1712", style:"buzz"}
  ],
  [ // Australien
    {p:"Mathew Leckie",      num:7,  skin:"#e8b88a", hair:"#3a2a1a", style:"short"},
    {p:"Jackson Irvine",     num:22, skin:"#f0c8a0", hair:"#caa55a", style:"bun"},
    {p:"Mitchell Duke",      num:15, skin:"#e8b88a", hair:"#2a2118", style:"short"},
    {p:"Craig Goodwin",      num:11, skin:"#e8b88a", hair:"#3a2a1a", style:"short"},
    {p:"Harry Souttar",      num:19, skin:"#f0c8a0", hair:"#8a6a3a", style:"short"}
  ],
  [ // Marokko
    {p:"Achraf Hakimi",      num:2,  skin:"#c98a5b", hair:"#161310", style:"short"},
    {p:"Hakim Ziyech",       num:7,  skin:"#c98a5b", hair:"#161310", style:"short"},
    {p:"Youssef En-Nesyri",  num:19, skin:"#c98a5b", hair:"#161310", style:"short"},
    {p:"Brahim Díaz",        num:11, skin:"#c98a5b", hair:"#161310", style:"short"},
    {p:"Sofyan Amrabat",     num:4,  skin:"#c98a5b", hair:"#161310", style:"curly"}
  ],
  [ // Senegal
    {p:"Sadio Mané",         num:10, skin:"#5a3a22", hair:"#161310", style:"buzz"},
    {p:"Iliman Ndiaye",      num:11, skin:"#5a3a22", hair:"#161310", style:"curly"},
    {p:"Nicolas Jackson",    num:9,  skin:"#5a3a22", hair:"#161310", style:"buzz"},
    {p:"Pape Matar Sarr",    num:17, skin:"#5a3a22", hair:"#161310", style:"short"},
    {p:"Kalidou Koulibaly",  num:3,  skin:"#5a3a22", hair:"#161310", style:"buzz"}
  ]
];

/* Das Gesicht eines Landes: der erste Schütze */
function stern(i){ return KADER[i][0]; }

/* ---------- Die Legende jedes Landes ----------
   Grosse Namen aus der Vergangenheit. Sie lässt sich nicht kaufen: wer
   die drei besten Schützen eines Landes freigeschaltet hat, bekommt sie
   geschenkt. Mit 6 Sternen ist sie besser als jeder aktuelle Spieler und
   tritt als erste an. */
const LEGENDEN = [
  {p:"Stéphane Chapuisat", num:9,  skin:"#e8b88a", hair:"#3a2a1a", style:"short"},  // Schweiz
  {p:"Lothar Matthäus",    num:10, skin:"#f0c8a0", hair:"#caa55a", style:"short"},  // Deutschland
  {p:"Hans Krankl",        num:9,  skin:"#e8b88a", hair:"#3a2a1a", style:"short"},  // Österreich
  {p:"Zinédine Zidane",    num:10, skin:"#e0a87a", hair:"#2a2118", style:"buzz"},   // Frankreich
  {p:"Roberto Baggio",     num:10, skin:"#e8b88a", hair:"#6b4a2a", style:"bun"},    // Italien
  {p:"Andrés Iniesta",     num:6,  skin:"#e8b88a", hair:"#3a2a1a", style:"short"},  // Spanien
  {p:"Luís Figo",          num:7,  skin:"#e0a87a", hair:"#2a2118", style:"short"},  // Portugal
  {p:"David Beckham",      num:7,  skin:"#f0c8a0", hair:"#caa55a", style:"short"},  // England
  {p:"Marco van Basten",   num:9,  skin:"#f0c8a0", hair:"#8a6a3a", style:"short"},  // Niederlande
  {p:"Jan Ceulemans",      num:10, skin:"#f0c8a0", hair:"#8a6a3a", style:"short"},  // Belgien
  {p:"Davor Šuker",        num:9,  skin:"#e8b88a", hair:"#3a2a1a", style:"short"},  // Kroatien
  {p:"Michael Laudrup",    num:10, skin:"#f0c8a0", hair:"#caa55a", style:"short"},  // Dänemark
  {p:"Ole Gunnar Solskjær",num:20, skin:"#f0c8a0", hair:"#e8d28a", style:"short"},  // Norwegen
  {p:"Landon Donovan",     num:10, skin:"#e8b88a", hair:"#caa55a", style:"short"},  // USA
  {p:"Dwayne De Rosario",  num:14, skin:"#7a4a30", hair:"#161310", style:"buzz"},   // Kanada
  {p:"Hugo Sánchez",       num:9,  skin:"#c98a5b", hair:"#2a2118", style:"curly"},  // Mexiko
  {p:"Ronaldinho",         num:10, skin:"#8d5a3b", hair:"#161310", style:"bun"},    // Brasilien
  {p:"Diego Maradona",     num:10, skin:"#c98a5b", hair:"#161310", style:"curly"},  // Argentinien
  {p:"Enzo Francescoli",   num:10, skin:"#e8b88a", hair:"#2a2118", style:"short"},  // Uruguay
  {p:"Carlos Valderrama",  num:10, skin:"#c98a5b", hair:"#caa55a", style:"curly"},  // Kolumbien
  {p:"Álex Aguinaga",      num:10, skin:"#c98a5b", hair:"#161310", style:"short"},  // Ecuador
  {p:"Hidetoshi Nakata",   num:7,  skin:"#f0d0a8", hair:"#6b4a2a", style:"short"},  // Japan
  {p:"Cha Bum-kun",        num:11, skin:"#f0d0a8", hair:"#1c1712", style:"short"},  // Südkorea
  {p:"Tim Cahill",         num:4,  skin:"#e8b88a", hair:"#3a2a1a", style:"buzz"},   // Australien
  {p:"Mustapha Hadji",     num:10, skin:"#c98a5b", hair:"#161310", style:"curly"},  // Marokko
  {p:"El Hadji Diouf",     num:11, skin:"#5a3a22", hair:"#161310", style:"short"}   // Senegal
];

/* ---------- Freischalten ----------
   Die drei besten Schützen eines Landes (Kaderplatz 0, 1, 2) sind am
   Anfang gesperrt und kosten Preisgeld. Alle anderen spielen immer mit. */
const GESPERRTE_PLAETZE = [0, 1, 2];
const PREIS_PLATZ = [1200, 800, 400];   // Platz 0 ist der teuerste

function platzGesperrt(platz){ return GESPERRTE_PLAETZE.indexOf(platz) >= 0; }
function platzPreis(platz){ return PREIS_PLATZ[platz] || 0; }

/* Die Legende eines Landes als Spieler-Objekt. Trägt ihre historische
   Nummer — ist die im Kader belegt, weicht sie auf eine freie aus. */
const legendeCache = [];
function legendeVon(i){
  if(legendeCache[i]) return legendeCache[i];
  const roh = LEGENDEN[i];
  if(!roh) return null;
  const belegt = kaderVoll(i).map(s=>s.num);
  let num = roh.num;
  if(belegt.indexOf(num) >= 0){
    for(let k=12; k<40; k++){ if(belegt.indexOf(k) < 0){ num=k; break; } }
  }
  legendeCache[i] = Object.assign({}, roh, {num:num, koennen:6, legende:true});
  return legendeCache[i];
}

/* Der Kader, mit dem tatsächlich angetreten wird.
   frei = Liste der freigeschalteten Kaderplätze (kann leer sein).
   Sind alle drei gesperrten Plätze frei, führt die Legende den Kader an. */
function kaderVerfuegbar(i, frei){
  const offen = Array.isArray(frei) ? frei : [];
  const liste = kaderVoll(i).filter((sp,platz)=>
    !platzGesperrt(platz) || offen.indexOf(platz) >= 0
  );
  const alleDrei = GESPERRTE_PLAETZE.every(platz=>offen.indexOf(platz) >= 0);
  if(alleDrei){
    const leg = legendeVon(i);
    if(leg) return [leg].concat(liste);
  }
  return liste;
}

/* ---------- Der ganze Kader: 11 Schützen pro Land ----------
   Nach den echten Regeln muss jeder Spieler einmal geschossen haben,
   bevor einer zum zweiten Mal antritt. Die fünf bekannten Schützen
   stehen oben; die Plätze 6 bis 11 füllen Kaderspieler, die mit ihrer
   Nummer antreten — echte Namen erfinde ich dafür nicht. */
const KADER_GROESSE = 11;
const ZUSATZ_NUMMERN = [3, 12, 13, 16, 18, 21, 24, 2, 5, 6, 20];
const ZUSATZ_STILE = ["short","short","buzz","curly","short","bun"];

/* Können pro Kaderplatz (1 bis 5 Sterne). Platz 1 ist immer der beste
   Schütze, die Ersatzleute können weniger. Bewusst für alle Länder
   gleich: sonst wäre es unfair, mit einem kleinen Land zu spielen.
   Wirkt nur im Profi-Modus, dort auf den Kraftbalken — im
   Anfänger-Modus bleibt jeder Schuss gleich fair. */
const KOENNEN_PLATZ = [5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 2];

/* Sterne als Text, für die Anzeige beim Schützen */
function sterne(koennen){
  const k = Math.max(1, Math.min(6, koennen||3));
  return k >= 6 ? "★★★★★+" : "★".repeat(k) + "☆".repeat(5-k);
}

const kaderCache = [];
function kaderVoll(i){
  if(kaderCache[i]) return kaderCache[i];
  /* Kopien anlegen und das Können vom Kaderplatz mitgeben — die
     Einträge in KADER bleiben unberührt (stern() nutzt sie auch). */
  const voll = KADER[i].map((sp,k)=>Object.assign({}, sp, {koennen: KOENNEN_PLATZ[k]}));
  const belegt = voll.map(s=>s.num);
  /* Haut- und Haarfarben aus den bekannten Spielern des Landes nehmen,
     damit die Ersatzleute zum Team passen */
  const skins = KADER[i].map(s=>s.skin);
  const haare = KADER[i].map(s=>s.hair);
  let n = 0;
  while(voll.length < KADER_GROESSE){
    /* Nummer suchen, die im Team noch frei ist. Der Startpunkt hängt am
       Land, damit nicht jedes Team dieselben Ersatznummern hat. */
    let versuch = n + i * 3;
    let num = ZUSATZ_NUMMERN[versuch % ZUSATZ_NUMMERN.length];
    const grenze = versuch + ZUSATZ_NUMMERN.length;
    while(belegt.indexOf(num) >= 0 && versuch < grenze){
      versuch++;
      num = ZUSATZ_NUMMERN[versuch % ZUSATZ_NUMMERN.length];
    }
    if(belegt.indexOf(num) >= 0) num = 30 + voll.length;
    belegt.push(num);
    /* Aussehen deterministisch aus Land und Kaderplatz — bleibt gleich */
    const k = voll.length;
    const misch = i*13 + k*7;
    voll.push({
      p: "Nr. " + num,
      num: num,
      skin: skins[misch % skins.length],
      hair: haare[(misch + 2) % haare.length],
      style: ZUSATZ_STILE[(misch + k) % ZUSATZ_STILE.length],
      koennen: KOENNEN_PLATZ[k]
    });
    n++;
  }
  kaderCache[i] = voll;
  return voll;
}

/* Kurzzeichen für den Turnierbaum (gleiche Reihenfolge wie TEAMS) */
const KURZ = [
  "SUI","GER","AUT","FRA","ITA","ESP","POR","ENG",
  "NED","BEL","CRO","DEN","NOR","USA","CAN","MEX",
  "BRA","ARG","URU","COL","ECU","JPN","KOR","AUS",
  "MAR","SEN"
];

/* Spielstärke 0 … 1 — nur für die Simulation der fremden Partien
   im WM-Modus. Meine eigenen Partien schiesse ich selber. */
const STAERKE = [
  0.72, 0.88, 0.70, 0.95, 0.84, 0.93, 0.90, 0.91,
  0.86, 0.80, 0.82, 0.74, 0.73, 0.72, 0.68, 0.70,
  0.93, 0.95, 0.82, 0.80, 0.70, 0.76, 0.72, 0.64,
  0.80, 0.76
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
