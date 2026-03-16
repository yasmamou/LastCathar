import { CategoryPrimary, ConfidenceLevel, StatusBadge } from '@/types/places'

export function getCategoryColor(category: CategoryPrimary): string {
  const colors: Record<string, string> = {
    treasure: '#f5cb4a',
    myth: '#a78bfa',
    legend: '#c084fc',
    hidden_place: '#34d399',
    architecture: '#60a5fa',
    historical_event: '#f87171',
    relic: '#fbbf24',
    battlefield: '#ef4444',
    archaeological_site: '#fb923c',
    tourism_highlight: '#38bdf8',
    mystery: '#e879f9',
    oral_tradition: '#a3e635',
    religious_site: '#fcd34d',
    lost_object: '#facc15',
    route: '#2dd4bf',
    castle: '#94a3b8',
    cave: '#6ee7b7',
    mountain: '#86efac',
    ruin: '#9ca3af',
  }
  return colors[category] || '#f5cb4a'
}

export function getCategoryIcon(category: CategoryPrimary): string {
  const icons: Record<string, string> = {
    treasure: '\u2666',
    myth: '\u2727',
    legend: '\u2605',
    hidden_place: '\u25C8',
    architecture: '\u25B2',
    historical_event: '\u2694',
    relic: '\u2020',
    battlefield: '\u2694',
    archaeological_site: '\u2692',
    tourism_highlight: '\u2302',
    mystery: '\u2748',
    oral_tradition: '\u266A',
    religious_site: '\u2720',
    lost_object: '\u2BD1',
    route: '\u2192',
    castle: '\u265B',
    cave: '\u25E2',
    mountain: '\u25B2',
    ruin: '\u2588',
  }
  return icons[category] || '\u25CF'
}

export function getCategoryLabel(category: CategoryPrimary): string {
  const labels: Record<string, string> = {
    treasure: 'Treasure',
    myth: 'Myth',
    legend: 'Legend',
    hidden_place: 'Hidden Place',
    architecture: 'Architecture',
    historical_event: 'Historical Event',
    relic: 'Relic',
    battlefield: 'Battlefield',
    archaeological_site: 'Archaeological Site',
    tourism_highlight: 'Tourism',
    mystery: 'Mystery',
    oral_tradition: 'Oral Tradition',
    religious_site: 'Religious Site',
    lost_object: 'Lost Object',
    route: 'Route',
    castle: 'Castle',
    cave: 'Cave',
    mountain: 'Mountain',
    ruin: 'Ruin',
  }
  return labels[category] || category
}

export function getConfidenceColor(level: ConfidenceLevel): string {
  const colors: Record<ConfidenceLevel, string> = {
    legendary: '#e879f9',
    speculative: '#fbbf24',
    plausible: '#60a5fa',
    documented: '#34d399',
    confirmed: '#22c55e',
  }
  return colors[level]
}

export function getConfidenceLabel(level: ConfidenceLevel): string {
  const labels: Record<ConfidenceLevel, string> = {
    legendary: 'Legendary',
    speculative: 'Speculative',
    plausible: 'Plausible',
    documented: 'Documented',
    confirmed: 'Confirmed',
  }
  return labels[level]
}

export function getStatusBadgeLabel(badge: StatusBadge): string {
  const labels: Record<string, string> = {
    treasure_rumored: 'Treasure Rumored',
    treasure_suspected: 'Treasure Suspected',
    treasure_documented: 'Treasure Documented',
    treasure_discovered: 'Treasure Discovered',
    myth_local: 'Local Myth',
    legend_regional: 'Regional Legend',
    historical_site: 'Historical Site',
    architectural_curiosity: 'Architectural Curiosity',
    hidden_gem: 'Hidden Gem',
    pilgrimage_site: 'Pilgrimage Site',
    battlefield: 'Battlefield',
    relic_site: 'Relic Site',
  }
  return labels[badge] || badge
}

export const MAIN_CATEGORIES: CategoryPrimary[] = [
  'treasure', 'castle', 'mystery', 'legend', 'cave',
  'architecture', 'historical_event', 'hidden_place',
  'religious_site', 'ruin',
]

export const CONFIDENCE_LEVELS: ConfidenceLevel[] = [
  'legendary', 'speculative', 'plausible', 'documented', 'confirmed',
]
