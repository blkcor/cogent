import type { IVectorDB } from './vector-db.js'

export interface Episode {
  id: string
  taskDescription: string
  solutionApproach: string
  success: boolean
  lessonsLearned: string[]
  timestamp: Date
}

export interface IEpisodicMemory {
  storeEpisode(episode: Episode): Promise<void>
  recallSimilar(query: string, k?: number): Promise<Episode[]>
}

export class EpisodicMemory implements IEpisodicMemory {
  private db: IVectorDB

  constructor(db: IVectorDB) {
    this.db = db
  }

  async storeEpisode(episode: Episode): Promise<void> {
    const text = this.episodeToText(episode)
    const embedding = await this.db.embed(text)

    await this.db.add({
      id: episode.id,
      embedding,
      metadata: {
        type: 'episode',
        taskDescription: episode.taskDescription,
        solutionApproach: episode.solutionApproach,
        success: episode.success,
        lessonsLearned: episode.lessonsLearned,
        timestamp: episode.timestamp.toISOString(),
      },
    })
  }

  async recallSimilar(query: string, k = 5): Promise<Episode[]> {
    const queryEmbedding = await this.db.embed(query)
    const results = await this.db.search(queryEmbedding, k, { type: 'episode' })

    return results.map((result) => ({
      id: result.id,
      taskDescription: result.metadata.taskDescription,
      solutionApproach: result.metadata.solutionApproach,
      success: result.metadata.success,
      lessonsLearned: result.metadata.lessonsLearned,
      timestamp: new Date(result.metadata.timestamp),
    }))
  }

  private episodeToText(episode: Episode): string {
    const parts = [
      `Task: ${episode.taskDescription}`,
      `Solution: ${episode.solutionApproach}`,
      `Status: ${episode.success ? 'Success' : 'Failed'}`,
    ]

    if (episode.lessonsLearned.length > 0) {
      parts.push(`Lessons: ${episode.lessonsLearned.join('; ')}`)
    }

    return parts.join('\n')
  }
}

