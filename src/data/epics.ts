/**
 * Épopées — collections de lieux liés par un fil narratif
 * Chaque épopée regroupe des lieux existants (par slug) avec un ordre chronologique
 */

export interface EpicPlace {
  slug: string
  role: string // ex: "Lieu de la dernière bataille", "Cachette supposée du trésor"
  order: number
  date?: string // ex: "1244", "Ve siècle"
}

export interface Epic {
  id: string
  title: string
  subtitle: string
  description: string
  icon: string
  color: string // hex
  tags: string[] // pour la recherche
  places: EpicPlace[]
}

export const EPICS: Epic[] = [
  {
    id: 'graal',
    title: 'Le Saint Graal',
    subtitle: 'La quête du calice sacré, de Jérusalem au Pays Cathare',
    description: "Le Saint Graal — coupe ayant recueilli le sang du Christ selon la légende — est au cœur du cycle arthurien et de l'histoire cathare. De Montségur où les derniers parfaits auraient caché un trésor mystérieux, à Rennes-le-Château où l'abbé Saunière fit fortune inexplicablement, en passant par les châteaux qui gardaient les routes secrètes du Languedoc, cette épopée retrace les lieux qui nourrissent le mythe depuis des siècles.",
    icon: '🏆',
    color: '#e2b650',
    tags: ['graal', 'saint graal', 'holy grail', 'calice', 'cathare', 'trésor'],
    places: [
      { slug: 'chateau-de-montsegur', role: 'Dernier bastion cathare — le "trésor" aurait été caché avant la chute', order: 1, date: '1244' },
      { slug: 'cite-de-carcassonne', role: 'Capitale de la croisade albigeoise, centre du pouvoir inquisitorial', order: 2, date: '1209' },
      { slug: 'chateau-de-peyrepertuse', role: 'Sentinelle sur la route secrète vers l\'Aragon', order: 3, date: 'XIIIe siècle' },
      { slug: 'chateau-de-queribus', role: 'Dernier refuge après Montségur — les parfaits y trouvèrent asile', order: 4, date: '1255' },
      { slug: 'minerve-village', role: 'Premier bûcher de la croisade — 140 parfaits brûlés', order: 5, date: '1210' },
      { slug: 'chateau-de-lastours', role: 'Foyer cathare résistant à Simon de Montfort', order: 6, date: '1211' },
      { slug: 'thermes-de-rennes-les-bains', role: 'Le mystère Boudet/Saunière — indices cryptiques sur un trésor', order: 7, date: '1886' },
      { slug: 'abbaye-de-fontfroide', role: 'Base de la lutte anti-cathare — assassinat de Pierre de Castelnau', order: 8, date: '1208' },
      { slug: 'chateau-de-puivert', role: 'Château des troubadours — culture cathare à son apogée', order: 9, date: 'XIIe siècle' },
      { slug: 'chateau-de-foix', role: 'Forteresse imprenable des comtes protecteurs des Cathares', order: 10, date: 'XIIIe siècle' },
    ],
  },
  {
    id: 'rome-antique-gaule',
    title: 'Rome en Gaule',
    subtitle: 'L\'empreinte romaine dans le sud de la France',
    description: "La Gaule Narbonnaise fut la première province romaine au-delà des Alpes. Amphithéâtres, aqueducs, temples et villes entières témoignent de cinq siècles de civilisation romaine dans le Midi. Du Pont du Gard aux Arènes de Nîmes, cette épopée retrace les monuments les plus spectaculaires de la Rome antique en France.",
    icon: '🏛️',
    color: '#d4a574',
    tags: ['romain', 'rome', 'antique', 'gaule', 'amphithéâtre', 'aqueduc'],
    places: [
      { slug: 'pont-du-gard', role: 'Aqueduc monumental — chef-d\'œuvre d\'ingénierie', order: 1, date: '50 apr. J.-C.' },
      { slug: 'arenes-de-nimes', role: 'Amphithéâtre de 24 000 places — combats de gladiateurs', order: 2, date: '70 apr. J.-C.' },
      { slug: 'arles-antique', role: 'Arelate — l\'une des plus grandes villes de l\'Empire en Gaule', order: 3, date: 'Ier siècle' },
      { slug: 'cite-de-vaison-la-romaine', role: 'Vasio — plus grande surface de fouilles romaines de France', order: 4, date: 'Ier siècle' },
    ],
  },
  {
    id: 'troubadours',
    title: 'La Route des Troubadours',
    subtitle: 'Poètes, musiciens et cours d\'amour du Midi médiéval',
    description: "Les troubadours inventèrent l'amour courtois dans les cours du Midi aux XIIe et XIIIe siècles. De château en abbaye, ils chantaient l'amour, la beauté et la liberté — une culture qui disparut avec la croisade albigeoise. Cette épopée suit leurs traces à travers les lieux qui résonnèrent de leurs vers en langue d'oc.",
    icon: '🎵',
    color: '#c084fc',
    tags: ['troubadour', 'occitan', 'amour courtois', 'poésie', 'musique', 'médiéval'],
    places: [
      { slug: 'chateau-de-puivert', role: 'Le château des troubadours — Salle des Musiciens', order: 1, date: 'XIIe siècle' },
      { slug: 'chateau-de-lastours', role: 'Cabaret — foyer de culture et de tolérance', order: 2, date: 'XIIe siècle' },
      { slug: 'les-baux-de-provence', role: 'Cours d\'amour des seigneurs des Baux', order: 3, date: 'XIIe siècle' },
      { slug: 'cordes-sur-ciel', role: 'Bastide refuge fondée pendant la croisade', order: 4, date: '1222' },
      { slug: 'chateau-de-foix', role: 'Cour brillante de Gaston Fébus', order: 5, date: 'XIVe siècle' },
    ],
  },
  {
    id: 'arthurien',
    title: 'La Légende Arthurienne',
    subtitle: 'Merlin, Viviane, Morgane et les chevaliers de la Table Ronde en Brocéliande',
    description: "La forêt de Brocéliande — aujourd'hui forêt de Paimpont en Bretagne — est le décor principal des légendes arthuriennes. Merlin y fut emprisonné par Viviane, Morgane y piégea les chevaliers infidèles, et la fontaine de Barenton y déclenchait des tempêtes. Cette épopée rassemble les lieux bretons qui donnent corps au mythe.",
    icon: '⚔️',
    color: '#60a5fa',
    tags: ['arthurien', 'arthur', 'merlin', 'table ronde', 'brocéliande', 'excalibur', 'viviane', 'morgane'],
    places: [
      { slug: 'foret-de-broceliande', role: 'La forêt enchantée — cadre de toutes les légendes', order: 1 },
      { slug: 'tombeau-de-merlin', role: 'Tombeau de l\'enchanteur emprisonné par Viviane', order: 2 },
      { slug: 'fontaine-de-barenton', role: 'Source magique où Merlin rencontra Viviane', order: 3 },
      { slug: 'val-sans-retour', role: 'Vallée enchantée de Morgane — piège des amants infidèles', order: 4 },
    ],
  },
  {
    id: 'villes-englouties',
    title: 'Cités Englouties',
    subtitle: 'Atlantides et villes disparues sous les eaux',
    description: "Depuis l'Atlantide de Platon, le mythe de la cité engloutie hante l'imaginaire. La Bretagne possède sa propre Atlantide : la ville d'Ys, engloutie dans la baie de Douarnenez. Cette épopée rassemble les lieux liés aux légendes de villes disparues sous les eaux.",
    icon: '🌊',
    color: '#38bdf8',
    tags: ['englouti', 'atlantide', 'ys', 'cité', 'submergé', 'mer', 'inondation'],
    places: [
      { slug: 'ville-dys', role: 'Ker-Ys — la plus célèbre cité engloutie de la mythologie celtique', order: 1 },
    ],
  },
  {
    id: 'compostelle-sud',
    title: 'Chemins de Compostelle',
    subtitle: 'Les grandes étapes du pèlerinage dans le Sud de la France',
    description: "Depuis le Moyen Âge, les chemins de Saint-Jacques-de-Compostelle traversent le sud de la France. La Via Tolosana et la Via Podiensis passent par des abbayes, des villages et des ponts qui sont autant de trésors architecturaux et spirituels.",
    icon: '🐚',
    color: '#fbbf24',
    tags: ['compostelle', 'pèlerinage', 'saint-jacques', 'chemin', 'via'],
    places: [
      { slug: 'conques-abbatiale', role: 'Étape mythique — Vierge noire et trésor de Sainte-Foy', order: 1 },
      { slug: 'rocamadour', role: 'Sanctuaire vertigineux — 216 marches à genoux', order: 2 },
      { slug: 'saint-guilhem-le-desert', role: 'Abbaye fondée par un compagnon de Charlemagne', order: 3 },
      { slug: 'pont-valentre-cahors', role: 'Pont du Diable — légende du pacte satanique', order: 4 },
      { slug: 'abbaye-de-saint-gilles', role: 'Point de départ de la Via Tolosana', order: 5 },
    ],
  },
  {
    id: 'prehistoire-sud',
    title: 'Mémoire de Pierre',
    subtitle: 'Mégalithes, grottes ornées et mystères préhistoriques',
    description: "Le sud de la France et la Bretagne abritent certains des plus anciens et des plus impressionnants vestiges préhistoriques d'Europe. Des alignements de Carnac aux grottes ornées des Pyrénées, cette épopée retrace 30 000 ans d'histoire humaine gravée dans la pierre.",
    icon: '🗿',
    color: '#a3e635',
    tags: ['préhistoire', 'mégalithe', 'grotte', 'menhir', 'néolithique', 'peinture rupestre'],
    places: [
      { slug: 'alignements-de-carnac', role: '3 000 menhirs — le plus grand ensemble mégalithique au monde', order: 1, date: '4500 av. J.-C.' },
      { slug: 'cairn-de-gavrinis', role: 'Gravures spiralées parmi les plus belles de la préhistoire', order: 2, date: '3500 av. J.-C.' },
      { slug: 'roche-aux-fees', role: 'Allée couverte construite par les fées en une nuit', order: 3, date: '3000 av. J.-C.' },
      { slug: 'grotte-de-niaux', role: 'Bisons et chevaux peints il y a 14 000 ans', order: 4, date: '14 000 av. J.-C.' },
      { slug: 'les-calanques-marseille', role: 'Grotte Cosquer — art rupestre à 37 m sous la mer', order: 5, date: '27 000 av. J.-C.' },
    ],
  },
]

/** Find all epics that contain a given place slug */
export function getEpicsForPlace(slug: string): Epic[] {
  return EPICS.filter(epic => epic.places.some(p => p.slug === slug))
}

/** Search epics by text query */
export function searchEpics(query: string): Epic[] {
  const q = query.toLowerCase()
  return EPICS.filter(epic =>
    epic.title.toLowerCase().includes(q) ||
    epic.subtitle.toLowerCase().includes(q) ||
    epic.tags.some(t => t.toLowerCase().includes(q))
  )
}
