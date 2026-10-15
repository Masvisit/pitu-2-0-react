// =====================================================================
// PITU 2.0 · Resum d'un fitxer FIT
//
// Sense cap import: es pot provar sol i no arrossega res.
//
// Envia els totals I els parcials. Amb nomes els totals, l'entrenador
// veu "8.495 m a 5:46 amb 149 de mitjana" i no pot saber si vas acabar
// fos o sobrat, que es on hi ha la informacio. Les mostres per segon,
// en canvi, no surten mai del navegador: son milers de files que no
// aporten res que els parcials no diguin millor.
// =====================================================================

/** Com a molt aquests parcials. Una piscina pot tenir-ne desenes. */
const MAX_PARCIALS = 20;

function mitjana(valors) {
  const v = valors.filter((x) => typeof x === 'number' && !Number.isNaN(x));
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
}

/** Segons per quilometre en format 5:46. */
function ritme(segons, metres) {
  if (!segons || !metres) return null;
  const s = segons / (metres / 1000);
  return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
}

/**
 * Els parcials tal com els talla el rellotge. Normalment cada
 * quilometre; a la piscina, cada llarg.
 */
function treuParcials(laps) {
  if (!Array.isArray(laps) || laps.length === 0) return [];

  const tots = laps.map((l, i) => {
    const s = l.total_timer_time ?? l.total_elapsed_time ?? null;
    const m = l.total_distance ?? null;
    return {
      n: i + 1,
      durada_s: s ? Math.round(s) : null,
      distancia_m: m ? Math.round(m) : null,
      ritme_min_km: ritme(s, m),
      fc: l.avg_heart_rate ?? null,
      fc_max: l.max_heart_rate ?? null,
    };
  });

  if (tots.length <= MAX_PARCIALS) return tots;
  // Massa parcials: els primers i els ultims, que es on es veu la deriva.
  const cap = Math.ceil(MAX_PARCIALS / 2);
  return [...tots.slice(0, cap), ...tots.slice(-(MAX_PARCIALS - cap))];
}

/**
 * Quant puja la pulsacio del primer terc de la sessio a l'ultim. Es el
 * numero que distingeix acabar sobrat d'acabar arrossegant-se.
 */
function derivaFC(parcials) {
  const amb = parcials.filter((p) => typeof p.fc === 'number');
  if (amb.length < 3) return null;
  const t = Math.max(1, Math.floor(amb.length / 3));
  const inici = mitjana(amb.slice(0, t).map((p) => p.fc));
  const final = mitjana(amb.slice(-t).map((p) => p.fc));
  if (inici === null || final === null) return null;
  return final - inici;
}

/**
 * Converteix la sortida de fit-file-parser en el resum pla que envia
 * l'app. El nom de l'esport surt del fitxer, mai inventat.
 *
 * @param {object} fit  l'objecte que torna FitParser.parse()
 */
export function resumFIT(fit) {
  const s = fit?.sessions?.[0] ?? fit?.activity?.sessions?.[0] ?? {};
  const registres = fit?.records ?? fit?.activity?.records ?? [];
  const laps = fit?.laps ?? fit?.activity?.laps ?? fit?.sessions?.[0]?.laps ?? [];

  const mitjanaDe = (camp) => mitjana(registres.map((r) => r?.[camp]));

  const inici = s.start_time ?? registres[0]?.timestamp ?? null;
  const segons = s.total_timer_time ?? s.total_elapsed_time ?? null;
  const metres = s.total_distance ?? null;

  const parcials = treuParcials(laps);

  return {
    data: inici ? new Date(inici).toISOString().slice(0, 10) : null,
    hora: inici ? new Date(inici).toISOString().slice(11, 16) : null,
    esport: s.sport ?? null,
    sub_esport: s.sub_sport ?? null,
    durada_min: segons ? Math.round(segons / 60) : null,
    distancia_m: metres ? Math.round(metres) : null,
    fc_mitjana: s.avg_heart_rate ?? mitjanaDe('heart_rate'),
    fc_maxima: s.max_heart_rate ?? null,
    cadencia_mitjana: s.avg_cadence ?? mitjanaDe('cadence'),
    ritme_min_km: ritme(segons, metres),
    parcials,
    deriva_fc: derivaFC(parcials),
    n_registres: registres.length,
  };
}
