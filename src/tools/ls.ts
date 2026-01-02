import path from 'node:path'
import { z } from 'zod'
import { createTool, type ToolResult } from '../tool'
import { fileExists, listDirectory } from '../utils/file-utils'

export const lsSchema = z.object({
  path: z.string().describe('The directory path to list'),
  recursive: z.boolean().optional().describe('List subdirectories recursively'),
  max_depth: z.number().optional().describe('Maximum depth for recursive listing'),
})

export function createLSTool(opts: { cwd: string }) {
  return createTool({
    name: 'list_dir',
    displayName: '📂 List Directory',
    description: 'List files and directories in a given path.',
    parameters: lsSchema,
    approval: {
      category: 'read',
    },
    async execute(params): Promise<ToolResult> {
      try {
        const dirPath = path.resolve(opts.cwd, params.path)

        if (!(await fileExists(dirPath))) {
          return {
            llmContent: `Error: Directory not found: ${params.path}`,
            isError: true,
          }
        }

        const { files, directories } = await listDirectory(
          dirPath,
          params.recursive || false
        )

        const relativeFiles = files.map((f) => path.relative(opts.cwd, f))
        const relativeDirs = directories.map((d) => path.relative(opts.cwd, d))

        const output: string[] = []

        if (relativeDirs.length > 0) {
          output.push('Directories:')
          for (const dir of relativeDirs.sort()) {
            output.push(`  📁 ${dir}`)
          }
        }

        if (relativeFiles.length > 0) {
          output.push('\nFiles:')
          for (const file of relativeFiles.sort()) {
            output.push(`  📄 ${file}`)
          }
        }

        if (output.length === 0) {
          output.push('(empty directory)')
        }

        return {
          llmContent: `Contents of ${params.path}:\n${output.join('\n')}`,
          returnDisplay: {
            path: params.path,
            fileCount: files.length,
            dirCount: directories.length,
          },
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
          llmContent: `Error listing directory: ${message}`,
          isError: true,
        }
      }
    },
  })
}

