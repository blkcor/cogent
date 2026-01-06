import { describe, it, expect, beforeEach } from 'vitest'
import { VectorDB } from '../src/memory/vector-db'
import { EpisodicMemory } from '../src/memory/episodic'
import { SemanticMemory } from '../src/memory/semantic'
import { ConversationHistory, ReasoningTrace } from '../src/memory/short-term'

describe('Memory Systems', () => {
  describe('VectorDB', () => {
    it('should create vector db instance', () => {
      const db = new VectorDB()
      expect(db).toBeDefined()
    })

    it('should add and retrieve entries', async () => {
      const db = new VectorDB()
      await db.add({
        id: 'test-1',
        embedding: [0.1, 0.2, 0.3],
        metadata: { text: 'test' },
      })

      const results = await db.search([0.1, 0.2, 0.3], 1)
      expect(results.length).toBe(1)
      expect(results[0].id).toBe('test-1')
    })

    it('should calculate cosine similarity correctly', async () => {
      const db = new VectorDB()
      await db.add({
        id: 'identical',
        embedding: [1, 0, 0],
        metadata: { text: 'identical' },
      })

      const results = await db.search([1, 0, 0], 1)
      expect(results[0].score).toBeCloseTo(1.0, 5)
    })

    it('should filter by metadata', async () => {
      const db = new VectorDB()
      await db.add({
        id: 'type-a',
        embedding: [0.1, 0.2, 0.3],
        metadata: { type: 'a', value: 1 },
      })

      await db.add({
        id: 'type-b',
        embedding: [0.1, 0.2, 0.3],
        metadata: { type: 'b', value: 2 },
      })

      const results = await db.search([0.1, 0.2, 0.3], 10, { type: 'a' })
      expect(results.length).toBe(1)
      expect(results[0].id).toBe('type-a')
    })

    it('should delete entries', async () => {
      const db = new VectorDB()
      await db.add({
        id: 'to-delete',
        embedding: [0.1, 0.2, 0.3],
        metadata: { text: 'delete me' },
      })

      await db.delete('to-delete')

      const results = await db.search([0.1, 0.2, 0.3], 10)
      expect(results.length).toBe(0)
    })
  })

  describe('EpisodicMemory', () => {
    it('should create episodic memory instance', () => {
      const db = new VectorDB()
      const memory = new EpisodicMemory(db)
      expect(memory).toBeDefined()
    })

    it.skip('should store and recall episodes', async () => {
      // This test requires network access to call OpenAI embeddings API
      // Skip in offline mode
    })
  })

  describe('SemanticMemory', () => {
    it('should create semantic memory instance', () => {
      const db = new VectorDB()
      const memory = new SemanticMemory(db)
      expect(memory).toBeDefined()
    })

    it.skip('should store and query facts', async () => {
      // This test requires network access to call OpenAI embeddings API
      // Skip in offline mode
    })
  })

  describe('ConversationHistory', () => {
    let history: ConversationHistory

    beforeEach(() => {
      history = new ConversationHistory(10)
    })

    it('should create conversation history instance', () => {
      expect(history).toBeDefined()
    })

    it('should add and retrieve messages', () => {
      history.addMessage({
        role: 'user',
        content: [{ type: 'text', text: 'Hello' }],
      })

      history.addMessage({
        role: 'assistant',
        content: [{ type: 'text', text: 'Hi there!' }],
      })

      const recent = history.getRecent(2)
      expect(recent.length).toBe(2)
      expect(recent[0].role).toBe('user')
      expect(recent[1].role).toBe('assistant')
    })

    it('should limit messages to max turns', () => {
      for (let i = 0; i < 20; i++) {
        history.addMessage({
          role: 'user',
          content: [{ type: 'text', text: `Message ${i}` }],
        })
      }

      const all = history.getRecent(100)
      expect(all.length).toBe(10)
    })

    it('should clear history', () => {
      history.addMessage({
        role: 'user',
        content: [{ type: 'text', text: 'Hello' }],
      })

      history.clear()

      const recent = history.getRecent(10)
      expect(recent.length).toBe(0)
    })
  })

  describe('ReasoningTrace', () => {
    let trace: ReasoningTrace

    beforeEach(() => {
      trace = new ReasoningTrace()
    })

    it('should create reasoning trace instance', () => {
      expect(trace).toBeDefined()
    })

    it('should add and retrieve steps', () => {
      trace.addStep(
        'I need to check the file',
        'read_file',
        'File contains config data'
      )

      trace.addStep(
        'Now I will modify it',
        'edit_file',
        'File updated successfully'
      )

      const steps = trace.getSteps()
      expect(steps.length).toBe(2)
      expect(steps[0].thought).toBe('I need to check the file')
      expect(steps[0].action).toBe('read_file')
      expect(steps[1].action).toBe('edit_file')
    })

    it('should clear trace', () => {
      trace.addStep('Thought', 'Action', 'Observation')

      trace.clear()

      const steps = trace.getSteps()
      expect(steps.length).toBe(0)
    })

    it('should include timestamps', () => {
      const before = new Date()
      trace.addStep('Thought', 'Action', 'Observation')
      const after = new Date()

      const steps = trace.getSteps()
      expect(steps[0].timestamp).toBeDefined()
      expect(steps[0].timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(steps[0].timestamp.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })
})

