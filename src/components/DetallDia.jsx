import { useEffect, useState } from 'react';
import { analisiDelDia, sessionsDelDia, diariDelDia } from '../services/coach.js';
import { PROVES } from '../data/agentRuralExercises.js';
import { getWODForDate, nomDelDia } from '../data/wodProgram.js';

const VEREDICTE = {
  compleix:    { text: 'Compleix',          color: 'var(--color-pine)' },
  parcial:     { text: 'Compleix a mitges', color: 'var(--color-cursa)' },
  no_compleix: { text: 'No compleix',       color: 'var(--color-falta)' },
};

function dataLlarga(iso) {
  const mesos = ['gener','febrer','març','abril','maig','juny','juliol','agost','setembre','octubre','novembre','desembre'];
  const d = new Date(iso + 'T00:00:00Z');
  return `${nomDelDia(iso).toLowerCase()} ${d.getUTCDate()} de ${mesos[d.getUTCMonth()]}`;
}

/**
 * Tot el que se sap d'un dia: què tocava, què vas fer amb els seus
 * parcials, què en va dir l'entrenador i què va anotar al diari.
 *
 * Tot això ja està desat a la base de dades, així que obrir-ho no
 * demana res a l'API ni costa diners.
 */
export default function DetallDia({ data, onTanca }) {
  const [carregant, setCarregant] = useState(true);
  const [analisi, setAnalisi] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [diari, setDiari] = useState([]);

  useEffect(() => {
    let viu = true;
    setCarregant(true);
    Promise.all([analisiDelDia('alex', data), sessionsDelDia('alex', data), diariDelDia('alex', data)])
      .then(([a, s, d]) => {
        if (!viu) return;
        setAnalisi(a); setSessions(s); setDiari(d); setCarregant(false);
      });
    return () => { viu = false; };
  }, [data]);

  const previst = getWODForDate(data);
  const v = analisi?.veredicte ? VEREDICTE[analisi.veredicte] : null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-ink/30 sm:items-center"
      onClick={onTanca}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-paper pb-8 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 flex items-start gap-3 border-b border-filet bg-paper px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-[19px] font-bold leading-tight">{dataLlarga(data)}</h2>
            <p className="mt-0.5 text-[13px] text-ink-soft">
              {previst.castells ? 'Assaig de castells' : (previst.prova ? PROVES[previst.prova].nom : 'Dia lliure')}
            </p>
          </div>
          {v && (
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold"
              style={{ color: v.color, border: `1px solid ${v.color}` }}
            >
              {v.text}
            </span>
          )}
          <button
            onClick={onTanca}
            aria-label="Tanca"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-surface"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {carregant ? (
          <p className="px-5 py-6 text-[14px] text-ink-faint">Carregant…</p>
        ) : (
          <div className="px-5">

            {/* L'anàlisi, que és el que ha vingut a buscar */}
            <section className="mt-5 rounded-2xl bg-surface px-5 py-4">
              <h3 className="text-[14px] font-semibold text-ink-soft">Què en diu l&apos;entrenador</h3>
              {analisi ? (
                <div className="mt-2">
                  {analisi.text.split('\n').filter(Boolean).map((p, i) => (
                    <p key={i} className="max-w-[60ch] text-[14.5px] leading-relaxed [&:not(:first-child)]:mt-2.5">{p}</p>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[14px] text-ink-faint">
                  Encara no n&apos;hi ha cap. Puja la sessió i demana-li l&apos;anàlisi.
                </p>
              )}
            </section>

            {/* Què vas fer de debò */}
            {sessions.length > 0 && (
              <section className="mt-4 overflow-hidden rounded-2xl bg-surface">
                <h3 className="border-b border-filet px-5 py-3 text-[14px] font-semibold text-ink-soft">
                  {sessions.length === 1 ? 'Què vas fer' : `Què vas fer · ${sessions.length} sessions`}
                </h3>
                {sessions.map((s, i) => {
                  const r = s.realitzat ?? {};
                  return (
                    <div key={i} className="border-b border-filet px-5 py-3.5 last:border-0">
                      <p className="xifra text-[14px] font-medium">
                        {[r.esport, r.durada_min ? `${r.durada_min} min` : null,
                          r.distancia_m ? `${r.distancia_m} m` : null,
                          r.fc_mitjana ? `${r.fc_mitjana}/${r.fc_maxima ?? '—'} ppm` : null,
                          r.ritme_min_km ? `${r.ritme_min_km} min/km` : null]
                          .filter(Boolean).join(' · ') || 'sessió registrada'}
                      </p>

                      {r.parcials?.length > 0 && (
                        <ol className="mt-2.5 space-y-1">
                          {r.parcials.map((p, j) => (
                            <li key={j} className="xifra flex gap-3 text-[13px] text-ink-soft">
                              <span className="w-6 shrink-0 text-ink-faint">{p.n}</span>
                              <span className="w-16 shrink-0">{p.distancia_m ? `${p.distancia_m} m` : ''}</span>
                              <span className="w-14 shrink-0 font-medium text-ink">{p.ritme_min_km ?? ''}</span>
                              <span>{p.fc ? `${p.fc} ppm` : ''}</span>
                            </li>
                          ))}
                        </ol>
                      )}

                      {typeof r.deriva_fc === 'number' && (
                        <p className="xifra mt-2 text-[12.5px] text-ink-faint">
                          La pulsació {r.deriva_fc >= 0 ? 'va pujar' : 'va baixar'} {Math.abs(r.deriva_fc)} ppm
                          del primer terç al darrer
                        </p>
                      )}

                      {(r.vo2max || r.running_index || r.carrega) && (
                        <p className="xifra mt-2 text-[12.5px] text-ink-faint">
                          {[r.vo2max ? `VO2max ${r.vo2max}` : null,
                            r.running_index ? `running index ${r.running_index}` : null,
                            r.carrega ? `càrrega ${r.carrega}` : null].filter(Boolean).join(' · ')}
                        </p>
                      )}

                      {s.notes && (
                        <p className="mt-2.5 whitespace-pre-wrap border-t border-filet pt-2.5 font-mono text-[12.5px] leading-relaxed text-ink-soft">
                          {s.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            {/* Què tocava */}
            {previst.wod?.blocs?.length > 0 && (
              <section className="mt-4 overflow-hidden rounded-2xl border border-filet">
                <h3 className="border-b border-filet px-5 py-3 text-[14px] font-semibold text-ink-soft">
                  Què tocava: {previst.wod.nom}
                </h3>
                <ol className="divide-y divide-filet">
                  {previst.wod.blocs.map((b, i) => (
                    <li key={i} className="px-5 py-2.5 text-[13.5px] leading-snug">
                      <span className="text-ink-faint">{b.tipus}: </span>{b.text}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* El diari d'aquell dia */}
            {diari.length > 0 && (
              <section className="mt-4 rounded-2xl bg-surface px-5 py-4">
                <h3 className="text-[14px] font-semibold text-ink-soft">Què va deixar sota vigilància</h3>
                {diari.map((d, i) => (
                  <div key={i} className="mt-2.5">
                    <p className="max-w-[60ch] text-[13.5px] leading-relaxed">{d.observacio}</p>
                    {d.que_vigila && (
                      <p className="mt-0.5 max-w-[60ch] text-[13px] leading-relaxed text-ink-soft">{d.que_vigila}</p>
                    )}
                  </div>
                ))}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
