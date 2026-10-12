import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { setmanesFinsLesProves } from '../data/wodProgram.js';

const LLARGADA_PIN = 4;
const TECLES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', null, '0', 'esborra'];

// Els colors surten de la paleta de l'app, no del que hi hagi guardat al
// navegador: els usuaris de mostra portaven un blau i un verd que
// desentonen amb la resta.
const COLORS = ['var(--color-pine)', 'var(--color-aigua)', 'var(--color-cursa)', 'var(--color-agilitat)'];

export default function LoginPage() {
  const { login, users } = useAuthStore();
  const [usuari, setUsuari] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const prova = useCallback(
    (codi) => {
      if (!usuari) return;
      if (!login(usuari.id, codi)) {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 600);
      }
    },
    [login, usuari],
  );

  const escriu = useCallback(
    (xifra) => {
      if (error) return;
      setPin((actual) => {
        if (actual.length >= LLARGADA_PIN) return actual;
        const nou = actual + xifra;
        if (nou.length === LLARGADA_PIN) setTimeout(() => prova(nou), 120);
        return nou;
      });
    },
    [error, prova],
  );

  // Al PC no cal clicar: el teclat de debò també val.
  useEffect(() => {
    if (!usuari) return;
    const alPolsar = (e) => {
      if (/^[0-9]$/.test(e.key)) escriu(e.key);
      else if (e.key === 'Backspace') setPin((p) => p.slice(0, -1));
      else if (e.key === 'Escape') { setUsuari(null); setPin(''); }
    };
    window.addEventListener('keydown', alPolsar);
    return () => window.removeEventListener('keydown', alPolsar);
  }, [usuari, escriu]);

  const setmanes = setmanesFinsLesProves();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-5 py-10">
      <div className="w-full max-w-sm">

        <header className="text-center">
          <h1 className="text-[34px] font-bold leading-none tracking-[-0.03em]">PITU</h1>
          <p className="xifra mt-2 text-[13px] text-ink-soft">
            {setmanes} setmanes per a les proves
          </p>
        </header>

        {/* ---------- Pas 1: qui ets ---------- */}
        {!usuari && (
          <div className="mt-10">
            <h2 className="text-[15px] font-semibold text-ink-soft">Qui entrena?</h2>
            <ul className="mt-3 space-y-2">
              {users.map((u, i) => (
                <li key={u.id}>
                  <button
                    onClick={() => { setUsuari(u); setPin(''); }}
                    className="flex w-full items-center gap-3.5 rounded-2xl bg-surface px-4 py-3.5 text-left transition-colors hover:bg-pine-soft"
                  >
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[17px] font-bold text-white"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    >
                      {u.name[0].toUpperCase()}
                    </span>
                    <span className="text-[16px] font-semibold">{u.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ---------- Pas 2: el PIN ---------- */}
        {usuari && (
          <div className="mt-10">
            <button
              onClick={() => { setUsuari(null); setPin(''); setError(false); }}
              className="mx-auto flex items-center gap-2 text-[14px] font-semibold text-ink-soft transition-colors hover:text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M12.5 4L6.5 10l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {usuari.name}
            </button>

            {/* Quatre punts que es van omplint. */}
            <div className={`mt-7 flex justify-center gap-3.5 ${error ? 'tremola' : ''}`}>
              {Array.from({ length: LLARGADA_PIN }, (_, i) => (
                <span
                  key={i}
                  className="h-3.5 w-3.5 rounded-full transition-colors"
                  style={{
                    backgroundColor: error
                      ? 'var(--color-falta)'
                      : i < pin.length
                        ? 'var(--color-pine)'
                        : 'var(--color-filet)',
                  }}
                />
              ))}
            </div>

            <p className="mt-3 text-center text-[13px]" aria-live="polite">
              {error
                ? <span className="text-falta">PIN incorrecte</span>
                : <span className="text-ink-faint">Marca el teu PIN</span>}
            </p>

            {/* Teclat numèric. Al mòbil és l'única manera còmoda. */}
            <div className="mx-auto mt-6 grid max-w-[264px] grid-cols-3 gap-3">
              {TECLES.map((t, i) => {
                if (t === null) return <span key={i} />;
                if (t === 'esborra') {
                  return (
                    <button
                      key={i}
                      onClick={() => setPin((p) => p.slice(0, -1))}
                      aria-label="Esborra"
                      className="grid h-16 place-items-center rounded-2xl text-ink-soft transition-colors active:bg-filet"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M9 6h10a2 2 0 012 2v8a2 2 0 01-2 2H9l-6-6 6-6z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                        <path d="M12.5 10l4 4M16.5 10l-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                      </svg>
                    </button>
                  );
                }
                return (
                  <button
                    key={i}
                    onClick={() => escriu(t)}
                    className="xifra grid h-16 place-items-center rounded-2xl bg-surface text-[24px] font-semibold transition-colors active:bg-pine-soft"
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
