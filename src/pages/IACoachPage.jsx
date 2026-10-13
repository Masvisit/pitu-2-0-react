import { useEffect, useRef, useState } from 'react';
import FitParser from 'fit-file-parser';
import { resumFIT } from '../services/fitResum.js';
import {
  analitzaSessio, guardaSessio, canvisPendents, resolCanvi,
  preguntesObertes, responPregunta, hiHaSupabase,
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

export default function IACoachPage() {
  const [fitxer, setFitxer] = useState(null);
  const [activitat, setActivitat] = useState(null);
  const [notes, setNotes] = useState('');
  const [estat, setEstat] = useState('repos'); // repos | llegint | enviant | fet | error
  const [error, setError] = useState('');
  const [resposta, setResposta] = useState(null);
  const [pendents, setPendents] = useState([]);
  const [preguntes, setPreguntes] = useState([]);
  const [respostes, setRespostes] = useState({});
  const inputRef = useRef(null);

  const recarregaPendents = async () => {
    setPendents(await canvisPendents('alex'));
    setPreguntes(await preguntesObertes('alex'));
  };

  useEffect(() => { recarregaPendents(); }, []);

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
      setActivitat(resum);
      setEstat('repos');
    } catch (e) {
      setActivitat(null);
      setError(`No he pogut llegir el fitxer: ${e.message}`);
      setEstat('error');
    }
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
        realitzat: activitat,
        notes,
        fitxer_fit: fitxer?.name ?? null,
      });
      const r = await analitzaSessio('alex', activitat, notes);
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
        El fitxer es llegeix aquí al navegador i només se n'envia el resum.
        L'entrenador l'analitza i, si cal, ajusta el pla.
      </p>

      {!hiHaSupabase && (
        <p className="mt-4 rounded-xl bg-pine-soft px-4 py-3 text-[13px] leading-relaxed text-pine">
          Encara no hi ha connexió: falta el fitxer <code>.env.local</code> i
          desplegar la funció. Pots llegir un FIT per veure què en surt, però
          no es guardarà res.
        </p>
      )}

      {/* Zona de pujada. Vorera discontínua, no targeta: s'ha de veure que és un buit per omplir. */}
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

      {/* Què ha sortit del fitxer. Sense inventar res: si no hi és, no es mostra. */}
      {activitat && (
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

      {activitat && (
        <section className="mt-5">
          <label htmlFor="notes" className="text-[15px] font-semibold">
            Com t'has trobat
          </label>
          <p className="mt-1 text-[13px] text-ink-soft">
            Energia, dolors, hores de son, si anaves cansat dels castells. Això
            canvia la lectura més que les xifres.
          </p>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Cames pesades des de l'assaig de dimarts, però he acabat les sèries."
            className="mt-2.5 w-full resize-y rounded-xl border border-filet bg-surface px-3.5 py-3 text-[14.5px] leading-relaxed placeholder:text-ink-faint"
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
            <p className="px-5 py-4 text-[14px] text-ink-soft">
              No ha deixat cap anàlisi. Torna-ho a provar; si es repeteix, és un error.
            </p>
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
