// =====================================================================
// PITU 2.0 · Generador del pla d'entrenament
//
// El pla no es guarda: es calcula. Per a una data qualsevol sap quina
// prova toca i quin WOD, a partir de la fase del programa. Si
// l'entrenador ajusta un dia concret, aquell ajust viu a Supabase i
// mana per sobre d'aixo (ho resol el planStore).
// =====================================================================

import { PROVES, SAUNA, wodDe } from './agentRuralExercises.js';

/** Dilluns en que arrenca el programa. */
export const INICI_PROGRAMA = '2026-10-12';

/** Dates que vas fixar tu; no hi ha convocatoria publicada. */
export const DATA_TEORIC = '2027-04-15';
export const DATA_PROVES_FISIQUES = '2027-08-15';

/** Marques de partida, per si Supabase encara es buit. */
export const MARQUES_INICIALS = {
  navette: { valor: 6, data: '2026-09-10' },
  piscina: { valor: 43, data: '2026-08-12' },
  press_banca: { valor: 22, data: '2026-09-20' },
  circuit_agilitat: null,
};

/**
 * Repartiment setmanal. Sis dies de feina i un de descans.
 *
 * La navette i el press banca surten dos cops cadascun: son els dos
 * forats grossos, Sector 6 contra un minim de 9 i 22 repeticions
 * contra 28. La piscina ja la passes, aixi que fa de dia suau entre
 * dues sessions dures i segueix sortint com a bloc final de les altres.
 *
 * Els assaigs de castells s'han acabat. Si hi tornes, posa
 * { castells: true } al dia que toqui i el pla no et demanara res mes
 * aquell dia.
 */
export const SETMANA = {
  1: { prova: 'navette' },
  2: { prova: 'press_banca' },
  3: { prova: 'piscina' },
  4: { prova: 'navette' },
  5: { prova: 'press_banca' },
  6: { prova: 'circuit_agilitat' },
  0: { descans: true },
};

const DIES = ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];
const DIES_CURT = ['dg', 'dl', 'dm', 'dc', 'dj', 'dv', 'ds'];

// ---------------------------------------------------------------------
// Dates. Tot en UTC per no ballar un dia segons l'hora.
// ---------------------------------------------------------------------

function aData(iso) {
  return new Date(iso + 'T00:00:00Z');
}

function aISO(d) {
  return d.toISOString().slice(0, 10);
}

export function sumaDies(iso, dies) {
  const d = aData(iso);
  d.setUTCDate(d.getUTCDate() + dies);
  return aISO(d);
}

/** El dilluns de la setmana d'aquesta data. */
export function dillunsDe(iso) {
  const d = aData(iso);
  const dia = d.getUTCDay() || 7;
  return sumaDies(iso, 1 - dia);
}

export function diesEntre(desde, fins) {
  return Math.round((aData(fins) - aData(desde)) / 86400000);
}

export function nomDelDia(iso) {
  return DIES[aData(iso).getUTCDay()];
}

export function diaCurt(iso) {
  return DIES_CURT[aData(iso).getUTCDay()];
}

export function avui() {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------
// Fases
// ---------------------------------------------------------------------

/** Setmana del programa, comptant des de 1. */
export function setmanaDelPrograma(iso) {
  const d = diesEntre(dillunsDe(INICI_PROGRAMA), dillunsDe(iso));
  return Math.floor(d / 7) + 1;
}

/** Les 12 setmanes es reparteixen en tres fases. */
export function faseDe(setmana) {
  const dins = ((setmana - 1) % 12) + 1;
  if (dins <= 5) return 'base';
  if (dins <= 10) return 'intensify';
  return 'taper';
}

export const NOM_FASE = {
  base: 'Base',
  intensify: 'Intensificació',
  taper: 'Afinament',
};

export function setmanesFinsLesProves(iso = avui()) {
  return Math.max(0, Math.ceil(diesEntre(iso, DATA_PROVES_FISIQUES) / 7));
}

export function setmanesFinsAlTeoric(iso = avui()) {
  return Math.max(0, Math.ceil(diesEntre(iso, DATA_TEORIC) / 7));
}

// ---------------------------------------------------------------------
// El WOD d'un dia
// ---------------------------------------------------------------------

/**
 * Que toca el dia `iso`.
 * @returns {{data: string, dia: string, diaCurt: string, setmana: number,
 *            fase: string, castells: boolean, descans: boolean,
 *            prova: string|null, wod: object|null, sauna: object|null}}
 */
export function getWODForDate(iso) {
  const setmana = setmanaDelPrograma(iso);
  const fase = faseDe(setmana);
  const plantilla = SETMANA[aData(iso).getUTCDay()] ?? {};

  const base = {
    data: iso,
    dia: nomDelDia(iso),
    diaCurt: diaCurt(iso),
    setmana,
    fase,
    castells: Boolean(plantilla.castells),
    descans: Boolean(plantilla.descans),
    prova: null,
    wod: null,
    sauna: null,
  };

  if (plantilla.castells || plantilla.descans) {
    return { ...base, wod: wodDe(null, 'qualsevol') };
  }

  // El diumenge alterna segons la paritat de la setmana, per no fer
  // sempre el mateix i donar mes volum al press banca.
  let prova = plantilla.prova ?? null;
  if (plantilla.alterna && setmana % 2 === 0) prova = plantilla.alterna;
  if (!prova) return base;

  return {
    ...base,
    prova,
    wod: wodDe(prova, fase),
    sauna: SAUNA[prova] ?? null,
  };
}

/** Els set dies d'una setmana, de dilluns a diumenge. */
export function getSetmana(iso = avui()) {
  const dl = dillunsDe(iso);
  return Array.from({ length: 7 }, (_, i) => getWODForDate(sumaDies(dl, i)));
}

// ---------------------------------------------------------------------
// Distancia als minims oficials
// ---------------------------------------------------------------------

/**
 * Com vas en una prova respecte al minim oficial.
 * @param {string} provaId
 * @param {number|null} marca
 */
export function estatDeLaProva(provaId, marca) {
  const p = PROVES[provaId];
  if (!p) return null;
  if (marca === null || marca === undefined) {
    return { prova: p, marca: null, minim: p.minim, passa: false, buit: null, senseMarca: true };
  }
  const passa = p.mesEsMillor ? marca >= p.minim : marca <= p.minim;
  const buit = p.mesEsMillor ? p.minim - marca : marca - p.minim;
  return {
    prova: p,
    marca,
    minim: p.minim,
    passa,
    buit: Math.max(0, Math.round(buit * 10) / 10),
    senseMarca: false,
  };
}

/** Quantes proves passes ara mateix, de les quatre. */
export function resumDeMinims(marques) {
  const estats = Object.keys(PROVES).map((id) =>
    estatDeLaProva(id, marques?.[id]?.valor ?? null),
  );
  return {
    estats,
    passades: estats.filter((e) => e.passa).length,
    total: estats.length,
    senseMarca: estats.filter((e) => e.senseMarca).length,
  };
}
