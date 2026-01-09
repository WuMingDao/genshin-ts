import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export function getDataDir(): string {
  const appData = process.env.APPDATA
  if (appData && appData.length) return path.join(appData, 'genshin-ts')
  // fallback (rare on Windows): ~/.config like style
  return path.join(os.homedir(), '.genshin-ts')
}

export function ensureDataDirs() {
  const dataDir = getDataDir()
  const backupsDir = path.join(dataDir, 'backups')
  fs.mkdirSync(backupsDir, { recursive: true })
  return { dataDir, backupsDir }
}

export function getStatePath(): string {
  return path.join(getDataDir(), 'state.json')
}
