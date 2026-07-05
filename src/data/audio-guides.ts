// Guides audio narrés (voix grave, générés via scripts/generate-audio-guides.sh)
// Fichiers servis depuis public/audio-guides/<slug>.m4a

export interface AudioGuide {
  slug: string
  file: string
  title: string
  // Durée approximative en secondes (affichage avant metadata)
  duration: number
  // Texte intégral de la narration (affichable dans le lecteur)
  transcript: string
}

const GUIDES: AudioGuide[] = [
  {
    slug: 'cite-de-carcassonne',
    file: '/audio-guides/cite-de-carcassonne.m4a',
    title: 'La cité aux 52 tours',
    duration: 60,
    transcript: `Devant vous se dressent les remparts de Carcassonne. Cinquante-deux tours, trois kilomètres de murailles, deux mille ans d'histoire.

En 1209, la croisade contre les Cathares déferle sur ce pays. La ville est assiégée en pleine canicule. Privée d'eau, elle tombe en quinze jours. Son jeune vicomte, Raymond-Roger Trencavel, âgé de vingt-quatre ans, est jeté dans un cachot de son propre château. Il y meurt trois mois plus tard. Officiellement, de dysenterie. Beaucoup murmurent : assassiné.

Marchez le long des lices, entre les murailles gallo-romaines et médiévales. Chaque pierre a vu passer les croisés de Simon de Montfort, les bâtisseurs de Saint-Louis, et sept siècles de garnisons.

Au XIXe siècle, la cité tombait en ruine. Un homme, Viollet-le-Duc, l'a ressuscitée. On lui doit ces toits d'ardoise controversés, et ce rêve de pierre inscrit au patrimoine mondial de l'humanité.

Écoutez le vent dans les créneaux. Ici, la mémoire ne s'est jamais tue.`,
  },
  {
    slug: 'chateau-de-montsegur',
    file: '/audio-guides/chateau-de-montsegur.m4a',
    title: 'Le dernier bûcher',
    duration: 57,
    transcript: `1 207 mètres de marche, et le sanctuaire apparaît : Montségur. Le pog se dresse comme une proue de navire au-dessus des brumes ariégeoises. C'est ici que le catharisme a livré son dernier grand combat.

Dix mois de siège. Six mille hommes en contrebas, une poignée de défenseurs là-haut. En mars 1244, la forteresse capitule. On offre la vie sauve à ceux qui abjurent.

Deux cent cinq hommes et femmes refusent. Ils descendent la montagne en chantant, et montent d'eux-mêmes sur le bûcher dressé dans le pré que vous voyez en bas. Le prat dels cremats. Le champ des brûlés.

Mais la légende ne s'arrête pas là. La veille de la reddition, quatre parfaits se seraient évadés dans la nuit, emportant le trésor cathare. Or ? Manuscrits ? Le Graal lui-même, comme le prétendent certains ? Nul ne l'a jamais retrouvé.

Regardez l'horizon depuis les ruines. Peut-être est-il encore là, quelque part, sous vos pieds.`,
  },
  {
    slug: 'chateau-de-peyrepertuse',
    file: '/audio-guides/chateau-de-peyrepertuse.m4a',
    title: 'La Carcassonne céleste',
    duration: 60,
    transcript: `Huit cents mètres d'altitude. Une crête de calcaire blanc, longue de trois cents mètres. Et un château qui semble né de la roche elle-même : Peyrepertuse, la pierre percée.

On l'appelle la Carcassonne céleste. C'est la plus vaste des citadelles du vertige, ces forteresses royales qui gardaient la frontière entre la France et l'Aragon.

Montez par l'escalier Saint-Louis, taillé à même la falaise. Par grand vent, on s'y accroche des deux mains. En contrebas, les Corbières déroulent leurs vignes et leur garrigue jusqu'à la mer. Par temps clair, on aperçoit la Méditerranée.

Pendant la croisade, le seigneur Guilhem de Peyrepertuse abrite des Cathares pourchassés. Excommunié, traqué, il finit par se soumettre en 1240. Le château devient alors sentinelle du roi de France, face au royaume d'Aragon, pendant quatre siècles.

Quand le traité des Pyrénées déplace la frontière en 1659, la citadelle perd sa raison d'être. Elle s'endort. Elle vous attendait.`,
  },
  {
    slug: 'chateau-de-queribus',
    file: '/audio-guides/chateau-de-queribus.m4a',
    title: 'Le dernier refuge',
    duration: 59,
    transcript: `Un doigt de pierre dressé vers le ciel, visible à des dizaines de kilomètres : Quéribus, le dernier refuge.

Nous sommes en 1255. Montségur est tombé onze ans plus tôt. Partout, l'Inquisition traque les derniers parfaits. C'est ici, dans ce nid d'aigle à 728 mètres, que se réfugient les ultimes Cathares, autour du diacre Benoît de Termes.

Le roi Saint-Louis envoie une armée. Le château capitule sans assaut. Mais les Cathares, eux, se sont déjà évanouis dans la montagne, vers l'Espagne. Nul bûcher à Quéribus. Seulement une disparition silencieuse.

Montez dans le donjon polygonal. La salle du pilier vous attend : une colonne unique qui s'épanouit en palmier de pierre gothique. Par la fenêtre d'archère, le regard plonge sur mille mètres de vide, jusqu'aux vignes du Roussillon et à la ligne bleue de la Méditerranée. Le Canigou veille à l'ouest.

Ici s'achève l'histoire militaire du catharisme. Ici commence sa légende.`,
  },
  {
    slug: 'minerve',
    file: '/audio-guides/minerve.m4a',
    title: 'La mémoire de l\'eau et du feu',
    duration: 63,
    transcript: `Une île de pierre entre deux gorges taillées par les rivières. Un pont naturel creusé par les eaux. Minerve, l'un des plus beaux villages de France, et l'un des plus tragiques.

Été 1210. Simon de Montfort assiège la cité qui abrite cent quarante parfaits cathares réfugiés après le massacre de Béziers. Sa machine de guerre, la Malvoisine — la mauvaise voisine — pilonne l'unique puits du village. Sans eau, sous le soleil de juillet, Minerve capitule au bout de cinq semaines.

Les parfaits se voient offrir la vie contre l'abjuration. Cent quarante refusent. Ils sont précipités dans le premier grand bûcher collectif de la croisade. Certains, dit la chronique, s'y jetèrent d'eux-mêmes.

Aujourd'hui, marchez dans la rue des Martyrs. Une colombe de pierre, sculptée par Jean-Luc Séverac, veille sur la place. Elle est gravée d'un seul mot occitan : Als catars. Aux cathares.

Sous vos pieds, les ponts-tunnels du Brian. Au-dessus, le silence du Minervois. Et partout, la mémoire de l'eau et du feu.`,
  },
  {
    slug: 'rennes-le-chateau',
    file: '/audio-guides/rennes-le-chateau.m4a',
    title: 'Le secret de l\'abbé Saunière',
    duration: 77,
    transcript: `Un village de moins de cent âmes, perché sur sa colline de l'Aude. Et pourtant, le monde entier connaît son nom : Rennes-le-Château.

1885. Un jeune prêtre, Bérenger Saunière, prend possession de la paroisse. Il est pauvre. L'église tombe en ruine. Puis, en quelques années, tout bascule. Saunière dépense des fortunes. Il rénove l'église dans un style flamboyant et étrange, fait graver au portail : Terribilis est locus iste. « Ce lieu est terrible. » Il bâtit une villa cossue, la tour Magdala dressée face au vide, des jardins suspendus.

D'où vient l'argent ? Trafic de messes, répond l'Église, qui le suspend. Trésor, répond la légende : des parchemins découverts dans un pilier wisigothique, le trésor de Blanche de Castille, l'or du Temple, ou un secret capable d'ébranler Rome.

Saunière meurt en 1917 sans avoir parlé. Sa servante, Marie Dénarnaud, promit un jour de révéler « un secret qui donne la puissance ». Elle mourut muette, elle aussi.

Regardez le diable Asmodée qui porte le bénitier, les quatorze stations du chemin de croix aux détails inexpliqués. Ici, chaque pierre est une énigme. Et l'énigme n'est toujours pas résolue.`,
  },
]

const GUIDE_MAP = new Map(GUIDES.map((g) => [g.slug, g]))

export function getAudioGuide(slug: string): AudioGuide | undefined {
  return GUIDE_MAP.get(slug)
}
