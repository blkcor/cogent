#!/usr/bin/env node

import { Context } from './context'
import { ProviderManager } from './model/provider-manager'
import { ConfigManager } from './config'
import { Tools } from './tool'
import { createAllTools } from './tools/index'
import { PRODUCT_NAME } from './constants'

export async function createAgent(opts: { cwd?: string } = {}) {
  const cwd = opts.cwd || process.cwd()

  const configManager = new ConfigManager()
  const config = await configManager.load()

  const providerManager = new ProviderManager()

  const context = new Context({
    cwd,
    config,
    providerManager,
  })

  const toolsList = createAllTools({
    cwd,
    productName: PRODUCT_NAME,
    backupSystem: context.backupSystem,
    allowCommands: true,
  })

  const tools = new Tools(toolsList)

  const modelInfo = await providerManager.resolveModel(config.model, {})

  return {
    context,
    tools,
    modelInfo,
    config,
  }
}

export async function main() {
  const task = process.argv.slice(2).join(' ')

  if (!task) {
    console.log('Usage: cogent <task>')
    console.log('\nExample: cogent "Create a simple HTTP server in Node.js"')
    process.exit(1)
  }

  console.log(`🤖 ${PRODUCT_NAME} - AI Coding Assistant\n`)
  console.log(`Task: ${task}\n`)

  console.log('⚠️  Full agent implementation in progress...')
  console.log('Core systems ready: ✅ Providers, ✅ Tools, ✅ Config, ✅ Security')
}

export { Context } from './context'
export { ProviderManager } from './model/provider-manager'
export { ConfigManager, ApprovalMode, ReasoningMode } from './config'
export { Tools, createTool } from './tool'
export { ApprovalSystem } from './security/approval'
export * from './tools/index'
export * from './constants'

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

