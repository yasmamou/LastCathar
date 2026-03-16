import { BaseAgent } from '../base-agent'
import { EnrichedPlaceSchema, EnrichedPlace, QCReportSchema, QCReport } from '../../schemas/place.schema'

export class QCAgent extends BaseAgent<EnrichedPlace, QCReport> {
  constructor() {
    super({
      name: 'QCAgent',
      description: 'Quality control: validates entries, checks missing fields, flags weak entries',
      inputDir: 'data/enriched',
      outputDir: 'data/enriched',
    })
  }

  async process(input: EnrichedPlace): Promise<QCReport> {
    const issues: QCReport['issues'] = []
    let score = 100

    // Validate against schema
    const parseResult = EnrichedPlaceSchema.safeParse(input)
    if (!parseResult.success) {
      parseResult.error.issues.forEach((issue) => {
        issues.push({
          field: issue.path.join('.'),
          severity: 'error',
          message: issue.message,
        })
        score -= 20
      })
    }

    // Check content quality
    if (input.shortDescription.length < 20) {
      issues.push({ field: 'shortDescription', severity: 'warning', message: 'Description too short' })
      score -= 10
    }

    if (input.fullStory.length < 100) {
      issues.push({ field: 'fullStory', severity: 'warning', message: 'Story too short for good UX' })
      score -= 10
    }

    if (input.sources.length === 0) {
      issues.push({ field: 'sources', severity: 'warning', message: 'No sources provided' })
      score -= 15
    }

    if (input.tags.length === 0) {
      issues.push({ field: 'tags', severity: 'info', message: 'No tags assigned' })
      score -= 5
    }

    // Check coordinate sanity
    if (input.latitude === 0 && input.longitude === 0) {
      issues.push({ field: 'coordinates', severity: 'error', message: 'Coordinates at 0,0 - likely invalid' })
      score -= 30
    }

    // Check confidence vs evidence consistency
    if (input.confidenceLevel === 'confirmed' && input.evidenceType.length === 0) {
      issues.push({ field: 'confidenceLevel', severity: 'warning', message: 'Confirmed but no evidence types' })
      score -= 10
    }

    if (input.confidenceLevel === 'legendary' && input.evidenceType.includes('archaeological')) {
      issues.push({
        field: 'confidenceLevel',
        severity: 'info',
        message: 'Marked legendary but has archaeological evidence - consider upgrading',
      })
    }

    score = Math.max(0, Math.min(100, score))

    let recommendation: QCReport['recommendation'] = 'approve'
    if (score < 40) recommendation = 'reject'
    else if (score < 70) recommendation = 'review'

    return {
      placeTitle: input.title,
      passed: score >= 60,
      issues,
      score,
      recommendation,
    }
  }

  validate(output: QCReport): boolean {
    const result = QCReportSchema.safeParse(output)
    return result.success
  }
}

export default QCAgent
