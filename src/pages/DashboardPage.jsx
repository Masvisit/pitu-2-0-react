import { useEffect, useState } from 'react';
import { usePlanStore } from '../store/planStore.js';
import { PROVES, MATERIAL } from '../data/agentRuralExercises.js';
import {
  avui, nomDelDia, NOM_FASE, resumDeMinims, setmanesFinsLesProves,
} from '../data/wodProgram.js';
import BarraLlindar from '../components/BarraLlindar.jsx';
import DetallDia from '../components/DetallDia.jsx';
import { analisiDelDia } from '../services/coach.js';

const VEREDICTE = {
  compleix:    { text: 'Compleix',          color: 'var(--color-pine)' },
  parcial:     { text: 'Compleix a mitges', color: 'var(--color-cursa)' },
  no_compleix: { text: 'No compleix',       color: 'var(--color-falta)' },
};

const TO = {
  cursa: 'var(--color-cursa)',
  forca: 'var(--color-forca)',
  aigua: 'var(--color-aigua)',
  agilitat: 'var(--color-agilitat)',
};

const NOM_BLOC = {
  escalfament: 'Escalfament',
  principal: 'Sèrie principal',
  secundari: 'Sèrie secundària',
  tecnica: 'Tècnica',
  especific: 'Específic',
  potencia: 'Potència',
  forca: 'Força',
  accessori: 'Accessori',
  calma: 'Tornada a la calma',
  sauna: 'Sauna',
};

function dataLlarga(iso) {
  const mesos = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol',
    'agost', 'setembre', 'octubre', 'novembre', 'desembre'];
  const d = new Date(iso + 'T00:00:00Z');
  return `${nomDelDia(iso).toLowerCase()} ${d.getUTCDate()} de ${mesos[d.getUTCMonth()]}`;
}

export default function DashboardPage({ onVesA }) {
  const { carrega, avuiResolt, marques, connectat, carregant } = usePlanStore();
  const [analisi, setAnalisi] = useState(null);
  const [obert, setObert] = useState(false);

  useEffect(() => { carrega(); }, [carrega]);
  useEffect(() => { analisiDelDia('alex', avui()).then(setAnalisi); }, []);

  const dia = avuiResolt();
  const resum = resumDeMinims(marques);
  const setmanes = setmanesFinsLesProves();
  const prova = dia?.prova ? PROVES[dia.prova] : null;
  const to = prova ? TO[prova.color] : 'var(--color-pine)';

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-5 sm:px-6 lg:max-w-5xl">

      {/* Qui som i quan som. Res més a dalt: el WOD ha de pujar. */}
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-[22px] font-bold leading-tight">{dataLlarga(avui())}</h1>
        <p className="xifra shrink-0 text-[13px] text-ink-soft">
          Setmana {dia?.setmana ?? 1} de {NOM_FASE[dia?.fase ?? 'base']}
        </p>
      </header>

      {!connectat && (
        <p className="mt-4 rounded-xl bg-pine-soft px-4 py-3 text-[13px] text-pine">
          Estàs veient el pla generat i les marques de partida. Per tenir
          l'entrenador, posa el fitxer <code>.env.local</code> i desplega la funció.
        </p>
      )}

      {/* ---------- El WOD d'avui ---------- */}
      <section className="mt-5 overflow-hidden rounded-3xl bg-surface shadow-[0_1px_2px_rgba(16,22,20,0.06),0_8px_24px_-12px_rgba(16,22,20,0.18)]">
        <div className="flex items-center gap-2.5 px-5 pt-5">
          <span className="h-4 w-1 rounded-full" style={{ backgroundColor: to }} />
          <span className="text-[14px] font-semibold" style={{ color: to }}>
            {dia?.castells
              ? 'Assaig de castells'
              : dia?.descans
                ? 'Descans'
                : (prova?.nom ?? 'Dia lliure')}
          </span>
          {dia?.ajustat && (
            <span className="ml-auto text-[12px] text-ink-faint">ajustat per l'entrenador</span>
          )}

        </div>

        <div className="px-5 pb-1 pt-2">
          <h2 className="text-[27px] font-bold leading-[1.1] tracking-[-0.02em]">
            {dia?.wod?.nom ?? 'Res programat'}
          </h2>
          {dia?.wod?.objectiu && (
            <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-ink-soft">
              {dia.wod.objectiu}
            </p>
          )}
          <p className="xifra mt-3 text-[13px] text-ink-faint">
            {dia?.wod?.durada_min ? `${dia.wod.durada_min} min` : ''}
            {dia?.sauna ? `, i ${dia.sauna.min} min de sauna a 80 °C` : ''}
          </p>
        </div>

        {/* Els blocs son una seqüencia real, aixi que van en ordre i amb filet. */}
        {dia?.wod?.blocs?.length > 0 && (
          <ol className="mt-4 divide-y divide-filet border-t border-filet">
            {dia.wod.blocs.map((b, i) => (
              <li key={i} className="flex gap-4 px-5 py-3.5">
                <span className="w-[108px] shrink-0 pt-px text-[13px] text-ink-faint">
                  {NOM_BLOC[b.tipus] ?? b.tipus}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium leading-snug">{b.text}</span>
                  {b.detall && (
                    <span className="mt-1 block text-[13px] leading-relaxed text-ink-soft">
                      {b.detall}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        )}

        {dia?.wod?.punts?.length > 0 && (
          <div className="border-t border-filet bg-paper px-5 py-4">
            {dia.wod.punts.map((p, i) => (
              <p key={i} className="max-w-[60ch] text-[13.5px] leading-relaxed text-ink-soft [&:not(:first-child)]:mt-2">
                {p}
              </p>
            ))}
          </div>
        )}

        {/* Si la sessió ja està feta, això és el que vol veure en obrir
            l'app: com ha anat, no què toca. */}
        {dia?.completada && (
          <button
            onClick={() => setObert(true)}
            className="flex w-full items-center gap-3 border-t border-filet px-5 py-4 text-left transition-colors hover:bg-paper"
            style={{ backgroundColor: 'var(--color-pine-soft)' }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0">
              <circle cx="10" cy="10" r="8.25" stroke="var(--color-pine)" strokeWidth="1.5" />
              <path d="M6.25 10.25l2.5 2.5 5-5.5" stroke="var(--color-pine)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-pine">Sessió feta</span>
              <span className="block text-[13px] text-pine/80">
                {analisi
                  ? `${VEREDICTE[analisi.veredicte]?.text ?? ''} · toca per veure l'anàlisi`
                  : "Toca per veure el detall"}
              </span>
            </span>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0">
              <path d="M7.5 4l6 6-6 6" stroke="var(--color-pine)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        <div className="flex flex-col gap-2 border-t border-filet px-5 py-4 sm:flex-row">
          <button
            onClick={() => onVesA?.('coach')}
            className="rounded-full bg-pine px-5 py-3 text-[14.5px] font-semibold text-white transition-colors hover:bg-[#0f3f22]"
          >
            Puja la sessió
          </button>
          <button
            onClick={() => onVesA?.('calendar')}
            className="rounded-full px-5 py-3 text-[14.5px] font-semibold text-ink-soft transition-colors hover:bg-paper"
          >
            Veure la setmana
          </button>
        </div>
      </section>

      {/* ---------- Els quatre llindars ---------- */}
      {/* Sense targeta: seuen sobre el fons amb filets, per no fer que tot
          siguin rectangles rodons iguals. */}
      <section className="mt-9">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-[17px] font-bold">Com vas respecte als mínims</h2>
          <p className="xifra shrink-0 text-[13px] text-ink-soft">
            {resum.passades} de {resum.total}
          </p>
        </div>

        <div className="mt-1 divide-y divide-filet">
          {resum.estats.map((e) => (
            <BarraLlindar key={e.prova.id} estat={e} />
          ))}
        </div>

        <p className="mt-4 max-w-[62ch] text-[13px] leading-relaxed text-ink-faint">
          Els mínims són els de la taula oficial per a homes de 29 anys o menys.
          Són llindars d'eliminació: no donen punts, només deixen passar.
        </p>
      </section>

      {/* ---------- Material que falta ---------- */}
      {dia?.prova === 'circuit_agilitat' && (
        <section className="mt-8 rounded-2xl border border-filet px-5 py-4">
          <h3 className="text-[15px] font-semibold">Et falta material per al circuit</h3>
          <p className="mt-1.5 max-w-[60ch] text-[13.5px] leading-relaxed text-ink-soft">
            {MATERIAL.avis}
          </p>
          <ul className="mt-3 space-y-1.5">
            {Object.entries(MATERIAL.substituts).map(([k, v]) => (
              <li key={k} className="text-[13.5px] leading-relaxed">
                <span className="font-semibold">{k === 'tanca' ? 'Tanca' : k === 'plint' ? 'Plint' : 'Sac'}: </span>
                <span className="text-ink-soft">{v}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {obert && <DetallDia data={avui()} onTanca={() => setObert(false)} />}

      <footer className="mt-9 border-t border-filet pt-5">
        <p className="xifra text-[13px] text-ink-soft">
          Queden <span className="font-bold text-ink">{setmanes} setmanes</span> per
          a les proves físiques, segons la data que has posat tu.
        </p>
        {carregant && <p className="mt-1 text-[12px] text-ink-faint">Carregant…</p>}
      </footer>
    </div>
  );
}
