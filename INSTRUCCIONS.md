# PITU 2.0 · Muntar-ho en el PC nou

Ja està tot refet i connectat. Això no és copiar fitxers solts: descomprimeixes
el projecte sencer i funciona.

Els passos **4**, **9** i **14** són portes. Si una no et passa, atura't allà.

---

## Primer: instal·lar el que et falta

El PC està buit, així que comencem per aquí. Són instal·ladors normals.

**1.** Ves a **nodejs.org** i baixa la versió marcada com a **LTS**.
Instal·la-la. Ha de ser Node 22 o superior: el projecte fa servir Vite 8, que
amb versions més velles no arrenca.

**2.** Ves a **code.visualstudio.com** i instal·la el Visual Studio Code.

**3.** Ves a **git-scm.com** i instal·la el Git. No el necessites avui, però el
voldràs per pujar el projecte a GitHub i no tornar a quedar-te sense còpia.

**4. Porta.** Obre el **PowerShell** (tecla Windows, escriu `powershell`,
Enter) i escriu això, línia a línia:

```powershell
node -v
npm -v
```

Les dues han de respondre amb números, i la primera ha de començar per `v22` o
més amunt. Si alguna diu que no coneix la comanda, tanca el PowerShell, obre'l
de nou i torna-ho a provar. Si segueix fallant, aquella instal·lació no ha anat
bé i no té sentit continuar.

---

## Posar el projecte al seu lloc

**5.** Crea la carpeta on viurà:

```powershell
mkdir C:\dev
```

La ruta és curta a propòsit. El Windows té problemes amb rutes llargues i
`node_modules` en fa moltes.

**6.** Descomprimeix el fitxer `pitu-2-0.zip` dins de `C:\dev\`. Has de quedar
amb la carpeta `C:\dev\pitu-2-0\` i, a dins, `package.json`, `src`, `supabase`.

**7.** Instal·la les llibreries. Tarda un parell de minuts i escriu molt text:

```powershell
cd C:\dev\pitu-2-0
npm install
```

---

## Veure que funciona, abans de tocar cap servidor

**8.** Arrenca-la:

```powershell
npm run dev
```

**9. Porta.** Obre l'adreça que et surti, normalment
`http://localhost:5173`, i entra amb el PIN **1234**.

Has de veure el WOD d'avui amb les sèries, i a sota les quatre barres dels
mínims: la navette i el press banca per sota de la ratlla vermella, la piscina
just per sobre. Si veus això, tota la part de l'app ja està.

Encara no hi ha entrenador: surt un avís verd que ho diu. És normal, el muntem
ara. Atura el servidor amb **Ctrl+C**.

---

## Connectar-ho amb l'API

**10.** Al VS Code, obre la carpeta (**File → Open Folder → C:\dev\pitu-2-0**).
Clic dret a la zona de fitxers → *New File*, i anomena'l `.env.local` (comença
amb punt). Enganxa-hi aquestes dues línies i guarda amb **Ctrl+S**:

```
VITE_SUPABASE_URL=https://fymakypbniywhnxgmbbe.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_KTzzrgHa610pdo5Gq6yDuw_MSnwaNsE
```

Aquests dos valors acaben dins del codi que es baixa el navegador, i no passa
res: són públics per disseny. La clau de l'API de Claude **no** va aquí.

**11.** Entra a **supabase.com**, obre el teu projecte i busca **SQL Editor** al
menú de l'esquerra. És una caixa de text amb un botó verd **Run**.

Obre `supabase\schema.sql` al VS Code, selecciona-ho tot amb **Ctrl+A**,
copia-ho i enganxa-ho a la caixa. Clica **Run**. Ha de dir *Success*.

**12.** Clica **New query** per buidar la caixa i enganxa això. **Canvia la data
de l'examen abans de clicar Run**: els mínims ja són els teus de debò, però la
data és la que vas posar tu com a provisional.

```sql
insert into perfil (usuari, edat, fc_maxima, piscina_metres,
                    dies_disponibles, dies_castells,
                    data_examen_1, data_examen_2, minims, fase_actual)
values ('alex', 26, 194, 25,
        array['dl','dc','dj','ds','dg'], array['dm','dv'],
        '2027-04-15',   -- teòric
        '2027-08-15',   -- proves físiques  ← canvia-les si tens dates reals
        '{"navette": 9, "press_banca": 28, "piscina": 45, "circuit_agilitat": 13}',
        'base')
on conflict (usuari) do update set
  data_examen_1 = excluded.data_examen_1,
  data_examen_2 = excluded.data_examen_2,
  minims = excluded.minims;

insert into marques (usuari, prova, valor, unitat, data, origen) values
  ('alex', 'navette',     6,  'sector', '2026-09-10', 'test registrat a PITU'),
  ('alex', 'piscina',     43, 'seg',    '2026-08-12', 'test de 50 m'),
  ('alex', 'press_banca', 22, 'rep',    '2026-09-20', 'test de 40 kg en 45 s');
```

**13.** Puja el programet que parla amb la Claude. Quatre comandes al
PowerShell, des de `C:\dev\pitu-2-0`:

```powershell
npx supabase login
npx supabase link --project-ref fymakypbniywhnxgmbbe
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
npx supabase functions deploy coach
```

La clau la treus de **console.anthropic.com**. Queda guardada al servidor de
Supabase i no entra mai al navegador: per això la crida passa per aquí i no
directament des del React.

---

## Comprovar-ho

**14. Porta.** Al VS Code crea un fitxer `cos.json` a l'arrel del projecte:

```json
{
  "usuari": "alex",
  "activitat": {
    "data": "2026-10-12",
    "esport": "running",
    "durada_min": 58,
    "distancia_m": 7400,
    "fc_mitjana": 171,
    "fc_maxima": 186
  },
  "notes": "cames pesades de l'assaig, he acabat les sèries just"
}
```

I al PowerShell, aquesta línia sencera:

```powershell
curl.exe -X POST "https://fymakypbniywhnxgmbbe.supabase.co/functions/v1/coach" -H "Content-Type: application/json" -H "Authorization: Bearer sb_publishable_KTzzrgHa610pdo5Gq6yDuw_MSnwaNsE" -d "@cos.json"
```

Si torna `"ok":true` amb un text en català, ja està tot connectat.

Si torna `"ok":false`, el camp `error` t'ho diu: normalment falta la clau
(pas 13) o les taules (pas 11). Enganxa'm l'error.

**15.** Torna a arrencar l'app amb `npm run dev`. L'avís verd ha d'haver
desaparegut, i a *Entrena* ja pots pujar un FIT de debò.

---

## La prova que de debò importa

Puja una sessió dolenta i mira el calendari. **No ha de canviar res.** Només
una anàlisi i, com a molt, una anotació al diari. Si et toca el calendari amb
una sola sessió, alguna cosa està mal muntada.

Per veure la regla aturant canvis, al SQL Editor:

```sql
select observacio, que_vigila from diari where usuari='alex'
order by creat_el desc limit 10;
```

Les entrades que comencen per `[ajust rebutjat]` o `[ajust ajornat]` són
intents que la validació ha parat.

---

## Què he verificat jo

Executat en aquest entorn, no suposat:

- L'app compila i arrenca. He obert les cinc pàgines amb un Chromium de debò a
  390, 768 i 1280 px: cap error de JavaScript i cap desbordament horitzontal.
- `schema.sql` corre net a PostgreSQL 16 i es pot repetir.
- `index.ts` passa `deno check` sense errors de tipus.
- Les 8 proves de la regla d'evidència passen, i les 12 del lector de FIT també.
- El generador del pla dona 44 setmanes fins a les proves, fase Base la setmana 1,
  i reparteix els castells a dimarts i divendres.

Tres coses que vaig trobar trencades del projecte vell, i que per això el
dashboard es veia malament:

1. **El Tailwind no estava instal·lat.** Les classes hi eren però el CSS
   compilat feia 0,35 kB, o sigui buit. Ara en fa 34 kB.
2. **Un `* { padding: 0 }` fora de capa** deixava mort cada marge i cada
   `px-4` de tota l'app. Per això tot anava enganxat a la vora.
3. **`font-600` i `font-700` no existeixen a Tailwind.** Hi havia 29 classes
   d'aquestes i tot el text sortia a pes normal, sense cap jerarquia.

**No** verificat, perquè des d'aquí no hi arribo: els passos 13 i 14, que
necessiten el teu Supabase i la teva clau.
