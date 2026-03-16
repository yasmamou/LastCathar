# Last Cathar -- Architecture Reference

> Version 0.1.0 | Last updated: March 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Diagram](#3-architecture-diagram)
4. [Folder Structure](#4-folder-structure)
5. [Data Model](#5-data-model)
6. [Frontend Architecture](#6-frontend-architecture)
7. [API](#7-api)
8. [Agent System](#8-agent-system)
9. [Zod Schemas](#9-zod-schemas)
10. [Content Strategy](#10-content-strategy)
11. [Design System](#11-design-system)
12. [Scripts and Commands](#12-scripts-and-commands)
13. [How to Add Content](#13-how-to-add-content)
14. [How to Extend Agents](#14-how-to-extend-agents)
15. [Environment Setup](#15-environment-setup)
16. [Next Steps / Roadmap](#16-next-steps--roadmap)

---

## 1. Project Overview

**Last Cathar** is a geospatial storytelling platform that maps treasures, myths, legends,
and hidden stories onto an immersive 3D globe. The project starts with the Cathar region of
southern France -- a landscape steeped in medieval heresy, lost treasures, ruined castles,
and centuries-old oral traditions -- and is designed to expand globally.

The core experience is cinematic: a dark, atmospheric globe rendered with CesiumJS, where
glowing markers invite the user to explore places that sit at the intersection of history,
legend, and mystery. Each place entry carries rich metadata -- confidence levels that
distinguish documented fact from pure legend, multi-dimensional scores (mystery, historical
significance, tourism value), source citations, and long-form narratives written to balance
scholarly rigor with storytelling.

### Vision

- **Phase 1 (current):** Cathar region seed with ~15-20 hand-curated entries, static data,
  cinematic globe UI, admin panel for reviewing entries.
- **Phase 2:** Activate the multi-agent pipeline to discover, classify, and enrich new
  places automatically via LLM and web APIs. Connect to PostgreSQL via Prisma.
- **Phase 3:** User contributions, community moderation, travel planning features,
  mobile-optimized experience, and expansion to other legendary regions worldwide.

---

## 2. Tech Stack

| Layer            | Technology           | Purpose                                                    |
|------------------|----------------------|------------------------------------------------------------|
| Framework        | Next.js 14.2         | App Router, SSR/SSG, API routes, file-based routing        |
| Language         | TypeScript 5         | End-to-end type safety across frontend, API, and agents    |
| 3D Globe         | CesiumJS 1.139       | WebGL-powered 3D globe with terrain, imagery, and entities |
| React Bindings   | Resium 1.19          | React component wrappers for CesiumJS (available but the project uses direct Cesium API for finer control) |
| Animation        | Framer Motion 12     | Intro sequence, panel transitions, UI reveals              |
| Styling          | Tailwind CSS 3.4     | Utility-first CSS with custom midnight/gold palette        |
| UI Primitives    | Radix UI             | Accessible dialog and scroll-area components               |
| Icons            | Lucide React         | Consistent icon set (Search, Compass, Shield, etc.)        |
| Validation       | Zod 4                | Runtime schema validation for place data and agent I/O     |
| ORM              | Prisma 7.5           | PostgreSQL schema, migrations, type-safe database client    |
| Database         | PostgreSQL           | Relational storage for place entries, sources, images       |
| Utility          | clsx + tailwind-merge| Conditional and merged class names                         |
| Build            | Webpack (via Next.js)| CesiumJS asset handling, source map suppression            |

### Why These Choices

- **CesiumJS over Mapbox/Deck.gl:** CesiumJS provides a true 3D globe (not a flat map projection),
  which creates the cinematic, planet-scale experience the project demands. It also has built-in
  support for terrain, satellite imagery, and entity-based markers with label rendering.
- **Next.js App Router:** Combines SSR for SEO with client-side interactivity. The globe is loaded
  via `next/dynamic` with SSR disabled, while API routes serve place data.
- **Zod for validation:** Shared between the frontend seed data, API responses, and the agent
  pipeline, ensuring a single source of truth for the PlaceEntry shape.
- **Prisma:** Type-safe database access that generates TypeScript types from the schema, reducing
  drift between the database and the application code.

---

## 3. Architecture Diagram

```
+------------------------------------------------------------------+
|                        BROWSER (Client)                          |
|                                                                  |
|  +------------------+  +----------------+  +------------------+  |
|  |   GlobeView      |  |  SearchBar     |  | CategoryFilters  |  |
|  |   (CesiumJS)     |  |  (text input)  |  | (chips)          |  |
|  |                   |  +----------------+  +------------------+  |
|  |  - 3D globe       |                                           |
|  |  - Entity markers  |  +----------------+  +------------------+  |
|  |  - Fly-to camera   |  | FeaturedStrip  |  | PlaceDetailPanel |  |
|  |  - Click handler   |  | (bottom cards) |  | (right slide-in) |  |
|  +------------------+  +----------------+  +------------------+  |
|                                                                  |
|  page.tsx (Home) -- state: selectedPlace, filters, searchQuery   |
+------------------------------------------------------------------+
          |                              |
          | (client-side filtering)      | (fetch)
          v                              v
+-------------------+        +------------------------+
|  seed-cathar.ts   |        |   Next.js API Routes   |
|  (static data)    |        |                        |
+-------------------+        |  GET /api/places       |
                             |  GET /api/places/search|
                             +------------------------+
                                        |
                                        | (future: Prisma)
                                        v
                             +------------------------+
                             |     PostgreSQL         |
                             |  (place_entries,       |
                             |   sources,             |
                             |   image_assets,        |
                             |   related_places)      |
                             +------------------------+

+------------------------------------------------------------------+
|                     AGENT PIPELINE (offline)                      |
|                                                                  |
|  Discovery --> Geolocation --> Classification --> Historian       |
|      |                                               |           |
|      v                                               v           |
|  CandidatePlace                                  EnrichedPlace   |
|                                                      |           |
|                     Sources -------------------------+           |
|                        |                             |           |
|                        v                             v           |
|                    QC Agent --> approve/reject --> Seeder         |
|                                                      |           |
|                                                      v           |
|                                                  Database        |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|                     SHARED SCHEMAS (Zod)                          |
|                                                                  |
|  CandidatePlaceSchema  |  EnrichedPlaceSchema  |  QCReportSchema |
|  SourceRecordSchema    |  ImageRecordSchema    |  Enums          |
+------------------------------------------------------------------+
```

---

## 4. Folder Structure

```
LastCathar/
|
|-- agents/                        # Multi-agent content pipeline
|   |-- base-agent.ts              # Abstract base class (read/write/validate/run)
|   |-- discovery/index.ts         # Discovers candidate places from web sources
|   |-- geolocation/index.ts       # Resolves coordinates via geocoding APIs
|   |-- classification/index.ts    # Assigns categories, tags, scores, confidence
|   |-- historian/index.ts         # Writes narratives separating fact from legend
|   |-- sources/index.ts           # Collects and classifies source citations
|   |-- qc/index.ts                # Quality control: validates, scores, recommends
|   |-- seeder/index.ts            # Writes approved entries to the database
|
|-- schemas/
|   |-- place.schema.ts            # Zod schemas: CandidatePlace, EnrichedPlace, QCReport, etc.
|
|-- prisma/
|   |-- schema.prisma              # Database schema (PlaceEntry, Source, ImageAsset, RelatedPlace)
|
|-- scripts/
|   |-- seed-cathar.ts             # Bootstrap script for initial Cathar seed data
|   |-- export-seed-json.ts        # Exports TypeScript seed data to JSON file
|
|-- src/
|   |-- app/
|   |   |-- page.tsx               # Main globe page (Home component)
|   |   |-- layout.tsx             # Root layout (metadata, Cesium CSS, fonts)
|   |   |-- globals.css            # Global styles: glass effects, vignette, Cesium overrides
|   |   |-- admin/page.tsx         # Admin panel for reviewing place entries
|   |   |-- api/
|   |       |-- places/
|   |           |-- route.ts       # GET /api/places (list, filter)
|   |           |-- search/
|   |               |-- route.ts   # GET /api/places/search (autocomplete)
|   |
|   |-- components/
|   |   |-- globe/
|   |   |   |-- GlobeView.tsx      # CesiumJS viewer, markers, camera, click handling
|   |   |-- layout/
|   |   |   |-- Header.tsx         # Top bar with logo and admin link
|   |   |   |-- SearchBar.tsx      # Glass-styled search input
|   |   |   |-- CategoryFilters.tsx# Category and confidence filter chips
|   |   |   |-- FeaturedStrip.tsx  # Bottom horizontal strip of featured places
|   |   |-- panels/
|   |       |-- PlaceDetailPanel.tsx# Right slide-in panel with full place details
|   |
|   |-- data/
|   |   |-- seed-cathar.ts         # Hand-curated Cathar region place entries (~15-20)
|   |
|   |-- lib/
|   |   |-- categories.ts          # Category/confidence colors, icons, labels
|   |   |-- cn.ts                  # clsx + tailwind-merge utility
|   |
|   |-- types/
|       |-- places.ts              # TypeScript types: PlaceEntry, PlaceMarker, enums
|
|-- tailwind.config.ts             # Custom colors (midnight, gold), fonts, animations
|-- next.config.mjs                # Webpack config for CesiumJS compatibility
|-- .env.example                   # Required environment variables template
|-- .env.local                     # Local environment variables (git-ignored)
|-- package.json                   # Dependencies and scripts
|-- tsconfig.json                  # TypeScript configuration
```

---

## 5. Data Model

### 5.1 PlaceEntry (Core Entity)

The central data model representing a single place on the globe.

| Field               | Type               | Description                                                          |
|---------------------|--------------------|----------------------------------------------------------------------|
| `id`                | `string` (cuid)    | Unique identifier                                                    |
| `slug`              | `string` (unique)  | URL-friendly identifier (e.g., `chateau-de-montsegur`)               |
| `title`             | `string`           | Display name                                                         |
| `alternateNames`    | `string[]`         | Other names the place is known by                                    |
| `shortDescription`  | `string`           | 1-2 sentence summary for cards and tooltips                          |
| `fullStory`         | `string` (text)    | Multi-paragraph narrative with historical and legendary context      |
| `latitude`          | `float`            | WGS84 latitude (-90 to 90)                                          |
| `longitude`         | `float`            | WGS84 longitude (-180 to 180)                                       |
| `region`            | `string?`          | Sub-national region (e.g., "Occitanie")                              |
| `country`           | `string`           | Country name                                                         |
| `continent`         | `string`           | Continent name                                                       |
| `locationPrecision` | `LocationPrecision` | How accurate the coordinates are                                    |
| `geometryType`      | `GeometryType`     | Whether the place is a point, area, or zone                          |
| `categoryPrimary`   | `CategoryPrimary`  | Main classification (treasure, castle, myth, etc.)                   |
| `categorySecondary` | `string[]`         | Additional classifications                                           |
| `tags`              | `string[]`         | Freeform tags for search and discovery                               |
| `era`               | `string[]`         | Historical periods (e.g., "medieval", "antiquite tardive")           |
| `statusBadge`       | `StatusBadge`      | Display badge (e.g., "Treasure Rumored", "Historical Site")          |
| `confidenceLevel`   | `ConfidenceLevel`  | How reliable the claims about this place are                         |
| `evidenceType`      | `string[]`         | Types of evidence (oral_tradition, archaeological, primary_source)   |
| `sourceSummary`     | `string?`          | Prose summary of available sources                                   |
| `sourceLinks`       | `string[]`         | URLs to source material                                              |
| `imageUrls`         | `string[]`         | Gallery image URLs                                                   |
| `heroImageUrl`      | `string?`          | Primary display image                                                |
| `thumbnailUrl`      | `string?`          | Small preview image                                                  |
| `travelInterestScore` | `int` (0-100)   | How interesting for travelers                                        |
| `mysteryScore`      | `int` (0-100)      | Degree of mystery and intrigue                                       |
| `historicalScore`   | `int` (0-100)      | Historical significance                                              |
| `architectureScore` | `int` (0-100)      | Architectural interest                                               |
| `tourismScore`      | `int` (0-100)      | Tourism infrastructure and accessibility                             |
| `localLegendScore`  | `int` (0-100)      | Strength of local oral traditions                                    |
| `isFeatured`        | `boolean`          | Whether the place appears in the featured strip                      |
| `isVerified`        | `boolean`          | Whether a human has verified the entry                               |
| `moderationState`   | `ModerationState`  | Content moderation workflow state                                    |

### 5.2 Source

Represents a single citation or reference linked to a PlaceEntry.

| Field             | Type         | Description                                       |
|-------------------|--------------|---------------------------------------------------|
| `id`              | `string`     | Unique identifier                                 |
| `placeEntryId`    | `string`     | Foreign key to PlaceEntry                         |
| `sourceType`      | `string`     | Type: wikipedia, archive, article, tourism, etc.  |
| `title`           | `string?`    | Title of the source document                      |
| `url`             | `string?`    | Link to the source                                |
| `publisher`       | `string?`    | Publishing entity                                 |
| `datePublished`   | `string?`    | Publication date                                  |
| `snippet`         | `string?`    | Relevant excerpt                                  |
| `reliabilityScore`| `int` (0-100)| Estimated reliability                             |
| `notes`           | `string?`    | Editorial notes                                   |

### 5.3 ImageAsset

Manages images with licensing metadata for proper attribution.

| Field             | Type       | Description                              |
|-------------------|------------|------------------------------------------|
| `id`              | `string`   | Unique identifier                        |
| `placeEntryId`    | `string`   | Foreign key to PlaceEntry                |
| `url`             | `string`   | Image URL                                |
| `licenseType`     | `string?`  | License (CC-BY, public domain, etc.)     |
| `attributionText` | `string?`  | Required attribution text                |
| `sourceUrl`       | `string?`  | Where the image was obtained             |
| `isHero`          | `boolean`  | Whether this is the primary image        |
| `sortOrder`       | `int`      | Display order in gallery                 |

### 5.4 RelatedPlace

A join table connecting two PlaceEntry records with an optional relationship label.

| Field          | Type      | Description                                  |
|----------------|-----------|----------------------------------------------|
| `id`           | `string`  | Unique identifier                            |
| `fromPlaceId`  | `string`  | Source place                                 |
| `toPlaceId`    | `string`  | Target place                                 |
| `relationship` | `string?` | Description (e.g., "part of same siege")     |

### 5.5 Enums

**ConfidenceLevel** -- How reliable are the claims about this place?

| Value          | Meaning                                                              |
|----------------|----------------------------------------------------------------------|
| `LEGENDARY`    | Pure legend or myth with no physical evidence                        |
| `SPECULATIVE`  | Some circumstantial evidence but largely conjectural                 |
| `PLAUSIBLE`    | Reasonable historical basis, not fully confirmed                     |
| `DOCUMENTED`   | Supported by primary or secondary historical sources                 |
| `CONFIRMED`    | Archaeologically or historically verified                            |

**LocationPrecision** -- How accurate are the coordinates?

| Value          | Meaning                                                              |
|----------------|----------------------------------------------------------------------|
| `EXACT`        | Precise GPS-level coordinates                                        |
| `APPROXIMATE`  | Within a few kilometers                                              |
| `REGION_LEVEL` | Only the general region is known                                     |
| `UNKNOWN`      | Location is uncertain or debated                                     |

**GeometryType** -- Spatial extent of the place.

| Value   | Meaning                                       |
|---------|-----------------------------------------------|
| `POINT` | A single building, monument, or precise spot  |
| `AREA`  | A mountain, forest, or defined area           |
| `ZONE`  | A broad region or route                       |

**ModerationState** -- Content lifecycle.

| Value      | Meaning                              |
|------------|--------------------------------------|
| `DRAFT`    | Work in progress                     |
| `REVIEW`   | Awaiting human review                |
| `APPROVED` | Published and visible                |
| `REJECTED` | Failed quality review                |
| `ARCHIVED` | Removed from active display          |

---

## 6. Frontend Architecture

### 6.1 Page Structure

The application has two pages:

- **`/` (Home):** The main globe experience. Full-screen, no scroll. All UI elements are
  absolutely positioned overlays on top of the CesiumJS canvas.
- **`/admin`:** A split-pane admin panel for reviewing place entries. List on the left,
  detail on the right, with moderation state filters.

### 6.2 Component Hierarchy

```
Home (page.tsx)
|-- GlobeView (globe/GlobeView.tsx)          -- CesiumJS 3D globe
|-- Header (layout/Header.tsx)               -- Logo + admin link
|-- SearchBar (layout/SearchBar.tsx)          -- Full-text search input
|-- CategoryFilters (layout/CategoryFilters.tsx) -- Category + confidence chips
|-- FeaturedStrip (layout/FeaturedStrip.tsx)  -- Bottom horizontal card strip
|-- PlaceDetailPanel (panels/PlaceDetailPanel.tsx) -- Right slide-in detail view
```

### 6.3 State Management

State is managed entirely via React `useState` in the Home component. No external state
library is used. The state model is:

| State             | Type                      | Purpose                                |
|-------------------|---------------------------|----------------------------------------|
| `selectedPlace`   | `PlaceEntry \| null`      | Currently selected place (opens panel) |
| `activeCategory`  | `CategoryPrimary \| null` | Active category filter                 |
| `activeConfidence`| `ConfidenceLevel \| null` | Active confidence filter               |
| `searchQuery`     | `string`                  | Current search text                    |
| `showIntro`       | `boolean`                 | Whether the intro animation is playing |
| `uiVisible`       | `boolean`                 | Whether UI overlays have appeared      |

Filtering is performed client-side on the static seed data array. The filtered places
array is passed down to `GlobeView`, which re-renders markers accordingly.

### 6.4 Globe (CesiumJS Integration)

The globe is implemented in `GlobeView.tsx` using the CesiumJS library directly (not the
Resium React wrappers, for finer control over the viewer lifecycle).

**Key implementation details:**

- **Dynamic import:** The component is loaded via `next/dynamic` with `ssr: false` because
  CesiumJS requires browser APIs (WebGL, DOM) and cannot run server-side.
- **Viewer configuration:** All default Cesium UI widgets (toolbar, timeline, animation,
  geocoder, etc.) are disabled. The viewer runs in `scene3DOnly` mode with no sky box.
- **Imagery:** Falls back to NaturalEarthII textures bundled with CesiumJS. If a Cesium Ion
  token is provided, it upgrades to Bing Maps satellite imagery (asset 3845) with reduced
  brightness and saturation for the dark cinematic aesthetic.
- **Globe styling:** Background color `#05060d`, globe base color `#0a0c1a`, lighting
  enabled, atmosphere shifted toward dark blue/purple, imagery brightness at 0.35.
- **Markers:** Each place is rendered as a `point` entity with a `label`. Point size and
  outline differ for featured vs. regular places. Labels use the Inter font and include
  the category icon character. Labels auto-hide beyond 400km distance and scale with
  camera distance via `NearFarScalar`.
- **Interaction:** A `ScreenSpaceEventHandler` listens for left clicks. When an entity is
  picked, its `_placeData` property (attached during creation) is passed to the
  `onPlaceSelect` callback.
- **Camera:** Initial view centers on the Cathar region (lon 2.4, lat 43.0, altitude 2000km).
  When a place is selected, the camera flies to it at 60km altitude over 2 seconds.

### 6.5 Intro Animation System

The application opens with a cinematic intro sequence orchestrated by Framer Motion:

1. **0-1.5s:** Title "Last Cathar" fades in with expanding letter-spacing.
2. **1.2s:** Subtitle "Treasures . Myths . Hidden Stories" appears.
3. **1.8s:** A golden horizontal line scales in below the subtitle.
4. **3.5s:** The entire intro overlay fades out (1.5s duration).
5. **4.0s:** UI elements (header, search bar, filters, featured strip) begin appearing
   with staggered delays (0.2s, 0.5s, 0.8s, 1.0s).

The vignette overlay (a CSS radial gradient) persists permanently, darkening the globe
edges for a cinematic frame effect.

### 6.6 Detail Panel

`PlaceDetailPanel` slides in from the right (400px spring animation) and displays:

- Hero section with category-tinted gradient background
- Status badge, title, and alternate names
- Meta chips: category (with icon), confidence (with shield icon), location, era
- Short description
- Full story narrative
- Score bars (animated Framer Motion bars for all six dimensions)
- Source summary with clickable source links
- Tags as rounded pill elements
- GPS coordinates with precision indicator

---

## 7. API

The application exposes two API routes via Next.js App Router, both currently backed
by the static seed data array.

### GET /api/places

Lists all places with optional filtering.

**Query Parameters:**

| Parameter    | Type     | Description                              |
|--------------|----------|------------------------------------------|
| `category`   | `string` | Filter by `categoryPrimary`              |
| `confidence` | `string` | Filter by `confidenceLevel`              |
| `q`          | `string` | Full-text search (title, tags, description) |
| `featured`   | `"true"` | Return only featured places              |

**Response:**

```json
{
  "places": [ ... ],
  "total": 15
}
```

### GET /api/places/search

Lightweight autocomplete endpoint. Returns a maximum of 10 results.

**Query Parameters:**

| Parameter | Type     | Description                                  |
|-----------|----------|----------------------------------------------|
| `q`       | `string` | Search query (minimum 2 characters required) |

**Response:**

```json
{
  "results": [
    {
      "id": "2",
      "slug": "chateau-de-montsegur",
      "title": "Chateau de Montsegur",
      "categoryPrimary": "castle",
      "confidenceLevel": "documented",
      "region": "Occitanie",
      "country": "France"
    }
  ]
}
```

Both endpoints will be migrated to Prisma database queries in Phase 2.

---

## 8. Agent System

The agent system is an offline content pipeline designed to discover, enrich, and validate
place entries before they enter the database. Each agent is a TypeScript class that extends
`BaseAgent<TInput, TOutput>`.

### 8.1 Base Agent Pattern

```
agents/base-agent.ts
```

`BaseAgent` provides:

- **Directory management:** Automatically creates `inputDir` and `outputDir` on
  construction.
- **File I/O:** `readInput(filename)` reads JSON from the input directory;
  `writeOutput(filename, data)` writes JSON to the output directory.
- **Run loop:** `run(inputFile, outputFile)` reads all entries, calls `process()` on each,
  validates with `validate()`, skips failures, and writes successful outputs.
- **Logging:** `log(message)` prefixed with the agent name.

Subclasses must implement:

```typescript
abstract process(input: TInput): Promise<TOutput>
abstract validate(output: TOutput): boolean
```

### 8.2 Pipeline Stages

The agents form a sequential pipeline. Each agent reads from the previous stage's output
directory and writes to the next stage's input directory.

```
Discovery --> Geolocation --> Classification --> Historian --> Sources --> QC --> Seeder
```

#### Stage 1: DiscoveryAgent

- **Input:** `{ theme, region, keywords, existingSlugs }`
- **Output:** `CandidatePlace`
- **Purpose:** Searches the web for places matching a given theme and region. Deduplicates
  against existing slugs. Currently a scaffold (TODO: wire up a search API).
- **Directories:** `data/raw` -> `data/raw`

#### Stage 2: GeolocationAgent

- **Input:** `CandidatePlace`
- **Output:** `GeolocatedCandidate` (CandidatePlace + lat/lon/precision/region/country/continent)
- **Purpose:** Resolves text descriptions to geographic coordinates. Planned to use
  Nominatim (OpenStreetMap), Wikidata SPARQL, and LLM fallback for approximate locations.
- **Validation:** Ensures latitude is -90..90, longitude is -180..180, and coordinates are
  not at 0,0.
- **Directories:** `data/raw` -> `data/raw`

#### Stage 3: ClassificationAgent

- **Input:** `CandidatePlace`
- **Output:** `ClassifiedPlace` (adds category, tags, scores, confidence, evidence types)
- **Purpose:** Uses LLM to analyze the description and assign:
  - Primary and secondary categories from the 19-value `CategoryPrimary` enum
  - Tags for search and discovery
  - Six dimension scores (0-100): mystery, historical, architecture, tourism, local legend,
    travel interest
  - Confidence level and status badge
- **Directories:** `data/raw` -> `data/raw`

#### Stage 4: HistorianAgent

- **Input:** `{ title, description, region, keywords, evidenceType, confidenceLevel }`
- **Output:** `{ title, shortDescription, fullStory, separationNotes }`
- **Purpose:** Generates balanced narratives that clearly separate documented fact from
  legend. The `separationNotes` field tracks which claims are documented, legendary, or
  uncertain. Uses hedging language for unverified claims.
- **Directories:** `data/raw` -> `data/enriched`

#### Stage 5: SourceAgent

- **Input:** `{ title, description, keywords }`
- **Output:** `{ title, sourceSummary, sources: SourceRecord[] }`
- **Purpose:** Collects citations from Wikipedia, Wikidata, archives, and tourism APIs.
  Classifies each source's reliability on a 0-100 scale. Produces a prose summary.
- **Directories:** `data/raw` -> `data/enriched`

#### Stage 6: QCAgent (Implemented)

- **Input:** `EnrichedPlace`
- **Output:** `QCReport`
- **Purpose:** The only fully implemented agent. Performs quality control by:
  - Validating against `EnrichedPlaceSchema` (Zod)
  - Checking content quality (description length, story length)
  - Verifying source presence
  - Checking coordinate sanity (not at 0,0)
  - Cross-checking confidence vs. evidence consistency
  - Computing a score (0-100) and recommendation (approve/review/reject)
- **Scoring:** Starts at 100, deducts points per issue. Score < 40 = reject,
  40-69 = review, 70+ = approve.
- **Directories:** `data/enriched` -> `data/enriched`

#### Stage 7: SeederAgent

- **Input:** `EnrichedPlace`
- **Output:** `{ slug, title, status, message? }`
- **Purpose:** Takes approved entries and writes them to the database. Generates slugs
  from titles (normalized, lowercased, diacritics removed). Currently logs intended
  inserts (TODO: wire up Prisma client).
- **Directories:** `data/approved` -> `data/approved`

### 8.3 Data Flow Directories

```
data/
|-- raw/           # Discovery, Geolocation, Classification output
|-- enriched/      # Historian, Sources, QC output
|-- approved/      # QC-approved entries ready for seeding
```

---

## 9. Zod Schemas

All schemas are defined in `schemas/place.schema.ts` and serve as the single source of
truth for data shapes across the entire system.

### CandidatePlaceSchema

The minimal shape for a newly discovered place before enrichment.

```typescript
{
  title: string           // Required, min 1 char
  alternateNames: string[] // Default: []
  description: string     // Required, min 10 chars
  region?: string
  country?: string
  keywords: string[]      // Default: []
  sourceUrl?: string      // Valid URL
  suggestedCategory?: CategoryPrimary
}
```

### EnrichedPlaceSchema

The complete shape for a fully enriched place entry, mirroring the Prisma model.
Includes all fields from `PlaceEntry` plus nested `sources` and `images` arrays.
All scores default to 0, `moderationState` defaults to `"review"`.

### SourceRecordSchema

```typescript
{
  sourceType: 'wikipedia' | 'archive' | 'article' | 'tourism' | 'book_reference' | 'user_submission' | 'other'
  title?: string
  url?: string            // Valid URL
  publisher?: string
  datePublished?: string
  snippet?: string
  reliabilityScore: number // 0-100, default 50
  notes?: string
}
```

### ImageRecordSchema

```typescript
{
  url: string             // Valid URL, required
  licenseType?: string
  attributionText?: string
  sourceUrl?: string      // Valid URL
  isHero: boolean         // Default: false
  sortOrder: number       // Default: 0
}
```

### QCReportSchema

```typescript
{
  placeTitle: string
  passed: boolean
  issues: Array<{
    field: string
    severity: 'error' | 'warning' | 'info'
    message: string
  }>
  score: number           // 0-100
  recommendation: 'approve' | 'review' | 'reject'
}
```

---

## 10. Content Strategy

### 10.1 Initial Seed: Cathar Region

The first content set focuses on the Cathar region of southern France (Occitanie),
covering approximately 15-20 entries including:

- **Castles:** Montsegur, Carcassonne, Queribus, Peyrepertuse, Puivert, Lastours
- **Treasures:** Montagne d'Alaric (Visigothic treasure), Rennes-le-Chateau (Sauniere
  mystery), the Cathar treasure of Montsegur
- **Caves:** Grotte de Lombrives, Grotte du Mas-d'Azil
- **Religious sites:** Abbaye de Fontfroide, Prieure de Serrabona
- **Routes:** Sentier Cathare (hiking trail)
- **Legends:** Regional myths and oral traditions

All seed entries are hand-curated in `src/data/seed-cathar.ts` with detailed narratives,
accurate coordinates, and multi-dimensional scores.

### 10.2 Confidence Levels in Practice

The confidence system is central to the editorial integrity of the project:

- **Legendary** (e.g., Alaric's treasure): No physical evidence. Based entirely on oral
  tradition and folklore. Score emphasis on `mysteryScore` and `localLegendScore`.
- **Speculative** (e.g., Rennes-le-Chateau treasure): Some circumstantial evidence exists
  but interpretations are contested. Mixed evidence types.
- **Plausible** (e.g., Cathar treasure escape route): Reasonable historical basis supported
  by secondary sources, but not directly confirmed.
- **Documented** (e.g., Siege of Montsegur): Attested by primary medieval sources and
  historical scholarship. The factual events are confirmed even if associated legends
  remain unverified.
- **Confirmed** (e.g., Cite de Carcassonne): Fully verified archaeological/historical site
  with extensive documentation. High `historicalScore` and `tourismScore`.

### 10.3 Expansion Plan

Future content expansions (via the agent pipeline):

1. Greater Occitanie and Pyrenees region
2. Templar sites across France
3. European medieval legends (Grail cycle, Nibelungen, etc.)
4. Mediterranean lost cities and trade routes
5. Global legendary sites (El Dorado, Shambhala, Atlantis candidates, etc.)

---

## 11. Design System

### 11.1 Color Palette

The design uses a dark cinematic palette with gold accents.

**Midnight (backgrounds):**

| Token          | Hex       | Usage                        |
|----------------|-----------|------------------------------|
| `midnight-950` | `#05060d` | Page background, globe bg    |
| `midnight-900` | `#0a0c1a` | Globe base color             |
| `midnight-800` | `#131533` | Card backgrounds             |

**Gold (accents):**

| Token      | Hex       | Usage                           |
|------------|-----------|----------------------------------|
| `gold-300` | `#f5cb4a` | Primary accent, treasure markers |
| `gold-400` | `#f2ba1e` | Text accents, scrollbar          |
| `gold-600` | `#c97807` | Gradient endpoints               |

**Category colors:** Each of the 19 categories has a unique color. Key examples:

| Category          | Color     |
|-------------------|-----------|
| Treasure          | `#f5cb4a` |
| Mystery           | `#e879f9` |
| Castle            | `#94a3b8` |
| Historical Event  | `#f87171` |
| Hidden Place      | `#34d399` |
| Legend             | `#c084fc` |

**Confidence colors:**

| Level       | Color     |
|-------------|-----------|
| Legendary   | `#e879f9` |
| Speculative | `#fbbf24` |
| Plausible   | `#60a5fa` |
| Documented  | `#34d399` |
| Confirmed   | `#22c55e` |

### 11.2 Typography

| Role      | Font              | Weight    | Usage                          |
|-----------|-------------------|-----------|--------------------------------|
| Display   | Playfair Display  | 400-700   | Titles, headings, logo         |
| Body      | Inter             | 300-700   | All body text, labels, UI      |

Both fonts are loaded from Google Fonts in `globals.css`.

### 11.3 Glass Effects

Two levels of glassmorphism defined in `globals.css`:

- **`.glass`:** `rgba(10,12,26,0.75)` background with 20px blur and a faint gold border
  (`rgba(226,182,80,0.08)`). Used for the detail panel and search bar.
- **`.glass-light`:** `rgba(10,12,26,0.55)` background with 12px blur and a fainter gold
  border. Used for filter chips and featured cards.

### 11.4 Visual Effects

- **Vignette:** A permanent CSS radial gradient overlay that darkens the globe edges,
  creating a cinematic frame. Transparent at center, 40% opacity at 80% radius, 70% at
  edges.
- **Glow effects:** `.glow-gold` applies a subtle gold box-shadow for emphasis. `.glow-dot`
  uses `currentColor` for marker glow.
- **Animations:** Fade-in (1.2s and 2s variants), slide-up (0.6s), glow-pulse (3s infinite).
- **Scrollbar:** Custom 4px wide scrollbar with gold thumb (`rgba(226,182,80,0.3)`).

---

## 12. Scripts and Commands

| Command            | Description                                                    |
|--------------------|----------------------------------------------------------------|
| `npm run dev`      | Start the Next.js development server with hot reload           |
| `npm run build`    | Build the production bundle                                    |
| `npm run start`    | Start the production server                                    |
| `npm run lint`     | Run ESLint on the codebase                                     |
| `npm run db:generate` | Generate the Prisma client from `prisma/schema.prisma`      |
| `npm run db:push`  | Push the Prisma schema to the database (sync without migration)|
| `npm run db:studio`| Open Prisma Studio (visual database browser) on localhost      |
| `npm run seed:export` | Export TypeScript seed data to `data/approved/cathar-places.json` |
| `npm run seed:cathar`| Run the Cathar seed bootstrap script                          |

---

## 13. How to Add Content

### Adding a Place Manually

1. **Open the seed file:**

   ```
   src/data/seed-cathar.ts
   ```

2. **Add a new entry** to the `seedCatharPlaces` array. Use an existing entry as a
   template. Required fields:

   ```typescript
   {
     id: '99',                              // Unique string ID
     slug: 'your-place-slug',               // URL-safe, lowercase, no accents
     title: 'Your Place Name',
     alternateNames: [],
     shortDescription: 'A brief 1-2 sentence summary.',
     fullStory: 'Multi-paragraph narrative...',
     latitude: 43.0,                        // WGS84
     longitude: 2.0,                        // WGS84
     region: 'Occitanie',                   // or null
     country: 'France',
     continent: 'Europe',
     locationPrecision: 'exact',            // exact | approximate | region-level | unknown
     geometryType: 'point',                 // point | area | zone
     categoryPrimary: 'castle',             // one of 19 CategoryPrimary values
     categorySecondary: ['legend'],
     tags: ['keyword1', 'keyword2'],
     era: ['medieval'],
     statusBadge: 'historical_site',        // one of 12 StatusBadge values
     confidenceLevel: 'documented',         // legendary | speculative | plausible | documented | confirmed
     evidenceType: ['secondary_source'],
     sourceSummary: 'Description of sources.',
     sourceLinks: ['https://example.com'],
     imageUrls: [],
     heroImageUrl: null,
     thumbnailUrl: null,
     travelInterestScore: 70,               // 0-100
     mysteryScore: 50,
     historicalScore: 80,
     architectureScore: 60,
     tourismScore: 75,
     localLegendScore: 40,
     isFeatured: false,
     isVerified: false,
     moderationState: 'approved',
   }
   ```

3. **Set `isFeatured: true`** if the place should appear in the bottom featured strip.

4. **Run the dev server** to see the new marker appear on the globe:

   ```bash
   npm run dev
   ```

5. **Export to JSON** (optional, for database seeding later):

   ```bash
   npm run seed:export
   ```

### Score Guidelines

| Score       | 0-20        | 21-50          | 51-80       | 81-100         |
|-------------|-------------|----------------|-------------|----------------|
| Mystery     | Well-known  | Some unknowns  | Enigmatic   | Deep mystery   |
| Historical  | No record   | Minor mention  | Significant | Major event    |
| Architecture| No structure| Ruins/traces   | Partial     | Well-preserved |
| Tourism     | Inaccessible| Unmarked       | Signposted  | Major attraction|
| Local Legend | No stories | Minor tales    | Rich oral   | Iconic legend  |
| Travel      | Remote      | Reachable      | Worthwhile  | Must-visit     |

---

## 14. How to Extend Agents

All agents except QCAgent are scaffolds with `TODO` placeholders. Here is how to
implement them.

### General Pattern

1. **Open the agent file** (e.g., `agents/discovery/index.ts`).

2. **Implement the `process()` method.** This is where the actual logic goes. The method
   receives a single input item and must return a single output item.

3. **Implement external API calls** as needed:
   - Discovery: Web search API (SerpAPI, Brave Search, or similar)
   - Geolocation: Nominatim API (`https://nominatim.openstreetmap.org/search`)
   - Classification/Historian: OpenAI API or Anthropic API
   - Sources: Wikipedia API, Wikidata SPARQL endpoint

4. **Run the agent:**

   ```typescript
   import { DiscoveryAgent } from './agents/discovery'

   const agent = new DiscoveryAgent()
   await agent.run('input.json', 'output.json')
   ```

### Example: Implementing the HistorianAgent

```typescript
async process(input: HistorianInput): Promise<HistorianOutput> {
  const prompt = `
    You are a historian writing about ${input.title}.
    Region: ${input.region || 'unknown'}
    Evidence types: ${input.evidenceType.join(', ')}
    Confidence: ${input.confidenceLevel}

    Write:
    1. A short description (1-2 sentences)
    2. A full story (2-4 paragraphs)
    3. Clearly separate documented facts from legends

    Description: "${input.description}"
  `

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content)

  return {
    title: input.title,
    shortDescription: result.shortDescription,
    fullStory: result.fullStory,
    separationNotes: {
      documentedFacts: result.documentedFacts || [],
      legendaryElements: result.legendaryElements || [],
      uncertainClaims: result.uncertainClaims || [],
    },
  }
}
```

### Wiring Up the Full Pipeline

To run all agents in sequence:

```typescript
import { DiscoveryAgent } from './agents/discovery'
import { GeolocationAgent } from './agents/geolocation'
import { ClassificationAgent } from './agents/classification'
import { HistorianAgent } from './agents/historian'
import { SourceAgent } from './agents/sources'
import { QCAgent } from './agents/qc'
import { SeederAgent } from './agents/seeder'

async function runPipeline() {
  await new DiscoveryAgent().run('themes.json', 'candidates.json')
  await new GeolocationAgent().run('candidates.json', 'geolocated.json')
  await new ClassificationAgent().run('geolocated.json', 'classified.json')
  await new HistorianAgent().run('classified.json', 'narrated.json')
  await new SourceAgent().run('classified.json', 'sourced.json')
  // Merge narrated + sourced into enriched, then:
  await new QCAgent().run('enriched.json', 'qc-reports.json')
  await new SeederAgent().run('enriched.json', 'seed-results.json')
}
```

---

## 15. Environment Setup

### 15.1 Required Environment Variables

Create a `.env.local` file at the project root (use `.env.example` as a template):

```env
# CesiumJS Ion Token
# Get a free token at https://ion.cesium.com/
# Required for high-resolution satellite imagery (Bing Maps)
# Without it, the globe falls back to NaturalEarthII textures
NEXT_PUBLIC_CESIUM_ION_TOKEN=your_cesium_ion_token_here

# PostgreSQL connection string
# Required for database features (Phase 2)
DATABASE_URL="postgresql://user:password@localhost:5432/lastcathar?schema=public"

# OpenAI API Key
# Required for agent pipeline (Phase 2)
OPENAI_API_KEY=your_openai_api_key_here
```

### 15.2 Cesium Token

1. Create a free account at [https://ion.cesium.com/](https://ion.cesium.com/).
2. Navigate to Access Tokens and create a new token.
3. Set it as `NEXT_PUBLIC_CESIUM_ION_TOKEN` in `.env.local`.
4. Without a token, the globe uses built-in NaturalEarthII imagery (lower resolution but
   functional).

### 15.3 PostgreSQL Setup

1. Install PostgreSQL 15+ locally or use a managed service (Supabase, Neon, Railway).
2. Create a database named `lastcathar`.
3. Set the `DATABASE_URL` in `.env.local`.
4. Generate the Prisma client and push the schema:

   ```bash
   npm run db:generate
   npm run db:push
   ```

5. Optionally open Prisma Studio to inspect the database:

   ```bash
   npm run db:studio
   ```

### 15.4 Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Open in browser
open http://localhost:3000
```

---

## 16. Next Steps / Roadmap

### Phase 2: Agent Pipeline Activation

- [ ] Implement DiscoveryAgent with a web search API (SerpAPI, Brave Search, or Tavily)
- [ ] Implement GeolocationAgent with Nominatim and Wikidata SPARQL
- [ ] Implement ClassificationAgent with LLM-based analysis (GPT-4o or Claude)
- [ ] Implement HistorianAgent with structured LLM prompts and fact/legend separation
- [ ] Implement SourceAgent with Wikipedia and Wikidata API integration
- [ ] Wire SeederAgent to Prisma for database writes
- [ ] Migrate API routes from static seed data to Prisma queries
- [ ] Add image discovery and attribution pipeline
- [ ] Build a CLI runner for the full pipeline

### Phase 3: User Experience

- [ ] Place detail pages with full-page layouts and image galleries
- [ ] User authentication and place submissions
- [ ] Community moderation workflow in the admin panel
- [ ] Related places graph visualization
- [ ] Travel planning features (itinerary builder, nearby places)
- [ ] Mobile-responsive globe experience
- [ ] Offline caching with service workers
- [ ] SEO optimization with SSG for place pages

### Phase 4: Scale and Polish

- [ ] Full-text search with PostgreSQL `tsvector` or Typesense
- [ ] Multi-language support (French, English, Spanish, Occitan)
- [ ] 3D terrain visualization for mountain and cave sites
- [ ] Custom Cesium imagery layers (historical maps overlay)
- [ ] Performance optimization: marker clustering at high zoom levels
- [ ] Analytics and engagement tracking
- [ ] API rate limiting and caching layer
- [ ] Contribution leaderboards and reputation system

---

*This document is the canonical reference for the Last Cathar project architecture.
Update it as the project evolves.*
