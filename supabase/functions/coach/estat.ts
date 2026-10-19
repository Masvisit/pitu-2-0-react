// =====================================================================
// PITU 2.0 · El document d'estat, en text compacte
//
// Abans s'enviava JSON.stringify(estat, null, 1) amb els WODs sencers a
// dins de cada sessio: 24.500 tokens per consulta amb la base plena, i
// el 79 % eren blocs d'exercicis repetits que el model no necessita,
// perque el WOD el genera l'app sola.
//
// Aqui es construeix un text pla: una linia per sessio, sense claus ni
// cometes ni noms de camp repetits.
// =====================================================================

type Fila = Record<string, any>;

export interface Dades {
  perfil: Fila | null;
  marques: Fila[];
  historial_marques: Fila[];
  sessions: Fila[];
  resum_anterior: Fila[];
  pla: Fila[];
  diari: Fila[];
  preguntes: Fila[];
  ajustos: Fila[];
  pendents: Fila[];
  excepcions?: Fila[];
}

const MINIMS: Record<string, { minim: number; unitat: string; mesEsMillor: boolean }> = {
  navette: { minim: 9, unitat: 'períodes', mesEsMillor: true },
  piscina: { minim: 45, unitat: 's', mesEsMillor: false },
  press_banca: { minim: 28, unitat: 'reps', mesEsMillor: true },
  circuit_agilitat: { minim: 13, unitat: 's', mesEsMillor: false },
};

/** El resum d'un FIT en una sola linia, nomes amb el que hi ha. */
function fet(r: Fila | null): string {
  if (!r || Object.keys(r).length === 0) return '—';
  const t: string[] = [];
  if (r.esport) t.push(r.esport);
  if (r.durada_min) t.push(`${r.durada_min}min`);
  if (r.distancia_m) t.push(`${r.distancia_m}m`);
  if (r.fc_mitjana) t.push(`fc${r.fc_mitjana}${r.fc_maxima ? '/' + r.fc_maxima : ''}`);
  if (r.ritme_min_km) t.push(`${r.ritme_min_km}min/km`);
  return t.length ? t.join(' ') : '—';
}

/** Els parcials, en una linia. Es on es veu si va acabar sobrat o fos:
 *  amb nomes la mitjana, una sessio ben feta i una de mal feta son
 *  indistingibles. */
function parcials(r: Fila | null): string | null {
  const p = r?.parcials;
  if (!Array.isArray(p) || p.length === 0) return null;
  const trams = p.map((x: Fila) => {
    const t = [x.distancia_m ? `${x.distancia_m}m` : null, x.ritme_min_km, x.fc ? `fc${x.fc}` : null]
      .filter(Boolean).join(' ');
    return `${x.n}) ${t}`;
  }).join(' · ');
  const deriva = typeof r?.deriva_fc === 'number'
    ? ` · deriva ${r.deriva_fc > 0 ? '+' : ''}${r.deriva_fc} ppm del primer al darrer terç`
    : '';
  return `   parcials: ${trams}${deriva}`;
}

/** Del WOD previst nomes el nom: el detall el genera l'app, no cal enviar-lo. */
function previst(p: Fila | null): string {
  if (!p || Object.keys(p).length === 0) return '—';
  return String(p.nom ?? '—');
}

export function formataEstat(d: Dades): string {
  const b: string[] = [];
  const p = d.perfil;

  b.push('## Perfil');
  if (p) {
    b.push(`${p.edat} anys, FC màx ${p.fc_maxima ?? '?'}, piscina de ${p.piscina_metres ?? 25} m.`);
    b.push(`Entrena: ${(p.dies_disponibles ?? []).join(' ')}.`);
    if ((p.dies_castells ?? []).length > 0) {
      b.push(`Assaigs de castells: ${p.dies_castells.join(' ')}.`);
    }
    b.push(`Proves físiques: ${p.data_examen_2 ?? '?'}. Fase actual: ${p.fase_actual ?? 'base'}.`);
  } else {
    b.push('(sense perfil desat)');
  }

  b.push('', '## Marques vigents i distància al mínim');
  for (const [prova, m] of Object.entries(MINIMS)) {
    const v = d.marques.find((x) => x.prova === prova);
    if (!v) {
      b.push(`${prova}: sense mesurar (mínim ${m.minim} ${m.unitat})`);
      continue;
    }
    const val = Number(v.valor);
    const passa = m.mesEsMillor ? val >= m.minim : val <= m.minim;
    const buit = m.mesEsMillor ? m.minim - val : val - m.minim;
    b.push(
      `${prova}: ${val} ${m.unitat} (${v.data}) · mínim ${m.minim} · ` +
      (passa ? `passa per ${Math.abs(buit)}` : `FALTEN ${buit}`),
    );
  }

  if (d.historial_marques.length) {
    b.push('', '## Evolució de les marques');
    const per: Record<string, string[]> = {};
    for (const m of d.historial_marques) {
      (per[m.prova] ??= []).push(`${m.data}:${m.valor}`);
    }
    for (const [prova, l] of Object.entries(per)) b.push(`${prova}: ${l.slice(-5).join(' ')}`);
  }

  b.push('', '## Sessions de les últimes 6 setmanes');
  if (!d.sessions.length) {
    b.push('CAP sessió registrada. Sense registre no es pot avaluar res.');
  } else {
    b.push('data | prova | previst | fet | notes');
    for (const s of d.sessions) {
      b.push(
        [s.data, s.prova ?? '—', previst(s.previst), fet(s.realitzat),
         s.completada ? '' : '(no completada)', s.notes ?? ''].filter(Boolean).join(' | '),
      );
      const pl = parcials(s.realitzat);
      if (pl) b.push(pl);
    }
  }

  // VO2max, running index i carrega: no surten del FIT, els apunta ell a
  // ma del rellotge. Van amb data perque el que informa es la tendencia.
  const ambMetriques = d.sessions
    .filter((s) => s.realitzat?.vo2max || s.realitzat?.running_index || s.realitzat?.carrega)
    .slice(-4).reverse();
  if (ambMetriques.length) {
    b.push('', '## Xifres del rellotge');
    for (const s of ambMetriques) {
      const r = s.realitzat;
      b.push([
        s.data,
        r.vo2max ? `VO2max ${r.vo2max}` : null,
        r.running_index ? `running index ${r.running_index}` : null,
        r.carrega ? `càrrega ${r.carrega}` : null,
      ].filter(Boolean).join(' · '));
    }
  }

  if (d.resum_anterior.length) {
    b.push('', '## Abans de les 6 setmanes, per setmana');
    b.push(d.resum_anterior.map((r) => `${r.setmana}:${r.completades}/${r.sessions}`).join(' '));
  }

  b.push('', '## Pla de les properes 4 setmanes');
  if (!d.pla.length) b.push('(encara no hi ha res desat; el genera l`app)');
  else for (const s of d.pla) b.push(`${s.data} | ${s.prova ?? '—'} | ${previst(s.previst)}`);

  if (d.diari.length) {
    b.push('', '## Diari de l`entrenador, del més recent al més antic');
    for (const e of d.diari) {
      b.push(`${String(e.creat_el).slice(0, 10)} [${e.prova}] ${e.observacio} → vigilo: ${e.que_vigila}`);
    }
  }

  if (d.ajustos.length) {
    b.push('', '## Ajustos ja aplicats els últims 30 dies');
    for (const a of d.ajustos) {
      b.push(`${String(a.aplicat_el).slice(0, 10)} [${a.prova}] ${a.motiu}`);
    }
  }

  if (d.pendents.length) {
    b.push('', '## Canvis grans pendents que ha d`aprovar');
    for (const c of d.pendents) b.push(`${c.abast}: ${c.motiu}`);
  }

  // Dies que l'Alex ha mogut o tret, o que tu mateix has ajustat.
  if (d.excepcions?.length) {
    b.push('', '## Dies que no segueixen el pla');
    for (const e of d.excepcions) {
      if (e.estat === 'eliminat') b.push(`${e.data}: tret del pla`);
      else b.push(`${e.data}: ${e.wod?.nom ?? e.prova ?? 'canviat'}${e.origen ? ` (mogut des del ${e.origen})` : ''}`);
    }
  }

  const obertes = d.preguntes.filter((q) => !q.resposta);
  const closes = d.preguntes.filter((q) => q.resposta).slice(0, 5);
  if (obertes.length || closes.length) {
    b.push('', '## Preguntes');
    for (const q of obertes) b.push(`OBERTA: ${q.text}`);
    for (const q of closes) b.push(`${q.text} → ${q.resposta}`);
  }

  return b.join('\n');
}
