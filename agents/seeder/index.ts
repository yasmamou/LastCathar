import { BaseAgent } from '../base-agent'
import { EnrichedPlace, EnrichedPlaceSchema } from '../../schemas/place.schema'

interface SeederOutput {
  slug: string
  title: string
  status: 'inserted' | 'skipped' | 'error'
  message?: string
}

export class SeederAgent extends BaseAgent<EnrichedPlace, SeederOutput> {
  constructor() {
    super({
      name: 'SeederAgent',
      description: 'Takes approved JSON and writes to database',
      inputDir: 'data/approved',
      outputDir: 'data/approved',
    })
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  async process(input: EnrichedPlace): Promise<SeederOutput> {
    const parseResult = EnrichedPlaceSchema.safeParse(input)
    if (!parseResult.success) {
      return {
        slug: this.generateSlug(input.title),
        title: input.title,
        status: 'error',
        message: `Validation failed: ${parseResult.error.message}`,
      }
    }

    const slug = this.generateSlug(input.title)

    // TODO: Wire up Prisma client to insert into database
    // const prisma = new PrismaClient()
    // await prisma.placeEntry.create({ data: { slug, ...input } })

    this.log(`Would insert: ${slug} - ${input.title}`)

    return {
      slug,
      title: input.title,
      status: 'inserted',
    }
  }

  validate(output: SeederOutput): boolean {
    return output.status !== 'error'
  }
}

export default SeederAgent
