# ⚽ Elfmeterschiessen — WM 2026

Ein Elfmeterschiessen-Spiel für den Browser. Läuft auf dem Tablet, am Handy
und am Computer. Kein Download, keine Installation.

**Hier spielen:** https://chventura.github.io/fussballWM/
*(Platzhalter — die Adresse gilt, sobald GitHub Pages für dieses Repo
eingeschaltet ist: Settings → Pages → Branch `main`, Ordner `/root`.)*

---

## So wird gespielt

Beim Elfmeter gibt es immer zwei Rollen: **Torwart** und **Schütze**.
Das Tor ist in **9 Felder** aufgeteilt — wie ein Fenster mit neun Scheiben.

```
 7  8  9      ← oben
 4  5  6      ← Mitte
 1  2  3      ← unten
```

1. Der **Torwart** wählt zuerst **3 Felder** aus. Die merkt er sich heimlich,
   der Schütze darf nicht hinschauen! Für jedes gewählte Feld erscheint ein
   Sternchen ✱ — so weiss der Torwart, wie viele er schon hat.
2. Dann wählt der **Schütze 1 Feld** und schiesst.
3. Trifft der Schütze ein Feld, das der Torwart abgedeckt hat → **gehalten!**
   Ist das Feld frei → **Tooor!** 🎉

Jede Mannschaft schiesst **5 Mal**. Wer mehr Tore hat, gewinnt. Steht es
danach gleich, geht es weiter bis einer trifft und der andere nicht
(das heisst **Sudden Death** — plötzlicher Tod).

## Wie man wählt

- **Auf dem Tablet:** einfach auf das Feld im Tor **tippen**.
- **Mit Tastatur:** die Zahlen **1 bis 9** drücken (siehe Bild oben).
  Der Torwart nimmt besser die Tastatur — dann sieht niemand, was er wählt.
- **Weiter** geht es mit dem Knopf *Weiter* oder mit der **Eingabetaste**.
  Wartet man einfach, geht es von selber weiter.
- Der Knopf 🔊 oben rechts schaltet den Ton an und aus.

## Die drei Spielarten

### 1. Zwei Spieler am gleichen Gerät
Ihr spielt gegeneinander. Einer ist Torwart, der andere Schütze — und nach
jedem Schuss wird gewechselt. Wichtig: **Wegschauen**, wenn der andere
seine Felder wählt!

### 2. Ein Spieler gegen Computer
Du spielst allein. Der Computer ist abwechselnd Torwart und Schütze.

### 3. Weltmeisterschaft 🏆
Das grosse Turnier:

- Du wählst **dein Land**. Der Computer lost **16 Mannschaften** aus —
  du bist immer dabei.
- Es geht los im **Achtelfinal**. Wer verliert, ist draussen.
- **Deine** Partien schiesst du selber. Die anderen Partien rechnet der
  Computer aus — die Resultate siehst du im **Turnierbaum**. Dein Weg ist
  **golden** markiert.
- Von Runde zu Runde werden die Gegner besser: im Halbfinal und im Final
  deckt der Torwart manchmal **4 Felder** ab statt 3, und er merkt sich,
  in welche Ecke du am liebsten schiesst. Schiess also nicht immer gleich!
- Ab dem Halbfinal **wackelt das Zielkreuz** — die Anspannung ist gross.
- Kann ein Schuss die Partie entscheiden, läuft der Ball in **Zeitlupe**.
- Gewinnst du den Final, gibt es die **Pokalübergabe** mit goldenem
  WM-Pokal und Konfetti. Wirst du vorher ausgeschieden, siehst du, wie weit
  du gekommen bist und wer Weltmeister geworden ist.

### Turnier über mehrere Tage
Der Turnierstand wird im Browser gespeichert. Wenn du das Spiel später
wieder aufmachst, fragt es: **weiterspielen oder neues Turnier?**

Wichtig: gespeichert wird nach jeder fertigen Partie. Wer mitten in einer
Partie aufhört, muss diese eine Partie neu beginnen. Und: der Stand liegt
in dem Browser, in dem gespielt wurde — auf einem anderen Gerät ist er
nicht da.

## Kleine Extras

- Jedes Land spielt mit seinem bekanntesten Schützen im Heimtrikot.
- Die Zuschauer tragen die Farben der zwei Mannschaften — und alle paar
  Sekunden läuft eine **La-Ola** durch das Stadion.
- Manchmal rennt ein **Flitzer** über den Platz.
- Der Ball fliegt mit **Effet**: er dreht leicht in die Richtung, in die
  geschossen wird.

---

## Für Technik-Interessierte

Statische Website ohne Build-Schritt und ohne Framework. Einzige externe
Abhängigkeit sind die Google Fonts; fallen sie aus, greift die
Systemschrift und das Spiel läuft weiter. Alle Grafiken sind Inline-SVG,
alle Töne werden zur Laufzeit über die Web Audio API erzeugt — es gibt
keine Bild- und keine Audiodateien.

```
index.html          Aufbau der Seite und die Torszene als SVG
css/style.css       Gestaltung und alle CSS-Animationen
js/core.js          Helfer und Geometrie des Tors
js/teams.js         Länder, Schützen, Flaggen, Spielstärken
js/audio.js         Töne über die Web Audio API
js/figuren.js       Spielerfiguren und WM-Pokal
js/effekte.js       Kulisse, Ballflug, Konfetti, Zielkreuz
js/turnier.js       WM-Modus: Auslosung, Simulation, Turnierbaum
js/game.js          Spielablauf und Bildschirmwechsel
archiv/             die ursprüngliche Einzeldatei
```

Die Skripte werden in dieser Reihenfolge geladen — sie ist relevant, weil
es klassische Skripte sind (keine ES-Module). Dadurch läuft die Seite auch
per Doppelklick direkt von der Festplatte.

Weitere Regeln für die Weiterentwicklung stehen in [CLAUDE.md](CLAUDE.md).
