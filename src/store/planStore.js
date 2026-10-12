// =====================================================================
// PITU 2.0 · Estat del pla
//
// El pla es calcula (wodProgram), les marques i el que has fet de debo
// venen de Supabase. Aquest store els ajunta: si l'entrenador ha ajustat
// un dia concret, el seu "previst" mana per sobre del WOD generat.
//
// Sense .env.local l'app funciona igual, amb el pla generat i les
// marques de partida.
// =====================================================================

import { create } from 'zustand';
import { avui, dillunsDe, getSetmana, sumaDies, MARQUES_INICIALS } from '../data/wodProgram.js';
import { hiHaSupabase, marquesVigents, sessionsDeLaSetmana } from '../services/coach.js';

/** Les files de marques de Supabase, en el format que fa servir el pla. */
function aMarques(files) {
  const m = { ...MARQUES_INICIALS };
  for (const f of files ?? []) {
    m[f.prova] = { valor: Number(f.valor), data: f.data };
  }
  return m;
}

export const usePlanStore = create((set, get) => ({
  connectat: hiHaSupabase,
  carregant: false,
  errorCarrega: null,

  /** Dilluns de la setmana que s'esta mirant. */
  setmanaVista: dillunsDe(avui()),

  marques: MARQUES_INICIALS,

  /** Files de la taula sessions, indexades per data. */
  sessions: {},

  /** Els set dies de la setmana vista, amb el WOD ja resolt. */
  dies: () => {
    const { setmanaVista, sessions } = get();
    return getSetmana(setmanaVista).map((d) => {
      const fila = sessions[d.data];
      if (!fila) return d;
      // Un "previst" no buit vol dir que l'entrenador ha ajustat el dia.
      const ajustat = fila.previst && Object.keys(fila.previst).length > 0;
      return {
        ...d,
        completada: Boolean(fila.completada),
        realitzat: fila.realitzat ?? null,
        notes: fila.notes ?? '',
        ajustat,
        wod: ajustat ? { ...d.wod, ...fila.previst } : d.wod,
      };
    });
  },

  /** El dia d'avui, amb tot el que se'n sap. */
  avuiResolt: () => {
    const d = get().dies().find((x) => x.data === avui());
    return d ?? getSetmana(avui()).find((x) => x.data === avui());
  },

  canviaSetmana: (saltSetmanes) => {
    set({ setmanaVista: sumaDies(get().setmanaVista, saltSetmanes * 7) });
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
      const [files, marq] = await Promise.all([
        sessionsDeLaSetmana(usuari, dl, sumaDies(dl, 6)),
        marquesVigents(usuari),
      ]);
      const perData = {};
      for (const f of files) perData[f.data] = f;
      set({ sessions: perData, marques: aMarques(marq), carregant: false });
    } catch (e) {
      set({ carregant: false, errorCarrega: String(e.message ?? e) });
    }
  },
}));
