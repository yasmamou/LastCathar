# Remotion — Vidéos Last Cathar

Système de génération de vidéos cinématiques pour les épopées de Last Cathar.

## Structure

```
remotion/
├── index.tsx          # Point d'entrée — liste des compositions
├── EpicVideo.tsx      # Composant réutilisable (carte + sidebar + texte)
├── RoisBerberes.tsx   # Ancienne version (grille seule, obsolète)
├── remotion.config.ts # Config Remotion
└── README.md          # Ce fichier
```

## Comment ça marche

Le composant `EpicVideo` prend un `EpicConfig` et génère une vidéo 60s (1920×1080) avec :
- **Carte OpenStreetMap** en fond (assombrie, désaturée)
- **Marqueur pulsant** centré sur le lieu actuel
- **Lignes pointillées** reliant les lieux visités
- **Texte en bas à gauche** : compteur, date, titre, rôle
- **Sidebar à droite** : photo hero, badge, date, description, tags, coordonnées
- **Fondu au noir** entre chaque lieu (pas de glissement)
- **Barre de progression** en bas

Les données sont importées directement depuis `src/data/epics.ts` et `src/data/all-places.ts`.

## Commandes

### Prévisualiser dans le navigateur
```bash
npm run remotion:preview
```

### Rendre une vidéo
```bash
# Croisade Cathare
npx remotion render remotion/index.tsx CroisadeCathare out/croisade-cathare.mp4 --codec=h264 --crf=28

# Rois Berbères
npx remotion render remotion/index.tsx RoisBerberes out/rois-berberes.mp4 --codec=h264 --crf=28
```

### Paramètres utiles
- `--crf=28` : compression (18=lourd+qualité, 28=léger, 35=très compressé)
- `--concurrency=4` : frames rendues en parallèle
- `--timeout=15000` : timeout par frame (utile si tuiles lentes)

## Ajouter une nouvelle épopée

1. Dans `remotion/index.tsx`, l'epic est automatiquement chargée depuis `src/data/epics.ts`
2. Il suffit d'ajouter l'id de l'épopée et un `mapZoom` dans le tableau `EPIC_VIDEOS`
3. Lancer le rendu avec le nouvel id

## Configuration par épopée

| Paramètre | Description | Défaut |
|-----------|-------------|--------|
| `mapZoom` | Niveau de zoom carte (6=continent, 10=ville) | 9 |
| `color` | Couleur thème (depuis l'épopée) | — |
| `icon` | Emoji en haut à gauche | — |

## Fichiers générés

Les vidéos sont dans `out/` (gitignored).
