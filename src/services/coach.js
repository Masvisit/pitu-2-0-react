// =====================================================================
// PITU 2.0 · Servei de l'entrenador
//
// Aquest mòdul NO sap res del teu store. Rep i torna objectes plans,
// així que funciona igual amb trainingStore.js, store.js o el que
// vingui després. L'únic punt que toca el teu store és l'adaptador
// que crides des de IACoachPage (hi ha un exemple a INSTRUCCIONS.md).
// =====================================================================

import { createClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Si encara no has posat el .env.local, l'app ha de funcionar igual:
 *  ensenya el pla generat i les marques de partida, sense entrenador. */
export const hiHaSupabase = Boolean(URL && ANON);

export const supabase = hiHaSupabase ? createClient(URL, ANON) : null;

function sense() {
  return { data: null, error: { message: "Supabase no configurat" } };
}

export { resumFIT } from './fitResum.js';

// ---------------------------------------------------------------------
// La crida a l'entrenador
// ---------------------------------------------------------------------

/**
 * Envia una activitat a l'entrenador. La clau de l'API no és aquí:
 * viu dins de l'Edge Function.
 *
 * @param {string} usuari
 * @param {object} activitat  el resum de resumFIT()
 * @param {string} notes      les teves sensacions, opcional
 * @returns {Promise<{ok: boolean, text?: string, accions?: string[], error?: string}>}
 */
export async function analitzaSessio(usuari, activitat, notes = '') {
  if (!hiHaSupabase) return { ok: false, error: "Falta configurar el .env.local" };
  const { data, error } = await supabase.functions.invoke('coach', {
    body: { usuari, activitat, notes },
  });
  if (error) return { ok: false, error: error.message };
  return data;
}

// ---------------------------------------------------------------------
// Lectures per a la interfície
// ---------------------------------------------------------------------

export async function sessionsDeLaSetmana(usuari, dilluns, diumenge) {
  if (!hiHaSupabase) return [];
  const { data } = await supabase.from('sessions').select('*')
    .eq('usuari', usuari).gte('data', dilluns).lte('data', diumenge)
    .order('data', { ascending: true });
  return data ?? [];
}

export async function analisiDelDia(usuari, data) {
  if (!hiHaSupabase) return null;
  const { data: files } = await supabase.from('analisis').select('*')
    .eq('usuari', usuari).eq('data_sessio', data)
    .order('creat_el', { ascending: false }).limit(1);
  return files?.[0] ?? null;
}

/**
 * L'últim VO2max, running index i càrrega que vas apuntar, i quan.
 * Serveix per ensenyar-te "última: 53 · fa 6 dies" i que no se t'oblidi
 * actualitzar-los, sense que l'app arrossegui mai un valor vell fent-lo
 * passar per nou.
 */
export async function ultimesMetriques(usuari) {
  if (!hiHaSupabase) return null;
  const { data } = await supabase.from('sessions').select('data, realitzat')
    .eq('usuari', usuari).order('data', { ascending: false }).limit(40);
  for (const fila of data ?? []) {
    const r = fila.realitzat ?? {};
    if (r.vo2max || r.running_index || r.carrega) {
      return {
        data: fila.data,
        vo2max: r.vo2max ?? null,
        running_index: r.running_index ?? null,
        carrega: r.carrega ?? null,
      };
    }
  }
  return null;
}

/** Totes les sessions desades d'un dia. Ara en poden ser diverses. */
export async function sessionsDelDia(usuari, data) {
  if (!hiHaSupabase) return [];
  const { data: files } = await supabase.from('sessions').select('*')
    .eq('usuari', usuari).eq('data', data).order('id', { ascending: true });
  return files ?? [];
}

/** Les anotacions que l'entrenador va escriure aquell dia. */
export async function diariDelDia(usuari, data) {
  if (!hiHaSupabase) return [];
  const { data: files } = await supabase.from('diari').select('*')
    .eq('usuari', usuari)
    .gte('creat_el', `${data}T00:00:00`)
    .lte('creat_el', `${data}T23:59:59`)
    .order('creat_el', { ascending: true });
  return files ?? [];
}

/**
 * L'historial d'anàlisis, del més recent cap enrere.
 * Això ja està desat: llegir-ho no costa ni un cèntim d'API.
 */
export async function historialAnalisis(usuari, limit = 60) {
  if (!hiHaSupabase) return [];
  const { data } = await supabase.from('analisis')
    .select('id, data_sessio, veredicte, text, creat_el')
    .eq('usuari', usuari).order('data_sessio', { ascending: false }).limit(limit);
  return data ?? [];
}

export async function diariRecent(usuari, limit = 10) {
  if (!hiHaSupabase) return [];
  const { data } = await supabase.from('diari').select('*')
    .eq('usuari', usuari).order('creat_el', { ascending: false }).limit(limit);
  return data ?? [];
}

export async function marquesVigents(usuari) {
  if (!hiHaSupabase) return [];
  const { data } = await supabase.from('v_marca_vigent').select('*').eq('usuari', usuari);
  return data ?? [];
}

export async function canvisPendents(usuari) {
  if (!hiHaSupabase) return [];
  const { data } = await supabase.from('canvis_pendents').select('*')
    .eq('usuari', usuari).eq('estat', 'pendent').order('creat_el', { ascending: false });
  return data ?? [];
}

/** Aprova o rebutja un canvi gran. Només s'aplica si l'aproves tu. */
export async function resolCanvi(id, aprovat) {
  if (!hiHaSupabase) return false;
  const { error } = await supabase.from('canvis_pendents')
    .update({ estat: aprovat ? 'aprovat' : 'rebutjat', resolt_el: new Date().toISOString() })
    .eq('id', id);
  return !error;
}

export async function preguntesObertes(usuari) {
  if (!hiHaSupabase) return [];
  const { data } = await supabase.from('preguntes').select('*')
    .eq('usuari', usuari).is('resposta', null).order('creat_el', { ascending: false });
  return data ?? [];
}

export async function responPregunta(id, resposta) {
  if (!hiHaSupabase) return false;
  const { error } = await supabase.from('preguntes')
    .update({ resposta, resposta_el: new Date().toISOString() }).eq('id', id);
  return !error;
}

/**
 * Desa una sessió. Ara se'n poden fer més d'una el mateix dia: piscina
 * al matí i pesos a la tarda ja no es trepitgen.
 *
 * Si ve d'un fitxer FIT, primer treu qualsevol sessió del mateix dia
 * que vingui del mateix fitxer, perquè tornar a pujar el mateix FIT no
 * et dupliqui la sessió.
 */
export async function guardaSessio(usuari, { data, prova, previst, realitzat, notes, fitxer_fit }) {
  if (!hiHaSupabase) return false;

  if (fitxer_fit) {
    await supabase.from('sessions').delete()
      .eq('usuari', usuari).eq('data', data).eq('fitxer_fit', fitxer_fit);
  }

  const { error } = await supabase.from('sessions').insert({
    usuari, data, prova, previst, realitzat, notes, fitxer_fit,
    completada: true,
    actualitzat_el: new Date().toISOString(),
  });
  return !error;
}

// ---------------------------------------------------------------------
// Excepcions al pla
//
// El calendari es calcula a partir de la data. Aqui nomes s'hi guarda
// el que se n'aparta, de manera que un dia sense fila segueix anant com
// sempre i "tornar al pla" es simplement esborrar la fila.
// ---------------------------------------------------------------------

export async function excepcionsPla(usuari, desde, fins) {
  if (!hiHaSupabase) return {};
  const { data } = await supabase.from('pla_excepcions').select('*')
    .eq('usuari', usuari).gte('data', desde).lte('data', fins);
  const per = {};
  for (const e of data ?? []) per[e.data] = e;
  return per;
}

export async function desaExcepcio(usuari, data, { estat, prova = null, wod = null, origen = null }) {
  if (!hiHaSupabase) return false;
  const { error } = await supabase.from('pla_excepcions')
    .upsert({ usuari, data, estat, prova, wod, origen }, { onConflict: 'usuari,data' });
  return !error;
}

export async function esborraExcepcio(usuari, data) {
  if (!hiHaSupabase) return false;
  const { error } = await supabase.from('pla_excepcions').delete()
    .eq('usuari', usuari).eq('data', data);
  return !error;
}
