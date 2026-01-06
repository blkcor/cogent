#!/usr/bin/env node

import dotenv from 'dotenv'
import { Agent } from './agent'
import { ConfigManager } from './config'
import { PRODUCT_NAME } from './constants'
import { Context } from './context'
import { ProviderManager } from './model/provider-manager'
import { Tools } from './tool'
import { createAllTools } from './tools/index'

// Ensure environment variables are loaded
dotenv.config()

export interface CreateAgentOptions {
  cwd?: string
  onThought?: (thought: string) => void
  onToolCall?: (toolName: string, args: any) => void
  onToolResult?: (toolName: string, result: string) => void
  onStep?: (step: number, total: number) => void
}

export async function createAgent(opts: CreateAgentOptions = {}) {
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

  const agent = new Agent({
    model: modelInfo,
    tools,
    reasoningMode: config.reasoning.defaultMode,
    maxSteps: config.reasoning.maxSteps,
    cwd,
    onThought: opts.onThought,
    onToolCall: opts.onToolCall,
    onToolResult: opts.onToolResult,
    onStep: opts.onStep,
  })

  return {
    agent,
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

  try {
    const { agent, modelInfo } = await createAgent()

    console.log(`Using ${modelInfo.provider.name} (${modelInfo.model.id})\n`)

    const result = await agent.run(task)

    if (result.success) {
      console.log('\n✅ Task completed successfully!\n')
      console.log(result.result)
      console.log(`\n📊 Duration: ${result.metadata.duration}ms`)
    } else {
      console.error('\n❌ Task failed:\n')
      console.error(result.result)
      process.exit(1)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`\n❌ Fatal error: ${message}`)
    process.exit(1)
  }
}

export { Context } from './context'
export { ProviderManager } from './model/provider-manager'
export { ConfigManager, ApprovalMode, ReasoningMode } from './config'
export { Tools, createTool } from './tool'
export { ApprovalSystem } from './security/approval'
export { Agent } from './agent'
export * from './tools/index'
export * from './reasoning/index'
export * from './memory/index'
export * from './ui/index'
export * from './constants'

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}
