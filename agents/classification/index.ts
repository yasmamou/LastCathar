import { BaseAgent } from '../base-agent'
import { CandidatePlace } from '../../schemas/place.schema'
import { CategoryPrimary, ConfidenceLevel, StatusBadge } from '../../src/types/places'

interface ClassifiedPlace extends CandidatePlace {
  categoryPrimary: CategoryPrimary
  categorySecondary: string[]
  tags: string[]
  era: string[]
  statusBadge: StatusBadge
  confidenceLevel: ConfidenceLevel
  evidenceType: string[]
  travelInterestScore: number
  mysteryScore: number
  historicalScore: number
  architectureScore: number
  tourismScore: number
  localLegendScore: number
}

export class ClassificationAgent extends BaseAgent<CandidatePlace, ClassifiedPlace> {
  constructor() {
    super({
      name: 'ClassificationAgent',
      description: 'Classifies places with categories, tags, scores, and confidence levels',
      inputDir: 'data/raw',
      outputDir: 'data/raw',
    })
  }

  async process(input: CandidatePlace): Promise<ClassifiedPlace> {
    // TODO: Implement via LLM classification
    // The LLM should:
    // 1. Analyze the description and context
    // 2. Assign primary and secondary categories
    // 3. Generate relevant tags
    // 4. Estimate scores (0-100) for each dimension
    // 5. Assign confidence level based on evidence
    // 6. Assign status badge

    throw new Error('ClassificationAgent.process() not yet implemented.')
  }

  validate(output: ClassifiedPlace): boolean {
    if (!output.categoryPrimary) return false
    if (!output.confidenceLevel) return false
    if (!output.statusBadge) return false
    return true
  }
}

export default ClassificationAgent
