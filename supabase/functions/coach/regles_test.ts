// Assercions a ma: jsr.io no sempre es accessible, i aixo no necessita llibreria.
function assert(c: unknown, m = 'assercio falsa'): void {
  if (!c) throw new Error(m);
}
function assertEquals<T>(a: T, b: T): void {
  if (a !== b) throw new Error(`esperava ${JSON.stringify(b)}, he rebut ${JSON.stringify(a)}`);
}
import { setmanaISO, validaEvidencia } from './regles.ts';

// A la BD de prova hi ha aquestes quatre sessions i cap mes.
const EXISTENTS = new Set(['2026-09-29', '2026-10-02', '2026-10-07', '2026-10-09']);
const bd = (dates: string[]) =>
  Promise.resolve(new Set(dates.filter((d) => EXISTENTS.has(d))));

Deno.test('setmanaISO agrupa la mateixa setmana i separa la seguent', () => {
  assertEquals(setmanaISO('2026-09-29'), setmanaISO('2026-10-02'));
  assert(setmanaISO('2026-10-07') !== setmanaISO('2026-10-02'));
  assertEquals(setmanaISO('2026-01-01'), '2026-W1');
});

Deno.test('menys de tres dates: rebutjat', async () => {
  const v = await validaEvidencia(['2026-09-29', '2026-10-07'], bd);
  assert(!v.ok && v.motiu.includes('en calen tres'));
});

Deno.test('dates repetides no son tres sessions', async () => {
  const v = await validaEvidencia(['2026-09-29', '2026-09-29', '2026-10-07'], bd);
  assert(!v.ok && v.motiu.includes('repetides'));
});

Deno.test('data mal formada: rebutjat abans de tocar la BD', async () => {
  const v = await validaEvidencia(['2026-09-29', 'ahir', '2026-10-07'], bd);
  assert(!v.ok && v.motiu.includes('mal formades'));
});

Deno.test('data inventada: rebutjat', async () => {
  const v = await validaEvidencia(['2026-09-29', '2026-10-07', '2026-10-30'], bd);
  assert(!v.ok && v.motiu.includes('no corresponen'));
});

Deno.test('tres sessions de la mateixa setmana son una mala setmana', async () => {
  // 29/09 i 02/10 cauen a la mateixa setmana ISO; hi afegim una tercera igual.
  const bd2 = (d: string[]) =>
    Promise.resolve(new Set(d.filter((x) => ['2026-09-28', '2026-09-29', '2026-10-02'].includes(x))));
  const v = await validaEvidencia(['2026-09-28', '2026-09-29', '2026-10-02'], bd2);
  assert(!v.ok && v.motiu.includes('mateixa setmana'));
});

Deno.test('tres sessions reals en dues setmanes: acceptat', async () => {
  const v = await validaEvidencia(['2026-09-29', '2026-10-02', '2026-10-07'], bd);
  assertEquals(v.ok, true);
});

Deno.test('quatre sessions en tres setmanes: acceptat', async () => {
  const v = await validaEvidencia(['2026-09-29', '2026-10-02', '2026-10-07', '2026-10-09'], bd);
  assertEquals(v.ok, true);
});
