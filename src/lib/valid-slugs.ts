import { allPlaces } from '@/data/all-places'

// Source-of-truth set of known place slugs, used server-side to reject analytics
// events with fabricated placeSlugs (which would otherwise inflate the metrics
// tables with junk rows).
export const VALID_PLACE_SLUGS: ReadonlySet<string> = new Set(
  allPlaces.map((p) => p.slug),
)
