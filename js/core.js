"use strict";
/* ====================================================================
   core.js — gemeinsame Helfer und Geometrie der Torszene
   Wird als erstes geladen, alle anderen Module bauen darauf auf.
   ==================================================================== */

/* Kurzform für document.getElementById */
const $ = id => document.getElementById(id);

const SVG_NS = "http://www.w3.org/2000/svg";

/* Tor-Geometrie im SVG-Koordinatensystem (viewBox 0 0 600 400) */
const GX = 70, GY = 30, GW = 460, GH = 222;
const CW = GW / 3, CH = GH / 3;

/* Elfmeterpunkt und Ruheposition des Torwarts */
const SPOT = {x: 300, y: 345};
const KEEPER_REF = {x: 300, y: 196};

/* Tastenbelegung: Nummernblock-Layout auf die 9 Zonen */
const KEY2ZONE = {7:0, 8:1, 9:2, 4:3, 5:4, 6:5, 1:6, 2:7, 3:8};

/* Mittelpunkt einer Zone (0 = oben links … 8 = unten rechts) */
function zoneCenterSVG(z){
  const r = Math.floor(z / 3), c = z % 3;
  return {x: GX + c * CW + CW / 2, y: GY + r * CH + CH / 2};
}

/* SVG-Koordinate → Pixel-Position innerhalb der Szene.
   Bewusst über die Layout-Grösse des Szenen-Wrappers und nicht über
   getBoundingClientRect: die Szene ist im Raum gedreht, das gemessene
   Rechteck wäre verzerrt und der Ball würde neben dem Tor landen. */
function s2p(p){
  const el = $("szeneAtem");
  const w = el.offsetWidth || 600;
  const h = el.offsetHeight || w * 400 / 600;
  return {x: p.x * w / 600, y: p.y * h / 400};
}

/* Will der Nutzer wenig Bewegung? Dann bleibt die Kamera still. */
function bewegungReduziert(){
  return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

/* Ziel für einen verrissenen Schuss: knapp neben oder über das Tor.
   Aussenspalten gehen am Pfosten vorbei, die Mitte über die Latte. */
function danebenZiel(z){
  const c=zoneCenterSVG(z), spalte=z%3;
  if(spalte===0) return {x:GX-46, y:c.y-14};
  if(spalte===2) return {x:GX+GW+46, y:c.y-14};
  return {x:c.x+(Math.random()<0.5?-22:22), y:GY-46};
}

/* Zufallszahl 0 … n-1 */
function zufall(n){ return Math.floor(Math.random() * n); }

/* Zufälliges Element aus einem Array */
function zufallAus(arr){ return arr[zufall(arr.length)]; }
