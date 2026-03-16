import { BaseAgent } from '../base-agent'
import { SourceRecordSchema, SourceRecord } from '../../schemas/place.schema'

interface SourceInput {
  title: string
  description: string
  keywords: string[]
}

interface SourceOutput {
  title: string
  sourceSummary: string
  sources: SourceRecord[]
}

export class SourceAgent extends BaseAgent<SourceInput, SourceOutput> {
  constructor() {
    super({
      name: 'SourceAgent',
      description: 'Collects and summarizes sources, classifies evidence',
      inputDir: 'data/raw',
      outputDir: 'data/enriched',
    })
  }

  async process(input: SourceInput): Promise<SourceOutput> {
    // TODO: Implement via:
    // 1. Wikipedia API search
    // 2. Wikidata SPARQL
    // 3. Public archives and tourism APIs
    // 4. LLM to summarize and classify reliability

    throw new Error('SourceAgent.process() not yet implemented.')
  }

  validate(output: SourceOutput): boolean {
    if (!output.sourceSummary) return false
    for (const source of output.sources) {
      const result = SourceRecordSchema.safeParse(source)
      if (!result.success) return false
    }
    return true
  }
}

export default SourceAgent
