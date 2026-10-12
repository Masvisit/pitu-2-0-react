// =====================================================================
// PITU 2.0 · Les regles que fan l'entrenador conservador.
//
// Viuen separades i sense tocar la base de dades perque es puguin
// provar soles: son el mecanisme del qual depen tot el disseny, i no
// volem que depenguin de la bona voluntat del model.
// =====================================================================

export type Veredicte = { ok: true } | { ok: false; motiu: string };

/** Setmana ISO d'una data, p. ex. "2026-W41". */
export function setmanaISO(iso: string): string {
  const dt = new Date(iso + 'T00:00:00Z');
  const dia = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - dia);
  const any = dt.getUTCFullYear();
  const u = Date.UTC(any, 0, 1);
  const setmana = Math.ceil(((dt.getTime() - u) / 86400000 + 1) / 7);
  return `${any}-W${setmana}`;
}

/**
 * Comprova l'evidencia d'un canvi al calendari.
 *
 * `sessionsReals` rep les dates citades i torna les que existeixen de deb
 * a la base de dades. S'injecta per poder provar la regla sense BD.
 */
export async function validaEvidencia(
  evidencia: string[],
  sessionsReals: (dates: string[]) => Promise<Set<string>>,
): Promise<Veredicte> {
  if (!Array.isArray(evidencia) || evidencia.length < 3) {
    return { ok: false, motiu: `Només ${evidencia?.length ?? 0} dates citades; en calen tres.` };
  }

  // Tres vegades la mateixa data no son tres sessions.
  const uniques = [...new Set(evidencia)];
  if (uniques.length < 3) {
    return { ok: false, motiu: "Hi ha dates repetides a l'evidència; en calen tres de diferents." };
  }

  // Format, abans de preguntar res a la BD.
  const malFormades = uniques.filter((d) => !/^\d{4}-\d{2}-\d{2}$/.test(d) || Number.isNaN(Date.parse(d)));
  if (malFormades.length > 0) {
    return { ok: false, motiu: `Dates mal formades: ${malFormades.join(', ')}.` };
  }

  // Les dates han de correspondre a sessions que existeixen.
  const reals = await sessionsReals(uniques);
  const inventades = uniques.filter((d) => !reals.has(d));
  if (inventades.length > 0) {
    return {
      ok: false,
      motiu: `Aquestes dates no corresponen a cap sessió registrada: ${inventades.join(', ')}.`,
    };
  }

  // Tres sessions de la mateixa setmana son una mala setmana, no una tendencia.
  if (new Set(uniques.map(setmanaISO)).size < 2) {
    return {
      ok: false,
      motiu: 'Totes les dates cauen dins de la mateixa setmana ISO: això és una mala setmana, no una tendència.',
    };
  }

  return { ok: true };
}
