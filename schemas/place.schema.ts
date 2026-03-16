import { z } from 'zod'

export const locationPrecisionEnum = z.enum(['exact', 'approximate', 'region-level', 'unknown'])
export const geometryTypeEnum = z.enum(['point', 'area', 'zone'])
export const confidenceLevelEnum = z.enum(['legendary', 'speculative', 'plausible', 'documented', 'confirmed'])
export const moderationStateEnum = z.enum(['draft', 'review', 'approved', 'rejected', 'archived'])

export const categoryPrimaryEnum = z.enum([
  'treasure', 'myth', 'legend', 'hidden_place', 'architecture',
  'historical_event', 'relic', 'battlefield', 'archaeological_site',
  'tourism_highlight', 'mystery', 'oral_tradition', 'religious_site',
  'lost_object', 'route', 'castle', 'cave', 'mountain', 'ruin',
])

export const statusBadgeEnum = z.enum([
  'treasure_rumored', 'treasure_suspected', 'treasure_documented',
  'treasure_discovered', 'myth_local', 'legend_regional',
  'historical_site', 'architectural_curiosity', 'hidden_gem',
  'pilgrimage_site', 'battlefield', 'relic_site',
])

export const CandidatePlaceSchema = z.object({
  title: z.string().min(1),
  alternateNames: z.array(z.string()).default([]),
  description: z.string().min(10),
  region: z.string().optional(),
  country: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  sourceUrl: z.string().url().optional(),
  suggestedCategory: categoryPrimaryEnum.optional(),
})

export const SourceRecordSchema = z.object({
  sourceType: z.enum(['wikipedia', 'archive', 'article', 'tourism', 'book_reference', 'user_submission', 'other']),
  title: z.string().optional(),
  url: z.string().url().optional(),
  publisher: z.string().optional(),
  datePublished: z.string().optional(),
  snippet: z.string().optional(),
  reliabilityScore: z.number().min(0).max(100).default(50),
  notes: z.string().optional(),
})

export const ImageRecordSchema = z.object({
  url: z.string().url(),
  licenseType: z.string().optional(),
  attributionText: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  isHero: z.boolean().default(false),
  sortOrder: z.number().default(0),
})

export const EnrichedPlaceSchema = z.object({
  title: z.string().min(1),
  alternateNames: z.array(z.string()).default([]),
  shortDescription: z.string().min(10),
  fullStory: z.string().min(50),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  region: z.string().nullable().default(null),
  country: z.string(),
  continent: z.string(),
  locationPrecision: locationPrecisionEnum,
  geometryType: geometryTypeEnum,
  categoryPrimary: categoryPrimaryEnum,
  categorySecondary: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  era: z.array(z.string()).default([]),
  statusBadge: statusBadgeEnum,
  confidenceLevel: confidenceLevelEnum,
  evidenceType: z.array(z.string()).default([]),
  sourceSummary: z.string().nullable().default(null),
  sourceLinks: z.array(z.string()).default([]),
  imageUrls: z.array(z.string()).default([]),
  heroImageUrl: z.string().nullable().default(null),
  thumbnailUrl: z.string().nullable().default(null),
  travelInterestScore: z.number().min(0).max(100).default(0),
  mysteryScore: z.number().min(0).max(100).default(0),
  historicalScore: z.number().min(0).max(100).default(0),
  architectureScore: z.number().min(0).max(100).default(0),
  tourismScore: z.number().min(0).max(100).default(0),
  localLegendScore: z.number().min(0).max(100).default(0),
  isFeatured: z.boolean().default(false),
  isVerified: z.boolean().default(false),
  moderationState: moderationStateEnum.default('review'),
  sources: z.array(SourceRecordSchema).default([]),
  images: z.array(ImageRecordSchema).default([]),
})

export const QCReportSchema = z.object({
  placeTitle: z.string(),
  passed: z.boolean(),
  issues: z.array(z.object({
    field: z.string(),
    severity: z.enum(['error', 'warning', 'info']),
    message: z.string(),
  })),
  score: z.number().min(0).max(100),
  recommendation: z.enum(['approve', 'review', 'reject']),
})

export type CandidatePlace = z.infer<typeof CandidatePlaceSchema>
export type EnrichedPlace = z.infer<typeof EnrichedPlaceSchema>
export type SourceRecord = z.infer<typeof SourceRecordSchema>
export type ImageRecord = z.infer<typeof ImageRecordSchema>
export type QCReport = z.infer<typeof QCReportSchema>
