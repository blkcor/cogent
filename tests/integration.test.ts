import { describe, it, expect, beforeAll } from 'vitest'
import { ProviderManager } from '../src/model/provider-manager'
import { ConfigManager } from '../src/config'
import { Tools } from '../src/tool'
import { createAllTools } from '../src/tools/index'
import { Context } from '../src/context'
import { PRODUCT_NAME } from '../src/constants'

describe('Integration Tests', () => {
  describe('Provider System', () => {
    it('should create provider manager', () => {
      const manager = new ProviderManager()
      expect(manager).toBeDefined()
    })

    it('should list all providers', () => {
      const manager = new ProviderManager()
      const providers = manager.getAllProviders()
      expect(providers.length).toBeGreaterThan(0)
    })

    it('should get specific provider', () => {
      const manager = new ProviderManager()
      const openai = manager.getProvider('openai')
      expect(openai).toBeDefined()
      expect(openai?.id).toBe('openai')
    })
  })

  describe('Configuration', () => {
    it('should create config manager', () => {
      const manager = new ConfigManager()
      expect(manager).toBeDefined()
    })

    it('should load default config', async () => {
      const manager = new ConfigManager()
      const config = await manager.load()
      expect(config).toBeDefined()
      expect(config.model).toBeDefined()
    })
  })

  describe('Tools', () => {
    it('should create all tools', () => {
      const tools = createAllTools({
        cwd: process.cwd(),
        productName: PRODUCT_NAME,
        allowCommands: false,
      })
      expect(tools.length).toBeGreaterThan(0)
    })

    it('should create tools instance', () => {
      const toolsList = createAllTools({
        cwd: process.cwd(),
        productName: PRODUCT_NAME,
        allowCommands: false,
      })
      const tools = new Tools(toolsList)
      expect(tools.length()).toBeGreaterThan(0)
    })

    it('should get specific tool', () => {
      const toolsList = createAllTools({
        cwd: process.cwd(),
        productName: PRODUCT_NAME,
        allowCommands: false,
      })
      const tools = new Tools(toolsList)
      const readTool = tools.get('read_file')
      expect(readTool).toBeDefined()
      expect(readTool?.name).toBe('read_file')
    })
  })

  describe('Context', () => {
    it('should create context', async () => {
      const configManager = new ConfigManager()
      const config = await configManager.load()
      const providerManager = new ProviderManager()

      const context = new Context({
        cwd: process.cwd(),
        config,
        providerManager,
      })

      expect(context).toBeDefined()
      expect(context.cwd).toBeDefined()
      expect(context.backupSystem).toBeDefined()
    })
  })
})

