import type { Tool } from '../tool'
import type { BackupSystem } from '../utils/backup'
import { createReadTool } from './read'
import { createLSTool } from './ls'
import { createGlobTool } from './glob'
import { createGrepTool } from './grep'
import { createWriteTool } from './write'
import { createEditTool } from './edit'
import { createBashTool } from './bash'

export interface CreateToolsOptions {
  cwd: string
  productName: string
  backupSystem?: BackupSystem
  allowCommands?: boolean
}

export function createAllTools(opts: CreateToolsOptions): Tool<any>[] {
  const tools: Tool<any>[] = [
    createReadTool({ cwd: opts.cwd, productName: opts.productName }),
    createLSTool({ cwd: opts.cwd }),
    createGlobTool({ cwd: opts.cwd }),
    createGrepTool({ cwd: opts.cwd }),
    createWriteTool({ cwd: opts.cwd, backupSystem: opts.backupSystem }),
    createEditTool({ cwd: opts.cwd, backupSystem: opts.backupSystem }),
  ]

  if (opts.allowCommands) {
    tools.push(createBashTool({ cwd: opts.cwd }))
  }

  return tools
}

export * from './read'
export * from './ls'
export * from './glob'
export * from './grep'
export * from './write'
export * from './edit'
export * from './bash'
