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
    id: 'atlantide',
    title: 'L\'Atlantide',
    subtitle: 'La quête du continent perdu, de Platon aux découvertes sous-marines',
    description: "En 360 av. J.-C., le philosophe grec Platon raconte dans le Timée et le Critias l'histoire d'une île immense et puissante, « au-delà des Colonnes d'Hercule », engloutie en un jour et une nuit par un cataclysme divin. Depuis, l'Atlantide est devenue le mythe le plus tenace de l'humanité. Des prêtres égyptiens de Saïs aux formations sous-marines des Bahamas, de l'Œil du Sahara aux cités englouties de Grèce, chaque époque a cherché l'Atlantide quelque part. Cette épopée retrace tous les indices, vrais et supposés, à travers le monde — les lieux qui nourrissent la quête depuis 2 400 ans.",
    icon: '🌊',
    color: '#38bdf8',
    tags: ['atlantide', 'atlantis', 'englouti', 'platon', 'continent perdu', 'submergé', 'mer', 'cité'],
    places: [
      { slug: 'sais-egypte-temple-neith', role: 'Tout commence ici : le prêtre de Neith raconte l\'Atlantide à Solon', order: 1, date: '590 av. J.-C.' },
      { slug: 'acropole-athenes', role: 'Athènes héroïque — dans le récit de Platon, elle vainquit l\'Atlantide', order: 2, date: '~9600 av. J.-C.' },
      { slug: 'detroit-gibraltar-colonnes-hercule', role: 'Platon situe l\'Atlantide « au-delà des Colonnes d\'Hercule »', order: 3, date: '360 av. J.-C.' },
      { slug: 'cadix-gadeira-platon', role: 'Seule ville moderne nommée par Platon dans le récit — la porte vers l\'Atlantide', order: 4, date: '360 av. J.-C.' },
      { slug: 'helike-cite-engloutie-grece', role: 'Engloutie en une nuit en 373 av. J.-C. — l\'inspiration directe de Platon ?', order: 5, date: '373 av. J.-C.' },
      { slug: 'santorin-atlantide', role: 'L\'éruption minoenne détruisit une civilisation avancée — le modèle le plus crédible', order: 6, date: '1600 av. J.-C.' },
      { slug: 'pavlopetri-cite-sous-marine', role: 'Plus ancienne cité engloutie connue — la preuve que c\'est possible', order: 7, date: '3000 av. J.-C.' },
      { slug: 'richat-structure-oeil-sahara', role: 'L\'Œil du Sahara — anneaux concentriques de 40 km, comme décrit par Platon', order: 8 },
      { slug: 'acores-montagnes-atlantide', role: 'Donnelly (1882) : les Açores seraient les sommets émergés de l\'Atlantide', order: 9, date: '1882' },
      { slug: 'bimini-road-bahamas', role: 'Prédite par Cayce en 1938, découverte en 1968 — route pavée ou roche naturelle ?', order: 10, date: '1968' },
      { slug: 'yonaguni-structures-sous-marines', role: 'Terrasses sous-marines au Japon — ruines d\'une civilisation disparue ?', order: 11, date: '1987' },
      { slug: 'doggerland-continent-englouti', role: 'Un continent entier englouti sous la mer du Nord — l\'Atlantide de l\'âge de pierre', order: 12, date: '6000 av. J.-C.' },
      { slug: 'dwarka-cite-engloutie-inde', role: 'La cité de Krishna engloutie — l\'Atlantide indienne', order: 13 },
      { slug: 'baiae-cite-romaine-engloutie', role: 'Villas romaines sous la mer — la preuve visible que des villes sombrent', order: 14 },
      { slug: 'rungholt-atlantide-mer-du-nord', role: 'Engloutie en une nuit par une tempête en 1362 — l\'Atlantide du Nord', order: 15, date: '1362' },
      { slug: 'ville-dys', role: 'Ker-Ys — l\'Atlantide celtique, engloutie dans la baie de Douarnenez', order: 16 },
      { slug: 'bibliotheque-alexandrie', role: 'La bibliothèque perdue contenait peut-être les preuves originales', order: 17 },
      { slug: 'temples-megalithiques-malte', role: 'Temples plus vieux que les pyramides — vestiges d\'une civilisation oubliée ?', order: 18, date: '3600 av. J.-C.' },
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
  {
    id: 'templiers',
    title: 'Les Templiers',
    subtitle: 'Moines-guerriers, banquiers du monde et gardiens de secrets — de Jérusalem au bûcher',
    description: "L'Ordre du Temple, fondé en 1119 à Jérusalem, est la plus fascinante organisation du Moyen Âge. En deux siècles, neuf chevaliers pauvres devinrent la première multinationale de l'histoire : banquiers des rois, bâtisseurs de forteresses, maîtres de flottes. Leur chute brutale en 1307 — arrêtés en une nuit sur ordre de Philippe le Bel, torturés, brûlés — et la disparition mystérieuse de leur trésor ont engendré les théories les plus folles. Du Temple de Salomon aux cachots de Chinon, cette épopée suit la trace des Templiers à travers le monde.",
    icon: '⚔️',
    color: '#dc2626',
    tags: ['templier', 'temple', 'chevalier', 'croisade', 'trésor', 'molay', 'philippe le bel', 'knights templar'],
    places: [
      { slug: 'temple-de-salomon-jerusalem', role: 'Fondation de l\'Ordre en 1119 — fouilles sous le Temple de Salomon', order: 1, date: '1119' },
      { slug: 'saint-jean-acre-templiers', role: 'Quartier général en Terre Sainte — tunnel secret vers le port', order: 2, date: '1191-1291' },
      { slug: 'tresor-temple-jerusalem', role: 'Le trésor du Temple — reliques ramenées de Terre Sainte ?', order: 3, date: 'XIIe siècle' },
      { slug: 'rhodes-colosse', role: 'Rhodes — les Hospitaliers héritèrent des biens templiers', order: 4, date: '1312' },
      { slug: 'couvent-christ-tomar-templiers', role: 'Au Portugal, les Templiers survécurent sous le nom d\'Ordre du Christ', order: 5, date: '1160' },
      { slug: 'eglise-templiere-montsaunes', role: 'Église octogonale templière dans le Comminges', order: 6, date: 'XIIe siècle' },
      { slug: 'bruges-tresor-templiers', role: 'Bruges — centre financier templier, relique du Saint-Sang', order: 7, date: 'XIIIe siècle' },
      { slug: 'chateau-gisors-tresor-templier', role: 'Gisors — le trésor templier serait caché dans un souterrain du château', order: 8, date: '1307' },
      { slug: 'tresor-des-templiers', role: 'La nuit du 13 octobre 1307 — arrestation de tous les Templiers de France', order: 9, date: '1307' },
      { slug: 'donjon-chinon-fin-templiers', role: 'Prison des derniers chefs — graffitis des Templiers captifs', order: 10, date: '1308' },
      { slug: 'archives-secretes-vatican', role: 'Le Parchemin de Chinon — le pape avait secrètement absous les Templiers', order: 11, date: '1308' },
      { slug: 'rosslyn-chapel-graal', role: 'Rosslyn — les Sinclair auraient caché le trésor templier en Écosse', order: 12, date: 'XVe siècle' },
    ],
  },
  {
    id: 'vikings',
    title: 'Les Vikings',
    subtitle: 'Du raid de Lindisfarne à la découverte de l\'Amérique — 300 ans d\'épopée nordique',
    description: "En 793, des drakkars surgirent de la brume et attaquèrent le monastère de Lindisfarne. C'était le début de trois siècles d'explorations, de conquêtes et de commerce qui menèrent les Vikings de la Scandinavie jusqu'à Constantinople, Bagdad et l'Amérique — cinq siècles avant Colomb. Navigateurs hors pair, commerçants avisés, poètes et bâtisseurs de lois, les Vikings furent bien plus que des pillards. Cette épopée suit leurs routes à travers le monde.",
    icon: '🛡️',
    color: '#65a30d',
    tags: ['viking', 'norse', 'odin', 'drakkar', 'ragnar', 'saga', 'nordique', 'scandinave'],
    places: [
      { slug: 'lindisfarne-raid-viking', role: 'Le raid de 793 — le jour où l\'Europe découvrit la terreur viking', order: 1, date: '793' },
      { slug: 'birka-ville-viking-suede', role: 'Premier centre urbain viking — carrefour entre Orient et Occident', order: 2, date: 'VIIIe siècle' },
      { slug: 'oseberg-navire-viking', role: 'Le plus beau navire viking jamais découvert — tombeau d\'une reine', order: 3, date: '834' },
      { slug: 'rok-runestone', role: 'La plus longue inscription runique — 700 caractères gravés dans la pierre', order: 4, date: 'IXe siècle' },
      { slug: 'thingvellir-parlement-viking', role: 'L\'Althing — premier parlement du monde, fondé en 930', order: 5, date: '930' },
      { slug: 'lanse-aux-meadows-vikings', role: 'L\'Anse aux Meadows — preuve de la découverte viking de l\'Amérique', order: 6, date: '~1000' },
    ],
  },
  {
    id: 'eldorado',
    title: 'L\'Eldorado',
    subtitle: 'La quête de la cité d\'or, des lagunes de Colombie aux jungles du Pérou',
    description: "L'Eldorado — « l'homme doré » — était à l'origine le roi des Muiscas qui, lors de son sacre, se couvrait de poudre d'or avant de plonger dans le lac Guatavita en offrande aux dieux. Les Conquistadors transformèrent ce rituel en légende d'une cité entière faite d'or, puis d'un pays, puis d'un continent de richesses infinies. Pendant trois siècles, des expéditions cherchèrent l'Eldorado depuis la Colombie jusqu'à l'Amazonie, découvrant au passage les plus grandes merveilles du Nouveau Monde sans jamais trouver la cité d'or.",
    icon: '👑',
    color: '#eab308',
    tags: ['eldorado', 'or', 'inca', 'conquistador', 'cité d\'or', 'muisca', 'trésor', 'amérique'],
    places: [
      { slug: 'lac-guatavita-el-dorado', role: 'Lac sacré des Muiscas — le vrai Eldorado : le roi doré plongeait ici', order: 1, date: 'XVe siècle' },
      { slug: 'cusco-murs-incas', role: 'Cusco — « nombril du monde » inca, murs de pierre ajustés au micron', order: 2 },
      { slug: 'machu-picchu', role: 'La cité cachée des Incas — redécouverte en 1911 par Hiram Bingham', order: 3, date: '1450' },
      { slug: 'nazca-lignes-detail', role: 'Lignes de Nazca — géoglyphes géants visibles seulement du ciel', order: 4 },
      { slug: 'tiwanaku-bolivie', role: 'Tiwanaku — civilisation pré-inca au bord du lac Titicaca', order: 5, date: '500' },
      { slug: 'cite-or-paititi-perou', role: 'Paititi — la dernière cité inca cachée dans la jungle amazonienne', order: 6 },
      { slug: 'cibola-sept-cites-or', role: 'Cíbola — les Sept Cités d\'Or cherchées par Coronado dans le désert', order: 7, date: '1540' },
      { slug: 'teotihuacan-pyramide-soleil', role: 'Teotihuacán — la cité des dieux, abandonnée mystérieusement', order: 8, date: '100 av. J.-C.' },
    ],
  },
  {
    id: 'pharaons',
    title: 'La Malédiction des Pharaons',
    subtitle: 'Pyramides, tombes secrètes et malédictions millénaires le long du Nil',
    description: "« La mort viendra sur des ailes rapides pour celui qui troublera le repos du pharaon. » Depuis l'ouverture de la tombe de Toutânkhamon en 1922, suivie de la mort mystérieuse de Lord Carnarvon, la malédiction des pharaons fascine le monde. Mais au-delà de la superstition, l'Égypte antique — ses pyramides impossibles, ses tombes labyrinthiques, ses textes magiques — est un mystère en soi. Comment des hommes de l'âge du bronze ont-ils pu ériger des monuments que nous aurions du mal à construire aujourd'hui ? Cette épopée descend le Nil, de Gizeh à Abou Simbel.",
    icon: '🔺',
    color: '#f59e0b',
    tags: ['pharaon', 'égypte', 'pyramide', 'malédiction', 'toutankhamon', 'momie', 'sphinx', 'nil'],
    places: [
      { slug: 'pyramides-de-gizeh', role: 'La dernière merveille du monde antique — 2,3 millions de blocs de pierre', order: 1, date: '2570 av. J.-C.' },
      { slug: 'sphinx-de-gizeh', role: 'Gardien des pyramides — son âge réel fait débat (érosion par l\'eau ?)', order: 2, date: '2500 av. J.-C.' },
      { slug: 'saqqarah-pyramide-a-degres', role: 'Première pyramide de l\'histoire — le génie de l\'architecte Imhotep', order: 3, date: '2650 av. J.-C.' },
      { slug: 'vallee-des-rois-thebes', role: 'Nécropole royale — 63 tombes dont celle de Toutânkhamon (KV62)', order: 4, date: '1550-1069 av. J.-C.' },
      { slug: 'tombe-toutankhamon', role: 'Ouverte le 4 novembre 1922 — Lord Carnarvon mourut 5 mois plus tard', order: 5, date: '1922' },
      { slug: 'temple-de-karnak', role: 'Plus grand complexe religieux antique — 2 000 ans de construction', order: 6, date: '2000 av. J.-C.' },
      { slug: 'luxor-temple-detail', role: 'Temple de Louxor — relié à Karnak par une allée de 2,5 km de sphinx', order: 7 },
      { slug: 'abu-simbel-ramses', role: 'Les colosses de Ramsès II — déplacés pour être sauvés des eaux', order: 8, date: '1265 av. J.-C.' },
      { slug: 'bibliotheque-alexandrie', role: 'La plus grande bibliothèque de l\'Antiquité — les secrets perdus', order: 9, date: 'IIIe siècle av. J.-C.' },
      { slug: 'pyramides-meroe-soudan', role: 'Les pyramides oubliées du Soudan — l\'héritage nubien des pharaons', order: 10, date: '300 av. J.-C.' },
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
