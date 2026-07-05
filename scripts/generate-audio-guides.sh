#!/bin/bash
# Génère les guides audio avec la voix Thomas (fr_FR) rendue plus grave
# via les commandes vocales macOS intégrées [[pbas]] (pitch base) et [[rate]].
# Sortie : public/audio-guides/<slug>.m4a (AAC, léger pour le web)
#
# Usage: ./scripts/generate-audio-guides.sh
set -euo pipefail

cd "$(dirname "$0")/.."
OUT="public/audio-guides"
mkdir -p "$OUT"

# Voix grave : pbas 38 (défaut Thomas ≈ 46) + débit posé 158
PREFIX="[[pbas 38]] [[rate 158]]"

generate() {
  local slug="$1"
  local text="$2"
  local aiff="/tmp/guide-$slug.aiff"
  echo "→ $slug"
  say -v "Thomas" -o "$aiff" "$PREFIX $text"
  afconvert -f m4af -d aac -b 64000 "$aiff" "$OUT/$slug.m4a"
  rm -f "$aiff"
}

generate "cite-de-carcassonne" "Devant vous se dressent les remparts de Carcassonne. Cinquante-deux tours, trois kilomètres de murailles, deux mille ans d'histoire. [[slnc 400]] En douze cent-neuf, la croisade contre les Cathares déferle sur ce pays. La ville est assiégée en pleine canicule. Privée d'eau, elle tombe en quinze jours. Son jeune vicomte, Raymond-Roger Trencavel, âgé de vingt-quatre ans, est jeté dans un cachot de son propre château. Il y meurt trois mois plus tard. [[slnc 400]] Officiellement, de dysenterie. Beaucoup murmurent : assassiné. [[slnc 500]] Marchez le long des lices, entre les murailles gallo-romaines et médiévales. Chaque pierre a vu passer les croisés de Simon de Montfort, les bâtisseurs de Saint-Louis, et sept siècles de garnisons. [[slnc 400]] Au dix-neuvième siècle, la cité tombait en ruine. Un homme, Viollet-le-Duc, l'a ressuscitée. On lui doit ces toits d'ardoise controversés, et ce rêve de pierre inscrit au patrimoine mondial de l'humanité. [[slnc 500]] Écoutez le vent dans les créneaux. Ici, la mémoire ne s'est jamais tue."

generate "chateau-de-montsegur" "Douze cent quarante-quatre mètres de marche, et le sanctuaire apparaît : Montségur. [[slnc 400]] Le pog se dresse comme une proue de navire au-dessus des brumes ariégeoises. C'est ici que le catharisme a livré son dernier grand combat. [[slnc 400]] Dix mois de siège. Six mille hommes en contrebas, une poignée de défenseurs là-haut. En mars douze cent quarante-quatre, la forteresse capitule. On offre la vie sauve à ceux qui abjurent. [[slnc 500]] Deux cent cinq hommes et femmes refusent. [[slnc 300]] Ils descendent la montagne en chantant, et montent d'eux-mêmes sur le bûcher dressé dans le pré que vous voyez en bas. Le prat dels cremats. Le champ des brûlés. [[slnc 500]] Mais la légende ne s'arrête pas là. La veille de la reddition, quatre parfaits se seraient évadés dans la nuit, emportant le trésor cathare. Or ? Manuscrits ? Le Graal lui-même, comme le prétendent certains ? [[slnc 400]] Nul ne l'a jamais retrouvé. [[slnc 300]] Regardez l'horizon depuis les ruines. Peut-être est-il encore là, quelque part, sous vos pieds."

generate "chateau-de-peyrepertuse" "Huit cents mètres d'altitude. Une crête de calcaire blanc, longue de trois cents mètres. Et un château qui semble né de la roche elle-même : Peyrepertuse, la pierre percée. [[slnc 500]] On l'appelle la Carcassonne céleste. C'est la plus vaste des citadelles du vertige, ces forteresses royales qui gardaient la frontière entre la France et l'Aragon. [[slnc 400]] Montez par l'escalier Saint-Louis, taillé à même la falaise. Par grand vent, on s'y accroche des deux mains. [[slnc 400]] En contrebas, les Corbières déroulent leurs vignes et leur garrigue jusqu'à la mer. Par temps clair, on aperçoit la Méditerranée. [[slnc 500]] Pendant la croisade, le seigneur Guilhem de Peyrepertuse abrite des Cathares pourchassés. Excommunié, traqué, il finit par se soumettre en douze cent-quarante. Le château devient alors sentinelle du roi de France, face au royaume d'Aragon, pendant quatre siècles. [[slnc 400]] Quand le traité des Pyrénées déplace la frontière en seize cent cinquante-neuf, la citadelle perd sa raison d'être. Elle s'endort. [[slnc 300]] Elle vous attendait."

generate "chateau-de-queribus" "Un doigt de pierre dressé vers le ciel, visible à des dizaines de kilomètres : Quéribus, le dernier refuge. [[slnc 500]] Nous sommes en douze cent cinquante-cinq. Montségur est tombé onze ans plus tôt. Partout, l'Inquisition traque les derniers parfaits. C'est ici, dans ce nid d'aigle à sept cent vingt-huit mètres, que se réfugient les ultimes Cathares, autour du diacre Benoît de Termes. [[slnc 400]] Le roi Saint-Louis envoie une armée. Le château capitule sans assaut. Mais les Cathares, eux, se sont déjà évanouis dans la montagne, vers l'Espagne. Nul bûcher à Quéribus. Seulement une disparition silencieuse. [[slnc 500]] Montez dans le donjon polygonal. La salle du pilier vous attend : une colonne unique qui s'épanouit en palmier de pierre gothique. [[slnc 400]] Par la fenêtre d'archère, le regard plonge sur mille mètres de vide, jusqu'aux vignes du Roussillon et à la ligne bleue de la Méditerranée. Le Canigou veille à l'ouest. [[slnc 400]] Ici s'achève l'histoire militaire du catharisme. Ici commence sa légende."

generate "minerve" "Une île de pierre entre deux gorges taillées par les rivières. Un pont naturel creusé par les eaux. Minerve, l'un des plus beaux villages de France, et l'un des plus tragiques. [[slnc 500]] Été douze cent-dix. Simon de Montfort assiège la cité qui abrite cent quarante parfaits cathares réfugiés après le massacre de Béziers. [[slnc 400]] Sa machine de guerre, la Malvoisine, la mauvaise voisine, pilonne l'unique puits du village. Sans eau, sous le soleil de juillet, Minerve capitule au bout de cinq semaines. [[slnc 500]] Les parfaits se voient offrir la vie contre l'abjuration. Cent quarante refusent. Ils sont précipités dans le premier grand bûcher collectif de la croisade. Certains, dit la chronique, s'y jetèrent d'eux-mêmes. [[slnc 500]] Aujourd'hui, marchez dans la rue des Martyrs. Une colombe de pierre, sculptée par Jean-Luc Séverac, veille sur la place. Elle est gravée d'un seul mot occitan. [[slnc 300]] Als catars. Aux cathares. [[slnc 400]] Sous vos pieds, le ponts-tunnels du Brian. Au-dessus, le silence du Minervois. Et partout, la mémoire de l'eau et du feu."

generate "rennes-le-chateau" "Un village de moins de cent âmes, perché sur sa colline de l'Aude. Et pourtant, le monde entier connaît son nom : Rennes-le-Château. [[slnc 500]] Mille huit cent quatre-vingt-cinq. Un jeune prêtre, Bérenger Saunière, prend possession de la paroisse. Il est pauvre. L'église tombe en ruine. [[slnc 400]] Puis, en quelques années, tout bascule. Saunière dépense des fortunes. Il rénove l'église dans un style flamboyant et étrange, fait graver au portail : Terribilis est locus iste. Ce lieu est terrible. Il bâtit une villa cossue, la tour Magdala dressée face au vide, des jardins suspendus. [[slnc 500]] D'où vient l'argent ? [[slnc 300]] Trafic de messes, répond l'Église, qui le suspend. Trésor, répond la légende : des parchemins découverts dans un pilier wisigothique, le trésor de Blanche de Castille, l'or du Temple, ou un secret capable d'ébranler Rome. [[slnc 500]] Saunière meurt en mille neuf cent dix-sept sans avoir parlé. Sa servante, Marie Dénarnaud, promit un jour de révéler un secret qui donne la puissance. Elle mourut muette, elle aussi. [[slnc 400]] Regardez le diable Asmodée qui porte le bénitier, les quatorze stations du chemin de croix aux détails inexpliqués. [[slnc 300]] Ici, chaque pierre est une énigme. Et l'énigme n'est toujours pas résolue."

echo ""
echo "✓ Guides audio générés dans $OUT :"
ls -la "$OUT"
