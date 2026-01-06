import path from 'node:path'
import { z } from 'zod'
import { type ToolResult, createTool } from '../tool'
import { fileExists, readFile } from '../utils/file-utils'

export const readFileSchema = z.object({
  file_path: z.string().describe('The path to the file to read'),
  offset: z.number().optional().describe('Line number to start reading from (1-indexed)'),
  limit: z.number().optional().describe('Maximum number of lines to read'),
})

export function createReadTool(opts: { cwd: string; productName: string }) {
  return createTool({
    name: 'read_file',
    displayName: '📖 Read File',
    description: 'Read the contents of a file. Can optionally read a specific range of lines.',
    parameters: readFileSchema,
    approval: {
      category: 'read',
    },
    async execute(params): Promise<ToolResult> {
      try {
        const filePath = path.resolve(opts.cwd, params.file_path)

        if (!(await fileExists(filePath))) {
          return {
            llmContent: `Error: File not found: ${params.file_path}`,
            isError: true,
          }
        }

        const content = await readFile(filePath)
        const lines = content.split('\n')

        let startLine = 0
        let endLine = lines.length

        if (params.offset !== undefined) {
          startLine = Math.max(0, params.offset - 1)
        }

        if (params.limit !== undefined) {
          endLine = Math.min(lines.length, startLine + params.limit)
        }

        const selectedLines = lines.slice(startLine, endLine)
        const numberedLines = selectedLines
          .map((line, idx) => `${startLine + idx + 1}|${line}`)
          .join('\n')

        const resultContent = numberedLines || 'File is empty.'

        return {
          llmContent: `Contents of ${params.file_path}:\n\`\`\`\n${resultContent}\n\`\`\``,
          returnDisplay: {
            file: params.file_path,
            totalLines: lines.length,
            linesRead: selectedLines.length,
          },
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
          llmContent: `Error reading file: ${message}`,
          isError: true,
        }
      }
    },
  })
}
