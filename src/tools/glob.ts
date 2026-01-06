import path from 'node:path'
import fg from 'fast-glob'
import { z } from 'zod'
import { type ToolResult, createTool } from '../tool'

export const globSchema = z.object({
  pattern: z.string().describe('Glob pattern to search for files (e.g., "**/*.ts")'),
  cwd: z.string().optional().describe('Directory to search in (defaults to workspace root)'),
})

export function createGlobTool(opts: { cwd: string }) {
  return createTool({
    name: 'glob_search',
    displayName: '🔎 Glob Search',
    description: 'Search for files matching a glob pattern.',
    parameters: globSchema,
    approval: {
      category: 'read',
    },
    async execute(params): Promise<ToolResult> {
      try {
        const searchDir = params.cwd ? path.resolve(opts.cwd, params.cwd) : opts.cwd

        const files = await fg(params.pattern, {
          cwd: searchDir,
          ignore: ['node_modules', '.git', 'dist', 'build', '*.min.js'],
          absolute: false,
        })

        if (files.length === 0) {
          return {
            llmContent: `No files found matching pattern: ${params.pattern}`,
            returnDisplay: {
              pattern: params.pattern,
              count: 0,
            },
          }
        }

        const fileList = files.map((f) => `  - ${f}`).join('\n')

        return {
          llmContent: `Found ${files.length} file(s) matching "${params.pattern}":\n${fileList}`,
          returnDisplay: {
            pattern: params.pattern,
            count: files.length,
            files: files.slice(0, 50),
          },
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
          llmContent: `Error performing glob search: ${message}`,
          isError: true,
        }
      }
    },
  })
}
