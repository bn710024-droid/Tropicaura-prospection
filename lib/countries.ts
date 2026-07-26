// Le champ `country` en base est du texte libre saisi par l'utilisateur (import CSV, formulaire).
// Pour positionner un pays sur la carte du monde (react-simple-maps + topojson world-atlas), on fait
// correspondre ce texte libre à son code numérique ISO 3166-1 — standard stable, contrairement aux
// libellés anglais du topojson qui varient selon la version du jeu de données. On compare toujours en
// nombre (Number(geo.id) === code) pour ignorer les éventuels zéros de padding ("012" vs "12").
//
// Cette table couvre les marchés réalistes de Tropic-Aura (Europe, Moyen-Orient, Afrique du Nord +
// quelques autres). Un pays absent de cette liste n'est simplement pas positionné sur la carte — il
// reste compté dans le Top Pays, qui lit le texte brut sans passer par cette table.
const COUNTRY_TO_ISO_NUMERIC: Record<string, number> = {
  france: 250,
  "pays-bas": 528,
  "pays bas": 528,
  netherlands: 528,
  "royaume-uni": 826,
  "royaume uni": 826,
  angleterre: 826,
  uk: 826,
  allemagne: 276,
  espagne: 724,
  italie: 380,
  belgique: 56,
  portugal: 620,
  suisse: 756,
  autriche: 40,
  suede: 752,
  norvege: 578,
  danemark: 208,
  finlande: 246,
  irlande: 372,
  pologne: 616,
  "republique tcheque": 203,
  grece: 300,
  luxembourg: 442,
  "emirats arabes unis": 784,
  "emirats arabes": 784,
  eau: 784,
  dubai: 784,
  "abou dabi": 784,
  "arabie saoudite": 682,
  qatar: 634,
  koweit: 414,
  bahrein: 48,
  oman: 512,
  jordanie: 400,
  liban: 422,
  turquie: 792,
  israel: 376,
  maroc: 504,
  tunisie: 788,
  algerie: 12,
  egypte: 818,
  libye: 434,
  senegal: 686,
  "cote d ivoire": 384,
  mali: 466,
  "etats-unis": 840,
  "etats unis": 840,
  usa: 840,
  canada: 124,
  "coree du sud": 410,
  chine: 156,
  japon: 392,
  inde: 356,
  "afrique du sud": 710,
  russie: 643,
  ukraine: 804,
};

function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function countryNameToIsoNumeric(rawName: string | null): number | null {
  if (!rawName) return null;
  return COUNTRY_TO_ISO_NUMERIC[normalize(rawName)] ?? null;
}
