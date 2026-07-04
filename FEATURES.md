# Last Cathar — Fonctionnalités implémentées

> Ce fichier documente tout ce qui a été ajouté au-delà du globe interactif de base.
> Mis à jour : 2026-07-04
>
> État du contenu : **~835 lieux**, **16 épopées**

---

## 1. Système d'authentification (Explorateurs)

### Comment ça marche
- **NextAuth v4** avec stratégie **JWT** (pas de session en base = plus rapide)
- **Credentials provider** : email + mot de passe hashé avec bcryptjs
- Le JWT contient `id`, `email`, `name`, `role` de l'utilisateur
- Le token est stocké dans un cookie HTTP-only côté navigateur

### Fichiers clés
| Fichier | Rôle |
|---------|------|
| `src/lib/auth.ts` | Configuration NextAuth (providers, callbacks JWT/session) |
| `src/lib/prisma.ts` | Singleton Prisma Client (évite les connexions multiples en dev) |
| `src/app/api/auth/[...nextauth]/route.ts` | Route NextAuth (login, session, csrf) |
| `src/app/api/auth/register/route.ts` | API d'inscription (POST email/password/name) |
| `src/components/auth/AuthProvider.tsx` | SessionProvider qui wrap l'app (layout.tsx) |
| `src/components/auth/AuthModal.tsx` | Modal connexion/inscription (glass-morphism) |
| `src/components/auth/UserMenu.tsx` | Menu profil en haut à droite (initiales, dropdown) |
| `src/types/next-auth.d.ts` | Extension des types NextAuth (ajout id, role sur session) |

### Menu profil — Filtrage des lieux
Cliquer sur "Mes lieux visités", "Ma wishlist" ou "Mes favoris" dans le menu profil :
1. Charge les interactions de l'utilisateur depuis `/api/interactions`
2. Filtre le globe pour n'afficher que les lieux marqués
3. Affiche un banner coloré sous le header ("✓ Mes lieux visités · X lieux")
4. Le bouton ✕ ou re-clic sur le même filtre désactive le filtre

**Fichiers** : `UserMenu.tsx` (menu + fetch + compteurs), `Header.tsx` (passe les props),
`page.tsx` (état `interactionFilter` + `interactionSlugs` + filtrage dans `filteredPlaces`)

### Ajout de produit par un commerçant
1. Le commerçant clique "Proposer un produit ici" dans la section Découvertes locales
2. S'il n'est pas connecté → modal d'authentification
3. Formulaire : titre, description, prix, URL site, photos (URLs)
4. POST `/api/products/submit` → crée le Product en statut REVIEW
5. L'admin valide → le produit passe en APPROVED et apparaît dans la sidebar
6. Le rôle de l'utilisateur passe automatiquement à SELLER

**Fichiers** : `AddProductModal.tsx` (formulaire), `ProductCards.tsx` (bouton + intégration),
`/api/products/submit/route.ts` (API)

### Pourquoi pas de PrismaAdapter ?
On utilise uniquement le Credentials provider avec JWT. Le PrismaAdapter crée des sessions en base
de données, ce qui entre en conflit avec la stratégie JWT. Sans adapter, `getServerSession()`
fonctionne correctement côté API routes en lisant le JWT du cookie.

### Rôles utilisateur
- `EXPLORER` (défaut) — peut marquer des lieux, voir les produits
- `SELLER` — peut ajouter des produits sur les emplacements loués
- `ADMIN` — peut modérer les contributions et gérer les slots

---

## 2. Interactions explorateur (Visité / À visiter / Favori)

### Comment ça marche
- 3 boutons dans le `PlaceDetailPanel`, sous l'image hero
- Chaque clic fait un POST `/api/interactions` qui **toggle** l'interaction en base
- Si l'utilisateur n'est pas connecté, cliquer ouvre la modal d'authentification
- Les interactions sont chargées au mount du composant (GET `/api/interactions`)
- Animation Framer Motion au toggle (scale bounce + dot indicator)

### Fichiers clés
| Fichier | Rôle |
|---------|------|
| `src/components/auth/PlaceInteractionButtons.tsx` | Boutons toggle avec animations |
| `src/app/api/interactions/route.ts` | API GET (liste) + POST (toggle) |

### Modèle Prisma
```prisma
model UserPlaceInteraction {
  id        String          @id @default(cuid())
  userId    String
  placeSlug String          // Lié au slug du lieu (pas un FK, car les lieux sont en mémoire)
  type      InteractionType // VISITED, WISHLIST, FAVORITE
  @@unique([userId, placeSlug, type]) // Un seul de chaque type par lieu par user
}
```

---

## 3. Marketplace — Vitrines numériques

### Concept
Certains lieux ont des **emplacements** (slots) que des vendeurs peuvent louer pour afficher
leurs produits/services locaux. Les produits apparaissent dans la sidebar quand on clique sur
un lieu, dans la section "Découvertes locales".

### Tarification
- **1 emplacement** : 50 €/mois
- **Pack 10 emplacements** : 400 €/mois (économie de 100 €)

### Comment ça marche
1. L'admin crée des `PlaceSlot` pour les lieux éligibles (ex: Carcassonne = 4 slots)
2. Le vendeur (rôle SELLER) souscrit un abonnement (Stripe — à implémenter)
3. Le vendeur crée un `Product` lié à un slot (titre, description, prix, images, URL externe)
4. L'admin approuve le produit (moderation: REVIEW → APPROVED)
5. Le produit apparaît dans la sidebar du lieu correspondant
6. Le clic sur "Voir sur le site" redirige vers le site du vendeur (on ne gère pas la vente)

### Placement UX dans la sidebar
```
┌─────────────────────────────────────┐
│  [Image hero]                       │
│  Titre du lieu                      │
│  ─────────────────────────────────  │
│  [Visité] [À visiter] [Favori]      │  ← Boutons interaction
│  Catégorie, Confiance, Localisation │
│  Épopées liées                      │
│  Description courte                 │
│                                     │
│  🛍️ DÉCOUVERTES LOCALES            │  ← Section produits (après description)
│  ┌──────────┐  ┌──────────┐        │
│  │ Produit 1│  │ Produit 2│        │     Grille 2 colonnes
│  └──────────┘  └──────────┘        │     (image, titre, prix, "Voir")
│  ┌──────────┐  ┌──────────┐        │
│  │ Produit 3│  │ Produit 4│        │     Clic → modal détail + bouton externe
│  └──────────┘  └──────────┘        │
│  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐     │
│  │ + Proposer un produit ici │     │  ← Bouton ajout commerçant (dashed)
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘     │     Ouvre le formulaire d'ajout
│  ─────────────────────────────────  │
│  The Story (texte complet)          │  ← Contenu éditorial après les produits
│  Scores, Sources, Tags...           │
└─────────────────────────────────────┘
```

**Pourquoi après la description courte et avant l'histoire complète ?**
- L'utilisateur qui scroll est engagé et curieux (contexte local)
- Les produits sont pertinents (géo-liés au lieu consulté)
- Pas intrusif : le contenu éditorial continue en dessous
- Sur mobile (plein écran), la grille 2 colonnes fonctionne bien

### Fichiers clés
| Fichier | Rôle |
|---------|------|
| `src/components/marketplace/ProductCards.tsx` | Grille produits + modal détail + bouton ajout |
| `src/components/marketplace/AddProductModal.tsx` | Formulaire ajout produit (commerçant) |
| `src/app/api/products/route.ts` | API GET produits par placeSlug |
| `src/app/api/products/click/route.ts` | API POST tracking clic produit |
| `src/app/api/products/submit/route.ts` | API POST soumission nouveau produit |
| `src/components/panels/PlaceDetailPanel.tsx` | Intègre `<ProductCards>` dans la sidebar |
| `scripts/seed-marketplace.ts` | Script de seed données démo |

### Modèles Prisma
```prisma
model PlaceSlot {
  placeSlug    String  @unique  // Le lieu qui a des emplacements
  maxSlots     Int     @default(4)
  pricePerMonth Int    @default(50)
  products     Product[]
}

model Product {
  sellerId    String      // Le vendeur
  placeSlotId String      // Lié au slot du lieu
  title       String
  description String?
  price       String?     // Affiché tel quel (ex: "24,90 €")
  imageUrls   String[]
  externalUrl String?     // Lien vers le site du vendeur
  status      ModerationState  // REVIEW → APPROVED pour être visible
  views       Int         // Compteur de vues
  clicks      Int         // Compteur de clics vers le site
}

model Subscription {
  userId       String
  plan         SubscriptionPlan  // SINGLE (50€) ou PACK_10 (400€)
  status       SubscriptionStatus
  slotsIncluded Int
  stripeSubId  String?    // ID abonnement Stripe (à implémenter)
}
```

### Analytics
Chaque ouverture de sidebar et clic sur un produit est tracké :
```prisma
model PlaceView {
  placeSlug String
  productId String?
  event     ViewEvent  // PLACE_OPEN, PRODUCT_VIEW, PRODUCT_CLICK
}
```

---

## 4. Comptes & Accès

### Compte administrateur
| Champ | Valeur |
|-------|--------|
| **Email** | `admin@lastcathar.com` |
| **Mot de passe** | `yassineMAMOU1` |
| **Rôle** | `ADMIN` |
| **Page admin** | https://last-cathar.vercel.app/admin |

### Rôles
| Rôle | Droits |
|------|--------|
| `EXPLORER` | Créer un compte, marquer des lieux (visité/wishlist/favori) |
| `SELLER` | Tout Explorer + soumettre des produits (auto-attribué au 1er produit soumis) |
| `ADMIN` | Tout Seller + accès `/admin`, modérer les produits (approuver/rejeter) |

### Page admin — Modération produits
- **URL** : `/admin` (protégée, rôle ADMIN requis)
- **Onglet "Produits à modérer"** : liste tous les produits avec badge compteur REVIEW
  - Image, titre, vendeur, lieu, prix, lien externe, date de soumission
  - Bouton **Approuver** → statut APPROVED → visible dans la sidebar du lieu
  - Bouton **Rejeter** → statut REJECTED → masqué
- **Onglet "Places"** : liste existante des lieux du globe
- **Fichiers** : `src/app/admin/page.tsx`, `src/app/api/admin/products/route.ts`

---

## 5. Base de données

### Provider
**Neon Serverless Postgres** (gratuit, région Frankfurt)
- Dashboard : https://console.neon.tech
- Projet : `lastcathar` (id: `long-mountain-84328565`)

### ORM
**Prisma 5** avec `prisma db push` (schema-first, pas de migrations fichier)

### Variables d'environnement
| Variable | Où | Usage |
|----------|-----|-------|
| `DATABASE_URL` | `.env.local` + Vercel | URL connexion Neon Postgres |
| `NEXTAUTH_SECRET` | `.env.local` + Vercel | Signature JWT |
| `NEXTAUTH_URL` | `.env.local` + Vercel | URL du site (pour les callbacks) |
| `NEXT_PUBLIC_CESIUM_ION_TOKEN` | `.env.local` + Vercel | Token Cesium pour le globe |

### Scripts utiles
```bash
npx prisma db push          # Appliquer le schéma à la base
npx prisma studio           # Interface visuelle pour explorer la base
npx prisma generate         # Régénérer le client Prisma
npx tsx scripts/seed-marketplace.ts  # Seed données marketplace démo
```

---

## 6. Déploiement

### Stack
- **Code** : GitHub → `yasmamou/LastCathar` (branche `main`)
- **Hosting** : Vercel (auto-deploy sur push)
- **BDD** : Neon Postgres (Frankfurt)
- **URL** : https://last-cathar.vercel.app

### Build pipeline (Vercel)
1. `prisma generate` → génère le client Prisma
2. `cesium:copy` → copie les assets CesiumJS dans public/
3. `next build` → build Next.js

### Fichiers de config
| Fichier | Rôle |
|---------|------|
| `.vercel-token` | Token Vercel CLI (gitignored) |
| `.env.local` | Secrets locaux (gitignored) |
| `.env.example` | Template des variables requises |
| `prisma/schema.prisma` | Schéma complet de la base |

---

## 7. Contenu — Épopées & lieux

### Épopées actuelles (16)
| Épopée | Slug | Thème |
|--------|------|-------|
| Le Saint Graal | `graal` | Quête du calice, de Jérusalem au Pays Cathare |
| Rome antique en Gaule | `rome-antique-gaule` | Vestiges romains du sud de la France |
| Troubadours | `troubadours` | Cours d'amour et fin'amor médiévaux |
| Cycle arthurien | `arthurien` | Lieux de la légende d'Arthur |
| Atlantide | `atlantide` | Candidats archéologiques au continent perdu |
| Compostelle (Sud) | `compostelle-sud` | Chemin de Saint-Jacques côté sud |
| Préhistoire (Sud) | `prehistoire-sud` | Grottes ornées et mégalithes |
| Templiers | `templiers` | Ordre du Temple : commanderies & trésor |
| Vikings | `vikings` | Expéditions et colonies nordiques |
| Eldorado | `eldorado` | Cité d'or et conquistadors |
| Pharaons | `pharaons` | Égypte ancienne, mystères des pyramides |
| Rois berbères | `rois-berberes` | Massinissa, Jugurtha, Juba II |
| Croisade cathare | `croisade-cathare` | Albigeois : Béziers → Montségur (1209-1244) |
| Wisigoths | `wisigoths` | Trésor d'Alaric, royaume de Toulouse |
| Génies scientifiques | `genies-scientifiques` | Lieux de naissance/travail des grands savants |
| Découverte de la gravité | `decouverte-gravite` | De Galilée à Einstein |

### Source
`src/data/epics.ts` — chaque épopée référence ses lieux par `slug` avec un `order`, un `role` et une `date` optionnelle.

---

## 8. Lieux à proximité (Nearby Places)

### Comment ça marche
Quand un lieu est ouvert dans la sidebar, on calcule les lieux les plus proches (haversine sur lat/lng) et on les propose à deux endroits :
1. **Dans la sidebar** — section "À proximité" sous l'histoire complète (cards compactes)
2. **Bandeau bas d'écran** — strip horizontale scrollable, toujours visible tant qu'on consulte un lieu

Cliquer sur une vignette **navigue vers le lieu** (mise à jour de la sidebar + animation caméra Cesium).

### Fichiers clés
| Fichier | Rôle |
|---------|------|
| `src/components/panels/PlaceDetailPanel.tsx` | Section "À proximité" dans la sidebar |
| `src/components/layout/NearbyStrip.tsx` | Bandeau bas d'écran |
| `src/lib/geo.ts` | Calcul haversine + tri par distance |

---

## 9. Lecteur musical immersif

### Comment ça marche
- **Lecteur fixé en bas à gauche** (centre vertical à gauche), toujours visible et discret
- **Musique par défaut** : *Gloria* (ambiance médiévale)
- **Musique par lieu** : certains lieux ont une bande-son dédiée — auto-play au clic sur le lieu
  - Château de Montségur → *Montségur* (Iron Maiden)
  - Cherchell / Tipaza → musique berbère
  - Narbonne, Bugarach, Montagne d'Alaric, Cité de Carcassonne → tracks dédiés
- **UI** : play/pause, titre du morceau, slider de volume

### Fichiers clés
| Fichier | Rôle |
|---------|------|
| `src/components/audio/MusicPlayer.tsx` | Lecteur fixe + state global |
| `src/lib/place-music.ts` | Mapping `placeSlug → trackUrl` |
| `public/audio/` | Fichiers audio (Gloria, Iron Maiden Montségur, etc.) |

---

## 10. Occlusion du globe (marqueurs côté caché)

### Problème
Avant : les marqueurs des lieux situés de l'autre côté de la Terre étaient visibles à travers le globe — illusion 3D cassée.

### Solution
Utilisation du **depth test natif de Cesium** sur les entités point + filtrage par produit scalaire (normale au globe vs direction caméra). Les marqueurs côté opposé sont masqués proprement, sans hack `preRender`.

### Fichiers clés
- `src/components/globe/Globe.tsx` — configuration du depth test + visibilité des entités

---

## 11. Stats & analytics produit

### Dans la sidebar
- Compteur de **vues** du lieu affiché discrètement
- Pour chaque produit : badge avec nombre de vues + clics

### Dans le formulaire vendeur (`AddProductModal`)
- Stats détaillées du slot : trafic moyen, taux de clic estimé, suggestion de prix
- Aide le vendeur à évaluer la valeur d'un emplacement avant de soumettre

**Fichiers** : `PlaceDetailPanel.tsx`, `AddProductModal.tsx`, `api/places/[slug]/stats/route.ts`

---

## 12. Génération vidéo Remotion

### Concept
Système de génération de **vidéos cinématiques 1920×1080 / 60 s** pour chaque épopée, à partir des données existantes (`src/data/epics.ts` + `all-places.ts`). Utile pour réseaux sociaux et bande-annonce du site.

### Composant universel
`remotion/EpicVideo.tsx` génère pour chaque lieu de l'épopée :
- **Carte OpenStreetMap** en fond, assombrie/désaturée
- **Marqueur pulsant** centré sur le lieu courant
- **Lignes pointillées** reliant les lieux dans l'ordre chronologique
- **Texte bas gauche** : compteur, date, titre, rôle
- **Sidebar droite** : photo hero, badge, description, tags, coordonnées
- **Fondu au noir** entre lieux + barre de progression en bas

### Compositions existantes
- `CroisadeCathare` — Croisade albigeoise (Béziers → Montségur)
- `RoisBerberes` — Massinissa, Jugurtha, Juba II

### Commandes
```bash
npm run remotion:preview   # Prévisualisation navigateur
npx remotion render remotion/index.tsx CroisadeCathare out/croisade-cathare.mp4 --codec=h264 --crf=28
```

### Capture des sidebars HTML → PNG
`scripts/capture-sidebars.ts` capture chaque sidebar de lieu (Puppeteer) vers `public/sidebars/<epic>/<slug>.png` pour intégration dans les vidéos.

### Fichiers clés
| Fichier | Rôle |
|---------|------|
| `remotion/index.tsx` | Liste des compositions |
| `remotion/EpicVideo.tsx` | Composant universel |
| `remotion/VideoSidebar.tsx` | Sidebar utilisée dans la vidéo |
| `remotion/remotion.config.ts` | Config Remotion |
| `scripts/capture-sidebars.ts` | Capture PNG des sidebars |
| `public/sidebars/` | Images générées (gitignored) |

---

## 13. Paiement Stripe (test mode)

### Ce qui a été branché
- **Stripe SDK v22** en dépendance
- **2 plans** définis dans `src/lib/stripe.ts` :
  - `SINGLE` — 50 €/mois, 1 emplacement
  - `PACK_10` — 400 €/mois, 10 emplacements (économie de 100 €)
- **Page `/pricing`** cinématique (glass + amber accents) avec CTA Checkout + lien vers le billing portal
- **Pages `/pricing/success` + `/pricing/canceled`**

### API
| Route | Rôle |
|-------|------|
| `POST /api/stripe/checkout` | Crée une Checkout Session (réutilise le customer si l'user en a déjà un) |
| `POST /api/stripe/portal` | Ouvre le billing portal pour gérer l'abo |
| `POST /api/stripe/webhook` | Traite `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.payment_failed` |

### Modèle Prisma enrichi
```prisma
model Subscription {
  stripeCustomerId String?
  stripeSubId      String? @unique
  stripePriceId    String?
  currentPeriodEnd DateTime?
  // ...
}
```

### Effets secondaires
- Un `checkout.session.completed` bascule automatiquement l'user en rôle `SELLER`
- La `Subscription` créée en base contient les infos Stripe (customerId, subId, priceId, currentPeriodEnd)
- `invoice.payment_failed` passe la sub en `PAST_DUE`
- `customer.subscription.deleted` passe en `CANCELLED`

### Variables d'environnement
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # via `stripe listen` en local
STRIPE_PRICE_SINGLE=price_...     # Dashboard → Products
STRIPE_PRICE_PACK_10=price_...
```

### Fichiers clés
- `src/lib/stripe.ts` (lazy init + Proxy)
- `src/app/api/stripe/{checkout,portal,webhook}/route.ts`
- `src/app/pricing/{page,success/page,canceled/page}.tsx`

---

## 14. Mode Chercheur (gamification)

### Concept
Une modale d'accueil s'affiche à la 1re visite pour proposer de **suivre les traces des Cathares**, en commençant par Carcassonne (1209). L'utilisateur avance dans l'épopée, gagne de l'**XP** et débloque des **badges**. Une HUD persistant (top-right) montre la progression et la prochaine étape à visiter.

### Boucle de jeu
- **+100 XP** par lieu de l'épopée active visité (1re fois)
- **+500 XP** bonus quand une épopée est terminée
- **10 paliers de niveau** (0 → 18 000 XP)
- **7 badges** dont 3 spécifiques à Cathare (`cathare-carcassonne`, `cathare-half`, `cathare-complete`)

### Composants
| Fichier | Rôle |
|---------|------|
| `src/lib/game.ts` | XP rules, catalogue des badges, level curve, helper `checkBadgesForVisit` |
| `src/components/chercheur/useChercheur.ts` | Hook central : state fetch, actions, localStorage flags |
| `src/components/chercheur/WelcomeChercheurModal.tsx` | Modale cinématique 1re visite |
| `src/components/chercheur/ChercheurHUD.tsx` | HUD persistant top-right : niveau + progression + carte "prochaine étape" |
| `src/components/chercheur/BadgeToast.tsx` | Toast animé bottom quand un badge est débloqué |

### API
| Route | Rôle |
|-------|------|
| `GET /api/game/state` | XP + niveau + badges + progression par épopée |
| `POST /api/game/visit` | Enregistre une visite, calcule XP + badges attribués |

### Modèles Prisma
```prisma
model UserEpicProgress {
  userId       String
  epicId       String
  currentOrder Int
  visitedSlugs String[]
  completedAt  DateTime?
  @@unique([userId, epicId])
}
model UserBadge {
  userId    String
  badgeSlug String
  earnedAt  DateTime
  @@unique([userId, badgeSlug])
}
model UserXP {
  userId String @unique
  xp     Int
  level  Int
}
```

### Trigger d'ouverture
- **Modale d'accueil** : `setTimeout(4200ms)` après le landing si `localStorage['chercheur:welcome-shown']` n'est pas set
- **Clic "Commencer l'épopée à Carcassonne"** → active l'épopée `croisade-cathare`, flyTo Carcassonne, enregistre la 1re visite
- **Clic sur un lieu de l'épopée active** → `POST /api/game/visit` automatique
- **HUD "Prochaine étape"** → clic → flyTo + visite du prochain lieu non-visité (par ordre chronologique)

---

## 15. PWA — installation Android / iPhone

### Ce qui a été branché
- **`src/app/manifest.ts`** — sert `/manifest.webmanifest` avec name, theme color, orientation, shortcuts (Mode Chercheur + Vitrines)
- **Icônes générées dynamiquement** via `ImageResponse` (`next/og`) : `/icon-192.png`, `/icon-512.png`, `/icon-maskable-512.png`, `/apple-icon` (180×180). Design : fond dégradé navy, monogramme "LC" doré.
- **`public/sw.js`** — service worker minimal (network-first sur navigations, stale-while-revalidate sur assets, bypass total pour `/api/`, `/cesium/`)
- **`src/app/layout.tsx`** — metadata Apple Web App + Viewport séparé
- **`src/components/pwa/PwaProvider.tsx`** — enregistre le SW, détecte iOS/Android/desktop, capture `beforeinstallprompt`
- **`src/components/pwa/InstallPrompt.tsx`** — pastille "📥 Installer l'app" + modal iOS avec les 3 étapes (Partager → Sur l'écran d'accueil → Ajouter)

### Comment installer

**🟢 Android (Chrome, Edge, Samsung Internet, Brave)**
1. Ouvrir https://last-cathar.vercel.app dans Chrome
2. Touche la pastille dorée **📥 Installer l'app** en haut à gauche (ou menu ⋮ → "Installer l'application")
3. Confirme avec **Installer**

**🍎 iPhone / iPad (Safari uniquement — obligation Apple)**
1. Ouvrir https://last-cathar.vercel.app dans **Safari** (impossible dans Chrome sur iOS)
2. Touche la pastille dorée **📥 Installer l'app** → modal explicatif
3. Bouton **Partager** en bas de Safari → **Sur l'écran d'accueil** → **Ajouter**

**💻 Desktop (Chrome, Edge)**
- Icône **📥** dans la barre d'adresse, ou menu → "Installer Last Cathar"

### Test local
```bash
npm run build && npm start   # SW ne s'active pas en `npm run dev`
# DevTools → Application → Manifest / Service Workers
```

---

## 16. Ce qui reste à faire

### Phase 3 — Contributions utilisateur (UGC)
- [ ] Formulaire d'ajout de photos/lieux dans la sidebar
- [ ] Upload images (Cloudinary ou UploadThing)
- [ ] File de modération admin enrichie

### Phase 5 — Dashboard vendeur
- [ ] Page `/dashboard` : mes produits, mes emplacements, mes stats
- [ ] Top emplacements par volume de visites
- [ ] Suggestions géo-pertinentes pour l'achat d'emplacements

### Phase 6 — Vidéos & contenu social
- [ ] Rendre les 16 épopées en vidéos Remotion
- [ ] Page `/epopees/[slug]` avec lecteur vidéo intégré
- [ ] Export automatisé via cron (déclenché à chaque nouvelle épopée)

### Phase 7 — Étendre le Mode Chercheur
- [ ] Choix de l'épopée de départ (au lieu de forcer Cathare)
- [ ] Classement communautaire (top chercheurs par XP)
- [ ] Page `/chercheur/profil` avec badges + progression complète
- [ ] Épopées personnalisées créées par les users
