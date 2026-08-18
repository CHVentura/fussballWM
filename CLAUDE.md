# CLAUDE.md — Regeln für dieses Projekt

Elfmeterschiessen-Spiel für Kinder (6 und 9 Jahre), gespielt vor allem auf dem Tablet.
Statische Website, lauffähig über GitHub Pages.

## Sprache

- Sprache im Spiel und in der Doku: **Schweizer Hochdeutsch**
- **Kein ß** — immer `ss` (also "Schiessen", "Grösse", "Strasse")
- Umlaute immer als Umlaut schreiben (ä/ö/ü), nie ae/oe/ue
- Zahlen: Tausendertrennzeichen `1'000`, Dezimaltrennzeichen `1.5`
- Texte im Spiel einfach halten — die Zielgruppe ist 6 bis 9 Jahre alt

## Git

- Nach jeder Änderung committen und pushen
- Pro Ausbauphase ein eigener Commit, damit Zwischenstände getestet werden können
- Commit-Meldungen auf Deutsch, kurz und sachlich

## Struktur und Betrieb

- Das Spiel muss **immer über `index.html` im Root** spielbar bleiben (GitHub Pages)
- Aufteilung: `index.html`, `css/style.css`, `js/*.js`
- Ladereihenfolge der Skripte in `index.html` ist relevant (klassische Skripte,
  keine ES-Module — damit die Seite auch per Doppelklick von der Festplatte läuft)
- Alte Fassungen liegen unter `archiv/` und werden nicht mehr angepasst

## Abhängigkeiten

- **Keine externen Abhängigkeiten ausser Google Fonts**
- Kein Build-Schritt, kein npm, kein Framework, kein CDN-Skript
- Alles muss offline-nah als statische Seite laufen — fällt Google Fonts aus,
  greift die Fallback-Schrift und das Spiel funktioniert weiter
- Grafik ausschliesslich als Inline-SVG oder CSS, keine Bilddateien
- Ton ausschliesslich über die Web Audio API, keine Audiodateien

## Tablet-Tauglichkeit

- Touch-Bedienung: alle Aktionen müssen mit einem Fingertipp erreichbar sein
- **Keine Hover-Abhängigkeit** — Hover ist nur Zusatz, nie die einzige Rückmeldung
- Tap-Flächen mindestens rund 44 px
- Querformat optimiert; Hochformat muss benutzbar bleiben
- Kein Doppeltipp-Zoom auf Spielflächen (`touch-action: manipulation`)

## Qualität

- **Bestehende Funktionen dürfen nie kaputtgehen**
- Nach jeder Phase alle Modi gedanklich durchtesten:
  1. 2 Spieler am gleichen Gerät (Torwart wählt verdeckt 3 Zonen, Schütze 1 Zone)
  2. 1 Spieler gegen Computer (beide Rollen wechseln korrekt)
  3. Geldmeisterschaft (Turnierbaum, Speichern/Weiterspielen, Titel und Ausscheiden)
  - dazu: Sudden Death, Sound an/aus, Tastatur 1–9, Klick/Tipp auf Zonen,
    Neues Spiel, Tablet-Querformat
- Performance im Blick behalten (ältere Tablets): CSS-Animationen bevorzugen,
  `requestAnimationFrame` statt Timer-Kaskaden, keine Dauerlast im Hintergrund
- `prefers-reduced-motion` respektieren
