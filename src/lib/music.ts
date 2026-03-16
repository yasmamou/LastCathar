export interface MusicTrack {
  id: string
  title: string
  artist: string
  era: string
  year: string
  context: string
  file: string
  region: string
  wiki: string
}

export const MUSIC_LIBRARY: MusicTrack[] = [
  // ── MAGHREB / ANTIQUE → ANDALOU → OTTOMAN ──
  {
    id: 'seikilos',
    title: 'Épitaphe de Seikilos',
    artist: 'Lyre antique — plus ancienne mélodie du monde',
    era: 'Antiquité',
    year: '~200 av. J.-C.',
    context: "Musique gréco-romaine de l'époque de Juba II et Massinissa. La cour de Caesarea (Cherchell) était profondément hellénisée — c'est ce type de mélodies à la lyre que Juba II et Cléopâtre Séléné auraient écouté dans leur palais.",
    file: '/ambient-maghreb.ogg',
    region: 'maghreb',
    wiki: 'https://fr.wikipedia.org/wiki/%C3%89pitaphe_de_Seikilos',
  },
  {
    id: 'istikhbar',
    title: 'Istikhbar Djarka',
    artist: 'Improvisation au oud arabo-andalou',
    era: 'Tradition andalouse',
    year: '~XIIe-XVe siècle',
    context: "L'Istikhbar est une improvisation au oud dans un mode (maqam) andalou. Cette tradition musicale née à Cordoue et Grenade a migré au Maghreb avec l'exil des Morisques, s'enracinant à Tlemcen, Alger, Constantine et Fès.",
    file: '/music-maghreb-andalou.ogg',
    region: 'maghreb',
    wiki: 'https://fr.wikipedia.org/wiki/Musique_arabo-andalouse',
  },
  {
    id: 'husseyni',
    title: 'Hüseyni Saz Semâîsi',
    artist: 'Saz — musique classique ottomane',
    era: 'Empire ottoman',
    year: '~XVIIe siècle',
    context: "Pièce instrumentale au saz (luth à manche long) dans le mode Hüseyni. Sous la Régence d'Alger (XVIe-XIXe s.), la musique ottomane se mêlait aux traditions locales berbères et andalouses.",
    file: '/music-maghreb-ottoman.ogg',
    region: 'maghreb',
    wiki: 'https://fr.wikipedia.org/wiki/Musique_ottomane',
  },
  // ── FRANCE ──
  {
    id: 'gregorian',
    title: 'Gloria (Chant grégorien)',
    artist: 'Chœur monastique',
    era: 'Moyen Âge',
    year: '~IXe siècle',
    context: "Le chant grégorien résonnait dans les abbayes cathares et les cathédrales du Languedoc. C'est la voix de l'Église qui combattit le catharisme et lança la croisade albigeoise.",
    file: '/ambient-gregorian.ogg',
    region: 'france',
    wiki: 'https://fr.wikipedia.org/wiki/Chant_gr%C3%A9gorien',
  },
  {
    id: 'introit',
    title: 'Ad te levavi (Introit)',
    artist: 'Chant grégorien, VIIIe ton',
    era: 'Moyen Âge',
    year: '~Xe siècle',
    context: "Introit du premier dimanche de l'Avent. Ces mélodies accompagnaient les offices dans les monastères cisterciens de Fontfroide, Lagrasse et Cluny.",
    file: '/music-france-medieval.ogg',
    region: 'france',
    wiki: 'https://fr.wikipedia.org/wiki/Chant_gr%C3%A9gorien',
  },
  {
    id: 'josquin',
    title: 'Tu Pauperum Refugium',
    artist: 'Josquin des Prés',
    era: 'Renaissance',
    year: '~1500',
    context: "Josquin des Prés, considéré comme le plus grand compositeur de la Renaissance, a révolutionné la polyphonie. Sa musique incarne le passage du Moyen Âge à l'époque moderne.",
    file: '/music-france-renaissance.ogg',
    region: 'france',
    wiki: 'https://fr.wikipedia.org/wiki/Josquin_des_Pr%C3%A9s',
  },
  // ── ESPAGNE ──
  {
    id: 'pange',
    title: 'Pange Lingua',
    artist: 'Hymne latin (tradition espagnole)',
    era: 'Moyen Âge',
    year: '~XIIIe siècle',
    context: "Hymne eucharistique attribué à Thomas d'Aquin (1264). Chanté dans les cathédrales espagnoles durant la Reconquista, il accompagna l'avancée chrétienne de Tolède à Grenade.",
    file: '/music-spain-pange.ogg',
    region: 'spain',
    wiki: 'https://fr.wikipedia.org/wiki/Pange_lingua_gloriosi_corporis_mysterium',
  },
  {
    id: 'solea',
    title: 'Soleá',
    artist: 'Flamenco traditionnel',
    era: 'Époque moderne',
    year: '~XIXe siècle',
    context: "La Soleá est considérée comme la \"mère du flamenco\". Son chant profond mêle les héritages gitans, arabes et andalous dans une expression de douleur et de beauté.",
    file: '/music-spain-solea.ogg',
    region: 'spain',
    wiki: 'https://fr.wikipedia.org/wiki/Sole%C3%A1',
  },
  {
    id: 'flamenco',
    title: 'Soleá para Bailar',
    artist: 'Flamenco (enregistrement 1948)',
    era: 'XXe siècle',
    year: '1948',
    context: "Enregistrement historique de 1948 captant l'essence brute du flamenco de l'après-guerre, quand les tablaos de Séville et Cadix préservaient une tradition séculaire.",
    file: '/ambient-spain.ogg',
    region: 'spain',
    wiki: 'https://fr.wikipedia.org/wiki/Flamenco',
  },
  // ── ITALIE / GRÈCE ──
  {
    id: 'palestrina',
    title: 'Vestiva i colli',
    artist: 'Giovanni Pierluigi da Palestrina',
    era: 'Renaissance',
    year: '~1566',
    context: "Palestrina, maître de la polyphonie romaine, a composé dans l'ombre du Vatican. Sa musique incarne la splendeur de la Renaissance italienne, entre Raphaël et Michel-Ange.",
    file: '/ambient-italy.ogg',
    region: 'italy',
    wiki: 'https://fr.wikipedia.org/wiki/Giovanni_Pierluigi_da_Palestrina',
  },
  {
    id: 'tarantella',
    title: 'Tarantella',
    artist: 'Danse traditionnelle italienne',
    era: 'Époque moderne',
    year: '~XVIIIe siècle',
    context: "Danse frénétique du sud de l'Italie, la tarantella était censée guérir la morsure de la tarentule. Ses rythmes endiablés résonnaient de Naples à la Sicile.",
    file: '/music-italy-tarantella.ogg',
    region: 'italy',
    wiki: 'https://fr.wikipedia.org/wiki/Tarentelle',
  },
]

export type MusicRegion = 'france' | 'maghreb' | 'spain' | 'italy'

export function getRegionFromCountry(country: string | undefined): MusicRegion {
  if (!country) return 'france'
  const c = country.toLowerCase()
  if (['algérie', 'algerie', 'tunisie', 'maroc', 'libye', 'mauritanie', 'soudan', 'mali', 'sénégal', 'egypte', 'égypte', 'jordanie', 'liban', 'syrie', 'irak', 'iran', 'turquie'].some(x => c.includes(x))) return 'maghreb'
  if (['espagne', 'spain'].some(x => c.includes(x))) return 'spain'
  if (['italie', 'italy', 'grèce', 'grece', 'greece'].some(x => c.includes(x))) return 'italy'
  return 'france'
}

export function getTracksForRegion(region: MusicRegion): MusicTrack[] {
  return MUSIC_LIBRARY.filter((t) => t.region === region)
}

export function getBestTrackForEra(region: MusicRegion, eras: string[]): MusicTrack {
  const tracks = getTracksForRegion(region)
  if (tracks.length === 0) return MUSIC_LIBRARY[0]

  // Try to match era keywords
  if (eras.length > 0) {
    const eraStr = eras.join(' ').toLowerCase()
    if (eraStr.includes('antiquité') || eraStr.includes('romain') || eraStr.includes('phénicien') || eraStr.includes('punique')) {
      const ancient = tracks.find((t) => t.era === 'Antiquité')
      if (ancient) return ancient
    }
    if (eraStr.includes('renaissance') || eraStr.includes('xve') || eraStr.includes('xvie')) {
      const ren = tracks.find((t) => t.era === 'Renaissance')
      if (ren) return ren
    }
    if (eraStr.includes('contemporain') || eraStr.includes('xxe') || eraStr.includes('xixe')) {
      const modern = tracks.find((t) => t.era.includes('moderne') || t.era.includes('XXe'))
      if (modern) return modern
    }
  }

  // Default: first track for region
  return tracks[0]
}
