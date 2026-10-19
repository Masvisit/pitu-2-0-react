// =====================================================================
// PITU 2.0 · Base d'exercicis de l'oposicio d'Agent Rural
//
// Els minims son els de la taula oficial per a homes de 29 anys o menys,
// els que vas corregir el 8 d'octubre. Son llindars d'eliminacio, no
// l'escala de punts.
//
// Fitxer generat: si l'edites a ma, canvia nomes els textos.
// =====================================================================

export const PROVES = {
  navette: {
    id: "navette",
    nom: "Cursa de llançadora",
    curt: "Navette",
    color: "cursa",
    unitat: "períodes",
    minim: 9,
    mesEsMillor: true,
    descripcio:
      "Anades i tornades de 20 m seguint un senyal sonor que va accelerant.",
    nota: "Període, sector i palier són la mateixa cosa.",
  },
  piscina: {
    id: "piscina",
    nom: "Exercici aquàtic 50 m",
    curt: "Piscina",
    color: "aigua",
    unitat: "segons",
    minim: 45,
    mesEsMillor: false,
    descripcio: "50 m nedant a estil lliure.",
    nota: "La piscina on entrenes és de 25 m, així que el test són dos llargs i un viratge.",
  },
  press_banca: {
    id: "press_banca",
    nom: "Press de banca",
    curt: "Press banca",
    color: "forca",
    unitat: "repeticions",
    minim: 28,
    mesEsMillor: true,
    descripcio: "Màxim de repeticions amb 40 kg en 45 segons.",
    nota: "El límit és el temps, no la força: 28 reps en 45 s són una cada 1,6 segons.",
  },
  circuit_agilitat: {
    id: "circuit_agilitat",
    nom: "Circuit d'agilitat",
    curt: "Circuit",
    color: "agilitat",
    unitat: "segons",
    minim: 13,
    mesEsMillor: false,
    descripcio:
      "Assegut a terra, tombarella, tanca, per sobre del plint, tanca, tanca, i agafar el sac per portar-lo 10 m fins a la meta.",
    nota: "Tanques de 90 cm i sac de 20 kg. Entre 2 i 3 m per estació. Dos intents no consecutius.",
  },
};

export const ORDRE_PROVES = [
  "navette",
  "press_banca",
  "piscina",
  "circuit_agilitat",
];

export const MATERIAL = {
  tens: [
    "Piscina de 25 m",
    "Gimnàs amb banc i barra",
    "Rig de calistènia exterior",
    "Matalassos",
    "Espai obert",
    "Sauna a 80 °C i 30 % d'humitat",
  ],
  noTens: ["Plint", "Tanques de 90 cm", "Sac de 20 kg"],
  substituts: {
    tanca:
      "Salta el rig o un banc, mesurant 90 cm amb cinta i marcant l'alçada.",
    plint: "Passa per sobre d'un banc de gimnàs, amb les mans al seient.",
    sac: "Motxilla llastada amb discos fins a arribar als 20 kg.",
  },
  avis: "Sense tanques de 90 cm, plint ni sac de 20 kg, les sessions de circuit entrenen els components per separat. El temps real de 13 s només es pot mesurar amb el material oficial: fins llavors, el cronòmetre d'aquestes sessions és orientatiu.",
};

export const SAUNA = {
  piscina: { min: 30, text: "Recuperació profunda" },
  navette: { min: 20, text: "Recuperació activa" },
  press_banca: { min: 25, text: "Recuperació muscular" },
  circuit_agilitat: { min: 25, text: "Recuperació general" },
};

export const WODS = [
  {
    id: "nav-base",
    prova: "navette",
    fase: "base",
    nom: "Navette · base aeròbica",
    objectiu: "Pujar el sostre aeròbic. Els sectors arriben després, no ara.",
    durada_min: 60,
    blocs: [
      {
        tipus: "escalfament",
        text: "10 min de trot progressiu",
        detall: "Acaba suant, sense ofegar-te. Mobilitat de turmell i maluc.",
      },
      {
        tipus: "principal",
        text: "5 × 1.000 m en zona 3",
        detall:
          "Ritme que et deixa dir frases curtes. 2 min caminant entre sèries.",
      },
      {
        tipus: "tecnica",
        text: "6 × 20 m de canvi de sentit",
        detall: "Frena amb el peu de fora i surt amb tres passes curtes.",
      },
      {
        tipus: "calma",
        text: "5 min de trot molt suau",
        detall: "I estiraments de bessons i quàdriceps.",
      },
    ],
    punts: [
      "A la navette no es perd per cor: es perd a la frenada i el canvi de sentit.",
      "Si acabes les 5 sèries sense baixar el ritme, la setmana que ve en fas 6.",
    ],
  },
  {
    id: "nav-intensify",
    prova: "navette",
    fase: "intensify",
    nom: "Navette · ritme de test",
    objectiu: "Ensenyar al cos el ritme del Sector 9, que és on has d'arribar.",
    durada_min: 55,
    blocs: [
      {
        tipus: "escalfament",
        text: "10 min de trot i 4 × 20 m progressius",
        detall: "L'últim progressiu, gairebé a tope.",
      },
      {
        tipus: "principal",
        text: "2 blocs de 8 × 20 m al ritme del Sector 9",
        detall:
          "45 s entre sèries i 3 min entre blocs. Marca els 20 m amb cinta.",
      },
      {
        tipus: "secundari",
        text: "6 × 200 m a ritme fort",
        detall: "90 s de recuperació. Aquí es construeix el marge.",
      },
      {
        tipus: "calma",
        text: "400 m a la piscina, molt suau",
        detall: "Treu les cames de sobre.",
      },
    ],
    punts: [
      "Vas per Sector 6 i el mínim és 9. Tres sectors és el forat més gran que tens.",
      "Si no aguantes els dos blocs sencers, fes-ne un i mig i apunta-ho tal com ha anat.",
    ],
  },
  {
    id: "nav-taper",
    prova: "navette",
    fase: "taper",
    nom: "Navette · test",
    objectiu: "Mesurar on ets de debò.",
    durada_min: 40,
    blocs: [
      {
        tipus: "escalfament",
        text: "12 min de trot, mobilitat i 3 progressius",
        detall: "Sense cansar-te gens.",
      },
      {
        tipus: "principal",
        text: "Navette completa fins que no arribis al senyal",
        detall: "Amb l'àudio oficial. Apunta el sector exacte on t'atures.",
      },
      { tipus: "calma", text: "10 min caminant i estiraments", detall: "" },
    ],
    punts: [
      "Aquesta marca entra a l'app i canvia el pla. És l'única sessió on el número importa més que la sensació.",
    ],
  },
  {
    id: "pis-base",
    prova: "piscina",
    fase: "base",
    nom: "Piscina · tècnica i volum",
    objectiu:
      "Nedar més eficient. Ja passes el mínim; ara es tracta de tenir marge.",
    durada_min: 55,
    blocs: [
      {
        tipus: "escalfament",
        text: "300 m variats",
        detall: "100 crol, 100 esquena, 100 crol suau.",
      },
      {
        tipus: "tecnica",
        text: "8 × 25 m amb pull buoy",
        detall:
          "Braçada llarga. Compta les braçades per llarg i intenta baixar-ne una.",
      },
      {
        tipus: "principal",
        text: "10 × 50 m a ritme controlat",
        detall:
          "45 s de descans. Objectiu: totes iguals, cap per sobre de 50 s.",
      },
      { tipus: "calma", text: "200 m suaus", detall: "" },
    ],
    punts: [
      "Fas 43 s i el màxim és 45. Passes, però per dos segons: un mal dia i no passes.",
      "El guany més fàcil aquí és la sortida i el viratge, no nedar més fort.",
    ],
  },
  {
    id: "pis-intensify",
    prova: "piscina",
    fase: "intensify",
    nom: "Piscina · ritme de 50 m",
    objectiu: "Baixar dels 43 s i guanyar marge sobre el mínim.",
    durada_min: 50,
    blocs: [
      { tipus: "escalfament", text: "400 m progressius", detall: "" },
      {
        tipus: "tecnica",
        text: "6 × 15 m de sortida des del poialet",
        detall:
          "Entrada neta i tres braçades fortes. Descans complet entre repeticions.",
      },
      {
        tipus: "principal",
        text: "8 × 50 m a ritme de test",
        detall:
          "90 s de descans. Objectiu per sèrie: 42 s o menys. Cronometra-les totes.",
      },
      {
        tipus: "secundari",
        text: "4 × 25 m a tope",
        detall: "60 s de descans.",
      },
      { tipus: "calma", text: "200 m suaus", detall: "" },
    ],
    punts: [
      "La teva piscina és de 25 m i el test també: un sol viratge. Treballa'l.",
      "Si les vuit sèries no baixen de 43 s, no és dia de forçar. Apunta-ho.",
    ],
  },
  {
    id: "pis-taper",
    prova: "piscina",
    fase: "taper",
    nom: "Piscina · test de 50 m",
    objectiu: "Mesurar la marca en condicions de test.",
    durada_min: 40,
    blocs: [
      { tipus: "escalfament", text: "400 m i 4 × 15 m de sortida", detall: "" },
      {
        tipus: "principal",
        text: "50 m cronometrats des del poialet",
        detall: "Un sol intent seriós. Descansa 10 min i fes-ne un segon.",
      },
      { tipus: "calma", text: "300 m suaus", detall: "" },
    ],
    punts: ["Apunta el millor dels dos intents a l'app."],
  },
  {
    id: "pbanca-base",
    prova: "press_banca",
    fase: "base",
    nom: "Press banca · força de base",
    objectiu:
      "Fer que els 40 kg et pesin menys, per poder fer més repeticions.",
    durada_min: 60,
    blocs: [
      {
        tipus: "escalfament",
        text: "2 × 15 flexions i mobilitat d'espatlla",
        detall: "I una sèrie de 12 amb la barra buida.",
      },
      {
        tipus: "principal",
        text: "5 × 5 al 75 % del teu màxim",
        detall: "2 a 3 min de descans. Baixada controlada, pujada ràpida.",
      },
      {
        tipus: "especific",
        text: "3 × màxim de reps amb 40 kg en 45 s",
        detall: "3 min de descans. Apunta les reps de cada sèrie per separat.",
      },
      {
        tipus: "accessori",
        text: "3 × 10 rem amb barra i 3 × 8 fons al rig",
        detall: "L'esquena sosté el press. No te la salts.",
      },
    ],
    punts: [
      "Vas per 22 reps i el mínim és 28. Sis repeticions no es guanyen amb força bruta, es guanyen amb cadència.",
      "Entrena amb metrònom: 28 reps en 45 s són una cada 1,6 s.",
    ],
  },
  {
    id: "pbanca-intensify",
    prova: "press_banca",
    fase: "intensify",
    nom: "Press banca · format de test",
    objectiu: "Repetir el test real fins que 28 reps deixin de ser un sostre.",
    durada_min: 55,
    blocs: [
      {
        tipus: "escalfament",
        text: "Mobilitat, 2 × 12 amb barra buida i 1 × 8 a 30 kg",
        detall: "",
      },
      {
        tipus: "principal",
        text: "4 × test real: 40 kg, 45 s, màxim de reps",
        detall: "4 min de descans entre sèries. Apunta-les totes quatre.",
      },
      {
        tipus: "potencia",
        text: "5 × 3 press explosiu al 55 %",
        detall: "Tan ràpid com puguis en la pujada. 90 s de descans.",
      },
      {
        tipus: "accessori",
        text: "3 × 12 rem i 2 × màxim de flexions",
        detall: "",
      },
    ],
    punts: [
      "Si la primera sèrie et dona 26 i l'última 18, el problema és la resistència, no la força.",
      "Si totes quatre et donen el mateix, pots carregar més al bloc de força.",
    ],
  },
  {
    id: "pbanca-taper",
    prova: "press_banca",
    fase: "taper",
    nom: "Press banca · test",
    objectiu: "Mesurar les repeticions en condicions de test.",
    durada_min: 35,
    blocs: [
      {
        tipus: "escalfament",
        text: "Mobilitat, 2 × 10 amb barra buida i 1 × 6 a 30 kg",
        detall: "Sense arribar a cansar-te.",
      },
      {
        tipus: "principal",
        text: "1 × test: 40 kg, 45 s, màxim de reps",
        detall: "Que algú t'ho compti i cronometri.",
      },
      { tipus: "calma", text: "300 m de piscina suau", detall: "" },
    ],
    punts: ["Aquesta marca entra a l'app."],
  },
  {
    id: "circ-base",
    prova: "circuit_agilitat",
    fase: "base",
    nom: "Circuit · components per separat",
    objectiu: "Entrenar cada estació del circuit amb el material que tens.",
    durada_min: 50,
    blocs: [
      {
        tipus: "escalfament",
        text: "Mobilitat completa i 3 tombarelles lentes sobre matalàs",
        detall: "La tombarella en fred és com es fan mal els colls.",
      },
      {
        tipus: "principal",
        text: "6 × tombarella i sprint de 10 m",
        detall:
          "Des d'assegut a terra, com al test. 60 s de descans. Cronometra.",
      },
      {
        tipus: "especific",
        text: "6 × salt al rig a 90 cm",
        detall: "Marca els 90 cm amb cinta: és l'alçada real de la tanca.",
      },
      {
        tipus: "especific",
        text: "6 × pas per sobre del banc",
        detall: "Substitut del plint: mans al seient, cames per sobre.",
      },
      {
        tipus: "forca",
        text: "6 × 10 m de transport amb motxilla llastada",
        detall: "Carrega-la fins als 20 kg amb discos. 90 s de descans.",
      },
    ],
    punts: [
      "No tens plint, ni tanques, ni sac de 20 kg: això entrena les parts, no el conjunt.",
      "El teu temps aquí no es pot comparar amb els 13 s oficials fins que no provis el circuit real.",
    ],
  },
  {
    id: "circ-intensify",
    prova: "circuit_agilitat",
    fase: "intensify",
    nom: "Circuit · simulació enllaçada",
    objectiu: "Enllaçar les estacions sense perdre temps a les transicions.",
    durada_min: 50,
    blocs: [
      {
        tipus: "escalfament",
        text: "Mobilitat, 4 tombarelles i 4 salts progressius",
        detall: "",
      },
      {
        tipus: "principal",
        text: "5 × circuit simulat sencer, cronometrat",
        detall:
          "Assegut, tombarella, salt al rig, banc, salt, salt, motxilla 10 m. 3 min entre intents.",
      },
      {
        tipus: "tecnica",
        text: "8 × transició terra-peus",
        detall:
          "D'assegut a corrent en el mínim de temps. És el tros on més es guanya.",
      },
      { tipus: "calma", text: "300 m de piscina suau", detall: "" },
    ],
    punts: [
      "Apunta els 5 temps. El que interessa és que el cinquè s'assembli al primer.",
      "Si el temps es dispara a partir del tercer, el problema és la resistència, no la tècnica.",
    ],
  },
  {
    id: "circ-taper",
    prova: "circuit_agilitat",
    fase: "taper",
    nom: "Circuit · test",
    objectiu: "Dos intents cronometrats, com al test.",
    durada_min: 35,
    blocs: [
      {
        tipus: "escalfament",
        text: "Mobilitat completa, 3 tombarelles i 3 salts",
        detall: "",
      },
      {
        tipus: "principal",
        text: "2 × circuit cronometrat, no consecutius",
        detall: "Descansa 10 min entre intents, com a la prova oficial.",
      },
      { tipus: "calma", text: "Estiraments i 200 m de piscina", detall: "" },
    ],
    punts: [
      "Si has pogut muntar el circuit amb material real, aquesta marca sí que entra a l'app.",
    ],
  },
  {
    id: "descans",
    prova: null,
    fase: "qualsevol",
    nom: "Descans actiu",
    objectiu: "Recuperar. El progrés es fa els dies que no entrenes fort.",
    durada_min: 40,
    blocs: [
      {
        tipus: "principal",
        text: "20 a 30 min de piscina molt suau",
        detall: "Sense cronòmetre ni sèries.",
      },
      { tipus: "calma", text: "Mobilitat general", detall: "" },
      { tipus: "sauna", text: "20 min a 80 °C", detall: "" },
    ],
    punts: [
      "És l'únic dia de descans de la setmana. No te'l saltis ni el facis fort.",
    ],
  },
];

/** Troba el WOD d'una prova per a una fase. */
export function wodDe(prova, fase) {
  return (
    WODS.find((w) => w.prova === prova && w.fase === fase) ??
    WODS.find((w) => w.prova === prova) ??
    null
  );
}
