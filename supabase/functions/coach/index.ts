// =====================================================================
// PITU 2.0 · Edge Function "coach"
//
// Aquí viu la clau de l'API de Claude. No surt mai al navegador.
// La funció munta el document d'estat des de la base de dades, el passa
// a Claude amb les 7 eines, i valida cada crida abans d'aplicar-la.
// =====================================================================

import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import { SYSTEM_PROMPT, TOOLS } from './prompt.ts';
import { setmanaISO, validaEvidencia } from './regles.ts';

const MODEL = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-opus-5';
const API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// ---------------------------------------------------------------------
// Utilitats
// ---------------------------------------------------------------------

function fa(dies: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - dies);
  return d.toISOString().slice(0, 10);
}

function dins(dies: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + dies);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------
// 1. Muntar el document d'estat des de la base de dades
// ---------------------------------------------------------------------

async function muntaEstat(usuari: string) {
  const [perfil, marques, histMarques, recents, antigues, pla, diari, preguntes, ajustos, pendents] =
    await Promise.all([
      db.from('perfil').select('*').eq('usuari', usuari).maybeSingle(),
      db.from('v_marca_vigent').select('*').eq('usuari', usuari),
      db.from('marques').select('prova,valor,unitat,data').eq('usuari', usuari)
        .gte('data', fa(365)).order('data', { ascending: true }),
      db.from('sessions').select('*').eq('usuari', usuari)
        .gte('data', fa(42)).lte('data', fa(0)).order('data', { ascending: true }),
      db.from('sessions').select('data,prova,completada,realitzat').eq('usuari', usuari)
        .lt('data', fa(42)).gte('data', fa(365)).order('data', { ascending: true }),
      db.from('sessions').select('data,prova,previst,completada').eq('usuari', usuari)
        .gt('data', fa(0)).lte('data', dins(28)).order('data', { ascending: true }),
      db.from('diari').select('prova,observacio,que_vigila,creat_el').eq('usuari', usuari)
        .order('creat_el', { ascending: false }).limit(25),
      db.from('preguntes').select('text,per_que,resposta,creat_el').eq('usuari', usuari)
        .order('creat_el', { ascending: false }).limit(15),
      db.from('ajustos').select('prova,data_sessio,motiu,aplicat_el').eq('usuari', usuari)
        .gte('aplicat_el', fa(30)).order('aplicat_el', { ascending: false }),
      db.from('canvis_pendents').select('abast,motiu,fase,creat_el').eq('usuari', usuari)
        .eq('estat', 'pendent'),
    ]);

  // Tot el que és més antic de sis setmanes, comprimit a agregats setmanals.
  const perSetmana: Record<string, { n: number; completades: number; proves: Set<string> }> = {};
  for (const s of antigues.data ?? []) {
    const k = setmanaISO(s.data);
    perSetmana[k] ??= { n: 0, completades: 0, proves: new Set() };
    perSetmana[k].n++;
    if (s.completada) perSetmana[k].completades++;
    if (s.prova) perSetmana[k].proves.add(s.prova);
  }
  const resumAnterior = Object.entries(perSetmana).map(([setmana, v]) => ({
    setmana, sessions: v.n, completades: v.completades, proves: [...v.proves],
  }));

  return {
    perfil: perfil.data ?? null,
    marques_vigents: marques.data ?? [],
    historial_marques: histMarques.data ?? [],
    sessions_6_setmanes: recents.data ?? [],
    resum_anterior: resumAnterior,
    pla_vigent: pla.data ?? [],
    diari: diari.data ?? [],
    preguntes: preguntes.data ?? [],
    ajustos_recents: ajustos.data ?? [],
    canvis_pendents: pendents.data ?? [],
  };
}

// ---------------------------------------------------------------------
// 2. Validació de l'evidència — la regla del document de disseny
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
// 3. Executar cada crida a eina
// ---------------------------------------------------------------------

/** Quines de les dates citades corresponen a sessions que existeixen. */
async function sessionsReals(usuari: string, dates: string[]): Promise<Set<string>> {
  const { data } = await db.from('sessions').select('data').eq('usuari', usuari).in('data', dates);
  return new Set((data ?? []).map((r: { data: string }) => r.data));
}

async function executa(
  nom: string,
  args: Record<string, unknown>,
  usuari: string,
  estat: Awaited<ReturnType<typeof muntaEstat>>,
  registre: string[],
): Promise<string> {
  switch (nom) {
    case 'escriu_analisi': {
      await db.from('analisis').insert({
        usuari,
        data_sessio: args.data as string,
        veredicte: args.veredicte as string,
        text: args.text as string,
      });
      registre.push(`anàlisi escrita (${args.veredicte})`);
      return 'Anàlisi guardada.';
    }

    case 'anota_al_diari': {
      await db.from('diari').insert({
        usuari,
        prova: (args.prova as string) ?? 'general',
        observacio: args.observacio as string,
        que_vigila: args.que_vigila as string,
      });
      registre.push('anotació al diari');
      return 'Anotat al diari.';
    }

    case 'actualitza_marca': {
      // Una marca és un fet, no una tendència: no demana evidència acumulada.
      await db.from('marques').insert({
        usuari,
        prova: args.prova as string,
        valor: args.valor as number,
        unitat: args.unitat as string,
        data: args.data as string,
        origen: args.origen as string,
      });
      registre.push(`marca nova: ${args.prova} ${args.valor} ${args.unitat}`);
      return `Marca actualitzada: ${args.prova} = ${args.valor} ${args.unitat}.`;
    }

    case 'ajusta_sessio': {
      const v = await validaEvidencia(args.evidencia as string[], (d) => sessionsReals(usuari, d));
      if (!v.ok) {
        await db.from('diari').insert({
          usuari,
          prova: (args.prova as string) ?? 'general',
          observacio: `[ajust rebutjat] ${args.motiu}`,
          que_vigila: `Evidència insuficient: ${v.motiu} Reconsiderar quan hi hagi més dades.`,
        });
        registre.push(`ajust rebutjat (${args.prova}) → anotat al diari`);
        return `REBUTJAT. ${v.motiu} S'ha convertit en una anotació al diari. No ho tornis a intentar en aquesta consulta.`;
      }

      // Límit de freqüència: un ajust per prova cada catorze dies.
      const previ = (estat.ajustos_recents as Array<Record<string, string>>).find(
        (a) => a.prova === args.prova && a.aplicat_el >= fa(14),
      );
      if (previ) {
        await db.from('diari').insert({
          usuari,
          prova: args.prova as string,
          observacio: `[ajust ajornat] ${args.motiu}`,
          que_vigila: `Ja es va ajustar ${args.prova} el ${previ.aplicat_el.slice(0, 10)}. Un pla que canvia cada setmana no es pot avaluar.`,
        });
        registre.push(`ajust ajornat (${args.prova}, massa recent)`);
        return `AJORNAT. Ja hi ha un ajust de ${args.prova} del ${previ.aplicat_el.slice(0, 10)}, i el límit és un cada catorze dies. Anotat al diari.`;
      }

      const { error } = await db.from('sessions')
        .update({ previst: args.canvis, actualitzat_el: new Date().toISOString() })
        .eq('usuari', usuari).eq('data', args.data as string);
      if (error) return `No s'ha pogut aplicar: ${error.message}`;

      await db.from('ajustos').insert({
        usuari,
        prova: args.prova as string,
        data_sessio: args.data as string,
        canvis: args.canvis,
        motiu: args.motiu as string,
        evidencia: args.evidencia as string[],
      });
      registre.push(`sessió del ${args.data} ajustada`);
      return `Aplicat a la sessió del ${args.data}.`;
    }

    case 'proposa_canvi_de_pla': {
      const v = await validaEvidencia(args.evidencia as string[], (d) => sessionsReals(usuari, d));
      if (!v.ok) {
        await db.from('diari').insert({
          usuari,
          prova: 'general',
          observacio: `[canvi de pla rebutjat] ${args.motiu}`,
          que_vigila: `Evidència insuficient: ${v.motiu}`,
        });
        registre.push('canvi de pla rebutjat → anotat al diari');
        return `REBUTJAT. ${v.motiu} Anotat al diari.`;
      }

      // Una revisio gran nomes un cop per fase: compta els pendents i els
      // ja aprovats d'aquesta mateixa fase, no nomes els que esperen resposta.
      const fase = estat.perfil?.fase_actual ?? null;
      const { count } = await db.from('canvis_pendents')
        .select('id', { count: 'exact', head: true })
        .eq('usuari', usuari).eq('fase', fase).in('estat', ['pendent', 'aprovat']);
      if ((count ?? 0) > 0) {
        await db.from('diari').insert({
          usuari,
          prova: 'general',
          observacio: `[canvi de pla ajornat] ${args.motiu}`,
          que_vigila: `Ja s'ha fet una revisio gran a la fase "${fase}". La seguent, a la fase seguent.`,
        });
        registre.push('canvi de pla ajornat (ja n\'hi ha un en aquesta fase)');
        return `AJORNAT. Ja hi ha una revisio gran registrada a la fase "${fase}", i nomes se'n fa una per fase. Anotat al diari.`;
      }

      await db.from('canvis_pendents').insert({
        usuari,
        abast: args.abast as string,
        fase,
        canvis: args.canvis,
        motiu: args.motiu as string,
        evidencia: args.evidencia as string[],
      });
      registre.push(`canvi de pla proposat (${args.abast}) → pendent d'aprovació`);
      return `Proposta encolada. Queda pendent que l'Àlex l'aprovi; el calendari no s'ha tocat.`;
    }

    case 'pregunta': {
      await db.from('preguntes').insert({
        usuari,
        text: args.text as string,
        per_que: args.per_que as string,
      });
      registre.push('pregunta deixada a l\'app');
      return 'Pregunta deixada a l\'app.';
    }

    case 'demana_historic': {
      const { data } = await db.from('sessions')
        .select('data,prova,previst,realitzat,notes,completada')
        .eq('usuari', usuari)
        .gte('data', args.desde as string)
        .lte('data', args.fins as string)
        .order('data', { ascending: true });
      registre.push(`historial demanat (${args.desde} → ${args.fins})`);
      return JSON.stringify(data ?? []);
    }

    default:
      return `Eina desconeguda: ${nom}`;
  }
}

// ---------------------------------------------------------------------
// 4. El bucle amb l'API de Claude
// ---------------------------------------------------------------------

async function crida(messages: unknown[]) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages,
    }),
  });
  if (!r.ok) throw new Error(`API de Claude ${r.status}: ${await r.text()}`);
  return await r.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    if (!API_KEY) throw new Error('Falta el secret ANTHROPIC_API_KEY.');

    const { usuari, activitat, notes } = await req.json();
    if (!usuari) throw new Error('Falta el camp "usuari".');

    const estat = await muntaEstat(usuari);
    const registre: string[] = [];

    const messages: unknown[] = [{
      role: 'user',
      content:
        `## Document d'estat\n\n${JSON.stringify(estat, null, 1)}\n\n` +
        `## Activitat nova\n\n${JSON.stringify(activitat ?? null, null, 1)}\n\n` +
        `## Notes de l'Àlex sobre aquesta sessió\n\n${notes || '(cap)'}\n\n` +
        `Analitza la sessió. Recorda que el resultat normal és una anàlisi i cap canvi al calendari.`,
    }];

    let resposta = await crida(messages);

    // Bucle fitat: només hi ha una eina que demani continuar (demana_historic).
    for (let ronda = 0; ronda < 3 && resposta.stop_reason === 'tool_use'; ronda++) {
      const resultats = [];
      for (const bloc of resposta.content) {
        if (bloc.type !== 'tool_use') continue;
        const sortida = await executa(bloc.name, bloc.input, usuari, estat, registre);
        resultats.push({ type: 'tool_result', tool_use_id: bloc.id, content: sortida });
      }
      if (resultats.length === 0) break;
      messages.push({ role: 'assistant', content: resposta.content });
      messages.push({ role: 'user', content: resultats });
      resposta = await crida(messages);
    }

    const text = (resposta.content ?? [])
      .filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text).join('\n').trim();

    return new Response(
      JSON.stringify({ ok: true, text, accions: registre, model: MODEL }),
      { headers: { ...CORS, 'content-type': 'application/json' } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String((e as Error).message ?? e) }),
      { status: 500, headers: { ...CORS, 'content-type': 'application/json' } },
    );
  }
});
