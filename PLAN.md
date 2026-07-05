# Plan d'action — Last Cathar

> Document vivant. Chaque session met à jour cette page.
> Dernière mise à jour : 2026-07-05

---

## 🎯 Vision produit (rappel court)

Un globe 3D immersif où l'utilisateur découvre des lieux mystérieux, des épopées historiques, et des produits locaux authentiques — le tout en jouant (mode Chercheur). Les marchands louent des emplacements aux lieux qui leur ressemblent. Le globe devient à la fois **encyclopédie**, **jeu**, et **place de marché**.

Trois publics :
- **L'explorateur** — cherche des histoires cachées, veut être guidé, aime les jeux
- **Le voyageur** — cherche des lieux à visiter, veut des produits locaux avant/pendant le voyage
- **Le marchand** — veut placer ses produits à côté des lieux qui inspirent ses clients

---

## 📊 État actuel (2026-07-05)

### Contenu
- **835 lieux** à travers le monde (France, Europe, Afrique, Amériques, Asie, Océanie)
- **16 épopées** : Graal, Templiers, Vikings, Atlantide, Pharaons, Arthurien, Troubadours, Compostelle, Rome en Gaule, Préhistoire, Rois Berbères, **Croisade Cathare (épopée d'accueil)**, Wisigoths, Génies scientifiques, Découverte de la gravité, Eldorado

### Features livrées
| # | Feature | État | Fichier de doc |
|---|---------|------|----------------|
| 1 | Globe 3D CesiumJS + intro cinématique Carcassonne | ✅ | ARCHITECTURE.md §1 |
| 2 | Auth NextAuth JWT (Explorer / Seller / Admin) | ✅ | FEATURES.md §1 |
| 3 | Interactions (Visité / Wishlist / Favori) | ✅ | FEATURES.md §2 |
| 4 | Marketplace : slots + produits + modération admin | ✅ | FEATURES.md §3 |
| 5 | Base Neon Postgres + Prisma | ✅ | FEATURES.md §5 |
| 6 | Lieux à proximité (sidebar + bottom strip) | ✅ | FEATURES.md §8 |
| 7 | Lecteur musical fixe + musique par lieu | ✅ | FEATURES.md §9 |
| 8 | Occlusion globe (marqueurs côté caché) | ✅ | FEATURES.md §10 |
| 9 | Stats vues / clics dans sidebar et pour vendeurs | ✅ | FEATURES.md §11 |
| 10 | Génération vidéo Remotion pour épopées | ✅ | FEATURES.md §12 |
| 11 | **Stripe Checkout + Webhook + Portal** (test mode) | ✅ | FEATURES.md §13 |
| 12 | **Mode Chercheur** (XP + badges + progression épopée) | ✅ | FEATURES.md §14 |
| 13 | **PWA installable** (Android + iOS + desktop) | ✅ | FEATURES.md §15 |
| 14 | **Produits locaux** — strip géo-adaptatif | ✅ | FEATURES.md §16 |

### Bugs corrigés cette semaine
- HUD Chercheur qui débordait sur les panneaux → bascule top-right / top-left / caché mobile
- Bar de recherche qui overlappait la colonne produits → shift `md:left-[calc(50%-7rem)]`
- `/pricing` non scrollable → layout dédié qui unlock `body { overflow: hidden }`
- Auth manuelle avant paiement → AuthModal in-place + resume automatique du checkout
- Colonne produits trop haute (colision UserMenu) → descendue à `top-20`
- Colonne produits masquée quand panneau ouvert → reste visible, bascule côté opposé
- Click produit ne montre pas le produit → auto-scroll + auto-open modal + highlight amber

---

## 🚧 Session en cours — 2026-07-05

### 1. Structuration
- [x] Créer `PLAN.md` à la racine (ce fichier)
- [ ] Mettre à jour `FEATURES.md` §17 (Produits locaux workflow) et §18 (QuestBanner)

### 2. QuestBanner — motivation permanente
**Problème** : Une fois le WelcomeModal fermé, il n'y a rien qui invite le nouveau visiteur à démarrer le jeu. Il manque le côté "gamifié" visible en permanence.

**Solution** :
- Nouveau composant `QuestBanner` en haut à gauche (sous la colonne de pills Nearby/Filter/Install)
- Visible uniquement sur desktop, uniquement quand Mode Chercheur est INACTIF
- Contenu : icône 🔥 + "Croisade Cathare — Suivez les traces des Bons Hommes" + CTA "Commencer l'épopée"
- Clic → active Mode Chercheur + fly to Carcassonne
- Disparaît une fois le mode actif (le HUD Chercheur prend le relais)

### 3. CTA emplacement — retirer le prix
**Problème** : "Louer cet emplacement — 50 €/mois" en haut-droite montre le prix trop tôt et refroidit potentiellement.

**Solution** :
- Retirer "— 50 €/mois" du sous-titre
- Nouveau sous-titre : "Réserver cet emplacement" (mystère + action)
- Le prix apparaît au clic sur `/pricing`

### 4. Vérifier flow paiement bout-en-bout
- [x] Card CTA → `/pricing` (existant)
- [x] Auth in-place → resume checkout automatique (livré)
- [x] Pack Marchand affiché à **400 €/mois** (pas /an)
- [ ] Ajouter des tests manuels documentés dans `PLAN.md` §Test plan

### 5. Bumps
- Bump `sw.js` CACHE_VERSION à chaque livraison (actuellement `lc-v7`)

---

## 🔜 Prochaine phase — Q3 2026

### Phase A — Dashboard vendeur
- Page `/dashboard` : mes produits, mes emplacements, mes stats
- Top emplacements par volume de visites
- Suggestions géo-pertinentes (« les lieux les plus proches de vos produits actuels »)
- Bouton "Ajouter un produit" sortable depuis le dashboard

### Phase B — Contributions communautaires (UGC)
- Upload photos utilisateur pour un lieu (Cloudinary ou UploadThing)
- Soumission de nouveaux lieux depuis l'app
- Modération admin élargie

### Phase C — Étendre Mode Chercheur
- Choix de l'épopée de départ (au lieu de forcer Cathare)
- Classement communautaire (top chercheurs par XP)
- Page `/chercheur/profil` avec badges + progression complète
- Épopées créées par les users

### Phase D — Vidéos & contenu social
- Rendre les 16 épopées en vidéos Remotion (2 déjà rendues)
- Page `/epopees/[slug]` avec lecteur vidéo intégré
- Export automatisé via cron (déclenché à chaque nouvelle épopée)

### Phase E — Stripe production
- Passage en mode live avec vraies clés
- Configuration webhook prod dans le dashboard Stripe
- Facturation VAT si nécessaire

---

## 🧪 Test plan (à faire manuellement)

### Flow 1 — Nouveau visiteur non connecté
1. Ouvrir https://last-cathar.vercel.app en incognito
2. Vérifier : intro cinématique 3.5s → UI apparaît → **WelcomeChercheurModal** apparaît à 4.2s
3. Cliquer **Commencer l'épopée à Carcassonne**
4. Vérifier : caméra vole vers Carcassonne + panneau ouvre + **badge "Sur les traces des Cathares"** en toast bas centre
5. Le HUD Chercheur (droit sur desktop, pill bas-gauche sur mobile) montre Niveau 1 · 1/18

### Flow 2 — Chercheur déjà démarré, réouverture
1. Le `QuestBanner` en haut-gauche a disparu (Mode Chercheur actif)
2. Le HUD Chercheur reprend l'état
3. Cliquer "Prochaine étape" dans le HUD → fly to Béziers
4. La visite est enregistrée + XP awardés

### Flow 3 — Découverte produit
1. La colonne "Produits locaux" (droite desktop / pill mobile) est peuplée
2. Panner le globe vers l'Australie → la colonne se met à jour avec produits locaux les plus proches
3. Cliquer un produit → fly to lieu + panneau ouvre + produit encadré en amber + modal détail auto-ouvert
4. Cliquer "Voir sur le site" → onglet externe vers site vendeur

### Flow 4 — Nouveau marchand
1. Depuis n'importe où : cliquer la card en pointillé "+ Votre produit ici"
2. Redirigé vers `/pricing` (scrollable)
3. Non connecté → AuthModal s'ouvre → créer un compte
4. Après création → checkout Stripe redirigé automatiquement pour le plan choisi
5. Utiliser une carte de test Stripe : `4242 4242 4242 4242`, date future, CVC 123, code postal 12345
6. Vérifier : `Subscription` créée en DB avec `status = ACTIVE`, `plan = SINGLE`, `stripeCustomerId`, `currentPeriodEnd`
7. Rôle user → `SELLER` automatiquement

### Flow 5 — Vendeur existant, ajouter un produit
1. Cliquer un lieu qui a des slots disponibles
2. Dans le panneau, section "Découvertes locales", cliquer "Proposer un produit ici"
3. Formulaire → soumission → status = REVIEW
4. Admin (`admin@lastcathar.com` / `yassineMAMOU1`) → `/admin` → onglet "Produits à modérer" → approuver
5. Vérifier : produit apparaît dans la sidebar + dans la colonne "Produits locaux"

### Flow 6 — Installation PWA
1. Sur mobile Android Chrome : pastille dorée "📥 Installer l'app" → prompt natif → confirmer
2. Sur iPhone Safari : pastille "📥 Installer l'app" → modal 3 étapes → suivre → l'icône LC apparaît
3. Sur desktop Chrome : icône install dans la barre d'adresse

---

## 🗂 Fichiers de doc

| Fichier | Rôle |
|---------|------|
| `PLAN.md` (ce fichier) | Plan d'action de la session courante + roadmap |
| `README.md` | Présentation publique + quick start |
| `FEATURES.md` | Détail exhaustif des features livrées |
| `ARCHITECTURE.md` | Référence technique complète (data model, agents, design) |

---

## 🔑 Comptes & accès

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | `admin@lastcathar.com` | `yassineMAMOU1` |

- Page admin : `/admin` (modération produits + liste places)
- Neon DB : dashboard https://console.neon.tech, projet `lastcathar`
- Vercel : projet linké, auto-deploy sur push main
- GitHub : https://github.com/yasmamou/LastCathar

## 💳 Stripe (test mode)

- Clés de test : dashboard.stripe.com/test/apikeys
- Prix à créer dans le dashboard : 50 €/mois (SINGLE), 400 €/mois (PACK_10)
- Env vars nécessaires (voir `.env.example`) : `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_SINGLE`, `STRIPE_PRICE_PACK_10`
- Test local : `stripe listen --forward-to localhost:3000/api/stripe/webhook`
