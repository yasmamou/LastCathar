# Last Cathar

**Explore treasures, myths and hidden stories across the world.**

An immersive 3D globe platform for discovering treasures, myths, legends, historical stories, hidden places, and architectural curiosities. Initial content focuses on the Cathar region of southern France.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Cesium Ion token and database URL

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the globe.

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_CESIUM_ION_TOKEN` | CesiumJS Ion access token ([get one free](https://ion.cesium.com/)) | Yes (for globe imagery) |
| `DATABASE_URL` | PostgreSQL connection string | For DB features |
| `OPENAI_API_KEY` | OpenAI API key | For agent system |

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Globe**: CesiumJS
- **Database**: PostgreSQL + Prisma
- **Validation**: Zod
- **UI**: Radix UI primitives, Lucide icons

## Architecture

```
src/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Homepage with globe
│   ├── admin/             # Admin panel
│   └── api/places/        # REST API for places
├── components/
│   ├── globe/             # CesiumJS globe component
│   ├── layout/            # Header, search, filters
│   └── panels/            # Detail panel
├── data/                  # Seed data (TypeScript)
├── lib/                   # Utilities
└── types/                 # TypeScript types

agents/                    # Multi-agent ingestion system
├── base-agent.ts          # Base agent class
├── discovery/             # Find candidate places
├── geolocation/           # Assign coordinates
├── classification/        # Categories, tags, scores
├── historian/             # Write narratives
├── sources/               # Collect and verify sources
├── qc/                    # Quality control
└── seeder/                # Import to database

schemas/                   # Zod validation schemas
scripts/                   # CLI scripts
data/                      # Pipeline data (raw → enriched → approved)
prisma/                    # Database schema
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run seed:export` | Export seed data to JSON |
| `npm run seed:cathar` | Run Cathar seed script |

## Data Model

Each place entry includes:
- **Identity**: title, slug, alternate names
- **Location**: lat/lng, region, country, precision level
- **Classification**: primary category, secondary categories, tags, era
- **Credibility**: confidence level (legendary → confirmed), evidence types, sources
- **Scores**: mystery, historical, architecture, tourism, local legend, travel interest
- **Content**: short description, full story, images
- **Moderation**: draft → review → approved/rejected

### Confidence Levels

| Level | Meaning |
|---|---|
| Legendary | Based on myth or oral tradition only |
| Speculative | Some indirect evidence, largely unproven |
| Plausible | Reasonable evidence but not confirmed |
| Documented | Supported by historical sources |
| Confirmed | Verified by archaeology or official records |

## Pages

- `/` — Main globe with markers, search, filters, and detail panel
- `/admin` — Internal admin to review and manage entries

## Agent System

The ingestion pipeline follows this flow:

```
Discovery → Geolocation → Classification → Historian → Sources → QC → Seeder
```

Each agent:
- Accepts structured JSON input
- Outputs validated JSON
- Can be run independently
- Follows strict data integrity rules

**Critical rules:**
- Never present legend as fact
- Always mark coordinate precision
- Never fabricate citations
- Preserve uncertainty when appropriate

## Next Steps

1. Get a [Cesium Ion token](https://ion.cesium.com/) (free tier available)
2. Set up PostgreSQL and run `npm run db:push`
3. Implement agent API integrations (OpenAI, Nominatim, Wikipedia)
4. Expand seed data beyond Cathar region
5. Add image assets from open sources (Wikimedia Commons)
6. Implement user contributions system
