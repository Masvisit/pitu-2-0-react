// Barra inferior al mobil, que es on es fa servir l'app, i barra superior
// a partir de tauleta. Cinc destins, sempre els mateixos, sempre al mateix
// ordre: aixi s'apren el cami.

const ICONES = {
  avui: (
    <path d="M4 13l3.5 3.5L11 10l3 3 4-6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  ),
  setmana: (
    <>
      <rect x="3.25" y="4.75" width="15.5" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 9h15M7.5 3v3.5M14.5 3v3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </>
  ),
  entrena: (
    <>
      <path d="M11 17V7.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M7 11.5L11 7l4 4.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 19.5h13" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </>
  ),
  progres: (
    <path d="M4 17V9.5M9 17V5M14 17v-6M19 17v-9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
  ),
  ajustos: (
    <>
      <circle cx="11" cy="11" r="2.6" stroke="currentColor" strokeWidth="1.7" />
      <path d="M11 3.5v2M11 16.5v2M3.5 11h2M16.5 11h2M5.9 5.9l1.4 1.4M14.7 14.7l1.4 1.4M16.1 5.9l-1.4 1.4M7.3 14.7l-1.4 1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
};

const DESTINS = [
  { id: 'dashboard', icona: 'avui', text: 'Avui' },
  { id: 'calendar', icona: 'setmana', text: 'Setmana' },
  { id: 'coach', icona: 'entrena', text: 'Entrena' },
  { id: 'progress', icona: 'progres', text: 'Progrés' },
  { id: 'settings', icona: 'ajustos', text: 'Ajustos' },
];

export default function Navbar({ currentPage, setCurrentPage }) {
  return (
    <>
      {/* Mòbil: a baix, a l'abast del polze. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-filet bg-surface/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Navegació principal"
      >
        <ul className="mx-auto flex max-w-lg">
          {DESTINS.map((d) => {
            const actiu = currentPage === d.id;
            return (
              <li key={d.id} className="flex-1">
                <button
                  onClick={() => setCurrentPage(d.id)}
                  aria-current={actiu ? 'page' : undefined}
                  className={`flex w-full flex-col items-center gap-1 py-2.5 ${actiu ? 'text-pine' : 'text-ink-faint'}`}
                >
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                    {ICONES[d.icona]}
                  </svg>
                  <span className={`text-[11px] ${actiu ? 'font-semibold' : 'font-medium'}`}>{d.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Tauleta i escriptori: a dalt. */}
      <nav
        className="sticky top-0 z-20 hidden border-b border-filet bg-surface/90 backdrop-blur lg:block"
        aria-label="Navegació principal"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-1 px-6 py-3">
          <span className="mr-5 text-[15px] font-bold tracking-[-0.01em]">PITU</span>
          {DESTINS.map((d) => {
            const actiu = currentPage === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setCurrentPage(d.id)}
                aria-current={actiu ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-[14px] transition-colors ${
                  actiu ? 'bg-pine-soft font-semibold text-pine' : 'font-medium text-ink-soft hover:bg-paper'
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  {ICONES[d.icona]}
                </svg>
                {d.text}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
