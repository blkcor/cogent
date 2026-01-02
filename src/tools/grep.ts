import path from 'node:path'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { z } from 'zod'
import { createTool, type ToolResult } from '../tool'

const execAsync = promisify(exec)

export const grepSchema = z.object({
  pattern: z.string().describe('Pattern to search for'),
  path: z.string().optional().describe('File or directory to search in (defaults to workspace)'),
  regex: z.boolean().optional().describe('Treat pattern as regex'),
  context_before: z.number().optional().describe('Number of lines to show before match'),
  context_after: z.number().optional().describe('Number of lines to show after match'),
})

export function createGrepTool(opts: { cwd: string }) {
  return createTool({
    name: 'grep_search',
    displayName: '🔍 Grep Search',
    description: 'Search for text patterns in files using grep.',
    parameters: grepSchema,
    approval: {
      category: 'read',
    },
    async execute(params): Promise<ToolResult> {
      try {
        const searchPath = params.path ? path.resolve(opts.cwd, params.path) : opts.cwd

        const flags: string[] = ['-n']

        if (!params.regex) {
          flags.push('-F')
        }

        if (params.context_before) {
          flags.push(`-B${params.context_before}`)
        }

        if (params.context_after) {
          flags.push(`-A${params.context_after}`)
        }

        flags.push('-r')

        const excludes = ['node_modules', '.git', 'dist', 'build']
        const excludeFlags = excludes.map((e) => `--exclude-dir=${e}`).join(' ')

        const command = `grep ${flags.join(' ')} ${excludeFlags} "${params.pattern}" "${searchPath}"`

        try {
          const { stdout } = await execAsync(command, {
            cwd: opts.cwd,
            maxBuffer: 10 * 1024 * 1024,
          })

          const lines = stdout.trim().split('\n')
          const matches = lines.length

          const formattedOutput = lines.slice(0, 100).join('\n')

          return {
            llmContent: `Found ${matches} match(es) for "${params.pattern}":\n\`\`\`\n${formattedOutput}\n\`\`\`${matches > 100 ? '\n(showing first 100 matches)' : ''}`,
            returnDisplay: {
              pattern: params.pattern,
              matches,
            },
          }
        } catch (error) {
          if ((error as any).code === 1) {
            return {
              llmContent: `No matches found for pattern: ${params.pattern}`,
              returnDisplay: {
                pattern: params.pattern,
                matches: 0,
              },
            }
          }
          throw error
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
          llmContent: `Error performing grep search: ${message}`,
          isError: true,
        }
      }
    },
  })
}

