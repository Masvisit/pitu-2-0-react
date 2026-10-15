import { useEffect, useState } from 'react';
import { historialAnalisis, marquesVigents, hiHaSupabase } from '../services/coach.js';
import DetallDia from '../components/DetallDia.jsx';
import { PROVES } from '../data/agentRuralExercises.js';
import { estatDeLaProva, nomDelDia } from '../data/wodProgram.js';

const VEREDICTE = {
  compleix:    { text: 'Compleix',          color: 'var(--color-pine)' },
  parcial:     { text: 'A mitges',          color: 'var(--color-cursa)' },
  no_compleix: { text: 'No compleix',       color: 'var(--color-falta)' },
};

function dataCurta(iso) {
  const mesos = ['gen','feb','mar','abr','mai','jun','jul','ago','set','oct','nov','des'];
  const d = new Date(iso + 'T00:00:00Z');
  return `${nomDelDia(iso).slice(0, 2).toLowerCase()} ${d.getUTCDate()} ${mesos[d.getUTCMonth()]}`;
}

/**
 * Tot el que l'entrenador ha escrit, de la sessió més recent cap enrere.
 *
 * Això ja està desat des del primer dia: obrir aquesta pàgina no demana
 * res a l'API i no costa res. L'única feina era ensenyar-ho.
 */
export default function ProgressPage() {
  const [analisis, setAnalisis] = useState([]);
  const [marques, setMarques] = useState([]);
  const [carregant, setCarregant] = useState(true);
  const [detall, setDetall] = useState(null);

  useEffect(() => {
    Promise.all([historialAnalisis('alex'), marquesVigents('alex')])
      .then(([a, m]) => { setAnalisis(a); setMarques(m); setCarregant(false); });
  }, []);

  const perProva = Object.fromEntries(marques.map((m) => [m.prova, Number(m.valor)]));

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-5 sm:px-6">
      <h1 className="text-[22px] font-bold">Progrés</h1>

      {/* On ets a cada prova */}
      <section className="mt-5 overflow-hidden rounded-2xl bg-surface">
        <h2 className="border-b border-filet px-5 py-3 text-[14px] font-semibold text-ink-soft">
          Marques vigents
        </h2>
        <div className="divide-y divide-filet">
          {Object.keys(PROVES).map((id) => {
            const e = estatDeLaProva(id, perProva[id] ?? null);
            return (
              <div key={id} className="flex items-baseline justify-between gap-3 px-5 py-3">
                <span className="text-[14.5px] font-medium">{PROVES[id].curt}</span>
                <span className="xifra text-[14px]">
                  {e.senseMarca ? (
                    <span className="text-ink-faint">sense mesurar</span>
                  ) : (
                    <>
                      <span className="font-bold">{e.marca}</span>
                      <span className="text-ink-faint"> / {e.minim} {PROVES[id].unitat}</span>
                      <span style={{ color: e.passa ? 'var(--color-pine)' : 'var(--color-falta)' }}>
                        {e.passa ? '  ✓' : `  −${e.buit}`}
                      </span>
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* L'historial */}
      <section className="mt-7">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[17px] font-bold">Tot el que t&apos;ha dit</h2>
          {analisis.length > 0 && (
            <span className="xifra text-[13px] text-ink-soft">{analisis.length} sessions</span>
          )}
        </div>

        {!hiHaSupabase ? (
          <p className="mt-3 text-[14px] text-ink-soft">
            Sense connexió no hi ha historial. Falta el fitxer <code>.env.local</code>.
          </p>
        ) : carregant ? (
          <p className="mt-3 text-[14px] text-ink-faint">Carregant…</p>
        ) : analisis.length === 0 ? (
          <p className="mt-3 max-w-[58ch] text-[14px] leading-relaxed text-ink-soft">
            Encara no n&apos;hi ha cap. Puja un entrenament des d&apos;Entrena i demana-li
            l&apos;anàlisi; a partir d&apos;aquí s&apos;aniran acumulant aquí.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-filet overflow-hidden rounded-2xl bg-surface">
            {analisis.map((a) => {
              const v = VEREDICTE[a.veredicte];
              return (
                <li key={a.id}>
                  <button
                    onClick={() => setDetall(a.data_sessio)}
                    className="flex w-full items-start gap-3.5 px-5 py-3.5 text-left transition-colors hover:bg-paper"
                  >
                    <span className="xifra w-[72px] shrink-0 pt-0.5 text-[13px] text-ink-soft">
                      {dataCurta(a.data_sessio)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block text-[14px] leading-snug">{a.text}</span>
                    </span>
                    {v && (
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-semibold"
                        style={{ color: v.color, border: `1px solid ${v.color}` }}
                      >
                        {v.text}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {detall && <DetallDia data={detall} onTanca={() => setDetall(null)} />}
    </div>
  );
}
