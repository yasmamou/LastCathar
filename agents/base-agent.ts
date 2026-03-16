import { z } from 'zod'
import * as fs from 'fs'
import * as path from 'path'

export interface AgentConfig {
  name: string
  description: string
  inputDir: string
  outputDir: string
}

export abstract class BaseAgent<TInput, TOutput> {
  protected config: AgentConfig

  constructor(config: AgentConfig) {
    this.config = config
    this.ensureDirs()
  }

  private ensureDirs() {
    ;[this.config.inputDir, this.config.outputDir].forEach((dir) => {
      const fullPath = path.resolve(dir)
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true })
      }
    })
  }

  abstract process(input: TInput): Promise<TOutput>
  abstract validate(output: TOutput): boolean

  protected readInput(filename: string): TInput[] {
    const filepath = path.resolve(this.config.inputDir, filename)
    const raw = fs.readFileSync(filepath, 'utf-8')
    return JSON.parse(raw)
  }

  protected writeOutput(filename: string, data: TOutput | TOutput[]) {
    const filepath = path.resolve(this.config.outputDir, filename)
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`[${this.config.name}] Output written to ${filepath}`)
  }

  protected log(message: string) {
    console.log(`[${this.config.name}] ${message}`)
  }

  async run(inputFile: string, outputFile: string) {
    this.log(`Starting...`)
    const inputs = this.readInput(inputFile)
    const outputs: TOutput[] = []

    for (const input of inputs) {
      try {
        const result = await this.process(input)
        if (this.validate(result)) {
          outputs.push(result)
        } else {
          this.log(`Validation failed for an entry, skipping.`)
        }
      } catch (err) {
        this.log(`Error processing entry: ${err}`)
      }
    }

    this.writeOutput(outputFile, outputs)
    this.log(`Done. Processed ${outputs.length}/${inputs.length} entries.`)
    return outputs
  }
}
