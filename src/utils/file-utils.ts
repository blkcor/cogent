import fs from 'node:fs/promises'
import path from 'node:path'

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

export async function readFile(filePath: string): Promise<string> {
  return await fs.readFile(filePath, 'utf-8')
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(filePath, content, 'utf-8')
}

export async function listDirectory(
  dirPath: string,
  recursive = false
): Promise<{ files: string[]; directories: string[] }> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true })

  const files: string[] = []
  const directories: string[] = []

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      directories.push(fullPath)
      if (recursive) {
        const subResults = await listDirectory(fullPath, true)
        files.push(...subResults.files)
        directories.push(...subResults.directories)
      }
    } else if (entry.isFile()) {
      files.push(fullPath)
    }
  }

  return { files, directories }
}

export async function deleteFile(filePath: string): Promise<void> {
  await fs.unlink(filePath)
}

export async function copyFile(source: string, destination: string): Promise<void> {
  const dir = path.dirname(destination)
  await fs.mkdir(dir, { recursive: true })
  await fs.copyFile(source, destination)
}

export async function getFileStats(filePath: string) {
  return await fs.stat(filePath)
}

export function getRelativePath(from: string, to: string): string {
  return path.relative(from, to)
}

export function joinPaths(...paths: string[]): string {
  return path.join(...paths)
}

export function resolvePath(...paths: string[]): string {
  return path.resolve(...paths)
}

export function getFileExtension(filePath: string): string {
  return path.extname(filePath)
}

export function getFileName(filePath: string): string {
  return path.basename(filePath)
}

export function getDirName(filePath: string): string {
  return path.dirname(filePath)
}
