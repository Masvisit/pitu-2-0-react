import { useEffect, useState } from 'react';
import DetallDia from '../components/DetallDia.jsx';
import { usePlanStore } from '../store/planStore.js';
import { PROVES } from '../data/agentRuralExercises.js';
import { avui, NOM_FASE } from '../data/wodProgram.js';

const TO = {
  cursa: 'var(--color-cursa)',
  forca: 'var(--color-forca)',
  aigua: 'var(--color-aigua)',
  agilitat: 'var(--color-agilitat)',
};

const NOM_BLOC = {
  escalfament: 'Escalfament', principal: 'Sèrie principal', secundari: 'Sèrie secundària',
  tecnica: 'Tècnica', especific: 'Específic', potencia: 'Potència', forca: 'Força',
  accessori: 'Accessori', calma: 'Tornada a la calma', sauna: 'Sauna',
};

const ETIQUETA_DIA = { dl: 'dl', dm: 'dm', dc: 'dc', dj: 'dj', dv: 'dv', ds: 'ds', dg: 'dg' };

export default function CalendarPage() {
  const { dies, setmanaVista, canviaSetmana, vesAAvui, carrega, excepcions, mou, treu, restaura } = usePlanStore();
  const [obert, setObert] = useState(avui());
  const [movent, setMovent] = useState(null);   // data que s'està movent
  const [desti, setDesti] = useState('');
  const [detall, setDetall] = useState(null);  // data del detall obert

  useEffect(() => { carrega(); }, [carrega]);

  const llista = dies();
  const setmana = llista[0]?.setmana ?? 1;
  const fase = llista[0]?.fase ?? 'base';
  const esSetmanaActual = llista.some((d) => d.data === avui());

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-5 sm:px-6 lg:max-w-6xl">

      {/* Canvi de setmana. Fletxes grans, que es fa amb el polze. */}
      <header className="flex items-center justify-between gap-3">
        <button
          onClick={() => canviaSetmana(-1)}
          aria-label="Setmana anterior"
          className="grid h-11 w-11 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M12.5 4L6.5 10l6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="min-w-0 text-center">
          <h1 className="truncate text-[19px] font-bold">Setmana {setmana}</h1>
          <p className="text-[13px] text-ink-soft">{NOM_FASE[fase]}</p>
        </div>

        <button
          onClick={() => canviaSetmana(1)}
          aria-label="Setmana següent"
          className="grid h-11 w-11 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M7.5 4l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </header>

      {!esSetmanaActual && (
        <div className="mt-3 text-center">
          <button
            onClick={vesAAvui}
            className="rounded-full border border-filet bg-surface px-4 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:border-ink-faint"
          >
            Torna a aquesta setmana
          </button>
        </div>
      )}

      {/* Els set dies. Una llista contínua amb filets, no set targetes. */}
      <ul className="mt-5 divide-y divide-filet overflow-hidden rounded-2xl bg-surface lg:grid lg:grid-cols-7 lg:divide-x lg:divide-y-0">
        {llista.map((d) => {
          const prova = d.prova ? PROVES[d.prova] : null;
          const to = prova ? TO[prova.color] : 'var(--color-ink-faint)';
          const esAvui = d.data === avui();
          const expandit = obert === d.data;

          return (
            <li key={d.data} className={esAvui ? 'bg-pine-soft/40 lg:bg-pine-soft/40' : ''}>
              <button
                onClick={() => setObert(expandit ? null : d.data)}
                aria-expanded={expandit}
                className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-paper/60 lg:flex-col lg:items-start lg:gap-2"
              >
                <span className="flex w-9 shrink-0 flex-col items-center lg:w-auto lg:flex-row lg:gap-1.5">
                  <span className="text-[11px] text-ink-faint">{ETIQUETA_DIA[d.diaCurt]}</span>
                  <span className={`xifra text-[17px] ${esAvui ? 'font-bold text-pine' : 'font-semibold'}`}>
                    {Number(d.data.slice(8))}
                  </span>
                </span>

                <span className="h-9 w-1 shrink-0 rounded-full lg:h-1 lg:w-full" style={{ backgroundColor: to }} />

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-semibold lg:whitespace-normal">
                    {d.tret ? 'Tret del pla' : d.castells ? 'Castells' : (prova?.curt ?? 'Lliure')}
                    {d.mogut_de && <span className="ml-1.5 text-[12px] font-normal text-ink-faint">mogut</span>}
                  </span>
                  <span className="block truncate text-[13px] text-ink-soft lg:whitespace-normal">
                    {d.wod?.nom ?? '—'}
                  </span>
                </span>

                <span className="shrink-0 text-[12px]">
                  {d.completada ? (
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-pine" aria-label="feta">
                      <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M5 10.5l3.5 3.5L15 6.5" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  ) : (
                    <span className="xifra text-ink-faint">{d.wod?.durada_min ? `${d.wod.durada_min}′` : ''}</span>
                  )}
                </span>
              </button>

              {/* El desplegable respon a una acció, així que sí que es mou. */}
              {expandit && (
                <div className="border-t border-filet bg-paper/50 px-4 py-3">
                  {d.wod?.blocs?.length > 0 ? (
                    <ol className="space-y-2.5">
                      {d.wod.blocs.map((b, i) => (
                        <li key={i} className="text-[13.5px] leading-snug">
                          <span className="text-ink-faint">{NOM_BLOC[b.tipus] ?? b.tipus}: </span>
                          <span className="font-medium">{b.text}</span>
                          {b.detall && <span className="mt-0.5 block text-[12.5px] text-ink-soft">{b.detall}</span>}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-[13.5px] text-ink-soft">
                      {d.tret ? 'Aquest dia l\'has tret del pla.' : 'Aquest dia no hi ha res programat.'}
                    </p>
                  )}

                  {/* Les sessions que hi has fet. Ara en poden ser més d'una. */}
                  {d.fetes?.length > 0 && (
                    <div className="mt-3 border-t border-filet pt-2.5">
                      {d.fetes.map((f, i) => (
                        <p key={i} className="xifra text-[12.5px] text-ink-soft [&:not(:first-child)]:mt-1">
                          {[f.realitzat?.esport, f.realitzat?.durada_min ? `${f.realitzat.durada_min} min` : null,
                            f.realitzat?.fc_mitjana ? `${f.realitzat.fc_mitjana} ppm` : null]
                            .filter(Boolean).join(' · ') || 'sessió registrada'}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Si hi ha sessió feta, el detall amb l'anàlisi. */}
                  {d.completada && (
                    <button
                      onClick={() => setDetall(d.data)}
                      className="mt-3 flex w-full items-center gap-2.5 rounded-xl bg-pine-soft px-3.5 py-2.5 text-left"
                    >
                      <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0">
                        <circle cx="10" cy="10" r="8.25" stroke="var(--color-pine)" strokeWidth="1.5" />
                        <path d="M6.25 10.25l2.5 2.5 5-5.5" stroke="var(--color-pine)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="flex-1 text-[13.5px] font-semibold text-pine">Sessió feta · veure l&apos;anàlisi</span>
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0">
                        <path d="M7.5 4l6 6-6 6" stroke="var(--color-pine)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}

                  {/* Moure, treure, restaurar. */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-filet pt-3">
                    {movent === d.data ? (
                      <>
                        <input
                          type="date"
                          value={desti}
                          onChange={(e) => setDesti(e.target.value)}
                          className="rounded-lg border border-filet px-2.5 py-1.5 text-[13px]"
                        />
                        <button
                          onClick={async () => { if (desti) { await mou(d.data, desti); setMovent(null); setDesti(''); } }}
                          className="rounded-full bg-pine px-3.5 py-1.5 text-[13px] font-semibold text-white"
                        >
                          Mou-la
                        </button>
                        <button
                          onClick={() => { setMovent(null); setDesti(''); }}
                          className="px-2 text-[13px] text-ink-soft"
                        >
                          Deixa-ho
                        </button>
                      </>
                    ) : (
                      <>
                        {d.wod && !d.tret && (
                          <button
                            onClick={() => { setMovent(d.data); setDesti(d.data); }}
                            className="rounded-full border border-filet bg-surface px-3.5 py-1.5 text-[13px] font-semibold"
                          >
                            Mou a un altre dia
                          </button>
                        )}
                        {!d.tret && (
                          <button
                            onClick={() => treu(d.data)}
                            className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-ink-soft hover:bg-surface"
                          >
                            Treu aquest dia
                          </button>
                        )}
                        {excepcions?.[d.data] && (
                          <button
                            onClick={() => restaura(d.data)}
                            className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-pine hover:bg-pine-soft"
                          >
                            Torna al pla
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {detall && <DetallDia data={detall} onTanca={() => setDetall(null)} />}

      <p className="mt-4 max-w-[62ch] text-[13px] leading-relaxed text-ink-faint">
        Dimarts i divendres són els assaigs de castells, així que aquests dies
        el pla no et demana res més. Toca un dia per veure'n les sèries, moure'l
        a un altre dia o treure'l. Si el mous a un dia que ja té feina, se les
        intercanvia.
      </p>
    </div>
  );
}
