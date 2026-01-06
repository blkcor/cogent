#!/usr/bin/env node

import { Command } from 'commander'
import dotenv from 'dotenv'
import { PRODUCT_NAME, VERSION } from './constants'
import { createAgent } from './index'
import { ConfigManager } from './config'

dotenv.config()

const program = new Command()

program
  .name('cogent')
  .description(
    'AI-powered coding assistant with advanced reasoning capabilities'
  )
  .version(VERSION)

program
  .command('run <task...>')
  .description('Run a coding task')
  .option(
    '-m, --model <model>',
    'Model to use (e.g., anthropic/claude-3-5-sonnet)'
  )
  .option(
    '-r, --reasoning <mode>',
    'Reasoning mode (react|plan_solve|reflection)'
  )
  .option('--max-steps <n>', 'Maximum reasoning steps', '30')
  .option('--cwd <path>', 'Working directory', process.cwd())
  .action(async (taskArgs: string[], options) => {
    const task = taskArgs.join(' ')

    console.log(`🤖 ${PRODUCT_NAME} v${VERSION}`)
    console.log(`\nTask: ${task}\n`)

    try {
      const { agent, context, tools, modelInfo } = await createAgent({
        cwd: options.cwd,
      })

      console.log(`✅ Using ${modelInfo.provider.name} (${modelInfo.model.id})`)
      console.log(`✅ Loaded ${tools.length()} tools`)
      console.log(`✅ Working directory: ${context.cwd}\n`)

      const result = await agent.run(task)

      if (result.success) {
        console.log('\n✅ Completed\n')
        console.log(result.result)
        console.log(`\n📊 Metadata:`)
        console.log(`  Duration: ${result.metadata.duration}ms`)
        console.log(`  Turns: ${result.metadata.turnsCount}`)
      } else {
        console.error('\n❌ Failed\n')
        console.error(result.result)
        process.exit(1)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`\n❌ Failed: ${message}`)
      process.exit(1)
    }
  })

program
  .command('config')
  .description('Manage configuration')
  .option('--show', 'Show current configuration')
  .option('--set <key=value...>', 'Set configuration values')
  .action(async (options) => {
    const configManager = new ConfigManager()
    const config = await configManager.load()

    if (options.show) {
      console.log('Current configuration:')
      console.log(JSON.stringify(config, null, 2))
      return
    }

    if (options.set) {
      console.log('⚠️  Config set functionality coming soon')
      console.log('Edit .cogent.json directly for now')
    }
  })

program
  .command('models')
  .description('List available models')
  .action(async () => {
    const { ProviderManager } = await import('./model/provider-manager')
    const manager = new ProviderManager()
    const providers = manager.getAllProviders()

    console.log('Available providers and models:\n')

    for (const provider of providers) {
      console.log(`${provider.name} (${provider.id}):`)
      if (provider.models.length > 0) {
        for (const model of provider.models) {
          console.log(`  - ${model}`)
        }
      } else {
        console.log('  (OpenAI-compatible, use any model ID)')
      }
      console.log()
    }
  })

program
  .command('init')
  .description('Initialize Cogent in current directory')
  .action(async () => {
    const configManager = new ConfigManager()
    const config = await configManager.load()
    await configManager.save(config)

    console.log('✅ Initialized Cogent')
    console.log('\nCreated .cogent.json with default configuration')
    console.log('\nNext steps:')
    console.log('1. Set up API keys in .env file')
    console.log('2. Run: cogent run "your task here"')
  })

program.parse()
