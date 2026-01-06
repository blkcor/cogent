import { createOpenAI } from '@ai-sdk/openai'
import { embed } from 'ai'

export interface VectorDBEntry {
  id: string
  embedding: number[]
  metadata: any
}

export interface SearchResult {
  id: string
  score: number
  metadata: any
}

export interface VectorDBConfig {
  provider?: string
  apiKey?: string
  embeddingModel?: string
}

export interface IVectorDB {
  add(entry: VectorDBEntry): Promise<void>
  search(embedding: number[], k: number, filters?: Record<string, any>): Promise<SearchResult[]>
  embed(text: string): Promise<number[]>
  delete(id: string): Promise<void>
}

export class VectorDB implements IVectorDB {
  private entries: VectorDBEntry[]
  private embeddingModel: any

  constructor(config: VectorDBConfig = {}) {
    this.entries = []

    const openai = createOpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
    })
    this.embeddingModel = openai.embedding(config.embeddingModel || 'text-embedding-3-small')
  }

  async add(entry: VectorDBEntry): Promise<void> {
    this.entries.push(entry)
  }

  async search(
    embedding: number[],
    k: number,
    filters?: Record<string, any>
  ): Promise<SearchResult[]> {
    let candidates = this.entries

    if (filters) {
      candidates = this.entries.filter((entry) => {
        return Object.entries(filters).every(([key, value]) => entry.metadata[key] === value)
      })
    }

    const scored = candidates.map((entry) => ({
      id: entry.id,
      score: this.cosineSimilarity(embedding, entry.embedding),
      metadata: entry.metadata,
    }))

    return scored.sort((a, b) => b.score - a.score).slice(0, k)
  }

  async embed(text: string): Promise<number[]> {
    const { embedding: embeddingResult } = await embed({
      model: this.embeddingModel,
      value: text,
    })

    return embeddingResult
  }

  async delete(id: string): Promise<void> {
    this.entries = this.entries.filter((entry) => entry.id !== id)
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }
}
