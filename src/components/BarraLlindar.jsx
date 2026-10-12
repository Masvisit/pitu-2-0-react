// Una prova, una pista amb el minim oficial marcat amb una ratlla dura.
// Si la barra creua la ratlla, passes. Si no, el buit queda etiquetat.
// Es l'unic element cridaner de l'app, i per aixo la resta va callada.

const TO = {
  cursa: 'var(--color-cursa)',
  forca: 'var(--color-forca)',
  aigua: 'var(--color-aigua)',
  agilitat: 'var(--color-agilitat)',
};

export default function BarraLlindar({ estat }) {
  const { prova, marca, minim, passa, buit, senseMarca } = estat;
  const to = TO[prova.color] ?? 'var(--color-pine)';

  // La ratlla del minim seu al 72 % de l'ample, sempre al mateix lloc, de
  // manera que les quatre pistes es llegeixin d'un sol cop d'ull.
  const TALL = 72;

  // On arriba la barra. Si mes es millor, es marca/minim; si menys es
  // millor, s'inverteix, perque la barra sempre creixi cap al minim.
  let fraccio = 0;
  if (!senseMarca) {
    fraccio = prova.mesEsMillor ? marca / minim : minim / marca;
  }
  const ample = Math.min(fraccio * TALL, 100);

  return (
    <div className="py-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[15px] font-semibold">{prova.curt}</span>
        <span className="xifra text-[15px] text-ink-soft">
          {senseMarca ? (
            <span className="text-ink-faint">sense mesurar</span>
          ) : (
            <>
              <span className="font-bold text-ink">{marca}</span>
              <span className="text-ink-faint"> / {minim} {prova.unitat}</span>
            </>
          )}
        </span>
      </div>

      <div className="relative mt-2.5 h-2 rounded-full bg-filet">
        {!senseMarca && (
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
            style={{ width: `${ample}%`, backgroundColor: to }}
          />
        )}
        {/* La ratlla del minim. Dura, prima, per sobre de la barra. */}
        <div
          className="absolute -top-1 bottom-[-4px] w-[2px] rounded-full"
          style={{ left: `${TALL}%`, backgroundColor: passa ? 'var(--color-pine)' : 'var(--color-falta)' }}
          aria-hidden="true"
        />
      </div>

      <div className="mt-2 text-[13px]">
        {senseMarca ? (
          <span className="text-ink-faint">Fes el test per saber on ets</span>
        ) : passa ? (
          <span className="text-pine">
            Per sobre del mínim
            {prova.mesEsMillor ? ` per ${marca - minim}` : ` per ${minim - marca}`} {prova.unitat}
          </span>
        ) : (
          <span className="text-falta">
            Falten {buit} {prova.unitat}
          </span>
        )}
      </div>
    </div>
  );
}
