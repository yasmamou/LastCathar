import { BaseAgent } from '../base-agent'

interface HistorianInput {
  title: string
  description: string
  region?: string
  keywords: string[]
  evidenceType: string[]
  confidenceLevel: string
}

interface HistorianOutput {
  title: string
  shortDescription: string
  fullStory: string
  separationNotes: {
    documentedFacts: string[]
    legendaryElements: string[]
    uncertainClaims: string[]
  }
}

export class HistorianAgent extends BaseAgent<HistorianInput, HistorianOutput> {
  constructor() {
    super({
      name: 'HistorianAgent',
      description: 'Writes balanced narratives separating legend from documented fact',
      inputDir: 'data/raw',
      outputDir: 'data/enriched',
    })
  }

  async process(input: HistorianInput): Promise<HistorianOutput> {
    // TODO: Implement via LLM with strict prompt:
    // 1. Write a compelling short description (1-2 sentences)
    // 2. Write a full story (2-4 paragraphs)
    // 3. Clearly separate what is documented from what is legend
    // 4. Never present legend as fact
    // 5. Use hedging language for uncertain claims
    // 6. Cite types of evidence available

    throw new Error('HistorianAgent.process() not yet implemented.')
  }

  validate(output: HistorianOutput): boolean {
    if (!output.shortDescription || output.shortDescription.length < 10) return false
    if (!output.fullStory || output.fullStory.length < 50) return false
    return true
  }
}

export default HistorianAgent
