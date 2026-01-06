import { describe, it, expect, beforeEach } from 'vitest'
import { ApprovalSystem } from '../src/security/approval'
import { ApprovalMode } from '../src/config'
import { createTool } from '../src/tool'
import { z } from 'zod'

describe('Security Systems', () => {
  describe('ApprovalSystem', () => {
    const readTool = createTool({
      name: 'read_file',
      description: 'Read a file',
      parameters: z.object({ path: z.string() }),
      execute: async () => 'content',
      approval: { category: 'read' },
    })

    const writeTool = createTool({
      name: 'write_file',
      description: 'Write a file',
      parameters: z.object({ path: z.string(), content: z.string() }),
      execute: async () => 'success',
      approval: { category: 'write' },
    })

    const commandTool = createTool({
      name: 'run_command',
      description: 'Run a command',
      parameters: z.object({ command: z.string() }),
      execute: async () => 'output',
      approval: { category: 'command' },
    })

    it('should create approval system instance', () => {
      const system = new ApprovalSystem(ApprovalMode.DEFAULT)
      expect(system).toBeDefined()
    })

    it('should get and set approval mode', () => {
      const system = new ApprovalSystem(ApprovalMode.DEFAULT)
      expect(system.getMode()).toBe(ApprovalMode.DEFAULT)
      
      system.setMode(ApprovalMode.YOLO)
      expect(system.getMode()).toBe(ApprovalMode.YOLO)
    })

    describe('YOLO mode', () => {
      let system: ApprovalSystem

      beforeEach(() => {
        system = new ApprovalSystem(ApprovalMode.YOLO)
      })

      it('should approve everything', () => {
        expect(system.needsApproval(readTool, {})).toBe(false)
        expect(system.needsApproval(writeTool, {})).toBe(false)
        expect(system.needsApproval(commandTool, {})).toBe(false)
      })
    })

    describe('AUTO_EDIT mode', () => {
      let system: ApprovalSystem

      beforeEach(() => {
        system = new ApprovalSystem(ApprovalMode.AUTO_EDIT)
      })

      it('should auto-approve read operations', () => {
        expect(system.needsApproval(readTool, {})).toBe(false)
      })

      it('should require approval for write operations', () => {
        expect(system.needsApproval(writeTool, {})).toBe(true)
      })

      it('should require approval for execution', () => {
        expect(system.needsApproval(commandTool, {})).toBe(true)
      })
    })

    describe('DEFAULT mode', () => {
      let system: ApprovalSystem

      beforeEach(() => {
        system = new ApprovalSystem(ApprovalMode.DEFAULT)
      })

      it('should auto-approve read operations', () => {
        expect(system.needsApproval(readTool, {})).toBe(false)
      })

      it('should require approval for write operations', () => {
        expect(system.needsApproval(writeTool, {})).toBe(true)
      })

      it('should require approval for execution', () => {
        expect(system.needsApproval(commandTool, {})).toBe(true)
      })
    })

    describe('STRICT mode', () => {
      let system: ApprovalSystem

      beforeEach(() => {
        system = new ApprovalSystem(ApprovalMode.STRICT)
      })

      it('should require approval for all non-read operations', () => {
        expect(system.needsApproval(readTool, {})).toBe(false)
        expect(system.needsApproval(writeTool, {})).toBe(true)
        expect(system.needsApproval(commandTool, {})).toBe(true)
      })
    })

    describe('requestApproval', () => {
      it('should return true for YOLO mode', async () => {
        const system = new ApprovalSystem(ApprovalMode.YOLO)
        const result = await system.requestApproval(writeTool, {})
        expect(result).toBe(true)
      })

      it('should return true for DEFAULT mode', async () => {
        const system = new ApprovalSystem(ApprovalMode.DEFAULT)
        const result = await system.requestApproval(writeTool, {})
        expect(result).toBe(true)
      })
    })
  })
})

