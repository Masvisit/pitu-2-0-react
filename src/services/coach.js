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

/** Puja o actualitza la sessió del dia abans de demanar-ne l'anàlisi. */
export async function guardaSessio(usuari, { data, prova, previst, realitzat, notes, fitxer_fit }) {
  if (!hiHaSupabase) return false;
  const { error } = await supabase.from('sessions').upsert({
    usuari, data, prova, previst, realitzat, notes, fitxer_fit,
    completada: true,
    actualitzat_el: new Date().toISOString(),
  }, { onConflict: 'usuari,data' });
  return !error;
}
