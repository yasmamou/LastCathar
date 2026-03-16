import { BaseAgent } from '../base-agent'
import { CandidatePlace } from '../../schemas/place.schema'

interface GeolocatedCandidate extends CandidatePlace {
  latitude: number
  longitude: number
  locationPrecision: 'exact' | 'approximate' | 'region-level' | 'unknown'
  normalizedRegion: string
  normalizedCountry: string
  normalizedContinent: string
}

export class GeolocationAgent extends BaseAgent<CandidatePlace, GeolocatedCandidate> {
  constructor() {
    super({
      name: 'GeolocationAgent',
      description: 'Geolocates candidate places to coordinates',
      inputDir: 'data/raw',
      outputDir: 'data/raw',
    })
  }

  async process(input: CandidatePlace): Promise<GeolocatedCandidate> {
    // TODO: Implement geolocation via:
    // 1. Nominatim (OpenStreetMap) API
    // 2. Wikidata SPARQL queries
    // 3. Fallback to LLM-based inference for approximate locations

    throw new Error('GeolocationAgent.process() not yet implemented. Wire up Nominatim or similar.')
  }

  validate(output: GeolocatedCandidate): boolean {
    if (typeof output.latitude !== 'number' || typeof output.longitude !== 'number') return false
    if (output.latitude < -90 || output.latitude > 90) return false
    if (output.longitude < -180 || output.longitude > 180) return false
    return true
  }
}

export default GeolocationAgent
