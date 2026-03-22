# Last Cathar — Fonctionnalités implémentées

> Ce fichier documente tout ce qui a été ajouté au-delà du globe interactif de base.
> Mis à jour : 2026-03-22

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

## 7. Ce qui reste à faire

### Phase 3 — Contributions utilisateur (UGC)
- [ ] Formulaire d'ajout de photos/lieux dans la sidebar
- [ ] Upload images (Cloudinary ou UploadThing)
- [ ] File de modération admin enrichie

### Phase 4 — Paiement Stripe
- [ ] Intégration Stripe Checkout pour les abonnements
- [ ] Gestion des plans (SINGLE 50€, PACK_10 400€)
- [ ] Webhook Stripe pour activer/désactiver les abonnements
- [ ] Dashboard vendeur avec métriques

### Phase 5 — Dashboard vendeur
- [ ] Page `/dashboard` : mes produits, mes emplacements, mes stats
- [ ] Top emplacements par volume de visites
- [ ] Suggestions géo-pertinentes pour l'achat d'emplacements
