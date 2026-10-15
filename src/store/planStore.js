// =====================================================================
// PITU 2.0 · Estat del pla
//
// El pla es calcula (wodProgram), no es desa. El que sí que es desa és
// el que se n'aparta: les excepcions (dies moguts o trets) i les
// sessions que has fet de debò.
//
// Sense .env.local l'app funciona igual, amb el pla generat i les
// marques de partida.
// =====================================================================

import { create } from 'zustand';
import { avui, dillunsDe, getSetmana, getWODForDate, sumaDies, MARQUES_INICIALS } from '../data/wodProgram.js';
import {
  hiHaSupabase, marquesVigents, sessionsDeLaSetmana,
  excepcionsPla, desaExcepcio, esborraExcepcio,
} from '../services/coach.js';

function aMarques(files) {
  const m = { ...MARQUES_INICIALS };
  for (const f of files ?? []) m[f.prova] = { valor: Number(f.valor), data: f.data };
  return m;
}

export const usePlanStore = create((set, get) => ({
  connectat: hiHaSupabase,
  carregant: false,
  errorCarrega: null,

  setmanaVista: dillunsDe(avui()),
  marques: MARQUES_INICIALS,

  /** Sessions fetes, agrupades per data: una data pot tenir-ne diverses. */
  sessions: {},

  /** Excepcions al pla, indexades per data. */
  excepcions: {},

  /**
   * Què toca un dia, després d'aplicar les excepcions.
   * Sense excepció, el que digui el càlcul.
   */
  resol: (iso) => {
    const generat = getWODForDate(iso);
    const e = get().excepcions[iso];
    if (!e) return generat;
    if (e.estat === 'eliminat') {
      return { ...generat, prova: null, wod: null, sauna: null, tret: true };
    }
    return {
      ...generat,
      prova: e.prova ?? generat.prova,
      wod: e.wod ?? generat.wod,
      mogut_de: e.origen ?? null,
      // Sense origen vol dir que no ve d'enlloc: l'ha ajustat l'entrenador.
      ajustat: !e.origen,
    };
  },

  /** Els set dies de la setmana vista, amb excepcions i sessions fetes. */
  dies: () => {
    const { sessions, resol } = get();
    return getSetmana(get().setmanaVista).map((d) => {
      const base = resol(d.data);
      const fetes = sessions[d.data] ?? [];
      return {
        ...base,
        fetes,
        completada: fetes.some((f) => f.completada),
        notes: fetes.map((f) => f.notes).filter(Boolean).join(' · '),
      };
    });
  },

  avuiResolt: () => get().dies().find((x) => x.data === avui()) ?? getWODForDate(avui()),

  canviaSetmana: (salt) => {
    set({ setmanaVista: sumaDies(get().setmanaVista, salt * 7) });
    get().carrega();
  },

  vesAAvui: () => {
    set({ setmanaVista: dillunsDe(avui()) });
    get().carrega();
  },

  carrega: async (usuari = 'alex') => {
    if (!hiHaSupabase) return;
    set({ carregant: true, errorCarrega: null });
    try {
      const dl = get().setmanaVista;
      const diumenge = sumaDies(dl, 6);
      const [files, marq, exc] = await Promise.all([
        sessionsDeLaSetmana(usuari, dl, diumenge),
        marquesVigents(usuari),
        excepcionsPla(usuari, dl, diumenge),
      ]);
      const perData = {};
      for (const f of files) (perData[f.data] ??= []).push(f);
      set({ sessions: perData, marques: aMarques(marq), excepcions: exc, carregant: false });
    } catch (e) {
      set({ carregant: false, errorCarrega: String(e.message ?? e) });
    }
  },

  // -------------------------------------------------------------------
  // Moure, treure i restaurar
  // -------------------------------------------------------------------

  /**
   * Mou el que toca el dia `origen` al dia `desti`.
   * Si el destí ja té feina, se les intercanvia: així la setmana manté
   * la mateixa càrrega total, que és el que té sentit en un pla.
   */
  mou: async (origen, desti, usuari = 'alex') => {
    if (origen === desti) return;
    const a = get().resol(origen);
    const b = get().resol(desti);

    if (b.wod && !b.tret) {
      await desaExcepcio(usuari, desti, { estat: 'substituit', prova: a.prova, wod: a.wod, origen });
      await desaExcepcio(usuari, origen, { estat: 'substituit', prova: b.prova, wod: b.wod, origen: desti });
    } else {
      await desaExcepcio(usuari, desti, { estat: 'substituit', prova: a.prova, wod: a.wod, origen });
      await desaExcepcio(usuari, origen, { estat: 'eliminat' });
    }
    await get().carrega(usuari);
  },

  treu: async (data, usuari = 'alex') => {
    await desaExcepcio(usuari, data, { estat: 'eliminat' });
    await get().carrega(usuari);
  },

  restaura: async (data, usuari = 'alex') => {
    await esborraExcepcio(usuari, data);
    await get().carrega(usuari);
  },
}));
