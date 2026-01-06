import { ReasoningMode } from './types'

export interface IModeSelector {
  selectMode(task: string, userPreference?: ReasoningMode): ReasoningMode
}

export class ModeSelector implements IModeSelector {
  selectMode(task: string, userPreference?: ReasoningMode): ReasoningMode {
    if (userPreference) {
      return userPreference
    }

    if (this.isSimpleQuery(task)) {
      return ReasoningMode.REACT
    }

    if (this.isMultiFileRefactoring(task)) {
      return ReasoningMode.PLAN_SOLVE
    }

    if (this.isCodeReview(task)) {
      return ReasoningMode.REFLECTION
    }

    return ReasoningMode.REACT
  }

  private isSimpleQuery(task: string): boolean {
    const simpleKeywords = ['read', 'show', 'display', 'what is', 'explain', 'find']
    const lowerTask = task.toLowerCase()
    return simpleKeywords.some((keyword) => lowerTask.includes(keyword))
  }

  private isMultiFileRefactoring(task: string): boolean {
    const refactorKeywords = [
      'refactor',
      'restructure',
      'reorganize',
      'multiple files',
      'entire codebase',
    ]
    const lowerTask = task.toLowerCase()
    return refactorKeywords.some((keyword) => lowerTask.includes(keyword))
  }

  private isCodeReview(task: string): boolean {
    const reviewKeywords = ['review', 'improve', 'optimize', 'enhance', 'better']
    const lowerTask = task.toLowerCase()
    return reviewKeywords.some((keyword) => lowerTask.includes(keyword))
  }
}
