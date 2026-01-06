import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PRODUCT_NAME } from '../src/constants'
import { createEditTool } from '../src/tools/edit'
import { createGlobTool } from '../src/tools/glob'
import { createLSTool } from '../src/tools/ls'
import { createReadTool } from '../src/tools/read'
import { createWriteTool } from '../src/tools/write'
import { BackupSystem } from '../src/utils/backup'

describe('Tools', () => {
  let testDir: string
  let backupSystem: BackupSystem

  beforeEach(() => {
    testDir = join(tmpdir(), `cogent-test-${randomUUID()}`)
    mkdirSync(testDir, { recursive: true })
    backupSystem = new BackupSystem(join(testDir, '.backups'))
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('read_file', () => {
    it('should read file contents', async () => {
      const filePath = join(testDir, 'test.txt')
      writeFileSync(filePath, 'Hello, world!')

      const tool = createReadTool({ cwd: testDir, productName: PRODUCT_NAME })
      const result = await tool.execute({ file_path: 'test.txt' })

      expect(result.llmContent).toContain('Hello, world!')
    })

    it('should read file with line numbers', async () => {
      const filePath = join(testDir, 'multi-line.txt')
      writeFileSync(filePath, 'Line 1\nLine 2\nLine 3')

      const tool = createReadTool({ cwd: testDir, productName: PRODUCT_NAME })
      const result = await tool.execute({ file_path: 'multi-line.txt' })

      expect(result.llmContent).toContain('1')
      expect(result.llmContent).toContain('Line 1')
      expect(result.llmContent).toContain('Line 2')
    })

    it('should read file with offset and limit', async () => {
      const filePath = join(testDir, 'lines.txt')
      writeFileSync(filePath, 'A\nB\nC\nD\nE')

      const tool = createReadTool({ cwd: testDir, productName: PRODUCT_NAME })
      const result = await tool.execute({
        file_path: 'lines.txt',
        offset: 2,
        limit: 2,
      })

      expect(result.llmContent).toContain('B')
      expect(result.llmContent).toContain('C')
      expect(result.llmContent).not.toContain('D')
    })

    it('should handle non-existent files', async () => {
      const tool = createReadTool({ cwd: testDir, productName: PRODUCT_NAME })
      const result = await tool.execute({ file_path: 'non-existent.txt' })

      expect(result.llmContent).toContain('not found')
      expect(result.isError).toBe(true)
    })
  })

  describe('list_dir', () => {
    it('should list directory contents', async () => {
      writeFileSync(join(testDir, 'file1.txt'), 'content')
      writeFileSync(join(testDir, 'file2.js'), 'code')
      mkdirSync(join(testDir, 'subdir'))

      const tool = createLSTool({ cwd: testDir })
      const result = await tool.execute({ path: '.' })

      expect(result.llmContent).toContain('file1.txt')
      expect(result.llmContent).toContain('file2.js')
      expect(result.llmContent).toContain('subdir')
    })

    it('should list recursively', async () => {
      mkdirSync(join(testDir, 'dir1'))
      writeFileSync(join(testDir, 'dir1', 'nested.txt'), 'nested content')

      const tool = createLSTool({ cwd: testDir })
      const result = await tool.execute({ path: '.', recursive: true })

      expect(result.llmContent).toContain('dir1')
      expect(result.llmContent).toContain('nested.txt')
    })
  })

  describe('glob_search', () => {
    it('should find files by pattern', async () => {
      writeFileSync(join(testDir, 'test1.ts'), 'typescript')
      writeFileSync(join(testDir, 'test2.ts'), 'typescript')
      writeFileSync(join(testDir, 'other.js'), 'javascript')

      const tool = createGlobTool({ cwd: testDir })
      const result = await tool.execute({ pattern: '*.ts' })

      expect(result.llmContent).toContain('test1.ts')
      expect(result.llmContent).toContain('test2.ts')
      expect(result.llmContent).not.toContain('other.js')
    })

    it('should find nested files', async () => {
      mkdirSync(join(testDir, 'src'))
      writeFileSync(join(testDir, 'src', 'index.ts'), 'code')

      const tool = createGlobTool({ cwd: testDir })
      const result = await tool.execute({ pattern: '**/*.ts' })

      expect(result.llmContent).toContain('index.ts')
    })
  })

  describe('write_file', () => {
    it('should create new file', async () => {
      const tool = createWriteTool({ cwd: testDir, backupSystem })
      const result = await tool.execute({
        file_path: 'new-file.txt',
        content: 'New content',
      })

      expect(result.llmContent).toContain('Successfully')
      expect(existsSync(join(testDir, 'new-file.txt'))).toBe(true)
    })

    it('should overwrite existing file', async () => {
      const filePath = join(testDir, 'existing.txt')
      writeFileSync(filePath, 'Old content')

      const tool = createWriteTool({ cwd: testDir, backupSystem })
      await tool.execute({
        file_path: 'existing.txt',
        content: 'New content',
      })

      const content = readFileSync(filePath, 'utf-8')
      expect(content).toBe('New content')
    })

    it('should create nested directories', async () => {
      const tool = createWriteTool({ cwd: testDir, backupSystem })
      await tool.execute({
        file_path: 'nested/dir/file.txt',
        content: 'Nested content',
      })

      expect(existsSync(join(testDir, 'nested', 'dir', 'file.txt'))).toBe(true)
    })
  })

  describe('edit_file', () => {
    it('should replace text in file', async () => {
      const filePath = join(testDir, 'edit-test.txt')
      writeFileSync(filePath, 'Hello world\nGoodbye world')

      const tool = createEditTool({ cwd: testDir, backupSystem })
      const result = await tool.execute({
        file_path: 'edit-test.txt',
        old_string: 'Hello',
        new_string: 'Hi',
      })

      expect(result.llmContent).toContain('Successfully')

      const content = readFileSync(filePath, 'utf-8')
      expect(content).toContain('Hi world')
      expect(content).not.toContain('Hello world')
    })

    it('should replace all occurrences when replace_all is true', async () => {
      const filePath = join(testDir, 'replace-all.txt')
      writeFileSync(filePath, 'foo bar foo baz foo')

      const tool = createEditTool({ cwd: testDir, backupSystem })
      await tool.execute({
        file_path: 'replace-all.txt',
        old_string: 'foo',
        new_string: 'qux',
        replace_all: true,
      })

      const content = readFileSync(filePath, 'utf-8')
      expect(content).toBe('qux bar qux baz qux')
    })

    it('should fail if old_string not found', async () => {
      const filePath = join(testDir, 'no-match.txt')
      writeFileSync(filePath, 'Some content')

      const tool = createEditTool({ cwd: testDir, backupSystem })
      const result = await tool.execute({
        file_path: 'no-match.txt',
        old_string: 'nonexistent',
        new_string: 'replacement',
      })

      expect(result.llmContent).toContain('not found')
      expect(result.isError).toBe(true)
    })
  })
})
