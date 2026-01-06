import { v4 as uuidv4 } from 'uuid'

export type MessageRole = 'user' | 'assistant' | 'tool' | 'system'

export interface TextPart {
  type: 'text'
  text: string
}

export interface ImagePart {
  type: 'image'
  data: string
  mimeType: string
}

export interface ToolUsePart {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, any>
  description?: string
  displayName?: string
}

export interface ToolResultPart {
  type: 'tool_result'
  toolCallId: string
  toolName: string
  input: Record<string, any>
  result: {
    llmContent: string | (TextPart | ImagePart)[]
    returnDisplay?: any
    isError?: boolean
    metadata?: Record<string, any>
  }
}

export type AssistantContent = (TextPart | ToolUsePart)[]
export type ToolContent = ToolResultPart[]

export interface NormalizedMessage {
  role: MessageRole
  content: string | AssistantContent | ToolContent
  timestamp: string
  uuid: string
  parentUuid: string | null
}

export function createMessage(
  role: MessageRole,
  content: string | AssistantContent | ToolContent,
  parentUuid: string | null = null
): NormalizedMessage {
  return {
    role,
    content,
    timestamp: new Date().toISOString(),
    uuid: uuidv4(),
    parentUuid,
  }
}

export function isTextPart(part: any): part is TextPart {
  return part?.type === 'text'
}

export function isToolUsePart(part: any): part is ToolUsePart {
  return part?.type === 'tool_use'
}

export function isToolResultPart(part: any): part is ToolResultPart {
  return part?.type === 'tool_result'
}

export function extractTextFromContent(content: string | AssistantContent | ToolContent): string {
  if (typeof content === 'string') {
    return content
  }

  if (Array.isArray(content)) {
    return content
      .filter(isTextPart)
      .map((part) => part.text)
      .join('\n')
  }

  return ''
}
