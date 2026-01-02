import path from 'node:path'
import { z } from 'zod'
import { createTool, type ToolResult } from '../tool'
import { writeFile } from '../utils/file-utils'
import type { BackupSystem } from '../utils/backup'

export const writeFileSchema = z.object({
  file_path: z.string().describe('The path to the file to write'),
  content: z.string().describe('The content to write to the file'),
  create_backup: z.boolean().optional().describe('Create a backup before writing'),
})

export function createWriteTool(opts: { cwd: string; backupSystem?: BackupSystem }) {
  return createTool({
    name: 'write_file',
    displayName: '✍️ Write File',
    description: 'Write content to a file. Creates the file if it does not exist.',
    parameters: writeFileSchema,
    approval: {
      category: 'write',
    },
    async execute(params): Promise<ToolResult> {
      try {
        const filePath = path.resolve(opts.cwd, params.file_path)

        if (params.create_backup && opts.backupSystem) {
          try {
            await opts.backupSystem.createBackup(filePath)
          } catch {
            // File doesn't exist yet, no backup needed
          }
        }

        await writeFile(filePath, params.content)

        return {
          llmContent: `Successfully wrote to ${params.file_path}`,
          returnDisplay: {
            file: params.file_path,
            bytes: params.content.length,
          },
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
          llmContent: `Error writing file: ${message}`,
          isError: true,
        }
      }
    },
  })
}

