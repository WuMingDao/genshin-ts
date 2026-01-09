import { spawn } from 'node:child_process'

export function openDir(p: string) {
  spawn('explorer.exe', [p], { stdio: 'ignore', detached: true })
}

export function openAndSelect(p: string) {
  spawn('explorer.exe', [`/select,${p}`], { stdio: 'ignore', detached: true })
}
