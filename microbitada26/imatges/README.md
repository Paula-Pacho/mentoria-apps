# Imatges de la gimcana

Aquí van totes les fotos que fa servir `microbitada.html`, amb un nom que segueix aquest patró perquè el codi les trobi automàticament (definit a `INTRO_IMAGES` i `GAME_FLOW` dins `microbitada.html`):

| Prefix | Quan es veu | Exemple |
|---|---|---|
| `P1`, `P2`, `P3` | Abans de prémer el botó START, amb el cronòmetre encara aturat | `P1.jpg` |
| `R{n}_{i}` | Imatges de pistes del repte número `n` (1 a 5), abans d'arribar al seu candau; `i` és l'ordre dins d'aquell repte | `R1_1.jpg`, `R1_2.jpg`, `R2_3.jpg` |
| `F1` | Es mostra quan el grup resol el repte 5 i acaba la gimcana amb èxit | `F1.jpg` |
| `F0` | Es mostra quan el grup acaba prement el botó d'emergència "Acaba la micro:bitada!" abans de resoldre el repte 5 | `F0.jpg` |
| `_N2` (sufix, opcional) | Variant de qualsevol de les anteriors per al **Nivell 2** de dificultat. Si no existeix, el joc mostra automàticament la imatge normal (Nivell 1) | `R1_2_N2.jpg`, `P1_N2.jpg` |

Notes:

- Extensió `.jpg` sempre en minúscules.
- Nombre d'imatges per repte: actualment 3 per als reptes 1-4 i 4 per al repte 5 (`R5_1` a `R5_4`), però no cal que tots els reptes en tinguin les mateixes: cada repte porta la seva pròpia llista dins `GAME_FLOW`.
- Les imatges `_N2` són opcionals una a una: només cal crear-les per a les imatges que es vulguin diferenciar en Nivell 2; si en falta alguna, el joc cau automàticament a la imatge normal (Nivell 1) sense avisar ni trencar-se.
- `F0` i `F1` no tenen variant `_N2` (la imatge final és la mateixa per a tots dos nivells).

Si el dia de demà cal afegir o treure imatges d'un repte, o afegir-ne un de nou, només cal editar la llista `images` d'aquell repte a `GAME_FLOW` (dins `microbitada.html`) i pujar els fitxers amb el nom corresponent aquí — no cal tocar cap altra part del codi.
