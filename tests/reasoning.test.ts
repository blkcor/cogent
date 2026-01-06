import { beforeEach, describe, expect, it } from 'vitest'
import { ModeSelector } from '../src/reasoning/mode-selector'
import { ReasoningMode } from '../src/reasoning/types'

describe('Reasoning Systems', () => {
  describe('ModeSelector', () => {
    let selector: ModeSelector

    beforeEach(() => {
      selector = new ModeSelector()
    })

    it('should create mode selector instance', () => {
      expect(selector).toBeDefined()
    })

    it('should select REACT for simple query tasks', () => {
      const mode = selector.selectMode('What is the purpose of this function?')
      expect(mode).toBe(ReasoningMode.REACT)
    })

    it('should select REACT for find tasks', () => {
      const mode = selector.selectMode('Find the authentication module')
      expect(mode).toBe(ReasoningMode.REACT)
    })

    it('should select REACT for show/display tasks', () => {
      const mode = selector.selectMode('Show me the database schema')
      expect(mode).toBe(ReasoningMode.REACT)
    })

    it('should select PLAN_SOLVE for refactoring tasks', () => {
      const mode = selector.selectMode('Refactor the entire codebase to use TypeScript')
      expect(mode).toBe(ReasoningMode.PLAN_SOLVE)
    })

    it('should select PLAN_SOLVE for restructuring tasks', () => {
      const mode = selector.selectMode('Restructure the project layout')
      expect(mode).toBe(ReasoningMode.PLAN_SOLVE)
    })

    it('should select REFLECTION for optimization tasks', () => {
      const mode = selector.selectMode('Optimize the query performance')
      expect(mode).toBe(ReasoningMode.REFLECTION)
    })

    it('should select REFLECTION for improvement tasks', () => {
      const mode = selector.selectMode('Improve the error handling')
      expect(mode).toBe(ReasoningMode.REFLECTION)
    })

    it('should select REFLECTION for code review tasks', () => {
      const mode = selector.selectMode('Review this code and enhance it')
      expect(mode).toBe(ReasoningMode.REFLECTION)
    })

    it('should default to REACT for ambiguous tasks', () => {
      const mode = selector.selectMode('Do something with the code')
      expect(mode).toBe(ReasoningMode.REACT)
    })

    it('should respect user preference', () => {
      const mode = selector.selectMode('Refactor everything', ReasoningMode.REACT)
      expect(mode).toBe(ReasoningMode.REACT)
    })
  })
})
