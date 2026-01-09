import fs from 'node:fs'

import { getStatePath } from './data.js'

export type CliState = {
  lastBackupAtByMap?: Record<string, number>
  updateCheck?: { lastAt?: number; streak?: number }
  noticeCheck?: { lastAt?: number; streak?: number }
}

export function loadState(): CliState {
  const p = getStatePath()
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf8')) as unknown
    if (!raw || typeof raw !== 'object') return {}
    return raw as CliState
  } catch {
    return {}
  }
}

export function saveState(next: CliState) {
  const p = getStatePath()
  fs.writeFileSync(p, JSON.stringify(next, null, 2) + '\n', 'utf8')
}

export function getMapKey(playerId: number, mapId: number): string {
  return `${playerId}-${mapId}`
}
