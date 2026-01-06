import path from 'node:path'
import { z } from 'zod'
import { type ToolResult, createTool } from '../tool'
import type { BackupSystem } from '../utils/backup'
import { fileExists, readFile, writeFile } from '../utils/file-utils'

export const editFileSchema = z.object({
  file_path: z.string().describe('The path to the file to edit'),
  old_string: z.string().describe('The exact string to replace'),
  new_string: z.string().describe('The new string to replace with'),
  replace_all: z.boolean().optional().describe('Replace all occurrences (default: false)'),
})

export function createEditTool(opts: { cwd: string; backupSystem?: BackupSystem }) {
  return createTool({
    name: 'edit_file',
    displayName: '✏️ Edit File',
    description: 'Edit a file by replacing exact string matches. Use for precise code changes.',
    parameters: editFileSchema,
    approval: {
      category: 'write',
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

        if (!content.includes(params.old_string)) {
          return {
            llmContent: `Error: String not found in file:\n"${params.old_string}"`,
            isError: true,
          }
        }

        if (opts.backupSystem) {
          await opts.backupSystem.createBackup(filePath)
        }

        let newContent: string
        let replacementCount: number

        if (params.replace_all) {
          const parts = content.split(params.old_string)
          replacementCount = parts.length - 1
          newContent = parts.join(params.new_string)
        } else {
          replacementCount = 1
          newContent = content.replace(params.old_string, params.new_string)
        }

        await writeFile(filePath, newContent)

        return {
          llmContent: `Successfully edited ${params.file_path}. Replaced ${replacementCount} occurrence(s).`,
          returnDisplay: {
            file: params.file_path,
            replacements: replacementCount,
          },
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
          llmContent: `Error editing file: ${message}`,
          isError: true,
        }
      }
    },
  })
}
