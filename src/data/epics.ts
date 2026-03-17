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
    tags: ['graal', 'saint graal', 'holy grail', 'calice', 'cathare', 'trésor', 'grail'],
    places: [
      { slug: 'tresor-temple-jerusalem', role: 'Le Temple de Salomon — origine supposée du Graal selon certaines traditions', order: 1, date: 'Ier siècle' },
      { slug: 'glastonbury-tor-graal', role: 'Joseph d\'Arimathie aurait apporté le Graal en Angleterre', order: 2, date: 'Ier siècle' },
      { slug: 'abbaye-glastonbury-roi-arthur', role: 'Tombe légendaire d\'Arthur — le roi qui cherchait le Graal', order: 3, date: 'Ve siècle' },
      { slug: 'rosslyn-chapel-graal', role: 'Chapelle aux symboles mystérieux — cachette supposée des Templiers', order: 4, date: '1446' },
      { slug: 'montagne-alaric', role: 'Le trésor des Wisigoths — pillage de Rome incluant peut-être le Graal', order: 5, date: '410' },
      { slug: 'chateau-de-montsegur', role: 'Dernier bastion cathare — le "trésor" aurait été caché avant la chute', order: 6, date: '1244' },
      { slug: 'cite-de-carcassonne', role: 'Capitale de la croisade albigeoise, centre du pouvoir inquisitorial', order: 7, date: '1209' },
      { slug: 'chateau-de-queribus', role: 'Dernier refuge après Montségur — les parfaits y trouvèrent asile', order: 8, date: '1255' },
      { slug: 'montserrat', role: 'Le Montsalvat de Parsifal — Wagner y situa le château du Graal', order: 9, date: 'XIIe siècle' },
      { slug: 'santo-caliz-valencia', role: 'La cathédrale de Valence conserve le Santo Cáliz, candidat le plus sérieux', order: 10, date: 'Ier siècle' },
      { slug: 'san-juan-de-la-pena', role: 'Le calice y fut caché pendant l\'invasion maure selon la tradition', order: 11, date: 'VIIIe siècle' },
      { slug: 'sacro-catino-genes', role: 'Le Sacro Catino de Gênes — autre candidat au titre de Saint Graal', order: 12, date: 'XIIe siècle' },
      { slug: 'otto-rahn-quete-du-graal', role: 'Otto Rahn chercha le Graal dans les grottes cathares pour les nazis', order: 13, date: '1931' },
      { slug: 'thermes-de-rennes-les-bains', role: 'Le mystère Boudet/Saunière — indices cryptiques sur un trésor', order: 14, date: '1886' },
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
    subtitle: 'L\'âge de pierre en Europe — 30 000 ans de mystères gravés dans la roche',
    description: "Bien avant l'écriture, les hommes ont gravé leur mémoire dans la pierre. Cette épopée retrace 30 000 ans de civilisation à travers les vestiges les plus spectaculaires de la préhistoire européenne : des peintures rupestres réalisées à la lueur des torches dans les grottes profondes, aux alignements monumentaux de menhirs érigés par des sociétés néolithiques dont nous ne connaissons ni la langue ni les croyances. Ce qui relie tous ces lieux, c'est le mystère de ces hommes qui ont bâti, peint et gravé pour l'éternité — et dont nous ne comprenons toujours pas complètement les motivations.",
    icon: '🗿',
    color: '#a3e635',
    tags: ['préhistoire', 'mégalithe', 'grotte', 'menhir', 'néolithique', 'peinture rupestre', 'âge de pierre'],
    places: [
      { slug: 'les-calanques-marseille', role: 'Grotte Cosquer — peintures à 37 m sous la mer, quand le rivage était 120 m plus bas', order: 1, date: '27 000 av. J.-C.' },
      { slug: 'grotte-de-niaux', role: 'Salon Noir — bisons et chevaux peints au charbon avec un réalisme saisissant', order: 2, date: '14 000 av. J.-C.' },
      { slug: 'alignements-de-carnac', role: '3 000 menhirs alignés sur 4 km — le plus grand ensemble mégalithique au monde', order: 3, date: '4500 av. J.-C.' },
      { slug: 'cairn-de-gavrinis', role: 'Gravures spiralées d\'une complexité unique — un langage perdu ?', order: 4, date: '3500 av. J.-C.' },
      { slug: 'roche-aux-fees', role: '40 dalles de 10 à 45 tonnes — transportées sur 4 km sans la roue', order: 5, date: '3000 av. J.-C.' },
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
