import fs from 'node:fs/promises'
import path from 'node:path'
import { BACKUP_DIR } from '../constants'
import { copyFile, fileExists, listDirectory } from './file-utils'

export interface IBackupSystem {
  createBackup(filePath: string): Promise<string>
  restore(backupPath: string, targetPath: string): Promise<void>
  listBackups(filePath: string): Promise<string[]>
  cleanOldBackups(maxAge: number): Promise<void>
}

export class BackupSystem implements IBackupSystem {
  private workspaceRoot: string
  private backupDir: string

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot
    this.backupDir = path.join(workspaceRoot, BACKUP_DIR)
  }

  async createBackup(filePath: string): Promise<string> {
    if (!(await fileExists(filePath))) {
      throw new Error(`File not found: ${filePath}`)
    }

    await fs.mkdir(this.backupDir, { recursive: true })

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const relativePath = path.relative(this.workspaceRoot, filePath)
    const backupPath = path.join(
      this.backupDir,
      `${relativePath.replace(/\//g, '_')}_${timestamp}`
    )

    await copyFile(filePath, backupPath)

    return backupPath
  }

  async restore(backupPath: string, targetPath: string): Promise<void> {
    if (!(await fileExists(backupPath))) {
      throw new Error(`Backup not found: ${backupPath}`)
    }

    await copyFile(backupPath, targetPath)
  }

  async listBackups(filePath: string): Promise<string[]> {
    if (!(await fileExists(this.backupDir))) {
      return []
    }

    const relativePath = path.relative(this.workspaceRoot, filePath)
    const prefix = relativePath.replace(/\//g, '_')

    const { files } = await listDirectory(this.backupDir)
    return files.filter((f) => path.basename(f).startsWith(prefix))
  }

  async cleanOldBackups(maxAge: number): Promise<void> {
    if (!(await fileExists(this.backupDir))) {
      return
    }

    const now = Date.now()
    const { files } = await listDirectory(this.backupDir)

    for (const file of files) {
      const stats = await fs.stat(file)
      const age = now - stats.mtimeMs

      if (age > maxAge) {
        await fs.unlink(file)
      }
    }
  }
}

