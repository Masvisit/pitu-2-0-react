import { useEffect, useMemo, useRef, useState } from 'react';
import FitParser from 'fit-file-parser';
import { resumFIT } from '../services/fitResum.js';
import {
  analitzaSessio, guardaSessio, canvisPendents, resolCanvi,
  preguntesObertes, responPregunta, hiHaSupabase, ultimesMetriques,
} from '../services/coach.js';
import { getWODForDate, avui } from '../data/wodProgram.js';
import { PROVES } from '../data/agentRuralExercises.js';

function llegeixFIT(buffer) {
  const parser = new FitParser({
    force: true,
    speedUnit: 'km/h',
    lengthUnit: 'm',
    temperatureUnit: 'celsius',
    mode: 'list',
  });
  return new Promise((resolve, reject) => {
    parser.parse(buffer, (err, data) => (err ? reject(err) : resolve(data)));
  });
}

/** "fa 6 dies", perque es vegi d'un cop d'ull si estan passats. */
function diesDes(iso) {
  const d = Math.round((Date.now() - new Date(iso + 'T00:00:00Z').getTime()) / 86400000);
  if (d <= 0) return 'Avui mateix.';
  if (d === 1) return 'Fa un dia.';
  if (d < 10) return `Fa ${d} dies.`;
  return `Fa ${d} dies, ja toca actualitzar-los.`;
}

export default function IACoachPage() {
  const [mode, setMode] = useState('fit'); // fit | manual
  const [fitxer, setFitxer] = useState(null);
  const [activitatFit, setActivitatFit] = useState(null);
  const [manual, setManual] = useState({
    data: avui(), esport: 'natació', durada_min: '', distancia_m: '',
    fc_mitjana: '', fc_maxima: '',
  });
  const [notes, setNotes] = useState('');
  const [estat, setEstat] = useState('repos'); // repos | llegint | enviant | fet | error
  const [error, setError] = useState('');
  const [resposta, setResposta] = useState(null);
  const [pendents, setPendents] = useState([]);
  const [preguntes, setPreguntes] = useState([]);
  const [respostes, setRespostes] = useState({});
  const [metriques, setMetriques] = useState({ vo2max: '', running_index: '', carrega: '' });
  const [ultimes, setUltimes] = useState(null);
  const inputRef = useRef(null);

  const recarregaPendents = async () => {
    setPendents(await canvisPendents('alex'));
    setPreguntes(await preguntesObertes('alex'));
  };

  useEffect(() => { recarregaPendents(); }, []);
  useEffect(() => { ultimesMetriques('alex').then(setUltimes); }, []);

  async function trien(f) {
    if (!f) return;
    setFitxer(f);
    setEstat('llegint');
    setError('');
    setResposta(null);
    try {
      const fit = await llegeixFIT(await f.arrayBuffer());
      const resum = resumFIT(fit);
      if (!resum.data) throw new Error('No he trobat la data dins del fitxer.');
      setActivitatFit(resum);
      setEstat('repos');
    } catch (e) {
      setActivitatFit(null);
      setError(`No he pogut llegir el fitxer: ${e.message}`);
      setEstat('error');
    }
  }

  /** Els camps buits han de ser null, no zero: un zero inventat enganya
   *  l'entrenador tant com una xifra falsa. */
  function nombre(v) {
    const n = Number(String(v).replace(',', '.'));
    return Number.isFinite(n) && String(v).trim() !== '' ? n : null;
  }

  function canviaManual(camp, valor) {
    setManual({ ...manual, [camp]: valor });
    setResposta(null);
  }

  /** L'activitat manual es calcula del formulari, no es guarda a part: si
   *  fos estat, no existiria fins que toquessis un camp, i amb la data ja
   *  posada per defecte podries no tocar-ne cap. */
  const activitatManual = useMemo(() => {
    if (!manual.data) return null;
    const durada = nombre(manual.durada_min);
    const distancia = nombre(manual.distancia_m);
    return {
      data: manual.data,
      hora: null,
      esport: manual.esport || null,
      sub_esport: null,
      durada_min: durada,
      distancia_m: distancia,
      fc_mitjana: nombre(manual.fc_mitjana),
      fc_maxima: nombre(manual.fc_maxima),
      cadencia_mitjana: null,
      ritme_min_km: distancia && durada ? +(durada / (distancia / 1000)).toFixed(2) : null,
      n_registres: 0,
      origen: 'manual',
    };
  }, [manual]);

  const activitat = mode === 'fit' ? activitatFit : activitatManual;

  function canviaMode(nou) {
    setMode(nou);
    setActivitatFit(null);
    setFitxer(null);
    setResposta(null);
    setError('');
  }

  async function envia() {
    if (!activitat) return;
    setEstat('enviant');
    setError('');
    try {
      const previst = getWODForDate(activitat.data);
      await guardaSessio('alex', {
        data: activitat.data,
        prova: previst.prova,
        previst: previst.wod ?? {},
        realitzat: {
          ...activitat,
          vo2max: nombre(metriques.vo2max),
          running_index: nombre(metriques.running_index),
          carrega: nombre(metriques.carrega),
        },
        notes,
        fitxer_fit: mode === 'fit' ? (fitxer?.name ?? null) : null,
      });
      const ambMetriques = {
        ...activitat,
        vo2max: nombre(metriques.vo2max),
        running_index: nombre(metriques.running_index),
        carrega: nombre(metriques.carrega),
      };
      const r = await analitzaSessio('alex', ambMetriques, notes);
      if (!r?.ok) throw new Error(r?.error ?? 'La funció no ha respost.');
      setResposta(r);
      setEstat('fet');
      recarregaPendents();
    } catch (e) {
      setError(String(e.message ?? e));
      setEstat('error');
    }
  }

  const previst = activitat?.data ? getWODForDate(activitat.data) : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-5 sm:px-6">
      <h1 className="text-[22px] font-bold">Puja l'entrenament</h1>
      <p className="mt-1.5 max-w-[58ch] text-[14px] leading-relaxed text-ink-soft">
        Amb rellotge, puja el .FIT: es llegeix aquí al navegador i només
        se n'envia el resum. Sense rellotge, escriu-la a mà. L'entrenador
        l'analitza igual i, si cal, ajusta el pla.
      </p>

      {!hiHaSupabase && (
        <p className="mt-4 rounded-xl bg-pine-soft px-4 py-3 text-[13px] leading-relaxed text-pine">
          Encara no hi ha connexió: falta el fitxer <code>.env.local</code> i
          desplegar la funció. Pots llegir un FIT per veure què en surt, però
          no es guardarà res.
        </p>
      )}

      {/* Dues maneres d'entrar la sessió. Els dies que no portis rellotge,
          l'app ha de servir igual. */}
      <div className="mt-5 flex gap-1 rounded-full bg-filet/60 p-1">
        {[['fit', 'Puja un .FIT'], ['manual', 'Escriu-la a mà']].map(([id, text]) => (
          <button
            key={id}
            onClick={() => canviaMode(id)}
            aria-pressed={mode === id}
            className={`flex-1 rounded-full py-2.5 text-[14px] font-semibold transition-colors ${
              mode === id ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(16,22,20,0.08)]' : 'text-ink-soft'
            }`}
          >
            {text}
          </button>
        ))}
      </div>

      {/* Zona de pujada. Vorera discontínua, no targeta: s'ha de veure que és un buit per omplir. */}
      {mode === 'fit' && (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); trien(e.dataTransfer.files?.[0]); }}
        className="mt-5 rounded-2xl border-2 border-dashed border-filet bg-surface/60 px-5 py-8 text-center"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".fit,.FIT"
          className="sr-only"
          onChange={(e) => trien(e.target.files?.[0])}
        />
        <p className="text-[15px] font-semibold">
          {fitxer ? fitxer.name : 'Arrossega el .FIT aquí'}
        </p>
        <p className="mt-1 text-[13px] text-ink-soft">
          {estat === 'llegint' ? 'Llegint el fitxer…' : "O tria'l del disc"}
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-4 rounded-full border border-filet bg-surface px-5 py-2.5 text-[14px] font-semibold transition-colors hover:border-ink-faint"
        >
          Tria un fitxer
        </button>
      </div>
      )}

      {/* Entrada manual. Produeix exactament la mateixa forma de dades que
          el lector de FIT, així que a partir d'aquí tot el camí és el mateix. */}
      {mode === 'manual' && (
        <section className="mt-5 overflow-hidden rounded-2xl bg-surface">
          <div className="border-b border-filet px-5 py-3.5">
            <h2 className="text-[15px] font-semibold">Què has fet</h2>
            <p className="mt-1 text-[13px] text-ink-soft">
              Només el dia és obligatori. La resta, si ho saps; el que deixis
              en blanc no s'envia i l'entrenador no se l'inventa. Les sèries
              van al camp gros de sota.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 px-5 py-4">
            <label className="col-span-2 sm:col-span-1">
              <span className="block text-[13px] text-ink-soft">Dia</span>
              <input
                type="date"
                value={manual.data}
                onChange={(e) => canviaManual('data', e.target.value)}
                className="mt-1 w-full rounded-xl border border-filet px-3 py-2.5 text-[15px]"
              />
            </label>

            <label className="col-span-2 sm:col-span-1">
              <span className="block text-[13px] text-ink-soft">Què</span>
              <select
                value={manual.esport}
                onChange={(e) => canviaManual('esport', e.target.value)}
                className="mt-1 w-full rounded-xl border border-filet bg-surface px-3 py-2.5 text-[15px]"
              >
                <option value="natació">Natació</option>
                <option value="cursa">Cursa</option>
                <option value="press banca">Press banca</option>
                <option value="circuit">Circuit</option>
                <option value="castells">Castells</option>
                <option value="altra">Altra</option>
              </select>
            </label>

            <label>
              <span className="block text-[13px] text-ink-soft">Minuts</span>
              <input
                type="number" inputMode="numeric" min="1" placeholder="55"
                value={manual.durada_min}
                onChange={(e) => canviaManual('durada_min', e.target.value)}
                className="mt-1 w-full rounded-xl border border-filet px-3 py-2.5 text-[15px]"
              />
            </label>

            <label>
              <span className="block text-[13px] text-ink-soft">Metres</span>
              <input
                type="number" inputMode="numeric" min="0" placeholder="1200"
                value={manual.distancia_m}
                onChange={(e) => canviaManual('distancia_m', e.target.value)}
                className="mt-1 w-full rounded-xl border border-filet px-3 py-2.5 text-[15px]"
              />
            </label>

            <label>
              <span className="block text-[13px] text-ink-soft">FC mitjana</span>
              <input
                type="number" inputMode="numeric" min="0" placeholder="—"
                value={manual.fc_mitjana}
                onChange={(e) => canviaManual('fc_mitjana', e.target.value)}
                className="mt-1 w-full rounded-xl border border-filet px-3 py-2.5 text-[15px]"
              />
            </label>

            <label>
              <span className="block text-[13px] text-ink-soft">FC màxima</span>
              <input
                type="number" inputMode="numeric" min="0" placeholder="—"
                value={manual.fc_maxima}
                onChange={(e) => canviaManual('fc_maxima', e.target.value)}
                className="mt-1 w-full rounded-xl border border-filet px-3 py-2.5 text-[15px]"
              />
            </label>
          </div>

          {!activitat && (
            <p className="border-t border-filet px-5 py-3 text-[13px] text-ink-faint">
              Posa com a mínim el dia.
            </p>
          )}
        </section>
      )}

      {/* Què ha sortit del fitxer. Sense inventar res: si no hi és, no es mostra. */}
      {mode === 'fit' && activitat && (
        <section className="mt-5 overflow-hidden rounded-2xl bg-surface">
          <div className="border-b border-filet px-5 py-3.5">
            <h2 className="text-[15px] font-semibold">Això és el que diu el fitxer</h2>
          </div>
          <dl className="divide-y divide-filet">
            {[
              ['Data', activitat.data + (activitat.hora ? ` a les ${activitat.hora}` : '')],
              ['Esport', activitat.esport ?? 'no consta al fitxer'],
              ['Durada', activitat.durada_min ? `${activitat.durada_min} min` : '—'],
              ['Distància', activitat.distancia_m ? `${activitat.distancia_m} m` : '—'],
              ['Freqüència mitjana', activitat.fc_mitjana ? `${activitat.fc_mitjana} ppm` : '—'],
              ['Freqüència màxima', activitat.fc_maxima ? `${activitat.fc_maxima} ppm` : '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 px-5 py-2.5">
                <dt className="text-[13.5px] text-ink-soft">{k}</dt>
                <dd className="xifra text-[14px] font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          {previst?.wod && (
            <p className="border-t border-filet bg-paper px-5 py-3 text-[13px] leading-relaxed text-ink-soft">
              Aquell dia tocava <span className="font-semibold text-ink">{previst.wod.nom}</span>
              {previst.prova ? ` (${PROVES[previst.prova].curt})` : ''}. L'entrenador
              compararà què tocava amb què has fet.
            </p>
          )}
        </section>
      )}

      {/* Tres xifres del rellotge que no surten del FIT i que es mouen poc.
          Buides per defecte: mai s'arrossega un valor vell. */}
      {activitat && (
        <section className="mt-5 overflow-hidden rounded-2xl bg-surface">
          <div className="border-b border-filet px-5 py-3.5">
            <h2 className="text-[15px] font-semibold">Del rellotge, si els tens a mà</h2>
            <p className="mt-1 text-[13px] text-ink-soft">
              {ultimes
                ? `Els vas apuntar per última vegada el ${ultimes.data}. ${diesDes(ultimes.data)}`
                : 'Encara no n\'has apuntat cap.'}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 px-5 py-4">
            {[
              ['vo2max', 'VO2max', ultimes?.vo2max],
              ['running_index', 'Running index', ultimes?.running_index],
              ['carrega', 'Càrrega', ultimes?.carrega],
            ].map(([clau, etiqueta, previ]) => (
              <label key={clau}>
                <span className="block text-[13px] text-ink-soft">{etiqueta}</span>
                <input
                  type="number" inputMode="numeric"
                  placeholder={previ != null ? String(previ) : '—'}
                  value={metriques[clau]}
                  onChange={(e) => setMetriques({ ...metriques, [clau]: e.target.value })}
                  className="xifra mt-1 w-full rounded-xl border border-filet px-3 py-2.5 text-[15px]"
                />
                {previ != null && (
                  <span className="mt-1 block text-[11.5px] text-ink-faint">última: {previ}</span>
                )}
              </label>
            ))}
          </div>
        </section>
      )}

      {activitat && (
        <section className="mt-5">
          <label htmlFor="notes" className="text-[15px] font-semibold">
            {mode === 'manual' ? 'Què has fet, sèrie a sèrie' : "Com t'has trobat"}
          </label>
          <p className="mt-1 max-w-[58ch] text-[13px] leading-relaxed text-ink-soft">
            {mode === 'manual'
              ? "Escriu-ho tal com ho apuntaries en paper. Exercici, sèries, repeticions i pes. I al final, com t'has trobat: energia, dolors, si anaves cansat dels castells."
              : "Energia, dolors, hores de son, si anaves cansat dels castells. Això canvia la lectura més que les xifres."}
          </p>
          <textarea
            id="notes"
            rows={mode === 'manual' ? 10 : 3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={mode === 'manual'
              ? `Press banca
20x15kg
20x20kg
4x 12x40kg
1 serie en format test: 40 kg, 45 s -> 23 reps

Press inclinat
3x 12x30kg

Cames pesades de l'assaig, pero he acabat.`
              : "Cames pesades des de l'assaig de dimarts, però he acabat les sèries."}
            className="mt-2.5 w-full resize-y rounded-xl border border-filet bg-surface px-3.5 py-3 font-mono text-[14px] leading-relaxed placeholder:text-ink-faint sm:font-sans sm:text-[14.5px]"
          />
          <button
            onClick={envia}
            disabled={estat === 'enviant' || !hiHaSupabase}
            className="mt-3 w-full rounded-full bg-pine px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#0f3f22] disabled:bg-ink-faint sm:w-auto"
          >
            {estat === 'enviant' ? 'Analitzant…' : "Demana l'anàlisi"}
          </button>
        </section>
      )}

      {error && (
        <p className="mt-5 rounded-xl border border-falta/30 bg-falta/5 px-4 py-3 text-[13.5px] leading-relaxed text-falta">
          {error}
        </p>
      )}

      {/* La resposta de l'entrenador. */}
      {resposta && (
        <section className="mt-6 overflow-hidden rounded-2xl bg-surface">
          <div className="flex items-center gap-2.5 border-b border-filet px-5 py-3.5">
            <h2 className="text-[15px] font-semibold">L&apos;entrenador diu</h2>
            {resposta.veredicte && (
              <span
                className="ml-auto rounded-full px-2.5 py-1 text-[12px] font-semibold"
                style={{
                  color: resposta.veredicte === 'compleix' ? 'var(--color-pine)'
                    : resposta.veredicte === 'parcial' ? 'var(--color-cursa)' : 'var(--color-falta)',
                  backgroundColor: resposta.veredicte === 'compleix' ? 'var(--color-pine-soft)' : 'transparent',
                  border: resposta.veredicte === 'compleix' ? 'none' : '1px solid currentColor',
                }}
              >
                {resposta.veredicte === 'compleix' ? 'Compleix'
                  : resposta.veredicte === 'parcial' ? 'Compleix a mitges' : 'No compleix'}
              </span>
            )}
          </div>

          {resposta.analisi ? (
            <div className="px-5 py-4">
              {resposta.analisi.split('\n').filter(Boolean).map((p, i) => (
                <p key={i} className="max-w-[62ch] text-[14.5px] leading-relaxed [&:not(:first-child)]:mt-3">{p}</p>
              ))}
            </div>
          ) : (
            <div className="px-5 py-4">
              <p className="text-[14px] leading-relaxed text-ink-soft">
                {resposta.motiu_aturada === 'max_tokens'
                  ? "S'ha quedat sense espai a mig escriure. Torna-ho a provar."
                  : 'No ha deixat cap anàlisi. Torna-ho a provar; si es repeteix, és un error.'}
              </p>
              <p className="xifra mt-2 text-[12px] text-ink-faint">
                motiu: {resposta.motiu_aturada ?? '?'} · eines cridades: {resposta.n_eines ?? 0}
              </p>
            </div>
          )}

          {resposta.marques?.length > 0 && (
            <div className="border-t border-filet bg-pine-soft px-5 py-3.5">
              <p className="text-[13px] font-semibold text-pine">Marca nova</p>
              {resposta.marques.map((m, i) => (
                <p key={i} className="xifra mt-1 text-[14px] text-pine">
                  {m.prova.replace('_', ' ')}: {m.valor} {m.unitat}
                </p>
              ))}
            </div>
          )}

          {resposta.canvis?.length > 0 && (
            <div className="border-t border-filet px-5 py-3.5">
              <p className="text-[13px] text-ink-soft">
                {resposta.canvis.some((c) => c.aplicat) ? 'Ha tocat el pla' : 'Proposa un canvi'}
              </p>
              {resposta.canvis.map((c, i) => (
                <p key={i} className="mt-1 max-w-[60ch] text-[14px] leading-relaxed">
                  <span className="font-medium">{c.abast}:</span> {c.motiu}
                </p>
              ))}
            </div>
          )}

          {resposta.diari?.length > 0 && (
            <div className="border-t border-filet px-5 py-3.5">
              <p className="text-[13px] text-ink-soft">Queda sota vigilància</p>
              {resposta.diari.map((d, i) => (
                <p key={i} className="mt-1.5 max-w-[60ch] text-[13.5px] leading-relaxed">
                  {d.observacio} <span className="text-ink-soft">{d.que_vigila}</span>
                </p>
              ))}
            </div>
          )}

          {resposta.accions?.length > 0 && (
            <details className="border-t border-filet px-5 py-3">
              <summary className="cursor-pointer text-[13px] text-ink-faint">Detall del que ha fet</summary>
              <ul className="mt-2 space-y-1">
                {resposta.accions.map((a, i) => (
                  <li key={i} className="text-[13px] text-ink-soft">{a}</li>
                ))}
              </ul>
            </details>
          )}

          {typeof resposta.cost_usd === 'number' && (
            <div className="border-t border-filet px-5 py-2.5">
              <p className="xifra text-[12px] text-ink-faint">
                {resposta.cost_usd < 0.01
                  ? `menys d'un cèntim · ${resposta.model}`
                  : `${(resposta.cost_usd * 0.92).toFixed(3)} € · ${resposta.model}`}
                {resposta.us ? ` · ${(resposta.us.entrada + resposta.us.cau_llegit + resposta.us.cau_escrit).toLocaleString('ca')} tokens` : ''}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Canvis grans esperant que els aprovis. */}
      {pendents.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[17px] font-bold">Espera la teva aprovació</h2>
          <div className="mt-3 space-y-3">
            {pendents.map((c) => (
              <div key={c.id} className="rounded-2xl border border-filet bg-surface px-5 py-4">
                <p className="text-[13px] text-ink-soft">Canvi de {c.abast}</p>
                <p className="mt-1 max-w-[60ch] text-[14.5px] leading-relaxed">{c.motiu}</p>
                <p className="xifra mt-2 text-[12.5px] text-ink-faint">
                  Evidència: {(c.evidencia ?? []).join(', ')}
                </p>
                <div className="mt-3.5 flex gap-2">
                  <button
                    onClick={async () => { await resolCanvi(c.id, true); recarregaPendents(); }}
                    className="rounded-full bg-pine px-4 py-2 text-[13.5px] font-semibold text-white"
                  >
                    Aprova
                  </button>
                  <button
                    onClick={async () => { await resolCanvi(c.id, false); recarregaPendents(); }}
                    className="rounded-full px-4 py-2 text-[13.5px] font-semibold text-ink-soft hover:bg-paper"
                  >
                    Rebutja
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Preguntes obertes. */}
      {preguntes.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[17px] font-bold">Et pregunta</h2>
          <div className="mt-3 space-y-3">
            {preguntes.map((p) => (
              <div key={p.id} className="rounded-2xl border border-filet bg-surface px-5 py-4">
                <p className="max-w-[60ch] text-[14.5px] leading-relaxed font-medium">{p.text}</p>
                {p.per_que && (
                  <p className="mt-1 max-w-[60ch] text-[13px] leading-relaxed text-ink-soft">{p.per_que}</p>
                )}
                <textarea
                  rows={2}
                  value={respostes[p.id] ?? ''}
                  onChange={(e) => setRespostes({ ...respostes, [p.id]: e.target.value })}
                  className="mt-2.5 w-full resize-y rounded-xl border border-filet px-3.5 py-2.5 text-[14px]"
                />
                <button
                  onClick={async () => {
                    await responPregunta(p.id, respostes[p.id] ?? '');
                    recarregaPendents();
                  }}
                  className="mt-2.5 rounded-full border border-filet px-4 py-2 text-[13.5px] font-semibold"
                >
                  Contesta
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
