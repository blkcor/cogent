import type { IVectorDB } from './vector-db.js'

export interface Fact {
  id: string
  type: 'preference' | 'convention' | 'knowledge'
  content: string
  timestamp: Date
}

export interface ISemanticMemory {
  storeFact(fact: Fact): Promise<void>
  queryFacts(query: string, factType?: Fact['type'], k?: number): Promise<Fact[]>
}

export class SemanticMemory implements ISemanticMemory {
  private db: IVectorDB

  constructor(db: IVectorDB) {
    this.db = db
  }

  async storeFact(fact: Fact): Promise<void> {
    const embedding = await this.db.embed(fact.content)

    await this.db.add({
      id: fact.id,
      embedding,
      metadata: {
        type: 'fact',
        factType: fact.type,
        content: fact.content,
        timestamp: fact.timestamp.toISOString(),
      },
    })
  }

  async queryFacts(query: string, factType?: Fact['type'], k = 10): Promise<Fact[]> {
    const queryEmbedding = await this.db.embed(query)

    const filters: Record<string, any> = { type: 'fact' }
    if (factType) {
      filters.factType = factType
    }

    const results = await this.db.search(queryEmbedding, k, filters)

    return results.map((result) => ({
      id: result.id,
      type: result.metadata.factType as Fact['type'],
      content: result.metadata.content,
      timestamp: new Date(result.metadata.timestamp),
    }))
  }
}
