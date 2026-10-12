// =====================================================================
// PITU 2.0 · Resum d'un fitxer FIT
//
// Sense cap import: es pot provar sol i no arrossega res.
// =====================================================================

/**
 * Converteix la sortida de fit-file-parser en el resum pla que envia
 * l'app. El nom de l'esport surt del fitxer, mai inventat.
 *
 * @param {object} fit  l'objecte que torna FitParser.parse()
 * @returns {{data: string, esport: string|null, durada_min: number|null,
 *            distancia_m: number|null, fc_mitjana: number|null,
 *            fc_maxima: number|null, cadencia_mitjana: number|null,
 *            ritme_min_km: number|null}}
 */
export function resumFIT(fit) {
  const s = fit?.sessions?.[0] ?? fit?.activity?.sessions?.[0] ?? {};
  const registres = fit?.records ?? fit?.activity?.records ?? [];

  const mitjana = (camp) => {
    const v = registres.map((r) => r?.[camp]).filter((x) => typeof x === 'number');
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
  };

  const inici = s.start_time ?? registres[0]?.timestamp ?? null;
  const segons = s.total_elapsed_time ?? s.total_timer_time ?? null;
  const metres = s.total_distance ?? null;

  return {
    data: inici ? new Date(inici).toISOString().slice(0, 10) : null,
    hora: inici ? new Date(inici).toISOString().slice(11, 16) : null,
    esport: s.sport ?? null,
    sub_esport: s.sub_sport ?? null,
    durada_min: segons ? Math.round(segons / 60) : null,
    distancia_m: metres ? Math.round(metres) : null,
    fc_mitjana: s.avg_heart_rate ?? mitjana('heart_rate'),
    fc_maxima: s.max_heart_rate ?? null,
    cadencia_mitjana: s.avg_cadence ?? mitjana('cadence'),
    ritme_min_km: metres && segons ? +(segons / 60 / (metres / 1000)).toFixed(2) : null,
    n_registres: registres.length,
  };
}

