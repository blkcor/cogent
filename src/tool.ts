import type { Tool as AITool } from 'ai'
import type { z } from 'zod'
import type { ImagePart, TextPart } from './message'

export type ApprovalCategory = 'read' | 'write' | 'command' | 'network'

export interface ToolApprovalInfo {
  category: ApprovalCategory
  needsApproval?: (context: ApprovalContext) => Promise<boolean> | boolean
}

export interface ApprovalContext {
  toolName: string
  params: Record<string, any>
  approvalMode: string
  context: any
}

export interface ToolResult {
  llmContent: string | (TextPart | ImagePart)[]
  returnDisplay?: any
  isError?: boolean
  metadata?: Record<string, any>
}

export interface Tool<TSchema extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string
  description: string
  displayName?: string
  parameters: TSchema
  execute: (
    params: z.output<TSchema>,
    toolCallId?: string
  ) => Promise<ToolResult> | ToolResult
  approval?: ToolApprovalInfo
  getDescription?: (opts: { params: z.output<TSchema>; cwd: string }) => string
}

export function createTool<TSchema extends z.ZodTypeAny>(config: {
  name: string
  displayName?: string
  description: string
  parameters: TSchema
  execute: (
    params: z.output<TSchema>,
    toolCallId?: string
  ) => Promise<ToolResult> | ToolResult
  approval?: ToolApprovalInfo
  getDescription?: (opts: { params: z.output<TSchema>; cwd: string }) => string
}): Tool<TSchema> {
  return {
    name: config.name,
    displayName: config.displayName,
    description: config.description,
    parameters: config.parameters,
    execute: config.execute,
    approval: config.approval,
    getDescription: config.getDescription,
  }
}

export interface ITools {
  get(toolName: string): Tool | undefined
  invoke(
    toolName: string,
    args: string,
    toolCallId: string
  ): Promise<ToolResult>
  toLanguageV1Tools(): Record<string, AITool>
  length(): number
}

export class Tools implements ITools {
  private tools: Map<string, Tool>

  constructor(tools: Tool[]) {
    this.tools = new Map(tools.map((tool) => [tool.name, tool]))
  }

  get(toolName: string): Tool | undefined {
    return this.tools.get(toolName)
  }

  async invoke(
    toolName: string,
    args: string,
    toolCallId: string
  ): Promise<ToolResult> {
    const tool = this.tools.get(toolName)
    if (!tool) {
      return {
        llmContent: `Error: Tool '${toolName}' not found`,
        isError: true,
      }
    }

    try {
      const parsedArgs = JSON.parse(args)
      const validatedArgs = tool.parameters.parse(parsedArgs)
      return await tool.execute(validatedArgs, toolCallId)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        llmContent: `Error executing tool '${toolName}': ${message}`,
        isError: true,
      }
    }
  }

  toLanguageV1Tools(): Record<string, AITool> {
    const result: Record<string, AITool> = {}
    for (const [name, tool] of this.tools) {
      result[name] = {
        description: tool.description,
        parameters: zodToJsonSchema(tool.parameters),
      }
    }
    return result
  }

  length(): number {
    return this.tools.size
  }
}

function zodToJsonSchema(schema: z.ZodTypeAny): any {
  const shape = (schema as any)._def?.shape?.()
  if (!shape) return { type: 'object', properties: {} }

  const properties: any = {}
  const required: string[] = []

  for (const [key, value] of Object.entries(shape)) {
    if (!value) continue

    const zodType = value as z.ZodTypeAny
    properties[key] = zodTypeToJsonSchema(zodType)

    // Check if the type is optional by looking at its typeName
    const typeName = (zodType as any)._def?.typeName
    if (typeName && typeName !== 'ZodOptional') {
      required.push(key)
    }
  }

  return {
    type: 'object',
    properties,
    required: required.length > 0 ? required : undefined,
  }
}

function zodTypeToJsonSchema(zodType: z.ZodTypeAny): any {
  if (!zodType || !(zodType as any)._def) {
    return { type: 'string' }
  }

  const typeName = (zodType as any)._def.typeName

  switch (typeName) {
    case 'ZodString':
      return { type: 'string', description: (zodType as any)._def?.description }
    case 'ZodNumber':
      return { type: 'number', description: (zodType as any)._def?.description }
    case 'ZodBoolean':
      return {
        type: 'boolean',
        description: (zodType as any)._def?.description,
      }
    case 'ZodArray':
      return {
        type: 'array',
        items: zodTypeToJsonSchema((zodType as any)._def.type),
        description: (zodType as any)._def?.description,
      }
    case 'ZodOptional':
      return zodTypeToJsonSchema((zodType as any)._def.innerType)
    case 'ZodObject':
      return zodToJsonSchema(zodType)
    default:
      return { type: 'string' }
  }
}
