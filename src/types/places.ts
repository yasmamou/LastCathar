export type LocationPrecision = 'exact' | 'approximate' | 'region-level' | 'unknown'
export type GeometryType = 'point' | 'area' | 'zone'
export type ConfidenceLevel = 'legendary' | 'speculative' | 'plausible' | 'documented' | 'confirmed'
export type ModerationState = 'draft' | 'review' | 'approved' | 'rejected' | 'archived'

export type CategoryPrimary =
  | 'treasure' | 'myth' | 'legend' | 'hidden_place' | 'architecture'
  | 'historical_event' | 'relic' | 'battlefield' | 'archaeological_site'
  | 'tourism_highlight' | 'mystery' | 'oral_tradition' | 'religious_site'
  | 'lost_object' | 'route' | 'castle' | 'cave' | 'mountain' | 'ruin'

export type StatusBadge =
  | 'treasure_rumored' | 'treasure_suspected' | 'treasure_documented'
  | 'treasure_discovered' | 'myth_local' | 'legend_regional'
  | 'historical_site' | 'architectural_curiosity' | 'hidden_gem'
  | 'pilgrimage_site' | 'battlefield' | 'relic_site'

export interface PlaceEntry {
  id: string
  slug: string
  title: string
  alternateNames: string[]
  shortDescription: string
  fullStory: string
  latitude: number
  longitude: number
  region: string | null
  country: string
  continent: string
  locationPrecision: LocationPrecision
  geometryType: GeometryType
  categoryPrimary: CategoryPrimary
  categorySecondary: string[]
  tags: string[]
  era: string[]
  statusBadge: StatusBadge
  confidenceLevel: ConfidenceLevel
  evidenceType: string[]
  sourceSummary: string | null
  sourceLinks: string[]
  imageUrls: string[]
  heroImageUrl: string | null
  thumbnailUrl: string | null
  travelInterestScore: number
  mysteryScore: number
  historicalScore: number
  architectureScore: number
  tourismScore: number
  localLegendScore: number
  isFeatured: boolean
  isVerified: boolean
  moderationState: ModerationState
}

export interface PlaceMarker {
  id: string
  slug: string
  title: string
  latitude: number
  longitude: number
  categoryPrimary: CategoryPrimary
  confidenceLevel: ConfidenceLevel
  statusBadge: StatusBadge
  isFeatured: boolean
  mysteryScore: number
}
