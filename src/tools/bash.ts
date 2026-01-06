import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { z } from 'zod'
import { DANGEROUS_COMMANDS, HIGH_RISK_PATTERNS } from '../constants'
import { type ToolResult, createTool } from '../tool'

const execAsync = promisify(exec)

export const bashSchema = z.object({
  command: z.string().describe('The bash command to execute'),
  timeout: z.number().optional().describe('Timeout in milliseconds (default: 30000)'),
  capture_output: z.boolean().optional().describe('Capture command output (default: true)'),
})

export function validateCommand(command: string): {
  safe: boolean
  reason?: string
} {
  for (const dangerous of DANGEROUS_COMMANDS) {
    if (command.includes(dangerous)) {
      return {
        safe: false,
        reason: `Command contains dangerous pattern: ${dangerous}`,
      }
    }
  }

  for (const pattern of HIGH_RISK_PATTERNS) {
    if (pattern.test(command)) {
      return {
        safe: false,
        reason: `Command matches high-risk pattern: ${pattern}`,
      }
    }
  }

  return { safe: true }
}

export function isHighRiskCommand(command: string): boolean {
  return !validateCommand(command).safe
}

export function createBashTool(opts: { cwd: string }) {
  return createTool({
    name: 'run_command',
    displayName: '▶️ Run Command',
    description:
      'Execute a bash command. Use for running tests, linting, building, etc. Dangerous commands will be rejected.',
    parameters: bashSchema,
    approval: {
      category: 'command',
      needsApproval: async (context) => {
        return isHighRiskCommand(context.params.command as string)
      },
    },
    async execute(params): Promise<ToolResult> {
      const validation = validateCommand(params.command)
      if (!validation.safe) {
        return {
          llmContent: `Command rejected: ${validation.reason}`,
          isError: true,
        }
      }

      try {
        const startTime = Date.now()
        const { stdout, stderr } = await execAsync(params.command, {
          cwd: opts.cwd,
          timeout: params.timeout || 30000,
          maxBuffer: 10 * 1024 * 1024,
        })
        const duration = Date.now() - startTime

        const output: string[] = []

        if (stdout) {
          output.push('STDOUT:')
          output.push(stdout.trim())
        }

        if (stderr) {
          output.push('\nSTDERR:')
          output.push(stderr.trim())
        }

        return {
          llmContent: `Command executed successfully in ${duration}ms:\n\`\`\`\n${output.join(
            '\n'
          )}\n\`\`\``,
          returnDisplay: {
            command: params.command,
            exitCode: 0,
            duration,
          },
        }
      } catch (error) {
        const output: string[] = []
        const exitCode = (error as any).code || 1

        if ((error as any).stdout) {
          output.push('STDOUT:')
          output.push((error as any).stdout.trim())
        }

        if ((error as any).stderr) {
          output.push('\nSTDERR:')
          output.push((error as any).stderr.trim())
        }

        return {
          llmContent: `Command failed with exit code ${exitCode}:\n\`\`\`\n${output.join(
            '\n'
          )}\n\`\`\``,
          isError: true,
          returnDisplay: {
            command: params.command,
            exitCode,
          },
        }
      }
    },
  })
}
