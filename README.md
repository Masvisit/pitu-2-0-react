# PITU 2.0

App d'entrenament per a les proves físiques de l'oposició d'Agent Rural.

## Arrencar

```bash
npm install
npm run dev
```

Funciona de seguida amb el pla generat i les marques de partida. Per tenir
l'entrenador que analitza els FIT, segueix `INSTRUCCIONS.md`.

## Com està muntat

- `src/data/agentRuralExercises.js` — les quatre proves oficials, els mínims,
  el material que tens i el que no, i els WODs amb sèries i càrregues reals.
- `src/data/wodProgram.js` — calcula quin WOD toca cada dia. El pla no es
  guarda enlloc: es genera a partir de la data.
- `src/store/planStore.js` — ajunta el pla generat amb el que hi ha a
  Supabase. Si l'entrenador ha ajustat un dia, el seu ajust mana.
- `src/services/coach.js` — crida l'Edge Function i llegeix les taules.
- `src/services/fitResum.js` — treu el resum d'un fitxer FIT.
- `supabase/` — l'esquema de la base de dades i la funció que parla amb
  l'API de Claude.

## Proves

```bash
deno test supabase/functions/coach/regles_test.ts
```
